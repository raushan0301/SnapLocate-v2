import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'
import { ClipboardList, Plus, Check, X, Clock, ChevronDown, ChevronRight, Users, CalendarDays, Search } from 'lucide-react'

const pjs = (sz, fw, lh, col) => ({ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: sz, fontWeight: fw, lineHeight: lh, color: col })
const inp = { width: '100%', marginTop: 4, padding: '9px 12px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 14, fontFamily: "'Plus Jakarta Sans',sans-serif", outline: 'none', boxSizing: 'border-box' }

function Toast({ msg, type }) {
  if (!msg) return null
  return <div style={{ position: 'fixed', bottom: 24, right: 24, background: type === 'error' ? '#dc2626' : '#0f172a', color: '#fff', padding: '12px 20px', borderRadius: 12, zIndex: 999, fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 14, fontWeight: 600 }}>{msg}</div>
}

const STATUS_CONFIG = {
  P: { label: 'Present', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
  A: { label: 'Absent', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  L: { label: 'Late', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
}

function StatusBtn({ status, current, onClick }) {
  const cfg = STATUS_CONFIG[status]
  const active = current === status
  return (
    <button onClick={() => onClick(status)}
      style={{ padding: '5px 12px', borderRadius: 8, border: `1.5px solid ${active ? cfg.border : '#e2e8f0'}`, background: active ? cfg.bg : '#fff', cursor: 'pointer', ...pjs(12, active ? 700 : 500, '16px', active ? cfg.color : '#94a3b8'), transition: 'all 0.15s' }}>
      {cfg.label}
    </button>
  )
}

export default function FacultyNativeAttendance() {
  const [sections, setSections] = useState([])
  const [selSection, setSelSection] = useState(null)
  const [sessions, setSessions] = useState([])
  const [students, setStudents] = useState([])
  const [marks, setMarks] = useState({})  // { student_id: 'P'|'A'|'L' }
  const [selSession, setSelSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState(null)
  const [showNewSession, setShowNewSession] = useState(false)
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0])
  const [search, setSearch] = useState('')

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000) }

  // Load faculty's sections from native LMS
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

  // Load sessions + students when section changes
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
        // Default all to Present
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
        // fill any missing students with P
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
  const absentCount = Object.values(marks).filter(v => v === 'A').length
  const lateCount = Object.values(marks).filter(v => v === 'L').length

  return (
    <PageLayout>
      <Toast msg={toast?.msg} type={toast?.type} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ ...pjs(28, 800, '34px', '#0f172a'), margin: 0, letterSpacing: '-0.02em' }}>Attendance Register</h1>
          <p style={{ ...pjs(13, 500, '18px', '#64748b'), marginTop: 4 }}>Native LMS · Mark daily class attendance</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 20, alignItems: 'start' }}>
        {/* Left: Section picker */}
        <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9', ...pjs(12, 700, '16px', '#94a3b8'), letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Your Sections
          </div>
          {loading ? (
            <div style={{ padding: 24, ...pjs(13, 400, '18px', '#94a3b8'), textAlign: 'center' }}>Loading...</div>
          ) : sections.length === 0 ? (
            <div style={{ padding: 20, ...pjs(13, 400, '18px', '#94a3b8'), textAlign: 'center' }}>No sections found</div>
          ) : sections.map(sec => {
            const active = selSection?.id === sec.id
            return (
              <div key={sec.id} onClick={() => { setSelSection(sec); setSelSession(null) }}
                style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #f8fafc', background: active ? '#eef2ff' : 'transparent', borderLeft: `3px solid ${active ? '#4f46e5' : 'transparent'}`, transition: 'all 0.15s' }}>
                <div style={pjs(13, active ? 700 : 500, '18px', active ? '#4f46e5' : '#334155')}>{sec.course?.title}</div>
                <div style={{ ...pjs(11, 400, '14px', '#94a3b8'), marginTop: 2 }}>Section {sec.section_name} · {sec.course?.code}</div>
              </div>
            )
          })}
        </div>

        {/* Right: Attendance area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {!selSection ? (
            <div style={{ background: '#fff', borderRadius: 20, border: '1.5px dashed #e2e8f0', padding: '60px 24px', textAlign: 'center' }}>
              <ClipboardList size={40} color="#e2e8f0" style={{ margin: '0 auto 12px', display: 'block' }} />
              <div style={pjs(15, 600, '20px', '#0f172a')}>Select a section to start</div>
            </div>
          ) : (
            <>
              {/* Session selector */}
              <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9', padding: '16px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={pjs(14, 700, '18px', '#0f172a')}>Class Sessions</div>
                  <button onClick={() => setShowNewSession(s => !s)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 10, border: 'none', background: '#4f46e5', cursor: 'pointer', ...pjs(12, 700, '16px', '#fff') }}>
                    <Plus size={13} /> New Session
                  </button>
                </div>

                {showNewSession && (
                  <div style={{ background: '#f8fafc', borderRadius: 12, padding: 14, marginBottom: 12, display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 160 }}>
                      <div style={pjs(12, 600, '16px', '#374151')}>Date</div>
                      <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} style={{ ...inp, marginTop: 4 }} />
                    </div>
                    <button onClick={handleCreateSession}
                      style={{ padding: '9px 18px', borderRadius: 10, border: 'none', background: '#16a34a', cursor: 'pointer', ...pjs(13, 700, '18px', '#fff') }}>
                      Create
                    </button>
                    <button onClick={() => setShowNewSession(false)}
                      style={{ padding: '9px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer', ...pjs(13, 600, '18px', '#64748b') }}>
                      Cancel
                    </button>
                  </div>
                )}

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {sessions.length === 0 ? (
                    <span style={pjs(13, 400, '18px', '#94a3b8')}>No sessions yet. Create one above.</span>
                  ) : sessions.slice(0, 10).map(s => {
                    const active = selSession?.id === s.id
                    const pCount = (s.lms_attendance_records || []).filter(r => r.status === 'P').length
                    const total = (s.lms_attendance_records || []).length
                    return (
                      <button key={s.id} onClick={() => loadSessionRecords(s)}
                        style={{ padding: '6px 14px', borderRadius: 10, border: `1.5px solid ${active ? '#4f46e5' : '#e2e8f0'}`, background: active ? '#eef2ff' : '#fff', cursor: 'pointer', textAlign: 'left' }}>
                        <div style={pjs(12, 700, '16px', active ? '#4f46e5' : '#334155')}>{new Date(s.date + 'T12:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
                        {total > 0 && <div style={pjs(10, 400, '14px', '#94a3b8')}>{pCount}/{total}</div>}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Live stats */}
              {students.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10 }}>
                  {[
                    { label: 'Total', val: students.length, col: '#4f46e5', bg: '#eef2ff' },
                    { label: 'Present', val: presentCount, col: '#16a34a', bg: '#f0fdf4' },
                    { label: 'Absent', val: absentCount, col: '#dc2626', bg: '#fef2f2' },
                    { label: 'Late', val: lateCount, col: '#d97706', bg: '#fffbeb' },
                  ].map(({ label, val, col, bg }) => (
                    <div key={label} style={{ background: bg, borderRadius: 14, padding: '12px 16px', textAlign: 'center' }}>
                      <div style={{ ...pjs(26, 800, '30px', col), fontVariantNumeric: 'tabular-nums' }}>{val}</div>
                      <div style={pjs(11, 500, '14px', '#94a3b8')}>{label}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Student list */}
              <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                    <Search size={13} color="#94a3b8" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)' }} />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search student..."
                      style={{ width: '100%', padding: '7px 10px 7px 30px', borderRadius: 9, border: '1.5px solid #e2e8f0', fontSize: 13, fontFamily: "'Plus Jakarta Sans',sans-serif", outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => markAll('P')} style={{ padding: '6px 12px', borderRadius: 8, border: '1.5px solid #bbf7d0', background: '#f0fdf4', cursor: 'pointer', ...pjs(12, 700, '16px', '#16a34a') }}>All Present</button>
                    <button onClick={() => markAll('A')} style={{ padding: '6px 12px', borderRadius: 8, border: '1.5px solid #fecaca', background: '#fef2f2', cursor: 'pointer', ...pjs(12, 700, '16px', '#dc2626') }}>All Absent</button>
                  </div>
                </div>

                {students.length === 0 ? (
                  <div style={{ padding: 40, textAlign: 'center', ...pjs(13, 400, '18px', '#94a3b8') }}>
                    No students enrolled in this section yet.
                  </div>
                ) : filtered.map((s, i) => {
                  const name = s.users?.full_name || 'Unknown'
                  const roll = s.roll_number || '—'
                  const cur = marks[s.student_id] || 'P'
                  const cfg = STATUS_CONFIG[cur]
                  return (
                    <div key={s.student_id}
                      style={{ padding: '12px 20px', borderBottom: i < filtered.length - 1 ? '1px solid #f8fafc' : 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
                      {/* Avatar */}
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#eef2ff,#e0e7ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={pjs(13, 700, '16px', '#4f46e5')}>{name.charAt(0)}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={pjs(13, 600, '18px', '#0f172a')}>{name}</div>
                        <div style={pjs(11, 400, '14px', '#94a3b8')}>Roll: {roll}</div>
                      </div>
                      {/* Status badge */}
                      <div style={{ ...pjs(11, 700, '14px', cfg.color), background: cfg.bg, border: `1px solid ${cfg.border}`, padding: '3px 8px', borderRadius: 6, minWidth: 56, textAlign: 'center' }}>
                        {cfg.label}
                      </div>
                      {/* Buttons */}
                      <div style={{ display: 'flex', gap: 4 }}>
                        {['P', 'A', 'L'].map(st => (
                          <StatusBtn key={st} status={st} current={cur} onClick={v => setMarks(m => ({ ...m, [s.student_id]: v }))} />
                        ))}
                      </div>
                    </div>
                  )
                })}

                {/* Submit bar */}
                {students.length > 0 && (
                  <div style={{ padding: '14px 20px', borderTop: '1.5px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fafafa' }}>
                    <span style={pjs(13, 500, '18px', '#64748b')}>
                      {selSession ? `Session: ${new Date(selSession.date + 'T12:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}` : '⚠️ Select or create a session first'}
                    </span>
                    <button onClick={handleSubmit} disabled={submitting || !selSession}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 22px', borderRadius: 12, border: 'none', background: submitting || !selSession ? '#e2e8f0' : 'linear-gradient(135deg,#4f46e5,#6366f1)', color: '#fff', cursor: submitting || !selSession ? 'not-allowed' : 'pointer', ...pjs(14, 700, '20px', '#fff') }}>
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
