import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'
import { ArrowLeft, Upload, X, Image, Plus, GripVertical, Loader, CheckCircle } from 'lucide-react'

const FONT = "'Plus Jakarta Sans', 'Inter', sans-serif"
const CATEGORIES = ['Textbooks', 'Electronics', 'Vehicles', 'Furniture', 'Clothing', 'Sports', 'Other']
const CONDITIONS  = ['Like New', 'Good', 'Fair', 'Needs Repair']

// ─── Image Uploader ───────────────────────────────────────────
function ImageUploader({ images, setImages, maxImages = 5 }) {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver]   = useState(false)
  const [dragIdx, setDragIdx]     = useState(null)

  const uploadFiles = async (files) => {
    const remaining = maxImages - images.length
    const toUpload = Array.from(files).slice(0, remaining)
    if (toUpload.length === 0) return

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
      } catch (err) {
        alert(`Failed to upload ${file.name}`)
      }
    }
    setImages(prev => [...prev, ...results].slice(0, maxImages))
    setUploading(false)
  }

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false)
    uploadFiles(e.dataTransfer.files)
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
      <label style={{ fontFamily: FONT, fontSize: 14, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 10 }}>
        Photos <span style={{ color: '#94a3b8', fontWeight: 400 }}>({images.length}/{maxImages} — drag to reorder)</span>
      </label>

      {/* Drop zone */}
      {images.length < maxImages && (
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          style={{
            width: '100%', minHeight: 120, borderRadius: 16,
            border: `2px dashed ${dragOver ? '#6366f1' : '#e2e8f0'}`,
            background: dragOver ? '#eef2ff' : '#f8fafc',
            cursor: 'pointer', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'all 0.2s', marginBottom: 12,
          }}
        >
          {uploading ? (
            <>
              <Loader size={24} color="#6366f1" style={{ animation: 'spin 1s linear infinite' }} />
              <span style={{ fontFamily: FONT, fontSize: 13, color: '#6366f1', fontWeight: 600 }}>Uploading...</span>
            </>
          ) : (
            <>
              <Upload size={22} color="#6366f1" />
              <span style={{ fontFamily: FONT, fontSize: 14, color: '#475569', fontWeight: 600 }}>Drop images here or click to upload</span>
              <span style={{ fontFamily: FONT, fontSize: 12, color: '#94a3b8' }}>Max 5 images · 5MB each · JPG, PNG, WebP</span>
            </>
          )}
        </div>
      )}

      <input ref={inputRef} type="file" accept="image/*" multiple style={{ display: 'none' }}
        onChange={e => uploadFiles(e.target.files)} />

      {/* Thumbnail grid */}
      {images.length > 0 && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {images.map((url, idx) => (
            <div key={url + idx}
              draggable onDragStart={() => handleDragStart(idx)} onDrop={() => handleDragDropOnThumb(idx)}
              onDragOver={e => e.preventDefault()}
              style={{
                position: 'relative', width: 88, height: 88, borderRadius: 12, overflow: 'hidden',
                border: `2.5px solid ${idx === 0 ? '#6366f1' : '#e2e8f0'}`,
                cursor: 'grab',
              }}>
              <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              {idx === 0 && (
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: '#6366f1', textAlign: 'center', padding: '2px 0' }}>
                  <span style={{ fontFamily: FONT, fontSize: 10, color: '#fff', fontWeight: 700 }}>Cover</span>
                </div>
              )}
              <button onClick={() => handleRemove(idx)} style={{
                position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: '50%',
                background: 'rgba(0,0,0,0.55)', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <X size={12} color="#fff" />
              </button>
            </div>
          ))}
          {images.length < maxImages && !uploading && (
            <button onClick={() => inputRef.current?.click()} style={{
              width: 88, height: 88, borderRadius: 12, border: '2px dashed #e2e8f0',
              background: '#f8fafc', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Plus size={20} color="#94a3b8" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Form Field ───────────────────────────────────────────────
function Field({ label, required, children, hint }) {
  return (
    <div>
      <label style={{ fontFamily: FONT, fontSize: 14, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 8 }}>
        {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
        {hint && <span style={{ fontWeight: 400, color: '#94a3b8', marginLeft: 6 }}>{hint}</span>}
      </label>
      {children}
    </div>
  )
}

const inputStyle = {
  width: '100%', padding: '12px 16px', borderRadius: 14,
  border: '1.5px solid #e2e8f0', outline: 'none',
  fontFamily: FONT, fontSize: 14, color: '#0f172a',
  background: '#fff', boxSizing: 'border-box',
  transition: 'border-color 0.18s',
}

// ─── Main Page ────────────────────────────────────────────────
export default function CreateListing() {
  const navigate = useNavigate()
  const [images, setImages] = useState([])
  const [form, setForm] = useState({
    title: '', description: '', price: '', category: 'Other',
    condition: 'Good', is_negotiable: false, is_free: false,
  })
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errors, setErrors] = useState({})

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
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        price: form.is_free ? null : (form.price === '' ? null : Number(form.price)),
        is_negotiable: form.is_negotiable,
        category: form.category,
        condition: form.condition,
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
      <div style={{ width: '100%', maxWidth: '100%', padding: '0 24px', margin: '80px auto', textAlign: 'center', fontFamily: FONT, boxSizing: 'border-box' }}>
        <CheckCircle size={64} color="#10b981" style={{ marginBottom: 16 }} />
        <h2 style={{ fontWeight: 800, fontSize: 26, color: '#0f172a', margin: '0 0 8px' }}>Listing Created!</h2>
        <p style={{ fontSize: 15, color: '#64748b' }}>Redirecting to your listing…</p>
      </div>
    </PageLayout>
  )

  return (
    <PageLayout>
      <style>{`
        .mc-input { font-family: 'Plus Jakarta Sans', sans-serif; }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .cl-input:focus { border-color: #6366f1 !important; }
      `}</style>

      <div style={{ width: '100%', maxWidth: '100%', padding: '0 24px', margin: '0 auto', fontFamily: FONT, boxSizing: 'border-box' }}>

        <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', fontFamily: FONT, fontWeight: 600, fontSize: 14, color: '#6366f1', marginBottom: 28, padding: 0 }}>
          <ArrowLeft size={18} /> Back
        </button>

        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <h1 style={{ fontFamily: FONT, fontWeight: 800, fontSize: 28, color: '#0f172a', margin: 0 }}>List an Item</h1>
          <p style={{ fontFamily: FONT, fontSize: 15, color: '#64748b', margin: '6px 0 0' }}>List your item and connect with buyers at your university.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ background: '#fff', borderRadius: 28, padding: 36, boxShadow: '0 4px 24px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: 28 }}>

            {/* Images */}
            <ImageUploader images={images} setImages={setImages} maxImages={5} />

            {/* Title */}
            <Field label="Title" required>
              <input
                className="cl-input"
                type="text" placeholder="e.g. Organic Chemistry Textbook — Atkins 9th Ed"
                value={form.title} onChange={e => setField('title', e.target.value)}
                style={{ ...inputStyle, borderColor: errors.title ? '#ef4444' : '#e2e8f0' }}
              />
              {errors.title && <p style={{ fontFamily: FONT, fontSize: 12, color: '#ef4444', margin: '4px 0 0' }}>{errors.title}</p>}
            </Field>

            {/* Description */}
            <Field label="Description" hint="(optional)">
              <textarea
                className="cl-input"
                rows={4} placeholder="Describe the item's condition, pickup location, any defects..."
                value={form.description} onChange={e => setField('description', e.target.value)}
                style={{ ...inputStyle, resize: 'none' }}
              />
            </Field>

            {/* Category + Condition */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <Field label="Category" required>
                <select className="cl-input" value={form.category} onChange={e => setField('category', e.target.value)}
                  style={{ ...inputStyle, cursor: 'pointer' }}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Condition" required>
                <select className="cl-input" value={form.condition} onChange={e => setField('condition', e.target.value)}
                  style={{ ...inputStyle, cursor: 'pointer' }}>
                  {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
            </div>

            {/* Price section */}
            <div>
              <label style={{ fontFamily: FONT, fontSize: 14, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 12 }}>
                Price <span style={{ color: '#ef4444' }}>*</span>
              </label>

              {/* Free toggle */}
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 14 }}>
                <div
                  onClick={() => setField('is_free', !form.is_free)}
                  style={{
                    width: 44, height: 24, borderRadius: 12,
                    background: form.is_free ? '#10b981' : '#e2e8f0',
                    position: 'relative', cursor: 'pointer', transition: 'background 0.2s',
                    flexShrink: 0,
                  }}
                >
                  <div style={{
                    position: 'absolute', top: 2, left: form.is_free ? 22 : 2,
                    width: 20, height: 20, borderRadius: '50%', background: '#fff',
                    transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  }} />
                </div>
                <span style={{ fontFamily: FONT, fontSize: 14, fontWeight: 600, color: form.is_free ? '#10b981' : '#64748b' }}>
                  This item is Free 🎁
                </span>
              </label>

              {!form.is_free && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'start' }}>
                  <div>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', fontFamily: FONT, fontWeight: 700, fontSize: 16, color: '#6366f1' }}>₹</span>
                      <input
                        className="cl-input"
                        type="number" min="0" placeholder="0"
                        value={form.price} onChange={e => setField('price', e.target.value)}
                        style={{ ...inputStyle, paddingLeft: 36, borderColor: errors.price ? '#ef4444' : '#e2e8f0' }}
                      />
                    </div>
                    {errors.price && <p style={{ fontFamily: FONT, fontSize: 12, color: '#ef4444', margin: '4px 0 0' }}>{errors.price}</p>}
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', paddingTop: 12 }}>
                    <input type="checkbox" checked={form.is_negotiable} onChange={e => setField('is_negotiable', e.target.checked)}
                      style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#6366f1' }} />
                    <span style={{ fontFamily: FONT, fontSize: 14, fontWeight: 600, color: '#475569' }}>Negotiable</span>
                  </label>
                </div>
              )}
            </div>

            {/* Submit */}
            <button type="submit" disabled={submitting} style={{
              padding: '16px', borderRadius: 16,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              border: 'none', color: '#fff', fontFamily: FONT,
              fontWeight: 700, fontSize: 16, cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.75 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              transition: 'all 0.2s',
            }}>
              {submitting ? <><Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> Publishing…</> : '🚀 Publish Listing'}
            </button>
          </div>
        </form>
      </div>
    </PageLayout>
  )
}
