import { useState, useEffect } from 'react'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'

const TABS = [
  { label: 'Finance',     filter: (c) => c.category === 'Finance' },
  { label: 'Academics',   filter: (c) => c.category === 'Academic' },
  { label: 'Hostel',      filter: (c) => c.category === 'Hostel' },
  { label: 'IT Support',  filter: (c) => c.category === 'IT' },
  { label: 'Scholarship', filter: (c) => c.category === 'Scholarship' },
  { label: 'Student Life',filter: (c) => c.category === 'Student Life' },
  { label: 'Emergency',   filter: (c) => !!c.is_emergency },
]

function InfoIcon({ emergency }) {
  const c = emergency ? '#ef4444' : '#4f46e5'
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M10 18a8 8 0 100-16 8 8 0 000 16z" stroke={c} strokeWidth="1.5" />
      <path d={emergency ? 'M10 6v6m0 2.5v.5' : 'M10 9v4m0-6v.5'} stroke={c} strokeWidth={emergency ? 2 : 1.5} strokeLinecap="round" />
    </svg>
  )
}

function PhoneIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  )
}

function MailIcon() {
  return (
    <svg width="16" height="13" viewBox="0 0 16 13" fill="none">
      <path d="M1.5 1.5l6.5 4.5 6.5-4.5M1.5 11.5h13a1 1 0 001-1v-8a1 1 0 00-1-1h-13a1 1 0 00-1 1v8a1 1 0 001 1z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ContactCard({ c }) {
  const href = c.phone ? `tel:${c.phone.replace(/\s+/g, '')}` : `mailto:${c.email}`
  return (
    <div className={`bg-white rounded-3xl p-6 flex flex-col gap-4 relative overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(0,0,0,0.06)] ${c.is_emergency ? 'border border-red-100 shadow-[0_4px_12px_rgba(239,68,68,0.05)]' : 'border border-slate-100 shadow-[0_4px_12px_rgba(0,0,0,0.02)]'}`}>
      {c.is_emergency && (
        <div className="absolute top-0 right-0 px-3.5 py-1.5 bg-red-50 text-danger text-[10px] font-bold tracking-[0.05em] rounded-bl-2xl">
          URGENT
        </div>
      )}

      <div className={`w-11 h-11 rounded-[14px] flex items-center justify-center ${c.is_emergency ? 'bg-red-50' : 'bg-brand-light'}`}>
        <InfoIcon emergency={c.is_emergency} />
      </div>

      <div>
        <h3 className="t-heading-lg t-primary m-0">{c.role}</h3>
        <p className="t-md t-muted mt-1 m-0">{c.when}</p>
      </div>

      <div className="mt-auto pt-4 border-t border-slate-50">
        <a href={href}
          className={`flex items-center justify-center gap-2.5 w-full py-3 rounded-xl t-md font-semibold no-underline transition-all duration-200 group ${c.is_emergency ? 'bg-red-50 text-danger border border-red-100 hover:bg-danger hover:text-white hover:border-transparent' : 'bg-surface text-brand hover:bg-brand hover:text-white'}`}>
          {c.phone ? <PhoneIcon /> : <MailIcon />}
          {c.phone ? 'Call Now' : 'Send Email'}
        </a>
      </div>
    </div>
  )
}

function HostelRow({ c }) {
  const [copied, setCopied] = useState(null)
  const parts     = c.email ? c.email.split('|').map(e => e.trim()) : []
  const caretaker = parts[0] || ''
  const warden    = parts[1] || ''

  const copy = (text, key) => {
    navigator.clipboard?.writeText(text).catch(() => {})
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <tr className="border-b border-slate-100">
      <td className="text-[13px] font-semibold t-primary px-4 py-3">{c.role}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-brand flex-1 overflow-hidden text-ellipsis whitespace-nowrap max-w-[220px]">{caretaker}</span>
          <div className="flex gap-1 shrink-0">
            {caretaker && <a href={`mailto:${caretaker}`}><button className="px-2.5 py-1 rounded-md border-none bg-brand-light text-brand text-[11px] font-semibold cursor-pointer">Mail</button></a>}
            {caretaker && (
              <button onClick={() => copy(caretaker, 'c')} className={`px-2.5 py-1 rounded-md border border-slate-200 bg-white text-[11px] font-semibold cursor-pointer ${copied === 'c' ? 'text-success' : 't-subtle'}`}>
                {copied === 'c' ? 'Copied' : 'Copy'}
              </button>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-purple-600 flex-1 overflow-hidden text-ellipsis whitespace-nowrap max-w-[220px]">{warden}</span>
          <div className="flex gap-1 shrink-0">
            {warden && <a href={`mailto:${warden}`}><button className="px-2.5 py-1 rounded-md border-none bg-purple-50 text-purple-600 text-[11px] font-semibold cursor-pointer">Mail</button></a>}
            {warden && (
              <button onClick={() => copy(warden, 'w')} className={`px-2.5 py-1 rounded-md border border-slate-200 bg-white text-[11px] font-semibold cursor-pointer ${copied === 'w' ? 'text-success' : 't-subtle'}`}>
                {copied === 'w' ? 'Copied' : 'Copy'}
              </button>
            )}
          </div>
        </div>
      </td>
    </tr>
  )
}

export default function CampusSupportPage() {
  const [activeTab, setActiveTab] = useState(TABS[0].label)
  const [sections, setSections]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')

  useEffect(() => {
    api.get('/api/support')
      .then(res => { if (res.success) setSections(res.data || []) })
      .catch(err => console.error('Failed to load campus support:', err))
      .finally(() => setLoading(false))
  }, [])

  const activeTabObj = TABS.find(t => t.label === activeTab) || TABS[0]
  const q = search.toLowerCase().trim()

  const filtered = sections.map(sec => {
    const filteredContacts = sec.contacts.filter(c => {
      // While searching, match across every category — not just the active tab.
      const tabMatch = q ? true : activeTabObj.filter(c, sec)
      const searchMatch = !q ||
        (c.role  || '').toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q) ||
        (c.when  || '').toLowerCase().includes(q) ||
        (sec.title || '').toLowerCase().includes(q)
      return tabMatch && searchMatch
    })
    return { ...sec, contacts: filteredContacts }
  }).filter(sec => sec.contacts.length > 0)

  // Hostel Directory is excluded from `filtered` above and rendered as its own table.
  // Show it whenever the Hostel tab is active, or whenever a search matches it (regardless of tab).
  const hostelDirSection = sections.find(s => s.title === 'Hostel Directory')
  const hostelDirFiltered = hostelDirSection && (activeTab === 'Hostel' || q)
    ? (q
        ? hostelDirSection.contacts.filter(c =>
            (c.role || '').toLowerCase().includes(q) ||
            (c.email || '').toLowerCase().includes(q))
        : hostelDirSection.contacts)
    : []

  return (
    <PageLayout>
      <div className="pb-14">
        {/* Header */}
        <div className="flex justify-between items-center flex-wrap gap-4 mb-7">
          <div>
            <h1 className="t-heading-xl t-primary m-0">Campus Support Hub</h1>
            <p className="t-base t-muted mt-1 m-0">Find professional assistance across various university departments.</p>
          </div>
          <div className="relative flex-1 min-w-[260px] max-w-[400px]">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2" width="15" height="15" viewBox="0 0 15 15" fill="none">
              <circle cx="6.5" cy="6.5" r="5.5" stroke="#94a3b8" strokeWidth="1.3" />
              <path d="M11 11l3 3" stroke="#94a3b8" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            <input
              placeholder="Search by department, role, or contact..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl t-base t-primary outline-none shadow-[0_1px_4px_rgba(0,0,0,0.04)] focus:border-brand"
            />
          </div>
        </div>

        {/* Filter Tabs — single scrollable row on mobile, wraps on larger screens */}
        <div className="flex gap-2 flex-nowrap overflow-x-auto sm:flex-wrap mb-6 pb-1 -mx-1 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TABS.map(tab => {
            const active      = activeTab === tab.label
            const isEmergency = tab.label === 'Emergency'
            return (
              <button key={tab.label} onClick={() => setActiveTab(tab.label)}
                className={`shrink-0 whitespace-nowrap px-5 py-2.5 rounded-xl cursor-pointer text-[13px] font-semibold transition-all duration-200 ${
                  active
                    ? isEmergency
                      ? 'bg-danger text-white border-none shadow-[0_4px_12px_rgba(0,0,0,0.12)]'
                      : 'bg-ink text-white border-none shadow-[0_4px_12px_rgba(0,0,0,0.12)]'
                    : isEmergency
                      ? 'bg-white text-danger border border-slate-200 hover:bg-surface'
                      : 'bg-white t-secondary border border-slate-200 hover:bg-surface'
                }`}>
                {isEmergency && <span className="text-base mr-1.5">🚨</span>}
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Content */}
        <div className="flex flex-col gap-12 transition-opacity duration-200">
          {loading ? (
            [1, 2].map(i => (
              <div key={i}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                  <div className="h-5 bg-slate-100 rounded-lg w-44" />
                </div>
                <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                  {[1, 2, 3].map(j => (
                    <div key={j} className="bg-surface rounded-3xl p-6 h-40">
                      <div className="w-10 h-10 bg-slate-200 rounded-xl mb-4" />
                      <div className="h-4 bg-slate-200 rounded-lg w-3/5 mb-2.5" />
                      <div className="h-3 bg-slate-200 rounded-lg w-4/5" />
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : filtered.length > 0 || hostelDirFiltered.length > 0 ? (
            <>
              {filtered.filter(sec => sec.title !== 'Hostel Directory').map((sec, si) => (
                <div key={si}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: sec.color || '#4f46e5', boxShadow: `0 0 10px ${sec.color || '#4f46e5'}` }} />
                    <h2 className="t-heading-lg t-primary m-0">{sec.title}</h2>
                    <div className="h-px bg-slate-100 flex-1 ml-4" />
                  </div>
                  <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                    {sec.contacts.map((c, ci) => <ContactCard key={c.id || ci} c={c} />)}
                  </div>
                </div>
              ))}

              {hostelDirFiltered.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0 bg-purple-600 shadow-[0_0_10px_#7c3aed]" />
                    <h2 className="t-heading-lg t-primary m-0">Hostel Directory</h2>
                    <div className="h-px bg-slate-100 flex-1 ml-4" />
                  </div>
                  <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-surface border-b-2 border-slate-100">
                          {['Hostel', 'Caretaker Email', 'Warden Email'].map(h => (
                            <th key={h} className="text-left px-4 py-3 text-[12px] font-bold t-secondary uppercase tracking-[0.05em]">{h}</th>
                          ))}
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
            <div className="text-center py-24 bg-white rounded-[28px] border border-dashed border-slate-200">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="t-heading-lg t-primary m-0 mb-2">No matches found</h3>
              <p className="t-base t-subtle mt-0">Try adjusting your search terms or filters.</p>
              <button onClick={() => { setSearch(''); setActiveTab(TABS[0].label) }}
                className="mt-6 bg-brand text-white border-none px-6 py-2.5 rounded-xl font-bold cursor-pointer">
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center py-20 px-6 text-center bg-white border-[1.5px] border-dashed border-slate-200 rounded-[28px]">
              <div className="w-16 h-16 rounded-[20px] bg-warning-light flex items-center justify-center mb-5 text-4xl">📋</div>
              <div className="t-heading-lg t-primary mb-2.5">Support Directory Coming Soon</div>
              <div className="t-base t-muted max-w-[400px]">
                Campus support contact details will appear here once added by the admin team.
              </div>
              <div className="mt-7 flex gap-3 flex-wrap justify-center">
                <div className="px-5 py-3 bg-surface rounded-xl t-md font-semibold t-primary">📞 General: 0175-239-3021</div>
                <div className="px-5 py-3 bg-warning-light rounded-xl t-md font-semibold text-amber-800">🚨 Security: 0175-239-3000</div>
              </div>
            </div>
          )}
        </div>

        <div className="text-center py-5 mt-10 t-md t-subtle">
          Having trouble connecting?{' '}
          <span onClick={() => window.location.href = '/support'} className="text-brand font-semibold cursor-pointer">
            IT Support Desk
          </span>
        </div>
      </div>
    </PageLayout>
  )
}
