import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'
import {
  ClipboardList,
  ChevronLeft,
  CheckCircle,
  Clock,
  AlertCircle,
  User,
} from 'lucide-react'

const pjs = (size, weight, lh, color) => ({
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  fontSize: size,
  fontWeight: weight,
  lineHeight: lh,
  color,
})

export default function LMSAssignmentGrading() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [assignment, setAssignment] = useState(null)
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Per-submission grade state: { [submissionId]: { marks, feedback, saving, saved, error } }
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
        // Pre-fill grade state with existing marks/feedback
        const initial = {}
        subs.forEach((s) => {
          initial[s.id] = {
            marks: s.marks !== undefined && s.marks !== null ? String(s.marks) : '',
            feedback: s.feedback || '',
            saving: false,
            saved: false,
            error: null,
          }
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
    setGradeState((prev) => ({
      ...prev,
      [subId]: { ...prev[subId], [field]: value, saved: false, error: null },
    }))
  }

  async function handleSaveGrade(subId) {
    const gs = gradeState[subId]
    if (!gs) return
    setGradeState((prev) => ({
      ...prev,
      [subId]: { ...prev[subId], saving: true, saved: false, error: null },
    }))
    try {
      await api.patch(`/api/lms/submissions/${subId}/grade`, {
        marks: Number(gs.marks),
        feedback: gs.feedback,
      })
      setGradeState((prev) => ({
        ...prev,
        [subId]: { ...prev[subId], saving: false, saved: true },
      }))
      // Update submission in list
      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === subId
            ? { ...s, marks: Number(gs.marks), feedback: gs.feedback, status: s.status === 'late' ? 'late' : 'graded' }
            : s
        )
      )
    } catch (err) {
      setGradeState((prev) => ({
        ...prev,
        [subId]: { ...prev[subId], saving: false, error: err.message || 'Failed to save' },
      }))
    }
  }

  const styles = {
    page: { padding: '32px 40px', maxWidth: 1050, margin: '0 auto' },
    backBtn: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      marginBottom: 24,
      padding: '4px 0',
      ...pjs('14px', 500, '20px', '#6B7280'),
    },
    headerCard: {
      background: '#fff',
      border: '1px solid #E5E7EB',
      borderRadius: 16,
      padding: '26px 32px',
      marginBottom: 28,
      display: 'flex',
      alignItems: 'flex-start',
      gap: 20,
    },
    headerIcon: {
      width: 50,
      height: 50,
      borderRadius: 14,
      background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    assignTitle: { ...pjs('21px', 700, '30px', '#111827'), marginBottom: 8 },
    statsRow: { display: 'flex', gap: 24, flexWrap: 'wrap' },
    statChip: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      background: '#F3F4F6',
      borderRadius: 8,
      padding: '5px 12px',
      ...pjs('12px', 600, '16px', '#374151'),
    },
    sectionTitle: { ...pjs('16px', 700, '22px', '#111827'), marginBottom: 18 },
    subCard: {
      background: '#fff',
      border: '1px solid #E5E7EB',
      borderRadius: 14,
      padding: '20px 24px',
      marginBottom: 14,
    },
    subTopRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      flexWrap: 'wrap',
      gap: 12,
      marginBottom: 16,
    },
    studentName: { ...pjs('15px', 700, '22px', '#111827'), marginBottom: 4 },
    subMeta: { display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' },
    submittedAt: { ...pjs('12px', 400, '16px', '#6B7280') },
    lateBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      background: '#FEE2E2',
      borderRadius: 6,
      padding: '3px 8px',
      ...pjs('11px', 600, '14px', '#DC2626'),
    },
    gradedBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      background: '#D1FAE5',
      borderRadius: 6,
      padding: '3px 8px',
      ...pjs('11px', 600, '14px', '#059669'),
    },
    currentGrade: { ...pjs('12px', 500, '16px', '#6366F1') },
    gradeForm: {
      display: 'flex',
      gap: 12,
      alignItems: 'flex-end',
      flexWrap: 'wrap',
      paddingTop: 14,
      borderTop: '1px solid #F3F4F6',
    },
    gradeGroup: { display: 'flex', flexDirection: 'column', gap: 5 },
    label: { ...pjs('11px', 600, '14px', '#6B7280'), textTransform: 'uppercase', letterSpacing: '0.05em' },
    marksInput: {
      width: 90,
      padding: '8px 10px',
      borderRadius: 8,
      border: '1.5px solid #D1D5DB',
      ...pjs('13px', 600, '18px', '#111827'),
      outline: 'none',
      textAlign: 'center',
    },
    feedbackInput: {
      width: 280,
      padding: '8px 12px',
      borderRadius: 8,
      border: '1.5px solid #D1D5DB',
      ...pjs('13px', 400, '18px', '#374151'),
      outline: 'none',
    },
    saveBtn: (saving, saved) => ({
      padding: '8px 20px',
      borderRadius: 9,
      border: 'none',
      cursor: saving ? 'not-allowed' : 'pointer',
      background: saved ? '#D1FAE5' : saving ? '#E0E7FF' : '#6366F1',
      ...pjs('13px', 600, '18px', saved ? '#059669' : saving ? '#6366F1' : '#fff'),
      transition: 'all 0.2s',
      alignSelf: 'flex-end',
    }),
    errorText: { ...pjs('12px', 500, '16px', '#EF4444'), alignSelf: 'center' },
    emptyState: {
      textAlign: 'center',
      padding: '56px 24px',
      ...pjs('14px', 400, '20px', '#9CA3AF'),
    },
  }

  const studentName = (sub) => {
    if (sub.users) {
      return sub.users.name || sub.users.full_name || sub.users.email || 'Student'
    }
    return sub.student_name || sub.student_id || 'Student'
  }

  return (
    <PageLayout>
      <div style={styles.page}>
        <button
          style={styles.backBtn}
          onClick={() =>
            assignment?.course_id
              ? navigate(`/faculty/lms/courses/${assignment.course_id}`)
              : navigate('/faculty/lms')
          }
        >
          <ChevronLeft size={16} />
          Back to Course
        </button>

        {loading ? (
          <div style={styles.emptyState}>Loading assignment...</div>
        ) : error ? (
          <div style={{ ...styles.emptyState, color: '#EF4444' }}>{error}</div>
        ) : (
          <>
            {/* Assignment Header */}
            <div style={styles.headerCard}>
              <div style={styles.headerIcon}>
                <ClipboardList size={24} color="#fff" />
              </div>
              <div>
                <div style={styles.assignTitle}>{assignment?.title || 'Assignment'}</div>
                <div style={styles.statsRow}>
                  {assignment?.max_marks !== undefined && (
                    <span style={styles.statChip}>
                      Max Marks: {assignment.max_marks}
                    </span>
                  )}
                  {assignment?.due_date && (
                    <span style={styles.statChip}>
                      <Clock size={13} />
                      Due:{' '}
                      {new Date(assignment.due_date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  )}
                  <span style={styles.statChip}>
                    <User size={13} />
                    {submissions.length} Submission{submissions.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>

            {/* Submissions */}
            <div style={styles.sectionTitle}>Submissions</div>

            {submissions.length === 0 ? (
              <div style={styles.emptyState}>No submissions yet.</div>
            ) : (
              submissions.map((sub) => {
                const gs = gradeState[sub.id] || { marks: '', feedback: '', saving: false, saved: false, error: null }
                const isGraded = sub.marks !== undefined && sub.marks !== null
                return (
                  <div key={sub.id} style={styles.subCard}>
                    <div style={styles.subTopRow}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              background: '#EEF2FF',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <User size={16} color="#6366F1" />
                          </div>
                          <div style={styles.studentName}>{studentName(sub)}</div>
                        </div>
                        <div style={styles.subMeta}>
                          {sub.submitted_at && (
                            <span style={styles.submittedAt}>
                              Submitted:{' '}
                              {new Date(sub.submitted_at).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          )}
                          {sub.status === 'late' && (
                            <span style={styles.lateBadge}>
                              <AlertCircle size={10} />
                              Late
                            </span>
                          )}
                          {isGraded && (
                            <span style={styles.gradedBadge}>
                              <CheckCircle size={10} />
                              Graded
                            </span>
                          )}
                        </div>
                      </div>
                      {isGraded && (
                        <div style={styles.currentGrade}>
                          {sub.marks}/{assignment?.max_marks ?? '?'} marks
                          {sub.feedback && (
                            <div style={{ ...pjs('11px', 400, '15px', '#6B7280'), marginTop: 2 }}>
                              {sub.feedback}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Inline grade form */}
                    <div style={styles.gradeForm}>
                      <div style={styles.gradeGroup}>
                        <label style={styles.label}>Marks</label>
                        <input
                          style={styles.marksInput}
                          type="number"
                          min={0}
                          max={assignment?.max_marks ?? undefined}
                          value={gs.marks}
                          onChange={(e) => updateGradeField(sub.id, 'marks', e.target.value)}
                          placeholder="0"
                        />
                      </div>
                      <div style={styles.gradeGroup}>
                        <label style={styles.label}>Feedback</label>
                        <input
                          style={styles.feedbackInput}
                          type="text"
                          value={gs.feedback}
                          onChange={(e) => updateGradeField(sub.id, 'feedback', e.target.value)}
                          placeholder="Optional feedback for student..."
                        />
                      </div>
                      <button
                        style={styles.saveBtn(gs.saving, gs.saved)}
                        onClick={() => handleSaveGrade(sub.id)}
                        disabled={gs.saving || gs.marks === ''}
                      >
                        {gs.saving ? 'Saving...' : gs.saved ? 'Saved!' : 'Save'}
                      </button>
                      {gs.error && <span style={styles.errorText}>{gs.error}</span>}
                    </div>
                  </div>
                )
              })
            )}
          </>
        )}
      </div>
    </PageLayout>
  )
}
