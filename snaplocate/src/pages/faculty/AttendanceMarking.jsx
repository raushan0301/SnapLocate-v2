import { useState, useEffect, useCallback } from 'react'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'
import { CalendarCheck, Check, X, Clock, Users, AlertCircle } from 'lucide-react'

const pjs = (size, weight, lh, color) => ({
  fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: size, fontWeight: weight, lineHeight: lh, color,
})

const STATUS = ['present', 'absent', 'late', 'excused']
const statusStyle = {
  present: { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  absent:  { bg: '#fee2e2', color: '#dc2626', border: '#fecaca' },
  late:    { bg: '#fef3c7', color: '#d97706', border: '#fde68a' },
  excused: { bg: '#f0f9ff', color: '#0284c7', border: '#bae6fd' },
}

export default function AttendanceMarking() {
  const [courses, setCourses]   = useState([])
  const [course, setCourse]     = useState('')
  const [date, setDate]         = useState(new Date().toISOString().split('T')[0])
  const [students, setStudents] = useState([])
  const [marks, setMarks]       = useState({})
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [saving, setSaving]     = useState(false)
  const [toast, setToast]       = useState('')
  const [loading, setLoading]   = useState(true)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(''), 3000)
  }

  useEffect(() => {
    api.get('/api/lms/courses').then(res => {
      if (res.success) setCourses(res.data || [])
    }).finally(() => setLoading(false))
  }, [])

  const loadStudents = useCallback(async (courseId, dateVal) => {
    if (!courseId) return
    setLoadingStudents(true)
    try {
      const [sRes, existRes] = await Promise.allSettled([
        api.get(`/api/lms/courses/${courseId}/students`),
        api.get(`/api/attendance?course_id=${courseId}&date_from=${dateVal}&date_to=${dateVal}`),
      ])
      const studs = sRes.status === 'fulfilled' ? (sRes.value.data || []) : []
      setStudents(studs)
      // Pre-fill existing attendance
      const existing = existRes.status === 'fulfilled' ? (existRes.value.data || []) : []
      const existMap = {}
      existing.forEach(r => { existMap[r.student_id] = r.status })
      const init = {}
      studs.forEach(s => {
        const sid = s.student_id
        init[sid] = existMap[sid] || 'present'
      })
      setMarks(init)
    } catch {}
    finally { setLoadingStudents(false) }
  }, [])

  useEffect(() => {
    if (course) loadStudents(course, date)
  }, [course, date, loadStudents])

  const markAll = (status) => {
    const updated = {}
    students.forEach(s => { updated[s.student_id] = status })
    setMarks(updated)
  }

  const handleSave = async () => {
    if (!course || students.length === 0) return
    setSaving(true)
    try {
      const records = students.map(s => ({
        student_id: s.student_id,
        status: marks[s.student_id] || 'present',
      }))
      const res = await api.post('/api/attendance/bulk', { course_id: course, date, records })
      if (res.success) showToast(`Attendance saved for ${res.marked} students`)
      else showToast(res.error || 'Failed to save', 'error')
    } catch (err) {
      showToast(err?.message || 'Failed to save', 'error')
    } finally {
      setSaving(false)
    }
  }

  const presentCount = Object.values(marks).filter(s => s === 'present').length
  const absentCount  = Object.values(marks).filter(s => s === 'absent').length

  return (
    <PageLayout>
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: toast.type === 'error' ? '#dc2626' : '#0f172a', color: '#fff', padding: '12px 20px', borderRadius: 12, zIndex: 999, ...pjs(14, 600, '20px', '#fff') }}>
          {toast.msg}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 44, height: 44, borderRadius: 14, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CalendarCheck size={22} color="#16a34a" />
        </div>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#0f172a', margin: 0 }}>Mark Attendance</h1>
          <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>Select a course and date, then mark each student.</p>
        </div>
      </div>

      {/* Controls */}
      <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9', padding: '20px 24px', display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ ...pjs(12, 600, '16px', '#374151'), marginBottom: 6 }}>Course</div>
          <select value={course} onChange={e => setCourse(e.target.value)}
            style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 14, fontFamily: "'Plus Jakarta Sans', sans-serif", outline: 'none' }}>
            <option value="">— Select course —</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
          </select>
        </div>
        <div>
          <div style={{ ...pjs(12, 600, '16px', '#374151'), marginBottom: 6 }}>Date</div>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} max={new Date().toISOString().split('T')[0]}
            style={{ padding: '9px 12px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 14, fontFamily: "'Plus Jakarta Sans', sans-serif", outline: 'none' }} />
        </div>
      </div>

      {course && students.length > 0 && (
        <>
          {/* Summary + quick actions */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <span style={{ ...pjs(13, 700, '18px', '#16a34a'), background: '#f0fdf4', padding: '6px 14px', borderRadius: 10 }}>{presentCount} Present</span>
              <span style={{ ...pjs(13, 700, '18px', '#dc2626'), background: '#fee2e2', padding: '6px 14px', borderRadius: 10 }}>{absentCount} Absent</span>
              <span style={{ ...pjs(13, 600, '18px', '#64748b'), background: '#f8fafc', padding: '6px 14px', borderRadius: 10 }}>{students.length} Total</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => markAll('present')} style={{ padding: '6px 14px', borderRadius: 8, border: '1.5px solid #bbf7d0', background: '#f0fdf4', cursor: 'pointer', ...pjs(12, 700, '16px', '#16a34a') }}>All Present</button>
              <button onClick={() => markAll('absent')}  style={{ padding: '6px 14px', borderRadius: 8, border: '1.5px solid #fecaca', background: '#fee2e2', cursor: 'pointer', ...pjs(12, 700, '16px', '#dc2626') }}>All Absent</button>
            </div>
          </div>

          {/* Student list */}
          <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9', overflow: 'hidden' }}>
            {loadingStudents ? (
              <div style={{ padding: 40, textAlign: 'center', ...pjs(13, 400, '18px', '#94a3b8') }}>Loading students...</div>
            ) : students.map((s, i) => {
              const sid      = s.student_id
              const cur      = marks[sid] || 'present'
              const initials = (s.full_name || 'S').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
              return (
                <div key={i} style={{ padding: '14px 24px', borderBottom: '1px solid #f8fafc', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 12, background: 'linear-gradient(135deg, #6366f1, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                    {s.avatar_url ? <img src={s.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={pjs(13, 700, '16px', '#fff')}>{initials}</span>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={pjs(14, 700, '18px', '#0f172a')}>{s.full_name}</div>
                    <div style={pjs(12, 400, '16px', '#94a3b8')}>{s.email}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {STATUS.map(st => {
                      const ss = statusStyle[st]
                      const active = cur === st
                      return (
                        <button key={st} onClick={() => setMarks(prev => ({ ...prev, [sid]: st }))}
                          style={{ padding: '5px 12px', borderRadius: 8, border: `1.5px solid ${active ? ss.border : '#e2e8f0'}`, background: active ? ss.bg : '#fff', cursor: 'pointer', ...pjs(11, 700, '14px', active ? ss.color : '#94a3b8'), transition: 'all 0.1s' }}>
                          {st.charAt(0).toUpperCase() + st.slice(1)}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={handleSave} disabled={saving}
              style={{ padding: '12px 28px', borderRadius: 12, border: 'none', background: saving ? '#e2e8f0' : '#4f46e5', color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', ...pjs(14, 700, '20px', '#fff') }}>
              {saving ? 'Saving...' : `Save Attendance (${students.length} students)`}
            </button>
          </div>
        </>
      )}

      {course && !loadingStudents && students.length === 0 && (
        <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9', padding: '60px 24px', textAlign: 'center' }}>
          <Users size={40} color="#e2e8f0" style={{ margin: '0 auto 12px', display: 'block' }} />
          <div style={pjs(15, 600, '20px', '#0f172a')}>No students enrolled in this course</div>
        </div>
      )}
    </PageLayout>
  )
}
