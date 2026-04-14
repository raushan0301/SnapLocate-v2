import { useState, useEffect, useCallback } from 'react'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'

/* ─── Typography helpers ──────────────────────────────────────── */
const pjs = (size, weight, lh, color) => ({
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  fontSize: size, fontWeight: weight, lineHeight: lh, color,
})
const inter = (size, weight, lh, color) => ({
  fontFamily: "'Inter', sans-serif",
  fontSize: size, fontWeight: weight, lineHeight: lh, color,
})

/* ─── Shared icons ────────────────────────────────────────────── */
const PdfIcon = () => (
  <div style={{ width: 42, height: 42, borderRadius: 10, background: '#fff1f2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
    <svg width="22" height="24" viewBox="0 0 22 24" fill="none">
      <rect x="1" y="1" width="15" height="19" rx="2" fill="#fee2e2" stroke="#ef4444" strokeWidth="1.2" />
      <path d="M5 7h7M5 10h7M5 13h4" stroke="#ef4444" strokeWidth="1.1" strokeLinecap="round" />
      <rect x="13" y="14" width="8" height="9" rx="1.5" fill="#ef4444" />
      <text x="14" y="22" style={{ fontSize: '4px', fontWeight: 800, fontFamily: 'sans-serif', fill: 'white' }}>PDF</text>
    </svg>
  </div>
)

const VideoIcon = () => (
  <div style={{ width: 42, height: 42, borderRadius: 10, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
    <svg width="22" height="18" viewBox="0 0 22 18" fill="none">
      <rect x="1" y="1" width="14" height="12" rx="2" fill="#fde68a" stroke="#f59e0b" strokeWidth="1.2" />
      <path d="M7 4.5l5 3-5 3V4.5z" fill="#f59e0b" />
      <path d="M16 5l5-2v12l-5-2V5z" fill="#f59e0b" stroke="#f59e0b" strokeWidth="1" strokeLinejoin="round" />
    </svg>
  </div>
)

const DocIcon = () => (
  <div style={{ width: 42, height: 42, borderRadius: 10, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
    <svg width="20" height="24" viewBox="0 0 20 24" fill="none">
      <rect x="1" y="1" width="15" height="20" rx="2" fill="#dbeafe" stroke="#3b82f6" strokeWidth="1.2" />
      <path d="M4 7h9M4 10.5h9M4 14h6" stroke="#3b82f6" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  </div>
)

const XlsxIcon = () => (
  <div style={{ width: 42, height: 42, borderRadius: 10, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
    <svg width="20" height="24" viewBox="0 0 20 24" fill="none">
      <rect x="1" y="1" width="15" height="20" rx="2" fill="#dcfce7" stroke="#22c55e" strokeWidth="1.2" />
      <path d="M4 8h9M4 11.5h9M4 15h9M8 8v10" stroke="#22c55e" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  </div>
)

function fileIcon(url = '') {
  const u = url.toLowerCase()
  if (u.includes('.pdf'))  return <PdfIcon />
  if (u.match(/\.(mp4|mov|avi|mkv|webm)/)) return <VideoIcon />
  if (u.match(/\.(xls|xlsx|csv)/))          return <XlsxIcon />
  return <DocIcon />
}

const DownloadBtn = ({ url, label = 'Download', color = '#4f46e5', small = false }) => (
  <a
    href={url} target="_blank" rel="noopener noreferrer"
    style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: small ? '7px 14px' : '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
      background: color === 'outline' ? '#f5f3ff' : color,
      ...pjs(small ? 12 : 13, 600, '18px', color === 'outline' ? '#4f46e5' : '#ffffff'),
      textDecoration: 'none', flexShrink: 0, whiteSpace: 'nowrap',
    }}
  >
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <path d="M6.5 1v8M3 7l3.5 3.5L10 7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M1 12h11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
    {label}
  </a>
)

/* ─── Type badge config ───────────────────────────────────────── */
const TYPE_MAP = {
  note:     { label: 'Notes',    bg: '#eef2ff', color: '#4f46e5' },
  pyq:      { label: 'PYQ',      bg: '#fdf4ff', color: '#7e22ce' },
  lab:      { label: 'Lab',      bg: '#ecfdf5', color: '#047857' },
  syllabus: { label: 'Syllabus', bg: '#f0f9ff', color: '#0369a1' },
  paper:    { label: 'Paper',    bg: '#fff7ed', color: '#c2410c' },
  doc:      { label: 'Doc',      bg: '#f8fafc', color: '#64748b' },
}

const typeBadge = (type) => {
  const t = TYPE_MAP[type?.toLowerCase()] || TYPE_MAP.doc
  return (
    <span style={{ background: t.bg, color: t.color, padding: '3px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>
      {t.label}
    </span>
  )
}

/* ═══════════════════════════ OVERVIEW TAB ═════════════════════ */
function OverviewTab({ resources, courses }) {
  const noteCount  = resources.filter(r => r.type === 'note').length
  const pyqCount   = resources.filter(r => r.type === 'pyq').length
  const labCount   = resources.filter(r => r.type === 'lab').length
  const syllCount  = resources.filter(r => r.type === 'syllabus').length

  const recent = [...resources].slice(0, 5)

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {[
            { label: 'Notes',    count: noteCount,  bg: '#eef2ff', color: '#4f46e5' },
            { label: 'PYQs',     count: pyqCount,   bg: '#fdf4ff', color: '#7e22ce' },
            { label: 'Lab Files',count: labCount,   bg: '#ecfdf5', color: '#047857' },
            { label: 'Syllabus', count: syllCount,  bg: '#f0f9ff', color: '#0369a1' },
          ].map((s, i) => (
            <div key={i} style={{ background: '#fff', border: '1px solid #f1f5f9', borderRadius: 12, padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', textAlign: 'center' }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.count}</div>
              <div style={{ ...pjs(12, 600, '16px', '#64748b'), marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Recent uploads */}
        <div style={{ background: '#ffffff', border: '1px solid #f1f5f9', borderRadius: 14, padding: 22, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 15V3h8l4 4v8a1 1 0 01-1 1H4a1 1 0 01-1-1z" stroke="#4f46e5" strokeWidth="1.3"/><path d="M11 3v4h4" stroke="#4f46e5" strokeWidth="1.3" strokeLinejoin="round"/></svg>
            <span style={pjs(16, 700, '22px', '#0f172a')}>Recently Uploaded</span>
          </div>
          {recent.length === 0 ? (
            <p style={pjs(13, 400, '20px', '#94a3b8')}>No resources uploaded yet. Check back soon.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {recent.map(r => (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', borderRadius: 12, background: '#f8fafc' }}>
                  {fileIcon(r.file_url)}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ ...pjs(13, 700, '18px', '#0f172a'), overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 2 }}>
                      {typeBadge(r.type)}
                      {r.course && <span style={pjs(11, 500, '15px', '#64748b')}>{r.course.code}</span>}
                      <span style={pjs(11, 400, '15px', '#94a3b8')}>{new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </div>
                  </div>
                  <DownloadBtn url={r.file_url} label="Open" small color="#4f46e5" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right sidebar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Courses with resources */}
        <div style={{ background: '#ffffff', border: '1px solid #f1f5f9', borderRadius: 14, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="12" height="12" rx="2" stroke="#64748b" strokeWidth="1.2"/><path d="M5 6h6M5 9h4" stroke="#64748b" strokeWidth="1.2" strokeLinecap="round"/></svg>
            <span style={{ ...inter(11, 700, '15px', '#64748b'), textTransform: 'uppercase', letterSpacing: '0.08em' }}>Courses</span>
          </div>
          {courses.length === 0 ? (
            <p style={pjs(12, 400, '18px', '#94a3b8')}>No courses linked.</p>
          ) : courses.map((c, i) => (
            <div key={c.id} style={{ padding: '10px 0', borderBottom: i < courses.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
              <div style={{ ...inter(10, 600, '14px', '#94a3b8'), marginBottom: 3 }}>{c.code}</div>
              <div style={pjs(13, 700, '18px', '#0f172a')}>{c.name}</div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div style={{ background: '#ffffff', border: '1px solid #f1f5f9', borderRadius: 14, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="#64748b" strokeWidth="1.2"/><path d="M8 5v3l2 2" stroke="#64748b" strokeWidth="1.2" strokeLinecap="round"/></svg>
            <span style={{ ...inter(11, 700, '15px', '#64748b'), textTransform: 'uppercase', letterSpacing: '0.08em' }}>Total Files</span>
          </div>
          <div style={{ marginBottom: 14 }}>
            <span style={pjs(32, 800, '40px', '#0f172a')}>{resources.length}</span>
            <span style={{ ...pjs(13, 500, '18px', '#64748b'), marginLeft: 6 }}>Resources</span>
          </div>
          {Object.entries(TYPE_MAP).map(([key, val]) => {
            const cnt = resources.filter(r => r.type === key).length
            if (!cnt) return null
            const pct = Math.round((cnt / resources.length) * 100)
            return (
              <div key={key} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={pjs(12, 500, '16px', '#64748b')}>{val.label}</span>
                  <span style={pjs(12, 700, '16px', '#0f172a')}>{cnt}</span>
                </div>
                <div style={{ height: 5, background: '#f1f5f9', borderRadius: 10 }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: val.color, borderRadius: 10 }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════ FILES TAB ════════════════════════ */
function FilesTab({ resources, activeType, setActiveType }) {
  const types = ['all', 'note', 'pyq', 'lab', 'syllabus', 'paper', 'doc']
  const filtered = activeType === 'all' ? resources : resources.filter(r => r.type === activeType)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Type filter */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {types.map(t => {
          const info = t === 'all' ? { label: 'All', bg: '#eef2ff', color: '#4f46e5' } : (TYPE_MAP[t] || { label: t, bg: '#f8fafc', color: '#64748b' })
          const active = activeType === t
          return (
            <button key={t} onClick={() => setActiveType(t)} style={{
              padding: '7px 16px', borderRadius: 10, border: '1.5px solid',
              borderColor: active ? info.color : '#e2e8f0',
              background: active ? info.color : '#fff',
              color: active ? '#fff' : '#475569',
              fontSize: 12, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize',
            }}>
              {info.label} {t !== 'all' && `(${resources.filter(r => r.type === t).length})`}
            </button>
          )
        })}
      </div>

      {/* File list */}
      {filtered.length === 0 ? (
        <div style={{ padding: '50px 0', textAlign: 'center' }}>
          <p style={pjs(14, 500, '20px', '#94a3b8')}>No {activeType === 'all' ? '' : activeType + ' '}files available yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(r => (
            <div key={r.id} style={{ background: '#ffffff', border: '1px solid #f1f5f9', borderRadius: 14, padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: 16 }}>
              {fileIcon(r.file_url)}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
                  <span style={{ ...pjs(14, 700, '20px', '#0f172a'), overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 340 }}>{r.title}</span>
                  {typeBadge(r.type)}
                </div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                  {r.course && <span style={pjs(12, 500, '16px', '#64748b')}>{r.course.code} — {r.course.name}</span>}
                  <span style={pjs(12, 400, '16px', '#94a3b8')}>by {r.uploader?.full_name || 'Faculty'}</span>
                  <span style={pjs(12, 400, '16px', '#94a3b8')}>{new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
                {r.description && <p style={{ ...pjs(12, 400, '18px', '#64748b'), margin: '6px 0 0' }}>{r.description}</p>}
              </div>
              <DownloadBtn url={r.file_url} label="Download" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════ SYLLABUS TAB ═════════════════════ */
function SyllabusTab({ resources }) {
  const [expanded, setExpanded] = useState(0)
  const syllabi = resources.filter(r => r.type === 'syllabus')

  // Group by course
  const byCourse = syllabi.reduce((acc, r) => {
    const key = r.course ? `${r.course.code} — ${r.course.name}` : 'General'
    if (!acc[key]) acc[key] = []
    acc[key].push(r)
    return acc
  }, {})

  const groups = Object.entries(byCourse)

  if (groups.length === 0) {
    return (
      <div style={{ padding: '60px 0', textAlign: 'center' }}>
        <p style={pjs(14, 500, '20px', '#94a3b8')}>No syllabus files have been uploaded yet.</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {groups.map(([courseName, files], gi) => (
        <div key={gi}>
          <h3 style={{ ...pjs(16, 700, '22px', '#0f172a'), marginBottom: 14 }}>{courseName}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {files.map((r, i) => (
              <div key={r.id} style={{ background: '#ffffff', border: '1px solid #f1f5f9', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 20px', cursor: 'pointer' }}
                  onClick={() => setExpanded(expanded === `${gi}-${i}` ? null : `${gi}-${i}`)}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={inter(11, 700, '16px', '#4f46e5')}>{String(i + 1).padStart(2, '0')}</span>
                  </div>
                  <span style={{ ...pjs(15, 700, '21px', '#0f172a'), flex: 1 }}>{r.title}</span>
                  <DownloadBtn url={r.file_url} label="Download PDF" />
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ transform: expanded === `${gi}-${i}` ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>
                    <path d="M3 5l4 4 4-4" stroke="#64748b" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                {expanded === `${gi}-${i}` && (
                  <div style={{ padding: '0 20px 16px 68px' }}>
                    <p style={pjs(13, 400, '20px', '#64748b')}>
                      {r.description || 'Uploaded by ' + (r.uploader?.full_name || 'Faculty') + ' on ' + new Date(r.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

/* ═══════════════════════════ DUMMY DATA ═══════════════════════ */
const DUMMY_RESOURCES = [
  {
    id: 'd1', title: 'Unit 1 Notes — Introduction to DBMS', type: 'note',
    file_url: '#', description: 'Covers ER modeling, relational model, and SQL basics.',
    created_at: '2026-02-10T10:00:00Z',
    course: { code: 'UCS505', name: 'Database Management Systems' },
    uploader: { full_name: 'Dr. Anil Sharma' },
  },
  {
    id: 'd2', title: 'Unit 2 Notes — Advanced SQL & Normalization', type: 'note',
    file_url: '#', description: 'Functional dependencies, 1NF, 2NF, 3NF, BCNF explained with examples.',
    created_at: '2026-02-18T10:00:00Z',
    course: { code: 'UCS505', name: 'Database Management Systems' },
    uploader: { full_name: 'Dr. Anil Sharma' },
  },
  {
    id: 'd3', title: 'MST 2024 Previous Year Paper', type: 'pyq',
    file_url: '#', description: 'Mid-semester exam paper with answer key.',
    created_at: '2026-02-20T10:00:00Z',
    course: { code: 'UCS505', name: 'Database Management Systems' },
    uploader: { full_name: 'Dr. Anil Sharma' },
  },
  {
    id: 'd4', title: 'EST 2023 Previous Year Paper', type: 'pyq',
    file_url: '#', description: 'End-semester exam paper — all sections.',
    created_at: '2026-02-21T10:00:00Z',
    course: { code: 'UCS505', name: 'Database Management Systems' },
    uploader: { full_name: 'Dr. Anil Sharma' },
  },
  {
    id: 'd5', title: 'Lab Manual — SQL Queries Practice', type: 'lab',
    file_url: '#', description: 'Lab exercises 1–10 covering DDL, DML, joins and subqueries.',
    created_at: '2026-02-25T10:00:00Z',
    course: { code: 'UCS505', name: 'Database Management Systems' },
    uploader: { full_name: 'Dr. Anil Sharma' },
  },
  {
    id: 'd6', title: 'Lab Manual — PL/SQL & Triggers', type: 'lab',
    file_url: '#', description: 'Procedures, functions, cursors and trigger programs.',
    created_at: '2026-03-01T10:00:00Z',
    course: { code: 'UCS505', name: 'Database Management Systems' },
    uploader: { full_name: 'Dr. Anil Sharma' },
  },
  {
    id: 'd7', title: 'Course Syllabus 2025-26', type: 'syllabus',
    file_url: '#', description: 'Full syllabus including unit breakdown, reference books, and marks distribution.',
    created_at: '2026-01-10T10:00:00Z',
    course: { code: 'UCS505', name: 'Database Management Systems' },
    uploader: { full_name: 'Dr. Anil Sharma' },
  },
  {
    id: 'd8', title: 'Operating Systems — Unit 3 Notes', type: 'note',
    file_url: '#', description: 'Process scheduling, deadlock detection and memory management.',
    created_at: '2026-02-12T10:00:00Z',
    course: { code: 'UCS406', name: 'Operating Systems' },
    uploader: { full_name: 'Prof. Meena Kapoor' },
  },
  {
    id: 'd9', title: 'OS EST 2024 Paper', type: 'pyq',
    file_url: '#', description: 'End-semester paper with model answers.',
    created_at: '2026-02-28T10:00:00Z',
    course: { code: 'UCS406', name: 'Operating Systems' },
    uploader: { full_name: 'Prof. Meena Kapoor' },
  },
  {
    id: 'd10', title: 'OS Course Syllabus 2025-26', type: 'syllabus',
    file_url: '#', description: 'Complete syllabus with lecture plan and evaluation scheme.',
    created_at: '2026-01-12T10:00:00Z',
    course: { code: 'UCS406', name: 'Operating Systems' },
    uploader: { full_name: 'Prof. Meena Kapoor' },
  },
  {
    id: 'd11', title: 'CN Reference Paper — TCP/IP Congestion Control', type: 'paper',
    file_url: '#', description: 'IEEE paper on modern congestion control algorithms.',
    created_at: '2026-03-05T10:00:00Z',
    course: { code: 'UCS403', name: 'Computer Networks' },
    uploader: { full_name: 'Dr. Rajesh Verma' },
  },
  {
    id: 'd12', title: 'CN Lab Manual — Socket Programming', type: 'lab',
    file_url: '#', description: 'Exercises on TCP/UDP socket programming in C.',
    created_at: '2026-03-08T10:00:00Z',
    course: { code: 'UCS403', name: 'Computer Networks' },
    uploader: { full_name: 'Dr. Rajesh Verma' },
  },
]

/* ═══════════════════════════ MAIN PAGE ════════════════════════ */
const TABS = ['Overview', 'All Files', 'Syllabus']

export default function Resources() {
  const [activeTab,  setActiveTab]  = useState('Overview')
  const [activeType, setActiveType] = useState('all')
  const [resources,  setResources]  = useState([])
  const [courses,    setCourses]    = useState([])
  const [loading,    setLoading]    = useState(true)
  const [search,     setSearch]     = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [resRes, courseRes] = await Promise.all([
        api.get('/api/resources').catch(() => ({ success: false })),
        api.get('/api/lms/courses').catch(() => ({ success: false })),
      ])
      const fetched = resRes.success ? (resRes.data || []) : []
      setResources(fetched.length > 0 ? fetched : DUMMY_RESOURCES)
      if (courseRes.success) setCourses(courseRes.data || [])
    } catch (err) {
      console.error(err)
      setResources(DUMMY_RESOURCES)
    } finally {
      setLoading(false)
    }
  }

  // Unique courses from resources
  const linkedCourses = Object.values(
    resources.reduce((acc, r) => {
      if (r.course && !acc[r.course.code]) acc[r.course.code] = r.course
      return acc
    }, {})
  )

  const filteredResources = search
    ? resources.filter(r =>
        r.title.toLowerCase().includes(search.toLowerCase()) ||
        r.course?.code?.toLowerCase().includes(search.toLowerCase()) ||
        r.type?.toLowerCase().includes(search.toLowerCase())
      )
    : resources

  return (
    <PageLayout>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ ...pjs(26, 800, '34px', '#0f172a'), margin: 0 }}>Academic Resources</h1>
          <p style={{ ...pjs(14, 400, '21px', '#64748b'), marginTop: 4, marginBottom: 0 }}>Notes, PYQs, lab files, and syllabi uploaded by your faculty.</p>
        </div>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 300px', maxWidth: 400 }}>
          <svg style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} width="15" height="15" viewBox="0 0 15 15" fill="none">
            <circle cx="6.5" cy="6.5" r="5.5" stroke="#94a3b8" strokeWidth="1.3" />
            <path d="M11 11l3 3" stroke="#94a3b8" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          <input
            type="text" placeholder="Search resources..." value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ 
              width: '100%', padding: '12px 16px 12px 42px', 
              borderRadius: 14, border: '1px solid #e2e8f0', 
              fontSize: 14, outline: 'none', boxSizing: 'border-box', background: '#fff',
              ...pjs(14, 400, '20px', '#0f172a'),
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)' 
            }}
            onFocus={e => e.target.style.borderColor = '#4f46e5'}
            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
          />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid #f1f5f9', marginBottom: 4 }}>
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: '12px 22px', background: 'none', border: 'none', cursor: 'pointer',
            ...pjs(14, activeTab === tab ? 700 : 500, '20px', activeTab === tab ? '#4f46e5' : '#64748b'),
            borderBottom: activeTab === tab ? '2px solid #4f46e5' : '2px solid transparent',
            marginBottom: -2,
          }}>{tab}</button>
        ))}
      </div>

      {/* Tab content */}
      {loading ? (
        <div style={{ padding: '60px 0', textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>Loading resources...</div>
      ) : (
        <>
          {activeTab === 'Overview'  && <OverviewTab resources={filteredResources} courses={linkedCourses} />}
          {activeTab === 'All Files' && <FilesTab resources={filteredResources} activeType={activeType} setActiveType={setActiveType} />}
          {activeTab === 'Syllabus'  && <SyllabusTab resources={filteredResources} />}
        </>
      )}
    </PageLayout>
  )
}
