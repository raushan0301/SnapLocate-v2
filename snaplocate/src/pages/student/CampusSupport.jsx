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

const TABS = [
  { label: 'All Support', category: 'All Support' },
  { label: 'Academic',    category: 'Academic' },
  { label: 'Hostel',      category: 'Hostel' },
  { label: 'Finance',     category: 'Finance' },
  { label: 'IT',          category: 'IT' },
  { label: 'Emergency',   category: 'Emergency' },
]

function RoleIcon({ type, color }) {
  const c = color || '#94a3b8'
  const icons = {
    info:    <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="8" stroke={c} strokeWidth="1.4"/><path d="M9 8v4M9 6v.5" stroke={c} strokeWidth="1.4" strokeLinecap="round"/></svg>,
    emergency: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="8" stroke="#ef4444" strokeWidth="1.4"/><path d="M9 13v.5M9 5v6" stroke="#ef4444" strokeWidth="1.6" strokeLinecap="round"/></svg>
  }
  return icons[type] || icons.info
}

function ContactCard({ c }) {
  return (
    <div style={{
      background: '#ffffff', border: '1px solid #f1f5f9',
      borderRadius: 14, padding: '18px 20px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={pjs(14, 700, '19px', '#0f172a')}>{c.role}</div>
        <div style={{ flexShrink: 0, marginLeft: 12 }}><RoleIcon type={c.is_emergency ? 'emergency' : 'info'} color={c.is_emergency ? '#ef4444' : '#4f46e5'} /></div>
      </div>
      <div>
        <a href={`mailto:${c.email}`} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          ...pjs(12, 500, '16px', '#4f46e5'), textDecoration: 'none', wordBreak: 'break-all'
        }}>
          <svg width="12" height="10" viewBox="0 0 12 10" fill="none"><rect x="0.5" y="0.5" width="11" height="9" rx="1.5" stroke="#4f46e5" strokeWidth="1"/><path d="M0.5 2.5l5.5 3.5 5.5-3.5" stroke="#4f46e5" strokeWidth="1" strokeLinecap="round"/></svg>
          {c.email}
        </a>
      </div>
      <div>
        <div style={{ ...inter(9, 700, '13px', '#94a3b8'), letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
          WHEN TO CONTACT
        </div>
        <div style={pjs(12, 400, '18px', '#64748b')}>{c.when}</div>
      </div>
    </div>
  )
}

export default function CampusSupportPage() {
  const [activeTab, setActiveTab] = useState('All Support')
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

  const filtered = sections.map(sec => {
    const filteredContacts = sec.contacts.filter(c => {
      // Tab filter
      const tabMatch = activeTab === 'All Support' || 
                      (activeTab === 'Emergency' && c.is_emergency) ||
                      (c.category === activeTab)
      
      // Search filter
      const searchMatch = !search || 
                        c.role.toLowerCase().includes(search.toLowerCase()) ||
                        c.email.toLowerCase().includes(search.toLowerCase()) ||
                        sec.title.toLowerCase().includes(search.toLowerCase())
      
      return tabMatch && searchMatch
    })
    return { ...sec, contacts: filteredContacts }
  }).filter(sec => sec.contacts.length > 0)

  return (
    <PageLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28, width: '100%', paddingBottom: 60 }}>
        
        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <h1 style={pjs(24, 700, '32px', '#0f172a')}>Campus Support Hub</h1>
          <div style={{ position: 'relative', flex: '1 1 300px', maxWidth: 400 }}>
            <svg style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)' }} width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="6" cy="6" r="5" stroke="#94a3b8" strokeWidth="1.2"/><path d="M10 10l3 3" stroke="#94a3b8" strokeWidth="1.2" strokeLinecap="round"/></svg>
            <input
              placeholder="Search departments, roles, or issues..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', padding: '11px 14px 11px 38px',
                background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12,
                ...pjs(13, 400, '18px', '#0f172a'), outline: 'none',
                boxSizing: 'border-box', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
            />
          </div>
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {TABS.map(tab => {
            const active = activeTab === tab.label
            const isEmergency = tab.label === 'Emergency'
            return (
              <button
                key={tab.label}
                onClick={() => setActiveTab(tab.label)}
                style={{
                  padding: '8px 18px', borderRadius: 24, cursor: 'pointer',
                  border: active ? 'none' : isEmergency ? '1.5px solid #fee2e2' : '1.5px solid #e2e8f0',
                  background: active ? (isEmergency ? '#ef4444' : '#4f46e5') : isEmergency ? '#fff1f2' : '#ffffff',
                  ...pjs(13, active ? 700 : 500, '18px', active ? '#ffffff' : isEmergency ? '#ef4444' : '#64748b'),
                  transition: 'all 0.15s',
                }}
              >
                {isEmergency && <span style={{ marginRight: 6 }}>🚨</span>}
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32, opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s' }}>
          {filtered.length > 0 ? filtered.map((sec, si) => (
            <div key={si}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: sec.color }}></div>
                <span style={pjs(17, 700, '22px', '#0f172a')}>{sec.title}</span>
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: 20,
              }}>
                {sec.contacts.map((c, ci) => <ContactCard key={c.id || ci} c={c} />)}
              </div>
            </div>
          )) : (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
              <div style={pjs(16, 600, '22px', '#94a3b8')}>No support contacts found matching your criteria</div>
            </div>
          )}
        </div>

        {/* Bottom CTA */}
        <div style={{
          background: '#0f172a', borderRadius: 16, padding: '32px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 24, flexWrap: 'wrap'
        }}>
          <div>
            <div style={pjs(18, 700, '25px', '#ffffff')}>Need more information?</div>
            <div style={{ ...pjs(14, 400, '20px', '#94a3b8'), marginTop: 6, maxWidth: 500 }}>
              If you cannot find the right contact, visit the Central Hub in Building C or use our support chat.
            </div>
          </div>
          <button style={{
            ...pjs(14, 700, '20px', '#ffffff'), padding: '12px 28px', background: '#4f46e5',
            border: 'none', borderRadius: 12, cursor: 'pointer', transition: 'background 0.2s'
          }} onMouseEnter={e => e.currentTarget.style.background = '#4338ca'} onMouseLeave={e => e.currentTarget.style.background = '#4f46e5'}>
            Central Support Desk
          </button>
        </div>
      </div>
    </PageLayout>
  )
}
