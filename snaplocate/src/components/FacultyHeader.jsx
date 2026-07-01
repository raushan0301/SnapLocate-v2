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
    <header className="w-full h-[72px] flex items-center justify-between px-4 sm:px-7 bg-white/95 backdrop-blur-[8px] [-webkit-backdrop-filter:blur(8px)] border-b border-slate-100 shadow-[0_1px_0_rgba(0,0,0,0.04)] shrink-0 z-[100]">

      {/* LEFT: Hamburger (mobile) + Logo */}
      <div className="flex items-center gap-3.5">
        <button
          onClick={onMenuClick}
          className="flex lg:hidden items-center justify-center p-2 rounded-lg bg-transparent border-none cursor-pointer hover:bg-slate-100 transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu size={24} className="text-ink-secondary" />
        </button>

        <div className="flex items-center gap-2.5">
          <img src="/images/snaplocate-icon.svg" alt="SnapLocate" className="w-[38px] h-[38px]" />
          <div>
            <div className="font-jakarta text-[15px] font-extrabold leading-[19px] text-ink">SnapLocate</div>
            <div className="font-jakarta text-[10px] font-bold leading-[13px] text-brand uppercase tracking-[0.08em]">FACULTY OS</div>
          </div>
        </div>
      </div>

      {/* RIGHT: Bell + Divider + User + Avatar */}
      <div className="flex items-center gap-4">

        {/* Bell */}
        <button
          aria-label="Notifications"
          className="relative flex items-center p-2.5 rounded-[10px] bg-transparent border-none cursor-pointer hover:bg-slate-100 transition-colors"
        >
          <Bell size={20} className="text-ink-secondary" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-red-500 border-[1.5px] border-white" />
        </button>

        {/* Vertical divider */}
        <div className="w-px h-8 bg-ink-border shrink-0" />

        {/* Name + role — hidden on very small screens */}
        <div className="hidden sm:flex flex-col items-end gap-0.5">
          <span className="font-jakarta text-sm font-bold leading-[18px] text-ink">{displayName}</span>
          <span className="font-jakarta text-xs font-medium leading-4 text-ink-secondary">Faculty</span>
        </div>

        {/* Avatar + dropdown */}
        <div ref={dropRef} className="relative">
          <button
            id="faculty-header-avatar"
            onClick={() => setDropOpen(o => !o)}
            className="w-10 h-10 rounded-full overflow-hidden border-2 border-ink-border cursor-pointer p-0 shrink-0 bg-gradient-to-br from-brand to-purple-700 flex items-center justify-center"
          >
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt={displayName} className="w-full h-full object-cover block" />
            ) : (
              <span className="font-jakarta text-[13px] font-bold text-white">{initials}</span>
            )}
          </button>

          {dropOpen && (
            <div className="absolute top-12 right-0 bg-white border border-slate-100 rounded-[14px] shadow-[0_8px_24px_rgba(0,0,0,0.10)] min-w-[180px] z-[100] overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100">
                <div className="font-jakarta text-[13px] font-bold text-ink">{displayName}</div>
                <div className="font-inter text-xs text-ink-secondary mt-0.5">{user?.email}</div>
              </div>
              <button
                id="faculty-logout-btn"
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
