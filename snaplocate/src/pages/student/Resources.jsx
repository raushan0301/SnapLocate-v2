import { useState, useEffect, useMemo } from 'react'
import PageLayout from '../../components/PageLayout'
import { db } from '../../lib/firebase'
import { collection, getDocs } from 'firebase/firestore'

/* ─── Typography & Utilities ────────────────────────────────── */
const pjs = (size, weight, lh, color) => ({
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  fontSize: size, fontWeight: weight, lineHeight: lh, color,
})

const inter = (size, weight, lh, color) => ({
  fontFamily: "'Inter', sans-serif",
  fontSize: size, fontWeight: weight, lineHeight: lh, color,
})

/* ─── Static Data ───────────────────────────────────────────── */
const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year']
const SEMS = ['SEM 1', 'SEM 2', 'SEM 3', 'SEM 4', 'SEM 5', 'SEM 6', 'SEM 7', 'SEM 8']
const BRANCHES = ['COE', 'CSE', 'ECE', 'ME', 'CE', 'EE', 'ENC']

/* ─── Components ────────────────────────────────────────────── */
const Badge = ({ children, color = '#4f46e5', bg = '#f5f3ff' }) => (
  <span style={{ 
    padding: '4px 10px', borderRadius: 6, background: bg, color, 
    ...pjs(11, 700, '15px', color), letterSpacing: '0.04em'
  }}>{children}</span>
)

const Card = ({ children, onClick, style = {} }) => (
  <div 
    onClick={onClick}
    style={{
      background: '#ffffff', border: '1px solid #f1f5f9', borderRadius: 16, overflow: 'hidden',
      cursor: onClick ? 'pointer' : 'default', width: '100%',
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      transition: 'box-shadow 0.15s, transform 0.15s',
      ...style
    }}
    onMouseEnter={onClick ? e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.1)' } : undefined}
    onMouseLeave={onClick ? e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)' } : undefined}
  >
    {children}
  </div>
)

const DownloadBtn = ({ href, label = 'Download', iconOnly = false, secondary = false }) => (
  <a 
    href={href} target="_blank" rel="noopener noreferrer"
    style={{ 
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, 
      padding: iconOnly ? '8px' : '8px 16px', borderRadius: 10,
      background: secondary ? '#ffffff' : '#f8fafc',
      border: secondary ? '1px solid #e2e8f0' : '1px solid transparent',
      color: secondary ? '#0f172a' : '#4f46e5', textDecoration: 'none',
      ...pjs(13, 600, '18px', secondary ? '#0f172a' : '#4f46e5'),
      transition: 'all 0.15s',
    }}
    onMouseEnter={e => { e.currentTarget.style.background = secondary ? '#f8fafc' : '#4f46e5'; e.currentTarget.style.color = secondary ? '#0f172a' : '#ffffff' }}
    onMouseLeave={e => { e.currentTarget.style.background = secondary ? '#ffffff' : '#f8fafc'; e.currentTarget.style.color = secondary ? '#0f172a' : '#4f46e5' }}
  >
    {!iconOnly && <span>{label}</span>}
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  </a>
)

/* ─── Detail Views ──────────────────────────────────────────── */

const NotesView = ({ resources }) => (
  <div style={{ paddingTop: 16 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
      <h3 style={pjs(18, 700, '26px', '#0f172a')}>Lecture Notes</h3>
      <div style={{ display: 'flex', gap: 10 }}>
        <button style={{ padding: '8px 16px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', ...pjs(13, 600, '18px', '#64748b'), display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/></svg> Filter
        </button>
        <button style={{ padding: '8px 16px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', ...pjs(13, 600, '18px', '#64748b'), display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg> Sort
        </button>
      </div>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
      {resources.filter(r => r.type === 'note').map((r, i) => (
        <Card key={i} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fff1f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            </div>
          </div>
          <div>
            <h4 style={{ ...pjs(15, 700, '22px', '#0f172a'), margin: '0 0 4px 0' }}>{r.title}</h4>
            <p style={{ ...pjs(12, 500, '16px', '#94a3b8'), margin: 0 }}>Uploader: {r.uploader?.full_name || 'Academic Team'}</p>
          </div>
          <DownloadBtn href={r.file_url} secondary />
        </Card>
      ))}
      <div style={{ border: '2px dashed #e2e8f0', borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', cursor: 'pointer', background: '#fafafa' }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#fff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </div>
        <h4 style={{ ...pjs(14, 700, '20px', '#0f172a'), margin: 0 }}>Contribute Notes</h4>
        <p style={{ ...pjs(12, 500, '16px', '#94a3b8'), marginTop: 4 }}>Help your peers by uploading</p>
      </div>
    </div>
  </div>
)

const PYQsView = ({ resources }) => {
  const [cat, setCat] = useState('MST')
  return (
    <div style={{ paddingTop: 16 }}>
      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid #f1f5f9', paddingBottom: 16, marginBottom: 24 }}>
        {['MST (Mid Semester)', 'EST (End Semester)', 'Auxi (Auxiliary)'].map(t => {
          const type = t.split(' ')[0]
          return (
            <button key={type} onClick={() => setCat(type)} style={{
              padding: '8px 16px', background: cat === type ? '#f8fafc' : 'transparent', 
              border: cat === type ? '1px solid #e2e8f0' : '1px solid transparent', borderRadius: 10, cursor: 'pointer',
              ...pjs(13, cat === type ? 700 : 500, '18px', cat === type ? '#0f172a' : '#64748b'),
              transition: 'all 0.15s'
            }}>{t}</button>
          )
        })}
      </div>
      
      <div>
        <h3 style={{ ...pjs(16, 700, '24px', '#0f172a'), marginBottom: 20 }}>Academic Year 2024</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
          {resources.filter(r => r.type === 'pyq' && r.title.includes(cat)).map((r, i) => (
            <Card key={i} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: '#fff1f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>
                </div>
                <span style={pjs(12, 600, '16px', '#94a3b8')}>2.4 MB</span>
              </div>
              <div>
                <h4 style={{ ...pjs(15, 700, '22px', '#0f172a'), margin: '0 0 4px 0' }}>{r.title} Paper</h4>
                <p style={{ ...pjs(12, 500, '18px', '#94a3b8'), margin: 0 }}>Section A & B</p>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 'auto' }}>
                <a href={r.file_url} target="_blank" rel="noreferrer" style={{ flex: 1, textAlign: 'center', padding: '10px', background: '#f5f3ff', color: '#4f46e5', borderRadius: 10, ...pjs(13, 700, '18px', '#4f46e5'), textDecoration: 'none' }}>Preview</a>
                <DownloadBtn href={r.file_url} iconOnly />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

const LabView = ({ resources }) => (
  <div style={{ paddingTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
        <h3 style={pjs(16, 700, '24px', '#0f172a')}>Lab Manuals</h3>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {resources.filter(r => r.type === 'lab').map((r, i) => (
          <div key={i} style={{ background: '#fff', border: '1px solid #f1f5f9', borderRadius: 16, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#fff1f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={pjs(14, 700, '20px', '#0f172a')}>{r.title}</div>
              <div style={pjs(12, 500, '16px', '#94a3b8')}>PDF • 2.4 MB</div>
            </div>
            <a href={r.file_url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#4f46e5', textDecoration: 'none', ...pjs(13, 700, '18px', '#4f46e5'), background: '#f5f3ff', padding: '6px 12px', borderRadius: 8 }}>
               <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/></svg> Get
            </a>
          </div>
        ))}
      </div>
    </div>
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
         <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" strokeLinecap="round"/><path d="M9 3v18M3 9h18M3 15h18"/></svg>
         <h3 style={pjs(16, 700, '24px', '#0f172a')}>Tutorial Sheets</h3>
      </div>
      <div style={{ background: '#f8fafc', border: '1px dashed #e2e8f0', borderRadius: 16, padding: '40px 20px', textAlign: 'center' }}>
         <p style={pjs(13, 500, '20px', '#94a3b8')}>Tutorials are normally shared in your respective notes folder.</p>
      </div>
    </div>
  </div>
)

/* ─── Main Component ───────────────────────────────────────── */
export default function Resources() {
  const [loading, setLoading] = useState(true)
  const [resources, setResources] = useState([])
  const [selection, setSelection] = useState({ year: '2nd Year', sem: 'SEM 4', branch: 'COE' })
  const [activeCourse, setActiveCourse] = useState(null)
  const [activeTab, setActiveTab] = useState('Overview')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetchRes = async () => {
      setLoading(true)
      try {
        const col = collection(db, "academic")
        const snap = await getDocs(col)
        const all = []
        snap.forEach((doc) => {
          const data = doc.data()
          const docId = doc.id
          const base = {
            subject: data.subject || docId,
            uploader: { full_name: data.contributor || 'Academic Team' },
            branch: data.branch, semester: String(data.semester), year: data.year
          }
          const flat = (arr, type, pre = '') => {
            if (!arr || !Array.isArray(arr)) return
            arr.forEach((item, idx) => {
              all.push({ id: `${docId}-${type}-${idx}`, title: `${pre}${item.name}`, file_url: item.url, type, ...base })
            })
          }
          flat(data.notes, 'note')
          flat(data.labManual, 'lab', 'Lab ')
          flat(data.playlist, 'video', 'Video ')
          flat(data.syllabus, 'syllabus')
          if (data.pyq) {
            flat(data.pyq.auxi, 'pyq', 'Auxi — ')
            flat(data.pyq.est, 'pyq', 'EST — ')
            flat(data.pyq.mst, 'pyq', 'MST — ')
          }
        })
        setResources(all)
      } catch (err) { console.error(err) } finally { setLoading(false) }
    }
    fetchRes()
  }, [])

  const filtered = useMemo(() => {
    return resources.filter(r => {
      const matchPath = r.year === selection.year && r.semester.includes(selection.sem.replace('SEM ', '')) && r.branch === selection.branch
      const matchSearch = !search || r.subject.toLowerCase().includes(search.toLowerCase())
      return matchPath && matchSearch
    })
  }, [resources, selection, search])

  const courseMap = useMemo(() => {
    return filtered.reduce((acc, r) => {
      if (!acc[r.subject]) acc[r.subject] = []
      acc[r.subject].push(r)
      return acc
    }, {})
  }, [filtered])

  const subjects = Object.keys(courseMap)

  // ──────────────── VIEW: Detail ────────────────
  if (activeCourse) {
    const activeData = courseMap[activeCourse] || []
    return (
      <PageLayout>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 20 }}>
          <button onClick={() => setActiveCourse(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#64748b', display: 'flex', alignItems: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <span style={pjs(13, 600, '20px', '#94a3b8')}>{selection.branch}</span>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
          <span style={pjs(13, 600, '20px', '#94a3b8')}>{selection.sem}</span>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
          <span style={pjs(13, 700, '20px', '#0f172a')}>{activeCourse}</span>
        </div>

        {/* Hero Banner aligned with Classroom's clean design */}
        <div style={{
          background: 'linear-gradient(120deg, #f8fafc 0%, #ffffff 100%)', 
          borderRadius: 20, padding: 32, border: '1px solid #f1f5f9', marginBottom: 32,
          display: 'flex', alignItems: 'center', gap: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.02)'
        }}>
           <div style={{ width: 80, height: 80, borderRadius: 20, background: '#fff', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
           </div>
           <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <h1 style={{ ...pjs(26, 700, '34px', '#0f172a'), margin: 0 }}>{activeCourse}</h1>
                <Badge>Core Subject</Badge>
              </div>
              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
                    <span style={pjs(13, 500, '20px', '#64748b')}>Code: UCS501</span>
                 </div>
                 <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    <span style={pjs(13, 500, '20px', '#64748b')}>Lead: {activeData[0]?.uploader?.full_name || 'Academic Team'}</span>
                 </div>
                 <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="8 12 11 15 16 10"/></svg>
                    <span style={pjs(13, 600, '20px', '#059669')}>Resource Health: Checked</span>
                 </div>
              </div>
           </div>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid #f1f5f9', paddingBottom: 16, marginBottom: 16 }}>
          {['Overview', 'Syllabus', 'Notes', 'PYQs', 'Lab & Tutes', 'Video Playlists'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: '8px 18px', borderRadius: 24, border: activeTab === tab ? 'none' : '1.5px solid #e2e8f0',
              background: activeTab === tab ? '#4f46e5' : '#ffffff', cursor: 'pointer', transition: 'all 0.15s',
              ...pjs(13, activeTab === tab ? 700 : 500, '18px', activeTab === tab ? '#ffffff' : '#64748b'),
            }}>{tab}</button>
          ))}
        </div>

        {activeTab === 'Notes' && <NotesView resources={activeData} />}
        {activeTab === 'PYQs' && <PYQsView resources={activeData} />}
        {activeTab === 'Lab & Tutes' && <LabView resources={activeData} />}
        {['Overview', 'Syllabus', 'Video Playlists'].includes(activeTab) && (
          <div style={{ padding: '80px 0', textAlign: 'center' }}>
             <h3 style={pjs(16, 600, '24px', '#64748b')}>The {activeTab} view is being synchronized.</h3>
             <p style={pjs(14, 400, '20px', '#94a3b8')}>Check back soon.</p>
          </div>
        )}
      </PageLayout>
    )
  }

  // ──────────────── VIEW: Browse ────────────────
  return (
    <PageLayout>
      {/* Header aligned exactly like Classroom.jsx */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
        <div>
          <h1 style={pjs(26, 700, '34px', '#0f172a')}>Academic Hub</h1>
          <p  style={{ ...pjs(14, 400, '20px', '#64748b'), marginTop: 4 }}>Access your course materials securely.</p>
        </div>

        <div style={{ position: 'relative', flex: '1 1 300px', maxWidth: 400 }}>
          <svg style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} width="15" height="15" viewBox="0 0 15 15" fill="none">
            <circle cx="6.5" cy="6.5" r="5.5" stroke="#94a3b8" strokeWidth="1.3"/>
            <path d="M11 11l3 3" stroke="#94a3b8" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
          <input
            type="text" placeholder="Search resources..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '12px 16px 12px 42px',
              background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 14,
              ...pjs(14, 400, '20px', '#0f172a'), outline: 'none',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)', boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Controls like Classroom.jsx filter bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', gap: 10 }}>
              {[
                { label: 'Year', val: selection.year, opts: YEARS, field: 'year' },
                { label: 'Sem', val: selection.sem, opts: SEMS, field: 'sem' },
                { label: 'Branch', val: selection.branch, opts: BRANCHES, field: 'branch' },
              ].map(f => (
                <div key={f.field} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={pjs(13, 400, '18px', '#64748b')}>{f.label}:</span>
                  <select
                    value={f.val}
                    onChange={e => setSelection(s => ({ ...s, [f.field]: e.target.value }))}
                    style={{
                      ...pjs(13, 600, '18px', '#0f172a'),
                      background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '7px 12px',
                      outline: 'none', cursor: 'pointer', appearance: 'none', paddingRight: '28px',
                      backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3Csvg width=\\\'10\\\' height=\\\'6\\\' viewBox=\\\'0 0 10 6\\\' fill=\\\'none\\\' xmlns=\\\'http://www.w3.org/2000/svg\\\'%3E%3Cpath d=\\\'M1 1L5 5L9 1\\\' stroke=\\\'%2364748b\\\' stroke-width=\\\'1.3\\\' stroke-linecap=\\\'round\\\' stroke-linejoin=\\\'round\\\'/%3E%3C/svg%3E")',
                      backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center'
                    }}
                  >
                    {f.opts.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              ))}
            </div>
            
            <div style={{ ...pjs(13, 500, '18px', '#64748b') }}>Showing {subjects.length} courses</div>
          </div>

          {/* Grid Layout matches Classroom */}
          {loading ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', background: '#ffffff', borderRadius: 16, border: '1px solid #f1f5f9' }}>
               <div style={pjs(14, 500, '22px', '#94a3b8')}>Synchronizing with Academic Cloud...</div>
            </div>
          ) : subjects.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', background: '#ffffff', borderRadius: 16, border: '1px solid #f1f5f9' }}>
               <div style={pjs(14, 500, '22px', '#94a3b8')}>No courses found matching your criteria.</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
              {subjects.map(s => (
                <Card key={s} onClick={() => setActiveCourse(s)} style={{ padding: 20 }}>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                    </div>
                    <div>
                      <h3 style={{ ...pjs(16, 700, '22px', '#0f172a'), margin: 0 }}>{s}</h3>
                      <p style={{ ...pjs(13, 400, '18px', '#64748b'), marginTop: 4 }}>{courseMap[s].length} Resources</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
        
        {/* Right Info Panel (Optional but adds consistency) */}
        <div style={{ width: 300, flexShrink: 0, background: '#ffffff', border: '1px solid #f1f5f9', borderRadius: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
           <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ ...pjs(11, 700, '15px', '#4f46e5'), letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Overview</div>
              <div style={pjs(18, 700, '24px', '#0f172a')}>Syllabus Tracker</div>
           </div>
           <div style={{ padding: '24px 20px', textAlign: 'center' }}>
              <div style={pjs(13, 400, '18px', '#94a3b8')}>Select a course on the left to securely view and download approved academic files.</div>
           </div>
        </div>
      </div>
    </PageLayout>
  )
}
