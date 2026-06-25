'use client'
import { useEffect, useState, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'

interface Track {
  label: string
  desc: string
  color: string
  icon: string
  stem: string
}

const audioTracks: Track[] = [
  { label: 'Vocals', desc: 'Isolated vocal track', color: '#22D3A0', icon: '🎙', stem: 'vocals' },
  { label: 'Instrumental', desc: 'Full backing track — no vocals', color: '#A78BFA', icon: '🎛', stem: 'no_vocals' },
]

const videoTracks: Track[] = [
  { label: 'Vocals Video', desc: 'Original video with only vocals', color: '#22D3A0', icon: '🎬', stem: 'vocals' },
  { label: 'Instrumental Video', desc: 'Original video with vocals removed', color: '#A78BFA', icon: '🎥', stem: 'no_vocals' },
]

function AudioPlayer({ jobId, stem, color }: { jobId: string; stem: string; color: string }) {
  const [playing, setPlaying] = useState(false)
  const [progress, setProg] = useState(0)
  const [duration, setDur] = useState(0)
  const audioRef = useRef<HTMLAudioElement>(null)
  const src = `http://127.0.0.1:8000/download/${jobId}/${stem}`

  useEffect(() => {
    const a = audioRef.current
    if (!a) return
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
  }, [])

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

  return (
    <div style={{ marginTop: 16 }}>
      <audio ref={audioRef} src={src} preload="metadata" />
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 28, marginBottom: 10 }}>
        {Array.from({ length: 40 }).map((_, i) => {
          const h = 6 + Math.abs(Math.sin(i * 0.8) * 16)
          return (
            <div key={i} style={{
              flex: 1, height: h,
              background: i / 40 < progress ? color : 'var(--border)',
              borderRadius: 2, transition: 'background 0.1s'
            }} />
          )
        })}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={toggle} style={{
          width: 38, height: 38, borderRadius: '50%', border: 'none',
          background: color, color: 'white', fontSize: 14, cursor: 'pointer', flexShrink: 0
        }}>{playing ? '⏸' : '▶'}</button>
        <div onClick={seek} style={{
          flex: 1, height: 4, background: 'var(--border)', borderRadius: 2,
          cursor: 'pointer', position: 'relative', overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute', left: 0, top: 0, bottom: 0,
            width: `${progress * 100}%`, background: color, borderRadius: 2
          }} />
        </div>
        <span style={{ fontSize: 12, color: 'var(--muted)', flexShrink: 0 }}>
          {fmt(duration * progress)} / {fmt(duration)}
        </span>
      </div>
    </div>
  )
}

function VideoPlayer({ jobId, stem, color }: { jobId: string; stem: string; color: string }) {
  const src = `http://127.0.0.1:8000/download/${jobId}/${stem}`
  return (
    <div style={{ marginTop: 16 }}>
      <video
        src={src}
        controls
        style={{
          width: '100%', borderRadius: 10,
          border: `1px solid ${color}30`,
          background: '#000', maxHeight: 240
        }}
      />
    </div>
  )
}

// ─── Shared track card used in both sections ───────────────────────────────
function TrackCard({
  track, jobId, isVideo,
}: {
  track: Track; jobId: string; isVideo: boolean
}) {
  return (
    <div className="card" style={{ padding: 28, marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: `${track.color}15`, border: `1px solid ${track.color}35`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20
          }}>{track.icon}</div>
          <div>
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 17, fontWeight: 700 }}>{track.label}</h3>
            <p style={{ color: 'var(--muted)', fontSize: 13 }}>{track.desc}</p>
          </div>
        </div>
        <a
          href={`http://127.0.0.1:8000/download/${jobId}/${track.stem}`}
          download={isVideo ? `${track.stem}_video.mp4` : `${track.stem}.wav`}
          style={{ textDecoration: 'none' }}
        >
          <button style={{
            padding: '8px 16px', borderRadius: 8, fontSize: 13,
            background: `${track.color}15`, border: `1px solid ${track.color}35`,
            color: track.color, cursor: 'pointer', fontWeight: 600
          }}>
            ⬇ Download {isVideo ? 'MP4' : 'WAV'}
          </button>
        </a>
      </div>

      {isVideo
        ? <VideoPlayer jobId={jobId} stem={track.stem} color={track.color} />
        : <AudioPlayer jobId={jobId} stem={track.stem} color={track.color} />
      }
    </div>
  )
}

// ─── Section wrapper with pill label + divider ─────────────────────────────
function OutputSection({
  title, badge, badgeColor, badgeBg, badgeBorder, children,
}: {
  title: string
  badge: string
  badgeColor: string
  badgeBg: string
  badgeBorder: string
  children: React.ReactNode
}) {
  return (
    <div style={{ marginBottom: 44 }}>
      {/* Section header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20
      }}>
        <div style={{
          padding: '5px 14px', borderRadius: 100,
          background: badgeBg, border: `1px solid ${badgeBorder}`,
          fontSize: 13, fontWeight: 600, color: badgeColor, whiteSpace: 'nowrap'
        }}>
          {badge}
        </div>
        <div style={{
          flex: 1, height: 1,
          background: `linear-gradient(to right, ${badgeBorder}, transparent)`
        }} />
      </div>

      {children}
    </div>
  )
}

// ─── Tab button ────────────────────────────────────────────────────────────
function TabBtn({
  active, color, onClick, children,
}: {
  active: boolean; color: string; onClick: () => void; children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '9px 22px', borderRadius: 10, fontSize: 14, fontWeight: 600,
        cursor: 'pointer', transition: 'all 0.18s',
        background: active ? `${color}18` : 'transparent',
        border: active ? `1px solid ${color}50` : '1px solid var(--border)',
        color: active ? color : 'var(--muted)',
      }}
    >
      {children}
    </button>
  )
}

// ─── Main page content ─────────────────────────────────────────────────────
type OutputMode = 'both' | 'audio' | 'video'

function ResultsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const jobId = searchParams.get('job_id')

  const [isVideo, setIsVideo] = useState(false)
  const [verified, setVerified] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'audio' | 'video'>('audio')

  useEffect(() => {
    if (!jobId) { setError('No job ID.'); return }
    fetch(`http://127.0.0.1:8000/job/${jobId}/result`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(data => { setIsVideo(data.is_video || false); setVerified(true) })
      .catch(() => setError('Results not ready or job not found.'))
  }, [jobId])

  if (error) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '100px 24px' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 24, marginBottom: 12 }}>Results not found</h2>
        <p style={{ color: 'var(--muted)', marginBottom: 24 }}>{error}</p>
        <button className="btn-primary" onClick={() => router.push('/')}
          style={{ padding: '12px 28px', borderRadius: 10, fontSize: 15 }}>Try again</button>
      </div>
    </div>
  )

  if (!verified) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'var(--muted)' }}>Loading results...</p>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      <Navbar />

      {/* Ambient glow */}
      <div style={{
        position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)',
        width: 500, height: 500,
        background: 'radial-gradient(circle, rgba(34,211,160,0.07) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0
      }} />

      <div style={{ maxWidth: 660, margin: '0 auto', padding: '120px 24px 80px', position: 'relative', zIndex: 1 }}>

        {/* ── Success header ── */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'rgba(34,211,160,0.12)', border: '1px solid rgba(34,211,160,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, margin: '0 auto 20px'
          }}>✓</div>
          <h1 style={{
            fontFamily: 'Syne, sans-serif', fontSize: 34, fontWeight: 800,
            letterSpacing: '-1px', marginBottom: 10
          }}>
            Processing complete
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 16 }}>
            Your audio and video stems are ready to preview and download
          </p>
        </div>

        {/* ── Output type summary badges ── */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 36 }}>
          <div style={{
            padding: '6px 16px', borderRadius: 100,
            background: 'rgba(34,211,160,0.1)', border: '1px solid rgba(34,211,160,0.3)',
            fontSize: 13, fontWeight: 600, color: '#22D3A0'
          }}>🎵 Audio stems</div>
          {isVideo && (
            <div style={{
              padding: '6px 16px', borderRadius: 100,
              background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.3)',
              fontSize: 13, fontWeight: 600, color: 'var(--accent2)'
            }}>🎬 Video stems</div>
          )}
        </div>

        {/* ── Tab bar (only shown when video is also available) ── */}
        {isVideo && (
          <div style={{
            display: 'flex', gap: 10, marginBottom: 32,
            padding: '6px', borderRadius: 14,
            background: 'var(--surface)', border: '1px solid var(--border)'
          }}>
            <TabBtn
              active={activeTab === 'audio'}
              color="#22D3A0"
              onClick={() => setActiveTab('audio')}
            >
              🎵 Audio output
            </TabBtn>
            <TabBtn
              active={activeTab === 'video'}
              color="#A78BFA"
              onClick={() => setActiveTab('video')}
            >
              🎬 Video output
            </TabBtn>
          </div>
        )}

        {/* ── Audio section ── */}
        {(!isVideo || activeTab === 'audio') && (
          <OutputSection
            title="Audio"
            badge="🎵 Audio output"
            badgeColor="#22D3A0"
            badgeBg="rgba(34,211,160,0.08)"
            badgeBorder="rgba(34,211,160,0.25)"
          >
            {audioTracks.map(track => (
              <TrackCard key={track.stem} track={track} jobId={jobId!} isVideo={false} />
            ))}
          </OutputSection>
        )}

        {/* ── Video section (only when input was video) ── */}
        {isVideo && activeTab === 'video' && (
          <OutputSection
            title="Video"
            badge="🎬 Video output"
            badgeColor="#A78BFA"
            badgeBg="rgba(167,139,250,0.08)"
            badgeBorder="rgba(167,139,250,0.25)"
          >
            {videoTracks.map(track => (
              <TrackCard key={track.stem} track={track} jobId={jobId!} isVideo={true} />
            ))}
          </OutputSection>
        )}

        {/* ── Job ID ── */}
        <div style={{
          padding: '14px 20px', borderRadius: 10, marginBottom: 32,
          background: 'var(--surface)', border: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <span style={{ color: 'var(--muted)', fontSize: 13 }}>Job ID</span>
          <code style={{ fontSize: 12, color: 'var(--accent2)', fontFamily: 'monospace' }}>{jobId}</code>
        </div>

        {/* ── CTA ── */}
        <div style={{ textAlign: 'center' }}>
          <button className="btn-primary" onClick={() => router.push('/')}
            style={{ padding: '14px 36px', borderRadius: 12, fontSize: 15 }}>
            Process another track
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ResultsPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--muted)' }}>Loading...</p>
      </div>
    }>
      <ResultsContent />
    </Suspense>
  )
}