'use client'
import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Navbar from '@/components/Navbar'

const stages = [
  { key: 'queued',      label: 'Queued',            icon: '⏳', pct: 10 },
  { key: 'processing',  label: 'Analysing audio',   icon: '🔬', pct: 40 },
  { key: 'processing',  label: 'Separating stems',  icon: '🎛', pct: 70 },
  { key: 'done',        label: 'Finalising output', icon: '✨', pct: 95 },
]

function WaveAnim() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, height: 48, justifyContent: 'center' }}>
      {Array.from({ length: 18 }).map((_, i) => (
        <div key={i} className="waveform-bar" style={{
          width: 4,
          height: 8 + Math.sin(i * 0.7) * 12,
          background: `hsl(${250 + i * 4}, 80%, 65%)`,
          borderRadius: 2,
          animationDelay: `${i * 0.08}s`,
          animationDuration: `${0.9 + (i % 3) * 0.2}s`
        }} />
      ))}
    </div>
  )
}

function ProcessingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const jobId = searchParams.get('job_id')

  const [status, setStatus] = useState<string>('queued')
  const [stageIdx, setStageIdx] = useState(0)
  const [progress, setProgress] = useState(5)
  const [error, setError] = useState('')
  const [elapsed, setElapsed] = useState(0)

  // Tick elapsed time
  useEffect(() => {
    const t = setInterval(() => setElapsed(s => s + 1), 1000)
    return () => clearInterval(t)
  }, [])

  // Animate through stages
  useEffect(() => {
    if (status === 'done') return
    const t = setInterval(() => {
      setStageIdx(i => {
        const next = Math.min(i + 1, stages.length - 2)
        setProgress(stages[next].pct)
        return next
      })
    }, 4000)
    return () => clearInterval(t)
  }, [status])

  // Poll backend
  useEffect(() => {
    if (!jobId) { setError('No job ID found.'); return }
    const poll = setInterval(async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/job/${jobId}`)
        if (!res.ok) throw new Error('Job not found')
        const data = await res.json()
        setStatus(data.status)
        if (data.status === 'done') {
          setProgress(100)
          setStageIdx(stages.length - 1)
          clearInterval(poll)
          setTimeout(() => router.push(`/results?job_id=${jobId}`), 1200)
        }
        if (data.status === 'failed') {
          clearInterval(poll)
          setError('Processing failed. Please try again with a different file.')
        }
      } catch (e) {
        setError('Cannot reach the backend. Make sure it\'s running on port 8000.')
        clearInterval(poll)
      }
    }, 3000)
    return () => clearInterval(poll)
  }, [jobId, router])

  const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  if (error) return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: '100px 24px'
    }}>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 24, marginBottom: 12 }}>Something went wrong</h2>
        <p style={{ color: 'var(--muted)', marginBottom: 24, lineHeight: 1.6 }}>{error}</p>
        <button className="btn-primary" onClick={() => router.push('/upload')}
          style={{ padding: '12px 28px', borderRadius: 10, fontSize: 15 }}>
          Try again
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      <Navbar />

      <div style={{
        position: 'fixed', top: '30%', left: '50%', transform: 'translateX(-50%)',
        width: 500, height: 500,
        background: 'radial-gradient(circle, rgba(108,99,255,0.12) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0
      }} />

      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: '100px 24px', position: 'relative', zIndex: 1
      }}>
        <div style={{ width: '100%', maxWidth: 520, textAlign: 'center' }}>

          {/* Animated waveform */}
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 20, padding: '32px', marginBottom: 32
          }}>
            <WaveAnim />
            <p style={{
              fontFamily: 'Syne, sans-serif', fontSize: 13,
              color: 'var(--accent2)', marginTop: 12, letterSpacing: 1, textTransform: 'uppercase'
            }}>
              AI is working
            </p>
          </div>

          <h1 style={{
            fontFamily: 'Syne, sans-serif', fontSize: 32, fontWeight: 800,
            letterSpacing: '-1px', marginBottom: 8
          }}>
            {stages[stageIdx].icon} {stages[stageIdx].label}
          </h1>
          <p style={{ color: 'var(--muted)', marginBottom: 36, fontSize: 15 }}>
            Elapsed: {fmtTime(elapsed)} · Job: {jobId?.slice(0, 8)}...
          </p>

          {/* Progress bar */}
          <div style={{
            background: 'var(--surface2)', borderRadius: 100,
            height: 8, overflow: 'hidden', marginBottom: 12
          }}>
            <div className="progress-bar" style={{
              height: '100%', borderRadius: 100,
              width: `${progress}%`,
              transition: 'width 0.8s ease'
            }} />
          </div>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 40 }}>
            {progress}% complete
          </p>

          {/* Steps list */}
          <div style={{ textAlign: 'left' }}>
            {stages.map((s, i) => {
              const done = i < stageIdx
              const active = i === stageIdx
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  padding: '14px 20px', borderRadius: 12, marginBottom: 8,
                  background: active ? 'rgba(108,99,255,0.08)' : 'transparent',
                  border: active ? '1px solid rgba(108,99,255,0.2)' : '1px solid transparent',
                  transition: 'all 0.3s ease'
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
                    background: done ? 'rgba(34,211,160,0.15)' : active ? 'rgba(108,99,255,0.15)' : 'var(--surface2)',
                    border: done ? '1px solid rgba(34,211,160,0.4)' : active ? '1px solid rgba(108,99,255,0.4)' : '1px solid var(--border)',
                    color: done ? '#22D3A0' : active ? 'var(--accent2)' : 'var(--muted)'
                  }}>
                    {done ? '✓' : s.icon}
                  </div>
                  <span style={{
                    fontSize: 15, fontWeight: active ? 600 : 400,
                    color: done ? '#22D3A0' : active ? 'var(--text)' : 'var(--muted)',
                    transition: 'color 0.3s ease'
                  }}>
                    {s.label}
                  </span>
                  {active && (
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 3 }}>
                      {[0, 1, 2].map(d => (
                        <div key={d} style={{
                          width: 5, height: 5, borderRadius: '50%',
                          background: 'var(--accent)',
                          animation: 'wave 0.8s ease-in-out infinite',
                          animationDelay: `${d * 0.15}s`
                        }} />
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
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'var(--muted)' }}>Loading...</p>
    </div>}>
      <ProcessingContent />
    </Suspense>
  )
}
