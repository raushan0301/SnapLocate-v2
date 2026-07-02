import React, { useState, useEffect } from 'react'
import AdminPageTemplate from '../../components/admin/AdminPageTemplate'
import Modal from '../../components/admin/Modal'
import api from '../../lib/api'

const CATEGORIES = ['Cafe', 'Food', 'Stationary', 'General Store']
const LOCATIONS = ['Jaggi', 'COS', 'G Block', 'TSLAS']
const STATUSES = ['OPEN', 'CLOSED', 'CLOSING SOON']
const ICONS = ['book', 'bag', 'file']

const STATUS_CLS = {
  OPEN:          { chip: 'bg-green-100 text-green-800 border-green-200' },
  CLOSED:        { chip: 'bg-red-100 text-red-800 border-red-200' },
  'CLOSING SOON': { chip: 'bg-amber-100 text-amber-800 border-amber-200' },
}

const fieldCls = 'w-full h-12 px-4 rounded-[12px] border-[1.5px] border-slate-200 text-[14px] text-slate-800 bg-white outline-none box-border focus:border-brand transition-colors'

const defaultForm = {
  name: '', type: '', category: 'Cafe',
  status: 'OPEN', phone: '',
  location_tag: 'COS', location_detail: '',
  btn_label: 'View Menu', btn_icon: 'book', logo_img: '',
  menu_type: 'image', menu_img: '', menu_items: [{ name: '', price: '' }]
}

export default function Shops() {
  const [shops, setShops] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editId, setEditId] = useState(null)
  const [logoFile, setLogoFile] = useState(null)
  const [menuFile, setMenuFile] = useState(null)
  const [formData, setFormData] = useState(defaultForm)

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

  useEffect(() => { fetchShops() }, [])

  const handleAdd = () => {
    setEditId(null); setLogoFile(null); setMenuFile(null)
    setFormData(defaultForm); setModalOpen(true)
  }

  const handleEdit = (shop) => {
    setEditId(shop.id); setLogoFile(null); setMenuFile(null)
    setFormData({ ...shop, menu_type: shop.menu_type || 'image', menu_items: shop.menu_items || [{ name: '', price: '' }] })
    setModalOpen(true)
  }

  const handleDelete = async (shop) => {
    if (!window.confirm(`Are you sure you want to delete ${shop.name}?`)) return
    try {
      const res = await api.delete(`/api/shops/${shop.id}`)
      if (res.success) fetchShops()
    } catch { alert('Delete failed.') }
  }

  const handleMenuItemChange = (index, field, value) => {
    const list = [...formData.menu_items]; list[index][field] = value
    setFormData({ ...formData, menu_items: list })
  }
  const addMenuItem = () => setFormData({ ...formData, menu_items: [...formData.menu_items, { name: '', price: '' }] })
  const removeMenuItem = (index) => setFormData({ ...formData, menu_items: formData.menu_items.filter((_, i) => i !== index) })

  const handleSubmit = async (e) => {
    e.preventDefault(); setSubmitting(true)
    try {
      let finalLogo = formData.logo_img
      let finalMenuImg = formData.menu_img

      if (logoFile) {
        const fd = new FormData(); fd.append('file', logoFile); fd.append('type', 'shop')
        const r = await api.upload('/api/upload/image', fd)
        if (r?.success) finalLogo = r.url
      }
      if (menuFile && formData.menu_type === 'image') {
        const fd = new FormData(); fd.append('file', menuFile); fd.append('type', 'shop')
        const r = await api.upload('/api/upload/image', fd)
        if (r?.success) finalMenuImg = r.url
      }

      const payload = {
        ...formData, logo_img: finalLogo, menu_img: finalMenuImg,
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
    } catch (err) { alert(`Failed to save: ${err.message}`) }
    finally { setSubmitting(false) }
  }

  const fd = (k, v) => setFormData(p => ({ ...p, [k]: v }))

  const columns = [
    {
      label: 'Shop Details', key: 'name', render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
            {row.logo_img ? <img src={row.logo_img} alt="Logo" className="w-full h-full object-cover" /> : <span className="text-xl">🏪</span>}
          </div>
          <div className="min-w-0">
            <div className="font-bold t-primary truncate">{row.name}</div>
            <div className="text-[12px] t-muted mt-0.5">{row.category} • {row.phone}</div>
          </div>
        </div>
      )
    },
    {
      label: 'Location', key: 'location_tag', render: (row) => (
        <div>
          <span className="font-semibold text-slate-600">{row.location_tag}</span>
          {row.location_detail && <div className="text-[11px] t-muted">{row.location_detail}</div>}
        </div>
      )
    },
    {
      label: 'Menu Type', key: 'menu_type', render: (row) => (
        <span className="text-[12px] t-muted capitalize">{row.menu_type || 'None'}</span>
      )
    },
    {
      label: 'Status', key: 'status', render: (row) => {
        const cfg = STATUS_CLS[row.status] || STATUS_CLS.OPEN
        return (
          <select value={row.status}
            onChange={async (e) => {
              e.stopPropagation()
              const newStatus = e.target.value
              setShops(prev => prev.map(s => s.id === row.id ? { ...s, status: newStatus } : s))
              try {
                const res = await api.put(`/api/shops/${row.id}`, { ...row, status: newStatus })
                if (!res.success) fetchShops()
              } catch { fetchShops() }
            }}
            onClick={(e) => e.stopPropagation()}
            className={`px-3.5 py-[6px] rounded-full border text-[10px] font-extrabold cursor-pointer outline-none tracking-[0.05em] appearance-none ${cfg.chip}`}>
            {STATUSES.map(s => <option key={s} value={s} className="text-slate-900">{s}</option>)}
          </select>
        )
      }
    },
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

      <Modal isOpen={modalOpen} onClose={() => !submitting && setModalOpen(false)} title={editId ? 'Edit Shop' : 'Add Shop'}>
        <div className="max-h-[70vh] overflow-y-auto pr-2">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-[13px] font-bold text-slate-600 mb-2">Shop Name *</label>
                <input required type="text" placeholder="e.g. Sip & Bite" value={formData.name} onChange={e => fd('name', e.target.value)} className={fieldCls} />
              </div>
              <div className="flex-1">
                <label className="block text-[13px] font-bold text-slate-600 mb-2">Shop Type (Subtitle) *</label>
                <input required type="text" placeholder="e.g. Fast Food & Beverages" value={formData.type} onChange={e => fd('type', e.target.value)} className={fieldCls} />
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-[13px] font-bold text-slate-600 mb-2">Root Category *</label>
                <select value={formData.category} onChange={e => fd('category', e.target.value)} className={fieldCls}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-[13px] font-bold text-slate-600 mb-2">Current Status *</label>
                <select value={formData.status} onChange={e => fd('status', e.target.value)}
                  className={`${fieldCls} font-bold ${formData.status === 'OPEN' ? 'text-green-700' : 'text-red-600'}`}>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-[13px] font-bold text-slate-600 mb-2">Building / Tag *</label>
                <select value={formData.location_tag} onChange={e => fd('location_tag', e.target.value)} className={fieldCls}>
                  {LOCATIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-[13px] font-bold text-slate-600 mb-2">Exact Address</label>
                <input required type="text" placeholder="e.g. COS, 1st Floor" value={formData.location_detail} onChange={e => fd('location_detail', e.target.value)} className={fieldCls} />
              </div>
              <div className="flex-1">
                <label className="block text-[13px] font-bold text-slate-600 mb-2">Contact Number</label>
                <input type="text" placeholder="+91 XXXX" value={formData.phone} onChange={e => fd('phone', e.target.value)} className={fieldCls} />
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-bold text-slate-600 mb-2">Shop Logo / Image</label>
              <div className="flex items-center gap-4 p-4 rounded-[12px] border-[1.5px] border-dashed border-slate-300 bg-slate-50">
                <div className="w-16 h-16 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                  {(formData.logo_img || logoFile)
                    ? <img src={logoFile ? URL.createObjectURL(logoFile) : formData.logo_img} alt="Logo preview" className="w-full h-full object-cover" />
                    : <span className="text-2xl">🏪</span>}
                </div>
                <div>
                  <input id="shop-logo-upload" type="file" accept="image/*" onChange={e => setLogoFile(e.target.files[0])} className="hidden" />
                  <label htmlFor="shop-logo-upload" className="inline-block px-5 py-2.5 rounded-[10px] border-[1.5px] border-slate-200 bg-white text-slate-800 font-bold text-[13px] cursor-pointer hover:bg-slate-50 transition-colors">
                    {logoFile || formData.logo_img ? 'Replace Logo Image' : 'Upload Logo Image'}
                  </label>
                </div>
              </div>
            </div>

            <div className="border-[1.5px] border-slate-200 rounded-[16px] p-6 bg-slate-50">
              <label className="block text-[15px] font-extrabold t-primary mb-4">Menu Configuration</label>
              <div className="flex gap-5 mb-5">
                {[{ val: 'image', label: 'Upload Menu Image' }, { val: 'list', label: 'Manual Text List' }].map(({ val, label }) => (
                  <label key={val} className="flex items-center gap-2 cursor-pointer text-[14px] font-semibold text-slate-700">
                    <input type="radio" checked={formData.menu_type === val} onChange={() => fd('menu_type', val)} className="w-[18px] h-[18px] accent-brand" /> {label}
                  </label>
                ))}
              </div>

              {formData.menu_type === 'image' ? (
                <div>
                  {(formData.menu_img || menuFile) && (
                    <img src={menuFile ? URL.createObjectURL(menuFile) : formData.menu_img}
                      className="w-full max-h-60 object-contain rounded-[12px] mb-4 border-[1.5px] border-slate-200 bg-white" />
                  )}
                  <input id="menu-img-upload" type="file" accept="image/*" onChange={e => setMenuFile(e.target.files[0])} className="hidden" />
                  <label htmlFor="menu-img-upload" className="block text-center py-4 border-2 border-dashed border-slate-300 rounded-[12px] bg-white cursor-pointer text-slate-500 text-[14px] font-bold hover:bg-slate-50 transition-colors">
                    {menuFile || formData.menu_img ? 'Replace Menu Image' : 'Click to Upload Menu Image'}
                  </label>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {formData.menu_items.map((item, idx) => (
                    <div key={idx} className="flex gap-3">
                      <input placeholder="Item Name (e.g. Masala Dosa)" value={item.name} onChange={e => handleMenuItemChange(idx, 'name', e.target.value)} className={`${fieldCls} flex-[2]`} />
                      <input placeholder="Price (e.g. ₹60)" value={item.price} onChange={e => handleMenuItemChange(idx, 'price', e.target.value)} className={`${fieldCls} flex-1`} />
                      <button type="button" onClick={() => removeMenuItem(idx)} className="px-4 bg-red-50 text-red-500 border-0 rounded-[12px] cursor-pointer font-extrabold text-[18px] hover:bg-red-100 transition-colors">×</button>
                    </div>
                  ))}
                  <button type="button" onClick={addMenuItem} className="py-3.5 bg-indigo-50 text-brand border-[1.5px] border-dashed border-indigo-300 rounded-[12px] cursor-pointer text-[14px] font-bold hover:bg-indigo-100 transition-colors">+ Add Menu Item</button>
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-[13px] font-bold text-slate-600 mb-2">Button Action Label</label>
                <input type="text" value={formData.btn_label || 'View Menu'} onChange={e => fd('btn_label', e.target.value)} className={fieldCls} />
              </div>
              <div className="flex-1">
                <label className="block text-[13px] font-bold text-slate-600 mb-2">Button Action Icon</label>
                <select value={formData.btn_icon} onChange={e => fd('btn_icon', e.target.value)} className={fieldCls}>
                  {ICONS.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-3">
              <button type="button" onClick={() => setModalOpen(false)} disabled={submitting}
                className="flex-1 py-3.5 rounded-[12px] border-[1.5px] border-slate-200 bg-transparent font-bold text-slate-600 cursor-pointer text-[15px] hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={submitting}
                className="flex-[2] py-3.5 rounded-[12px] border-0 bg-brand text-white cursor-pointer font-bold text-[15px]">
                {submitting ? 'Saving...' : 'Save Shop'}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  )
}
