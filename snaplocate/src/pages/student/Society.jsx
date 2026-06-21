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

/* ─── Category tabs ──────────────────────────────────────────── */
/* Removed */

/* ─── Society data ───────────────────────────────────────────── */


/* ─── Society card ───────────────────────────────────────────── */
function SocietyCard({ s }) {
  const people = [
    ...(s.presidents || []).map(p => ({ ...p, role: 'President', initBg: '#e0e7ff', initC: '#4f46e5' })),
    ...(s.vice_presidents || []).map(p => ({ ...p, role: 'Vice President', initBg: '#f0fdf4', initC: '#16a34a' }))
  ]

  return (
    <div style={{
      background: '#ffffff', border: '1px solid #f1f5f9',
      borderRadius: 14, padding: '20px 22px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
        {/* Logo */}
        {s.logo ? (
          <img src={s.logo} alt={s.name} style={{ width: 60, height: 60, borderRadius: 12, objectFit: 'cover', flexShrink: 0, border: '1px solid rgba(0,0,0,0.06)' }} />
        ) : (
          <div style={{
            width: 60, height: 60, borderRadius: 12, flexShrink: 0,
            background: s.abbrBg || '#f1f5f9',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: typeof s.abbr === 'string' && s.abbr.length <= 4 ? 16 : 26,
            fontWeight: 800, color: s.abbrC || '#475569',
            fontFamily: "'Inter', sans-serif",
            border: '1px solid rgba(0,0,0,0.06)',
          }}>
            {s.abbr}
          </div>
        )}

        {/* Info */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={pjs(16, 700, '22px', '#0f172a')}>{s.name}</div>
              <div style={{ ...pjs(13, 400, '18px', '#64748b'), marginTop: 6, maxWidth: 560 }}>{s.desc}</div>
            </div>
            {/* Email + actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: 16 }}>
              {s.email && (
                <a href={`mailto:${s.email}`} style={{ textDecoration: 'none' }}>
                  <button style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 14px', borderRadius: 10,
                    border: '1.5px solid #e0e7ff', background: '#eef2ff',
                    cursor: 'pointer',
                    ...pjs(12, 600, '16px', '#4f46e5'),
                  }}>
                    <svg width="13" height="11" viewBox="0 0 13 11" fill="none">
                      <rect x="0.5" y="0.5" width="12" height="10" rx="1.5" stroke="#4f46e5" strokeWidth="1.1" />
                      <path d="M0.5 2.5l6 4 6-4" stroke="#4f46e5" strokeWidth="1.1" strokeLinecap="round" />
                    </svg>
                    {s.email}
                  </button>
                </a>
              )}
              {s.website_link && (
                <a href={s.website_link} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                  <button style={{ background: 'transparent', border: '1px solid #f1f5f9', borderRadius: 8, width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
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
            <div style={{ display: 'flex', gap: 32, marginTop: 14, flexWrap: 'wrap' }}>
              {people.map((person, pi) => {
                const initials = person.name ? person.name.substring(0, 2).toUpperCase() : '?';
                return (
                  <div key={pi} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: person.initBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ ...inter(10, 700, '14px', person.initC) }}>{initials}</span>
                    </div>
                    <div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'baseline' }}>
                        <span style={pjs(12, 700, '16px', '#0f172a')}>{person.name || 'Unknown'}</span>
                        <span style={pjs(11, 400, '15px', '#94a3b8')}>({person.role})</span>
                      </div>
                      {person.email && (
                        <div style={{ ...pjs(11, 500, '15px', '#4f46e5'), marginTop: 2 }}>
                          {person.email}
                        </div>
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

/* ══════════════════════════════════════════════════════════════
   Society Page
═══════════════════════════════════════════════════════════════ */
export default function SocietyPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [dbSocieties, setDbSocieties] = useState(null)
  const [loading, setLoading] = useState(true)
  const [collapsedSections, setCollapsedSections] = useState({})

  const toggleSection = (section) => {
    setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  useEffect(() => {
    const fetchSocieties = async () => {
      try {
        const res = await api.get('/api/societies')
        if (res.success && res.data) {
          setDbSocieties(res.data)
        } else {
          setDbSocieties([])
        }
      } catch (err) {
        console.error('Failed to fetch societies:', err)
        setDbSocieties([])
      } finally {
        setLoading(false)
      }
    }
    fetchSocieties()
  }, [])

  // Merge DB data with mock categories to present a unified view if DB exists
  let displayGroups = []
  if (dbSocieties && dbSocieties.length > 0) {
    // Group DB societies by category
    const cats = {}
    dbSocieties.forEach(s => {
      const c = s.category || 'Other Clubs'
      if (!cats[c]) cats[c] = []
      cats[c].push({
        id: s.id,
        logo: s.logo_img,
        website_link: s.website_link,
        abbr: s.name.substring(0, 3).toUpperCase(),
        abbrBg: '#eef2ff', abbrC: '#4f46e5',
        name: s.name, desc: s.description || 'No description provided.',
        email: s.email_id || '',
        presidents: s.presidents || [],
        vice_presidents: s.vice_presidents || []
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
      societies: cats[key]
    }))
  }

  // Category filtering removed in favor of accordion headers

  // Filter based on searchQuery
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase()
    displayGroups = displayGroups.map(g => {
      const filteredSocieties = g.societies.filter(s => {
        const matchesName = s.name.toLowerCase().includes(query)
        const matchesCategory = g.section.toLowerCase().includes(query)
        const matchesDesc = s.desc.toLowerCase().includes(query)
        const matchesPres = (s.presidents || []).some(p => p.name.toLowerCase().includes(query))
        const matchesVp = (s.vice_presidents || []).some(vp => vp.name.toLowerCase().includes(query))

        return matchesName || matchesCategory || matchesDesc || matchesPres || matchesVp
      })
      return { ...g, societies: filteredSocieties, count: `${filteredSocieties.length} Active` }
    }).filter(g => g.societies.length > 0)
  }

  const finalDisplayGroups = displayGroups;

  return (
    <PageLayout>

      {/* ── Header Row ────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20, flexWrap: 'wrap', marginBottom: 12 }}>
        <h1 style={{ ...pjs(26, 700, '34px', '#0f172a'), margin: 0 }}>Societies & Clubs</h1>

        {/* ── Search bar ─────────────────────────────────────── */}
        <div style={{ position: 'relative', flex: '1 1 300px', maxWidth: 400 }}>
          <svg style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} width="15" height="15" viewBox="0 0 15 15" fill="none">
            <circle cx="6.5" cy="6.5" r="5.5" stroke="#94a3b8" strokeWidth="1.3" />
            <path d="M11 11l3 3" stroke="#94a3b8" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          <input
            placeholder="Search by club name, category, or president..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%', padding: '12px 16px 12px 42px',
              background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 14,
              ...pjs(14, 400, '20px', '#0f172a'), outline: 'none',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>



      {/* ── Society sections ───────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28, opacity: loading ? 0.6 : 1, transition: 'opacity .2s' }}>
        {finalDisplayGroups.length > 0 ? finalDisplayGroups.map((group, gi) => {
          const isCollapsed = collapsedSections[group.section]
          return (
            <div key={gi}>
              {/* Section header */}
              <div
                onClick={() => toggleSection(group.section)}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  marginBottom: isCollapsed ? 0 : 14, cursor: 'pointer',
                  padding: '4px 0', borderBottom: isCollapsed ? '1px solid #f1f5f9' : 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', border: '1.5px solid #4f46e5',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s'
                  }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </div>
                  <span style={pjs(17, 700, '23px', '#0f172a')}>{group.section}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{
                    ...pjs(12, 600, '16px', group.iconColor || '#4f46e5'),
                    background: gi === 0 ? '#eef2ff' : '#f5f3ff',
                    padding: '4px 12px', borderRadius: 20,
                  }}>{group.count}</span>
                </div>
              </div>

              {/* Cards */}
              {!isCollapsed && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {group.societies.map(s => <SocietyCard key={s.id} s={s} />)}
                </div>
              )}
            </div>
          )
        }) : (
          <div style={{ textAlign: 'center', padding: '64px 0', color: '#94a3b8' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
            <div style={pjs(18, 600, '24px', '#94a3b8')}>No societies found</div>
          </div>
        )}
      </div>



    </PageLayout>
  )
}
