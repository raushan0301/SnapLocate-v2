import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'
import { ArrowLeft, Plus, Eye, Edit, Trash2, Heart, MoreVertical, Package } from 'lucide-react'

const STATUS_TABS = [
  { id: 'Active',   label: 'Active',   emoji: '🟢' },
  { id: 'Reserved', label: 'Reserved', emoji: '🔒' },
  { id: 'Sold',     label: 'Sold',     emoji: '🎉' },
  { id: 'Draft',    label: 'Draft',    emoji: '📝' },
]

// Used for status badge chips on listing rows
const STATUS_BADGE = {
  Active:   'bg-green-100 text-green-700',
  Reserved: 'bg-amber-100 text-amber-700',
  Sold:     'bg-red-100 text-red-700',
  Draft:    'bg-slate-100 text-slate-500',
}

// Status sub-tab active Tailwind class strings
const STATUS_TAB_CLS = {
  Active:   { btnCls: 'border-b-[2.5px] border-b-green-600 bg-green-100/40 text-green-600 font-bold',   countCls: 'bg-green-600 text-white' },
  Reserved: { btnCls: 'border-b-[2.5px] border-b-amber-600 bg-amber-100/40 text-amber-600 font-bold',   countCls: 'bg-amber-600 text-white' },
  Sold:     { btnCls: 'border-b-[2.5px] border-b-red-600 bg-red-100/40 text-red-600 font-bold',         countCls: 'bg-red-600 text-white' },
  Draft:    { btnCls: 'border-b-[2.5px] border-b-slate-500 bg-slate-100/40 text-slate-500 font-bold',   countCls: 'bg-slate-500 text-white' },
}

function price(p) {
  return (p === null || p === undefined || Number(p) === 0) ? 'Free' : `₹${Number(p).toLocaleString('en-IN')}`
}
function ago(d) {
  const s = (Date.now() - new Date(d)) / 1000
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

function ListingRow({ item, onDelete, onStatusChange, onView, onEdit }) {
  const [menuOpen, setMenuOpen]         = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const badgeCls = STATUS_BADGE[item.status] || STATUS_BADGE.Active
  const isFree   = item.price === null || Number(item.price) === 0

  const doStatus = async (s) => {
    setMenuOpen(false)
    setActionLoading(true)
    await onStatusChange(item.id, s)
    setActionLoading(false)
  }

  return (
    <div className={`grid gap-3.5 items-center px-4 sm:px-5 py-3.5 border-b border-slate-50 transition-colors hover:bg-[#fafbff] ${item.status === 'Sold' ? 'opacity-70' : ''}`}
      style={{ gridTemplateColumns: '52px 1fr auto' }}>
      {/* Thumbnail */}
      <div className="w-[52px] h-[52px] rounded-xl overflow-hidden bg-surface shrink-0 border-[1.5px] border-slate-100">
        {item.images?.[0]
          ? <img src={item.images[0]} alt="" className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-[22px]">📦</div>
        }
      </div>

      {/* Info */}
      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[14px] font-bold t-primary truncate max-w-[140px] sm:max-w-[280px]">{item.title}</span>
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${badgeCls}`}>{item.status}</span>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <span className={`text-[15px] font-extrabold ${isFree ? 'text-emerald-500' : 'text-indigo-500'}`}>{price(item.price)}</span>
          <span className="text-[12px] text-slate-200">·</span>
          <span className="text-[12px] t-subtle">{item.category}</span>
          <span className="text-[12px] text-slate-200">·</span>
          <div className="flex items-center gap-1">
            <Eye size={11} className="text-slate-400" />
            <span className="text-[12px] t-subtle">{item.views_count || 0} views</span>
          </div>
          <span className="text-[12px] text-slate-200">·</span>
          <span className="text-[12px] text-slate-300">{ago(item.created_at)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-1.5 items-center shrink-0">
        <button onClick={() => onView(item.id)}
          className="px-2.5 sm:px-3 py-1.5 rounded-[10px] bg-indigo-50 border-none text-indigo-500 text-[12px] font-bold cursor-pointer flex items-center gap-1">
          <Eye size={13} /><span className="hidden sm:inline">View</span>
        </button>
        <button onClick={() => onEdit(item.id)}
          className="px-2.5 py-1.5 rounded-[10px] bg-surface border border-slate-200 t-secondary text-[12px] font-bold cursor-pointer flex items-center gap-1">
          <Edit size={13} />
        </button>
        <div className="relative">
          <button onClick={() => setMenuOpen(o => !o)} disabled={actionLoading}
            className="px-2.5 py-1.5 rounded-[10px] bg-surface border border-slate-200 t-secondary cursor-pointer flex items-center">
            <MoreVertical size={14} />
          </button>
          {menuOpen && (
            <div onMouseLeave={() => setMenuOpen(false)}
              className="absolute right-0 top-[110%] bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-slate-100 z-50 min-w-[170px] overflow-hidden">
              {item.status !== 'Active'   && <button onClick={() => doStatus('Active')}   className="w-full px-4 py-2.5 text-left bg-transparent border-none text-[13px] font-semibold text-green-600  cursor-pointer hover:bg-surface block">✅ Mark Active</button>}
              {item.status !== 'Reserved' && item.status !== 'Sold' && <button onClick={() => doStatus('Reserved')} className="w-full px-4 py-2.5 text-left bg-transparent border-none text-[13px] font-semibold text-amber-600 cursor-pointer hover:bg-surface block">🔒 Mark Reserved</button>}
              {item.status !== 'Sold'     && <button onClick={() => doStatus('Sold')}     className="w-full px-4 py-2.5 text-left bg-transparent border-none text-[13px] font-semibold text-indigo-500 cursor-pointer hover:bg-surface block">🎉 Mark Sold</button>}
              <div className="h-px bg-slate-100 my-1" />
              <button onClick={() => { setMenuOpen(false); onDelete(item.id, item.title) }} className="w-full px-4 py-2.5 text-left bg-transparent border-none text-[13px] font-semibold text-danger cursor-pointer hover:bg-surface block">🗑 Remove</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function SavedCard({ s, onUnsave, onClick }) {
  const item  = s.listing
  if (!item) return null
  const isFree = item.price === null || Number(item.price) === 0

  return (
    <div onClick={onClick}
      className="bg-white rounded-[18px] overflow-hidden border border-slate-100 cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(99,102,241,0.1)]">
      <div className="relative pt-[75%] bg-surface">
        {item.images?.[0]
          ? <img src={item.images[0]} alt="" className="absolute inset-0 w-full h-full object-cover" />
          : <div className="absolute inset-0 flex items-center justify-center text-4xl">📦</div>
        }
        <button onClick={e => { e.stopPropagation(); onUnsave(s.listing_id) }}
          className="absolute top-2 right-2 w-[30px] h-[30px] rounded-full bg-white/95 border-none cursor-pointer flex items-center justify-center shadow-[0_2px_6px_rgba(0,0,0,0.12)]">
          <Heart size={14} fill="#ef4444" color="#ef4444" />
        </button>
      </div>
      <div className="px-3 pt-2.5 pb-3">
        <p className="text-[13px] font-bold t-primary m-0 mb-1 truncate">{item.title}</p>
        <span className={`text-[16px] font-extrabold ${isFree ? 'text-emerald-500' : 'text-indigo-500'}`}>
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
    Active:   listings.filter(l => l.status === 'Active').length,
    Reserved: listings.filter(l => l.status === 'Reserved').length,
    Sold:     listings.filter(l => l.status === 'Sold').length,
    Draft:    listings.filter(l => l.status === 'Draft').length,
  }
  const totalListings = Object.values(summaryMap).reduce((a, b) => a + b, 0)

  return (
    <PageLayout>
      {/* Back + Header */}
      <div className="mb-4 sm:mb-6">
        {/* Top row: Back ← → New Listing */}
        <div className="flex justify-between items-center mb-2.5">
          <button onClick={() => navigate('/marketplace')}
            className="flex items-center gap-1.5 bg-transparent border-none cursor-pointer text-[14px] font-semibold text-indigo-500 p-0">
            <ArrowLeft size={16} /> Back
          </button>
          <button onClick={() => navigate('/marketplace/create')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white border-none text-[13px] font-bold cursor-pointer shadow-[0_3px_12px_rgba(99,102,241,0.3)] bg-gradient-to-br from-indigo-500 to-violet-500">
            <Plus size={14} /> New Listing
          </button>
        </div>
        {/* Title */}
        <h1 className="t-heading-xl t-primary m-0">My Marketplace</h1>
        <p className="t-md t-subtle m-0 mt-0.5">Manage listings and saved items</p>
      </div>

      {/* Tab strip */}
      <div className="flex gap-1 mb-4 sm:mb-6 bg-slate-100 p-1 rounded-2xl w-fit">
        {[
          { id: 'listings', label: 'My Listings', count: totalListings },
          { id: 'saved',    label: '❤️ Saved',    count: saved.length },
        ].map(t => {
          const active = tab === t.id
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 sm:px-5 py-2 rounded-xl border-none cursor-pointer flex items-center gap-1.5 text-[13px] transition-all ${active ? 'bg-white shadow-[0_1px_4px_rgba(0,0,0,0.08)] font-bold text-indigo-500' : 'bg-transparent font-medium t-secondary hover:bg-white/50'}`}>
              {t.label}
              <span className={`rounded-full text-[11px] font-extrabold px-1.5 py-0.5 ${active ? 'bg-indigo-500 text-white' : 'bg-slate-200 t-secondary'}`}>{t.count}</span>
            </button>
          )
        })}
      </div>

      {/* MY LISTINGS */}
      {tab === 'listings' && (
        <div className="bg-white rounded-[20px] overflow-visible shadow-[0_2px_16px_rgba(0,0,0,0.06)] border border-slate-100">
          {/* Status sub-tabs */}
          <div className="flex border-b border-slate-100 overflow-x-auto">
            {STATUS_TABS.map(s => {
              const isActive = statusFilter === s.id
              const sc = STATUS_TAB_CLS[s.id]
              return (
                <button key={s.id} onClick={() => setStatus(s.id)}
                  className={`flex-1 min-w-0 py-3 px-4 border-none cursor-pointer transition-all text-[13px] whitespace-nowrap flex items-center gap-1.5 justify-center ${isActive ? sc.btnCls : 'border-b-[2.5px] border-b-transparent bg-transparent text-slate-500 font-medium'}`}>
                  {s.emoji} {s.label}
                  <span className={`rounded-full text-[10px] font-extrabold px-1.5 py-0.5 ${isActive ? sc.countCls : 'bg-slate-200 text-slate-500'}`}>
                    {summaryMap[s.id] || 0}
                  </span>
                </button>
              )
            })}
          </div>

          {loading ? (
            <div className="p-5">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-[70px] bg-slate-100 rounded-2xl mb-3 animate-pulse" />
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="py-12 px-8 text-center">
              <Package size={36} className="text-slate-200 mx-auto mb-3" />
              <h3 className="t-base font-bold t-primary m-0 mb-1.5">No {statusFilter} listings</h3>
              <p className="text-[13px] t-subtle m-0 mb-4">Items you sell will appear here.</p>
              {statusFilter === 'Active' && (
                <button onClick={() => navigate('/marketplace/create')}
                  className="px-5 py-2.5 rounded-xl bg-indigo-500 border-none text-white t-base font-bold cursor-pointer">
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

      {/* SAVED */}
      {tab === 'saved' && (
        saved.length === 0 ? (
          <div className="py-16 px-8 text-center bg-white rounded-[20px] border-2 border-dashed border-slate-200">
            <div className="text-[44px] mb-3">🤍</div>
            <h3 className="t-base font-bold t-primary m-0 mb-1.5">No saved items yet</h3>
            <p className="text-[13px] t-subtle m-0">Tap the ♡ on any listing to save it here.</p>
          </div>
        ) : (
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))' }}>
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
    </PageLayout>
  )
}
