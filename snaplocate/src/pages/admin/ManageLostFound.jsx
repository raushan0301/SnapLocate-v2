import { useState, useEffect, useCallback, useMemo } from 'react'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'
import { Search, Trash2, CheckCircle2, AlertCircle, MapPin, ExternalLink, Package, RefreshCw } from 'lucide-react'

// ─── Config ──────────────────────────────────────────────────
const CATS = [
  { value: 'electronics', label: 'Electronics', emoji: '💻', color: '#4f46e5', bg: '#eef2ff' },
  { value: 'keys',        label: 'Keys',        emoji: '🔑', color: '#d97706', bg: '#fffbeb' },
  { value: 'id_card',     label: 'ID Card',     emoji: '🪪', color: '#2563eb', bg: '#eff6ff' },
  { value: 'clothing',    label: 'Clothing',    emoji: '👕', color: '#db2777', bg: '#fdf2f8' },
  { value: 'books',       label: 'Books',       emoji: '📚', color: '#16a34a', bg: '#f0fdf4' },
  { value: 'bag',         label: 'Bag',         emoji: '🎒', color: '#ea580c', bg: '#fff7ed' },
  { value: 'wallet',      label: 'Wallet',      emoji: '👛', color: '#ca8a04', bg: '#fefce8' },
  { value: 'jewellery',   label: 'Jewellery',   emoji: '💍', color: '#9333ea', bg: '#faf5ff' },
  { value: 'sports',      label: 'Sports',      emoji: '⚽', color: '#0d9488', bg: '#f0fdfa' },
  { value: 'other',       label: 'Other',       emoji: '📦', color: '#64748b', bg: '#f8fafc' },
]
const catInfo = v => CATS.find(c => c.value === v) || { emoji: '📦', label: v || 'Other', color: '#64748b', bg: '#f8fafc' }

const STATUS = {
  lost:     { label: 'Lost',     color: '#c2410c', bg: '#fff7ed', border: '#fed7aa' },
  found:    { label: 'Found',    color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' },
  resolved: { label: 'Resolved', color: '#0369a1', bg: '#f0f9ff', border: '#bae6fd' },
}


// ─── Small components ────────────────────────────────────────
function Avatar({ name, url, size = 28 }) {
  const initials = (name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  if (url) return <img src={url} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
  return <div style={{ width: size, height: size, borderRadius: '50%', background: '#e0e7ff', color: '#4f46e5', fontSize: size * 0.38, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{initials}</div>
}

function StatusBadge({ status }) {
  const s = STATUS[status] || STATUS.lost
  return <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, padding: '2px 9px', borderRadius: 20, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{s.label}</span>
}

function CatChip({ category }) {
  const c = catInfo(category)
  return <span style={{ background: c.bg, color: c.color, padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>{c.emoji} {c.label}</span>
}

// ─── Main page ───────────────────────────────────────────────
export default function ManageLostFound() {
  const [tab,        setTab]        = useState('items')
  const [allItems,   setAllItems]   = useState([])   // raw from API
  const [claims,     setClaims]     = useState([])
  const [stats,      setStats]      = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [claimsLoad, setClaimsLoad] = useState(false)

  // Filters — applied client-side on items
  const [statusF, setStatusF] = useState('all')
  const [catF,    setCatF]    = useState('all')
  const [search,  setSearch]  = useState('')

  // Claims filter
  const [claimF, setClaimF] = useState('pending')

  // ── Fetchers ─────────────────────────────────────────────
  const loadItems = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/admin/lost-found')
      setAllItems(res.success ? (res.data || []) : [])
    } catch {
      setAllItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  const loadStats = useCallback(async () => {
    try {
      const res = await api.get('/api/admin/lost-found/stats')
      if (res.success) setStats(res.data)
    } catch {}
  }, [])

  const loadClaims = useCallback(async () => {
    setClaimsLoad(true)
    try {
      const params = claimF !== 'all' ? `?status=${claimF}` : ''
      const res = await api.get(`/api/admin/lost-found/claims${params}`)
      if (res.success) setClaims(res.data || [])
    } catch {} finally { setClaimsLoad(false) }
  }, [claimF])

  useEffect(() => { loadItems(); loadStats() }, [loadItems, loadStats])
  useEffect(() => { if (tab === 'claims') loadClaims() }, [tab, loadClaims])

  // ── Client-side filtering ─────────────────────────────────
  const filtered = useMemo(() => {
    let list = allItems
    if (statusF !== 'all') list = list.filter(i => i.status === statusF)
    if (catF    !== 'all') list = list.filter(i => (i.category || 'other') === catF)
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

  // ── Actions ───────────────────────────────────────────────
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

  // ── Render ────────────────────────────────────────────────
  return (
    <PageLayout>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: 0 }}>Lost & Found</h1>
          <p style={{ fontSize: 14, color: '#64748b', marginTop: 4, marginBottom: 0 }}>Moderate posts and manage claims across campus.</p>
        </div>
        <button onClick={() => { loadItems(); loadStats() }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#fff', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14 }}>
        {[
          { label: 'Total',          value: stats?.total    ?? allItems.length,    color: '#4f46e5', bg: '#eef2ff', border: '#e0e7ff' },
          { label: 'Lost',           value: stats?.lost     ?? allItems.filter(i=>i.status==='lost').length,     color: '#c2410c', bg: '#fff7ed', border: '#fed7aa' },
          { label: 'Found',          value: stats?.found    ?? allItems.filter(i=>i.status==='found').length,    color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' },
          { label: 'Resolved',       value: stats?.resolved ?? allItems.filter(i=>i.status==='resolved').length, color: '#0369a1', bg: '#f0f9ff', border: '#bae6fd' },
          { label: 'Pending Claims', value: pendingCount, color: pendingCount > 0 ? '#92400e' : '#64748b', bg: pendingCount > 0 ? '#fffbeb' : '#f8fafc', border: pendingCount > 0 ? '#fde68a' : '#f1f5f9' },
        ].map((s, i) => (
          <div key={i} style={{ background: s.bg, borderRadius: 14, border: `1px solid ${s.border}`, padding: '14px 18px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: s.color, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid #f1f5f9' }}>
        {[
          { id: 'items',  label: `All Items (${filtered.length}${filtered.length !== allItems.length ? `/${allItems.length}` : ''})` },
          { id: 'claims', label: 'Claims' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '11px 22px', background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 14, fontWeight: tab === t.id ? 700 : 500,
            color: tab === t.id ? '#4f46e5' : '#64748b',
            borderBottom: tab === t.id ? '2px solid #4f46e5' : '2px solid transparent',
            marginBottom: -2, display: 'flex', alignItems: 'center', gap: 8,
          }}>
            {t.label}
            {t.id === 'claims' && pendingCount > 0 && (
              <span style={{ background: '#f59e0b', color: '#fff', borderRadius: 10, padding: '1px 7px', fontSize: 11, fontWeight: 700 }}>{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* ══ ITEMS TAB ═══════════════════════════════════════ */}
      {tab === 'items' && (
        <>
          {/* Filter bar */}
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #f1f5f9', padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Row 1: search + status chips */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: '1 1 180px', minWidth: 160 }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by title, location, reporter..."
                  style={{ width: '100%', padding: '8px 10px 8px 30px', borderRadius: 9, border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                  onFocus={e => e.target.style.borderColor = '#4f46e5'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
              </div>
              <div style={{ display: 'flex', gap: 5 }}>
                {['all', 'lost', 'found', 'resolved'].map(s => {
                  const active = statusF === s
                  const cfg = s === 'all' ? { color: '#4f46e5', bg: '#eef2ff', border: '#e0e7ff' } : STATUS[s]
                  return (
                    <button key={s} onClick={() => setStatusF(s)} style={{
                      padding: '7px 13px', borderRadius: 9, cursor: 'pointer',
                      border: `1.5px solid ${active ? cfg.border : '#e2e8f0'}`,
                      background: active ? cfg.bg : '#fff',
                      color: active ? cfg.color : '#64748b',
                      fontSize: 12, fontWeight: active ? 700 : 500,
                    }}>
                      {s === 'all' ? 'All' : STATUS[s].label}
                    </button>
                  )
                })}
              </div>
              {(statusF !== 'all' || catF !== 'all' || search) && (
                <button onClick={() => { setStatusF('all'); setCatF('all'); setSearch('') }}
                  style={{ padding: '7px 12px', borderRadius: 9, border: '1.5px solid #fee2e2', background: '#fef2f2', color: '#dc2626', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  Clear filters
                </button>
              )}
            </div>

            {/* Row 2: category chips — horizontal scroll */}
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2, scrollbarWidth: 'none' }}>
              <button onClick={() => setCatF('all')} style={{
                flexShrink: 0, padding: '5px 12px', borderRadius: 8, cursor: 'pointer',
                border: `1.5px solid ${catF === 'all' ? '#4f46e5' : '#e2e8f0'}`,
                background: catF === 'all' ? '#eef2ff' : '#fff',
                color: catF === 'all' ? '#4f46e5' : '#64748b',
                fontSize: 12, fontWeight: catF === 'all' ? 700 : 500,
              }}>All</button>
              {CATS.map(c => (
                <button key={c.value} onClick={() => setCatF(c.value)} style={{
                  flexShrink: 0, padding: '5px 11px', borderRadius: 8, cursor: 'pointer',
                  border: `1.5px solid ${catF === c.value ? c.color : '#e2e8f0'}`,
                  background: catF === c.value ? c.bg : '#fff',
                  color: catF === c.value ? c.color : '#64748b',
                  fontSize: 12, fontWeight: catF === c.value ? 700 : 500,
                }}>
                  {c.emoji} {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f1f5f9', overflow: 'hidden' }}>
            {loading ? (
              <div style={{ padding: '56px 0', textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>Loading items...</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: '56px 0', textAlign: 'center', color: '#94a3b8' }}>
                <Package size={34} style={{ opacity: 0.2, margin: '0 auto 12px', display: 'block' }} />
                <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>No items match your filters</p>
                <p style={{ fontSize: 12, marginTop: 6, color: '#cbd5e1' }}>Try a different status or category</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 680 }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      {['Item', 'Category', 'Reporter', 'Status', 'Location', 'Date', 'Claims', 'Actions'].map(h => (
                        <th key={h} style={{ padding: '11px 14px', textAlign: h === 'Actions' ? 'right' : 'left', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(item => (
                      <tr key={item.id} style={{ borderBottom: '1px solid #f8fafc' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

                        <td style={{ padding: '13px 14px', maxWidth: 200 }}>
                          <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
                          {item.description && <div style={{ fontSize: 11, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>{item.description}</div>}
                        </td>

                        <td style={{ padding: '13px 14px' }}><CatChip category={item.category} /></td>

                        <td style={{ padding: '13px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                            <Avatar name={item.reporter?.full_name} url={item.reporter?.avatar_url} />
                            <span style={{ fontSize: 12, color: '#475569', whiteSpace: 'nowrap', maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.reporter?.full_name || '—'}</span>
                          </div>
                        </td>

                        <td style={{ padding: '13px 14px' }}><StatusBadge status={item.status} /></td>

                        <td style={{ padding: '13px 14px', fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>
                          {item.location ? <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={11} color="#94a3b8" />{item.location}</span> : '—'}
                        </td>

                        <td style={{ padding: '13px 14px', fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>
                          {item.date ? new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
                        </td>

                        <td style={{ padding: '13px 14px' }}>
                          {item.claim_counts?.total > 0 ? (
                            <div>
                              <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>{item.claim_counts.total}</span>
                              {item.claim_counts.pending > 0 && <span style={{ display: 'block', fontSize: 10, color: '#d97706', fontWeight: 700 }}>{item.claim_counts.pending} pending</span>}
                            </div>
                          ) : <span style={{ fontSize: 12, color: '#cbd5e1' }}>—</span>}
                        </td>

                        <td style={{ padding: '13px 14px' }}>
                          <div style={{ display: 'flex', gap: 5, justifyContent: 'flex-end' }}>
                            {item.status !== 'resolved' && (
                              <button onClick={() => handleResolve(item.id)} title="Mark resolved"
                                style={{ padding: '6px', borderRadius: 8, border: '1px solid #bbf7d0', background: '#fff', cursor: 'pointer', color: '#15803d', display: 'flex', alignItems: 'center' }}
                                onMouseEnter={e => e.currentTarget.style.background = '#f0fdf4'}
                                onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                                <CheckCircle2 size={14} />
                              </button>
                            )}
                            <button onClick={() => handleDelete(item.id, item.title)} title="Delete"
                              style={{ padding: '6px', borderRadius: 8, border: '1px solid #fee2e2', background: '#fff', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center' }}
                              onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                              onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
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

      {/* ══ CLAIMS TAB ══════════════════════════════════════ */}
      {tab === 'claims' && (
        <>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[
              { v: 'all',      label: 'All Claims', color: '#4f46e5', bg: '#eef2ff', border: '#e0e7ff' },
              { v: 'pending',  label: 'Pending',    color: '#92400e', bg: '#fffbeb', border: '#fde68a' },
              { v: 'approved', label: 'Approved',   color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' },
              { v: 'rejected', label: 'Rejected',   color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
            ].map(s => (
              <button key={s.v} onClick={() => setClaimF(s.v)} style={{
                padding: '8px 16px', borderRadius: 10, cursor: 'pointer',
                border: `1.5px solid ${claimF === s.v ? s.border : '#e2e8f0'}`,
                background: claimF === s.v ? s.bg : '#fff',
                color: claimF === s.v ? s.color : '#475569',
                fontSize: 13, fontWeight: claimF === s.v ? 700 : 500,
              }}>{s.label}</button>
            ))}
          </div>

          {claimsLoad ? (
            <div style={{ textAlign: 'center', padding: '56px 0', color: '#94a3b8', fontSize: 14 }}>Loading claims...</div>
          ) : claims.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '56px 0' }}>
              <AlertCircle size={34} style={{ opacity: 0.2, margin: '0 auto 12px', display: 'block' }} />
              <p style={{ fontSize: 14, color: '#64748b', fontWeight: 600, margin: 0 }}>No {claimF !== 'all' ? claimF : ''} claims</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {claims.map(claim => {
                const ci = catInfo(claim.item?.category)
                return (
                  <div key={claim.id} style={{
                    background: '#fff', borderRadius: 16,
                    border: `1.5px solid ${claim.status === 'pending' ? '#fde68a' : '#f1f5f9'}`,
                    padding: '18px 22px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap', justifyContent: 'space-between' }}>
                      {/* Item */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: '1 1 200px' }}>
                        <div style={{ width: 38, height: 38, borderRadius: 10, background: ci.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{ci.emoji}</div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{claim.item?.title || '—'}</div>
                          <div style={{ display: 'flex', gap: 5, marginTop: 3, flexWrap: 'wrap' }}>
                            {claim.item?.status && <StatusBadge status={claim.item.status} />}
                            {claim.item?.category && <CatChip category={claim.item.category} />}
                          </div>
                        </div>
                      </div>
                      {/* Claimer + badge */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar name={claim.claimer?.full_name} url={claim.claimer?.avatar_url} size={30} />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{claim.claimer?.full_name || '—'}</div>
                          <div style={{ fontSize: 11, color: '#94a3b8' }}>{new Date(claim.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                        </div>
                        <span style={{
                          fontSize: 11, fontWeight: 700, textTransform: 'uppercase', padding: '3px 10px', borderRadius: 20, marginLeft: 6,
                          background: claim.status === 'pending' ? '#fffbeb' : claim.status === 'approved' ? '#f0fdf4' : '#f8fafc',
                          color:      claim.status === 'pending' ? '#92400e' : claim.status === 'approved' ? '#15803d' : '#64748b',
                          border: `1px solid ${claim.status === 'pending' ? '#fde68a' : claim.status === 'approved' ? '#bbf7d0' : '#e2e8f0'}`,
                        }}>{claim.status}</span>
                      </div>
                    </div>

                    <div style={{ margin: '12px 0 0', padding: '10px 14px', background: '#f8fafc', borderRadius: 9, fontSize: 13, color: '#374151', lineHeight: '1.55' }}>
                      {claim.message}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, flexWrap: 'wrap', gap: 8 }}>
                      <div>
                        {claim.proof_url && (
                          <a href={claim.proof_url} target="_blank" rel="noopener noreferrer"
                            style={{ fontSize: 12, color: '#4f46e5', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}>
                            <ExternalLink size={12} /> View proof
                          </a>
                        )}
                        {claim.admin_note && <p style={{ fontSize: 12, color: '#94a3b8', margin: '4px 0 0', fontStyle: 'italic' }}>Note: {claim.admin_note}</p>}
                      </div>
                      {claim.status === 'pending' && (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => handleClaimAction(claim.id, 'approve')}
                            style={{ padding: '8px 18px', borderRadius: 9, border: 'none', background: '#15803d', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#166534'}
                            onMouseLeave={e => e.currentTarget.style.background = '#15803d'}>
                            ✓ Approve
                          </button>
                          <button onClick={() => handleClaimAction(claim.id, 'reject')}
                            style={{ padding: '8px 16px', borderRadius: 9, border: '1.5px solid #fca5a5', background: '#fff', color: '#dc2626', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                            onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
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
    </PageLayout>
  )
}
