import { useState, useEffect } from 'react'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'
import { ShoppingBag, Flag, CheckCircle, AlertTriangle, Trash2, TrendingUp, Eye, Package, Search, ShieldCheck, ShieldX, Clock, X } from 'lucide-react'

function formatPrice(price) {
  if (price === null || price === undefined || price === 0) return 'Free'
  return `₹${Number(price).toLocaleString('en-IN')}`
}

function timeAgo(d) {
  const diff = (Date.now() - new Date(d)) / 1000
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

const REPORT_STATUS_CFG = {
  Pending:   { chipCls: 'bg-amber-100 text-amber-600', btnActiveCls: 'border-amber-300 bg-amber-50 text-amber-700 font-bold', icon: Clock },
  Resolved:  { chipCls: 'bg-green-100 text-green-600', btnActiveCls: 'border-green-300 bg-green-50 text-green-700 font-bold', icon: ShieldCheck },
  Dismissed: { chipCls: 'bg-slate-100 text-slate-500', btnActiveCls: 'border-slate-300 bg-slate-100 text-slate-600 font-bold', icon: ShieldX },
}

const LISTING_STATUS_CLS = {
  Active:   'bg-green-100 text-green-700',
  Reserved: 'bg-amber-100 text-amber-700',
  Sold:     'bg-red-100 text-red-600',
  Draft:    'bg-slate-100 text-slate-500',
  Deleted:  'bg-red-50 text-red-400',
}

function StatCard({ label, value, icon: Icon, color, bg }) {
  return (
    <div className="bg-white rounded-[20px] px-6 py-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-slate-100 flex items-center gap-4">
      <div className="w-12 h-12 rounded-[14px] flex items-center justify-center shrink-0" style={{ background: bg }}>
        <Icon size={22} color={color} />
      </div>
      <div>
        <p className="text-[13px] t-muted m-0 font-semibold">{label}</p>
        <p className="text-[26px] font-extrabold t-primary m-0 mt-0.5">{value}</p>
      </div>
    </div>
  )
}

export default function ManageMarketplace() {
  const [stats, setStats]       = useState(null)
  const [reports, setReports]   = useState([])
  const [listings, setListings] = useState([])
  const [tab, setTab]           = useState('reports')
  const [reportFilter, setReportFilter] = useState('Pending')
  const [listingSearch, setListingSearch] = useState('')
  const [listingStatus, setListingStatus] = useState('all')
  const [loading, setLoading]   = useState(true)
  const [selectedReport, setSelectedReport] = useState(null)
  const [actionNote, setActionNote]         = useState('')
  const [actionLoading, setActionLoading]   = useState(false)

  const loadStats = async () => {
    try { const res = await api.get('/api/admin/marketplace/stats'); setStats(res.data) } catch {}
  }

  const loadReports = async () => {
    setLoading(true)
    try { const res = await api.get(`/api/admin/marketplace/reports?status=${reportFilter}`); setReports(res.data || []) } catch {}
    finally { setLoading(false) }
  }

  const loadListings = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: 60, ...(listingStatus !== 'all' && { status: listingStatus }), ...(listingSearch && { search: listingSearch }) })
      const res = await api.get(`/api/admin/marketplace/listings?${params}`)
      setListings(res.data || [])
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { loadStats() }, [])
  useEffect(() => { if (tab === 'reports') loadReports() }, [tab, reportFilter])
  useEffect(() => {
    if (tab === 'listings') {
      const t = setTimeout(() => loadListings(), listingSearch ? 350 : 0)
      return () => clearTimeout(t)
    }
  }, [tab, listingStatus, listingSearch])

  const handleReportAction = async (status) => {
    if (!selectedReport) return
    setActionLoading(true)
    try {
      await api.patch(`/api/admin/marketplace/reports/${selectedReport.id}`, { status, admin_note: actionNote })
      setReports(p => p.map(r => r.id === selectedReport.id ? { ...r, status } : r))
      setSelectedReport(null); setActionNote('')
    } catch (err) { alert(err.message || 'Failed') }
    finally { setActionLoading(false) }
  }

  const handleForceDelete = async (id, title) => {
    if (!window.confirm(`Force-remove listing "${title}"? This will soft-delete it.`)) return
    try {
      await api.delete(`/api/admin/marketplace/listings/${id}`)
      setListings(p => p.map(l => l.id === id ? { ...l, status: 'Deleted' } : l))
      loadStats()
    } catch (err) { alert(err.message || 'Failed') }
  }

  return (
    <PageLayout>
      <div>
        <h1 className="text-[28px] font-extrabold t-primary m-0">Marketplace Admin</h1>
        <p className="text-[15px] t-muted mt-1.5 mb-0">Moderate listings, review reports, and manage the campus marketplace.</p>
      </div>

      {stats && (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
          <StatCard label="Active Listings"  value={stats.active}          icon={ShoppingBag}  color="#6366f1" bg="#eef2ff" />
          <StatCard label="Items Sold"       value={stats.sold}            icon={CheckCircle}  color="#16a34a" bg="#dcfce7" />
          <StatCard label="Reserved"         value={stats.reserved}        icon={Clock}        color="#d97706" bg="#fef3c7" />
          <StatCard label="Pending Reports"  value={stats.pending_reports} icon={Flag}         color="#ef4444" bg="#fff5f5" />
          <StatCard label="Total Saves"      value={stats.total_saved}     icon={TrendingUp}   color="#3b82f6" bg="#eff6ff" />
        </div>
      )}

      {stats?.by_category && Object.keys(stats.by_category).length > 0 && (
        <div className="bg-white rounded-[20px] px-6 py-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-slate-100">
          <h3 className="text-[16px] font-bold t-primary m-0 mb-4">Category Breakdown</h3>
          <div className="flex gap-3 flex-wrap">
            {Object.entries(stats.by_category).sort((a, b) => b[1] - a[1]).map(([cat, count]) => (
              <div key={cat} className="flex items-center gap-2 px-4 py-2 rounded-[20px] bg-slate-50 border border-slate-200">
                <span className="text-[13px] font-bold t-primary">{cat}</span>
                <span className="text-[12px] font-bold text-brand bg-indigo-50 px-2 py-[2px] rounded-[20px]">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-[15px] w-fit">
        {[{ id: 'reports', label: '🚨 Reports', badge: stats?.pending_reports }, { id: 'listings', label: '📋 All Listings' }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-[22px] py-[9px] rounded-[11px] border-0 cursor-pointer text-[14px] transition-all ${tab === t.id ? 'bg-white font-bold text-brand shadow-[0_1px_4px_rgba(0,0,0,0.08)]' : 'bg-transparent font-medium text-slate-500'}`}>
            {t.label}
            {t.badge > 0 && <span className="bg-red-500 text-white rounded-full text-[11px] font-extrabold px-[6px] leading-[18px]">{t.badge}</span>}
          </button>
        ))}
      </div>

      {tab === 'reports' && (
        <div>
          <div className="flex gap-2 mb-5">
            {['Pending', 'Resolved', 'Dismissed', 'all'].map(s => {
              const conf = REPORT_STATUS_CFG[s] || { btnActiveCls: 'border-indigo-200 bg-indigo-50 text-brand font-bold' }
              return (
                <button key={s} onClick={() => setReportFilter(s)}
                  className={`px-4 py-[7px] rounded-[20px] border-[1.5px] cursor-pointer text-[13px] transition-all ${reportFilter === s ? conf.btnActiveCls : 'border-slate-200 bg-white text-slate-500 font-medium'}`}>
                  {s === 'all' ? 'All' : s}
                </button>
              )
            })}
          </div>

          {loading ? (
            <div className="flex flex-col gap-3">
              {[1,2,3].map(i => <div key={i} className="h-[100px] bg-slate-100 rounded-[20px] animate-pulse" />)}
            </div>
          ) : reports.length === 0 ? (
            <div className="py-[60px] px-10 text-center bg-white rounded-[24px] border-2 border-dashed border-slate-200">
              <ShieldCheck size={40} color="#e2e8f0" className="mb-3 mx-auto block" />
              <h3 className="text-[18px] font-bold t-primary m-0 mb-1.5">No {reportFilter} reports</h3>
              <p className="text-[14px] t-muted m-0">The marketplace is clean! 🎉</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3.5">
              {reports.map(report => {
                const conf = REPORT_STATUS_CFG[report.status] || REPORT_STATUS_CFG['Pending']
                const StatusIcon = conf.icon
                return (
                  <div key={report.id} className="bg-white rounded-[20px] px-[22px] py-[18px] shadow-[0_2px_10px_rgba(0,0,0,0.05)] border border-slate-100">
                    <div className="flex gap-3.5 items-start">
                      <div className="w-14 h-14 rounded-[13px] overflow-hidden bg-slate-50 shrink-0">
                        {report.listing?.images?.[0]
                          ? <img src={report.listing.images[0]} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-[22px]">📦</div>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <p className="font-bold text-[15px] t-primary m-0 truncate max-w-[400px]">{report.listing?.title || 'Deleted Listing'}</p>
                            <p className="text-[13px] t-muted m-0 mt-0.5">Reported by <strong>{report.reporter?.full_name}</strong> · {timeAgo(report.created_at)}</p>
                          </div>
                          <span className={`flex items-center gap-[5px] px-3 py-1 rounded-[20px] text-[12px] font-bold shrink-0 ${conf.chipCls}`}>
                            <StatusIcon size={12} /> {report.status}
                          </span>
                        </div>
                        <div className="flex gap-2 mt-2.5 items-center flex-wrap">
                          <span className="px-3 py-[3px] rounded-[20px] bg-red-50 text-red-500 text-[12px] font-bold">{report.reason}</span>
                          {report.listing?.seller?.full_name && <span className="text-[12px] text-slate-400">Seller: {report.listing.seller.full_name}</span>}
                          {report.status === 'Pending' && (
                            <div className="ml-auto flex gap-2">
                              <button onClick={() => setSelectedReport(report)} className="px-4 py-[6px] rounded-[10px] bg-green-100 border-0 text-green-700 font-bold text-[13px] cursor-pointer hover:bg-green-200 transition-colors">✅ Resolve</button>
                              <button onClick={() => { setSelectedReport(report); setTimeout(() => handleReportAction('Dismissed'), 0) }} className="px-4 py-[6px] rounded-[10px] bg-slate-100 border-0 text-slate-600 font-bold text-[13px] cursor-pointer hover:bg-slate-200 transition-colors">Dismiss</button>
                              {report.listing?.id && (
                                <button onClick={() => handleForceDelete(report.listing.id, report.listing.title)} className="flex items-center gap-1 px-4 py-[6px] rounded-[10px] bg-red-50 border-0 text-red-500 font-bold text-[13px] cursor-pointer hover:bg-red-100 transition-colors">
                                  <Trash2 size={12} /> Remove Listing
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {tab === 'listings' && (
        <div>
          <div className="flex gap-3 mb-5 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={16} color="#94a3b8" className="absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input value={listingSearch} onChange={e => setListingSearch(e.target.value)} placeholder="Search listings..."
                className="w-full py-2.5 pl-10 pr-3.5 rounded-[14px] border-[1.5px] border-slate-200 text-[14px] t-primary outline-none box-border focus:border-brand transition-colors" />
            </div>
            <select value={listingStatus} onChange={e => setListingStatus(e.target.value)}
              className="px-4 py-2.5 rounded-[14px] border-[1.5px] border-slate-200 text-[14px] t-primary bg-white cursor-pointer outline-none focus:border-brand transition-colors">
              <option value="all">All Statuses</option>
              {['Active','Reserved','Sold','Draft','Deleted'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {loading ? (
            <div className="flex flex-col gap-3">
              {[1,2,3].map(i => <div key={i} className="h-20 bg-slate-100 rounded-[18px] animate-pulse" />)}
            </div>
          ) : listings.length === 0 ? (
            <div className="py-[60px] text-center bg-white rounded-[24px] border-2 border-dashed border-slate-200">
              <Package size={40} color="#e2e8f0" className="mb-3 mx-auto block" />
              <h3 className="text-[18px] font-bold t-primary m-0">No listings found</h3>
            </div>
          ) : (
            <div className="bg-white rounded-[20px] overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-slate-100">
              <div className="grid gap-3 px-5 py-3 border-b border-slate-50 bg-slate-50" style={{ gridTemplateColumns: '56px 1fr 100px 90px 70px 100px' }}>
                {['Photo', 'Listing', 'Price', 'Category', 'Views', 'Actions'].map(h => (
                  <span key={h} className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.5px]">{h}</span>
                ))}
              </div>
              {listings.map(item => {
                const scCls = LISTING_STATUS_CLS[item.status] || 'bg-slate-100 text-slate-500'
                return (
                  <div key={item.id} className={`grid gap-3 px-5 py-3.5 border-b border-slate-50 items-center ${item.status === 'Deleted' ? 'opacity-55' : ''}`}
                    style={{ gridTemplateColumns: '56px 1fr 100px 90px 70px 100px' }}>
                    <div className="w-11 h-11 rounded-[10px] overflow-hidden bg-slate-50">
                      {item.images?.[0] ? <img src={item.images[0]} alt="" className="w-full h-full object-cover" /> : <div className="text-[20px] leading-[44px] text-center">📦</div>}
                    </div>
                    <div>
                      <p className="font-bold text-[13px] t-primary m-0 truncate max-w-[220px]">{item.title}</p>
                      <div className="flex gap-1.5 mt-0.5 items-center">
                        <span className="text-[11px] t-muted">{item.seller?.full_name}</span>
                        <span className={`px-2 py-[1px] rounded-[20px] text-[10px] font-bold ${scCls}`}>{item.status}</span>
                      </div>
                    </div>
                    <span className={`font-extrabold text-[14px] ${item.price === null || item.price === 0 ? 'text-emerald-500' : 'text-brand'}`}>{formatPrice(item.price)}</span>
                    <span className="text-[13px] text-slate-600">{item.category}</span>
                    <div className="flex items-center gap-1">
                      <Eye size={12} color="#94a3b8" />
                      <span className="text-[13px] text-slate-400">{item.views_count || 0}</span>
                    </div>
                    {item.status !== 'Deleted' ? (
                      <button onClick={() => handleForceDelete(item.id, item.title)} className="flex items-center gap-1 px-3 py-[5px] rounded-[10px] bg-red-50 border-0 text-red-500 font-bold text-[12px] cursor-pointer hover:bg-red-100 transition-colors">
                        <Trash2 size={12} /> Remove
                      </button>
                    ) : (
                      <span className="text-[12px] text-slate-400">Removed</span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {selectedReport && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[4px] flex items-center justify-center z-[1000] p-5">
          <div className="bg-white rounded-[24px] p-7 max-w-[440px] w-full">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-[20px] font-extrabold t-primary m-0">Resolve Report</h3>
              <button onClick={() => setSelectedReport(null)} className="bg-transparent border-0 cursor-pointer"><X size={20} color="#94a3b8" /></button>
            </div>
            <p className="text-[14px] t-muted m-0 mb-4">
              Listing: <strong>{selectedReport.listing?.title}</strong><br />
              Reason: <strong>{selectedReport.reason}</strong>
            </p>
            <textarea value={actionNote} onChange={e => setActionNote(e.target.value)} rows={3} placeholder="Admin note (optional)..."
              className="w-full px-3.5 py-3 rounded-[13px] border-[1.5px] border-slate-200 outline-none text-[14px] t-primary box-border resize-none mb-4 focus:border-brand transition-colors" />
            <div className="flex gap-2.5">
              <button onClick={() => handleReportAction('Resolved')} disabled={actionLoading} className="flex-1 py-3 rounded-[13px] bg-green-100 border-0 text-green-700 font-bold text-[14px] cursor-pointer hover:bg-green-200 transition-colors">✅ Resolve</button>
              <button onClick={() => handleReportAction('Dismissed')} disabled={actionLoading} className="flex-1 py-3 rounded-[13px] bg-slate-100 border-0 text-slate-600 font-bold text-[14px] cursor-pointer hover:bg-slate-200 transition-colors">Dismiss</button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  )
}
