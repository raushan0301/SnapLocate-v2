import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'
import { ArrowLeft, Upload, X, Plus, Loader, CheckCircle } from 'lucide-react'

const FONT = "'Plus Jakarta Sans', 'Inter', sans-serif"
const CATEGORIES = ['Textbooks', 'Electronics', 'Vehicles', 'Furniture', 'Clothing', 'Sports', 'Other']
const CONDITIONS  = ['Like New', 'Good', 'Fair', 'Needs Repair']

function ImageUploader({ images, setImages, maxImages = 5 }) {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver]   = useState(false)

  const uploadFiles = async (files) => {
    const remaining = maxImages - images.length
    const toUpload = Array.from(files).slice(0, remaining)
    if (!toUpload.length) return
    setUploading(true)
    const results = []
    for (const file of toUpload) {
      if (file.size > 5 * 1024 * 1024) { alert(`"${file.name}" exceeds 5MB`); continue }
      try {
        const fd = new FormData(); fd.append('file', file); fd.append('folder_key', 'marketplace')
        const r = await api.upload('/api/upload/image', fd)
        results.push(r.url)
      } catch { alert(`Upload failed: ${file.name}`) }
    }
    setImages(p => [...p, ...results].slice(0, maxImages))
    setUploading(false)
  }

  return (
    <div>
      <label style={{ fontFamily: FONT, fontSize: 14, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 10 }}>
        Photos <span style={{ color: '#94a3b8', fontWeight: 400 }}>({images.length}/{maxImages})</span>
      </label>
      {images.length < maxImages && (
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); uploadFiles(e.dataTransfer.files) }}
          onClick={() => inputRef.current?.click()}
          style={{ width: '100%', minHeight: 100, borderRadius: 14, border: `2px dashed ${dragOver ? '#6366f1' : '#e2e8f0'}`, background: dragOver ? '#eef2ff' : '#f8fafc', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 10 }}
        >
          {uploading ? <Loader size={22} color="#6366f1" style={{ animation: 'spin 1s linear infinite' }} /> : <><Upload size={20} color="#6366f1" /><span style={{ fontFamily: FONT, fontSize: 13, color: '#6366f1', fontWeight: 600 }}>Drop or click to add photos</span></>}
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => uploadFiles(e.target.files)} />
      {images.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {images.map((url, i) => (
            <div key={i} style={{ position: 'relative', width: 80, height: 80, borderRadius: 12, overflow: 'hidden', border: `2px solid ${i === 0 ? '#6366f1' : '#e2e8f0'}` }}>
              <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <button onClick={() => setImages(p => p.filter((_, j) => j !== i))} style={{ position: 'absolute', top: 3, right: 3, width: 20, height: 20, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={11} color="#fff" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const inputStyle = { width: '100%', padding: '12px 16px', borderRadius: 14, border: '1.5px solid #e2e8f0', outline: 'none', fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, color: '#0f172a', background: '#fff', boxSizing: 'border-box' }

export default function EditListing() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [images, setImages] = useState([])
  const [form, setForm] = useState({
    title: '', description: '', price: '', category: 'Other',
    condition: 'Good', is_negotiable: false, is_free: false,
  })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    api.get(`/api/marketplace/${id}`).then(res => {
      const d = res.data
      const isFree = d.price === null || d.price === 0
      setForm({
        title: d.title || '',
        description: d.description || '',
        price: isFree ? '' : String(d.price),
        category: d.category || 'Other',
        condition: d.condition || 'Good',
        is_negotiable: d.is_negotiable || false,
        is_free: isFree,
      })
      setImages(d.images || [])
    }).catch(() => navigate('/marketplace')).finally(() => setLoading(false))
  }, [id])

  const setField = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.put(`/api/marketplace/${id}`, {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        price: form.is_free ? null : (form.price === '' ? null : Number(form.price)),
        is_negotiable: form.is_negotiable,
        category: form.category, condition: form.condition, images,
      })
      setSuccess(true)
      setTimeout(() => navigate(`/marketplace/listing/${id}`), 1200)
    } catch (err) { alert(err.message || 'Failed to save') }
    finally { setSubmitting(false) }
  }

  if (loading) return (
    <PageLayout><div style={{ width: '100%', maxWidth: '100%', padding: '40px 24px', margin: '0 auto', boxSizing: 'border-box' }}>
      {[1,2,3].map(i => <div key={i} style={{ height: 80, background: '#f1f5f9', borderRadius: 16, marginBottom: 16, animation: 'pulse 1.5s infinite' }} />)}
    </div></PageLayout>
  )

  if (success) return (
    <PageLayout>
      <div style={{ width: '100%', maxWidth: '100%', padding: '0 24px', margin: '80px auto', textAlign: 'center', fontFamily: FONT, boxSizing: 'border-box' }}>
        <CheckCircle size={64} color="#10b981" style={{ marginBottom: 16 }} />
        <h2 style={{ fontWeight: 800, fontSize: 26, color: '#0f172a', margin: '0 0 8px' }}>Listing Updated!</h2>
      </div>
    </PageLayout>
  )

  return (
    <PageLayout>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
      <div style={{ width: '100%', maxWidth: '100%', padding: '0 24px', margin: '0 auto', fontFamily: FONT, boxSizing: 'border-box' }}>
        <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', fontFamily: FONT, fontWeight: 600, fontSize: 14, color: '#6366f1', marginBottom: 28, padding: 0 }}>
          <ArrowLeft size={18} /> Back
        </button>
        <h1 style={{ fontFamily: FONT, fontWeight: 800, fontSize: 28, color: '#0f172a', margin: '0 0 28px' }}>Edit Listing</h1>
        <form onSubmit={handleSubmit}>
          <div style={{ background: '#fff', borderRadius: 28, padding: 36, boxShadow: '0 4px 24px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: 24 }}>
            <ImageUploader images={images} setImages={setImages} maxImages={5} />

            <div>
              <label style={{ fontFamily: FONT, fontSize: 14, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 8 }}>Title <span style={{ color: '#ef4444' }}>*</span></label>
              <input required value={form.title} onChange={e => setField('title', e.target.value)} style={inputStyle} placeholder="Title" />
            </div>

            <div>
              <label style={{ fontFamily: FONT, fontSize: 14, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 8 }}>Description</label>
              <textarea rows={4} value={form.description} onChange={e => setField('description', e.target.value)} style={{ ...inputStyle, resize: 'none' }} placeholder="Describe the item..." />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ fontFamily: FONT, fontSize: 14, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 8 }}>Category</label>
                <select value={form.category} onChange={e => setField('category', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontFamily: FONT, fontSize: 14, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 8 }}>Condition</label>
                <select value={form.condition} onChange={e => setField('condition', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                  {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Price */}
            <div>
              <label style={{ fontFamily: FONT, fontSize: 14, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 10 }}>Price</label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 12 }}>
                <div onClick={() => setField('is_free', !form.is_free)} style={{ width: 40, height: 22, borderRadius: 11, background: form.is_free ? '#10b981' : '#e2e8f0', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
                  <div style={{ position: 'absolute', top: 1, left: form.is_free ? 19 : 1, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                </div>
                <span style={{ fontFamily: FONT, fontSize: 14, fontWeight: 600, color: form.is_free ? '#10b981' : '#64748b' }}>Free item</span>
              </label>
              {!form.is_free && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'center' }}>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontFamily: FONT, fontWeight: 700, color: '#6366f1' }}>₹</span>
                    <input type="number" min="0" value={form.price} onChange={e => setField('price', e.target.value)} style={{ ...inputStyle, paddingLeft: 30 }} placeholder="0" />
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.is_negotiable} onChange={e => setField('is_negotiable', e.target.checked)} style={{ width: 18, height: 18, accentColor: '#6366f1', cursor: 'pointer' }} />
                    <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: '#475569' }}>Negotiable</span>
                  </label>
                </div>
              )}
            </div>

            <button type="submit" disabled={submitting} style={{ padding: '15px', borderRadius: 14, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', color: '#fff', fontFamily: FONT, fontWeight: 700, fontSize: 16, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.75 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              {submitting ? <><Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> Saving…</> : '💾 Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </PageLayout>
  )
}
