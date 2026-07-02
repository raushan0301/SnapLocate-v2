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

const DEPT_GRADIENTS = {
  CSE: 'linear-gradient(135deg, #1e1b4b 0%, #3730a3 50%, #4f46e5 100%)',
  ECE: 'linear-gradient(135deg, #065f46 0%, #059669 50%, #10b981 100%)',
  EEE: 'linear-gradient(135deg, #713f12 0%, #b45309 50%, #f59e0b 100%)',
  ME:  'linear-gradient(135deg, #1e3a5f 0%, #1d4ed8 50%, #3b82f6 100%)',
  CIVIL: 'linear-gradient(135deg, #1a1a2e 0%, #374151 50%, #6b7280 100%)',
  CHEM: 'linear-gradient(135deg, #4c0519 0%, #9f1239 50%, #e11d48 100%)',
  BIO:  'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #16a34a 100%)',
  MATH: 'linear-gradient(135deg, #312e81 0%, #4338ca 50%, #6366f1 100%)',
  PHY:  'linear-gradient(135deg, #0c4a6e 0%, #0369a1 50%, #0ea5e9 100%)',
  MGMT: 'linear-gradient(135deg, #3b0764 0%, #6d28d9 50%, #8b5cf6 100%)',
  DEFAULT: 'linear-gradient(135deg, #0f172a 0%, #334155 50%, #475569 100%)',
}
function getDeptGrad(dept = '') {
  const u = dept.toUpperCase()
  if (u.includes('COMPUTER'))   return DEPT_GRADIENTS.CSE
  if (u.includes('ELECTRONICS'))return DEPT_GRADIENTS.ECE
  if (u.includes('ELECTRICAL')) return DEPT_GRADIENTS.EEE
  if (u.includes('MECHANICAL')) return DEPT_GRADIENTS.ME
  if (u.includes('CIVIL'))      return DEPT_GRADIENTS.CIVIL
  if (u.includes('CHEM'))       return DEPT_GRADIENTS.CHEM
  if (u.includes('BIO'))        return DEPT_GRADIENTS.BIO
  if (u.includes('MATH'))       return DEPT_GRADIENTS.MATH
  if (u.includes('PHYSICS'))    return DEPT_GRADIENTS.PHY
  if (u.includes('MANAGEMENT')) return DEPT_GRADIENTS.MGMT
  return DEPT_GRADIENTS.DEFAULT
}

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

// ─── Section accent colors (data-driven, kept as objects) ────────
const sectionColors = [
  { bg: '#eef2ff', border: '#c7d2fe', accent: '#4f46e5' },
  { bg: '#f0fdf4', border: '#bbf7d0', accent: '#16a34a' },
  { bg: '#fff7ed', border: '#fed7aa', accent: '#ea580c' },
  { bg: '#fdf4ff', border: '#f0abfc', accent: '#a855f7' },
  { bg: '#ecfeff', border: '#a5f3fc', accent: '#0891b2' },
  { bg: '#fffbeb', border: '#fde68a', accent: '#d97706' },
]

const TABS = [
  { key: 'content',       label: 'Content',       Icon: FolderOpen },
  { key: 'announcements', label: 'Announcements',  Icon: Megaphone },
  { key: 'assignments',   label: 'Assignments',    Icon: ClipboardList },
  { key: 'grades',        label: 'Grades',         Icon: BarChart2 },
  { key: 'attendance',    label: 'Attendance',     Icon: CalendarCheck },
]

const moduleIcon = (type) => {
  switch (type) {
    case 'url':         return { Icon: Link2,    bg: '#f0fdf4', color: '#16a34a' }
    case 'resource':    return { Icon: FileText, bg: '#fef3c7', color: '#d97706' }
    case 'page':        return { Icon: File,     bg: '#eef2ff', color: '#4f46e5' }
    case 'folder':      return { Icon: FolderOpen, bg: '#fdf4ff', color: '#a855f7' }
    case 'folder_file': return { Icon: FileText, bg: '#fff7ed', color: '#ea580c' }
    default:            return { Icon: File,     bg: '#f8fafc', color: '#64748b' }
  }
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001'
function buildFileUrl(mat) {
  const rawUrl = mat.file_url || mat.external_url
  if (!rawUrl) return null
  if (mat.module_type === 'url') return rawUrl
  if (!rawUrl.includes('pluginfile.php')) return rawUrl
  const title = (mat.title || '').toLowerCase()
  const isPdf = title.endsWith('.pdf') || rawUrl.toLowerCase().includes('.pdf')
  if (isPdf) return rawUrl
  const fname = mat.title || 'download'
  const snapTok = localStorage.getItem('snaplocate_token') || ''
  const isPage = mat.module_type === 'page' || mat.module_type === 'label'
  return `${API_BASE}/api/lms/materials/file-proxy?url=${encodeURIComponent(rawUrl)}&filename=${encodeURIComponent(fname)}&snap_token=${encodeURIComponent(snapTok)}${isPage ? '&inline=1' : ''}`
}

function DueChip({ dueDate }) {
  if (!dueDate) return null
  const diff  = new Date(dueDate).getTime() - Date.now()
  const days  = Math.ceil(diff / 86400000)
  const overdue = days < 0
  const label = overdue ? 'Overdue' : days === 0 ? 'Due today' : days === 1 ? 'Due tomorrow' : `${days}d left`
  const cls   = overdue ? 'bg-danger-light text-danger' : days === 0 ? 'bg-warning-light text-warning' : 'bg-success-light text-success'
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold ${cls}`}>
      <Clock size={10} />{label}
    </span>
  )
}

function AttBadge({ status }) {
  const map = {
    present: 'bg-success-light text-success',
    absent:  'bg-danger-light text-danger',
    late:    'bg-warning-light text-warning',
    excused: 'bg-blue-50 text-blue-600',
  }
  const labels = { present: 'Present', absent: 'Absent', late: 'Late', excused: 'Excused' }
  const key = status?.toLowerCase() ?? 'absent'
  return <span className={`text-[11px] font-bold px-3 py-0.5 rounded-full uppercase tracking-[0.06em] ${map[key] ?? map.absent}`}>{labels[key] ?? 'Absent'}</span>
}

function EmptyState({ Icon, title, sub }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 gap-3">
      <div className="w-16 h-16 rounded-[20px] bg-surface border border-slate-100 flex items-center justify-center">
        <Icon size={28} className="text-slate-300" />
      </div>
      <div className="t-lg font-semibold t-subtle text-center">{title}</div>
      {sub && <div className="t-md t-subtle text-center max-w-[280px]">{sub}</div>}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
export default function LMSCourse() {
  const { id }    = useParams()
  const navigate  = useNavigate()
  const [activeTab, setActiveTab]   = useState('content')
  const [course, setCourse]         = useState(null)
  const [announcements, setAnnouncements] = useState([])
  const [assignments, setAssignments]     = useState([])
  const [materials, setMaterials]         = useState([])
  const [grades, setGrades]               = useState([])
  const [attendance, setAttendance]       = useState([])
  const [loadingCourse, setLoadingCourse] = useState(true)
  const [loadingTab, setLoadingTab]       = useState(false)
  const [collapsedSections, setCollapsedSections] = useState({})
  const [expandedFolders, setExpandedFolders]     = useState({})
  const [viewHtmlModal, setViewHtmlModal] = useState({ open: false, title: '', src: '', description: '' })
  const [statCounts, setStatCounts] = useState({ materials: null, announcements: null, assignments: null })

  useEffect(() => {
    if (!id) return
    setLoadingCourse(true)
    api.get(`/api/lms/courses/${id}`)
      .then(res => {
        if (res.success) {
          const c = res.data
          setCourse(c)
          if (!c.semester) {
            api.get('/api/lms/courses').then(allRes => {
              if (allRes.success) {
                const better = allRes.data.map(e => e.courses || e).find(other =>
                  other.id !== c.id && (other.code === c.code || (c.code && other.code?.startsWith(c.code))) && other.semester
                )
                if (better) navigate(`/lms/courses/${better.id}`, { replace: true })
              }
            })
          }
        }
      })
      .finally(() => setLoadingCourse(false))
  }, [id])

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
      setMaterials(mats)
      setAnnouncements([...anns].sort((a, b) => {
        if (a.is_pinned && !b.is_pinned) return -1
        if (!a.is_pinned && b.is_pinned) return 1
        return new Date(b.created_at) - new Date(a.created_at)
      }))
      setAssignments(asns)
    })
  }, [id])

  useEffect(() => {
    if (!id) return
    const fetchers = {
      content: null, announcements: null, assignments: null,
      grades:     () => api.get(`/api/lms/grades?course_id=${id}`).then(r => { if (r.success) setGrades(r.data ?? []) }),
      attendance: () => api.get(`/api/attendance?course_id=${id}`).then(r => {
        if (r.success) setAttendance([...(r.data ?? [])].sort((a, b) => new Date(b.date) - new Date(a.date)))
      }),
    }
    const fn = fetchers[activeTab]
    if (!fn) return
    setLoadingTab(true)
    fn().catch(() => {}).finally(() => setLoadingTab(false))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [id, activeTab])

  // Group materials into sections with folder hierarchy
  const sections = (() => {
    const map = {}
    for (const mat of materials) {
      const key = mat.section_name || 'General'
      if (!map[key]) map[key] = { name: key, num: mat.section_num ?? 999, items: [] }
      map[key].items.push(mat)
    }
    for (const sec of Object.values(map)) {
      const foldersByName = {}
      for (const item of sec.items) {
        if (item.module_type === 'folder') foldersByName[item.title] = { ...item, _children: [] }
      }
      for (const item of sec.items) {
        if (item.module_type === 'folder_file') {
          const parentName = (item.description || '').replace(/^📁\s*/, '').trim()
          if (foldersByName[parentName]) foldersByName[parentName]._children.push(item)
        }
      }
      const seen = new Set()
      sec.items = sec.items
        .filter(item => {
          if (item.module_type === 'folder_file') return false
          if (item.module_type === 'folder') { if (seen.has(item.title)) return false; seen.add(item.title) }
          return true
        })
        .map(item => item.module_type === 'folder' && foldersByName[item.title] ? foldersByName[item.title] : item)
    }
    return Object.values(map).sort((a, b) => a.num - b.num)
  })()

  const toggleSection = (name) => setCollapsedSections(p => ({ ...p, [name]: !p[name] }))
  const toggleFolder  = (id)   => setExpandedFolders(p => ({ ...p, [id]: !p[id] }))

  const attSummary = (() => {
    if (!attendance.length) return null
    const total   = attendance.length
    const present = attendance.filter(a => a.status === 'present').length
    const late    = attendance.filter(a => a.status === 'late').length
    const absent  = attendance.filter(a => a.status === 'absent').length
    const pct     = Math.round(((present + late * 0.5) / total) * 100)
    return { total, present, late, absent, pct }
  })()

  const fp          = course?.faculty_profiles
  const facultyName = fp?.users?.full_name
  const displayName = cleanDisplayName(course?.name || '')
  const displayCode = cleanCode(course?.code || '')
  const grad        = getDeptGrad(course?.dept || '')
  const progress    = course?.progress ?? 0
  const tabBadges   = {
    announcements: statCounts.announcements ?? announcements.length,
    assignments:   statCounts.assignments   ?? assignments.length,
    grades:        grades.length,
  }

  if (loadingCourse) return (
    <PageLayout>
      <div className="flex items-center justify-center h-[300px]">
        <div className="flex flex-col items-center gap-3.5">
          <div className="w-12 h-12 rounded-[14px] bg-brand-light flex items-center justify-center">
            <BookOpen size={22} className="text-brand animate-pulse" />
          </div>
          <span className="t-md font-medium t-subtle">Loading course…</span>
        </div>
      </div>
    </PageLayout>
  )

  if (!course) return (
    <PageLayout>
      <div className="p-10 text-center">
        <EmptyState Icon={AlertCircle} title="Course not found" sub="This course may have been removed or you don't have access." />
        <button onClick={() => navigate('/lms')} className="mt-4 px-6 py-2.5 rounded-xl bg-brand text-white border-none cursor-pointer t-heading-md">
          Back to My Courses
        </button>
      </div>
    </PageLayout>
  )

  return (
    <PageLayout>
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 mb-6 flex-wrap">
        <Link to="/dashboard" className="t-md font-medium t-subtle no-underline hover:text-brand transition-colors">Dashboard</Link>
        <span className="text-slate-200 text-base">›</span>
        <Link to="/lms" className="t-md font-medium t-subtle no-underline hover:text-brand transition-colors">My Courses</Link>
        <span className="text-slate-200 text-base">›</span>
        <span className="t-md font-bold text-brand">{displayName || displayCode || 'Course'}</span>
      </div>

      {/* ── Hero Header Card ── */}
      <div className="rounded-3xl overflow-hidden mb-6 shadow-[0_8px_32px_rgba(0,0,0,0.1)] bg-white flex flex-col shrink-0">
        {/* Gradient banner */}
        <div
          className="px-6 sm:px-8 pt-10 pb-8 min-h-[160px] relative overflow-hidden flex flex-col justify-end"
          style={{ background: `${grad}, #1e1b4b` }}
        >
          <div className="absolute -top-10 -right-10 w-[180px] h-[180px] rounded-full bg-white/[0.06]" />
          <div className="absolute -bottom-7 right-20 w-[120px] h-[120px] rounded-full bg-white/[0.04]" />

          <div className="relative z-[2]">
            {course.dept && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg mb-3 backdrop-blur-sm bg-white/[0.12] border border-white/20">
                <GraduationCap size={12} color="rgba(255,255,255,0.9)" />
                <span className="text-[11px] font-bold text-white/90">{course.dept.toUpperCase()}</span>
              </div>
            )}
            <h1 className="text-[30px] font-extrabold text-white m-0 mb-2 tracking-[-0.02em] leading-[38px]">
              {displayName || 'Loading...'}
            </h1>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-[14px] font-semibold text-white/70">{displayCode}</span>
              {course.semester && (
                <><span className="text-white/30">·</span><span className="text-[14px] font-medium text-white/60">{course.semester}</span></>
              )}
              {facultyName && (
                <><span className="text-white/30">·</span>
                <span className="text-[14px] font-medium text-white/60 flex items-center gap-1">
                  <Users size={12} />{facultyName}
                </span></>
              )}
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div className="bg-white px-6 sm:px-8 py-5 grid grid-cols-4 border-t border-slate-100 min-h-[80px]">
          {[
            { label: 'Progress',    value: `${progress}%`,                                         icon: <TrendingUp size={15} />,    color: '#4f46e5' },
            { label: 'Assignments', value: statCounts.assignments != null ? statCounts.assignments : '…', icon: <ClipboardList size={15} />, color: '#d97706' },
            { label: 'Materials',   value: statCounts.materials   != null ? statCounts.materials   : '…', icon: <FolderOpen size={15} />,   color: '#16a34a' },
            { label: 'Attendance',  value: attSummary ? `${attSummary.pct}%` : '—',               icon: <CalendarCheck size={15} />, color: '#0891b2' },
          ].map((s, i) => (
            <div key={i} className={`text-center py-1 ${i < 3 ? 'border-r border-slate-100' : ''}`}>
              <div className="flex items-center justify-center gap-1 mb-1" style={{ color: s.color }}>{s.icon}
                <span className="text-[11px] font-bold text-ink-subtle">{s.label.toUpperCase()}</span>
              </div>
              <div className="text-[22px] font-extrabold" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Tabs strip */}
        <div className="bg-surface border-t border-slate-100 px-3 py-1.5 flex gap-1.5 overflow-x-auto min-h-[52px]">
          {TABS.map(({ key, label, Icon }) => {
            const active = activeTab === key
            const badgeN = tabBadges[key]
            return (
              <button key={key} onClick={() => setActiveTab(key)}
                className={`inline-flex items-center gap-1.5 px-[18px] py-2.5 rounded-xl border-none cursor-pointer whitespace-nowrap transition-colors t-md ${active ? 'bg-brand text-white font-bold' : 'bg-transparent font-medium t-secondary hover:bg-surface-muted'}`}>
                <Icon size={14} />
                {label}
                {badgeN > 0 && (
                  <span className={`text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center ${active ? 'bg-white text-brand' : 'bg-surface-muted t-secondary'}`}>
                    {badgeN}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Tab Content ── */}
      <div>
        {loadingTab ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-full border-[3px] border-slate-200 border-t-brand animate-spin" />
              <span className="t-md font-medium t-subtle">Loading…</span>
            </div>
          </div>
        ) : (
          <>
            {/* ── CONTENT tab ── */}
            {activeTab === 'content' && (
              <div className="flex flex-col gap-3">
                {sections.length === 0 && (
                  <div className="bg-white rounded-[20px] border border-slate-100">
                    <EmptyState Icon={FolderOpen} title="No materials yet" sub="Course materials will appear here after syncing from Moodle." />
                  </div>
                )}
                {sections.map((sec, si) => {
                  const sc = sectionColors[si % sectionColors.length]
                  const isCollapsed = collapsedSections[sec.name]
                  return (
                    <div key={sec.name} className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
                      {/* Section header */}
                      <button onClick={() => toggleSection(sec.name)}
                        className="w-full flex items-center justify-between px-5 py-4 border-none cursor-pointer"
                        style={{ background: sc.bg, borderBottom: isCollapsed ? 'none' : `1px solid ${sc.border}` }}>
                        <div className="flex items-center gap-2.5">
                          <div className="w-1 h-[18px] rounded" style={{ background: sc.accent }} />
                          <span className="t-md font-bold t-primary">{sec.name}</span>
                          <span className="text-[11px] font-bold bg-white px-2.5 py-0.5 rounded-full border" style={{ color: sc.accent, borderColor: sc.border }}>
                            {sec.items.length} {sec.items.length === 1 ? 'item' : 'items'}
                          </span>
                        </div>
                        <ChevronDown size={16} style={{ color: sc.accent, transform: isCollapsed ? 'rotate(-90deg)' : 'none', transition: 'transform 0.2s' }} />
                      </button>

                      {/* Section items */}
                      {!isCollapsed && (
                        <div>
                          {sec.items.map((mat, i) => {
                            const isFolder    = mat.module_type === 'folder'
                            const isFolderOpen = expandedFolders[mat.id]
                            const mi = moduleIcon(mat.module_type)

                            // Folder with children
                            if (isFolder && mat._children?.length > 0) {
                              return (
                                <div key={mat.id}>
                                  <div
                                    onClick={() => toggleFolder(mat.id)}
                                    className={`px-5 py-3 flex items-center gap-3.5 cursor-pointer transition-colors hover:bg-surface ${isFolderOpen ? 'bg-[#fdf4ff]' : ''} ${!isFolderOpen && i < sec.items.length - 1 ? 'border-b border-slate-50' : ''}`}
                                  >
                                    <div className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: mi.bg }}>
                                      <mi.Icon size={16} style={{ color: mi.color }} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="t-md font-bold t-primary truncate">{mat.title}</div>
                                      <div className="t-xs t-subtle mt-0.5">{mat._children.length} file{mat._children.length !== 1 ? 's' : ''} inside</div>
                                    </div>
                                    <span className="text-[10px] font-bold uppercase tracking-[0.06em] shrink-0 text-purple-500">FOLDER</span>
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all ${isFolderOpen ? 'bg-purple-500' : 'bg-slate-100'}`}>
                                      <ChevronDown size={14} color={isFolderOpen ? '#fff' : '#64748b'} className={`transition-transform duration-200 ${isFolderOpen ? 'rotate-180' : ''}`} />
                                    </div>
                                  </div>

                                  {isFolderOpen && (
                                    <div className="ml-8 bg-gradient-to-r from-[#fdf4ff] to-white border-b border-slate-50 border-l-[3px] border-l-fuchsia-200">
                                      {mat._children.map((child, ci) => {
                                        const cmi  = moduleIcon('folder_file')
                                        const clink = buildFileUrl(child)
                                        return (
                                          <div key={child.id} className={`px-[18px] py-2.5 flex items-center gap-3 transition-colors hover:bg-white/80 ${ci < mat._children.length - 1 ? 'border-b border-[#fce7ff]' : ''}`}>
                                            <div className="w-[30px] h-[30px] rounded-lg flex items-center justify-center shrink-0" style={{ background: cmi.bg }}>
                                              <cmi.Icon size={13} style={{ color: cmi.color }} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <div className="text-[12px] font-semibold t-primary truncate">{child.title}</div>
                                            </div>
                                            <span className="text-[9px] font-bold uppercase tracking-[0.06em] shrink-0 text-orange-600">FILE</span>
                                            {clink ? (
                                              <a href={clink} target="_blank" rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-[11px] font-bold no-underline shrink-0 bg-orange-50 text-orange-600 border border-orange-200">
                                                <ExternalLink size={11} /> Open
                                              </a>
                                            ) : (
                                              <span className="text-[10px] font-medium t-subtle shrink-0">No link</span>
                                            )}
                                          </div>
                                        )
                                      })}
                                    </div>
                                  )}
                                </div>
                              )
                            }

                            // Regular item
                            const mi2  = moduleIcon(mat.module_type)
                            const lnk  = buildFileUrl(mat)
                            const isPageType = mat.module_type === 'page' || mat.module_type === 'label'
                            return (
                              <div key={mat.id}
                                className={`px-5 py-3 flex items-center gap-3.5 transition-colors hover:bg-surface ${i < sec.items.length - 1 ? 'border-b border-slate-50' : ''}`}>
                                <div className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: mi2.bg }}>
                                  <mi2.Icon size={16} style={{ color: mi2.color }} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="t-md font-semibold t-primary truncate">{mat.title}</div>
                                  {mat.description && (
                                    <div className="text-[11px] t-subtle truncate mt-0.5"
                                      dangerouslySetInnerHTML={{ __html: mat.description.replace(/<[^>]+>/g, ' ').slice(0, 150) }} />
                                  )}
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                  <div className="text-[10px] font-bold t-subtle uppercase tracking-[0.05em]">{mat.module_type}</div>
                                  {isPageType && (!lnk || lnk.includes('file-proxy')) ? (
                                    <button onClick={() => setViewHtmlModal({ open: true, title: mat.title, src: lnk?.includes('file-proxy') ? lnk : null, description: mat.description })}
                                      className="flex items-center gap-1.5 px-4 py-2 bg-brand-light text-brand rounded-[10px] border-none cursor-pointer t-md font-semibold">
                                      <FileText size={16} /> View
                                    </button>
                                  ) : (
                                    <a href={lnk} target="_blank" rel="noreferrer"
                                      className="flex items-center gap-1.5 px-4 py-2 bg-brand-light text-brand rounded-[10px] no-underline t-md font-semibold">
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

            {/* ── ANNOUNCEMENTS tab ── */}
            {activeTab === 'announcements' && (
              <div className="flex flex-col gap-3">
                {announcements.length === 0 && (
                  <div className="bg-white rounded-[20px] border border-slate-100">
                    <EmptyState Icon={Megaphone} title="No announcements" sub="Your instructor hasn't posted any announcements yet." />
                  </div>
                )}
                {announcements.map(ann => (
                  <div key={ann.id}
                    className={`bg-white rounded-2xl px-5 py-[18px] transition-all duration-300 ${ann.is_pinned ? 'border-[1.5px] border-amber-200 shadow-[0_4px_16px_rgba(217,119,6,0.08)]' : 'border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.03)]'}`}>
                    <div className="flex items-start gap-3.5">
                      <div className={`w-[38px] h-[38px] rounded-[10px] shrink-0 flex items-center justify-center ${ann.is_pinned ? 'bg-warning-light border border-[#fde68a]' : 'bg-brand-light border border-brand-border'}`}>
                        <Megaphone size={16} color={ann.is_pinned ? '#d97706' : '#4f46e5'} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="t-base font-bold t-primary">{ann.title}</span>
                          {ann.is_pinned && (
                            <span className="text-[10px] font-bold text-warning bg-warning-light px-2 py-0.5 rounded-full uppercase tracking-[0.06em]">📌 Pinned</span>
                          )}
                        </div>
                        <p className="t-md t-muted m-0 mb-2.5 leading-[20px]">{ann.message}</p>
                        {(ann.posted_at || ann.created_at) && (
                          <span className="text-[11px] font-medium t-subtle flex items-center gap-1">
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

            {/* ── ASSIGNMENTS tab ── */}
            {activeTab === 'assignments' && (
              <div className="flex flex-col gap-2.5">
                {assignments.length === 0 && (
                  <div className="bg-white rounded-[20px] border border-slate-100">
                    <EmptyState Icon={ClipboardList} title="No assignments" sub="Assignments posted by your instructor will appear here." />
                  </div>
                )}
                {assignments.map(asgn => (
                  <Link key={asgn.id} to={`/lms/assignments/${asgn.id}`} className="no-underline block">
                    <div className="bg-white rounded-2xl border border-slate-100 px-5 py-[18px] cursor-pointer transition-all duration-300 shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex items-center gap-4 hover:shadow-[0_8px_30px_rgba(79,70,229,0.12)] hover:-translate-y-0.5">
                      <div className="w-[42px] h-[42px] rounded-xl bg-warning-light border border-[#fde68a] flex items-center justify-center shrink-0">
                        <FileText size={18} color="#d97706" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="t-base font-bold t-primary">{asgn.title}</span>
                          <DueChip dueDate={asgn.due_date} />
                          {asgn.my_submission && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-success bg-success-light px-2.5 py-0.5 rounded-full">
                              <CheckCircle size={11} /> Submitted
                            </span>
                          )}
                        </div>
                        {asgn.description && (
                          <p className="t-xs t-secondary m-0 mb-1 line-clamp-2">{asgn.description}</p>
                        )}
                        {asgn.max_marks != null && <span className="t-xs font-medium t-subtle">Max marks: {asgn.max_marks}</span>}
                      </div>
                      <ExternalLink size={16} className="text-brand-border shrink-0" />
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* ── GRADES tab ── */}
            {activeTab === 'grades' && (
              <div className="flex flex-col gap-3">
                {grades.length === 0 ? (
                  <div className="bg-white rounded-[20px] border border-slate-100">
                    <EmptyState Icon={BarChart2} title="No grades yet" sub="Grades will appear here once your instructor releases them." />
                  </div>
                ) : (
                  <>
                    <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
                      {grades.map((g, i) => {
                        const pct = g.max_marks && g.marks != null ? Math.round((g.marks / g.max_marks) * 100) : null
                        const col = pct == null ? '#94a3b8' : pct >= 75 ? '#16a34a' : pct >= 50 ? '#d97706' : '#dc2626'
                        const bg  = pct == null ? '#f8fafc' : pct >= 75 ? '#f0fdf4' : pct >= 50 ? '#fffbeb' : '#fee2e2'
                        return (
                          <div key={i} className="rounded-2xl px-5 py-[18px] border border-slate-100 text-center" style={{ background: bg }}>
                            <div className="text-[11px] font-bold t-subtle uppercase tracking-[0.08em] mb-2">{g.exam_type}</div>
                            <div className="text-[32px] font-extrabold mb-1" style={{ color: col }}>{pct != null ? `${pct}%` : '—'}</div>
                            <div className="t-xs font-medium t-subtle">{g.marks ?? '—'} / {g.max_marks ?? '—'}</div>
                            {pct != null && (
                              <div className="mt-2.5 h-1.5 rounded-full bg-black/[0.06] overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: col }} />
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                      <table className="w-full border-collapse t-base t-primary">
                        <thead>
                          <tr className="bg-surface border-b border-slate-100">
                            {['Assessment', 'Marks Obtained', 'Max Marks', 'Percentage'].map(h => (
                              <th key={h} className="text-left px-5 py-3 text-[11px] font-bold t-secondary uppercase tracking-[0.06em] whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {grades.map((g, i) => {
                            const pct = g.max_marks && g.marks != null ? Math.round((g.marks / g.max_marks) * 100) : null
                            const col = pct == null ? '#94a3b8' : pct >= 75 ? '#16a34a' : pct >= 50 ? '#d97706' : '#dc2626'
                            return (
                              <tr key={g.id ?? i} className={i < grades.length - 1 ? 'border-b border-slate-50' : ''}>
                                <td className="px-5 py-3.5 t-md font-semibold t-primary">
                                  <div className="flex items-center gap-2.5"><Award size={15} color="#d97706" />{g.exam_type}</div>
                                </td>
                                <td className="px-5 py-3.5 t-md font-bold t-primary">{g.marks ?? '—'}</td>
                                <td className="px-5 py-3.5 t-md t-secondary">{g.max_marks ?? '—'}</td>
                                <td className="px-5 py-3.5">
                                  {pct != null ? (
                                    <div className="flex items-center gap-2.5">
                                      <div className="w-[72px] h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: col }} />
                                      </div>
                                      <span className="t-md font-bold" style={{ color: col }}>{pct}%</span>
                                    </div>
                                  ) : <span className="t-md t-subtle">—</span>}
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

            {/* ── ATTENDANCE tab ── */}
            {activeTab === 'attendance' && (
              <div className="flex flex-col gap-3.5">
                {attSummary && (
                  <div className="bg-white rounded-[20px] border border-slate-100 px-7 py-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
                    <div className="grid items-center" style={{ gridTemplateColumns: '1fr 1px 1fr 1px 1fr 1px 1fr', gap: 0 }}>
                      <div className="text-center px-4">
                        <div className={`text-[40px] font-extrabold leading-[46px] ${attSummary.pct >= 75 ? 'text-green-600' : attSummary.pct >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                          {attSummary.pct}%
                        </div>
                        <div className="text-[11px] font-bold t-subtle uppercase tracking-[0.08em] mt-1">OVERALL</div>
                        <div className="h-1 bg-slate-100 rounded-full mt-2.5 overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${attSummary.pct}%`, background: attSummary.pct >= 75 ? '#16a34a' : attSummary.pct >= 60 ? '#d97706' : '#dc2626' }} />
                        </div>
                      </div>
                      <div className="h-[60px] bg-slate-100" />
                      <div className="text-center">
                        <div className="text-[28px] font-extrabold t-primary">{attSummary.total}</div>
                        <div className="text-[11px] font-semibold t-subtle">Total Classes</div>
                      </div>
                      <div className="h-[60px] bg-slate-100" />
                      <div className="text-center">
                        <div className="text-[28px] font-extrabold text-success">{attSummary.present + attSummary.late}</div>
                        <div className="text-[11px] font-semibold t-subtle">Present / Late</div>
                      </div>
                      <div className="h-[60px] bg-slate-100" />
                      <div className="text-center">
                        <div className="text-[28px] font-extrabold text-danger">{attSummary.absent}</div>
                        <div className="text-[11px] font-semibold t-subtle">Absent</div>
                      </div>
                    </div>
                    {attSummary.pct < 75 && (
                      <div className="flex items-center gap-2.5 mt-[18px] px-4 py-3 rounded-[10px] bg-danger-light border border-danger-border">
                        <AlertCircle size={16} className="text-danger shrink-0" />
                        <span className="t-md font-semibold text-danger">Attendance below 75% — attend classes regularly to avoid detainment.</span>
                      </div>
                    )}
                  </div>
                )}

                {attendance.length === 0 ? (
                  <div className="bg-white rounded-[20px] border border-slate-100">
                    <EmptyState Icon={CalendarCheck} title="No records yet" sub="Your attendance will appear here once it's been marked." />
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                    {attendance.map((rec, i) => (
                      <div key={rec.id ?? i}
                        className={`flex items-center justify-between px-5 py-3 ${i < attendance.length - 1 ? 'border-b border-slate-50' : ''}`}>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-[10px] bg-surface flex items-center justify-center">
                            <CalendarCheck size={15} className="t-subtle" />
                          </div>
                          <span className="t-base font-medium t-primary">
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

      {/* HTML content modal */}
      {viewHtmlModal.open && (
        <div className="fixed inset-0 z-[99999] bg-ink/60 backdrop-blur-sm flex items-center justify-center p-5"
          onClick={() => setViewHtmlModal({ open: false, title: '', src: '', description: '' })}>
          <div className="bg-white rounded-[20px] w-full max-w-[800px] max-h-[90vh] flex flex-col shadow-[0_25px_50px_rgba(0,0,0,0.25)]"
            onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
              <h3 className="m-0 t-heading-lg t-primary">{viewHtmlModal.title}</h3>
              <button onClick={() => setViewHtmlModal({ open: false, title: '', src: '', description: '' })}
                className="w-9 h-9 rounded-full bg-surface border-none flex items-center justify-center cursor-pointer t-secondary">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto rounded-b-[20px] flex flex-col">
              {viewHtmlModal.description && (
                <div className={`moodle-html-content p-6 bg-white t-base t-muted leading-[1.6] ${viewHtmlModal.src ? 'border-b border-slate-100' : ''}`}
                  dangerouslySetInnerHTML={{ __html: viewHtmlModal.description }} />
              )}
              {viewHtmlModal.src && (
                <iframe src={viewHtmlModal.src} width="100%" className="border-none bg-white flex-1" style={{ minHeight: '60vh' }}
                  title={viewHtmlModal.title} sandbox="allow-same-origin allow-scripts"
                  onLoad={(e) => {
                    try {
                      const doc = e.target.contentDocument || e.target.contentWindow?.document
                      if (!doc) return
                      const style = doc.createElement('style')
                      style.innerHTML = `body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important; padding: 24px !important; margin: 0 !important; color: #334155 !important; font-size: 15px !important; line-height: 1.6 !important; } * { max-width: 100% !important; word-wrap: break-word !important; white-space: normal !important; overflow-wrap: break-word !important; } table { width: 100% !important; table-layout: auto !important; } img, video { max-width: 100% !important; height: auto !important; } ul { list-style-type: disc !important; padding-left: 1.5rem !important; margin: 0.5rem 0 !important; } ol { list-style-type: decimal !important; padding-left: 1.5rem !important; margin: 0.5rem 0 !important; }`
                      doc.head.appendChild(style)
                      setTimeout(() => { e.target.style.height = (doc.documentElement.scrollHeight + 50) + 'px' }, 50)
                    } catch {}
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
