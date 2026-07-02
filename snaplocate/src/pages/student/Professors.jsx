import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'
import { useAuth } from '../../context/AuthContext'

const DEPTS    = ['All Departments', 'CSED', 'Physics', 'Mathematics', 'Electronics', 'Mechanical']
const SORT_OPS = ['Default', 'Name A-Z', 'Name Z-A', 'Department', 'Designation']

function SkeletonCard() {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl px-5 py-5 pb-4">
      <div className="flex justify-between mb-3.5">
        <div className="w-[60px] h-[60px] rounded-full bg-slate-100" style={{ animation: 'pulse 1.5s ease-in-out infinite' }} />
        <div className="w-[70px] h-5 rounded-md bg-slate-100" />
      </div>
      <div className="h-3.5 bg-slate-100 rounded-md mb-2" />
      <div className="h-3 bg-slate-100 rounded-md w-3/5 mb-3.5" />
      <div className="h-px bg-slate-100 mb-3" />
      <div className="h-3 bg-slate-100 rounded-md mb-4" />
      <div className="h-9 bg-surface rounded-xl border border-slate-100" />
    </div>
  )
}

function ProfCard({ prof, onClick }) {
  const initials  = prof.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??'
  const location  = prof.cabin_room ? `${prof.cabin_building || ''} ${prof.cabin_room}`.trim() : prof.dept || '—'
  const badgeLabel = prof.designation?.toUpperCase() || 'FACULTY'
  const isHOD     = badgeLabel.includes('HEAD') || badgeLabel.includes('HOD')

  return (
    <button onClick={onClick}
      className="bg-white border border-slate-100 rounded-2xl px-5 py-5 pb-4 flex flex-col gap-0 cursor-pointer text-left w-full shadow-[0_1px_4px_rgba(0,0,0,0.05)] transition-all duration-150 hover:shadow-[0_4px_20px_rgba(0,0,0,0.1)] hover:-translate-y-0.5">
      {/* Avatar row */}
      <div className="flex justify-between items-start mb-3.5">
        <div className="relative w-[60px] h-[60px]">
          <div className="w-[60px] h-[60px] rounded-full overflow-hidden bg-indigo-100 border-2 border-slate-100 flex items-center justify-center">
            {prof.avatar_url
              ? <img src={prof.avatar_url} alt={prof.full_name} className="w-full h-full object-cover" />
              : <span className="text-[18px] font-bold text-brand">{initials}</span>
            }
          </div>
          {prof.accepting_students && (
            <div className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white" />
          )}
          {prof.is_verified && (
            <div className="absolute -top-1.5 -right-1.5 w-6 h-6 flex items-center justify-center"
              style={{ filter: 'drop-shadow(0 2px 4px rgba(16,185,129,0.4))' }} title="Verified Faculty">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L14.8 5.4L19.2 6L19.8 10.4L23 13L20 16L19.8 20.4L15.4 21L12 24L8.6 21L4.2 20.4L4 16L1 13L4.2 10.4L4.8 6L9.2 5.4L12 2Z" fill="#10b981" />
                <path d="M8.5 12.5L10.5 14.5L15.5 9.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          )}
        </div>
        <div className={`rounded-md px-2 py-0.5 ${isHOD ? 'bg-orange-50' : 'bg-brand-light'}`}>
          <span className={`text-[10px] font-bold tracking-[0.06em] ${isHOD ? 'text-orange-600' : 'text-brand'}`}>
            {isHOD ? 'HOD' : badgeLabel.split(' ')[0]}
          </span>
        </div>
      </div>

      {/* Name + dept */}
      <div className="mb-3.5">
        <div className="t-base font-bold t-primary">{prof.full_name}</div>
        <div className="t-md t-muted mt-0.5">{prof.dept || 'Faculty'}</div>
      </div>

      <div className="h-px bg-slate-100 mb-3" />

      {/* Location + Code */}
      <div className="flex justify-between items-end mb-4">
        <div>
          <div className="text-[10px] font-semibold t-subtle uppercase tracking-[0.08em] mb-0.5">Location</div>
          <div className="text-[13px] font-bold t-primary">{location}</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-semibold t-subtle uppercase tracking-[0.08em] mb-0.5">Code</div>
          <div className="text-[13px] font-bold t-primary">{prof.teacher_code || '—'}</div>
        </div>
      </div>

      {/* View Profile button */}
      <div className="w-full py-2.5 bg-transparent border-[1.5px] border-slate-200 rounded-xl flex items-center justify-center gap-1.5 t-md font-semibold t-primary transition-colors duration-150 hover:border-brand hover:text-brand">
        View Full Profile <span className="text-sm">→</span>
      </div>
    </button>
  )
}

export default function ProfessorsPage() {
  const navigate     = useNavigate()
  const { isGuest }  = useAuth()
  const [search, setSearch] = useState('')
  const [dept, setDept]     = useState(DEPTS[0])
  const [sort, setSort]     = useState(SORT_OPS[0])
  const [faculty, setFaculty] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    api.get('/api/faculty')
      .then(res => setFaculty(res.data || res || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const filtered = faculty
    .filter(p => {
      const q = search.toLowerCase()
      const matchSearch = !q || p.full_name?.toLowerCase().includes(q) || p.teacher_code?.toLowerCase().includes(q) || p.dept?.toLowerCase().includes(q)
      const matchDept   = dept === DEPTS[0] || p.dept?.toLowerCase().includes(dept.toLowerCase())
      return matchSearch && matchDept
    })
    .sort((a, b) => {
      const isATest = a.full_name?.toLowerCase().includes('test')
      const isBTest = b.full_name?.toLowerCase().includes('test')
      if (isATest && !isBTest) return -1
      if (!isATest && isBTest) return  1
      if (sort === 'Name A-Z')    return (a.full_name || '').localeCompare(b.full_name || '')
      if (sort === 'Name Z-A')    return (b.full_name || '').localeCompare(a.full_name || '')
      if (sort === 'Department')  return (a.dept || '').localeCompare(b.dept || '')
      if (sort === 'Designation') return (a.designation || '').localeCompare(b.designation || '')
      return 0
    })

  return (
    <PageLayout>
      {/* Header + search */}
      <div className="flex justify-between items-center flex-wrap gap-4 mb-7">
        <div>
          <h1 className="t-heading-xl t-primary m-0">Faculty Directory</h1>
          <p className="t-base t-muted mt-1 m-0">Discover and connect with your professors</p>
        </div>
        <div className="relative flex-1 min-w-[260px] max-w-[400px]">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2" width="15" height="15" viewBox="0 0 15 15" fill="none">
            <circle cx="6.5" cy="6.5" r="5.5" stroke="#94a3b8" strokeWidth="1.3" />
            <path d="M11 11l3 3" stroke="#94a3b8" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          <input placeholder="Search by name or teacher code…" value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl t-base t-primary outline-none shadow-[0_1px_4px_rgba(0,0,0,0.04)] focus:border-brand box-border"
          />
        </div>
      </div>

      {!isGuest && (
        <div className="bg-brand-light border border-brand-border px-5 py-4 rounded-2xl mb-6 flex items-center gap-3.5">
          <span className="t-base text-indigo-700 font-medium leading-[22px]">
            <strong>Onboarding In Progress:</strong> We are currently working on onboarding professors. Once onboarded, you will be able to access their entire profile. For reference, you can view the Test Faculty profiles below.
          </span>
        </div>
      )}

      <div className="flex flex-col gap-5">
        {/* Filter bar */}
        <div className="flex justify-between items-center gap-3 flex-wrap">
          <div className="flex gap-2 flex-wrap items-center">
            {DEPTS.slice(0, 5).map(d => (
              <button key={d} onClick={() => setDept(d)}
                className={`px-4 py-2 rounded-full cursor-pointer transition-all text-[13px] ${dept === d ? 'bg-brand text-white border-none font-bold' : 'bg-white text-slate-500 border-[1.5px] border-slate-200 font-medium hover:bg-surface'}`}>
                {d === 'All Departments' ? 'All Depts' : d}
              </button>
            ))}
            {DEPTS.length > 5 && (
              <select value={dept} onChange={e => setDept(e.target.value)}
                className="appearance-none text-[13px] font-medium t-secondary bg-white border-[1.5px] border-slate-200 rounded-full px-4 py-2 pr-8 outline-none cursor-pointer">
                {DEPTS.slice(5).map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="t-md t-secondary">Sort:</span>
            <select value={sort} onChange={e => setSort(e.target.value)}
              className="appearance-none t-md font-semibold t-primary bg-white border border-slate-200 rounded-xl px-3 py-1.5 pr-7 outline-none cursor-pointer">
              {SORT_OPS.map(op => <option key={op} value={op}>{op}</option>)}
            </select>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-300 rounded-xl px-5 py-4 t-base font-medium text-red-800">
            ⚠️ Could not load faculty: {error}
          </div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
            : filtered.length === 0
              ? (
                <div className="col-span-full text-center py-16 px-5">
                  <div className="text-5xl mb-3">🔍</div>
                  <div className="t-base font-semibold t-secondary">No faculty found</div>
                  <div className="t-md t-subtle mt-1.5">
                    {faculty.length === 0
                      ? 'No faculty profiles have been created yet.'
                      : 'Try a different search or department filter.'}
                  </div>
                </div>
              )
              : filtered.map(prof => (
                <ProfCard key={prof.id} prof={prof} onClick={() => navigate(`/professors/${prof.id}`)} />
              ))
          }
        </div>
      </div>
    </PageLayout>
  )
}
