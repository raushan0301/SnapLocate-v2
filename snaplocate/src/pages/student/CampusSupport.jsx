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
    info:    <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 18a8 8 0 100-16 8 8 0 000 16z" stroke={c} strokeWidth="1.5"/><path d="M10 9v4m0-6v.5" stroke={c} strokeWidth="1.5" strokeLinecap="round"/></svg>,
    emergency: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 18a8 8 0 100-16 8 8 0 000 16z" stroke="#ef4444" strokeWidth="1.5"/><path d="M10 6v6m0 2.5v.5" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/></svg>
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
          href={`mailto:${c.email}`} 
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
          <svg width="16" height="13" viewBox="0 0 16 13" fill="none">
             <path d="M1.5 1.5l6.5 4.5 6.5-4.5M1.5 11.5h13a1 1 0 001-1v-8a1 1 0 00-1-1h-13a1 1 0 00-1 1v8a1 1 0 001 1z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Send Email
        </a>
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
      const tabMatch = activeTab === 'All Support' || 
                      (activeTab === 'Emergency' && c.is_emergency) ||
                      (c.category === activeTab)
      
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
      <div style={{ paddingBottom: 60 }}>
        
        {/* Modern Header Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 40, gap: 24, flexWrap: 'wrap' }}>
          <div>
            <h1 style={pjs(30, 800, '38px', '#0f172a')}>Campus Support Hub</h1>
            <p style={{ ...pjs(16, 400, '24px', '#64748b'), marginTop: 4 }}>Find professional assistance across various university departments.</p>
          </div>
          <div style={{ position: 'relative', flex: '1 1 340px', maxWidth: 460 }}>
            <svg style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', opacity: 0.6 }} width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="8" cy="8" r="6" stroke="#0f172a" strokeWidth="1.5"/><path d="M12.5 12.5L16 16" stroke="#0f172a" strokeWidth="1.5" strokeLinecap="round"/></svg>
            <input
              placeholder="Search by department, role, or contact..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', 
                padding: '14px 16px 14px 48px',
                background: '#ffffff', 
                border: '1px solid #e2e8f0', 
                borderRadius: 16,
                ...pjs(15, 400, '20px', '#0f172a'), 
                outline: 'none',
                boxSizing: 'border-box', 
                boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                transition: 'all 0.2s ease'
              }}
              onFocus={e => {
                e.target.style.borderColor = '#4f46e5';
                e.target.style.boxShadow = '0 8px 20px rgba(79,70,229,0.08)';
              }}
              onBlur={e => {
                e.target.style.borderColor = '#e2e8f0';
                e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.03)';
              }}
            />
          </div>
        </div>

        {/* Filter Navigation */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 40 }}>
          {TABS.map(tab => {
            const active = activeTab === tab.label
            const isEmergency = tab.label === 'Emergency'
            return (
              <button
                key={tab.label}
                onClick={() => setActiveTab(tab.label)}
                style={{
                  padding: '10px 20px', 
                  borderRadius: 14, 
                  cursor: 'pointer',
                  border: active ? 'none' : '1px solid #e2e8f0',
                  background: active ? (isEmergency ? '#ef4444' : '#0f172a') : '#ffffff',
                  ...pjs(14, 600, '20px', active ? '#ffffff' : '#64748b'),
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: active ? '0 4px 12px rgba(0,0,0,0.1)' : 'none'
                }}
                onMouseEnter={e => {
                   if (!active) e.currentTarget.style.background = '#f8fafc';
                }}
                onMouseLeave={e => {
                   if (!active) e.currentTarget.style.background = '#ffffff';
                }}
              >
                {isEmergency && <span style={{ fontSize: 16 }}>🚨</span>}
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Support Grid Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 48, opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s' }}>
          {filtered.length > 0 ? filtered.map((sec, si) => (
            <div key={si}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: sec.color || '#4f46e5', boxShadow: `0 0 10px ${sec.color || '#4f46e5'}` }}></div>
                <h2 style={pjs(20, 700, '28px', '#0f172a')}>{sec.title}</h2>
                <div style={{ height: 1, background: '#f1f5f9', flex: 1, marginLeft: 16 }}></div>
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: 24,
              }}>
                {sec.contacts.map((c, ci) => <ContactCard key={c.id || ci} c={c} />)}
              </div>
            </div>
          )) : (
            <div style={{ textAlign: 'center', padding: '100px 0', background: '#fff', borderRadius: 28, border: '1px dashed #e2e8f0' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
              <h3 style={pjs(18, 700, '24px', '#0f172a')}>No matches found</h3>
              <p style={{ ...pjs(14, 400, '20px', '#94a3b8'), marginTop: 8 }}>Try adjusting your search terms or filters.</p>
              <button 
                onClick={() => { setSearch(''); setActiveTab('All Support') }}
                style={{ marginTop: 24, background: '#4f46e5', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 12, fontWeight: 700, cursor: 'pointer' }}
              >
                Reset All Filters
              </button>
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
