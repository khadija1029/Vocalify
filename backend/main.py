import os
import uuid
import subprocess
import shutil
import threading
from fastapi import FastAPI, UploadFile, File, HTTPException, Request
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

@app.middleware("http")
async def add_ngrok_header(request: Request, call_next):
    response = await call_next(request)
    response.headers["ngrok-skip-browser-warning"] = "true"
    return response

UPLOAD_DIR = "uploads"
RESULTS_DIR = "results"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(RESULTS_DIR, exist_ok=True)

jobs = {}
# Track how many stems have been downloaded per job
download_counts = {}

ALLOWED_AUDIO = ["audio/mpeg", "audio/wav", "audio/mp3"]
ALLOWED_VIDEO = ["video/mp4", "video/quicktime", "video/x-msvideo", "video/webm"]
ALLOWED_ALL = ALLOWED_AUDIO + ALLOWED_VIDEO

def cleanup_job(job_id: str):
    """Delete all files related to a job"""
    try:
        for f in os.listdir(UPLOAD_DIR):
            if f.startswith(job_id):
                os.remove(os.path.join(UPLOAD_DIR, f))
        result_path = os.path.join(RESULTS_DIR, job_id)
        if os.path.exists(result_path):
            shutil.rmtree(result_path)
        if job_id in jobs:
            del jobs[job_id]
        if job_id in download_counts:
            del download_counts[job_id]
        print(f"Cleaned up job {job_id[:8]}")
    except Exception as e:
        print(f"Cleanup error: {e}")

def delayed_cleanup(job_id: str, delay_seconds: int = 300):
    """Clean up job files after a delay (default 5 minutes)"""
    def run():
        import time
        time.sleep(delay_seconds)
        cleanup_job(job_id)
    t = threading.Thread(target=run, daemon=True)
    t.start()

@app.get("/")
def root():
    return {"message": "Vocalify API is running"}

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    if file.content_type not in ALLOWED_ALL and not (
        file.filename and file.filename.lower().endswith(('.mp3', '.wav', '.mp4', '.mov', '.avi', '.webm'))
    ):
        raise HTTPException(400, "Unsupported format. Use MP3, WAV, MP4, MOV, AVI or WEBM.")

    is_video = file.content_type in ALLOWED_VIDEO or (
        file.filename and file.filename.lower().endswith(('.mp4', '.mov', '.avi', '.webm'))
    )

    job_id = str(uuid.uuid4())
    ext = file.filename.split(".")[-1] if file.filename else "mp3"
    input_path = f"{UPLOAD_DIR}/{job_id}.{ext}"

    with open(input_path, "wb") as f:
        f.write(await file.read())

    jobs[job_id] = {"status": "processing", "progress": 20, "is_video": is_video}
    download_counts[job_id] = 0

    demucs_path = r"D:\vocalify\ai-engine\venv\Scripts\demucs.exe"
    output_dir = f"{RESULTS_DIR}/{job_id}"

    audio_input = input_path
    if is_video:
        audio_input = f"{UPLOAD_DIR}/{job_id}_audio.wav"
        extract = subprocess.run([
            "ffmpeg", "-i", input_path, "-vn", "-acodec", "pcm_s16le", audio_input
        ], capture_output=True, text=True)
        if extract.returncode != 0:
            jobs[job_id]["status"] = "failed"
            cleanup_job(job_id)
            raise HTTPException(500, f"Could not extract audio from video.")

    jobs[job_id]["progress"] = 40

    result = subprocess.run([
        demucs_path, "--two-stems=vocals", "--out", output_dir, audio_input
    ], capture_output=True, text=True)

    if result.returncode != 0:
        jobs[job_id]["status"] = "failed"
        cleanup_job(job_id)
        raise HTTPException(500, f"Demucs failed.")

    jobs[job_id]["progress"] = 80

    if is_video:
        base = f"{output_dir}/htdemucs"
        folders = os.listdir(base)
        track_folder = f"{base}/{folders[0]}"

        vocals_wav = f"{track_folder}/vocals.wav"
        no_vocals_wav = f"{track_folder}/no_vocals.wav"
        vocals_video = f"{output_dir}/vocals_video.mp4"
        no_vocals_video = f"{output_dir}/no_vocals_video.mp4"

        subprocess.run([
            "ffmpeg", "-i", input_path, "-i", vocals_wav,
            "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-shortest", vocals_video
        ], capture_output=True)

        subprocess.run([
            "ffmpeg", "-i", input_path, "-i", no_vocals_wav,
            "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-shortest", no_vocals_video
        ], capture_output=True)

    jobs[job_id]["status"] = "done"
    jobs[job_id]["progress"] = 100

    # Auto-delete files after 5 minutes
    delayed_cleanup(job_id, delay_seconds=300)

    return {"job_id": job_id}


@app.get("/job/{job_id}")
def get_job_status(job_id: str):
    if job_id not in jobs:
        raise HTTPException(404, "Job not found")
    return jobs[job_id]


@app.get("/job/{job_id}/result")
def get_results(job_id: str):
    if job_id not in jobs:
        raise HTTPException(404, "Job not found")
    if jobs[job_id]["status"] != "done":
        raise HTTPException(400, "Job not finished yet")
    is_video = jobs[job_id].get("is_video", False)
    return {
        "vocals_url": f"/download/{job_id}/vocals",
        "instrumental_url": f"/download/{job_id}/no_vocals",
        "is_video": is_video
    }


@app.get("/download/{job_id}/{stem}")
def download_file(job_id: str, stem: str):
    if job_id not in jobs:
        raise HTTPException(404, "Job not found")

    base = f"{RESULTS_DIR}/{job_id}"

    if stem == "vocals_video":
        file_path = f"{base}/vocals_video.mp4"
        media_type = "video/mp4"
        filename = "vocals_video.mp4"
    elif stem == "no_vocals_video":
        file_path = f"{base}/no_vocals_video.mp4"
        media_type = "video/mp4"
        filename = "instrumental_video.mp4"
    elif stem in ["vocals", "no_vocals"]:
        htdemucs = f"{base}/htdemucs"
        folders = os.listdir(htdemucs)
        track_folder = f"{htdemucs}/{folders[0]}"
        file_path = f"{track_folder}/{stem}.wav"
        media_type = "audio/wav"
        filename = f"{stem}.wav"
    else:
        raise HTTPException(400, "Invalid stem name")

    if not os.path.exists(file_path):
        raise HTTPException(404, "Output file not found")

    return FileResponse(file_path, media_type=media_type, filename=filename)


@app.on_event("startup")
async def startup_cleanup():
    """Clean up any leftover files from previous sessions"""
    try:
        for folder in [UPLOAD_DIR, RESULTS_DIR]:
            if os.path.exists(folder):
                shutil.rmtree(folder)
                os.makedirs(folder)
        print("Cleaned up leftover files from previous session")
    except Exception as e:
        print(f"Startup cleanup error: {e}")