import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'
import { ArrowLeft, Upload, X, Plus, Loader, CheckCircle } from 'lucide-react'

const CATEGORIES = ['Textbooks', 'Electronics', 'Vehicles', 'Furniture', 'Clothing', 'Sports', 'Other']
const CONDITIONS  = ['Like New', 'Good', 'Fair', 'Needs Repair']

function ImageUploader({ images, setImages, maxImages = 5 }) {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver]   = useState(false)
  const [dragIdx, setDragIdx]     = useState(null)

  const uploadFiles = async (files) => {
    const remaining = maxImages - images.length
    const toUpload  = Array.from(files).slice(0, remaining)
    if (!toUpload.length) return
    setUploading(true)
    const results = []
    for (const file of toUpload) {
      if (file.size > 5 * 1024 * 1024) { alert(`"${file.name}" exceeds 5MB limit`); continue }
      if (!file.type.startsWith('image/')) { alert(`"${file.name}" is not an image`); continue }
      try {
        const fd = new FormData()
        fd.append('file', file)
        fd.append('folder_key', 'marketplace')
        const res = await api.upload('/api/upload/image', fd)
        results.push(res.url)
      } catch { alert(`Failed to upload ${file.name}`) }
    }
    setImages(prev => [...prev, ...results].slice(0, maxImages))
    setUploading(false)
  }

  const handleRemove = (idx) => setImages(prev => prev.filter((_, i) => i !== idx))
  const handleDragStart = (idx) => setDragIdx(idx)
  const handleDragDropOnThumb = (targetIdx) => {
    if (dragIdx === null || dragIdx === targetIdx) return
    const reordered = [...images]
    const [moved] = reordered.splice(dragIdx, 1)
    reordered.splice(targetIdx, 0, moved)
    setImages(reordered)
    setDragIdx(null)
  }

  return (
    <div>
      <label className="block mb-2.5 t-base font-bold text-slate-700">
        Photos <span className="font-normal t-subtle">({images.length}/{maxImages} — drag to reorder)</span>
      </label>

      {images.length < maxImages && (
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); uploadFiles(e.dataTransfer.files) }}
          onClick={() => inputRef.current?.click()}
          className={`w-full min-h-[120px] rounded-2xl border-2 border-dashed cursor-pointer flex flex-col items-center justify-center gap-2 transition-all mb-3 ${dragOver ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-surface hover:border-indigo-300'}`}>
          {uploading ? (
            <>
              <Loader size={24} className="text-indigo-500" style={{ animation: 'spin 1s linear infinite' }} />
              <span className="t-md font-semibold text-indigo-500">Uploading…</span>
            </>
          ) : (
            <>
              <Upload size={22} className="text-indigo-500" />
              <span className="t-base font-semibold text-slate-500">Drop images here or click to upload</span>
              <span className="t-md t-subtle">Max 5 images · 5MB each · JPG, PNG, WebP</span>
            </>
          )}
        </div>
      )}

      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden"
        onChange={e => uploadFiles(e.target.files)} />

      {images.length > 0 && (
        <div className="flex gap-2.5 flex-wrap">
          {images.map((url, idx) => (
            <div key={url + idx}
              draggable onDragStart={() => handleDragStart(idx)}
              onDrop={() => handleDragDropOnThumb(idx)} onDragOver={e => e.preventDefault()}
              className={`relative w-[88px] h-[88px] rounded-xl overflow-hidden border-[2.5px] cursor-grab ${idx === 0 ? 'border-indigo-500' : 'border-slate-200'}`}>
              <img src={url} alt="" className="w-full h-full object-cover" />
              {idx === 0 && (
                <div className="absolute bottom-0 left-0 right-0 bg-indigo-500 text-center py-0.5">
                  <span className="text-[10px] text-white font-bold">Cover</span>
                </div>
              )}
              <button onClick={() => handleRemove(idx)}
                className="absolute top-1 right-1 w-[22px] h-[22px] rounded-full bg-black/55 border-none cursor-pointer flex items-center justify-center">
                <X size={12} color="#fff" />
              </button>
            </div>
          ))}
          {images.length < maxImages && !uploading && (
            <button onClick={() => inputRef.current?.click()}
              className="w-[88px] h-[88px] rounded-xl border-2 border-dashed border-slate-200 bg-surface cursor-pointer flex items-center justify-center">
              <Plus size={20} className="text-slate-400" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function Field({ label, required, children, hint }) {
  return (
    <div>
      <label className="block mb-2 t-base font-bold text-slate-700">
        {label} {required && <span className="text-danger">*</span>}
        {hint && <span className="font-normal t-subtle ml-1.5">{hint}</span>}
      </label>
      {children}
    </div>
  )
}

const fieldCls = 'w-full px-4 py-3 rounded-2xl border-[1.5px] border-slate-200 outline-none t-base t-primary bg-white focus:border-indigo-500 transition-colors box-border'

export default function CreateListing() {
  const navigate = useNavigate()
  const [images, setImages] = useState([])
  const [form, setForm] = useState({
    title: '', description: '', price: '', category: 'Other',
    condition: 'Good', is_negotiable: false, is_free: false,
  })
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess]       = useState(false)
  const [errors, setErrors]         = useState({})

  const setField = (key, val) => {
    setForm(p => ({ ...p, [key]: val }))
    if (errors[key]) setErrors(p => ({ ...p, [key]: null }))
  }

  const validate = () => {
    const e = {}
    if (!form.title.trim() || form.title.trim().length < 3) e.title = 'Title must be at least 3 characters'
    if (!form.is_free && form.price !== '' && (isNaN(Number(form.price)) || Number(form.price) < 0)) e.price = 'Enter a valid price'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      const payload = {
        title:        form.title.trim(),
        description:  form.description.trim() || undefined,
        price:        form.is_free ? null : (form.price === '' ? null : Number(form.price)),
        is_negotiable: form.is_negotiable,
        category:     form.category,
        condition:    form.condition,
        images,
      }
      const res = await api.post('/api/marketplace', payload)
      setSuccess(true)
      setTimeout(() => navigate(`/marketplace/listing/${res.data.id}`), 1200)
    } catch (err) {
      alert(err.message || 'Failed to create listing')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) return (
    <PageLayout>
      <div className="mt-20 text-center">
        <CheckCircle size={64} className="text-emerald-500 mx-auto mb-4" />
        <h2 className="text-[26px] font-extrabold t-primary m-0 mb-2">Listing Created!</h2>
        <p className="t-base t-muted">Redirecting to your listing…</p>
      </div>
    </PageLayout>
  )

  return (
    <PageLayout>
      <button onClick={() => navigate(-1)}
        className="flex items-center gap-2 bg-transparent border-none cursor-pointer text-[14px] font-semibold text-indigo-500 mb-7 p-0">
        <ArrowLeft size={18} /> Back
      </button>

      <div className="mb-9">
        <h1 className="text-[28px] font-extrabold t-primary m-0">List an Item</h1>
        <p className="t-base t-muted mt-1.5 m-0">List your item and connect with buyers at your university.</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-[28px] p-6 sm:p-9 shadow-[0_4px_24px_rgba(0,0,0,0.06)] flex flex-col gap-7">

          <ImageUploader images={images} setImages={setImages} maxImages={5} />

          {/* Title */}
          <Field label="Title" required>
            <input type="text" placeholder="e.g. Organic Chemistry Textbook — Atkins 9th Ed"
              value={form.title} onChange={e => setField('title', e.target.value)}
              className={`${fieldCls} ${errors.title ? 'border-danger' : ''}`}
            />
            {errors.title && <p className="t-md text-danger mt-1 m-0">{errors.title}</p>}
          </Field>

          {/* Description */}
          <Field label="Description" hint="(optional)">
            <textarea rows={4} placeholder="Describe the item's condition, pickup location, any defects…"
              value={form.description} onChange={e => setField('description', e.target.value)}
              className={`${fieldCls} resize-none`}
            />
          </Field>

          {/* Category + Condition */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Category" required>
              <select value={form.category} onChange={e => setField('category', e.target.value)} className={`${fieldCls} cursor-pointer`}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Condition" required>
              <select value={form.condition} onChange={e => setField('condition', e.target.value)} className={`${fieldCls} cursor-pointer`}>
                {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
          </div>

          {/* Price */}
          <div>
            <label className="block mb-3 t-base font-bold text-slate-700">Price <span className="text-danger">*</span></label>
            {/* Free toggle */}
            <label className="flex items-center gap-2.5 cursor-pointer mb-3.5">
              <div onClick={() => setField('is_free', !form.is_free)}
                className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors shrink-0 ${form.is_free ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all ${form.is_free ? 'left-[22px]' : 'left-0.5'}`} />
              </div>
              <span className={`t-base font-semibold ${form.is_free ? 'text-emerald-500' : 't-secondary'}`}>
                This item is Free 🎁
              </span>
            </label>

            {!form.is_free && (
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4 items-start">
                <div>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[16px] font-bold text-indigo-500">₹</span>
                    <input type="number" min="0" placeholder="0"
                      value={form.price} onChange={e => setField('price', e.target.value)}
                      className={`${fieldCls} pl-9 ${errors.price ? 'border-danger' : ''}`}
                    />
                  </div>
                  {errors.price && <p className="t-md text-danger mt-1 m-0">{errors.price}</p>}
                </div>
                <label className="flex items-center gap-2 cursor-pointer pt-3">
                  <input type="checkbox" checked={form.is_negotiable} onChange={e => setField('is_negotiable', e.target.checked)}
                    className="w-4.5 h-4.5 cursor-pointer accent-indigo-500" />
                  <span className="t-base font-semibold text-slate-500">Negotiable</span>
                </label>
              </div>
            )}
          </div>

          {/* Submit */}
          <button type="submit" disabled={submitting}
            className={`py-4 rounded-2xl border-none text-white text-[16px] font-bold flex items-center justify-center gap-2.5 transition-all ${submitting ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer'}`}
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            {submitting
              ? <><Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> Publishing…</>
              : '🚀 Publish Listing'}
          </button>
        </div>
      </form>
    </PageLayout>
  )
}
