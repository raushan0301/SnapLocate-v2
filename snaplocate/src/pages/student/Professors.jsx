import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'

const depts   = ['All Departments', 'CSED', 'Physics', 'Mathematics', 'Electronics', 'Mechanical']
const sortOps = ['Relevance', 'Name A-Z', 'Name Z-A']

const pjs = (size, weight, lh, color) => ({
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  fontSize: size, fontWeight: weight, lineHeight: lh, color,
})

/* ── Skeleton card for loading state ────────────────────────── */
function SkeletonCard() {
  return (
    <div style={{ background:'#fff', border:'1px solid #f1f5f9', borderRadius:16, padding:'20px 20px 16px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:14 }}>
        <div style={{ width:60, height:60, borderRadius:'50%', background:'#f1f5f9', animation:'pulse 1.5s ease-in-out infinite' }} />
        <div style={{ width:70, height:22, borderRadius:6, background:'#f1f5f9' }} />
      </div>
      <div style={{ height:14, background:'#f1f5f9', borderRadius:6, marginBottom:8 }} />
      <div style={{ height:12, background:'#f1f5f9', borderRadius:6, width:'60%', marginBottom:14 }} />
      <div style={{ height:1, background:'#f1f5f9', marginBottom:12 }} />
      <div style={{ height:12, background:'#f1f5f9', borderRadius:6, marginBottom:16 }} />
      <div style={{ height:38, background:'#f8fafc', borderRadius:12, border:'1px solid #f1f5f9' }} />
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
    <button
      onClick={onClick}
      style={{
        background:'#ffffff', border:'1px solid #f1f5f9', borderRadius:16,
        padding:'20px 20px 16px', display:'flex', flexDirection:'column', gap:0,
        cursor:'pointer', textAlign:'left', width:'100%',
        boxShadow:'0 1px 4px rgba(0,0,0,0.05)', transition:'box-shadow 0.15s, transform 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow='0 4px 20px rgba(0,0,0,0.1)'; e.currentTarget.style.transform='translateY(-2px)' }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow='0 1px 4px rgba(0,0,0,0.05)'; e.currentTarget.style.transform='translateY(0)' }}
    >
      {/* Avatar row */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
        <div style={{ position:'relative', width:60, height:60 }}>
          <div style={{ width:60, height:60, borderRadius:'50%', overflow:'hidden', background:'#e0e7ff', border:'2px solid #f1f5f9', display:'flex', alignItems:'center', justifyContent:'center' }}>
            {prof.avatar_url
              ? <img src={prof.avatar_url} alt={prof.full_name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              : <span style={{ fontFamily:"'Plus Jakarta Sans', sans-serif", fontSize:18, fontWeight:700, color:'#4f46e5' }}>{initials}</span>
            }
          </div>
          {prof.accepting_students && (
            <div style={{ position:'absolute', bottom:2, right:2, width:11, height:11, borderRadius:'50%', background:'#22c55e', border:'2px solid #fff' }} />
          )}
          {prof.is_verified && (
            <div style={{ 
              position:'absolute', top:-6, right:-6, width:24, height:24, 
              display:'flex', alignItems:'center', justifyContent:'center',
              filter: 'drop-shadow(0 2px 4px rgba(16,185,129,0.4))'
            }} title="Verified Faculty">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L14.8 5.4L19.2 6L19.8 10.4L23 13L20 16L19.8 20.4L15.4 21L12 24L8.6 21L4.2 20.4L4 16L1 13L4.2 10.4L4.8 6L9.2 5.4L12 2Z" fill="#10b981"/>
                <path d="M8.5 12.5L10.5 14.5L15.5 9.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          )}
        </div>

        <div style={{ background: isHOD ? '#fff7ed' : '#eef2ff', borderRadius:6, padding:'3px 8px' }}>
          <span style={{ ...pjs(10, 700, '14px', isHOD ? '#ea580c' : '#4f46e5'), letterSpacing:'0.06em' }}>
            {isHOD ? 'HOD' : badgeLabel.split(' ')[0]}
          </span>
        </div>
      </div>

      {/* Name + dept */}
      <div style={{ marginBottom:14 }}>
        <div style={pjs(15, 700, '20px', '#0f172a')}>{prof.full_name}</div>
        <div style={{ ...pjs(13, 400, '18px', '#64748b'), marginTop:2 }}>{prof.dept || 'Faculty'}</div>
      </div>

      <div style={{ height:1, background:'#f1f5f9', marginBottom:12 }} />

      {/* Location + Code */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:16 }}>
        <div>
          <div style={{ ...pjs(10, 600, '14px', '#94a3b8'), letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:3 }}>Location</div>
          <div style={pjs(13, 700, '18px', '#0f172a')}>{location}</div>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ ...pjs(10, 600, '14px', '#94a3b8'), letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:3 }}>Code</div>
          <div style={pjs(13, 700, '18px', '#0f172a')}>{prof.teacher_code || '—'}</div>
        </div>
      </div>

      {/* View Profile button */}
      <button
        style={{
          width:'100%', padding:'11px 0', background:'transparent',
          border:'1.5px solid #e2e8f0', borderRadius:12,
          display:'flex', alignItems:'center', justifyContent:'center', gap:6,
          cursor:'pointer', ...pjs(13, 600, '18px', '#0f172a'), transition:'border-color 0.15s, color 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor='#4f46e5'; e.currentTarget.style.color='#4f46e5' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor='#e2e8f0'; e.currentTarget.style.color='#0f172a' }}
      >
        View Full Profile <span style={{ fontSize:14 }}>→</span>
      </button>
    </button>
  )
}

/* ── Dropdown ────────────────────────────────────────────────── */
function Dropdown({ options, value, onChange }) {
  return (
    <div style={{ position:'relative' }}>
      <select value={value} onChange={e => onChange(e.target.value)} style={{
        appearance:'none', WebkitAppearance:'none', background:'#fff',
        border:'1px solid #e2e8f0', borderRadius:12, padding:'10px 36px 10px 14px',
        ...pjs(14, 500, '18px', '#0f172a'), cursor:'pointer', outline:'none', width:'100%',
      }}>
        {options.map(o => <option key={o}>{o}</option>)}
      </select>
      <svg style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} width="14" height="8" viewBox="0 0 14 8" fill="none">
        <path d="M1 1l6 6 6-6" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   Faculty Directory Page — connected to live API
════════════════════════════════════════════════════════════════ */
export default function ProfessorsPage() {
  const navigate = useNavigate()
  const [search,   setSearch]   = useState('')
  const [dept,     setDept]     = useState(depts[0])
  const [sort,     setSort]     = useState(sortOps[0])
  const [faculty,  setFaculty]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)

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
      const matchDept   = dept === depts[0] || p.dept?.toLowerCase().includes(dept.toLowerCase())
      return matchSearch && matchDept
    })
    .sort((a, b) => {
      if (sort === 'Name A-Z') return (a.full_name || '').localeCompare(b.full_name || '')
      if (sort === 'Name Z-A') return (b.full_name || '').localeCompare(a.full_name || '')
      return 0
    })

  return (
    <PageLayout>
      {/* Page title */}
      <div style={{ marginBottom:4 }}>
        <h1 style={pjs(26, 700, '34px', '#0f172a')}>Faculty Directory</h1>
        <p style={{ ...pjs(14, 400, '20px', '#64748b'), marginTop:4 }}>Discover and connect with your professors</p>
      </div>

      {/* Search + filters */}
      <div style={{ background:'#fff', border:'1px solid #f1f5f9', borderRadius:16, padding:'18px 20px', display:'flex', gap:14, alignItems:'center', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
        <div style={{ flex:1 }}>
          <div style={{ ...pjs(10, 600, '14px', '#94a3b8'), letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:6 }}>Search Faculty</div>
          <div style={{ position:'relative' }}>
            <svg style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)' }} width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="6" cy="6" r="5" stroke="#94a3b8" strokeWidth="1.3"/>
              <path d="M10 10l2.5 2.5" stroke="#94a3b8" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or teacher code..."
              style={{ width:'100%', padding:'10px 14px 10px 34px', background:'#f8fafc', border:'1px solid #f1f5f9', borderRadius:12, ...pjs(13, 400, '18px', '#0f172a'), outline:'none', boxSizing:'border-box' }}
            />
          </div>
        </div>

        <div style={{ width:180 }}>
          <div style={{ ...pjs(10, 600, '14px', '#94a3b8'), letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:6 }}>Department</div>
          <Dropdown options={depts} value={dept} onChange={setDept} />
        </div>

        <div style={{ paddingTop:20 }}>
          <button
            style={{ width:44, height:44, borderRadius:12, background:'#4f46e5', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}
            onMouseEnter={e => e.currentTarget.style.background='#4338ca'}
            onMouseLeave={e => e.currentTarget.style.background='#4f46e5'}
            onClick={() => setSearch('')}
            title="Clear filters"
          >
            <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
              <path d="M1 1h16M3 7h12M6 13h6" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Results header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={pjs(16, 700, '22px', '#0f172a')}>All Professors</span>
          <span style={{ ...pjs(13, 500, '18px', '#64748b'), background:'#f1f5f9', borderRadius:8, padding:'2px 10px' }}>
            {loading ? '…' : `${filtered.length} Found`}
          </span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={pjs(13, 400, '18px', '#64748b')}>Sort by:</span>
          <Dropdown options={sortOps} value={sort} onChange={setSort} />
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div style={{ background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:12, padding:'16px 20px', ...pjs(14, 500, '20px', '#991b1b') }}>
          ⚠️ Could not load faculty: {error}
        </div>
      )}

      {/* Grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:16 }}>
        {loading
          ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
          : filtered.length === 0
          ? (
            <div style={{ gridColumn:'1/-1', textAlign:'center', padding:'60px 20px' }}>
              <div style={{ fontSize:48, marginBottom:12 }}>🔍</div>
              <div style={pjs(16, 600, '22px', '#64748b')}>No faculty found</div>
              <div style={{ ...pjs(13, 400, '18px', '#94a3b8'), marginTop:6 }}>
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

      {/* CSS for skeleton animation */}
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }`}</style>
    </PageLayout>
  )
}
