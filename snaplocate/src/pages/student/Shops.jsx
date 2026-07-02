import { useState, useEffect } from 'react'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'

const LOCATIONS  = ['All', 'Jaggi', 'COS', 'G Block', 'TSLAS']
const CATEGORIES = ['All Categories', 'Cafe', 'Food', 'Stationary', 'General Store']

function CatIcon({ cat, size = 32 }) {
  const icons = { 'Cafe': '☕', 'Food': '🍔', 'Stationary': '📚', 'General Store': '🛒' }
  return <span style={{ fontSize: size }}>{icons[cat] || '🏪'}</span>
}

function MenuModal({ isOpen, onClose, shop }) {
  if (!isOpen || !shop) return null
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-5" onClick={onClose}>
      <div className="bg-white rounded-[20px] w-full max-w-[500px] max-h-[80vh] overflow-y-auto relative shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1)]" onClick={e => e.stopPropagation()}>
        <button onClick={onClose}
          className="absolute top-4 right-4 border-none bg-slate-100 w-8 h-8 rounded-full cursor-pointer text-[18px] flex items-center justify-center">
          ×
        </button>
        <div className="p-6">
          <h2 className="text-[20px] font-bold leading-7 t-primary m-0">{shop.name} Menu</h2>
          <p className="text-[13px] font-medium leading-[18px] text-slate-500 mb-5">{shop.type}</p>
          {shop.menu_type === 'image' ? (
            shop.menu_img ? (
              <img src={shop.menu_img} alt="Menu" className="w-full rounded-xl border border-slate-100" />
            ) : (
              <div className="py-10 text-center text-slate-400">Menu image not available</div>
            )
          ) : (
            <div className="flex flex-col gap-3">
              {shop.menu_items?.length > 0 ? shop.menu_items.map((item, idx) => (
                <div key={idx} className="flex justify-between px-4 py-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[14px] font-semibold leading-5 text-slate-800">{item.name}</span>
                  <span className="text-[14px] font-bold leading-5 text-brand">{item.price}</span>
                </div>
              )) : (
                <div className="py-10 text-center text-slate-400">No menu items listed</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ShopCard({ shop, onOpenMenu }) {
  const open = shop.status === 'OPEN'

  const ActionIcon = ({ type, color }) => {
    if (type === 'bag') return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M4 4V3a3 3 0 016 0v1m-7 0h8l.5 8H2.5L3 4z" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
    if (type === 'file') return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 1h5l3 3v9H3V1z" stroke={color} strokeWidth="1.2" /><path d="M8 1v3h3" stroke={color} strokeWidth="1.2" /></svg>
    return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="12" height="12" rx="2" stroke={color} strokeWidth="1.2" /><path d="M4 4h6M4 7h6M4 10h3" stroke={color} strokeWidth="1.2" strokeLinecap="round" /></svg>
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.05)] flex flex-col">
      {/* Image area */}
      <div className="h-[130px] flex items-center justify-center relative border-b border-slate-50"
        style={{ background: shop.logo ? `url(${shop.logo}) center/cover no-repeat` : '#ffffff' }}>
        {shop.logo && <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px]" />}

        {/* Status badge */}
        <div className={`absolute top-3 right-3 rounded-[20px] px-2.5 py-[3px] text-[10px] font-bold leading-[14px] tracking-[0.06em] z-[2] border ${open ? 'bg-green-100 border-green-300 text-green-700' : 'bg-red-100 border-red-300 text-red-600'}`}>
          {open ? 'OPEN NOW' : 'CLOSED'}
        </div>

        {/* Shop icon */}
        <div className="w-20 h-20 rounded-full bg-white shadow-[0_4px_16px_rgba(0,0,0,0.08)] flex items-center justify-center overflow-hidden border border-slate-100 relative z-[2]">
          <CatIcon cat={shop.cat} size={42} />
        </div>
      </div>

      {/* Content */}
      <div className="px-[18px] py-4 flex-1 flex flex-col">
        <div className="text-[15px] font-bold leading-[21px] t-primary">{shop.name}</div>
        <div className="text-[12px] font-semibold leading-4 text-violet-600 mt-[3px]">{shop.type}</div>

        <div className="flex flex-col gap-1.5 my-3.5">
          <div className="flex items-center gap-2">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 1h3l1.5 3.5-1.5 1a7 7 0 003.5 3.5l1-1.5L13 9v3a1 1 0 01-1 1C5.4 13 0 7.6 0 1A1 1 0 011 0h1z" fill="#94a3b8" /></svg>
            <span className="text-[12px] font-normal leading-4 text-slate-500">{shop.phone}</span>
          </div>
          <div className="flex items-center gap-2">
            <svg width="12" height="14" viewBox="0 0 12 14" fill="none"><path d="M6 0a5 5 0 015 5c0 3.5-5 9-5 9S1 8.5 1 5a5 5 0 015-5z" fill="#94a3b8" /><circle cx="6" cy="5" r="2" fill="white" /></svg>
            <span className="text-[12px] font-normal leading-4 text-slate-500">{shop.location}</span>
          </div>
        </div>

        {/* Action row */}
        <div className="flex gap-2.5 items-center mt-auto">
          <button
            onClick={() => onOpenMenu(shop)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-none text-[13px] font-bold leading-[18px] transition-colors ${open ? 'bg-brand text-white cursor-pointer' : 'bg-slate-100 text-slate-400 cursor-default'}`}>
            <ActionIcon type={shop.btnIcon} color={open ? 'white' : '#94a3b8'} />
            {shop.btnLabel}
          </button>
          <button className="w-10 h-10 rounded-xl shrink-0 border-[1.5px] border-indigo-100 bg-indigo-50 flex items-center justify-center cursor-pointer">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2l5 5-5 5M3 7h10" stroke="#4f46e5" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </div>
      </div>
    </div>
  )
}

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
            id: db.id, name: db.name, type: db.type || 'General',
            status: db.status || 'OPEN', phone: db.phone || '+91 -',
            location: db.location_detail || 'Campus',
            btnLabel: db.btn_label || 'View Details',
            btnIcon: db.btn_icon || 'book', logo: db.logo_img, emoji: '🏪',
            cat: db.category || 'General Store', loc: db.location_tag || 'All',
            menu_type: db.menu_type || 'image', menu_img: db.menu_img,
            menu_items: db.menu_items || [],
          }))
          setDbShops(mapped)
        } else {
          setDbShops(null)
        }
      } catch (err) { console.error('Failed to fetch shops:', err) }
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

      <div className="flex justify-between items-start gap-5 flex-wrap">
        <div>
          <h1 className="text-[26px] font-bold leading-[34px] t-primary m-0">Campus Shop</h1>
          <p className="t-md t-muted mt-1 m-0">Find your daily essentials effortlessly</p>
        </div>
      </div>

      <div className="mt-10 py-16 px-5 bg-white rounded-3xl border border-dashed border-slate-300 text-center shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
        <div className="text-[64px] mb-5">🚧</div>
        <h2 className="text-[24px] font-extrabold leading-8 t-primary m-0">Coming Soon</h2>
        <p className="t-base t-muted max-w-[400px] mx-auto mt-3 m-0">
          We're currently gathering data for all campus shops and menus. Check back later to browse your favorite snacks!
        </p>
      </div>

      {false && (
        <>
          <div className="relative flex-1 min-w-[300px] max-w-[400px]">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2" width="15" height="15" viewBox="0 0 15 15" fill="none">
              <circle cx="6.5" cy="6.5" r="5.5" stroke="#94a3b8" strokeWidth="1.3" />
              <path d="M11 11l3 3" stroke="#94a3b8" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search shops..."
              className="w-full pl-10 pr-4 py-3 rounded-[14px] border border-slate-200 bg-white t-base t-primary outline-none shadow-[0_1px_4px_rgba(0,0,0,0.04)] box-border" />
          </div>

          <div className="flex justify-between items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold leading-[15px] text-slate-400 uppercase tracking-[0.08em] whitespace-nowrap">LOCATIONS:</span>
              <div className="flex gap-1.5">
                {LOCATIONS.map(loc => (
                  <button key={loc} onClick={() => setActiveLoc(loc)}
                    className={`px-4 py-[7px] rounded-3xl cursor-pointer text-[13px] transition-all ${activeLoc === loc ? 'border-none bg-brand text-white font-bold' : 'border-[1.5px] border-slate-200 bg-white text-slate-500 font-medium'}`}>
                    {loc}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-1.5 border-b border-slate-100 pb-0.5">
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setActiveCat(cat)}
                className={`flex items-center gap-1.5 px-4 py-[9px] rounded-t-[10px] border-none cursor-pointer -mb-px text-[13px] transition-colors ${activeCat === cat ? 'bg-white font-bold text-brand border-b-[2px] border-b-brand' : 'bg-transparent font-medium text-slate-500 border-b-[2px] border-b-transparent'}`}>
                {cat !== 'All Categories' && <CatIcon cat={cat} size={16} />}
                {cat}
              </button>
            ))}
          </div>

          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[18px]">
              {filtered.map(s => <ShopCard key={s.id} shop={s} onOpenMenu={setSelectedMenuShop} />)}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400">
              <div className="text-[40px] mb-3">🔍</div>
              <div className="text-[16px] font-semibold leading-[22px] text-slate-400">No shops found for this filter</div>
            </div>
          )}
        </>
      )}
    </PageLayout>
  )
}
