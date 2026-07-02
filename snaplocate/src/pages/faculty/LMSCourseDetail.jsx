import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'
import { BookOpen, ClipboardList, Megaphone, Users, ChevronLeft, Plus, Star } from 'lucide-react'

const TABS = [
  { key: 'assignments',  label: 'Assignments',  icon: ClipboardList },
  { key: 'announcements', label: 'Announcements', icon: Megaphone },
  { key: 'students',    label: 'Students',     icon: Users },
]

const fieldCls = 'w-full px-3 py-[9px] rounded-[8px] border border-slate-200 text-[13px] outline-none bg-white focus:border-brand transition-colors'
const labelCls = 'text-[12px] font-semibold text-slate-700 block mb-1.5'

export default function LMSCourseDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [activeTab, setActiveTab]     = useState('assignments')
  const [course, setCourse]           = useState(null)
  const [assignments, setAssignments] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [students, setStudents]       = useState([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState(null)

  const [showAssignForm, setShowAssignForm] = useState(false)
  const [assignForm, setAssignForm] = useState({ title: '', description: '', due_date: '', max_marks: '', publish_at: '' })
  const [assignSubmitting, setAssignSubmitting] = useState(false)
  const [assignError, setAssignError] = useState(null)

  const [showAnnForm, setShowAnnForm] = useState(false)
  const [annForm, setAnnForm] = useState({ title: '', message: '', is_pinned: false })
  const [annSubmitting, setAnnSubmitting] = useState(false)
  const [annError, setAnnError] = useState(null)

  useEffect(() => {
    async function fetchBase() {
      setLoading(true)
      setError(null)
      try {
        const [courseRes, assignRes, annRes] = await Promise.all([
          api.get(`/api/lms/courses/${id}`),
          api.get(`/api/lms/assignments?course_id=${id}`),
          api.get(`/api/lms/announcements?course_id=${id}`),
        ])
        setCourse(courseRes.data)
        setAssignments(assignRes.data || [])
        setAnnouncements(annRes.data || [])
      } catch (err) {
        setError(err.message || 'Failed to load course data')
      } finally {
        setLoading(false)
      }
    }
    fetchBase()
  }, [id])

  useEffect(() => {
    if (activeTab !== 'students') return
    async function fetchStudents() {
      try {
        const res = await api.get(`/api/lms/courses/${id}/students`)
        setStudents(res.data || [])
      } catch { setStudents([]) }
    }
    fetchStudents()
  }, [activeTab, id])

  async function handleCreateAssignment(e) {
    e.preventDefault()
    setAssignSubmitting(true)
    setAssignError(null)
    try {
      const res = await api.post('/api/lms/assignments', {
        course_id: id,
        title: assignForm.title,
        description: assignForm.description,
        due_date: assignForm.due_date,
        max_marks: Number(assignForm.max_marks),
        publish_at: assignForm.publish_at || undefined,
      })
      setAssignments(prev => [res.data, ...prev])
      setAssignForm({ title: '', description: '', due_date: '', max_marks: '', publish_at: '' })
      setShowAssignForm(false)
    } catch (err) {
      setAssignError(err.message || 'Failed to create assignment')
    } finally {
      setAssignSubmitting(false)
    }
  }

  async function handleCreateAnnouncement(e) {
    e.preventDefault()
    setAnnSubmitting(true)
    setAnnError(null)
    try {
      const res = await api.post('/api/lms/announcements', {
        course_id: id,
        title: annForm.title,
        message: annForm.message,
        is_pinned: annForm.is_pinned,
      })
      setAnnouncements(prev => [res.data, ...prev])
      setAnnForm({ title: '', message: '', is_pinned: false })
      setShowAnnForm(false)
    } catch (err) {
      setAnnError(err.message || 'Failed to create announcement')
    } finally {
      setAnnSubmitting(false)
    }
  }

  return (
    <PageLayout>
      <button onClick={() => navigate('/faculty/lms')} className="inline-flex items-center gap-1 bg-transparent border-0 cursor-pointer mb-6 p-1 text-[14px] font-medium text-slate-500">
        <ChevronLeft size={16} /> Back to LMS
      </button>

      {loading ? (
        <div className="text-center py-[48px] text-[14px] t-muted">Loading course...</div>
      ) : error ? (
        <div className="text-center py-[48px] text-[14px] text-red-500">{error}</div>
      ) : (
        <>
          <div className="bg-white rounded-[16px] border border-slate-200 px-8 py-7 mb-7 flex items-start gap-5">
            <div className="w-[52px] h-[52px] rounded-[14px] flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
              <BookOpen size={26} color="#fff" />
            </div>
            <div>
              <div className="text-[22px] font-bold t-primary mb-1.5">{course?.name || course?.title || 'Course'}</div>
              <div className="flex gap-5 flex-wrap text-[13px] t-muted">
                {course?.course_code && <span>Code: {course.course_code}</span>}
                {course?.credits    && <span>{course.credits} Credits</span>}
                {course?.semester   && <span>Semester {course.semester}</span>}
                {course?.department && <span>{course.department}</span>}
              </div>
            </div>
          </div>

          <div className="flex gap-1 bg-slate-100 rounded-[12px] p-1 mb-7 w-fit">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => setActiveTab(key)}
                className={`flex items-center gap-1.5 px-5 py-2 rounded-[10px] border-0 cursor-pointer text-[14px] transition-all ${activeTab === key ? 'bg-white text-slate-900 font-semibold shadow-[0_1px_4px_rgba(0,0,0,0.08)]' : 'bg-transparent text-slate-500 font-medium'}`}>
                <Icon size={15} /> {label}
              </button>
            ))}
          </div>

          {activeTab === 'assignments' && (
            <div>
              <div className="flex justify-between items-center mb-5">
                <div className="text-[17px] font-bold t-primary">Assignments ({assignments.length})</div>
                <button onClick={() => setShowAssignForm(v => !v)}
                  className="inline-flex items-center gap-1.5 px-[18px] py-[9px] rounded-[10px] border-0 cursor-pointer text-[13px] font-semibold text-white"
                  style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                  <Plus size={15} /> New Assignment
                </button>
              </div>

              {showAssignForm && (
                <div className="bg-slate-50 border border-dashed border-slate-300 rounded-[14px] px-7 py-6 mb-5">
                  <div className="text-[15px] font-bold t-primary mb-4">Create Assignment</div>
                  {assignError && <div className="text-[13px] text-red-500 mb-3">{assignError}</div>}
                  <form onSubmit={handleCreateAssignment}>
                    <div className="grid grid-cols-2 gap-x-5 gap-y-3.5">
                      <div className="col-span-2">
                        <label className={labelCls}>Title *</label>
                        <input className={fieldCls} value={assignForm.title} onChange={e => setAssignForm(f => ({ ...f, title: e.target.value }))} placeholder="Assignment title" required />
                      </div>
                      <div className="col-span-2">
                        <label className={labelCls}>Description</label>
                        <textarea className={`${fieldCls} min-h-[80px] resize-y`} value={assignForm.description} onChange={e => setAssignForm(f => ({ ...f, description: e.target.value }))} placeholder="Assignment instructions..." />
                      </div>
                      <div>
                        <label className={labelCls}>Due Date *</label>
                        <input type="datetime-local" className={fieldCls} value={assignForm.due_date} onChange={e => setAssignForm(f => ({ ...f, due_date: e.target.value }))} required />
                      </div>
                      <div>
                        <label className={labelCls}>Max Marks *</label>
                        <input type="number" min={1} className={fieldCls} value={assignForm.max_marks} onChange={e => setAssignForm(f => ({ ...f, max_marks: e.target.value }))} placeholder="e.g. 100" required />
                      </div>
                      <div>
                        <label className={labelCls}>Publish At (optional)</label>
                        <input type="datetime-local" className={fieldCls} value={assignForm.publish_at} onChange={e => setAssignForm(f => ({ ...f, publish_at: e.target.value }))} />
                      </div>
                    </div>
                    <div className="flex gap-2.5 mt-[18px] justify-end">
                      <button type="button" onClick={() => { setShowAssignForm(false); setAssignError(null) }}
                        className="px-[18px] py-[9px] rounded-[9px] border border-slate-200 bg-white cursor-pointer text-[13px] font-medium t-muted">Cancel</button>
                      <button type="submit" disabled={assignSubmitting}
                        className="px-5 py-[9px] rounded-[9px] border-0 bg-brand cursor-pointer text-[13px] font-semibold text-white">
                        {assignSubmitting ? 'Creating...' : 'Create Assignment'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {assignments.length === 0 ? (
                <div className="text-center py-[48px] text-[14px] t-muted">No assignments yet. Create one to get started.</div>
              ) : assignments.map(a => (
                <div key={a.id} className="bg-white border border-slate-200 rounded-[14px] px-[26px] py-[22px] mb-3.5">
                  <div className="flex justify-between items-center flex-wrap gap-3">
                    <div>
                      <div className="text-[15px] font-semibold t-primary mb-1">{a.title}</div>
                      <div className="flex gap-4 flex-wrap">
                        {a.due_date && <span className="text-[12px] font-medium t-muted">Due: {new Date(a.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>}
                        <span className="text-[12px] font-medium t-muted">Max: {a.max_marks} marks</span>
                        {a.submission_count !== undefined && <span className="text-[12px] font-medium t-muted">{a.submission_count} submission{a.submission_count !== 1 ? 's' : ''}</span>}
                      </div>
                    </div>
                    <button onClick={() => navigate(`/faculty/lms/assignments/${a.id}/grade`)}
                      className="px-4 py-[7px] rounded-[8px] border-[1.5px] border-brand bg-white cursor-pointer text-[12px] font-semibold text-brand whitespace-nowrap">
                      Grade
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'announcements' && (
            <div>
              <div className="flex justify-between items-center mb-5">
                <div className="text-[17px] font-bold t-primary">Announcements ({announcements.length})</div>
                <button onClick={() => setShowAnnForm(v => !v)}
                  className="inline-flex items-center gap-1.5 px-[18px] py-[9px] rounded-[10px] border-0 cursor-pointer text-[13px] font-semibold text-white"
                  style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                  <Plus size={15} /> New Announcement
                </button>
              </div>

              {showAnnForm && (
                <div className="bg-slate-50 border border-dashed border-slate-300 rounded-[14px] px-7 py-6 mb-5">
                  <div className="text-[15px] font-bold t-primary mb-4">Create Announcement</div>
                  {annError && <div className="text-[13px] text-red-500 mb-3">{annError}</div>}
                  <form onSubmit={handleCreateAnnouncement}>
                    <div className="flex flex-col gap-3.5">
                      <div>
                        <label className={labelCls}>Title *</label>
                        <input className={fieldCls} value={annForm.title} onChange={e => setAnnForm(f => ({ ...f, title: e.target.value }))} placeholder="Announcement title" required />
                      </div>
                      <div>
                        <label className={labelCls}>Message *</label>
                        <textarea className={`${fieldCls} min-h-[80px] resize-y`} value={annForm.message} onChange={e => setAnnForm(f => ({ ...f, message: e.target.value }))} placeholder="Write your announcement..." required />
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <input type="checkbox" id="is_pinned" checked={annForm.is_pinned} onChange={e => setAnnForm(f => ({ ...f, is_pinned: e.target.checked }))} className="w-4 h-4 accent-brand" />
                        <label htmlFor="is_pinned" className="text-[13px] font-medium t-primary cursor-pointer">Pin this announcement</label>
                      </div>
                    </div>
                    <div className="flex gap-2.5 mt-[18px] justify-end">
                      <button type="button" onClick={() => { setShowAnnForm(false); setAnnError(null) }}
                        className="px-[18px] py-[9px] rounded-[9px] border border-slate-200 bg-white cursor-pointer text-[13px] font-medium t-muted">Cancel</button>
                      <button type="submit" disabled={annSubmitting}
                        className="px-5 py-[9px] rounded-[9px] border-0 bg-brand cursor-pointer text-[13px] font-semibold text-white">
                        {annSubmitting ? 'Posting...' : 'Post Announcement'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {announcements.length === 0 ? (
                <div className="text-center py-[48px] text-[14px] t-muted">No announcements yet.</div>
              ) : announcements.map(a => (
                <div key={a.id} className="bg-white border border-slate-200 rounded-[14px] px-[26px] py-[22px] mb-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <span className="text-[15px] font-bold t-primary">{a.title}</span>
                        {a.is_pinned && (
                          <span className="inline-flex items-center gap-1 bg-amber-100 rounded-[6px] px-2 py-[2px] text-[11px] font-semibold text-amber-600">
                            <Star size={10} /> Pinned
                          </span>
                        )}
                      </div>
                      <div className="text-[13px] text-slate-600 leading-5 mb-2.5">{a.message}</div>
                      {a.created_at && (
                        <div className="text-[11px] t-muted">
                          {new Date(a.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'students' && (
            <div>
              <div className="text-[17px] font-bold t-primary mb-5">Enrolled Students ({students.length})</div>
              {students.length === 0 ? (
                <div className="text-center py-[48px] text-[14px] t-muted">No students enrolled yet.</div>
              ) : (
                <div className="bg-white rounded-[14px] border border-slate-200 overflow-hidden">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        {['#', 'Name', 'Email', 'Enrollment No.'].map(h => (
                          <th key={h} className="px-4 py-2.5 text-left bg-slate-50 text-[12px] font-semibold t-muted border-b border-slate-200">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((s, idx) => (
                        <tr key={s.student_id || idx} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 text-[13px] text-slate-400 border-b border-slate-50 w-12">{idx + 1}</td>
                          <td className="px-4 py-3 text-[13px] t-primary border-b border-slate-50">{s.full_name || '—'}</td>
                          <td className="px-4 py-3 text-[13px] t-muted border-b border-slate-50">{s.email || '—'}</td>
                          <td className="px-4 py-3 text-[13px] t-muted border-b border-slate-50">{s.enrollment_no || s.roll_no || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </PageLayout>
  )
}
