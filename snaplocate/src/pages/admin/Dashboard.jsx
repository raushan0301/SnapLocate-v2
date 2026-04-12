import { useState, useEffect } from 'react'
import PageLayout from '../../components/PageLayout'
import { useAuth } from '../../context/AuthContext'
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
  Calendar,
  FileText,
  MousePointerClick,
  Megaphone,
} from 'lucide-react'

// ─── Typography helpers ───────────────────────────────────────
const pjs = (size, weight, lh, color) => ({
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  fontSize: size, fontWeight: weight, lineHeight: lh, color, margin: 0,
})
const inter = (size, weight, lh, color) => ({
  fontFamily: "'Inter', sans-serif",
  fontSize: size, fontWeight: weight, lineHeight: lh, color, margin: 0,
})

// ─── Stat Card ────────────────────────────────────────────────
const StatCard = ({ title, value, subtitle, icon: Icon, color, alert }) => (
  <div style={{
    background: '#fff', borderRadius: 20, padding: 24,
    border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    display: 'flex', flexDirection: 'column', gap: 14,
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12, background: `${color}15`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', color,
      }}>
        <Icon size={22} />
      </div>
      {alert && (
        <span style={{
          ...inter(11, 700, '14px', '#dc2626'),
          background: '#fef2f2', padding: '3px 8px', borderRadius: 6,
          border: '1px solid #fecaca',
        }}>
          {alert}
        </span>
      )}
    </div>
    <div>
      <div style={pjs(13, 600, '18px', '#64748b')}>{title}</div>
      <div style={{ ...pjs(30, 800, '38px', '#0f172a'), marginTop: 4 }}>{value}</div>
      <div style={{ ...pjs(12, 500, '16px', '#94a3b8'), marginTop: 4 }}>{subtitle}</div>
    </div>
  </div>
)

// ─── Quick Action Row ─────────────────────────────────────────
const QuickAction = ({ icon: Icon, label, sub, color, onClick }) => (
  <div
    onClick={onClick}
    style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
      background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: 12,
      cursor: 'pointer', transition: 'all 0.18s',
    }}
    onMouseEnter={e => {
      e.currentTarget.style.background = '#fff'
      e.currentTarget.style.borderColor = color
      e.currentTarget.style.boxShadow = `0 4px 12px ${color}18`
    }}
    onMouseLeave={e => {
      e.currentTarget.style.background = '#f8fafc'
      e.currentTarget.style.borderColor = '#f1f5f9'
      e.currentTarget.style.boxShadow = 'none'
    }}
  >
    <div style={{
      width: 36, height: 36, borderRadius: 10, background: `${color}15`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', color,
      flexShrink: 0,
    }}>
      <Icon size={18} />
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={pjs(13, 700, '18px', '#0f172a')}>{label}</div>
      <div style={{ ...pjs(11, 400, '15px', '#94a3b8'), marginTop: 2 }}>{sub}</div>
    </div>
    <ArrowRight size={15} color="#cbd5e1" />
  </div>
)

// ─── Main Component ───────────────────────────────────────────
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

  const activityColors = {
    Warning: { bg: '#fff1f2', text: '#e11d48', border: '#fda4af' },
    Success: { bg: '#f0fdf4', text: '#16a34a', border: '#86efac' },
    Info:    { bg: '#eff6ff', text: '#2563eb', border: '#93c5fd' },
  }

  const firstName = user?.full_name?.split(' ')[0] || 'Admin'

  return (
    <PageLayout>
      <style>{`
        .dash-stats   { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
        .dash-middle  { display: grid; grid-template-columns: 3fr 2fr;       gap: 24px; }
        .dash-bottom  { display: grid; grid-template-columns: 1fr 1fr;       gap: 24px; }
        .dash-time    { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }
        @media (max-width: 1100px) {
          .dash-middle { grid-template-columns: 1fr; }
        }
        @media (max-width: 900px) {
          .dash-stats  { grid-template-columns: repeat(2, 1fr); }
          .dash-bottom { grid-template-columns: 1fr; }
        }
        @media (max-width: 640px) {
          .dash-stats  { grid-template-columns: 1fr 1fr; gap: 14px; }
          .dash-time   { display: none; }
        }
        @media (max-width: 480px) {
          .dash-stats  { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* ── 1. Page Header ───────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{
            ...pjs(11, 700, '15px', '#4f46e5'),
            background: '#eef2ff', padding: '4px 10px', borderRadius: 6,
            textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>
            System Administrator
          </span>
          <h1 style={{ ...pjs(28, 800, '36px', '#0f172a'), marginTop: 10 }}>
            Good {time.getHours() < 12 ? 'morning' : time.getHours() < 17 ? 'afternoon' : 'evening'}, {firstName}
          </h1>
          <p style={{ ...pjs(14, 400, '22px', '#64748b'), marginTop: 4 }}>
            Here's what's happening on campus right now.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div className="dash-time">
            <div style={pjs(16, 700, '22px', '#0f172a')}>
              {time.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
            </div>
            <div style={pjs(12, 500, '16px', '#94a3b8')}>
              {time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
          </div>
          <button
            onClick={fetchStats}
            title="Refresh stats"
            style={{
              width: 40, height: 40, borderRadius: 10,
              border: '1px solid #e2e8f0', background: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#64748b', transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#4f46e5'; e.currentTarget.style.color = '#4f46e5' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#64748b' }}
          >
            <Activity size={18} />
          </button>
        </div>
      </div>

      {/* ── 2. Stats Grid (4 cards) ───────────────────────────── */}
      <div className="dash-stats">
        <StatCard
          title="Total Students"
          value={loading ? '—' : (stats?.total_students ?? 0).toLocaleString()}
          subtitle="Registered accounts"
          icon={Users} color="#4f46e5"
        />
        <StatCard
          title="Active Faculty"
          value={loading ? '—' : (stats?.total_faculty ?? 0).toLocaleString()}
          subtitle="Faculty accounts"
          icon={UserCheck} color="#0891b2"
        />
        <StatCard
          title="Classrooms"
          value={loading ? '—' : (stats?.total_classrooms ?? 0).toLocaleString()}
          subtitle="Rooms & labs"
          icon={MapPin} color="#d97706"
        />
        <StatCard
          title="Open Tickets"
          value={loading ? '—' : (stats?.open_tickets ?? 0).toLocaleString()}
          subtitle="Requiring attention"
          icon={LifeBuoy} color="#ef4444"
          alert={!loading && (stats?.open_tickets ?? 0) > 5 ? 'Action Needed' : null}
        />
      </div>

      {/* ── 3. Middle Row ─────────────────────────────────────── */}
      <div className="dash-middle">

        {/* Activity Log */}
        <div style={{
          background: '#fff', borderRadius: 20, padding: 24,
          border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4f46e5' }} />
              <h2 style={pjs(16, 700, '22px', '#0f172a')}>Real-Time Campus Log</h2>
            </div>
            <button
              onClick={() => window.location.href = '/admin/support'}
              style={{ ...inter(13, 600, '18px', '#4f46e5'), background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: 6 }}
              onMouseEnter={e => e.currentTarget.style.background = '#eef2ff'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              View All →
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {loading ? (
              <div style={{ padding: '48px 0', textAlign: 'center', ...pjs(14, 500, '20px', '#94a3b8') }}>
                Aggregating system logs...
              </div>
            ) : (stats?.recent_activity || []).map((log, i, arr) => {
              const theme = activityColors[log.type] || activityColors.Info
              return (
                <div key={i} style={{
                  display: 'flex', gap: 16, padding: '16px 0',
                  borderBottom: i < arr.length - 1 ? '1px solid #f8fafc' : 'none',
                }}>
                  <div style={{
                    width: 72, flexShrink: 0, ...pjs(11, 700, '16px', '#94a3b8'),
                    paddingTop: 3, textAlign: 'right',
                  }}>
                    {log.time}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      <span style={pjs(14, 700, '20px', '#0f172a')}>{log.title}</span>
                      <span style={{
                        padding: '2px 7px', borderRadius: 5, fontSize: 10, fontWeight: 700,
                        background: theme.bg, color: theme.text, border: `1px solid ${theme.border}`,
                        textTransform: 'uppercase', letterSpacing: '0.04em',
                      }}>
                        {log.type}
                      </span>
                    </div>
                    <div style={pjs(12, 400, '18px', '#64748b')}>{log.desc}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right column: Quick Actions + System Health */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Quick Actions */}
          <div style={{
            background: '#fff', borderRadius: 20, padding: 24,
            border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}>
            <h3 style={{ ...pjs(15, 700, '20px', '#0f172a'), marginBottom: 16 }}>Quick Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <QuickAction
                icon={ShieldCheck} label="Manage Faculty" sub="Approve or update staff"
                color="#4f46e5" onClick={() => window.location.href = '/admin/faculty'}
              />
              <QuickAction
                icon={Calendar} label="Update Schedule" sub="Manage campus timetable"
                color="#0891b2" onClick={() => window.location.href = '/admin/calendar'}
              />
              <QuickAction
                icon={Megaphone} label="Broadcast" sub="Send campus-wide alert"
                color="#f59e0b" onClick={() => window.location.href = '/admin/broadcast'}
              />
              <QuickAction
                icon={FileText} label="Support Contacts" sub="Manage campus helplines"
                color="#10b981" onClick={() => window.location.href = '/admin/support-contacts'}
              />
            </div>
          </div>

          {/* System Health */}
          <div style={{
            background: '#0f172a', borderRadius: 20, padding: 24,
            position: 'relative', overflow: 'hidden',
          }}>
            {/* Decorative blobs */}
            <div style={{ position: 'absolute', top: -24, right: -24, width: 96, height: 96, borderRadius: '50%', background: 'rgba(79,70,229,0.15)' }} />
            <div style={{ position: 'absolute', bottom: -16, left: -16, width: 64, height: 64, borderRadius: '50%', background: 'rgba(16,185,129,0.1)' }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
                <span style={inter(11, 700, '14px', '#64748b')}>SYSTEM OPERATIONAL</span>
              </div>
              <h4 style={{ ...pjs(16, 700, '22px', '#fff'), marginBottom: 20 }}>
                All Campus Services Live
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { label: 'Database',   status: 'Connected',   color: '#10b981' },
                  { label: 'API Server', status: 'Operational', color: '#10b981' },
                  { label: 'Auth',       status: 'Active',      color: '#10b981' },
                ].map((row, i) => (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={inter(12, 500, '16px', '#94a3b8')}>{row.label}</span>
                      <span style={inter(12, 700, '16px', row.color)}>{row.status}</span>
                    </div>
                    <div style={{ height: 3, background: '#1e293b', borderRadius: 2 }}>
                      <div style={{ height: '100%', width: '100%', background: row.color, borderRadius: 2, opacity: 0.8 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. Bottom Row ─────────────────────────────────────── */}
      <div className="dash-bottom">

        {/* Personal Workspace / Schedule */}
        <div style={{
          background: '#fff', borderRadius: 20, padding: 24,
          border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <MousePointerClick size={18} color="#4f46e5" />
            <h3 style={pjs(15, 700, '20px', '#0f172a')}>Today's Schedule</h3>
          </div>

          {loading ? (
            <div style={{ ...pjs(13, 500, '18px', '#94a3b8'), padding: '24px 0', textAlign: 'center' }}>Syncing...</div>
          ) : (stats?.admin_personal_schedule || []).length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {stats.admin_personal_schedule.map((item, i, arr) => (
                <div key={i} style={{
                  display: 'flex', gap: 14, padding: '12px 0',
                  borderBottom: i < arr.length - 1 ? '1px solid #f8fafc' : 'none',
                }}>
                  <div style={{
                    flexShrink: 0, ...pjs(11, 700, '15px', '#6366f1'),
                    background: '#eef2ff', padding: '4px 8px', borderRadius: 8,
                    height: 'fit-content', textAlign: 'center', minWidth: 56,
                  }}>
                    {item.time_slot?.split('-')[0]}
                  </div>
                  <div>
                    <div style={pjs(13, 700, '18px', '#0f172a')}>{item.course}</div>
                    <div style={{ ...pjs(12, 400, '16px', '#94a3b8'), marginTop: 2 }}>{item.location} · {item.type}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '28px 0', textAlign: 'center' }}>
              <div style={pjs(13, 500, '18px', '#94a3b8')}>No tasks scheduled for today.</div>
            </div>
          )}
        </div>

        {/* Platform Overview */}
        <div style={{
          background: '#fff', borderRadius: 20, padding: 24,
          border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}>
          <h3 style={{ ...pjs(15, 700, '20px', '#0f172a'), marginBottom: 20 }}>Platform Overview</h3>

          {loading ? (
            <div style={{ ...pjs(13, 500, '18px', '#94a3b8'), padding: '24px 0', textAlign: 'center' }}>Loading...</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {[
                {
                  label: 'Students',
                  value: (stats?.total_students ?? 0).toLocaleString(),
                  progress: Math.min(100, Math.round(((stats?.total_students ?? 0) / Math.max(stats?.total_students ?? 0, 500)) * 100)),
                  color: '#4f46e5',
                },
                {
                  label: 'Marketplace Listings',
                  value: (stats?.marketplace_listings ?? 0).toLocaleString(),
                  progress: Math.min(100, Math.round(((stats?.marketplace_listings ?? 0) / Math.max(stats?.marketplace_listings ?? 0, 20)) * 100)),
                  color: '#10b981',
                },
                {
                  label: 'Campus Societies',
                  value: (stats?.societies_count ?? 0).toLocaleString(),
                  progress: Math.min(100, Math.round(((stats?.societies_count ?? 0) / Math.max(stats?.societies_count ?? 0, 10)) * 100)),
                  color: '#f59e0b',
                },
              ].map((m, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={pjs(13, 500, '18px', '#475569')}>{m.label}</span>
                    <span style={pjs(14, 700, '18px', '#0f172a')}>{m.value}</span>
                  </div>
                  <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3 }}>
                    <div style={{ height: '100%', width: `${m.progress}%`, background: m.color, borderRadius: 3, transition: 'width 0.6s ease' }} />
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
