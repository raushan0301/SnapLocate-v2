import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'
import { BookOpen, ClipboardList, Clock, CheckCircle, AlertCircle, ChevronRight } from 'lucide-react'

const pjs = (size, weight, lh, color) => ({
  fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: size, fontWeight: weight, lineHeight: lh, color,
})

function timeAgo(dateStr) {
  const diff = new Date(dateStr).getTime() - Date.now()
  const days = Math.ceil(diff / 86400000)
  if (days < 0)  return 'Overdue'
  if (days === 0) return 'Due today'
  if (days === 1) return 'Due tomorrow'
  return `Due in ${days}d`
}

function DueChip({ dueDate }) {
  const diff = new Date(dueDate).getTime() - Date.now()
  const days = Math.ceil(diff / 86400000)
  const overdue = days < 0
  const today   = days === 0
  const bg    = overdue ? '#fee2e2' : today ? '#fef3c7' : '#f0fdf4'
  const color = overdue ? '#dc2626' : today ? '#d97706' : '#16a34a'
  return (
    <span style={{ background: bg, color, borderRadius: 6, padding: '2px 8px', ...pjs(11, 700, '16px', color) }}>
      {timeAgo(dueDate)}
    </span>
  )
}

export default function LMSDashboard() {
  const [courses, setCourses]       = useState([])
  const [assignments, setAssign]    = useState([])
  const [loading, setLoading]       = useState(true)

  const load = useCallback(async () => {
    try {
      const cRes = await api.get('/api/lms/courses')
      if (cRes.success) {
        const enrolled = cRes.data || []
        setCourses(enrolled)
        // Each enrollment row has a nested `courses` object with the course details
        const courseIds = enrolled
          .map(e => e.courses?.id)
          .filter(Boolean)
          .slice(0, 5)
        const aRes = await Promise.allSettled(
          courseIds.map(id => api.get(`/api/lms/assignments?course_id=${id}`))
        )
        const all = aRes.flatMap(r => r.status === 'fulfilled' ? (r.value.data || []) : [])
        const upcoming = all
          .filter(a => !a.my_submission)
          .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
          .slice(0, 8)
        setAssign(upcoming)
      }
    } catch {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const totalCourses   = courses.length
  const pendingAsgn    = assignments.filter(a => new Date(a.due_date) > Date.now() && !a.my_submission).length
  const overdueAsgn    = assignments.filter(a => new Date(a.due_date) < Date.now() && !a.my_submission).length

  return (
    <PageLayout>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 44, height: 44, borderRadius: 14, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <BookOpen size={22} color="#4f46e5" />
        </div>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#0f172a', margin: 0 }}>LMS</h1>
          <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>Your courses, assignments and grades in one place.</p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {[
          { label: 'Enrolled Courses', value: totalCourses, bg: '#eef2ff', color: '#4f46e5' },
          { label: 'Pending Assignments', value: pendingAsgn, bg: '#fffbeb', color: '#d97706' },
          { label: 'Overdue', value: overdueAsgn, bg: '#fee2e2', color: '#dc2626' },
        ].map((s, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 20, padding: '20px 24px', border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
            <div style={pjs(12, 600, '16px', '#64748b')}>{s.label}</div>
            <div style={{ ...pjs(28, 800, '36px', s.color), marginTop: 6 }}>{loading ? '—' : s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* My Courses */}
        <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9', boxShadow: '0 4px 24px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={pjs(15, 700, '20px', '#0f172a')}>My Courses</span>
            <Link to="/lms/assignments" style={{ fontSize: 13, color: '#4f46e5', fontWeight: 600, textDecoration: 'none' }}>All assignments</Link>
          </div>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', ...pjs(13, 400, '18px', '#94a3b8') }}>Loading...</div>
          ) : courses.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <BookOpen size={32} color="#e2e8f0" style={{ margin: '0 auto 8px', display: 'block' }} />
              <div style={pjs(14, 600, '20px', '#0f172a')}>No courses enrolled</div>
              <div style={{ ...pjs(12, 400, '16px', '#94a3b8'), marginTop: 4 }}>Browse available courses to enroll</div>
            </div>
          ) : (
            <div>
              {courses.map((e, i) => {
                const c = e.courses || e  // enrolled: e.courses has course data; direct: e itself
                const courseId = c.id
                return (
                  <Link key={i} to={`/lms/courses/${courseId}`} style={{ textDecoration: 'none' }}>
                    <div style={{ padding: '14px 24px', borderBottom: '1px solid #f8fafc', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
                      onMouseEnter={el => el.currentTarget.style.background = '#fafafa'}
                      onMouseLeave={el => el.currentTarget.style.background = 'transparent'}>
                      <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #6366f1, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <BookOpen size={18} color="#fff" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={pjs(14, 700, '18px', '#0f172a')}>{c.code} — {c.name}</div>
                        <div style={pjs(12, 400, '16px', '#94a3b8')}>{c.dept} · Sem {c.semester}</div>
                      </div>
                      <ChevronRight size={16} color="#cbd5e1" />
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Upcoming Assignments */}
        <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9', boxShadow: '0 4px 24px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={pjs(15, 700, '20px', '#0f172a')}>Pending Assignments</span>
            <Link to="/lms/assignments" style={{ fontSize: 13, color: '#4f46e5', fontWeight: 600, textDecoration: 'none' }}>View all</Link>
          </div>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', ...pjs(13, 400, '18px', '#94a3b8') }}>Loading...</div>
          ) : assignments.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <CheckCircle size={32} color="#22c55e" style={{ margin: '0 auto 8px', display: 'block' }} />
              <div style={pjs(14, 600, '20px', '#0f172a')}>All caught up!</div>
              <div style={{ ...pjs(12, 400, '16px', '#94a3b8'), marginTop: 4 }}>No pending assignments</div>
            </div>
          ) : (
            <div>
              {assignments.map((a, i) => (
                <Link key={i} to={`/lms/assignments/${a.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{ padding: '14px 24px', borderBottom: '1px solid #f8fafc', display: 'flex', alignItems: 'center', gap: 12 }}
                    onMouseEnter={el => el.currentTarget.style.background = '#fafafa'}
                    onMouseLeave={el => el.currentTarget.style.background = 'transparent'}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <ClipboardList size={16} color="#d97706" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={pjs(13, 700, '18px', '#0f172a')} className="truncate">{a.title}</div>
                      <div style={pjs(11, 400, '16px', '#94a3b8')}>{a.max_marks} marks</div>
                    </div>
                    <DueChip dueDate={a.due_date} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  )
}
