import React, { useState, useEffect } from 'react'
import AdminPageTemplate from '../../components/admin/AdminPageTemplate'
import Modal from '../../components/admin/Modal'
import api from '../../lib/api'

const fieldCls = 'w-full px-3.5 py-[10px] rounded-[8px] border border-slate-300 text-[14px] outline-none box-border focus:border-brand transition-colors'

export default function WiFi() {
  const [networks, setNetworks] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editId, setEditId] = useState(null)

  const [formData, setFormData] = useState({ zone: '', name: '', password: '', is_primary: false })

  const fetchNetworks = async () => {
    try {
      const res = await api.get('/api/wifi')
      if (res.success) setNetworks(res.data || [])
    } catch (err) { console.error('Failed to fetch wifi networks:', err) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchNetworks() }, [])

  const handleAdd = () => {
    setEditId(null); setFormData({ zone: '', name: '', password: '', is_primary: false }); setModalOpen(true)
  }

  const handleEdit = (network) => { setEditId(network.id); setFormData({ ...network }); setModalOpen(true) }

  const handleDelete = async (network) => {
    if (!window.confirm(`Are you sure you want to delete ${network.name}?`)) return
    try {
      const res = await api.delete(`/api/wifi/${network.id}`)
      if (res.success) fetchNetworks()
    } catch { alert('Delete failed.') }
  }

  const handleSubmit = async (e) => {
    e.preventDefault(); setSubmitting(true)
    try {
      if (editId) { const res = await api.put(`/api/wifi/${editId}`, formData); if (res.success) fetchNetworks() }
      else { const res = await api.post('/api/wifi', formData); if (res.success) fetchNetworks() }
      setModalOpen(false)
    } catch (err) { alert(`Failed to save: ${err.message}`) }
    finally { setSubmitting(false) }
  }

  const columns = [
    { label: 'Network', key: 'name', render: (row) => (
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-[8px] flex items-center justify-center ${row.is_primary ? 'bg-indigo-50' : 'bg-slate-50'}`}>
          <svg width="18" height="15" viewBox="0 0 24 20" fill="none">
            <path d="M1 6.5C5 2.5 19 2.5 23 6.5" stroke={row.is_primary ? '#4f46e5' : '#94a3b8'} strokeWidth="1.8" strokeLinecap="round"/>
            <path d="M4.5 10C7.5 7 16.5 7 19.5 10" stroke={row.is_primary ? '#4f46e5' : '#94a3b8'} strokeWidth="1.8" strokeLinecap="round"/>
            <path d="M8 13.5C9.5 12 14.5 12 16 13.5" stroke={row.is_primary ? '#4f46e5' : '#94a3b8'} strokeWidth="1.8" strokeLinecap="round"/>
            <circle cx="12" cy="17.5" r="1.5" fill={row.is_primary ? '#4f46e5' : '#94a3b8'}/>
          </svg>
        </div>
        <div>
          <div className="font-bold t-primary">{row.name}</div>
          <div className="text-[11px] t-muted">{row.zone}</div>
        </div>
      </div>
    )},
    { label: 'Password', key: 'password', render: (row) => (
      <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[12px]">{row.password}</code>
    )},
    { label: 'Type', key: 'is_primary', render: (row) => (
      <span className={`px-2 py-1 rounded-[12px] text-[11px] font-bold ${row.is_primary ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
        {row.is_primary ? 'PRIMARY' : 'SECONDARY'}
      </span>
    )},
  ]

  return (
    <>
      <AdminPageTemplate
        title="Wi-Fi Hub"
        description="Manage campus-wide Wi-Fi networks and passwords."
        columns={columns} data={networks} loading={loading}
        onAdd={handleAdd} onEdit={handleEdit} onDelete={handleDelete}
      />

      <Modal isOpen={modalOpen} onClose={() => !submitting && setModalOpen(false)} title={editId ? 'Edit Network' : 'Add Network'}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Network Name (SSID) *</label>
            <input required type="text" value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className={fieldCls} placeholder="e.g. Eaccess" />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Zone / Area *</label>
            <input required type="text" value={formData.zone}
              onChange={e => setFormData({ ...formData, zone: e.target.value })}
              className={fieldCls} placeholder="e.g. HOSTEL" />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Password *</label>
            <input required type="text" value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
              className={fieldCls} placeholder="Network password" />
          </div>

          <div className="flex items-center gap-2.5 px-3 py-3 rounded-[10px] bg-slate-50">
            <input type="checkbox" id="is_primary" checked={formData.is_primary}
              onChange={e => setFormData({ ...formData, is_primary: e.target.checked })}
              className="accent-brand w-4 h-4 cursor-pointer" />
            <label htmlFor="is_primary" className="text-[14px] font-semibold text-slate-800 cursor-pointer">
              Mark as Primary Network
            </label>
          </div>

          <div className="flex justify-end gap-3 mt-2">
            <button type="button" onClick={() => setModalOpen(false)} disabled={submitting}
              className="px-4 py-[10px] rounded-[8px] border border-slate-300 bg-white font-semibold text-slate-700 cursor-pointer">
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="px-4 py-[10px] rounded-[8px] border-0 bg-brand text-white font-semibold cursor-pointer">
              {submitting ? 'Saving...' : 'Save Network'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}
