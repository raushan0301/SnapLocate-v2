import React, { useState, useEffect } from 'react'
import AdminPageTemplate from '../../components/admin/AdminPageTemplate'
import api from '../../lib/api'

// Simple custom modal overlay
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        background: '#fff', padding: 24, borderRadius: 16, width: '100%', maxWidth: 500,
        maxHeight: '90vh', overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{title}</h2>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 24 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

const inputStyle = {
  width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #e2e8f0',
  marginBottom: 12, fontFamily: "'Inter', sans-serif", fontSize: 14, outline: 'none'
}

export default function ManageClassrooms() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingCard, setEditingCard] = useState(null)
  
  // form state
  const [formData, setFormData] = useState({
    name: '', subtitle: '', type: 'LEC', 
    status: 'AVAILABLE NOW', status_bg: '#22c55e', status_c: '#ffffff',
    block: '', floor: '', capacity: '', indicator_bg: '#4f46e5', image_url: ''
  })
  const [imageFile, setImageFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const fetchClassrooms = async () => {
    try {
      const res = await api.get('/api/classrooms')
      if (res.success) {
        setData(res.data)
      }
    } catch (err) {
      console.error('Failed to load classrooms:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClassrooms()
  }, [])

  const handleOpenAdd = () => {
    setEditingCard(null)
    setFormData({
      name: '', subtitle: '', type: 'LEC', 
      status: 'AVAILABLE NOW', status_bg: '#22c55e', status_c: '#ffffff',
      block: '', floor: '', capacity: '', indicator_bg: '#4f46e5', image_url: ''
    })
    setImageFile(null)
    setModalOpen(true)
  }

  const handleOpenEdit = (row) => {
    setEditingCard(row)
    setFormData({
      name: row.name || '',
      subtitle: row.subtitle || '',
      type: row.type || 'LEC',
      status: row.status || 'AVAILABLE NOW',
      status_bg: row.status_bg || '#22c55e',
      status_c: row.status_c || '#ffffff',
      block: row.block || '',
      floor: row.floor || '',
      capacity: row.capacity || '',
      indicator_bg: row.indicator_bg || '#4f46e5',
      image_url: row.image_url || row.img || ''
    })
    setImageFile(null)
    setModalOpen(true)
  }

  const handleDelete = async (row) => {
    if (!window.confirm(`Are you sure you want to delete ${row.name}?`)) return
    try {
      const res = await api.delete(`/api/classrooms/${row.id}`)
      if (res.success) {
        fetchClassrooms()
      }
    } catch (err) {
      alert('Delete failed')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      let finalImageUrl = formData.image_url

      if (imageFile) {
        const fileForm = new FormData()
        fileForm.append('file', imageFile)
        fileForm.append('type', 'workspace')
        
        const uploadRes = await api.upload('/api/upload/image', fileForm)
        if (uploadRes?.success) {
          finalImageUrl = uploadRes.url
        }
      }

      const payload = { ...formData, image_url: finalImageUrl }
      if (editingCard) {
        await api.put(`/api/classrooms/${editingCard.id}`, payload)
      } else {
        await api.post('/api/classrooms', payload)
      }
      setModalOpen(false)
      fetchClassrooms()
    } catch (err) {
      alert('Operation failed')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const columns = [
    { key: 'name', label: 'Room Name' },
    { key: 'block', label: 'Block' },
    { key: 'capacity', label: 'Capacity' },
    { key: 'type', label: 'Type' },
    { 
      key: 'status', label: 'Status',
      render: (row) => (
        <span style={{
          background: row.status_bg || '#dcfce7',
          color: row.status_c || '#166534',
          padding: '4px 10px', borderRadius: 20, fontSize: 13, fontWeight: 600
        }}>
          {row.status}
        </span>
      )
    }
  ]

  return (
    <>
      <AdminPageTemplate
        title="Manage Classrooms"
        description="Add or edit classroom and lab information."
        columns={columns}
        data={data}
        loading={loading}
        onAdd={handleOpenAdd}
        onEdit={handleOpenEdit}
        onDelete={handleDelete}
        onRefresh={fetchClassrooms}
      />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingCard ? 'Edit Classroom' : 'Add Classroom'}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
          <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, fontFamily: "'Inter', sans-serif" }}>Name</label>
          <input required style={inputStyle} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Programming Lab 1" />

          <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, fontFamily: "'Inter', sans-serif" }}>Subtitle</label>
          <input style={inputStyle} value={formData.subtitle} onChange={e => setFormData({ ...formData, subtitle: e.target.value })} placeholder="e.g. L 106 • PL Lab I" />

          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, fontFamily: "'Inter', sans-serif" }}>Type</label>
              <select style={inputStyle} value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                <option value="LEC">Lecture</option>
                <option value="LAB">Lab</option>
                <option value="GENERAL">General</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, fontFamily: "'Inter', sans-serif" }}>Block</label>
              <input style={inputStyle} value={formData.block} onChange={e => setFormData({ ...formData, block: e.target.value })} placeholder="CSED" />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
             <div style={{ flex: 1 }}>
              <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, fontFamily: "'Inter', sans-serif" }}>Capacity</label>
              <input type="number" style={inputStyle} value={formData.capacity} onChange={e => setFormData({ ...formData, capacity: e.target.value })} placeholder="60" />
            </div>
             <div style={{ flex: 1 }}>
              <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, fontFamily: "'Inter', sans-serif" }}>Floor</label>
              <input style={inputStyle} value={formData.floor} onChange={e => setFormData({ ...formData, floor: e.target.value })} placeholder="01" />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
             <div style={{ flex: 1 }}>
              <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, fontFamily: "'Inter', sans-serif" }}>Status</label>
              <input style={inputStyle} value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} placeholder="AVAILABLE NOW" />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, fontFamily: "'Inter', sans-serif" }}>Status Bg (Hex)</label>
              <input style={inputStyle} value={formData.status_bg} onChange={e => setFormData({ ...formData, status_bg: e.target.value })} placeholder="#22c55e" />
            </div>
          </div>

          <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, fontFamily: "'Inter', sans-serif" }}>Classroom Image</label>
          {formData.image_url && !imageFile && (
             <img src={formData.image_url} alt="Preview" style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 8, marginBottom: 12 }} />
          )}
          <input type="file" style={{ marginBottom: 20 }} onChange={e => setImageFile(e.target.files[0])} accept="image/*" />

          <button disabled={submitting} type="submit" style={{ 
            background: '#4f46e5', color: '#fff', border: 'none', padding: '12px', borderRadius: 8, 
            fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer'
          }}>
            {submitting ? 'Saving...' : (editingCard ? 'Save Changes' : 'Create Classroom')}
          </button>
        </form>
      </Modal>
    </>
  )
}
