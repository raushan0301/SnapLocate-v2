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
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', width:'100%' }}>
        <div>
          <h1 style={pjs(30, 700, '38px', '#0f172a')}>{greeting}, {firstName} 👋</h1>
          <p style={{ ...pjs(16, 400, '22px', '#64748b'), marginTop: 2 }}>Here is what is happening on campus today.</p>
        </div>
        <div style={{ display:'flex', gap: 6, alignItems:'center', flexShrink: 0 }}>
          <div style={{ background:'rgba(118,118,128,0.12)', borderRadius: 16, padding:'6px 12px' }}>
            <span style={{ fontSize:17, fontWeight:400, lineHeight:'22px', color:'#000', fontFamily:'system-ui' }}>{dateStr}</span>
          </div>
          <div style={{ background:'rgba(118,118,128,0.12)', borderRadius: 16, padding:'6px 12px' }}>
            <span style={{ fontSize:17, fontWeight:400, lineHeight:'22px', color:'#000', fontFamily:'system-ui' }}>{timeStr}</span>
          </div>
        </div>
      </div>

      <div style={{ display:'flex', gap: 20, alignItems:'stretch', width:'100%' }}>
        <div style={{ ...card, flex: 1, position:'relative', overflow:'hidden', padding: 24, minHeight: 180 }}>
          <img src="/images/img_overlay.png" alt="" style={{ position:'absolute', top:0, right:0, width:96, height:96, pointerEvents:'none', borderRadius:'0 24px 0 0' }} />
          {upNext ? (
            <div style={{ position:'relative', zIndex:1, display:'flex', flexDirection:'column', gap: 16 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div style={{ display:'flex', gap: 8, alignItems:'center', background:'#eef2ff', borderRadius:12, padding:'7px 12px' }}>
                  <div style={{ width:8, height:8, background:upNext.status==='ongoing'?'#10b981':'#4f46e5', borderRadius:4 }} />
                  <span style={{ ...pjs(12, 700, '16px', upNext.status==='ongoing'?'#059669':'#4f46e5'), textTransform:'uppercase', letterSpacing:'0.04em' }}>{upNext.status==='ongoing'?'In Progress':'Up Next'}</span>
                </div>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap: 16 }}>
                <div style={{ display:'flex', flexDirection:'column', gap: 10, width:'48%' }}>
                  <div style={{ display:'flex', alignItems:'flex-end', gap: 3 }}>
                    <span style={pjs(42, 700, '1', '#0f172a')}>{upNext.formattedTime.split('-')[0].trim().replace(/[AP]M/, '')}</span>
                    <span style={{ ...pjs(18, 500, '1', '#64748b'), paddingBottom: 6 }}>{upNext.formattedTime.includes('PM') ? 'PM' : 'AM'}</span>
                  </div>
                  <h2 style={{ ...pjs(20, 700, '26px', '#0f172a'), whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{upNext.course}</h2>
                  <p  style={pjs(15, 400, '21px', '#64748b')}>{upNext.type}</p>
                </div>
                <div style={{ display:'flex', gap: 10, alignItems:'center', background:'#f8fafc', border:'1px solid #f1f5f9', borderRadius: 16, padding:'14px 16px', flex: 1 }}>
                  <div style={{ width:38, height:38, background:'#fff', borderRadius:18, boxShadow:'0 1px 3px rgba(0,0,0,0.08)', display:'flex', alignItems:'center', justifyContent:'center', padding: 9, flexShrink: 0 }}>
                    <img src="/images/img_background_shadow.svg" alt="" style={{ width:'100%', height:'100%' }} />
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ ...inter(11, 600, '15px', '#64748b'), textTransform:'uppercase', letterSpacing:'0.05em' }}>Location</div>
                    <div style={{ ...pjs(14, 700, '18px', '#0f172a'), marginTop: 4 }}>{upNext.location || 'N/A'}</div>
                  </div>
                  <img src="/images/img_arrow_right.svg" alt="" style={{ width:22, height:14, flexShrink:0 }} />
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', ...pjs(16, 500, '24px', '#94a3b8') }}>No more classes today. Catch up on rest! 💤</div>
          )}
        </div>

        <div style={{ ...card, width: 300, flexShrink: 0, padding: 24, display:'flex', flexDirection:'column' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 20 }}>
            <span style={pjs(18, 700, '23px', '#0f172a')}>Tasks Hub</span>
            <span onClick={() => window.location.href='/workspace'} style={{ ...inter(14, 600, '20px', '#4f46e5'), cursor:'pointer' }}>View All</span>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap: 20 }}>
            {pendingTasks.length > 0 ? pendingTasks.map((t, i) => (
              <div key={i} style={{ display:'flex', gap: 12, alignItems:'flex-start', padding:'0 4px' }}>
                <div style={{ width:18, height:18, borderRadius:6, border:'2px solid #4f46e5', flexShrink:0, marginTop:2 }} />
                <div style={{ flex:1 }}>
                  <div style={{ ...pjs(14, 600, '18px', '#0f172a'), whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{t.label}</div>
                  <div style={{ ...pjs(12, 400, '16px', '#64748b'), marginTop:2 }}>{t.sub || 'Pending task'}</div>
                </div>
              </div>
            )) : (
              <div style={{ textAlign:'center', ...pjs(13, 400, '20px', '#94a3b8'), padding: 20 }}>No pending tasks! 🎉</div>
            )}
          </div>
        </div>
      </div>

      <div style={{ display:'flex', gap: 20, alignItems:'stretch', width:'100%' }}>
        <div style={{ ...card, flex: 1, padding: 24, display:'flex', flexDirection:'column', gap: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={pjs(18, 700, '23px', '#0f172a')}>{viewMode === 'day' ? "Today's Schedule" : "Weekly Overview"}</span>
            <div style={{ display: 'flex', alignItems: 'center', background: '#f1f5f9', borderRadius: 10, padding: 3 }}>
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
            <div style={{ display: 'flex', gap: 0, paddingLeft: 6 }}>
              <div style={{ position: 'relative', width: 16, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ position: 'absolute', top: 6, bottom: 6, left: '50%', width: 1, background: '#e2e8f0', transform: 'translateX(-50%)' }} />
                {processedSchedule.map((s, i) => (
                  <div key={i} style={{ width: s.status === 'ongoing' ? 16 : 12, height: s.status === 'ongoing' ? 16 : 12, borderRadius: '50%', background: s.status === 'ongoing' ? '#4f46e5' : '#cbd5e1', border: s.status === 'ongoing' ? '4px solid #fff' : '2px solid #fff', zIndex: 1, marginTop: i === 0 ? 6 : 100 }} />
                ))}
              </div>
              <div style={{ flex: 1, paddingLeft: 48, display: 'flex', flexDirection: 'column', gap: 20 }}>
                {processedSchedule.length === 0 ? (
                  <div style={{ padding: 40, textAlign: 'center', ...pjs(14, 500, '20px', '#94a3b8') }}>No classes scheduled for today.</div>
                ) : (
                  processedSchedule.map((s, i) => (
                    <div key={i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ ...inter(13, 700, '17px', s.status === 'ongoing' ? '#4f46e5' : '#64748b'), transition: 'all 0.3s' }}>{s.formattedTime}</span>
                        <span style={{ ...pjs(12, 500, '16px', s.status === 'ongoing' ? '#4f46e5' : '#475569'), background: s.status === 'ongoing' ? '#eef2ff' : '#f1f5f9', borderRadius: 8, padding: '2px 10px' }}>{s.type}</span>
                      </div>
                      <div style={{ background: s.status === 'ongoing' ? 'rgba(238,242,255,0.5)' : '#ffffff', border: s.status === 'ongoing' ? '1px solid #c7d2fe' : '1px solid #f1f5f9', borderRadius: 14, padding: '14px 16px', transition: 'all 0.3s' }}>
                        <div style={pjs(15, 700, '21px', '#0f172a')}>{s.course}</div>
                        <div style={{ ...pjs(13, 400, '18px', '#64748b'), marginTop: 3 }}>{s.location || 'No Location'} • {s.status.toUpperCase()}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
              {Object.entries(weeklySchedule).map(([day, classes]) => (
                <div key={day} style={{ background: '#f8fafc', borderRadius: 16, padding: 16, border: '1px solid #f1f5f9' }}>
                  <div style={{ ...inter(12, 700, '16px', '#64748b'), textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
                    {day}
                    {classes.length > 0 && <span style={{ background: '#e0e7ff', color: '#4f46e5', padding: '1px 6px', borderRadius: 6, fontSize: 10 }}>{classes.length}</span>}
                  </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {classes.length === 0 ? (
                        <div style={{ ...pjs(11, 400, '16px', '#94a3b8'), fontStyle: 'italic', padding: '8px 0' }}>Empty</div>
                      ) : (
                        classes.map((c, i) => {
                          const preset = C[c.color_preset] || C.indigo
                          return (
                            <div key={i} style={{ 
                              background: '#fff', padding: '10px 12px', borderRadius: 10, 
                              border: '1px solid #f1f5f9', borderLeft: `3px solid ${preset.border}`,
                              boxShadow: '0 1px 2px rgba(0,0,0,0.02)' 
                            }}>
                              <div style={{ ...pjs(13, 700, '18px', preset.tc), whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.course}</div>
                              <div style={{ ...pjs(11, 500, '16px', '#64748b'), marginTop: 2 }}>{c.formattedTime.split(' ')[0]} {c.formattedTime.includes('PM') ? 'PM' : 'AM'}</div>
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

        <div style={{ ...card, width: 300, flexShrink:0, padding: 28, display:'flex', flexDirection:'column', gap: 20 }}>
          <h3 style={pjs(18, 700, '23px', '#0f172a')}>Recent Activity</h3>
          <div style={{ display:'flex', flexDirection:'column', gap: 20, flex:1 }}>
            {activityFeed.map((a, i) => (
              <div key={i} style={{ display:'flex', gap: 14, alignItems:'flex-start' }}>
                <div style={{ width:40, height:40, borderRadius:20, background:a.bg, display:'flex', alignItems:'center', justifyContent:'center', padding: 10, flexShrink:0 }}><a.Ic /></div>
                <div style={{ flex:1, alignSelf:'center' }}>
                  <p style={{ ...pjs(13, 400, '20px', '#0f172a'), margin:0 }}><span style={{ fontWeight:700 }}>{a.bold}</span>{a.rest}</p>
                  <span style={pjs(12, 400, '16px', '#64748b')}>{a.time}</span>
                </div>
              </div>
            ))}
          </div>
          <button style={{ ...pjs(14, 500, '18px', '#64748b'), width:'100%', padding:'10px 0 2px', background:'transparent', border:'none', borderTop:'1px solid #f1f5f9', cursor:'pointer', textAlign:'center' }}>View all activity</button>
        </div>
      </div>
    </PageLayout>
  )
}
