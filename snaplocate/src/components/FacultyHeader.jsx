import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Menu, Bell, LogOut } from 'lucide-react'

export default function FacultyHeader({ onMenuClick }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [dropOpen, setDropOpen] = useState(false)
  const dropRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = () => { logout(); navigate('/login', { replace: true }) }
  const displayName = user?.full_name || 'Faculty'
  const initials    = displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  return (
    <header style={{
      width: '100%', height: 72,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 28px',
      background: 'rgba(255,255,255,0.95)',
      backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
      borderBottom: '1px solid #f1f5f9',
      boxShadow: '0 1px 0 rgba(0,0,0,0.04)',
      flexShrink: 0, zIndex: 100,
    }}>

      {/* LEFT: Logo + FACULTY OS */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <button 
          onClick={onMenuClick}
          className="mobile-only"
          style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            padding: 8, borderRadius: 8, display: 'none', alignItems: 'center', justifyContent: 'center'
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <Menu size={24} color="#64748b" />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 2L3 6v4c0 4.4 3 8.3 7 9.3 4-1 7-4.9 7-9.3V6L10 2z" fill="white"/>
            </svg>
          </div>
          <div>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 15, fontWeight: 800, lineHeight: '19px', color: '#0f172a' }}>
              SnapLocate
            </div>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, fontWeight: 700, lineHeight: '13px', color: '#4f46e5', letterSpacing: '0.08em' }}>
              FACULTY OS
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .mobile-only { display: flex !important; }
        }
      `}</style>

      {/* RIGHT: Bell + Divider + User */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>

        {/* Bell */}
        <button
          aria-label="Notifications"
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '10px', borderRadius: 10, display: 'flex', alignItems: 'center', position: 'relative' }}
          onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <Bell size={20} color="#64748b" />
          {/* Red badge */}
          <span style={{
            position: 'absolute', top: 10, right: 10, width: 8, height: 8,
            borderRadius: '50%', background: '#ef4444', border: '1.5px solid white',
          }} />
        </button>

        {/* Divider */}
        <div style={{ width: 1, height: 32, background: '#e2e8f0', flexShrink: 0 }} />

        {/* Name + role */}
        <div className="user-text" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
          <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, fontWeight: 700, lineHeight: '18px', color: '#0f172a' }}>
            {displayName}
          </span>
          <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, fontWeight: 500, lineHeight: '16px', color: '#64748b' }}>
            Faculty
          </span>
        </div>

        {/* Avatar + dropdown */}
        <div ref={dropRef} style={{ position: 'relative' }}>
          <button
            id="faculty-header-avatar"
            onClick={() => setDropOpen(o => !o)}
            style={{
              width: 40, height: 40, borderRadius: 20, overflow: 'hidden',
              background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, border: '2px solid #e2e8f0', cursor: 'pointer', padding: 0,
            }}
          >
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            ) : (
              <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 700, color: '#fff' }}>{initials}</span>
            )}
          </button>

          {dropOpen && (
            <div style={{
              position: 'absolute', top: 48, right: 0,
              background: '#fff', border: '1px solid #f1f5f9',
              borderRadius: 14, boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
              minWidth: 180, zIndex: 100, overflow: 'hidden',
            }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{displayName}</div>
                <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#64748b', marginTop: 2 }}>{user?.email}</div>
              </div>
              <button
                id="faculty-logout-btn"
                onClick={handleLogout}
                style={{
                  width: '100%', padding: '11px 16px',
                  background: 'none', border: 'none', textAlign: 'left',
                  fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, fontWeight: 600,
                  color: '#dc2626', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <LogOut size={16} /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
      <style>{`
        @media (max-width: 640px) {
          .user-text { display: none !important; }
        }
      `}</style>
    </header>
  )
}
