import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Menu, Bell, LogOut, Settings, Headset, Trash2 } from 'lucide-react'
import api from '../lib/api'

function NotificationItem({ n, markOneRead, deleteNotification }) {
  const [offset, setOffset] = useState(0)
  const [hover, setHover] = useState(false)
  const startX = useRef(null)

  const onTouchStart = (e) => { startX.current = e.touches[0].clientX }
  const onTouchMove = (e) => {
    if (startX.current === null) return
    const diff = e.touches[0].clientX - startX.current
    if (diff > 0) setOffset(Math.min(diff, 120))
    else setOffset(Math.max(diff, -20))
  }
  const onTouchEnd = () => {
    if (offset > 60) deleteNotification(n.id)
    else setOffset(0)
    startX.current = null
  }

  const onMouseDown = (e) => { startX.current = e.clientX }
  const onMouseMove = (e) => {
    if (startX.current === null) return
    const diff = e.clientX - startX.current
    if (diff > 0) setOffset(Math.min(diff, 120))
    else setOffset(Math.max(diff, -20))
  }
  const onMouseUp = () => {
    if (startX.current === null) return
    if (offset > 60) deleteNotification(n.id)
    else setOffset(0)
    startX.current = null
  }

  return (
    <div
      onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
      onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp}
      onMouseLeave={() => { onMouseUp(); setHover(false) }}
      onMouseEnter={() => setHover(true)}
      className="relative overflow-hidden"
      style={{ cursor: startX.current ? 'grabbing' : (n.link ? 'pointer' : 'default') }}
    >
      {/* Swipe-to-delete background */}
      <div className="absolute inset-0 bg-danger-soft flex items-center pl-5 text-danger-alt">
        <Trash2 size={18} />
      </div>

      {/* Notification row */}
      <div
        onClick={() => { if (offset === 0) markOneRead(n.id, n.link) }}
        className="relative flex gap-3 px-[18px] py-3 border-b border-slate-50 z-10"
        style={{
          background: hover && n.link ? '#f1f5f9' : (n.is_read ? '#fff' : '#f8faff'),
          transition: startX.current !== null ? 'none' : 'transform 0.2s',
          transform: `translateX(${offset}px)`,
        }}
      >
        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.is_read ? 'bg-transparent' : 'bg-brand'}`} />
        <div className="flex-1 min-w-0">
          <div className={`font-jakarta text-[13px] text-ink truncate ${n.is_read ? 'font-medium' : 'font-bold'}`}>
            {n.title}
          </div>
          <div className="font-inter text-xs text-ink-secondary mt-0.5 leading-4">{n.message}</div>
          <div className="font-inter text-[11px] text-ink-subtle mt-1">
            {new Date(n.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
        {hover && (
          <button
            onClick={(e) => { e.stopPropagation(); deleteNotification(n.id) }}
            className="bg-transparent border-none cursor-pointer text-danger-alt p-2 self-center"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </div>
  )
}

export default function Header({ onMenuClick }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [dropOpen, setDropOpen]           = useState(false)
  const [bellOpen, setBellOpen]           = useState(false)
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
    const id = setInterval(fetchNotifications, 30000)
    return () => clearInterval(id)
  }, [fetchNotifications])

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

  const deleteNotification = async (id) => {
    try {
      await api.delete(`/api/notifications/${id}`)
      setNotifications(n => n.filter(x => x.id !== id))
    } catch { /* silent */ }
  }

  const displayName = user?.full_name || 'Student'
  const initials    = displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <header className="w-full h-[72px] flex items-center justify-between px-4 sm:px-7 bg-white/95 backdrop-blur-[8px] [-webkit-backdrop-filter:blur(8px)] border-b border-slate-100 shadow-[0_1px_0_rgba(0,0,0,0.04)] shrink-0 z-[100]">

      {/* ── LEFT: Hamburger (mobile) + Logo ── */}
      <div className="flex items-center gap-3.5">
        {/* Hamburger — visible only on mobile */}
        <button
          onClick={onMenuClick}
          className="flex lg:hidden items-center justify-center p-2 rounded-lg bg-transparent border-none cursor-pointer hover:bg-slate-100 transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu size={24} className="text-ink-secondary" />
        </button>

        {/* Logo */}
        <div
          onClick={() => {
            if (user?.role === 'admin') navigate('/admin/dashboard')
            else if (user?.role === 'faculty') navigate('/faculty/dashboard')
            else navigate('/dashboard')
          }}
          className="flex items-center gap-2.5 cursor-pointer"
        >
          <img src="/images/snaplocate-icon.svg" alt="SnapLocate" className="w-[38px] h-[38px]" />
          <div>
            <div className="font-jakarta text-[15px] font-extrabold leading-[19px] text-ink">
              SnapLocate
            </div>
            <div className="font-jakarta text-[10px] font-bold leading-[13px] text-brand uppercase tracking-[0.08em]">
              {user?.role || 'user'} OS
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT: Bell + Divider + User info + Avatar ── */}
      <div className="flex items-center gap-4">

        {/* Bell + notification dropdown */}
        <div ref={bellRef} className="relative">
          <button
            aria-label="Notifications"
            onClick={() => setBellOpen(o => !o)}
            className="relative flex items-center p-2.5 rounded-[10px] bg-transparent border-none cursor-pointer hover:bg-slate-100 transition-colors"
          >
            <Bell size={20} className={bellOpen ? 'text-brand' : 'text-ink-secondary'} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-extrabold flex items-center justify-center border-2 border-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {bellOpen && (
            <div className="absolute top-12 right-0 bg-white border border-slate-100 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] w-[340px] z-[200] overflow-hidden">
              {/* Dropdown header */}
              <div className="flex justify-between items-center px-[18px] py-3.5 border-b border-slate-100">
                <span className="font-jakarta text-sm font-bold text-ink">
                  Notifications{' '}
                  {unreadCount > 0 && (
                    <span className="bg-brand-light text-brand rounded-md px-1.5 py-px text-[11px]">
                      {unreadCount}
                    </span>
                  )}
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="bg-transparent border-none cursor-pointer text-xs font-semibold text-brand font-jakarta"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {/* Notification list */}
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-9 text-center font-jakarta text-[13px] text-ink-subtle">
                    You're all caught up! 🎉
                  </div>
                ) : notifications.map(n => (
                  <NotificationItem key={n.id} n={n} markOneRead={markOneRead} deleteNotification={deleteNotification} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Vertical divider */}
        <div className="w-px h-8 bg-ink-border shrink-0" />

        {/* User name + role — hidden on very small screens */}
        <div className="hidden sm:flex flex-col items-end gap-0.5">
          <span className="font-jakarta text-sm font-bold leading-[18px] text-ink">{displayName}</span>
          <span className="font-jakarta text-xs font-medium leading-4 text-ink-secondary capitalize">{user?.role || 'User'}</span>
        </div>

        {/* Avatar + dropdown */}
        <div ref={dropRef} className="relative">
          <button
            id="header-avatar-btn"
            aria-label="Profile menu"
            onClick={() => setDropOpen(o => !o)}
            className="w-10 h-10 rounded-full overflow-hidden border-2 border-ink-border cursor-pointer p-0 shrink-0 bg-brand-light flex items-center justify-center"
          >
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt={displayName} className="w-full h-full object-cover block" />
            ) : (
              <span className="font-jakarta text-[13px] font-bold text-brand">{initials}</span>
            )}
          </button>

          {dropOpen && (
            <div className="absolute top-12 right-0 bg-white border border-slate-100 rounded-[14px] shadow-[0_8px_24px_rgba(0,0,0,0.10)] min-w-[180px] z-[100] overflow-hidden">
              {/* User info */}
              <div className="px-4 py-3 border-b border-slate-100">
                <div className="font-jakarta text-[13px] font-bold text-ink">{displayName}</div>
                <div className="font-inter text-xs text-ink-secondary mt-0.5">{user?.email}</div>
              </div>

              {/* Settings */}
              <button
                onClick={() => { setDropOpen(false); navigate(user?.role === 'admin' ? '/admin/settings' : user?.role === 'faculty' ? '/faculty/settings' : '/settings') }}
                className="w-full px-4 py-[11px] bg-transparent border-none text-left font-jakarta text-sm font-semibold text-ink-accent cursor-pointer flex items-center gap-2.5 hover:bg-surface transition-colors"
              >
                <Settings size={16} className="text-ink-secondary" /> Settings
              </button>

              {/* Support */}
              <button
                onClick={() => { setDropOpen(false); navigate('/support') }}
                className="w-full px-4 py-[11px] bg-transparent border-none text-left font-jakarta text-sm font-semibold text-ink-accent cursor-pointer flex items-center gap-2.5 hover:bg-surface transition-colors"
              >
                <Headset size={16} className="text-ink-secondary" /> Support
              </button>

              <div className="h-px bg-slate-100 my-1" />

              {/* Sign out */}
              <button
                id="logout-btn"
                onClick={handleLogout}
                className="w-full px-4 py-[11px] bg-transparent border-none text-left font-jakarta text-sm font-semibold text-danger cursor-pointer flex items-center gap-2.5 hover:bg-danger-light transition-colors"
              >
                <LogOut size={16} /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
