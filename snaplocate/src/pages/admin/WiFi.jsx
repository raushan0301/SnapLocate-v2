import React, { useState, useEffect } from 'react'
import AdminPageTemplate from '../../components/admin/AdminPageTemplate'
import Modal from '../../components/admin/Modal'
import api from '../../lib/api'

const pjs = (size, weight, lh, color) => ({
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  fontSize: size, fontWeight: weight, lineHeight: lh, color,
})

export default function WiFi() {
  const [networks, setNetworks] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editId, setEditId] = useState(null)
  
  const [formData, setFormData] = useState({
    zone: '',
    name: '',
    password: '',
    is_primary: false
  })

  const fetchNetworks = async () => {
    try {
      const res = await api.get('/api/wifi')
      if (res.success) setNetworks(res.data || [])
    } catch (err) {
      console.error('Failed to fetch wifi networks:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNetworks()
  }, [])

  const handleAdd = () => {
    setEditId(null)
    setFormData({ zone: '', name: '', password: '', is_primary: false })
    setModalOpen(true)
  }

  const handleEdit = (network) => {
    setEditId(network.id)
    setFormData({ ...network })
    setModalOpen(true)
  }

  const handleDelete = async (network) => {
    if (!window.confirm(`Are you sure you want to delete ${network.name}?`)) return
    try {
      const res = await api.delete(`/api/wifi/${network.id}`)
      if (res.success) fetchNetworks()
    } catch (err) {
      alert('Delete failed.')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (editId) {
        const res = await api.put(`/api/wifi/${editId}`, formData)
        if (res.success) fetchNetworks()
      } else {
        const res = await api.post('/api/wifi', formData)
        if (res.success) fetchNetworks()
      }
      setModalOpen(false)
    } catch (err) {
      alert(`Failed to save: ${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  const inputStyle = { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }

  const columns = [
    { label: 'Network', key: 'name', render: (row) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: row.is_primary ? '#eef2ff' : '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="18" height="15" viewBox="0 0 24 20" fill="none">
            <path d="M1 6.5C5 2.5 19 2.5 23 6.5" stroke={row.is_primary ? '#4f46e5' : '#94a3b8'} strokeWidth="1.8" strokeLinecap="round"/>
            <path d="M4.5 10C7.5 7 16.5 7 19.5 10" stroke={row.is_primary ? '#4f46e5' : '#94a3b8'} strokeWidth="1.8" strokeLinecap="round"/>
            <path d="M8 13.5C9.5 12 14.5 12 16 13.5" stroke={row.is_primary ? '#4f46e5' : '#94a3b8'} strokeWidth="1.8" strokeLinecap="round"/>
            <circle cx="12" cy="17.5" r="1.5" fill={row.is_primary ? '#4f46e5' : '#94a3b8'}/>
          </svg>
        </div>
        <div>
          <div style={{ fontWeight: 700, color: '#0f172a' }}>{row.name}</div>
          <div style={{ fontSize: 11, color: '#64748b' }}>{row.zone}</div>
        </div>
      </div>
    )},
    { label: 'Password', key: 'password', render: (row) => (
      <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>{row.password}</code>
    )},
    { label: 'Type', key: 'is_primary', render: (row) => (
      <span style={{ 
        background: row.is_primary ? '#dcfce7' : '#f1f5f9', 
        color: row.is_primary ? '#16a34a' : '#64748b', 
        padding: '4px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700 
      }}>
        {row.is_primary ? 'PRIMARY' : 'SECONDARY'}
      </span>
    )},
  ]

  return (
    <>
      <AdminPageTemplate
        title="Wi-Fi Hub"
        description="Manage campus-wide Wi-Fi networks and passwords."
        columns={columns}
        data={networks}
        loading={loading}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <Modal isOpen={modalOpen} onClose={() => !submitting && setModalOpen(false)} title={editId ? "Edit Network" : "Add Network"}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Network Name (SSID) *</label>
            <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={inputStyle} placeholder="e.g. Eaccess" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Zone / Area *</label>
            <input required type="text" value={formData.zone} onChange={e => setFormData({ ...formData, zone: e.target.value })} style={inputStyle} placeholder="e.g. HOSTEL" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Password *</label>
            <input required type="text" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} style={inputStyle} placeholder="Network password" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#f8fafc', padding: 12, borderRadius: 10 }}>
            <input type="checkbox" id="is_primary" checked={formData.is_primary} onChange={e => setFormData({ ...formData, is_primary: e.target.checked })} />
            <label htmlFor="is_primary" style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', cursor: 'pointer' }}>Mark as Primary Network</label>
          </div>

          <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button type="button" onClick={() => setModalOpen(false)} disabled={submitting} style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
            <button type="submit" disabled={submitting} style={{ padding: '10px 16px', borderRadius: 8, border: 'none', background: '#4f46e5', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>{submitting ? 'Saving...' : 'Save Network'}</button>
          </div>
        </form>
      </Modal>
    </>
  )
}
