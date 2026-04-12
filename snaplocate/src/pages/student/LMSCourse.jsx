import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  BookOpen, Megaphone, ClipboardList, BarChart2, CalendarCheck,
  ChevronLeft, FileText, CheckCircle, Clock, AlertCircle,
} from 'lucide-react'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'

const pjs = (size, weight, lh, color) => ({
  fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: size, fontWeight: weight, lineHeight: lh, color,
})

function DueChip({ dueDate }) {
  if (!dueDate) return null
  const diff = new Date(dueDate).getTime() - Date.now()
  const days = Math.ceil(diff / 86400000)
  const overdue = days < 0
  const today   = days === 0
  const bg    = overdue ? '#fee2e2' : today ? '#fef3c7' : '#f0fdf4'
  const color = overdue ? '#dc2626' : today ? '#d97706' : '#16a34a'
  const label = overdue ? 'Overdue' : today ? 'Due today' : days === 1 ? 'Due tomorrow' : `Due in ${days}d`
  return (
    <span style={{ background: bg, color, borderRadius: 6, padding: '2px 8px', ...pjs(11, 700, '16px', color) }}>
      {label}
    </span>
  )
}

function AttBadge({ status }) {
  const map = {
    present:  { bg: '#f0fdf4', color: '#16a34a', label: 'Present' },
    absent:   { bg: '#fee2e2', color: '#dc2626', label: 'Absent'  },
    late:     { bg: '#fef3c7', color: '#d97706', label: 'Late'    },
    excused:  { bg: '#eff6ff', color: '#3b82f6', label: 'Excused' },
  }
  const s = map[status?.toLowerCase()] ?? map.absent
  return (
    <span style={{ ...pjs(11, 700, '16px', s.color), background: s.bg, padding: '2px 10px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
      {s.label}
    </span>
  )
}

const TABS = [
  { key: 'announcements', label: 'Announcements', Icon: Megaphone },
  { key: 'assignments',   label: 'Assignments',   Icon: ClipboardList },
  { key: 'grades',        label: 'Grades',        Icon: BarChart2 },
  { key: 'attendance',    label: 'Attendance',    Icon: CalendarCheck },
]

export default function LMSCourse() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [activeTab,     setActiveTab]     = useState('announcements')
  const [course,        setCourse]        = useState(null)
  const [announcements, setAnnouncements] = useState([])
  const [assignments,   setAssignments]   = useState([])
  const [grades,        setGrades]        = useState([])
  const [attendance,    setAttendance]    = useState([])
  const [loadingCourse, setLoadingCourse] = useState(true)
  const [loadingTab,    setLoadingTab]    = useState(false)

  useEffect(() => {
    if (!id) return
    setLoadingCourse(true)
    api.get(`/api/lms/courses/${id}`)
      .then(res => { if (res.success) setCourse(res.data) })
      .finally(() => setLoadingCourse(false))
  }, [id])

  useEffect(() => {
    if (!id) return
    const fetchers = {
      announcements: () => api.get(`/api/lms/announcements?course_id=${id}`).then(res => {
        if (res.success) {
          const sorted = [...(res.data ?? [])].sort((a, b) => {
            if (a.is_pinned && !b.is_pinned) return -1
            if (!a.is_pinned && b.is_pinned) return 1
            return new Date(b.created_at) - new Date(a.created_at)
          })
          setAnnouncements(sorted)
        }
      }),
      assignments: () => api.get(`/api/lms/assignments?course_id=${id}`).then(res => {
        if (res.success) setAssignments(res.data ?? [])
      }),
      grades: () => api.get(`/api/lms/grades?course_id=${id}`).then(res => {
        if (res.success) setGrades(res.data ?? [])
      }),
      attendance: () => api.get(`/api/attendance?course_id=${id}`).then(res => {
        if (res.success) {
          const sorted = [...(res.data ?? [])].sort((a, b) => new Date(b.date) - new Date(a.date))
          setAttendance(sorted)
        }
      }),
    }
    setLoadingTab(true)
    fetchers[activeTab]().catch(() => {}).finally(() => setLoadingTab(false))
  }, [id, activeTab])

  const attSummary = (() => {
    if (!attendance.length) return null
    const total   = attendance.length
    const present = attendance.filter(a => a.status === 'present').length
    const late    = attendance.filter(a => a.status === 'late').length
    const absent  = attendance.filter(a => a.status === 'absent').length
    const pct     = Math.round(((present + late * 0.5) / total) * 100)
    return { total, present, late, absent, pct }
  })()

  const fp = course?.faculty_profiles
  const facultyName = fp?.users?.full_name

  return (
    <PageLayout>
      <button onClick={() => navigate('/lms')}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', ...pjs(14, 500, '20px', '#64748b'), padding: '0 0 18px 0' }}>
        <ChevronLeft size={16} /> Back to My Courses
      </button>

      {loadingCourse && <div style={{ ...pjs(14, 400, '20px', '#94a3b8'), textAlign: 'center', padding: 40 }}>Loading...</div>}

      {!loadingCourse && course && (
        <>
          {/* Course header */}
          <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9', padding: '24px 28px', marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <BookOpen size={22} color="#4f46e5" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                  <span style={{ ...pjs(12, 700, '16px', '#4f46e5'), background: '#eef2ff', padding: '2px 10px', borderRadius: 20 }}>{course.code}</span>
                  {course.dept && <span style={pjs(13, 400, '18px', '#64748b')}>{course.dept}</span>}
                  {course.semester && <span style={pjs(13, 400, '18px', '#64748b')}>Sem {course.semester}</span>}
                </div>
                <h1 style={{ ...pjs(22, 700, '30px', '#0f172a'), margin: '0 0 6px' }}>{course.name}</h1>
                {facultyName && <div style={pjs(13, 400, '18px', '#64748b')}>Faculty: {facultyName}</div>}
                {course.enrolled_count != null && (
                  <div style={{ ...pjs(12, 400, '16px', '#94a3b8'), marginTop: 2 }}>{course.enrolled_count} enrolled</div>
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid #f1f5f9', marginBottom: 24 }}>
            {TABS.map(({ key, label, Icon }) => {
              const active = activeTab === key
              return (
                <button key={key} onClick={() => setActiveTab(key)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'none', border: 'none',
                    borderBottom: active ? '2px solid #4f46e5' : '2px solid transparent',
                    padding: '10px 16px', cursor: 'pointer', marginBottom: -1, whiteSpace: 'nowrap',
                    ...pjs(14, active ? 700 : 500, '20px', active ? '#4f46e5' : '#64748b') }}>
                  <Icon size={15} />{label}
                </button>
              )
            })}
          </div>

          {loadingTab ? (
            <div style={{ ...pjs(14, 400, '20px', '#94a3b8'), textAlign: 'center', padding: 40 }}>Loading...</div>
          ) : (
            <>
              {/* ANNOUNCEMENTS */}
              {activeTab === 'announcements' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {announcements.length === 0 && <EmptyState Icon={Megaphone} text="No announcements yet." />}
                  {announcements.map(ann => (
                    <div key={ann.id} style={{ background: '#fff', borderRadius: 16, border: '1px solid #f1f5f9', padding: '18px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 8, background: ann.is_pinned ? '#fef3c7' : '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Megaphone size={16} color={ann.is_pinned ? '#d97706' : '#4f46e5'} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <span style={pjs(15, 700, '20px', '#0f172a')}>{ann.title}</span>
                            {ann.is_pinned && <span style={{ ...pjs(10, 700, '14px', '#d97706'), background: '#fef3c7', padding: '2px 7px', borderRadius: 20, textTransform: 'uppercase' }}>Pinned</span>}
                          </div>
                          <p style={{ ...pjs(13, 400, '20px', '#64748b'), margin: '0 0 6px' }}>{ann.message}</p>
                          {ann.created_at && <span style={pjs(11, 400, '16px', '#94a3b8')}>{new Date(ann.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ASSIGNMENTS */}
              {activeTab === 'assignments' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {assignments.length === 0 && <EmptyState Icon={ClipboardList} text="No assignments posted yet." />}
                  {assignments.map(asgn => (
                    <Link key={asgn.id} to={`/lms/assignments/${asgn.id}`} style={{ textDecoration: 'none' }}>
                      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f1f5f9', padding: '18px 20px', cursor: 'pointer' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                          <div style={{ width: 36, height: 36, borderRadius: 8, background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <FileText size={16} color="#d97706" />
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 5 }}>
                              <span style={pjs(15, 700, '20px', '#0f172a')}>{asgn.title}</span>
                              <DueChip dueDate={asgn.due_date} />
                              {asgn.my_submission && (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, ...pjs(11, 700, '16px', '#16a34a'), background: '#f0fdf4', padding: '2px 8px', borderRadius: 20 }}>
                                  <CheckCircle size={11} /> Submitted
                                </span>
                              )}
                            </div>
                            {asgn.max_marks != null && <span style={pjs(12, 400, '16px', '#94a3b8')}>Max marks: {asgn.max_marks}</span>}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* GRADES */}
              {activeTab === 'grades' && (
                <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9', overflow: 'hidden' }}>
                  {grades.length === 0 ? <EmptyState Icon={BarChart2} text="No grades released yet." /> : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', ...pjs(14, 400, '20px', '#0f172a') }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
                            {['Exam / Assessment', 'Marks', 'Max Marks', 'Percentage'].map(h => (
                              <th key={h} style={{ textAlign: 'left', padding: '12px 20px', ...pjs(12, 700, '16px', '#64748b'), textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {grades.map((g, i) => {
                            const pct = g.max_marks && g.marks != null ? Math.round((g.marks / g.max_marks) * 100) : null
                            const pctColor = pct == null ? '#94a3b8' : pct >= 75 ? '#16a34a' : pct >= 50 ? '#d97706' : '#dc2626'
                            return (
                              <tr key={g.id ?? i} style={{ borderBottom: i < grades.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                                <td style={{ padding: '14px 20px', ...pjs(14, 600, '20px', '#0f172a') }}>{g.exam_type}</td>
                                <td style={{ padding: '14px 20px', ...pjs(14, 400, '20px', '#0f172a') }}>{g.marks ?? '—'}</td>
                                <td style={{ padding: '14px 20px', ...pjs(14, 400, '20px', '#64748b') }}>{g.max_marks ?? '—'}</td>
                                <td style={{ padding: '14px 20px' }}>
                                  {pct != null ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                      <div style={{ width: 80, height: 6, borderRadius: 99, background: '#f1f5f9', overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: `${pct}%`, background: pctColor, borderRadius: 99 }} />
                                      </div>
                                      <span style={pjs(13, 700, '18px', pctColor)}>{pct}%</span>
                                    </div>
                                  ) : <span style={pjs(14, 400, '20px', '#94a3b8')}>—</span>}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* ATTENDANCE */}
              {activeTab === 'attendance' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {attSummary && (
                    <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9', padding: '20px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap' }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ ...pjs(36, 800, '40px', attSummary.pct >= 75 ? '#16a34a' : attSummary.pct >= 60 ? '#d97706' : '#dc2626') }}>{attSummary.pct}%</div>
                          <div style={pjs(12, 400, '16px', '#94a3b8')}>Overall</div>
                        </div>
                        <div style={{ width: 1, height: 48, background: '#f1f5f9' }} />
                        <div><div style={pjs(24, 800, '30px', '#0f172a')}>{attSummary.total}</div><div style={pjs(12, 400, '16px', '#94a3b8')}>Total Classes</div></div>
                        <div><div style={pjs(24, 800, '30px', '#16a34a')}>{attSummary.present + attSummary.late}</div><div style={pjs(12, 400, '16px', '#94a3b8')}>Present / Late</div></div>
                        <div><div style={pjs(24, 800, '30px', '#dc2626')}>{attSummary.absent}</div><div style={pjs(12, 400, '16px', '#94a3b8')}>Absent</div></div>
                      </div>
                      {attSummary.pct < 75 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, padding: '10px 14px', borderRadius: 8, background: '#fee2e2', ...pjs(13, 600, '18px', '#dc2626') }}>
                          <AlertCircle size={15} /> Attendance below 75% requirement. Attend classes regularly.
                        </div>
                      )}
                    </div>
                  )}
                  {attendance.length === 0 ? <EmptyState Icon={CalendarCheck} text="No attendance records for this course." /> : (
                    <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9', overflow: 'hidden' }}>
                      {attendance.map((rec, i) => (
                        <div key={rec.id ?? i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: i < attendance.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <CalendarCheck size={16} color="#94a3b8" />
                            <span style={pjs(14, 500, '20px', '#0f172a')}>
                              {new Date(rec.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                          <AttBadge status={rec.status} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}
    </PageLayout>
  )
}

function EmptyState({ Icon, text }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', gap: 10 }}>
      <Icon size={32} color="#e2e8f0" />
      <p style={{ ...{ fontFamily: "'Plus Jakarta Sans', sans-serif" }, fontSize: 14, color: '#94a3b8', margin: 0 }}>{text}</p>
    </div>
  )
}
