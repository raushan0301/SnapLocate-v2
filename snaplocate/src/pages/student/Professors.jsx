import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'
import { useAuth } from '../../context/AuthContext'

const depts = ['All Departments', 'CSED', 'Physics', 'Mathematics', 'Electronics', 'Mechanical']
const sortOps = ['Default', 'Name A-Z', 'Name Z-A', 'Department', 'Designation']

const pjs = (size, weight, lh, color) => ({
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  fontSize: size, fontWeight: weight, lineHeight: lh, color,
})

/* ── Skeleton card for loading state ────────────────────────── */
function SkeletonCard() {
  return (
    <div style={{ background: '#fff', border: '1px solid #f1f5f9', borderRadius: 16, padding: '20px 20px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#f1f5f9', animation: 'pulse 1.5s ease-in-out infinite' }} />
        <div style={{ width: 70, height: 22, borderRadius: 6, background: '#f1f5f9' }} />
      </div>
      <div style={{ height: 14, background: '#f1f5f9', borderRadius: 6, marginBottom: 8 }} />
      <div style={{ height: 12, background: '#f1f5f9', borderRadius: 6, width: '60%', marginBottom: 14 }} />
      <div style={{ height: 1, background: '#f1f5f9', marginBottom: 12 }} />
      <div style={{ height: 12, background: '#f1f5f9', borderRadius: 6, marginBottom: 16 }} />
      <div style={{ height: 38, background: '#f8fafc', borderRadius: 12, border: '1px solid #f1f5f9' }} />
    </div>
  )
}

/* ── Professor Card ──────────────────────────────────────────── */
function ProfCard({ prof, onClick }) {
  const initials = prof.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??'
  const location = prof.cabin_room ? `${prof.cabin_building || ''} ${prof.cabin_room}`.trim() : prof.dept || '—'
  const badgeLabel = prof.designation?.toUpperCase() || 'FACULTY'
  const isHOD = badgeLabel.includes('HEAD') || badgeLabel.includes('HOD')

  return (
    <div
      onClick={onClick}
      style={{
        background: '#ffffff', border: '1px solid #f1f5f9', borderRadius: 16,
        padding: '20px 20px 16px', display: 'flex', flexDirection: 'column', gap: 0,
        cursor: 'pointer', textAlign: 'left', width: '100%',
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)', transition: 'box-shadow 0.15s, transform 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)'; e.currentTarget.style.transform = 'translateY(0)' }}
    >
      {/* Avatar row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div style={{ position: 'relative', width: 60, height: 60 }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', overflow: 'hidden', background: '#e0e7ff', border: '2px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {prof.avatar_url
              ? <img src={prof.avatar_url} alt={prof.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 18, fontWeight: 700, color: '#4f46e5' }}>{initials}</span>
            }
          </div>
          {prof.accepting_students && (
            <div style={{ position: 'absolute', bottom: 2, right: 2, width: 11, height: 11, borderRadius: '50%', background: '#22c55e', border: '2px solid #fff' }} />
          )}
          {prof.is_verified && (
            <div style={{
              position: 'absolute', top: -6, right: -6, width: 24, height: 24,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              filter: 'drop-shadow(0 2px 4px rgba(16,185,129,0.4))'
            }} title="Verified Faculty">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L14.8 5.4L19.2 6L19.8 10.4L23 13L20 16L19.8 20.4L15.4 21L12 24L8.6 21L4.2 20.4L4 16L1 13L4.2 10.4L4.8 6L9.2 5.4L12 2Z" fill="#10b981" />
                <path d="M8.5 12.5L10.5 14.5L15.5 9.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          )}
        </div>

        <div style={{ background: isHOD ? '#fff7ed' : '#eef2ff', borderRadius: 6, padding: '3px 8px' }}>
          <span style={{ ...pjs(10, 700, '14px', isHOD ? '#ea580c' : '#4f46e5'), letterSpacing: '0.06em' }}>
            {isHOD ? 'HOD' : badgeLabel.split(' ')[0]}
          </span>
        </div>
      </div>

      {/* Name + dept */}
      <div style={{ marginBottom: 14 }}>
        <div style={pjs(15, 700, '20px', '#0f172a')}>{prof.full_name}</div>
        <div style={{ ...pjs(13, 400, '18px', '#64748b'), marginTop: 2 }}>{prof.dept || 'Faculty'}</div>
      </div>

      <div style={{ height: 1, background: '#f1f5f9', marginBottom: 12 }} />

      {/* Location + Code */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
        <div>
          <div style={{ ...pjs(10, 600, '14px', '#94a3b8'), letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 3 }}>Location</div>
          <div style={pjs(13, 700, '18px', '#0f172a')}>{location}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ ...pjs(10, 600, '14px', '#94a3b8'), letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 3 }}>Code</div>
          <div style={pjs(13, 700, '18px', '#0f172a')}>{prof.teacher_code || '—'}</div>
        </div>
      </div>

      {/* View Profile button */}
      <div
        style={{
          width: '100%', padding: '11px 0', background: 'transparent',
          border: '1.5px solid #e2e8f0', borderRadius: 12,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          cursor: 'pointer', ...pjs(13, 600, '18px', '#0f172a'), transition: 'border-color 0.15s, color 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = '#4f46e5'; e.currentTarget.style.color = '#4f46e5' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#0f172a' }}
      >
        View Full Profile <span style={{ fontSize: 14 }}>→</span>
      </div>
    </div>
  )
}

/* ── Dropdown ────────────────────────────────────────────────── */
function Dropdown({ options, value, onChange }) {
  return (
    <div style={{ position: 'relative' }}>
      <select value={value} onChange={e => onChange(e.target.value)} style={{
        appearance: 'none', WebkitAppearance: 'none', background: '#fff',
        border: '1px solid #e2e8f0', borderRadius: 12, padding: '10px 36px 10px 14px',
        ...pjs(14, 500, '18px', '#0f172a'), cursor: 'pointer', outline: 'none', width: '100%',
      }}>
        {options.map(o => <option key={o}>{o}</option>)}
      </select>
      <svg style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="14" height="8" viewBox="0 0 14 8" fill="none">
        <path d="M1 1l6 6 6-6" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   Faculty Directory Page — connected to live API
════════════════════════════════════════════════════════════════ */
export default function ProfessorsPage() {
  const navigate = useNavigate()
  const { isGuest } = useAuth()
  const [search, setSearch] = useState('')
  const [dept, setDept] = useState(depts[0])
  const [sort, setSort] = useState(sortOps[0])
  const [faculty, setFaculty] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchFaculty = async () => {
      setLoading(true)
      try {
        const res = await api.get('/api/faculty')
        setFaculty(res.data || res || [])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchFaculty()
  }, [])

  // Filter + sort client-side
  const filtered = faculty
    .filter(p => {
      const q = search.toLowerCase()
      const matchSearch = !q || p.full_name?.toLowerCase().includes(q) || p.teacher_code?.toLowerCase().includes(q) || p.dept?.toLowerCase().includes(q)
      const matchDept = dept === depts[0] || p.dept?.toLowerCase().includes(dept.toLowerCase())
      return matchSearch && matchDept
    })
    .sort((a, b) => {
      if (sort === 'Name A-Z') return (a.full_name || '').localeCompare(b.full_name || '')
      if (sort === 'Name Z-A') return (b.full_name || '').localeCompare(a.full_name || '')
      if (sort === 'Department') return (a.dept || '').localeCompare(b.dept || '')
      if (sort === 'Designation') return (a.designation || '').localeCompare(b.designation || '')
      return 0
    })

  return (
    <PageLayout>
      {/* Page title & Search */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
        <div>
          <h1 style={pjs(26, 700, '34px', '#0f172a')}>Faculty Directory</h1>
          <p style={{ ...pjs(14, 400, '20px', '#64748b'), marginTop: 4 }}>Discover and connect with your professors</p>
        </div>

        <div style={{ position: 'relative', flex: '1 1 300px', maxWidth: 400 }}>
          <svg style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} width="15" height="15" viewBox="0 0 15 15" fill="none">
            <circle cx="6.5" cy="6.5" r="5.5" stroke="#94a3b8" strokeWidth="1.3" />
            <path d="M11 11l3 3" stroke="#94a3b8" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          <input
            placeholder="Search by name or teacher code..."
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

      {!isGuest && (
        <div style={{ background: '#eef2ff', border: '1px solid #c7d2fe', padding: '16px 20px', borderRadius: 14, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 14 }}>

          <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, color: '#4338ca', fontWeight: 500, lineHeight: '22px' }}>
            <strong>Onboarding In Progress:</strong> We are currently working on onboarding professors. Once onboarded, you will be able to access their entire profile. For reference, you can view the Test Faculty profiles below.
          </span>
        </div>
      )}

      {/* Main Content Area matching Classroom gaps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Filter Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Department buttons instead of dropdown to match Classroom */}
            {depts.slice(0, 5).map(d => (
              <button
                key={d}
                onClick={() => setDept(d)}
                style={{
                  padding: '8px 18px', borderRadius: 24,
                  border: dept === d ? 'none' : '1.5px solid #e2e8f0',
                  background: dept === d ? '#4f46e5' : '#ffffff',
                  ...pjs(13, dept === d ? 700 : 500, '18px', dept === d ? '#ffffff' : '#64748b'),
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                {d === 'All Departments' ? 'All Depts' : d}
              </button>
            ))}
            {/* Add a dropdown for the rest if there are more than 5 to save space, or just use a small dropdown for department if preferred.
                Since Classroom used buttons, let's keep the most popular ones as buttons. */}
            {depts.length > 5 && (
              <div style={{ position: 'relative' }}>
                <select
                  value={dept}
                  onChange={e => setDept(e.target.value)}
                  style={{
                    ...pjs(13, 500, '18px', '#64748b'),
                    background: '#ffffff', border: '1.5px solid #e2e8f0',
                    borderRadius: 24, padding: '8px 32px 8px 16px',
                    outline: 'none', cursor: 'pointer',
                    appearance: 'none',
                    backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3Csvg width=\\\'10\\\' height=\\\'6\\\' viewBox=\\\'0 0 10 6\\\' fill=\\\'none\\\' xmlns=\\\'http://www.w3.org/2000/svg\\\'%3E%3Cpath d=\\\'M1 1L5 5L9 1\\\' stroke=\\\'%2364748b\\\' stroke-width=\\\'1.3\\\' stroke-linecap=\\\'round\\\' stroke-linejoin=\\\'round\\\'/%3E%3C/svg%3E")',
                    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center'
                  }}
                >
                  {depts.slice(5).map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <span style={pjs(13, 400, '18px', '#64748b')}>Sort:</span>
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              style={{
                ...pjs(13, 600, '18px', '#0f172a'),
                background: '#ffffff', border: '1px solid #e2e8f0',
                borderRadius: 10, padding: '7px 12px',
                outline: 'none', cursor: 'pointer',
                appearance: 'none', paddingRight: '28px',
                backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3Csvg width=\\\'10\\\' height=\\\'6\\\' viewBox=\\\'0 0 10 6\\\' fill=\\\'none\\\' xmlns=\\\'http://www.w3.org/2000/svg\\\'%3E%3Cpath d=\\\'M1 1L5 5L9 1\\\' stroke=\\\'%2364748b\\\' stroke-width=\\\'1.3\\\' stroke-linecap=\\\'round\\\' stroke-linejoin=\\\'round\\\'/%3E%3C/svg%3E")',
                backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center'
              }}>
              {sortOps.map(op => <option key={op} value={op}>{op}</option>)}
            </select>
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 12, padding: '16px 20px', ...pjs(14, 500, '20px', '#991b1b') }}>
            ⚠️ Could not load faculty: {error}
          </div>
        )}

        {/* Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
            : filtered.length === 0
              ? (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 20px' }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
                  <div style={pjs(16, 600, '22px', '#64748b')}>No faculty found</div>
                  <div style={{ ...pjs(13, 400, '18px', '#94a3b8'), marginTop: 6 }}>
                    {faculty.length === 0
                      ? 'No faculty profiles have been created yet. Faculty members need to set up their profiles.'
                      : 'Try a different search or department filter.'}
                  </div>
                </div>
              )
              : filtered.map(prof => (
                <ProfCard
                  key={prof.id}
                  prof={prof}
                  onClick={() => navigate(`/professors/${prof.id}`)}
                />
              ))
          }
        </div>
      </div>

      {/* CSS for skeleton animation */}
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }`}</style>
    </PageLayout>
  )
}
