import { useState, useEffect, useCallback } from 'react'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'
import { GraduationCap, Search, Mail, Clock, CheckCircle, XCircle, AlertCircle, ShieldCheck, BookOpen } from 'lucide-react'

const pjs = (size, weight, lh, color) => ({
  fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: size, fontWeight: weight, lineHeight: lh, color,
})

const statusStyle = {
  accepted: { bg: '#dcfce7', color: '#16a34a', border: '#bbf7d0', label: 'Accepted' },
  rejected: { bg: '#fee2e2', color: '#dc2626', border: '#fecaca', label: 'Rejected' },
  pending:  { bg: '#fef3c7', color: '#d97706', border: '#fde68a', label: 'Pending'  },
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days < 1)  return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7)  return days + 'd ago'
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
        { label: 'Total Assigned',   value: allocStats.total,   bg: '#eef2ff', color: '#4f46e5' },
        { label: 'With Subject Tag', value: allocStats.withSub, bg: '#ecfdf5', color: '#059669' },
        { label: 'Added This Week',  value: allocStats.recent,  bg: '#fffbeb', color: '#d97706' },
      ]
    : [
        { label: 'Total Students',    value: reqStats.total,    bg: '#eef2ff', color: '#4f46e5' },
        { label: 'Requests Accepted', value: reqStats.accepted, bg: '#ecfdf5', color: '#059669' },
        { label: 'Pending Review',    value: reqStats.pending,  bg: '#fffbeb', color: '#d97706' },
      ]

  return (
    <PageLayout>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 44, height: 44, borderRadius: 14, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <GraduationCap size={22} color="#d97706" />
        </div>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#0f172a', margin: 0 }}>My Students</h1>
          <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>
            {isAllocated ? 'Students assigned to you by the administration.' : 'Students who have interacted with you through requests.'}
          </p>
        </div>
      </div>

      {source === 'allocated' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 14, padding: '12px 18px' }}>
          <ShieldCheck size={16} color="#16a34a" />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#15803d' }}>Admin-allocated list — these students are officially assigned to you.</span>
        </div>
      )}
      {source === 'requests' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 14, padding: '12px 18px' }}>
          <AlertCircle size={16} color="#d97706" />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#92400e' }}>Showing students based on past requests. Admin-allocated list will appear here once configured.</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {statsData.map((s, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 20, padding: '20px 24px', border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
            <div style={pjs(12, 600, '16px', '#64748b')}>{s.label}</div>
            <div style={{ ...pjs(28, 800, '36px', s.color), marginTop: 6 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9', boxShadow: '0 4px 24px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f8fafc' }}>
          <div style={{ position: 'relative', maxWidth: 380 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              style={{ width: '100%', padding: '9px 16px 9px 36px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              onFocus={e => e.target.style.borderColor = '#4f46e5'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', ...pjs(14, 500, '20px', '#94a3b8') }}>Loading students...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '60px 24px', textAlign: 'center' }}>
            <GraduationCap size={40} color="#e2e8f0" style={{ margin: '0 auto 12px', display: 'block' }} />
            <div style={pjs(15, 600, '20px', '#0f172a')}>{search ? 'No students match your search' : 'No students yet'}</div>
            <div style={{ ...pjs(13, 400, '18px', '#94a3b8'), marginTop: 4 }}>
              {search ? 'Try a different name or email.' : isAllocated ? 'Admin will assign students to you.' : 'Students who send you requests will appear here.'}
            </div>
          </div>
        ) : isAllocated ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  {['Student', 'Email', 'Subject / Class', 'Assigned On'].map(h => (
                    <th key={h} style={{ padding: '13px 20px', textAlign: 'left', ...pjs(11, 700, '14px', '#64748b'), textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => {
                  const initials = (s.full_name || 'S').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                  return (
                    <tr key={s.id || i} style={{ borderBottom: '1px solid #f8fafc' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 36, height: 36, borderRadius: 12, background: 'linear-gradient(135deg, #6366f1, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                            {s.avatar_url ? <img src={s.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={pjs(13, 700, '16px', '#fff')}>{initials}</span>}
                          </div>
                          <span style={pjs(14, 700, '18px', '#0f172a')}>{s.full_name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Mail size={13} color="#94a3b8" />
                          <span style={pjs(13, 400, '18px', '#475569')}>{s.email}</span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        {s.subject ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fdf4ff', border: '1px solid #e9d5ff', padding: '4px 10px', borderRadius: 8, ...pjs(12, 700, '16px', '#7e22ce') }}>
                            <BookOpen size={11} /> {s.subject}
                          </span>
                        ) : <span style={pjs(13, 400, '18px', '#cbd5e1')}>—</span>}
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Clock size={13} color="#94a3b8" />
                          <span style={pjs(13, 400, '18px', '#64748b')}>{s.assigned_at ? timeAgo(s.assigned_at) : '—'}</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  {['Student', 'Email', 'Last Request', 'Status', 'Last Active', 'Total Requests'].map(h => (
                    <th key={h} style={{ padding: '13px 20px', textAlign: 'left', ...pjs(11, 700, '14px', '#64748b'), textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => {
                  const ss = statusStyle[s.last_request_status] || statusStyle.pending
                  const initials = (s.full_name || 'S').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                  return (
                    <tr key={s.id || i} style={{ borderBottom: '1px solid #f8fafc' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 36, height: 36, borderRadius: 12, background: 'linear-gradient(135deg, #6366f1, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                            {s.avatar_url ? <img src={s.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={pjs(13, 700, '16px', '#fff')}>{initials}</span>}
                          </div>
                          <span style={pjs(14, 700, '18px', '#0f172a')}>{s.full_name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Mail size={13} color="#94a3b8" />
                          <span style={pjs(13, 400, '18px', '#475569')}>{s.email}</span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 20px' }}><span style={pjs(13, 500, '18px', '#475569')}>{s.last_request_type || '—'}</span></td>
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: ss.bg, color: ss.color, border: '1px solid ' + ss.border, padding: '4px 10px', borderRadius: 8, ...pjs(11, 700, '14px', ss.color) }}>
                          {ss.label}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Clock size={13} color="#94a3b8" />
                          <span style={pjs(13, 400, '18px', '#64748b')}>{s.last_interaction ? timeAgo(s.last_interaction) : '—'}</span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{ ...pjs(13, 700, '18px', '#4f46e5'), background: '#eef2ff', padding: '4px 10px', borderRadius: 8 }}>{s.total_requests}</span>
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
