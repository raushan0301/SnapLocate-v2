import { useState, useEffect, useCallback } from 'react'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'
import { BookOpen, Plus, Trash2, Edit2, X, Users, Search, ChevronDown, ChevronRight } from 'lucide-react'

function Toast({ msg, type }) {
  if (!msg) return null
  return (
    <div className={`fixed bottom-6 right-6 px-5 py-3 rounded-[12px] z-[999] text-white text-[14px] font-semibold ${type === 'error' ? 'bg-red-600' : 'bg-slate-900'}`}>
      {msg}
    </div>
  )
}

function semLabel(sem) {
  if (!sem) return 'No Semester'
  const m = String(sem).match(/^(\d{2})(\d{2})(EVEN|ODD)SEM$/i)
  if (m) return `${m[3].charAt(0).toUpperCase() + m[3].slice(1).toLowerCase()} Sem 20${m[1]}-${m[2]}`
  if (!isNaN(sem)) return `Semester ${sem}`
  return String(sem)
}

const semColors = [
  { bg: '#eef2ff', color: '#4f46e5', border: '#c7d2fe' },
  { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  { bg: '#fff7ed', color: '#ea580c', border: '#fed7aa' },
  { bg: '#fdf4ff', color: '#9333ea', border: '#e9d5ff' },
  { bg: '#fef3c7', color: '#d97706', border: '#fde68a' },
  { bg: '#f0f9ff', color: '#0284c7', border: '#bae6fd' },
]

const emptyForm = { code: '', name: '', dept: '', semester: '', year: new Date().getFullYear() }

const fieldCls = 'w-full mt-1 px-3 py-[9px] rounded-[10px] border-[1.5px] border-slate-200 text-[14px] outline-none box-border focus:border-brand transition-colors'
const labelCls = 'text-[12px] font-semibold text-slate-700 block'

export default function ManageCourses() {
  const [courses, setCourses]   = useState([])
  const [faculty, setFaculty]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [modal, setModal]       = useState(null)
  const [form, setForm]         = useState(emptyForm)
  const [saving, setSaving]     = useState(false)
  const [toast, setToast]       = useState(null)
  const [search, setSearch]     = useState('')
  const [collapsed, setCollapsed] = useState({})
  const [enrollModal, setEnrollModal] = useState(null)
  const [students, setStudents] = useState([])
  const [selectedStudents, setSelectedStudents] = useState([])
  const [enrolling, setEnrolling] = useState(false)
  const [studentSearch, setStudentSearch] = useState('')

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000) }

  const load = useCallback(async () => {
    const [cRes, fRes] = await Promise.allSettled([
      api.get('/api/admin/courses'),
      api.get('/api/faculty'),
    ])
    if (cRes.status === 'fulfilled' && cRes.value.success) setCourses(cRes.value.data || [])
    if (fRes.status === 'fulfilled' && fRes.value.success) setFaculty(fRes.value.data || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const openCreate = () => { setForm(emptyForm); setModal({ mode: 'create' }) }
  const openEdit = (c) => {
    setForm({ code: c.code, name: c.name, dept: c.dept || '', semester: c.semester || '', year: c.year || '', faculty_id: c.faculty_id })
    setModal({ mode: 'edit', id: c.id })
  }
  const closeModal = () => { setModal(null); setForm(emptyForm) }

  const handleSave = async () => {
    if (!form.code || !form.name) return showToast('Course code and name are required', 'error')
    setSaving(true)
    try {
      const res = modal.mode === 'create'
        ? await api.post('/api/admin/courses', form)
        : await api.patch(`/api/admin/courses/${modal.id}`, form)
      if (res.success) { showToast(modal.mode === 'create' ? 'Course created' : 'Course updated'); load(); closeModal() }
      else showToast(res.error || 'Save failed', 'error')
    } catch (err) { showToast(err?.message || 'Save failed', 'error') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this course? All enrollments will also be removed.')) return
    try {
      const res = await api.delete(`/api/admin/courses/${id}`)
      if (res.success) { showToast('Course deleted'); load() }
      else showToast(res.error || 'Delete failed', 'error')
    } catch { showToast('Delete failed', 'error') }
  }

  const openEnroll = async (courseId, courseName) => {
    setEnrollModal({ courseId, courseName })
    setSelectedStudents([])
    setStudentSearch('')
    try {
      const res = await api.get('/api/admin/users?role=student')
      if (res.success) setStudents(res.data || [])
    } catch {}
  }

  const handleBulkEnroll = async () => {
    if (selectedStudents.length === 0) return showToast('Select at least one student', 'error')
    setEnrolling(true)
    try {
      const res = await api.post(`/api/lms/courses/${enrollModal.courseId}/bulk-enroll`, { student_ids: selectedStudents })
      if (res.success) { showToast(`Enrolled ${res.enrolled} students`); setEnrollModal(null); load() }
      else showToast(res.error || 'Enroll failed', 'error')
    } catch (err) { showToast(err?.message || 'Enroll failed', 'error') }
    finally { setEnrolling(false) }
  }

  const toggleStudent = (id) => setSelectedStudents(prev =>
    prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
  )
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const filtered = courses.filter(c => {
    if (!search) return true
    const q = search.toLowerCase()
    return c.code?.toLowerCase().includes(q) || c.name?.toLowerCase().includes(q) || c.dept?.toLowerCase().includes(q)
  })

  const grouped = {}
  for (const c of filtered) {
    const key = c.semester || 'No Semester'
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(c)
  }
  const semKeys = Object.keys(grouped).sort((a, b) => {
    if (a === 'No Semester') return 1
    if (b === 'No Semester') return -1
    return b.localeCompare(a)
  })

  const filteredStudents = students.filter(s =>
    !studentSearch || s.full_name?.toLowerCase().includes(studentSearch.toLowerCase()) || s.email?.toLowerCase().includes(studentSearch.toLowerCase())
  )

  return (
    <PageLayout>
      <Toast msg={toast?.msg} type={toast?.type} />

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-[14px] bg-indigo-50 flex items-center justify-center">
            <BookOpen size={22} color="#4f46e5" />
          </div>
          <div>
            <h1 className="text-[26px] font-bold t-primary m-0">Manage Courses</h1>
            <p className="text-[14px] t-muted m-0">{courses.length} courses across {semKeys.length} semesters</p>
          </div>
        </div>
        <button onClick={openCreate} className="flex items-center gap-1.5 px-[18px] py-[10px] rounded-[12px] border-0 bg-brand text-white text-[14px] font-bold cursor-pointer">
          <Plus size={16} /> Add Course
        </button>
      </div>

      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by code, name or department..."
          className="w-full py-[10px] pl-[38px] pr-4 rounded-[12px] border-[1.5px] border-slate-200 text-[14px] outline-none box-border bg-white focus:border-brand transition-colors" />
      </div>

      {loading ? (
        <div className="py-[60px] text-center text-[14px] t-muted">Loading courses...</div>
      ) : semKeys.length === 0 ? (
        <div className="bg-white rounded-[20px] border border-slate-100 py-[60px] px-6 text-center">
          <BookOpen size={40} color="#e2e8f0" className="mx-auto mb-3 block" />
          <div className="text-[15px] font-semibold t-primary">{search ? 'No courses match your search' : 'No courses yet'}</div>
          {!search && <div className="text-[13px] t-muted mt-1">Click "Add Course" or sync from Moodle.</div>}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {semKeys.map((semKey, si) => {
            const sc = semColors[si % semColors.length]
            const isCollapsed = collapsed[semKey]
            const semCourses = grouped[semKey]
            return (
              <div key={semKey} className="bg-white rounded-[20px] overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.03)]" style={{ border: `1px solid ${sc.border}` }}>
                <div onClick={() => setCollapsed(p => ({ ...p, [semKey]: !p[semKey] }))}
                  className="px-5 py-3.5 flex items-center justify-between cursor-pointer select-none"
                  style={{ background: sc.bg }}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-[10px] flex items-center justify-center" style={{ background: sc.color }}>
                      <BookOpen size={15} color="#fff" />
                    </div>
                    <div>
                      <div className="text-[14px] font-bold" style={{ color: sc.color }}>{semLabel(semKey)}</div>
                      <div className="text-[11px]" style={{ color: sc.color + 'aa' }}>{semCourses.length} course{semCourses.length !== 1 ? 's' : ''}</div>
                    </div>
                  </div>
                  {isCollapsed ? <ChevronRight size={16} style={{ color: sc.color }} /> : <ChevronDown size={16} style={{ color: sc.color }} />}
                </div>

                {!isCollapsed && (
                  <div className="p-4 grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                    {semCourses.map(c => {
                      const facultyName = c.faculty_profiles?.users?.full_name
                      return (
                        <div key={c.id} className="border border-slate-100 rounded-[14px] px-4 py-3.5 flex flex-col gap-2.5 bg-slate-50 hover:shadow-[0_4px_16px_rgba(0,0,0,0.07)] transition-shadow">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <span className="text-[12px] font-bold px-2 py-[2px] rounded-[6px] inline-block mb-1.5" style={{ background: sc.bg, color: sc.color }}>{c.code}</span>
                              <div className="text-[13px] font-bold t-primary break-words">{c.name}</div>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {c.dept && <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-[2px] rounded-[6px]">{c.dept}</span>}
                            <span className="text-[11px] font-semibold text-brand bg-indigo-50 px-2 py-[2px] rounded-[6px]">{c.enrolled_count || 0} enrolled</span>
                            {facultyName && <span className="text-[11px] text-slate-600 bg-slate-50 px-2 py-[2px] rounded-[6px]">👤 {facultyName}</span>}
                          </div>
                          <div className="flex gap-2 mt-0.5">
                            <button onClick={() => openEnroll(c.id, c.name)} className="flex-1 flex items-center justify-center gap-1 py-[7px] rounded-[8px] border-[1.5px] border-green-200 bg-green-50 cursor-pointer text-[11px] font-bold text-green-700">
                              <Users size={11} /> Enroll
                            </button>
                            <button onClick={() => openEdit(c)} className="px-[10px] py-[7px] rounded-[8px] border-[1.5px] border-slate-200 bg-white cursor-pointer hover:bg-slate-50 transition-colors">
                              <Edit2 size={13} color="#64748b" />
                            </button>
                            <button onClick={() => handleDelete(c.id)} className="px-[10px] py-[7px] rounded-[8px] border-[1.5px] border-red-200 bg-red-50 cursor-pointer hover:bg-red-100 transition-colors">
                              <Trash2 size={13} color="#dc2626" />
                            </button>
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

      {modal && (
        <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-[100] p-5" onClick={closeModal}>
          <div className="bg-white rounded-[20px] p-7 w-full max-w-[480px] shadow-[0_20px_60px_rgba(0,0,0,0.2)]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <span className="text-[17px] font-bold t-primary">{modal.mode === 'create' ? 'Add Course' : 'Edit Course'}</span>
              <button onClick={closeModal} className="border-0 bg-transparent cursor-pointer"><X size={18} color="#94a3b8" /></button>
            </div>
            <div className="flex flex-col gap-3.5">
              <div className="grid grid-cols-2 gap-3">
                {[{ key: 'code', label: 'Course Code', placeholder: 'e.g. UCS301' },
                  { key: 'dept', label: 'Department', placeholder: 'e.g. CSE' }].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className={labelCls}>{label}</label>
                    <input value={form[key] || ''} onChange={e => f(key, e.target.value)} placeholder={placeholder} className={fieldCls} />
                  </div>
                ))}
              </div>
              <div>
                <label className={labelCls}>Course Name</label>
                <input value={form.name || ''} onChange={e => f('name', e.target.value)} placeholder="e.g. Operating Systems" className={fieldCls} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelCls}>Semester</label>
                  <input value={form.semester || ''} onChange={e => f('semester', e.target.value)} placeholder="e.g. 2526EVESEM" className={fieldCls} />
                </div>
                <div>
                  <label className={labelCls}>Year</label>
                  <input type="number" value={form.year || ''} onChange={e => f('year', parseInt(e.target.value))} className={fieldCls} />
                </div>
                <div>
                  <label className={labelCls}>Faculty</label>
                  <select value={form.faculty_id || ''} onChange={e => f('faculty_id', e.target.value)} className={fieldCls}>
                    <option value="">— None —</option>
                    {faculty.map(fc => <option key={fc.id} value={fc.id}>{fc.users?.full_name || fc.designation}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-2.5 mt-6 justify-end">
              <button onClick={closeModal} className="px-[18px] py-[10px] rounded-[10px] border-[1.5px] border-slate-200 bg-white cursor-pointer text-[13px] font-semibold text-slate-500">Cancel</button>
              <button onClick={handleSave} disabled={saving} className={`px-5 py-[10px] rounded-[10px] border-0 text-white text-[13px] font-bold ${saving ? 'bg-slate-200 cursor-not-allowed' : 'bg-brand cursor-pointer'}`}>
                {saving ? 'Saving...' : modal.mode === 'create' ? 'Create Course' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {enrollModal && (
        <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-[100] p-5" onClick={() => setEnrollModal(null)}>
          <div className="bg-white rounded-[20px] p-7 w-full max-w-[480px] max-h-[85vh] flex flex-col shadow-[0_20px_60px_rgba(0,0,0,0.2)]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3">
              <div>
                <div className="text-[17px] font-bold t-primary">Enroll Students</div>
                <div className="text-[12px] t-muted mt-0.5">{enrollModal.courseName}</div>
              </div>
              <button onClick={() => setEnrollModal(null)} className="border-0 bg-transparent cursor-pointer"><X size={18} color="#94a3b8" /></button>
            </div>

            <div className="relative mb-2.5">
              <Search size={13} className="absolute left-[11px] top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={studentSearch} onChange={e => setStudentSearch(e.target.value)} placeholder="Search students..."
                className="w-full py-2 pl-8 pr-2.5 rounded-[10px] border-[1.5px] border-slate-200 text-[13px] outline-none box-border focus:border-brand transition-colors" />
            </div>

            <div className="text-[12px] font-semibold text-slate-500 mb-2">{selectedStudents.length} selected · {filteredStudents.length} shown</div>

            <div className="flex-1 overflow-y-auto border border-slate-100 rounded-[12px]">
              {filteredStudents.length === 0 ? (
                <div className="py-6 text-center text-[13px] t-muted">No students found</div>
              ) : filteredStudents.map(s => {
                const checked = selectedStudents.includes(s.id)
                return (
                  <div key={s.id} onClick={() => toggleStudent(s.id)}
                    className={`px-4 py-[11px] border-b border-slate-50 flex items-center gap-3 cursor-pointer transition-colors ${checked ? 'bg-indigo-50' : 'bg-transparent hover:bg-slate-50'}`}>
                    <div className={`w-[18px] h-[18px] rounded-[5px] border-2 flex items-center justify-center shrink-0 ${checked ? 'border-brand bg-brand' : 'border-slate-200 bg-white'}`}>
                      {checked && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold t-primary">{s.full_name}</div>
                      <div className="text-[11px] t-muted truncate">{s.email}</div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex gap-2.5 mt-4 justify-between items-center">
              <button onClick={() => setSelectedStudents(filteredStudents.map(s => s.id))}
                className="px-3.5 py-2 rounded-[8px] border-[1.5px] border-slate-200 bg-white cursor-pointer text-[12px] font-semibold text-slate-600">
                Select all
              </button>
              <div className="flex gap-2">
                <button onClick={() => setEnrollModal(null)} className="px-4 py-[10px] rounded-[10px] border-[1.5px] border-slate-200 bg-white cursor-pointer text-[13px] font-semibold text-slate-500">Cancel</button>
                <button onClick={handleBulkEnroll} disabled={enrolling || selectedStudents.length === 0}
                  className={`px-[18px] py-[10px] rounded-[10px] border-0 text-white text-[13px] font-bold ${enrolling || selectedStudents.length === 0 ? 'bg-slate-200 cursor-not-allowed' : 'bg-brand cursor-pointer'}`}>
                  {enrolling ? 'Enrolling...' : `Enroll ${selectedStudents.length}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  )
}
