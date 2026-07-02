import { useState, useEffect, useMemo } from 'react'
import PageLayout from '../../components/PageLayout'
import { useAuth } from '../../context/AuthContext'
import api from '../../lib/api'

/* ── Activity Icons ── */
const GradeIcon  = () => (<svg viewBox="0 0 20 20" fill="none" className="w-full h-full"><circle cx="10" cy="10" r="8" stroke="#10b981" strokeWidth="1.5" /><path d="M6 10.5l3 3 5-5" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>)
const PhysicsIcon = () => (<svg viewBox="0 0 20 20" fill="none" className="w-full h-full"><rect x="3" y="2" width="14" height="16" rx="2" stroke="#6366f1" strokeWidth="1.5" /><path d="M7 7h6M7 10h6M7 13h3" stroke="#6366f1" strokeWidth="1.3" strokeLinecap="round" /></svg>)
const AlertIcon  = () => (<svg viewBox="0 0 20 20" fill="none" className="w-full h-full"><path d="M4 8.5C4 5.5 5.8 3.5 10 3.5c3 0 6 2 6 5s-2.5 5-5 5H8l-3.5 3.5V13.5C3 12 4 10.5 4 8.5z" stroke="#f97316" strokeWidth="1.3" fill="none" /></svg>)
const UploadIcon = () => (<svg viewBox="0 0 20 20" fill="none" className="w-full h-full"><path d="M10 3v10M6 9l4-6 4 6" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M4 16h12" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" /></svg>)

/* colour presets for weekly schedule cards */
const C = {
  indigo: { border: '#4f46e5', tc: '#4f46e5' },
  orange: { border: '#f97316', tc: '#ea580c' },
  green:  { border: '#22c55e', tc: '#16a34a' },
  red:    { border: '#ef4444', tc: '#dc2626' },
  violet: { border: '#7c3aed', tc: '#7c3aed' },
  amber:  { border: '#f59e0b', tc: '#d97706' },
}

function fmt12(str) {
  if (!str || !str.includes('-')) return str
  try {
    const [s, e] = str.split('-')
    const c = t => {
      const parts = t.split(':')
      let h = Number(parts[0]) || 0
      let m = Number(parts[1]) || 0
      const p = h >= 12 ? 'PM' : 'AM'
      h = h % 12 || 12
      return `${h}:${m.toString().padStart(2, '0')} ${p}`
    }
    return `${c(s)} - ${c(e)}`
  } catch { return str }
}

export default function StudentDashboard() {
  const { user } = useAuth()
  const firstName = (user?.full_name || 'Student').split(' ')[0]
  const [now, setNow]               = useState(new Date())
  const [timetable, setTimetable]   = useState([])
  const [tasks, setTasks]           = useState([])
  const [activityFeed, setActivityFeed] = useState([])
  const [viewMode, setViewMode]     = useState('day')

  const fetchData = async () => {
    try {
      const [ttRes, taskRes, notesRes, requestsRes] = await Promise.all([
        api.get('/api/workspace/timetable'),
        api.get('/api/workspace/tasks'),
        api.get('/api/workspace/notes'),
        api.get('/api/requests'),
      ])

      if (ttRes.success)   setTimetable(ttRes.data || [])
      if (taskRes.success) setTasks(taskRes.data || [])

      const recent = []
      if (notesRes.data?.length) {
        const topNote = notesRes.data[0]
        recent.push({ bg: '#f1f5f9', Ic: UploadIcon, bold: 'New Note:', rest: ` ${topNote.title}`, time: 'Recently' })
      }
      if (requestsRes.data?.length) {
        const topReq = requestsRes.data[0]
        const statusColor = topReq.status === 'accepted' ? '#d1fae5' : topReq.status === 'rejected' ? '#fee2e2' : '#ffedd5'
        recent.push({ bg: statusColor, Ic: AlertIcon, bold: 'Request Update:', rest: ` ${topReq.type} is ${topReq.status}`, time: 'Recently' })
      }
      setActivityFeed(recent.slice(0, 4))
    } catch (err) {
      console.error('Dashboard fetch error:', err)
    }
  }

  useEffect(() => {
    fetchData()
    const id = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(id)
  }, [])

  const toggleTask = async (id, isDone) => {
    setTasks(p => p.map(t => t.id === id ? { ...t, is_done: !isDone } : t))
    const apiBase = user?.role === 'faculty' ? '/api/faculty-workspace' : '/api/workspace'
    try {
      await api.patch(`${apiBase}/tasks/${id}/toggle`, { is_done: !isDone })
    } catch (err) {
      console.error('Failed to toggle task:', err)
    }
  }

  const pendingTasks = tasks.filter(t => !t.is_done).slice(0, 3)

  const processedSchedule = useMemo(() => {
    const today = now.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()
    const raw = timetable.filter(s => s.day?.toUpperCase() === today)
    return raw.map(s => {
      const timeStr = s.time_slot || s.time || ''
      const parts = timeStr.split('-')
      const start = parts[0]?.trim() || '00:00'
      const [h, m] = start.split(':').map(Number)
      const startMins = h * 60 + m
      const nowMins = now.getHours() * 60 + now.getMinutes()
      const end = parts[1]?.trim() || '23:59'
      const [eh, em] = end.split(':').map(Number)
      const endMins = eh * 60 + em
      let status = 'upcoming'
      if (nowMins >= startMins && nowMins <= endMins) status = 'ongoing'
      else if (nowMins > endMins) status = 'completed'
      return { ...s, formattedTime: fmt12(timeStr), startTime: start, startMins, status }
    }).sort((a, b) => a.startMins - b.startMins)
  }, [timetable, now])

  const weeklySchedule = useMemo(() => {
    const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']
    const grouped = {}
    days.forEach(day => {
      grouped[day] = timetable
        .filter(s => s.day?.toUpperCase() === day)
        .map(s => ({ ...s, formattedTime: fmt12(s.time_slot || s.time) }))
        .sort((a, b) => {
          const t1 = (a.time_slot || a.time || '00:00').split('-')[0]
          const t2 = (b.time_slot || b.time || '00:00').split('-')[0]
          return t1.localeCompare(t2)
        })
    })
    return grouped
  }, [timetable])

  const upNext    = processedSchedule.find(s => s.status === 'upcoming' || s.status === 'ongoing')
  const greeting  = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening'
  const dateStr   = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const timeStr   = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

  return (
    <PageLayout>

      {/* ── Header row: greeting + date/time ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="t-heading-3xl t-primary">{greeting}, {firstName} 👋</h1>
          <p className="t-xl t-secondary mt-0.5">Here is what is happening on campus today.</p>
        </div>
        <div className="flex gap-2 items-center shrink-0">
          <div className="bg-[rgba(118,118,128,0.12)] rounded-2xl px-3 py-1.5">
            <span className="text-[15px] font-normal text-black font-['system-ui']">{dateStr}</span>
          </div>
          <div className="bg-[rgba(118,118,128,0.12)] rounded-2xl px-3 py-1.5">
            <span className="text-[15px] font-normal text-black font-['system-ui']">{timeStr}</span>
          </div>
        </div>
      </div>

      {/* ── Row 1: Up Next + Tasks Hub ── */}
      <div className="flex flex-col lg:flex-row gap-5 items-stretch w-full">

        {/* Up Next card */}
        <div className="flex-1 relative overflow-hidden card p-6 min-h-[180px] flex flex-col">
          <img src="/images/img_overlay.png" alt="" className="hidden sm:block absolute top-0 right-0 w-24 h-24 pointer-events-none rounded-tr-3xl" />
          {upNext ? (
            <div className="relative z-10 flex flex-col gap-4 flex-1">
              <div className="flex justify-between items-center">
                <div className="flex gap-2 items-center bg-brand-light rounded-xl px-3 py-[7px]">
                  <div className={`w-2 h-2 rounded-full ${upNext.status === 'ongoing' ? 'bg-success-mid' : 'bg-brand'}`} />
                  <span className={`t-label-sm uppercase tracking-[0.04em] ${upNext.status === 'ongoing' ? 'text-[#059669]' : 'text-brand'}`}>
                    {upNext.status === 'ongoing' ? 'In Progress' : 'Up Next'}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div className="flex flex-col gap-2 w-full sm:w-[48%]">
                  <div className="flex items-end gap-1">
                    <span className="font-jakarta text-[42px] font-bold leading-none text-ink">
                      {upNext.formattedTime.split('-')[0].trim().replace(/[AP]M/, '')}
                    </span>
                    <span className="t-2xl font-medium leading-none t-secondary pb-1.5">
                      {upNext.formattedTime.includes('PM') ? 'PM' : 'AM'}
                    </span>
                  </div>
                  <h2 className="t-heading-xl t-primary truncate">{upNext.course}</h2>
                  <p className="t-lg t-secondary">{upNext.type}</p>
                </div>

                <div className="flex gap-2 items-center bg-slate-50 border border-slate-100 rounded-2xl p-3 flex-1 w-full sm:w-auto">
                  <div className="w-10 h-10 bg-white rounded-2xl shadow-sm flex items-center justify-center p-2 shrink-0">
                    <img src="/images/img_background_shadow.svg" alt="" className="w-full h-full" />
                  </div>
                  <div className="flex-1">
                    <div className="font-inter text-[11px] font-semibold t-secondary uppercase tracking-[0.05em]">Location</div>
                    <div className="t-heading-md t-primary mt-1">{upNext.location || 'N/A'}</div>
                  </div>
                  <img src="/images/img_arrow_right.svg" alt="" className="w-5 h-3 shrink-0" />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 text-center px-2.5 t-xl font-medium t-subtle">
              <div>No more classes today.</div>
              <div>Catch up on rest! 💤</div>
            </div>
          )}
        </div>

        {/* Tasks Hub card */}
        <div className="w-full lg:w-[320px] shrink-0 card p-6 flex flex-col">
          <div className="flex justify-between items-center mb-5">
            <span className="t-heading-lg t-primary">Tasks Hub</span>
            <span
              onClick={() => window.location.href = '/workspace'}
              className="font-inter text-sm font-semibold text-brand cursor-pointer hover:underline"
            >
              View All
            </span>
          </div>
          <div className="flex flex-col gap-4">
            {pendingTasks.length > 0 ? pendingTasks.map((t, i) => (
              <div key={t.id || i} className={`flex gap-3 items-start px-1 transition-all duration-200 ${t.is_done ? 'opacity-50' : 'opacity-100'}`}>
                <div
                  onClick={() => toggleTask(t.id, t.is_done)}
                  className={`w-[18px] h-[18px] rounded-md shrink-0 mt-0.5 cursor-pointer flex items-center justify-center transition-all duration-200 border-2 ${
                    t.is_done ? 'bg-brand border-brand' : 'bg-transparent border-brand'
                  }`}
                >
                  {t.is_done && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`truncate t-label-base transition-all duration-200 ${t.is_done ? 't-subtle line-through' : 't-primary'}`}>
                    {t.label}
                  </div>
                  <div className="truncate mt-0.5 t-sm t-secondary">{t.sub || 'Pending task'}</div>
                </div>
              </div>
            )) : (
              <div className="text-center t-md t-subtle py-5">No pending tasks! 🎉</div>
            )}
          </div>
        </div>
      </div>

      {/* ── Row 2: Schedule + Recent Activity ── */}
      <div className="flex flex-col lg:flex-row gap-5 items-stretch w-full">

        {/* Schedule card */}
        <div className="flex-1 card p-6 flex flex-col gap-5">
          <div className="flex justify-between items-center">
            <span className="t-heading-lg t-primary">
              {viewMode === 'day' ? "Today's Schedule" : "Weekly Overview"}
            </span>
            {/* Day / Week toggle */}
            <div className="flex items-center bg-slate-100 rounded-xl p-1">
              {['day', 'week'].map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`t-label-sm px-3.5 py-1 rounded-[7px] border-none cursor-pointer capitalize transition-all ${
                    viewMode === mode
                      ? 'bg-white t-primary shadow-[0_1px_2px_rgba(0,0,0,0.08)]'
                      : 'bg-transparent t-secondary'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {viewMode === 'day' ? (
            <div className="relative pl-2 sm:pl-4 mt-2">
              <div className="absolute top-2 bottom-2 left-[13px] sm:left-[21px] w-px bg-slate-200" />
              <div className="flex flex-col gap-6 w-full">
                {processedSchedule.length === 0 ? (
                  <div className="py-10 text-center t-md t-subtle font-medium">No classes scheduled for today.</div>
                ) : processedSchedule.map((s, i) => (
                  <div key={i} className="flex gap-4 sm:gap-6 relative z-10">
                    <div className="flex flex-col items-center mt-1 shrink-0 w-3">
                      <div className={`w-3 h-3 rounded-full border-2 border-white ring-2 ${
                        s.status === 'ongoing' ? 'bg-indigo-600 ring-indigo-200' : 'bg-slate-300 ring-transparent'
                      }`} />
                    </div>
                    <div className="flex-1 flex flex-col gap-2 min-w-0">
                      <div className="flex justify-between items-center">
                        <span className={`font-inter text-[13px] font-bold leading-[17px] transition-all duration-300 ${
                          s.status === 'ongoing' ? 'text-brand' : 't-secondary'
                        }`}>
                          {s.formattedTime}
                        </span>
                        <span className={`t-sm font-medium rounded-lg px-2.5 py-0.5 ${
                          s.status === 'ongoing' ? 'text-brand bg-brand-light' : 't-muted bg-surface-muted'
                        }`}>
                          {s.type}
                        </span>
                      </div>
                      <div
                        className={`overflow-hidden rounded-2xl px-4 py-3.5 transition-all duration-300 border ${s.status === 'ongoing' ? 'bg-indigo-50/50 border-indigo-200' : 'bg-white border-slate-100'}`}
                      >
                        <div className="truncate t-heading-base t-primary">{s.course}</div>
                        <div className="truncate mt-1 t-md t-secondary">{s.location || 'No Location'} • {s.status.toUpperCase()}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Object.entries(weeklySchedule).map(([day, classes]) => (
                <div key={day} className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <div className="t-label-xs t-secondary uppercase tracking-wider mb-3 flex justify-between items-center">
                    {day}
                    {classes.length > 0 && (
                      <span className="bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-md text-[10px]">
                        {classes.length}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-2.5">
                    {classes.length === 0 ? (
                      <div className="t-xs t-subtle italic py-2">Empty</div>
                    ) : classes.map((c, i) => {
                      const preset = C[c.color_preset] || C.indigo
                      return (
                        <div
                          key={i}
                          className="overflow-hidden bg-white rounded-[10px] px-3 py-2.5 border border-slate-100 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                          style={{ borderLeft: `3px solid ${preset.border}` }}
                        >
                          <div className="truncate t-heading-sm" style={{ color: preset.tc }}>{c.course}</div>
                          <div className="truncate mt-0.5 t-xs font-medium t-secondary">
                            {c.formattedTime.split(' ')[0]} {c.formattedTime.includes('PM') ? 'PM' : 'AM'}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity card */}
        <div className="w-full lg:w-[320px] shrink-0 card p-6 flex flex-col gap-5">
          <h3 className="t-heading-lg t-primary">Recent Activity</h3>
          <div className="flex flex-col gap-5 flex-1">
            {activityFeed.map((a, i) => (
              <div key={i} className="flex gap-3 items-start">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center p-2.5 shrink-0"
                  style={{ background: a.bg }}
                >
                  <a.Ic />
                </div>
                <div className="flex-1 self-center">
                  <p className="t-md t-primary m-0">
                    <span className="font-bold">{a.bold}</span>{a.rest}
                  </p>
                  <span className="t-sm t-secondary">{a.time}</span>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => window.location.href = '/workspace'}
            className="w-full pt-3 pb-1 text-center border-t border-slate-100 t-secondary font-medium text-sm hover:text-brand transition-colors"
          >
            View all activity
          </button>
        </div>
      </div>

    </PageLayout>
  )
}
