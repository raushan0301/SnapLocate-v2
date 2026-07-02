import { useState, useEffect, useCallback } from 'react'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'
import { BookOpen, Plus, Trash2, Edit2, X, ChevronDown, ChevronRight, Search, Upload } from 'lucide-react'

const BRANCHES = ['CSE','ECE','EE','ME','CE','BIO','CHEM','PHYS','MATH','BBA','MBA']
const YEARS = ['2025-26','2024-25','2023-24']

const fieldCls = 'w-full mt-1 px-3 py-[9px] rounded-[10px] border-[1.5px] border-slate-200 text-[14px] outline-none box-border focus:border-brand transition-colors'
const labelCls = 'text-[12px] font-semibold text-slate-700 block'

function Toast({ msg, type }) {
  if (!msg) return null
  return (
    <div className={`fixed bottom-6 right-6 px-5 py-3 rounded-[12px] z-[999] text-white text-[14px] font-semibold ${type === 'error' ? 'bg-red-600' : 'bg-slate-900'}`}>
      {msg}
    </div>
  )
}

export default function LMSStructure() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [search, setSearch] = useState('')
  const [collapsed, setCollapsed] = useState({})
  const [modal, setModal] = useState(null)
  const [sectionModal, setSectionModal] = useState(null)
  const [enrollModal, setEnrollModal] = useState(null)
  const [faculty, setFaculty] = useState([])
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ code:'', title:'', academic_year:'2025-26', branch:'CSE', semester:1, is_published:false })
  const [secForm, setSecForm] = useState({ section_name:'', faculty_id:'', room:'' })
  const [csvText, setCsvText] = useState('')
  const [students, setStudents] = useState([])

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000) }

  const load = useCallback(async () => {
    setLoading(true)
    const [cRes, fRes] = await Promise.allSettled([
      api.get('/api/lms/native/admin/courses'),
      api.get('/api/faculty'),
    ])
    if (cRes.status === 'fulfilled' && cRes.value.success) setCourses(cRes.value.data || [])
    if (fRes.status === 'fulfilled' && fRes.value.success) setFaculty(fRes.value.data || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const openCreate = () => {
    setForm({ code:'', title:'', academic_year:'2025-26', branch:'CSE', semester:1, is_published:false })
    setModal({ mode:'create' })
  }
  const openEdit = (c) => {
    setForm({ code:c.code, title:c.title, academic_year:c.academic_year, branch:c.branch, semester:c.semester, is_published:c.is_published })
    setModal({ mode:'edit', id:c.id })
  }

  const handleSave = async () => {
    if (!form.code || !form.title) return showToast('Code and title required', 'error')
    setSaving(true)
    try {
      const payload = { ...form, semester: parseInt(form.semester) }
      const res = modal.mode === 'create'
        ? await api.post('/api/lms/native/admin/courses', payload)
        : await api.patch(`/api/lms/native/admin/courses/${modal.id}`, payload)
      if (res.success) { showToast(modal.mode === 'create' ? 'Course created' : 'Course updated'); load(); setModal(null) }
      else showToast(res.error || 'Save failed', 'error')
    } catch (e) { showToast(e?.message || 'Error', 'error') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this course and all its sections?')) return
    try {
      const res = await api.delete(`/api/lms/native/admin/courses/${id}`)
      if (res.success) { showToast('Deleted'); load() }
      else showToast(res.error || 'Failed', 'error')
    } catch { showToast('Error', 'error') }
  }

  const openSection = (course) => {
    setSecForm({ section_name:'', faculty_id:'', room:'' })
    setSectionModal({ course })
  }

  const handleAddSection = async () => {
    if (!secForm.section_name) return showToast('Section name required', 'error')
    setSaving(true)
    try {
      const payload = { section_name: secForm.section_name, room: secForm.room || null }
      if (secForm.faculty_id) payload.faculty_id = secForm.faculty_id
      const res = await api.post(`/api/lms/native/admin/courses/${sectionModal.course.id}/sections`, payload)
      if (res.success) { showToast('Section added'); load(); setSectionModal(null) }
      else showToast(res.error || 'Failed', 'error')
    } catch (e) { showToast(e?.message || 'Error', 'error') }
    finally { setSaving(false) }
  }

  const handleDeleteSection = async (secId) => {
    if (!window.confirm('Delete this section and all its enrollments?')) return
    try {
      const res = await api.delete(`/api/lms/native/admin/sections/${secId}`)
      if (res.success) { showToast('Section deleted'); load() }
      else showToast(res.error || 'Failed', 'error')
    } catch { showToast('Error', 'error') }
  }

  const openEnroll = async (section, courseName) => {
    setCsvText('')
    const res = await api.get('/api/admin/users?role=student')
    if (res.success) setStudents(res.data || [])
    setEnrollModal({ section, courseName })
  }

  const handleCSVEnroll = async () => {
    const lines = csvText.trim().split('\n').filter(Boolean)
    const studentMap = {}
    for (const s of students) {
      if (s.email) studentMap[s.email.toLowerCase()] = s.id
      if (s.roll_number) studentMap[s.roll_number.toLowerCase()] = s.id
    }
    const rows = []
    for (const line of lines) {
      const [identifier, rollNum] = line.split(',').map(x => x.trim())
      const sid = studentMap[identifier?.toLowerCase()]
      if (sid) rows.push({ student_id: sid, roll_number: rollNum || identifier })
    }
    if (!rows.length) return showToast('No matching students found', 'error')
    setSaving(true)
    try {
      const res = await api.post(`/api/lms/native/admin/sections/${enrollModal.section.id}/enroll-csv`, { rows })
      if (res.success) { showToast(`Enrolled ${res.enrolled} students`); setEnrollModal(null) }
      else showToast(res.error || 'Failed', 'error')
    } catch (e) { showToast(e?.message || 'Error', 'error') }
    finally { setSaving(false) }
  }

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const filtered = courses.filter(c => {
    if (!search) return true
    const q = search.toLowerCase()
    return c.code?.toLowerCase().includes(q) || c.title?.toLowerCase().includes(q) || c.branch?.toLowerCase().includes(q)
  })

  const grouped = {}
  for (const c of filtered) {
    const key = `${c.academic_year} — Sem ${c.semester}`
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(c)
  }
  const groupKeys = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

  const palette = [
    { bg:'#eef2ff', color:'#4f46e5', border:'#c7d2fe' },
    { bg:'#f0fdf4', color:'#16a34a', border:'#bbf7d0' },
    { bg:'#fff7ed', color:'#ea580c', border:'#fed7aa' },
    { bg:'#fdf4ff', color:'#9333ea', border:'#e9d5ff' },
    { bg:'#fef3c7', color:'#d97706', border:'#fde68a' },
    { bg:'#f0f9ff', color:'#0284c7', border:'#bae6fd' },
  ]

  return (
    <PageLayout>
      <Toast msg={toast?.msg} type={toast?.type} />

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-[14px] bg-gradient-to-br from-indigo-50 to-indigo-100 flex items-center justify-center">
            <BookOpen size={22} color="#4f46e5" />
          </div>
          <div>
            <h1 className="text-[26px] font-extrabold t-primary m-0">Native LMS Structure</h1>
            <p className="text-[13px] t-muted m-0">{courses.length} courses · Thapar University</p>
          </div>
        </div>
        <button onClick={openCreate} className="flex items-center gap-1.5 px-5 py-[10px] rounded-[12px] border-0 text-white text-[14px] font-bold cursor-pointer" style={{ background: 'linear-gradient(135deg,#4f46e5,#6366f1)' }}>
          <Plus size={16} /> New Course
        </button>
      </div>

      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by code, title, branch..."
          className="w-full py-[10px] pl-[38px] pr-4 rounded-[12px] border-[1.5px] border-slate-200 text-[14px] outline-none box-border bg-white focus:border-brand transition-colors" />
      </div>

      {loading ? (
        <div className="py-[60px] text-center text-[14px] t-muted">Loading native LMS courses...</div>
      ) : groupKeys.length === 0 ? (
        <div className="bg-white rounded-[20px] border-[1.5px] border-dashed border-slate-200 py-[60px] px-6 text-center">
          <BookOpen size={40} color="#e2e8f0" className="mx-auto mb-3 block" />
          <div className="text-[15px] font-semibold t-primary">{search ? 'No courses match' : 'No native LMS courses yet'}</div>
          {!search && <div className="text-[13px] t-muted mt-1">Click "New Course" to create one. This is separate from Moodle-synced courses.</div>}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {groupKeys.map((gk, gi) => {
            const sc = palette[gi % palette.length]
            const isOpen = !collapsed[gk]
            return (
              <div key={gk} className="bg-white rounded-[20px] overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.03)]" style={{ border: `1.5px solid ${sc.border}` }}>
                <div onClick={() => setCollapsed(p => ({ ...p, [gk]: !p[gk] }))}
                  className="px-5 py-3.5 flex items-center justify-between cursor-pointer select-none"
                  style={{ background: sc.bg }}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-[10px] flex items-center justify-center" style={{ background: sc.color }}>
                      <BookOpen size={15} color="#fff" />
                    </div>
                    <div>
                      <div className="text-[14px] font-bold" style={{ color: sc.color }}>{gk}</div>
                      <div className="text-[11px]" style={{ color: sc.color, opacity: 0.7 }}>{grouped[gk].length} course{grouped[gk].length !== 1 ? 's' : ''}</div>
                    </div>
                  </div>
                  {isOpen ? <ChevronDown size={16} style={{ color: sc.color }} /> : <ChevronRight size={16} style={{ color: sc.color }} />}
                </div>

                {isOpen && (
                  <div className="p-4 grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                    {grouped[gk].map(c => (
                      <div key={c.id} className="border border-slate-100 rounded-[16px] p-4 bg-slate-50">
                        <div className="flex items-start justify-between gap-2 mb-2.5">
                          <div className="flex-1 min-w-0">
                            <span className="text-[11px] font-bold px-2 py-[2px] rounded-[6px] inline-block mb-1.5" style={{ background: sc.bg, color: sc.color }}>{c.code}</span>
                            <div className="text-[14px] font-bold t-primary break-words">{c.title}</div>
                            <div className="text-[12px] t-muted mt-[3px]">
                              Branch: <b>{c.branch}</b> · Published: <b>{c.is_published ? 'Yes' : 'Draft'}</b>
                            </div>
                          </div>
                        </div>

                        {(c.lms_course_sections || []).length > 0 && (
                          <div className="mb-2.5">
                            {(c.lms_course_sections || []).map(sec => (
                              <div key={sec.id} className="flex items-center justify-between px-[10px] py-[6px] bg-slate-100 rounded-[8px] mb-1">
                                <span className="text-[12px] font-semibold text-slate-700">Section {sec.section_name}{sec.room ? ` · ${sec.room}` : ''}</span>
                                <div className="flex gap-1">
                                  <button onClick={() => openEnroll(sec, c.title)} className="px-2 py-[4px] rounded-[6px] border border-green-200 bg-green-50 cursor-pointer text-[11px] font-bold text-green-700">
                                    Enroll
                                  </button>
                                  <button onClick={() => handleDeleteSection(sec.id)} className="px-[6px] py-[4px] rounded-[6px] border border-red-200 bg-red-50 cursor-pointer">
                                    <Trash2 size={10} color="#dc2626" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex gap-2">
                          <button onClick={() => openSection(c)} className="flex-1 flex items-center justify-center gap-1 py-[7px] rounded-[8px] border-[1.5px] border-indigo-200 bg-indigo-50 cursor-pointer text-[12px] font-bold text-brand">
                            <Plus size={11} /> Section
                          </button>
                          <button onClick={() => openEdit(c)} className="px-[10px] py-[7px] rounded-[8px] border-[1.5px] border-slate-200 bg-white cursor-pointer hover:bg-slate-50 transition-colors">
                            <Edit2 size={13} color="#64748b" />
                          </button>
                          <button onClick={() => handleDelete(c.id)} className="px-[10px] py-[7px] rounded-[8px] border-[1.5px] border-red-200 bg-red-50 cursor-pointer hover:bg-red-100 transition-colors">
                            <Trash2 size={13} color="#dc2626" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-[100] p-5" onClick={() => setModal(null)}>
          <div className="bg-white rounded-[20px] p-7 w-full max-w-[500px] shadow-[0_20px_60px_rgba(0,0,0,0.2)]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <span className="text-[17px] font-bold t-primary">{modal.mode === 'create' ? 'New Native LMS Course' : 'Edit Course'}</span>
              <button onClick={() => setModal(null)} className="border-0 bg-transparent cursor-pointer"><X size={18} color="#94a3b8" /></button>
            </div>
            <div className="flex flex-col gap-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Course Code</label>
                  <input value={form.code} onChange={e => f('code', e.target.value)} placeholder="e.g. UCS701" className={fieldCls} />
                </div>
                <div>
                  <label className={labelCls}>Branch</label>
                  <select value={form.branch} onChange={e => f('branch', e.target.value)} className={fieldCls}>
                    {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className={labelCls}>Course Title</label>
                <input value={form.title} onChange={e => f('title', e.target.value)} placeholder="e.g. Theory of Computation" className={fieldCls} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelCls}>Academic Year</label>
                  <select value={form.academic_year} onChange={e => f('academic_year', e.target.value)} className={fieldCls}>
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Semester</label>
                  <input type="number" min={1} max={12} value={form.semester} onChange={e => f('semester', e.target.value)} className={fieldCls} />
                </div>
                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 cursor-pointer mt-5">
                    <input type="checkbox" checked={form.is_published} onChange={e => f('is_published', e.target.checked)} className="w-4 h-4 accent-brand" />
                    <span className="text-[13px] font-semibold text-slate-700">Published</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="flex gap-2.5 mt-6 justify-end">
              <button onClick={() => setModal(null)} className="px-[18px] py-[10px] rounded-[10px] border-[1.5px] border-slate-200 bg-white cursor-pointer text-[13px] font-semibold text-slate-500">Cancel</button>
              <button onClick={handleSave} disabled={saving} className={`px-5 py-[10px] rounded-[10px] border-0 text-white text-[13px] font-bold ${saving ? 'bg-slate-200 cursor-not-allowed' : 'bg-brand cursor-pointer'}`}>
                {saving ? 'Saving...' : modal.mode === 'create' ? 'Create Course' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {sectionModal && (
        <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-[100] p-5" onClick={() => setSectionModal(null)}>
          <div className="bg-white rounded-[20px] p-7 w-full max-w-[420px] shadow-[0_20px_60px_rgba(0,0,0,0.2)]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-[17px] font-bold t-primary">Add Section</span>
              <button onClick={() => setSectionModal(null)} className="border-0 bg-transparent cursor-pointer"><X size={18} color="#94a3b8" /></button>
            </div>
            <div className="text-[12px] t-muted mb-5">{sectionModal.course.code} · {sectionModal.course.title}</div>
            <div className="flex flex-col gap-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Section Name</label>
                  <input value={secForm.section_name} onChange={e => setSecForm(p => ({ ...p, section_name: e.target.value }))} placeholder="e.g. A, B, P1" className={fieldCls} />
                </div>
                <div>
                  <label className={labelCls}>Room (optional)</label>
                  <input value={secForm.room} onChange={e => setSecForm(p => ({ ...p, room: e.target.value }))} placeholder="e.g. LT-6" className={fieldCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Assign Faculty</label>
                <select value={secForm.faculty_id} onChange={e => setSecForm(p => ({ ...p, faculty_id: e.target.value }))} className={fieldCls}>
                  <option value="">— None —</option>
                  {faculty.map(fc => <option key={fc.id} value={fc.id}>{fc.users?.full_name || fc.designation}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2.5 mt-6 justify-end">
              <button onClick={() => setSectionModal(null)} className="px-[18px] py-[10px] rounded-[10px] border-[1.5px] border-slate-200 bg-white cursor-pointer text-[13px] font-semibold text-slate-500">Cancel</button>
              <button onClick={handleAddSection} disabled={saving} className={`px-5 py-[10px] rounded-[10px] border-0 text-white text-[13px] font-bold ${saving ? 'bg-slate-200 cursor-not-allowed' : 'bg-brand cursor-pointer'}`}>
                {saving ? 'Adding...' : 'Add Section'}
              </button>
            </div>
          </div>
        </div>
      )}

      {enrollModal && (
        <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-[100] p-5" onClick={() => setEnrollModal(null)}>
          <div className="bg-white rounded-[20px] p-7 w-full max-w-[500px] shadow-[0_20px_60px_rgba(0,0,0,0.2)]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-[17px] font-bold t-primary">Bulk Enroll Students</span>
              <button onClick={() => setEnrollModal(null)} className="border-0 bg-transparent cursor-pointer"><X size={18} color="#94a3b8" /></button>
            </div>
            <div className="text-[12px] t-muted mb-4">Section {enrollModal.section.section_name} · {enrollModal.courseName}</div>
            <div className="bg-slate-50 rounded-[12px] p-3 mb-3.5 text-[12px] t-muted leading-[18px]">
              <b>Format:</b> One student per line.<br />
              <code className="text-[11px]">student@email.com, 102183001</code><br />
              <code className="text-[11px]">102183002, 102183002</code><br />
              First column: email or roll number (to match student). Second column: roll number to store.
            </div>
            <div>
              <label className={labelCls}>Paste CSV</label>
              <textarea value={csvText} onChange={e => setCsvText(e.target.value)} rows={8}
                placeholder={"student@thapar.edu, 102183001\n102183002, 102183002"}
                className="w-full mt-1.5 px-3 py-[9px] rounded-[10px] border-[1.5px] border-slate-200 text-[14px] outline-none box-border resize-y focus:border-brand transition-colors" />
            </div>
            <div className="flex gap-2.5 mt-5 justify-end">
              <button onClick={() => setEnrollModal(null)} className="px-[18px] py-[10px] rounded-[10px] border-[1.5px] border-slate-200 bg-white cursor-pointer text-[13px] font-semibold text-slate-500">Cancel</button>
              <button onClick={handleCSVEnroll} disabled={saving || !csvText.trim()}
                className={`flex items-center gap-1.5 px-5 py-[10px] rounded-[10px] border-0 text-white text-[13px] font-bold ${saving || !csvText.trim() ? 'bg-slate-200 cursor-not-allowed' : 'bg-brand cursor-pointer'}`}>
                <Upload size={14} /> {saving ? 'Enrolling...' : 'Enroll from CSV'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  )
}
