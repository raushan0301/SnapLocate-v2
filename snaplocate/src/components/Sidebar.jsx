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
  GraduationCap,
  ShoppingBag,
  PackageSearch,
  Megaphone,
  ScrollText,
  Clock,
  BookOpen,
  BarChart2,
  CalendarCheck,
  Upload,
  FileQuestion,
  FolderOpen,
} from 'lucide-react'

const studentNav = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Professor', path: '/professors', icon: Users },
  { label: 'My Requests', path: '/requests', icon: ClipboardList },
  { label: 'Classroom', path: '/classroom', icon: DoorOpen },
  { label: 'Resources', path: '/resources', icon: FileStack },
  { label: 'Work-Space', path: '/workspace', icon: Briefcase },
  { label: 'Calendar', path: '/calendar', icon: CalendarDays },
  { label: 'Market-Place', path: '/marketplace', icon: ShoppingCart },
  { label: 'Lost & Found', path: '/lost-found', icon: Search },
  { label: 'Society', path: '/society', icon: Users2 },
  { label: 'Shops', path: '/shops', icon: Store },
  { label: 'Wi-Fi', path: '/wifi', icon: Wifi },
  { label: 'Campus-Support', path: '/campus-support', icon: LifeBuoy },

  // ── My Courses ───────────────────────────────
  //{ section: 'My Courses' },
  //{ label: 'LMS',              path: '/lms',                        icon: BookOpen },
  //{ label: 'Assignments',      path: '/lms/native/assignments',     icon: ClipboardList },
  //{ label: 'Grades',           path: '/lms/native/grades',          icon: BarChart2 },
  //{ label: 'Attendance',       path: '/lms/native/attendance',      icon: CalendarCheck },
  //{ label: 'PYQ Library',      path: '/lms/native/pyq',             icon: FolderOpen },
]

const facultyNav = [
  // ── Overview ─────────────────────────────────
  { section: 'Overview' },
  { label: 'Dashboard', path: '/faculty/dashboard', icon: LayoutDashboard },

  // ── Teaching ─────────────────────────────────
  { section: 'Teaching' },
  { label: 'My Profile', path: '/faculty/profile', icon: IdCard },
  { label: 'Office Hours', path: '/faculty/office-hours', icon: Clock },
  { label: 'Student Req', path: '/faculty/requests', icon: Inbox },
  // { label: 'My Students',    path: '/faculty/students',     icon: GraduationCap },
  //{ label: 'LMS Courses',           path: '/faculty/lms',                      icon: BookOpen },
  //{ label: 'Native Attendance',     path: '/faculty/lms/native/attendance',    icon: CalendarCheck },
  //{ label: 'Native Assignments',    path: '/faculty/lms/native/assignments',   icon: ClipboardList },
  //{ label: 'Native Quizzes',        path: '/faculty/lms/native/quizzes',       icon: FileQuestion },
  //{ label: 'PYQ Library',           path: '/lms/native/pyq',                   icon: FolderOpen },

  // ── Campus ───────────────────────────────────
  { section: 'Campus' },
  { label: 'Professors', path: '/professors', icon: Users },
  { label: 'Classroom', path: '/classroom', icon: DoorOpen },
  { label: 'Resources', path: '/resources', icon: FileStack },
  { label: 'My Workspace', path: '/faculty/workspace', icon: Briefcase },
  { label: 'Calendar', path: '/faculty/calendar', icon: CalendarDays },
  { label: 'Market-Place', path: '/marketplace', icon: ShoppingCart },
  { label: 'Lost & Found', path: '/lost-found', icon: Search },
  { label: 'Society', path: '/society', icon: Users2 },
  { label: 'Shops', path: '/shops', icon: Store },
  { label: 'Wi-Fi', path: '/wifi', icon: Wifi },
  { label: 'Campus-Support', path: '/campus-support', icon: LifeBuoy },

]

const adminNav = [
  // ── Overview ─────────────────────────────────
  { section: 'Overview' },
  { label: 'Admin Dashboard', path: '/admin/dashboard', icon: ShieldCheck },

  // ── People ───────────────────────────────────
  { section: 'People' },
  { label: 'User Management', path: '/admin/users', icon: Users },

  // ── Campus ───────────────────────────────────
  { section: 'Campus' },
  { label: 'Classrooms', path: '/admin/classrooms', icon: Map },
  { label: 'Calendar', path: '/admin/calendar', icon: CalendarDays },
  { label: 'Shops', path: '/admin/shops', icon: Store },
  { label: 'Societies', path: '/admin/societies', icon: Users2 },
  { label: 'Wi-Fi Hub', path: '/admin/wifi', icon: Router },

  // ── Moderation ───────────────────────────────
  { section: 'Moderation' },
  { label: 'Marketplace', path: '/admin/marketplace', icon: ShoppingBag },
  { label: 'Lost & Found', path: '/admin/lost-found', icon: PackageSearch },
  { label: 'Resources', path: '/admin/resources', icon: FileStack },
  { label: 'Requests', path: '/admin/requests', icon: ClipboardList },

  // ── Support ──────────────────────────────────
  { section: 'Support' },
  { label: 'Support Tickets', path: '/admin/support', icon: MessageSquare },
  { label: 'Support Contacts', path: '/admin/support-contacts', icon: Contact },
  { label: 'Broadcast', path: '/admin/broadcast', icon: Megaphone },

  // ── LMS & Academic ───────────────────────────
  { section: 'LMS & Academic' },
  { label: 'Courses (Moodle)', path: '/admin/lms/courses', icon: BookOpen },
  { label: 'LMS Structure', path: '/admin/lms/structure', icon: LayoutDashboard },
  { label: 'Bulk Upload', path: '/admin/lms/bulk', icon: Upload },

  // ── System ───────────────────────────────────
  { section: 'System' },
  { label: 'Audit Log', path: '/admin/audit-log', icon: ScrollText },
]


function NavRow({ label, path, icon: Icon, count }) {
  return (
    <NavLink to={path} end style={{ display: 'block', textDecoration: 'none', borderRadius: 8 }}>
      {({ isActive }) => (
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'space-between',
            padding: '8px 12px', borderRadius: 8,
            background: isActive ? 'rgba(79,70,229,0.08)' : 'transparent',
            cursor: 'pointer', transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
          onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#f1f5f9' }}
          onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
          {count > 0 && (
            <div style={{
              background: '#ef4444', color: '#fff', fontSize: 10, fontWeight: 700,
              padding: '2px 6px', borderRadius: 10, minWidth: 18, textAlign: 'center',
              fontFamily: "'Inter', sans-serif"
            }}>
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
      // For both faculty and student, pending requests represent action items or wait states
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
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="mobile-overlay"
          onClick={onClose}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)',
            zIndex: 998, display: 'none'
          }}
        />
      )}

      <aside
        className={`sidebar ${isOpen ? 'open' : ''}`}
        style={{
          width: 240,
          flexShrink: 0,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(255,255,255,0.88)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderRight: '1px solid #f1f5f9',
          boxShadow: '4px 0 16px rgba(136,136,136,0.06)',
          overflowY: 'auto',
          transition: 'transform 0.3s ease, left 0.3s ease',
          zIndex: 999,
        }}
      >
        {/* Mobile Header in Sidebar */}
        <div className="mobile-only" style={{ padding: '20px 20px 0', justifyContent: 'space-between', alignItems: 'center', display: 'none' }}>
          <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, color: '#4f46e5' }}>MENU</span>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 24, color: '#64748b' }}>×</button>
        </div>

        {/* ── Main nav ────────────────────────────────────── */}
        <nav
          style={{
            flex: 1,
            padding: '12px 10px 4px',
            display: 'flex', flexDirection: 'column', gap: 2,
            overflowY: 'auto',
          }}
          role="navigation"
          aria-label="Main navigation"
        >
          {(user?.role === 'admin' ? adminNav : user?.role === 'faculty' ? facultyNav : studentNav)
            .map((item, idx) => {
              if (item.section) {
                return (
                  <div key={`section-${idx}`} style={{
                    padding: '10px 12px 3px',
                    fontSize: 10, fontWeight: 800, color: '#94a3b8',
                    textTransform: 'uppercase', letterSpacing: '0.08em',
                    marginTop: idx === 0 ? 0 : 6,
                  }}>
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


        <style>{`
          @media (max-width: 1024px) {
            .sidebar {
              position: fixed !important;
              left: -240px;
              top: 0;
              bottom: 0;
              transform: translateX(0);
            }
            .sidebar.open {
              left: 0;
            }
            .mobile-overlay { display: block !important; }
            .mobile-only { display: flex !important; }
          }
        `}</style>
      </aside>
    </>
  )
}
