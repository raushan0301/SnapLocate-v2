import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'
import { ArrowLeft, Upload, X, Loader, CheckCircle } from 'lucide-react'

const CATEGORIES = ['Textbooks', 'Electronics', 'Vehicles', 'Furniture', 'Clothing', 'Sports', 'Other']
const CONDITIONS  = ['Like New', 'Good', 'Fair', 'Needs Repair']

const fieldCls = 'w-full px-4 py-3 rounded-[14px] border-[1.5px] border-slate-200 outline-none t-base t-primary bg-white focus:border-indigo-500 transition-colors box-border'

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
      <label className="block mb-2.5 t-base font-bold text-slate-700">
        Photos <span className="font-normal t-subtle">({images.length}/{maxImages})</span>
      </label>
      {images.length < maxImages && (
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); uploadFiles(e.dataTransfer.files) }}
          onClick={() => inputRef.current?.click()}
          className={`w-full min-h-[100px] rounded-[14px] border-2 border-dashed cursor-pointer flex flex-col items-center justify-center gap-1.5 mb-2.5 transition-all ${dragOver ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-slate-50 hover:border-indigo-300'}`}>
          {uploading
            ? <Loader size={22} className="text-indigo-500" style={{ animation: 'spin 1s linear infinite' }} />
            : <><Upload size={20} className="text-indigo-500" /><span className="t-md font-semibold text-indigo-500">Drop or click to add photos</span></>
          }
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => uploadFiles(e.target.files)} />
      {images.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {images.map((url, i) => (
            <div key={i} className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 ${i === 0 ? 'border-indigo-500' : 'border-slate-200'}`}>
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button onClick={() => setImages(p => p.filter((_, j) => j !== i))}
                className="absolute top-[3px] right-[3px] w-5 h-5 rounded-full bg-black/60 border-none cursor-pointer flex items-center justify-center">
                <X size={11} color="#fff" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

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
        title: d.title || '', description: d.description || '',
        price: isFree ? '' : String(d.price), category: d.category || 'Other',
        condition: d.condition || 'Good', is_negotiable: d.is_negotiable || false, is_free: isFree,
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
        title: form.title.trim(), description: form.description.trim() || undefined,
        price: form.is_free ? null : (form.price === '' ? null : Number(form.price)),
        is_negotiable: form.is_negotiable, category: form.category, condition: form.condition, images,
      })
      setSuccess(true)
      setTimeout(() => navigate(`/marketplace/listing/${id}`), 1200)
    } catch (err) { alert(err.message || 'Failed to save') }
    finally { setSubmitting(false) }
  }

  if (loading) return (
    <PageLayout>
      <div className="w-full p-6 box-border">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 bg-slate-100 rounded-2xl mb-4" style={{ animation: 'pulse 1.5s infinite' }} />
        ))}
      </div>
    </PageLayout>
  )

  if (success) return (
    <PageLayout>
      <div className="mt-20 text-center">
        <CheckCircle size={64} className="text-emerald-500 mx-auto mb-4" />
        <h2 className="text-[26px] font-extrabold t-primary m-0 mb-2">Listing Updated!</h2>
      </div>
    </PageLayout>
  )

  return (
    <PageLayout>
      <button onClick={() => navigate(-1)}
        className="flex items-center gap-2 bg-transparent border-none cursor-pointer text-[14px] font-semibold text-indigo-500 mb-7 p-0">
        <ArrowLeft size={18} /> Back
      </button>

      <h1 className="text-[28px] font-extrabold t-primary m-0 mb-7">Edit Listing</h1>

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-[28px] p-6 sm:p-9 shadow-[0_4px_24px_rgba(0,0,0,0.06)] flex flex-col gap-6">
          <ImageUploader images={images} setImages={setImages} maxImages={5} />

          <div>
            <label className="block mb-2 t-base font-bold text-slate-700">Title <span className="text-danger">*</span></label>
            <input required value={form.title} onChange={e => setField('title', e.target.value)}
              className={fieldCls} placeholder="Title" />
          </div>

          <div>
            <label className="block mb-2 t-base font-bold text-slate-700">Description</label>
            <textarea rows={4} value={form.description} onChange={e => setField('description', e.target.value)}
              className={`${fieldCls} resize-none`} placeholder="Describe the item..." />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 t-base font-bold text-slate-700">Category</label>
              <select value={form.category} onChange={e => setField('category', e.target.value)} className={`${fieldCls} cursor-pointer`}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block mb-2 t-base font-bold text-slate-700">Condition</label>
              <select value={form.condition} onChange={e => setField('condition', e.target.value)} className={`${fieldCls} cursor-pointer`}>
                {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Price */}
          <div>
            <label className="block mb-2.5 t-base font-bold text-slate-700">Price</label>
            <label className="flex items-center gap-2 cursor-pointer mb-3">
              <div onClick={() => setField('is_free', !form.is_free)}
                className={`w-10 h-[22px] rounded-full relative cursor-pointer transition-colors shrink-0 ${form.is_free ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.2)] transition-all ${form.is_free ? 'left-[19px]' : 'left-[1px]'}`} />
              </div>
              <span className={`t-base font-semibold ${form.is_free ? 'text-emerald-500' : 'text-slate-500'}`}>Free item</span>
            </label>
            {!form.is_free && (
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-center">
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[14px] font-bold text-indigo-500">₹</span>
                  <input type="number" min="0" value={form.price} onChange={e => setField('price', e.target.value)}
                    className={`${fieldCls} pl-8`} placeholder="0" />
                </div>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={form.is_negotiable} onChange={e => setField('is_negotiable', e.target.checked)}
                    className="w-[18px] h-[18px] accent-indigo-500 cursor-pointer" />
                  <span className="text-[13px] font-semibold text-slate-600">Negotiable</span>
                </label>
              </div>
            )}
          </div>

          <button type="submit" disabled={submitting}
            className={`py-[15px] rounded-[14px] border-none text-white text-[16px] font-bold flex items-center justify-center gap-2.5 transition-all ${submitting ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer'}`}
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            {submitting
              ? <><Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> Saving…</>
              : '💾 Save Changes'}
          </button>
        </div>
      </form>
    </PageLayout>
  )
}
