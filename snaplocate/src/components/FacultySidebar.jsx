import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard,
  IdCard,
  Users,
  Inbox,
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
  Settings,
  Headset,
  LogOut,
} from 'lucide-react'

const mainNav = [
  { label: 'Dashboard',      path: '/faculty/dashboard', icon: LayoutDashboard },
  { label: 'Work-Space',     path: '/faculty/workspace', icon: Briefcase },
  { label: 'Manage Profile', path: '/faculty/profile',   icon: IdCard },
  { label: 'Professor',      path: '/professors',        icon: Users },
  { label: 'Requests',       path: '/faculty/requests',  icon: Inbox },
  { label: 'Classroom',      path: '/classroom',         icon: DoorOpen },
  { label: 'Resources',      path: '/faculty/resources', icon: FileStack },
  { label: 'Calendar',       path: '/calendar',          icon: CalendarDays },
  { label: 'Market-Place',   path: '/marketplace',       icon: ShoppingCart },
  { label: 'Lost & Found',   path: '/lost-found',        icon: Search },
  { label: 'Society',        path: '/society',           icon: Users2 },
  { label: 'Shops',          path: '/shops',             icon: Store },
  { label: 'Wi-Fi',          path: '/wifi',              icon: Wifi },
  { label: 'Campus-Support', path: '/campus-support',    icon: LifeBuoy },
]

function NavRow({ label, path, icon: Icon }) {
  return (
    <NavLink to={path} end className="block no-underline rounded-lg">
      {({ isActive }) => (
        <div className={`flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-all duration-150 ${
          isActive ? 'bg-[rgba(79,70,229,0.08)]' : 'hover:bg-slate-100'
        }`}>
          <span className={`w-5 h-5 flex items-center justify-center shrink-0 ${isActive ? 'text-brand' : 'text-ink-secondary'}`}>
            <Icon size={17} strokeWidth={isActive ? 2.5 : 2} />
          </span>
          <span className={`font-jakarta text-[13px] leading-4 ${isActive ? 'text-brand font-semibold' : 'text-ink-secondary font-medium'}`}>
            {label}
          </span>
        </div>
      )}
    </NavLink>
  )
}

export default function FacultySidebar({ isOpen, onClose }) {
  const navigate = useNavigate()
  const { logout } = useAuth()

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-[998] lg:hidden"
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 w-60 z-[999]
        flex flex-col shrink-0
        bg-white/90 backdrop-blur-[10px] [-webkit-backdrop-filter:blur(10px)]
        border-r border-slate-100
        shadow-[4px_0_16px_rgba(136,136,136,0.06)]
        overflow-y-auto
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:static lg:inset-auto lg:h-full lg:translate-x-0
      `}>

        {/* Mobile-only header row */}
        <div className="flex lg:hidden items-center justify-between px-5 pt-5 pb-0">
          <span className="font-jakarta font-extrabold text-brand">FACULTY MENU</span>
          <button
            onClick={onClose}
            className="bg-transparent border-none cursor-pointer text-2xl leading-none text-ink-secondary hover:text-ink transition-colors"
          >
            ×
          </button>
        </div>

        {/* Main nav */}
        <nav className="flex-1 p-3 flex flex-col gap-0.5 overflow-y-auto">
          {mainNav.map(item => (
            <div key={item.path} onClick={() => { if (window.innerWidth <= 1024) onClose() }}>
              <NavRow {...item} />
            </div>
          ))}
        </nav>

        {/* Bottom: Settings + Support */}
        <div className="p-3 pb-6 flex flex-col gap-0.5 border-t border-ink-border">
          {[
            { label: 'Settings', path: '/settings', icon: Settings },
            { label: 'Support',  path: '/support',  icon: Headset },
          ].map(item => (
            <div key={item.path} onClick={() => { if (window.innerWidth <= 1024) onClose() }}>
              <NavRow {...item} />
            </div>
          ))}
        </div>
      </aside>
    </>
  )
}
