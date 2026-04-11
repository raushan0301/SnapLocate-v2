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
  LogOut 
} from 'lucide-react'

const mainNav = [
  { label: 'Dashboard',      path: '/faculty/dashboard', icon: LayoutDashboard },
  { label: 'Manage Profile', path: '/faculty/profile',   icon: IdCard },
  { label: 'Professor',      path: '/professors',        icon: Users },
  { label: 'Requests',       path: '/faculty/requests',  icon: Inbox },
  { label: 'Classroom',      path: '/classroom',         icon: DoorOpen },
  { label: 'Resources',      path: '/resources',         icon: FileStack },
  { label: 'Work-Space',     path: '/faculty/workspace', icon: Briefcase },
  { label: 'Calendar',       path: '/calendar',          icon: CalendarDays },
  { label: 'Market-Place',   path: '/marketplace',       icon: ShoppingCart },
  { label: 'Lost & Found',   path: '/lost-found',        icon: Search },
  { label: 'Society',        path: '/society',           icon: Users2 },
  { label: 'Shops',          path: '/shops',             icon: Store },
  { label: 'Wi-Fi',          path: '/wifi',              icon: Wifi },
  { label: 'Campus-Support', path: '/campus-support',    icon: LifeBuoy },
]

const bottomNav = [
  { label: 'Settings', path: '/settings', icon: Settings },
  { label: 'Support',  path: '/support',  icon: Headset },
]

function NavRow({ label, path, icon: Icon }) {
  return (
    <NavLink to={path} end style={{ display: 'block', textDecoration: 'none', borderRadius: 8 }}>
      {({ isActive }) => (
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 12px', borderRadius: 8,
            background: isActive ? 'rgba(79,70,229,0.08)' : 'transparent',
            cursor: 'pointer', transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
          onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#f1f5f9' }}
          onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
        >
          <span style={{ 
            width: 20, height: 20, 
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            color: isActive ? '#4f46e5' : '#64748b'
          }}>
            <Icon size={17} strokeWidth={isActive ? 2.5 : 2} />
          </span>
          <span style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 13, fontWeight: isActive ? 600 : 500,
            lineHeight: '16px', color: isActive ? '#4f46e5' : '#64748b',
          }}>
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

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          onClick={onClose}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)',
            zIndex: 998,
          }}
        />
      )}

      <aside 
        className={`faculty-sidebar ${isOpen ? 'open' : ''}`}
        style={{
          width: 240, flexShrink: 0, height: '100%',
          display: 'flex', flexDirection: 'column',
          background: 'rgba(255,255,255,0.88)',
          backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
          borderRight: '1px solid #f1f5f9',
          boxShadow: '4px 0 16px rgba(136,136,136,0.06)',
          overflowY: 'auto',
          transition: 'transform 0.3s ease, left 0.3s ease',
          zIndex: 999,
        }}
      >
        {/* Mobile Header in Sidebar */}
        <div style={{ padding: '20px 20px 0', justifyContent: 'space-between', alignItems: 'center', display: 'none' }} className="mobile-only">
          <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, color: '#4f46e5' }}>FACULTY MENU</span>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 24, color: '#64748b' }}>×</button>
        </div>

        <nav style={{ flex: 1, padding: '12px 10px 4px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
          {mainNav.map(item => (
            <div key={item.path} onClick={() => { if(window.innerWidth <= 1024) onClose() }}>
              <NavRow {...item} />
            </div>
          ))}
        </nav>

        {/* Settings + Support */}
        <div style={{ 
          padding: '12px 10px 24px', 
          display: 'flex', flexDirection: 'column',
          borderTop: '1px solid #e2e8f0',
          gap: 2
        }}>
          <div onClick={() => { if(window.innerWidth <= 1024) onClose() }}>
            <NavRow label="Settings" path="/settings" icon={Settings} />
          </div>

          <div onClick={() => { if(window.innerWidth <= 1024) onClose() }}>
            <NavRow label="Support" path="/support" icon={Headset} />
          </div>
        </div>

        <style>{`
          @media (max-width: 1024px) {
            .faculty-sidebar {
              position: fixed !important;
              left: -240px;
              top: 0;
              bottom: 0;
              transform: translateX(0);
            }
            .faculty-sidebar.open {
              left: 0;
            }
            .mobile-only { display: flex !important; }
          }
        `}</style>
      </aside>
    </>
  )
}
