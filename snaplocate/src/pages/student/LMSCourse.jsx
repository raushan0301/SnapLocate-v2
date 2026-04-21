import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  BookOpen, Megaphone, ClipboardList, BarChart2, CalendarCheck,
  ChevronDown, FileText, CheckCircle, AlertCircle,
  FolderOpen, ExternalLink, File, Link2, Users, TrendingUp, X,
  GraduationCap, Award, Clock,
} from 'lucide-react'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'

// ─── Style helper ────────────────────────────────────────────────
const pjs = (size, weight, lh, color) => ({
  fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: size, fontWeight: weight, lineHeight: lh, color,
})

// ─── Clean Moodle course display name ────────────────────────────
// "THEORY OF COMPUTATION-UCS701-2526EVESEM" → "Theory of Computation"
function cleanDisplayName(raw = '') {
  const s = raw
    .replace(/-\d{4}(?:EVE|ODD|EVEN)SEM\s*$/i, '')
    .replace(/-[A-Z]{2,5}\d{3,4}[A-Z0-9]*\s*$/i, '')
    .replace(/-\d{4}\s*$/i, '')
    .trim()
  return s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
}

function cleanCode(raw = '') {
  return raw.replace(/-\d{4}(?:EVE|ODD|EVEN)SEM$/i, '').trim()
}

// ─── Dept gradient map (mirrored from LMSDashboard) ──────────────
const DEPT_GRADIENTS = {
  CSE: 'linear-gradient(135deg, #1e1b4b 0%, #3730a3 50%, #4f46e5 100%)',
  ECE: 'linear-gradient(135deg, #065f46 0%, #059669 50%, #10b981 100%)',
  EEE: 'linear-gradient(135deg, #713f12 0%, #b45309 50%, #f59e0b 100%)',
  ME: 'linear-gradient(135deg, #1e3a5f 0%, #1d4ed8 50%, #3b82f6 100%)',
  CIVIL: 'linear-gradient(135deg, #1a1a2e 0%, #374151 50%, #6b7280 100%)',
  CHEM: 'linear-gradient(135deg, #4c0519 0%, #9f1239 50%, #e11d48 100%)',
  BIO: 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #16a34a 100%)',
  MATH: 'linear-gradient(135deg, #312e81 0%, #4338ca 50%, #6366f1 100%)',
  PHY: 'linear-gradient(135deg, #0c4a6e 0%, #0369a1 50%, #0ea5e9 100%)',
  MGMT: 'linear-gradient(135deg, #3b0764 0%, #6d28d9 50%, #8b5cf6 100%)',
  DEFAULT: 'linear-gradient(135deg, #0f172a 0%, #334155 50%, #475569 100%)',
}
function getDeptGrad(dept = '') {
  const u = dept.toUpperCase()
  if (u.includes('COMPUTER')) return DEPT_GRADIENTS.CSE
  if (u.includes('ELECTRONICS')) return DEPT_GRADIENTS.ECE
  if (u.includes('ELECTRICAL')) return DEPT_GRADIENTS.EEE
  if (u.includes('MECHANICAL')) return DEPT_GRADIENTS.ME
  if (u.includes('CIVIL')) return DEPT_GRADIENTS.CIVIL
  if (u.includes('CHEM')) return DEPT_GRADIENTS.CHEM
  if (u.includes('BIO')) return DEPT_GRADIENTS.BIO
  if (u.includes('MATH')) return DEPT_GRADIENTS.MATH
  if (u.includes('PHYSICS')) return DEPT_GRADIENTS.PHY
  if (u.includes('MANAGEMENT')) return DEPT_GRADIENTS.MGMT
  // Catch-all — always return a valid dark gradient
  return DEPT_GRADIENTS.DEFAULT
}

// ─── Due date chip ───────────────────────────────────────────────
function DueChip({ dueDate }) {
  if (!dueDate) return null
  const diff = new Date(dueDate).getTime() - Date.now()
  const days = Math.ceil(diff / 86400000)
  const overdue = days < 0
  const bg = overdue ? '#fee2e2' : days === 0 ? '#fef3c7' : '#f0fdf4'
  const color = overdue ? '#dc2626' : days === 0 ? '#d97706' : '#16a34a'
  const label = overdue ? 'Overdue' : days === 0 ? 'Due today' : days === 1 ? 'Due tomorrow' : `${days}d left`
  return (
    <span style={{ background: bg, color, borderRadius: 6, padding: '3px 10px', ...pjs(11, 700, '16px', color) }}>
      <Clock size={10} style={{ marginRight: 4, verticalAlign: 'middle' }} />{label}
    </span>
  )
}

// ─── Attendance badge ────────────────────────────────────────────
function AttBadge({ status }) {
  const map = {
    present: { bg: '#f0fdf4', color: '#16a34a', label: 'Present' },
    absent: { bg: '#fee2e2', color: '#dc2626', label: 'Absent' },
    late: { bg: '#fef3c7', color: '#d97706', label: 'Late' },
    excused: { bg: '#eff6ff', color: '#3b82f6', label: 'Excused' },
  }
  const s = map[status?.toLowerCase()] ?? map.absent
  return <span style={{ ...pjs(11, 700, '16px', s.color), background: s.bg, padding: '3px 12px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</span>
}

// ─── Empty state ─────────────────────────────────────────────────
function EmptyState({ Icon, title, sub }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 24px', gap: 12 }}>
      <div style={{ width: 64, height: 64, borderRadius: 20, background: '#f8fafc', border: '1.5px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={28} color="#cbd5e1" />
      </div>
      <div style={{ ...pjs(15, 600, '22px', '#94a3b8'), textAlign: 'center' }}>{title}</div>
      {sub && <div style={{ ...pjs(13, 400, '18px', '#cbd5e1'), textAlign: 'center', maxWidth: 280 }}>{sub}</div>}
    </div>
  )
}

// ─── Module icon map ─────────────────────────────────────────────
const moduleIcon = (type) => {
  switch (type) {
    case 'url': return { Icon: Link2, bg: '#f0fdf4', color: '#16a34a' }
    case 'resource': return { Icon: FileText, bg: '#fef3c7', color: '#d97706' }
    case 'page': return { Icon: File, bg: '#eef2ff', color: '#4f46e5' }
    case 'folder': return { Icon: FolderOpen, bg: '#fdf4ff', color: '#a855f7' }
    case 'folder_file': return { Icon: FileText, bg: '#fff7ed', color: '#ea580c' }
    default: return { Icon: File, bg: '#f8fafc', color: '#64748b' }
  }
}

// ─── API base URL (same env var the api.js client uses) ──────────────────────
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001'

// ─── Build the URL to open/download a material ───────────────────────────────
// PDFs open natively in browser — direct link works fine.
// All other files (PPTX, DOCX, ZIP…) go through the backend proxy so the
// browser gets a proper Content-Disposition filename instead of a random UUID.
function buildFileUrl(mat) {
  const rawUrl = mat.file_url || mat.external_url
  if (!rawUrl) return null

  // External/URL module: open directly (no proxy needed)
  if (mat.module_type === 'url') return rawUrl

  // Not an internal Moodle file? Open directly
  if (!rawUrl.includes('pluginfile.php')) return rawUrl

  // Detect if this is a PDF by extension or MIME hint in URL
  const title = (mat.title || '').toLowerCase()
  const isPdf = title.endsWith('.pdf') || rawUrl.toLowerCase().includes('.pdf')
  if (isPdf) return rawUrl  // Browser can render PDFs natively without proxy

  // Route everything else through proxy to get a proper filename and handle auth
  const fname = mat.title || 'download'
  const snapTok = localStorage.getItem('snaplocate_token') || ''
  const isPage = mat.module_type === 'page' || mat.module_type === 'label'
  const inlineParam = isPage ? '&inline=1' : ''
  return `${API_BASE}/api/lms/materials/file-proxy?url=${encodeURIComponent(rawUrl)}&filename=${encodeURIComponent(fname)}&snap_token=${encodeURIComponent(snapTok)}${inlineParam}`
}

// ─── Section accent colors ───────────────────────────────────────
const sectionColors = [
  { bg: '#eef2ff', border: '#c7d2fe', accent: '#4f46e5' },
  { bg: '#f0fdf4', border: '#bbf7d0', accent: '#16a34a' },
  { bg: '#fff7ed', border: '#fed7aa', accent: '#ea580c' },
  { bg: '#fdf4ff', border: '#f0abfc', accent: '#a855f7' },
  { bg: '#ecfeff', border: '#a5f3fc', accent: '#0891b2' },
  { bg: '#fffbeb', border: '#fde68a', accent: '#d97706' },
]

// ─── Tab config ──────────────────────────────────────────────────
const TABS = [
  { key: 'content', label: 'Content', Icon: FolderOpen },
  { key: 'announcements', label: 'Announcements', Icon: Megaphone },
  { key: 'assignments', label: 'Assignments', Icon: ClipboardList },
  { key: 'grades', label: 'Grades', Icon: BarChart2 },
  { key: 'attendance', label: 'Attendance', Icon: CalendarCheck },
]

// ═══════════════════════════════════════════════════════════════════
export default function LMSCourse() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('content')
  const [course, setCourse] = useState(null)
  const [announcements, setAnnouncements] = useState([])
  const [assignments, setAssignments] = useState([])
  const [materials, setMaterials] = useState([])
  const [grades, setGrades] = useState([])
  const [attendance, setAttendance] = useState([])
  const [loadingCourse, setLoadingCourse] = useState(true)
  const [loadingTab, setLoadingTab] = useState(false)
  const [collapsedSections, setCollapsedSections] = useState({})
  const [expandedFolders, setExpandedFolders] = useState({}) // track open folders
  const [viewHtmlModal, setViewHtmlModal] = useState({ open: false, title: '', src: '', description: '' })
  // Eagerly-loaded stat counts for the stats strip (always visible regardless of active tab)
  const [statCounts, setStatCounts] = useState({ materials: null, announcements: null, assignments: null })

  // Fetch course detail
  useEffect(() => {
    if (!id) return
    setLoadingCourse(true)
    api.get(`/api/lms/courses/${id}`)
      .then(res => {
        if (res.success) {
          const c = res.data
          setCourse(c)

          // ── Auto-Correction for Stale/Duplicate Records ──
          // If this record has no semester, but a "better" one exists (same code + semester), 
          // we should redirect the user to the correct record.
          if (!c.semester) {
            api.get('/api/lms/courses').then(allRes => {
              if (allRes.success) {
                const better = allRes.data
                  .map(e => e.courses || e)
                  .find(other =>
                    other.id !== c.id &&
                    (other.code === c.code || (c.code && other.code?.startsWith(c.code))) &&
                    other.semester
                  )
                if (better) {
                  console.log('Redirecting to better course record:', better.id)
                  navigate(`/lms/courses/${better.id}`, { replace: true })
                }
              }
            })
          }
        }
      })
      .finally(() => setLoadingCourse(false))
  }, [id])

  // Eagerly fetch stats (counts) on mount — runs once, independent of active tab
  useEffect(() => {
    if (!id) return
    Promise.allSettled([
      api.get(`/api/lms/materials?course_id=${id}`),
      api.get(`/api/lms/announcements?course_id=${id}`),
      api.get(`/api/lms/assignments?course_id=${id}`),
    ]).then(([matRes, annRes, asnRes]) => {
      const mats = matRes.status === 'fulfilled' && matRes.value?.success ? (matRes.value.data ?? []) : []
      const anns = annRes.status === 'fulfilled' && annRes.value?.success ? (annRes.value.data ?? []) : []
      const asns = asnRes.status === 'fulfilled' && asnRes.value?.success ? (asnRes.value.data ?? []) : []
      setStatCounts({ materials: mats.length, announcements: anns.length, assignments: asns.length })
      // Pre-populate the content/announcements/assignments state so switching is instant
      setMaterials(mats)
      setAnnouncements([...anns].sort((a, b) => {
        if (a.is_pinned && !b.is_pinned) return -1
        if (!a.is_pinned && b.is_pinned) return 1
        return new Date(b.created_at) - new Date(a.created_at)
      }))
      setAssignments(asns)
    })
  }, [id])

  // Fetch tab data (grades, attendance only — others are pre-loaded above)
  useEffect(() => {
    if (!id) return
    const fetchers = {
      content: null,   // pre-loaded on mount
      announcements: null,   // pre-loaded on mount
      assignments: null,   // pre-loaded on mount
      grades: () => api.get(`/api/lms/grades?course_id=${id}`).then(r => { if (r.success) setGrades(r.data ?? []) }),
      attendance: () => api.get(`/api/attendance?course_id=${id}`).then(r => {
        if (r.success) setAttendance([...(r.data ?? [])].sort((a, b) => new Date(b.date) - new Date(a.date)))
      }),
    }
    const fn = fetchers[activeTab]
    if (!fn) return   // already loaded
    setLoadingTab(true)
    fn().catch(() => { }).finally(() => setLoadingTab(false))
    // Scroll to top of page so hero is always visible when switching tabs
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [id, activeTab])

  // Group materials by section — with folder hierarchy
  const sections = (() => {
    const map = {}
    for (const mat of materials) {
      const key = mat.section_name || 'General'
      if (!map[key]) map[key] = { name: key, num: mat.section_num ?? 999, items: [] }
      map[key].items.push(mat)
    }

    // Within each section, build folder hierarchy:
    // folder_file items (description = '📁 FolderName') are nested under their parent folder
    for (const sec of Object.values(map)) {
      const foldersByName = {} // folderTitle → item (with _children)

      // First pass: index all folder items
      for (const item of sec.items) {
        if (item.module_type === 'folder') {
          foldersByName[item.title] = { ...item, _children: [] }
        }
      }

      // Second pass: assign folder_files to their parent
      for (const item of sec.items) {
        if (item.module_type === 'folder_file') {
          const parentName = (item.description || '').replace(/^📁\s*/, '').trim()
          if (foldersByName[parentName]) {
            foldersByName[parentName]._children.push(item)
          }
        }
      }

      // Third pass: rebuild the items list preserving original order,
      // replacing folder placeholders with enriched folder objects,
      // and dropping folder_file items (they appear under their parent folder)
      const seen = new Set()
      sec.items = sec.items
        .filter(item => {
          if (item.module_type === 'folder_file') return false // handled inside folder
          if (item.module_type === 'folder') {
            if (seen.has(item.title)) return false
            seen.add(item.title)
          }
          return true
        })
        .map(item => {
          if (item.module_type === 'folder' && foldersByName[item.title]) {
            return foldersByName[item.title] // enriched with _children
          }
          return item
        })
    }

    return Object.values(map).sort((a, b) => a.num - b.num)
  })()

  const toggleSection = (name) => setCollapsedSections(p => ({ ...p, [name]: !p[name] }))
  const toggleFolder = (folderId) => setExpandedFolders(p => ({ ...p, [folderId]: !p[folderId] }))

  // Attendance summary
  const attSummary = (() => {
    if (!attendance.length) return null
    const total = attendance.length
    const present = attendance.filter(a => a.status === 'present').length
    const late = attendance.filter(a => a.status === 'late').length
    const absent = attendance.filter(a => a.status === 'absent').length
    const pct = Math.round(((present + late * 0.5) / total) * 100)
    return { total, present, late, absent, pct }
  })()

  // Derived values
  const fp = course?.faculty_profiles
  const facultyName = fp?.users?.full_name
  const displayName = cleanDisplayName(course?.name || '')
  const displayCode = cleanCode(course?.code || '')
  const grad = getDeptGrad(course?.dept || '')
  const progress = course?.progress ?? 0

  // Tab badge counts — use pre-loaded statCounts for reliability
  const tabBadges = {
    announcements: statCounts.announcements ?? announcements.length,
    assignments: statCounts.assignments ?? assignments.length,
    grades: grades.length,
  }

  if (loadingCourse) return (
    <PageLayout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BookOpen size={22} color="#4f46e5" style={{ animation: 'pulse 1.5s ease-in-out infinite' }} />
          </div>
          <span style={pjs(14, 500, '20px', '#94a3b8')}>Loading course…</span>
        </div>
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </PageLayout>
  )

  if (!course) return (
    <PageLayout>
      <div style={{ padding: 40, textAlign: 'center' }}>
        <EmptyState Icon={AlertCircle} title="Course not found" sub="This course may have been removed or you don't have access." />
        <button onClick={() => navigate('/lms')} style={{ padding: '10px 24px', borderRadius: 12, background: '#4f46e5', border: 'none', cursor: 'pointer', ...pjs(14, 700, '20px', '#fff'), marginTop: 16 }}>
          Back to My Courses
        </button>
      </div>
    </PageLayout>
  )

  return (
    <PageLayout>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes spin   { to { transform: rotate(360deg) } }
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:0.5} }
        .lms-tab-btn:hover  { background: #f1f5f9 !important; }
        .lms-mat-row:hover  { background: #f8fafc !important; }
        .lms-asgn-card:hover { box-shadow: 0 8px 30px rgba(79,70,229,0.12) !important; transform: translateY(-2px) !important; }
        .lms-bc-link { color: #94a3b8 !important; text-decoration: none; transition: color 0.15s; }
        .lms-bc-link:hover { color: #4f46e5 !important; }
      `}</style>

      {/* ── Breadcrumb: Dashboard › My Courses › Course Name ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 22, flexWrap: 'wrap' }}>
        <Link to="/dashboard" className="lms-bc-link" style={pjs(13, 500, '18px', '#94a3b8')}>Dashboard</Link>
        <span style={{ color: '#e2e8f0', fontSize: 15, lineHeight: 1 }}>›</span>
        <Link to="/lms" className="lms-bc-link" style={pjs(13, 500, '18px', '#94a3b8')}>My Courses</Link>
        <span style={{ color: '#e2e8f0', fontSize: 15, lineHeight: 1 }}>›</span>
        <span style={{ ...pjs(13, 700, '18px', '#4f46e5') }}>{displayName || displayCode || 'Course'}</span>
      </div>

      {/* ── Hero Header Card ─────────────────────────────────── */}
      <div
        key={`hero-${id}`}
        style={{
          borderRadius: 24,
          overflow: 'hidden',
          marginBottom: 24,
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          background: '#fff', // Base background
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0, // CRITICAL: Prevent flex compression from content below
        }}
      >
        {/* Gradient banner */}
        <div style={{
          background: `${grad} #1e1b4b`, // Brute-force background with fallback
          padding: '40px 32px 32px',
          minHeight: 160,
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end'
        }}>
          {/* Decorative circles */}
          <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
          <div style={{ position: 'absolute', bottom: -30, right: 80, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />

          <div style={{ position: 'relative', zIndex: 2 }}>
            {/* Dept badge */}
            {course.dept && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(6px)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 8, padding: '4px 12px', marginBottom: 12,
              }}>
                <GraduationCap size={12} color="rgba(255,255,255,0.9)" />
                <span style={pjs(11, 700, '16px', 'rgba(255,255,255,0.9)')}>{course.dept.toUpperCase()}</span>
              </div>
            )}

            {/* Course name */}
            <h1 style={{ ...pjs(30, 800, '38px', '#fff'), margin: '0 0 8px', letterSpacing: '-0.02em' }}>
              {displayName || 'Loading...'}
            </h1>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ ...pjs(14, 600, '20px', 'rgba(255,255,255,0.7)') }}>{displayCode}</span>
              {course.semester && (
                <>
                  <span style={{ color: 'rgba(255,255,255,0.3)' }}>·</span>
                  <span style={pjs(14, 500, '20px', 'rgba(255,255,255,0.6)')}>{course.semester}</span>
                </>
              )}
              {facultyName && (
                <>
                  <span style={{ color: 'rgba(255,255,255,0.3)' }}>·</span>
                  <span style={pjs(14, 500, '20px', 'rgba(255,255,255,0.6)')}>
                    <Users size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />{facultyName}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div style={{
          background: '#fff',
          padding: '20px 32px',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          borderTop: '1px solid #f1f5f9',
          minHeight: 80
        }}>
          {[
            { label: 'Progress', value: `${progress}%`, icon: <TrendingUp size={15} color="#4f46e5" />, color: '#4f46e5' },
            { label: 'Assignments', value: statCounts.assignments != null ? statCounts.assignments : '…', icon: <ClipboardList size={15} color="#d97706" />, color: '#d97706' },
            { label: 'Materials', value: statCounts.materials != null ? statCounts.materials : '…', icon: <FolderOpen size={15} color="#16a34a" />, color: '#16a34a' },
            { label: 'Attendance', value: attSummary ? `${attSummary.pct}%` : '—', icon: <CalendarCheck size={15} color="#0891b2" />, color: '#0891b2' },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: 'center', padding: '4px 0', borderRight: i < 3 ? '1px solid #f1f5f9' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, marginBottom: 4 }}>
                {s.icon}
                <span style={pjs(11, 700, '16px', '#94a3b8')}>{s.label.toUpperCase()}</span>
              </div>
              <div style={{ ...pjs(22, 800, '28px', s.color) }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* ── Tabs Strip ──────────────────── */}
        <div style={{
          background: '#f8fafc',
          borderTop: '1px solid #f1f5f9',
          padding: '6px 12px',
          display: 'flex',
          gap: 6,
          overflowX: 'auto',
          minHeight: 52
        }}>
          {TABS.map(({ key, label, Icon }) => {
            const active = activeTab === key
            const badgeN = tabBadges[key]
            return (
              <button key={key} onClick={() => setActiveTab(key)}
                className="lms-tab-btn"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                  padding: '10px 18px', borderRadius: 12, border: 'none',
                  background: active ? '#4f46e5' : 'transparent',
                  cursor: 'pointer', whiteSpace: 'nowrap',
                  transition: 'background 0.2s, color 0.2s',
                  ...pjs(13, active ? 700 : 500, '18px', active ? '#fff' : '#64748b'),
                }}>
                <Icon size={14} />
                {label}
                {badgeN > 0 && (
                  <span style={{
                    ...pjs(10, 700, '14px', active ? '#4f46e5' : '#64748b'),
                    background: active ? '#fff' : '#f1f5f9',
                    borderRadius: 20, padding: '1px 6px', minWidth: 18, textAlign: 'center',
                  }}>{badgeN}</span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Tab Content ──────────────────────────────────────── */}
      <div>
        {loadingTab ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, border: '3px solid #e2e8f0', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <span style={pjs(13, 500, '18px', '#94a3b8')}>Loading…</span>
            </div>
          </div>
        ) : (
          <>
            {/* ── COURSE CONTENT ─────────────────────────────── */}
            {activeTab === 'content' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {sections.length === 0 && (
                  <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9' }}>
                    <EmptyState Icon={FolderOpen} title="No materials yet" sub="Course materials will appear here after syncing from Moodle." />
                  </div>
                )}
                {sections.map((sec, si) => {
                  const sc = sectionColors[si % sectionColors.length]
                  const isCollapsed = collapsedSections[sec.name]
                  return (
                    <div key={sec.name} style={{
                      background: '#fff', borderRadius: 16,
                      border: `1px solid #f1f5f9`, overflow: 'hidden',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                      transition: 'all 0.2s ease',
                    }}>
                      {/* Section header */}
                      <button onClick={() => toggleSection(sec.name)} style={{
                        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '16px 22px', background: sc.bg,
                        border: 'none', borderBottom: isCollapsed ? 'none' : `1px solid ${sc.border}`,
                        cursor: 'pointer',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 4, height: 18, borderRadius: 4, background: sc.accent }} />
                          <span style={pjs(14, 700, '20px', '#0f172a')}>{sec.name}</span>
                          <span style={{ ...pjs(11, 700, '14px', sc.accent), background: '#fff', padding: '2px 9px', borderRadius: 20, border: `1px solid ${sc.border}` }}>
                            {sec.items.length} {sec.items.length === 1 ? 'item' : 'items'}
                          </span>
                        </div>
                        <ChevronDown size={16} color={sc.accent} style={{ transform: isCollapsed ? 'rotate(-90deg)' : 'none', transition: 'transform 0.2s' }} />
                      </button>

                      {/* Section items */}
                      {!isCollapsed && (
                        <div>
                          {sec.items.map((mat, i) => {
                            const isFolder = mat.module_type === 'folder'
                            const isFolderOpen = expandedFolders[mat.id]
                            const mi = moduleIcon(mat.module_type)
                            const link = mat.file_url || mat.external_url

                            // ── FOLDER with nested children ──────────────────
                            if (isFolder && mat._children?.length > 0) {
                              return (
                                <div key={mat.id}>
                                  {/* Folder row — click to expand */}
                                  <div
                                    className="lms-mat-row"
                                    onClick={() => toggleFolder(mat.id)}
                                    style={{
                                      padding: '12px 20px',
                                      borderBottom: (!isFolderOpen && i < sec.items.length - 1) ? '1px solid #f8fafc' : 'none',
                                      display: 'flex', alignItems: 'center', gap: 14,
                                      cursor: 'pointer', transition: 'background 0.15s',
                                      background: isFolderOpen ? '#fdf4ff' : 'transparent',
                                    }}
                                  >
                                    <div style={{ width: 36, height: 36, borderRadius: 10, background: mi.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                      <mi.Icon size={16} color={mi.color} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div style={{ ...pjs(13, 700, '18px', '#0f172a'), overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mat.title}</div>
                                      <div style={{ ...pjs(11, 400, '16px', '#94a3b8'), marginTop: 2 }}>
                                        {mat._children.length} file{mat._children.length !== 1 ? 's' : ''} inside
                                      </div>
                                    </div>
                                    <span style={{ ...pjs(10, 600, '14px', '#a855f7'), textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0 }}>
                                      FOLDER
                                    </span>
                                    <div style={{
                                      width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      background: isFolderOpen ? '#a855f7' : '#f1f5f9',
                                      transition: 'all 0.2s',
                                    }}>
                                      <ChevronDown size={14} color={isFolderOpen ? '#fff' : '#64748b'} style={{ transform: isFolderOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                                    </div>
                                  </div>

                                  {/* Nested files — visible when folder is expanded */}
                                  {isFolderOpen && (
                                    <div style={{
                                      borderLeft: '3px solid #f0abfc',
                                      marginLeft: 32,
                                      background: 'linear-gradient(to right, #fdf4ff, #fff)',
                                      borderBottom: i < sec.items.length - 1 ? '1px solid #f8fafc' : 'none',
                                    }}>
                                      {mat._children.map((child, ci) => {
                                        const cmi = moduleIcon('folder_file')
                                        const clink = buildFileUrl(child)
                                        return (
                                          <div key={child.id} className="lms-mat-row" style={{
                                            padding: '10px 18px 10px 20px',
                                            borderBottom: ci < mat._children.length - 1 ? '1px solid #fce7ff' : 'none',
                                            display: 'flex', alignItems: 'center', gap: 12,
                                            transition: 'background 0.15s',
                                          }}>
                                            <div style={{ width: 30, height: 30, borderRadius: 8, background: cmi.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                              <cmi.Icon size={13} color={cmi.color} />
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                              <div style={{ ...pjs(12, 600, '17px', '#1e293b'), overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{child.title}</div>
                                            </div>
                                            <span style={{ ...pjs(9, 700, '14px', '#ea580c'), textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0 }}>FILE</span>
                                            {clink ? (
                                              <a href={clink} target="_blank" rel="noopener noreferrer" style={{
                                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                                padding: '5px 12px', borderRadius: 8, flexShrink: 0,
                                                background: '#fff7ed', color: '#ea580c', fontWeight: 700, fontSize: 11,
                                                textDecoration: 'none', fontFamily: "'Plus Jakarta Sans', sans-serif",
                                                border: '1px solid #fed7aa',
                                              }}>
                                                <ExternalLink size={11} /> Open
                                              </a>
                                            ) : (
                                              <span style={{ ...pjs(10, 500, '14px', '#cbd5e1'), flexShrink: 0 }}>No link</span>
                                            )}
                                          </div>
                                        )
                                      })}
                                    </div>
                                  )}
                                </div>
                              )
                            }

                            // ── Regular item (resource / url / page / label) ─
                            const mi2 = moduleIcon(mat.module_type)
                            const lnk = buildFileUrl(mat)
                            return (
                              <div key={mat.id} className="lms-mat-row" style={{
                                padding: '12px 20px',
                                borderBottom: i < sec.items.length - 1 ? '1px solid #f8fafc' : 'none',
                                display: 'flex', alignItems: 'center', gap: 14,
                                transition: 'background 0.15s',
                              }}>
                                <div style={{ width: 36, height: 36, borderRadius: 10, background: mi2.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                  <mi2.Icon size={16} color={mi2.color} />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ ...pjs(13, 600, '18px', '#0f172a'), overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mat.title}</div>
                                  {mat.description && (
                                    <div 
                                      style={{ ...pjs(11, 400, '16px', '#94a3b8'), overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}
                                      dangerouslySetInnerHTML={{ __html: mat.description.replace(/<[^>]+>/g, ' ').slice(0, 150) }}
                                    />
                                  )}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                                  <div style={{ ...pjs(10, 700, '1', '#94a3b8'), textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    {mat.module_type}
                                  </div>
                                  {mat.module_type === 'page' || mat.module_type === 'label' ? (
                                    (!lnk || lnk.includes('file-proxy')) ? (
                                      <button onClick={() => setViewHtmlModal({ open: true, title: mat.title, src: lnk && lnk.includes('file-proxy') ? lnk : null, description: mat.description })} style={{
                                          display: 'flex', alignItems: 'center', gap: 6,
                                          padding: '8px 16px', background: '#eef2ff', color: '#4f46e5',
                                          borderRadius: 10, border: 'none', cursor: 'pointer', ...pjs(13, 600, '1')
                                        }}>
                                        <FileText size={16} /> View
                                      </button>
                                    ) : (
                                      <a href={lnk} target="_blank" rel="noreferrer" style={{
                                        display: 'flex', alignItems: 'center', gap: 6,
                                        padding: '8px 16px', background: '#eef2ff', color: '#4f46e5',
                                        borderRadius: 10, textDecoration: 'none', ...pjs(13, 600, '1')
                                      }}>
                                        <ExternalLink size={16} /> Open
                                      </a>
                                    )
                                  ) : (
                                    <a href={lnk} target="_blank" rel="noreferrer" style={{
                                      display: 'flex', alignItems: 'center', gap: 6,
                                      padding: '8px 16px', background: '#eef2ff', color: '#4f46e5',
                                      borderRadius: 10, textDecoration: 'none', ...pjs(13, 600, '1')
                                    }}>
                                      <ExternalLink size={16} /> Open
                                    </a>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* ── ANNOUNCEMENTS ──────────────────────────────── */}
            {activeTab === 'announcements' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {announcements.length === 0 && (
                  <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9' }}>
                    <EmptyState Icon={Megaphone} title="No announcements" sub="Your instructor hasn't posted any announcements yet." />
                  </div>
                )}
                {announcements.map(ann => (
                  <div key={ann.id} style={{
                    background: '#fff', borderRadius: 16,
                    border: ann.is_pinned ? '1.5px solid #fde68a' : '1px solid #f1f5f9',
                    padding: '18px 22px',
                    boxShadow: ann.is_pinned ? '0 4px 16px rgba(217,119,6,0.08)' : '0 2px 8px rgba(0,0,0,0.03)',
                    transition: 'all 0.25s ease',
                    cursor: 'default',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                      <div style={{
                        width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                        background: ann.is_pinned ? '#fffbeb' : '#eef2ff',
                        border: `1px solid ${ann.is_pinned ? '#fde68a' : '#c7d2fe'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Megaphone size={16} color={ann.is_pinned ? '#d97706' : '#4f46e5'} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                          <span style={pjs(15, 700, '20px', '#0f172a')}>{ann.title}</span>
                          {ann.is_pinned && (
                            <span style={{ ...pjs(10, 700, '14px', '#d97706'), background: '#fef3c7', padding: '2px 8px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.06em' }}>📌 Pinned</span>
                          )}
                        </div>
                        <p style={{ ...pjs(13, 400, '20px', '#475569'), margin: '0 0 10px' }}>{ann.message}</p>
                        {/* Use posted_at (real Moodle time) with created_at as fallback */}
                        {(ann.posted_at || ann.created_at) && (
                          <span style={{ ...pjs(11, 500, '16px', '#94a3b8'), display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Clock size={11} />
                            {new Date(ann.posted_at || ann.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── ASSIGNMENTS ────────────────────────────────── */}
            {activeTab === 'assignments' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {assignments.length === 0 && (
                  <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9' }}>
                    <EmptyState Icon={ClipboardList} title="No assignments" sub="Assignments posted by your instructor will appear here." />
                  </div>
                )}
                {assignments.map(asgn => (
                  <Link key={asgn.id} to={`/lms/assignments/${asgn.id}`} style={{ textDecoration: 'none' }}>
                    <div className="lms-asgn-card" style={{
                      background: '#fff', borderRadius: 16,
                      border: '1px solid #f1f5f9', padding: '18px 22px',
                      cursor: 'pointer', transition: 'all 0.25s ease',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                      display: 'flex', alignItems: 'center', gap: 16,
                    }}>
                      <div style={{ width: 42, height: 42, borderRadius: 12, background: '#fffbeb', border: '1px solid #fde68a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <FileText size={18} color="#d97706" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 5 }}>
                          <span style={pjs(15, 700, '20px', '#0f172a')}>{asgn.title}</span>
                          <DueChip dueDate={asgn.due_date} />
                          {asgn.my_submission && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, ...pjs(11, 700, '16px', '#16a34a'), background: '#f0fdf4', padding: '3px 10px', borderRadius: 20 }}>
                              <CheckCircle size={11} /> Submitted
                            </span>
                          )}
                        </div>
                        {asgn.description && (
                          <p style={{ ...pjs(12, 400, '18px', '#64748b'), margin: '0 0 4px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {asgn.description}
                          </p>
                        )}
                        {asgn.max_marks != null && <span style={pjs(12, 500, '16px', '#94a3b8')}>Max marks: {asgn.max_marks}</span>}
                      </div>
                      <ExternalLink size={16} color="#c7d2fe" style={{ flexShrink: 0 }} />
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* ── GRADES ─────────────────────────────────────── */}
            {activeTab === 'grades' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {grades.length === 0 ? (
                  <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9' }}>
                    <EmptyState Icon={BarChart2} title="No grades yet" sub="Grades will appear here once your instructor releases them." />
                  </div>
                ) : (
                  <>
                    {/* Grade summary */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
                      {grades.map((g, i) => {
                        const pct = g.max_marks && g.marks != null ? Math.round((g.marks / g.max_marks) * 100) : null
                        const col = pct == null ? '#94a3b8' : pct >= 75 ? '#16a34a' : pct >= 50 ? '#d97706' : '#dc2626'
                        const bg = pct == null ? '#f8fafc' : pct >= 75 ? '#f0fdf4' : pct >= 50 ? '#fffbeb' : '#fee2e2'
                        return (
                          <div key={i} style={{ background: bg, borderRadius: 16, padding: '18px 20px', border: '1px solid #f1f5f9', textAlign: 'center' }}>
                            <div style={{ ...pjs(11, 700, '14px', '#94a3b8'), textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{g.exam_type}</div>
                            <div style={{ ...pjs(32, 800, '38px', col), marginBottom: 4 }}>{pct != null ? `${pct}%` : '—'}</div>
                            <div style={pjs(12, 500, '16px', '#94a3b8')}>{g.marks ?? '—'} / {g.max_marks ?? '—'}</div>
                            {pct != null && (
                              <div style={{ marginTop: 10, height: 5, borderRadius: 5, background: 'rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${pct}%`, background: col, borderRadius: 5 }} />
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    {/* Grade table */}
                    <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f1f5f9', overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', ...pjs(14, 400, '20px', '#0f172a') }}>
                        <thead>
                          <tr style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                            {['Assessment', 'Marks Obtained', 'Max Marks', 'Percentage'].map(h => (
                              <th key={h} style={{ textAlign: 'left', padding: '12px 20px', ...pjs(11, 700, '14px', '#64748b'), textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {grades.map((g, i) => {
                            const pct = g.max_marks && g.marks != null ? Math.round((g.marks / g.max_marks) * 100) : null
                            const col = pct == null ? '#94a3b8' : pct >= 75 ? '#16a34a' : pct >= 50 ? '#d97706' : '#dc2626'
                            return (
                              <tr key={g.id ?? i} style={{ borderBottom: i < grades.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                                <td style={{ padding: '14px 20px', ...pjs(14, 600, '20px', '#0f172a') }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <Award size={15} color="#d97706" />
                                    {g.exam_type}
                                  </div>
                                </td>
                                <td style={{ padding: '14px 20px', ...pjs(14, 700, '20px', '#0f172a') }}>{g.marks ?? '—'}</td>
                                <td style={{ padding: '14px 20px', ...pjs(14, 400, '20px', '#64748b') }}>{g.max_marks ?? '—'}</td>
                                <td style={{ padding: '14px 20px' }}>
                                  {pct != null ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                      <div style={{ width: 72, height: 5, borderRadius: 99, background: '#f1f5f9', overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: `${pct}%`, background: col, borderRadius: 99 }} />
                                      </div>
                                      <span style={pjs(13, 700, '18px', col)}>{pct}%</span>
                                    </div>
                                  ) : <span style={pjs(14, 400, '20px', '#94a3b8')}>—</span>}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── ATTENDANCE ─────────────────────────────────── */}
            {activeTab === 'attendance' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Summary card */}
                {attSummary && (
                  <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9', padding: '24px 28px', boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1px 1fr 1px 1fr 1px 1fr', gap: 0, alignItems: 'center' }}>
                      {/* Overall % */}
                      <div style={{ textAlign: 'center', padding: '0 16px' }}>
                        <div style={{ ...pjs(40, 800, '46px', attSummary.pct >= 75 ? '#16a34a' : attSummary.pct >= 60 ? '#d97706' : '#dc2626') }}>{attSummary.pct}%</div>
                        <div style={{ ...pjs(11, 700, '16px', '#94a3b8'), textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>OVERALL</div>
                        {/* Mini bar */}
                        <div style={{ height: 4, background: '#f1f5f9', borderRadius: 4, marginTop: 10, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${attSummary.pct}%`, background: attSummary.pct >= 75 ? '#16a34a' : attSummary.pct >= 60 ? '#d97706' : '#dc2626', borderRadius: 4 }} />
                        </div>
                      </div>
                      <div style={{ height: 60, background: '#f1f5f9' }} />
                      <div style={{ textAlign: 'center' }}>
                        <div style={pjs(28, 800, '34px', '#0f172a')}>{attSummary.total}</div>
                        <div style={pjs(11, 600, '16px', '#94a3b8')}>Total Classes</div>
                      </div>
                      <div style={{ height: 60, background: '#f1f5f9' }} />
                      <div style={{ textAlign: 'center' }}>
                        <div style={pjs(28, 800, '34px', '#16a34a')}>{attSummary.present + attSummary.late}</div>
                        <div style={pjs(11, 600, '16px', '#94a3b8')}>Present / Late</div>
                      </div>
                      <div style={{ height: 60, background: '#f1f5f9' }} />
                      <div style={{ textAlign: 'center' }}>
                        <div style={pjs(28, 800, '34px', '#dc2626')}>{attSummary.absent}</div>
                        <div style={pjs(11, 600, '16px', '#94a3b8')}>Absent</div>
                      </div>
                    </div>
                    {attSummary.pct < 75 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 18, padding: '12px 16px', borderRadius: 10, background: '#fee2e2', border: '1px solid #fecaca' }}>
                        <AlertCircle size={16} color="#dc2626" />
                        <span style={pjs(13, 600, '18px', '#dc2626')}>Attendance below 75% — attend classes regularly to avoid detainment.</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Attendance log */}
                {attendance.length === 0 ? (
                  <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9' }}>
                    <EmptyState Icon={CalendarCheck} title="No records yet" sub="Your attendance will appear here once it's been marked." />
                  </div>
                ) : (
                  <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f1f5f9', overflow: 'hidden' }}>
                    {attendance.map((rec, i) => (
                      <div key={rec.id ?? i} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '13px 20px',
                        borderBottom: i < attendance.length - 1 ? '1px solid #f8fafc' : 'none',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CalendarCheck size={15} color="#94a3b8" />
                          </div>
                          <span style={pjs(14, 500, '20px', '#0f172a')}>
                            {new Date(rec.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                        <AttBadge status={rec.status} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {viewHtmlModal.open && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999,
          background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div style={{
            background: '#fff', borderRadius: 20, width: '100%', maxWidth: 800,
            maxHeight: '90vh', display: 'flex', flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
          }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, ...pjs(18, 700, '24px', '#0f172a') }}>{viewHtmlModal.title}</h3>
              <button 
                onClick={() => setViewHtmlModal({ open: false, title: '', src: '', description: '' })} 
                style={{ background: '#f8fafc', border: 'none', width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>
            <div style={{ flex: 1, padding: 0, overflowY: 'auto', borderRadius: '0 0 20px 20px', display: 'flex', flexDirection: 'column' }}>
              {viewHtmlModal.description && (
                <div 
                  className="moodle-html-content"
                  style={{ padding: '24px', background: '#fff', borderBottom: viewHtmlModal.src ? '1px solid #f1f5f9' : 'none', ...pjs(15, 400, '1.6', '#334155') }}
                  dangerouslySetInnerHTML={{ __html: viewHtmlModal.description }}
                />
              )}
              {viewHtmlModal.src && (
                <iframe 
                  src={viewHtmlModal.src} 
                  width="100%" 
                  style={{ border: 'none', background: '#fff', minHeight: '60vh', flex: 1 }} 
                  title={viewHtmlModal.title} 
                  sandbox="allow-same-origin allow-scripts"
                  onLoad={(e) => {
                    try {
                      const doc = e.target.contentDocument || e.target.contentWindow?.document;
                      if (!doc) return;
                      const style = doc.createElement('style');
                      style.innerHTML = `
                        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important; padding: 24px !important; margin: 0 !important; color: #334155 !important; font-size: 15px !important; line-height: 1.6 !important; }
                        * { max-width: 100% !important; word-wrap: break-word !important; white-space: normal !important; overflow-wrap: break-word !important; }
                        table { width: 100% !important; table-layout: auto !important; }
                        img, video { max-width: 100% !important; height: auto !important; }
                        /* Restore list styles */
                        ul { list-style-type: disc !important; padding-left: 1.5rem !important; margin: 0.5rem 0 !important; }
                        ol { list-style-type: decimal !important; padding-left: 1.5rem !important; margin: 0.5rem 0 !important; }
                      `;
                      doc.head.appendChild(style);
                      // Give it a brief moment to render the new styles before measuring height
                      setTimeout(() => {
                        e.target.style.height = (doc.documentElement.scrollHeight + 50) + 'px';
                      }, 50);
                    } catch(err) { }
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  )
}
