import React, { useState, useEffect } from 'react'
import AdminPageTemplate from '../../components/admin/AdminPageTemplate'
import Modal from '../../components/admin/Modal'
import BulkUploadModal from '../../components/admin/BulkUploadModal'
import api from '../../lib/api'

export default function AdminSocieties() {
  const [societies, setSocieties] = useState([])
  const [loading, setLoading] = useState(true)

  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editId, setEditId] = useState(null)
  const [bulkModalOpen, setBulkModalOpen] = useState(false)
  
  // File state for logo
  const [logoFile, setLogoFile] = useState(null)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Technical',
    email_id: '',
    website_link: '',
    logo_img: '',
    presidents: [{ name: '', email: '' }],
    vice_presidents: [{ name: '', email: '' }]
  })

  const CATEGORIES = ['Technical', 'Non-Technical', 'Academic', 'Cultural', 'Sports']

  const fetchSocieties = async () => {
    try {
      const res = await api.get('/api/societies')
      if (res.success) setSocieties(res.data || [])
    } catch (err) {
      console.error('Failed to fetch societies:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSocieties()
  }, [])

  const handleAdd = () => {
    setEditId(null)
    setLogoFile(null)
    setFormData({ 
      name: '', description: '', category: 'Technical',
      email_id: '', website_link: '', logo_img: '',
      presidents: [{ name: '', email: '' }], vice_presidents: [{ name: '', email: '' }]
    })
    setModalOpen(true)
  }

  const handleEdit = (society) => {
    setEditId(society.id)
    setLogoFile(null)
    setFormData({
      name: society.name || '',
      description: society.description || '',
      category: society.category || 'Technical',
      email_id: society.email_id || '',
      website_link: society.website_link || '',
      logo_img: society.logo_img || '',
      presidents: society.presidents && society.presidents.length ? society.presidents : [{ name: '', email: '' }],
      vice_presidents: society.vice_presidents && society.vice_presidents.length ? society.vice_presidents : [{ name: '', email: '' }]
    })
    setModalOpen(true)
  }

  const handleDelete = async (society) => {
    if (!window.confirm(`Are you sure you want to delete ${society.name}?`)) return
    try {
      const res = await api.delete(`/api/societies/${society.id}`)
      if (res.success) fetchSocieties()
    } catch (err) {
      alert('Delete failed.')
      console.error(err)
    }
  }

  const handleDynamicChange = (field, index, key, value) => {
    const list = [...formData[field]]
    list[index][key] = value
    setFormData({ ...formData, [field]: list })
  }
  const addDynamicField = (field) => {
    setFormData({ ...formData, [field]: [...formData[field], { name: '', email: '' }] })
  }
  const removeDynamicField = (field, index) => {
    const list = formData[field].filter((_, i) => i !== index)
    setFormData({ ...formData, [field]: list.length ? list : [{ name: '', email: '' }] })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      let finalLogo = formData.logo_img

      // Upload newly selected file if any
      if (logoFile) {
        const fileForm = new FormData()
        fileForm.append('file', logoFile)
        fileForm.append('type', 'workspace')
        const uploadRes = await api.upload('/api/upload/image', fileForm)
        if (uploadRes?.success) finalLogo = uploadRes.url
      }

      // Cleanup empty presidents/vp names
      const payload = {
        ...formData,
        logo_img: finalLogo,
        presidents: formData.presidents.filter(p => p.name.trim() !== ''),
        vice_presidents: formData.vice_presidents.filter(p => p.name.trim() !== '')
      }

      if (editId) {
        const res = await api.put(`/api/societies/${editId}`, payload)
        if (res.success) fetchSocieties()
      } else {
        const res = await api.post('/api/societies', payload)
        if (res.success) fetchSocieties()
      }
      setModalOpen(false)
    } catch (err) {
      alert(`Failed to save: ${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleBulkUpload = async (parsedData) => {
    const rows = parsedData.map(r => ({
      name: r['Society Name'] || 'Unnamed Society',
      category: r['Category'] || 'Technical',
      description: r['Description'] || '',
      email_id: r['Email ID'] || '',
      website_link: r['Website Link'] || '',
      presidents: r['President Name'] ? [{ name: r['President Name'], email: r['President Email'] || '' }] : [],
      vice_presidents: r['VP Name'] ? [{ name: r['VP Name'], email: r['VP Email'] || '' }] : [],
      logo_img: r['Logo URL'] || '',
      cover_url: '',
      member_count: 0
    }))

    const res = await api.post('/api/societies/bulk', { rows })
    if (res.success) {
      alert(`Successfully imported ${res.count} societies!`)
      fetchSocieties()
    }
  }

  const columns = [
    { label: 'Society', key: 'name', render: (row) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {row.logo_img ? (
          <img src={row.logo_img} alt="Logo" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: '1px solid #e2e8f0', flexShrink: 0 }} />
        ) : (
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#4f46e5', flexShrink: 0 }}>
            {row.name ? row.name.substring(0, 2).toUpperCase() : '?'}
          </div>
        )}
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.name}</div>
          {row.email_id && <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{row.email_id}</div>}
        </div>
      </div>
    )},
    { label: 'Category', key: 'category', render: (row) => (
      <span style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569', padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 700 }}>
        {row.category}
      </span>
    )},
    { label: 'Leadership', key: 'leadership', render: (row) => {
      const presCount = Array.isArray(row.presidents) ? row.presidents.length : 0;
      const vpCount = Array.isArray(row.vice_presidents) ? row.vice_presidents.length : 0;
      if (presCount === 0 && vpCount === 0) return <span style={{ color: '#94a3b8', fontSize: 13 }}>No leaders added</span>
      
      return (
        <div style={{ fontSize: 12, color: '#475569', lineHeight: '1.6' }}>
          {presCount > 0 && <div><strong style={{ color: '#0f172a' }}>P:</strong> {row.presidents.map(p => p.name).filter(Boolean).join(', ') || 'N/A'}</div>}
          {vpCount > 0 && <div><strong style={{ color: '#0f172a' }}>VP:</strong> {row.vice_presidents.map(p => p.name).filter(Boolean).join(', ') || 'N/A'}</div>}
        </div>
      )
    }},
    { label: 'Website', key: 'website_link', render: row => row.website_link ? (
      <a href={row.website_link} target="_blank" rel="noreferrer" style={{ color: '#4f46e5', textDecoration: 'none', fontWeight: 600, fontSize: 13, background: '#eef2ff', padding: '4px 10px', borderRadius: 8 }}>Visit Site</a>
    ) : <span style={{ color: '#cbd5e1' }}>-</span> },
  ]

  const inputStyle = { 
    width: '100%', padding: '0 16px', height: '48px', borderRadius: 12, border: '1.5px solid #e2e8f0', 
    outline: 'none', boxSizing: 'border-box', fontFamily: "'Inter', sans-serif", 
    fontSize: 14, color: '#1e293b', background: '#fff', transition: 'border-color 0.2s'
  }

  const selectStyle = {
    ...inputStyle,
    cursor: 'pointer',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3Csvg width='12' height='7' viewBox='0 0 12 7' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L6 6L11 1' stroke='%2364748b' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 16px center'
  }

  return (
    <>
      <AdminPageTemplate
        title="Manage Societies"
        description="Add and organize campus clubs, societies, and chapters."
        columns={columns}
        data={societies}
        loading={loading}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onBulkUpload={() => setBulkModalOpen(true)}
      />

      <BulkUploadModal 
        isOpen={bulkModalOpen}
        onClose={() => setBulkModalOpen(false)}
        title="Bulk Upload Societies"
        templateType="Societies"
        templateColumns={['Society Name', 'Category', 'Description', 'Email ID', 'Website Link', 'President Name', 'President Email', 'VP Name', 'VP Email', 'Logo URL']}
        templateData={[
          ['Robotics Club (Delete this row)', 'Technical (Options: Technical, Non-Technical, Academic, Cultural, Sports)', 'Club for robotics enthusiasts', 'robotics@uni.edu', 'https://robotics.uni.edu', 'John Doe', 'john@uni.edu', 'Jane Smith', 'jane@uni.edu', 'https://example.com/logo.jpg']
        ]}
        expectedHeaders={['Society Name']}
        onUpload={(data) => handleBulkUpload(data.filter(r => !String(r['Society Name']).includes('(Delete this row)')))}
      />

      <Modal isOpen={modalOpen} onClose={() => !submitting && setModalOpen(false)} title={editId ? "Edit Society" : "Add Society"}>
        <div style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: 8 }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 8 }}>Society Name *</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={inputStyle} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 8 }}>Category *</label>
                <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} style={selectStyle}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Logo Image (Optional)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                {(formData.logo_img || logoFile) && (
                  <img src={logoFile ? URL.createObjectURL(logoFile) : formData.logo_img} alt="Logo preview" style={{ width: 60, height: 60, borderRadius: 8, objectFit: 'cover', border: '1px solid #e2e8f0' }} />
                )}
                <div>
                  <input id="logo-upload" type="file" accept="image/*" onChange={e => setLogoFile(e.target.files[0])} style={{ display: 'none' }} />
                  <label htmlFor="logo-upload" style={{ display: 'inline-block', padding: '8px 16px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc', color: '#1e293b', fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'background 0.2s' }}>
                    {logoFile || formData.logo_img ? 'Change Logo' : 'Upload Logo'}
                  </label>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Email ID</label>
                <input type="email" value={formData.email_id} onChange={e => setFormData({ ...formData, email_id: e.target.value })} style={inputStyle} placeholder="society@university.edu" />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Website Link</label>
                <input type="url" value={formData.website_link} onChange={e => setFormData({ ...formData, website_link: e.target.value })} style={inputStyle} placeholder="https://..." />
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0' }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 12 }}>President(s)</label>
              {formData.presidents.map((p, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
                  <input type="text" placeholder="Name" value={p.name} onChange={e => handleDynamicChange('presidents', i, 'name', e.target.value)} style={{ ...inputStyle, padding: '8px 12px', flex: 1 }} />
                  <input type="email" placeholder="Email (Optional)" value={p.email || ''} onChange={e => handleDynamicChange('presidents', i, 'email', e.target.value)} style={{ ...inputStyle, padding: '8px 12px', flex: 1 }} />
                  <button type="button" onClick={() => removeDynamicField('presidents', i)} style={{ padding: '8px 12px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: 8, cursor: 'pointer' }}>X</button>
                </div>
              ))}
              <button type="button" onClick={() => addDynamicField('presidents')} style={{ fontSize: 12, fontWeight: 600, color: '#4f46e5', background: 'transparent', border: 'none', cursor: 'pointer', marginTop: 4 }}>+ Add Another President</button>
            </div>

            <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0' }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 12 }}>Vice President(s)</label>
              {formData.vice_presidents.map((vp, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
                  <input type="text" placeholder="Name" value={vp.name} onChange={e => handleDynamicChange('vice_presidents', i, 'name', e.target.value)} style={{ ...inputStyle, padding: '8px 12px', flex: 1 }} />
                  <input type="email" placeholder="Email (Optional)" value={vp.email || ''} onChange={e => handleDynamicChange('vice_presidents', i, 'email', e.target.value)} style={{ ...inputStyle, padding: '8px 12px', flex: 1 }} />
                  <button type="button" onClick={() => removeDynamicField('vice_presidents', i)} style={{ padding: '8px 12px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: 8, cursor: 'pointer' }}>X</button>
                </div>
              ))}
              <button type="button" onClick={() => addDynamicField('vice_presidents')} style={{ fontSize: 12, fontWeight: 600, color: '#4f46e5', background: 'transparent', border: 'none', cursor: 'pointer', marginTop: 4 }}>+ Add Another Vice President</button>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Description</label>
              <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={4} style={{ ...inputStyle, resize: 'vertical' }} />
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
              <button type="button" onClick={() => setModalOpen(false)} disabled={submitting} style={{ flex: 1, padding: '14px', borderRadius: 12, border: '1.5px solid #e2e8f0', background: 'transparent', fontWeight: 700, color: '#475569', cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 15 }}>Cancel</button>
              <button type="submit" disabled={submitting} style={{ flex: 2, padding: '14px', borderRadius: 12, border: 'none', background: '#4f46e5', color: '#fff', cursor: 'pointer', fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 15 }}>{submitting ? 'Saving...' : 'Save Society'}</button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  )
}
