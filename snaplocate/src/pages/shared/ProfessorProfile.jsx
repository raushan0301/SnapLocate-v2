import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import PageLayout from '../../components/PageLayout'
import { useAuth } from '../../context/AuthContext'
import api from '../../lib/api'

const REQUEST_TYPES = ['Office Hour', 'Attendance', 'Grade Review', 'Extension', 'Research Query']

const SLOT_CLS = {
  lab:      { bg: 'bg-green-50',   border: 'border-green-200',   tc: 'text-green-600',    sc: 'text-green-500' },
  tutorial: { bg: 'bg-yellow-50',  border: 'border-yellow-200',  tc: 'text-yellow-600',   sc: 'text-yellow-500' },
  meeting:  { bg: 'bg-slate-50',   border: 'border-slate-200',   tc: 'text-slate-500',    sc: 'text-slate-400' },
  others:   { bg: 'bg-fuchsia-50', border: 'border-fuchsia-200', tc: 'text-fuchsia-600',  sc: 'text-fuchsia-500' },
}
const SLOT_DEFAULT = { bg: 'bg-indigo-50', border: 'border-indigo-200', tc: 'text-brand', sc: 'text-indigo-400' }

const fieldCls = 'w-full px-4 py-3 rounded-[14px] border border-slate-200 bg-slate-50 text-[13px] leading-5 text-slate-900 outline-none resize-y box-border transition-colors focus:border-brand'

function RequestModal({ prof, onClose, onSuccess }) {
  const [type, setType]       = useState(REQUEST_TYPES[0])
  const [detail, setDetail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  const submit = async () => {
    if (!detail.trim()) { setError('Please describe your request'); return }
    if (!prof.user_id) {
      setError('This faculty member has not yet registered on SnapLocate. Requests cannot be sent to unregistered accounts.')
      return
    }
    setLoading(true); setError(null)
    try {
      await api.post('/api/requests', { faculty_profile_id: prof.id, type, detail: detail.trim() })
      onSuccess()
    } catch (err) { setError(err.message || 'Failed to send request') }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/55 backdrop-blur-[4px] flex items-center justify-center z-[9999] p-5">
      <div className="bg-white rounded-3xl px-9 py-8 w-full max-w-[480px] shadow-[0_24px_80px_rgba(0,0,0,.24)]"
        style={{ animation: 'slideUp .25s ease' }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-[20px] font-extrabold t-primary">Request Appointment</h2>
            <p className="text-[13px] text-slate-500 mt-1">Sending to {prof.full_name}</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-[10px] border-none bg-slate-100 cursor-pointer flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" /></svg>
          </button>
        </div>

        <div className="mb-5">
          <div className="text-[11px] font-bold uppercase tracking-[.08em] text-slate-600 mb-2.5">Request Type</div>
          <div className="flex flex-wrap gap-2">
            {REQUEST_TYPES.map(t => (
              <button key={t} onClick={() => setType(t)}
                className={`px-4 py-2 rounded-[20px] text-[12px] font-semibold cursor-pointer transition-all border ${type === t ? 'bg-brand text-white border-brand' : 'bg-white border-slate-200 text-slate-500'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-5">
          <div className="text-[11px] font-bold uppercase tracking-[.08em] text-slate-600 mb-2">Details</div>
          <textarea
            value={detail}
            onChange={e => setDetail(e.target.value)}
            rows={4}
            placeholder={
              type === 'Office Hour'   ? 'What would you like to discuss? (e.g. project guidance, career advice…)' :
              type === 'Grade Review'  ? 'Which assignment/exam and what specific concern?' :
              type === 'Research Query'? 'What research topic are you interested in?' :
                                        'Describe your request in detail…'
            }
            className={fieldCls}
          />
          {error && <div className="text-[12px] font-medium text-red-500 mt-1.5">⚠ {error}</div>}
        </div>

        <div className="flex gap-2.5">
          <button onClick={onClose}
            className="flex-1 py-3 rounded-[14px] border border-slate-200 bg-transparent cursor-pointer text-[13px] font-semibold text-slate-500">
            Cancel
          </button>
          <button onClick={submit} disabled={loading}
            className={`flex-[2] py-3 rounded-[14px] border-none bg-brand text-white text-[13px] font-bold shadow-[0_2px_12px_rgba(79,70,229,.3)] transition-opacity ${loading ? 'opacity-70 cursor-default' : 'cursor-pointer'}`}>
            {loading ? 'Sending…' : 'Send Request →'}
          </button>
        </div>
      </div>
    </div>
  )
}

function SuccessBanner({ onClose }) {
  return (
    <div className="bg-green-50 border border-green-200 rounded-[14px] px-5 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-[10px] bg-green-600 flex items-center justify-center shrink-0">
          <svg width="16" height="16" viewBox="0 0 14 14" fill="none"><path d="M2.5 7l3.5 3.5 5.5-5.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
        <div>
          <div className="text-[14px] font-bold text-green-900">Request Sent Successfully!</div>
          <div className="text-[12px] text-green-700">The professor will respond to your request soon.</div>
        </div>
      </div>
      <button onClick={onClose} className="border-none bg-transparent cursor-pointer p-1">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="#166534" strokeWidth="1.5" strokeLinecap="round" /></svg>
      </button>
    </div>
  )
}

function Skeleton({ h, w = '100%', r = 8 }) {
  return <div className="bg-slate-100 animate-pulse" style={{ height: h, width: w, borderRadius: r }} />
}

export default function ProfessorProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isGuest } = useAuth()

  const [prof,       setProf]       = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)
  const [showModal,  setShowModal]  = useState(false)
  const [sentSuccess,setSentSuccess]= useState(false)
  const [myRequests, setMyRequests] = useState([])

  useEffect(() => {
    const fetchProf = async () => {
      setLoading(true)
      try {
        const res = await api.get(`/api/faculty/${id}`)
        setProf(res.data?.data || res.data)
      } catch (err) { setError(err.message || 'Profile not found') }
      finally { setLoading(false) }
    }
    const fetchRequests = async () => {
      try {
        if (user?.role === 'student') {
          const res = await api.get('/api/requests')
          setMyRequests(res.data?.data || res.data || [])
        }
      } catch (err) { console.error('Failed to load requests:', err) }
    }
    fetchProf()
    fetchRequests()
  }, [id, user?.role, sentSuccess])

  const initials  = prof?.users
    ? (prof.users.full_name || 'FA').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : (prof?.full_name || 'FA').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  const fullName = prof?.users?.full_name || prof?.full_name || 'Faculty'

  if (loading) {
    return (
      <PageLayout>
        <div className="flex flex-col gap-5">
          <Skeleton h={200} r={24} />
          <div className="grid grid-cols-4 gap-3.5">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} h={100} r={16} />)}
          </div>
          <Skeleton h={300} r={16} />
        </div>
      </PageLayout>
    )
  }

  if (error || !prof) {
    return (
      <PageLayout>
        <div className="text-center py-20 px-5">
          <div className="text-[64px] mb-4">😕</div>
          <h1 className="text-[22px] font-bold t-primary">Profile not found</h1>
          <p className="text-[14px] text-slate-500 mt-2">{error || 'This professor profile does not exist or has not been set up yet.'}</p>
          <button onClick={() => navigate(-1)}
            className="mt-5 px-7 py-3 rounded-[40px] bg-brand border-none cursor-pointer text-[13px] font-bold text-white">
            ← Go Back
          </button>
        </div>
      </PageLayout>
    )
  }

  const researchInterests = Array.isArray(prof.research_interests)
    ? prof.research_interests
    : (prof.research_interests || '').split(',').map(s => s.trim()).filter(Boolean)
  const qualifications = prof.qualifications || []
  const publications   = prof.publications   || []
  const officeHours    = prof.office_hours   || []
  const academicLinks  = prof.academic_links || []

  return (
    <PageLayout>
      {showModal && (
        <RequestModal
          prof={{ ...prof, full_name: fullName }}
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); setSentSuccess(true) }}
        />
      )}

      <button onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 bg-transparent border-none cursor-pointer text-[13px] font-semibold text-slate-500 p-0 hover:text-brand transition-colors">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        Back to Professors
      </button>

      {sentSuccess && <SuccessBanner onClose={() => setSentSuccess(false)} />}

      {/* Profile Overview */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_1px_8px_rgba(0,0,0,.04)] p-8">
        <div className="flex items-start justify-between gap-6">
          {/* Avatar & Info */}
          <div className="flex items-start gap-7">
            <div className="w-[120px] h-[120px] rounded-[20px] bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center shrink-0 overflow-hidden relative">
              {prof.users?.avatar_url || prof.avatar_url
                ? <img src={prof.users?.avatar_url || prof.avatar_url} alt={fullName} className="w-full h-full object-cover" />
                : <span className="text-[36px] font-extrabold text-white">{initials}</span>
              }
              {prof.accepting_students && (
                <div className="absolute bottom-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white" />
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2.5">
                <h1 className="text-[28px] font-extrabold t-primary">{fullName}</h1>
                {(prof.users?.is_verified || prof.is_verified) && (
                  <div className="w-7 h-7 flex items-center justify-center shrink-0 drop-shadow-[0_2px_6px_rgba(16,185,129,0.3)]" title="Verified Faculty">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2L14.8 5.4L19.2 6L19.8 10.4L23 13L20 16L19.8 20.4L15.4 21L12 24L8.6 21L4.2 20.4L4 16L1 13L4.2 10.4L4.8 6L9.2 5.4L12 2Z" fill="#10b981" />
                      <path d="M8.5 12.5L10.5 14.5L15.5 9.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
                <span className="text-[11px] font-extrabold text-brand bg-indigo-50 px-3.5 py-1 rounded-[20px] uppercase tracking-[.05em]">
                  {prof.designation || 'Professor'}
                </span>
              </div>
              <p className="text-[16px] font-medium text-slate-600 mt-1">{prof.dept}</p>

              <div className="flex gap-10 mt-4.5">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[.05em] text-slate-400">Teacher Code</div>
                  <div className="text-[14px] font-bold text-brand mt-1">{prof.teacher_code || '—'}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[.05em] text-slate-400">Specialization</div>
                  <div className="text-[14px] font-bold t-primary mt-1 max-w-[300px] truncate">{researchInterests.join(', ') || '—'}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[.05em] text-slate-400">Location</div>
                  <div className="text-[14px] font-bold t-primary mt-1">{[prof.cabin_building, prof.cabin_room].filter(Boolean).join('-') || '—'}</div>
                </div>
              </div>

              <div className="mt-5">
                <div className="text-[10px] font-bold uppercase tracking-[.05em] text-slate-400">Official Email</div>
                <a href={`mailto:${prof.users?.email || prof.email}`}
                  className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-brand no-underline mt-1">
                  {prof.users?.email || prof.email}
                  <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M5 9a3 3 0 004.4 0l1.6-1.6a3 3 0 00-4.4-4.1L5.5 4.5" stroke="#4f46e5" strokeWidth="1.3" strokeLinecap="round" /><path d="M9 5a3 3 0 00-4.4 0L3 6.6a3 3 0 004.4 4.1l1-1" stroke="#4f46e5" strokeWidth="1.3" strokeLinecap="round" /></svg>
                </a>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-3 min-w-[200px]">
            {user?.role === 'student' && !isGuest && (
              <button onClick={() => setShowModal(true)}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-3xl border-none bg-brand cursor-pointer text-[14px] font-bold text-white shadow-[0_4px_16px_rgba(79,70,229,.3)]">
                <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><rect x="1" y="2" width="14" height="13" rx="2" stroke="#fff" strokeWidth="1.4" /><path d="M5 1v3M11 1v3M1 6h14M8 10h1M8 12h1" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" /></svg>
                Reserve Slot
              </button>
            )}
            <button
              onClick={() => { navigator.clipboard.writeText(window.location.href); alert('Profile link copied to clipboard!') }}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-3xl border-none bg-slate-100 cursor-pointer text-[14px] font-bold text-slate-600 hover:bg-slate-200 transition-colors">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="12" cy="4" r="2" stroke="currentColor" strokeWidth="1.4" /><circle cx="4" cy="8" r="2" stroke="currentColor" strokeWidth="1.4" /><circle cx="12" cy="12" r="2" stroke="currentColor" strokeWidth="1.4" /><path d="M6 7l4-2M6 9l4 2" stroke="currentColor" strokeWidth="1.4" /></svg>
              Share Profile
            </button>
          </div>
        </div>

        {prof.bio && (
          <div className="mt-8 pt-8 border-t border-slate-100">
            <div className="flex items-center gap-1.5 mb-3">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 15v-2a4 4 0 014-4h2a4 4 0 014 4v2" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" /><circle cx="8" cy="5" r="4" stroke="#94a3b8" strokeWidth="1.5" /></svg>
              <span className="text-[12px] font-bold uppercase tracking-[.08em] text-slate-500">Professional Bio</span>
            </div>
            <p className="text-[15px] text-slate-600 leading-[26px]">{prof.bio}</p>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-5">
        {[
          { label: 'Ongoing projects', value: prof.citations || 0, sub: 'Active' },
          { label: 'CONFERENCE', value: prof.conferences || 0, sub: 'Verified' },
          { label: 'PUBLICATIONS', value: prof.publications_count || 0, sub: 'Peer Reviewed' },
          { label: 'TEACHING EXP.', value: prof.teaching_exp_years ? `${prof.teaching_exp_years}y` : '-', sub: 'Core CS Specialist' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-[0_1px_4px_rgba(0,0,0,.04)] p-6">
            <div className="text-[11px] font-bold uppercase tracking-[.1em] text-slate-400 mb-2">{s.label}</div>
            <div className="text-[34px] font-extrabold t-primary">{s.value}</div>
            <div className="text-[13px] font-medium text-slate-400 mt-2">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Content grid */}
      <div className="grid gap-5 items-start" style={{ gridTemplateColumns: '2fr 1fr' }}>

        {/* Left Column */}
        <div className="flex flex-col gap-5">

          {/* Qualifications */}
          {qualifications.length > 0 && (
            <div className="bg-white rounded-[20px] border border-slate-100 shadow-[0_1px_4px_rgba(0,0,0,.04)] overflow-hidden">
              <div className="flex items-center gap-2.5 px-6 py-6 border-b border-slate-100">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>
                <span className="text-[18px] font-bold t-primary">Academic Qualifications</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-50">
                      {['Degree', 'Year', 'University', 'Division', 'CGPA'].map(h => (
                        <th key={h} className="text-[11px] font-extrabold uppercase tracking-[.08em] text-slate-400 px-6 py-3.5 text-left">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {qualifications.map((q, i) => (
                      <tr key={i} className={i > 0 ? 'border-t border-slate-100' : ''}>
                        <td className="text-[14px] font-bold t-primary px-6 py-[18px]">{q.degree}</td>
                        <td className="text-[14px] text-slate-500 px-6 py-[18px]">{q.year}</td>
                        <td className="text-[14px] text-slate-500 px-6 py-[18px]">{q.institution || q.university}</td>
                        <td className="text-[14px] text-slate-500 px-6 py-[18px]">{q.division || '—'}</td>
                        <td className="px-6 py-[18px] font-mono text-[14px] text-brand">{q.cgpa}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Publications */}
          {publications.length > 0 && (
            <div className="bg-white rounded-[20px] border border-slate-100 shadow-[0_1px_4px_rgba(0,0,0,.04)] overflow-hidden">
              <div className="flex items-center gap-2.5 px-6 py-6 border-b border-slate-100">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>
                <span className="text-[18px] font-bold t-primary">Journal Publications</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-50">
                      {['S.NO', 'Title of Paper', 'Journal & Volume', 'Year', 'Link'].map(h => (
                        <th key={h} className="text-[11px] font-extrabold uppercase tracking-[.08em] text-slate-400 px-6 py-3.5 text-left">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {publications.map((pub, i) => (
                      <tr key={i} className={i > 0 ? 'border-t border-slate-100' : ''}>
                        <td className="text-[14px] text-slate-400 px-6 py-[18px]">{i + 1}.</td>
                        <td className="text-[14px] font-semibold t-primary px-6 py-[18px] max-w-[280px]">{pub.title}</td>
                        <td className="text-[13px] text-slate-500 px-6 py-[18px] max-w-[180px]">{pub.journal}</td>
                        <td className="text-[14px] text-slate-500 px-6 py-[18px]">{pub.year}</td>
                        <td className="px-6 py-[18px] font-mono text-[12px] text-brand">
                          {pub.link || pub.doi ? <a href={pub.link || pub.doi} target="_blank" rel="noreferrer" className="text-brand underline">View Link</a> : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Weekly Timetable */}
          <div className="bg-white rounded-[20px] border border-slate-100 shadow-[0_1px_4px_rgba(0,0,0,.04)] p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                <span className="text-[18px] font-bold t-primary">Weekly Timetable</span>
              </div>
              <span className="text-[11px] font-extrabold text-white bg-slate-400 px-3 py-1 rounded-[20px] uppercase">Current Semester</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[600px]">
                <thead>
                  <tr>
                    <th className="text-[11px] font-extrabold text-slate-400 py-4 px-3 text-left border-b border-slate-200 w-[120px]">TIME</th>
                    {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(d => (
                      <th key={d} className="text-[11px] font-extrabold text-slate-400 py-4 px-3 text-center border-b border-slate-200">{d}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const ALL_TIME_SLOTS = [
                      '08:00 AM - 08:50 AM', '08:50 AM - 09:40 AM', '09:40 AM - 10:30 AM', '10:30 AM - 11:20 AM',
                      '11:20 AM - 12:10 PM', '12:10 PM - 01:00 PM', '01:00 PM - 01:50 PM', '01:50 PM - 02:40 PM',
                      '02:40 PM - 03:30 PM', '03:30 PM - 04:20 PM', '04:20 PM - 05:10 PM', '05:10 PM - 06:00 PM',
                      '06:00 PM - 06:30 PM'
                    ]
                    return ALL_TIME_SLOTS.map(time => (
                      <tr key={time}>
                        <td className="text-[12px] font-semibold text-slate-500 py-4 px-3 border-b border-slate-50 whitespace-nowrap align-top">{time}</td>
                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => {
                          const slot = prof.timetable?.find(t => t.time_slot?.trim() === time.trim() && t.day?.trim().toLowerCase() === d.toLowerCase())
                          const sc = slot ? (SLOT_CLS[slot.type?.toLowerCase()] || SLOT_DEFAULT) : null
                          return (
                            <td key={d} className="p-2 border-b border-slate-50 text-center align-top h-20">
                              {slot && (
                                <div className={`${sc.bg} border ${sc.border} px-3 py-3 rounded-2xl inline-block w-full max-w-[140px] box-border`}>
                                  <div className={`text-[9px] font-extrabold uppercase tracking-[.05em] ${sc.tc}`}>{slot.type || 'Lecture'}</div>
                                  <div className={`text-[13px] font-extrabold t-primary mt-0.5 line-clamp-2`}>{slot.course || slot.subject}</div>
                                  <div className={`text-[11px] font-medium text-slate-500 mt-1`}>{slot.room_or_link || slot.room}</div>
                                </div>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    ))
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-5">

          {/* Visiting Info */}
          <div className="bg-white rounded-[20px] border border-slate-100 p-6 shadow-[0_1px_4px_rgba(0,0,0,.04)]">
            <div className="flex items-center gap-2.5 mb-6">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
              <span className="text-[18px] font-bold t-primary">Visiting Info</span>
            </div>

            <div className="flex justify-between pb-4 border-b border-slate-50">
              <span className="text-[13px] font-medium text-slate-600">Cabin Number</span>
              <span className="text-[15px] font-bold t-primary">{[prof.cabin_building, prof.cabin_room].filter(Boolean).join('-') || '—'}</span>
            </div>

            <div className="flex flex-col gap-2.5 py-4 border-b border-slate-50">
              <span className="text-[13px] font-medium text-slate-600">Visiting Hours</span>
              <div className="flex flex-col gap-2">
                {officeHours.length > 0
                  ? officeHours.map((oh, i) => (
                    <div key={i} className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[14px] font-bold t-primary">{oh.day}</span>
                        <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-[20px] ${oh.mode === 'Virtual' ? 'text-brand bg-indigo-50' : 'text-green-600 bg-green-50'}`}>
                          {oh.mode === 'Virtual' ? '🔗 VIRTUAL' : '📍 IN-PERSON'}
                        </span>
                      </div>
                      <div className="text-[13px] font-semibold text-brand">{oh.time_slot}</div>
                      {oh.room_or_link && (
                        <div className="mt-1.5">
                          {oh.mode === 'Virtual' ? (
                            <a href={oh.room_or_link.startsWith('http') ? oh.room_or_link : `https://${oh.room_or_link}`}
                              target="_blank" rel="noreferrer" className="text-[13px] text-sky-500 underline">
                              Join Meeting Link
                            </a>
                          ) : (
                            <span className="text-[13px] text-slate-500">{oh.room_or_link}</span>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                  : <span className="text-[13px] text-slate-400">Not set</span>
                }
              </div>
            </div>

            <div className="flex justify-between pt-4 items-center">
              <span className="text-[13px] font-medium text-slate-600">Availability</span>
              <span className="text-[10px] font-extrabold text-emerald-500 bg-green-50 px-3 py-1 rounded-[20px]">● AVAILABLE NOW</span>
            </div>
          </div>

          {/* Awards */}
          {(prof.awards || []).length > 0 && (
            <div className="bg-white rounded-[20px] border border-slate-100 p-6 shadow-[0_1px_4px_rgba(0,0,0,.04)]">
              <div className="flex items-center gap-2.5 mb-4">
                <span className="text-[20px]">🏆</span>
                <span className="text-[18px] font-bold t-primary">Awards</span>
              </div>
              <div className="flex flex-col gap-4">
                {prof.awards.map((awr, i) => (
                  <div key={i}>
                    <div className="flex justify-between items-start">
                      <div className="text-[14px] font-bold t-primary">{awr.title}</div>
                      <div className="text-[11px] font-semibold text-slate-400">{awr.year}</div>
                    </div>
                    <div className="text-[12px] text-slate-500 mt-0.5">{awr.org}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Research Openings */}
          {prof.accepting_students && (
            <div className="rounded-[20px] border border-indigo-200 p-6 bg-gradient-to-br from-indigo-50 to-indigo-100">
              <div className="flex items-center gap-2.5 mb-4">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>
                <span className="text-[18px] font-bold t-primary">Research Openings</span>
              </div>
              <p className="text-[14px] text-slate-600 leading-[22px]">
                Looking for highly motivated graduate students interested in{' '}
                {researchInterests.length > 0
                  ? researchInterests.map((r, idx) => <span key={idx} className="font-bold t-primary">{r} </span>)
                  : 'my research areas.'
                }
                Prior experience is mandatory.
              </p>
              {user?.role === 'student' && (
                <button onClick={() => setShowModal(true)}
                  className="w-full mt-6 py-3.5 rounded-3xl border-none bg-brand cursor-pointer text-[14px] font-bold text-white shadow-[0_4px_16px_rgba(79,70,229,.3)] flex items-center justify-center gap-2">
                  Contact for Opportunity →
                </button>
              )}
            </div>
          )}

          {/* Cabin Location */}
          <div className="bg-white rounded-[20px] border border-slate-100 p-6 shadow-[0_1px_4px_rgba(0,0,0,.04)]">
            <div className="flex items-center gap-2.5 mb-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
              <span className="text-[18px] font-bold t-primary">Cabin Location</span>
            </div>
            <div className="h-[140px] bg-slate-200 rounded-2xl relative overflow-hidden flex items-center justify-center">
              <div className="absolute inset-0" style={{ background: 'repeating-linear-gradient(45deg, #cbd5e1 0, #cbd5e1 2px, transparent 2px, transparent 8px)' }} />
              <div className="z-10 w-9 h-9 rounded-full bg-brand flex items-center justify-center border-[3px] border-white shadow-[0_2px_8px_rgba(0,0,0,.2)]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
              </div>
              <div className="absolute bottom-2.5 left-2.5 bg-white px-3.5 py-1.5 rounded-[20px] text-[11px] font-extrabold t-primary shadow-[0_2px_8px_rgba(0,0,0,.1)]">
                BLOCK {prof.cabin_building || 'UNKNOWN'} - {prof.cabin_floor || 'GROUND'} FLOOR
              </div>
            </div>
          </div>

          {/* Academic Links */}
          <div className="bg-white rounded-[20px] border border-slate-100 p-6 shadow-[0_1px_4px_rgba(0,0,0,.04)]">
            <div className="text-[18px] font-bold t-primary mb-4">Academic Links</div>
            <div className="flex flex-col gap-3">
              {[
                { label: 'Email Contact', url: prof.users?.email || prof.email ? `mailto:${prof.users?.email || prof.email}` : null },
                ...academicLinks.filter(l => l.url).map(l => ({ label: l.label, url: l.url }))
              ].filter(l => l.url).map((l, i) => (
                <a key={i} href={l.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 no-underline">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
                  </div>
                  <div className="text-[14px] font-bold t-primary">{l.label}</div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="pt-4 border-t border-slate-200 flex justify-between text-[11px] text-slate-400">
        <span>© 2025 SnapLocate Education Platform · Academic Directory</span>
        <div className="flex gap-4">
          {['Privacy Policy', 'Campus Support', 'Contact Admin'].map(l => (
            <a key={l} href="#" className="text-[11px] font-semibold text-slate-500 no-underline">{l}</a>
          ))}
        </div>
      </div>
    </PageLayout>
  )
}
