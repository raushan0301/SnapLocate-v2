import React, { useState, useEffect } from 'react'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'
import { Trash2, ShoppingBag, Package, CheckCircle, XCircle, Search } from 'lucide-react'

const STATUS_FILTERS = ['all', 'active', 'sold', 'expired']

const statusStyle = (s) => {
  if (s === 'active')  return { bg: '#ecfdf5', color: '#047857', border: '#a7f3d0' }
  if (s === 'sold')    return { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' }
  return                      { bg: '#f8fafc', color: '#64748b', border: '#e2e8f0' }
}

export default function ManageMarketplace() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/admin/marketplace')
      if (res.success) setData(res.data || [])
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }

  const handleDelete = async (item) => {
    if (!window.confirm(`Remove "${item.title}" from the marketplace? The seller will lose this listing.`)) return
    try {
      await api.delete(`/api/admin/marketplace/${item.id}`)
      setData(prev => prev.filter(d => d.id !== item.id))
    } catch { alert('Failed to remove listing.') }
  }

  const filtered = data.filter(d => {
    const matchStatus = statusFilter === 'all' || d.status === statusFilter
    const matchSearch = !search || d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.seller?.full_name?.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  const stats = {
    total: data.length,
    active: data.filter(d => d.status === 'active').length,
    sold: data.filter(d => d.status === 'sold').length,
  }

  return (
    <PageLayout>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 0 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#0f172a', margin: 0 }}>Marketplace Moderation</h1>
          <p style={{ fontSize: 14, color: '#64748b', marginTop: 4, marginBottom: 0 }}>Review and remove inappropriate listings from the campus marketplace.</p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
        {[
          { label: 'Total Listings', value: stats.total, icon: <Package size={20} />, color: '#4f46e5', bg: '#eef2ff' },
          { label: 'Active Listings', value: stats.active, icon: <ShoppingBag size={20} />, color: '#10b981', bg: '#ecfdf5' },
          { label: 'Sold', value: stats.sold, icon: <CheckCircle size={20} />, color: '#0ea5e9', bg: '#f0f9ff' },
        ].map((s, idx) => (
          <div key={idx} style={{ background: '#fff', padding: '24px', borderRadius: 20, border: '1px solid #f1f5f9', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: s.bg, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a' }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div style={{ background: '#fff', borderRadius: 20, padding: 24, border: '1px solid #f1f5f9', boxShadow: '0 4px 24px rgba(0,0,0,0.03)' }}>
        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text" placeholder="Search listings or sellers..." value={search}
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
                {['Listing', 'Price', 'Seller', 'Status', 'Posted', 'Action'].map(h => (
                  <th key={h} style={{ padding: '14px 16px', textAlign: h === 'Action' ? 'right' : 'left', fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ padding: '40px 0', textAlign: 'center', color: '#64748b' }}>Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '40px 0', textAlign: 'center', color: '#64748b' }}>No listings found.</td></tr>
              ) : filtered.map(item => {
                const st = statusStyle(item.status)
                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.title} style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', border: '1px solid #e2e8f0' }} />
                        ) : (
                          <div style={{ width: 40, height: 40, borderRadius: 8, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Package size={18} color="#94a3b8" />
                          </div>
                        )}
                        <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 14, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
                      </div>
                    </td>
                    <td style={{ padding: '16px', fontWeight: 700, color: '#0f172a' }}>₹{item.price}</td>
                    <td style={{ padding: '16px', fontSize: 13, color: '#475569' }}>{item.seller?.full_name || 'Unknown'}</td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}`, padding: '4px 12px', borderRadius: 50, fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {item.status}
                      </span>
                    </td>
                    <td style={{ padding: '16px', fontSize: 13, color: '#64748b' }}>{new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <button onClick={() => handleDelete(item)} title="Remove listing" style={{ background: '#f8fafc', border: '1px solid #fee2e2', color: '#ef4444', padding: '8px', borderRadius: '10px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
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
