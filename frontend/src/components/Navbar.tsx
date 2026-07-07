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
      height: 56,
      background: 'rgba(250,250,250,0.85)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center',
      padding: '0 24px',
      justifyContent: 'space-between'
    }}>
      <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 28, height: 28, background: '#18181B', borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2
        }}>
          {[2,4,3,5,2].map((h, i) => (
            <div key={i} style={{ width: 2.5, height: h * 3.5, background: 'white', borderRadius: 2 }} />
          ))}
        </div>
        <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.03em' }}>Vocalify</span>
      </Link>

      {isHome && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button onClick={onUploadClick} style={{
            padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500,
            background: 'transparent', border: 'none', color: 'var(--text2)', cursor: 'pointer'
          }}>Extract</button>
          <button onClick={onAboutClick} style={{
            padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500,
            background: 'transparent', border: 'none', color: 'var(--text2)', cursor: 'pointer'
          }}>About</button>
          <button onClick={onUploadClick} style={{
            padding: '6px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500,
            background: 'var(--accent)', border: 'none', color: 'white', cursor: 'pointer'
          }}>Try now</button>
        </div>
      )}

      {!isHome && (
        <Link href="/" style={{ textDecoration: 'none' }}>
          <button style={{
            padding: '6px 14px', borderRadius: 8, fontSize: 13,
            background: 'transparent', border: '1px solid var(--border2)',
            color: 'var(--text)', cursor: 'pointer'
          }}>Back</button>
        </Link>
      )}
    </nav>
  )
}