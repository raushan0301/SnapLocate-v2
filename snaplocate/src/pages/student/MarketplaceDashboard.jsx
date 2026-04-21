import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'
import { ArrowLeft, Plus, Eye, Edit, Trash2, Heart, MoreVertical, Package } from 'lucide-react'

const FONT = "'Plus Jakarta Sans', 'Inter', sans-serif"

const STATUS_TABS = [
  { id: 'Active',   label: 'Active',   emoji: '🟢' },
  { id: 'Reserved', label: 'Reserved', emoji: '🔒' },
  { id: 'Sold',     label: 'Sold',     emoji: '🎉' },
  { id: 'Draft',    label: 'Draft',    emoji: '📝' },
]
const STATUS_STYLE = {
  Active:   { bg: '#dcfce7', color: '#16a34a' },
  Reserved: { bg: '#fef3c7', color: '#d97706' },
  Sold:     { bg: '#fee2e2', color: '#dc2626' },
  Draft:    { bg: '#f1f5f9', color: '#64748b' },
}

function price(p) {
  return (p === null || p === undefined || Number(p) === 0) ? 'Free' : `₹${Number(p).toLocaleString('en-IN')}`
}
function ago(d) {
  const s = (Date.now() - new Date(d)) / 1000
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

// ─── Listing Row ──────────────────────────────────────────────
function ListingRow({ item, onDelete, onStatusChange, onView, onEdit }) {
  const [menuOpen, setMenuOpen]       = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const sc = STATUS_STYLE[item.status] || STATUS_STYLE.Active
  const isFree = item.price === null || Number(item.price) === 0

  const doStatus = async (s) => {
    setMenuOpen(false)
    setActionLoading(true)
    await onStatusChange(item.id, s)
    setActionLoading(false)
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '52px 1fr auto',
      gap: 14,
      alignItems: 'center',
      padding: '13px 18px',
      borderBottom: '1px solid #f8fafc',
      transition: 'background 0.15s',
      opacity: item.status === 'Sold' ? 0.7 : 1,
    }}
      onMouseEnter={e => e.currentTarget.style.background = '#fafbff'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {/* Thumbnail */}
      <div style={{ width: 52, height: 52, borderRadius: 12, overflow: 'hidden', background: '#f8fafc', border: '1.5px solid #f1f5f9', flexShrink: 0 }}>
        {item.images?.[0]
          ? <img src={item.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>📦</div>
        }
      </div>

      {/* Info */}
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 14, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 280 }}>
            {item.title}
          </span>
          <span style={{ padding: '2px 8px', borderRadius: 20, background: sc.bg, color: sc.color, fontFamily: FONT, fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
            {item.status}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 15, color: isFree ? '#10b981' : '#6366f1' }}>{price(item.price)}</span>
          <span style={{ fontFamily: FONT, fontSize: 12, color: '#cbd5e1' }}>·</span>
          <span style={{ fontFamily: FONT, fontSize: 12, color: '#94a3b8' }}>{item.category}</span>
          <span style={{ fontFamily: FONT, fontSize: 12, color: '#cbd5e1' }}>·</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Eye size={11} color="#94a3b8" />
            <span style={{ fontFamily: FONT, fontSize: 12, color: '#94a3b8' }}>{item.views_count || 0} views</span>
          </div>
          <span style={{ fontFamily: FONT, fontSize: 12, color: '#cbd5e1' }}>·</span>
          <span style={{ fontFamily: FONT, fontSize: 12, color: '#cbd5e1' }}>{ago(item.created_at)}</span>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
        <button onClick={() => onView(item.id)} title="View listing" style={{ padding: '7px 12px', borderRadius: 10, background: '#eef2ff', border: 'none', color: '#6366f1', fontFamily: FONT, fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
          <Eye size={13} /> View
        </button>
        <button onClick={() => onEdit(item.id)} title="Edit listing" style={{ padding: '7px 12px', borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569', fontFamily: FONT, fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
          <Edit size={13} />
        </button>

        {/* Status dropdown */}
        <div style={{ position: 'relative' }}>
          <button onClick={() => setMenuOpen(o => !o)} disabled={actionLoading} style={{ padding: '7px 9px', borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <MoreVertical size={14} />
          </button>
          {menuOpen && (
            <div
              onMouseLeave={() => setMenuOpen(false)}
              style={{ position: 'absolute', right: 0, top: '110%', background: '#fff', borderRadius: 14, boxShadow: '0 8px 30px rgba(0,0,0,0.12)', border: '1px solid #f1f5f9', zIndex: 50, minWidth: 170, overflow: 'hidden' }}
            >
              {item.status !== 'Active'   && <button onClick={() => doStatus('Active')}   style={menuBtnStyle('#16a34a')}>✅ Mark Active</button>}
              {item.status !== 'Reserved' && item.status !== 'Sold' && <button onClick={() => doStatus('Reserved')} style={menuBtnStyle('#d97706')}>🔒 Mark Reserved</button>}
              {item.status !== 'Sold'     && <button onClick={() => doStatus('Sold')}     style={menuBtnStyle('#6366f1')}>🎉 Mark Sold</button>}
              <div style={{ height: 1, background: '#f1f5f9', margin: '4px 0' }} />
              <button onClick={() => { setMenuOpen(false); onDelete(item.id, item.title) }} style={menuBtnStyle('#ef4444')}>🗑 Remove</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function menuBtnStyle(color) {
  return {
    width: '100%', padding: '9px 16px', textAlign: 'left', background: 'none', border: 'none',
    fontFamily: FONT, fontSize: 13, fontWeight: 600, color, cursor: 'pointer', display: 'block',
  }
}

// ─── Saved Card Grid ──────────────────────────────────────────
function SavedCard({ s, onUnsave, onClick }) {
  const item = s.listing
  if (!item) return null
  const isFree = item.price === null || Number(item.price) === 0

  return (
    <div
      onClick={onClick}
      style={{
        background: '#fff', borderRadius: 18, overflow: 'hidden',
        border: '1px solid #f1f5f9', cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        transition: 'transform 0.18s, box-shadow 0.18s',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(99,102,241,0.1)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)' }}
    >
      <div style={{ position: 'relative', paddingTop: '75%', background: '#f8fafc' }}>
        {item.images?.[0]
          ? <img src={item.images[0]} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>📦</div>
        }
        <button
          onClick={e => { e.stopPropagation(); onUnsave(s.listing_id) }}
          style={{ position: 'absolute', top: 8, right: 8, width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,0.95)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.12)' }}
        >
          <Heart size={14} fill="#ef4444" color="#ef4444" />
        </button>
      </div>
      <div style={{ padding: '11px 13px 13px' }}>
        <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: 13, color: '#0f172a', margin: '0 0 4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</p>
        <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 16, color: isFree ? '#10b981' : '#6366f1' }}>
          {isFree ? 'Free' : `₹${Number(item.price).toLocaleString('en-IN')}`}
        </span>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────
export default function MyListings() {
  const navigate = useNavigate()

  const [listings, setListings]   = useState([])
  const [saved, setSaved]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [tab, setTab]             = useState('listings')
  const [statusFilter, setStatus] = useState('Active')

  const load = async () => {
    setLoading(true)
    try {
      const [myRes, savedRes] = await Promise.all([
        api.get(`/api/marketplace/user/my-listings?status=${statusFilter}`),
        api.get('/api/marketplace/saved'),
      ])
      setListings(myRes.data || [])
      setSaved(savedRes.data || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [statusFilter])

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Remove "${title}"? This cannot be undone.`)) return
    await api.delete(`/api/marketplace/${id}`)
    setListings(p => p.filter(l => l.id !== id))
  }

  const handleStatusChange = async (id, status) => {
    await api.patch(`/api/marketplace/${id}/status`, { status })
    setListings(p => p.map(l => l.id === id ? { ...l, status } : l))
  }

  const handleUnsave = async (listingId) => {
    await api.delete(`/api/marketplace/save/${listingId}`)
    setSaved(p => p.filter(s => s.listing_id !== listingId))
  }

  const summaryMap = {
    Active: listings.filter(l => l.status === 'Active').length,
    Reserved: listings.filter(l => l.status === 'Reserved').length,
    Sold: listings.filter(l => l.status === 'Sold').length,
    Draft: listings.filter(l => l.status === 'Draft').length,
  }

  return (
    <PageLayout>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
      `}</style>

      <div style={{ width: '100%', maxWidth: '100%', padding: '0 24px', fontFamily: FONT, boxSizing: 'border-box' }}>

        {/* Back + Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button onClick={() => navigate('/marketplace')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', fontFamily: FONT, fontWeight: 600, fontSize: 14, color: '#6366f1', padding: 0 }}>
              <ArrowLeft size={16} /> Back
            </button>
            <div>
              <h1 style={{ fontFamily: FONT, fontWeight: 800, fontSize: 22, color: '#0f172a', margin: 0 }}>My Marketplace</h1>
              <p style={{ fontFamily: FONT, fontSize: 13, color: '#94a3b8', margin: '2px 0 0' }}>Manage listings and saved items</p>
            </div>
          </div>
          <button onClick={() => navigate('/marketplace/create')} style={{
            padding: '10px 20px', borderRadius: 12,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            border: 'none', color: '#fff', fontFamily: FONT,
            fontWeight: 700, fontSize: 13, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 7,
            boxShadow: '0 3px 12px rgba(99,102,241,0.3)',
          }}>
            <Plus size={14} /> New Listing
          </button>
        </div>

        {/* Tab strip */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: '#f1f5f9', padding: 4, borderRadius: 14, width: 'fit-content' }}>
          {[
            { id: 'listings', label: 'My Listings', count: Object.values(summaryMap).reduce((a, b) => a + b, 0) },
            { id: 'saved', label: '❤️ Saved', count: saved.length },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '8px 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: tab === t.id ? '#fff' : 'transparent',
              boxShadow: tab === t.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              fontFamily: FONT, fontWeight: tab === t.id ? 700 : 500,
              fontSize: 13, color: tab === t.id ? '#6366f1' : '#64748b',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              {t.label}
              <span style={{ background: tab === t.id ? '#6366f1' : '#e2e8f0', color: tab === t.id ? '#fff' : '#64748b', borderRadius: 20, fontSize: 11, fontWeight: 800, padding: '1px 7px' }}>{t.count}</span>
            </button>
          ))}
        </div>

        {/* ─── MY LISTINGS ─── */}
        {tab === 'listings' && (
          <div style={{ background: '#fff', borderRadius: 20, overflow: 'visible', boxShadow: '0 2px 16px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' }}>

            {/* Status sub-tabs */}
            <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #f1f5f9', overflowX: 'auto' }}>
              {STATUS_TABS.map(s => {
                const sc = STATUS_STYLE[s.id]
                const isActive = statusFilter === s.id
                return (
                  <button key={s.id} onClick={() => setStatus(s.id)} style={{
                    flex: '1 1 auto', padding: '12px 16px', border: 'none',
                    borderBottom: `2.5px solid ${isActive ? sc.color : 'transparent'}`,
                    background: isActive ? sc.bg + '40' : 'transparent',
                    fontFamily: FONT, fontWeight: isActive ? 700 : 500, fontSize: 13,
                    color: isActive ? sc.color : '#64748b', cursor: 'pointer',
                    transition: 'all 0.15s', whiteSpace: 'nowrap',
                    display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center',
                  }}>
                    {s.emoji} {s.label}
                    <span style={{ background: isActive ? sc.color : '#e2e8f0', color: isActive ? '#fff' : '#64748b', borderRadius: 20, fontSize: 10, fontWeight: 800, padding: '1px 7px' }}>
                      {summaryMap[s.id] || 0}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* List */}
            {loading ? (
              <div style={{ padding: '20px' }}>
                {[1, 2, 3].map(i => <div key={i} style={{ height: 70, background: '#f1f5f9', borderRadius: 14, marginBottom: 12, animation: 'pulse 1.5s infinite' }} />)}
              </div>
            ) : listings.length === 0 ? (
              <div style={{ padding: '48px 32px', textAlign: 'center' }}>
                <Package size={36} color="#e2e8f0" style={{ marginBottom: 12 }} />
                <h3 style={{ fontFamily: FONT, fontWeight: 700, fontSize: 17, color: '#0f172a', margin: '0 0 6px' }}>No {statusFilter} listings</h3>
                <p style={{ fontFamily: FONT, fontSize: 13, color: '#94a3b8', margin: '0 0 18px' }}>Items you sell will appear here.</p>
                {statusFilter === 'Active' && (
                  <button onClick={() => navigate('/marketplace/create')} style={{ padding: '10px 22px', borderRadius: 12, background: '#6366f1', border: 'none', color: '#fff', fontFamily: FONT, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                    + Post a Listing
                  </button>
                )}
              </div>
            ) : (
              listings.map(item => (
                <ListingRow
                  key={item.id}
                  item={item}
                  onDelete={handleDelete}
                  onStatusChange={handleStatusChange}
                  onView={id => navigate(`/marketplace/listing/${id}`)}
                  onEdit={id => navigate(`/marketplace/edit/${id}`)}
                />
              ))
            )}
          </div>
        )}

        {/* ─── SAVED ─── */}
        {tab === 'saved' && (
          saved.length === 0 ? (
            <div style={{ padding: '60px 32px', textAlign: 'center', background: '#fff', borderRadius: 20, border: '2px dashed #e2e8f0' }}>
              <div style={{ fontSize: 44, marginBottom: 12 }}>🤍</div>
              <h3 style={{ fontFamily: FONT, fontWeight: 700, fontSize: 17, color: '#0f172a', margin: '0 0 6px' }}>No saved items yet</h3>
              <p style={{ fontFamily: FONT, fontSize: 13, color: '#94a3b8', margin: 0 }}>Tap the ♡ on any listing to save it here.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 16 }}>
              {saved.map(s => (
                <SavedCard
                  key={s.id}
                  s={s}
                  onUnsave={handleUnsave}
                  onClick={() => navigate(`/marketplace/listing/${s.listing_id}`)}
                />
              ))}
            </div>
          )
        )}
      </div>
    </PageLayout>
  )
}
