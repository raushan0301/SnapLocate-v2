import { useState, useEffect, useCallback, useMemo } from 'react'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'
import { Search, Trash2, CheckCircle2, AlertCircle, MapPin, ExternalLink, Package, RefreshCw, LayoutGrid, MonitorSmartphone, Key, Contact, Shirt, Book, Backpack, Wallet, Activity, Box } from 'lucide-react'

const CATS = [
  { value: 'electronics', label: 'Electronics', icon: MonitorSmartphone, color: '#4f46e5', bg: '#eef2ff' },
  { value: 'keys',        label: 'Keys',        icon: Key,               color: '#d97706', bg: '#fffbeb' },
  { value: 'id_card',     label: 'ID Card',     icon: Contact,           color: '#2563eb', bg: '#eff6ff' },
  { value: 'clothing',    label: 'Clothing',    icon: Shirt,             color: '#db2777', bg: '#fdf2f8' },
  { value: 'books',       label: 'Books',       icon: Book,              color: '#16a34a', bg: '#f0fdf4' },
  { value: 'bag',         label: 'Bag',         icon: Backpack,          color: '#ea580c', bg: '#fff7ed' },
  { value: 'wallet',      label: 'Wallet',      icon: Wallet,            color: '#ca8a04', bg: '#fefce8' },
  { value: 'jewellery',   label: 'Jewellery',   icon: Activity,          color: '#9333ea', bg: '#faf5ff' },
  { value: 'sports',      label: 'Sports',      icon: Activity,          color: '#0d9488', bg: '#f0fdfa' },
  { value: 'other',       label: 'Other',       icon: Box,               color: '#64748b', bg: '#f8fafc' },
]
const catInfo = v => CATS.find(c => c.value === v) || CATS[CATS.length - 1]

const STATUS = {
  lost:     { label: 'Lost',     cls: 'bg-orange-50 text-orange-700 border border-orange-200' },
  found:    { label: 'Found',    cls: 'bg-green-50 text-green-700 border border-green-200' },
  resolved: { label: 'Resolved', cls: 'bg-sky-50 text-sky-700 border border-sky-200' },
}

const CLAIM_STATUS_CLS = {
  pending:  'bg-amber-50 text-amber-800 border border-amber-200',
  approved: 'bg-green-50 text-green-800 border border-green-200',
  rejected: 'bg-slate-100 text-slate-600 border border-slate-200',
}

const EMAIL_LOG_CLS = {
  success:   { cls: 'bg-green-50 text-green-700 border border-green-200',  label: '✅ Success'   },
  failed:    { cls: 'bg-red-50 text-red-600 border border-red-200',        label: '❌ Failed'    },
  duplicate: { cls: 'bg-amber-50 text-amber-700 border border-amber-200',  label: '🟡 Duplicate' },
  skipped:   { cls: 'bg-slate-50 text-slate-600 border border-slate-200',  label: '⚫ Skipped'  },
}

function Avatar({ name, url, size = 28 }) {
  const initials = (name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  const sz = `${size}px`
  if (url) return <img src={url} alt={name} className="rounded-full object-cover shrink-0" style={{ width: sz, height: sz }} />
  return (
    <div className="rounded-full bg-indigo-100 text-brand font-bold flex items-center justify-center shrink-0" style={{ width: sz, height: sz, fontSize: size * 0.38 }}>
      {initials}
    </div>
  )
}

function StatusBadge({ status }) {
  const s = STATUS[status] || STATUS.lost
  return <span className={`${s.cls} px-[9px] py-[2px] rounded-[20px] text-[11px] font-bold uppercase whitespace-nowrap`}>{s.label}</span>
}

function CatChip({ category }) {
  const c = catInfo(category)
  const Icon = c.icon
  return (
    <span className="inline-flex items-center gap-1 px-2 py-[2px] rounded-[6px] text-[11px] font-semibold whitespace-nowrap" style={{ background: c.bg, color: c.color }}>
      <Icon size={12} strokeWidth={2.5} /> {c.label}
    </span>
  )
}

export default function ManageLostFound() {
  const [tab, setTab]         = useState('items')
  const [allItems, setAllItems] = useState([])
  const [claims, setClaims]   = useState([])
  const [stats, setStats]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [claimsLoad, setClaimsLoad] = useState(false)
  const [gmailStatus, setGmailStatus] = useState(null)
  const [emailLogs, setEmailLogs]     = useState([])
  const [logsLoading, setLogsLoading] = useState(false)
  const [logFilter, setLogFilter]     = useState('all')
  const [statusF, setStatusF] = useState('all')
  const [catF, setCatF]       = useState('all')
  const [search, setSearch]   = useState('')
  const [claimF, setClaimF]   = useState('pending')

  const loadItems = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/admin/lost-found')
      setAllItems(res.success ? (res.data || []) : [])
    } catch { setAllItems([]) } finally { setLoading(false) }
  }, [])

  const loadStats = useCallback(async () => {
    try {
      const res = await api.get('/api/admin/lost-found/stats')
      if (res.success) setStats(res.data)
    } catch { }
  }, [])

  const loadClaims = useCallback(async () => {
    setClaimsLoad(true)
    try {
      const params = claimF !== 'all' ? `?status=${claimF}` : ''
      const res = await api.get(`/api/admin/lost-found/claims${params}`)
      if (res.success) setClaims(res.data || [])
    } catch { } finally { setClaimsLoad(false) }
  }, [claimF])

  const loadEmailLogs = useCallback(async () => {
    setLogsLoading(true)
    try {
      const [statusRes, logsRes] = await Promise.all([
        api.get('/api/admin/gmail-status'),
        api.get(`/api/admin/email-logs?limit=100${logFilter !== 'all' ? `&status=${logFilter}` : ''}`),
      ])
      if (statusRes.success) setGmailStatus(statusRes.data)
      if (logsRes.success)   setEmailLogs(logsRes.data || [])
    } catch { } finally { setLogsLoading(false) }
  }, [logFilter])

  useEffect(() => { loadItems(); loadStats() }, [loadItems, loadStats])
  useEffect(() => { if (tab === 'claims')    loadClaims()    }, [tab, loadClaims])
  useEffect(() => { if (tab === 'emailSync') loadEmailLogs() }, [tab, loadEmailLogs])

  const filtered = useMemo(() => {
    let list = allItems
    if (statusF !== 'all') list = list.filter(i => i.status === statusF)
    if (catF !== 'all')    list = list.filter(i => (i.category || 'other') === catF)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(i =>
        i.title?.toLowerCase().includes(q) ||
        i.description?.toLowerCase().includes(q) ||
        i.location?.toLowerCase().includes(q) ||
        i.reporter?.full_name?.toLowerCase().includes(q)
      )
    }
    return list
  }, [allItems, statusF, catF, search])

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Remove "${title}"?`)) return
    await api.delete(`/api/admin/lost-found/${id}`)
    setAllItems(p => p.filter(i => i.id !== id))
    loadStats()
  }

  const handleResolve = async (id) => {
    if (!window.confirm('Mark this item as resolved?')) return
    const res = await api.patch(`/api/admin/lost-found/${id}/status`, { status: 'resolved' })
    if (res.success) { setAllItems(p => p.map(i => i.id === id ? { ...i, status: 'resolved' } : i)); loadStats() }
  }

  const handleClaimAction = async (claimId, action) => {
    const res = await api.patch(`/api/admin/lost-found/claims/${claimId}`, { action })
    if (res.success) { loadClaims(); loadItems(); loadStats() }
  }

  const pendingCount = stats?.pending_claims || 0

  const statCards = [
    { label: 'Total',         value: stats?.total    ?? allItems.length,                                 cls: 'bg-indigo-50  text-brand        border-indigo-100' },
    { label: 'Lost',          value: stats?.lost     ?? allItems.filter(i => i.status === 'lost').length,     cls: 'bg-orange-50  text-orange-700  border-orange-100' },
    { label: 'Found',         value: stats?.found    ?? allItems.filter(i => i.status === 'found').length,    cls: 'bg-green-50   text-green-700   border-green-100'  },
    { label: 'Resolved',      value: stats?.resolved ?? allItems.filter(i => i.status === 'resolved').length, cls: 'bg-sky-50     text-sky-700     border-sky-100'    },
    { label: 'Pending Claims', value: pendingCount,                                                       cls: pendingCount > 0 ? 'bg-amber-50 text-amber-800 border-amber-100' : 'bg-slate-50 text-slate-500 border-slate-100' },
  ]

  const TABS_DEF = [
    { id: 'items',     label: `All Items (${filtered.length}${filtered.length !== allItems.length ? `/${allItems.length}` : ''})` },
    { id: 'claims',    label: 'Claims' },
    { id: 'emailSync', label: '📧 Email Sync' },
  ]

  const claimFilters = [
    { v: 'all',      label: 'All Claims', activeCls: 'border-indigo-200 bg-indigo-50 text-brand font-bold'        },
    { v: 'pending',  label: 'Pending',    activeCls: 'border-amber-200  bg-amber-50  text-amber-800 font-bold'    },
    { v: 'approved', label: 'Approved',   activeCls: 'border-green-200  bg-green-50  text-green-800 font-bold'   },
    { v: 'rejected', label: 'Rejected',   activeCls: 'border-red-200    bg-red-50    text-red-600 font-bold'      },
  ]

  const logFilters = [
    { v: 'all',       label: 'All',         activeCls: 'border-indigo-200 bg-indigo-50 text-brand font-bold'      },
    { v: 'success',   label: '✅ Success',   activeCls: 'border-green-200  bg-green-50  text-green-700 font-bold' },
    { v: 'failed',    label: '❌ Failed',    activeCls: 'border-red-200    bg-red-50    text-red-600 font-bold'    },
    { v: 'duplicate', label: '🟡 Duplicate', activeCls: 'border-amber-200  bg-amber-50  text-amber-700 font-bold' },
    { v: 'skipped',   label: '⚫ Skipped',  activeCls: 'border-slate-200  bg-slate-100 text-slate-600 font-bold' },
  ]

  return (
    <PageLayout>
      <div className="flex justify-between items-start flex-wrap gap-2.5">
        <div>
          <h1 className="text-[24px] font-extrabold t-primary m-0">Lost &amp; Found</h1>
          <p className="text-[14px] t-muted mt-1 mb-0">Moderate posts and manage claims across campus.</p>
        </div>
        <button onClick={() => { loadItems(); loadStats() }} className="flex items-center gap-1.5 px-4 py-[9px] rounded-[10px] border-[1.5px] border-slate-200 bg-white text-slate-600 text-[13px] font-semibold cursor-pointer hover:bg-slate-50 transition-colors">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-5 gap-3.5">
        {statCards.map((s, i) => (
          <div key={i} className={`${s.cls} rounded-[14px] border px-[18px] py-3.5`}>
            <div className="text-[10px] font-bold uppercase tracking-[0.06em] mb-1.5">{s.label}</div>
            <div className="text-[26px] font-extrabold">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-0 border-b-2 border-slate-100">
        {TABS_DEF.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-[22px] py-[11px] bg-transparent border-0 cursor-pointer text-[14px] -mb-[2px] transition-colors ${tab === t.id ? 'font-bold text-brand border-b-2 border-b-brand' : 'font-medium text-slate-500 border-b-2 border-b-transparent'}`}>
            {t.label}
            {t.id === 'claims' && pendingCount > 0 && (
              <span className="bg-amber-400 text-white rounded-[10px] px-[7px] py-[1px] text-[11px] font-bold">{pendingCount}</span>
            )}
            {t.id === 'emailSync' && gmailStatus && !gmailStatus.configured && (
              <span className="bg-red-100 text-red-600 rounded-[10px] px-[7px] py-[1px] text-[10px] font-bold">Setup needed</span>
            )}
          </button>
        ))}
      </div>

      {/* ITEMS TAB */}
      {tab === 'items' && (
        <>
          <div className="bg-white rounded-[14px] border border-slate-100 px-[18px] py-3.5 flex flex-col gap-3">
            <div className="flex gap-2.5 flex-wrap items-center justify-between">
              <div className="relative w-[300px] shrink-0">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by title, location, reporter..."
                  className="w-full py-2.5 pl-[34px] pr-4 rounded-[10px] border-[1.5px] border-slate-200 text-[14px] outline-none box-border focus:border-brand transition-colors" />
              </div>
              <div className="flex gap-2.5 items-center">
                <select value={statusF} onChange={e => setStatusF(e.target.value)}
                  className="px-4 py-2.5 rounded-[10px] border-[1.5px] border-slate-200 text-[14px] font-medium t-primary bg-white outline-none cursor-pointer focus:border-brand transition-colors">
                  <option value="all">All Status</option>
                  <option value="lost">Lost</option>
                  <option value="found">Found</option>
                  <option value="resolved">Resolved</option>
                </select>
                {(statusF !== 'all' || catF !== 'all' || search) && (
                  <button onClick={() => { setStatusF('all'); setCatF('all'); setSearch('') }}
                    className="px-3 py-[7px] rounded-[9px] border-[1.5px] border-red-200 bg-red-50 text-red-600 text-[12px] font-semibold cursor-pointer whitespace-nowrap">
                    Clear filters
                  </button>
                )}
              </div>
            </div>

            <div className="flex gap-1.5 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
              <button onClick={() => setCatF('all')} className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-[7px] rounded-[10px] border-[1.5px] cursor-pointer text-[12px] font-semibold transition-all ${catF === 'all' ? 'border-brand bg-indigo-50 text-brand' : 'border-slate-200 bg-white text-slate-500'}`}>
                <LayoutGrid size={14} /> All
              </button>
              {CATS.map(c => {
                const isSel = catF === c.value
                const Icon = c.icon
                return (
                  <button key={c.value} onClick={() => setCatF(c.value)}
                    className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-[7px] rounded-[10px] border-[1.5px] cursor-pointer text-[12px] font-semibold transition-all"
                    style={{ borderColor: isSel ? c.color : '#e2e8f0', background: isSel ? c.bg : '#fff', color: isSel ? c.color : '#64748b' }}>
                    <Icon size={14} strokeWidth={isSel ? 2.5 : 2} /> {c.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="bg-white rounded-[16px] border border-slate-100">
            {loading ? (
              <div className="py-[56px] text-center text-[14px] text-slate-400">Loading items...</div>
            ) : filtered.length === 0 ? (
              <div className="py-[56px] text-center text-slate-400">
                <Package size={34} className="opacity-20 mx-auto mb-3 block" />
                <p className="text-[14px] font-semibold m-0">No items match your filters</p>
                <p className="text-[12px] mt-1.5 text-slate-300">Try a different status or category</p>
              </div>
            ) : (
              <div className="overflow-x-auto overflow-y-auto" style={{ maxHeight: 'calc(100dvh - 380px)' }}>
                <table className="w-full border-collapse" style={{ minWidth: 680 }}>
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      {['Item', 'Category', 'Reporter', 'Status', 'Location', 'Date', 'Claims', 'Actions'].map(h => (
                        <th key={h} className={`px-3.5 py-[11px] text-[11px] font-bold text-slate-500 uppercase tracking-[0.04em] whitespace-nowrap ${h === 'Actions' ? 'text-right' : 'text-left'}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(item => (
                      <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                        <td className="px-3.5 py-[13px] max-w-[200px]">
                          <div className="font-semibold text-[13px] t-primary truncate">{item.title}</div>
                          {item.description && <div className="text-[11px] text-slate-400 truncate mt-0.5">{item.description}</div>}
                        </td>
                        <td className="px-3.5 py-[13px]"><CatChip category={item.category} /></td>
                        <td className="px-3.5 py-[13px]">
                          <div className="flex items-center gap-[7px]">
                            <Avatar name={item.reporter?.full_name} url={item.reporter?.avatar_url} />
                            <span className="text-[12px] text-slate-600 whitespace-nowrap max-w-[110px] overflow-hidden text-ellipsis">{item.reporter?.full_name || '—'}</span>
                          </div>
                        </td>
                        <td className="px-3.5 py-[13px]"><StatusBadge status={item.status} /></td>
                        <td className="px-3.5 py-[13px] text-[12px] t-muted whitespace-nowrap">
                          {item.location ? <span className="flex items-center gap-1"><MapPin size={11} color="#94a3b8" />{item.location}</span> : '—'}
                        </td>
                        <td className="px-3.5 py-[13px] text-[12px] t-muted whitespace-nowrap">
                          {item.date ? new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
                        </td>
                        <td className="px-3.5 py-[13px]">
                          {item.claim_counts?.total > 0 ? (
                            <div>
                              <span className="text-[12px] font-semibold text-slate-600">{item.claim_counts.total}</span>
                              {item.claim_counts.pending > 0 && <span className="block text-[10px] text-amber-600 font-bold">{item.claim_counts.pending} pending</span>}
                            </div>
                          ) : <span className="text-[12px] text-slate-300">—</span>}
                        </td>
                        <td className="px-3.5 py-[13px]">
                          <div className="flex gap-[5px] justify-end">
                            {item.status !== 'resolved' && (
                              <button onClick={() => handleResolve(item.id)} title="Mark resolved"
                                className="p-[6px] rounded-[8px] border border-green-200 bg-white cursor-pointer text-green-700 flex items-center hover:bg-green-50 transition-colors">
                                <CheckCircle2 size={14} />
                              </button>
                            )}
                            <button onClick={() => handleDelete(item.id, item.title)} title="Delete"
                              className="p-[6px] rounded-[8px] border border-red-200 bg-white cursor-pointer text-red-500 flex items-center hover:bg-red-50 transition-colors">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* CLAIMS TAB */}
      {tab === 'claims' && (
        <>
          <div className="flex gap-1.5 flex-wrap">
            {claimFilters.map(s => (
              <button key={s.v} onClick={() => setClaimF(s.v)}
                className={`px-4 py-2 rounded-[10px] border-[1.5px] cursor-pointer text-[13px] transition-all ${claimF === s.v ? s.activeCls : 'border-slate-200 bg-white text-slate-600 font-medium'}`}>
                {s.label}
              </button>
            ))}
          </div>

          {claimsLoad ? (
            <div className="text-center py-[56px] text-[14px] text-slate-400">Loading claims...</div>
          ) : claims.length === 0 ? (
            <div className="text-center py-[56px]">
              <AlertCircle size={34} className="opacity-20 mx-auto mb-3 block" />
              <p className="text-[14px] t-muted font-semibold m-0">No {claimF !== 'all' ? claimF : ''} claims</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {claims.map(claim => {
                const ci = catInfo(claim.item?.category)
                return (
                  <div key={claim.id} className={`bg-white rounded-[16px] border-[1.5px] px-[22px] py-[18px] ${claim.status === 'pending' ? 'border-amber-200' : 'border-slate-100'}`}>
                    <div className="flex items-start gap-3.5 flex-wrap justify-between">
                      <div className="flex items-center gap-2.5 flex-[1_1_200px]">
                        <div className="w-11 h-11 rounded-[12px] flex items-center justify-center shrink-0" style={{ background: ci.bg, color: ci.color }}>
                          <ci.icon size={22} strokeWidth={2.5} />
                        </div>
                        <div>
                          <div className="font-bold text-[14px] t-primary">{claim.item?.title || '—'}</div>
                          <div className="flex gap-[5px] mt-0.5 flex-wrap">
                            {claim.item?.status   && <StatusBadge status={claim.item.status} />}
                            {claim.item?.category && <CatChip category={claim.item.category} />}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <Avatar name={claim.claimer?.full_name} url={claim.claimer?.avatar_url} size={30} />
                        <div>
                          <div className="text-[13px] font-bold t-primary">{claim.claimer?.full_name || '—'}</div>
                          <div className="text-[11px] text-slate-400">{new Date(claim.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                        </div>
                        <span className={`text-[11px] font-bold uppercase px-[10px] py-[3px] rounded-[20px] ml-1.5 ${CLAIM_STATUS_CLS[claim.status] || CLAIM_STATUS_CLS.rejected}`}>
                          {claim.status}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 px-3.5 py-2.5 bg-slate-50 rounded-[9px] text-[13px] text-slate-700 leading-[1.55]">
                      {claim.message}
                    </div>

                    <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                      <div>
                        {claim.proof_url && (
                          <a href={claim.proof_url} target="_blank" rel="noopener noreferrer"
                            className="text-[12px] text-brand font-semibold inline-flex items-center gap-1 no-underline">
                            <ExternalLink size={12} /> View proof
                          </a>
                        )}
                        {claim.admin_note && <p className="text-[12px] text-slate-400 m-0 mt-1 italic">Note: {claim.admin_note}</p>}
                      </div>
                      {claim.status === 'pending' && (
                        <div className="flex gap-2">
                          <button onClick={() => handleClaimAction(claim.id, 'approve')}
                            className="px-[18px] py-2 rounded-[9px] border-0 bg-green-700 text-white text-[13px] font-bold cursor-pointer hover:bg-green-800 transition-colors">
                            ✓ Approve
                          </button>
                          <button onClick={() => handleClaimAction(claim.id, 'reject')}
                            className="px-4 py-2 rounded-[9px] border-[1.5px] border-red-300 bg-white text-red-600 text-[13px] font-semibold cursor-pointer hover:bg-red-50 transition-colors">
                            ✗ Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* EMAIL SYNC TAB */}
      {tab === 'emailSync' && (
        <>
          {gmailStatus ? (
            <div className={`flex items-center gap-4 flex-wrap px-5 py-4 rounded-[16px] border ${gmailStatus.configured ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="text-[24px]">{gmailStatus.configured ? '✅' : '⚠️'}</div>
              <div className="flex-1">
                <div className={`font-bold text-[14px] mb-0.5 ${gmailStatus.configured ? 'text-green-700' : 'text-red-600'}`}>
                  {gmailStatus.configured ? 'Gmail Connected' : 'Gmail Not Configured'}
                </div>
                {gmailStatus.configured ? (
                  <div className="text-[12px] t-muted">
                    Monitoring: <strong>{gmailStatus.whitelist?.join(', ')}</strong>
                    {gmailStatus.last_polled_at && (
                      <> · Last poll: <strong>{new Date(gmailStatus.last_polled_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</strong></>
                    )}
                  </div>
                ) : (
                  <div className="text-[12px] t-muted">
                    Follow the setup guide in <code className="bg-red-100 px-1.5 py-[1px] rounded text-[11px]">server/.env</code> to connect Gmail.
                  </div>
                )}
              </div>
              <button onClick={loadEmailLogs} className="flex items-center gap-1.5 px-4 py-2 rounded-[10px] border-[1.5px] border-slate-200 bg-white text-[13px] font-semibold cursor-pointer text-slate-600 hover:bg-slate-50 transition-colors">
                <RefreshCw size={13} /> Refresh
              </button>
            </div>
          ) : (
            <div className="p-5 bg-slate-50 rounded-[14px] border border-slate-100 text-[14px] text-slate-400">Loading Gmail status...</div>
          )}

          <div className="flex gap-2 flex-wrap">
            {logFilters.map(s => (
              <button key={s.v} onClick={() => setLogFilter(s.v)}
                className={`px-3.5 py-[7px] rounded-[10px] border-[1.5px] cursor-pointer text-[12px] transition-all ${logFilter === s.v ? s.activeCls : 'border-slate-200 bg-white text-slate-600 font-medium'}`}>
                {s.label}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-[16px] border border-slate-100 overflow-hidden">
            {logsLoading ? (
              <div className="py-[56px] text-center text-[14px] text-slate-400">Loading logs...</div>
            ) : emailLogs.length === 0 ? (
              <div className="py-[56px] text-center">
                <div className="text-[36px] mb-3">📭</div>
                <p className="text-[14px] t-muted font-semibold m-0">No email logs yet</p>
                <p className="text-[12px] text-slate-400 mt-1.5">{gmailStatus?.configured ? 'Waiting for the first email from adminofficer@thapar.edu' : 'Complete Gmail setup first'}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse" style={{ minWidth: 700 }}>
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      {['Time', 'From', 'Subject', 'Status', 'Item Created'].map(h => (
                        <th key={h} className="px-3.5 py-[11px] text-left text-[11px] font-bold text-slate-500 uppercase tracking-[0.04em] whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {emailLogs.map(log => {
                      const ls = EMAIL_LOG_CLS[log.status] || EMAIL_LOG_CLS.skipped
                      return (
                        <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                          <td className="px-3.5 py-3 text-[12px] t-muted whitespace-nowrap">
                            {new Date(log.processed_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="px-3.5 py-3 text-[12px] text-slate-600 max-w-[160px] overflow-hidden text-ellipsis whitespace-nowrap">{log.sender_email}</td>
                          <td className="px-3.5 py-3 max-w-[260px]">
                            <div className="text-[13px] font-semibold t-primary truncate">{log.subject || '—'}</div>
                            {log.error_message && <div className="text-[11px] text-red-500 mt-0.5 truncate">{log.error_message}</div>}
                          </td>
                          <td className="px-3.5 py-3">
                            <span className={`${ls.cls} px-[9px] py-[2px] rounded-[20px] text-[11px] font-bold whitespace-nowrap`}>{ls.label}</span>
                          </td>
                          <td className="px-3.5 py-3 text-[12px] text-slate-600">
                            {log.item?.title ? <span className="font-semibold text-brand">{log.item.title}</span> : '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </PageLayout>
  )
}
