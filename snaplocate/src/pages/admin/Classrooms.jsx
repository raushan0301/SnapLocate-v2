import React, { useState, useEffect } from 'react'
import AdminPageTemplate from '../../components/admin/AdminPageTemplate'
import api from '../../lib/api'
import BulkUploadModal from '../../components/admin/BulkUploadModal'
import { Plus, Trash2, X, CheckSquare, UploadCloud, Image as ImageIcon } from 'lucide-react'

// Simple custom modal overlay
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
    }}>
      <div style={{
        background: '#fff', padding: 32, borderRadius: 24, width: '100%', maxWidth: 540,
        maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 50px rgba(0,0,0,0.15)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 20, fontWeight: 800, color: '#0f172a' }}>{title}</h2>
          <button onClick={onClose} style={{ border: 'none', background: '#f1f5f9', cursor: 'pointer', width: 32, height: 32, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
             <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

const inputStyle = { 
  width: '100%', padding: '0 16px', height: '48px', borderRadius: 12, border: '1.5px solid #e2e8f0', 
  outline: 'none', boxSizing: 'border-box', fontFamily: "'Inter', sans-serif", 
  fontSize: 14, color: '#1e293b', background: '#fff', transition: 'border-color 0.2s', marginBottom: 16
}

const selectStyle = {
  ...inputStyle,
  cursor: 'pointer',
  appearance: 'none',
  backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3Csvg width='12' height='7' viewBox='0 0 12 7' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L6 6L11 1' stroke='%2364748b' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 16px center'
}

const STATUS_COLORS = {
  'green': { bg: '#dcfce7', c: '#166534', label: 'Green (Available)' },
  'red': { bg: '#fee2e2', c: '#991b1b', label: 'Red (In Use)' },
  'yellow': { bg: '#fef3c7', c: '#92400e', label: 'Yellow (Maintenance)' },
  'blue': { bg: '#dbeafe', c: '#1e40af', label: 'Blue (Info)' },
  'indigo': { bg: '#e0e7ff', c: '#3730a3', label: 'Indigo (Special)' }
}

export default function ManageClassrooms() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingCard, setEditingCard] = useState(null)
  
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)
  const [bulkModalOpen, setBulkModalOpen] = useState(false)

  // form state
  const [formData, setFormData] = useState({
    name: '', subtitle: '', type: 'LEC', 
    status: 'AVAILABLE NOW', status_bg: '#dcfce7', status_c: '#166534',
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
      status: 'AVAILABLE NOW', status_bg: '#dcfce7', status_c: '#166534',
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
      status_bg: row.status_bg || '#dcfce7',
      status_c: row.status_c || '#166534',
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
        setData(prev => prev.filter(c => c.id !== row.id))
        setSelectedIds(prev => { const n = new Set(prev); n.delete(row.id); return n })
      }
    } catch (err) {
      alert('Delete failed')
    }
  }

  const bulkDelete = async () => {
    if (!window.confirm(`Permanently delete ${selectedIds.size} classroom(s)?`)) return
    setBulkLoading(true)
    try {
      await Promise.all([...selectedIds].map(id => api.delete(`/api/classrooms/${id}`)))
      setData(prev => prev.filter(c => !selectedIds.has(c.id)))
      setSelectedIds(new Set())
    } catch { alert('Bulk delete failed.') } finally { setBulkLoading(false) }
  }

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
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

  const handleBulkUpload = async (parsedData) => {
    const rows = parsedData.map(r => ({
      name: r['Room Name'] || 'Unnamed Room',
      block: String(r['Block'] || ''),
      subtitle: String(r['Subtitle'] || ''),
      capacity: String(r['Capacity'] || ''),
      floor: String(r['Floor'] || ''),
      type: r['Room Type'] || 'LEC',
      status: r['Status'] || 'AVAILABLE NOW',
      status_bg: r['Status Bg'] || '#dcfce7',
      status_c: r['Status Text'] || '#166534',
      indicator_bg: '#4f46e5',
      image_url: r['Image URL'] || ''
    }))

    const res = await api.post('/api/classrooms/bulk', { rows })
    if (res.success) {
      alert(`Successfully imported ${res.count} classrooms!`)
      fetchClassrooms()
    }
  }

  const columns = [
    {
      key: 'select',
      label: (
        <input
          type="checkbox"
          checked={data.length > 0 && selectedIds.size === data.length}
          onChange={(e) => {
            if (e.target.checked) setSelectedIds(new Set(data.map(d => d.id)))
            else setSelectedIds(new Set())
          }}
          style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#4f46e5' }}
        />
      ),
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedIds.has(row.id)}
          onChange={() => toggleSelect(row.id)}
          onClick={e => e.stopPropagation()}
          style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#4f46e5' }}
        />
      )
    },
    { 
      key: 'name', 
      label: 'Room Name',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {row.image_url || row.img ? (
            <img src={row.image_url || row.img} style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover' }} />
          ) : (
            <div style={{ width: 44, height: 44, borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ImageIcon size={20} color="#94a3b8" />
            </div>
          )}
          <div>
            <div style={{ fontWeight: 700, color: '#0f172a' }}>{row.name}</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>{row.subtitle}</div>
          </div>
        </div>
      )
    },
    { key: 'block', label: 'Block' },
    { 
      key: 'classcode', 
      label: 'Code',
      render: (row) => (
        <span style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>
          {row.classcode || row.classCode || '—'}
        </span>
      )
    },
    { key: 'capacity', label: 'Capacity' },
    { 
      key: 'type', 
      label: 'Type',
      render: (row) => (
        <span style={{ fontSize: 11, fontWeight: 800, color: '#4f46e5', background: '#eef2ff', padding: '4px 10px', borderRadius: 8, textTransform: 'uppercase' }}>
          {row.type}
        </span>
      )
    },
    { 
      key: 'status', 
      label: 'Status',
      render: (row) => (
        <span style={{
          background: row.status_bg || '#dcfce7',
          color: row.status_c || '#166534',
          padding: '6px 14px', borderRadius: 50, fontSize: 11, fontWeight: 800,
          border: `1px solid ${row.status_bg ? row.status_bg.replace('22','11') : '#a7f3d0'}`
        }}>
          {row.status}
        </span>
      )
    }
  ]

  // Find the selected color key for the dropdown
  const currentColorKey = Object.keys(STATUS_COLORS).find(k => STATUS_COLORS[k].bg === formData.status_bg) || 'green'

  return (
    <>
      <AdminPageTemplate
        title="Manage Classrooms"
        description="Add, edit, or remove classroom and lab locations."
        columns={columns}
        data={data}
        loading={loading}
        onAdd={handleOpenAdd}
        onEdit={handleOpenEdit}
        onDelete={handleDelete}
        onBulkUpload={() => setBulkModalOpen(true)}
        onRefresh={fetchClassrooms}
      >
        {selectedIds.size > 0 && (
          <div style={{ background: '#ffffff', borderRadius: 16, padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 20, border: '1px solid #e2e8f0', boxShadow: '0 8px 24px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
              <div style={{ background: '#eef2ff', padding: '8px 12px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckSquare size={18} color="#4f46e5" />
                <span style={{ color: '#4f46e5', fontSize: 14, fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {selectedIds.size} classroom{selectedIds.size !== 1 ? 's' : ''} selected
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={bulkDelete} disabled={bulkLoading}
                style={{ padding: '10px 18px', borderRadius: 12, border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', fontSize: 13, fontWeight: 700, cursor: bulkLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: '0.2s', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#fef2f2' }}
              >
                <Trash2 size={16} /> Delete Selected
              </button>
              <div style={{ width: 1, background: '#e2e8f0', margin: '0 4px' }} />
              <button
                onClick={() => setSelectedIds(new Set())}
                style={{ padding: '10px', borderRadius: 12, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: '0.2s' }}
                 onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc' }}
              >
                <X size={18} />
              </button>
            </div>
          </div>
        )}
      </AdminPageTemplate>

      <BulkUploadModal 
        isOpen={bulkModalOpen}
        onClose={() => setBulkModalOpen(false)}
        title="Bulk Upload Classrooms"
        templateType="Classrooms"
        templateColumns={['Room Name', 'Block', 'Subtitle', 'Capacity', 'Floor', 'Room Type', 'Status', 'Status Bg', 'Status Text', 'Image URL']}
        templateData={[
          ['Programming Lab 1 (Delete this row)', 'CSED', 'L 106', '60', '01', 'LAB (Options: LEC, LAB, GENERAL)', 'AVAILABLE NOW (Options: AVAILABLE NOW, IN USE, MAINTENANCE)', '#dcfce7', '#166534', 'https://example.com/image.jpg']
        ]}
        expectedHeaders={['Room Name']}
        onUpload={(data) => handleBulkUpload(data.filter(r => !String(r['Room Name']).includes('(Delete this row)')))}
      />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingCard ? 'Edit Classroom' : 'Add Classroom'}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
          
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ flex: 2 }}>
              <label style={{ fontSize: 13, fontWeight: 700, marginBottom: 6, color: '#475569', display: 'block' }}>Room Name</label>
              <input required style={inputStyle} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Programming Lab 1" />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 13, fontWeight: 700, marginBottom: 6, color: '#475569', display: 'block' }}>Block</label>
              <input style={inputStyle} value={formData.block} onChange={e => setFormData({ ...formData, block: e.target.value })} placeholder="CSED" />
            </div>
          </div>

          <label style={{ fontSize: 13, fontWeight: 700, marginBottom: 6, color: '#475569', display: 'block' }}>Subtitle / Location Details</label>
          <input style={inputStyle} value={formData.subtitle} onChange={e => setFormData({ ...formData, subtitle: e.target.value })} placeholder="e.g. L 106 • PL Lab I" />

          <div style={{ display: 'flex', gap: 16 }}>
             <div style={{ flex: 1 }}>
              <label style={{ fontSize: 13, fontWeight: 700, marginBottom: 6, color: '#475569', display: 'block' }}>Capacity</label>
              <input type="number" style={inputStyle} value={formData.capacity} onChange={e => setFormData({ ...formData, capacity: e.target.value })} placeholder="60" />
            </div>
             <div style={{ flex: 1 }}>
              <label style={{ fontSize: 13, fontWeight: 700, marginBottom: 6, color: '#475569', display: 'block' }}>Floor</label>
              <input style={inputStyle} value={formData.floor} onChange={e => setFormData({ ...formData, floor: e.target.value })} placeholder="01" />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 13, fontWeight: 700, marginBottom: 6, color: '#475569', display: 'block' }}>Room Type</label>
              <select style={selectStyle} value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                <option value="LEC">Lecture</option>
                <option value="LAB">Lab</option>
                <option value="GENERAL">General</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 16 }}>
             <div style={{ flex: 1 }}>
              <label style={{ fontSize: 13, fontWeight: 700, marginBottom: 6, color: '#475569', display: 'block' }}>Status Message</label>
              <select style={selectStyle} value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                <option value="AVAILABLE NOW">Available Now</option>
                <option value="IN USE">In Use</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="CLASS IN SESSION">Class In Session</option>
                <option value="EXAM IN PROGRESS">Exam In Progress</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 13, fontWeight: 700, marginBottom: 6, color: '#475569', display: 'block' }}>Status Color</label>
              <select style={selectStyle} value={currentColorKey} onChange={e => {
                const color = STATUS_COLORS[e.target.value]
                setFormData({ ...formData, status_bg: color.bg, status_c: color.c })
              }}>
                {Object.keys(STATUS_COLORS).map(k => (
                  <option key={k} value={k}>{STATUS_COLORS[k].label}</option>
                ))}
              </select>
            </div>
          </div>

          <label style={{ fontSize: 13, fontWeight: 700, marginBottom: 6, color: '#475569', display: 'block' }}>Classroom Image</label>
          <div style={{ 
            position: 'relative', width: '100%', height: 160, borderRadius: 16, 
            border: '2px dashed #cbd5e1', background: '#f8fafc', display: 'flex', 
            flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
            cursor: 'pointer', overflow: 'hidden', marginBottom: 24, transition: '0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = '#4f46e5'}
          onMouseLeave={e => e.currentTarget.style.borderColor = '#cbd5e1'}
          >
            {imageFile ? (
              <img src={URL.createObjectURL(imageFile)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : formData.image_url ? (
              <img src={formData.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ textAlign: 'center', color: '#64748b', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <UploadCloud size={28} />
                <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, fontWeight: 700 }}>Click to upload image</div>
                <div style={{ fontSize: 12 }}>PNG, JPG up to 5MB</div>
              </div>
            )}
            <input type="file" style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} onChange={e => e.target.files[0] && setImageFile(e.target.files[0])} accept="image/*" />
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button type="button" onClick={() => setModalOpen(false)} style={{ flex: 1, padding: '14px', borderRadius: 12, border: '1.5px solid #e2e8f0', background: 'transparent', fontWeight: 600, color: '#475569', cursor: 'pointer' }}>Cancel</button>
            <button disabled={submitting} type="submit" style={{ 
              flex: 2, background: '#4f46e5', color: '#fff', border: 'none', padding: '14px', borderRadius: 12, 
              fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 15, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer'
            }}>
              {submitting ? 'Saving...' : (editingCard ? 'Save Changes' : 'Create Classroom')}
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}
