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
      const isClosed = row.status === 'CLOSED'
      const isClosingSoon = row.status === 'CLOSING SOON'
      
      let bg = '#dcfce7'
      let color = '#166534'
      
      if (isClosed) {
        bg = '#fee2e2'
        color = '#991b1b'
      } else if (isClosingSoon) {
        bg = '#fef3c7'
        color = '#92400e'
      }

      return (
        <select
          value={row.status}
          onChange={async (e) => {
            e.stopPropagation()
            const newStatus = e.target.value
            setShops(prev => prev.map(s => s.id === row.id ? { ...s, status: newStatus } : s))
            try {
              const payload = { ...row, status: newStatus }
              // Remove fields that might cause issues if they're complex depending on backend, but flat spreading usually works.
              const res = await api.put(`/api/shops/${row.id}`, payload)
              if (!res.success) fetchShops()
            } catch {
              fetchShops()
            }
          }}
          onClick={(e) => e.stopPropagation()}
          style={{
            backgroundColor: bg,
            color: color,
            padding: '6px 28px 6px 14px', borderRadius: 50, fontSize: 10, fontWeight: 800,
            cursor: 'pointer', border: `1px solid ${bg === '#dcfce7' ? '#a7f3d0' : bg === '#fee2e2' ? '#fecaca' : '#fde68a'}`,
            outline: 'none', letterSpacing: '0.05em', fontFamily: "'Plus Jakarta Sans', sans-serif",
            appearance: 'none',
            backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='${encodeURIComponent(color)}' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center'
          }}
        >
          {STATUSES.map(s => (
            <option key={s} value={s} style={{color: '#0f172a'}}>{s}</option>
          ))}
        </select>
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
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            
            {/* Basic Info */}
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 8 }}>Shop Name *</label>
                <input required type="text" placeholder="e.g. Sip & Bite" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={inputStyle} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 8 }}>Shop Type (Subtitle) *</label>
                <input required type="text" placeholder="e.g. Fast Food & Beverages" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} style={inputStyle} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 8 }}>Root Category *</label>
                <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} style={selectStyle}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 8 }}>Current Status *</label>
                <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} style={{ ...selectStyle, color: formData.status === 'OPEN' ? '#16a34a' : '#dc2626', fontWeight: 700 }}>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* Location & Contact */}
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 8 }}>Building / Tag *</label>
                <select value={formData.location_tag} onChange={e => setFormData({ ...formData, location_tag: e.target.value })} style={selectStyle}>
                  {LOCATIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 8 }}>Exact Address</label>
                <input required type="text" placeholder="e.g. COS, 1st Floor" value={formData.location_detail} onChange={e => setFormData({ ...formData, location_detail: e.target.value })} style={inputStyle} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 8 }}>Contact Number</label>
                <input type="text" placeholder="+91 XXXX" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} style={inputStyle} />
              </div>
            </div>

            {/* Logo Upload */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 8 }}>Shop Logo / Image</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px', borderRadius: '12px', border: '1.5px dashed #cbd5e1', background: '#f8fafc' }}>
                {(formData.logo_img || logoFile) ? (
                  <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#fff', border: '2px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    <img src={logoFile ? URL.createObjectURL(logoFile) : formData.logo_img} alt="Logo preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ) : (
                  <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🏪</div>
                )}
                <div>
                  <input id="shop-logo-upload" type="file" accept="image/*" onChange={e => setLogoFile(e.target.files[0])} style={{ display: 'none' }} />
                  <label htmlFor="shop-logo-upload" style={{ display: 'inline-block', padding: '10px 20px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#fff', color: '#1e293b', fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: '0.2s', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    {logoFile || formData.logo_img ? 'Replace Logo Image' : 'Upload Logo Image'}
                  </label>
                </div>
              </div>
            </div>

            {/* Menu Management */}
            <div style={{ border: '1.5px solid #e2e8f0', borderRadius: 16, padding: 24, background: '#f8fafc' }}>
              <label style={{ display: 'block', fontSize: 15, fontWeight: 800, color: '#0f172a', marginBottom: 16, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Menu Configuration</label>
              <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#334155' }}>
                  <input type="radio" checked={formData.menu_type === 'image'} onChange={() => setFormData({ ...formData, menu_type: 'image' })} style={{ width: 18, height: 18, accentColor: '#4f46e5' }} /> Upload Menu Image
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#334155' }}>
                  <input type="radio" checked={formData.menu_type === 'list'} onChange={() => setFormData({ ...formData, menu_type: 'list' })} style={{ width: 18, height: 18, accentColor: '#4f46e5' }} /> Manual Text List
                </label>
              </div>

              {formData.menu_type === 'image' ? (
                <div>
                  {(formData.menu_img || menuFile) && (
                    <img src={menuFile ? URL.createObjectURL(menuFile) : formData.menu_img} style={{ width: '100%', maxHeight: 240, objectFit: 'contain', borderRadius: 12, marginBottom: 16, border: '1.5px solid #e2e8f0', background: '#fff' }} />
                  )}
                  <input id="menu-img-upload" type="file" accept="image/*" onChange={e => setMenuFile(e.target.files[0])} style={{ display: 'none' }} />
                  <label htmlFor="menu-img-upload" style={{ display: 'block', textAlign: 'center', padding: '16px', border: '2px dashed #cbd5e1', borderRadius: 12, background: '#fff', cursor: 'pointer', color: '#64748b', fontSize: 14, fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    {menuFile || formData.menu_img ? 'Replace Menu Image' : 'Click to Upload Menu Image'}
                  </label>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {formData.menu_items.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: 12 }}>
                      <input placeholder="Item Name (e.g. Masala Dosa)" value={item.name} onChange={e => handleMenuItemChange(idx, 'name', e.target.value)} style={{ ...inputStyle, flex: 2, marginBottom: 0 }} />
                      <input placeholder="Price (e.g. ₹60)" value={item.price} onChange={e => handleMenuItemChange(idx, 'price', e.target.value)} style={{ ...inputStyle, flex: 1, marginBottom: 0 }} />
                      <button type="button" onClick={() => removeMenuItem(idx)} style={{ padding: '0 16px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: 12, cursor: 'pointer', fontWeight: 800, fontSize: 18 }}>×</button>
                    </div>
                  ))}
                  <button type="button" onClick={addMenuItem} style={{ padding: '14px', background: '#eef2ff', color: '#4f46e5', border: '1.5px dashed #a5b4fc', borderRadius: 12, cursor: 'pointer', fontSize: 14, fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>+ Add Menu Item</button>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 8 }}>Button Action Label</label>
                <input type="text" value={formData.btn_label || 'View Menu'} onChange={e => setFormData({ ...formData, btn_label: e.target.value })} style={inputStyle} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 8 }}>Button Action Icon</label>
                <select value={formData.btn_icon} onChange={e => setFormData({ ...formData, btn_icon: e.target.value })} style={selectStyle}>
                  {ICONS.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
              <button type="button" onClick={() => setModalOpen(false)} disabled={submitting} style={{ flex: 1, padding: '14px', borderRadius: 12, border: '1.5px solid #e2e8f0', background: 'transparent', fontWeight: 700, color: '#475569', cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 15 }}>Cancel</button>
              <button type="submit" disabled={submitting} style={{ flex: 2, padding: '14px', borderRadius: 12, border: 'none', background: '#4f46e5', color: '#fff', cursor: 'pointer', fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 15 }}>{submitting ? 'Saving...' : 'Save Shop'}</button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  )
}
