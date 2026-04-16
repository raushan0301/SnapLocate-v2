import { useState, useEffect, useCallback } from 'react'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'
import { ClipboardList, Clock, CheckCircle, XCircle } from 'lucide-react'

const pjs = (size, weight, lh, color) => ({
  fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: size, fontWeight: weight, lineHeight: lh, color,
})
const inter = (size, weight, lh, color) => ({
  fontFamily: "'Inter', sans-serif", fontSize: size, fontWeight: weight, lineHeight: lh, color,
})

const types = ['All', 'Office Hour', 'Attendance', 'Grade Review', 'Extension', 'Research Query']

export default function FacultyRequests() {
  const [requests, setRequests] = useState([])
  const [filter, setFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [apiLoading, setApiLoading] = useState(true)

  const loadRequests = useCallback(async () => {
    try {
      const res = await api.get('/api/requests/faculty')
      if (res.data) {
          setRequests(res.data.map(r => ({
            id:     r.id,
            name:   r.users?.full_name || 'Student',
            type:   r.type || 'Request',
            detail: r.detail || '—',
            course: r.courses?.code || 'General',
            status: r.status || 'pending',
            init:   (r.users?.full_name || 'S').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(),
            bg:     'linear-gradient(135deg,#a78bfa,#7c3aed)',
            date:   new Date(r.created_at).toLocaleDateString('en-US', { month:'short', day:'numeric' }),
          })))
      }
    } catch (err) {
      console.error('Failed to load requests:', err)
    } finally {
      setApiLoading(false)
    }
  }, [])

  useEffect(() => { loadRequests() }, [loadRequests])

  const filtered = requests.filter(r =>
    (filter === 'All' || r.type === filter) &&
    (statusFilter === 'All' || r.status === statusFilter)
  )

  const updateStatus = async (id, status) => {
    // optimistic update
    setRequests(rs => rs.map(r => r.id === id ? { ...r, status } : r))
    try {
      const action = status === 'accepted' ? 'accept' : 'reject'
      await api.patch(`/api/requests/${id}/${action}`)
    } catch { /* already updated UI */ }
  }

  const acceptAll = async () => {
    const pending = requests.filter(r => r.status === 'pending')
    if (pending.length === 0) return
    
    // Optimistic UI update
    setRequests(rs => rs.map(r => r.status === 'pending' ? { ...r, status: 'accepted' } : r))
    
    try {
      await Promise.all(pending.map(r => api.patch(`/api/requests/${r.id}/accept`)))
    } catch (err) {
      console.error("Accept all error:", err)
      loadRequests() // Rollback on error
    }
  }

  const statusStyle = (s) => ({
    pending:  { bg: '#fef3c7', color: '#d97706', label: 'Pending' },
    accepted: { bg: '#dcfce7', color: '#16a34a', label: 'Approved' },
    rejected: { bg: '#fee2e2', color: '#ef4444', label: 'Rejected' },
  })[s] || {}

  const pendingCount = requests.filter(r => r.status === 'pending').length

  return (
    <PageLayout>
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={pjs(26, 800, '34px', '#0f172a')}>Student Requests</h1>
          <p style={{ ...pjs(13, 400, '18px', '#94a3b8'), marginTop: 4 }}>Manage and respond to student requests</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {pendingCount > 0 && (
            <button onClick={acceptAll} style={{ padding: '10px 20px', borderRadius: 12, border: 'none', background: '#4f46e5', cursor: 'pointer', ...pjs(13, 700, '18px', '#ffffff') }}>
              Accept All ({pendingCount})
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {[
          { label: 'Total Requests', value: requests.length, bg: '#eef2ff', color: '#4f46e5', icon: <ClipboardList size={22} color="#4f46e5" /> },
          { label: 'Pending', value: requests.filter(r => r.status === 'pending').length, bg: '#fef3c7', color: '#d97706', icon: <Clock size={22} color="#d97706" /> },
          { label: 'Approved', value: requests.filter(r => r.status === 'accepted').length, bg: '#dcfce7', color: '#16a34a', icon: <CheckCircle size={22} color="#16a34a" /> },
          { label: 'Rejected', value: requests.filter(r => r.status === 'rejected').length, bg: '#fee2e2', color: '#ef4444', icon: <XCircle size={22} color="#ef4444" /> },
        ].map((s, i) => (
          <div key={i} style={{ background: '#ffffff', border: '1px solid #f1f5f9', borderRadius: 16, padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{s.icon}</div>
            <div>
              <div style={pjs(26, 800, '32px', s.color)}>{s.value}</div>
              <div style={pjs(12, 500, '16px', '#64748b')}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {types.map(t => (
            <button key={t} onClick={() => setFilter(t)} style={{
              padding: '8px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
              background: filter === t ? '#4f46e5' : '#f1f5f9',
              ...pjs(12, 600, '16px', filter === t ? '#ffffff' : '#64748b'),
              transition: 'all 0.15s',
            }}>{t}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
          {['All', 'pending', 'accepted', 'rejected'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} style={{
              padding: '7px 14px', borderRadius: 10, border: `1px solid ${statusFilter === s ? '#4f46e5' : '#e2e8f0'}`, cursor: 'pointer',
              background: statusFilter === s ? '#eef2ff' : '#ffffff',
              ...pjs(12, 600, '16px', statusFilter === s ? '#4f46e5' : '#64748b'),
            }}>{s === 'accepted' ? 'Approved' : s.charAt(0).toUpperCase() + s.slice(1)}</button>
          ))}
        </div>
      </div>

      {/* Requests list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 20, border: '1px dashed #e2e8f0' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📬</div>
            <div style={pjs(16, 600, '22px', '#0f172a')}>No requests found</div>
            <div style={{ ...pjs(13, 400, '18px', '#94a3b8'), marginTop: 4 }}>Try changing your filters or check back later.</div>
          </div>
        )}
        {filtered.map((r) => {
          const ss = statusStyle(r.status)
          return (
            <div key={r.id} style={{ 
              display: 'flex', alignItems: 'center', gap: 20, padding: '20px 24px', 
              background: '#ffffff', border: '1px solid #f1f5f9', borderRadius: 20, 
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)', position: 'relative', overflow: 'hidden'
            }}>
              {/* Status accent bar */}
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: ss.color }} />

              {/* Avatar */}
              <div style={{ 
                width: 50, height: 50, borderRadius: 16, background: r.bg, 
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                boxShadow: '0 4px 12px rgba(124,58,237,0.15)'
              }}>
                <span style={pjs(16, 700, '22px', '#ffffff')}>{r.init}</span>
              </div>

              {/* Info Group */}
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={pjs(15, 700, '20px', '#0f172a')}>{r.name}</span>
                  <span style={{ ...pjs(11, 400, '15px', '#94a3b8') }}>• Student Request</span>
                  <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={inter(11, 500, '15px', '#94a3b8')}>{r.date}</span>
                    <span style={{ 
                      ...pjs(10, 800, '14px', ss.color), background: ss.bg, 
                      padding: '4px 12px', borderRadius: 20, letterSpacing: '0.05em' 
                    }}>{ss.label}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ ...pjs(13, 700, '18px', '#4f46e5') }}>{r.type}</span>
                    <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#cbd5e1' }} />
                    <span style={pjs(12, 500, '16px', '#64748b')}>Details below</span>
                  </div>
                  <div style={{ 
                    ...pjs(13, 400, '20px', '#475569'), 
                    wordBreak: 'break-word', 
                    whiteSpace: 'pre-wrap',
                    background: '#f8fafc',
                    padding: '10px 14px',
                    borderRadius: 12,
                    marginTop: 4,
                    border: '1px solid #f1f5f9'
                  }}>
                    {r.detail}
                  </div>
                </div>
              </div>

              {/* Action buttons (fixed on right, only for pending) */}
              {r.status === 'pending' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 10 }}>
                  <button 
                    onClick={() => updateStatus(r.id, 'accepted')} 
                    title="Approve"
                    style={{ 
                      width: 38, height: 38, borderRadius: 12, background: '#dcfce7', 
                      border: 'none', cursor: 'pointer', display: 'flex', 
                      alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' 
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.background = '#bbf7d0' }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = '#dcfce7' }}
                  >
                    <svg width="18" height="18" viewBox="0 0 14 14" fill="none"><path d="M2.5 7l3.5 3.5 5.5-7" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                  <button 
                    onClick={() => updateStatus(r.id, 'rejected')} 
                    title="Reject"
                    style={{ 
                      width: 38, height: 38, borderRadius: 12, background: '#fee2e2', 
                      border: 'none', cursor: 'pointer', display: 'flex', 
                      alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' 
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.background = '#fecaca' }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = '#fee2e2' }}
                  >
                    <svg width="16" height="16" viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3l-8 8" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round"/></svg>
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </PageLayout>
  )
}
