'use client'
import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'

const ACCEPTED_AUDIO = ['audio/mpeg', 'audio/wav', 'audio/mp3']
const ACCEPTED_VIDEO = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm']
const ALL_ACCEPTED = [...ACCEPTED_AUDIO, ...ACCEPTED_VIDEO]
const MAX_MB = 200
const API = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'

const WaveformIcon = ({ color = '#7FBDB5', animated = false }: { color?: string; animated?: boolean }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 3, height: 36 }}>
    {[4, 7, 5, 9, 6, 8, 4, 7, 5, 9, 6, 8, 4].map((h, i) => (
      <div key={i} className={animated ? 'waveform-bar' : ''} style={{
        width: 3, height: h * 3.5, background: color, borderRadius: 2,
        animationDelay: `${i * 0.1}s`, opacity: animated ? 1 : 0.5 + (i % 3) * 0.2
      }} />
    ))}
  </div>
)

const features = [
  { icon: 'MIC', title: 'Isolated vocals', desc: 'Crystal-clear vocal extraction powered by Meta Demucs neural network.', color: '#7FBDB5', bg: 'rgba(127,189,181,0.08)', border: 'rgba(127,189,181,0.2)' },
  { icon: 'MIX', title: 'Clean instrumental', desc: 'Full backing track with vocals completely removed, not just filtered.', color: '#F6D69B', bg: 'rgba(246,214,155,0.08)', border: 'rgba(246,214,155,0.2)' },
  { icon: 'VID', title: 'Video support', desc: 'Upload MP4 videos and get back a video with vocals removed or isolated.', color: '#FF8A63', bg: 'rgba(255,138,99,0.08)', border: 'rgba(255,138,99,0.2)' },
  { icon: 'FAST', title: 'Fast processing', desc: 'Most tracks processed in under 3 minutes on CPU, faster on GPU.', color: '#A78BB7', bg: 'rgba(167,139,183,0.08)', border: 'rgba(167,139,183,0.2)' },
  { icon: 'FMT', title: 'Multiple formats', desc: 'Upload MP3, WAV, MP4, MOV, AVI. We handle conversion automatically.', color: '#7FBDB5', bg: 'rgba(127,189,181,0.08)', border: 'rgba(127,189,181,0.2)' },
  { icon: 'SEC', title: 'Private and secure', desc: 'Your files are processed locally and deleted after download.', color: '#F6D69B', bg: 'rgba(246,214,155,0.08)', border: 'rgba(246,214,155,0.2)' },
]

const team = [
  { icon: 'AI', title: 'Built on Demucs', sub: 'Meta AI Research', desc: 'State-of-the-art music source separation model used by audio professionals worldwide.', color: '#7FBDB5' },
  { icon: 'OS', title: 'Open source', sub: 'Transparent technology', desc: 'Powered by open-source AI — no black boxes, no hidden processing.', color: '#F6D69B' },
  { icon: 'PVT', title: 'No account needed', sub: 'Privacy first', desc: 'Upload, process, download. No sign-up, no tracking, no data retention.', color: '#A78BB7' },
]

export default function Home() {
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [fileType, setFileType] = useState<'audio' | 'video' | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const uploadRef = useRef<HTMLDivElement>(null)
  const aboutRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const validate = (f: File) => {
    if (!ALL_ACCEPTED.includes(f.type) && !f.name.match(/\.(mp3|wav|mp4|mov|avi|webm)$/i)) {
      setError('Unsupported format. Use MP3, WAV, MP4, MOV, AVI or WEBM.')
      return false
    }
    if (f.size > MAX_MB * 1024 * 1024) { setError(`File too large. Max ${MAX_MB}MB.`); return false }
    setError(''); return true
  }

  const handleFile = (f: File) => {
    if (validate(f)) {
      setFile(f)
      setFileType(ACCEPTED_VIDEO.includes(f.type) || !!f.name.match(/\.(mp4|mov|avi|webm)$/i) ? 'video' : 'audio')
    }
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false)
    const f = e.dataTransfer.files[0]; if (f) handleFile(f)
  }, [])

  const formatSize = (b: number) => b < 1024 * 1024 ? `${(b / 1024).toFixed(0)} KB` : `${(b / (1024 * 1024)).toFixed(1)} MB`
  const getExt = (name: string) => name.split('.').pop()?.toUpperCase() || 'FILE'

  const handleUpload = async () => {
    if (!file) return
    setUploading(true); setError('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch(`${API}/upload`, {
        method: 'POST', body: formData,
        headers: { 'ngrok-skip-browser-warning': 'true' }
      })
      if (!res.ok) { const err = await res.json(); throw new Error(err.detail || 'Upload failed') }
      const { job_id } = await res.json()
      router.push(`/processing?job_id=${job_id}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
      setUploading(false)
    }
  }

  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }} className="noise">
      <Navbar onUploadClick={() => scrollTo(uploadRef)} onAboutClick={() => scrollTo(aboutRef)} />

      {/* Background glow */}
      <div style={{
        position: 'fixed', top: '10%', left: '50%', transform: 'translateX(-50%)',
        width: 800, height: 600, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(ellipse, rgba(127,189,181,0.07) 0%, rgba(246,214,155,0.03) 50%, transparent 70%)'
      }} />

      {/* HERO */}
      <section style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '90px 24px 60px', position: 'relative', zIndex: 1, textAlign: 'center'
      }}>
        {/* Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '5px 14px', borderRadius: 100, marginBottom: 28,
          background: 'rgba(127,189,181,0.08)', border: '1px solid rgba(127,189,181,0.25)',
        }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#7FBDB5' }} />
          <span style={{ fontSize: 12, color: '#A8D5D0', fontWeight: 500 }}>Powered by Meta Demucs AI</span>
        </div>

        <h1 style={{
          fontFamily: 'Syne, sans-serif', fontSize: 'clamp(38px, 6vw, 76px)',
          fontWeight: 800, lineHeight: 1.05, letterSpacing: '-2px', marginBottom: 18, maxWidth: 750
        }}>
          Extract vocals from<br />
          <span className="gradient-text">any song or video</span>
        </h1>

        <p style={{ fontSize: 17, color: 'var(--muted)', maxWidth: 460, lineHeight: 1.7, marginBottom: 44 }}>
          Upload audio or video. Get clean isolated vocals and a full instrumental, separated by AI in minutes.
        </p>

        {/* Waveform demo */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 20, marginBottom: 44,
          padding: '16px 28px', background: 'var(--surface)',
          border: '1px solid var(--border)', borderRadius: 14
        }}>
          <div>
            <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Original</div>
            <WaveformIcon color="#6B8090" />
          </div>
          <div style={{ color: 'var(--muted)', fontSize: 16 }}>to</div>
          <div>
            <div style={{ fontSize: 10, color: '#7FBDB5', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Vocals</div>
            <WaveformIcon color="#7FBDB5" animated />
          </div>
          <div style={{ width: 1, height: 36, background: 'var(--border)' }} />
          <div>
            <div style={{ fontSize: 10, color: '#F6D69B', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Instrumental</div>
            <WaveformIcon color="#F6D69B" animated />
          </div>
        </div>

        {/* Upload box */}
        <div ref={uploadRef} style={{ width: '100%', maxWidth: 520 }}>
          <div
            onDrop={onDrop}
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onClick={() => !file && inputRef.current?.click()}
            style={{
              border: `2px dashed ${dragging ? '#7FBDB5' : file ? 'rgba(127,189,181,0.5)' : 'var(--border)'}`,
              borderRadius: 20, padding: '36px 28px', textAlign: 'center',
              cursor: file ? 'default' : 'pointer',
              background: dragging ? 'rgba(127,189,181,0.06)' : file ? 'rgba(127,189,181,0.03)' : 'var(--surface)',
              transition: 'all 0.3s ease', marginBottom: 14
            }}
          >
            <input ref={inputRef} type="file"
              accept=".mp3,.wav,.mp4,.mov,.avi,.webm"
              style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
            />
            {!file ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: 14, overflow: 'hidden',
                    background: 'rgba(127,189,181,0.08)', border: '1px solid rgba(127,189,181,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <div style={{ transform: 'scale(0.65)' }}>
                      <WaveformIcon color="#7FBDB5" />
                    </div>
                  </div>
                </div>
                <p style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, fontFamily: 'Syne, sans-serif', color: 'var(--text)' }}>
                  {dragging ? 'Drop it here' : 'Drop your file here'}
                </p>
                <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 16 }}>or click to browse your files</p>
                <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
                  {['MP3', 'WAV', 'MP4', 'MOV', 'AVI', 'WEBM'].map(fmt => (
                    <span key={fmt} style={{
                      padding: '3px 10px', borderRadius: 6,
                      background: 'var(--surface2)', border: '1px solid var(--border)',
                      fontSize: 11, color: 'var(--muted)', fontWeight: 600
                    }}>{fmt}</span>
                  ))}
                  <span style={{
                    padding: '3px 10px', borderRadius: 6,
                    background: 'var(--surface2)', border: '1px solid var(--border)',
                    fontSize: 11, color: 'var(--muted)', fontWeight: 600
                  }}>Max {MAX_MB}MB</span>
                </div>
              </>
            ) : (
              <div>
                <div style={{
                  width: 52, height: 52, borderRadius: 13, margin: '0 auto 12px',
                  background: 'rgba(127,189,181,0.1)', border: '1px solid rgba(127,189,181,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 800, color: '#7FBDB5', letterSpacing: '0.05em'
                }}>{fileType === 'video' ? 'VID' : 'AUD'}</div>
                <div style={{
                  display: 'inline-block', padding: '3px 10px', borderRadius: 6, marginBottom: 10,
                  background: 'rgba(127,189,181,0.1)', border: '1px solid rgba(127,189,181,0.3)',
                  fontSize: 11, fontWeight: 700, color: '#7FBDB5'
                }}>{getExt(file.name)}</div>
                <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, fontFamily: 'Syne, sans-serif' }}>
                  {file.name.length > 42 ? file.name.slice(0, 39) + '...' : file.name}
                </p>
                <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 14 }}>{formatSize(file.size)}</p>
                <button onClick={e => { e.stopPropagation(); setFile(null); setFileType(null); setError('') }}
                  className="btn-outline" style={{ padding: '5px 14px', borderRadius: 7, fontSize: 12 }}>
                  Remove
                </button>
              </div>
            )}
          </div>

          {error && (
            <div style={{
              padding: '11px 14px', borderRadius: 10, marginBottom: 12,
              background: 'rgba(255,138,99,0.08)', border: '1px solid rgba(255,138,99,0.25)',
              color: '#FF8A63', fontSize: 13
            }}>{error}</div>
          )}

          <button className="btn-primary glow" onClick={handleUpload} disabled={!file || uploading} style={{
            width: '100%', padding: '14px', borderRadius: 12, fontSize: 15
          }}>
            {uploading ? 'Processing...' : file ? `Extract from ${fileType}` : 'Choose a file to get started'}
          </button>

          <p style={{ textAlign: 'center', marginTop: 10, fontSize: 12, color: 'var(--muted)' }}>
            Free · No account needed · ~2-3 min
          </p>
        </div>

        {/* Steps */}
        <div style={{ display: 'flex', gap: 6, marginTop: 44, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
          {['Upload file', 'AI separates stems', 'Download results'].map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 7, padding: '7px 14px',
                borderRadius: 100, background: 'var(--surface)', border: '1px solid var(--border)',
                fontSize: 12, color: 'var(--muted)'
              }}>
                <span style={{
                  width: 18, height: 18, borderRadius: '50%',
                  background: 'rgba(127,189,181,0.12)', border: '1px solid rgba(127,189,181,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 700, color: '#7FBDB5'
                }}>{i + 1}</span>
                {s}
              </div>
              {i < 2 && <span style={{ color: 'var(--border)', fontSize: 14 }}>-</span>}
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ padding: '48px 24px', borderTop: '1px solid var(--border)', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <p style={{ textAlign: 'center', fontSize: 11, color: '#7FBDB5', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12, fontWeight: 600 }}>What you get</p>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800, textAlign: 'center', marginBottom: 48, letterSpacing: '-0.03em' }}>
            Professional-grade separation
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            {features.map((f, i) => (
              <div key={i} className="card" style={{ padding: 24 }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-3px)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}>
                <div style={{
                  display: 'inline-flex', padding: '5px 12px', borderRadius: 7, marginBottom: 14,
                  background: f.bg, border: `1px solid ${f.border}`,
                  fontSize: 11, fontWeight: 800, color: f.color, letterSpacing: '0.06em'
                }}>{f.icon}</div>
                <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700, marginBottom: 8, color: 'var(--text)' }}>{f.title}</h3>
                <p style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.65 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ padding: '48px 24px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <p style={{ textAlign: 'center', fontSize: 11, color: '#F6D69B', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12, fontWeight: 600 }}>How it works</p>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800, textAlign: 'center', marginBottom: 48, letterSpacing: '-0.03em' }}>
            Three steps
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { n: '01', title: 'Upload your file', desc: 'Drop any MP3, WAV, MP4, MOV, AVI or WEBM up to 200MB.', color: '#7FBDB5' },
              { n: '02', title: 'AI processes your track', desc: "Meta Demucs neural network separates your audio into stems with studio precision.", color: '#F6D69B' },
              { n: '03', title: 'Download your stems', desc: 'Get vocals and instrumental as WAV. Video uploads also get MP4 output.', color: '#A78BB7' },
            ].map((s, i) => (
              <div key={i} className="card" style={{ padding: '24px 28px', display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 32, fontWeight: 800, color: s.color, opacity: 0.4, flexShrink: 0, lineHeight: 1, fontFamily: 'Syne, sans-serif' }}>{s.n}</span>
                <div>
                  <p style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, color: 'var(--text)', fontFamily: 'Syne, sans-serif' }}>{s.title}</p>
                  <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.65 }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section ref={aboutRef} style={{ padding: '48px 24px', borderTop: '1px solid var(--border)', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <p style={{ textAlign: 'center', fontSize: 11, color: '#A78BB7', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12, fontWeight: 600 }}>About Vocalify</p>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800, textAlign: 'center', marginBottom: 16, letterSpacing: '-0.03em' }}>
            Built for musicians and creators
          </h2>
          <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 16, maxWidth: 500, margin: '0 auto 48px', lineHeight: 1.7 }}>
            Professional audio separation accessible to everyone — from karaoke to music production.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 48 }}>
            {team.map((t, i) => (
              <div key={i} className="card" style={{ padding: 28, textAlign: 'center' }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 13, margin: '0 auto 14px',
                  background: `${t.color}12`, border: `1px solid ${t.color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 800, color: t.color, letterSpacing: '0.06em'
                }}>{t.icon}</div>
                <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 700, marginBottom: 4, color: 'var(--text)' }}>{t.title}</p>
                <p style={{ fontSize: 11, color: t.color, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>{t.sub}</p>
                <p style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.6 }}>{t.desc}</p>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 1, background: 'var(--border)', borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border)' }}>
            {[
              { n: '4', l: 'Stem types', c: '#7FBDB5' },
              { n: '200MB', l: 'Max file size', c: '#F6D69B' },
              { n: '100%', l: 'Free to use', c: '#FF8A63' },
              { n: '0', l: 'Accounts needed', c: '#A78BB7' },
            ].map((s, i) => (
              <div key={i} style={{ padding: '28px 20px', textAlign: 'center', background: 'var(--surface)' }}>
                <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 32, fontWeight: 800, marginBottom: 4, color: s.c }}>{s.n}</p>
                <p style={{ fontSize: 12, color: 'var(--muted)' }}>{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '32px 24px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 26, height: 26, background: 'linear-gradient(135deg, #7FBDB5, #F6D69B)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5 }}>
              {[2,3,2,4,2].map((h, i) => (<div key={i} style={{ width: 2, height: h * 3, background: '#0D1117', borderRadius: 1 }} />))}
            </div>
            <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 15, color: 'var(--text)' }}>Vocalify</span>
          </div>
          <div style={{ display: 'flex', gap: 20 }}>
            <button onClick={() => scrollTo(uploadRef)} style={{ background: 'none', border: 'none', fontSize: 13, color: 'var(--muted)', cursor: 'pointer' }}>Extract</button>
            <button onClick={() => scrollTo(aboutRef)} style={{ background: 'none', border: 'none', fontSize: 13, color: 'var(--muted)', cursor: 'pointer' }}>About</button>
          </div>
          <p style={{ fontSize: 12, color: 'var(--muted)' }}>2026 Vocalify · Powered by Meta Demucs</p>
        </div>
      </footer>
    </div>
  )
}