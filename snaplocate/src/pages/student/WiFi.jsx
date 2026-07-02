import { useState, useEffect } from 'react'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'
import { Wifi, Eye, EyeOff, Copy, Check } from 'lucide-react'

function EmptyNetworksState() {
  return (
    <div className="flex flex-col items-center py-16 px-6 text-center bg-white border-[1.5px] border-dashed border-slate-200 rounded-[20px]">
      <div className="w-[72px] h-[72px] rounded-[20px] bg-[#f0f4ff] flex items-center justify-center mb-5">
        <svg width="36" height="30" viewBox="0 0 24 20" fill="none">
          <path d="M1 6.5C5 2.5 19 2.5 23 6.5" stroke="#c7d2fe" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M4.5 10C7.5 7 16.5 7 19.5 10" stroke="#a5b4fc" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M8 13.5C9.5 12 14.5 12 16 13.5" stroke="#818cf8" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="12" cy="17.5" r="1.5" fill="#4f46e5" />
        </svg>
      </div>
      <div className="text-[18px] font-bold leading-[26px] t-primary">No Networks Added Yet</div>
      <div className="t-base font-normal t-muted mt-2 max-w-[360px]">
        Campus Wi-Fi networks will appear here once added by the admin. Contact IT support for current credentials.
      </div>
      <div className="mt-7 px-6 py-3 bg-indigo-50 rounded-xl text-[13px] font-semibold leading-[18px] text-brand">
        📍 IT Support Desk — Building C, Mon–Fri, 9 AM – 5 PM
      </div>
    </div>
  )
}

export default function WiFiPage() {
  const [copied, setCopied] = useState(null)
  const [shown, setShown] = useState({})
  const [networks, setNetworks] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetchNetworks = async () => {
      try {
        const res = await api.get('/api/wifi')
        if (res.success && res.data && res.data.length > 0) setNetworks(res.data)
      } catch (err) { console.error('Failed to fetch wifi networks:', err) }
      finally { setLoading(false) }
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
      <div className="flex flex-col gap-7 w-full pb-16">

        {/* Page header */}
        <div className="flex justify-between items-center flex-wrap gap-4 mb-7">
          <div>
            <h1 className="text-[26px] font-bold leading-[34px] t-primary m-0">Wi-Fi Access Hub</h1>
            <p className="t-base t-muted mt-1 m-0">Secure connectivity for all campus areas.</p>
          </div>
          <div className="relative flex-1 min-w-[300px] max-w-[400px]">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2" width="15" height="15" viewBox="0 0 15 15" fill="none">
              <circle cx="6.5" cy="6.5" r="5.5" stroke="#94a3b8" strokeWidth="1.3" />
              <path d="M11 11l3 3" stroke="#94a3b8" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            <input
              placeholder="Search zones or networks..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-[14px] t-base t-primary outline-none shadow-[0_1px_4px_rgba(0,0,0,0.04)] box-border"
            />
          </div>
        </div>

        {/* Network list */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_1px_4px_rgba(0,0,0,0.04)] overflow-hidden">
          {loading ? (
            [1, 2, 3].map(i => (
              <div key={i} className={`px-6 py-5 flex gap-4 ${i < 3 ? 'border-b border-slate-50' : ''}`}
                style={{ animation: 'pulse 1.5s ease-in-out infinite' }}>
                <div className="w-6 h-6 bg-slate-200 rounded-md" />
                <div className="flex-1 h-6 bg-slate-200 rounded-md" />
              </div>
            ))
          ) : filtered.length > 0 ? filtered.map((n, i) => (
            <div key={n.id || i}
              className={`px-6 py-4 flex items-center gap-6 flex-wrap ${i < filtered.length - 1 ? 'border-b border-slate-50' : ''} ${n.is_primary ? 'bg-slate-50' : ''}`}>
              {/* Icon + Info */}
              <div className="flex items-center gap-4 flex-1 min-w-[200px]">
                <Wifi size={22} color={n.is_primary ? '#4f46e5' : '#94a3b8'} />
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <div className="text-[16px] font-semibold leading-[22px] t-primary">{n.name}</div>
                    {n.is_primary && (
                      <span className="px-2 py-[2px] bg-indigo-100 text-brand rounded-xl text-[10px] font-bold leading-[14px]">
                        PRIMARY
                      </span>
                    )}
                  </div>
                  <div className="text-[13px] font-medium leading-[18px] text-slate-500">{n.zone}</div>
                </div>
              </div>

              {/* Password field */}
              <div className="flex-1 min-w-[180px]">
                <div className="relative flex items-center">
                  <div className={`bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 pr-9 w-full text-[14px] font-medium leading-[18px] t-primary box-border ${shown[i] ? 'tracking-normal' : 'tracking-[0.2em]'}`}>
                    {shown[i] ? n.password : '••••••••'}
                  </div>
                  <button onClick={() => toggleShow(i)}
                    className="absolute right-2.5 bg-transparent border-none cursor-pointer p-0 flex items-center">
                    {shown[i] ? <EyeOff size={16} color="#64748b" /> : <Eye size={16} color="#64748b" />}
                  </button>
                </div>
              </div>

              {/* Copy button */}
              <div className="flex justify-end">
                <button onClick={() => handleCopy(i, n.password)}
                  className="flex items-center justify-center p-2 rounded-lg cursor-pointer border border-slate-200 bg-white transition-all"
                  title="Copy Password">
                  {copied === i ? <Check size={18} color="#10b981" /> : <Copy size={18} color="#64748b" />}
                </button>
              </div>
            </div>
          )) : search ? (
            <div className="text-center py-10">
              <div className="text-[40px] mb-3">🔍</div>
              <div className="text-[16px] font-semibold leading-[22px] text-slate-400">No networks found matching your search</div>
            </div>
          ) : (
            <EmptyNetworksState />
          )}
        </div>

        {/* Quick tips */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-2.5 mb-4">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="8" stroke="#4f46e5" strokeWidth="1.4" /><path d="M9 8v5M9 6v.5" stroke="#4f46e5" strokeWidth="1.4" strokeLinecap="round" /></svg>
            <span className="text-[14px] font-bold leading-[19px] t-primary">Connection Tips</span>
          </div>
          <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
            {[
              ['Use 5GHz band', 'Faster speeds for devices close to access points'],
              ['Forget & reconnect', 'Clear saved network if facing auth issues'],
              ['Check VPN', 'Disable VPN when accessing internal resources'],
            ].map(([title, desc], i) => (
              <div key={i} className="flex gap-2.5 items-start">
                <div className="w-1.5 h-1.5 rounded-full bg-brand mt-[7px] shrink-0" />
                <div>
                  <div className="text-[12px] font-bold leading-4 t-primary">{title}</div>
                  <div className="text-[11px] font-normal leading-[15px] text-slate-500 mt-0.5">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Help footer */}
        <div className="text-center py-2.5 pb-5">
          <span className="text-[13px] font-normal leading-[18px] text-slate-400">
            Having trouble connecting? Visit the{' '}
            <span onClick={() => window.location.href = '/support'} className="text-brand font-semibold cursor-pointer">
              IT Support Desk
            </span>
          </span>
        </div>
      </div>
    </PageLayout>
  )
}
