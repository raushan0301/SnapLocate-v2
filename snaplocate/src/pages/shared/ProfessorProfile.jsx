import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import PageLayout from '../../components/PageLayout'
import { useAuth } from '../../context/AuthContext'
import api from '../../lib/api'

const pjs = (size, weight, lh, color) => ({
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  fontSize: size, fontWeight: weight, lineHeight: lh, color,
})

/* ─── Request Modal ───────────────────────────────────────────── */
const REQUEST_TYPES = ['Office Hour', 'Attendance', 'Grade Review', 'Extension', 'Research Query']

function RequestModal({ prof, onClose, onSuccess }) {
  const [type,    setType]    = useState(REQUEST_TYPES[0])
  const [detail,  setDetail]  = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  const submit = async () => {
    if (!detail.trim()) { setError('Please describe your request'); return }
    if (!prof.user_id) {
      setError('This faculty member has not yet registered on SnapLocate. Requests cannot be sent to unregistered accounts.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await api.post('/api/requests', {
        faculty_profile_id: prof.id,
        type,
        detail: detail.trim(),
      })
      onSuccess()
    } catch (err) {
      setError(err.message || 'Failed to send request')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,.55)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, padding:20 }}>
      <div style={{ background:'#fff', borderRadius:24, padding:'32px 36px', width:'100%', maxWidth:480, boxShadow:'0 24px 80px rgba(0,0,0,.24)', animation:'slideUp .25s ease' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
          <div>
            <h2 style={pjs(20, 800, '26px', '#0f172a')}>Request Appointment</h2>
            <p style={{ ...pjs(13, 400, '18px', '#64748b'), marginTop:4 }}>Sending to {prof.full_name}</p>
          </div>
          <button onClick={onClose} style={{ width:36, height:36, borderRadius:10, border:'none', background:'#f1f5f9', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
        </div>

        {/* Request type pills */}
        <div style={{ marginBottom:20 }}>
          <div style={{ ...pjs(11, 700, '15px', '#475569'), textTransform:'uppercase', letterSpacing:'.08em', marginBottom:10 }}>Request Type</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
            {REQUEST_TYPES.map(t => (
              <button key={t} onClick={() => setType(t)} style={{
                padding:'8px 16px', borderRadius:20,
                border: type===t ? 'none' : '1px solid #e2e8f0',
                background: type===t ? '#4f46e5' : '#fff',
                ...pjs(12, 600, '16px', type===t ? '#fff' : '#64748b'),
                cursor:'pointer', transition:'all .15s',
              }}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Detail */}
        <div style={{ marginBottom:20 }}>
          <div style={{ ...pjs(11, 700, '15px', '#475569'), textTransform:'uppercase', letterSpacing:'.08em', marginBottom:8 }}>Details</div>
          <textarea
            value={detail}
            onChange={e => setDetail(e.target.value)}
            rows={4}
            placeholder={
              type === 'Office Hour' ? 'What would you like to discuss? (e.g. project guidance, career advice…)' :
              type === 'Grade Review' ? 'Which assignment/exam and what specific concern?' :
              type === 'Research Query' ? 'What research topic are you interested in?' :
              'Describe your request in detail…'
            }
            style={{
              width:'100%', padding:'12px 16px', borderRadius:14,
              border:'1px solid #e2e8f0', background:'#f8fafc',
              ...pjs(13, 400, '20px', '#0f172a'),
              outline:'none', resize:'vertical', boxSizing:'border-box',
              transition:'border-color .15s',
            }}
            onFocus={e => e.target.style.borderColor = '#4f46e5'}
            onBlur={e  => e.target.style.borderColor = '#e2e8f0'}
          />
          {error && <div style={{ ...pjs(12, 500, '16px', '#ef4444'), marginTop:6 }}>⚠ {error}</div>}
        </div>

        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onClose} style={{ flex:1, padding:'12px', borderRadius:14, border:'1px solid #e2e8f0', background:'transparent', cursor:'pointer', ...pjs(13, 600, '18px', '#64748b') }}>
            Cancel
          </button>
          <button onClick={submit} disabled={loading} style={{
            flex:2, padding:'12px', borderRadius:14, border:'none',
            background: loading ? '#6366f1' : '#4f46e5',
            ...pjs(13, 700, '18px', '#fff'),
            cursor: loading ? 'default' : 'pointer',
            boxShadow:'0 2px 12px rgba(79,70,229,.3)',
            transition:'background .15s', opacity:loading?0.7:1,
          }}>
            {loading ? 'Sending…' : 'Send Request →'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Success Banner ──────────────────────────────────────────── */
function SuccessBanner({ onClose }) {
  return (
    <div style={{ background:'#dcfce7', border:'1px solid #bbf7d0', borderRadius:14, padding:'16px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:0 }}>
      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
        <div style={{ width:36, height:36, borderRadius:10, background:'#16a34a', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <svg width="16" height="16" viewBox="0 0 14 14" fill="none"><path d="M2.5 7l3.5 3.5 5.5-5.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <div>
          <div style={pjs(14, 700, '19px', '#14532d')}>Request Sent Successfully!</div>
          <div style={pjs(12, 400, '16px', '#166534')}>The professor will respond to your request soon.</div>
        </div>
      </div>
      <button onClick={onClose} style={{ border:'none', background:'transparent', cursor:'pointer', padding:4 }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="#166534" strokeWidth="1.5" strokeLinecap="round"/></svg>
      </button>
    </div>
  )
}

/* ─── Skeleton ──────────────────────────────────────────────── */
function Skeleton({ h, w = '100%', r = 8 }) {
  return <div style={{ height:h, width:w, borderRadius:r, background:'#f1f5f9', animation:'pulse 1.5s ease-in-out infinite' }} />
}

/* ═══════════════════════════════════════════════════════════════
   Professor Profile — fully connected to API
════════════════════════════════════════════════════════════════ */
export default function ProfessorProfile() {
  const { id }     = useParams()
  const navigate   = useNavigate()
  const { user }   = useAuth()

  const [prof,        setProf]        = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(null)
  const [showModal,   setShowModal]   = useState(false)
  const [sentSuccess, setSentSuccess] = useState(false)
  const [myRequests,  setMyRequests]  = useState([])

  useEffect(() => {
    const fetchProf = async () => {
      setLoading(true)
      try {
        const res = await api.get(`/api/faculty/${id}`)
        setProf(res.data?.data || res.data)
      } catch (err) {
        setError(err.message || 'Profile not found')
      } finally {
        setLoading(false)
      }
    }
    const fetchRequests = async () => {
      try {
        if (user?.role === 'student') {
          const res = await api.get('/api/requests')
          setMyRequests(res.data?.data || res.data || [])
        }
      } catch (err) {
        console.error('Failed to load requests:', err)
      }
    }
    fetchProf()
    fetchRequests()
  }, [id, user?.role, sentSuccess])

  const profRequests = myRequests.filter(r => r.faculty_id === prof?.id || r.faculty_id === id)

  const initials = prof?.users
    ? (prof.users.full_name || 'FA').split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()
    : (prof?.full_name || 'FA').split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()

  const fullName = prof?.users?.full_name || prof?.full_name || 'Faculty'

  if (loading) {
    return (
      <PageLayout>
        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
          <Skeleton h={200} r={24} />
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
            {[1,2,3,4].map(i => <Skeleton key={i} h={100} r={16} />)}
          </div>
          <Skeleton h={300} r={16} />
        </div>
      </PageLayout>
    )
  }

  if (error || !prof) {
    return (
      <PageLayout>
        <div style={{ textAlign:'center', padding:'80px 20px' }}>
          <div style={{ fontSize:64, marginBottom:16 }}>😕</div>
          <h1 style={pjs(22, 700, '28px', '#0f172a')}>Profile not found</h1>
          <p style={{ ...pjs(14, 400, '20px', '#64748b'), marginTop:8 }}>{error || 'This professor profile does not exist or has not been set up yet.'}</p>
          <button onClick={() => navigate(-1)} style={{ marginTop:20, padding:'12px 28px', borderRadius:40, background:'#4f46e5', border:'none', cursor:'pointer', ...pjs(13,700,'18px','#fff') }}>
            ← Go Back
          </button>
        </div>
      </PageLayout>
    )
  }

  const researchInterests = Array.isArray(prof.research_interests) ? prof.research_interests : (prof.research_interests || '').split(',').map(s=>s.trim()).filter(Boolean)
  const qualifications = prof.qualifications || []
  const publications   = prof.publications   || []
  const schedule = prof.timetable?.map(t => `${t.day}: ${t.course || t.subject} (${t.time_slot}) · ${t.room_or_link || t.room || ''}`) || []
  const officeHours = prof.office_hours || []
  const academicLinks = prof.academic_links || []

  return (
    <PageLayout>
      <style>{`@keyframes slideUp{from{transform:translateY(16px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>

      {showModal && (
        <RequestModal
          prof={{ ...prof, full_name: fullName }}
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); setSentSuccess(true) }}
        />
      )}

      {/* Back button */}
      <button onClick={() => navigate(-1)} style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'none', cursor:'pointer', ...pjs(13,600,'18px','#64748b'), transition:'color .15s' }}
        onMouseEnter={e=>e.currentTarget.style.color='#4f46e5'} onMouseLeave={e=>e.currentTarget.style.color='#64748b'}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        Back to Professors
      </button>

      {sentSuccess && <SuccessBanner onClose={() => setSentSuccess(false)} />}

      {/* ─── Profile Overview ──────────────────────── */}
      <div style={{ background:'#fff', borderRadius:24, border:'1px solid #f1f5f9', boxShadow:'0 1px 8px rgba(0,0,0,.04)', padding:'32px', marginBottom: 20 }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent: 'space-between', gap:24 }}>
          {/* Avatar & Info */}
          <div style={{ display:'flex', alignItems:'flex-start', gap:28 }}>
            <div style={{ width:120, height:120, borderRadius:20, background:'linear-gradient(135deg,#e2e8f0,#cbd5e1)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, overflow:'hidden', position: 'relative' }}>
              {prof.users?.avatar_url || prof.avatar_url
                ? <img src={prof.users?.avatar_url || prof.avatar_url} alt={fullName} style={{ width:'100%',height:'100%',objectFit:'cover' }} />
                : <span style={pjs(36,800,'42px','#fff')}>{initials}</span>
              }
              {prof.accepting_students && <div style={{ position:'absolute', bottom:6, right:6, width:14, height:14, borderRadius:'50%', background:'#10b981', border:'2px solid #fff' }} />}
            </div>

            <div style={{ flex:1 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <h1 style={pjs(28,800,'34px','#0f172a')}>{fullName}</h1>
                {(prof.users?.is_verified || prof.is_verified) && (
                  <div style={{ 
                    width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    filter: 'drop-shadow(0 2px 6px rgba(16,185,129,0.3))'
                  }} title="Verified Faculty">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2L14.8 5.4L19.2 6L19.8 10.4L23 13L20 16L19.8 20.4L15.4 21L12 24L8.6 21L4.2 20.4L4 16L1 13L4.2 10.4L4.8 6L9.2 5.4L12 2Z" fill="#10b981"/>
                      <path d="M8.5 12.5L10.5 14.5L15.5 9.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
                <span style={{ ...pjs(11,800,'15px','#4f46e5'), background:'#eef2ff', padding:'4px 14px', borderRadius:20, textTransform:'uppercase', letterSpacing:'.05em' }}>
                  {prof.designation || 'Professor'}
                </span>
              </div>
              <p style={{ ...pjs(16,500,'24px','#475569'), marginTop:4 }}>{prof.dept}</p>
              
              <div style={{ display:'flex', gap:40, marginTop:18 }}>
                <div>
                  <div style={{ ...pjs(10,700,'14px','#94a3b8'), textTransform:'uppercase', letterSpacing:'.05em' }}>Teacher Code</div>
                  <div style={{ ...pjs(14,700,'18px','#4f46e5'), marginTop:4 }}>{prof.teacher_code || '—'}</div>
                </div>
                <div>
                  <div style={{ ...pjs(10,700,'14px','#94a3b8'), textTransform:'uppercase', letterSpacing:'.05em' }}>Specialization</div>
                  <div style={{ ...pjs(14,700,'18px','#0f172a'), marginTop:4, maxWidth: 300, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{researchInterests.join(', ') || '—'}</div>
                </div>
                <div>
                  <div style={{ ...pjs(10,700,'14px','#94a3b8'), textTransform:'uppercase', letterSpacing:'.05em' }}>Location</div>
                  <div style={{ ...pjs(14,700,'18px','#0f172a'), marginTop:4 }}>{[prof.cabin_building, prof.cabin_room].filter(Boolean).join('-') || '—'}</div>
                </div>
              </div>

              <div style={{ marginTop: 20 }}>
                 <div style={{ ...pjs(10,700,'14px','#94a3b8'), textTransform:'uppercase', letterSpacing:'.05em' }}>Official Email</div>
                 <a href={`mailto:${prof.users?.email || prof.email}`} style={{ display:'inline-flex', alignItems:'center', gap:6, ...pjs(14,600,'18px','#4f46e5'), textDecoration:'none', marginTop:4 }}>
                   {prof.users?.email || prof.email}
                   <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M5 9a3 3 0 004.4 0l1.6-1.6a3 3 0 00-4.4-4.1L5.5 4.5" stroke="#4f46e5" strokeWidth="1.3" strokeLinecap="round"/><path d="M9 5a3 3 0 00-4.4 0L3 6.6a3 3 0 004.4 4.1l1-1" stroke="#4f46e5" strokeWidth="1.3" strokeLinecap="round"/></svg>
                 </a>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display:'flex', flexDirection:'column', gap:12, minWidth: 200 }}>
            {user?.role === 'student' && (
              <button
                onClick={() => setShowModal(true)}
                style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'14px', borderRadius:24, border:'none', background:'#4f46e5', cursor:'pointer', ...pjs(14,700,'18px','#fff'), boxShadow:'0 4px 16px rgba(79,70,229,.3)' }}
              >
                <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><rect x="1" y="2" width="14" height="13" rx="2" stroke="#fff" strokeWidth="1.4"/><path d="M5 1v3M11 1v3M1 6h14M8 10h1M8 12h1" stroke="#fff" strokeWidth="1.4" strokeLinecap="round"/></svg>
                Reserve Slot
              </button>
            )}
            <button
              onClick={() => { navigator.clipboard.writeText(window.location.href); alert('Profile link copied to clipboard!') }}
              style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'14px', borderRadius:24, border:'none', background:'#f1f5f9', cursor:'pointer', ...pjs(14,700,'18px','#475569'), transition:'all .2s' }}
              onMouseEnter={e=>e.currentTarget.style.background='#e2e8f0'}
              onMouseLeave={e=>e.currentTarget.style.background='#f1f5f9'}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="12" cy="4" r="2" stroke="currentColor" strokeWidth="1.4"/><circle cx="4" cy="8" r="2" stroke="currentColor" strokeWidth="1.4"/><circle cx="12" cy="12" r="2" stroke="currentColor" strokeWidth="1.4"/><path d="M6 7l4-2M6 9l4 2" stroke="currentColor" strokeWidth="1.4"/></svg>
              Share Profile
            </button>
          </div>
        </div>

        {/* Bio */}
        {prof.bio && (
          <div style={{ marginTop:32, paddingTop:32, borderTop:'1px solid #f1f5f9' }}>
            <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:12 }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 15v-2a4 4 0 014-4h2a4 4 0 014 4v2" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round"/><circle cx="8" cy="5" r="4" stroke="#94a3b8" strokeWidth="1.5"/></svg>
              <span style={{ ...pjs(12,700,'16px','#64748b'), textTransform:'uppercase', letterSpacing:'.08em' }}>Professional Bio</span>
            </div>
            <p style={pjs(15,400,'26px','#475569')}>{prof.bio}</p>
          </div>
        )}
      </div>

      {/* ─── Stats ─────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:20, marginBottom: 20 }}>
        {[
          { label:'Ongoing projects', value:prof.citations || 0,          sub:'Active' },
          { label:'CONFERENCE',    value:prof.conferences || 0,        sub:'Verified'       },
          { label:'PUBLICATIONS',  value:prof.publications_count || 0, sub:'Peer Reviewed'  },
          { label:'TEACHING EXP.', value:prof.teaching_exp_years  ? `${prof.teaching_exp_years}y` : '-', sub:'Core CS Specialist' },
        ].map((s, i) => (
          <div key={i} style={{ background:'#fff', borderRadius:16, border:'1px solid #f1f5f9', boxShadow:'0 1px 4px rgba(0,0,0,.04)', padding:'24px' }}>
            <div style={{ ...pjs(11,700,'16px','#94a3b8'), textTransform:'uppercase', letterSpacing:'.1em', marginBottom:8 }}>{s.label}</div>
            <div style={pjs(34,800,'40px','#0f172a')}>{s.value}</div>
            <div style={{ ...pjs(13,500,'18px','#94a3b8'), marginTop:8 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ─── Content grid ──────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:20 }}>

        {/* Left Column */}
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

          {/* Qualifications */}
          {qualifications.length > 0 && (
            <div style={{ background:'#fff', borderRadius:20, border:'1px solid #f1f5f9', boxShadow:'0 1px 4px rgba(0,0,0,.04)', overflow:'hidden' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, padding:'24px', borderBottom:'1px solid #f1f5f9' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
                <span style={pjs(18,700,'24px','#0f172a')}>Academic Qualifications</span>
              </div>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead>
                    <tr style={{ background:'#f8fafc' }}>
                      {['Degree','Year','University','Division','CGPA'].map(h => (
                        <th key={h} style={{ ...pjs(11,800,'14px','#94a3b8'), textTransform:'uppercase', letterSpacing:'.08em', padding:'14px 24px', textAlign:'left' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {qualifications.map((q, i) => (
                      <tr key={i} style={{ borderTop: i>0 ? '1px solid #f1f5f9' : 'none' }}>
                        <td style={{ ...pjs(14,700,'20px','#0f172a'), padding:'18px 24px' }}>{q.degree}</td>
                        <td style={{ ...pjs(14,400,'20px','#64748b'), padding:'18px 24px' }}>{q.year}</td>
                        <td style={{ ...pjs(14,400,'20px','#64748b'), padding:'18px 24px' }}>{q.institution || q.university}</td>
                        <td style={{ ...pjs(14,400,'20px','#64748b'), padding:'18px 24px' }}>{q.division || '—'}</td>
                        <td style={{ padding:'18px 24px', fontFamily:"'ui-monospace',monospace", fontSize:14, color:'#4f46e5' }}>{q.cgpa}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Publications */}
          {publications.length > 0 && (
            <div style={{ background:'#fff', borderRadius:20, border:'1px solid #f1f5f9', boxShadow:'0 1px 4px rgba(0,0,0,.04)', overflow:'hidden' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, padding:'24px', borderBottom:'1px solid #f1f5f9' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                <span style={pjs(18,700,'24px','#0f172a')}>Journal Publications (SCI/Scopus)</span>
              </div>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead>
                    <tr style={{ background:'#f8fafc' }}>
                      {['S.NO','Title of Paper','Journal & Volume','Year','DOI'].map(h => (
                        <th key={h} style={{ ...pjs(11,800,'14px','#94a3b8'), textTransform:'uppercase', letterSpacing:'.08em', padding:'14px 24px', textAlign:'left' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {publications.map((pub, i) => (
                      <tr key={i} style={{ borderTop: i>0 ? '1px solid #f1f5f9' : 'none' }}>
                        <td style={{ ...pjs(14,400,'20px','#94a3b8'), padding:'18px 24px' }}>{i+1}.</td>
                        <td style={{ ...pjs(14,600,'20px','#0f172a'), padding:'18px 24px', maxWidth: 280 }}>{pub.title}</td>
                        <td style={{ ...pjs(13,400,'18px','#64748b'), padding:'18px 24px', maxWidth: 180 }}>{pub.journal}</td>
                        <td style={{ ...pjs(14,400,'20px','#64748b'), padding:'18px 24px' }}>{pub.year}</td>
                        <td style={{ padding:'18px 24px', fontFamily:"'ui-monospace',monospace", fontSize:12, color:'#4f46e5' }}>{pub.doi}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Weekly Timetable */}
          <div style={{ background:'#fff', borderRadius:20, border:'1px solid #f1f5f9', boxShadow:'0 1px 4px rgba(0,0,0,.04)', padding:'24px' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                <span style={pjs(18,700,'24px','#0f172a')}>Weekly Timetable</span>
              </div>
              <span style={{ ...pjs(11,800,'15px','#fff'), background:'#94a3b8', padding:'4px 12px', borderRadius:20, textTransform:'uppercase' }}>Current Semester</span>
            </div>

            <div style={{ overflowX:'auto' }}>
               <table style={{ width:'100%', borderCollapse:'collapse', minWidth:600 }}>
                 <thead>
                   <tr>
                     <th style={{ ...pjs(11,800,'14px','#94a3b8'), padding:'16px 12px', textAlign:'left', borderBottom:'1px solid #e2e8f0', width: 120 }}>TIME</th>
                     {['MON','TUE','WED','THU','FRI'].map(d => <th key={d} style={{ ...pjs(11,800,'14px','#94a3b8'), padding:'16px 12px', textAlign:'center', borderBottom:'1px solid #e2e8f0' }}>{d}</th>)}
                   </tr>
                 </thead>
                 <tbody>
                   {(() => {
                     const ALL_TIME_SLOTS = [
                       '08:00 AM - 08:50 AM', '08:50 AM - 09:40 AM', '09:40 AM - 10:30 AM', '10:30 AM - 11:20 AM',
                       '11:20 AM - 12:10 PM', '12:10 PM - 01:00 PM', '01:00 PM - 01:50 PM', '01:50 PM - 02:40 PM',
                       '02:40 PM - 03:30 PM', '03:30 PM - 04:20 PM', '04:20 PM - 05:10 PM', '05:10 PM - 06:00 PM',
                       '06:00 PM - 06:30 PM'
                     ];
                     return ALL_TIME_SLOTS.map(time => (
                       <tr key={time}>
                         <td style={{ ...pjs(12,600,'16px','#64748b'), padding:'16px 12px', borderBottom:'1px solid #f8fafc', whiteSpace:'nowrap', verticalAlign:'top' }}>{time}</td>
                         {['Monday','Tuesday','Wednesday','Thursday','Friday'].map(d => {
                           const slot = prof.timetable?.find(t => t.time_slot === time && t.day === d);
                           return (
                             <td key={d} style={{ padding:'8px', borderBottom:'1px solid #f8fafc', textAlign:'center', verticalAlign:'top', height: 80 }}>
                               {slot && (
                                 <div style={{ background: slot.type?.toLowerCase()==='lab'?'#f0fdf4':slot.type?.toLowerCase()==='tutorial'?'#fefce8':slot.type?.toLowerCase()==='meeting'?'#f8fafc':'#eef2ff', padding:'12px 14px', borderRadius:16, display:'inline-block', width:'100%', maxWidth:140, border:`1px solid ${slot.type?.toLowerCase()==='lab'?'#bbf7d0':slot.type?.toLowerCase()==='tutorial'?'#fef08a':slot.type?.toLowerCase()==='meeting'?'#e2e8f0':'#e0e7ff'}`, boxSizing:'border-box' }}>
                                   <div style={{ ...pjs(9,800,'13px', slot.type?.toLowerCase()==='lab'?'#16a34a':slot.type?.toLowerCase()==='tutorial'?'#ca8a04':slot.type?.toLowerCase()==='meeting'?'#64748b':'#4f46e5'), textTransform:'uppercase', letterSpacing:'.05em' }}>{slot.type || 'Lecture'}</div>
                                   <div style={{ ...pjs(13,800,'18px','#0f172a'), marginTop:2, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{slot.course || slot.subject}</div>
                                   <div style={{ ...pjs(11,500,'14px','#64748b'), marginTop:4 }}>{slot.room_or_link || slot.room}</div>
                                 </div>
                               )}
                             </td>
                           )
                         })}
                       </tr>
                     ));
                   })()}
                 </tbody>
               </table>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
          
          {/* Visiting Info */}
          <div style={{ background:'#fff', borderRadius:20, border:'1px solid #f1f5f9', padding:'24px', boxShadow:'0 1px 4px rgba(0,0,0,.04)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:24 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              <span style={pjs(18,700,'22px','#0f172a')}>Visiting Info</span>
            </div>
            
            <div style={{ display:'flex', justifyContent:'space-between', paddingBottom:16, borderBottom:'1px solid #f8fafc' }}>
              <span style={pjs(13,500,'18px','#475569')}>Cabin Number</span>
              <span style={pjs(15,700,'18px','#0f172a')}>{[prof.cabin_building, prof.cabin_room].filter(Boolean).join('-') || '—'}</span>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:10, padding:'16px 0', borderBottom:'1px solid #f8fafc' }}>
              <span style={pjs(13,500,'18px','#475569')}>Visiting Hours</span>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                 {officeHours.length > 0 
                    ? officeHours.map((oh,i) => (
                        <div key={i} style={{ background:'#f8fafc', padding:'12px', borderRadius:12, border:'1px solid #f1f5f9' }}>
                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                            <span style={pjs(14,700,'20px','#0f172a')}>{oh.day}</span>
                            <span style={{ ...pjs(10,800,'14px', oh.mode==='Virtual'?'#4f46e5':'#16a34a'), background:oh.mode==='Virtual'?'#eef2ff':'#dcfce7', padding:'3px 10px', borderRadius:20 }}>
                              {oh.mode === 'Virtual' ? '🔗 VIRTUAL' : '📍 IN-PERSON'}
                            </span>
                          </div>
                          <div style={pjs(13,600,'18px','#4f46e5')}>{oh.time_slot}</div>
                          {oh.room_or_link && (
                            <div style={{ marginTop:6 }}>
                              {oh.mode === 'Virtual' ? (
                                <a href={oh.room_or_link.startsWith('http') ? oh.room_or_link : `https://${oh.room_or_link}`} target="_blank" rel="noreferrer" style={{ ...pjs(13,500,'18px','#0ea5e9'), textDecoration:'underline' }}>
                                  Join Meeting Link
                                </a>
                              ) : (
                                <span style={pjs(13,500,'18px','#64748b')}>{oh.room_or_link}</span>
                              )}
                            </div>
                          )}
                        </div>
                      ))
                    : <span style={pjs(13,500,'18px','#94a3b8')}>Not set</span>
                 }
              </div>
            </div>

            <div style={{ display:'flex', justifyContent:'space-between', paddingTop:16, alignItems:'center' }}>
              <span style={pjs(13,500,'18px','#475569')}>Availability</span>
              <span style={{ ...pjs(10,800,'14px','#10b981'), background:'#dcfce7', padding:'4px 12px', borderRadius:20 }}>● AVAILABLE NOW</span>
            </div>
          </div>

          {/* Awards */}
          {(prof.awards || []).length > 0 && (
            <div style={{ background:'#fff', borderRadius:20, border:'1px solid #f1f5f9', padding:'24px', boxShadow:'0 1px 4px rgba(0,0,0,.04)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
                <span style={{fontSize:20}}>🏆</span>
                <span style={pjs(18,700,'22px','#0f172a')}>Awards</span>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                {prof.awards.map((awr, i) => (
                  <div key={i}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                      <div style={pjs(14,700,'18px','#0f172a')}>{awr.title}</div>
                      <div style={pjs(11,600,'16px','#94a3b8')}>{awr.year}</div>
                    </div>
                    <div style={{ ...pjs(12,400,'18px','#64748b'), marginTop:2 }}>{awr.org}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Research Openings */}
          {prof.accepting_students && (
            <div style={{ background:'linear-gradient(135deg,#eef2ff,#e0e7ff)', borderRadius:20, border:'1px solid #c7d2fe', padding:'24px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                <span style={pjs(18,700,'22px','#0f172a')}>Research Openings</span>
              </div>
              <div style={{ ...pjs(14,400,'22px','#475569'), lineHeight: 1.6 }}>
                 Looking for highly motivated graduate students interested in {researchInterests.length > 0 ? researchInterests.map((r,idx) => <span key={idx} style={{fontWeight:700, color:'#0f172a'}}>{r} </span>) : 'my research areas.'} Prior experience is mandatory.
              </div>
              {user?.role === 'student' && (
                <button onClick={() => setShowModal(true)} style={{ width:'100%', marginTop:24, padding:'14px', borderRadius:24, border:'none', background:'#4f46e5', cursor:'pointer', ...pjs(14,700,'18px','#fff'), boxShadow:'0 4px 16px rgba(79,70,229,.3)', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                  Contact for Opportunity →
                </button>
              )}
            </div>
          )}

          {/* Cabin Location */}
          <div style={{ background:'#fff', borderRadius:20, border:'1px solid #f1f5f9', padding:'24px', boxShadow:'0 1px 4px rgba(0,0,0,.04)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              <span style={pjs(18,700,'22px','#0f172a')}>Cabin Location</span>
            </div>
            <div style={{ height:140, background:'#e2e8f0', borderRadius:16, position:'relative', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center' }}>
               <div style={{ position:'absolute', inset:0, background:'repeating-linear-gradient(45deg, #cbd5e1 0, #cbd5e1 2px, transparent 2px, transparent 8px)' }}></div>
               <div style={{ zIndex:1, width:36, height:36, borderRadius:'50%', background:'#4f46e5', display:'flex', alignItems:'center', justifyContent:'center', border:'3px solid #fff', boxShadow:'0 2px 8px rgba(0,0,0,.2)' }}>
                 <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
               </div>
               <div style={{ position:'absolute', bottom:10, left:10, background:'#fff', padding:'6px 14px', borderRadius:20, ...pjs(11,800,'16px','#0f172a'), boxShadow:'0 2px 8px rgba(0,0,0,.1)' }}>
                 BLOCK {prof.cabin_building || 'UNKNOWN'} - {prof.cabin_floor || 'GROUND'} FLOOR
               </div>
            </div>
          </div>

          {/* Academic Links */}
          <div style={{ background:'#fff', borderRadius:20, border:'1px solid #f1f5f9', padding:'24px', boxShadow:'0 1px 4px rgba(0,0,0,.04)' }}>
            <div style={{ ...pjs(18,700,'22px','#0f172a'), marginBottom:16 }}>Academic Links</div>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {[
                { label:'Email Contact', url: prof.users?.email || prof.email ? `mailto:${prof.users?.email || prof.email}` : null },
                ...academicLinks.filter(l=>l.url).map(l => ({ label: l.label, url: l.url }))
              ].filter(l => l.url).map((l, i) => (
                <a key={i} href={l.url} target="_blank" rel="noreferrer" style={{ display:'flex', alignItems:'center', gap:12, textDecoration:'none' }}>
                  <div style={{ width:40,height:40,borderRadius:12,background:'#f8fafc',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                  </div>
                  <div style={{ flex:1, overflow:'hidden' }}>
                    <div style={pjs(14,700,'18px','#0f172a')}>{l.label}</div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ paddingTop:16, borderTop:'1px solid #e2e8f0', display:'flex', justifyContent:'space-between', ...pjs(11,400,'15px','#94a3b8') }}>
        <span>© 2025 SnapLocate Education Platform · Academic Directory</span>
        <div style={{ display:'flex', gap:16 }}>
          {['Privacy Policy','Campus Support','Contact Admin'].map(l => (
            <a key={l} href="#" style={{ ...pjs(11,600,'15px','#64748b'), textDecoration:'none' }}>{l}</a>
          ))}
        </div>
      </div>
    </PageLayout>
  )
}
