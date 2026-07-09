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

  useEffect(() => {
    fetch(`${API}/download/${jobId}/${stem}`, { headers: HEADERS })
      .then(r => r.blob()).then(blob => { setBlobUrl(URL.createObjectURL(blob)); setLoading(false) })
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
    return () => { a.removeEventListener('timeupdate', onTime); a.removeEventListener('loadedmetadata', onLoad); a.removeEventListener('ended', onEnd) }
  }, [blobUrl])

  const toggle = () => { const a = audioRef.current; if (!a) return; playing ? (a.pause(), setPlaying(false)) : (a.play(), setPlaying(true)) }
  const seek = (e: React.MouseEvent<HTMLDivElement>) => { const a = audioRef.current; if (!a) return; a.currentTime = ((e.clientX - e.currentTarget.getBoundingClientRect().left) / e.currentTarget.offsetWidth) * a.duration }
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`

  const download = async () => {
    const res = await fetch(`${API}/download/${jobId}/${stem}`, { headers: HEADERS })
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `${stem}.wav`; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ marginTop: 12 }}>
      {blobUrl && <audio ref={audioRef} src={blobUrl} preload="auto" />}
      {loading && <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 8 }}>Loading audio...</p>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 20, marginBottom: 8 }}>
        {Array.from({ length: 48 }).map((_, i) => (
          <div key={i} style={{ flex: 1, height: 4 + Math.abs(Math.sin(i * 0.8) * 12), background: i / 48 < progress ? color : 'var(--border)', borderRadius: 1, transition: 'background 0.1s' }} />
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={toggle} disabled={loading || !blobUrl} style={{
          width: 32, height: 32, borderRadius: '50%', border: 'none', flexShrink: 0,
          background: loading ? 'var(--surface2)' : color === '#16A34A' ? '#F0FDF4' : '#F5F3FF',
          color: loading ? 'var(--text3)' : color, cursor: loading ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 700
        }}>{playing ? 'II' : '>'}</button>
        <div onClick={seek} style={{ flex: 1, height: 3, background: 'var(--border)', borderRadius: 2, cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${progress * 100}%`, background: color, borderRadius: 2 }} />
        </div>
        <span style={{ fontSize: 11, color: 'var(--text3)', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>{fmt(duration * progress)} / {fmt(duration)}</span>
        <button onClick={download} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', fontSize: 11, color: 'var(--text2)', cursor: 'pointer', flexShrink: 0 }}>WAV</button>
      </div>
    </div>
  )
}

function VideoPlayer({ jobId, stem, filename }: { jobId: string, stem: string, filename: string }) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API}/download/${jobId}/${stem}`, { headers: HEADERS })
      .then(r => r.blob()).then(blob => { setBlobUrl(URL.createObjectURL(blob)); setLoading(false) })
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
    <div style={{ marginTop: 12 }}>
      {loading && <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 8 }}>Loading video...</p>}
      {blobUrl && <video src={blobUrl} controls style={{ width: '100%', borderRadius: 8, background: '#000', maxHeight: 200, display: 'block', marginBottom: 8 }} />}
      <button onClick={download} style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', fontSize: 12, color: 'var(--text2)', cursor: 'pointer' }}>
        Download MP4
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
      .then(data => { setIsVideo(data.is_video || false); setOutputFormat(data.is_video ? 'both' : 'audio'); setVerified(true) })
      .catch(() => setError('Results not ready or job not found.'))
  }, [jobId])

  if (error) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Results not found</h2>
        <p style={{ color: 'var(--text2)', marginBottom: 20, fontSize: 14 }}>{error}</p>
        <button onClick={() => router.push('/')} style={{ padding: '10px 24px', borderRadius: 8, fontSize: 13, background: 'var(--accent)', border: 'none', color: 'white', cursor: 'pointer' }}>Try again</button>
      </div>
    </div>
  )

  if (!verified) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'var(--text3)' }}>Loading results...</p>
    </div>
  )

  const audioStems = [
    { label: 'Vocals', desc: 'Isolated vocal track', color: '#16A34A', stem: 'vocals' },
    { label: 'Instrumental', desc: 'Backing track, no vocals', color: '#7C3AED', stem: 'no_vocals' },
  ]
  const videoStems = [
    { label: 'Vocals video', desc: 'Video with isolated vocals', color: '#16A34A', stem: 'vocals_video', filename: 'vocals_video.mp4' },
    { label: 'Instrumental video', desc: 'Video with vocals removed', color: '#7C3AED', stem: 'no_vocals_video', filename: 'instrumental_video.mp4' },
  ]

  const showAudio = outputFormat === 'audio' || outputFormat === 'both'
  const showVideo = isVideo && (outputFormat === 'video' || outputFormat === 'both')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '96px 20px 60px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%', margin: '0 auto 14px',
            background: '#F0FDF4', border: '1px solid #BBF7D0',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, color: '#16A34A', letterSpacing: '0.05em'
          }}>DONE</div>
          <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.03em', marginBottom: 6 }}>Processing complete</h1>
          <p style={{ color: 'var(--text2)', fontSize: 14 }}>
            {isVideo ? 'Choose your output format.' : 'Preview and download your stems.'}
          </p>
        </div>

        {/* Format selector */}
        {isVideo && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, marginBottom: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Output format</p>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['audio', 'video', 'both'] as OutputFormat[]).map(opt => (
                <button key={opt} onClick={() => setOutputFormat(opt)} style={{
                  flex: 1, padding: '8px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 500,
                  background: outputFormat === opt ? 'var(--accent)' : 'transparent',
                  border: `1px solid ${outputFormat === opt ? 'var(--accent)' : 'var(--border)'}`,
                  color: outputFormat === opt ? 'white' : 'var(--text2)',
                  transition: 'all 0.15s ease'
                }}>
                  {opt.charAt(0).toUpperCase() + opt.slice(1)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Audio stems */}
        {showAudio && (
          <div style={{ marginBottom: 20 }}>
            {isVideo && <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Audio stems</p>}
            {audioStems.map(track => (
              <div key={track.stem} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                    background: track.color === '#16A34A' ? '#F0FDF4' : '#F5F3FF',
                    border: `1px solid ${track.color === '#16A34A' ? '#BBF7D0' : '#DDD6FE'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9, fontWeight: 700, color: track.color, letterSpacing: '0.05em'
                  }}>WAV</div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', marginBottom: 1 }}>{track.label}</p>
                    <p style={{ fontSize: 12, color: 'var(--text3)' }}>{track.desc}</p>
                  </div>
                </div>
                <AudioPlayer jobId={jobId!} stem={track.stem} color={track.color} />
              </div>
            ))}
          </div>
        )}

        {/* Video stems */}
        {showVideo && (
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Video stems</p>
            {videoStems.map(track => (
              <div key={track.stem} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                    background: track.color === '#16A34A' ? '#F0FDF4' : '#F5F3FF',
                    border: `1px solid ${track.color === '#16A34A' ? '#BBF7D0' : '#DDD6FE'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9, fontWeight: 700, color: track.color, letterSpacing: '0.05em'
                  }}>MP4</div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', marginBottom: 1 }}>{track.label}</p>
                    <p style={{ fontSize: 12, color: 'var(--text3)' }}>{track.desc}</p>
                  </div>
                </div>
                <VideoPlayer jobId={jobId!} stem={track.stem} filename={track.filename} />
              </div>
            ))}
          </div>
        )}

        {/* Job ID */}
        <div style={{ padding: '10px 14px', borderRadius: 8, marginBottom: 20, background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--text3)' }}>Job ID</span>
          <code style={{ fontSize: 11, color: 'var(--text2)', fontFamily: 'monospace' }}>{jobId?.slice(0, 16)}...</code>
        </div>

        <button onClick={() => router.push('/')} style={{ width: '100%', padding: '12px', borderRadius: 10, fontSize: 14, fontWeight: 500, background: 'var(--accent)', border: 'none', color: 'white', cursor: 'pointer' }}>
          Process another track
        </button>
      </div>
    </div>
  )
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ color: 'var(--text3)' }}>Loading...</p></div>}>
      <ResultsContent />
    </Suspense>
  )
}