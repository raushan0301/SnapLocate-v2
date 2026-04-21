import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Menu, Bell, LogOut, Settings, Headset } from 'lucide-react'
import api from '../lib/api'

/**
 * Header — full-width, uses exact Figma-exported SVG assets.
 * Now connected to AuthContext: shows real user name and avatar,
 * and has a dropdown with a Logout button.
 */
export default function Header({ onMenuClick }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [dropOpen, setDropOpen]       = useState(false)
  const [bellOpen, setBellOpen]       = useState(false)
  const [notifications, setNotifications] = useState([])
  const dropRef = useRef(null)
  const bellRef = useRef(null)

  const fetchNotifications = useCallback(async () => {
    if (!user) return
    try {
      const res = await api.get('/api/notifications')
      if (res.success) setNotifications(res.data || [])
    } catch { /* silent */ }
  }, [user])

  useEffect(() => {
    fetchNotifications()
    const id = setInterval(fetchNotifications, 30000) // poll every 30s
    return () => clearInterval(id)
  }, [fetchNotifications])

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false)
      if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const markAllRead = async () => {
    try {
      await api.patch('/api/notifications/read-all')
      setNotifications(n => n.map(x => ({ ...x, is_read: true })))
    } catch { /* silent */ }
  }

  const markOneRead = async (id, link) => {
    try {
      await api.patch(`/api/notifications/${id}/read`)
      setNotifications(n => n.map(x => x.id === id ? { ...x, is_read: true } : x))
    } catch { /* silent */ }
    if (link) { setBellOpen(false); navigate(link) }
  }

  const displayName  = user?.full_name || 'Student'
  const initials     = displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  const unreadCount  = notifications.filter(n => !n.is_read).length

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

      {/* ── LEFT: Logo + Mobile Menu ────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {/* Mobile menu toggle (visible < 1024px) */}
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

        <div 
          onClick={() => {
            if (user?.role === 'admin') navigate('/admin/dashboard')
            else if (user?.role === 'faculty') navigate('/faculty/dashboard')
            else navigate('/dashboard')
          }}
          style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
        >
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
            <div style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, fontWeight: 700, lineHeight: '13px',
              color: '#4f46e5', letterSpacing: '0.08em', textTransform: 'uppercase'
            }}>
              {user?.role || 'user'} OS
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .mobile-only { display: flex !important; }
        }
      `}</style>

      {/* ── RIGHT: Bell + Divider + User + Avatar ────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>

        {/* Bell + notification dropdown */}
        <div ref={bellRef} style={{ position: 'relative' }}>
          <button
            aria-label="Notifications"
            onClick={() => setBellOpen(o => !o)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '10px', borderRadius: 10, display: 'flex', alignItems: 'center', position: 'relative' }}
            onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <Bell size={20} color={bellOpen ? '#4f46e5' : '#64748b'} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: 6, right: 6,
                width: 16, height: 16, borderRadius: 8,
                background: '#ef4444', color: '#fff',
                fontSize: 9, fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid #fff',
              }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {bellOpen && (
            <div style={{
              position: 'absolute', top: 48, right: 0,
              background: '#fff', border: '1px solid #f1f5f9',
              borderRadius: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              width: 340, zIndex: 200, overflow: 'hidden',
            }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                  Notifications {unreadCount > 0 && <span style={{ background: '#eef2ff', color: '#4f46e5', borderRadius: 6, padding: '1px 6px', fontSize: 11 }}>{unreadCount}</span>}
                </span>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#4f46e5', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Mark all read
                  </button>
                )}
              </div>

              {/* List */}
              <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '36px 0', textAlign: 'center', fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: '#94a3b8' }}>
                    You're all caught up! 🎉
                  </div>
                ) : notifications.map(n => (
                  <div
                    key={n.id}
                    onClick={() => markOneRead(n.id, n.link)}
                    style={{
                      display: 'flex', gap: 12, padding: '12px 18px',
                      cursor: n.link ? 'pointer' : 'default',
                      background: n.is_read ? 'transparent' : '#f8faff',
                      borderBottom: '1px solid #f8fafc',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => { if (n.link) e.currentTarget.style.background = '#f1f5f9' }}
                    onMouseLeave={e => { e.currentTarget.style.background = n.is_read ? 'transparent' : '#f8faff' }}
                  >
                    <div style={{ width: 8, height: 8, borderRadius: 4, background: n.is_read ? 'transparent' : '#4f46e5', marginTop: 6, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: n.is_read ? 500 : 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {n.title}
                      </div>
                      <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#64748b', marginTop: 2, lineHeight: '16px' }}>
                        {n.message}
                      </div>
                      <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                        {new Date(n.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 32, background: '#e2e8f0', flexShrink: 0 }} />

        {/* User name + role */}
        <div className="user-text" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
          <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, fontWeight: 700, lineHeight: '18px', color: '#0f172a' }}>
            {displayName}
          </span>
          <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, fontWeight: 500, lineHeight: '16px', color: '#64748b', textTransform: 'capitalize' }}>
            {user?.role || 'User'}
          </span>
        </div>

        {/* Avatar + dropdown */}
        <div ref={dropRef} style={{ position: 'relative' }}>
          <button
            id="header-avatar-btn"
            aria-label="Profile menu"
            onClick={() => setDropOpen(o => !o)}
            style={{
              width: 40, height: 40, borderRadius: 20,
              overflow: 'hidden', border: '2px solid #e2e8f0',
              cursor: 'pointer', padding: 0, flexShrink: 0, lineHeight: 0,
              background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            ) : (
              <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 700, color: '#4f46e5' }}>
                {initials}
              </span>
            )}
          </button>

          {/* Dropdown */}
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
              {/* Settings */}
              <button
                onClick={() => { setDropOpen(false); navigate(user?.role === 'admin' ? '/admin/settings' : user?.role === 'faculty' ? '/faculty/settings' : '/settings') }}
                style={{
                  width: '100%', padding: '11px 16px',
                  background: 'none', border: 'none', textAlign: 'left',
                  fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, fontWeight: 600,
                  color: '#334155', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <Settings size={16} color="#64748b" /> Settings
              </button>

              {/* Support */}
              <button
                onClick={() => { setDropOpen(false); navigate('/support') }}
                style={{
                  width: '100%', padding: '11px 16px',
                  background: 'none', border: 'none', textAlign: 'left',
                  fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, fontWeight: 600,
                  color: '#334155', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <Headset size={16} color="#64748b" /> Support
              </button>

              {/* Divider */}
              <div style={{ height: 1, background: '#f1f5f9', margin: '4px 0' }} />

              {/* Sign out */}
              <button
                id="logout-btn"
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
