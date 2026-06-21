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

// Tabs match v0 layout exactly
const TABS = [
  { label: 'Finance', filter: (c) => c.category === 'Finance' },
  { label: 'Academics', filter: (c) => c.category === 'Academic' },
  { label: 'Hostel', filter: (c) => c.category === 'Hostel' },
  { label: 'IT Support', filter: (c) => c.category === 'IT' },
  { label: 'Scholarship', filter: (c) => c.category === 'Scholarship' },
  { label: 'Student Life', filter: (c) => c.category === 'Student Life' },
  { label: 'Emergency', filter: (c) => !!c.is_emergency },
]

function RoleIcon({ type, color }) {
  const c = color || '#94a3b8'
  const icons = {
    info: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 18a8 8 0 100-16 8 8 0 000 16z" stroke={c} strokeWidth="1.5" /><path d="M10 9v4m0-6v.5" stroke={c} strokeWidth="1.5" strokeLinecap="round" /></svg>,
    emergency: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 18a8 8 0 100-16 8 8 0 000 16z" stroke="#ef4444" strokeWidth="1.5" /><path d="M10 6v6m0 2.5v.5" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" /></svg>
  }
  return icons[type] || icons.info
}

function ContactCard({ c }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#ffffff',
        border: '1px solid #f1f5f9',
        borderRadius: 24,
        padding: '24px',
        boxShadow: hovered ? '0 12px 30px rgba(0,0,0,0.06)' : '0 4px 12px rgba(0,0,0,0.02)',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        transition: 'all 0.2s ease',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {c.is_emergency && (
        <div style={{ position: 'absolute', top: 0, right: 0, padding: '6px 14px', background: '#fef2f2', color: '#ef4444', borderRadius: '0 0 0 16px', ...inter(10, 700, '14px', '#ef4444'), letterSpacing: '0.05em' }}>
          URGENT
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ width: 44, height: 44, borderRadius: 14, background: c.is_emergency ? '#fef2f2' : '#f0f4ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <RoleIcon type={c.is_emergency ? 'emergency' : 'info'} color={c.is_emergency ? '#ef4444' : '#4f46e5'} />
        </div>
      </div>

      <div>
        <h3 style={pjs(17, 700, '22px', '#0f172a')}>{c.role}</h3>
        <p style={{ ...pjs(13, 400, '20px', '#64748b'), marginTop: 4 }}>{c.when}</p>
      </div>

      <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid #f8fafc' }}>
        <a
          href={c.phone ? `tel:${c.phone.replace(/\\s+/g, '')}` : `mailto:${c.email}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            width: '100%',
            padding: '12px',
            background: hovered ? (c.is_emergency ? '#dc2626' : '#4f46e5') : (c.is_emergency ? '#fef2f2' : '#f8fafc'),
            borderRadius: 12,
            ...pjs(13, 600, '18px', hovered ? '#ffffff' : (c.is_emergency ? '#ef4444' : '#4f46e5')),
            textDecoration: 'none',
            transition: 'all 0.2s ease',
            border: c.is_emergency && !hovered ? '1px solid #fee2e2' : 'none'
          }}
        >
          {c.phone ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
            </svg>
          ) : (
            <svg width="16" height="13" viewBox="0 0 16 13" fill="none">
              <path d="M1.5 1.5l6.5 4.5 6.5-4.5M1.5 11.5h13a1 1 0 001-1v-8a1 1 0 00-1-1h-13a1 1 0 00-1 1v8a1 1 0 001 1z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          {c.phone ? 'Call Now' : 'Send Email'}
        </a>
      </div>
    </div>
  )
}
// HostelRow — compact row for hostel directory (caretaker | warden)
function HostelRow({ c }) {
  const [copied, setCopied] = useState(null)
  const parts = c.email ? c.email.split('|').map(e => e.trim()) : []
  const caretaker = parts[0] || ''
  const warden = parts[1] || ''

  const copy = (text, key) => {
    navigator.clipboard?.writeText(text).catch(() => { })
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
      <td style={{ ...pjs(13, 600, '18px', '#0f172a'), padding: '12px 16px' }}>{c.role}</td>
      <td style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ ...pjs(12, 400, '16px', '#4f46e5'), flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>{caretaker}</span>
          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
            {caretaker && <a href={`mailto:${caretaker}`}><button style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: '#eef2ff', cursor: 'pointer', ...pjs(11, 600, '14px', '#4f46e5') }}>Mail</button></a>}
            {caretaker && <button onClick={() => copy(caretaker, 'c')} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', ...pjs(11, 600, '14px', copied === 'c' ? '#16a34a' : '#64748b') }}>{copied === 'c' ? 'Copied' : 'Copy'}</button>}
          </div>
        </div>
      </td>
      <td style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ ...pjs(12, 400, '16px', '#7c3aed'), flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>{warden}</span>
          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
            {warden && <a href={`mailto:${warden}`}><button style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: '#f5f3ff', cursor: 'pointer', ...pjs(11, 600, '14px', '#7c3aed') }}>Mail</button></a>}
            {warden && <button onClick={() => copy(warden, 'w')} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', ...pjs(11, 600, '14px', copied === 'w' ? '#16a34a' : '#64748b') }}>{copied === 'w' ? 'Copied' : 'Copy'}</button>}
          </div>
        </div>
      </td>
    </tr>
  )
}

export default function CampusSupportPage() {
  const [activeTab, setActiveTab] = useState(TABS[0].label)
  const [sections, setSections] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetchSupportInfo = async () => {
      try {
        setLoading(true)
        const res = await api.get('/api/support')
        if (res.success) setSections(res.data || [])
      } catch (err) {
        console.error('Failed to load campus support:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchSupportInfo()
  }, [])

  const activeTabObj = TABS.find(t => t.label === activeTab) || TABS[0]

  // All contacts across all sections, filtered by tab + search
  const filtered = sections.map(sec => {
    const filteredContacts = sec.contacts.filter(c => {
      const tabMatch = activeTabObj.filter(c, sec)
      const q = search.toLowerCase().trim()
      const searchMatch = !q ||
        (c.role || '').toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q) ||
        (c.when || '').toLowerCase().includes(q) ||
        (sec.title || '').toLowerCase().includes(q)
      return tabMatch && searchMatch
    })
    return { ...sec, contacts: filteredContacts }
  }).filter(sec => sec.contacts.length > 0)

  // Hostel Directory rows for the Hostel tab
  const hostelDirSection = activeTab === 'Hostel'
    ? sections.find(s => s.title === 'Hostel Directory')
    : null
  const hostelDirFiltered = hostelDirSection
    ? (search
      ? hostelDirSection.contacts.filter(c => (c.role || '').toLowerCase().includes(search.toLowerCase()) || (c.email || '').toLowerCase().includes(search.toLowerCase()))
      : hostelDirSection.contacts)
    : []

  return (
    <PageLayout>
      <div style={{ paddingBottom: 60 }}>

        {/* Modern Header Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
          <div>
            <h1 style={pjs(26, 700, '34px', '#0f172a')}>Campus Support Hub</h1>
            <p style={{ ...pjs(14, 400, '20px', '#64748b'), marginTop: 4 }}>Find professional assistance across various university departments.</p>
          </div>
          <div style={{ position: 'relative', flex: '1 1 300px', maxWidth: 400 }}>
            <svg style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} width="15" height="15" viewBox="0 0 15 15" fill="none">
              <circle cx="6.5" cy="6.5" r="5.5" stroke="#94a3b8" strokeWidth="1.3" />
              <path d="M11 11l3 3" stroke="#94a3b8" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            <input
              placeholder="Search by department, role, or contact..."
              value={search}
              onChange={e => setSearch(e.target.value)}
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

        {/* Filter Tabs — no emojis, Emergency in red when active */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 36 }}>
          {TABS.map(tab => {
            const active = activeTab === tab.label
            const isEmergency = tab.label === 'Emergency'
            return (
              <button
                key={tab.label}
                onClick={() => setActiveTab(tab.label)}
                style={{
                  padding: '9px 20px',
                  borderRadius: 12,
                  cursor: 'pointer',
                  border: active ? 'none' : '1px solid #e2e8f0',
                  background: active ? (isEmergency ? '#ef4444' : '#0f172a') : '#ffffff',
                  ...pjs(13, 600, '18px', active ? '#ffffff' : (isEmergency ? '#ef4444' : '#64748b')),
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: active ? '0 4px 12px rgba(0,0,0,0.12)' : 'none'
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#f8fafc' }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = '#ffffff' }}
              >
                {isEmergency && <span style={{ fontSize: 16, marginRight: 6 }}>🚨</span>}
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Support Grid Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 48, transition: 'opacity 0.2s' }}>
          {loading ? (
            // Loading skeleton
            [1, 2].map(i => (
              <div key={i}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#e2e8f0' }} />
                  <div style={{ height: 20, background: '#f1f5f9', borderRadius: 8, width: 180 }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
                  {[1, 2, 3].map(j => (
                    <div key={j} style={{ background: '#f8fafc', borderRadius: 24, padding: 24, height: 160 }}>
                      <div style={{ height: 40, width: 40, background: '#e2e8f0', borderRadius: 12, marginBottom: 16 }} />
                      <div style={{ height: 16, background: '#e2e8f0', borderRadius: 8, width: '60%', marginBottom: 10 }} />
                      <div style={{ height: 12, background: '#e2e8f0', borderRadius: 8, width: '80%' }} />
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : filtered.length > 0 || hostelDirFiltered.length > 0 ? (
            <>
              {/* Contact cards grouped by section */}
              {filtered
                .filter(sec => sec.title !== 'Hostel Directory')
                .map((sec, si) => (
                  <div key={si}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: sec.color || '#4f46e5', boxShadow: `0 0 10px ${sec.color || '#4f46e5'}` }}></div>
                      <h2 style={pjs(20, 700, '28px', '#0f172a')}>{sec.title}</h2>
                      <div style={{ height: 1, background: '#f1f5f9', flex: 1, marginLeft: 16 }}></div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
                      {sec.contacts.map((c, ci) => <ContactCard key={c.id || ci} c={c} />)}
                    </div>
                  </div>
                ))}

              {/* Hostel Directory table — shown below when on Hostel tab */}
              {hostelDirFiltered.length > 0 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#7c3aed', boxShadow: '0 0 10px #7c3aed' }}></div>
                    <h2 style={pjs(20, 700, '28px', '#0f172a')}>Hostel Directory</h2>
                    <div style={{ height: 1, background: '#f1f5f9', flex: 1, marginLeft: 16 }}></div>
                  </div>
                  <div style={{ overflowX: 'auto', borderRadius: 16, border: '1px solid #f1f5f9', background: '#fff' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '2px solid #f1f5f9' }}>
                          <th style={{ ...pjs(12, 700, '16px', '#64748b'), padding: '12px 16px', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Hostel</th>
                          <th style={{ ...pjs(12, 700, '16px', '#64748b'), padding: '12px 16px', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Caretaker Email</th>
                          <th style={{ ...pjs(12, 700, '16px', '#64748b'), padding: '12px 16px', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Warden Email</th>
                        </tr>
                      </thead>
                      <tbody>
                        {hostelDirFiltered.map((c, ci) => <HostelRow key={c.id || ci} c={c} />)}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          ) : sections.length > 0 ? (
            // Filter/search found nothing
            <div style={{ textAlign: 'center', padding: '100px 0', background: '#fff', borderRadius: 28, border: '1px dashed #e2e8f0' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
              <h3 style={pjs(18, 700, '24px', '#0f172a')}>No matches found</h3>
              <p style={{ ...pjs(14, 400, '20px', '#94a3b8'), marginTop: 8 }}>Try adjusting your search terms or filters.</p>
              <button
                onClick={() => { setSearch(''); setActiveTab(TABS[0].label) }}
                style={{ marginTop: 24, background: '#4f46e5', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 12, fontWeight: 700, cursor: 'pointer' }}
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            // No contacts seeded in Supabase yet
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 24px', textAlign: 'center', background: '#fff', border: '1.5px dashed #e2e8f0', borderRadius: 28 }}>
              <div style={{ width: 72, height: 72, borderRadius: 20, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, fontSize: 36 }}>📋</div>
              <div style={pjs(20, 700, '28px', '#0f172a')}>Support Directory Coming Soon</div>
              <div style={{ ...pjs(14, 400, '22px', '#64748b'), marginTop: 10, maxWidth: 400 }}>
                Campus support contact details will appear here once added by the admin team.
              </div>
              <div style={{ marginTop: 28, display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
                <div style={{ padding: '12px 20px', background: '#f1f5f9', borderRadius: 12, ...pjs(13, 600, '18px', '#0f172a') }}>📞 General: 0175-239-3021</div>
                <div style={{ padding: '12px 20px', background: '#fef3c7', borderRadius: 12, ...pjs(13, 600, '18px', '#92400e') }}>🚨 Security: 0175-239-3000</div>
              </div>
            </div>
          )}
        </div>

        {/* Premium Bottom Feature */}
        <div style={{
          marginTop: 64,
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          borderRadius: 32,
          padding: '48px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 40,
          flexWrap: 'wrap',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', top: -100, right: -100, width: 300, height: 300, background: 'rgba(79,70,229,0.1)', borderRadius: '50%', filter: 'blur(60px)' }}></div>

          <div style={{ position: 'relative', zIndex: 1, flex: '1 1 400px' }}>
            <h2 style={pjs(26, 800, '34px', '#ffffff')}>Still need more information?</h2>
            <p style={{ ...pjs(16, 400, '24px', '#94a3b8'), marginTop: 12, maxWidth: 540 }}>
              Our central support team is available 24/7. Whether you need technical guidance or hostel assistance, we're here to help you navigate campus life.
            </p>
          </div>

          <div style={{ position: 'relative', zIndex: 1 }}>
            <button style={{
              ...pjs(15, 700, '20px', '#ffffff'),
              padding: '16px 36px',
              background: '#4f46e5',
              border: 'none',
              borderRadius: 16,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 10px 25px rgba(79,70,229,0.3)'
            }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#4338ca';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 15px 30px rgba(79,70,229,0.4)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = '#4f46e5';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 25px rgba(79,70,229,0.3)';
              }}>
              Central Support Desk
            </button>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
