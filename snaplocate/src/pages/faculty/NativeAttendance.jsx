import { useState, useEffect, useCallback } from 'react'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'
import { ClipboardList, Plus, Check, Search } from 'lucide-react'

const STATUS_CLS = {
  P: { label: 'Present', activeCls: 'border-green-200 bg-green-50 text-green-600 font-bold',  badge: 'text-green-600 bg-green-50 border border-green-200' },
  A: { label: 'Absent',  activeCls: 'border-red-200 bg-red-50 text-red-600 font-bold',         badge: 'text-red-600 bg-red-50 border border-red-200'   },
  L: { label: 'Late',    activeCls: 'border-amber-200 bg-amber-50 text-amber-600 font-bold',   badge: 'text-amber-600 bg-amber-50 border border-amber-200' },
}

const fieldCls = 'w-full mt-1 px-3 py-[9px] rounded-[10px] border-[1.5px] border-slate-200 text-[14px] outline-none box-border focus:border-brand transition-colors'

function Toast({ msg, type }) {
  if (!msg) return null
  return <div className={`fixed bottom-6 right-6 z-[999] px-5 py-3 rounded-[12px] text-white text-[14px] font-semibold ${type === 'error' ? 'bg-red-600' : 'bg-slate-900'}`}>{msg}</div>
}

function StatusBtn({ status, current, onClick }) {
  const cfg = STATUS_CLS[status]
  const active = current === status
  return (
    <button onClick={() => onClick(status)}
      className={`px-3 py-[5px] rounded-[8px] border-[1.5px] text-[12px] cursor-pointer transition-all ${active ? cfg.activeCls : 'border-slate-200 bg-white text-slate-400 font-medium'}`}>
      {cfg.label}
    </button>
  )
}

export default function FacultyNativeAttendance() {
  const [sections, setSections] = useState([])
  const [selSection, setSelSection] = useState(null)
  const [sessions, setSessions] = useState([])
  const [students, setStudents] = useState([])
  const [marks, setMarks] = useState({})
  const [selSession, setSelSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState(null)
  const [showNewSession, setShowNewSession] = useState(false)
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0])
  const [search, setSearch] = useState('')

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000) }

  const loadSections = useCallback(async () => {
    try {
      const res = await api.get('/api/lms/native/faculty/my-sections')
      if (res.success) {
        const allSections = (res.data || []).map(sec => ({ ...sec, course: sec.lms_courses }))
        setSections(allSections)
        if (allSections.length > 0 && !selSection) setSelSection(allSections[0])
      }
    } catch { }
    finally { setLoading(false) }
  }, [selSection])

  useEffect(() => { loadSections() }, [loadSections])

  useEffect(() => {
    if (!selSection) return
    loadSessions()
    loadStudents()
  }, [selSection])

  const loadSessions = async () => {
    if (!selSection) return
    try {
      const res = await api.get(`/api/lms/native/attendance/sections/${selSection.id}/sessions`)
      if (res.success) setSessions(res.data || [])
    } catch { }
  }

  const loadStudents = async () => {
    if (!selSection) return
    try {
      const res = await api.get(`/api/lms/native/admin/sections/${selSection.id}/enrollments`)
      if (res.success) {
        setStudents(res.data || [])
        const m = {}
        for (const s of res.data || []) m[s.student_id] = 'P'
        setMarks(m)
      }
    } catch { }
  }

  const loadSessionRecords = async (session) => {
    setSelSession(session)
    try {
      const res = await api.get(`/api/lms/native/attendance/sessions/${session.id}/records`)
      if (res.success) {
        const m = {}
        for (const r of res.data || []) m[r.student_id] = r.status
        for (const s of students) if (!m[s.student_id]) m[s.student_id] = 'P'
        setMarks(m)
      }
    } catch { }
  }

  const handleCreateSession = async () => {
    if (!selSection || !newDate) return
    try {
      const res = await api.post(`/api/lms/native/attendance/sections/${selSection.id}/sessions`, { date: newDate, is_holiday: false })
      if (res.success) {
        showToast('Session created')
        loadSessions()
        setSelSession(res.data)
        setShowNewSession(false)
        const m = {}
        for (const s of students) m[s.student_id] = 'P'
        setMarks(m)
      } else showToast(res.error || 'Failed', 'error')
    } catch (e) { showToast(e?.message || 'Error', 'error') }
  }

  const handleSubmit = async () => {
    if (!selSession) return showToast('Select or create a session first', 'error')
    const records = students.map(s => ({ student_id: s.student_id, status: marks[s.student_id] || 'A' }))
    setSubmitting(true)
    try {
      const res = await api.post(`/api/lms/native/attendance/sessions/${selSession.id}/bulk-mark`, { records })
      if (res.success) { showToast(`Marked ${res.marked} students`); loadSessions() }
      else showToast(res.error || 'Failed', 'error')
    } catch (e) { showToast(e?.message || 'Error', 'error') }
    finally { setSubmitting(false) }
  }

  const markAll = (status) => {
    const m = {}
    for (const s of students) m[s.student_id] = status
    setMarks(m)
  }

  const filtered = students.filter(s => {
    if (!search) return true
    const q = search.toLowerCase()
    return s.users?.full_name?.toLowerCase().includes(q) || s.roll_number?.toLowerCase().includes(q)
  })

  const presentCount = Object.values(marks).filter(v => v === 'P').length
  const absentCount  = Object.values(marks).filter(v => v === 'A').length
  const lateCount    = Object.values(marks).filter(v => v === 'L').length

  return (
    <PageLayout>
      <Toast msg={toast?.msg} type={toast?.type} />

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-[28px] font-extrabold t-primary m-0 tracking-[-0.02em]">Attendance Register</h1>
          <p className="text-[13px] font-medium t-muted mt-1">Native LMS · Mark daily class attendance</p>
        </div>
      </div>

      <div className="grid gap-5 items-start" style={{ gridTemplateColumns: '240px 1fr' }}>
        {/* Left: Section picker */}
        <div className="bg-white rounded-[20px] border border-slate-100 overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="px-4 py-3.5 border-b border-slate-100 text-[12px] font-bold text-slate-400 uppercase tracking-[0.08em]">
            Your Sections
          </div>
          {loading ? (
            <div className="p-6 text-[13px] t-muted text-center">Loading...</div>
          ) : sections.length === 0 ? (
            <div className="p-5 text-[13px] t-muted text-center">No sections found</div>
          ) : sections.map(sec => {
            const active = selSection?.id === sec.id
            return (
              <div key={sec.id} onClick={() => { setSelSection(sec); setSelSession(null) }}
                className={`px-4 py-3 cursor-pointer border-b border-slate-50 transition-all ${active ? 'bg-indigo-50 border-l-[3px] border-l-brand' : 'bg-transparent border-l-[3px] border-l-transparent'}`}>
                <div className={`text-[13px] leading-[18px] ${active ? 'font-bold text-brand' : 'font-medium text-slate-700'}`}>{sec.course?.title}</div>
                <div className="text-[11px] t-muted mt-0.5">Section {sec.section_name} · {sec.course?.code}</div>
              </div>
            )
          })}
        </div>

        {/* Right: Attendance area */}
        <div className="flex flex-col gap-4">
          {!selSection ? (
            <div className="bg-white rounded-[20px] border-2 border-dashed border-slate-200 py-[60px] px-6 text-center">
              <ClipboardList size={40} color="#e2e8f0" className="mx-auto mb-3 block" />
              <div className="text-[15px] font-semibold t-primary">Select a section to start</div>
            </div>
          ) : (
            <>
              {/* Session selector */}
              <div className="bg-white rounded-[20px] border border-slate-100 px-5 py-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-[14px] font-bold t-primary">Class Sessions</div>
                  <button onClick={() => setShowNewSession(s => !s)}
                    className="flex items-center gap-1.5 px-3.5 py-[7px] rounded-[10px] border-0 bg-brand cursor-pointer text-[12px] font-bold text-white">
                    <Plus size={13} /> New Session
                  </button>
                </div>

                {showNewSession && (
                  <div className="bg-slate-50 rounded-[12px] p-3.5 mb-3 flex gap-2.5 items-end flex-wrap">
                    <div className="flex-1 min-w-[160px]">
                      <div className="text-[12px] font-semibold text-slate-700">Date</div>
                      <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className={fieldCls} />
                    </div>
                    <button onClick={handleCreateSession}
                      className="px-[18px] py-[9px] rounded-[10px] border-0 bg-green-600 cursor-pointer text-[13px] font-bold text-white">
                      Create
                    </button>
                    <button onClick={() => setShowNewSession(false)}
                      className="px-3.5 py-[9px] rounded-[10px] border-[1.5px] border-slate-200 bg-white cursor-pointer text-[13px] font-semibold t-muted">
                      Cancel
                    </button>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {sessions.length === 0 ? (
                    <span className="text-[13px] t-muted">No sessions yet. Create one above.</span>
                  ) : sessions.slice(0, 10).map(s => {
                    const active = selSession?.id === s.id
                    const pCount = (s.lms_attendance_records || []).filter(r => r.status === 'P').length
                    const total  = (s.lms_attendance_records || []).length
                    return (
                      <button key={s.id} onClick={() => loadSessionRecords(s)}
                        className={`px-3.5 py-1.5 rounded-[10px] border-[1.5px] cursor-pointer text-left ${active ? 'border-brand bg-indigo-50' : 'border-slate-200 bg-white'}`}>
                        <div className={`text-[12px] font-bold ${active ? 'text-brand' : 'text-slate-700'}`}>{new Date(s.date + 'T12:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
                        {total > 0 && <div className="text-[10px] t-muted">{pCount}/{total}</div>}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Live stats */}
              {students.length > 0 && (
                <div className="grid grid-cols-4 gap-2.5">
                  {[
                    { label: 'Total',   val: students.length, cls: 'bg-indigo-50 text-brand' },
                    { label: 'Present', val: presentCount,    cls: 'bg-green-50 text-green-600' },
                    { label: 'Absent',  val: absentCount,     cls: 'bg-red-50 text-red-600' },
                    { label: 'Late',    val: lateCount,       cls: 'bg-amber-50 text-amber-600' },
                  ].map(({ label, val, cls }) => (
                    <div key={label} className={`${cls} rounded-[14px] px-4 py-3 text-center`}>
                      <div className="text-[26px] font-extrabold leading-[30px] tabular-nums">{val}</div>
                      <div className="text-[11px] font-medium text-slate-400 mt-0.5">{label}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Student list */}
              <div className="bg-white rounded-[20px] border border-slate-100 overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search size={13} color="#94a3b8" className="absolute left-[11px] top-1/2 -translate-y-1/2" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search student..."
                      className="w-full py-[7px] pl-[30px] pr-2.5 rounded-[9px] border-[1.5px] border-slate-200 text-[13px] outline-none box-border focus:border-brand transition-colors" />
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => markAll('P')} className="px-3 py-1.5 rounded-[8px] border-[1.5px] border-green-200 bg-green-50 cursor-pointer text-[12px] font-bold text-green-600">All Present</button>
                    <button onClick={() => markAll('A')} className="px-3 py-1.5 rounded-[8px] border-[1.5px] border-red-200 bg-red-50 cursor-pointer text-[12px] font-bold text-red-600">All Absent</button>
                  </div>
                </div>

                {students.length === 0 ? (
                  <div className="p-10 text-center text-[13px] t-muted">
                    No students enrolled in this section yet.
                  </div>
                ) : filtered.map((s, i) => {
                  const name = s.users?.full_name || 'Unknown'
                  const roll = s.roll_number || '—'
                  const cur  = marks[s.student_id] || 'P'
                  const cfg  = STATUS_CLS[cur]
                  return (
                    <div key={s.student_id}
                      className={`px-5 py-3 flex items-center gap-3 ${i < filtered.length - 1 ? 'border-b border-slate-50' : ''}`}>
                      <div className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg,#eef2ff,#e0e7ff)' }}>
                        <span className="text-[13px] font-bold text-brand">{name.charAt(0)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-semibold t-primary">{name}</div>
                        <div className="text-[11px] t-muted">Roll: {roll}</div>
                      </div>
                      <div className={`text-[11px] font-bold px-2 py-[3px] rounded-[6px] min-w-[56px] text-center ${cfg.badge}`}>
                        {cfg.label}
                      </div>
                      <div className="flex gap-1">
                        {['P', 'A', 'L'].map(st => (
                          <StatusBtn key={st} status={st} current={cur} onClick={v => setMarks(m => ({ ...m, [s.student_id]: v }))} />
                        ))}
                      </div>
                    </div>
                  )
                })}

                {students.length > 0 && (
                  <div className="px-5 py-3.5 border-t-[1.5px] border-slate-100 flex items-center justify-between bg-slate-50">
                    <span className="text-[13px] font-medium t-muted">
                      {selSession ? `Session: ${new Date(selSession.date + 'T12:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}` : '⚠️ Select or create a session first'}
                    </span>
                    <button onClick={handleSubmit} disabled={submitting || !selSession}
                      className={`flex items-center gap-2 px-[22px] py-2.5 rounded-[12px] border-0 text-white text-[14px] font-bold ${submitting || !selSession ? 'bg-slate-200 cursor-not-allowed' : 'cursor-pointer'}`}
                      style={submitting || !selSession ? {} : { background: 'linear-gradient(135deg,#4f46e5,#6366f1)' }}>
                      <Check size={16} /> {submitting ? 'Saving...' : 'Submit Attendance'}
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </PageLayout>
  )
}
