import { useState } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'

const HEADER_H = 72 // px — matches Figma header height

export default function PageLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100dvh',
      width: '100vw',
      overflow: 'hidden',
      background: '#f8fafc',
    }}>

      {/* ── Full-width header (72px) ─────────────────────── */}
      <Header onMenuClick={() => setSidebarOpen(true)} />

      {/* ── Row below header: sidebar + scrollable content ─ */}
      <div style={{
        display: 'flex',
        flex: 1,
        height: `calc(100dvh - ${HEADER_H}px)`,
        overflow: 'hidden',
        position: 'relative',
      }}>

        {/* Sidebar — fills remaining height */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main content — scrollable */}
        <main style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px 24px 40px', // Slightly reduced padding for mobile
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
          minWidth: 0,
        }}>
          {children}
        </main>

      </div>
      
      <style>{`
        @media (max-width: 640px) {
          main {
            padding: 16px 16px 32px !important;
          }
        }
      `}</style>
    </div>
  )
}
