import { useState, useEffect } from 'react'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'

const pjs = (size, weight, lh, color) => ({
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  fontSize: size, fontWeight: weight, lineHeight: lh, color,
})
const inter = (size, weight, lh, color) => ({
  fontFamily: "'Inter', sans-serif",
  fontSize: size, fontWeight: weight, lh: lh, color,
})

const defaultNetworks = []

export default function WiFiPage() {
  const [copied, setCopied] = useState(null)
  const [shown,  setShown]  = useState({})
  const [networks, setNetworks] = useState(defaultNetworks)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetchNetworks = async () => {
      try {
        const res = await api.get('/api/wifi')
        if (res.success && res.data && res.data.length > 0) {
          setNetworks(res.data)
        }
      } catch (err) {
        console.error('Failed to fetch wifi networks:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchNetworks()
  }, [])

  const handleCopy = (idx, pw) => {
    navigator.clipboard?.writeText(pw).catch(() => {})
    setCopied(idx)
    setTimeout(() => setCopied(null), 2000)
  }

  const toggleShow = idx => setShown(s => ({ ...s, [idx]: !s[idx] }))

  const filtered = networks.filter(n => 
    n.name.toLowerCase().includes(search.toLowerCase()) || 
    n.zone.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <PageLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28, width: '100%', paddingBottom: 60 }}>
        
        {/* ── Page header ──────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ flex: '1 1 300px' }}>
            <h1 style={pjs(26, 700, '34px', '#0f172a')}>Wi-Fi Access Hub</h1>
            <p style={{ ...pjs(14, 400, '22px', '#64748b'), marginTop: 4 }}>
              Secure connectivity for all campus areas.
            </p>
          </div>

          <div style={{ position: 'relative', flex: '1 1 300px', maxWidth: 400 }}>
            <svg style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} width="15" height="15" viewBox="0 0 15 15" fill="none">
              <circle cx="6.5" cy="6.5" r="5.5" stroke="#94a3b8" strokeWidth="1.3"/>
              <path d="M11 11l3 3" stroke="#94a3b8" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            <input
              placeholder="Search zones or networks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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

        {/* ── Network cards ────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s' }}>
          {filtered.length > 0 ? filtered.map((n, i) => (
            <div key={n.id || i} style={{
              background: '#ffffff',
              border: `1.5px solid ${n.is_primary ? '#e0e7ff' : '#f1f5f9'}`,
              borderRadius: 16,
              padding: '24px',
              display: 'flex', alignItems: 'center', gap: 24,
              flexWrap: 'wrap',
              boxShadow: n.is_primary ? '0 4px 20px rgba(79,70,229,0.08)' : '0 1px 4px rgba(0,0,0,0.04)',
            }}>
              {/* Wi-Fi Icon + Info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, flex: '2 1 280px' }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                  background: n.is_primary ? '#eef2ff' : '#f8fafc',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="24" height="20" viewBox="0 0 24 20" fill="none">
                    <path d="M1 6.5C5 2.5 19 2.5 23 6.5" stroke={n.is_primary ? '#4f46e5' : '#94a3b8'} strokeWidth="1.8" strokeLinecap="round"/>
                    <path d="M4.5 10C7.5 7 16.5 7 19.5 10" stroke={n.is_primary ? '#4f46e5' : '#94a3b8'} strokeWidth="1.8" strokeLinecap="round"/>
                    <path d="M8 13.5C9.5 12 14.5 12 16 13.5" stroke={n.is_primary ? '#4f46e5' : '#94a3b8'} strokeWidth="1.8" strokeLinecap="round"/>
                    <circle cx="12" cy="17.5" r="1.5" fill={n.is_primary ? '#4f46e5' : '#94a3b8'}/>
                  </svg>
                </div>
                <div>
                  <div style={{ ...inter(10, 700, '14px', '#7c3aed'), letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2 }}>{n.zone}</div>
                  <div style={pjs(18, 700, '24px', '#0f172a')}>{n.name}</div>
                </div>
              </div>

              {/* Password field */}
              <div style={{ flex: '2 1 200px', minWidth: 200 }}>
                <div style={{ ...inter(10, 600, '14px', '#94a3b8'), letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Network Password</div>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <div style={{
                    background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10,
                    padding: '9px 40px 9px 14px', width: '100%',
                    ...pjs(14, 500, '18px', '#0f172a'),
                    letterSpacing: shown[i] ? '0.02em' : '0.1em',
                    boxSizing: 'border-box'
                  }}>{shown[i] ? n.password : '•'.repeat(n.password.length)}</div>
                  <button onClick={() => toggleShow(i)} style={{ position: 'absolute', right: 10, background: 'transparent', border: 'none', cursor: 'pointer', padding: 2 }}>
                    {shown[i]
                      ? <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5Z" stroke="#64748b" strokeWidth="1.2"/><circle cx="8" cy="8" r="2" stroke="#64748b" strokeWidth="1.2"/><path d="M2 2l12 12" stroke="#64748b" strokeWidth="1.2" strokeLinecap="round"/></svg>
                      : <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5Z" stroke="#64748b" strokeWidth="1.2"/><circle cx="8" cy="8" r="2" stroke="#64748b" strokeWidth="1.2"/></svg>}
                  </button>
                </div>
              </div>

              {/* Copy button */}
              <div style={{ flex: '1 1 120px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => handleCopy(i, n.password)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '11px 20px', borderRadius: 12, cursor: 'pointer',
                    border: n.is_primary ? 'none' : '1.5px solid #e2e8f0',
                    background: n.is_primary ? '#4f46e5' : '#ffffff',
                    ...pjs(13, 700, '18px', n.is_primary ? '#ffffff' : '#0f172a'),
                    whiteSpace: 'nowrap', transition: 'all 0.15s',
                    width: '100%', maxWidth: 200
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <rect x="4" y="4" width="8" height="9" rx="1.5" stroke={n.is_primary ? 'white' : '#64748b'} strokeWidth="1.2"/>
                    <path d="M2 10V2.5A1.5 1.5 0 013.5 1H9" stroke={n.is_primary ? 'white' : '#64748b'} strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                  {copied === i ? 'Copied!' : 'Copy Password'}
                </button>
              </div>
            </div>
          )) : (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
              <div style={pjs(16, 600, '22px', '#94a3b8')}>No networks found matching your search</div>
            </div>
          )}
        </div>

        {/* ── Quick tips ────────────────────────────────────── */}
        <div style={{
          background: '#ffffff', border: '1px solid #f1f5f9', borderRadius: 16,
          padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="8" stroke="#4f46e5" strokeWidth="1.4"/><path d="M9 8v5M9 6v.5" stroke="#4f46e5" strokeWidth="1.4" strokeLinecap="round"/></svg>
            <span style={pjs(14, 700, '19px', '#0f172a')}>Connection Tips</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {[
              ['Use 5GHz band', 'Faster speeds for devices close to access points'],
              ['Forget & reconnect', 'Clear saved network if facing auth issues'],
              ['Check VPN', 'Disable VPN when accessing internal resources'],
              ['IT Support Desk', 'Building C — available Mon-Fri, 9 AM to 5 PM'],
            ].map(([title, desc], i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4f46e5', marginTop: 7, flexShrink: 0 }} />
                <div>
                  <div style={pjs(12, 700, '16px', '#0f172a')}>{title}</div>
                  <div style={{ ...pjs(11, 400, '15px', '#64748b'), marginTop: 2 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Help footer ───────────────────────────────────── */}
        <div style={{ textAlign: 'center', padding: '10px 0 20px 0' }}>
          <span style={pjs(13, 400, '18px', '#94a3b8')}>
            Having trouble connecting? Visit the <span style={{ color: '#4f46e5', fontWeight: 600, cursor: 'pointer' }}>IT Support Desk</span>
          </span>
        </div>
      </div>
    </PageLayout>
  )
}
