'use client'
import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'

const ACCEPTED_AUDIO = ['audio/mpeg', 'audio/wav', 'audio/mp3']
const ACCEPTED_VIDEO = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm']
const ALL_ACCEPTED = [...ACCEPTED_AUDIO, ...ACCEPTED_VIDEO]
const MAX_MB = 200
const API = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'

const features = [
  { label: 'Vocals', desc: 'Isolated clean vocal track from any song' },
  { label: 'Instrumental', desc: 'Full backing track with vocals removed' },
  { label: 'Video', desc: 'Upload video, get stems back as MP4' },
  { label: 'Fast', desc: 'Most tracks ready in under 3 minutes' },
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
      setError('Unsupported format. Use MP3, WAV, MP4, MOV, or AVI.')
      return false
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      setError(`File too large. Max ${MAX_MB}MB.`)
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
    e.preventDefault(); setDragging(false)
    const f = e.dataTransfer.files[0]; if (f) handleFile(f)
  }, [])

  const formatSize = (b: number) => b < 1024 * 1024 ? `${(b / 1024).toFixed(0)} KB` : `${(b / (1024 * 1024)).toFixed(1)} MB`

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
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar onUploadClick={() => scrollTo(uploadRef)} onAboutClick={() => scrollTo(aboutRef)} />

      {/* Hero */}
      <section style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '80px 20px 60px', textAlign: 'center'
      }}>
        {/* Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '4px 12px', borderRadius: 100,
          border: '1px solid var(--border2)',
          fontSize: 12, color: 'var(--text2)', marginBottom: 28, background: 'var(--surface)'
        }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#16A34A' }} />
          Powered by Meta Demucs AI
        </div>

        {/* Heading */}
        <h1 style={{
          fontSize: 'clamp(36px, 7vw, 72px)',
          fontWeight: 600, letterSpacing: '-0.04em',
          lineHeight: 1.05, marginBottom: 20, maxWidth: 700, color: 'var(--text)'
        }}>
          Extract vocals from<br />any song or video
        </h1>

        <p style={{ fontSize: 17, color: 'var(--text2)', maxWidth: 420, lineHeight: 1.65, marginBottom: 48 }}>
          Upload a track or video. Get clean isolated vocals and a full instrumental in minutes.
        </p>

        {/* Upload zone */}
        <div ref={uploadRef} style={{ width: '100%', maxWidth: 480 }}>
          <div
            onDrop={onDrop}
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onClick={() => !file && inputRef.current?.click()}
            style={{
              border: `1.5px dashed ${dragging ? '#18181B' : file ? '#16A34A' : 'var(--border2)'}`,
              borderRadius: 16, padding: '40px 28px',
              background: dragging ? '#18181B08' : file ? '#F0FDF4' : 'var(--surface)',
              cursor: file ? 'default' : 'pointer',
              transition: 'all 0.2s ease', marginBottom: 12, textAlign: 'center'
            }}
          >
            <input ref={inputRef} type="file"
              accept=".mp3,.wav,.mp4,.mov,.avi,.webm"
              style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
            />

            {!file ? (
              <>
                {/* Waveform icon */}
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 3, height: 36, marginBottom: 16 }}>
                  {[3,5,7,9,6,8,10,7,5,8,6,9,4].map((h, i) => (
                    <div key={i} className="wave-bar" style={{
                      width: 3, height: h * 3, background: '#D4D4D4', borderRadius: 2,
                      animationDelay: `${i * 0.08}s`, animationDuration: `${0.8 + (i % 3) * 0.2}s`
                    }} />
                  ))}
                </div>
                <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)', marginBottom: 4 }}>
                  {dragging ? 'Drop it here' : 'Drop your file here'}
                </p>
                <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 16 }}>or click to browse</p>
                <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
                  {['MP3', 'WAV', 'MP4', 'MOV', 'AVI'].map(f => (
                    <span key={f} style={{
                      padding: '2px 8px', borderRadius: 4,
                      background: 'var(--surface2)', border: '1px solid var(--border)',
                      fontSize: 11, color: 'var(--text3)', fontWeight: 500
                    }}>{f}</span>
                  ))}
                  <span style={{
                    padding: '2px 8px', borderRadius: 4,
                    background: 'var(--surface2)', border: '1px solid var(--border)',
                    fontSize: 11, color: 'var(--text3)', fontWeight: 500
                  }}>Max {MAX_MB}MB</span>
                </div>
              </>
            ) : (
              <div>
                <div style={{
                  width: 48, height: 48, borderRadius: 12, margin: '0 auto 12px',
                  background: '#F0FDF4', border: '1px solid #BBF7D0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, color: '#16A34A', letterSpacing: 0.5
                }}>{fileType === 'video' ? 'VID' : 'AUD'}</div>
                <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 2, color: 'var(--text)' }}>
                  {file.name.length > 40 ? file.name.slice(0, 37) + '...' : file.name}
                </p>
                <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 12 }}>{formatSize(file.size)}</p>
                <button onClick={e => { e.stopPropagation(); setFile(null); setFileType(null); setError('') }}
                  style={{ padding: '4px 12px', borderRadius: 6, fontSize: 12, background: 'transparent', border: '1px solid var(--border2)', color: 'var(--text2)', cursor: 'pointer' }}>
                  Remove
                </button>
              </div>
            )}
          </div>

          {error && (
            <div style={{
              padding: '10px 14px', borderRadius: 8, marginBottom: 12,
              background: '#FEF2F2', border: '1px solid #FECACA',
              color: '#DC2626', fontSize: 13
            }}>{error}</div>
          )}

          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            style={{
              width: '100%', padding: '13px', borderRadius: 12, fontSize: 14, fontWeight: 500,
              background: (!file || uploading) ? 'var(--surface2)' : 'var(--accent)',
              border: (!file || uploading) ? '1px solid var(--border)' : 'none',
              color: (!file || uploading) ? 'var(--text3)' : 'white',
              cursor: (!file || uploading) ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease'
            }}>
            {uploading ? 'Uploading...' : file ? `Extract stems from ${fileType}` : 'Choose a file to get started'}
          </button>

          <p style={{ textAlign: 'center', marginTop: 10, fontSize: 12, color: 'var(--text3)' }}>
            Free · No account needed · Results in ~2 min
          </p>
        </div>

        {/* Steps */}
        <div style={{ display: 'flex', gap: 6, marginTop: 48, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
          {['Upload file', 'AI separates stems', 'Download results'].map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 100,
                background: 'var(--surface)', border: '1px solid var(--border)',
                fontSize: 12, color: 'var(--text2)'
              }}>
                <span style={{
                  width: 18, height: 18, borderRadius: '50%',
                  background: 'var(--surface2)', border: '1px solid var(--border2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 600, color: 'var(--text2)'
                }}>{i + 1}</span>
                {s}
              </div>
              {i < 2 && <span style={{ color: 'var(--border2)', fontSize: 14 }}>-</span>}
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '80px 20px', borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12, textAlign: 'center' }}>What you get</p>
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 600, letterSpacing: '-0.03em', textAlign: 'center', marginBottom: 48 }}>
            Professional-grade separation
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            {features.map((f, i) => (
              <div key={i} style={{
                padding: '24px', borderRadius: 12,
                background: 'var(--bg)', border: '1px solid var(--border)',
                transition: 'border-color 0.2s'
              }}>
                <div style={{
                  display: 'inline-flex', padding: '4px 10px', borderRadius: 6, marginBottom: 12,
                  background: 'var(--surface2)', border: '1px solid var(--border)',
                  fontSize: 11, fontWeight: 600, color: 'var(--text2)', letterSpacing: '0.05em'
                }}>{f.label.toUpperCase()}</div>
                <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: '80px 20px' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12, textAlign: 'center' }}>How it works</p>
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 600, letterSpacing: '-0.03em', textAlign: 'center', marginBottom: 48 }}>
            Three steps
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { n: '01', title: 'Upload your file', desc: 'Drop any MP3, WAV, MP4, MOV or AVI file up to 200MB.' },
              { n: '02', title: 'AI processes it', desc: "Meta's Demucs neural network separates your audio into stems with studio precision." },
              { n: '03', title: 'Download stems', desc: 'Get vocals and instrumental as WAV. Video uploads also get MP4 output.' },
            ].map((s, i) => (
              <div key={i} style={{
                padding: '24px', borderRadius: 12, background: 'var(--surface)',
                border: '1px solid var(--border)', display: 'flex', gap: 20, alignItems: 'flex-start'
              }}>
                <span style={{ fontSize: 28, fontWeight: 600, color: 'var(--border2)', letterSpacing: '-0.04em', flexShrink: 0, lineHeight: 1, marginTop: 2 }}>{s.n}</span>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 500, marginBottom: 4, color: 'var(--text)' }}>{s.title}</p>
                  <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.6 }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section ref={aboutRef} style={{ padding: '80px 20px', borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12, textAlign: 'center' }}>About</p>
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 600, letterSpacing: '-0.03em', textAlign: 'center', marginBottom: 16 }}>
            Built for creators and engineers
          </h2>
          <p style={{ textAlign: 'center', color: 'var(--text2)', fontSize: 16, maxWidth: 520, margin: '0 auto 48px', lineHeight: 1.7 }}>
            Vocalify makes professional audio separation accessible to everyone — from karaoke to production.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 48 }}>
            {[
              { title: 'Meta Demucs AI', sub: 'State-of-the-art model', desc: 'The same neural network used by audio professionals worldwide.' },
              { title: 'Open source', sub: 'Transparent technology', desc: 'No black boxes. Powered by open-source AI you can inspect yourself.' },
              { title: 'No account needed', sub: 'Privacy first', desc: 'Upload, process, download. No sign-up, no tracking, files deleted after 5 min.' },
            ].map((t, i) => (
              <div key={i} style={{ padding: '24px', borderRadius: 12, background: 'var(--bg)', border: '1px solid var(--border)' }}>
                <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 2, color: 'var(--text)' }}>{t.title}</p>
                <p style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, fontWeight: 600 }}>{t.sub}</p>
                <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>{t.desc}</p>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
            {[
              { n: '4', l: 'Stem types' },
              { n: '200MB', l: 'Max file size' },
              { n: '100%', l: 'Free to use' },
              { n: '0', l: 'Accounts needed' },
            ].map((s, i) => (
              <div key={i} style={{ padding: '20px', borderRadius: 12, background: 'var(--bg)', border: '1px solid var(--border)', textAlign: 'center' }}>
                <p style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.04em', marginBottom: 4, color: 'var(--text)' }}>{s.n}</p>
                <p style={{ fontSize: 12, color: 'var(--text3)' }}>{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '80px 20px' }}>
        <div style={{
          maxWidth: 560, margin: '0 auto', textAlign: 'center',
          padding: '56px 32px', borderRadius: 20,
          background: 'var(--surface)', border: '1px solid var(--border)'
        }}>
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 600, letterSpacing: '-0.03em', marginBottom: 12 }}>
            Ready to extract?
          </h2>
          <p style={{ color: 'var(--text2)', marginBottom: 28, fontSize: 15, lineHeight: 1.6 }}>
            Drop your track or video and get professional stems back in minutes.
          </p>
          <button
            onClick={() => scrollTo(uploadRef)}
            style={{
              padding: '12px 32px', borderRadius: 10, fontSize: 14, fontWeight: 500,
              background: 'var(--accent)', border: 'none', color: 'white', cursor: 'pointer'
            }}>
            Start extracting
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '32px 20px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 24, height: 24, background: '#18181B', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5 }}>
              {[2,3,2,4,2].map((h, i) => (
                <div key={i} style={{ width: 2, height: h * 3, background: 'white', borderRadius: 1 }} />
              ))}
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Vocalify</span>
          </div>
          <div style={{ display: 'flex', gap: 24 }}>
            <button onClick={() => scrollTo(uploadRef)} style={{ background: 'none', border: 'none', fontSize: 13, color: 'var(--text3)', cursor: 'pointer' }}>Extract</button>
            <button onClick={() => scrollTo(aboutRef)} style={{ background: 'none', border: 'none', fontSize: 13, color: 'var(--text3)', cursor: 'pointer' }}>About</button>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text3)' }}>2026 Vocalify · Powered by Meta Demucs</p>
        </div>
      </footer>
    </div>
  )
}