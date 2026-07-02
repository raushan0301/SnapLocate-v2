import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import {
  Search, Plus, Heart, Eye, SlidersHorizontal,
  ShoppingBag, BookOpen, Laptop, Bike, Sofa, Shirt, Trophy, Box,
  MessageCircle, Bookmark
} from 'lucide-react'

const CATEGORIES = [
  { id: 'All',         label: 'All',         icon: ShoppingBag,  color: '#6366f1' },
  { id: 'Textbooks',   label: 'Textbooks',   icon: BookOpen,     color: '#f59e0b' },
  { id: 'Electronics', label: 'Electronics', icon: Laptop,       color: '#3b82f6' },
  { id: 'Vehicles',    label: 'Vehicles',    icon: Bike,         color: '#10b981' },
  { id: 'Furniture',   label: 'Furniture',   icon: Sofa,         color: '#8b5cf6' },
  { id: 'Clothing',    label: 'Clothing',    icon: Shirt,        color: '#ec4899' },
  { id: 'Sports',      label: 'Sports',      icon: Trophy,       color: '#f97316' },
  { id: 'Other',       label: 'Other',       icon: Box,          color: '#64748b' },
]

const SORT_OPTIONS = [
  { id: 'newest',     label: 'Newest First' },
  { id: 'popular',    label: 'Most Viewed' },
  { id: 'price_asc',  label: 'Price: Low → High' },
  { id: 'price_desc', label: 'Price: High → Low' },
]

// Condition chip Tailwind classes
const CONDITION_CLS = {
  'Like New':     'bg-green-100 text-green-700',
  'Good':         'bg-blue-100 text-blue-700',
  'Fair':         'bg-amber-100 text-amber-700',
  'Needs Repair': 'bg-red-100 text-red-700',
}

const STATUS_OVERLAY = {
  Sold:     { label: 'Sold',     bg: 'rgba(15,23,42,0.72)' },
  Reserved: { label: 'Reserved', bg: 'rgba(99,102,241,0.72)' },
}

function formatPrice(price) {
  if (price === null || price === undefined || price === 0) return 'Free'
  return `₹${Number(price).toLocaleString('en-IN')}`
}
function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000
  if (diff < 60)    return 'just now'
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function ListingCard({ item, isSaved, onSaveToggle, onNavigate }) {
  const [savePending, setSavePending] = useState(false)
  const isSold     = item.status !== 'Active'
  const catConfig  = CATEGORIES.find(c => c.id === item.category) || CATEGORIES[7]
  const condCls    = CONDITION_CLS[item.condition] || CONDITION_CLS['Good']
  const isFree     = item.price === null || item.price === 0

  const handleSave = async (e) => {
    e.stopPropagation()
    if (savePending) return
    setSavePending(true)
    const next = !isSaved
    onSaveToggle?.(item.id, next)
    try {
      if (next) await api.post(`/api/marketplace/save/${item.id}`)
      else      await api.delete(`/api/marketplace/save/${item.id}`)
    } catch {
      onSaveToggle?.(item.id, !next)
    } finally { setSavePending(false) }
  }

  const CatIcon = catConfig.icon

  return (
    <div
      onClick={() => !isSold && onNavigate(item.id)}
      className={`bg-white rounded-[20px] overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-slate-100 transition-all duration-200 relative ${isSold ? 'opacity-[0.82] cursor-default' : 'cursor-pointer hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(99,102,241,0.13)]'}`}>
      {/* Image area */}
      <div className="relative w-full pt-[75%] bg-surface overflow-hidden">
        {item.images?.[0] ? (
          <img src={item.images[0]} alt={item.title} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <CatIcon size={40} color="#cbd5e1" />
          </div>
        )}

        {/* Sold / Reserved overlay */}
        {isSold && STATUS_OVERLAY[item.status] && (
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: STATUS_OVERLAY[item.status].bg }}>
            <span className="text-white text-[22px] font-extrabold tracking-wider" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
              {STATUS_OVERLAY[item.status].label}
            </span>
          </div>
        )}

        {/* Price badge */}
        <div className={`absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.12)] backdrop-blur-md ${isFree ? 'bg-emerald-500' : 'bg-white/95'}`}>
          <span className={`text-[14px] font-extrabold ${isFree ? 'text-white' : 't-primary'}`}>{formatPrice(item.price)}</span>
        </div>

        {/* Negotiable flag */}
        {item.is_negotiable && !isFree && (
          <div className="absolute top-2.5 left-[78px] px-2 py-0.5 rounded-full bg-white/95 backdrop-blur-md">
            <span className="text-[11px] font-semibold text-indigo-500">Negotiable</span>
          </div>
        )}

        {/* Save heart */}
        <button onClick={handleSave}
          className="absolute top-2.5 right-2.5 w-[34px] h-[34px] rounded-full bg-white/95 border-none cursor-pointer flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.12)] backdrop-blur-md transition-transform hover:scale-110">
          <Heart size={16} fill={isSaved ? '#ef4444' : 'none'} color={isSaved ? '#ef4444' : '#94a3b8'} />
        </button>

        {/* Image count badge */}
        {item.images?.length > 1 && (
          <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-xl bg-black/55">
            <span className="text-white text-[11px] font-semibold">1/{item.images.length}</span>
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="px-4 pt-3.5 pb-4">
        <h3 className="t-base font-bold t-primary m-0 mb-1.5 truncate">{item.title}</h3>
        <div className="flex gap-1.5 mb-3 flex-wrap">
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${condCls}`}>{item.condition}</span>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 t-secondary">{item.category}</span>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5">
            <img
              src={item.seller?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.seller?.full_name || 'U')}&background=eef2ff&color=6366f1&size=64`}
              alt="" className="w-[22px] h-[22px] rounded-full object-cover"
            />
            <span className="text-[12px] font-medium t-secondary">{item.seller?.full_name?.split(' ')[0] || 'Student'}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-0.5">
              <Eye size={12} className="text-slate-400" />
              <span className="text-[11px] t-subtle">{item.views_count || 0}</span>
            </div>
            <span className="text-[11px] text-slate-300">{timeAgo(item.created_at)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function EmptyState({ icon, title, desc, action }) {
  return (
    <div className="col-span-full py-20 px-10 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
      <div className="text-[56px] mb-4">{icon}</div>
      <h3 className="t-heading-lg t-primary m-0 mb-2">{title}</h3>
      <p className="t-base t-muted m-0 mb-6">{desc}</p>
      {action}
    </div>
  )
}

export default function MarketplacePage() {
  const { user, isGuest } = useAuth()
  const navigate = useNavigate()

  const [items, setItems]           = useState([])
  const [savedIds, setSavedIds]     = useState(new Set())
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [cat, setCat]               = useState('All')
  const [sort, setSort]             = useState('newest')
  const [isFreeOnly, setIsFreeOnly] = useState(false)
  const [total, setTotal]           = useState(0)

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        sort, limit: 40, offset: 0,
        ...(cat !== 'All' && { category: cat }),
        ...(search && { search }),
        ...(isFreeOnly && { is_free: true }),
      })
      const res  = await api.get(`/api/marketplace?${params}`)
      const data = res.data || []
      setItems(data)
      setTotal(res.total || 0)
      setSavedIds(prev => {
        const next = new Set(prev)
        data.forEach(item => { if (item.is_saved) next.add(item.id) })
        return next
      })
    } catch (err) {
      console.error('Marketplace fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [cat, sort, search, isFreeOnly])

  useEffect(() => {
    const t = setTimeout(() => fetchItems(), search ? 350 : 0)
    return () => clearTimeout(t)
  }, [fetchItems, search])

  return (
    <PageLayout>
      {/* Header */}
      <div className="flex justify-between items-center pb-5 gap-6 flex-wrap mb-5">
        <div>
          <h1 className="text-[30px] font-extrabold t-primary m-0 tracking-[-0.5px]">Campus Marketplace</h1>
          <p className="t-base t-muted mt-1.5 m-0">Buy &amp; sell within your university — {total} active listings</p>
        </div>
        <div className="flex gap-3">
          {!isGuest && (
            <>
              <button onClick={() => navigate('/marketplace/chat')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white border border-slate-200 t-primary t-base font-semibold cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                <MessageCircle size={16} /> My Chats
              </button>
              <button onClick={() => navigate('/marketplace/dashboard')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white border border-slate-200 t-primary t-base font-semibold cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                <Bookmark size={16} /> My Listings
              </button>
              <button onClick={() => navigate('/marketplace/create')}
                className="flex items-center gap-2 px-5 sm:px-6 py-2.5 rounded-2xl bg-brand text-white border-none t-base font-bold cursor-pointer shadow-[0_8px_20px_rgba(79,70,229,0.25)]">
                <Plus size={16} /> Sell Item
              </button>
            </>
          )}
        </div>
      </div>

      {isGuest && (
        <div className="bg-red-50 border border-red-200 px-5 py-3 rounded-2xl mb-5 flex items-center gap-3">
          <span className="text-xl">🎓</span>
          <span className="t-base text-red-700 font-medium">
            <strong>Guest Mode:</strong> Register with a university email (@thapar.edu) to buy, sell, and chat on the Marketplace.
          </span>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-6 max-w-[400px]">
        <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input type="text" placeholder="Search for textbooks, electronics, bikes…"
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 outline-none bg-white t-base t-primary shadow-[0_1px_4px_rgba(0,0,0,0.04)] focus:border-brand transition-colors box-border"
        />
      </div>

      {/* Category filter bar */}
      <div className="flex gap-2.5 overflow-x-auto pb-1 mb-6">
        {CATEGORIES.map(c => {
          const Icon   = c.icon
          const active = cat === c.id
          return (
            <button key={c.id} onClick={() => setCat(c.id)}
              className="shrink-0 flex items-center gap-2 px-4 sm:px-5 py-2 rounded-full cursor-pointer transition-all duration-200 text-[13px] font-medium hover:-translate-y-0.5"
              style={{
                background:  active ? c.color : '#fff',
                border:      `1.5px solid ${active ? c.color : '#e2e8f0'}`,
                fontWeight:  active ? 700 : 500,
                color:       active ? '#fff' : '#475569',
              }}>
              <Icon size={15} color={active ? '#fff' : c.color} />
              {c.label}
            </button>
          )
        })}
      </div>

      {/* Sort & filter row */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <span className="t-base font-semibold text-slate-500">{loading ? 'Loading…' : `${total} listings`}</span>
          <button onClick={() => setIsFreeOnly(!isFreeOnly)}
            className={`px-3.5 py-1.5 rounded-full text-[13px] font-semibold cursor-pointer border-[1.5px] transition-colors ${isFreeOnly ? 'bg-green-50 border-green-600 text-green-600' : 'bg-surface border-slate-200 t-secondary hover:bg-surface'}`}>
            🎁 Free Only
          </button>
        </div>
        <div className="flex items-center gap-2.5">
          <SlidersHorizontal size={16} className="text-brand" />
          <select value={sort} onChange={e => setSort(e.target.value)}
            className="appearance-none px-3.5 py-2 pr-8 rounded-xl border-[1.5px] border-slate-200 t-md font-semibold t-primary bg-white cursor-pointer outline-none">
            {SORT_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {/* Listing grid */}
      <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-slate-100 rounded-2xl h-[360px] animate-pulse" />
          ))
        ) : items.length === 0 ? (
          <EmptyState
            icon="🔍"
            title="No listings found"
            desc={search ? `No results for "${search}". Try different keywords or clear filters.` : 'Be the first to list something amazing in this category!'}
            action={
              !isGuest && (
                <button onClick={() => navigate('/marketplace/create')}
                  className="px-7 py-3 rounded-2xl bg-indigo-500 border-none text-white t-base font-bold cursor-pointer">
                  + Post a Listing
                </button>
              )
            }
          />
        ) : (
          items.map(item => (
            <ListingCard
              key={item.id}
              item={item}
              isSaved={savedIds.has(item.id)}
              onSaveToggle={(id, next) => {
                setSavedIds(prev => { const s = new Set(prev); if (next) s.add(id); else s.delete(id); return s })
              }}
              onNavigate={id => navigate(`/marketplace/listing/${id}`)}
            />
          ))
        )}
      </div>
    </PageLayout>
  )
}
