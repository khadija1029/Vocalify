import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Vocalify – AI Vocal Extractor',
  description: 'Separate vocals from any song in seconds using AI',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="noise">{children}</body>
    </html>
  )
}