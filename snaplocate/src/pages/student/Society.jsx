import { useState, useEffect } from 'react'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'

function SocietyCard({ s }) {
  const people = [
    ...(s.presidents || []).map(p => ({ ...p, role: 'President', initBg: '#e0e7ff', initC: '#4f46e5' })),
    ...(s.vice_presidents || []).map(p => ({ ...p, role: 'Vice President', initBg: '#f0fdf4', initC: '#16a34a' })),
  ]

  return (
    <div className="bg-white border border-slate-100 rounded-[14px] px-[22px] py-5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
      <div className="flex items-start gap-4">
        {/* Logo */}
        {s.logo ? (
          <img src={s.logo} alt={s.name} className="w-[60px] h-[60px] rounded-xl object-cover shrink-0 border border-black/[0.06]" />
        ) : (
          <div
            className="w-[60px] h-[60px] rounded-xl shrink-0 flex items-center justify-center border border-black/[0.06] font-extrabold"
            style={{
              background: s.abbrBg || '#f1f5f9',
              fontSize: typeof s.abbr === 'string' && s.abbr.length <= 4 ? 16 : 26,
              color: s.abbrC || '#475569',
              fontFamily: "'Inter', sans-serif",
            }}>
            {s.abbr}
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <div className="text-[16px] font-bold leading-[22px] t-primary">{s.name}</div>
              <div className="text-[13px] font-normal leading-[18px] text-slate-500 mt-1.5 max-w-[560px]">{s.desc}</div>
            </div>
            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0 ml-4">
              {s.email && (
                <a href={`mailto:${s.email}`} className="no-underline">
                  <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] border-[1.5px] border-indigo-100 bg-indigo-50 cursor-pointer text-[12px] font-semibold leading-4 text-brand">
                    <svg width="13" height="11" viewBox="0 0 13 11" fill="none">
                      <rect x="0.5" y="0.5" width="12" height="10" rx="1.5" stroke="#4f46e5" strokeWidth="1.1" />
                      <path d="M0.5 2.5l6 4 6-4" stroke="#4f46e5" strokeWidth="1.1" strokeLinecap="round" />
                    </svg>
                    {s.email}
                  </button>
                </a>
              )}
              {s.website_link && (
                <a href={s.website_link} target="_blank" rel="noreferrer" className="no-underline">
                  <button className="bg-transparent border border-slate-100 rounded-lg w-[34px] h-[34px] flex items-center justify-center cursor-pointer">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <circle cx="7" cy="7" r="6" stroke="#64748b" strokeWidth="1.2" />
                      <path d="M7 1c0 0-3 2.5-3 6s3 6 3 6M7 1c0 0 3 2.5 3 6s-3 6-3 6M1 7h12" stroke="#64748b" strokeWidth="1.2" strokeLinecap="round" />
                    </svg>
                  </button>
                </a>
              )}
            </div>
          </div>

          {/* President + VP */}
          {people.length > 0 && (
            <div className="flex gap-8 mt-3.5 flex-wrap">
              {people.map((person, pi) => {
                const initials = person.name ? person.name.substring(0, 2).toUpperCase() : '?'
                return (
                  <div key={pi} className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: person.initBg }}>
                      <span className="text-[10px] font-bold leading-[14px]" style={{ color: person.initC }}>{initials}</span>
                    </div>
                    <div>
                      <div className="flex gap-1.5 items-baseline">
                        <span className="text-[12px] font-bold leading-4 t-primary">{person.name || 'Unknown'}</span>
                        <span className="text-[11px] font-normal leading-[15px] text-slate-400">({person.role})</span>
                      </div>
                      {person.email && (
                        <div className="text-[11px] font-medium leading-[15px] text-brand mt-0.5">{person.email}</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function SocietyPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [dbSocieties, setDbSocieties] = useState(null)
  const [loading, setLoading] = useState(true)
  const [collapsedSections, setCollapsedSections] = useState({})

  const toggleSection = section => setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }))

  useEffect(() => {
    const fetchSocieties = async () => {
      try {
        const res = await api.get('/api/societies')
        setDbSocieties(res.success && res.data ? res.data : [])
      } catch { setDbSocieties([]) }
      finally { setLoading(false) }
    }
    fetchSocieties()
  }, [])

  let displayGroups = []
  if (dbSocieties && dbSocieties.length > 0) {
    const cats = {}
    dbSocieties.forEach(s => {
      const c = s.category || 'Other Clubs'
      if (!cats[c]) cats[c] = []
      cats[c].push({
        id: s.id, logo: s.logo_img, website_link: s.website_link,
        abbr: s.name.substring(0, 3).toUpperCase(),
        abbrBg: '#eef2ff', abbrC: '#4f46e5',
        name: s.name, desc: s.description || 'No description provided.',
        email: s.email_id || '', presidents: s.presidents || [], vice_presidents: s.vice_presidents || [],
      })
    })
    displayGroups = Object.keys(cats).map(key => ({
      section: key,
      count: `${cats[key].length} Active`,
      iconColor: '#4f46e5',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="6.5" stroke="#4f46e5" strokeWidth="1.3" />
          <path d="M5.5 10.5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5" stroke="#4f46e5" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      ),
      societies: cats[key],
    }))
  }

  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase()
    displayGroups = displayGroups.map(g => {
      const filteredSocieties = g.societies.filter(s =>
        s.name.toLowerCase().includes(query) ||
        g.section.toLowerCase().includes(query) ||
        s.desc.toLowerCase().includes(query) ||
        (s.presidents || []).some(p => p.name.toLowerCase().includes(query)) ||
        (s.vice_presidents || []).some(vp => vp.name.toLowerCase().includes(query))
      )
      return { ...g, societies: filteredSocieties, count: `${filteredSocieties.length} Active` }
    }).filter(g => g.societies.length > 0)
  }

  return (
    <PageLayout>
      {/* Header */}
      <div className="flex justify-between items-center gap-5 flex-wrap mb-3">
        <h1 className="text-[26px] font-bold leading-[34px] t-primary m-0">Societies &amp; Clubs</h1>
        <div className="relative flex-1 min-w-[300px] max-w-[400px]">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2" width="15" height="15" viewBox="0 0 15 15" fill="none">
            <circle cx="6.5" cy="6.5" r="5.5" stroke="#94a3b8" strokeWidth="1.3" />
            <path d="M11 11l3 3" stroke="#94a3b8" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          <input
            placeholder="Search by club name, category, or president..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-[14px] t-base t-primary outline-none shadow-[0_1px_4px_rgba(0,0,0,0.04)] box-border"
          />
        </div>
      </div>

      {/* Sections */}
      <div className={`flex flex-col gap-7 transition-opacity duration-200 ${loading ? 'opacity-60' : 'opacity-100'}`}>
        {displayGroups.length > 0 ? displayGroups.map((group, gi) => {
          const isCollapsed = collapsedSections[group.section]
          return (
            <div key={gi}>
              {/* Section header */}
              <div
                onClick={() => toggleSection(group.section)}
                className={`flex justify-between items-center cursor-pointer py-1 ${isCollapsed ? 'mb-0 border-b border-slate-100' : 'mb-3.5'}`}>
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-full border-[1.5px] border-brand flex items-center justify-center transition-transform duration-200 ${isCollapsed ? '-rotate-90' : 'rotate-0'}`}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </div>
                  <span className="text-[17px] font-bold leading-[23px] t-primary">{group.section}</span>
                </div>
                <span className={`text-[12px] font-semibold leading-4 px-3 py-1 rounded-[20px] ${gi === 0 ? 'bg-indigo-50 text-brand' : 'bg-violet-50 text-violet-600'}`}
                  style={{ color: group.iconColor || '#4f46e5' }}>
                  {group.count}
                </span>
              </div>

              {/* Cards */}
              {!isCollapsed && (
                <div className="flex flex-col gap-3">
                  {group.societies.map(s => <SocietyCard key={s.id} s={s} />)}
                </div>
              )}
            </div>
          )
        }) : (
          <div className="text-center py-16 text-slate-400">
            <div className="text-[48px] mb-4">🔍</div>
            <div className="text-[18px] font-semibold leading-6 text-slate-400">No societies found</div>
          </div>
        )}
      </div>
    </PageLayout>
  )
}
