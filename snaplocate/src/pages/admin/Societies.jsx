import React, { useState, useEffect } from 'react'
import AdminPageTemplate from '../../components/admin/AdminPageTemplate'
import Modal from '../../components/admin/Modal'
import BulkUploadModal from '../../components/admin/BulkUploadModal'
import api from '../../lib/api'

const CATEGORIES = ['Technical', 'Non-Technical', 'Academic', 'Cultural', 'Sports']

const fieldCls = 'w-full h-12 px-4 rounded-[12px] border-[1.5px] border-slate-200 text-[14px] text-slate-800 bg-white outline-none box-border focus:border-brand transition-colors'

export default function AdminSocieties() {
  const [societies, setSocieties] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editId, setEditId] = useState(null)
  const [bulkModalOpen, setBulkModalOpen] = useState(false)
  const [logoFile, setLogoFile] = useState(null)
  const [formData, setFormData] = useState({
    name: '', description: '', category: 'Technical',
    email_id: '', website_link: '', logo_img: '',
    presidents: [{ name: '', email: '' }],
    vice_presidents: [{ name: '', email: '' }]
  })

  const fetchSocieties = async () => {
    try {
      const res = await api.get('/api/societies')
      if (res.success) setSocieties(res.data || [])
    } catch (err) { console.error('Failed to fetch societies:', err) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchSocieties() }, [])

  const handleAdd = () => {
    setEditId(null); setLogoFile(null)
    setFormData({ name: '', description: '', category: 'Technical', email_id: '', website_link: '', logo_img: '', presidents: [{ name: '', email: '' }], vice_presidents: [{ name: '', email: '' }] })
    setModalOpen(true)
  }

  const handleEdit = (society) => {
    setEditId(society.id); setLogoFile(null)
    setFormData({
      name: society.name || '', description: society.description || '', category: society.category || 'Technical',
      email_id: society.email_id || '', website_link: society.website_link || '', logo_img: society.logo_img || '',
      presidents: society.presidents?.length ? society.presidents : [{ name: '', email: '' }],
      vice_presidents: society.vice_presidents?.length ? society.vice_presidents : [{ name: '', email: '' }]
    })
    setModalOpen(true)
  }

  const handleDelete = async (society) => {
    if (!window.confirm(`Are you sure you want to delete ${society.name}?`)) return
    try {
      const res = await api.delete(`/api/societies/${society.id}`)
      if (res.success) fetchSocieties()
    } catch (err) { alert('Delete failed.'); console.error(err) }
  }

  const handleDynamicChange = (field, index, key, value) => {
    const list = [...formData[field]]; list[index][key] = value
    setFormData({ ...formData, [field]: list })
  }
  const addDynamicField = (field) => setFormData({ ...formData, [field]: [...formData[field], { name: '', email: '' }] })
  const removeDynamicField = (field, index) => {
    const list = formData[field].filter((_, i) => i !== index)
    setFormData({ ...formData, [field]: list.length ? list : [{ name: '', email: '' }] })
  }

  const handleSubmit = async (e) => {
    e.preventDefault(); setSubmitting(true)
    try {
      let finalLogo = formData.logo_img
      if (logoFile) {
        const fd = new FormData(); fd.append('file', logoFile); fd.append('type', 'workspace')
        const r = await api.upload('/api/upload/image', fd)
        if (r?.success) finalLogo = r.url
      }
      const payload = {
        ...formData, logo_img: finalLogo,
        presidents: formData.presidents.filter(p => p.name.trim()),
        vice_presidents: formData.vice_presidents.filter(p => p.name.trim())
      }
      if (editId) { const res = await api.put(`/api/societies/${editId}`, payload); if (res.success) fetchSocieties() }
      else { const res = await api.post('/api/societies', payload); if (res.success) fetchSocieties() }
      setModalOpen(false)
    } catch (err) { alert(`Failed to save: ${err.message}`) }
    finally { setSubmitting(false) }
  }

  const handleBulkUpload = async (parsedData) => {
    const rows = parsedData.map(r => ({
      name: r['Society Name'] || 'Unnamed Society', category: r['Category'] || 'Technical',
      description: r['Description'] || '', email_id: r['Email ID'] || '', website_link: r['Website Link'] || '',
      presidents: r['President Name'] ? [{ name: r['President Name'], email: r['President Email'] || '' }] : [],
      vice_presidents: r['VP Name'] ? [{ name: r['VP Name'], email: r['VP Email'] || '' }] : [],
      logo_img: r['Logo URL'] || '', cover_url: '', member_count: 0
    }))
    const res = await api.post('/api/societies/bulk', { rows })
    if (res.success) { alert(`Successfully imported ${res.count} societies!`); fetchSocieties() }
  }

  const fd = (k, v) => setFormData(p => ({ ...p, [k]: v }))

  const columns = [
    {
      label: 'Society', key: 'name', render: (row) => (
        <div className="flex items-center gap-3">
          {row.logo_img
            ? <img src={row.logo_img} alt="Logo" className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0" />
            : <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-[14px] font-extrabold text-brand shrink-0">
                {row.name ? row.name.substring(0, 2).toUpperCase() : '?'}
              </div>}
          <div className="min-w-0">
            <div className="font-bold t-primary truncate">{row.name}</div>
            {row.email_id && <div className="text-[12px] t-muted mt-0.5">{row.email_id}</div>}
          </div>
        </div>
      )
    },
    {
      label: 'Category', key: 'category', render: (row) => (
        <span className="bg-slate-50 border border-slate-200 text-slate-600 px-2.5 py-1 rounded-[12px] text-[12px] font-bold">{row.category}</span>
      )
    },
    {
      label: 'Leadership', key: 'leadership', render: (row) => {
        const presCount = Array.isArray(row.presidents) ? row.presidents.length : 0
        const vpCount = Array.isArray(row.vice_presidents) ? row.vice_presidents.length : 0
        if (presCount === 0 && vpCount === 0) return <span className="text-[13px] text-slate-300">No leaders added</span>
        return (
          <div className="text-[12px] text-slate-600 leading-relaxed">
            {presCount > 0 && <div><strong className="t-primary">P:</strong> {row.presidents.map(p => p.name).filter(Boolean).join(', ') || 'N/A'}</div>}
            {vpCount > 0 && <div><strong className="t-primary">VP:</strong> {row.vice_presidents.map(p => p.name).filter(Boolean).join(', ') || 'N/A'}</div>}
          </div>
        )
      }
    },
    {
      label: 'Website', key: 'website_link', render: (row) => row.website_link
        ? <a href={row.website_link} target="_blank" rel="noreferrer" className="text-brand font-semibold text-[13px] bg-indigo-50 px-2.5 py-1 rounded-[8px] no-underline">Visit Site</a>
        : <span className="text-slate-200">-</span>
    },
  ]

  return (
    <>
      <AdminPageTemplate
        title="Manage Societies"
        description="Add and organize campus clubs, societies, and chapters."
        columns={columns} data={societies} loading={loading}
        onAdd={handleAdd} onEdit={handleEdit} onDelete={handleDelete}
        onBulkUpload={() => setBulkModalOpen(true)}
      />

      <BulkUploadModal
        isOpen={bulkModalOpen} onClose={() => setBulkModalOpen(false)}
        title="Bulk Upload Societies" templateType="Societies"
        templateColumns={['Society Name', 'Category', 'Description', 'Email ID', 'Website Link', 'President Name', 'President Email', 'VP Name', 'VP Email', 'Logo URL']}
        templateData={[['Robotics Club (Delete this row)', 'Technical (Options: Technical, Non-Technical, Academic, Cultural, Sports)', 'Club for robotics enthusiasts', 'robotics@uni.edu', 'https://robotics.uni.edu', 'John Doe', 'john@uni.edu', 'Jane Smith', 'jane@uni.edu', 'https://example.com/logo.jpg']]}
        expectedHeaders={['Society Name']}
        onUpload={data => handleBulkUpload(data.filter(r => !String(r['Society Name']).includes('(Delete this row)')))}
      />

      <Modal isOpen={modalOpen} onClose={() => !submitting && setModalOpen(false)} title={editId ? 'Edit Society' : 'Add Society'}>
        <div className="max-h-[70vh] overflow-y-auto pr-2">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-[13px] font-bold text-slate-600 mb-2">Society Name *</label>
                <input required type="text" value={formData.name} onChange={e => fd('name', e.target.value)} className={fieldCls} />
              </div>
              <div className="flex-1">
                <label className="block text-[13px] font-bold text-slate-600 mb-2">Category *</label>
                <select value={formData.category} onChange={e => fd('category', e.target.value)} className={fieldCls}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Logo Image (Optional)</label>
              <div className="flex items-center gap-4">
                {(formData.logo_img || logoFile) && (
                  <img src={logoFile ? URL.createObjectURL(logoFile) : formData.logo_img} alt="Logo preview" className="w-[60px] h-[60px] rounded-[8px] object-cover border border-slate-200" />
                )}
                <div>
                  <input id="logo-upload" type="file" accept="image/*" onChange={e => setLogoFile(e.target.files[0])} className="hidden" />
                  <label htmlFor="logo-upload" className="inline-block px-4 py-2 rounded-[8px] border border-slate-300 bg-slate-50 text-slate-800 font-semibold text-[13px] cursor-pointer hover:bg-slate-100 transition-colors">
                    {logoFile || formData.logo_img ? 'Change Logo' : 'Upload Logo'}
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Email ID</label>
                <input type="email" value={formData.email_id} onChange={e => fd('email_id', e.target.value)} className={fieldCls} placeholder="society@university.edu" />
              </div>
              <div className="flex-1">
                <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Website Link</label>
                <input type="url" value={formData.website_link} onChange={e => fd('website_link', e.target.value)} className={fieldCls} placeholder="https://..." />
              </div>
            </div>

            {[{ key: 'presidents', label: "President(s)" }, { key: 'vice_presidents', label: "Vice President(s)" }].map(({ key, label }) => (
              <div key={key} className="bg-slate-50 p-4 rounded-[12px] border border-slate-200">
                <label className="block text-[13px] font-bold text-slate-700 mb-3">{label}</label>
                {formData[key].map((p, i) => (
                  <div key={i} className="flex gap-2 mb-2 items-start">
                    <input type="text" placeholder="Name" value={p.name} onChange={e => handleDynamicChange(key, i, 'name', e.target.value)}
                      className="flex-1 h-[42px] px-3 rounded-[8px] border-[1.5px] border-slate-200 text-[13px] outline-none bg-white focus:border-brand transition-colors" />
                    <input type="email" placeholder="Email (Optional)" value={p.email || ''} onChange={e => handleDynamicChange(key, i, 'email', e.target.value)}
                      className="flex-1 h-[42px] px-3 rounded-[8px] border-[1.5px] border-slate-200 text-[13px] outline-none bg-white focus:border-brand transition-colors" />
                    <button type="button" onClick={() => removeDynamicField(key, i)} className="px-3 py-2 bg-red-50 text-red-500 border-0 rounded-[8px] cursor-pointer hover:bg-red-100 transition-colors">×</button>
                  </div>
                ))}
                <button type="button" onClick={() => addDynamicField(key)} className="text-[12px] font-semibold text-brand bg-transparent border-0 cursor-pointer mt-1">+ Add Another {key === 'presidents' ? 'President' : 'Vice President'}</button>
              </div>
            ))}

            <div>
              <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Description</label>
              <textarea value={formData.description} onChange={e => fd('description', e.target.value)} rows={4}
                className="w-full px-4 py-3 rounded-[12px] border-[1.5px] border-slate-200 text-[14px] outline-none resize-y box-border bg-white focus:border-brand transition-colors" />
            </div>

            <div className="flex gap-3 mt-3">
              <button type="button" onClick={() => setModalOpen(false)} disabled={submitting}
                className="flex-1 py-3.5 rounded-[12px] border-[1.5px] border-slate-200 bg-transparent font-bold text-slate-600 cursor-pointer text-[15px]">Cancel</button>
              <button type="submit" disabled={submitting}
                className="flex-[2] py-3.5 rounded-[12px] border-0 bg-brand text-white cursor-pointer font-bold text-[15px]">
                {submitting ? 'Saving...' : 'Save Society'}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  )
}
