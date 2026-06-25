import React, { useState, useEffect } from 'react'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'
import { Search, Clock, CheckCircle2, XCircle, AlertCircle, ArrowRight, RefreshCw, Trash2 } from 'lucide-react'

const STATUS_FILTERS = ['all', 'pending', 'accepted', 'rejected']

const statusStyle = (s) => {
  if (s === 'pending')  return { bg: '#fffbeb', color: '#92400e', border: '#fde68a', label: 'PENDING' }
  if (s === 'accepted') return { bg: '#ecfdf5', color: '#047857', border: '#a7f3d0', label: 'ACCEPTED' }
  if (s === 'rejected') return { bg: '#fef2f2', color: '#991b1b', border: '#fecaca', label: 'REJECTED' }
  return                       { bg: '#f8fafc', color: '#64748b', border: '#e2e8f0', label: s?.toUpperCase() }
}

const TYPE_COLORS = {
  'office hour':   { bg: '#eef2ff', color: '#4f46e5' },
  'attendance':    { bg: '#fdf4ff', color: '#7e22ce' },
  'grade review':  { bg: '#fff7ed', color: '#c2410c' },
  'extension':     { bg: '#f0fdf4', color: '#15803d' },
  'research query':{ bg: '#ecfdf5', color: '#0d9488' },
}

export default function ManageRequests() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/admin/requests')
      if (res.success) setData(res.data || [])
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this request?')) return
    try {
      const res = await api.delete(`/api/admin/requests/${id}`)
      if (res.success) {
        setData(prev => prev.filter(req => req.id !== id))
      }
    } catch (err) {
      console.error(err)
      alert('Failed to delete request')
    }
  }

  const filtered = data.filter(d => {
    const matchStatus = statusFilter === 'all' || d.status === statusFilter
    const studentName = d.student?.full_name || ''
    const facultyName = d.faculty_profile?.users?.full_name || ''
    const matchSearch = !search ||
      studentName.toLowerCase().includes(search.toLowerCase()) ||
      facultyName.toLowerCase().includes(search.toLowerCase()) ||
      d.type?.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  const stats = {
    total: data.length,
    pending: data.filter(d => d.status === 'pending').length,
    accepted: data.filter(d => d.status === 'accepted').length,
    rejected: data.filter(d => d.status === 'rejected').length,
  }

  return (
    <PageLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#0f172a', margin: 0 }}>Requests Overview</h1>
          <p style={{ fontSize: 14, color: '#64748b', marginTop: 4, marginBottom: 0 }}>Monitor all student-to-faculty requests across the campus. Read-only view.</p>
        </div>
        <button onClick={fetchData} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#fff', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {[
          { label: 'Total Requests', value: stats.total, icon: <ArrowRight size={20} />, color: '#4f46e5', bg: '#eef2ff' },
          { label: 'Pending', value: stats.pending, icon: <Clock size={20} />, color: '#f59e0b', bg: '#fffbeb' },
          { label: 'Accepted', value: stats.accepted, icon: <CheckCircle2 size={20} />, color: '#10b981', bg: '#ecfdf5' },
          { label: 'Rejected', value: stats.rejected, icon: <XCircle size={20} />, color: '#ef4444', bg: '#fef2f2' },
        ].map((s, idx) => (
          <div key={idx} style={{ background: '#fff', padding: '20px', borderRadius: 20, border: '1px solid #f1f5f9', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: s.bg, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 2 }}>{s.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div style={{ background: '#fff', borderRadius: 20, padding: 24, border: '1px solid #f1f5f9', boxShadow: '0 4px 24px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ position: 'relative', width: '300px', flexShrink: 0 }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text" placeholder="Search by student, faculty, or type..." value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '10px 16px 10px 34px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: "'Inter', sans-serif", transition: '0.2s' }}
              onFocus={e => e.target.style.borderColor = '#4f46e5'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '10px 36px 10px 16px', borderRadius: 10, border: '1.5px solid #e2e8f0',
              fontSize: 14, fontWeight: 500, color: '#0f172a', background: '#fff',
              outline: 'none', cursor: 'pointer', appearance: 'none', fontFamily: "'Inter', sans-serif",
              transition: '0.2s', backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="%2364748b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>')`,
              backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center',
            }}
            onFocus={e => e.target.style.borderColor = '#4f46e5'}
            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
          >
            {STATUS_FILTERS.map(s => (
              <option value={s} key={s}>{s === 'all' ? 'All Status' : s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ minWidth: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {['Student', 'Faculty', 'Type', 'Status', 'Conversation', 'Date', ''].map((h, i) => (
                  <th key={i} style={{ padding: '14px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ padding: '40px 0', textAlign: 'center', color: '#64748b' }}>Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: '40px 0', textAlign: 'center', color: '#64748b' }}>No requests found.</td></tr>
              ) : filtered.map(req => {
                const st = statusStyle(req.status)
                const typeColor = TYPE_COLORS[req.type?.toLowerCase()] || { bg: '#f1f5f9', color: '#475569' }
                return (
                  <tr key={req.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 14 }}>{req.student?.full_name || '—'}</div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>{req.student?.email || ''}</div>
                    </td>
                    <td style={{ padding: '16px', fontSize: 14, color: '#334155', fontWeight: 500 }}>{req.faculty_profile?.users?.full_name || '—'}</td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ background: typeColor.bg, color: typeColor.color, padding: '4px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, textTransform: 'capitalize' }}>
                        {req.type || '—'}
                      </span>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}`, padding: '4px 12px', borderRadius: 50, fontSize: 10, fontWeight: 800, letterSpacing: '0.05em' }}>
                        {st.label}
                      </span>
                    </td>
                    <td style={{ padding: '16px', fontSize: 13, color: '#334155', maxWidth: 320, lineHeight: '1.5', whiteSpace: 'normal', wordBreak: 'break-word' }}>
                      {req.detail && (
                        <div style={{ marginBottom: req.notes ? 8 : 0 }}>
                          <span style={{ fontWeight: 600, color: '#475569' }}>Student:</span> {req.detail}
                        </div>
                      )}
                      {req.notes && (
                        <div style={{ padding: '8px 12px', background: '#f1f5f9', borderRadius: 8, borderLeft: '3px solid #cbd5e1' }}>
                          <span style={{ fontWeight: 600, color: '#475569' }}>Faculty:</span> {req.notes}
                        </div>
                      )}
                      {!req.detail && !req.notes && <span style={{ color: '#94a3b8' }}>—</span>}
                    </td>
                    <td style={{ padding: '16px', fontSize: 13, color: '#64748b' }}>{new Date(req.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <button onClick={() => handleDelete(req.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 8, borderRadius: 8, transition: '0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'} onMouseLeave={e => e.currentTarget.style.background = 'none'} title="Delete Request">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </PageLayout>
  )
}
