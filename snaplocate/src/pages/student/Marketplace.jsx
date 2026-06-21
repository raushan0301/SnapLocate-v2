import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import {
  Search, Plus, Heart, Eye, Tag, Filter, SlidersHorizontal,
  ShoppingBag, BookOpen, Laptop, Bike, Sofa, Shirt, Trophy, Box,
  MessageCircle, Star, TrendingUp, Bookmark
} from 'lucide-react'

const FONT = "'Plus Jakarta Sans', 'Inter', sans-serif"

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

const CONDITION_BADGE = {
  'Like New':    { bg: '#dcfce7', color: '#16a34a' },
  'Good':        { bg: '#dbeafe', color: '#1d4ed8' },
  'Fair':        { bg: '#fef3c7', color: '#d97706' },
  'Needs Repair':{ bg: '#fee2e2', color: '#dc2626' },
}

const STATUS_OVERLAY = {
  Sold:     { label: 'Sold', bg: 'rgba(15,23,42,0.72)' },
  Reserved: { label: 'Reserved', bg: 'rgba(99,102,241,0.72)' },
}

function formatPrice(price) {
  if (price === null || price === undefined || price === 0) return 'Free'
  return `₹${Number(price).toLocaleString('en-IN')}`
}

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

// ─── Listing Card ───────────────────────────────────────────
// isSaved comes from the parent's savedIds Set, not item.is_saved,
// so the heart stays red across filter changes and re-fetches
function ListingCard({ item, isSaved, onSaveToggle, onNavigate }) {
  const [savePending, setSavePending] = useState(false)
  const isSold = item.status !== 'Active'
  const catConfig = CATEGORIES.find(c => c.id === item.category) || CATEGORIES[7]
  const condStyle = CONDITION_BADGE[item.condition] || CONDITION_BADGE['Good']

  const handleSave = async (e) => {
    e.stopPropagation()
    if (savePending) return
    setSavePending(true)
    const next = !isSaved
    onSaveToggle?.(item.id, next) // optimistic update via parent
    try {
      if (next) await api.post(`/api/marketplace/save/${item.id}`)
      else await api.delete(`/api/marketplace/save/${item.id}`)
    } catch {
      onSaveToggle?.(item.id, !next) // revert
    }
    finally { setSavePending(false) }
  }

  return (
    <div
      onClick={() => !isSold && onNavigate(item.id)}
      style={{
        background: '#fff',
        borderRadius: 20,
        overflow: 'hidden',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        border: '1px solid #f1f5f9',
        transition: 'transform 0.22s ease, box-shadow 0.22s ease',
        cursor: isSold ? 'default' : 'pointer',
        opacity: isSold ? 0.82 : 1,
        position: 'relative',
        fontFamily: FONT,
      }}
      onMouseEnter={e => { if (!isSold) { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(99,102,241,0.13)' } }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)' }}
    >
      {/* Image area */}
      <div style={{ position: 'relative', width: '100%', paddingTop: '75%', background: '#f8fafc', overflow: 'hidden' }}>
        {item.images?.[0] ? (
          <img
            src={item.images[0]} alt={item.title}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {(() => { const Icon = catConfig.icon; return <Icon size={40} color="#cbd5e1" /> })()}
          </div>
        )}

        {/* Sold / Reserved overlay */}
        {isSold && STATUS_OVERLAY[item.status] && (
          <div style={{
            position: 'absolute', inset: 0,
            background: STATUS_OVERLAY[item.status].bg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ color: '#fff', fontFamily: FONT, fontWeight: 800, fontSize: 22, letterSpacing: 1, textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
              {STATUS_OVERLAY[item.status].label}
            </span>
          </div>
        )}

        {/* Price badge */}
        <div style={{
          position: 'absolute', top: 10, left: 10,
          background: item.price === null || item.price === 0 ? '#10b981' : 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(8px)',
          padding: '4px 10px', borderRadius: 20,
          boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
        }}>
          <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 14, color: item.price === null || item.price === 0 ? '#fff' : '#0f172a' }}>
            {formatPrice(item.price)}
          </span>
        </div>

        {/* Negotiable flag */}
        {item.is_negotiable && !(item.price === null || item.price === 0) && (
          <div style={{ position: 'absolute', top: 10, left: 75, background: 'rgba(255,255,255,0.95)', padding: '3px 8px', borderRadius: 20, backdropFilter: 'blur(8px)' }}>
            <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: 11, color: '#6366f1' }}>Negotiable</span>
          </div>
        )}

        {/* Save heart */}
        <button
          onClick={handleSave}
          style={{
            position: 'absolute', top: 10, right: 10,
            width: 34, height: 34, borderRadius: '50%',
            background: 'rgba(255,255,255,0.95)',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            backdropFilter: 'blur(8px)',
            transition: 'transform 0.18s',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <Heart size={16} fill={isSaved ? '#ef4444' : 'none'} color={isSaved ? '#ef4444' : '#94a3b8'} />
        </button>

        {/* Image count badge */}
        {item.images?.length > 1 && (
          <div style={{ position: 'absolute', bottom: 10, right: 10, background: 'rgba(0,0,0,0.55)', padding: '2px 8px', borderRadius: 12 }}>
            <span style={{ color: '#fff', fontSize: 11, fontFamily: FONT, fontWeight: 600 }}>1/{item.images.length}</span>
          </div>
        )}
      </div>

      {/* Card body */}
      <div style={{ padding: '14px 16px 16px' }}>
        <h3 style={{
          fontFamily: FONT, fontWeight: 700, fontSize: 15, color: '#0f172a',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          margin: 0, marginBottom: 6,
        }}>
          {item.title}
        </h3>

        {/* Condition + Category tags */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
          <span style={{
            fontFamily: FONT, fontSize: 11, fontWeight: 700,
            padding: '2px 8px', borderRadius: 20,
            background: condStyle.bg, color: condStyle.color,
          }}>
            {item.condition}
          </span>
          <span style={{
            fontFamily: FONT, fontSize: 11, fontWeight: 700,
            padding: '2px 8px', borderRadius: 20,
            background: '#f1f5f9', color: '#64748b',
          }}>
            {item.category}
          </span>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <img
              src={item.seller?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.seller?.full_name || 'U')}&background=eef2ff&color=6366f1&size=64`}
              alt="" style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover' }}
            />
            <span style={{ fontFamily: FONT, fontSize: 12, fontWeight: 500, color: '#64748b' }}>
              {item.seller?.full_name?.split(' ')[0] || 'Student'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Eye size={12} color="#94a3b8" />
              <span style={{ fontFamily: FONT, fontSize: 11, color: '#94a3b8' }}>{item.views_count || 0}</span>
            </div>
            <span style={{ fontFamily: FONT, fontSize: 11, color: '#cbd5e1' }}>{timeAgo(item.created_at)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Empty States ─────────────────────────────────────────────
function EmptyState({ icon, title, desc, action }) {
  return (
    <div style={{
      gridColumn: '1 / -1', padding: '80px 40px', textAlign: 'center',
      background: '#fff', borderRadius: 24, border: '2px dashed #e2e8f0',
    }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>{icon}</div>
      <h3 style={{ fontFamily: FONT, fontWeight: 700, fontSize: 20, color: '#0f172a', margin: '0 0 8px' }}>{title}</h3>
      <p style={{ fontFamily: FONT, fontSize: 15, color: '#64748b', margin: '0 0 24px' }}>{desc}</p>
      {action}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────
export default function MarketplacePage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [items, setItems]           = useState([])
  const [savedIds, setSavedIds]     = useState(new Set()) // Track saved listing IDs at feed level
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
        sort,
        limit: 40,
        offset: 0,
        ...(cat !== 'All' && { category: cat }),
        ...(search && { search }),
        ...(isFreeOnly && { is_free: true }),
      })
      const res = await api.get(`/api/marketplace?${params}`)
      const data = res.data || []
      setItems(data)
      setTotal(res.total || 0)
      // Merge newly-fetched is_saved states — backend is authoritative for initial load
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

  const activeCatConfig = CATEGORIES.find(c => c.id === cat) || CATEGORIES[0]

  return (
    <PageLayout>
      <style>{`
        .mkt-cat-btn:hover { transform: translateY(-2px) !important; }
        .mkt-cat-btn:hover { transform: translateY(-2px) !important; }
        .mkt-sort-select { appearance: none; }
        @keyframes mkt-pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .mkt-skeleton { animation: mkt-pulse 1.6s ease-in-out infinite; background: #f1f5f9; border-radius: 16px; }
      `}</style>

      <div style={{ width: '100%', maxWidth: '100%', padding: '0 24px', boxSizing: 'border-box', fontFamily: FONT }}>

        {/* ─── Premium header ─── */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          padding: '20px 28px', borderRadius: 24,
          boxShadow: '0 10px 30px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9',
          gap: 24, flexWrap: 'wrap', marginBottom: 20
        }}>
          <div>
            <h1 style={{ fontFamily: FONT, fontWeight: 800, fontSize: 30, color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>
              Campus Marketplace
            </h1>
            <p style={{ fontFamily: FONT, fontSize: 15, color: '#64748b', margin: '6px 0 0' }}>
              Buy & sell within your university — {total} active listings
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => navigate('/marketplace/chat')} style={{
              padding: '10px 20px', borderRadius: 14, background: '#fff',
              border: '1px solid #e2e8f0', color: '#0f172a', fontFamily: FONT,
              fontWeight: 600, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            }}>
              <MessageCircle size={16} /> My Chats
            </button>
            <button onClick={() => navigate('/marketplace/dashboard')} style={{
              padding: '10px 20px', borderRadius: 14, background: '#fff',
              border: '1px solid #e2e8f0', color: '#0f172a', fontFamily: FONT,
              fontWeight: 600, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            }}>
              <Bookmark size={16} /> My Listings
            </button>
            <button onClick={() => navigate('/marketplace/create')} style={{
              padding: '10px 22px', borderRadius: 14, background: '#4f46e5',
              border: 'none', color: '#fff', fontFamily: FONT,
              fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
              boxShadow: '0 8px 20px rgba(79, 70, 229, 0.25)',
            }}>
              <Plus size={16} /> Sell Item
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div style={{ position: 'relative', marginBottom: 24, maxWidth: 400 }}>
          <Search size={15} color="#94a3b8"
            style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text" placeholder="Search for textbooks, electronics, bikes..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '12px 16px 12px 42px', borderRadius: 14,
              border: '1px solid #e2e8f0', outline: 'none',
              background: '#ffffff',
              fontFamily: FONT, fontSize: 14, color: '#0f172a', lineHeight: '20px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* ─── Category filter bar ─── */}
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4, marginBottom: 24 }}>
          {CATEGORIES.map(c => {
            const Icon = c.icon
            const active = cat === c.id
            return (
              <button key={c.id} className="mkt-cat-btn" onClick={() => setCat(c.id)} style={{
                flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8,
                padding: '9px 18px', borderRadius: 40,
                background: active ? c.color : '#fff',
                border: `1.5px solid ${active ? c.color : '#e2e8f0'}`,
                cursor: 'pointer', transition: 'all 0.2s',
                fontFamily: FONT, fontSize: 13, fontWeight: active ? 700 : 500,
                color: active ? '#fff' : '#475569',
              }}>
                <Icon size={15} color={active ? '#fff' : c.color} />
                {c.label}
              </button>
            )
          })}
        </div>

        {/* ─── Sort & filter row ─── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontFamily: FONT, fontSize: 14, fontWeight: 600, color: '#475569' }}>
              {loading ? 'Loading...' : `${total} listings`}
            </span>
            <button onClick={() => setIsFreeOnly(!isFreeOnly)} style={{
              padding: '6px 14px', borderRadius: 20,
              background: isFreeOnly ? '#dcfce7' : '#f8fafc',
              border: `1.5px solid ${isFreeOnly ? '#16a34a' : '#e2e8f0'}`,
              color: isFreeOnly ? '#16a34a' : '#64748b',
              fontFamily: FONT, fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>
              🎁 Free Only
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <SlidersHorizontal size={16} color="#6366f1" />
            <select value={sort} onChange={e => setSort(e.target.value)} className="mkt-sort-select" style={{
              padding: '8px 32px 8px 14px', borderRadius: 12, border: '1.5px solid #e2e8f0',
              fontFamily: FONT, fontSize: 13, fontWeight: 600, color: '#0f172a',
              background: '#fff', cursor: 'pointer', outline: 'none',
            }}>
              {SORT_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          </div>
        </div>

        {/* ─── Listing grid ─── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="mkt-skeleton" style={{ height: 360 }} />
            ))
          ) : items.length === 0 ? (
            <EmptyState
              icon="🔍"
              title="No listings found"
              desc={search ? `No results for "${search}". Try different keywords or clear filters.` : 'Be the first to list something amazing in this category!'}
              action={
                <button onClick={() => navigate('/marketplace/create')} style={{
                  padding: '12px 28px', borderRadius: 14, background: '#6366f1', border: 'none',
                  color: '#fff', fontFamily: FONT, fontWeight: 700, fontSize: 15, cursor: 'pointer',
                }}>
                  + Post a Listing
                </button>
              }
            />
          ) : (
            items.map(item => (
              <ListingCard
                key={item.id}
                item={item}
                isSaved={savedIds.has(item.id)}
                onSaveToggle={(id, next) => {
                  setSavedIds(prev => {
                    const s = new Set(prev)
                    if (next) s.add(id); else s.delete(id)
                    return s
                  })
                }}
                onNavigate={id => navigate(`/marketplace/listing/${id}`)}
              />
            ))
          )}
        </div>
      </div>
    </PageLayout>
  )
}
