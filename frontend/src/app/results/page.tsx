'use client'
import { useEffect, useState, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'
const HEADERS = { 'ngrok-skip-browser-warning': 'true' }
type OutputFormat = 'audio' | 'video' | 'both'

const DownloadIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
)

function AudioPlayer({ jobId, stem, color }: { jobId: string, stem: string, color: string }) {
  const [playing, setPlaying] = useState(false)
  const [progress, setProg] = useState(0)
  const [duration, setDur] = useState(0)
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    fetch(`${API}/download/${jobId}/${stem}`, { headers: HEADERS })
      .then(r => r.blob())
      .then(blob => { setBlobUrl(URL.createObjectURL(blob)); setLoading(false) })
      .catch(() => setLoading(false))
    return () => { if (blobUrl) URL.revokeObjectURL(blobUrl) }
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

  const download = async () => {
    const res = await fetch(`${API}/download/${jobId}/${stem}`, { headers: HEADERS })
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `${stem}.wav`; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ marginTop: 14 }}>
      {blobUrl && <audio ref={audioRef} src={blobUrl} preload="auto" />}
      {loading && <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>Loading audio...</p>}

      {/* Waveform bars */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 24, marginBottom: 10 }}>
        {Array.from({ length: 48 }).map((_, i) => (
          <div key={i} style={{
            flex: 1,
            height: 4 + Math.abs(Math.sin(i * 0.8) * 14),
            background: i / 48 < progress ? color : 'var(--border)',
            borderRadius: 1,
            transition: 'background 0.1s'
          }} />
        ))}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Play button */}
        <button onClick={toggle} disabled={loading || !blobUrl} style={{
          width: 34, height: 34, borderRadius: '50%', border: 'none', flexShrink: 0,
          background: loading ? 'var(--surface2)' : `${color}20`,
          color: loading ? 'var(--muted)' : color,
          cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: 12, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          {playing ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          )}
        </button>

        {/* Seek bar */}
        <div onClick={seek} style={{
          flex: 1, height: 3, background: 'var(--border)', borderRadius: 2,
          cursor: 'pointer', position: 'relative', overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${progress * 100}%`, background: color, borderRadius: 2 }} />
        </div>

        {/* Time */}
        <span style={{ fontSize: 11, color: 'var(--muted)', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
          {fmt(duration * progress)} / {fmt(duration)}
        </span>

        {/* Download button */}
        <button onClick={download} style={{
          padding: '5px 11px', borderRadius: 6,
          border: '1px solid var(--border)',
          background: 'transparent', cursor: 'pointer', flexShrink: 0,
          display: 'flex', alignItems: 'center', gap: 5,
          fontSize: 11, fontWeight: 600, color: 'var(--text)',
          transition: 'all 0.15s ease'
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.color = color }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text)' }}
        >
          <DownloadIcon /> WAV
        </button>
      </div>
    </div>
  )
}

function VideoPlayer({ jobId, stem, filename }: { jobId: string, stem: string, filename: string }) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API}/download/${jobId}/${stem}`, { headers: HEADERS })
      .then(r => r.blob())
      .then(blob => { setBlobUrl(URL.createObjectURL(blob)); setLoading(false) })
      .catch(() => setLoading(false))
    return () => { if (blobUrl) URL.revokeObjectURL(blobUrl) }
  }, [jobId, stem])

  const download = async () => {
    const res = await fetch(`${API}/download/${jobId}/${stem}`, { headers: HEADERS })
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ marginTop: 14 }}>
      {loading && <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>Loading video...</p>}
      {blobUrl && (
        <video src={blobUrl} controls style={{
          width: '100%', borderRadius: 10,
          background: '#000', maxHeight: 200,
          display: 'block', marginBottom: 10
        }} />
      )}
      <button onClick={download} style={{
        padding: '7px 14px', borderRadius: 8,
        border: '1px solid var(--border)',
        background: 'transparent', fontSize: 12,
        color: 'var(--text)', cursor: 'pointer', fontWeight: 600,
        display: 'flex', alignItems: 'center', gap: 6,
        transition: 'all 0.15s ease'
      }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = '#A78BB7'; e.currentTarget.style.color = '#A78BB7' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text)' }}
      >
        <DownloadIcon /> MP4
      </button>
    </div>
  )
}

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
        setIsVideo(data.is_video || false)
        setOutputFormat(data.is_video ? 'both' : 'audio')
        setVerified(true)
      })
      .catch(() => setError('Results not ready or job not found.'))
  }, [jobId])

  if (error) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Results not found</h2>
        <p style={{ color: 'var(--muted)', marginBottom: 20, fontSize: 14 }}>{error}</p>
        <button onClick={() => router.push('/')} className="btn-primary" style={{ padding: '10px 24px', borderRadius: 8, fontSize: 13 }}>Try again</button>
      </div>
    </div>
  )

  if (!verified) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'var(--muted)' }}>Loading results...</p>
    </div>
  )

  const audioStems = [
    { label: 'Vocals', desc: 'Isolated vocal track', color: '#7FBDB5', stem: 'vocals' },
    { label: 'Instrumental', desc: 'Backing track, no vocals', color: '#A78BB7', stem: 'no_vocals' },
  ]
  const videoStems = [
    { label: 'Vocals video', desc: 'Video with isolated vocals', color: '#7FBDB5', stem: 'vocals_video', filename: 'vocals_video.mp4' },
    { label: 'Instrumental video', desc: 'Video with vocals removed', color: '#A78BB7', stem: 'no_vocals_video', filename: 'instrumental_video.mp4' },
  ]

  const showAudio = outputFormat === 'audio' || outputFormat === 'both'
  const showVideo = isVideo && (outputFormat === 'video' || outputFormat === 'both')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', position: 'relative' }} className="noise">
      <Navbar />

      <div style={{
        position: 'fixed', top: '10%', left: '50%', transform: 'translateX(-50%)',
        width: 600, height: 400, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(ellipse, rgba(127,189,181,0.05) 0%, transparent 70%)'
      }} />

      <div style={{ maxWidth: 580, margin: '0 auto', padding: '96px 20px 60px', position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%', margin: '0 auto 14px',
            background: 'rgba(127,189,181,0.1)', border: '1px solid rgba(127,189,181,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7FBDB5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 6, color: 'var(--text)' }}>
            Processing complete
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>
            {isVideo ? 'Choose your output format below.' : 'Preview and download your stems.'}
          </p>
        </div>

        {/* Format selector for video */}
        {isVideo && (
          <div className="card" style={{ padding: 16, marginBottom: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
              Output format
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['audio', 'video', 'both'] as OutputFormat[]).map(opt => (
                <button key={opt} onClick={() => setOutputFormat(opt)} style={{
                  flex: 1, padding: '9px', borderRadius: 9, cursor: 'pointer',
                  fontSize: 13, fontWeight: 600,
                  background: outputFormat === opt ? 'rgba(127,189,181,0.12)' : 'transparent',
                  border: `1px solid ${outputFormat === opt ? 'rgba(127,189,181,0.4)' : 'var(--border)'}`,
                  color: outputFormat === opt ? '#7FBDB5' : 'var(--muted)',
                  transition: 'all 0.15s ease',
                  fontFamily: 'Syne, sans-serif'
                }}>
                  {opt.charAt(0).toUpperCase() + opt.slice(1)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Audio stems */}
        {showAudio && (
          <div style={{ marginBottom: 16 }}>
            {isVideo && (
              <p style={{ fontSize: 11, fontWeight: 600, color: '#7FBDB5', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
                Audio stems
              </p>
            )}
            {audioStems.map(track => (
              <div key={track.stem} className="card" style={{ padding: '18px', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 9, flexShrink: 0,
                    background: `${track.color}12`, border: `1px solid ${track.color}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9, fontWeight: 800, color: track.color, letterSpacing: '0.05em'
                  }}>WAV</div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 1, fontFamily: 'Syne, sans-serif' }}>{track.label}</p>
                    <p style={{ fontSize: 12, color: 'var(--muted)' }}>{track.desc}</p>
                  </div>
                </div>
                <AudioPlayer jobId={jobId!} stem={track.stem} color={track.color} />
              </div>
            ))}
          </div>
        )}

        {/* Video stems */}
        {showVideo && (
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#F6D69B', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
              Video stems
            </p>
            {videoStems.map(track => (
              <div key={track.stem} className="card" style={{ padding: '18px', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 9, flexShrink: 0,
                    background: `${track.color}12`, border: `1px solid ${track.color}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9, fontWeight: 800, color: track.color, letterSpacing: '0.05em'
                  }}>MP4</div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 1, fontFamily: 'Syne, sans-serif' }}>{track.label}</p>
                    <p style={{ fontSize: 12, color: 'var(--muted)' }}>{track.desc}</p>
                  </div>
                </div>
                <VideoPlayer jobId={jobId!} stem={track.stem} filename={track.filename} />
              </div>
            ))}
          </div>
        )}

        {/* Job ID */}
        <div style={{
          padding: '10px 16px', borderRadius: 10, marginBottom: 16,
          background: 'var(--surface)', border: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>Job ID</span>
          <code style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'monospace' }}>{jobId?.slice(0, 18)}...</code>
        </div>

        {/* Process another */}
        <button onClick={() => router.push('/')} className="btn-primary" style={{
          width: '100%', padding: '13px', borderRadius: 12, fontSize: 14
        }}>
          Process another track
        </button>
      </div>
    </div>
  )
}

export default function ResultsPage() {
  return (
    <Suspense fallback={
  <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <p style={{ color: '#1aa895' }}>Loading...</p>
  </div>
}>
      <ResultsContent />
    </Suspense>
  )
}