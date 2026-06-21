import { useState, useEffect, useRef } from 'react'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'

/* ─── Typography helpers ──────────────────────────────────────── */
const pjs = (size, weight, lh, color) => ({
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  fontSize: size, fontWeight: weight, lineHeight: lh, color, margin: 0,
})
const inter = (size, weight, lh, color) => ({
  fontFamily: "'Inter', sans-serif",
  fontSize: size, fontWeight: weight, lineHeight: lh, color, margin: 0,
})

/* ─── 24h → 12h converter ─────────────────────────────────────── */
function fmt12(str) {
  if (!str || !str.includes('-')) return str
  try {
    const convert = t => {
      const [hh, mm] = t.split(':').map(Number)
      const period = hh >= 12 ? 'PM' : 'AM'
      const h = hh % 12 || 12
      return `${h}:${mm.toString().padStart(2, '0')} ${period}`
    }
    const [start, end] = str.split('-')
    const startH = parseInt(start.split(':')[0])
    const endH = parseInt(end.split(':')[0])
    const startP = startH >= 12 ? 'PM' : 'AM'
    const endP = endH >= 12 ? 'PM' : 'AM'
    if (startP === endP) {
      const fmtShort = t => { const [hh, mm] = t.split(':').map(Number); const h = hh % 12 || 12; return `${h}:${mm.toString().padStart(2, '0')}` }
      return `${fmtShort(start)}–${fmtShort(end)} ${endP}`
    }
    return `${convert(start)}–${convert(end)}`
  } catch (e) { return str }
}

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']
const ALL_TIME_SLOTS = [
  '08:00-08:50', '08:50-09:40', '09:40-10:30', '10:30-11:20', '11:20-12:10',
  '12:10-13:00', '13:00-13:50', '13:50-14:40', '14:40-15:30', '15:30-16:20',
  '16:20-17:10', '17:10-18:00', '18:00-18:50'
]

/* ─── Color Presets ───────────────────────────────────────────── */
const C = {
  indigo: { bg: '#e0e7ff', border: '#4f46e5', tc: '#4f46e5', sc: '#6366f1' },
  orange: { bg: '#fff7ed', border: '#f97316', tc: '#ea580c', sc: '#f97316' },
  green: { bg: '#f0fdf4', border: '#22c55e', tc: '#16a34a', sc: '#22c55e' },
  red: { bg: '#fee2e2', border: '#ef4444', tc: '#dc2626', sc: '#ef4444' },
  violet: { bg: '#f5f3ff', border: '#7c3aed', tc: '#7c3aed', sc: '#a78bfa' },
  amber: { bg: '#fffbeb', border: '#f59e0b', tc: '#d97706', sc: '#f59e0b' },
}
const PRESETS = Object.keys(C)

/* ─── SVG Icons ───────────────────────────────────────────────── */
const IconNotes = () => (<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="1" width="10" height="14" rx="1.5" stroke="#4f46e5" strokeWidth="1.3" /><path d="M5 5h6M5 8h6M5 11h3" stroke="#4f46e5" strokeWidth="1.3" strokeLinecap="round" /><path d="M12 5l2 2-2 2" stroke="#4f46e5" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" /></svg>)
const IconTasks = () => (<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="#4f46e5" strokeWidth="1.3" /><path d="M5 8.5l2 2 4-4.5" stroke="#4f46e5" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>)
const IconLink = () => (<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5.5 8.5a3.5 3.5 0 005 0l2-2a3.5 3.5 0 00-5-5L6.5 2.5" stroke="#4f46e5" strokeWidth="1.3" strokeLinecap="round" /><path d="M8.5 5.5a3.5 3.5 0 00-5 0l-2 2a3.5 3.5 0 005 5L7.5 11.5" stroke="#4f46e5" strokeWidth="1.3" strokeLinecap="round" /></svg>)
const IconCloud = () => (<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9.5 11H10a3 3 0 000-6h-.2A4 4 0 102.1 9.9" stroke="#4f46e5" strokeWidth="1.2" strokeLinecap="round" /><path d="M7 8v4M5 10l2-2 2 2" stroke="#4f46e5" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>)
const IconExternalLink = () => (<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M7 1h4v4" stroke="#94a3b8" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /><path d="M11 1L5 7" stroke="#94a3b8" strokeWidth="1.2" strokeLinecap="round" /><path d="M5 2H2a1 1 0 00-1 1v7a1 1 0 001 1h7a1 1 0 001-1V8" stroke="#94a3b8" strokeWidth="1.2" strokeLinecap="round" /></svg>)

/* ─── Timetable Cell ──────────────────────────────────────────── */
function Cell({ data, onClick }) {
  if (!data) return <td onClick={onClick} style={{ padding: '2px 4px', borderRight: '1px solid #f1f5f9', minWidth: 95, cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'} />

  const c = C[data.color_preset] || C.indigo
  return (
    <td onClick={onClick} style={{ padding: '2px 4px', borderRight: '1px solid #f1f5f9', cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.opacity = 0.8} onMouseLeave={e => e.currentTarget.style.opacity = 1}>
      <div style={{ background: c.bg, borderLeft: `3px solid ${c.border}`, borderRadius: '0 6px 6px 0', padding: '4px 6px' }}>
        <div style={{ ...pjs(10.5, 700, '14px', c.tc), whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{data.course}</div>
        <div style={{ ...pjs(9.5, 600, '13px', c.sc), whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{data.type} {data.location && `(${data.location})`}</div>
      </div>
    </td>
  )
}

/* ─── Modal Wrapper ─────────────────────────────────────────── */
const Modal = ({ close, title, children }) => (
  <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(2px)' }} onMouseDown={close}>
    <div style={{ background: '#fff', borderRadius: 24, width: 420, padding: 28, boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }} onMouseDown={e => e.stopPropagation()}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, alignItems: 'center' }}>
        <h3 style={pjs(18, 700, '24px', '#0f172a')}>{title}</h3>
        <button type="button" onClick={close} style={{ background: '#f1f5f9', width: 28, height: 28, borderRadius: 14, border: 'none', cursor: 'pointer', color: '#64748b', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
      </div>
      {children}
    </div>
  </div>
)

export default function Workspace({ role = 'student' }) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(null)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [uploadError, setUploadError] = useState(null)

  const [timetable, setTimetable] = useState([])
  const [notes, setNotes] = useState([])
  const [tasks, setTasks] = useState([])
  const [links, setLinks] = useState([])
  const [files, setFiles] = useState([])

  const totalBytes = files.reduce((acc, f) => acc + (f.size_bytes || 0), 0)
  const totalUsedMB = (totalBytes / (1024 * 1024)).toFixed(2)

  // Modal States
  const [ttModal, setTtModal] = useState(null)
  const [noteModal, setNoteModal] = useState(false)
  const [linkModal, setLinkModal] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const [showTaskForm, setShowTaskForm] = useState(false)

  // Sub-forms state
  const [taskInput, setTaskInput] = useState('')
  const [taskSubInput, setTaskSubInput] = useState('')
  const fileInputRef = useRef()

  const apiBase = role === 'faculty' ? '/api/faculty-workspace' : '/api/workspace'
  const ttApi = role === 'faculty' ? '/api/faculty/me/timetable' : '/api/workspace/timetable'

  const loadData = async () => {
    try {
      const endpoints = role === 'faculty'
        ? [api.get('/api/faculty/me/profile'), api.get(`${apiBase}/notes`), api.get(`${apiBase}/tasks`), api.get(`${apiBase}/links`), api.get(`${apiBase}/files`)]
        : [api.get(ttApi), api.get(`${apiBase}/notes`), api.get(`${apiBase}/tasks`), api.get(`${apiBase}/links`), api.get(`${apiBase}/files`)]

      const [rTt, rNotes, rTasks, rLinks, rFiles] = await Promise.all(endpoints)
      setTimetable(role === 'faculty' ? (rTt.data?.timetable || []) : (rTt.data || []))
      setNotes(rNotes.data || [])
      setTasks(rTasks.data || [])
      setLinks(rLinks.data || [])
      setFiles(rFiles.data || [])
    } catch (err) {
      console.error('Workspace fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [role])

  // ─── Actions ───
  const saveTimetable = async (e) => {
    e.preventDefault()
    if (saving) return
    setSaving(true)
    const fd = e.target instanceof FormData ? e.target : new FormData(e.target)
    const courseName = fd.get('course') || ''
    const payload = {
      day: ttModal.day, time_slot: ttModal.slot, course: courseName,
      location: fd.get('location'), type: fd.get('type'), color_preset: fd.get('color_preset') || 'indigo'
    }
    try {
      const dayKey = ttModal.day.toUpperCase()
      const filtered = timetable.filter(sl => !(sl.day.toUpperCase() === dayKey && (sl.time_slot === ttModal.slot || sl.time === ttModal.slot)))
      const updated = courseName ? [...filtered, payload] : filtered
      await api.put(ttApi, role === 'faculty' ? { slots: updated } : updated)
      setTimetable(updated)
      setTtModal(null)
    } catch (err) { alert("Error: " + err.message) }
    finally { setSaving(false) }
  }

  const ttMap = {}
  timetable.forEach(t => {
    const slotKey = t.time_slot || t.time
    const dayKey = t.day?.toUpperCase()
    if (!ttMap[slotKey]) ttMap[slotKey] = {}
    ttMap[slotKey][dayKey] = t
  })

  const saveNote = async (e) => {
    e.preventDefault()
    if (saving) return
    setSaving(true)
    const fd = new FormData(e.target)
    try {
      const res = await api.post(`${apiBase}/notes`, { title: fd.get('title'), body: fd.get('body'), tag: fd.get('tag'), tag_color_preset: fd.get('color_preset') })
      setNotes(prev => [res.data, ...prev]); setNoteModal(false)
    } catch (err) { alert(err.message) }
    finally { setSaving(false) }
  }

  const saveTask = async (e) => {
    e.preventDefault()
    if (!taskInput.trim() || saving) return
    setSaving(true)
    try {
      const res = await api.post(`${apiBase}/tasks`, { label: taskInput, sub: taskSubInput })
      setTasks(prev => [res.data, ...prev]); setTaskInput(''); setTaskSubInput(''); setShowTaskForm(false)
    } catch (err) { alert(err.message) }
    finally { setSaving(false) }
  }

  const toggleTask = async (id, isDone) => {
    setTasks(p => p.map(t => t.id === id ? { ...t, is_done: !isDone } : t))
    await api.patch(`${apiBase}/tasks/${id}/toggle`, { is_done: !isDone })
  }

  const saveLink = async (e) => {
    e.preventDefault()
    if (saving) return
    setSaving(true)
    const fd = new FormData(e.target)
    let url = fd.get('url')
    if (!url.startsWith('http')) url = 'https://' + url
    try {
      const res = await api.post(`${apiBase}/links`, { label: fd.get('label'), url })
      setLinks(prev => [res.data, ...prev]); setLinkModal(false)
    } catch (err) { alert(err.message) }
    finally { setSaving(false) }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploadingFile(true)
    setUploadProgress(0)
    setUploadError(null)
    setUploadSuccess(false)
    try {
      const formData = new FormData(); formData.append('file', file)
      const res = await api.upload('/api/upload/workspace', formData, (percent) => setUploadProgress(percent))
      if (!res.url) throw new Error('Upload failed')
      const dbRes = await api.post(`${apiBase}/files`, { name: file.name, file_url: res.url, size_bytes: file.size })
      setFiles(prev => [dbRes.data, ...prev])
      setUploadSuccess(true)
      setTimeout(() => {
        setUploadSuccess(false)
        setUploadingFile(false)
        setUploadProgress(null)
      }, 3000)
    } catch (err) { 
      setUploadingFile(false)
      setUploadProgress(null)
      setUploadError(err.message || 'Storage limit of 20 MB exceeded. Please delete some files.')
      if (fileInputRef.current) fileInputRef.current.value = ''
      setTimeout(() => setUploadError(null), 5000)
    }
  }

  const confirmDelete = async () => {
    if (!deleteConfirm) return
    const { id, type } = deleteConfirm
    try {
      if (type === 'timetable') { await saveTimetable({ preventDefault: () => { }, target: new FormData() }) }
      else { await api.delete(`${apiBase}/${type}s/${id}`) }
      if (type === 'note') setNotes(prev => prev.filter(n => n.id !== id))
      else if (type === 'task') setTasks(prev => prev.filter(t => t.id !== id))
      else if (type === 'link') setLinks(prev => prev.filter(l => l.id !== id))
      else if (type === 'file') setFiles(prev => prev.filter(f => f.id !== id))
    } catch (err) { alert(err.message) }
    finally { setDeleteConfirm(null) }
  }

  const openLink = (url) => {
    if (!url) return
    const safeUrl = url.startsWith('http') ? url : `https://${url}`
    window.open(safeUrl, '_blank', 'noopener,noreferrer')
  }

  const mb = (bytes) => (bytes / (1024 * 1024)).toFixed(2) + ' MB'

  // Labels
  const L = {
    title: role === 'faculty' ? 'My Weekly Timetable' : 'My Weekly Timetable',
    desc: role === 'faculty' ? 'teaching block' : 'class block',
    notes: role === 'faculty' ? 'Notes' : 'Notes',
    tasks: role === 'faculty' ? 'My Tasks' : 'My Tasks',
    links: role === 'faculty' ? 'Links' : 'Links',
    files: role === 'faculty' ? 'Files' : 'Files'
  }

  if (loading) return <PageLayout><div style={{ padding: 60, textAlign: 'center', ...pjs(16, 600, '24px', '#64748b') }}>Loading Hub...</div></PageLayout>

  return (
    <PageLayout>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideUp { from { transform:translateY(20px);opacity:0 } to { transform:translateY(0);opacity:1 } }
        @keyframes spin { 100% { transform:rotate(360deg) } }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #f1f5f9; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>

      {/* ── Modals ── */}
      {ttModal && (
        <Modal close={() => setTtModal(null)} title={ttModal.existing ? 'Edit Timetable Slot' : `Add to Timetable`}>
          <form onSubmit={saveTimetable} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ ...pjs(13, 600, '18px', '#4f46e5'), background: '#eef2ff', padding: '8px 12px', borderRadius: 8 }}>
              {ttModal.day} • {fmt12(ttModal.slot)}
            </div>
            <div>
              <label style={{ display: 'block', ...pjs(12, 700, '16px', '#0f172a'), marginBottom: 6 }}>Course / Subject Name</label>
              <input name="course" defaultValue={ttModal.existing?.course} placeholder="e.g. Adv Algorithms" required style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box', ...inter(14, 500, '20px', '#0f172a') }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ display: 'block', ...pjs(12, 700, '16px', '#0f172a'), marginBottom: 6 }}>Type</label>
                <select name="type" defaultValue={ttModal.existing?.type || 'Lecture'} style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }}>
                  <option>Lecture</option><option>Lab</option><option>Seminar</option><option>Study</option><option>Activity</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', ...pjs(12, 700, '16px', '#0f172a'), marginBottom: 6 }}>Location</label>
                <input name="location" defaultValue={ttModal.existing?.location} placeholder="LT-204" style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', ...pjs(12, 700, '16px', '#0f172a'), marginBottom: 6 }}>Color Tag</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {PRESETS.map(p => (
                  <label key={p} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input type="radio" name="color_preset" value={p} defaultChecked={(ttModal.existing?.color_preset || 'indigo') === p} style={{ cursor: 'pointer' }} />
                    <div style={{ width: 16, height: 16, borderRadius: 4, background: C[p].bg, border: `2px solid ${C[p].border}`, marginLeft: 4 }} />
                  </label>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              {ttModal.existing && <button type="button" onClick={() => setDeleteConfirm({ type: 'timetable', label: ttModal.existing.course })} disabled={saving} style={{ flex: 1, padding: '12px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer' }}>Clear Slot</button>}
              <button type="submit" disabled={saving} style={{ flex: 2, padding: '12px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer' }}>{saving ? 'Saving...' : 'Save Slot'}</button>
            </div>
          </form>
        </Modal>
      )}

      {noteModal && (
        <Modal close={() => setNoteModal(false)} title="Create New Note">
          <form onSubmit={saveNote} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', ...pjs(12, 700, '16px', '#0f172a'), marginBottom: 6 }}>Title</label>
              <input name="title" placeholder="Research Ideas..." required style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', ...pjs(12, 700, '16px', '#0f172a'), marginBottom: 6 }}>Note Content</label>
              <textarea name="body" placeholder="Key concepts covers..." rows={4} required style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box', reshape: 'none' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ display: 'block', ...pjs(12, 700, '16px', '#0f172a'), marginBottom: 6 }}>Tag</label>
                <input name="tag" placeholder="MATH" required style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', ...pjs(12, 700, '16px', '#0f172a'), marginBottom: 6 }}>Tag Color</label>
                <select name="color_preset" defaultValue="indigo" style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }}>
                  {PRESETS.map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
                </select>
              </div>
            </div>
            <button type="submit" disabled={saving} style={{ width: '100%', padding: '12px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer' }}>{saving ? 'Saving...' : 'Save Note'}</button>
          </form>
        </Modal>
      )}

      {linkModal && (
        <Modal close={() => setLinkModal(false)} title="Add Quick Link">
          <form onSubmit={saveLink} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <input name="label" placeholder="Canvas Portal" required style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1px solid #cbd5e1' }} />
            <input name="url" placeholder="canvas.university.edu" required style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1px solid #cbd5e1' }} />
            <button type="submit" disabled={saving} style={{ width: '100%', padding: '12px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer' }}>Save Link</button>
          </form>
        </Modal>
      )}

      {/* ── Timetable Grid ── */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h1 style={pjs(24, 700, '32px', '#0f172a')}>{L.title}</h1>
          <p style={{ ...pjs(14, 500, '20px', '#64748b'), margin: 0 }}>Click any cell to add or edit a {L.desc}.</p>
        </div>

        <div style={{ background: '#fff', border: '1px solid #f1f5f9', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 860 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                <th style={{ ...inter(10, 600, '14px', '#94a3b8'), padding: '10px 12px', textAlign: 'left', width: 90, borderRight: '1px solid #f1f5f9', letterSpacing: '0.06em' }}>TIME</th>
                {DAYS.map(d => (
                  <th key={d} style={{ ...inter(10, 700, '14px', (d === 'SATURDAY' || d === 'SUNDAY') ? '#94a3b8' : '#0f172a'), padding: '10px 8px', textAlign: 'left', borderRight: '1px solid #f1f5f9', letterSpacing: '0.04em' }}>
                    {(d === 'SATURDAY' || d === 'SUNDAY') ? <span style={{ background: '#f8fafc', color: '#94a3b8', borderRadius: 4, padding: '2px 6px', fontSize: 10 }}>{d}</span> : d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ALL_TIME_SLOTS.map((slot, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f8fafc' }}>
                  <td style={{ ...inter(10, 500, '13px', '#64748b'), padding: '4px 12px', borderRight: '1px solid #f1f5f9', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>{fmt12(slot)}</td>
                  {DAYS.map(d => (
                    <Cell key={d} data={ttMap[slot]?.[d]} onClick={() => setTtModal({ day: d, slot, existing: ttMap[slot]?.[d] })} />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Productivity Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px 340px', gap: 16, marginTop: 16 }}>

        {/* Notes Section */}
        <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconNotes />
              </div>
              <span style={pjs(18, 700, '24px', '#0f172a')}>Notes</span>
            </div>
            <button
              onClick={() => setNoteModal(true)}
              style={{ background: '#eef2ff', color: '#4f46e5', border: 'none', borderRadius: 6, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 20 }}
            >
              +
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, flex: 1 }}>
            {notes.map(n => (
              <div key={n.id} style={{ background: '#fff', border: '1px solid #f1f5f9', borderRadius: 12, padding: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 7 }}>
                  <div style={{ background: C[n.tag_color_preset]?.bg, padding: '3px 8px', borderRadius: 5 }}>
                    <span style={{ ...pjs(9, 800, '13px', C[n.tag_color_preset]?.tc), letterSpacing: '0.05em' }}>{n.tag || 'NOTE'}</span>
                  </div>
                  <button onClick={() => setDeleteConfirm({ id: n.id, type: 'note', label: n.title })} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 18, fontWeight: 700, padding: 4, borderRadius: 6 }}>×</button>
                </div>
                <div style={{ ...pjs(13, 700, '16px', '#0f172a'), marginBottom: 4 }}>{n.title}</div>
                <div style={{ ...pjs(12, 400, '16px', '#64748b'), flex: 1 }}>{n.body}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tasks Section */}
        <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconTasks />
              </div>
              <span style={pjs(18, 700, '24px', '#0f172a')}>My Tasks</span>
            </div>
            {!showTaskForm && (
              <button
                onClick={() => setShowTaskForm(true)}
                style={{ background: '#eef2ff', color: '#4f46e5', border: 'none', borderRadius: 6, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 20 }}
              >
                +
              </button>
            )}
          </div>

          {showTaskForm && (
            <form onSubmit={saveTask} style={{ display: 'flex', gap: 12, border: '1px solid #f1f5f9', padding: 16, borderRadius: 16, background: '#f8fafc' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <input
                  value={taskInput} onChange={e => setTaskInput(e.target.value)}
                  placeholder="Task title" required autoFocus
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #e2e8f0', outline: 'none', ...pjs(14, 500, '20px', '#0f172a'), boxSizing: 'border-box' }}
                />
                <input
                  value={taskSubInput} onChange={e => setTaskSubInput(e.target.value)}
                  placeholder="Extra info"
                  style={{ width: '100%', padding: '8px 14px', borderRadius: 10, border: '1px solid #e2e8f0', outline: 'none', ...pjs(12, 400, '18px', '#64748b'), boxSizing: 'border-box' }}
                />
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <button
                    type="submit" disabled={saving || !taskInput.trim()}
                    style={{ flex: 1, padding: '8px', background: taskInput.trim() ? '#4f46e5' : '#e2e8f0', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: taskInput.trim() ? 'pointer' : 'default', fontSize: 13 }}
                  >
                    Add Task
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowTaskForm(false)}
                    style={{ padding: '8px 16px', background: '#fff', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, overflowY: 'auto' }}>
            {tasks.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.6, padding: '20px 0' }}>
                <span style={{ fontSize: 24, marginBottom: 8 }}>✅</span>
                <span style={pjs(14, 500, '20px', '#94a3b8')}>All tasks completed</span>
              </div>
            ) : tasks.map((t, i) => (
              <div key={t.id} style={{ transition: 'all 0.2s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 4px' }}>
                  <div
                    onClick={() => toggleTask(t.id, t.is_done)}
                    style={{
                      width: 20, height: 20, borderRadius: 7, flexShrink: 0,
                      border: t.is_done ? 'none' : '2px solid #e2e8f0',
                      background: t.is_done ? '#4f46e5' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {t.is_done && <svg width="12" height="10" viewBox="0 0 10 8" fill="none"><path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ ...pjs(14, 600, '20px', t.is_done ? '#94a3b8' : '#0f172a'), textDecoration: t.is_done ? 'line-through' : 'none', transition: 'color 0.2s' }}>{t.label}</div>
                    {t.sub && <div style={{ ...pjs(12, 400, '16px', '#94a3b8'), marginTop: 2 }}>{t.sub}</div>}
                  </div>
                  <button onClick={() => setDeleteConfirm({ id: t.id, type: 'task', label: t.label })} style={{ background: 'transparent', border: 'none', color: '#cbd5e1', cursor: 'pointer', fontSize: 20, transition: 'color 0.15s' }} onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}>×</button>
                </div>
                {i < tasks.length - 1 && <div style={{ height: 1, background: '#f8fafc' }} />}
              </div>
            ))}
          </div>
        </div>

        {/* Files & Links */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Links Section */}
          <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IconLink />
                </div>
                <span style={pjs(18, 700, '24px', '#0f172a')}>Links</span>
              </div>
              <button
                onClick={() => setLinkModal(true)}
                style={{ background: '#eef2ff', color: '#4f46e5', border: 'none', borderRadius: 6, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 20 }}
              >
                +
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {links.map(l => (
                <div key={l.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 10, border: '1px solid #f1f5f9', background: 'transparent', transition: 'background 0.15s', cursor: 'pointer' }} onClick={() => openLink(l.url)} onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <span style={pjs(13, 600, '18px', '#0f172a')}>{l.label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <IconExternalLink />
                    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeleteConfirm({ id: l.id, type: 'link', label: l.label }) }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#fca5a5', fontSize: 14 }} title="Remove link">×</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Files Section */}
          <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', padding: 20, flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IconCloud />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={pjs(18, 700, '24px', '#0f172a')}>Files</span>
                  <span style={pjs(12, 500, '16px', '#64748b')}>{totalUsedMB} MB / 20 MB used</span>
                </div>
              </div>
              <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileUpload} />
              <button
                onClick={() => fileInputRef.current.click()}
                disabled={uploadingFile}
                style={{ background: '#eef2ff', color: '#4f46e5', border: 'none', borderRadius: 6, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 20 }}
              >
                {uploadingFile ? '...' : '+'}
              </button>
            </div>
            {uploadError && (
              <div style={{ padding: '10px 12px', background: '#fef2f2', borderRadius: 10, border: '1px solid #fecaca', display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 12, animation: 'fadeIn 0.2s ease' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" style={{ flexShrink: 0, marginTop: 2 }}><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                <div style={pjs(13, 500, '18px', '#b91c1c')}>{uploadError}</div>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, overflowY: 'auto' }}>
              {files.map(f => (
                <div key={f.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: '#f8fafc', borderRadius: 10, cursor: 'pointer' }} onClick={() => openLink(f.file_url)} onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'} onMouseLeave={e => e.currentTarget.style.background = '#f8fafc'}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 28, height: 32, background: '#4f46e5', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="12" height="14" viewBox="0 0 12 14" fill="none"><path d="M1.5 2A1.5 1.5 0 013 .5h5.5L11 3v9.5A1.5 1.5 0 019.5 14h-6A1.5 1.5 0 012 12.5" fill="white" fillOpacity="0.85" /><path d="M8.5.5V3H11" stroke="white" strokeOpacity="0.6" strokeWidth="0.8" /></svg>
                    </div>
                    <div style={{ maxWidth: 120 }}>
                      <div style={{ ...pjs(12, 600, '16px', '#0f172a'), whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.name}</div>
                      <div style={pjs(10, 500, '14px', '#94a3b8')}>{mb(f.size_bytes)}</div>
                    </div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ id: f.id, type: 'file', label: f.name }) }} style={{ border: 'none', background: 'none', color: '#ef4444', fontWeight: 700, cursor: 'pointer' }}>×</button>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {deleteConfirm && (
        <Modal close={() => setDeleteConfirm(null)} title="Confirm Delete">
          <div style={{ textAlign: 'center' }}>
            <div style={{ background: '#fee2e2', color: '#ef4444', width: 60, height: 60, borderRadius: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 28 }}>🗑️</div>
            <p style={pjs(15, 400, '24px', '#64748b')}>Permanently remove <strong>{deleteConfirm.label}</strong>?</p>
            <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ flex: 1, padding: 12, background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
              <button onClick={confirmDelete} style={{ flex: 1, padding: 12, background: '#ef4444', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer' }}>{deleteConfirm.type === 'timetable' ? 'Clear Slot' : 'Delete Now'}</button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Floating Upload Progress ── */}
      {(uploadingFile || uploadSuccess) && (
        <div style={{ 
          position: 'fixed', bottom: 32, right: 32, zIndex: 9999,
          background: '#fff', padding: '16px 20px', borderRadius: 16, 
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)', border: '1px solid #f1f5f9',
          display: 'flex', alignItems: 'center', gap: 16, minWidth: 260,
          animation: 'slideUp 0.3s ease'
        }}>
          {uploadSuccess ? (
            <div style={{ width: 28, height: 28, borderRadius: 14, background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 7l3.5 3.5 5.5-5.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          ) : (
            <div style={{ width: 24, height: 24, border: '3px solid #eef2ff', borderTop: '3px solid #4f46e5', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          )}
          
          <div style={{ flex: 1 }}>
            <div style={{ ...pjs(14, 700, '18px', '#0f172a') }}>
              {uploadSuccess ? 'Upload complete!' : `Uploading file... ${uploadProgress || 0}%`}
            </div>
            {!uploadSuccess && (
              <div style={{ height: 4, background: '#f1f5f9', borderRadius: 2, marginTop: 8, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: '#4f46e5', width: `${uploadProgress || 0}%`, transition: 'width 0.2s ease' }} />
              </div>
            )}
          </div>
        </div>
      )}

    </PageLayout>
  )
}
