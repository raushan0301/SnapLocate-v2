import React, { useState, useEffect } from 'react'
import AdminPageTemplate from '../../components/admin/AdminPageTemplate'
import Modal from '../../components/admin/Modal'
import api from '../../lib/api'

export default function Shops() {
  const [shops, setShops] = useState([])
  const [loading, setLoading] = useState(true)

  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editId, setEditId] = useState(null)
  const [logoFile, setLogoFile] = useState(null)
  const [menuFile, setMenuFile] = useState(null)

  const [formData, setFormData] = useState({
    name: '', type: '', category: 'Cafe',
    status: 'OPEN', phone: '',
    location_tag: 'COS', location_detail: '',
    btn_label: 'View Menu', btn_icon: 'book', logo_img: '',
    menu_type: 'image', menu_img: '', menu_items: [{ name: '', price: '' }]
  })

  const CATEGORIES = ['Cafe', 'Food', 'Stationary', 'General Store']
  const LOCATIONS = ['Jaggi', 'COS', 'G Block', 'TSLAS']
  const STATUSES = ['OPEN', 'CLOSED', 'CLOSING SOON']
  const ICONS = ['book', 'bag', 'file']

  const fetchShops = async () => {
    try {
      const res = await api.get('/api/shops')
      if (res.success) setShops(res.data || [])
    } catch (err) {
      console.error('Failed to fetch shops:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchShops()
  }, [])

  const handleAdd = () => {
    setEditId(null)
    setLogoFile(null)
    setMenuFile(null)
    setFormData({ 
      name: '', type: '', category: 'Cafe',
      status: 'OPEN', phone: '',
      location_tag: 'COS', location_detail: '',
      btn_label: 'View Menu', btn_icon: 'book', logo_img: '',
      menu_type: 'image', menu_img: '', menu_items: [{ name: '', price: '' }]
    })
    setModalOpen(true)
  }

  const handleEdit = (shop) => {
    setEditId(shop.id)
    setLogoFile(null)
    setMenuFile(null)
    setFormData({
      ...shop,
      menu_type: shop.menu_type || 'image',
      menu_items: shop.menu_items || [{ name: '', price: '' }]
    })
    setModalOpen(true)
  }

  const handleDelete = async (shop) => {
    if (!window.confirm(`Are you sure you want to delete ${shop.name}?`)) return
    try {
      const res = await api.delete(`/api/shops/${shop.id}`)
      if (res.success) fetchShops()
    } catch (err) {
      alert('Delete failed.')
    }
  }

  const handleMenuItemChange = (index, field, value) => {
    const list = [...formData.menu_items]
    list[index][field] = value
    setFormData({ ...formData, menu_items: list })
  }
  const addMenuItem = () => setFormData({ ...formData, menu_items: [...formData.menu_items, { name: '', price: '' }] })
  const removeMenuItem = (index) => setFormData({ ...formData, menu_items: formData.menu_items.filter((_, i) => i !== index) })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      let finalLogo = formData.logo_img
      let finalMenuImg = formData.menu_img

      // Upload logo
      if (logoFile) {
        const fileForm = new FormData()
        fileForm.append('file', logoFile)
        fileForm.append('type', 'shop')
        const uploadRes = await api.upload('/api/upload/image', fileForm)
        if (uploadRes?.success) finalLogo = uploadRes.url
      }

      // Upload menu image
      if (menuFile && formData.menu_type === 'image') {
        const fileForm = new FormData()
        fileForm.append('file', menuFile)
        fileForm.append('type', 'shop')
        const uploadRes = await api.upload('/api/upload/image', fileForm)
        if (uploadRes?.success) finalMenuImg = uploadRes.url
      }

      const payload = { 
        ...formData, 
        logo_img: finalLogo, 
        menu_img: finalMenuImg,
        menu_items: formData.menu_type === 'list' ? formData.menu_items.filter(i => i.name.trim()) : []
      }

      if (editId) {
        const res = await api.put(`/api/shops/${editId}`, payload)
        if (res.success) fetchShops()
      } else {
        const res = await api.post('/api/shops', payload)
        if (res.success) fetchShops()
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
    { label: 'Shop Details', key: 'name', render: (row) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#fff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {row.logo_img ? (
            <img src={row.logo_img} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: 20 }}>🏪</span>
          )}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.name}</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{row.category} • {row.phone}</div>
        </div>
      </div>
    )},
    { label: 'Location', key: 'location_tag', render: (row) => (
      <div>
        <span style={{ fontWeight: 600, color: '#475569' }}>{row.location_tag}</span>
        {row.location_detail && <div style={{ fontSize: 11, color: '#94a3b8' }}>{row.location_detail}</div>}
      </div>
    )},
    { label: 'Menu Type', key: 'menu_type', render: (row) => (
      <span style={{ fontSize: 12, color: '#64748b', textTransform: 'capitalize' }}>{row.menu_type || 'None'}</span>
    )},
    { label: 'Status', key: 'status', render: (row) => {
      const open = row.status === 'OPEN'
      return (
        <span style={{ background: open ? '#dcfce7' : '#fee2e2', color: open ? '#16a34a' : '#dc2626', padding: '4px 8px', borderRadius: 12, fontSize: 11, fontWeight: 800 }}>
          {row.status}
        </span>
      )
    }},
  ]

  return (
    <>
      <AdminPageTemplate
        title="Manage Shops"
        description="Update campus vendor information, menus, and operating statuses."
        columns={columns}
        data={shops}
        loading={loading}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <Modal isOpen={modalOpen} onClose={() => !submitting && setModalOpen(false)} title={editId ? "Edit Shop" : "Add Shop"}>
        <div style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: 8 }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Shop Name *</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={inputStyle} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Shop Type (Subtitle) *</label>
                <input required type="text" placeholder="e.g. Fast Food" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} style={inputStyle} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Shop Logo / Image (Optional)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                {(formData.logo_img || logoFile) && (
                  <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#fff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    <img src={logoFile ? URL.createObjectURL(logoFile) : formData.logo_img} alt="Logo preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
                <div>
                  <input id="shop-logo-upload" type="file" accept="image/*" onChange={e => setLogoFile(e.target.files[0])} style={{ display: 'none' }} />
                  <label htmlFor="shop-logo-upload" style={{ display: 'inline-block', padding: '8px 16px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc', color: '#1e293b', fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'background 0.2s' }}>
                    {logoFile || formData.logo_img ? 'Change Image' : 'Upload Image'}
                  </label>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Root Category *</label>
                <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} style={{ ...inputStyle, background: '#fff' }}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Current Status *</label>
                <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} style={{ ...inputStyle, background: '#fff', fontWeight: 600, color: formData.status === 'OPEN' ? '#16a34a' : '#dc2626' }}>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 16, background: '#f8fafc' }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 12 }}>Menu Management</label>
              <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                  <input type="radio" checked={formData.menu_type === 'image'} onChange={() => setFormData({ ...formData, menu_type: 'image' })} /> Upload Image
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                  <input type="radio" checked={formData.menu_type === 'list'} onChange={() => setFormData({ ...formData, menu_type: 'list' })} /> Manual List
                </label>
              </div>

              {formData.menu_type === 'image' ? (
                <div>
                  {(formData.menu_img || menuFile) && (
                    <img src={menuFile ? URL.createObjectURL(menuFile) : formData.menu_img} style={{ width: '100%', maxHeight: 200, objectFit: 'contain', borderRadius: 8, marginBottom: 12, border: '1px solid #e2e8f0' }} />
                  )}
                  <input id="menu-img-upload" type="file" accept="image/*" onChange={e => setMenuFile(e.target.files[0])} style={{ display: 'none' }} />
                  <label htmlFor="menu-img-upload" style={{ display: 'block', textAlign: 'center', padding: '12px', border: '2px dashed #cbd5e1', borderRadius: 8, cursor: 'pointer', color: '#64748b', fontSize: 13, fontWeight: 600 }}>
                    {menuFile || formData.menu_img ? 'Replace Menu Image' : 'Click to Upload Menu Image'}
                  </label>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {formData.menu_items.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: 8 }}>
                      <input placeholder="Item Name" value={item.name} onChange={e => handleMenuItemChange(idx, 'name', e.target.value)} style={{ ...inputStyle, flex: 2 }} />
                      <input placeholder="Price" value={item.price} onChange={e => handleMenuItemChange(idx, 'price', e.target.value)} style={{ ...inputStyle, flex: 1 }} />
                      <button type="button" onClick={() => removeMenuItem(idx)} style={{ padding: '0 12px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: 8, cursor: 'pointer' }}>×</button>
                    </div>
                  ))}
                  <button type="button" onClick={addMenuItem} style={{ padding: '8px', background: '#eef2ff', color: '#4f46e5', border: '1px dashed #4f46e5', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>+ Add Item</button>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Building / Tag *</label>
                <select value={formData.location_tag} onChange={e => setFormData({ ...formData, location_tag: e.target.value })} style={{ ...inputStyle, background: '#fff' }}>
                  {LOCATIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Exact Address</label>
                <input required type="text" placeholder="e.g. COS, 1st Floor" value={formData.location_detail} onChange={e => setFormData({ ...formData, location_detail: e.target.value })} style={inputStyle} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Contact Number</label>
              <input type="text" placeholder="+91 XXXX" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} style={inputStyle} />
            </div>

            <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0', display: 'flex', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Button Action Label</label>
                <input type="text" value={formData.btn_label || 'View Menu'} onChange={e => setFormData({ ...formData, btn_label: e.target.value })} style={inputStyle} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Button Action Icon</label>
                <select value={formData.btn_icon} onChange={e => setFormData({ ...formData, btn_icon: e.target.value })} style={{ ...inputStyle, background: '#fff' }}>
                  {ICONS.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
            </div>

            <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end', gap: 12, position: 'sticky', bottom: 0, background: '#fff', paddingTop: 10 }}>
              <button type="button" onClick={() => setModalOpen(false)} disabled={submitting} style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
              <button type="submit" disabled={submitting} style={{ padding: '10px 16px', borderRadius: 8, border: 'none', background: '#4f46e5', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>{submitting ? 'Saving...' : 'Save Shop'}</button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  )
}
