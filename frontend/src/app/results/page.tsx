'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'
const HEADERS = { 'ngrok-skip-browser-warning': 'true' }

type OutputFormat = 'audio' | 'video' | 'both'

function AudioPlayer({ jobId, stem, color }: { jobId: string, stem: string, color: string }) {
  const [playing, setPlaying] = useState(false)
  const [progress, setProg] = useState(0)
  const [duration, setDur] = useState(0)
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const audioRef = useRef<HTMLAudioElement>(null)

  // Fetch audio as blob to bypass ngrok header requirement
  useEffect(() => {
    const fetchAudio = async () => {
      try {
        const res = await fetch(`${API}/download/${jobId}/${stem}`, { headers: HEADERS })
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        setBlobUrl(url)
        setLoading(false)
      } catch {
        setLoading(false)
      }
    }
    fetchAudio()
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl)
    }
  }, [jobId, stem])

  useEffect(() => {
    const a = audioRef.current
    if (!a || !blobUrl) return
    const onTime = () => setProg(a.currentTime / (a.duration || 1))
    const onLoad = () => setDur(a.duration)
    const onEnd = () => { setPlaying(false); setProg(0) }
    a.addEventListener('timeupdate', onTime)
    a.addEventListener('loadedmetadata', onLoad)
    a.addEventListener('ended', onEnd)
    return () => {
      a.removeEventListener('timeupdate', onTime)
      a.removeEventListener('loadedmetadata', onLoad)
      a.removeEventListener('ended', onEnd)
    }
  }, [blobUrl])

  const toggle = () => {
    const a = audioRef.current
    if (!a) return
    if (playing) { a.pause(); setPlaying(false) }
    else { a.play(); setPlaying(true) }
  }

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const a = audioRef.current
    if (!a) return
    const rect = e.currentTarget.getBoundingClientRect()
    a.currentTime = ((e.clientX - rect.left) / rect.width) * a.duration
  }

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`

  const handleDownload = async () => {
    try {
      const res = await fetch(`${API}/download/${jobId}/${stem}`, { headers: HEADERS })
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${stem}.wav`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert('Download failed. Make sure backend is running.')
    }
  }

  return (
    <div style={{ marginTop: 14 }}>
      {blobUrl && <audio ref={audioRef} src={blobUrl} preload="auto" />}
      {loading && (
        <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 10 }}>Loading audio...</p>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 24, marginBottom: 10 }}>
        {Array.from({ length: 40 }).map((_, i) => (          <div key={i} style={{
            flex: 1, height: 6 + Math.abs(Math.sin(i * 0.8) * 14),
            background: i / 40 < progress ? color : 'var(--border)',
            borderRadius: 2, transition: 'background 0.1s'
          }} />        ))}      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={toggle} disabled={loading || !blobUrl} style={{
          width: 36, height: 36, borderRadius: '50%', border: 'none',
          background: loading ? 'var(--border)' : color,
          color: 'white', fontSize: 13, cursor: loading ? 'not-allowed' : 'pointer',
          flexShrink: 0, fontWeight: 700
        }}>{playing ? 'II' : '>'}</button>
        <div onClick={seek} style={{
          flex: 1, height: 4, background: 'var(--border)', borderRadius: 2,
          cursor: 'pointer', position: 'relative', overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${progress * 100}%`, background: color, borderRadius: 2 }} />
        </div>
        <span style={{ fontSize: 12, color: 'var(--muted)', flexShrink: 0 }}>
          {fmt(duration * progress)} / {fmt(duration)}
        </span>
      </div>
      {/* Download button uses blob fetch */}
      <button onClick={handleDownload} style={{
        marginTop: 10, width: '100%', padding: '8px', borderRadius: 8, fontSize: 13,
        background: `${color}15`, border: `1px solid ${color}35`,
        color: color, cursor: 'pointer', fontWeight: 600
      }}>
        Download WAV
      </button>
    </div>
  )}

function VideoPlayer({ jobId, stem, color, filename }: { jobId: string, stem: string, color: string, filename: string }) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        const res = await fetch(`${API}/download/${jobId}/${stem}`, { headers: HEADERS })
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        setBlobUrl(url)
        setLoading(false)
      } catch {
        setLoading(false)
      }
    }
    fetchVideo()
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl)
    }
  }, [jobId, stem])

  const handleDownload = async () => {
    try {
      const res = await fetch(`${API}/download/${jobId}/${stem}`, { headers: HEADERS })
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert('Download failed.')
    }
  }

  return (
    <div style={{ marginTop: 14 }}>
      {loading && <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 10 }}>Loading video...</p>}
      {blobUrl && (
        <video src={blobUrl} controls style={{
          width: '100%', borderRadius: 10,
          border: `1px solid ${color}30`, background: '#000', maxHeight: 220
        }} />
      )}
      <button onClick={handleDownload} style={{
        marginTop: 10, width: '100%', padding: '8px', borderRadius: 8, fontSize: 13,
        background: `${color}15`, border: `1px solid ${color}35`,
        color: color, cursor: 'pointer', fontWeight: 600
      }}>
        Download MP4
      </button>
    </div>
  )}

function ResultsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const jobId = searchParams.get('job_id')
  const [isVideo, setIsVideo] = useState(false)
  const [verified, setVerified] = useState(false)
  const [error, setError] = useState('')
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('audio')

  useEffect(() => {
    if (!jobId) { setError('No job ID.'); return }
    fetch(`${API}/job/${jobId}/result`, { headers: HEADERS })
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(data => {
        const video = data.is_video || false
        setIsVideo(video)
        setOutputFormat(video ? 'both' : 'audio')
        setVerified(true)
      })
      .catch(() => setError('Results not ready or job not found.'))
  }, [jobId])

  if (error) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '100px 24px' }}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 24, marginBottom: 12 }}>Results not found</h2>
        <p style={{ color: 'var(--muted)', marginBottom: 24 }}>{error}</p>
        <button className="btn-primary" onClick={() => router.push('/')} style={{ padding: '12px 28px', borderRadius: 10, fontSize: 15 }}>Try again</button>
      </div>
    </div>
  )

  if (!verified) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'var(--muted)' }}>Loading results...</p>
    </div>
  )

  const audioStems = [
    { label: 'Vocals', desc: 'Isolated vocal track', color: '#22D3A0', stem: 'vocals', filename: 'vocals.wav' },
    { label: 'Instrumental', desc: 'Backing track, no vocals', color: '#A78BFA', stem: 'no_vocals', filename: 'instrumental.wav' },
  ]

  const videoStems = [
    { label: 'Vocals Video', desc: 'Video with only vocals audio', color: '#22D3A0', stem: 'vocals_video', filename: 'vocals_video.mp4' },
    { label: 'Instrumental Video', desc: 'Video with vocals removed', color: '#A78BFA', stem: 'no_vocals_video', filename: 'instrumental_video.mp4' },
  ]

  const showAudio = outputFormat === 'audio' || outputFormat === 'both'
  const showVideo = isVideo && (outputFormat === 'video' || outputFormat === 'both')

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      <Navbar />
      <div style={{
        position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)',
        width: 500, height: 500,
        background: 'radial-gradient(circle, rgba(34,211,160,0.07) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0
      }} />

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '110px 24px 80px', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 68, height: 68, borderRadius: '50%',
            background: 'rgba(34,211,160,0.12)', border: '1px solid rgba(34,211,160,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 800, color: '#22D3A0', margin: '0 auto 18px'
          }}>DONE</div>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 32, fontWeight: 800, letterSpacing: '-1px', marginBottom: 8 }}>
            Processing complete
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 15 }}>
            {isVideo ? 'Choose your output format below.' : 'Preview and download your stems.'}
          </p>
        </div>

        {isVideo && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20, marginBottom: 28 }}>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>
              Choose output format
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {([
                { key: 'audio' as OutputFormat, label: 'Audio only', desc: 'WAV files' },
                { key: 'video' as OutputFormat, label: 'Video only', desc: 'MP4 files' },
                { key: 'both' as OutputFormat, label: 'Both', desc: 'Audio + Video' },
              ]).map(opt => (
                <button key={opt.key} onClick={() => setOutputFormat(opt.key)} style={{
                  flex: 1, minWidth: 90, padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                  background: outputFormat === opt.key ? 'rgba(108,99,255,0.15)' : 'transparent',
                  border: `1px solid ${outputFormat === opt.key ? 'rgba(108,99,255,0.5)' : 'var(--border)'}`,
                  color: outputFormat === opt.key ? 'var(--accent2)' : 'var(--muted)',
                  transition: 'all 0.2s ease', textAlign: 'center'
                }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>{opt.label}</div>
                  <div style={{ fontSize: 11, opacity: 0.7 }}>{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {showAudio && (
          <div style={{ marginBottom: 28 }}>
            {isVideo && (
              <p style={{ fontSize: 12, color: 'var(--accent2)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600, marginBottom: 14 }}>
                Audio stems (WAV)
              </p>
            )}
            {audioStems.map(track => (
              <div key={track.stem} className="card" style={{ padding: 24, marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: 11,
                    background: `${track.color}15`, border: `1px solid ${track.color}35`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 800, color: track.color, flexShrink: 0
                  }}>WAV</div>
                  <div>
                    <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700 }}>{track.label}</h3>
                    <p style={{ color: 'var(--muted)', fontSize: 12 }}>{track.desc}</p>
                  </div>
                </div>
                <AudioPlayer jobId={jobId!} stem={track.stem} color={track.color} />
              </div>
            ))}
          </div>
        )}

        {showVideo && (
          <div style={{ marginBottom: 28 }}>
            <p style={{ fontSize: 12, color: 'var(--accent2)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600, marginBottom: 14 }}>
              Video stems (MP4)
            </p>
            {videoStems.map(track => (
              <div key={track.stem} className="card" style={{ padding: 24, marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: 11,
                    background: `${track.color}15`, border: `1px solid ${track.color}35`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 800, color: track.color, flexShrink: 0
                  }}>MP4</div>
                  <div>
                    <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700 }}>{track.label}</h3>
                    <p style={{ color: 'var(--muted)', fontSize: 12 }}>{track.desc}</p>
                  </div>
                </div>
                <VideoPlayer jobId={jobId!} stem={track.stem} color={track.color} filename={track.filename} />
              </div>
            ))}
          </div>
        )}

        <div style={{ padding: '12px 18px', borderRadius: 10, marginBottom: 28, background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'var(--muted)', fontSize: 12 }}>Job ID</span>
          <code style={{ fontSize: 11, color: 'var(--accent2)', fontFamily: 'monospace' }}>{jobId}</code>
        </div>

        <div style={{ textAlign: 'center' }}>
          <button className="btn-primary" onClick={() => router.push('/')} style={{ padding: '14px 36px', borderRadius: 12, fontSize: 15 }}>
            Process another track
          </button>
        </div>
      </div>
    </div>
  )}

export default function ResultsPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--muted)' }}>Loading...</p>
      </div>
    }>
      <ResultsContent />
    </Suspense>
  )}