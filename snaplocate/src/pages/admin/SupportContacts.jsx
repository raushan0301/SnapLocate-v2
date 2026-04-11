import React, { useState, useEffect } from 'react'
import AdminPageTemplate from '../../components/admin/AdminPageTemplate'
import Modal from '../../components/admin/Modal'
import api from '../../lib/api'

export default function SupportContacts() {
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editId, setEditId] = useState(null)
  
  const [formData, setFormData] = useState({
    section_title: '',
    role: '',
    email: '',
    when: '',
    category: 'All Support',
    is_emergency: false,
    icon_type: 'info'
  })

  const fetchContacts = async () => {
    try {
      setLoading(true)
      const res = await api.get('/api/support/raw')
      if (res.success) setContacts(res.data || [])
    } catch (err) {
      console.error('Failed to fetch support contacts:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchContacts()
  }, [])

  const handleAdd = () => {
    setEditId(null)
    setFormData({ section_title: '', role: '', email: '', when: '', category: 'All Support', is_emergency: false, icon_type: 'info' })
    setModalOpen(true)
  }

  const handleEdit = (contact) => {
    setEditId(contact.id)
    setFormData({ ...contact })
    setModalOpen(true)
  }

  const handleDelete = async (contact) => {
    if (!window.confirm(`Delete ${contact.role}?`)) return
    try {
      const res = await api.delete(`/api/support/${contact.id}`)
      if (res.success) fetchContacts()
    } catch (err) {
      alert('Delete failed.')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (editId) {
        const res = await api.put(`/api/support/${editId}`, formData)
        if (res.success) fetchContacts()
      } else {
        const res = await api.post('/api/support', formData)
        if (res.success) fetchContacts()
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
    { label: 'Role / Section', key: 'role', render: (row) => (
      <div>
        <div style={{ fontWeight: 700, color: '#0f172a' }}>{row.role}</div>
        <div style={{ fontSize: 11, color: '#64748b' }}>{row.section_title}</div>
      </div>
    )},
    { label: 'Email', key: 'email' },
    { label: 'Category', key: 'category', render: (row) => (
      <span style={{ 
        background: row.is_emergency ? '#fee2e2' : '#f1f5f9', 
        color: row.is_emergency ? '#ef4444' : '#64748b', 
        padding: '4px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700 
      }}>
        {row.is_emergency ? '🚨 EMERGENCY' : row.category}
      </span>
    )},
  ]

  const uniqueSections = [...new Set(contacts.map(c => c.section_title))].filter(Boolean)

  return (
    <>
      <AdminPageTemplate
        title="Support Contacts"
        description="Manage campus-wide support departments and their contact info."
        columns={columns}
        data={contacts}
        loading={loading}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <Modal isOpen={modalOpen} onClose={() => !submitting && setModalOpen(false)} title={editId ? "Edit Contact" : "Add Contact"}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Section Title *</label>
              <input 
                required 
                type="text" 
                list="existing-sections"
                value={formData.section_title} 
                onChange={e => setFormData({ ...formData, section_title: e.target.value })} 
                style={inputStyle} 
                placeholder="Type or select section..." 
              />
              <datalist id="existing-sections">
                {uniqueSections.map(s => <option key={s} value={s} />)}
              </datalist>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Category *</label>
              <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} style={inputStyle}>
                <option>All Support</option>
                <option>Academic</option>
                <option>Hostel</option>
                <option>Finance</option>
                <option>IT</option>
              </select>
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Person/Role Name *</label>
            <input required type="text" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} style={inputStyle} placeholder="e.g. Dean of Academic Affairs" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>E-mail Address *</label>
            <input required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} style={inputStyle} placeholder="dean.aa@univ.test" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>When to contact? *</label>
            <textarea required value={formData.when} onChange={e => setFormData({ ...formData, when: e.target.value })} style={{ ...inputStyle, minHeight: 80, resize: 'none' }} placeholder="Clear instructions for students." />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: formData.is_emergency ? '#fff1f2' : '#f8fafc', padding: 12, borderRadius: 10 }}>
            <input type="checkbox" id="is_emergency" checked={formData.is_emergency} onChange={e => setFormData({ ...formData, is_emergency: e.target.checked })} />
            <label htmlFor="is_emergency" style={{ fontSize: 14, fontWeight: 600, color: formData.is_emergency ? '#ef4444' : '#1e293b', cursor: 'pointer' }}>🚨 Mark as Emergency Contact</label>
          </div>

          <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button type="button" onClick={() => setModalOpen(false)} disabled={submitting} style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
            <button type="submit" disabled={submitting} style={{ padding: '10px 16px', borderRadius: 8, border: 'none', background: '#4f46e5', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>{submitting ? 'Saving...' : 'Save Contact'}</button>
          </div>
        </form>
      </Modal>
    </>
  )
}
