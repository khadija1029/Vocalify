'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

interface NavbarProps {
  onUploadClick?: () => void
  onAboutClick?: () => void
}

export default function Navbar({ onUploadClick, onAboutClick }: NavbarProps) {
  const path = usePathname()
  const isHome = path === '/'

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
      padding: '0 32px',
      background: 'rgba(8,10,15,0.85)',
      backdropFilter: 'blur(24px)',
      borderBottom: '1px solid var(--border)',
      height: '64px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between'
    }}>
      {/* Logo */}
      <Link href="/" style={{ textDecoration: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32,
            background: 'linear-gradient(135deg, #6C63FF, #22D3A0)',
            borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2
          }}>
            {[3,5,4,6,3].map((h, i) => (
              <div key={i} style={{ width: 3, height: h * 3, background: 'white', borderRadius: 2, opacity: 0.9 }} />
            ))}
          </div>
          <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 20, color: 'var(--text)', letterSpacing: '-0.5px' }}>
            Vocalify
          </span>
        </div>
      </Link>

      {/* Nav links — only on home */}
      {isHome && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button onClick={onUploadClick} style={{
            padding: '7px 16px', borderRadius: 8, fontSize: 14, fontWeight: 500,
            background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer',
            transition: 'color 0.2s'
          }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}>
            Extract
          </button>
          <button onClick={onAboutClick} style={{
            padding: '7px 16px', borderRadius: 8, fontSize: 14, fontWeight: 500,
            background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer',
            transition: 'color 0.2s'
          }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}>
            About
          </button>
          <button onClick={onUploadClick} style={{
            padding: '8px 20px', borderRadius: 8, fontSize: 14,
            background: 'linear-gradient(135deg, #6C63FF, #A78BFA)',
            border: 'none', color: 'white', cursor: 'pointer', fontFamily: 'Syne, sans-serif', fontWeight: 600,
            transition: 'all 0.2s ease', marginLeft: 4
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(108,99,255,0.35)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}>
            Upload
          </button>
        </div>
      )}

      {/* Back button on other pages */}
      {!isHome && (
        <Link href="/" style={{ textDecoration: 'none' }}>
          <button style={{
            padding: '8px 16px', borderRadius: 8, fontSize: 14,
            background: 'transparent', border: '1px solid var(--border)',
            color: 'var(--text)', cursor: 'pointer'
          }}>← Home</button>
        </Link>
      )}
    </nav>
  )
}