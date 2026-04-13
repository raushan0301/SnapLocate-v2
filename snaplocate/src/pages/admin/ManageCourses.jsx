import { useState, useEffect, useCallback } from 'react'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'
import { BookOpen, Plus, Trash2, Edit2, X, Users, Search, ChevronDown, ChevronRight } from 'lucide-react'

const pjs = (size, weight, lh, color) => ({
  fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: size, fontWeight: weight, lineHeight: lh, color,
})

function Toast({ msg, type }) {
  if (!msg) return null
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, background: type === 'error' ? '#dc2626' : '#0f172a', color: '#fff', padding: '12px 20px', borderRadius: 12, zIndex: 999, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, fontWeight: 600 }}>
      {msg}
    </div>
  )
}

// "2526EVESEM" → "Even Sem 2025-26"
function semLabel(sem) {
  if (!sem) return 'No Semester'
  const m = String(sem).match(/^(\d{2})(\d{2})(EVEN|ODD)SEM$/i)
  if (m) return `${m[3].charAt(0).toUpperCase() + m[3].slice(1).toLowerCase()} Sem 20${m[1]}-${m[2]}`
  if (!isNaN(sem)) return `Semester ${sem}`
  return String(sem)
}

// Colour per semester group
const semColors = [
  { bg: '#eef2ff', color: '#4f46e5', border: '#c7d2fe' },
  { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  { bg: '#fff7ed', color: '#ea580c', border: '#fed7aa' },
  { bg: '#fdf4ff', color: '#9333ea', border: '#e9d5ff' },
  { bg: '#fef3c7', color: '#d97706', border: '#fde68a' },
  { bg: '#f0f9ff', color: '#0284c7', border: '#bae6fd' },
]

const emptyForm = { code: '', name: '', dept: '', semester: '', year: new Date().getFullYear() }

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
  const openEdit   = (c) => {
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

  // Filter + group by semester
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
  // Sort semester keys: newest first (2526 > 2425), then no-semester last
  const semKeys = Object.keys(grouped).sort((a, b) => {
    if (a === 'No Semester') return 1
    if (b === 'No Semester') return -1
    return b.localeCompare(a)
  })

  const filteredStudents = students.filter(s =>
    !studentSearch || s.full_name?.toLowerCase().includes(studentSearch.toLowerCase()) || s.email?.toLowerCase().includes(studentSearch.toLowerCase())
  )

  const inputStyle = {
    width: '100%', marginTop: 4, padding: '9px 12px', borderRadius: 10,
    border: '1.5px solid #e2e8f0', fontSize: 14,
    fontFamily: "'Plus Jakarta Sans', sans-serif", outline: 'none', boxSizing: 'border-box',
  }

  return (
    <PageLayout>
      <Toast msg={toast?.msg} type={toast?.type} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BookOpen size={22} color="#4f46e5" />
          </div>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: '#0f172a', margin: 0 }}>Manage Courses</h1>
            <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>{courses.length} courses across {semKeys.length} semesters</p>
          </div>
        </div>
        <button onClick={openCreate}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 12, border: 'none', background: '#4f46e5', color: '#fff', cursor: 'pointer', ...pjs(14, 700, '20px', '#fff') }}>
          <Plus size={16} /> Add Course
        </button>
      </div>

      {/* Search */}
      <div style={{ position: 'relative' }}>
        <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by code, name or department..."
          style={{ width: '100%', padding: '10px 14px 10px 38px', borderRadius: 12, border: '1.5px solid #e2e8f0', fontSize: 14, fontFamily: "'Plus Jakarta Sans', sans-serif", outline: 'none', boxSizing: 'border-box', background: '#fff' }}
          onFocus={e => e.target.style.borderColor = '#4f46e5'} onBlur={e => e.target.style.borderColor = '#e2e8f0'}
        />
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ padding: 60, textAlign: 'center', ...pjs(14, 500, '20px', '#94a3b8') }}>Loading courses...</div>
      ) : semKeys.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9', padding: '60px 24px', textAlign: 'center' }}>
          <BookOpen size={40} color="#e2e8f0" style={{ margin: '0 auto 12px', display: 'block' }} />
          <div style={pjs(15, 600, '20px', '#0f172a')}>{search ? 'No courses match your search' : 'No courses yet'}</div>
          {!search && <div style={{ ...pjs(13, 400, '18px', '#94a3b8'), marginTop: 4 }}>Click "Add Course" or sync from Moodle.</div>}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {semKeys.map((semKey, si) => {
            const sc = semColors[si % semColors.length]
            const isCollapsed = collapsed[semKey]
            const semCourses = grouped[semKey]

            return (
              <div key={semKey} style={{ background: '#fff', borderRadius: 20, border: `1px solid ${sc.border}`, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                {/* Semester header */}
                <div
                  onClick={() => setCollapsed(p => ({ ...p, [semKey]: !p[semKey] }))}
                  style={{ padding: '14px 20px', background: sc.bg, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', userSelect: 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 10, background: sc.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <BookOpen size={15} color="#fff" />
                    </div>
                    <div>
                      <div style={pjs(14, 700, '18px', sc.color)}>{semLabel(semKey)}</div>
                      <div style={pjs(11, 400, '14px', sc.color + 'aa')}>{semCourses.length} course{semCourses.length !== 1 ? 's' : ''}</div>
                    </div>
                  </div>
                  {isCollapsed ? <ChevronRight size={16} color={sc.color} /> : <ChevronDown size={16} color={sc.color} />}
                </div>

                {/* Courses grid */}
                {!isCollapsed && (
                  <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                    {semCourses.map((c) => {
                      const facultyName = c.faculty_profiles?.users?.full_name
                      return (
                        <div key={c.id} style={{ border: '1px solid #f1f5f9', borderRadius: 14, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10, background: '#fafafa', transition: 'box-shadow 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.07)'}
                          onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>

                          {/* Top row */}
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ ...pjs(12, 700, '16px', sc.color), background: sc.bg, padding: '2px 8px', borderRadius: 6, display: 'inline-block', marginBottom: 5 }}>{c.code}</div>
                              <div style={{ ...pjs(13, 700, '18px', '#0f172a'), wordBreak: 'break-word' }}>{c.name}</div>
                            </div>
                          </div>

                          {/* Meta */}
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {c.dept && (
                              <span style={{ ...pjs(11, 600, '14px', '#64748b'), background: '#f1f5f9', padding: '2px 8px', borderRadius: 6 }}>{c.dept}</span>
                            )}
                            <span style={{ ...pjs(11, 600, '14px', '#4f46e5'), background: '#eef2ff', padding: '2px 8px', borderRadius: 6 }}>
                              {c.enrolled_count || 0} enrolled
                            </span>
                            {facultyName && (
                              <span style={{ ...pjs(11, 400, '14px', '#64748b'), background: '#f8fafc', padding: '2px 8px', borderRadius: 6 }}>👤 {facultyName}</span>
                            )}
                          </div>

                          {/* Actions */}
                          <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                            <button onClick={() => openEnroll(c.id, c.name)}
                              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '7px 0', borderRadius: 8, border: '1.5px solid #bbf7d0', background: '#f0fdf4', cursor: 'pointer', ...pjs(11, 700, '14px', '#16a34a') }}>
                              <Users size={11} /> Enroll
                            </button>
                            <button onClick={() => openEdit(c)}
                              style={{ padding: '7px 10px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer' }}>
                              <Edit2 size={13} color="#64748b" />
                            </button>
                            <button onClick={() => handleDelete(c.id)}
                              style={{ padding: '7px 10px', borderRadius: 8, border: '1.5px solid #fecaca', background: '#fee2e2', cursor: 'pointer' }}>
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

      {/* Create/Edit Modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }} onClick={closeModal}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 28, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <span style={pjs(17, 700, '22px', '#0f172a')}>{modal.mode === 'create' ? 'Add Course' : 'Edit Course'}</span>
              <button onClick={closeModal} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X size={18} color="#94a3b8" /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[{ key: 'code', label: 'Course Code', placeholder: 'e.g. UCS301' },
                  { key: 'dept', label: 'Department',  placeholder: 'e.g. CSE' }].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <div style={pjs(12, 600, '16px', '#374151')}>{label}</div>
                    <input value={form[key] || ''} onChange={e => f(key, e.target.value)} placeholder={placeholder}
                      style={inputStyle} onFocus={e => e.target.style.borderColor = '#4f46e5'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                  </div>
                ))}
              </div>
              <div>
                <div style={pjs(12, 600, '16px', '#374151')}>Course Name</div>
                <input value={form.name || ''} onChange={e => f('name', e.target.value)} placeholder="e.g. Operating Systems"
                  style={inputStyle} onFocus={e => e.target.style.borderColor = '#4f46e5'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div>
                  <div style={pjs(12, 600, '16px', '#374151')}>Semester</div>
                  <input value={form.semester || ''} onChange={e => f('semester', e.target.value)} placeholder="e.g. 2526EVESEM"
                    style={inputStyle} onFocus={e => e.target.style.borderColor = '#4f46e5'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                </div>
                <div>
                  <div style={pjs(12, 600, '16px', '#374151')}>Year</div>
                  <input type="number" value={form.year || ''} onChange={e => f('year', parseInt(e.target.value))}
                    style={inputStyle} />
                </div>
                <div>
                  <div style={pjs(12, 600, '16px', '#374151')}>Faculty</div>
                  <select value={form.faculty_id || ''} onChange={e => f('faculty_id', e.target.value)}
                    style={{ ...inputStyle, padding: '9px 10px' }}>
                    <option value="">— None —</option>
                    {faculty.map(fc => <option key={fc.id} value={fc.id}>{fc.users?.full_name || fc.designation}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
              <button onClick={closeModal} style={{ padding: '10px 18px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer', ...pjs(13, 600, '18px', '#64748b') }}>Cancel</button>
              <button onClick={handleSave} disabled={saving}
                style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: saving ? '#e2e8f0' : '#4f46e5', color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', ...pjs(13, 700, '18px', '#fff') }}>
                {saving ? 'Saving...' : modal.mode === 'create' ? 'Create Course' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enroll Students Modal */}
      {enrollModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }} onClick={() => setEnrollModal(null)}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 28, width: '100%', maxWidth: 480, maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <div style={pjs(17, 700, '22px', '#0f172a')}>Enroll Students</div>
                <div style={{ ...pjs(12, 400, '16px', '#94a3b8'), marginTop: 2 }}>{enrollModal.courseName}</div>
              </div>
              <button onClick={() => setEnrollModal(null)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X size={18} color="#94a3b8" /></button>
            </div>

            {/* Student search */}
            <div style={{ position: 'relative', marginBottom: 10 }}>
              <Search size={13} color="#94a3b8" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)' }} />
              <input value={studentSearch} onChange={e => setStudentSearch(e.target.value)} placeholder="Search students..."
                style={{ width: '100%', padding: '8px 10px 8px 32px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 13, fontFamily: "'Plus Jakarta Sans', sans-serif", outline: 'none', boxSizing: 'border-box' }} />
            </div>

            <div style={{ ...pjs(12, 600, '16px', '#64748b'), marginBottom: 8 }}>
              {selectedStudents.length} selected · {filteredStudents.length} shown
            </div>

            <div style={{ flex: 1, overflowY: 'auto', border: '1px solid #f1f5f9', borderRadius: 12 }}>
              {filteredStudents.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', ...pjs(13, 400, '18px', '#94a3b8') }}>No students found</div>
              ) : filteredStudents.map((s) => {
                const checked = selectedStudents.includes(s.id)
                return (
                  <div key={s.id} onClick={() => toggleStudent(s.id)}
                    style={{ padding: '11px 16px', borderBottom: '1px solid #f8fafc', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', background: checked ? '#f5f3ff' : 'transparent', transition: 'background 0.1s' }}>
                    <div style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${checked ? '#4f46e5' : '#e2e8f0'}`, background: checked ? '#4f46e5' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {checked && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={pjs(13, 600, '18px', '#0f172a')}>{s.full_name}</div>
                      <div style={{ ...pjs(11, 400, '14px', '#94a3b8'), overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.email}</div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'space-between', alignItems: 'center' }}>
              <button onClick={() => setSelectedStudents(filteredStudents.map(s => s.id))}
                style={{ padding: '8px 14px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer', ...pjs(12, 600, '16px', '#475569') }}>
                Select all
              </button>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setEnrollModal(null)} style={{ padding: '10px 16px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer', ...pjs(13, 600, '18px', '#64748b') }}>Cancel</button>
                <button onClick={handleBulkEnroll} disabled={enrolling || selectedStudents.length === 0}
                  style={{ padding: '10px 18px', borderRadius: 10, border: 'none', background: enrolling || selectedStudents.length === 0 ? '#e2e8f0' : '#4f46e5', cursor: enrolling || selectedStudents.length === 0 ? 'not-allowed' : 'pointer', ...pjs(13, 700, '18px', '#fff') }}>
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
