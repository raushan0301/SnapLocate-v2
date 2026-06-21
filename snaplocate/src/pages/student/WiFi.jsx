import { useState, useEffect } from 'react'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'
import { Wifi, Eye, EyeOff, Copy, Check } from 'lucide-react'


const pjs = (size, weight, lh, color) => ({
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  fontSize: size, fontWeight: weight, lineHeight: lh, color,
})
const inter = (size, weight, lh, color) => ({
  fontFamily: "'Inter', sans-serif",
  fontSize: size, fontWeight: weight, lh: lh, color,
})

const defaultNetworks = []

function EmptyNetworksState() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '60px 24px', textAlign: 'center',
      background: '#fff', border: '1.5px dashed #e2e8f0', borderRadius: 20
    }}>
      <div style={{ width: 72, height: 72, borderRadius: 20, background: '#f0f4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
        <svg width="36" height="30" viewBox="0 0 24 20" fill="none">
          <path d="M1 6.5C5 2.5 19 2.5 23 6.5" stroke="#c7d2fe" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M4.5 10C7.5 7 16.5 7 19.5 10" stroke="#a5b4fc" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M8 13.5C9.5 12 14.5 12 16 13.5" stroke="#818cf8" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="12" cy="17.5" r="1.5" fill="#4f46e5" />
        </svg>
      </div>
      <div style={pjs(18, 700, '26px', '#0f172a')}>No Networks Added Yet</div>
      <div style={{ ...pjs(14, 400, '22px', '#64748b'), marginTop: 8, maxWidth: 360 }}>
        Campus Wi-Fi networks will appear here once added by the admin. Contact IT support for current credentials.
      </div>
      <div style={{ marginTop: 28, padding: '12px 24px', background: '#eef2ff', borderRadius: 12, ...pjs(13, 600, '18px', '#4f46e5') }}>
        📍 IT Support Desk — Building C, Mon–Fri, 9 AM – 5 PM
      </div>
    </div>
  )
}

export default function WiFiPage() {
  const [copied, setCopied] = useState(null)
  const [shown, setShown] = useState({})
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
    navigator.clipboard?.writeText(pw).catch(() => { })
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
          <div>
            <h1 style={pjs(26, 700, '34px', '#0f172a')}>Wi-Fi Access Hub</h1>
            <p style={{ ...pjs(14, 400, '20px', '#64748b'), marginTop: 4 }}>
              Secure connectivity for all campus areas.
            </p>
          </div>

          <div style={{ position: 'relative', flex: '1 1 300px', maxWidth: 400 }}>
            <svg style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} width="15" height="15" viewBox="0 0 15 15" fill="none">
              <circle cx="6.5" cy="6.5" r="5.5" stroke="#94a3b8" strokeWidth="1.3" />
              <path d="M11 11l3 3" stroke="#94a3b8" strokeWidth="1.3" strokeLinecap="round" />
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

        {/* ── Network list ────────────────────────────────── */}
        <div style={{
          background: '#ffffff',
          borderRadius: 16,
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          overflow: 'hidden'
        }}>
          {loading ? (
            // Loading skeleton
            [1, 2, 3].map(i => (
              <div key={i} style={{ padding: '20px 24px', borderBottom: i < 3 ? '1px solid #f1f5f9' : 'none', animation: 'pulse 1.5s ease-in-out infinite', display: 'flex', gap: 16 }}>
                <div style={{ width: 24, height: 24, background: '#e2e8f0', borderRadius: 6 }} />
                <div style={{ flex: 1, height: 24, background: '#e2e8f0', borderRadius: 6 }} />
              </div>
            ))
          ) : filtered.length > 0 ? filtered.map((n, i) => (
            <div key={n.id || i} style={{
              padding: '16px 24px',
              display: 'flex', alignItems: 'center', gap: 24,
              flexWrap: 'wrap',
              borderBottom: i < filtered.length - 1 ? '1px solid #f1f5f9' : 'none',
              background: n.is_primary ? '#f8fafc' : 'transparent',
            }}>
              {/* Wi-Fi Icon + Info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: '1 1 200px' }}>
                <Wifi size={22} color={n.is_primary ? '#4f46e5' : '#94a3b8'} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={pjs(16, 600, '22px', '#0f172a')}>{n.name}</div>
                    {n.is_primary && (
                      <span style={{ padding: '2px 8px', background: '#e0e7ff', color: '#4f46e5', borderRadius: 12, ...pjs(10, 700, '14px', '') }}>
                        PRIMARY
                      </span>
                    )}
                  </div>
                  <div style={{ ...pjs(13, 500, '18px', '#64748b') }}>{n.zone}</div>
                </div>
              </div>

              {/* Password field */}
              <div style={{ flex: '1 1 180px', minWidth: 180 }}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <div style={{
                    background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 8,
                    padding: '8px 36px 8px 12px', width: '100%',
                    ...pjs(14, 500, '18px', '#0f172a'),
                    letterSpacing: shown[i] ? 'normal' : '0.2em',
                    boxSizing: 'border-box'
                  }}>{shown[i] ? n.password : '••••••••'}</div>
                  <button onClick={() => toggleShow(i)} style={{ position: 'absolute', right: 10, background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
                    {shown[i] ? <EyeOff size={16} color="#64748b" /> : <Eye size={16} color="#64748b" />}
                  </button>
                </div>
              </div>

              {/* Copy button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => handleCopy(i, n.password)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '8px', borderRadius: 8, cursor: 'pointer',
                    border: '1px solid #e2e8f0',
                    background: '#ffffff',
                    transition: 'all 0.15s',
                  }}
                  title="Copy Password"
                >
                  {copied === i ? <Check size={18} color="#10b981" /> : <Copy size={18} color="#64748b" />}
                </button>
              </div>
            </div>
          )) : search ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
              <div style={pjs(16, 600, '22px', '#94a3b8')}>No networks found matching your search</div>
            </div>
          ) : (
            <EmptyNetworksState />
          )}
        </div>

        {/* ── Quick tips ────────────────────────────────────── */}
        <div style={{
          background: '#ffffff', border: '1px solid #f1f5f9', borderRadius: 16,
          padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="8" stroke="#4f46e5" strokeWidth="1.4" /><path d="M9 8v5M9 6v.5" stroke="#4f46e5" strokeWidth="1.4" strokeLinecap="round" /></svg>
            <span style={pjs(14, 700, '19px', '#0f172a')}>Connection Tips</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {[
              ['Use 5GHz band', 'Faster speeds for devices close to access points'],
              ['Forget & reconnect', 'Clear saved network if facing auth issues'],
              ['Check VPN', 'Disable VPN when accessing internal resources'],
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
            Having trouble connecting? Visit the <span onClick={() => window.location.href='/support'} style={{ color: '#4f46e5', fontWeight: 600, cursor: 'pointer' }}>IT Support Desk</span>
          </span>
        </div>
      </div>
    </PageLayout>
  )
}
