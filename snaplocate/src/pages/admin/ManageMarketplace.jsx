import { useState, useEffect } from 'react'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'
import {
  ShoppingBag, Flag, CheckCircle, AlertTriangle, Trash2,
  TrendingUp, BarChart2, Eye, Package, Search, Filter,
  ChevronDown, ShieldCheck, ShieldX, Clock, X
} from 'lucide-react'

const FONT = "'Plus Jakarta Sans', 'Inter', sans-serif"

function formatPrice(price) {
  if (price === null || price === undefined || price === 0) return 'Free'
  return `₹${Number(price).toLocaleString('en-IN')}`
}

function timeAgo(d) {
  const diff = (Date.now() - new Date(d)) / 1000
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

const REPORT_STATUS_CONFIG = {
  Pending:   { bg: '#fef3c7', color: '#d97706', icon: Clock },
  Resolved:  { bg: '#dcfce7', color: '#16a34a', icon: ShieldCheck },
  Dismissed: { bg: '#f1f5f9', color: '#64748b', icon: ShieldX },
}
const LISTING_STATUS_CONFIG = {
  Active:   { bg: '#dcfce7', color: '#16a34a' },
  Reserved: { bg: '#fef3c7', color: '#d97706' },
  Sold:     { bg: '#fee2e2', color: '#dc2626' },
  Draft:    { bg: '#f1f5f9', color: '#64748b' },
  Deleted:  { bg: '#fef2f2', color: '#ef4444' },
}

// ─── Stat Card ────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color, bg }) {
  return (
    <div style={{ background: '#fff', borderRadius: 20, padding: '20px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{ width: 48, height: 48, borderRadius: 14, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={22} color={color} />
      </div>
      <div>
        <p style={{ fontFamily: FONT, fontSize: 13, color: '#64748b', margin: 0, fontWeight: 600 }}>{label}</p>
        <p style={{ fontFamily: FONT, fontSize: 26, fontWeight: 800, color: '#0f172a', margin: '2px 0 0' }}>{value}</p>
      </div>
    </div>
  )
}

export default function ManageMarketplace() {
  const [stats, setStats]     = useState(null)
  const [reports, setReports] = useState([])
  const [listings, setListings] = useState([])
  const [tab, setTab]         = useState('reports') // 'reports' | 'listings'
  const [reportFilter, setReportFilter] = useState('Pending')
  const [listingSearch, setListingSearch] = useState('')
  const [listingStatus, setListingStatus] = useState('all')
  const [loading, setLoading] = useState(true)
  const [selectedReport, setSelectedReport] = useState(null)
  const [actionNote, setActionNote] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const loadStats = async () => {
    try {
      const res = await api.get('/api/admin/marketplace/stats')
      setStats(res.data)
    } catch (err) { console.error(err) }
  }

  const loadReports = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/api/admin/marketplace/reports?status=${reportFilter}`)
      setReports(res.data || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const loadListings = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: 60, ...(listingStatus !== 'all' && { status: listingStatus }), ...(listingSearch && { search: listingSearch }) })
      const res = await api.get(`/api/admin/marketplace/listings?${params}`)
      setListings(res.data || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
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
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');`}</style>

      <div style={{ width: '100%', maxWidth: '100%', padding: '0 24px', boxSizing: 'border-box', fontFamily: FONT }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: FONT, fontWeight: 800, fontSize: 28, color: '#0f172a', margin: 0 }}>Marketplace Admin</h1>
          <p style={{ fontFamily: FONT, fontSize: 15, color: '#64748b', margin: '6px 0 0' }}>Moderate listings, review reports, and manage the campus marketplace.</p>
        </div>

        {/* Stats */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
            <StatCard label="Active Listings" value={stats.active} icon={ShoppingBag} color="#6366f1" bg="#eef2ff" />
            <StatCard label="Items Sold"      value={stats.sold}   icon={CheckCircle} color="#16a34a" bg="#dcfce7" />
            <StatCard label="Reserved"        value={stats.reserved} icon={Clock}    color="#d97706" bg="#fef3c7" />
            <StatCard label="Pending Reports" value={stats.pending_reports} icon={Flag} color="#ef4444" bg="#fff5f5" />
            <StatCard label="Total Saves"     value={stats.total_saved} icon={TrendingUp} color="#3b82f6" bg="#eff6ff" />
          </div>
        )}

        {/* Category breakdown */}
        {stats?.by_category && Object.keys(stats.by_category).length > 0 && (
          <div style={{ background: '#fff', borderRadius: 20, padding: '20px 24px', marginBottom: 32, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}>
            <h3 style={{ fontFamily: FONT, fontWeight: 700, fontSize: 16, color: '#0f172a', margin: '0 0 16px' }}>Category Breakdown</h3>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {Object.entries(stats.by_category).sort((a, b) => b[1] - a[1]).map(([cat, count]) => (
                <div key={cat} style={{ padding: '8px 16px', borderRadius: 20, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 13, color: '#0f172a' }}>{cat}</span>
                  <span style={{ fontFamily: FONT, fontSize: 12, fontWeight: 700, color: '#6366f1', background: '#eef2ff', padding: '2px 8px', borderRadius: 20 }}>{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: '#f1f5f9', padding: 4, borderRadius: 15, width: 'fit-content' }}>
          {[{ id: 'reports', label: '🚨 Reports', badge: stats?.pending_reports }, { id: 'listings', label: '📋 All Listings' }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '9px 22px', borderRadius: 11, border: 'none', cursor: 'pointer',
              background: tab === t.id ? '#fff' : 'transparent',
              boxShadow: tab === t.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              fontFamily: FONT, fontWeight: tab === t.id ? 700 : 500,
              fontSize: 14, color: tab === t.id ? '#6366f1' : '#64748b',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              {t.label}
              {t.badge > 0 && <span style={{ background: '#ef4444', color: '#fff', borderRadius: '50%', fontSize: 11, fontWeight: 800, padding: '0 6px', lineHeight: '18px' }}>{t.badge}</span>}
            </button>
          ))}
        </div>

        {/* ─── REPORTS tab ─── */}
        {tab === 'reports' && (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {['Pending', 'Resolved', 'Dismissed', 'all'].map(s => {
                const conf = REPORT_STATUS_CONFIG[s] || { bg: '#f1f5f9', color: '#64748b' }
                return (
                  <button key={s} onClick={() => setReportFilter(s)} style={{
                    padding: '7px 16px', borderRadius: 20, border: `1.5px solid ${reportFilter === s ? conf.color : '#e2e8f0'}`,
                    background: reportFilter === s ? conf.bg : '#fff',
                    color: reportFilter === s ? conf.color : '#64748b',
                    fontFamily: FONT, fontWeight: 700, fontSize: 13, cursor: 'pointer',
                  }}>{s === 'all' ? 'All' : s}</button>
                )
              })}
            </div>

            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[1,2,3].map(i => <div key={i} style={{ height: 100, background: '#f1f5f9', borderRadius: 20, animation: 'pulse 1.5s infinite' }} />)}
              </div>
            ) : reports.length === 0 ? (
              <div style={{ padding: '60px 40px', textAlign: 'center', background: '#fff', borderRadius: 24, border: '2px dashed #e2e8f0' }}>
                <ShieldCheck size={40} color="#e2e8f0" style={{ marginBottom: 12 }} />
                <h3 style={{ fontFamily: FONT, fontWeight: 700, fontSize: 18, color: '#0f172a', margin: '0 0 6px' }}>No {reportFilter} reports</h3>
                <p style={{ fontFamily: FONT, fontSize: 14, color: '#64748b', margin: 0 }}>The marketplace is clean! 🎉</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {reports.map(report => {
                  const conf = REPORT_STATUS_CONFIG[report.status] || REPORT_STATUS_CONFIG['Pending']
                  const StatusIcon = conf.icon
                  return (
                    <div key={report.id} style={{ background: '#fff', borderRadius: 20, padding: '18px 22px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
                      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                        {/* Listing thumbnail */}
                        <div style={{ width: 56, height: 56, borderRadius: 13, overflow: 'hidden', background: '#f8fafc', flexShrink: 0 }}>
                          {report.listing?.images?.[0]
                            ? <img src={report.listing.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>📦</div>
                          }
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                            <div>
                              <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: 15, color: '#0f172a', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 400 }}>
                                {report.listing?.title || 'Deleted Listing'}
                              </p>
                              <p style={{ fontFamily: FONT, fontSize: 13, color: '#64748b', margin: '3px 0 0' }}>
                                Reported by <strong>{report.reporter?.full_name}</strong> · {timeAgo(report.created_at)}
                              </p>
                            </div>
                            <span style={{ padding: '4px 12px', borderRadius: 20, background: conf.bg, color: conf.color, fontFamily: FONT, fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                              <StatusIcon size={12} /> {report.status}
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center' }}>
                            <span style={{ padding: '3px 12px', borderRadius: 20, background: '#fff5f5', color: '#ef4444', fontFamily: FONT, fontWeight: 700, fontSize: 12 }}>
                              {report.reason}
                            </span>
                            {report.listing?.seller?.full_name && (
                              <span style={{ fontFamily: FONT, fontSize: 12, color: '#94a3b8' }}>Seller: {report.listing.seller.full_name}</span>
                            )}
                            {report.status === 'Pending' && (
                              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                                <button onClick={() => setSelectedReport(report)} style={{ padding: '6px 16px', borderRadius: 10, background: '#dcfce7', border: 'none', color: '#16a34a', fontFamily: FONT, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                                  ✅ Resolve
                                </button>
                                <button onClick={() => { setSelectedReport(report); setTimeout(() => handleReportAction('Dismissed'), 0) }} style={{ padding: '6px 16px', borderRadius: 10, background: '#f1f5f9', border: 'none', color: '#64748b', fontFamily: FONT, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                                  Dismiss
                                </button>
                                {report.listing?.id && (
                                  <button onClick={() => handleForceDelete(report.listing.id, report.listing.title)} style={{ padding: '6px 16px', borderRadius: 10, background: '#fff5f5', border: 'none', color: '#ef4444', fontFamily: FONT, fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
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

        {/* ─── LISTINGS tab ─── */}
        {tab === 'listings' && (
          <div>
            {/* Filters */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                <input value={listingSearch} onChange={e => setListingSearch(e.target.value)} placeholder="Search listings..." style={{ width: '100%', padding: '10px 14px 10px 40px', borderRadius: 14, border: '1.5px solid #e2e8f0', outline: 'none', fontFamily: FONT, fontSize: 14, color: '#0f172a', boxSizing: 'border-box' }} />
              </div>
              <select value={listingStatus} onChange={e => setListingStatus(e.target.value)} style={{ padding: '10px 16px', borderRadius: 14, border: '1.5px solid #e2e8f0', fontFamily: FONT, fontSize: 14, color: '#0f172a', background: '#fff', cursor: 'pointer', outline: 'none' }}>
                <option value="all">All Statuses</option>
                {['Active','Reserved','Sold','Draft','Deleted'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[1,2,3].map(i => <div key={i} style={{ height: 80, background: '#f1f5f9', borderRadius: 18, animation: 'pulse 1.5s infinite' }} />)}
              </div>
            ) : listings.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center', background: '#fff', borderRadius: 24, border: '2px dashed #e2e8f0' }}>
                <Package size={40} color="#e2e8f0" style={{ marginBottom: 12 }} />
                <h3 style={{ fontFamily: FONT, fontWeight: 700, fontSize: 18, color: '#0f172a', margin: 0 }}>No listings found</h3>
              </div>
            ) : (
              <div style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}>
                {/* Table header */}
                <div style={{ display: 'grid', gridTemplateColumns: '56px 1fr 100px 90px 70px 100px', gap: 12, padding: '12px 20px', borderBottom: '1px solid #f8fafc', background: '#f8fafc' }}>
                  {['Photo', 'Listing', 'Price', 'Category', 'Views', 'Actions'].map(h => (
                    <span key={h} style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</span>
                  ))}
                </div>
                {listings.map(item => {
                  const sc = LISTING_STATUS_CONFIG[item.status] || {}
                  return (
                    <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '56px 1fr 100px 90px 70px 100px', gap: 12, padding: '14px 20px', borderBottom: '1px solid #f8fafc', alignItems: 'center', opacity: item.status === 'Deleted' ? 0.55 : 1 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 10, overflow: 'hidden', background: '#f8fafc' }}>
                        {item.images?.[0] ? <img src={item.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ fontSize: 20, lineHeight: '44px', textAlign: 'center' }}>📦</div>}
                      </div>
                      <div>
                        <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: 13, color: '#0f172a', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 220 }}>{item.title}</p>
                        <div style={{ display: 'flex', gap: 6, marginTop: 3, alignItems: 'center' }}>
                          <span style={{ fontFamily: FONT, fontSize: 11, color: '#64748b' }}>{item.seller?.full_name}</span>
                          <span style={{ padding: '1px 8px', borderRadius: 20, background: sc.bg, color: sc.color, fontFamily: FONT, fontSize: 10, fontWeight: 700 }}>{item.status}</span>
                        </div>
                      </div>
                      <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 14, color: item.price === null || item.price === 0 ? '#10b981' : '#6366f1' }}>{formatPrice(item.price)}</span>
                      <span style={{ fontFamily: FONT, fontSize: 13, color: '#475569' }}>{item.category}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Eye size={12} color="#94a3b8" />
                        <span style={{ fontFamily: FONT, fontSize: 13, color: '#94a3b8' }}>{item.views_count || 0}</span>
                      </div>
                      {item.status !== 'Deleted' ? (
                        <button onClick={() => handleForceDelete(item.id, item.title)} style={{ padding: '5px 12px', borderRadius: 10, background: '#fff5f5', border: 'none', color: '#ef4444', fontFamily: FONT, fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Trash2 size={12} /> Remove
                        </button>
                      ) : (
                        <span style={{ fontFamily: FONT, fontSize: 12, color: '#94a3b8' }}>Removed</span>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── Resolve report modal ─── */}
      {selectedReport && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 24, padding: 28, maxWidth: 440, width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontFamily: FONT, fontWeight: 800, fontSize: 20, color: '#0f172a', margin: 0 }}>Resolve Report</h3>
              <button onClick={() => setSelectedReport(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#94a3b8" /></button>
            </div>
            <p style={{ fontFamily: FONT, fontSize: 14, color: '#64748b', margin: '0 0 16px' }}>
              Listing: <strong>{selectedReport.listing?.title}</strong><br />
              Reason: <strong>{selectedReport.reason}</strong>
            </p>
            <textarea value={actionNote} onChange={e => setActionNote(e.target.value)} rows={3} placeholder="Admin note (optional)..."
              style={{ width: '100%', padding: '12px 14px', borderRadius: 13, border: '1.5px solid #e2e8f0', outline: 'none', fontFamily: FONT, fontSize: 14, color: '#0f172a', boxSizing: 'border-box', resize: 'none', marginBottom: 16 }} />
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => handleReportAction('Resolved')} disabled={actionLoading} style={{ flex: 1, padding: '12px', borderRadius: 13, background: '#dcfce7', border: 'none', color: '#16a34a', fontFamily: FONT, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                ✅ Resolve
              </button>
              <button onClick={() => handleReportAction('Dismissed')} disabled={actionLoading} style={{ flex: 1, padding: '12px', borderRadius: 13, background: '#f1f5f9', border: 'none', color: '#64748b', fontFamily: FONT, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </PageLayout>
  )
}
