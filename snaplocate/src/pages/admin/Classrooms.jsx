import React, { useState, useEffect } from 'react'
import AdminPageTemplate from '../../components/admin/AdminPageTemplate'
import api from '../../lib/api'
import BulkUploadModal from '../../components/admin/BulkUploadModal'
import { Plus, Trash2, X, CheckSquare, UploadCloud, Image as ImageIcon } from 'lucide-react'

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[4px] z-[1000] flex items-center justify-center p-5">
      <div className="bg-white p-8 rounded-[24px] w-full max-w-[540px] max-h-[90vh] overflow-y-auto shadow-[0_20px_50px_rgba(0,0,0,0.15)]">
        <div className="flex justify-between mb-6">
          <h2 className="m-0 text-[20px] font-extrabold t-primary">{title}</h2>
          <button onClick={onClose} className="border-0 bg-slate-100 cursor-pointer w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

const fieldCls = 'w-full h-12 px-4 rounded-[12px] border-[1.5px] border-slate-200 text-[14px] text-slate-800 bg-white outline-none box-border focus:border-brand transition-colors mb-4'
const labelCls = 'text-[13px] font-bold text-slate-600 mb-1.5 block'

const STATUS_COLORS = {
  'green':  { bg: '#dcfce7', c: '#166534', label: 'Green (Available)' },
  'red':    { bg: '#fee2e2', c: '#991b1b', label: 'Red (In Use)' },
  'yellow': { bg: '#fef3c7', c: '#92400e', label: 'Yellow (Maintenance)' },
  'blue':   { bg: '#dbeafe', c: '#1e40af', label: 'Blue (Info)' },
  'indigo': { bg: '#e0e7ff', c: '#3730a3', label: 'Indigo (Special)' },
}

export default function ManageClassrooms() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCard, setEditingCard] = useState(null)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)
  const [bulkModalOpen, setBulkModalOpen] = useState(false)
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
      if (res.success) setData(res.data)
    } catch (err) {
      console.error('Failed to load classrooms:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchClassrooms() }, [])

  const handleOpenAdd = () => {
    setEditingCard(null)
    setFormData({ name: '', subtitle: '', type: 'LEC', status: 'AVAILABLE NOW', status_bg: '#dcfce7', status_c: '#166534', block: '', floor: '', capacity: '', indicator_bg: '#4f46e5', image_url: '' })
    setImageFile(null); setModalOpen(true)
  }

  const handleOpenEdit = (row) => {
    setEditingCard(row)
    setFormData({ name: row.name || '', subtitle: row.subtitle || '', type: row.type || 'LEC', status: row.status || 'AVAILABLE NOW', status_bg: row.status_bg || '#dcfce7', status_c: row.status_c || '#166534', block: row.block || '', floor: row.floor || '', capacity: row.capacity || '', indicator_bg: row.indicator_bg || '#4f46e5', image_url: row.image_url || row.img || '' })
    setImageFile(null); setModalOpen(true)
  }

  const handleDelete = async (row) => {
    if (!window.confirm(`Are you sure you want to delete ${row.name}?`)) return
    try {
      const res = await api.delete(`/api/classrooms/${row.id}`)
      if (res.success) {
        setData(prev => prev.filter(c => c.id !== row.id))
        setSelectedIds(prev => { const n = new Set(prev); n.delete(row.id); return n })
      }
    } catch { alert('Delete failed') }
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
    setSelectedIds(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next })
  }

  const handleSubmit = async (e) => {
    e.preventDefault(); setSubmitting(true)
    try {
      let finalImageUrl = formData.image_url
      if (imageFile) {
        const fd = new FormData(); fd.append('file', imageFile); fd.append('type', 'workspace')
        const r = await api.upload('/api/upload/image', fd)
        if (r?.success) finalImageUrl = r.url
      }
      const payload = { ...formData, image_url: finalImageUrl }
      if (editingCard) await api.put(`/api/classrooms/${editingCard.id}`, payload)
      else await api.post('/api/classrooms', payload)
      setModalOpen(false); fetchClassrooms()
    } catch (err) { alert('Operation failed'); console.error(err) }
    finally { setSubmitting(false) }
  }

  const handleBulkUpload = async (parsedData) => {
    const rows = parsedData.map(r => ({
      name: r['Room Name'] || 'Unnamed Room', block: String(r['Block'] || ''),
      subtitle: String(r['Subtitle'] || ''), capacity: String(r['Capacity'] || ''),
      floor: String(r['Floor'] || ''), type: r['Room Type'] || 'LEC',
      status: r['Status'] || 'AVAILABLE NOW', status_bg: r['Status Bg'] || '#dcfce7',
      status_c: r['Status Text'] || '#166534', indicator_bg: '#4f46e5', image_url: r['Image URL'] || ''
    }))
    const res = await api.post('/api/classrooms/bulk', { rows })
    if (res.success) { alert(`Successfully imported ${res.count} classrooms!`); fetchClassrooms() }
  }

  const fd = (k, v) => setFormData(p => ({ ...p, [k]: v }))
  const currentColorKey = Object.keys(STATUS_COLORS).find(k => STATUS_COLORS[k].bg === formData.status_bg) || 'green'

  const columns = [
    {
      key: 'select',
      label: (
        <input type="checkbox" checked={data.length > 0 && selectedIds.size === data.length}
          onChange={e => e.target.checked ? setSelectedIds(new Set(data.map(d => d.id))) : setSelectedIds(new Set())}
          className="w-4 h-4 cursor-pointer accent-brand" />
      ),
      render: (row) => (
        <input type="checkbox" checked={selectedIds.has(row.id)} onChange={() => toggleSelect(row.id)}
          onClick={e => e.stopPropagation()} className="w-4 h-4 cursor-pointer accent-brand" />
      )
    },
    {
      key: 'name', label: 'Room Name',
      render: (row) => (
        <div className="flex items-center gap-3">
          {row.image_url || row.img
            ? <img src={row.image_url || row.img} className="w-11 h-11 rounded-[8px] object-cover" />
            : <div className="w-11 h-11 rounded-[8px] bg-slate-50 border border-slate-200 flex items-center justify-center"><ImageIcon size={20} color="#94a3b8" /></div>}
          <div>
            <div className="font-bold t-primary">{row.name}</div>
            <div className="text-[12px] t-muted">{row.subtitle}</div>
          </div>
        </div>
      )
    },
    { key: 'block', label: 'Block' },
    {
      key: 'classcode', label: 'Code',
      render: (row) => <span className="text-[13px] font-semibold text-slate-600">{row.classcode || row.classCode || '—'}</span>
    },
    { key: 'capacity', label: 'Capacity' },
    {
      key: 'type', label: 'Type',
      render: (row) => <span className="text-[11px] font-extrabold text-brand bg-indigo-50 px-2.5 py-1 rounded-[8px] uppercase">{row.type}</span>
    },
    {
      key: 'status', label: 'Status',
      render: (row) => (
        <span className="inline-block whitespace-nowrap px-3.5 py-[6px] rounded-full text-[11px] font-extrabold border"
          style={{ background: row.status_bg || '#dcfce7', color: row.status_c || '#166534', borderColor: (row.status_bg || '#dcfce7').replace('22', '11') }}>
          {row.status}
        </span>
      )
    }
  ]

  return (
    <>
      <AdminPageTemplate
        title="Manage Classrooms"
        description="Add, edit, or remove classroom and lab locations."
        columns={columns} data={data} loading={loading}
        onAdd={handleOpenAdd} onEdit={handleOpenEdit} onDelete={handleDelete}
        onBulkUpload={() => setBulkModalOpen(true)} onRefresh={fetchClassrooms}
      >
        {selectedIds.size > 0 && (
          <div className="bg-white rounded-[16px] px-6 py-4 flex items-center gap-4 flex-wrap mb-5 border border-slate-200 shadow-[0_8px_24px_rgba(0,0,0,0.04)]">
            <div className="flex items-center gap-2.5 flex-1">
              <div className="bg-indigo-50 px-3 py-2 rounded-[10px] flex items-center gap-2">
                <CheckSquare size={18} color="#4f46e5" />
                <span className="text-brand text-[14px] font-bold">{selectedIds.size} classroom{selectedIds.size !== 1 ? 's' : ''} selected</span>
              </div>
            </div>
            <div className="flex gap-2.5">
              <button onClick={bulkDelete} disabled={bulkLoading}
                className="flex items-center gap-1.5 px-[18px] py-2.5 rounded-[12px] border border-red-200 bg-red-50 text-red-600 text-[13px] font-bold cursor-pointer hover:bg-red-100 transition-colors">
                <Trash2 size={16} /> Delete Selected
              </button>
              <div className="w-px bg-slate-200 mx-1" />
              <button onClick={() => setSelectedIds(new Set())}
                className="p-2.5 rounded-[12px] border border-slate-200 bg-slate-50 text-slate-500 cursor-pointer flex hover:bg-slate-100 transition-colors">
                <X size={18} />
              </button>
            </div>
          </div>
        )}
      </AdminPageTemplate>

      <BulkUploadModal
        isOpen={bulkModalOpen} onClose={() => setBulkModalOpen(false)}
        title="Bulk Upload Classrooms" templateType="Classrooms"
        templateColumns={['Room Name', 'Block', 'Subtitle', 'Capacity', 'Floor', 'Room Type', 'Status', 'Status Bg', 'Status Text', 'Image URL']}
        templateData={[['Programming Lab 1 (Delete this row)', 'CSED', 'L 106', '60', '01', 'LAB (Options: LEC, LAB, GENERAL)', 'AVAILABLE NOW (Options: AVAILABLE NOW, IN USE, MAINTENANCE)', '#dcfce7', '#166534', 'https://example.com/image.jpg']]}
        expectedHeaders={['Room Name']}
        onUpload={d => handleBulkUpload(d.filter(r => !String(r['Room Name']).includes('(Delete this row)')))}
      />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingCard ? 'Edit Classroom' : 'Add Classroom'}>
        <form onSubmit={handleSubmit} className="flex flex-col">

          <div className="flex gap-4">
            <div className="flex-[2]">
              <label className={labelCls}>Room Name</label>
              <input required className={fieldCls} value={formData.name} onChange={e => fd('name', e.target.value)} placeholder="e.g. Programming Lab 1" />
            </div>
            <div className="flex-1">
              <label className={labelCls}>Block</label>
              <input className={fieldCls} value={formData.block} onChange={e => fd('block', e.target.value)} placeholder="CSED" />
            </div>
          </div>

          <label className={labelCls}>Subtitle / Location Details</label>
          <input className={fieldCls} value={formData.subtitle} onChange={e => fd('subtitle', e.target.value)} placeholder="e.g. L 106 • PL Lab I" />

          <div className="flex gap-4">
            <div className="flex-1">
              <label className={labelCls}>Capacity</label>
              <input type="number" className={fieldCls} value={formData.capacity} onChange={e => fd('capacity', e.target.value)} placeholder="60" />
            </div>
            <div className="flex-1">
              <label className={labelCls}>Floor</label>
              <input className={fieldCls} value={formData.floor} onChange={e => fd('floor', e.target.value)} placeholder="01" />
            </div>
            <div className="flex-1">
              <label className={labelCls}>Room Type</label>
              <select className={fieldCls} value={formData.type} onChange={e => fd('type', e.target.value)}>
                <option value="LEC">Lecture</option>
                <option value="LAB">Lab</option>
                <option value="GENERAL">General</option>
              </select>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className={labelCls}>Status Message</label>
              <select className={fieldCls} value={formData.status} onChange={e => fd('status', e.target.value)}>
                <option value="AVAILABLE NOW">Available Now</option>
                <option value="IN USE">In Use</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="CLASS IN SESSION">Class In Session</option>
                <option value="EXAM IN PROGRESS">Exam In Progress</option>
              </select>
            </div>
            <div className="flex-1">
              <label className={labelCls}>Status Color</label>
              <select className={fieldCls} value={currentColorKey} onChange={e => {
                const color = STATUS_COLORS[e.target.value]
                setFormData(p => ({ ...p, status_bg: color.bg, status_c: color.c }))
              }}>
                {Object.keys(STATUS_COLORS).map(k => <option key={k} value={k}>{STATUS_COLORS[k].label}</option>)}
              </select>
            </div>
          </div>

          <label className={labelCls}>Classroom Image</label>
          <div className="relative w-full h-40 rounded-[16px] border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center cursor-pointer overflow-hidden mb-6 hover:border-brand transition-colors">
            {imageFile ? (
              <img src={URL.createObjectURL(imageFile)} className="w-full h-full object-cover" />
            ) : formData.image_url ? (
              <img src={formData.image_url} className="w-full h-full object-cover" />
            ) : (
              <div className="text-center text-slate-500 flex flex-col items-center gap-2">
                <UploadCloud size={28} />
                <div className="text-[14px] font-bold">Click to upload image</div>
                <div className="text-[12px]">PNG, JPG up to 5MB</div>
              </div>
            )}
            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => e.target.files[0] && setImageFile(e.target.files[0])} accept="image/*" />
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-3.5 rounded-[12px] border-[1.5px] border-slate-200 bg-transparent font-semibold text-slate-600 cursor-pointer hover:bg-slate-50 transition-colors">Cancel</button>
            <button disabled={submitting} type="submit" className={`flex-[2] py-3.5 rounded-[12px] border-0 text-white text-[15px] font-bold ${submitting ? 'bg-slate-200 cursor-not-allowed' : 'bg-brand cursor-pointer'}`}>
              {submitting ? 'Saving...' : (editingCard ? 'Save Changes' : 'Create Classroom')}
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}
