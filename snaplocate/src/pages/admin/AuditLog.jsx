import { useState, useEffect } from 'react'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'
import { ShieldAlert, Search, User, Trash2, BadgeCheck, UserX, Package, FileText, Megaphone, Pencil, UserPlus, Filter } from 'lucide-react'

// ─── Action metadata ─────────────────────────────────────────
const ACTION_META = {
  CREATE_USER:          { label: 'Created User',       bg: '#ecfdf5', color: '#047857', border: '#a7f3d0', icon: <UserPlus size={13} /> },
  UPDATE_USER:          { label: 'Updated User',       bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe', icon: <Pencil size={13} /> },
  DELETE_USER:          { label: 'Deleted User',       bg: '#fef2f2', color: '#991b1b', border: '#fecaca', icon: <Trash2 size={13} /> },
  VERIFY_USER:          { label: 'Verified User',      bg: '#ecfdf5', color: '#047857', border: '#a7f3d0', icon: <BadgeCheck size={13} /> },
  UNVERIFY_USER:        { label: 'Unverified User',    bg: '#fffbeb', color: '#92400e', border: '#fde68a', icon: <UserX size={13} /> },
  REMOVE_LISTING:       { label: 'Removed Listing',    bg: '#fff7ed', color: '#c2410c', border: '#fed7aa', icon: <Package size={13} /> },
  REMOVE_POST:          { label: 'Removed Post',       bg: '#fff7ed', color: '#c2410c', border: '#fed7aa', icon: <Trash2 size={13} /> },
  REMOVE_RESOURCE:      { label: 'Removed Resource',   bg: '#fff7ed', color: '#c2410c', border: '#fed7aa', icon: <FileText size={13} /> },
  PUBLISH_ANNOUNCEMENT: { label: 'Published Announcement', bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe', icon: <Megaphone size={13} /> },
  DELETE_ANNOUNCEMENT:  { label: 'Deleted Announcement',   bg: '#fef2f2', color: '#991b1b', border: '#fecaca', icon: <Trash2 size={13} /> },
  ASSIGN_ADVISOR:       { label: 'Assigned Advisor',       bg: '#fdf4ff', color: '#7e22ce', border: '#e9d5ff', icon: <User size={13} /> },
  REMOVE_ADVISOR:       { label: 'Removed Advisor',        bg: '#fff7ed', color: '#c2410c', border: '#fed7aa', icon: <User size={13} /> },
}

const defaultMeta = { label: 'Admin Action', bg: '#f8fafc', color: '#475569', border: '#e2e8f0', icon: <ShieldAlert size={13} /> }

const ALL_ACTIONS = Object.keys(ACTION_META)

const TARGET_TYPE_ICON = {
  user:         <User size={14} color="#4f46e5" />,
  listing:      <Package size={14} color="#f59e0b" />,
  post:         <Search size={14} color="#10b981" />,
  resource:     <FileText size={14} color="#7e22ce" />,
  announcement: <Megaphone size={14} color="#0ea5e9" />,
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function AuditLog() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionFilter, setActionFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [showFilterMenu, setShowFilterMenu] = useState(false)

  useEffect(() => { fetchLogs() }, [])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/admin/audit-log?limit=200')
      if (res.success) setLogs(res.data || [])
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }

  const filtered = logs.filter(log => {
    const matchAction = actionFilter === 'all' || log.action === actionFilter
    const matchSearch = !search ||
      log.actor_name?.toLowerCase().includes(search.toLowerCase()) ||
      log.target_name?.toLowerCase().includes(search.toLowerCase()) ||
      log.action?.toLowerCase().includes(search.toLowerCase())
    return matchAction && matchSearch
  })

  const stats = {
    total: logs.length,
    deletes: logs.filter(l => l.action.startsWith('DELETE') || l.action.startsWith('REMOVE')).length,
    creates: logs.filter(l => l.action.startsWith('CREATE') || l.action === 'PUBLISH_ANNOUNCEMENT').length,
    verifies: logs.filter(l => l.action === 'VERIFY_USER' || l.action === 'UNVERIFY_USER').length,
  }

  return (
    <PageLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#0f172a', margin: 0 }}>Audit Log</h1>
          <p style={{ fontSize: 14, color: '#64748b', marginTop: 4, marginBottom: 0 }}>
            Complete record of all admin actions — who did what and when.
          </p>
        </div>
        <button
          onClick={fetchLogs}
          style={{ padding: '9px 18px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#fff', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
        >
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {[
          { label: 'Total Events',   value: stats.total,   bg: '#eef2ff', color: '#4f46e5' },
          { label: 'Deletions',      value: stats.deletes, bg: '#fef2f2', color: '#dc2626' },
          { label: 'Creations',      value: stats.creates, bg: '#ecfdf5', color: '#059669' },
          { label: 'Verifications',  value: stats.verifies,bg: '#fffbeb', color: '#d97706' },
        ].map((s, i) => (
          <div key={i} style={{ background: '#fff', padding: '20px 24px', borderRadius: 20, border: '1px solid #f1f5f9', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div style={{ background: '#fff', borderRadius: 20, padding: 24, border: '1px solid #f1f5f9', boxShadow: '0 4px 24px rgba(0,0,0,0.03)' }}>
        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text" placeholder="Search by actor, target, or action..." value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '10px 16px 10px 36px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              onFocus={e => e.target.style.borderColor = '#4f46e5'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>

          {/* Action filter dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowFilterMenu(p => !p)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px', borderRadius: 10, border: '1.5px solid', borderColor: actionFilter !== 'all' ? '#4f46e5' : '#e2e8f0', background: actionFilter !== 'all' ? '#eef2ff' : '#fff', color: actionFilter !== 'all' ? '#4f46e5' : '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              <Filter size={14} />
              {actionFilter === 'all' ? 'All Actions' : (ACTION_META[actionFilter]?.label || actionFilter)}
            </button>
            {showFilterMenu && (
              <div style={{ position: 'absolute', top: '110%', right: 0, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 50, minWidth: 200, padding: 6 }}>
                <button onClick={() => { setActionFilter('all'); setShowFilterMenu(false) }}
                  style={{ width: '100%', textAlign: 'left', padding: '8px 12px', borderRadius: 8, border: 'none', background: actionFilter === 'all' ? '#eef2ff' : 'transparent', color: actionFilter === 'all' ? '#4f46e5' : '#334155', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                  All Actions
                </button>
                {ALL_ACTIONS.map(a => {
                  const m = ACTION_META[a]
                  return (
                    <button key={a} onClick={() => { setActionFilter(a); setShowFilterMenu(false) }}
                      style={{ width: '100%', textAlign: 'left', padding: '8px 12px', borderRadius: 8, border: 'none', background: actionFilter === a ? '#eef2ff' : 'transparent', color: actionFilter === a ? '#4f46e5' : '#334155', fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: m.color }}>{m.icon}</span>{m.label}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>
            {filtered.length} event{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Close filter menu on outside click */}
        {showFilterMenu && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 49 }} onClick={() => setShowFilterMenu(false)} />
        )}

        <div style={{ overflowX: 'auto' }}>
          <table style={{ minWidth: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {['Action', 'Target', 'Performed By', 'When'].map(h => (
                  <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} style={{ padding: '48px 0', textAlign: 'center', color: '#94a3b8' }}>Loading audit log...</td></tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: '48px 0', textAlign: 'center' }}>
                    <ShieldAlert size={32} color="#e2e8f0" style={{ margin: '0 auto 10px', display: 'block' }} />
                    <div style={{ color: '#94a3b8', fontWeight: 500 }}>No events match your filter.</div>
                  </td>
                </tr>
              ) : filtered.map(log => {
                const meta = ACTION_META[log.action] || defaultMeta
                return (
                  <tr key={log.id} style={{ borderBottom: '1px solid #f8fafc', transition: '0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {/* Action badge */}
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        background: meta.bg, color: meta.color, border: `1px solid ${meta.border}`,
                        padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                        whiteSpace: 'nowrap'
                      }}>
                        {meta.icon}{meta.label}
                      </span>
                    </td>

                    {/* Target */}
                    <td style={{ padding: '14px 16px' }}>
                      {log.target_name ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {TARGET_TYPE_ICON[log.target_type] || <ShieldAlert size={14} color="#94a3b8" />}
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{log.target_name}</div>
                            {log.target_type && (
                              <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'capitalize' }}>{log.target_type}</div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: '#cbd5e1', fontSize: 13 }}>—</span>
                      )}
                    </td>

                    {/* Actor */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#4f46e5' }}>
                          {(log.actor_name || '?').charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontSize: 14, color: '#334155', fontWeight: 500 }}>{log.actor_name || 'System'}</span>
                      </div>
                    </td>

                    {/* Timestamp */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontSize: 13, color: '#64748b' }}>{timeAgo(log.created_at)}</div>
                      <div style={{ fontSize: 11, color: '#cbd5e1', marginTop: 2 }}>
                        {new Date(log.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </PageLayout>
  )
}
