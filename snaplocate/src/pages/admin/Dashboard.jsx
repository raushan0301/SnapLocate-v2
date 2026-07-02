import { useState, useEffect } from 'react'
import PageLayout from '../../components/PageLayout'
import { useAuth } from '../../context/AuthContext'
import api from '../../lib/api'
import {
  Users, UserCheck, MapPin, LifeBuoy, Activity, ShieldCheck,
  ArrowRight, Bell, Calendar, FileText, MousePointerClick, Megaphone,
} from 'lucide-react'

const ACTIVITY_CLS = {
  Warning: 'bg-rose-50 text-rose-600 border border-rose-200',
  Success: 'bg-green-50 text-green-700 border border-green-200',
  Info:    'bg-blue-50 text-blue-600 border border-blue-200',
}

const StatCard = ({ title, value, subtitle, icon: Icon, color, alert }) => (
  <div className="bg-white rounded-[20px] p-6 border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col gap-3.5">
    <div className="flex justify-between items-start">
      <div className="w-11 h-11 rounded-[12px] flex items-center justify-center shrink-0" style={{ background: `${color}15`, color }}>
        <Icon size={22} />
      </div>
      {alert && (
        <span className="text-[11px] font-bold text-red-600 bg-red-50 px-2 py-[3px] rounded-[6px] border border-red-200">{alert}</span>
      )}
    </div>
    <div>
      <div className="text-[13px] font-semibold t-muted">{title}</div>
      <div className="text-[30px] font-extrabold t-primary mt-1">{value}</div>
      <div className="text-[12px] text-slate-400 mt-1">{subtitle}</div>
    </div>
  </div>
)

const QuickAction = ({ icon: Icon, label, sub, color, onClick }) => (
  <div onClick={onClick}
    className="flex items-center gap-3 px-3.5 py-3 bg-slate-50 border border-slate-100 rounded-[12px] cursor-pointer transition-all hover:bg-white hover:shadow-md">
    <div className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: `${color}15`, color }}>
      <Icon size={18} />
    </div>
    <div className="flex-1 min-w-0">
      <div className="text-[13px] font-bold t-primary">{label}</div>
      <div className="text-[11px] text-slate-400 mt-0.5">{sub}</div>
    </div>
    <ArrowRight size={15} color="#cbd5e1" />
  </div>
)

export default function AdminDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [time, setTime] = useState(new Date())

  const fetchStats = async () => {
    try {
      const res = await api.get('/api/admin/stats')
      if (res.success) setStats(res.data)
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

  const firstName = user?.full_name?.split(' ')[0] || 'Admin'

  return (
    <PageLayout>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <span className="text-[11px] font-bold text-brand bg-indigo-50 px-2.5 py-1 rounded-[6px] uppercase tracking-[0.06em]">
            System Administrator
          </span>
          <h1 className="text-[28px] font-extrabold t-primary mt-2.5 mb-0">
            Good {time.getHours() < 12 ? 'morning' : time.getHours() < 17 ? 'afternoon' : 'evening'}, {firstName}
          </h1>
          <p className="text-[14px] t-muted mt-1 mb-0">Here's what's happening on campus right now.</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end gap-0.5">
            <div className="text-[16px] font-bold t-primary">{time.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</div>
            <div className="text-[12px] text-slate-400">{time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</div>
          </div>
          <button onClick={fetchStats} title="Refresh stats"
            className="w-10 h-10 rounded-[10px] border border-slate-200 bg-white flex items-center justify-center cursor-pointer text-slate-500 transition-all hover:bg-slate-50 hover:border-brand hover:text-brand">
            <Activity size={18} />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard title="Total Students" value={loading ? '—' : (stats?.total_students ?? 0).toLocaleString()} subtitle="Registered accounts" icon={Users} color="#4f46e5" />
        <StatCard title="Active Faculty" value={loading ? '—' : (stats?.total_faculty ?? 0).toLocaleString()} subtitle="Faculty accounts" icon={UserCheck} color="#0891b2" />
        <StatCard title="Classrooms" value={loading ? '—' : (stats?.total_classrooms ?? 0).toLocaleString()} subtitle="Rooms & labs" icon={MapPin} color="#d97706" />
        <StatCard title="Open Tickets" value={loading ? '—' : (stats?.open_tickets ?? 0).toLocaleString()} subtitle="Requiring attention" icon={LifeBuoy} color="#ef4444"
          alert={!loading && (stats?.open_tickets ?? 0) > 5 ? 'Action Needed' : null} />
      </div>

      {/* Middle Row */}
      <div className="grid grid-cols-1 xl:grid-cols-[3fr_2fr] gap-6">

        {/* Activity Log */}
        <div className="bg-white rounded-[20px] p-6 border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="flex justify-between items-center mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-brand" />
              <h2 className="text-[16px] font-bold t-primary m-0">Real-Time Campus Log</h2>
            </div>
            <button onClick={() => window.location.href = '/admin/support'}
              className="text-[13px] font-semibold text-brand bg-transparent border-0 cursor-pointer px-2 py-1 rounded-[6px] hover:bg-indigo-50 transition-colors">
              View All →
            </button>
          </div>

          <div className="flex flex-col">
            {loading ? (
              <div className="py-12 text-center text-[14px] t-muted">Aggregating system logs...</div>
            ) : (stats?.recent_activity || []).map((log, i, arr) => {
              const chipCls = ACTIVITY_CLS[log.type] || ACTIVITY_CLS.Info
              return (
                <div key={i} className={`flex gap-4 py-4 ${i < arr.length - 1 ? 'border-b border-slate-50' : ''}`}>
                  <div className="w-[72px] shrink-0 text-[11px] font-bold text-slate-400 pt-[3px] text-right">{log.time}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[14px] font-bold t-primary">{log.title}</span>
                      <span className={`px-[7px] py-[2px] rounded-[5px] text-[10px] font-bold uppercase tracking-[0.04em] ${chipCls}`}>{log.type}</span>
                    </div>
                    <div className="text-[12px] t-muted">{log.desc}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-5">

          {/* Quick Actions */}
          <div className="bg-white rounded-[20px] p-6 border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <h3 className="text-[15px] font-bold t-primary mb-4">Quick Actions</h3>
            <div className="flex flex-col gap-2.5">
              <QuickAction icon={ShieldCheck} label="Manage Faculty" sub="Approve or update staff" color="#4f46e5" onClick={() => window.location.href = '/admin/faculty'} />
              <QuickAction icon={Calendar}    label="Update Schedule" sub="Manage campus timetable" color="#0891b2" onClick={() => window.location.href = '/admin/calendar'} />
              <QuickAction icon={Megaphone}   label="Broadcast" sub="Send campus-wide alert" color="#f59e0b" onClick={() => window.location.href = '/admin/broadcast'} />
              <QuickAction icon={FileText}    label="Support Contacts" sub="Manage campus helplines" color="#10b981" onClick={() => window.location.href = '/admin/support-contacts'} />
            </div>
          </div>

          {/* System Health */}
          <div className="bg-slate-900 rounded-[20px] p-6 relative overflow-hidden">
            <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-brand/15" />
            <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-emerald-500/10" />

            <div className="relative z-[1]">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.05em]">SYSTEM OPERATIONAL</span>
              </div>
              <h4 className="text-[16px] font-bold text-white mb-5">All Campus Services Live</h4>

              <div className="flex flex-col gap-3.5">
                {[
                  { label: 'Database',   status: 'Connected',   color: '#10b981' },
                  { label: 'API Server', status: 'Operational', color: '#10b981' },
                  { label: 'Auth',       status: 'Active',      color: '#10b981' },
                ].map((row, i) => (
                  <div key={i}>
                    <div className="flex justify-between mb-1.5">
                      <span className="text-[12px] text-slate-400">{row.label}</span>
                      <span className="text-[12px] font-bold" style={{ color: row.color }}>{row.status}</span>
                    </div>
                    <div className="h-[3px] bg-slate-800 rounded-[2px]">
                      <div className="h-full w-full rounded-[2px] opacity-80" style={{ background: row.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Today's Schedule */}
        <div className="bg-white rounded-[20px] p-6 border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-2.5 mb-5">
            <MousePointerClick size={18} color="#4f46e5" />
            <h3 className="text-[15px] font-bold t-primary m-0">Today's Schedule</h3>
          </div>

          {loading ? (
            <div className="py-6 text-center text-[13px] t-muted">Syncing...</div>
          ) : (stats?.admin_personal_schedule || []).length > 0 ? (
            <div className="flex flex-col">
              {stats.admin_personal_schedule.map((item, i, arr) => (
                <div key={i} className={`flex gap-3.5 py-3 ${i < arr.length - 1 ? 'border-b border-slate-50' : ''}`}>
                  <div className="shrink-0 text-[11px] font-bold text-brand bg-indigo-50 px-2 py-1 rounded-[8px] h-fit text-center min-w-[56px]">
                    {item.time_slot?.split('-')[0]}
                  </div>
                  <div>
                    <div className="text-[13px] font-bold t-primary">{item.course}</div>
                    <div className="text-[12px] t-muted mt-0.5">{item.location} · {item.type}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-7 text-center text-[13px] t-muted">No tasks scheduled for today.</div>
          )}
        </div>

        {/* Platform Overview */}
        <div className="bg-white rounded-[20px] p-6 border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <h3 className="text-[15px] font-bold t-primary mb-5">Platform Overview</h3>

          {loading ? (
            <div className="py-6 text-center text-[13px] t-muted">Loading...</div>
          ) : (
            <div className="flex flex-col gap-5">
              {[
                { label: 'Students',             value: (stats?.total_students ?? 0).toLocaleString(),       color: '#4f46e5', progress: 100 },
                { label: 'Marketplace Listings', value: (stats?.marketplace_listings ?? 0).toLocaleString(), color: '#10b981', progress: 100 },
                { label: 'Campus Societies',     value: (stats?.societies_count ?? 0).toLocaleString(),      color: '#f59e0b', progress: 100 },
              ].map((m, i) => (
                <div key={i}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[13px] text-slate-500">{m.label}</span>
                    <span className="text-[14px] font-bold t-primary">{m.value}</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-[3px]">
                    <div className="h-full rounded-[3px] transition-[width] duration-[600ms] ease-out" style={{ width: `${m.progress}%`, background: m.color }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  )
}
