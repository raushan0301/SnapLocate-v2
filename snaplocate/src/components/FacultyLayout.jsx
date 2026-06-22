import { useState } from 'react'
import FacultyHeader from './FacultyHeader'
import FacultySidebar from './FacultySidebar'

const HEADER_H = 72

export default function FacultyLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100dvh', width: '100vw',
      overflow: 'hidden', background: '#f8fafc',
    }}>
      <FacultyHeader onMenuClick={() => setSidebarOpen(true)} />

      <div style={{ 
        display: 'flex', 
        flex: 1, 
        height: `calc(100dvh - ${HEADER_H}px)`, 
        overflow: 'hidden',
        position: 'relative'
      }}>
        <FacultySidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main style={{
          flex: 1, overflowY: 'auto',
          padding: '24px 24px 40px',
          display: 'flex', flexDirection: 'column', gap: 24,
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
