'use client'
import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Navbar from '@/components/Navbar'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'
const HEADERS = { 'ngrok-skip-browser-warning': 'true' }

const stages = [
  { label: 'Queued',            pct: 10, color: '#7FBDB5' },
  { label: 'Analysing audio',   pct: 35, color: '#F6D69B' },
  { label: 'Separating stems',  pct: 70, color: '#FF8A63' },
  { label: 'Finalising output', pct: 92, color: '#A78BB7' },
]

function WaveAnim() {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 3, height: 44 }}>
      {[3,5,7,9,6,8,10,7,5,8,6,9,4,7,5].map((h, i) => (
        <div key={i} className="waveform-bar" style={{
          width: 3, height: h * 3.8,
          background: i % 4 === 0 ? '#7FBDB5' : i % 4 === 1 ? '#F6D69B' : i % 4 === 2 ? '#FF8A63' : '#A78BB7',
          borderRadius: 2,
          animationDelay: `${i * 0.07}s`,
          animationDuration: `${0.7 + (i % 4) * 0.15}s`
        }} />
      ))}
    </div>
  )
}

function ProcessingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const jobId = searchParams.get('job_id')
  const [stageIdx, setStageIdx] = useState(0)
  const [progress, setProgress] = useState(5)
  const [error, setError] = useState('')
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setElapsed(s => s + 1), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const t = setInterval(() => {
      setStageIdx(i => { const n = Math.min(i + 1, stages.length - 2); setProgress(stages[n].pct); return n })
    }, 5000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (!jobId) { setError('No job ID found.'); return }
    const poll = setInterval(async () => {
      try {
        const res = await fetch(`${API}/job/${jobId}`, { headers: HEADERS })
        if (!res.ok) throw new Error()
        const data = await res.json()
        if (data.status === 'done') {
          setProgress(100); setStageIdx(stages.length - 1)
          clearInterval(poll)
          setTimeout(() => router.push(`/results?job_id=${jobId}`), 800)
        }
        if (data.status === 'failed') { clearInterval(poll); setError('Processing failed. Try a different file.') }
      } catch { setError('Cannot reach the backend.'); clearInterval(poll) }
    }, 3000)
    return () => clearInterval(poll)
  }, [jobId, router])

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  if (error) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 380 }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(255,138,99,0.1)', border: '1px solid rgba(255,138,99,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 11, fontWeight: 800, color: '#FF8A63' }}>ERR</div>
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, marginBottom: 8, letterSpacing: '-0.03em' }}>Something went wrong</h2>
        <p style={{ color: 'var(--muted)', marginBottom: 20, fontSize: 14 }}>{error}</p>
        <button onClick={() => router.push('/')} className="btn-primary" style={{ padding: '10px 24px', borderRadius: 8, fontSize: 13 }}>
          Try again
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', position: 'relative' }} className="noise">
      <Navbar />
      <div style={{
        position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)',
        width: 600, height: 500, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(ellipse, rgba(127,189,181,0.06) 0%, rgba(246,214,155,0.03) 50%, transparent 70%)'
      }} />
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', position: 'relative', zIndex: 1 }}>
        <div style={{ width: '100%', maxWidth: 460 }}>

          {/* Wave animation card */}
          <div className="card" style={{ padding: '28px', marginBottom: 24, textAlign: 'center' }}>
            <WaveAnim />
            <p style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 14 }}>
              AI processing
            </p>
          </div>

          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 6, textAlign: 'center', color: 'var(--text)' }}>
            {stages[stageIdx].label}
          </h1>
          <p style={{ color: 'var(--muted)', marginBottom: 24, fontSize: 13, textAlign: 'center' }}>
            {fmt(elapsed)} elapsed · Job: {jobId?.slice(0, 8)}...
          </p>

          {/* Progress */}
          <div style={{ background: 'var(--surface2)', borderRadius: 100, height: 5, overflow: 'hidden', marginBottom: 6 }}>
            <div className="progress-bar" style={{ height: '100%', borderRadius: 100, width: `${progress}%`, transition: 'width 1s ease' }} />
          </div>
          <p style={{ color: 'var(--muted)', fontSize: 12, marginBottom: 24, textAlign: 'right' }}>{progress}%</p>

          {/* Stages */}
          <div className="card" style={{ overflow: 'hidden' }}>
            {stages.map((s, i) => {
              const done = i < stageIdx
              const active = i === stageIdx
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '13px 18px',
                  borderBottom: i < stages.length - 1 ? '1px solid var(--border)' : 'none',
                  background: active ? `${s.color}06` : 'transparent',
                  transition: 'background 0.3s'
                }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700,
                    background: done ? 'rgba(127,189,181,0.12)' : active ? `${s.color}15` : 'var(--surface2)',
                    border: done ? '1px solid rgba(127,189,181,0.3)' : active ? `1px solid ${s.color}40` : '1px solid var(--border)',
                    color: done ? '#7FBDB5' : active ? s.color : 'var(--muted)'
                  }}>
                    {done ? 'OK' : i + 1}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: active ? 600 : 400, color: done ? '#7FBDB5' : active ? 'var(--text)' : 'var(--muted)', transition: 'color 0.3s' }}>
                    {s.label}
                  </span>
                  {active && (
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 3 }}>
                      {[0,1,2].map(d => (
                        <div key={d} style={{ width: 4, height: 4, borderRadius: '50%', background: s.color, animation: 'wave 0.8s ease-in-out infinite', animationDelay: `${d * 0.15}s` }} />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ProcessingPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ color: 'var(--muted)' }}>Loading...</p></div>}>
      <ProcessingContent />
    </Suspense>
  )
}