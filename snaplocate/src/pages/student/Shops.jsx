import { useState, useEffect } from 'react'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'

const pjs = (size, weight, lh, color) => ({
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  fontSize: size, fontWeight: weight, lineHeight: lh, color,
})
const inter = (size, weight, lh, color) => ({
  fontFamily: "'Inter', sans-serif",
  fontSize: size, fontWeight: weight, lineHeight: lh, color,
})

/* ─── Data ─────────────────────────────────────────────────────── */
const LOCATIONS = ['All', 'Jaggi', 'COS', 'G Block', 'TSLAS']
const CATEGORIES = ['All Categories', 'Cafe', 'Food', 'Stationary', 'General Store']



/* ─── Category icon ────────────────────────────────────────────── */
function CatIcon({ cat, size = 32 }) {
  const icons = {
    'Cafe': '☕',
    'Food': '🍔',
    'Stationary': '📚',
    'General Store': '🛒',
  }
  return <span style={{ fontSize: size }}>{icons[cat] || '🏪'}</span>
}

/* ─── Menu Modal ────────────────────────────────────────────────── */
function MenuModal({ isOpen, onClose, shop }) {
  if (!isOpen || !shop) return null

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 20
    }} onClick={onClose}>
      <div style={{
        background: '#fff', borderRadius: 20, width: '100%', maxWidth: 500,
        maxHeight: '80vh', overflowY: 'auto', position: 'relative',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
      }} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={{
          position: 'absolute', top: 16, right: 16, border: 'none', background: '#f1f5f9',
          width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', fontSize: 18
        }}>×</button>
        
        <div style={{ padding: 24 }}>
          <h2 style={pjs(20, 700, '28px', '#0f172a')}>{shop.name} Menu</h2>
          <p style={{ ...pjs(13, 500, '18px', '#64748b'), marginBottom: 20 }}>{shop.type}</p>

          {shop.menu_type === 'image' ? (
            shop.menu_img ? (
              <img src={shop.menu_img} alt="Menu" style={{ width: '100%', borderRadius: 12, border: '1px solid #f1f5f9' }} />
            ) : (
              <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Menu image not available</div>
            )
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {shop.menu_items?.length > 0 ? shop.menu_items.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: '#f8fafc', borderRadius: 12, border: '1px solid #f1f5f9' }}>
                  <span style={pjs(14, 600, '20px', '#1e293b')}>{item.name}</span>
                  <span style={pjs(14, 700, '20px', '#4f46e5')}>{item.price}</span>
                </div>
              )) : (
                <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>No menu items listed</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Shop card ────────────────────────────────────────────────── */
function ShopCard({ shop, onOpenMenu }) {
  const open = shop.status === 'OPEN'

  const ActionIcon = ({ type, color }) => {
    if (type === 'bag') return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M4 4V3a3 3 0 016 0v1m-7 0h8l.5 8H2.5L3 4z" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
    if (type === 'file') return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 1h5l3 3v9H3V1z" stroke={color} strokeWidth="1.2" /><path d="M8 1v3h3" stroke={color} strokeWidth="1.2" /></svg>
    // Default or 'book'
    return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="12" height="12" rx="2" stroke={color} strokeWidth="1.2" /><path d="M4 4h6M4 7h6M4 10h3" stroke={color} strokeWidth="1.2" strokeLinecap="round" /></svg>
  }

  return (
    <div style={{
      background: '#ffffff', borderRadius: 16,
      border: '1px solid #f1f5f9', overflow: 'hidden',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Image area */}
      <div style={{
        height: 130, 
        background: shop.logo ? `url(${shop.logo}) center/cover no-repeat` : '#ffffff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', borderBottom: '1px solid #f8fafc'
      }}>
        {/* Overlay if image exists */}
        {shop.logo && <div style={{ position: 'absolute', top:0, left:0, width:'100%', height:'100%', background: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(1px)' }} />}

        {/* Status badge */}
        <div style={{
          position: 'absolute', top: 12, right: 12,
          background: open ? '#dcfce7' : '#fee2e2',
          border: `1px solid ${open ? '#86efac' : '#fca5a5'}`,
          borderRadius: 20, padding: '3px 10px',
          ...inter(10, 700, '14px', open ? '#16a34a' : '#dc2626'),
          letterSpacing: '0.06em',
          zIndex: 2
        }}>
          {open ? 'OPEN NOW' : 'CLOSED'}
        </div>

        {/* Shop icon */}
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: '#ffffff', boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 32, overflow: 'hidden', border: '1px solid #f1f5f9',
          position: 'relative', zIndex: 2
        }}>
          <CatIcon cat={shop.cat} size={42} />
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '16px 18px', flex: 1, display: 'flex', flexDirection: 'column', gap: 0 }}>
        <div style={pjs(15, 700, '21px', '#0f172a')}>{shop.name}</div>
        <div style={{ ...pjs(12, 600, '16px', '#7c3aed'), marginTop: 3 }}>{shop.type}</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, margin: '14px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 1h3l1.5 3.5-1.5 1a7 7 0 003.5 3.5l1-1.5L13 9v3a1 1 0 01-1 1C5.4 13 0 7.6 0 1A1 1 0 011 0h1z" fill="#94a3b8" /></svg>
            <span style={pjs(12, 400, '16px', '#64748b')}>{shop.phone}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="12" height="14" viewBox="0 0 12 14" fill="none"><path d="M6 0a5 5 0 015 5c0 3.5-5 9-5 9S1 8.5 1 5a5 5 0 015-5z" fill="#94a3b8" /><circle cx="6" cy="5" r="2" fill="white" /></svg>
            <span style={pjs(12, 400, '16px', '#64748b')}>{shop.location}</span>
          </div>
        </div>

        {/* Action row */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 'auto' }}>
          <button 
            onClick={() => onOpenMenu(shop)}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '10px', borderRadius: 12, cursor: open ? 'pointer' : 'default',
              border: 'none', background: open ? '#4f46e5' : '#f1f5f9',
              ...pjs(13, 700, '18px', open ? '#ffffff' : '#94a3b8'),
              transition: 'background 0.15s',
            }}
          >
            <ActionIcon type={shop.btnIcon} color={open ? 'white' : '#94a3b8'} />
            {shop.btnLabel}
          </button>
          <button style={{
            width: 40, height: 40, borderRadius: 12, flexShrink: 0,
            border: '1.5px solid #e0e7ff', background: '#eef2ff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2l5 5-5 5M3 7h10" stroke="#4f46e5" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   Shops Page
═══════════════════════════════════════════════════════════════ */
export default function ShopsPage() {
  const [activeLoc, setActiveLoc] = useState('All')
  const [activeCat, setActiveCat] = useState('All Categories')
  const [search, setSearch] = useState('')
  const [dbShops, setDbShops] = useState(null)
  const [selectedMenuShop, setSelectedMenuShop] = useState(null)

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const res = await api.get('/api/shops')
        const json = res.data
        if (res.success && json && json.length > 0) {
          const mapped = json.map(db => ({
            ...db,
            id: db.id,
            name: db.name,
            type: db.type || 'General',
            status: db.status || 'OPEN',
            phone: db.phone || '+91 -',
            location: db.location_detail || 'Campus',
            btnLabel: db.btn_label || 'View Details', 
            btnIcon: db.btn_icon || 'book', 
            logo: db.logo_img,
            emoji: '🏪',
            cat: db.category || 'General Store', loc: db.location_tag || 'All',
            menu_type: db.menu_type || 'image',
            menu_img: db.menu_img,
            menu_items: db.menu_items || []
          }))
          setDbShops(mapped)
        } else {
          setDbShops(null)
        }
      } catch (err) {
        console.error('Failed to fetch shops:', err)
      }
    }
    fetchShops()
  }, [])

  const displayShops = dbShops || []

  const filtered = displayShops.filter(s => {
    const matchLoc = activeLoc === 'All' || s.loc === activeLoc
    const matchCat = activeCat === 'All Categories' || s.cat === activeCat
    const query = search.trim().toLowerCase()
    return matchLoc && matchCat && (!query || s.name.toLowerCase().includes(query) || s.type.toLowerCase().includes(query))
  })

  return (
    <PageLayout>
      <MenuModal isOpen={!!selectedMenuShop} onClose={() => setSelectedMenuShop(null)} shop={selectedMenuShop} />
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
        <div>
          <h1 style={pjs(26, 700, '34px', '#0f172a')}>Campus Shop</h1>
          <p style={{ ...pjs(13, 400, '18px', '#64748b'), marginTop: 4 }}>Find your daily essentials effortlessly</p>
        </div>

        <div style={{ position: 'relative', flex: '1 1 300px', maxWidth: 400 }}>
          <svg style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} width="15" height="15" viewBox="0 0 15 15" fill="none">
            <circle cx="6.5" cy="6.5" r="5.5" stroke="#94a3b8" strokeWidth="1.3"/>
            <path d="M11 11l3 3" stroke="#94a3b8" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
          <input 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder="Search shops..." 
            style={{ 
              padding: '12px 16px 12px 42px', 
              borderRadius: 14, 
              border: '1px solid #e2e8f0', 
              background: '#ffffff', 
              ...pjs(14, 400, '20px', '#0f172a'), 
              outline: 'none', 
              width: '100%', 
              boxSizing: 'border-box',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)' 
            }} 
          />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ ...inter(11, 700, '15px', '#94a3b8'), letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>LOCATIONS:</span>
          <div style={{ display: 'flex', gap: 6 }}>
            {LOCATIONS.map(loc => (
              <button key={loc} onClick={() => setActiveLoc(loc)} style={{
                padding: '7px 16px', borderRadius: 24, cursor: 'pointer',
                border: activeLoc === loc ? 'none' : '1.5px solid #e2e8f0',
                background: activeLoc === loc ? '#4f46e5' : '#ffffff',
                ...pjs(13, activeLoc === loc ? 700 : 500, '18px', activeLoc === loc ? '#ffffff' : '#64748b'),
              }}>{loc}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, borderBottom: '1px solid #f1f5f9', paddingBottom: 2 }}>
        {CATEGORIES.map(cat => {
          const active = activeCat === cat
          return (
            <button key={cat} onClick={() => setActiveCat(cat)} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '9px 16px', borderRadius: '10px 10px 0 0',
              border: 'none', cursor: 'pointer', background: active ? '#ffffff' : 'transparent',
              borderBottom: active ? '2px solid #4f46e5' : '2px solid transparent',
              ...pjs(13, active ? 700 : 500, '18px', active ? '#4f46e5' : '#64748b'),
            }}>
              {cat !== 'All Categories' && <CatIcon cat={cat} size={16} />}
              {cat}
            </button>
          )
        })}
      </div>

      {filtered.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
          {filtered.map(s => <ShopCard key={s.id} shop={s} onOpenMenu={setSelectedMenuShop} />)}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#94a3b8' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
          <div style={pjs(16, 600, '22px', '#94a3b8')}>No shops found for this filter</div>
        </div>
      )}
    </PageLayout>
  )
}
