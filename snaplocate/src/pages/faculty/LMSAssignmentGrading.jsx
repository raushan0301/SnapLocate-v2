import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'
import { ClipboardList, ChevronLeft, CheckCircle, Clock, AlertCircle, User } from 'lucide-react'

export default function LMSAssignmentGrading() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [assignment, setAssignment] = useState(null)
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [gradeState, setGradeState] = useState({})

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      setError(null)
      try {
        const [assignRes, subRes] = await Promise.all([
          api.get(`/api/lms/assignments/${id}`),
          api.get(`/api/lms/submissions?assignment_id=${id}`),
        ])
        setAssignment(assignRes.data)
        const subs = subRes.data || []
        setSubmissions(subs)
        const initial = {}
        subs.forEach(s => {
          initial[s.id] = { marks: s.marks !== undefined && s.marks !== null ? String(s.marks) : '', feedback: s.feedback || '', saving: false, saved: false, error: null }
        })
        setGradeState(initial)
      } catch (err) {
        setError(err.message || 'Failed to load assignment data')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  function updateGradeField(subId, field, value) {
    setGradeState(prev => ({ ...prev, [subId]: { ...prev[subId], [field]: value, saved: false, error: null } }))
  }

  async function handleSaveGrade(subId) {
    const gs = gradeState[subId]
    if (!gs) return
    setGradeState(prev => ({ ...prev, [subId]: { ...prev[subId], saving: true, saved: false, error: null } }))
    try {
      await api.patch(`/api/lms/submissions/${subId}/grade`, { marks: Number(gs.marks), feedback: gs.feedback })
      setGradeState(prev => ({ ...prev, [subId]: { ...prev[subId], saving: false, saved: true } }))
      setSubmissions(prev => prev.map(s => s.id === subId ? { ...s, marks: Number(gs.marks), feedback: gs.feedback, status: s.status === 'late' ? 'late' : 'graded' } : s))
    } catch (err) {
      setGradeState(prev => ({ ...prev, [subId]: { ...prev[subId], saving: false, error: err.message || 'Failed to save' } }))
    }
  }

  const studentName = sub => sub.users ? (sub.users.name || sub.users.full_name || sub.users.email || 'Student') : (sub.student_name || sub.student_id || 'Student')

  return (
    <PageLayout>
      <button onClick={() => assignment?.course_id ? navigate(`/faculty/lms/courses/${assignment.course_id}`) : navigate('/faculty/lms')}
        className="inline-flex items-center gap-1 bg-transparent border-0 cursor-pointer mb-6 p-1 text-[14px] font-medium text-slate-500">
        <ChevronLeft size={16} /> Back to Course
      </button>

      {loading ? (
        <div className="text-center py-[56px] text-[14px] t-muted">Loading assignment...</div>
      ) : error ? (
        <div className="text-center py-[56px] text-[14px] text-red-500">{error}</div>
      ) : (
        <>
          <div className="bg-white border border-slate-200 rounded-[16px] px-8 py-[26px] mb-7 flex items-start gap-5">
            <div className="w-[50px] h-[50px] rounded-[14px] flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
              <ClipboardList size={24} color="#fff" />
            </div>
            <div>
              <div className="text-[21px] font-bold t-primary mb-2">{assignment?.title || 'Assignment'}</div>
              <div className="flex gap-6 flex-wrap">
                {assignment?.max_marks !== undefined && (
                  <span className="inline-flex items-center gap-1.5 bg-slate-100 rounded-[8px] px-3 py-[5px] text-[12px] font-semibold text-slate-700">Max Marks: {assignment.max_marks}</span>
                )}
                {assignment?.due_date && (
                  <span className="inline-flex items-center gap-1.5 bg-slate-100 rounded-[8px] px-3 py-[5px] text-[12px] font-semibold text-slate-700">
                    <Clock size={13} /> Due: {new Date(assignment.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 bg-slate-100 rounded-[8px] px-3 py-[5px] text-[12px] font-semibold text-slate-700">
                  <User size={13} /> {submissions.length} Submission{submissions.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>

          <div className="text-[16px] font-bold t-primary mb-[18px]">Submissions</div>

          {submissions.length === 0 ? (
            <div className="text-center py-[56px] text-[14px] t-muted">No submissions yet.</div>
          ) : submissions.map(sub => {
            const gs = gradeState[sub.id] || { marks: '', feedback: '', saving: false, saved: false, error: null }
            const isGraded = sub.marks !== undefined && sub.marks !== null
            return (
              <div key={sub.id} className="bg-white border border-slate-200 rounded-[14px] px-6 py-5 mb-3.5">
                <div className="flex justify-between items-start flex-wrap gap-3 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                        <User size={16} color="#6366f1" />
                      </div>
                      <div className="text-[15px] font-bold t-primary">{studentName(sub)}</div>
                    </div>
                    <div className="flex gap-3 flex-wrap items-center">
                      {sub.submitted_at && (
                        <span className="text-[12px] t-muted">
                          Submitted: {new Date(sub.submitted_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                      {sub.status === 'late' && (
                        <span className="inline-flex items-center gap-1 bg-red-100 rounded-[6px] px-2 py-[3px] text-[11px] font-semibold text-red-600">
                          <AlertCircle size={10} /> Late
                        </span>
                      )}
                      {isGraded && (
                        <span className="inline-flex items-center gap-1 bg-green-100 rounded-[6px] px-2 py-[3px] text-[11px] font-semibold text-emerald-700">
                          <CheckCircle size={10} /> Graded
                        </span>
                      )}
                    </div>
                  </div>
                  {isGraded && (
                    <div className="text-[12px] font-medium text-brand">
                      {sub.marks}/{assignment?.max_marks ?? '?'} marks
                      {sub.feedback && <div className="text-[11px] t-muted mt-0.5">{sub.feedback}</div>}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 items-end flex-wrap pt-3.5 border-t border-slate-100">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.05em]">Marks</label>
                    <input type="number" min={0} max={assignment?.max_marks ?? undefined}
                      className="w-[90px] px-[10px] py-2 rounded-[8px] border-[1.5px] border-slate-200 text-[13px] font-semibold t-primary outline-none text-center focus:border-brand transition-colors"
                      value={gs.marks} onChange={e => updateGradeField(sub.id, 'marks', e.target.value)} placeholder="0" />
                  </div>
                  <div className="flex flex-col gap-1.5 flex-1">
                    <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.05em]">Feedback</label>
                    <input type="text"
                      className="w-full px-3 py-2 rounded-[8px] border-[1.5px] border-slate-200 text-[13px] t-primary outline-none focus:border-brand transition-colors"
                      value={gs.feedback} onChange={e => updateGradeField(sub.id, 'feedback', e.target.value)} placeholder="Optional feedback for student..." />
                  </div>
                  <button onClick={() => handleSaveGrade(sub.id)} disabled={gs.saving || gs.marks === ''}
                    className={`self-end px-5 py-2 rounded-[9px] border-0 cursor-pointer text-[13px] font-semibold transition-all ${gs.saved ? 'bg-green-100 text-emerald-700' : gs.saving ? 'bg-indigo-100 text-brand cursor-not-allowed' : 'bg-brand text-white'}`}>
                    {gs.saving ? 'Saving...' : gs.saved ? 'Saved!' : 'Save'}
                  </button>
                  {gs.error && <span className="text-[12px] font-medium text-red-500 self-center">{gs.error}</span>}
                </div>
              </div>
            )
          })}
        </>
      )}
    </PageLayout>
  )
}
