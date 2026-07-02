import { NavLink, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../lib/api'
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  DoorOpen,
  FileStack,
  Briefcase,
  CalendarDays,
  ShoppingCart,
  Search,
  Users2,
  Store,
  Wifi,
  LifeBuoy,
  IdCard,
  Inbox,
  ShieldCheck,
  Map,
  MessageSquare,
  Contact,
  Router,
  ShoppingBag,
  PackageSearch,
  Megaphone,
  ScrollText,
  Clock,
  BookOpen,
  Upload,
  FileQuestion,
  FolderOpen,
  Settings,
  Headset,
  LogOut,
} from 'lucide-react'

const studentNav = [
  { section: 'Overview' },
  { label: 'Dashboard',  path: '/dashboard',  icon: LayoutDashboard },

  { section: 'Academic' },
  { label: 'Classroom',  path: '/classroom',  icon: DoorOpen },
  { label: 'Work-Space', path: '/workspace',  icon: Briefcase },
  { label: 'Calendar',   path: '/calendar',   icon: CalendarDays },
  { label: 'Resources',  path: '/resources',  icon: FileStack },
  { label: 'My Requests',path: '/requests',   icon: ClipboardList },
  { label: 'Professor',  path: '/professors', icon: Users },

  { section: 'Campus Life' },
  { label: 'Market-Place',   path: '/marketplace',    icon: ShoppingCart },
  { label: 'Lost & Found',   path: '/lost-found',     icon: Search },
  { label: 'Society',        path: '/society',        icon: Users2 },
  { label: 'Shops',          path: '/shops',          icon: Store },
  { label: 'Wi-Fi',          path: '/wifi',           icon: Wifi },
  { label: 'Campus-Support', path: '/campus-support', icon: LifeBuoy },
]

const facultyNav = [
  { section: 'Overview' },
  { label: 'Dashboard', path: '/faculty/dashboard', icon: LayoutDashboard },
  { label: 'My Workspace', path: '/faculty/workspace', icon: Briefcase },

  { section: 'Teaching' },
  { label: 'My Profile', path: '/faculty/profile', icon: IdCard },
  { label: 'Office Hours', path: '/faculty/office-hours', icon: Clock },
  { label: 'Student Req', path: '/faculty/requests', icon: Inbox },

  { section: 'Campus' },
  { label: 'Professors', path: '/professors', icon: Users },
  { label: 'Classroom', path: '/classroom', icon: DoorOpen },
  { label: 'Resources', path: '/resources', icon: FileStack },
  { label: 'Calendar', path: '/faculty/calendar', icon: CalendarDays },
  { label: 'Market-Place', path: '/marketplace', icon: ShoppingCart },
  { label: 'Lost & Found', path: '/lost-found', icon: Search },
  { label: 'Society', path: '/society', icon: Users2 },
  { label: 'Shops', path: '/shops', icon: Store },
  { label: 'Wi-Fi', path: '/wifi', icon: Wifi },
  { label: 'Campus-Support', path: '/campus-support', icon: LifeBuoy },
]

const adminNav = [
  { section: 'Overview' },
  { label: 'Admin Dashboard', path: '/admin/dashboard', icon: ShieldCheck },

  { section: 'People' },
  { label: 'User Management', path: '/admin/users', icon: Users },

  { section: 'Campus' },
  { label: 'Classrooms', path: '/admin/classrooms', icon: Map },
  { label: 'Calendar', path: '/admin/calendar', icon: CalendarDays },
  { label: 'Shops', path: '/admin/shops', icon: Store },
  { label: 'Societies', path: '/admin/societies', icon: Users2 },
  { label: 'Wi-Fi Hub', path: '/admin/wifi', icon: Router },

  { section: 'Moderation' },
  { label: 'Marketplace', path: '/admin/marketplace', icon: ShoppingBag },
  { label: 'Lost & Found', path: '/admin/lost-found', icon: PackageSearch },
  { label: 'Resources', path: '/admin/resources', icon: FileStack },
  { label: 'Requests', path: '/admin/requests', icon: ClipboardList },

  { section: 'Support' },
  { label: 'Support Tickets', path: '/admin/support', icon: MessageSquare },
  { label: 'Support Contacts', path: '/admin/support-contacts', icon: Contact },
  { label: 'Broadcast', path: '/admin/broadcast', icon: Megaphone },

  { section: 'LMS & Academic' },
  { label: 'Courses (Moodle)', path: '/admin/lms/courses', icon: BookOpen },
  { label: 'LMS Structure', path: '/admin/lms/structure', icon: LayoutDashboard },
  { label: 'Bulk Upload', path: '/admin/lms/bulk', icon: Upload },

  { section: 'System' },
  { label: 'Audit Log', path: '/admin/audit-log', icon: ScrollText },
]


function NavRow({ label, path, icon: Icon, count }) {
  return (
    <NavLink to={path} end className="block no-underline rounded-lg">
      {({ isActive }) => (
        <div className={`flex items-center justify-between gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-all duration-150 ${
          isActive ? 'bg-[rgba(79,70,229,0.08)]' : 'hover:bg-surface-muted'
        }`}>
          <div className="flex items-center gap-2.5">
            <span className={`w-5 h-5 flex items-center justify-center shrink-0 ${isActive ? 'text-brand' : 'text-ink-secondary'}`}>
              <Icon size={17} strokeWidth={isActive ? 2.5 : 2} />
            </span>
            <span className={`font-jakarta text-[13px] leading-4 ${isActive ? 'text-brand font-semibold' : 'text-ink-secondary font-medium'}`}>
              {label}
            </span>
          </div>
          {count > 0 && (
            <div className="bg-red-500 text-white font-inter text-[10px] font-bold px-1.5 py-0.5 rounded-[10px] min-w-[18px] text-center">
              {count}
            </div>
          )}
        </div>
      )}
    </NavLink>
  )
}

export default function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [reqCount, setReqCount] = useState(0)

  useEffect(() => {
    if (!user || user.role === 'admin') return
    const isFaculty = user.role === 'faculty'
    const endpoint = isFaculty ? '/api/requests/faculty' : '/api/requests'

    api.get(endpoint).then(res => {
      const data = res.data?.data || res.data || []
      const count = data.filter(r => r.status === 'pending').length
      setReqCount(count)
    }).catch(err => console.error('Sidebar fetch requests err:', err))
  }, [user])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <>
      {/* Mobile overlay — backdrop behind open sidebar, hidden on desktop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-[998] lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 w-60 z-[999]
        flex flex-col shrink-0
        bg-surface-card/90 backdrop-blur-[10px] [-webkit-backdrop-filter:blur(10px)]
        border-r border-ink-border
        shadow-[4px_0_16px_rgba(136,136,136,0.06)]
        overflow-y-auto
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:static lg:inset-auto lg:h-full lg:translate-x-0
      `}>

        {/* Mobile-only header row inside sidebar — mirrors the top Header logo */}
        <div className="flex lg:hidden items-center justify-between px-5 pt-5 pb-4">
          <div className="flex items-center gap-2.5">
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
          <button
            onClick={onClose}
            className="bg-transparent border-none cursor-pointer text-2xl leading-none text-ink-secondary hover:text-ink transition-colors"
            aria-label="Close navigation menu"
          >
            ×
          </button>
        </div>

        {/* ── Main nav ── */}
        <nav
          className="flex-1 p-3 pt-3 pb-1 flex flex-col gap-0.5 overflow-y-auto"
          role="navigation"
          aria-label="Main navigation"
        >
          {(user?.role === 'admin' ? adminNav : user?.role === 'faculty' ? facultyNav : studentNav)
            .map((item, idx) => {
              if (item.section) {
                return (
                  <div
                    key={`section-${idx}`}
                    className={`px-3 pb-0.5 text-[10px] font-extrabold text-ink-subtle uppercase tracking-[0.08em] ${idx === 0 ? 'pt-2.5' : 'pt-4'}`}
                  >
                    {item.section}
                  </div>
                )
              }
              const isRequests = item.path === '/requests' || item.path === '/faculty/requests'
              return (
                <div key={item.path} onClick={() => { if (window.innerWidth <= 1024) onClose() }}>
                  <NavRow {...item} count={isRequests ? reqCount : undefined} />
                </div>
              )
            })}
        </nav>

        {/* ── Bottom: Settings + Logout (admin only — student/faculty use the profile-avatar menu) ── */}
        {user?.role === 'admin' && (
          <div className="p-3 pb-6 flex flex-col gap-0.5 border-t border-ink-border">
            <div onClick={() => { if (window.innerWidth <= 1024) onClose() }}>
              <NavLink to="/admin/settings" end className="block no-underline rounded-lg">
                {({ isActive }) => (
                  <div className={`flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-all duration-150 ${isActive ? 'bg-[rgba(79,70,229,0.08)]' : 'hover:bg-surface-muted'}`}>
                    <span className={`w-5 h-5 flex items-center justify-center shrink-0 ${isActive ? 'text-brand' : 'text-ink-secondary'}`}>
                      <Settings size={17} strokeWidth={isActive ? 2.5 : 2} />
                    </span>
                    <span className={`font-jakarta text-[13px] leading-4 ${isActive ? 'text-brand font-semibold' : 'text-ink-secondary font-medium'}`}>Settings</span>
                  </div>
                )}
              </NavLink>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-all duration-150 hover:bg-red-50 bg-transparent border-none w-full text-left"
            >
              <span className="w-5 h-5 flex items-center justify-center shrink-0 text-danger">
                <LogOut size={17} strokeWidth={2} />
              </span>
              <span className="font-jakarta text-[13px] leading-4 text-danger font-medium">Sign Out</span>
            </button>
          </div>
        )}
      </aside>
    </>
  )
}
