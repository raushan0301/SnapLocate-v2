import { useState, useEffect, useMemo, useCallback } from 'react'
import PageLayout from '../../components/PageLayout'
import { useAuth } from '../../context/AuthContext'
import api from '../../lib/api'

const C = {
  indigo: { bg: '#e0e7ff', border: '#4f46e5', tc: '#4f46e5', sc: '#6366f1' },
  orange: { bg: '#fff7ed', border: '#f97316', tc: '#ea580c', sc: '#f97316' },
  green:  { bg: '#f0fdf4', border: '#22c55e', tc: '#16a34a', sc: '#22c55e' },
  red:    { bg: '#fee2e2', border: '#ef4444', tc: '#dc2626', sc: '#ef4444' },
  violet: { bg: '#f5f3ff', border: '#7c3aed', tc: '#7c3aed', sc: '#a78bfa' },
  amber:  { bg: '#fffbeb', border: '#f59e0b', tc: '#d97706', sc: '#f59e0b' },
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

export default function FacultyDashboard() {
  const { user } = useAuth()
  const firstName = (user?.full_name || 'Professor').split(' ')[0]
  const [now, setNow] = useState(new Date())
  const [allTimetable, setAllTimetable] = useState([])
  const [requests, setRequests] = useState([])
  const [stats, setStats] = useState({ pendingGrades: 0 })
  const [viewMode, setViewMode] = useState('day')
  const [notifications, setNotifications] = useState([])

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, profileRes, reqRes, notifRes] = await Promise.all([
        api.get('/api/faculty/dashboard/stats'),
        api.get('/api/faculty/me/profile'),
        api.get('/api/requests/faculty'),
        api.get('/api/notifications')
      ])
      if (profileRes.success && profileRes.data) setAllTimetable(profileRes.data.timetable || [])
      if (statsRes.success) setStats({ pendingGrades: statsRes.stats.pendingGrades || 0 })
      if (reqRes.success) setRequests(reqRes.data.filter(r => r.status === 'pending'))
      if (notifRes.success) setNotifications(notifRes.data || [])
    } catch (err) {
      console.error('Faculty Dashboard fetch error:', err)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const id = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(id)
  }, [fetchData])

  const handleRequest = async (id, action) => {
    try {
      await api.patch(`/api/requests/${id}/${action}`)
      setRequests(r => r.filter(req => req.id !== id))
    } catch {
      setRequests(r => r.filter(req => req.id !== id))
    }
  }

  const processedSchedule = useMemo(() => {
    const today = now.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()
    const raw = allTimetable.filter(s => s.day?.toUpperCase() === today)
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
  }, [allTimetable, now])

  const upNext = processedSchedule.find(s => s.status === 'upcoming' || s.status === 'ongoing')

  const weeklySchedule = useMemo(() => {
    const sortedDays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']
    const grouped = {}
    sortedDays.forEach(day => {
      grouped[day] = allTimetable.filter(s => s.day?.toUpperCase() === day)
        .map(s => ({ ...s, formattedTime: fmt12(s.time_slot || s.time) }))
        .sort((a, b) => (a.time_slot || a.time || '').localeCompare(b.time_slot || b.time || ''))
    })
    return grouped
  }, [allTimetable])

  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening'
  const dateStr  = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const timeStr  = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  const dayStats = allTimetable.filter(s => s.day?.toUpperCase() === now.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()).length

  return (
    <PageLayout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center w-full gap-4">
        <div>
          <h1 className="text-[30px] font-bold t-primary m-0">{greeting}, {firstName} 👋</h1>
          <p className="text-[16px] t-muted mt-0.5">You have {dayStats} sessions and {requests.length} requests today.</p>
        </div>
        <div className="flex gap-2 items-center shrink-0">
          <div className="bg-black/[0.12] rounded-2xl px-3 py-1.5">
            <span className="text-[17px] font-normal text-black leading-[22px] font-[system-ui]">{dateStr}</span>
          </div>
          <div className="bg-black/[0.12] rounded-2xl px-3 py-1.5">
            <span className="text-[17px] font-normal text-black leading-[22px] font-[system-ui]">{timeStr}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-5 items-stretch w-full mt-2">
        <div className="flex-1 relative overflow-hidden p-6 min-h-[180px] bg-white border border-slate-100 rounded-3xl shadow-sm flex flex-col">
          <img src="/images/img_overlay.png" alt="" className="hidden sm:block absolute top-0 right-0 w-24 h-24 pointer-events-none rounded-tr-3xl" />
          {upNext ? (
            <div className="relative z-10 flex flex-col gap-4 flex-1">
              <div className="flex justify-between items-center">
                <div className="flex gap-2 items-center bg-indigo-50 rounded-[12px] px-3 py-[7px]">
                  <div className={`w-2 h-2 rounded-full ${upNext.status === 'ongoing' ? 'bg-emerald-500' : 'bg-brand'}`} />
                  <span className={`text-[12px] font-bold uppercase tracking-[0.04em] ${upNext.status === 'ongoing' ? 'text-emerald-600' : 'text-brand'}`}>
                    {upNext.status === 'ongoing' ? 'Teaching Now' : 'Next Session'}
                  </span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div className="flex flex-col gap-2 w-full sm:w-[48%]">
                  <div className="flex items-end gap-1">
                    <span className="text-[42px] font-bold t-primary leading-none">{upNext.formattedTime.split('-')[0].trim().replace(/[AP]M/, '')}</span>
                    <span className="text-[18px] font-medium t-muted pb-1.5">{upNext.formattedTime.includes('PM') ? 'PM' : 'AM'}</span>
                  </div>
                  <h2 className="text-[20px] font-bold t-primary m-0 whitespace-nowrap overflow-hidden text-ellipsis">{upNext.course}</h2>
                  <p className="text-[15px] t-muted m-0">{upNext.type} • {upNext.location || 'Lecture Hall'}</p>
                </div>
                <div className="flex gap-2 items-center bg-slate-50 border border-slate-100 rounded-2xl p-3 flex-1 w-full sm:w-auto">
                  <div className="w-10 h-10 bg-white rounded-2xl shadow-sm flex items-center justify-center p-2 shrink-0">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="7" r="4" stroke="#4f46e5" strokeWidth="1.5"/><path d="M4 17c0-3 3-5 6-5s6 2 6 5" stroke="#4f46e5" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  </div>
                  <div className="flex-1">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.05em]">Attendance</div>
                    <div className="text-[14px] font-bold t-primary mt-1">Live Session Tracked</div>
                  </div>
                  <img src="/images/img_arrow_right.svg" alt="" className="w-5 h-3 shrink-0" />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 h-full text-center px-2.5 text-[16px] font-medium text-slate-400">
              <div>No more sessions today.</div>
              <div>Time for research! 📚</div>
            </div>
          )}
        </div>

        <div className="w-full lg:w-[320px] shrink-0 p-6 flex flex-col bg-white border border-slate-100 rounded-3xl shadow-sm">
          <div className="flex justify-between items-center mb-5">
            <span className="text-[18px] font-bold t-primary">Student Requests</span>
            <span onClick={() => window.location.href = '/faculty/requests'} className="text-[14px] font-semibold text-brand cursor-pointer">View All</span>
          </div>
          <div className="flex flex-col gap-4">
            {requests.length > 0 ? requests.slice(0, 3).map((r, i) => (
              <div key={i} className="flex gap-3 items-center p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-[12px] shrink-0" style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)' }}>
                  {(r.users?.full_name || 'S').charAt(0)}
                </div>
                <div className="flex-1 min-w-0 overflow-hidden">
                  <div className="truncate text-[13px] font-bold t-primary">{r.users?.full_name}</div>
                  <div className="truncate mt-0.5 text-[11px] t-muted">{r.type}</div>
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => handleRequest(r.id, 'accept')} className="w-6 h-6 rounded-full bg-green-100 border-0 text-green-600 cursor-pointer flex items-center justify-center text-[12px]">✓</button>
                  <button onClick={() => handleRequest(r.id, 'reject')} className="w-6 h-6 rounded-full bg-red-100 border-0 text-red-600 cursor-pointer flex items-center justify-center text-[12px]">✕</button>
                </div>
              </div>
            )) : (
              <div className="text-center text-[13px] t-muted py-5">No pending requests! 🎉</div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-5 items-stretch w-full mt-2">
        <div className="flex-1 p-6 flex flex-col gap-5 bg-white border border-slate-100 rounded-3xl shadow-sm">
          <div className="flex justify-between items-center">
            <span className="text-[18px] font-bold t-primary">{viewMode === 'day' ? 'Teaching Schedule' : 'Weekly Overview'}</span>
            <div className="flex items-center bg-slate-100 rounded-xl p-1">
              <button onClick={() => setViewMode('day')}
                className={`text-[12px] font-bold rounded-[7px] px-3.5 py-1 border-0 cursor-pointer ${viewMode === 'day' ? 'bg-white text-slate-900 shadow-[0_1px_2px_rgba(0,0,0,0.08)]' : 'bg-transparent text-slate-500'}`}>Day</button>
              <button onClick={() => setViewMode('week')}
                className={`text-[12px] font-bold rounded-[7px] px-3.5 py-1 border-0 cursor-pointer ${viewMode === 'week' ? 'bg-white text-slate-900 shadow-[0_1px_2px_rgba(0,0,0,0.08)]' : 'bg-transparent text-slate-500'}`}>Week</button>
            </div>
          </div>

          {viewMode === 'day' ? (
            <div className="flex flex-col relative pl-2 sm:pl-4 mt-2">
              <div className="absolute top-2 bottom-2 left-[13px] sm:left-[21px] w-px bg-slate-200" />
              <div className="flex flex-col gap-6 w-full">
                {processedSchedule.length === 0 ? (
                  <div className="py-10 text-center text-slate-400 font-medium">No sessions scheduled for today.</div>
                ) : (
                  processedSchedule.map((s, i) => (
                    <div key={i} className="flex gap-4 sm:gap-6 relative z-10">
                      <div className="flex flex-col items-center mt-1 shrink-0 w-3">
                        <div className={`w-3 h-3 rounded-full border-2 border-white ring-2 ${s.status === 'ongoing' ? 'bg-indigo-600 ring-indigo-200' : 'bg-slate-300 ring-transparent'}`} />
                      </div>
                      <div className="flex-1 flex flex-col gap-2 min-w-0">
                        <div className="flex justify-between items-center">
                          <span className={`text-[13px] font-bold transition-all ${s.status === 'ongoing' ? 'text-brand' : 'text-slate-500'}`}>{s.formattedTime}</span>
                          <span className={`text-[12px] font-medium px-2.5 py-[2px] rounded-[8px] transition-all ${s.status === 'ongoing' ? 'text-brand bg-indigo-50' : 'text-slate-600 bg-slate-100'}`}>{s.type}</span>
                        </div>
                        <div className={`overflow-hidden px-4 py-3.5 rounded-[14px] border transition-all ${s.status === 'ongoing' ? 'bg-indigo-50/50 border-indigo-200' : 'bg-white border-slate-100'}`}>
                          <div className="truncate text-[15px] font-bold t-primary">{s.course}</div>
                          <div className="truncate mt-1 text-[13px] t-muted">{s.location || 'Lecture Hall'} • {s.status.toUpperCase()}</div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Object.entries(weeklySchedule).map(([day, classes]) => (
                <div key={day} className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <div className="text-slate-500 font-bold text-xs uppercase tracking-wider mb-3 flex justify-between items-center">
                    {day}
                    {classes.length > 0 && <span className="bg-indigo-100 text-brand px-1.5 py-0.5 rounded-md text-[10px]">{classes.length}</span>}
                  </div>
                  <div className="flex flex-col gap-2.5">
                    {classes.length === 0 ? <div className="text-slate-400 italic text-xs py-2">No sessions</div> :
                      classes.map((c, i) => {
                        const preset = C[c.color_preset] || C.indigo
                        return (
                          <div key={i} className="overflow-hidden bg-white px-3 py-2.5 rounded-[12px] border border-slate-100 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                            style={{ borderLeft: `3px solid ${preset.border}` }}>
                            <div className="truncate text-[13px] font-bold" style={{ color: preset.tc }}>{c.course}</div>
                            <div className="truncate mt-0.5 text-[11px] font-medium text-slate-500">{c.formattedTime.split(' ')[0]} {c.formattedTime.includes('PM') ? 'PM' : 'AM'}</div>
                          </div>
                        )
                      })
                    }
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="w-full lg:w-[320px] shrink-0 p-6 flex flex-col gap-5 bg-white border border-slate-100 rounded-3xl shadow-sm">
          <h3 className="text-[18px] font-bold t-primary m-0">Faculty Activity</h3>
          <div className="flex flex-col gap-5 flex-1">
            {notifications.length > 0 ? notifications.slice(0, 4).map((n, i) => (
              <div key={i} className="flex gap-3 items-start">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center p-2.5 shrink-0 ${n.is_read ? 'bg-slate-100' : 'bg-indigo-100'}`}>
                  <svg viewBox="0 0 20 20" fill="none" className="w-full h-full">
                    <path d="M10 3.5c4 0 6.5 2 6.5 5s-2.5 5-5 5H8l-3.5 3.5V13.5C3 12 4 10.5 4 8.5c0-3 3-5 6-5z" stroke={n.is_read ? '#64748b' : '#6366f1'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="flex-1 self-center">
                  <p className="text-[13px] t-primary m-0">
                    <span className="font-bold">{n.title}:</span> {n.message}
                  </p>
                  <span className="text-[11px] t-muted">
                    {new Date(n.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            )) : (
              <div className="text-center text-[13px] t-muted py-5">No recent activity.</div>
            )}
          </div>
          <button onClick={() => window.location.href = '/faculty/workspace'} className="w-full pt-3 pb-1 text-center border-t border-slate-100 text-slate-500 font-medium text-sm hover:text-brand transition-colors">Go to Workspace</button>
        </div>
      </div>
    </PageLayout>
  )
}
