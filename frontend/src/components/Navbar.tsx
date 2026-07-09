'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useState } from 'react'

interface NavbarProps {
  onUploadClick?: () => void
  onAboutClick?: () => void
}

export default function Navbar({ onUploadClick, onAboutClick }: NavbarProps) {
  const path = usePathname()
  const isHome = path === '/'
  const [visible, setVisible] = useState(true)
  const [lastY, setLastY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY
      if (currentY < 10) {
        setVisible(true)
      } else if (currentY > lastY) {
        setVisible(false) // scrolling down
      } else {
        setVisible(true)  // scrolling up
      }
      setLastY(currentY)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastY])

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
      height: 64,
      background: 'rgba(10,26,24,0.85)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center',
      padding: '0 28px',
      justifyContent: 'space-between',
      transform: visible ? 'translateY(0)' : 'translateY(-100%)',
      transition: 'transform 0.3s ease'
    }}>
      <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 30, height: 30,
          background: 'linear-gradient(135deg, #7FBDB5, #F6D69B)',
          borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2
        }}>
          {[2,4,3,5,2].map((h, i) => (
            <div key={i} style={{ width: 2.5, height: h * 3.5, background: '#0A1A18', borderRadius: 2 }} />
          ))}
        </div>
        <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.03em', fontFamily: 'Syne, sans-serif' }}>Vocalify</span>
      </Link>

      {isHome && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button onClick={onAboutClick} style={{
            padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500,
            background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer',
            transition: 'color 0.2s', fontFamily: 'Inter, sans-serif'
          }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}>
            About
          </button>
          <button onClick={onUploadClick} className="btn-primary" style={{
            padding: '8px 20px', borderRadius: 8, fontSize: 13, marginLeft: 4
          }}>
            Upload
          </button>
        </div>
      )}

      {!isHome && (
        <Link href="/" style={{ textDecoration: 'none' }}>
          <button className="btn-outline" style={{ padding: '7px 16px', borderRadius: 8, fontSize: 13 }}>
            Back
          </button>
        </Link>
      )}
    </nav>
  )
}