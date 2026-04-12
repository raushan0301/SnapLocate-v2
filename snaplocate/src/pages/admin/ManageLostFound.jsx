import React, { useState, useEffect } from 'react'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'
import { Trash2, Search, MapPin, AlertCircle, CheckCircle2, HelpCircle } from 'lucide-react'

const STATUS_FILTERS = ['all', 'lost', 'found', 'resolved']

const statusStyle = (s) => {
  if (s === 'lost')     return { bg: '#fff7ed', color: '#9a3412', border: '#fed7aa', label: 'LOST' }
  if (s === 'found')    return { bg: '#ecfdf5', color: '#047857', border: '#a7f3d0', label: 'FOUND' }
  if (s === 'resolved') return { bg: '#f0f9ff', color: '#0369a1', border: '#bae6fd', label: 'RESOLVED' }
  return                       { bg: '#f8fafc', color: '#64748b', border: '#e2e8f0', label: s?.toUpperCase() }
}

export default function ManageLostFound() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/admin/lost-found')
      if (res.success) setData(res.data || [])
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }

  const handleDelete = async (item) => {
    if (!window.confirm(`Remove "${item.title}"? This post will be permanently deleted.`)) return
    try {
      await api.delete(`/api/admin/lost-found/${item.id}`)
      setData(prev => prev.filter(d => d.id !== item.id))
    } catch { alert('Failed to remove post.') }
  }

  const filtered = data.filter(d => {
    const matchStatus = statusFilter === 'all' || d.status === statusFilter
    const matchSearch = !search || d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.reporter?.full_name?.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  const stats = {
    total: data.length,
    lost: data.filter(d => d.status === 'lost').length,
    found: data.filter(d => d.status === 'found').length,
    resolved: data.filter(d => d.status === 'resolved').length,
  }

  return (
    <PageLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#0f172a', margin: 0 }}>Lost & Found Moderation</h1>
          <p style={{ fontSize: 14, color: '#64748b', marginTop: 4, marginBottom: 0 }}>Review and remove inappropriate or resolved posts from the campus lost & found board.</p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {[
          { label: 'Total Posts', value: stats.total, icon: <HelpCircle size={20} />, color: '#4f46e5', bg: '#eef2ff' },
          { label: 'Lost', value: stats.lost, icon: <AlertCircle size={20} />, color: '#f59e0b', bg: '#fffbeb' },
          { label: 'Found', value: stats.found, icon: <CheckCircle2 size={20} />, color: '#10b981', bg: '#ecfdf5' },
          { label: 'Resolved', value: stats.resolved, icon: <CheckCircle2 size={20} />, color: '#0ea5e9', bg: '#f0f9ff' },
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
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text" placeholder="Search items or reporters..." value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '10px 16px 10px 36px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              onFocus={e => e.target.style.borderColor = '#4f46e5'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {STATUS_FILTERS.map(s => (
              <button key={s} onClick={() => setStatusFilter(s)} style={{
                padding: '8px 16px', borderRadius: 10, border: '1.5px solid',
                borderColor: statusFilter === s ? '#4f46e5' : '#e2e8f0',
                background: statusFilter === s ? '#4f46e5' : '#fff',
                color: statusFilter === s ? '#fff' : '#475569',
                fontSize: 13, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize'
              }}>{s}</button>
            ))}
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ minWidth: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {['Item', 'Reporter', 'Status', 'Location', 'Date', 'Action'].map(h => (
                  <th key={h} style={{ padding: '14px 16px', textAlign: h === 'Action' ? 'right' : 'left', fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ padding: '40px 0', textAlign: 'center', color: '#64748b' }}>Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '40px 0', textAlign: 'center', color: '#64748b' }}>No posts found.</td></tr>
              ) : filtered.map(item => {
                const st = statusStyle(item.status)
                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 14 }}>{item.title}</div>
                      {item.description && <div style={{ fontSize: 12, color: '#64748b', marginTop: 2, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.description}</div>}
                    </td>
                    <td style={{ padding: '16px', fontSize: 13, color: '#475569' }}>{item.reporter?.full_name || 'Unknown'}</td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}`, padding: '4px 12px', borderRadius: 50, fontSize: 10, fontWeight: 800, letterSpacing: '0.05em' }}>
                        {st.label}
                      </span>
                    </td>
                    <td style={{ padding: '16px', fontSize: 13, color: '#64748b' }}>
                      {item.location ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={13} />{item.location}</div>
                      ) : '—'}
                    </td>
                    <td style={{ padding: '16px', fontSize: 13, color: '#64748b' }}>{new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <button onClick={() => handleDelete(item)} title="Remove post" style={{ background: '#f8fafc', border: '1px solid #fee2e2', color: '#ef4444', padding: '8px', borderRadius: '10px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.borderColor = '#ef4444' }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#fee2e2' }}
                      >
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
