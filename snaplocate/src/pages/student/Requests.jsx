import { useState, useEffect, useCallback } from 'react'
import PageLayout from '../../components/PageLayout'
import { useAuth } from '../../context/AuthContext'
import api from '../../lib/api'
import { Plus, Search, X } from 'lucide-react'

const pjs = (size, weight, lh, color) => ({
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  fontSize: size, fontWeight: weight, lineHeight: lh, color,
})

const REQUEST_TYPES = ['Office Hour', 'Attendance', 'Grade Review', 'Extension', 'Research Query']

const statusConfig = {
  pending:  { bg: '#fffbeb', color: '#d97706', border: '#fde68a', label: 'PENDING' },
  accepted: { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0', label: 'ACCEPTED' },
  rejected: { bg: '#fef2f2', color: '#ef4444', border: '#fecaca', label: 'REJECTED' },
}

export default function StudentRequests() {
  const { user } = useAuth()
  const [requests, setRequests] = useState([])
  const [loading, setLoading]   = useState(true)
  const [showModal, setShowModal] = useState(false)

  // New request form state
  const [faculty, setFaculty]           = useState([])
  const [facultySearch, setFacultySearch] = useState('')
  const [selectedFaculty, setSelectedFaculty] = useState(null)
  const [reqType, setReqType]           = useState(REQUEST_TYPES[0])
  const [detail, setDetail]             = useState('')
  const [submitting, setSubmitting]     = useState(false)
  const [facultyLoading, setFacultyLoading] = useState(false)

  const fetchRequests = useCallback(async () => {
    try {
      const res = await api.get('/api/requests')
      setRequests(res.data?.data || res.data || [])
    } catch (err) {
      console.error('Failed to load requests:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchRequests() }, [fetchRequests])

  // Load faculty list when modal opens
  useEffect(() => {
    if (!showModal) return
    setFacultyLoading(true)
    api.get('/api/faculty')
      .then(res => { if (res.success) setFaculty(res.data || []) })
      .catch(() => {})
      .finally(() => setFacultyLoading(false))
  }, [showModal])

  const filteredFaculty = faculty.filter(f =>
    !facultySearch ||
    f.full_name?.toLowerCase().includes(facultySearch.toLowerCase()) ||
    f.dept?.toLowerCase().includes(facultySearch.toLowerCase()) ||
    f.designation?.toLowerCase().includes(facultySearch.toLowerCase())
  )

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    if (!selectedFaculty || !selectedFaculty.user_id) return
    
    setSubmitting(true)
    try {
      await api.post('/api/requests', {
        faculty_profile_id: selectedFaculty.id,
        type: reqType,
        detail: detail.trim(),
      })
      setShowModal(false)
      setSelectedFaculty(null)
      setFacultySearch('')
      setReqType(REQUEST_TYPES[0])
      setDetail('')
      fetchRequests()
    } catch (err) {
      alert('Failed to send request. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this request?')) return
    const prev = [...requests]
    setRequests(r => r.filter(x => x.id !== id))
    try {
      await api.delete(`/api/requests/${id}`)
    } catch {
      alert('Failed to cancel')
      setRequests(prev)
    }
  }

  const pendingCount  = requests.filter(r => r.status === 'pending').length
  const acceptedCount = requests.filter(r => r.status === 'accepted').length

  return (
    <PageLayout>
      <div style={{ maxWidth: 860, margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '24px 32px', borderRadius: 24, boxShadow: '0 1px 4px rgba(0,0,0,.04)', border: '1px solid #f1f5f9' }}>
          <div>
            <h1 style={{ ...pjs(24, 700, '32px', '#0f172a'), margin: 0 }}>My Requests</h1>
            <p style={{ ...pjs(14, 500, '20px', '#64748b'), margin: '4px 0 0' }}>
              {pendingCount > 0 ? `${pendingCount} pending · ` : ''}{acceptedCount} accepted
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 12, background: '#4f46e5', color: '#fff', border: 'none', ...pjs(14, 700, '20px', '#fff'), cursor: 'pointer' }}
          >
            <Plus size={16} /> New Request
          </button>
        </div>

        {/* List */}
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', ...pjs(16, 500, '24px', '#94a3b8') }}>Loading requests...</div>
        ) : requests.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', background: '#fff', borderRadius: 24, border: '1px dashed #cbd5e1' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📬</div>
            <h2 style={pjs(18, 700, '24px', '#0f172a')}>No requests yet</h2>
            <p style={{ ...pjs(14, 400, '20px', '#64748b'), margin: '8px 0 20px' }}>Send a request to a professor to get started.</p>
            <button
              onClick={() => setShowModal(true)}
              style={{ padding: '10px 24px', borderRadius: 12, background: '#4f46e5', color: '#fff', border: 'none', ...pjs(14, 700, '20px', '#fff'), cursor: 'pointer' }}
            >
              + New Request
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {requests.map(req => {
              const sc = statusConfig[req.status] || statusConfig.pending
              return (
                <div key={req.id} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '20px 24px', background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,.02)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flex: 1, minWidth: 0 }}>
                    <div style={{ width: 48, height: 48, background: '#f8fafc', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                      <img
                        src={req.faculty_profile?.users?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(req.faculty_profile?.users?.full_name || 'F')}&background=eef2ff&color=4f46e5`}
                        alt="Faculty"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                        <span style={pjs(15, 700, '20px', '#0f172a')}>{req.type}</span>
                        <span style={{ ...pjs(11, 600, '14px', '#94a3b8') }}>· {new Date(req.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                      </div>
                      <div style={{ ...pjs(13, 500, '20px', '#475569'), wordBreak: 'break-word' }}>{req.detail || 'No additional details'}</div>
                      <div style={{ ...pjs(12, 600, '16px', '#4f46e5'), marginTop: 6 }}>
                        To: {req.faculty_profile?.users?.full_name || 'Faculty Member'}
                      </div>
                      {req.notes && (
                        <div style={{ marginTop: 8, padding: '8px 12px', background: '#f8fafc', borderRadius: 8, borderLeft: '3px solid #4f46e5' }}>
                          <span style={pjs(12, 700, '16px', '#64748b')}>Faculty note: </span>
                          <span style={pjs(12, 400, '16px', '#475569')}>{req.notes}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12, flexShrink: 0, marginLeft: 20 }}>
                    <span style={{
                      ...pjs(10, 800, '14px', sc.color),
                      background: sc.bg, border: `1px solid ${sc.border}`,
                      padding: '5px 12px', borderRadius: 20, letterSpacing: '.06em',
                    }}>
                      {sc.label}
                    </span>
                    {req.status === 'pending' && (
                      <button onClick={() => handleCancel(req.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', ...pjs(12, 600, '16px', '#94a3b8'), textDecoration: 'underline', padding: 0 }}>
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* New Request Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 28, width: '100%', maxWidth: 520, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 40px rgba(0,0,0,0.14)' }}>
            {/* Modal header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 28px', borderBottom: '1px solid #f1f5f9' }}>
              <div>
                <h2 style={{ ...pjs(20, 800, '28px', '#0f172a'), margin: 0 }}>Request Appointment</h2>
                <p style={{ ...pjs(13, 400, '18px', '#64748b'), margin: 0, marginTop: 2 }}>
                  {selectedFaculty ? `Sending to ${selectedFaculty.full_name}` : 'Send a request to a professor'}
                </p>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
                <svg width="22" height="22" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </button>
            </div>

            <div style={{ overflowY: 'auto', flex: 1, padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 24 }}>

              {/* Step 1: Pick faculty */}
              <div>
                <label style={{ ...pjs(11, 700, '16px', '#475569'), display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Select Professor
                </label>
                {selectedFaculty ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: '#f8fafc', borderRadius: 16, border: '1.5px solid #4f46e5' }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                        {selectedFaculty.avatar_url
                          ? <img src={selectedFaculty.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <span style={pjs(14, 700, '16px', '#fff')}>{(selectedFaculty.full_name || 'F').charAt(0)}</span>
                        }
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={pjs(14, 700, '18px', '#0f172a')}>{selectedFaculty.full_name}</div>
                        <div style={pjs(12, 400, '16px', '#64748b')}>{selectedFaculty.designation} · {selectedFaculty.dept}</div>
                      </div>
                      <button onClick={() => setSelectedFaculty(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4f46e5' }}>
                        <X size={18} />
                      </button>
                    </div>
                    {!selectedFaculty.user_id && (
                      <div style={{ padding: '12px', background: '#fef2f2', borderRadius: 12, border: '1px solid #fecaca', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" style={{ flexShrink: 0, marginTop: 2 }}><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                        <div style={pjs(13, 500, '18px', '#b91c1c')}>This faculty member has not yet registered on SnapLocate. Requests cannot be sent to unregistered accounts.</div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <div style={{ position: 'relative', marginBottom: 10 }}>
                      <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                      <input
                        type="text" value={facultySearch}
                        onChange={e => setFacultySearch(e.target.value)}
                        placeholder="Search by name, department..."
                        autoFocus
                        style={{ width: '100%', padding: '12px 14px 12px 36px', borderRadius: 12, border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                        onFocus={e => e.target.style.borderColor = '#4f46e5'}
                        onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                      />
                    </div>
                    <div style={{ maxHeight: 180, overflowY: 'auto', borderRadius: 12, border: '1px solid #f1f5f9' }}>
                      {facultyLoading ? (
                        <div style={{ padding: 20, textAlign: 'center', ...pjs(13, 400, '18px', '#94a3b8') }}>Loading faculty...</div>
                      ) : filteredFaculty.length === 0 ? (
                        <div style={{ padding: 20, textAlign: 'center', ...pjs(13, 400, '18px', '#94a3b8') }}>No faculty found</div>
                      ) : filteredFaculty.map(f => (
                        <div
                          key={f.id}
                          onClick={() => { setSelectedFaculty(f); setFacultySearch('') }}
                          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #f8fafc', transition: 'background 0.1s' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <div style={{ width: 32, height: 32, borderRadius: 8, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                            {f.avatar_url
                              ? <img src={f.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              : <span style={pjs(12, 700, '16px', '#4f46e5')}>{(f.full_name || 'F').charAt(0)}</span>
                            }
                          </div>
                          <div>
                            <div style={pjs(13, 700, '16px', '#0f172a')}>{f.full_name}</div>
                            <div style={pjs(11, 400, '14px', '#64748b')}>{f.designation} · {f.dept}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Step 2: Request type */}
              <div>
                <label style={{ ...pjs(11, 700, '16px', '#475569'), display: 'block', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Request Type</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {REQUEST_TYPES.map(t => (
                    <button
                      key={t} type="button"
                      onClick={() => setReqType(t)}
                      style={{
                        padding: '8px 18px', borderRadius: 20, cursor: 'pointer',
                        border: reqType === t ? 'none' : '1px solid #e2e8f0',
                        background: reqType === t ? '#4f46e5' : '#fff',
                        ...pjs(12, 600, '16px', reqType === t ? '#fff' : '#64748b'),
                        transition: 'all 0.15s',
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 3: Details */}
              <div>
                <label style={{ ...pjs(11, 700, '16px', '#475569'), display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Details</label>
                <textarea
                  value={detail} onChange={e => setDetail(e.target.value)}
                  rows={4}
                  placeholder="Describe your request in detail..."
                  style={{ width: '100%', padding: '14px 16px', borderRadius: 14, border: '1.5px solid #e2e8f0', background: '#f8fafc', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: "'Plus Jakarta Sans', sans-serif", resize: 'none', lineHeight: '20px' }}
                  onFocus={e => e.target.style.borderColor = '#4f46e5'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ flex: 1, padding: '13px', borderRadius: 14, background: '#fff', border: '1.5px solid #e2e8f0', cursor: 'pointer', ...pjs(14, 600, '20px', '#64748b') }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!selectedFaculty || !selectedFaculty.user_id || submitting}
                  style={{ flex: 2, padding: '13px', borderRadius: 14, background: (selectedFaculty && selectedFaculty.user_id) ? '#4f46e5' : '#cbd5e1', color: '#fff', border: 'none', ...pjs(14, 700, '20px', '#fff'), cursor: (selectedFaculty && selectedFaculty.user_id) && !submitting ? 'pointer' : 'not-allowed', transition: 'all 0.2s', boxShadow: (selectedFaculty && selectedFaculty.user_id) ? '0 4px 12px rgba(79,70,229,0.3)' : 'none' }}
                >
                  {submitting ? 'Sending...' : 'Send Request →'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  )
}
