import { useState, useEffect } from 'react'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'
import { ShieldAlert, Search, User, Trash2, BadgeCheck, UserX, Package, FileText, Megaphone, Pencil, UserPlus, Filter } from 'lucide-react'

const ACTION_META = {
  CREATE_USER:          { label: 'Created User',           cls: 'bg-green-50 text-emerald-800 border border-green-200',   icon: <UserPlus size={13} /> },
  UPDATE_USER:          { label: 'Updated User',           cls: 'bg-blue-50 text-blue-700 border border-blue-200',        icon: <Pencil size={13} /> },
  DELETE_USER:          { label: 'Deleted User',           cls: 'bg-red-50 text-red-800 border border-red-200',           icon: <Trash2 size={13} /> },
  VERIFY_USER:          { label: 'Verified User',          cls: 'bg-green-50 text-emerald-800 border border-green-200',   icon: <BadgeCheck size={13} /> },
  UNVERIFY_USER:        { label: 'Unverified User',        cls: 'bg-amber-50 text-amber-800 border border-amber-200',     icon: <UserX size={13} /> },
  REMOVE_LISTING:       { label: 'Removed Listing',        cls: 'bg-orange-50 text-orange-700 border border-orange-200',  icon: <Package size={13} /> },
  REMOVE_POST:          { label: 'Removed Post',           cls: 'bg-orange-50 text-orange-700 border border-orange-200',  icon: <Trash2 size={13} /> },
  REMOVE_RESOURCE:      { label: 'Removed Resource',       cls: 'bg-orange-50 text-orange-700 border border-orange-200',  icon: <FileText size={13} /> },
  PUBLISH_ANNOUNCEMENT: { label: 'Published Announcement', cls: 'bg-blue-50 text-blue-700 border border-blue-200',        icon: <Megaphone size={13} /> },
  DELETE_ANNOUNCEMENT:  { label: 'Deleted Announcement',   cls: 'bg-red-50 text-red-800 border border-red-200',           icon: <Trash2 size={13} /> },
  ASSIGN_ADVISOR:       { label: 'Assigned Advisor',       cls: 'bg-purple-50 text-purple-800 border border-purple-200',  icon: <User size={13} /> },
  REMOVE_ADVISOR:       { label: 'Removed Advisor',        cls: 'bg-orange-50 text-orange-700 border border-orange-200',  icon: <User size={13} /> },
}

const defaultMeta = { label: 'Admin Action', cls: 'bg-slate-50 text-slate-600 border border-slate-200', icon: <ShieldAlert size={13} /> }
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

const STAT_CLS = [
  { labelCls: 'text-slate-500', valueCls: 'text-brand' },
  { labelCls: 'text-slate-500', valueCls: 'text-red-600' },
  { labelCls: 'text-slate-500', valueCls: 'text-emerald-600' },
  { labelCls: 'text-slate-500', valueCls: 'text-amber-600' },
]

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
    total:   logs.length,
    deletes: logs.filter(l => l.action.startsWith('DELETE') || l.action.startsWith('REMOVE')).length,
    creates: logs.filter(l => l.action.startsWith('CREATE') || l.action === 'PUBLISH_ANNOUNCEMENT').length,
    verifies:logs.filter(l => l.action === 'VERIFY_USER' || l.action === 'UNVERIFY_USER').length,
  }

  return (
    <PageLayout>
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-[26px] font-bold t-primary m-0">Audit Log</h1>
          <p className="text-[14px] t-muted mt-1 mb-0">Complete record of all admin actions — who did what and when.</p>
        </div>
        <button onClick={fetchLogs} className="px-[18px] py-[9px] rounded-[10px] border-[1.5px] border-slate-200 bg-white text-slate-600 text-[13px] font-semibold cursor-pointer hover:bg-slate-50 transition-colors">
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Events', value: stats.total },
          { label: 'Deletions',    value: stats.deletes },
          { label: 'Creations',    value: stats.creates },
          { label: 'Verifications',value: stats.verifies },
        ].map((s, i) => (
          <div key={i} className="bg-white px-6 py-5 rounded-[20px] border border-slate-100 shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
            <div className={`text-[12px] font-semibold mb-1.5 ${STAT_CLS[i].labelCls}`}>{s.label}</div>
            <div className={`text-[26px] font-extrabold ${STAT_CLS[i].valueCls}`}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[20px] p-6 border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.03)]">
        <div className="flex gap-3 mb-5 flex-wrap items-center">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search by actor, target, or action..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full py-[10px] pl-9 pr-4 rounded-[10px] border-[1.5px] border-slate-200 text-[14px] outline-none box-border focus:border-brand transition-colors" />
          </div>

          <div className="relative">
            <button onClick={() => setShowFilterMenu(p => !p)}
              className={`flex items-center gap-2 px-4 py-[9px] rounded-[10px] border-[1.5px] text-[13px] font-semibold cursor-pointer transition-colors ${actionFilter !== 'all' ? 'border-brand bg-indigo-50 text-brand' : 'border-slate-200 bg-white text-slate-600'}`}>
              <Filter size={14} />
              {actionFilter === 'all' ? 'All Actions' : (ACTION_META[actionFilter]?.label || actionFilter)}
            </button>
            {showFilterMenu && (
              <div className="absolute top-[110%] right-0 bg-white border border-slate-200 rounded-[12px] shadow-[0_8px_24px_rgba(0,0,0,0.1)] z-50 min-w-[200px] p-1.5">
                <button onClick={() => { setActionFilter('all'); setShowFilterMenu(false) }}
                  className={`w-full text-left px-3 py-2 rounded-[8px] border-0 text-[13px] cursor-pointer ${actionFilter === 'all' ? 'bg-indigo-50 text-brand font-bold' : 'bg-transparent text-slate-700 font-medium'}`}>
                  All Actions
                </button>
                {ALL_ACTIONS.map(a => {
                  const m = ACTION_META[a]
                  return (
                    <button key={a} onClick={() => { setActionFilter(a); setShowFilterMenu(false) }}
                      className={`w-full text-left px-3 py-2 rounded-[8px] border-0 text-[13px] cursor-pointer flex items-center gap-2 ${actionFilter === a ? 'bg-indigo-50 text-brand font-bold' : 'bg-transparent text-slate-700 font-medium'}`}>
                      <span className={m.cls.split(' ')[1]}>{m.icon}</span>{m.label}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <span className="text-[13px] text-slate-400 font-medium">{filtered.length} event{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {showFilterMenu && <div className="fixed inset-0 z-[49]" onClick={() => setShowFilterMenu(false)} />}

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {['Action', 'Target', 'Performed By', 'When'].map(h => (
                  <th key={h} className="px-4 py-3.5 text-left text-[12px] font-semibold text-slate-500 uppercase tracking-[0.5px] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="py-12 text-center t-muted">Loading audit log...</td></tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center">
                    <ShieldAlert size={32} color="#e2e8f0" className="mx-auto mb-2.5 block" />
                    <div className="text-slate-400 font-medium">No events match your filter.</div>
                  </td>
                </tr>
              ) : filtered.map(log => {
                const meta = ACTION_META[log.action] || defaultMeta
                return (
                  <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-[5px] rounded-[8px] text-[12px] font-bold whitespace-nowrap ${meta.cls}`}>
                        {meta.icon}{meta.label}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {log.target_name ? (
                        <div className="flex items-center gap-2">
                          {TARGET_TYPE_ICON[log.target_type] || <ShieldAlert size={14} color="#94a3b8" />}
                          <div>
                            <div className="text-[14px] font-semibold t-primary">{log.target_name}</div>
                            {log.target_type && <div className="text-[11px] t-muted capitalize">{log.target_type}</div>}
                          </div>
                        </div>
                      ) : <span className="text-[13px] text-slate-200">—</span>}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-[8px] bg-slate-100 flex items-center justify-center text-[12px] font-bold text-brand">
                          {(log.actor_name || '?').charAt(0).toUpperCase()}
                        </div>
                        <span className="text-[14px] text-slate-700 font-medium">{log.actor_name || 'System'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="text-[13px] t-muted">{timeAgo(log.created_at)}</div>
                      <div className="text-[11px] text-slate-300 mt-0.5">
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
