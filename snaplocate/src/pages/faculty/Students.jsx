import { useState, useEffect, useCallback } from 'react'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'
import { GraduationCap, Search, Mail, Clock, ShieldCheck, AlertCircle, BookOpen } from 'lucide-react'

const STATUS_CLS = {
  accepted: { badge: 'bg-green-100 text-green-600 border border-green-200', label: 'Accepted' },
  rejected:  { badge: 'bg-red-100 text-red-600 border border-red-200',      label: 'Rejected' },
  pending:   { badge: 'bg-amber-100 text-amber-600 border border-amber-200', label: 'Pending'  },
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days < 1)   return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7)   return days + 'd ago'
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function FacultyStudents() {
  const [students, setStudents] = useState([])
  const [source, setSource]     = useState(null)
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')

  const fetchStudents = useCallback(async () => {
    try {
      const res = await api.get('/api/faculty/my-students')
      if (res.success) {
        setStudents(res.data || [])
        setSource(res.source || null)
      }
    } catch (err) {
      console.error('Failed to load students:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchStudents() }, [fetchStudents])

  const filtered = students.filter(s =>
    !search ||
    s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase())
  )

  const isAllocated = source === 'allocated'

  const allocStats = {
    total:   students.length,
    withSub: students.filter(s => s.subject).length,
    recent:  students.filter(s => s.assigned_at && (Date.now() - new Date(s.assigned_at).getTime()) < 7 * 86400000).length,
  }
  const reqStats = {
    total:    students.length,
    accepted: students.filter(s => s.last_request_status === 'accepted').length,
    pending:  students.filter(s => s.last_request_status === 'pending').length,
  }

  const statsData = isAllocated
    ? [
        { label: 'Total Assigned',   value: allocStats.total,   cls: 'text-brand' },
        { label: 'With Subject Tag', value: allocStats.withSub, cls: 'text-emerald-600' },
        { label: 'Added This Week',  value: allocStats.recent,  cls: 'text-amber-600' },
      ]
    : [
        { label: 'Total Students',    value: reqStats.total,    cls: 'text-brand' },
        { label: 'Requests Accepted', value: reqStats.accepted, cls: 'text-emerald-600' },
        { label: 'Pending Review',    value: reqStats.pending,  cls: 'text-amber-600' },
      ]

  return (
    <PageLayout>
      <div className="flex items-center gap-4">
        <div className="w-11 h-11 rounded-[14px] bg-amber-100 flex items-center justify-center">
          <GraduationCap size={22} color="#d97706" />
        </div>
        <div>
          <h1 className="text-[26px] font-bold t-primary m-0">My Students</h1>
          <p className="text-[14px] t-muted m-0">
            {isAllocated ? 'Students assigned to you by the administration.' : 'Students who have interacted with you through requests.'}
          </p>
        </div>
      </div>

      {source === 'allocated' && (
        <div className="flex items-center gap-2.5 bg-green-50 border border-green-200 rounded-[14px] px-[18px] py-3">
          <ShieldCheck size={16} color="#16a34a" />
          <span className="text-[13px] font-semibold text-green-700">Admin-allocated list — these students are officially assigned to you.</span>
        </div>
      )}
      {source === 'requests' && (
        <div className="flex items-center gap-2.5 bg-amber-50 border border-amber-200 rounded-[14px] px-[18px] py-3">
          <AlertCircle size={16} color="#d97706" />
          <span className="text-[13px] font-semibold text-amber-800">Showing students based on past requests. Admin-allocated list will appear here once configured.</span>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        {statsData.map((s, i) => (
          <div key={i} className="bg-white rounded-[20px] px-6 py-5 border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
            <div className="text-[12px] font-semibold t-muted">{s.label}</div>
            <div className={`text-[28px] font-extrabold mt-1.5 ${s.cls}`}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[20px] border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-50">
          <div className="relative max-w-[380px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full py-[9px] pl-9 pr-4 rounded-[10px] border-[1.5px] border-slate-200 text-[14px] outline-none box-border focus:border-brand transition-colors"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-[60px] text-center text-[14px] font-medium t-muted">Loading students...</div>
        ) : filtered.length === 0 ? (
          <div className="py-[60px] px-6 text-center">
            <GraduationCap size={40} color="#e2e8f0" className="mx-auto mb-3 block" />
            <div className="text-[15px] font-semibold t-primary">{search ? 'No students match your search' : 'No students yet'}</div>
            <div className="text-[13px] t-muted mt-1">
              {search ? 'Try a different name or email.' : isAllocated ? 'Admin will assign students to you.' : 'Students who send you requests will appear here.'}
            </div>
          </div>
        ) : isAllocated ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {['Student', 'Email', 'Subject / Class', 'Assigned On'].map(h => (
                    <th key={h} className="px-5 py-[13px] text-left text-[11px] font-bold text-slate-500 uppercase tracking-[0.05em] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => {
                  const initials = (s.full_name || 'S').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                  return (
                    <tr key={s.id || i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-[14px]">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-[12px] flex items-center justify-center shrink-0 overflow-hidden" style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)' }}>
                            {s.avatar_url ? <img src={s.avatar_url} alt="" className="w-full h-full object-cover" /> : <span className="text-[13px] font-bold text-white">{initials}</span>}
                          </div>
                          <span className="text-[14px] font-bold t-primary">{s.full_name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-[14px]">
                        <div className="flex items-center gap-1.5">
                          <Mail size={13} color="#94a3b8" />
                          <span className="text-[13px] text-slate-600">{s.email}</span>
                        </div>
                      </td>
                      <td className="px-5 py-[14px]">
                        {s.subject ? (
                          <span className="inline-flex items-center gap-1.5 bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-[8px] text-[12px] font-bold text-purple-700">
                            <BookOpen size={11} /> {s.subject}
                          </span>
                        ) : <span className="text-[13px] text-slate-300">—</span>}
                      </td>
                      <td className="px-5 py-[14px]">
                        <div className="flex items-center gap-1.5">
                          <Clock size={13} color="#94a3b8" />
                          <span className="text-[13px] t-muted">{s.assigned_at ? timeAgo(s.assigned_at) : '—'}</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {['Student', 'Email', 'Last Request', 'Status', 'Last Active', 'Total Requests'].map(h => (
                    <th key={h} className="px-5 py-[13px] text-left text-[11px] font-bold text-slate-500 uppercase tracking-[0.05em] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => {
                  const ss = STATUS_CLS[s.last_request_status] || STATUS_CLS.pending
                  const initials = (s.full_name || 'S').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                  return (
                    <tr key={s.id || i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-[14px]">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-[12px] flex items-center justify-center shrink-0 overflow-hidden" style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)' }}>
                            {s.avatar_url ? <img src={s.avatar_url} alt="" className="w-full h-full object-cover" /> : <span className="text-[13px] font-bold text-white">{initials}</span>}
                          </div>
                          <span className="text-[14px] font-bold t-primary">{s.full_name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-[14px]">
                        <div className="flex items-center gap-1.5">
                          <Mail size={13} color="#94a3b8" />
                          <span className="text-[13px] text-slate-600">{s.email}</span>
                        </div>
                      </td>
                      <td className="px-5 py-[14px]"><span className="text-[13px] font-medium text-slate-600">{s.last_request_type || '—'}</span></td>
                      <td className="px-5 py-[14px]">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-[8px] text-[11px] font-bold ${ss.badge}`}>
                          {ss.label}
                        </span>
                      </td>
                      <td className="px-5 py-[14px]">
                        <div className="flex items-center gap-1.5">
                          <Clock size={13} color="#94a3b8" />
                          <span className="text-[13px] t-muted">{s.last_interaction ? timeAgo(s.last_interaction) : '—'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-[14px]">
                        <span className="text-[13px] font-bold text-brand bg-indigo-50 px-2.5 py-1 rounded-[8px]">{s.total_requests}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageLayout>
  )
}
