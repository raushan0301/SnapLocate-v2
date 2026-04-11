import { useState, useEffect } from 'react'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'
import { 
  Users, 
  UserCheck, 
  MapPin, 
  LifeBuoy, 
  Activity, 
  ShieldCheck, 
  ArrowRight, 
  Bell, 
  Settings, 
  Calendar,
  AlertCircle,
  FileText,
  MousePointerClick
} from 'lucide-react'

const pjs = (size, weight, lh, color) => ({
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  fontSize: size, fontWeight: weight, lineHeight: lh, color,
})

const inter = (size, weight, lh, color) => ({
  fontFamily: "'Inter', sans-serif",
  fontSize: size, fontWeight: weight, lineHeight: lh, color,
})

const Card = ({ title, value, subtitle, icon: Icon, color, trend }) => (
  <div style={{
    background: '#ffffff', borderRadius: 24, padding: '24px',
    border: '1px solid #f1f5f9', boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
    display: 'flex', flexDirection: 'column', gap: 16,
    transition: 'transform 0.2s',
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ 
        width: 48, height: 48, borderRadius: 14, background: `${color}15`, 
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: color 
      }}>
        <Icon size={24} />
      </div>
      {trend && (
        <div style={{ ...inter(12, 600, '16px', '#10b981'), background: '#f0fdf4', padding: '4px 8px', borderRadius: 8 }}>
          {trend}
        </div>
      )}
    </div>
    <div>
      <div style={pjs(14, 600, '20px', '#64748b')}>{title}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
        <div style={pjs(28, 800, '36px', '#0f172a')}>{value}</div>
      </div>
      <div style={{ ...pjs(12, 500, '18px', '#94a3b8'), marginTop: 4 }}>{subtitle}</div>
    </div>
  </div>
)

const QuickAction = ({ icon: Icon, label, sub, color, onClick }) => (
  <div 
    onClick={onClick}
    style={{
      display: 'flex', alignItems: 'center', gap: 14, padding: '16px',
      background: '#fff', border: '1px solid #f1f5f9', borderRadius: 16,
      cursor: 'pointer', transition: 'all 0.2s'
    }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.transform = 'translateY(-2px)' }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = '#f1f5f9'; e.currentTarget.style.transform = 'translateY(0)' }}
  >
    <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
      <Icon size={20} />
    </div>
    <div style={{ flex: 1 }}>
      <div style={pjs(14, 700, '20px', '#0f172a')}>{label}</div>
      <div style={pjs(12, 400, '16px', '#64748b')}>{sub}</div>
    </div>
    <ArrowRight size={16} color="#cbd5e1" />
  </div>
)

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [time, setTime] = useState(new Date())

  const fetchStats = async () => {
    try {
      const res = await api.get('/api/admin/stats')
      if (res.success) {
        setStats(res.data)
      }
    } catch (err) {
      console.error('Failed to load stats:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
    const timer = setInterval(() => setTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  const activityColors = {
    'Warning': { bg: '#fff1f2', text: '#e11d48', border: '#fda4af' },
    'Success': { bg: '#f0fdf4', text: '#16a34a', border: '#86efac' },
    'Info': { bg: '#eff6ff', text: '#2563eb', border: '#93c5fd' },
  }

  return (
    <PageLayout>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ padding: '4px 10px', background: '#4f46e510', borderRadius: 8, ...pjs(12, 700, '16px', '#4f46e5'), textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              System Administrator
            </span>
          </div>
          <h1 style={{ ...pjs(32, 800, '40px', '#0f172a'), marginTop: 8 }}>Management Overview</h1>
          <p style={{ ...pjs(16, 400, '24px', '#64748b'), marginTop: 2 }}>Welcome back. Monitor and control campus operations.</p>
        </div>
        
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div className="desktop-time-block" style={{ textAlign: 'right' }}>
            <div style={pjs(14, 700, '20px', '#0f172a')}>{time.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</div>
            <div style={pjs(12, 500, '18px', '#94a3b8')}>{time.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</div>
          </div>
          <button 
            onClick={fetchStats}
            style={{
              width: 44, height: 44, borderRadius: 12, border: '1px solid #e2e8f0', background: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b'
            }}
          >
            <Activity size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
        gap: 24, 
        marginBottom: 32 
      }}>
        <Card 
          title="Total Students" 
          value={loading ? '...' : stats?.total_students?.toLocaleString()} 
          subtitle="Registered this session" 
          icon={Users} 
          color="#4f46e5"
          trend="+12%"
        />
        <Card 
          title="Active Faculty" 
          value={loading ? '...' : stats?.total_faculty?.toLocaleString()} 
          subtitle="Verified instructors" 
          icon={UserCheck} 
          color="#0891b2"
          trend="+3"
        />
        <Card 
          title="Campus Entities" 
          value={loading ? '...' : stats?.total_classrooms?.toLocaleString()} 
          subtitle="Classrooms, labs & hubs" 
          icon={MapPin} 
          color="#d97706"
        />
        <Card 
          title="Open Tickets" 
          value={loading ? '...' : stats?.open_tickets?.toLocaleString()} 
          subtitle="Requiring attention" 
          icon={LifeBuoy} 
          color="#ef4444"
          trend={stats?.open_tickets > 5 ? "Action Needed" : null}
        />
      </div>

      <div style={{ display: 'flex', gap: 24, flexDirection: 'column', lg: { flexDirection: 'row' } }}>
        <style>{`
          .dashboard-flex { display: flex; gap: 24; flex-direction: column; }
          .desktop-time-block { display: none; }
          @media (min-width: 640px) { .desktop-time-block { display: block; } }
          @media (min-width: 1024px) { .dashboard-flex { flex-direction: row; } }
        `}</style>
        
        <div className="dashboard-flex" style={{ width: '100%' }}>
          {/* Recent Activity Section */}
          <div style={{ flex: 2, background: '#fff', borderRadius: 24, border: '1px solid #f1f5f9', padding: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#4f46e5' }} />
                <h2 style={pjs(18, 700, '24px', '#0f172a')}>Real-Time Campus Log</h2>
              </div>
              <button style={{ ...inter(13, 600, '18px', '#4f46e5'), background: 'transparent', border: 'none', cursor: 'pointer' }}>View All Logs</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {loading ? (
                <div style={{ padding: '60px 0', textAlign: 'center', ...pjs(14, 500, '20px', '#94a3b8') }}>Aggregating system logs...</div>
              ) : (
                (stats?.recent_activity || []).map((log, i) => {
                  const theme = activityColors[log.type] || activityColors.Info
                  return (
                    <div key={i} style={{ 
                      display: 'flex', gap: 20, padding: '20px 0', 
                      borderBottom: i === (stats.recent_activity.length - 1) ? 'none' : '1px solid #f8fafc' 
                    }}>
                      <div style={{ 
                        width: 80, flexShrink: 0, ...pjs(12, 700, '18px', '#94a3b8'), 
                        paddingTop: 4, textAlign: 'right', fontVariantNumeric: 'tabular-nums' 
                      }}>
                        {log.time}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                          <span style={pjs(15, 700, '20px', '#0f172a')}>{log.title}</span>
                          <span style={{ 
                            padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, 
                            background: theme.bg, color: theme.text, border: `1px solid ${theme.border}`,
                            textTransform: 'uppercase'
                          }}>
                            {log.type}
                          </span>
                        </div>
                        <p style={pjs(13, 400, '20px', '#64748b')}>{log.desc}</p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Sidebar Section */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Quick Actions Card */}
            <div style={{ background: '#fff', borderRadius: 24, border: '1px solid #f1f5f9', padding: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
              <h3 style={{ ...pjs(16, 700, '22px', '#0f172a'), marginBottom: 20 }}>Quick Actions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <QuickAction 
                  icon={ShieldCheck} label="Manage Faculty" sub="Approve or update staff" 
                  color="#4f46e5" onClick={() => window.location.href='/admin/faculty'} 
                />
                <QuickAction 
                  icon={Calendar} label="Update Schedule" sub="Manage campus timetable" 
                  color="#0891b2" onClick={() => window.location.href='/admin/calendar'} 
                />
                <QuickAction 
                  icon={Bell} label="Broadcast" sub="Send campus-wide alert" 
                  color="#f59e0b" onClick={() => {}} 
                />
                <QuickAction 
                  icon={FileText} label="Policy Updates" sub="Edit campus guidelines" 
                  color="#10b981" onClick={() => {}} 
                />
              </div>
            </div>

            {/* System Health / Status */}
            <div style={{ background: '#0f172a', borderRadius: 24, padding: 24, color: '#fff', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }} />
                  <span style={inter(12, 600, '16px', '#94a3b8')}>SYSTEM OPERATIONAL</span>
                </div>
                <h4 style={pjs(18, 700, '26px', '#fff')}>All Campus Services are Live</h4>
                <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span>Database Performance</span>
                    <span style={{ color: '#10b981' }}>99.9%</span>
                  </div>
                  <div style={{ height: 4, background: '#1e293b', borderRadius: 2 }}>
                    <div style={{ height: '100%', width: '99%', background: '#10b981', borderRadius: 2 }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span>Marketplace Latency</span>
                    <span style={{ color: '#10b981' }}>42ms</span>
                  </div>
                </div>
                <button style={{ 
                  marginTop: 24, width: '100%', padding: '12px', background: '#334155', border: 'none', 
                  borderRadius: 12, color: '#fff', cursor: 'pointer', ...pjs(13, 600, '18px', '#fff'),
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                }}>
                  <Settings size={16} /> Open Admin Settings
                </button>
              </div>
              {/* Decorative Circle */}
              <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(79,70,229,0.1)' }} />
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom Section: Entities distribution or personal schedule */}
      <div style={{ marginTop: 24 }}>
        <div style={{ ...pjs(18, 700, '24px', '#0f172a'), marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
          <MousePointerClick size={20} color="#4f46e5" />
          Today's Monitor View
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
          {/* Admin Timetable if present */}
          <div style={{ background: '#fff', borderRadius: 24, border: '1px solid #f1f5f9', padding: 24 }}>
             <h3 style={{ ...pjs(15, 700, '20px', '#0f172a'), marginBottom: 16 }}>Personal Work-Space</h3>
             {loading ? <div style={{ color: '#94a3b8', fontSize: 13 }}>Syncing...</div> : 
               (stats?.admin_personal_schedule || []).length > 0 ? stats.admin_personal_schedule.map((item, i) => (
                 <div key={i} style={{ display: 'flex', gap: 16, padding: '12px 0', borderBottom: i === stats.admin_personal_schedule.length - 1 ? 'none' : '1px solid #f8fafc' }}>
                    <div style={{ width: 60, flexShrink: 0, ...pjs(11, 700, '16px', '#6366f1'), background: '#eef2ff', padding: '4px 8px', borderRadius: 8, height: 'fit-content', textAlign: 'center' }}>
                      {item.time_slot?.split('-')[0]}
                    </div>
                    <div>
                      <div style={pjs(14, 700, '20px', '#0f172a')}>{item.course}</div>
                      <div style={pjs(12, 400, '18px', '#64748b')}>{item.location} • {item.type}</div>
                    </div>
                 </div>
               )) : <div style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No tasks in workspace today.</div>
             }
          </div>

          {/* Quick Metrics */}
          <div style={{ background: '#fff', borderRadius: 24, border: '1px solid #f1f5f9', padding: 24 }}>
             <h3 style={{ ...pjs(15, 700, '20px', '#0f172a'), marginBottom: 16 }}>Platform Engagement</h3>
             <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  { label: 'Marketplace Volume', value: '₹24.5k', progress: 75, color: '#10b981' },
                  { label: 'Society Activities', value: '12 Live', progress: 45, color: '#f59e0b' },
                  { label: 'WiFi Network Load', value: 'High', progress: 88, color: '#ef4444' }
                ].map((m, i) => (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={pjs(13, 500, '18px', '#64748b')}>{m.label}</span>
                      <span style={pjs(13, 700, '18px', '#0f172a')}>{m.value}</span>
                    </div>
                    <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3 }}>
                      <div style={{ height: '100%', width: `${m.progress}%`, background: m.color, borderRadius: 3 }} />
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
