import { useState, useEffect, useCallback } from 'react'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'
import { BookOpen, Plus, Trash2, Edit2, X, Users, ChevronDown, ChevronRight, Search, Upload } from 'lucide-react'

const pjs = (sz, fw, lh, col) => ({ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:sz, fontWeight:fw, lineHeight:lh, color:col })
const inp = { width:'100%', marginTop:4, padding:'9px 12px', borderRadius:10, border:'1.5px solid #e2e8f0', fontSize:14, fontFamily:"'Plus Jakarta Sans',sans-serif", outline:'none', boxSizing:'border-box' }
const BRANCHES = ['CSE','ECE','EE','ME','CE','BIO','CHEM','PHYS','MATH','BBA','MBA']
const YEARS = ['2025-26','2024-25','2023-24']

function Toast({ msg, type }) {
  if (!msg) return null
  return <div style={{ position:'fixed', bottom:24, right:24, background: type==='error'?'#dc2626':'#0f172a', color:'#fff', padding:'12px 20px', borderRadius:12, zIndex:999, fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:14, fontWeight:600 }}>{msg}</div>
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

  const showToast = (msg, type='success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000) }

  const load = useCallback(async () => {
    setLoading(true)
    const [cRes, fRes] = await Promise.allSettled([
      api.get('/api/lms/native/admin/courses'),
      api.get('/api/faculty'),
    ])
    if (cRes.status==='fulfilled' && cRes.value.success) setCourses(cRes.value.data || [])
    if (fRes.status==='fulfilled' && fRes.value.success) setFaculty(fRes.value.data || [])
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
    if (!form.code || !form.title) return showToast('Code and title required','error')
    setSaving(true)
    try {
      const payload = { ...form, semester: parseInt(form.semester) }
      const res = modal.mode==='create'
        ? await api.post('/api/lms/native/admin/courses', payload)
        : await api.patch(`/api/lms/native/admin/courses/${modal.id}`, payload)
      if (res.success) { showToast(modal.mode==='create'?'Course created':'Course updated'); load(); setModal(null) }
      else showToast(res.error||'Save failed','error')
    } catch(e) { showToast(e?.message||'Error','error') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this course and all its sections?')) return
    try {
      const res = await api.delete(`/api/lms/native/admin/courses/${id}`)
      if (res.success) { showToast('Deleted'); load() }
      else showToast(res.error||'Failed','error')
    } catch { showToast('Error','error') }
  }

  const openSection = (course) => {
    setSecForm({ section_name:'', faculty_id:'', room:'' })
    setSectionModal({ course })
  }

  const handleAddSection = async () => {
    if (!secForm.section_name) return showToast('Section name required','error')
    setSaving(true)
    try {
      const payload = { section_name: secForm.section_name, room: secForm.room||null }
      if (secForm.faculty_id) payload.faculty_id = secForm.faculty_id
      const res = await api.post(`/api/lms/native/admin/courses/${sectionModal.course.id}/sections`, payload)
      if (res.success) { showToast('Section added'); load(); setSectionModal(null) }
      else showToast(res.error||'Failed','error')
    } catch(e) { showToast(e?.message||'Error','error') }
    finally { setSaving(false) }
  }

  const handleDeleteSection = async (secId) => {
    if (!window.confirm('Delete this section and all its enrollments?')) return
    try {
      const res = await api.delete(`/api/lms/native/admin/sections/${secId}`)
      if (res.success) { showToast('Section deleted'); load() }
      else showToast(res.error||'Failed','error')
    } catch { showToast('Error','error') }
  }

  const openEnroll = async (section, courseName) => {
    setCsvText('')
    const res = await api.get('/api/admin/users?role=student')
    if (res.success) setStudents(res.data||[])
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
    if (!rows.length) return showToast('No matching students found','error')
    setSaving(true)
    try {
      const res = await api.post(`/api/lms/native/admin/sections/${enrollModal.section.id}/enroll-csv`, { rows })
      if (res.success) { showToast(`Enrolled ${res.enrolled} students`); setEnrollModal(null) }
      else showToast(res.error||'Failed','error')
    } catch(e) { showToast(e?.message||'Error','error') }
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

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <div style={{ width:44, height:44, borderRadius:14, background:'linear-gradient(135deg,#eef2ff,#e0e7ff)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <BookOpen size={22} color="#4f46e5" />
          </div>
          <div>
            <h1 style={{ fontSize:26, fontWeight:800, color:'#0f172a', margin:0 }}>Native LMS Structure</h1>
            <p style={{ fontSize:13, color:'#64748b', margin:0 }}>{courses.length} courses · Thapar University</p>
          </div>
        </div>
        <button onClick={openCreate} style={{ display:'flex', alignItems:'center', gap:6, padding:'10px 20px', borderRadius:12, border:'none', background:'linear-gradient(135deg,#4f46e5,#6366f1)', color:'#fff', cursor:'pointer', fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:14, fontWeight:700 }}>
          <Plus size={16} /> New Course
        </button>
      </div>

      {/* Search */}
      <div style={{ position:'relative' }}>
        <Search size={15} color="#94a3b8" style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)' }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by code, title, branch..."
          style={{ width:'100%', padding:'10px 14px 10px 38px', borderRadius:12, border:'1.5px solid #e2e8f0', fontSize:14, fontFamily:"'Plus Jakarta Sans',sans-serif", outline:'none', boxSizing:'border-box', background:'#fff' }} />
      </div>

      {/* Course Groups */}
      {loading ? (
        <div style={{ padding:60, textAlign:'center', ...pjs(14,500,'20px','#94a3b8') }}>Loading native LMS courses...</div>
      ) : groupKeys.length === 0 ? (
        <div style={{ background:'#fff', borderRadius:20, border:'1.5px dashed #e2e8f0', padding:'60px 24px', textAlign:'center' }}>
          <BookOpen size={40} color="#e2e8f0" style={{ margin:'0 auto 12px', display:'block' }} />
          <div style={pjs(15,600,'20px','#0f172a')}>{search ? 'No courses match' : 'No native LMS courses yet'}</div>
          {!search && <div style={{ ...pjs(13,400,'18px','#94a3b8'), marginTop:4 }}>Click "New Course" to create one. This is separate from Moodle-synced courses.</div>}
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {groupKeys.map((gk, gi) => {
            const sc = palette[gi % palette.length]
            const isOpen = !collapsed[gk]
            return (
              <div key={gk} style={{ background:'#fff', borderRadius:20, border:`1.5px solid ${sc.border}`, overflow:'hidden', boxShadow:'0 2px 8px rgba(0,0,0,0.03)' }}>
                {/* Group header */}
                <div onClick={() => setCollapsed(p => ({ ...p, [gk]: !p[gk] }))}
                  style={{ padding:'14px 20px', background:sc.bg, display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer', userSelect:'none' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{ width:32, height:32, borderRadius:10, background:sc.color, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <BookOpen size={15} color="#fff" />
                    </div>
                    <div>
                      <div style={pjs(14,700,'18px',sc.color)}>{gk}</div>
                      <div style={{ ...pjs(11,400,'14px',sc.color), opacity:0.7 }}>{grouped[gk].length} course{grouped[gk].length!==1?'s':''}</div>
                    </div>
                  </div>
                  {isOpen ? <ChevronDown size={16} color={sc.color} /> : <ChevronRight size={16} color={sc.color} />}
                </div>

                {/* Course cards */}
                {isOpen && (
                  <div style={{ padding:16, display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:12 }}>
                    {grouped[gk].map(c => (
                      <div key={c.id} style={{ border:'1px solid #f1f5f9', borderRadius:16, padding:16, background:'#fafafa' }}>
                        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8, marginBottom:10 }}>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ ...pjs(11,700,'14px',sc.color), background:sc.bg, padding:'2px 8px', borderRadius:6, display:'inline-block', marginBottom:5 }}>{c.code}</div>
                            <div style={{ ...pjs(14,700,'18px','#0f172a'), wordBreak:'break-word' }}>{c.title}</div>
                            <div style={{ ...pjs(12,400,'16px','#64748b'), marginTop:3 }}>
                              Branch: <b>{c.branch}</b> · Published: <b>{c.is_published?'Yes':'Draft'}</b>
                            </div>
                          </div>
                        </div>

                        {/* Sections */}
                        {(c.lms_course_sections || []).length > 0 && (
                          <div style={{ marginBottom:10 }}>
                            {(c.lms_course_sections||[]).map(sec => (
                              <div key={sec.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'6px 10px', background:'#f8fafc', borderRadius:8, marginBottom:4 }}>
                                <span style={pjs(12,600,'16px','#334155')}>Section {sec.section_name} {sec.room?`· ${sec.room}`:''}</span>
                                <div style={{ display:'flex', gap:4 }}>
                                  <button onClick={() => openEnroll(sec, c.title)} style={{ padding:'4px 8px', borderRadius:6, border:'1px solid #bbf7d0', background:'#f0fdf4', cursor:'pointer', fontSize:11, fontWeight:700, color:'#16a34a' }}>
                                    Enroll
                                  </button>
                                  <button onClick={() => handleDeleteSection(sec.id)} style={{ padding:'4px 6px', borderRadius:6, border:'1px solid #fecaca', background:'#fee2e2', cursor:'pointer' }}>
                                    <Trash2 size={10} color="#dc2626" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Actions */}
                        <div style={{ display:'flex', gap:8 }}>
                          <button onClick={() => openSection(c)} style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:4, padding:'7px 0', borderRadius:8, border:'1.5px solid #c7d2fe', background:'#eef2ff', cursor:'pointer', fontSize:12, fontWeight:700, color:'#4f46e5' }}>
                            <Plus size={11} /> Section
                          </button>
                          <button onClick={() => openEdit(c)} style={{ padding:'7px 10px', borderRadius:8, border:'1.5px solid #e2e8f0', background:'#fff', cursor:'pointer' }}>
                            <Edit2 size={13} color="#64748b" />
                          </button>
                          <button onClick={() => handleDelete(c.id)} style={{ padding:'7px 10px', borderRadius:8, border:'1.5px solid #fecaca', background:'#fee2e2', cursor:'pointer' }}>
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

      {/* Create/Edit Course Modal */}
      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100, padding:20 }} onClick={() => setModal(null)}>
          <div style={{ background:'#fff', borderRadius:20, padding:28, width:'100%', maxWidth:500, boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <span style={pjs(17,700,'22px','#0f172a')}>{modal.mode==='create'?'New Native LMS Course':'Edit Course'}</span>
              <button onClick={() => setModal(null)} style={{ border:'none', background:'none', cursor:'pointer' }}><X size={18} color="#94a3b8" /></button>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <div style={pjs(12,600,'16px','#374151')}>Course Code</div>
                  <input value={form.code} onChange={e => f('code',e.target.value)} placeholder="e.g. UCS701" style={inp} />
                </div>
                <div>
                  <div style={pjs(12,600,'16px','#374151')}>Branch</div>
                  <select value={form.branch} onChange={e => f('branch',e.target.value)} style={{ ...inp, padding:'9px 10px' }}>
                    {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <div style={pjs(12,600,'16px','#374151')}>Course Title</div>
                <input value={form.title} onChange={e => f('title',e.target.value)} placeholder="e.g. Theory of Computation" style={inp} />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
                <div>
                  <div style={pjs(12,600,'16px','#374151')}>Academic Year</div>
                  <select value={form.academic_year} onChange={e => f('academic_year',e.target.value)} style={{ ...inp, padding:'9px 10px' }}>
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div>
                  <div style={pjs(12,600,'16px','#374151')}>Semester</div>
                  <input type="number" min={1} max={12} value={form.semester} onChange={e => f('semester',e.target.value)} style={inp} />
                </div>
                <div style={{ display:'flex', flexDirection:'column', justifyContent:'flex-end' }}>
                  <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', marginTop:20 }}>
                    <input type="checkbox" checked={form.is_published} onChange={e => f('is_published',e.target.checked)} style={{ width:16, height:16 }} />
                    <span style={pjs(13,600,'18px','#374151')}>Published</span>
                  </label>
                </div>
              </div>
            </div>
            <div style={{ display:'flex', gap:10, marginTop:24, justifyContent:'flex-end' }}>
              <button onClick={() => setModal(null)} style={{ padding:'10px 18px', borderRadius:10, border:'1.5px solid #e2e8f0', background:'#fff', cursor:'pointer', ...pjs(13,600,'18px','#64748b') }}>Cancel</button>
              <button onClick={handleSave} disabled={saving} style={{ padding:'10px 20px', borderRadius:10, border:'none', background:saving?'#e2e8f0':'#4f46e5', color:'#fff', cursor:saving?'not-allowed':'pointer', ...pjs(13,700,'18px','#fff') }}>
                {saving?'Saving...':modal.mode==='create'?'Create Course':'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Section Modal */}
      {sectionModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100, padding:20 }} onClick={() => setSectionModal(null)}>
          <div style={{ background:'#fff', borderRadius:20, padding:28, width:'100%', maxWidth:420, boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
              <span style={pjs(17,700,'22px','#0f172a')}>Add Section</span>
              <button onClick={() => setSectionModal(null)} style={{ border:'none', background:'none', cursor:'pointer' }}><X size={18} color="#94a3b8" /></button>
            </div>
            <div style={{ ...pjs(12,400,'16px','#94a3b8'), marginBottom:20 }}>{sectionModal.course.code} · {sectionModal.course.title}</div>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <div style={pjs(12,600,'16px','#374151')}>Section Name</div>
                  <input value={secForm.section_name} onChange={e => setSecForm(p=>({...p,section_name:e.target.value}))} placeholder="e.g. A, B, P1" style={inp} />
                </div>
                <div>
                  <div style={pjs(12,600,'16px','#374151')}>Room (optional)</div>
                  <input value={secForm.room} onChange={e => setSecForm(p=>({...p,room:e.target.value}))} placeholder="e.g. LT-6" style={inp} />
                </div>
              </div>
              <div>
                <div style={pjs(12,600,'16px','#374151')}>Assign Faculty</div>
                <select value={secForm.faculty_id} onChange={e => setSecForm(p=>({...p,faculty_id:e.target.value}))} style={{ ...inp, padding:'9px 10px' }}>
                  <option value="">— None —</option>
                  {faculty.map(fc => <option key={fc.id} value={fc.id}>{fc.users?.full_name || fc.designation}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display:'flex', gap:10, marginTop:24, justifyContent:'flex-end' }}>
              <button onClick={() => setSectionModal(null)} style={{ padding:'10px 18px', borderRadius:10, border:'1.5px solid #e2e8f0', background:'#fff', cursor:'pointer', ...pjs(13,600,'18px','#64748b') }}>Cancel</button>
              <button onClick={handleAddSection} disabled={saving} style={{ padding:'10px 20px', borderRadius:10, border:'none', background:saving?'#e2e8f0':'#4f46e5', color:'#fff', cursor:saving?'not-allowed':'pointer', ...pjs(13,700,'18px','#fff') }}>
                {saving?'Adding...':'Add Section'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Roll-Number CSV Enroll Modal */}
      {enrollModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100, padding:20 }} onClick={() => setEnrollModal(null)}>
          <div style={{ background:'#fff', borderRadius:20, padding:28, width:'100%', maxWidth:500, boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
              <span style={pjs(17,700,'22px','#0f172a')}>Bulk Enroll Students</span>
              <button onClick={() => setEnrollModal(null)} style={{ border:'none', background:'none', cursor:'pointer' }}><X size={18} color="#94a3b8" /></button>
            </div>
            <div style={{ ...pjs(12,400,'16px','#94a3b8'), marginBottom:16 }}>Section {enrollModal.section.section_name} · {enrollModal.courseName}</div>
            <div style={{ background:'#f8fafc', borderRadius:12, padding:12, marginBottom:14, ...pjs(12,400,'18px','#64748b') }}>
              <b>Format:</b> One student per line.<br />
              <code style={{ fontSize:11 }}>student@email.com, 102183001</code><br />
              <code style={{ fontSize:11 }}>102183002, 102183002</code><br />
              First column: email or roll number (to match student). Second column: roll number to store.
            </div>
            <div>
              <div style={pjs(12,600,'16px','#374151')}>Paste CSV</div>
              <textarea value={csvText} onChange={e => setCsvText(e.target.value)} rows={8}
                placeholder={"student@thapar.edu, 102183001\n102183002, 102183002"}
                style={{ ...inp, height:'auto', resize:'vertical', marginTop:6 }} />
            </div>
            <div style={{ display:'flex', gap:10, marginTop:20, justifyContent:'flex-end' }}>
              <button onClick={() => setEnrollModal(null)} style={{ padding:'10px 18px', borderRadius:10, border:'1.5px solid #e2e8f0', background:'#fff', cursor:'pointer', ...pjs(13,600,'18px','#64748b') }}>Cancel</button>
              <button onClick={handleCSVEnroll} disabled={saving||!csvText.trim()} style={{ display:'flex', alignItems:'center', gap:6, padding:'10px 20px', borderRadius:10, border:'none', background:saving||!csvText.trim()?'#e2e8f0':'#4f46e5', color:'#fff', cursor:saving||!csvText.trim()?'not-allowed':'pointer', ...pjs(13,700,'18px','#fff') }}>
                <Upload size={14} /> {saving?'Enrolling...':'Enroll from CSV'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  )
}
