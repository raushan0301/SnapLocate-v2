import { useState, useEffect } from 'react'
import PageLayout from '../../components/PageLayout'
import { useAuth } from '../../context/AuthContext'
import api from '../../lib/api'

// CSS helper
const pjs = (size, weight, lh, color) => ({
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  fontSize: size, fontWeight: weight, lineHeight: lh, color,
})

export default function StudentRequests() {
  const { user } = useAuth()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchRequests = async () => {
    try {
      const res = await api.get('/api/requests')
      setRequests(res.data?.data || res.data || [])
    } catch (err) {
      console.error('Failed to load requests:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [])

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this request?')) return
    
    // Optimistic update
    const previous = [...requests]
    setRequests(requests.filter(r => r.id !== id))
    
    try {
      await api.delete(`/api/requests/${id}`)
    } catch (err) {
      alert('Failed to cancel request')
      setRequests(previous)
    }
  }

  return (
    <PageLayout>
      <div style={{ maxWidth: 860, margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', background:'#fff', padding:'24px 32px', borderRadius:24, boxShadow:'0 1px 4px rgba(0,0,0,.04)', border:'1px solid #f1f5f9' }}>
          <div>
            <h1 style={{ ...pjs(24, 700, '32px', '#0f172a'), margin:0 }}>My Active Requests</h1>
            <p style={{ ...pjs(15, 500, '22px', '#64748b'), margin:0, marginTop:4 }}>Track your appointment and query requests to professors.</p>
          </div>
          <div style={{ width:48,height:48,background:'#eef2ff',borderRadius:16,display:'flex',alignItems:'center',justifyContent:'center' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div style={{ padding:40, textAlign:'center', ...pjs(16, 500, '24px', '#94a3b8') }}>Loading requests...</div>
        ) : requests.length === 0 ? (
          <div style={{ padding:60, textAlign:'center', background:'#fff', borderRadius:24, border:'1px dashed #cbd5e1' }}>
            <div style={{ fontSize:48, marginBottom:16 }}>📬</div>
            <h2 style={pjs(18, 700, '24px', '#0f172a')}>No requests found</h2>
            <p style={{ ...pjs(14, 400, '20px', '#64748b'), marginTop:8 }}>You haven't sent any requests to professors yet.</p>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {requests.map(req => (
              <div key={req.id} style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', padding:'20px 24px', background:'#fff', borderRadius:20, border:'1px solid #f1f5f9', boxShadow:'0 1px 3px rgba(0,0,0,.02)' }}>
                <div style={{ display:'flex', alignItems:'flex-start', gap:16, flex: 1, minWidth: 0 }}>
                  <div style={{ width:48,height:48,background:'#f8fafc',borderRadius:16,display:'flex',alignItems:'center',justifyContent:'center', flexShrink:0, overflow:'hidden' }}>
                    <img 
                      src={req.faculty_profile?.users?.avatar_url || `https://ui-avatars.com/api/?name=${req.faculty_profile?.users?.full_name || 'F'}`} 
                      alt="Profile" 
                      style={{ width:'100%', height:'100%', objectFit:'cover' }} 
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:4 }}>
                      <span style={pjs(16, 700, '20px', '#0f172a')}>{req.type}</span>
                      <span style={{ ...pjs(11, 800, '14px', '#94a3b8'), textTransform:'uppercase' }}>• {new Date(req.created_at).toLocaleDateString()}</span>
                    </div>
                    <div style={{ ...pjs(14, 500, '20px', '#475569'), wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{req.detail || 'No description provided'}</div>
                    <div style={{ ...pjs(13, 600, '18px', '#4f46e5'), marginTop: 8 }}>To: {req.faculty_profile?.users?.full_name || 'Faculty Member'}</div>
                  </div>
                </div>

                <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:12, flexShrink: 0, marginLeft: 24 }}>
                  <span style={{ 
                    ...pjs(11, 800, '14px', req.status === 'accepted' ? '#16a34a' : req.status === 'rejected' ? '#ef4444' : '#f59e0b'), 
                    background: req.status === 'accepted' ? '#f0fdf4' : req.status === 'rejected' ? '#fef2f2' : '#fffbeb',
                    border: `1px solid ${req.status === 'accepted' ? '#bbf7d0' : req.status === 'rejected' ? '#fecaca' : '#fde68a'}`,
                    padding: '6px 14px', borderRadius: 20, textTransform: 'uppercase', letterSpacing:'.05em' 
                  }}>
                    {req.status}
                  </span>
                  
                  {req.status === 'pending' && (
                    <button 
                      onClick={() => handleCancel(req.id)}
                      style={{ 
                        background:'none', border:'none', cursor:'pointer', ...pjs(12, 600, '16px', '#94a3b8'),
                        textDecoration:'underline', padding: 0
                      }}
                    >
                      Cancel Request
                    </button>
                  )}

                  {req.notes && (
                    <div style={{ ...pjs(12, 500, '16px', '#64748b'), maxWidth: 200, textAlign:'right', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }} title={req.notes}>
                      Note: {req.notes}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </PageLayout>
  )
}
