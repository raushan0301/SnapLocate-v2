import { useState } from 'react'
import PageLayout from '../../components/PageLayout'

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
      <path d="M15 18h4M15 20h2" stroke="white" strokeWidth="1" strokeLinecap="round" />
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

const DownloadBtn = ({ label = 'Download', color = '#4f46e5', small = false }) => (
  <button style={{
    display: 'flex', alignItems: 'center', gap: 6,
    padding: small ? '7px 14px' : '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
    background: color === 'outline' ? '#f5f3ff' : color,
    ...pjs(small ? 12 : 13, 600, '18px', color === 'outline' ? '#4f46e5' : '#ffffff'),
    flexShrink: 0, whiteSpace: 'nowrap',
  }}>
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <path d="M6.5 1v8M3 7l3.5 3.5L10 7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M1 12h11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
    {label}
  </button>
)

/* ═══════════════════════════════ TAB CONTENTS ════════════════════ */

/* ── OVERVIEW ─────────────────────────────────────────────────── */
function OverviewTab() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Course Description */}
        <div style={{ background: '#ffffff', border: '1px solid #f1f5f9', borderRadius: 14, padding: 22, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="8" stroke="#4f46e5" strokeWidth="1.3" /><path d="M9 8v5M9 6v.5" stroke="#4f46e5" strokeWidth="1.3" strokeLinecap="round" /></svg>
            <span style={pjs(16, 700, '22px', '#0f172a')}>Course Description</span>
          </div>
          <p style={pjs(13, 400, '21px', '#64748b')}>This course provides a comprehensive introduction to database management systems, covering relational models, SQL, database design, transaction processing, and concurrency control. Students will gain practical experience in designing and implementing robust database applications suitable for enterprise environments.</p>
          <p style={{ ...pjs(13, 400, '21px', '#64748b'), marginTop: 12 }}>The curriculum emphasizes both the theoretical foundations of modern database systems and practical skills required for database administration and application development.</p>
        </div>

        {/* Learning Outcomes */}
        <div style={{ background: '#ffffff', border: '1px solid #f1f5f9', borderRadius: 14, padding: 22, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 1l2 4h4l-3 3 1 5-4-2.5L5 13l1-5L3 5h4L9 1z" stroke="#4f46e5" strokeWidth="1.3" strokeLinejoin="round" /></svg>
            <span style={pjs(16, 700, '22px', '#0f172a')}>Learning Outcomes</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              'Design entity-relationship models and convert them to relational schemas.',
              'Write complex SQL queries for data retrieval and manipulation.',
              'Apply normalization techniques to optimize database structures.',
              'Understand principles of transaction management and concurrency control.',
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ marginTop: 2, flexShrink: 0 }}>
                  <path d="M3 8l3 3 7-7" stroke="#4f46e5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span style={pjs(13, 400, '20px', '#374151')}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right sidebar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Pre-requisites */}
        <div style={{ background: '#ffffff', border: '1px solid #f1f5f9', borderRadius: 14, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2a4 4 0 100 8 4 4 0 000-8zM4 10a5 5 0 016 0" stroke="#64748b" strokeWidth="1.2" strokeLinecap="round" /></svg>
            <span style={{ ...inter(11, 700, '15px', '#64748b'), textTransform: 'uppercase', letterSpacing: '0.08em' }}>Pre-Requisites</span>
          </div>
          {[{ code: 'CS201', name: 'Data Structures' }, { code: 'CS105', name: 'Discrete Mathematics' }].map((r, i) => (
            <div key={i} style={{ padding: '12px 0', borderBottom: i < 1 ? '1px solid #f1f5f9' : 'none' }}>
              <div style={{ ...inter(10, 600, '14px', '#94a3b8'), marginBottom: 4 }}>{r.code}</div>
              <div style={pjs(13, 700, '18px', '#0f172a')}>{r.name}</div>
            </div>
          ))}
        </div>

        {/* Credit Distribution */}
        <div style={{ background: '#ffffff', border: '1px solid #f1f5f9', borderRadius: 14, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="#64748b" strokeWidth="1.2" /><path d="M8 5v3l2 2" stroke="#64748b" strokeWidth="1.2" strokeLinecap="round" /></svg>
            <span style={{ ...inter(11, 700, '15px', '#64748b'), textTransform: 'uppercase', letterSpacing: '0.08em' }}>Credit Distribution</span>
          </div>
          <div style={{ marginBottom: 14 }}>
            <span style={pjs(32, 800, '40px', '#0f172a')}>4.0</span>
            <span style={{ ...pjs(13, 500, '18px', '#64748b'), marginLeft: 6 }}>Total Credits</span>
          </div>
          {[{ label: 'Lectures', val: 2.5, color: '#4f46e5', pct: 63 }, { label: 'Lab Work', val: 1.0, color: '#7c3aed', pct: 25 }, { label: 'Project', val: 0.5, color: '#e0e7ff', pct: 12 }].map((c, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={pjs(12, 500, '16px', '#64748b')}>{c.label}</span>
                <span style={pjs(12, 700, '16px', '#0f172a')}>{c.val}</span>
              </div>
              <div style={{ height: 5, background: '#f1f5f9', borderRadius: 10 }}>
                <div style={{ height: '100%', width: `${c.pct}%`, background: c.color, borderRadius: 10 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── SYLLABUS ─────────────────────────────────────────────────── */
function SyllabusTab() {
  const [expanded, setExpanded] = useState(0)
  const units = [
    { num: '01', label: 'MST 2026', hours: '12 Hours', topics: ['Introduction to DBMS', 'ER Modeling', 'Relational Model', 'SQL Basics', 'Normalization'] },
    { num: '02', label: 'Quiz 1', hours: '14 Hours', topics: ['Advanced SQL', 'Transactions', 'Concurrency Control', 'Recovery Systems'] },
    { num: '03', label: 'EST 2026', hours: '10 Hours', topics: ['Distributed Databases', 'NoSQL', 'Query Optimization', 'Database Security'] },
  ]
  const books = [
    { title: 'Principles of Resource Management', author: 'Jane Doe, John Smith', color: '#065f46' },
    { title: 'Digital Cataloging in the 21st Century', author: 'Alice Brown', color: '#92400e' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h3 style={{ ...pjs(16, 700, '22px', '#0f172a'), marginBottom: 14 }}>Breakdown</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {units.map((u, i) => (
            <div key={i} style={{ background: '#ffffff', border: '1px solid #f1f5f9', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <div
                style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 20px', cursor: 'pointer' }}
                onClick={() => setExpanded(expanded === i ? null : i)}
              >
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={inter(12, 700, '16px', '#4f46e5')}>{u.num}</span>
                </div>
                <span style={{ ...pjs(15, 700, '21px', '#0f172a'), flex: 1 }}>{u.label}</span>
                {i === 0 && (
                  <button style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', borderRadius: 10, border: 'none', cursor: 'pointer', background: '#4f46e5', ...pjs(13, 600, '18px', '#ffffff') }}>
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1v8M3 7l3.5 3.5L10 7" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /><path d="M1 12h11" stroke="white" strokeWidth="1.3" strokeLinecap="round" /></svg>
                    Download PDF
                  </button>
                )}
                <span style={pjs(12, 500, '16px', '#94a3b8')}>{u.hours}</span>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ transform: expanded === i ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                  <path d="M3 5l4 4 4-4" stroke="#64748b" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              {expanded === i && (
                <div style={{ padding: '0 20px 16px 68px', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {u.topics.map((t, ti) => (
                    <span key={ti} style={{ ...pjs(12, 500, '16px', '#4f46e5'), background: '#eef2ff', padding: '4px 12px', borderRadius: 20 }}>{t}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Reference Books */}
      <div>
        <h3 style={{ ...pjs(16, 700, '22px', '#0f172a'), marginBottom: 14 }}>Reference Books</h3>
        <div style={{ display: 'flex', gap: 16 }}>
          {books.map((b, i) => (
            <div key={i} style={{ width: 140, background: '#ffffff', border: '1px solid #f1f5f9', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <div style={{ height: 130, background: b.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="40" height="50" viewBox="0 0 40 50" fill="none"><rect width="40" height="50" rx="3" fill="rgba(255,255,255,0.1)" /><rect x="5" y="10" width="20" height="25" rx="2" fill="rgba(255,255,255,0.2)" /><circle cx="28" cy="32" r="8" fill="rgba(255,255,255,0.15)" /></svg>
              </div>
              <div style={{ padding: '10px 12px' }}>
                <div style={pjs(11, 700, '15px', '#0f172a')}>{b.title}</div>
                <div style={{ ...pjs(10, 400, '14px', '#94a3b8'), marginTop: 3 }}>{b.author}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── NOTES ────────────────────────────────────────────────────── */
function NotesTab() {
  const notes = [
    { icon: <PdfIcon />, title: 'Unit 1: Introduction to DBMS & ER Modeling', by: 'Prof. R. Gupta', size: '2.4 MB' },
    { icon: <VideoIcon />, title: 'Unit 2: Relational Model & SQL Basics', by: 'Prof. A. Sharma', size: '5.1 MB' },
    { icon: <PdfIcon />, title: 'Unit 3: Normalization & Functional...', by: 'Dr. K. Patel', size: '1.8 MB' },
    { icon: <DocIcon />, title: 'Handwritten Notes: Transaction...', by: "Topper's Contribution", size: '12 MB' },
    { icon: <PdfIcon />, title: 'Unit 4: Concurrency Control Protocols', by: 'Prof. A. Sharma', size: '3.2 MB' },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <h3 style={pjs(16, 700, '22px', '#0f172a')}>Lecture Notes</h3>
        <div style={{ display: 'flex', gap: 10 }}>
          {['Filter', 'Sort'].map(l => (
            <button key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#ffffff', cursor: 'pointer', ...pjs(12, 600, '16px', '#64748b') }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 3h10M3 6h6M5 9h2" stroke="#64748b" strokeWidth="1.2" strokeLinecap="round" /></svg>
              {l}
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {notes.map((n, i) => (
          <div key={i} style={{ background: '#ffffff', border: '1px solid #f1f5f9', borderRadius: 14, padding: 18, boxShadow: '0 1px 4px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              {n.icon}
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="3" r="1.2" fill="#94a3b8" /><circle cx="8" cy="8" r="1.2" fill="#94a3b8" /><circle cx="8" cy="13" r="1.2" fill="#94a3b8" /></svg>
            </div>
            <div>
              <div style={pjs(13, 700, '18px', '#0f172a')}>{n.title}</div>
              <div style={{ ...pjs(11, 400, '15px', '#94a3b8'), marginTop: 4 }}>{n.by} • {n.size}</div>
            </div>
            <DownloadBtn small />
          </div>
        ))}
        {/* Contribute card */}
        <div style={{ background: '#ffffff', border: '2px dashed #e2e8f0', borderRadius: 14, padding: 18, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: 'pointer', minHeight: 160 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#f8fafc', border: '2px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 4v10M4 9h10" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" /></svg>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={pjs(13, 600, '18px', '#64748b')}>Contribute Notes</div>
            <div style={{ ...pjs(11, 400, '15px', '#94a3b8'), marginTop: 3 }}>Help your peers by uploading resources</div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── PYQs ─────────────────────────────────────────────────────── */
function PyqsTab() {
  const [activeType, setActiveType] = useState('MST (Mid Semester)')
  const types = ['MST (Mid Semester)', 'EST (End Semester)', 'Auxi (Auxiliary)']

  const papers2024 = [
    { title: 'DBMS MST-1 Paper', sub: 'Feb 2024 • Section A & B', size: '2.4 MB' },
    { title: 'DBMS MST-2 Paper', sub: 'April 2024 • Section C & D', size: '1.8 MB' },
  ]
  const papers2023 = [
    { title: 'DBMS MST-1 Paper', sub: 'Feb 2023 • Regular', size: '2.1 MB' },
    { title: 'DBMS MST-2 Paper', sub: 'April 2023 • Regular', size: '2.3 MB' },
    { title: 'DBMS Re-MST Paper', sub: 'May 2023 • Special Case', size: '3.0 MB' },
  ]

  const PaperCard = ({ p, cols }) => (
    <div style={{ background: '#ffffff', border: '1px solid #f1f5f9', borderRadius: 14, padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <PdfIcon />
        <span style={{ ...pjs(11, 600, '15px', '#94a3b8'), background: '#f8fafc', padding: '3px 8px', borderRadius: 6 }}>{p.size}</span>
      </div>
      <div>
        <div style={pjs(14, 700, '19px', '#0f172a')}>{p.title}</div>
        <div style={{ ...pjs(11, 400, '15px', '#94a3b8'), marginTop: 3 }}>{p.sub}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button style={{ flex: 1, padding: '9px', borderRadius: 10, border: 'none', background: '#f5f3ff', cursor: 'pointer', ...pjs(12, 600, '16px', '#4f46e5') }}>Preview</button>
        <button style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v9M3.5 8L7 11.5 10.5 8" stroke="#64748b" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /><path d="M1 13h12" stroke="#64748b" strokeWidth="1.3" strokeLinecap="round" /></svg>
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Sub tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid #f1f5f9' }}>
        {types.map(t => (
          <button key={t} onClick={() => setActiveType(t)} style={{
            padding: '10px 20px', border: 'none', cursor: 'pointer', background: 'transparent',
            borderBottom: activeType === t ? '2px solid #4f46e5' : '2px solid transparent',
            marginBottom: -2,
            ...pjs(13, activeType === t ? 700 : 500, '18px', activeType === t ? '#4f46e5' : '#64748b'),
            transition: 'all 0.15s',
          }}>{t}</button>
        ))}
      </div>

      <div>
        <h4 style={{ ...pjs(15, 700, '21px', '#0f172a'), marginBottom: 14 }}>Academic Year 2024</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          {papers2024.map((p, i) => <PaperCard key={i} p={p} />)}
        </div>
      </div>
      <div>
        <h4 style={{ ...pjs(15, 700, '21px', '#0f172a'), marginBottom: 14 }}>Academic Year 2023</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {papers2023.map((p, i) => <PaperCard key={i} p={p} />)}
        </div>
      </div>
    </div>
  )
}

/* ── LAB & TUTES ──────────────────────────────────────────────── */
function LabTab() {
  const labs = [
    { icon: <PdfIcon />, title: 'Lab 1: Enterprise System Setup', meta: 'PDF • 2.4 MB • Updated Sep 10', locked: false },
    { icon: <PdfIcon />, title: 'Lab 2: Spatial Data Visualization', meta: 'PDF • 4.1 MB • Updated Sep 17', locked: false },
    { icon: <DocIcon />, title: 'Lab 3: Geocoding Workflows', meta: 'DOCX • 1.2 MB • Updated Sep 24', locked: false },
    { icon: <PdfIcon />, title: 'Lab 4: Advanced Querying', meta: 'PDF • 3.5 MB • Updated Oct 1', locked: true },
  ]
  const tutes = [
    { icon: <XlsxIcon />, title: 'Tute 1: Coordinate Systems', meta: 'XLSX • 850 KB • Updated Sep 12', locked: false },
    { icon: <PdfIcon />, title: 'Tute 2: Map Projections', meta: 'PDF • 1.8 MB • Updated Sep 19', locked: false },
    { icon: <PdfIcon />, title: 'Tute 3: Database Integration', meta: 'PDF • 2.1 MB • Updated Sep 26', locked: false },
  ]

  const FileRow = ({ f }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', background: '#ffffff', border: '1px solid #f1f5f9', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
      {f.icon}
      <div style={{ flex: 1 }}>
        <div style={pjs(13, 700, '18px', '#0f172a')}>{f.title}</div>
        <div style={{ ...pjs(11, 400, '15px', '#94a3b8'), marginTop: 2 }}>{f.meta}</div>
      </div>
      {f.locked ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, ...pjs(12, 500, '16px', '#94a3b8') }}>
          <svg width="13" height="14" viewBox="0 0 13 14" fill="none"><rect x="2" y="6" width="9" height="8" rx="1.5" stroke="#94a3b8" strokeWidth="1.2" /><path d="M4 6V4a2.5 2.5 0 015 0v2" stroke="#94a3b8" strokeWidth="1.2" strokeLinecap="round" /></svg>
          Locked
        </div>
      ) : (
        <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 10, border: 'none', background: '#eef2ff', cursor: 'pointer', ...pjs(12, 700, '16px', '#4f46e5') }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v8M3 7l3 3 3-3" stroke="#4f46e5" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /><path d="M1 11h10" stroke="#4f46e5" strokeWidth="1.2" strokeLinecap="round" /></svg>
          Get
        </button>
      )}
    </div>
  )

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 2L2 6l7 4 7-4-7-4zM2 10l7 4 7-4M2 14l7 4 7-4" stroke="#4f46e5" strokeWidth="1.3" strokeLinejoin="round" /></svg>
          <span style={pjs(16, 700, '22px', '#0f172a')}>Lab Manuals</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {labs.map((f, i) => <FileRow key={i} f={f} />)}
        </div>
      </div>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="2" width="14" height="14" rx="2" stroke="#22c55e" strokeWidth="1.3" /><path d="M5 6h8M5 9h8M5 12h5" stroke="#22c55e" strokeWidth="1.3" strokeLinecap="round" /></svg>
          <span style={pjs(16, 700, '22px', '#0f172a')}>Tutorial Sheets</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {tutes.map((f, i) => <FileRow key={i} f={f} />)}
        </div>
      </div>
    </div>
  )
}

/* ── VIDEO PLAYLISTS ──────────────────────────────────────────── */
function VideoPlaylistsTab() {
  const playlists = [
    { title: 'DBMS Full Course', channel: 'Gate Smashers', count: 42, duration: '18h 30m', thumb: '🎬', bg: '#1e1b4b' },
    { title: 'SQL Masterclass', channel: 'CodeWithHarry', count: 28, duration: '9h 45m', thumb: '📊', bg: '#0c4a6e' },
    { title: 'Normalization Explained', channel: 'Neso Academy', count: 12, duration: '4h 20m', thumb: '📚', bg: '#064e3b' },
    { title: 'Transaction Management', channel: 'Prof. Gupta IITB', count: 18, duration: '6h 10m', thumb: '🔄', bg: '#4c1d95' },
  ]
  return (
    <div>
      <h3 style={{ ...pjs(16, 700, '22px', '#0f172a'), marginBottom: 18 }}>Recommended Playlists</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
        {playlists.map((p, i) => (
          <div key={i} style={{ background: '#ffffff', border: '1px solid #f1f5f9', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div style={{ height: 100, background: p.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 42 }}>{p.thumb}</div>
            <div style={{ padding: '16px 18px' }}>
              <div style={pjs(14, 700, '19px', '#0f172a')}>{p.title}</div>
              <div style={{ ...pjs(12, 400, '16px', '#64748b'), marginTop: 3 }}>{p.channel}</div>
              <div style={{ display: 'flex', gap: 12, marginTop: 12, marginBottom: 14 }}>
                <span style={{ ...pjs(11, 600, '15px', '#4f46e5'), background: '#eef2ff', padding: '3px 10px', borderRadius: 20 }}>{p.count} Videos</span>
                <span style={{ ...pjs(11, 600, '15px', '#64748b'), background: '#f8fafc', padding: '3px 10px', borderRadius: 20 }}>{p.duration}</span>
              </div>
              <button style={{ width: '100%', padding: '10px', borderRadius: 10, border: 'none', background: '#4f46e5', cursor: 'pointer', ...pjs(13, 700, '18px', '#ffffff') }}>
                ▶ Watch Playlist
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ════════════════ MAIN RESOURCES PAGE ════════════════════════════ */
const TABS = ['Overview', 'Syllabus', 'Notes', 'PYQs', 'Lab & Tutes', 'Video Playlists']

export default function ResourcesPage() {
  const [activeTab, setActiveTab] = useState('Overview')

  const TabContent = {
    'Overview': <OverviewTab />,
    'Syllabus': <SyllabusTab />,
    'Notes': <NotesTab />,
    'PYQs': <PyqsTab />,
    'Lab & Tutes': <LabTab />,
    'Video Playlists': <VideoPlaylistsTab />,
  }

  return (
    <PageLayout>
      {/* ── Breadcrumb ──────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {['COE', 'SEM 4', 'DBMS'].map((crumb, i, arr) => (
          <div key={crumb} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              ...pjs(12, i === arr.length - 1 ? 700 : 500, '16px', i === arr.length - 1 ? '#0f172a' : '#94a3b8'),
              cursor: i < arr.length - 1 ? 'pointer' : 'default',
            }}>{crumb}</span>
            {i < arr.length - 1 && (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4 2l4 4-4 4" stroke="#cbd5e1" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
            )}
          </div>
        ))}
      </div>

      {/* ── Hero banner ─────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #eef2ff 0%, #f5f3ff 60%, #faf5ff 100%)',
        border: '1px solid #e0e7ff', borderRadius: 18, padding: '24px 28px',
        display: 'flex', alignItems: 'center', gap: 22, position: 'relative', overflow: 'hidden',
      }}>
        {/* Decorative blob */}
        <div style={{ position: 'absolute', right: -40, top: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(139,92,246,0.08)' }} />
        <div style={{ width: 64, height: 64, borderRadius: 16, background: '#ffffff', boxShadow: '0 4px 16px rgba(79,70,229,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="32" height="28" viewBox="0 0 32 28" fill="none">
            <ellipse cx="16" cy="5" rx="12" ry="4" stroke="#4f46e5" strokeWidth="1.5" />
            <path d="M4 5v6c0 2.2 5.4 4 12 4s12-1.8 12-4V5" stroke="#4f46e5" strokeWidth="1.5" />
            <path d="M4 11v6c0 2.2 5.4 4 12 4s12-1.8 12-4V11" stroke="#4f46e5" strokeWidth="1.5" />
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <span style={pjs(22, 800, '29px', '#0f172a')}>Database Management Systems</span>
            <span style={{ ...pjs(11, 700, '15px', '#7c3aed'), background: '#f5f3ff', border: '1px solid #ddd6fe', padding: '3px 10px', borderRadius: 20 }}>Core Subject</span>
          </div>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, ...pjs(12, 500, '16px', '#64748b') }}>
              <span style={{ color: '#94a3b8' }}>&lt;&gt;</span> Code: UCS501
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, ...pjs(12, 500, '16px', '#64748b') }}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="6.5" cy="5" r="3" stroke="#94a3b8" strokeWidth="1.1" /><path d="M1 13c0-3 2.5-5 5.5-5s5.5 2 5.5 5" stroke="#94a3b8" strokeWidth="1.1" strokeLinecap="round" /></svg>
              Lead: Dr. Anjali Sharma
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, ...pjs(12, 600, '16px', '#16a34a') }}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="6.5" cy="6.5" r="5.5" stroke="#16a34a" strokeWidth="1.1" /><path d="M4 6.5l2 2 3.5-3" stroke="#16a34a" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" /></svg>
              Resource Health: Updated 2 days ago
            </span>
          </div>
        </div>
      </div>

      {/* ── Tab navigation ──────────────────────────────── */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid #f1f5f9' }}>
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: '12px 22px', border: 'none', cursor: 'pointer', background: 'transparent',
            borderBottom: activeTab === tab ? '2px solid #4f46e5' : '2px solid transparent',
            marginBottom: -2,
            ...pjs(13, activeTab === tab ? 700 : 500, '18px', activeTab === tab ? '#4f46e5' : '#64748b'),
            transition: 'all 0.15s', whiteSpace: 'nowrap',
          }}>{tab}</button>
        ))}
      </div>

      {/* ── Active tab content ──────────────────────────── */}
      {TabContent[activeTab]}
    </PageLayout>
  )
}
