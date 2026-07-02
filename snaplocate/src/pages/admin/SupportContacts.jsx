import React, { useState, useEffect } from 'react'
import AdminPageTemplate from '../../components/admin/AdminPageTemplate'
import Modal from '../../components/admin/Modal'
import api from '../../lib/api'

const fieldCls = 'w-full px-3.5 py-[10px] rounded-[8px] border border-slate-300 text-[14px] outline-none box-border focus:border-brand transition-colors'

export default function SupportContacts() {
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editId, setEditId] = useState(null)

  const [formData, setFormData] = useState({
    section_title: '', role: '', email: '', when: '',
    category: 'All Support', is_emergency: false, icon_type: 'info'
  })

  const fetchContacts = async () => {
    try {
      setLoading(true)
      const res = await api.get('/api/support/raw')
      if (res.success) setContacts(res.data || [])
    } catch (err) { console.error('Failed to fetch support contacts:', err) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchContacts() }, [])

  const handleAdd = () => {
    setEditId(null)
    setFormData({ section_title: '', role: '', email: '', when: '', category: 'All Support', is_emergency: false, icon_type: 'info' })
    setModalOpen(true)
  }

  const handleEdit = (contact) => { setEditId(contact.id); setFormData({ ...contact }); setModalOpen(true) }

  const handleDelete = async (contact) => {
    if (!window.confirm(`Delete ${contact.role}?`)) return
    try {
      const res = await api.delete(`/api/support/${contact.id}`)
      if (res.success) fetchContacts()
    } catch { alert('Delete failed.') }
  }

  const handleSubmit = async (e) => {
    e.preventDefault(); setSubmitting(true)
    try {
      if (editId) { const res = await api.put(`/api/support/${editId}`, formData); if (res.success) fetchContacts() }
      else { const res = await api.post('/api/support', formData); if (res.success) fetchContacts() }
      setModalOpen(false)
    } catch (err) { alert(`Failed to save: ${err.message}`) }
    finally { setSubmitting(false) }
  }

  const columns = [
    { label: 'Role / Section', key: 'role', render: (row) => (
      <div>
        <div className="font-bold t-primary">{row.role}</div>
        <div className="text-[11px] t-muted">{row.section_title}</div>
      </div>
    )},
    { label: 'Email', key: 'email' },
    { label: 'Category', key: 'category', render: (row) => (
      <span className={`px-2 py-1 rounded-[12px] text-[11px] font-bold ${row.is_emergency ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
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
        columns={columns} data={contacts} loading={loading}
        onAdd={handleAdd} onEdit={handleEdit} onDelete={handleDelete}
      />

      <Modal isOpen={modalOpen} onClose={() => !submitting && setModalOpen(false)} title={editId ? 'Edit Contact' : 'Add Contact'}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Section Title *</label>
              <input required type="text" list="existing-sections" value={formData.section_title}
                onChange={e => setFormData({ ...formData, section_title: e.target.value })}
                className={fieldCls} placeholder="Type or select section..." />
              <datalist id="existing-sections">
                {uniqueSections.map(s => <option key={s} value={s} />)}
              </datalist>
            </div>
            <div className="flex-1">
              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Category *</label>
              <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className={fieldCls}>
                <option>All Support</option>
                <option>Academic</option>
                <option>Hostel</option>
                <option>Finance</option>
                <option>IT</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Person/Role Name *</label>
            <input required type="text" value={formData.role}
              onChange={e => setFormData({ ...formData, role: e.target.value })}
              className={fieldCls} placeholder="e.g. Dean of Academic Affairs" />
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">E-mail Address *</label>
            <input required type="email" value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              className={fieldCls} placeholder="dean.aa@univ.test" />
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">When to contact? *</label>
            <textarea required value={formData.when}
              onChange={e => setFormData({ ...formData, when: e.target.value })}
              className={`${fieldCls} min-h-[80px] resize-none`} placeholder="Clear instructions for students." />
          </div>

          <div className={`flex items-center gap-2.5 px-3 py-3 rounded-[10px] ${formData.is_emergency ? 'bg-red-50' : 'bg-slate-50'}`}>
            <input type="checkbox" id="is_emergency" checked={formData.is_emergency}
              onChange={e => setFormData({ ...formData, is_emergency: e.target.checked })}
              className="accent-brand w-4 h-4 cursor-pointer" />
            <label htmlFor="is_emergency" className={`text-[14px] font-semibold cursor-pointer ${formData.is_emergency ? 'text-red-600' : 'text-slate-800'}`}>
              🚨 Mark as Emergency Contact
            </label>
          </div>

          <div className="flex justify-end gap-3 mt-2">
            <button type="button" onClick={() => setModalOpen(false)} disabled={submitting}
              className="px-4 py-[10px] rounded-[8px] border border-slate-300 bg-white font-semibold text-slate-700 cursor-pointer">
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="px-4 py-[10px] rounded-[8px] border-0 bg-brand text-white font-semibold cursor-pointer">
              {submitting ? 'Saving...' : 'Save Contact'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}
