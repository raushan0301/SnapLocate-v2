import { useState, useEffect, useMemo } from 'react'
import PageLayout from '../../components/PageLayout'
import { useAuth } from '../../context/AuthContext'
import api from '../../lib/api'

/* ── Activity Icons ─────────────────────────────────────────────────── */
const GradeIcon    = () => (<svg viewBox="0 0 20 20" fill="none" className="w-full h-full"><circle cx="10" cy="10" r="8" stroke="#10b981" strokeWidth="1.5"/><path d="M6 10.5l3 3 5-5" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>)
const PhysicsIcon  = () => (<svg viewBox="0 0 20 20" fill="none" className="w-full h-full"><rect x="3" y="2" width="14" height="16" rx="2" stroke="#6366f1" strokeWidth="1.5"/><path d="M7 7h6M7 10h6M7 13h3" stroke="#6366f1" strokeWidth="1.3" strokeLinecap="round"/></svg>)
const AlertIcon    = () => (<svg viewBox="0 0 20 20" fill="none" className="w-full h-full"><path d="M4 8.5C4 5.5 5.8 3.5 10 3.5c3 0 6 2 6 5s-2.5 5-5 5H8l-3.5 3.5V13.5C3 12 4 10.5 4 8.5z" stroke="#f97316" strokeWidth="1.3" fill="none"/></svg>)
const UploadIcon   = () => (<svg viewBox="0 0 20 20" fill="none" className="w-full h-full"><path d="M10 3v10M6 9l4-6 4 6" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M4 16h12" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round"/></svg>)

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

const pjs = (size, weight, lh, color) => ({
  fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: size, fontWeight: weight, lineHeight: lh, color,
})
const inter = (size, weight, lh, color) => ({
  fontFamily: "'Inter', sans-serif", fontSize: size, fontWeight: weight, lineHeight: lh, color,
})
const card = { background:'#ffffff', border:'1px solid #f1f5f9', borderRadius: 24, boxShadow:'0px 2px 8px rgba(0,0,0,0.04)' }
const C = {
  indigo: { bg: '#e0e7ff', border: '#4f46e5', tc: '#4f46e5', sc: '#6366f1' },
  orange: { bg: '#fff7ed', border: '#f97316', tc: '#ea580c', sc: '#f97316' },
  green: { bg: '#f0fdf4', border: '#22c55e', tc: '#16a34a', sc: '#22c55e' },
  red: { bg: '#fee2e2', border: '#ef4444', tc: '#dc2626', sc: '#ef4444' },
  violet: { bg: '#f5f3ff', border: '#7c3aed', tc: '#7c3aed', sc: '#a78bfa' },
  amber: { bg: '#fffbeb', border: '#f59e0b', tc: '#d97706', sc: '#f59e0b' },
}

export default function StudentDashboard() {
  const { user } = useAuth()
  const firstName = (user?.full_name || 'Student').split(' ')[0]
  const [now, setNow] = useState(new Date())
  const [timetable, setTimetable] = useState([])
  const [tasks, setTasks] = useState([])
  const [activityFeed, setActivityFeed] = useState([])
  const [viewMode, setViewMode] = useState('day')

  const fetchData = async () => {
    try {
      const [ttRes, taskRes, notesRes, requestsRes] = await Promise.all([
        api.get('/api/workspace/timetable'),
        api.get('/api/workspace/tasks'),
        api.get('/api/workspace/notes'),
        api.get('/api/requests')
      ])
      
      if(ttRes.success) setTimetable(ttRes.data || [])
      if(taskRes.success) setTasks(taskRes.data || [])
      
      // Build a dynamic activity feed
      const recent = []
      if (notesRes.data?.length) {
        const topNote = notesRes.data[0]
        recent.push({ bg:'#f1f5f9', Ic: UploadIcon, bold:'New Note:', rest:` ${topNote.title}`, time: 'Recently' })
      }
      if (requestsRes.data?.length) {
        const topReq = requestsRes.data[0]
        const statusColor = topReq.status === 'accepted' ? '#d1fae5' : topReq.status === 'rejected' ? '#fee2e2' : '#ffedd5'
        recent.push({ bg:statusColor, Ic: AlertIcon, bold:'Request Update:', rest:` ${topReq.type} is ${topReq.status}`, time: 'Recently' })
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

      return {
        ...s,
        formattedTime: fmt12(timeStr),
        startTime: start,
        startMins,
        status
      }
    }).sort((a,b) => a.startMins - b.startMins)
  }, [timetable, now])

  const weeklySchedule = useMemo(() => {
    const sortedDays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']
    const grouped = {}
    
    sortedDays.forEach(day => {
      grouped[day] = timetable
        .filter(s => s.day?.toUpperCase() === day)
        .map(s => ({ ...s, formattedTime: fmt12(s.time_slot || s.time) }))
        .sort((a,b) => {
          const t1 = (a.time_slot || a.time || '00:00').split('-')[0]
          const t2 = (b.time_slot || b.time || '00:00').split('-')[0]
          return t1.localeCompare(t2)
        })
    })
    return grouped
  }, [timetable])

  const upNext = processedSchedule.find(s => s.status === 'upcoming' || s.status === 'ongoing')

  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening'
  const dateStr  = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const timeStr  = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

  return (
    <PageLayout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center w-full gap-4">
        <div>
          <h1 style={pjs(30, 700, '38px', '#0f172a')}>{greeting}, {firstName} 👋</h1>
          <p style={{ ...pjs(16, 400, '22px', '#64748b'), marginTop: 2 }}>Here is what is happening on campus today.</p>
        </div>
        <div className="flex gap-2 items-center shrink-0">
          <div style={{ background:'rgba(118,118,128,0.12)', borderRadius: 16, padding:'6px 12px' }}>
            <span style={{ fontSize:17, fontWeight:400, lineHeight:'22px', color:'#000', fontFamily:'system-ui' }}>{dateStr}</span>
          </div>
          <div style={{ background:'rgba(118,118,128,0.12)', borderRadius: 16, padding:'6px 12px' }}>
            <span style={{ fontSize:17, fontWeight:400, lineHeight:'22px', color:'#000', fontFamily:'system-ui' }}>{timeStr}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-5 items-stretch w-full mt-2">
        <div className="flex-1 relative overflow-hidden bg-white border border-slate-100 rounded-3xl p-6 min-h-[180px] shadow-sm flex flex-col">
          <img src="/images/img_overlay.png" alt="" className="hidden sm:block absolute top-0 right-0 w-24 h-24 pointer-events-none rounded-tr-3xl" />
          {upNext ? (
            <div style={{ position:'relative', zIndex:1, display:'flex', flexDirection:'column', gap: 16, flex: 1 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div style={{ display:'flex', gap: 8, alignItems:'center', background:'#eef2ff', borderRadius:12, padding:'7px 12px' }}>
                  <div style={{ width:8, height:8, background:upNext.status==='ongoing'?'#10b981':'#4f46e5', borderRadius:4 }} />
                  <span style={{ ...pjs(12, 700, '16px', upNext.status==='ongoing'?'#059669':'#4f46e5'), textTransform:'uppercase', letterSpacing:'0.04em' }}>{upNext.status==='ongoing'?'In Progress':'Up Next'}</span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div className="flex flex-col gap-2 w-full sm:w-[48%]">
                  <div className="flex items-end gap-1">
                    <span style={pjs(42, 700, '1', '#0f172a')}>{upNext.formattedTime.split('-')[0].trim().replace(/[AP]M/, '')}</span>
                    <span style={{ ...pjs(18, 500, '1', '#64748b'), paddingBottom: 6 }}>{upNext.formattedTime.includes('PM') ? 'PM' : 'AM'}</span>
                  </div>
                  <h2 style={{ ...pjs(20, 700, '26px', '#0f172a'), whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{upNext.course}</h2>
                  <p  style={pjs(15, 400, '21px', '#64748b')}>{upNext.type}</p>
                </div>
                <div className="flex gap-2 items-center bg-slate-50 border border-slate-100 rounded-2xl p-3 flex-1 w-full sm:w-auto">
                  <div className="w-10 h-10 bg-white rounded-2xl shadow-sm flex items-center justify-center p-2 shrink-0">
                    <img src="/images/img_background_shadow.svg" alt="" style={{ width:'100%', height:'100%' }} />
                  </div>
                  <div className="flex-1">
                    <div style={{ ...inter(11, 600, '15px', '#64748b'), textTransform:'uppercase', letterSpacing:'0.05em' }}>Location</div>
                    <div style={{ ...pjs(14, 700, '18px', '#0f172a'), marginTop: 4 }}>{upNext.location || 'N/A'}</div>
                  </div>
                  <img src="/images/img_arrow_right.svg" alt="" className="w-5 h-3 shrink-0" />
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', flex:1, height:'100%', textAlign:'center', padding: '0 10px', ...pjs(16, 500, '24px', '#94a3b8') }}>
              <div>No more classes today.</div>
              <div>Catch up on rest! 💤</div>
            </div>
          )}
        </div>

        <div className="w-full lg:w-[320px] shrink-0 bg-white border border-slate-100 rounded-3xl p-6 flex flex-col shadow-sm">
          <div className="flex justify-between items-center mb-5">
            <span style={pjs(18, 700, '23px', '#0f172a')}>Tasks Hub</span>
            <span onClick={() => window.location.href='/workspace'} style={{ ...inter(14, 600, '20px', '#4f46e5'), cursor:'pointer' }}>View All</span>
          </div>
          <div className="flex flex-col gap-4">
            {pendingTasks.length > 0 ? pendingTasks.map((t, i) => (
              <div key={t.id || i} style={{ display:'flex', gap: 12, alignItems:'flex-start', padding:'0 4px', transition: 'all 0.2s', opacity: t.is_done ? 0.5 : 1 }}>
                <div 
                  onClick={() => toggleTask(t.id, t.is_done)}
                  style={{ 
                    width:18, height:18, borderRadius:6, border: t.is_done ? 'none' : '2px solid #4f46e5', 
                    background: t.is_done ? '#4f46e5' : 'transparent', flexShrink:0, marginTop:2, 
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s'
                  }}
                >
                  {t.is_done && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                </div>
                <div style={{ flex:1 }}>
                  <div className="truncate" style={{ ...pjs(14, 600, '18px', t.is_done ? '#94a3b8' : '#0f172a'), textDecoration: t.is_done ? 'line-through' : 'none', transition: 'all 0.2s' }}>{t.label}</div>
                  <div className="truncate mt-0.5" style={pjs(12, 400, '16px', '#64748b')}>{t.sub || 'Pending task'}</div>
                </div>
              </div>
            )) : (
              <div style={{ textAlign:'center', ...pjs(13, 400, '20px', '#94a3b8'), padding: 20 }}>No pending tasks! 🎉</div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-5 items-stretch w-full mt-2">
        <div className="flex-1 bg-white border border-slate-100 rounded-3xl p-6 flex flex-col gap-5 shadow-sm">
          <div className="flex justify-between items-center">
            <span style={pjs(18, 700, '23px', '#0f172a')}>{viewMode === 'day' ? "Today's Schedule" : "Weekly Overview"}</span>
            <div className="flex items-center bg-slate-100 rounded-xl p-1">
              <button 
                onClick={() => setViewMode('day')}
                style={{ 
                  ...pjs(12, 700, '16px', viewMode === 'day' ? '#0f172a' : '#64748b'), 
                  background: viewMode === 'day' ? '#ffffff' : 'transparent', 
                  borderRadius: 7, padding: '4px 14px', border: 'none', cursor: 'pointer', 
                  boxShadow: viewMode === 'day' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none' 
                }}
              >
                Day
              </button>
              <button 
                onClick={() => setViewMode('week')}
                style={{ 
                  ...pjs(12, 700, '16px', viewMode === 'week' ? '#0f172a' : '#64748b'), 
                  background: viewMode === 'week' ? '#ffffff' : 'transparent', 
                  borderRadius: 7, padding: '4px 14px', border: 'none', cursor: 'pointer',
                  boxShadow: viewMode === 'week' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none'
                }}
              >
                Week
              </button>
            </div>
          </div>

          {viewMode === 'day' ? (
            <div className="flex flex-col relative pl-2 sm:pl-4 mt-2">
              <div className="absolute top-2 bottom-2 left-[13px] sm:left-[21px] w-px bg-slate-200" />
              <div className="flex flex-col gap-6 w-full">
                {processedSchedule.length === 0 ? (
                  <div className="py-10 text-center text-slate-400 font-medium">No classes scheduled for today.</div>
                ) : (
                  processedSchedule.map((s, i) => (
                    <div key={i} className="flex gap-4 sm:gap-6 relative z-10">
                      <div className="flex flex-col items-center mt-1 shrink-0 w-3">
                        <div className={`w-3 h-3 rounded-full border-2 border-white ring-2 ${s.status === 'ongoing' ? 'bg-indigo-600 ring-indigo-200' : 'bg-slate-300 ring-transparent'}`} />
                      </div>
                      <div className="flex-1 flex flex-col gap-2 min-w-0">
                        <div className="flex justify-between items-center">
                          <span style={{ ...inter(13, 700, '17px', s.status === 'ongoing' ? '#4f46e5' : '#64748b'), transition: 'all 0.3s' }}>{s.formattedTime}</span>
                          <span style={{ ...pjs(12, 500, '16px', s.status === 'ongoing' ? '#4f46e5' : '#475569'), background: s.status === 'ongoing' ? '#eef2ff' : '#f1f5f9', borderRadius: 8, padding: '2px 10px' }}>{s.type}</span>
                        </div>
                        <div className="overflow-hidden" style={{ background: s.status === 'ongoing' ? 'rgba(238,242,255,0.5)' : '#ffffff', border: s.status === 'ongoing' ? '1px solid #c7d2fe' : '1px solid #f1f5f9', borderRadius: 14, padding: '14px 16px', transition: 'all 0.3s' }}>
                          <div className="truncate" style={pjs(15, 700, '21px', '#0f172a')}>{s.course}</div>
                          <div className="truncate mt-1" style={pjs(13, 400, '18px', '#64748b')}>{s.location || 'No Location'} • {s.status.toUpperCase()}</div>
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
                  <div className="text-slate-500 font-bold text-xs uppercase tracking-wider mb-3 flex justify-between">
                    {day}
                    {classes.length > 0 && <span className="bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-md text-[10px]">{classes.length}</span>}
                  </div>
                    <div className="flex flex-col gap-2.5">
                      {classes.length === 0 ? (
                        <div className="text-slate-400 italic text-xs py-2">Empty</div>
                      ) : (
                        classes.map((c, i) => {
                          const preset = C[c.color_preset] || C.indigo
                          return (
                            <div className="overflow-hidden" key={i} style={{ 
                              background: '#fff', padding: '10px 12px', borderRadius: 10, 
                              border: '1px solid #f1f5f9', borderLeft: `3px solid ${preset.border}`,
                              boxShadow: '0 1px 2px rgba(0,0,0,0.02)' 
                            }}>
                              <div className="truncate" style={pjs(13, 700, '18px', preset.tc)}>{c.course}</div>
                              <div className="truncate mt-0.5" style={pjs(11, 500, '16px', '#64748b')}>{c.formattedTime.split(' ')[0]} {c.formattedTime.includes('PM') ? 'PM' : 'AM'}</div>
                            </div>
                          )
                        })
                      )}
                    </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="w-full lg:w-[320px] shrink-0 bg-white border border-slate-100 rounded-3xl p-6 flex flex-col gap-5 shadow-sm">
          <h3 style={pjs(18, 700, '23px', '#0f172a')}>Recent Activity</h3>
          <div className="flex flex-col gap-5 flex-1">
            {activityFeed.map((a, i) => (
              <div key={i} className="flex gap-3 items-start">
                <div style={{ width:40, height:40, borderRadius:20, background:a.bg, display:'flex', alignItems:'center', justifyContent:'center', padding: 10, flexShrink:0 }}><a.Ic /></div>
                <div className="flex-1 self-center">
                  <p style={{ ...pjs(13, 400, '20px', '#0f172a'), margin:0 }}><span style={{ fontWeight:700 }}>{a.bold}</span>{a.rest}</p>
                  <span style={pjs(12, 400, '16px', '#64748b')}>{a.time}</span>
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => window.location.href='/workspace'} className="w-full pt-3 pb-1 text-center border-t border-slate-100 text-slate-500 font-medium text-sm hover:text-indigo-600 transition-colors">View all activity</button>
        </div>
      </div>
    </PageLayout>
  )
}
