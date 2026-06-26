'use client'
import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'

const ACCEPTED_AUDIO = ['audio/mpeg', 'audio/wav', 'audio/mp3']
const ACCEPTED_VIDEO = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm']
const ALL_ACCEPTED = [...ACCEPTED_AUDIO, ...ACCEPTED_VIDEO]
const MAX_MB = 200
const API = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'

const WaveformIcon = ({ color = '#6C63FF', animated = false }: { color?: string; animated?: boolean }) => (
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
  { icon: 'MIC', title: 'Isolated Vocals', desc: 'Crystal-clear vocal extraction powered by Meta Demucs neural network.' },
  { icon: 'MIX', title: 'Clean Instrumental', desc: 'Full backing track with vocals completely removed, not just filtered.' },
  { icon: 'VID', title: 'Video Support', desc: 'Upload MP4 videos and get back a video with vocals removed or isolated.' },
  { icon: 'FAST', title: 'Fast Processing', desc: 'Most tracks processed in under 3 minutes on CPU, faster on GPU.' },
  { icon: 'FMT', title: 'Multiple Formats', desc: 'Upload MP3, WAV, MP4, MOV, AVI. We handle conversion automatically.' },
  { icon: 'SEC', title: 'Private & Secure', desc: 'Your files are processed locally and deleted after download.' },
]

const team = [
  { name: 'Built on Demucs', role: 'Meta AI Research', desc: 'State-of-the-art music source separation model used by audio professionals worldwide.' },
  { name: 'Open Source', role: 'Transparent Technology', desc: 'Powered by open-source AI — no black boxes, no hidden processing.' },
  { name: 'No Account Needed', role: 'Privacy First', desc: 'Upload, process, download. No sign-up, no tracking, no data retention.' },
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
    if (f.size > MAX_MB * 1024 * 1024) {
      setError(`File too large. Max size is ${MAX_MB}MB.`)
      return false
    }
    setError('')
    return true
  }

  const handleFile = (f: File) => {
    if (validate(f)) {
      setFile(f)
      setFileType(ACCEPTED_VIDEO.includes(f.type) || !!f.name.match(/\.(mp4|mov|avi|webm)$/i) ? 'video' : 'audio')
    }
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [])

  const formatSize = (b: number) => b < 1024 * 1024 ? `${(b / 1024).toFixed(0)} KB` : `${(b / (1024 * 1024)).toFixed(1)} MB`
  const getExt = (name: string) => name.split('.').pop()?.toUpperCase() || 'FILE'

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch(`${API}/upload`, { method: 'POST', body: formData })
      if (!res.ok) { const err = await res.json(); throw new Error(err.detail || 'Upload failed') }
      const { job_id } = await res.json()
      router.push(`/processing?job_id=${job_id}`)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Something went wrong. Make sure the backend is running.'
      setError(msg)
      setUploading(false)
    }
  }

  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      <Navbar onUploadClick={() => scrollTo(uploadRef)} onAboutClick={() => scrollTo(aboutRef)} />

      <div style={{
        position: 'fixed', top: '15%', left: '50%', transform: 'translateX(-50%)',
        width: 700, height: 700,
        background: 'radial-gradient(circle, rgba(108,99,255,0.1) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0
      }} />

      <section style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '90px 24px 60px', position: 'relative', zIndex: 1, textAlign: 'center'
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'rgba(108,99,255,0.1)', border: '1px solid rgba(108,99,255,0.3)',
          borderRadius: 100, padding: '6px 16px', marginBottom: 24
        }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22D3A0' }} />
          <span style={{ fontSize: 13, color: 'var(--accent2)', fontWeight: 500 }}>Powered by Meta Demucs AI</span>
        </div>

        <h1 style={{
          fontFamily: 'Syne, sans-serif', fontSize: 'clamp(38px, 6vw, 76px)',
          fontWeight: 800, lineHeight: 1.05, letterSpacing: '-2px',
          marginBottom: 16, maxWidth: 750
        }}>
          Extract vocals from<br />
          <span className="gradient-text">any song or video</span>
        </h1>

        <p style={{ fontSize: 17, color: 'var(--muted)', maxWidth: 480, lineHeight: 1.7, marginBottom: 40 }}>
          Upload audio or video. Get clean isolated vocals and a full instrumental, separated by AI in minutes.
        </p>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 20, marginBottom: 40,
          padding: '16px 28px', background: 'var(--surface)',
          border: '1px solid var(--border)', borderRadius: 14
        }}>
          <div>
            <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Original</div>
            <WaveformIcon color="#6B7A99" />
          </div>
          <div style={{
  width: 56, height: 56, borderRadius: 14, margin: '0 auto 16px',
  background: 'rgba(108,99,255,0.1)', border: '1px solid rgba(108,99,255,0.2)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: 24, color: 'var(--accent2)'
}}>
  ♪
</div>
          <div style={{ width: 1, height: 36, background: 'var(--border)' }} />
          <div>
            <div style={{ fontSize: 10, color: 'var(--accent2)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Instrumental</div>
            <WaveformIcon color="#A78BFA" animated />
          </div>
        </div>

        <div ref={uploadRef} style={{ width: '100%', maxWidth: 540 }}>
          <div
            onDrop={onDrop}
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onClick={() => !file && inputRef.current?.click()}
            style={{
              border: `2px dashed ${dragging ? 'var(--accent)' : file ? (fileType === 'video' ? 'rgba(167,139,250,0.5)' : 'rgba(34,211,160,0.5)') : 'var(--border)'}`,
              borderRadius: 20, padding: '36px 28px', textAlign: 'center',
              cursor: file ? 'default' : 'pointer',
              background: dragging ? 'rgba(108,99,255,0.06)' : file ? 'rgba(108,99,255,0.03)' : 'var(--surface)',
              transition: 'all 0.3s ease', marginBottom: 14
            }}
          >
            <input ref={inputRef} type="file"
              accept=".mp3,.wav,.mp4,.mov,.avi,.webm,audio/mpeg,audio/wav,video/mp4,video/quicktime,video/webm"
              style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
            />
            {!file ? (
              <>
                <div style={{
                  width: 64, height: 64, borderRadius: 16, margin: '0 auto 16px',
                  background: 'rgba(108,99,255,0.1)', border: '1px solid rgba(108,99,255,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <WaveformIcon color="#6C63FF" />
                </div>
                <p style={{ fontSize: 17, fontWeight: 700, marginBottom: 6, fontFamily: 'Syne, sans-serif' }}>
                  {dragging ? 'Drop it here!' : 'Drop your file here'}
                </p>
                <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 16 }}>or click to browse your files</p>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
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
                  width: 56, height: 56, borderRadius: 14, margin: '0 auto 12px',
                  background: fileType === 'video' ? 'rgba(167,139,250,0.1)' : 'rgba(34,211,160,0.1)',
                  border: `1px solid ${fileType === 'video' ? 'rgba(167,139,250,0.3)' : 'rgba(34,211,160,0.3)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 800, letterSpacing: 1,
                  color: fileType === 'video' ? 'var(--accent2)' : '#22D3A0'
                }}>{fileType === 'video' ? 'VIDEO' : 'AUDIO'}</div>
                <div style={{
                  display: 'inline-block', padding: '3px 10px', borderRadius: 6, marginBottom: 10,
                  background: fileType === 'video' ? 'rgba(167,139,250,0.1)' : 'rgba(34,211,160,0.1)',
                  border: `1px solid ${fileType === 'video' ? 'rgba(167,139,250,0.3)' : 'rgba(34,211,160,0.3)'}`,
                  fontSize: 11, fontWeight: 700,
                  color: fileType === 'video' ? 'var(--accent2)' : '#22D3A0'
                }}>
                  {getExt(file.name)}
                </div>
                <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 4, fontFamily: 'Syne, sans-serif' }}>
                  {file.name.length > 42 ? file.name.slice(0, 39) + '...' : file.name}
                </p>
                <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 14 }}>{formatSize(file.size)}</p>
                <button onClick={e => { e.stopPropagation(); setFile(null); setFileType(null); setError('') }} style={{
                  padding: '6px 16px', borderRadius: 8, fontSize: 13,
                  background: 'transparent', border: '1px solid var(--border)',
                  color: 'var(--muted)', cursor: 'pointer'
                }}>Remove</button>
              </div>
            )}
          </div>

          {error && (
            <div style={{
              padding: '12px 16px', borderRadius: 10, marginBottom: 12,
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
              color: '#FCA5A5', fontSize: 14
            }}>{error}</div>
          )}

          <button className="btn-primary" onClick={handleUpload} disabled={!file || uploading} style={{
            width: '100%', padding: '15px', borderRadius: 12, fontSize: 16,
            opacity: (!file || uploading) ? 0.45 : 1,
            cursor: (!file || uploading) ? 'not-allowed' : 'pointer'
          }}>
            {uploading ? 'Processing...' : file ? `Extract from ${fileType === 'video' ? 'video' : 'audio'}` : 'Choose a file to get started'}
          </button>

          <p style={{ textAlign: 'center', marginTop: 12, fontSize: 13, color: 'var(--muted)' }}>
            Free · No account needed · ~2-3 min processing
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 44, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
          {['Upload audio or video', 'AI separates stems', 'Download results'].map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 16px', borderRadius: 100,
                background: 'var(--surface)', border: '1px solid var(--border)',
                fontSize: 13, color: 'var(--muted)'
              }}>
                <span style={{
                  width: 20, height: 20, borderRadius: '50%',
                  background: 'rgba(108,99,255,0.15)', border: '1px solid rgba(108,99,255,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, color: 'var(--accent2)', fontWeight: 700
                }}>{i + 1}</span>
                {s}
              </div>
              {i < 2 && <span style={{ color: 'var(--border)', fontSize: 16 }}>-</span>}
            </div>
          ))}
        </div>
      </section>

      <section style={{ padding: '100px 24px', borderTop: '1px solid var(--border)', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--accent2)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>What you get</p>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, textAlign: 'center', marginBottom: 16, letterSpacing: '-1px' }}>
            Professional-grade separation
          </h2>
          <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 16, maxWidth: 500, margin: '0 auto 64px' }}>
            The same technology used in recording studios, now available for free in your browser.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {features.map((f, i) => (
              <div key={i} className="card" style={{ padding: 28, transition: 'transform 0.2s ease' }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-4px)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  padding: '6px 12px', borderRadius: 8, marginBottom: 14,
                  background: 'rgba(108,99,255,0.1)', border: '1px solid rgba(108,99,255,0.2)',
                  fontSize: 11, fontWeight: 800, color: 'var(--accent2)', letterSpacing: 1
                }}>{f.icon}</div>
                <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 17, fontWeight: 700, marginBottom: 8 }}>{f.title}</h3>
                <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.65 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '100px 24px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--accent2)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>How it works</p>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, textAlign: 'center', marginBottom: 64, letterSpacing: '-1px' }}>
            Three steps. That is it.
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { step: '01', title: 'Upload your file', desc: 'Drag and drop or browse for any MP3, WAV, MP4, MOV, AVI or WEBM file up to 200MB.', color: '#6C63FF' },
              { step: '02', title: 'AI processes your track', desc: 'Meta Demucs neural network analyses and separates the audio into individual stems with studio-grade precision.', color: '#A78BFA' },
              { step: '03', title: 'Download your stems', desc: 'Get isolated vocals and a clean instrumental. For video files, download the processed video with vocals removed.', color: '#22D3A0' },
            ].map((s, i) => (
              <div key={i} className="card" style={{ padding: '28px 32px', display: 'flex', gap: 24, alignItems: 'flex-start' }}>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 36, fontWeight: 800, color: s.color, opacity: 0.3, flexShrink: 0, lineHeight: 1 }}>{s.step}</div>
                <div>
                  <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 19, fontWeight: 700, marginBottom: 8 }}>{s.title}</h3>
                  <p style={{ color: 'var(--muted)', fontSize: 15, lineHeight: 1.65 }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section ref={aboutRef} style={{ padding: '100px 24px', borderTop: '1px solid var(--border)', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--accent2)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>About Vocalify</p>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, textAlign: 'center', marginBottom: 16, letterSpacing: '-1px' }}>
            Built for musicians, creators and audio engineers
          </h2>
          <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 16, maxWidth: 560, margin: '0 auto 64px', lineHeight: 1.7 }}>
            Vocalify makes professional-grade audio separation accessible to everyone. Whether you are a producer, content creator, karaoke enthusiast, or audio engineer, we have you covered.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20, marginBottom: 64 }}>
            {team.map((t, i) => (
              <div key={i} className="card" style={{ padding: 32, textAlign: 'center' }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 14,
                  background: 'rgba(108,99,255,0.1)', border: '1px solid rgba(108,99,255,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 800, color: 'var(--accent2)', letterSpacing: 1,
                  margin: '0 auto 16px'
                }}>
                  {i === 0 ? 'AI' : i === 1 ? 'OS' : 'PVT'}
                </div>
                <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 17, fontWeight: 700, marginBottom: 4 }}>{t.name}</h3>
                <p style={{ fontSize: 12, color: 'var(--accent2)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>{t.role}</p>
                <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.6 }}>{t.desc}</p>
              </div>
            ))}
          </div>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 1, background: 'var(--border)', borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border)'
          }}>
            {[
              { num: '4', label: 'Stem separation' },
              { num: '200MB', label: 'Max file size' },
              { num: '100%', label: 'Free to use' },
              { num: '0', label: 'Accounts needed' },
            ].map((s, i) => (
              <div key={i} style={{ padding: '32px 24px', textAlign: 'center', background: 'var(--surface)' }}>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 36, fontWeight: 800, marginBottom: 6 }} className="gradient-text">{s.num}</div>
                <div style={{ color: 'var(--muted)', fontSize: 13 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '80px 24px', position: 'relative', zIndex: 1 }}>
        <div style={{
          maxWidth: 700, margin: '0 auto', textAlign: 'center', padding: '72px 40px',
          background: 'linear-gradient(135deg, rgba(108,99,255,0.12), rgba(34,211,160,0.06))',
          border: '1px solid rgba(108,99,255,0.2)', borderRadius: 28
        }}>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, letterSpacing: '-1px', marginBottom: 14 }}>
            Ready to extract?
          </h2>
          <p style={{ color: 'var(--muted)', marginBottom: 36, fontSize: 16, lineHeight: 1.6 }}>
            Drop your track or video and get professional stems back in minutes. No account. No cost.
          </p>
          <button className="btn-primary glow" onClick={() => scrollTo(uploadRef)} style={{ padding: '16px 44px', borderRadius: 12, fontSize: 16 }}>
            Start extracting now
          </button>
        </div>
      </section>

      <footer style={{ borderTop: '1px solid var(--border)', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '48px 24px 32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 32, marginBottom: 40 }}>
            <div style={{ maxWidth: 280 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #6C63FF, #22D3A0)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                  {[3,5,4,6,3].map((h, i) => (
                    <div key={i} style={{ width: 3, height: h * 3, background: 'white', borderRadius: 2 }} />
                  ))}
                </div>
                <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 20 }}>Vocalify</span>
              </div>
              <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.65 }}>
                AI-powered vocal and stem separation for musicians, creators, and audio engineers.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap' }}>
              <div>
                <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 13, marginBottom: 14, color: 'var(--text)' }}>Product</p>
                {['Upload & Extract', 'How it works', 'Features'].map(l => (
                  <p key={l} style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 10, cursor: 'pointer' }} onClick={() => scrollTo(uploadRef)}>{l}</p>
                ))}
              </div>
              <div>
                <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 13, marginBottom: 14, color: 'var(--text)' }}>Company</p>
                {['About Us', 'Technology', 'Privacy'].map(l => (
                  <p key={l} style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 10, cursor: 'pointer' }} onClick={() => scrollTo(aboutRef)}>{l}</p>
                ))}
              </div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <p style={{ color: 'var(--muted)', fontSize: 13 }}>2026 Vocalify. All rights reserved.</p>
            <p style={{ color: 'var(--muted)', fontSize: 13 }}>Powered by Meta Demucs · Built with Next.js and FastAPI</p>
          </div>
        </div>
      </footer>
    </div>
  )
}