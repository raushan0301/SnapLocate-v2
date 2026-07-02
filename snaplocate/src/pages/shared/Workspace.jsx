import { useState, useEffect, useRef } from 'react'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'
import { useAuth } from '../../context/AuthContext'

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
    const endH   = parseInt(end.split(':')[0])
    const startP = startH >= 12 ? 'PM' : 'AM'
    const endP   = endH   >= 12 ? 'PM' : 'AM'
    if (startP === endP) {
      const fmtShort = t => { const [hh, mm] = t.split(':').map(Number); const h = hh % 12 || 12; return `${h}:${mm.toString().padStart(2, '0')}` }
      return `${fmtShort(start)}–${fmtShort(end)} ${endP}`
    }
    return `${convert(start)}–${convert(end)}`
  } catch { return str }
}

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']

// Convert a single time token to canonical 24h "HH:MM" (handles "8:50 AM", "08:50", "1:00 PM").
const to24 = (t) => {
  const m = (t || '').trim().match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i)
  if (!m) return (t || '').trim()
  let h = Number(m[1])
  const ap = m[3]?.toUpperCase()
  if (ap === 'PM' && h !== 12) h += 12
  if (ap === 'AM' && h === 12) h = 0
  return `${String(h).padStart(2, '0')}:${m[2]}`
}
// Normalize a full slot to canonical "HH:MM-HH:MM" so 12h AM/PM data matches the 24h grid.
const canonSlot = (slot) => (slot || '').split('-').map(to24).join('-')
const ALL_TIME_SLOTS = [
  '08:00-08:50', '08:50-09:40', '09:40-10:30', '10:30-11:20', '11:20-12:10',
  '12:10-13:00', '13:00-13:50', '13:50-14:40', '14:40-15:30', '15:30-16:20',
  '16:20-17:10', '17:10-18:00', '18:00-18:50'
]

/* Color presets — hex values for dynamic inline usage in Cell and tag badges */
const C = {
  indigo: { bg: '#e0e7ff', border: '#4f46e5', tc: '#4f46e5', sc: '#6366f1' },
  orange: { bg: '#fff7ed', border: '#f97316', tc: '#ea580c', sc: '#f97316' },
  green:  { bg: '#f0fdf4', border: '#22c55e', tc: '#16a34a', sc: '#22c55e' },
  red:    { bg: '#fee2e2', border: '#ef4444', tc: '#dc2626', sc: '#ef4444' },
  violet: { bg: '#f5f3ff', border: '#7c3aed', tc: '#7c3aed', sc: '#a78bfa' },
  amber:  { bg: '#fffbeb', border: '#f59e0b', tc: '#d97706', sc: '#f59e0b' },
}
const PRESETS = Object.keys(C)

const IconNotes        = () => (<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="1" width="10" height="14" rx="1.5" stroke="#4f46e5" strokeWidth="1.3" /><path d="M5 5h6M5 8h6M5 11h3" stroke="#4f46e5" strokeWidth="1.3" strokeLinecap="round" /><path d="M12 5l2 2-2 2" stroke="#4f46e5" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" /></svg>)
const IconTasks        = () => (<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="#4f46e5" strokeWidth="1.3" /><path d="M5 8.5l2 2 4-4.5" stroke="#4f46e5" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>)
const IconLink         = () => (<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5.5 8.5a3.5 3.5 0 005 0l2-2a3.5 3.5 0 00-5-5L6.5 2.5" stroke="#4f46e5" strokeWidth="1.3" strokeLinecap="round" /><path d="M8.5 5.5a3.5 3.5 0 00-5 0l-2 2a3.5 3.5 0 005 5L7.5 11.5" stroke="#4f46e5" strokeWidth="1.3" strokeLinecap="round" /></svg>)
const IconCloud        = () => (<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9.5 11H10a3 3 0 000-6h-.2A4 4 0 102.1 9.9" stroke="#4f46e5" strokeWidth="1.2" strokeLinecap="round" /><path d="M7 8v4M5 10l2-2 2 2" stroke="#4f46e5" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>)
const IconExternalLink = () => (<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M7 1h4v4" stroke="#94a3b8" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /><path d="M11 1L5 7" stroke="#94a3b8" strokeWidth="1.2" strokeLinecap="round" /><path d="M5 2H2a1 1 0 00-1 1v7a1 1 0 001 1h7a1 1 0 001-1V8" stroke="#94a3b8" strokeWidth="1.2" strokeLinecap="round" /></svg>)

function Cell({ data, onClick }) {
  if (!data) return (
    <td onClick={onClick}
      className="p-[2px_4px] border-r border-slate-100 min-w-[95px] cursor-pointer hover:bg-slate-50 transition-colors" />
  )
  const c = C[data.color_preset] || C.indigo
  return (
    <td onClick={onClick} className="p-[2px_4px] border-r border-slate-100 cursor-pointer hover:opacity-80 transition-opacity">
      <div style={{ background: c.bg, borderLeft: `3px solid ${c.border}` }} className="rounded-[0_6px_6px_0] px-1.5 py-1">
        <div style={{ color: c.tc }} className="text-[10.5px] font-bold leading-[14px] truncate">{data.course}</div>
        <div style={{ color: c.sc }} className="text-[9.5px] font-semibold leading-[13px] truncate">{data.type} {data.location && `(${data.location})`}</div>
      </div>
    </td>
  )
}

const fieldCls = 'w-full px-3.5 py-2.5 rounded-[10px] border border-slate-300 outline-none box-border'

const Modal = ({ close, title, children }) => (
  <div className="fixed inset-0 bg-slate-900/50 z-[9999] flex items-center justify-center backdrop-blur-[2px] p-4"
    onMouseDown={close}>
    <div className="bg-white rounded-3xl w-full max-w-[420px] p-6 sm:p-7 shadow-[0_20px_40px_rgba(0,0,0,0.15)] max-h-[90vh] overflow-y-auto"
      onMouseDown={e => e.stopPropagation()}>
      <div className="flex justify-between mb-6 items-center">
        <h3 className="text-[18px] font-bold t-primary">{title}</h3>
        <button type="button" onClick={close}
          className="bg-slate-100 w-7 h-7 rounded-[14px] border-none cursor-pointer text-slate-500 text-[18px] flex items-center justify-center">×</button>
      </div>
      {children}
    </div>
  </div>
)

export default function Workspace({ role = 'student' }) {
  const { isGuest } = useAuth()
  const [loading,        setLoading]        = useState(true)
  const [saving,         setSaving]         = useState(false)
  const [uploadingFile,  setUploadingFile]  = useState(false)
  const [uploadProgress, setUploadProgress] = useState(null)
  const [uploadSuccess,  setUploadSuccess]  = useState(false)
  const [uploadError,    setUploadError]    = useState(null)

  const [timetable, setTimetable] = useState([])
  const [notes,     setNotes]     = useState([])
  const [tasks,     setTasks]     = useState([])
  const [links,     setLinks]     = useState([])
  const [files,     setFiles]     = useState([])

  const totalBytes  = files.reduce((acc, f) => acc + (f.size_bytes || 0), 0)
  const totalUsedMB = (totalBytes / (1024 * 1024)).toFixed(2)

  const [ttModal,      setTtModal]      = useState(null)
  const [noteModal,    setNoteModal]    = useState(false)
  const [linkModal,    setLinkModal]    = useState(false)
  const [deleteConfirm,setDeleteConfirm]= useState(null)
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [taskInput,    setTaskInput]    = useState('')
  const [taskSubInput, setTaskSubInput] = useState('')
  const fileInputRef = useRef()

  const apiBase = role === 'faculty' ? '/api/faculty-workspace' : '/api/workspace'
  const ttApi   = role === 'faculty' ? '/api/faculty/me/timetable' : '/api/workspace/timetable'

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
    } catch (err) { console.error('Workspace fetch error:', err) }
    finally { setLoading(false) }
  }

  useEffect(() => { loadData() }, [role])

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
      const dayKey  = ttModal.day.toUpperCase()
      const slotCanon = canonSlot(ttModal.slot)
      const filtered = timetable.filter(sl => !(sl.day.toUpperCase() === dayKey && canonSlot(sl.time_slot || sl.time) === slotCanon))
      const updated  = courseName ? [...filtered, payload] : filtered
      await api.put(ttApi, role === 'faculty' ? { slots: updated } : updated)
      setTimetable(updated); setTtModal(null)
    } catch (err) { alert('Error: ' + err.message) }
    finally { setSaving(false) }
  }

  const ttMap = {}
  timetable.forEach(t => {
    const slotKey = canonSlot(t.time_slot || t.time)
    const dayKey  = t.day?.toUpperCase()
    if (!ttMap[slotKey]) ttMap[slotKey] = {}
    ttMap[slotKey][dayKey] = t
  })

  const saveNote = async (e) => {
    e.preventDefault(); if (saving) return; setSaving(true)
    const fd = new FormData(e.target)
    try {
      const res = await api.post(`${apiBase}/notes`, { title: fd.get('title'), body: fd.get('body'), tag: fd.get('tag'), tag_color_preset: fd.get('color_preset') })
      setNotes(prev => [res.data, ...prev]); setNoteModal(false)
    } catch (err) { alert(err.message) }
    finally { setSaving(false) }
  }

  const saveTask = async (e) => {
    e.preventDefault(); if (!taskInput.trim() || saving) return; setSaving(true)
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
    e.preventDefault(); if (saving) return; setSaving(true)
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
    const file = e.target.files[0]; if (!file) return
    setUploadingFile(true); setUploadProgress(0); setUploadError(null); setUploadSuccess(false)
    try {
      const formData = new FormData(); formData.append('file', file)
      const res = await api.upload('/api/upload/workspace', formData, (percent) => setUploadProgress(percent))
      if (!res.url) throw new Error('Upload failed')
      const dbRes = await api.post(`${apiBase}/files`, { name: file.name, file_url: res.url, size_bytes: file.size })
      setFiles(prev => [dbRes.data, ...prev])
      setUploadSuccess(true)
      setTimeout(() => { setUploadSuccess(false); setUploadingFile(false); setUploadProgress(null) }, 3000)
    } catch (err) {
      setUploadingFile(false); setUploadProgress(null)
      setUploadError(err.message || 'Storage limit of 20 MB exceeded. Please delete some files.')
      if (fileInputRef.current) fileInputRef.current.value = ''
      setTimeout(() => setUploadError(null), 5000)
    }
  }

  const confirmDelete = async () => {
    if (!deleteConfirm) return
    const { id, type } = deleteConfirm
    try {
      if (type === 'timetable') { await saveTimetable({ preventDefault: () => {}, target: new FormData() }) }
      else { await api.delete(`${apiBase}/${type}s/${id}`) }
      if (type === 'note')      setNotes(prev => prev.filter(n => n.id !== id))
      else if (type === 'task') setTasks(prev => prev.filter(t => t.id !== id))
      else if (type === 'link') setLinks(prev => prev.filter(l => l.id !== id))
      else if (type === 'file') setFiles(prev => prev.filter(f => f.id !== id))
    } catch (err) { alert(err.message) }
    finally { setDeleteConfirm(null) }
  }

  const openLink = (url) => {
    if (!url) return
    window.open(url.startsWith('http') ? url : `https://${url}`, '_blank', 'noopener,noreferrer')
  }

  const mb = (bytes) => (bytes / (1024 * 1024)).toFixed(2) + ' MB'

  const L = {
    title: 'My Weekly Timetable',
    desc:  role === 'faculty' ? 'teaching block' : 'class block',
  }

  if (loading) return (
    <PageLayout>
      <div className="py-16 text-center text-[16px] font-semibold text-slate-500">Loading Hub...</div>
    </PageLayout>
  )

  return (
    <PageLayout>
      {isGuest && (
        <div className="bg-red-50 border border-red-200 px-5 py-3 rounded-[14px] flex items-center gap-3">
          <span className="text-[20px]">🎓</span>
          <span className="text-[14px] text-red-700 font-medium">
            <strong>Guest Mode:</strong> Register with a university email (@thapar.edu) to unlock file uploads and cloud storage.
          </span>
        </div>
      )}

      {/* Timetable Modal */}
      {ttModal && (
        <Modal close={() => setTtModal(null)} title={ttModal.existing ? 'Edit Timetable Slot' : 'Add to Timetable'}>
          <form onSubmit={saveTimetable} className="flex flex-col gap-4">
            <div className="text-[13px] font-semibold text-brand bg-indigo-50 px-3 py-2 rounded-lg">
              {ttModal.day} • {fmt12(ttModal.slot)}
            </div>
            <div>
              <label className="block text-[12px] font-bold t-primary mb-1.5">Course / Subject Name</label>
              <input name="course" defaultValue={ttModal.existing?.course} placeholder="e.g. Adv Algorithms" required className={fieldCls} />
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[12px] font-bold t-primary mb-1.5">Type</label>
                <select name="type" defaultValue={ttModal.existing?.type || 'Lecture'} className={fieldCls}>
                  <option>Lecture</option><option>Lab</option><option>Seminar</option><option>Study</option><option>Activity</option>
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-bold t-primary mb-1.5">Location</label>
                <input name="location" defaultValue={ttModal.existing?.location} placeholder="LT-204" className={fieldCls} />
              </div>
            </div>
            <div>
              <label className="block text-[12px] font-bold t-primary mb-1.5">Color Tag</label>
              <div className="flex gap-2">
                {PRESETS.map(p => (
                  <label key={p} className="flex items-center cursor-pointer">
                    <input type="radio" name="color_preset" value={p}
                      defaultChecked={(ttModal.existing?.color_preset || 'indigo') === p}
                      className="cursor-pointer" />
                    <div style={{ background: C[p].bg, border: `2px solid ${C[p].border}` }}
                      className="w-4 h-4 rounded-[4px] ml-1" />
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-2.5 mt-4">
              {ttModal.existing && (
                <button type="button"
                  onClick={() => setDeleteConfirm({ type: 'timetable', label: ttModal.existing.course })}
                  disabled={saving}
                  className="flex-1 py-3 bg-red-50 text-red-500 border-none rounded-xl font-bold cursor-pointer">
                  Clear Slot
                </button>
              )}
              <button type="submit" disabled={saving}
                className="flex-[2] py-3 bg-brand text-white border-none rounded-xl font-bold cursor-pointer">
                {saving ? 'Saving...' : 'Save Slot'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Note Modal */}
      {noteModal && (
        <Modal close={() => setNoteModal(false)} title="Create New Note">
          <form onSubmit={saveNote} className="flex flex-col gap-4">
            <div>
              <label className="block text-[12px] font-bold t-primary mb-1.5">Title</label>
              <input name="title" placeholder="Research Ideas..." required className={fieldCls} />
            </div>
            <div>
              <label className="block text-[12px] font-bold t-primary mb-1.5">Note Content</label>
              <textarea name="body" placeholder="Key concepts..." rows={4} required className={fieldCls} />
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[12px] font-bold t-primary mb-1.5">Tag</label>
                <input name="tag" placeholder="MATH" required className={fieldCls} />
              </div>
              <div>
                <label className="block text-[12px] font-bold t-primary mb-1.5">Tag Color</label>
                <select name="color_preset" defaultValue="indigo" className={fieldCls}>
                  {PRESETS.map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
                </select>
              </div>
            </div>
            <button type="submit" disabled={saving}
              className="w-full py-3 bg-brand text-white border-none rounded-xl font-bold cursor-pointer">
              {saving ? 'Saving...' : 'Save Note'}
            </button>
          </form>
        </Modal>
      )}

      {/* Link Modal */}
      {linkModal && (
        <Modal close={() => setLinkModal(false)} title="Add Quick Link">
          <form onSubmit={saveLink} className="flex flex-col gap-4">
            <input name="label" placeholder="Canvas Portal" required className={fieldCls} />
            <input name="url" placeholder="canvas.university.edu" required className={fieldCls} />
            <button type="submit" disabled={saving}
              className="w-full py-3 bg-brand text-white border-none rounded-xl font-bold cursor-pointer">
              Save Link
            </button>
          </form>
        </Modal>
      )}

      {/* Timetable Grid */}
      <div>
        <div className="flex justify-between items-center mb-3.5">
          <h1 className="text-[24px] font-bold t-primary">{L.title}</h1>
          <p className="text-[14px] font-medium text-slate-500">Click any cell to add or edit a {L.desc}.</p>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.04)] overflow-x-auto">
          <table className="w-full border-collapse min-w-[860px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-[10px] font-semibold text-slate-400 px-3 py-2.5 text-left w-[90px] border-r border-slate-100 tracking-[0.06em]">TIME</th>
                {DAYS.map(d => (
                  <th key={d} className={`px-2 py-2.5 text-left border-r border-slate-100 tracking-[0.04em] ${(d === 'SATURDAY' || d === 'SUNDAY') ? 'text-[10px] font-bold text-slate-400' : 'text-[10px] font-bold t-primary'}`}>
                    {(d === 'SATURDAY' || d === 'SUNDAY')
                      ? <span className="bg-slate-50 text-slate-400 rounded-[4px] px-1.5 py-0.5 text-[10px]">{d}</span>
                      : d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ALL_TIME_SLOTS.map((slot, i) => (
                <tr key={i} className="border-b border-slate-50">
                  <td className="text-[10px] font-medium text-slate-500 px-3 py-1 border-r border-slate-100 whitespace-nowrap align-middle">{fmt12(slot)}</td>
                  {DAYS.map(d => (
                    <Cell key={d} data={ttMap[canonSlot(slot)]?.[d]} onClick={() => setTtModal({ day: d, slot, existing: ttMap[canonSlot(slot)]?.[d] })} />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Productivity Grid */}
      <div className="grid gap-4 mt-4 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px_340px]">

        {/* Notes */}
        <div className="bg-white rounded-[20px] border border-slate-100 shadow-[0_4px_12px_rgba(0,0,0,0.03)] p-6 flex flex-col gap-5">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center"><IconNotes /></div>
              <span className="text-[18px] font-bold t-primary">Notes</span>
            </div>
            <button onClick={() => setNoteModal(true)}
              className="bg-indigo-50 text-brand border-none rounded-lg w-8 h-8 cursor-pointer flex items-center justify-center font-bold text-[20px]">+</button>
          </div>
          <div className="grid grid-cols-2 gap-2.5 flex-1">
            {notes.map(n => {
              const nc = C[n.tag_color_preset] || C.indigo
              return (
                <div key={n.id} className="bg-white border border-slate-100 rounded-xl p-3 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col">
                  <div className="flex justify-between items-start mb-[7px]">
                    <div style={{ background: nc.bg }} className="px-2 py-0.5 rounded-[5px]">
                      <span style={{ color: nc.tc }} className="text-[9px] font-extrabold tracking-[0.05em]">{n.tag || 'NOTE'}</span>
                    </div>
                    <button onClick={() => setDeleteConfirm({ id: n.id, type: 'note', label: n.title })}
                      className="bg-transparent border-none cursor-pointer text-red-500 text-[18px] font-bold p-1 rounded-lg">×</button>
                  </div>
                  <div className="text-[13px] font-bold t-primary mb-1">{n.title}</div>
                  <div className="text-[12px] text-slate-500 flex-1">{n.body}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Tasks */}
        <div className="bg-white rounded-[20px] border border-slate-100 shadow-[0_4px_12px_rgba(0,0,0,0.03)] p-6 flex flex-col gap-5">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center"><IconTasks /></div>
              <span className="text-[18px] font-bold t-primary">My Tasks</span>
            </div>
            {!showTaskForm && (
              <button onClick={() => setShowTaskForm(true)}
                className="bg-indigo-50 text-brand border-none rounded-lg w-8 h-8 cursor-pointer flex items-center justify-center font-bold text-[20px]">+</button>
            )}
          </div>

          {showTaskForm && (
            <form onSubmit={saveTask} className="flex gap-3 border border-slate-100 p-4 rounded-2xl bg-slate-50">
              <div className="flex-1 flex flex-col gap-2">
                <input value={taskInput} onChange={e => setTaskInput(e.target.value)}
                  placeholder="Task title" required autoFocus
                  className="w-full px-3.5 py-2.5 rounded-[10px] border border-slate-200 outline-none text-[14px] font-medium t-primary box-border" />
                <input value={taskSubInput} onChange={e => setTaskSubInput(e.target.value)}
                  placeholder="Extra info"
                  className="w-full px-3.5 py-2 rounded-[10px] border border-slate-200 outline-none text-[12px] text-slate-500 box-border" />
                <div className="flex gap-2 mt-1">
                  <button type="submit" disabled={saving || !taskInput.trim()}
                    className={`flex-1 py-2 border-none rounded-lg font-bold text-[13px] ${taskInput.trim() ? 'bg-brand text-white cursor-pointer' : 'bg-slate-200 text-white cursor-default'}`}>
                    Add Task
                  </button>
                  <button type="button" onClick={() => setShowTaskForm(false)}
                    className="px-4 py-2 bg-white text-slate-500 border border-slate-200 rounded-lg font-semibold cursor-pointer text-[13px]">
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          )}

          <div className="flex flex-col gap-1 flex-1 overflow-y-auto">
            {tasks.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center opacity-60 py-5">
                <span className="text-[24px] mb-2">✅</span>
                <span className="text-[14px] font-medium text-slate-400">All tasks completed</span>
              </div>
            ) : tasks.map((t, i) => (
              <div key={t.id} className="transition-all">
                <div className="flex items-center gap-3.5 py-3.5 px-1">
                  <div onClick={() => toggleTask(t.id, t.is_done)}
                    className={`w-5 h-5 rounded-[7px] shrink-0 flex items-center justify-center cursor-pointer transition-all border-2 ${t.is_done ? 'bg-brand border-brand' : 'bg-transparent border-slate-200'}`}>
                    {t.is_done && <svg width="12" height="10" viewBox="0 0 10 8" fill="none"><path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                  </div>
                  <div className="flex-1">
                    <div className={`text-[14px] font-semibold leading-5 transition-colors ${t.is_done ? 'text-slate-400 line-through' : 't-primary'}`}>{t.label}</div>
                    {t.sub && <div className="text-[12px] text-slate-400 mt-0.5">{t.sub}</div>}
                  </div>
                  <button onClick={() => setDeleteConfirm({ id: t.id, type: 'task', label: t.label })}
                    className="bg-transparent border-none text-slate-300 cursor-pointer text-[20px] hover:text-red-500 transition-colors">×</button>
                </div>
                {i < tasks.length - 1 && <div className="h-px bg-slate-50" />}
              </div>
            ))}
          </div>
        </div>

        {/* Files & Links */}
        <div className="flex flex-col gap-3.5">
          {/* Links */}
          <div className="bg-white rounded-[20px] border border-slate-100 shadow-[0_4px_12px_rgba(0,0,0,0.03)] p-5">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center"><IconLink /></div>
                <span className="text-[18px] font-bold t-primary">Links</span>
              </div>
              <button onClick={() => setLinkModal(true)}
                className="bg-indigo-50 text-brand border-none rounded-lg w-8 h-8 cursor-pointer flex items-center justify-center font-bold text-[20px]">+</button>
            </div>
            <div className="flex flex-col gap-2">
              {links.map(l => (
                <div key={l.id}
                  className="flex items-center justify-between px-3 py-2.5 rounded-[10px] border border-slate-100 bg-transparent hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => openLink(l.url)}>
                  <span className="text-[13px] font-semibold t-primary">{l.label}</span>
                  <div className="flex items-center gap-2.5">
                    <IconExternalLink />
                    <button onClick={e => { e.preventDefault(); e.stopPropagation(); setDeleteConfirm({ id: l.id, type: 'link', label: l.label }) }}
                      className="bg-transparent border-none cursor-pointer text-red-300 text-[14px]">×</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Files */}
          <div className="bg-white rounded-[20px] border border-slate-100 shadow-[0_4px_12px_rgba(0,0,0,0.03)] p-5 flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center"><IconCloud /></div>
                <div className="flex flex-col">
                  <span className="text-[18px] font-bold t-primary">Files</span>
                  <span className="text-[12px] font-medium text-slate-500">{totalUsedMB} MB / 20 MB used</span>
                </div>
              </div>
              <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
              {!isGuest && (
                <button onClick={() => fileInputRef.current.click()} disabled={uploadingFile}
                  className="bg-indigo-50 text-brand border-none rounded-lg w-8 h-8 cursor-pointer flex items-center justify-center font-bold text-[20px]">
                  {uploadingFile ? '...' : '+'}
                </button>
              )}
            </div>

            {uploadError && (
              <div className="px-3 py-2.5 bg-red-50 rounded-[10px] border border-red-200 flex items-start gap-2 mb-3" style={{ animation: 'fadeIn 0.2s ease' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" className="shrink-0 mt-0.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                <div className="text-[13px] font-medium text-red-700">{uploadError}</div>
              </div>
            )}

            <div className="flex flex-col gap-2 flex-1 overflow-y-auto">
              {files.map(f => (
                <div key={f.id}
                  className="flex items-center justify-between px-2.5 py-2 bg-slate-50 rounded-[10px] cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => openLink(f.file_url)}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-8 bg-brand rounded-[5px] flex items-center justify-center">
                      <svg width="12" height="14" viewBox="0 0 12 14" fill="none"><path d="M1.5 2A1.5 1.5 0 013 .5h5.5L11 3v9.5A1.5 1.5 0 019.5 14h-6A1.5 1.5 0 012 12.5" fill="white" fillOpacity="0.85" /><path d="M8.5.5V3H11" stroke="white" strokeOpacity="0.6" strokeWidth="0.8" /></svg>
                    </div>
                    <div className="max-w-[120px]">
                      <div className="text-[12px] font-semibold t-primary truncate">{f.name}</div>
                      <div className="text-[10px] font-medium text-slate-400">{mb(f.size_bytes)}</div>
                    </div>
                  </div>
                  <button onClick={e => { e.stopPropagation(); setDeleteConfirm({ id: f.id, type: 'file', label: f.name }) }}
                    className="border-none bg-transparent text-red-500 font-bold cursor-pointer">×</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <Modal close={() => setDeleteConfirm(null)} title="Confirm Delete">
          <div className="text-center">
            <div className="bg-red-50 text-red-500 w-[60px] h-[60px] rounded-[30px] flex items-center justify-center mx-auto mb-5 text-[28px]">🗑️</div>
            <p className="text-[15px] text-slate-500 leading-6">Permanently remove <strong>{deleteConfirm.label}</strong>?</p>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 p-3 bg-slate-100 text-slate-500 border-none rounded-xl font-bold cursor-pointer">Cancel</button>
              <button onClick={confirmDelete}
                className="flex-1 p-3 bg-red-500 text-white border-none rounded-xl font-bold cursor-pointer">
                {deleteConfirm.type === 'timetable' ? 'Clear Slot' : 'Delete Now'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Floating Upload Progress */}
      {(uploadingFile || uploadSuccess) && (
        <div className="fixed bottom-8 right-8 z-[9999] bg-white px-5 py-4 rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.12)] border border-slate-100 flex items-center gap-4 min-w-[260px]"
          style={{ animation: 'slideUp 0.3s ease' }}>
          {uploadSuccess ? (
            <div className="w-7 h-7 rounded-[14px] bg-emerald-500 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 7l3.5 3.5 5.5-5.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
          ) : (
            <div className="w-6 h-6 border-[3px] border-indigo-100 border-t-brand rounded-full animate-spin" />
          )}
          <div className="flex-1">
            <div className="text-[14px] font-bold t-primary">
              {uploadSuccess ? 'Upload complete!' : `Uploading file... ${uploadProgress || 0}%`}
            </div>
            {!uploadSuccess && (
              <div className="h-1 bg-slate-100 rounded-sm mt-2 overflow-hidden">
                <div className="h-full bg-brand transition-[width_.2s_ease]" style={{ width: `${uploadProgress || 0}%` }} />
              </div>
            )}
          </div>
        </div>
      )}
    </PageLayout>
  )
}
