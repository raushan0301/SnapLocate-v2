import { useState, useEffect, useCallback } from 'react'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'
import { CalendarCheck, Users } from 'lucide-react'

const STATUS = ['present', 'absent', 'late', 'excused']

const STATUS_CLS = {
  present: 'border-green-200 bg-green-50 text-green-600 font-bold',
  absent:  'border-red-200 bg-red-50 text-red-600 font-bold',
  late:    'border-amber-200 bg-amber-50 text-amber-600 font-bold',
  excused: 'border-sky-200 bg-sky-50 text-sky-600 font-bold',
}

const fieldCls = 'w-full px-3 py-[9px] rounded-[10px] border-[1.5px] border-slate-200 text-[14px] outline-none focus:border-brand transition-colors'

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
        <div className={`fixed bottom-6 right-6 z-[999] px-5 py-3 rounded-[12px] text-white text-[14px] font-semibold ${toast.type === 'error' ? 'bg-red-600' : 'bg-slate-900'}`}>
          {toast.msg}
        </div>
      )}

      <div className="flex items-center gap-4">
        <div className="w-11 h-11 rounded-[14px] bg-green-50 flex items-center justify-center">
          <CalendarCheck size={22} color="#16a34a" />
        </div>
        <div>
          <h1 className="text-[26px] font-bold t-primary m-0">Mark Attendance</h1>
          <p className="text-[14px] t-muted m-0">Select a course and date, then mark each student.</p>
        </div>
      </div>

      <div className="bg-white rounded-[20px] border border-slate-100 px-6 py-5 flex gap-4 flex-wrap items-end">
        <div className="flex-1 min-w-[200px]">
          <div className="text-[12px] font-semibold text-slate-700 mb-1.5">Course</div>
          <select value={course} onChange={e => setCourse(e.target.value)} className={fieldCls}>
            <option value="">— Select course —</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
          </select>
        </div>
        <div>
          <div className="text-[12px] font-semibold text-slate-700 mb-1.5">Date</div>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} max={new Date().toISOString().split('T')[0]}
            className="px-3 py-[9px] rounded-[10px] border-[1.5px] border-slate-200 text-[14px] outline-none focus:border-brand transition-colors" />
        </div>
      </div>

      {course && students.length > 0 && (
        <>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex gap-3">
              <span className="text-[13px] font-bold text-green-600 bg-green-50 px-3.5 py-1.5 rounded-[10px]">{presentCount} Present</span>
              <span className="text-[13px] font-bold text-red-600 bg-red-50 px-3.5 py-1.5 rounded-[10px]">{absentCount} Absent</span>
              <span className="text-[13px] font-semibold t-muted bg-slate-50 px-3.5 py-1.5 rounded-[10px]">{students.length} Total</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => markAll('present')} className="px-3.5 py-1.5 rounded-[8px] border-[1.5px] border-green-200 bg-green-50 cursor-pointer text-[12px] font-bold text-green-600">All Present</button>
              <button onClick={() => markAll('absent')}  className="px-3.5 py-1.5 rounded-[8px] border-[1.5px] border-red-200 bg-red-50 cursor-pointer text-[12px] font-bold text-red-600">All Absent</button>
            </div>
          </div>

          <div className="bg-white rounded-[20px] border border-slate-100 overflow-hidden">
            {loadingStudents ? (
              <div className="p-10 text-center text-[13px] t-muted">Loading students...</div>
            ) : students.map((s, i) => {
              const sid      = s.student_id
              const cur      = marks[sid] || 'present'
              const initials = (s.full_name || 'S').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
              return (
                <div key={i} className="px-6 py-3.5 border-b border-slate-50 flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-[12px] flex items-center justify-center shrink-0 overflow-hidden" style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)' }}>
                    {s.avatar_url ? <img src={s.avatar_url} alt="" className="w-full h-full object-cover" />
                      : <span className="text-[13px] font-bold text-white">{initials}</span>}
                  </div>
                  <div className="flex-1">
                    <div className="text-[14px] font-bold t-primary">{s.full_name}</div>
                    <div className="text-[12px] t-muted">{s.email}</div>
                  </div>
                  <div className="flex gap-1.5">
                    {STATUS.map(st => (
                      <button key={st} onClick={() => setMarks(prev => ({ ...prev, [sid]: st }))}
                        className={`px-3 py-[5px] rounded-[8px] border-[1.5px] text-[11px] cursor-pointer transition-all ${cur === st ? STATUS_CLS[st] : 'border-slate-200 bg-white text-slate-400 font-medium'}`}>
                        {st.charAt(0).toUpperCase() + st.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex justify-end">
            <button onClick={handleSave} disabled={saving}
              className={`px-7 py-3 rounded-[12px] border-0 text-white text-[14px] font-bold ${saving ? 'bg-slate-200 cursor-not-allowed' : 'bg-brand cursor-pointer'}`}>
              {saving ? 'Saving...' : `Save Attendance (${students.length} students)`}
            </button>
          </div>
        </>
      )}

      {course && !loadingStudents && students.length === 0 && (
        <div className="bg-white rounded-[20px] border border-slate-100 py-[60px] px-6 text-center">
          <Users size={40} color="#e2e8f0" className="mx-auto mb-3 block" />
          <div className="text-[15px] font-semibold t-primary">No students enrolled in this course</div>
        </div>
      )}
    </PageLayout>
  )
}
