import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'
import {
  BookOpen,
  ClipboardList,
  Megaphone,
  Users,
  ChevronLeft,
  Plus,
  Star,
  Edit,
  Trash2,
} from 'lucide-react'

const pjs = (size, weight, lh, color) => ({
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  fontSize: size,
  fontWeight: weight,
  lineHeight: lh,
  color,
})

const TABS = [
  { key: 'assignments', label: 'Assignments', icon: ClipboardList },
  { key: 'announcements', label: 'Announcements', icon: Megaphone },
  { key: 'students', label: 'Students', icon: Users },
]

export default function LMSCourseDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('assignments')
  const [course, setCourse] = useState(null)
  const [assignments, setAssignments] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // New assignment form
  const [showAssignForm, setShowAssignForm] = useState(false)
  const [assignForm, setAssignForm] = useState({
    title: '',
    description: '',
    due_date: '',
    max_marks: '',
    publish_at: '',
  })
  const [assignSubmitting, setAssignSubmitting] = useState(false)
  const [assignError, setAssignError] = useState(null)

  // New announcement form
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
      } catch (err) {
        setStudents([])
      }
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
      setAssignments((prev) => [res.data, ...prev])
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
      setAnnouncements((prev) => [res.data, ...prev])
      setAnnForm({ title: '', message: '', is_pinned: false })
      setShowAnnForm(false)
    } catch (err) {
      setAnnError(err.message || 'Failed to create announcement')
    } finally {
      setAnnSubmitting(false)
    }
  }

  const styles = {
    page: { padding: '32px 40px', maxWidth: 1100, margin: '0 auto' },
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
    courseHeader: {
      background: '#fff',
      borderRadius: 16,
      padding: '28px 32px',
      marginBottom: 28,
      border: '1px solid #E5E7EB',
      display: 'flex',
      alignItems: 'flex-start',
      gap: 20,
    },
    courseIcon: {
      width: 52,
      height: 52,
      borderRadius: 14,
      background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    courseTitle: { ...pjs('22px', 700, '30px', '#111827'), marginBottom: 6 },
    courseMeta: { ...pjs('13px', 400, '18px', '#6B7280'), display: 'flex', gap: 20, flexWrap: 'wrap' },
    metaItem: { display: 'flex', alignItems: 'center', gap: 4 },
    tabBar: {
      display: 'flex',
      gap: 4,
      background: '#F3F4F6',
      borderRadius: 12,
      padding: '4px',
      marginBottom: 28,
      width: 'fit-content',
    },
    tabBtn: (active) => ({
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      padding: '8px 20px',
      borderRadius: 10,
      border: 'none',
      cursor: 'pointer',
      background: active ? '#fff' : 'transparent',
      boxShadow: active ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
      ...pjs('14px', active ? 600 : 500, '20px', active ? '#111827' : '#6B7280'),
      transition: 'all 0.15s',
    }),
    sectionHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    sectionTitle: { ...pjs('17px', 700, '24px', '#111827') },
    addBtn: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '9px 18px',
      borderRadius: 10,
      border: 'none',
      cursor: 'pointer',
      background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
      ...pjs('13px', 600, '18px', '#fff'),
    },
    card: {
      background: '#fff',
      border: '1px solid #E5E7EB',
      borderRadius: 14,
      padding: '22px 26px',
      marginBottom: 14,
    },
    formCard: {
      background: '#F9FAFB',
      border: '1px dashed #D1D5DB',
      borderRadius: 14,
      padding: '24px 28px',
      marginBottom: 20,
    },
    formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 20px' },
    formGroup: { display: 'flex', flexDirection: 'column', gap: 6 },
    label: { ...pjs('12px', 600, '16px', '#374151') },
    input: {
      padding: '9px 12px',
      borderRadius: 8,
      border: '1px solid #D1D5DB',
      ...pjs('13px', 400, '18px', '#111827'),
      outline: 'none',
      background: '#fff',
    },
    textarea: {
      padding: '9px 12px',
      borderRadius: 8,
      border: '1px solid #D1D5DB',
      ...pjs('13px', 400, '18px', '#111827'),
      outline: 'none',
      background: '#fff',
      resize: 'vertical',
      minHeight: 80,
    },
    formActions: { display: 'flex', gap: 10, marginTop: 18, justifyContent: 'flex-end' },
    cancelBtn: {
      padding: '9px 18px',
      borderRadius: 9,
      border: '1px solid #D1D5DB',
      background: '#fff',
      cursor: 'pointer',
      ...pjs('13px', 500, '18px', '#6B7280'),
    },
    submitBtn: {
      padding: '9px 20px',
      borderRadius: 9,
      border: 'none',
      background: '#6366F1',
      cursor: 'pointer',
      ...pjs('13px', 600, '18px', '#fff'),
    },
    assignRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 12,
    },
    assignTitle: { ...pjs('15px', 600, '22px', '#111827'), marginBottom: 4 },
    assignMeta: { display: 'flex', gap: 16, flexWrap: 'wrap' },
    metaChip: { ...pjs('12px', 500, '16px', '#6B7280') },
    gradeBtn: {
      padding: '7px 16px',
      borderRadius: 8,
      border: '1.5px solid #6366F1',
      background: '#fff',
      cursor: 'pointer',
      ...pjs('12px', 600, '16px', '#6366F1'),
      whiteSpace: 'nowrap',
    },
    annTitle: { ...pjs('15px', 700, '22px', '#111827'), marginBottom: 6 },
    annMessage: { ...pjs('13px', 400, '20px', '#4B5563'), marginBottom: 10 },
    pinnedBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 3,
      background: '#FEF3C7',
      borderRadius: 6,
      padding: '2px 8px',
      ...pjs('11px', 600, '16px', '#D97706'),
    },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: {
      padding: '10px 16px',
      textAlign: 'left',
      background: '#F9FAFB',
      ...pjs('12px', 600, '16px', '#6B7280'),
      borderBottom: '1px solid #E5E7EB',
    },
    td: {
      padding: '12px 16px',
      ...pjs('13px', 400, '18px', '#374151'),
      borderBottom: '1px solid #F3F4F6',
    },
    errorText: { ...pjs('13px', 500, '18px', '#EF4444'), marginBottom: 12 },
    emptyState: {
      textAlign: 'center',
      padding: '48px 24px',
      ...pjs('14px', 400, '20px', '#9CA3AF'),
    },
    checkboxRow: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 },
  }

  return (
    <PageLayout>
      <div style={styles.page}>
        <button style={styles.backBtn} onClick={() => navigate('/faculty/lms')}>
          <ChevronLeft size={16} />
          Back to LMS
        </button>

        {loading ? (
          <div style={styles.emptyState}>Loading course...</div>
        ) : error ? (
          <div style={{ ...styles.emptyState, color: '#EF4444' }}>{error}</div>
        ) : (
          <>
            {/* Course Header */}
            <div style={styles.courseHeader}>
              <div style={styles.courseIcon}>
                <BookOpen size={26} color="#fff" />
              </div>
              <div>
                <div style={styles.courseTitle}>{course?.name || course?.title || 'Course'}</div>
                <div style={styles.courseMeta}>
                  {course?.course_code && (
                    <span style={styles.metaItem}>Code: {course.course_code}</span>
                  )}
                  {course?.credits && (
                    <span style={styles.metaItem}>{course.credits} Credits</span>
                  )}
                  {course?.semester && (
                    <span style={styles.metaItem}>Semester {course.semester}</span>
                  )}
                  {course?.department && (
                    <span style={styles.metaItem}>{course.department}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Tab Bar */}
            <div style={styles.tabBar}>
              {TABS.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  style={styles.tabBtn(activeTab === key)}
                  onClick={() => setActiveTab(key)}
                >
                  <Icon size={15} />
                  {label}
                </button>
              ))}
            </div>

            {/* Assignments Tab */}
            {activeTab === 'assignments' && (
              <div>
                <div style={styles.sectionHeader}>
                  <div style={styles.sectionTitle}>
                    Assignments ({assignments.length})
                  </div>
                  <button style={styles.addBtn} onClick={() => setShowAssignForm((v) => !v)}>
                    <Plus size={15} />
                    New Assignment
                  </button>
                </div>

                {showAssignForm && (
                  <div style={styles.formCard}>
                    <div style={{ ...pjs('15px', 700, '22px', '#111827'), marginBottom: 18 }}>
                      Create Assignment
                    </div>
                    {assignError && <div style={styles.errorText}>{assignError}</div>}
                    <form onSubmit={handleCreateAssignment}>
                      <div style={styles.formGrid}>
                        <div style={{ ...styles.formGroup, gridColumn: '1 / -1' }}>
                          <label style={styles.label}>Title *</label>
                          <input
                            style={styles.input}
                            value={assignForm.title}
                            onChange={(e) => setAssignForm((f) => ({ ...f, title: e.target.value }))}
                            placeholder="Assignment title"
                            required
                          />
                        </div>
                        <div style={{ ...styles.formGroup, gridColumn: '1 / -1' }}>
                          <label style={styles.label}>Description</label>
                          <textarea
                            style={styles.textarea}
                            value={assignForm.description}
                            onChange={(e) => setAssignForm((f) => ({ ...f, description: e.target.value }))}
                            placeholder="Assignment instructions..."
                          />
                        </div>
                        <div style={styles.formGroup}>
                          <label style={styles.label}>Due Date *</label>
                          <input
                            style={styles.input}
                            type="datetime-local"
                            value={assignForm.due_date}
                            onChange={(e) => setAssignForm((f) => ({ ...f, due_date: e.target.value }))}
                            required
                          />
                        </div>
                        <div style={styles.formGroup}>
                          <label style={styles.label}>Max Marks *</label>
                          <input
                            style={styles.input}
                            type="number"
                            min={1}
                            value={assignForm.max_marks}
                            onChange={(e) => setAssignForm((f) => ({ ...f, max_marks: e.target.value }))}
                            placeholder="e.g. 100"
                            required
                          />
                        </div>
                        <div style={styles.formGroup}>
                          <label style={styles.label}>Publish At (optional)</label>
                          <input
                            style={styles.input}
                            type="datetime-local"
                            value={assignForm.publish_at}
                            onChange={(e) => setAssignForm((f) => ({ ...f, publish_at: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div style={styles.formActions}>
                        <button
                          type="button"
                          style={styles.cancelBtn}
                          onClick={() => {
                            setShowAssignForm(false)
                            setAssignError(null)
                          }}
                        >
                          Cancel
                        </button>
                        <button type="submit" style={styles.submitBtn} disabled={assignSubmitting}>
                          {assignSubmitting ? 'Creating...' : 'Create Assignment'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {assignments.length === 0 ? (
                  <div style={styles.emptyState}>
                    No assignments yet. Create one to get started.
                  </div>
                ) : (
                  assignments.map((a) => (
                    <div key={a.id} style={styles.card}>
                      <div style={styles.assignRow}>
                        <div>
                          <div style={styles.assignTitle}>{a.title}</div>
                          <div style={styles.assignMeta}>
                            {a.due_date && (
                              <span style={styles.metaChip}>
                                Due: {new Date(a.due_date).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            )}
                            <span style={styles.metaChip}>Max: {a.max_marks} marks</span>
                            {a.submission_count !== undefined && (
                              <span style={styles.metaChip}>
                                {a.submission_count} submission{a.submission_count !== 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          style={styles.gradeBtn}
                          onClick={() => navigate(`/faculty/lms/assignments/${a.id}/grade`)}
                        >
                          Grade
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Announcements Tab */}
            {activeTab === 'announcements' && (
              <div>
                <div style={styles.sectionHeader}>
                  <div style={styles.sectionTitle}>
                    Announcements ({announcements.length})
                  </div>
                  <button style={styles.addBtn} onClick={() => setShowAnnForm((v) => !v)}>
                    <Plus size={15} />
                    New Announcement
                  </button>
                </div>

                {showAnnForm && (
                  <div style={styles.formCard}>
                    <div style={{ ...pjs('15px', 700, '22px', '#111827'), marginBottom: 18 }}>
                      Create Announcement
                    </div>
                    {annError && <div style={styles.errorText}>{annError}</div>}
                    <form onSubmit={handleCreateAnnouncement}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div style={styles.formGroup}>
                          <label style={styles.label}>Title *</label>
                          <input
                            style={styles.input}
                            value={annForm.title}
                            onChange={(e) => setAnnForm((f) => ({ ...f, title: e.target.value }))}
                            placeholder="Announcement title"
                            required
                          />
                        </div>
                        <div style={styles.formGroup}>
                          <label style={styles.label}>Message *</label>
                          <textarea
                            style={styles.textarea}
                            value={annForm.message}
                            onChange={(e) => setAnnForm((f) => ({ ...f, message: e.target.value }))}
                            placeholder="Write your announcement..."
                            required
                          />
                        </div>
                        <div style={styles.checkboxRow}>
                          <input
                            type="checkbox"
                            id="is_pinned"
                            checked={annForm.is_pinned}
                            onChange={(e) => setAnnForm((f) => ({ ...f, is_pinned: e.target.checked }))}
                            style={{ width: 16, height: 16, accentColor: '#6366F1' }}
                          />
                          <label htmlFor="is_pinned" style={{ ...pjs('13px', 500, '18px', '#374151'), cursor: 'pointer' }}>
                            Pin this announcement
                          </label>
                        </div>
                      </div>
                      <div style={styles.formActions}>
                        <button
                          type="button"
                          style={styles.cancelBtn}
                          onClick={() => {
                            setShowAnnForm(false)
                            setAnnError(null)
                          }}
                        >
                          Cancel
                        </button>
                        <button type="submit" style={styles.submitBtn} disabled={annSubmitting}>
                          {annSubmitting ? 'Posting...' : 'Post Announcement'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {announcements.length === 0 ? (
                  <div style={styles.emptyState}>No announcements yet.</div>
                ) : (
                  announcements.map((a) => (
                    <div key={a.id} style={styles.card}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                            <span style={styles.annTitle}>{a.title}</span>
                            {a.is_pinned && (
                              <span style={styles.pinnedBadge}>
                                <Star size={10} />
                                Pinned
                              </span>
                            )}
                          </div>
                          <div style={styles.annMessage}>{a.message}</div>
                          {a.created_at && (
                            <div style={pjs('11px', 400, '16px', '#9CA3AF')}>
                              {new Date(a.created_at).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Students Tab */}
            {activeTab === 'students' && (
              <div>
                <div style={styles.sectionHeader}>
                  <div style={styles.sectionTitle}>
                    Enrolled Students ({students.length})
                  </div>
                </div>

                {students.length === 0 ? (
                  <div style={styles.emptyState}>No students enrolled yet.</div>
                ) : (
                  <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th style={styles.th}>#</th>
                          <th style={styles.th}>Name</th>
                          <th style={styles.th}>Email</th>
                          <th style={styles.th}>Enrollment No.</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((s, idx) => (
                          <tr key={s.student_id || idx}>
                            <td style={{ ...styles.td, color: '#9CA3AF', width: 48 }}>{idx + 1}</td>
                            <td style={styles.td}>{s.full_name || '—'}</td>
                            <td style={styles.td}>{s.email || '—'}</td>
                            <td style={styles.td}>{s.enrollment_no || s.roll_no || '—'}</td>
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
      </div>
    </PageLayout>
  )
}
