import { useState, useEffect, useRef } from 'react'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import { ImagePlus, X, Loader } from 'lucide-react'

const pjs = (size, weight, lh, color) => ({
  fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: size, fontWeight: weight, lineHeight: lh, color,
})

const categories = ['All', 'Books', 'Electronics', 'Dorm', 'Other']

export default function MarketplacePage() {
  const { user } = useAuth()
  const fileInputRef = useRef(null)

  const [items, setItems]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [cat, setCat]           = useState('All')
  const [showModal, setShowModal] = useState(false)
  const [posting, setPosting]   = useState(false)

  const [formData, setFormData] = useState({
    title: '', price: '', description: '', category: 'Books', image_url: ''
  })
  const [imageFile, setImageFile]       = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [uploadingImg, setUploadingImg] = useState(false)

  const fetchItems = async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/marketplace')
      setItems(res.data || [])
    } catch (err) {
      console.error('Failed to load marketplace:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchItems() }, [])

  const filteredItems = items.filter(i => {
    const matchesSearch = i.title.toLowerCase().includes(search.toLowerCase())
    const matchesCat = cat === 'All' || i.category === cat
    return matchesSearch && matchesCat
  })

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setUploadingImg(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('type', 'marketplace')
      const res = await api.upload('/api/upload/image', fd)
      if (res.url) setFormData(prev => ({ ...prev, image_url: res.url }))
    } catch (err) {
      console.error('Image upload failed:', err)
      setImagePreview(null)
      setImageFile(null)
      setFormData(prev => ({ ...prev, image_url: '' }))
      alert('Image upload failed. Please try again.')
    } finally {
      setUploadingImg(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const clearImage = () => {
    setImageFile(null)
    setImagePreview(null)
    setFormData(prev => ({ ...prev, image_url: '' }))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const closeModal = () => {
    setShowModal(false)
    setFormData({ title: '', price: '', description: '', category: 'Books', image_url: '' })
    clearImage()
  }

  const handlePost = async (e) => {
    e.preventDefault()
    if (uploadingImg) return
    setPosting(true)
    try {
      await api.post('/api/marketplace', formData)
      closeModal()
      fetchItems()
    } catch (err) {
      alert('Failed to post item')
    } finally {
      setPosting(false)
    }
  }

  return (
    <PageLayout>
      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageSelect} />

      <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%' }}>

        {/* Header Section */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom: 40, gap: 24, flexWrap:'wrap' }}>
          <div style={{ flex: 1, minWidth: 300 }}>
            <h1 style={pjs(32, 700, '40px', '#0f172a')}>Campus Marketplace</h1>
            <p style={{ ...pjs(16, 400, '24px', '#64748b'), marginTop: 8 }}>Buy and sell items within the university community.</p>

            <div style={{ display:'flex', gap: 12, marginTop: 24 }}>
              <div style={{ position:'relative', flex: 1, maxWidth: 400 }}>
                <input
                  type="text" placeholder="Search item name..." value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ width:'100%', padding:'12px 16px', paddingLeft: 44, borderRadius: 14, border:'1.5px solid #e2e8f0', outline:'none', ...pjs(14, 500, '20px', '#0f172a') }}
                />
                <svg style={{ position:'absolute', left:16, top:'50%', transform:'translateY(-50%)' }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              </div>
              <button
                onClick={() => setShowModal(true)}
                style={{ cursor:'pointer', padding:'0 24px', borderRadius:14, background:'#4f46e5', color:'#fff', border:'none', ...pjs(14, 600, '20px', '#fff'), display:'flex', alignItems:'center', gap: 8 }}
              >
                <span>Sell Item</span>
                <span style={{ fontSize: 20 }}>+</span>
              </button>
            </div>
          </div>

          <div style={{ display:'flex', gap: 8, background:'#f1f5f9', padding: 4, borderRadius: 12 }}>
            {categories.map(c => (
              <button key={c} onClick={() => setCat(c)} style={{
                padding:'8px 16px', borderRadius:8, border:'none', cursor:'pointer',
                background: cat === c ? '#fff' : 'transparent',
                boxShadow: cat === c ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                ...pjs(13, cat === c ? 700 : 500, '18px', cat === c ? '#4f46e5' : '#64748b'),
                transition: 'all 0.23s cubic-bezier(0.4, 0, 0.2, 1)'
              }}>{c}</button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ padding: 100, textAlign:'center', ...pjs(16, 500, '24px', '#94a3b8') }}>Loading amazing deals...</div>
        ) : filteredItems.length === 0 ? (
          <div style={{ padding: 100, textAlign:'center', background:'#fff', borderRadius: 24, border:'2px dashed #e2e8f0' }}>
            <span style={{ fontSize: 48 }}>🔍</span>
            <h2 style={{ ...pjs(20, 700, '28px', '#0f172a'), marginTop: 16 }}>No items found</h2>
            <p style={{ ...pjs(16, 400, '24px', '#64748b'), marginTop: 8 }}>Try adjusting your search or category filters.</p>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
            {filteredItems.map(item => (
              <div key={item.id} style={{ background:'#fff', borderRadius: 24, padding: 16, border:'1px solid #f1f5f9', boxShadow:'0 4px 12px rgba(0,0,0,0.03)', transition: 'transform 0.2s', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                <div style={{ width:'100%', aspectRatio:'1/1', background:'#f8fafc', borderRadius: 18, position:'relative', overflow:'hidden', marginBottom: 16 }}>
                  {item.image_url
                    ? <img src={item.image_url} alt={item.title} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize: 40 }}>📦</div>
                  }
                  <div style={{ position:'absolute', top:12, right:12, background:'rgba(255,255,255,0.9)', padding:'4px 10px', borderRadius:20, backdropFilter:'blur(4px)' }}>
                    <span style={pjs(14, 700, '20px', '#0f172a')}>₹{item.price}</span>
                  </div>
                </div>
                <div style={{ padding:'0 4px' }}>
                  <h3 style={{ ...pjs(17, 700, '22px', '#0f172a'), whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{item.title}</h3>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop: 12 }}>
                    <div style={{ display:'flex', gap: 8, alignItems:'center' }}>
                      <div style={{ width:24, height:24, borderRadius:'50%', background:'#e2e8f0', overflow:'hidden' }}>
                        <img src={item.seller?.avatar_url || `https://ui-avatars.com/api/?name=${item.seller?.full_name || 'User'}`} alt="" style={{ width:'100%', height:'100%' }} />
                      </div>
                      <span style={pjs(12, 500, '16px', '#64748b')}>{item.seller?.full_name?.split(' ')[0] || 'Student'}</span>
                    </div>
                    <span style={{ ...pjs(11, 700, '16px', '#4f46e5'), background:'#eef2ff', padding:'2px 8px', borderRadius:6, textTransform:'uppercase' }}>{item.category || 'Other'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Sell Modal */}
        {showModal && (
          <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.6)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding: 20 }}>
            <div style={{ background:'#fff', borderRadius: 28, width:'100%', maxWidth: 520, padding: 32, position:'relative', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', maxHeight: '90vh', overflowY: 'auto' }}>
              <button onClick={closeModal} style={{ position:'absolute', top:24, right:24, background:'none', border:'none', cursor:'pointer', fontSize: 24, color:'#94a3b8' }}>×</button>

              <h2 style={pjs(24, 700, '32px', '#0f172a')}>List New Item</h2>
              <p style={{ ...pjs(15, 400, '22px', '#64748b'), marginTop: 4 }}>Offer something useful to your fellow students.</p>

              <form onSubmit={handlePost} style={{ marginTop: 28, display:'flex', flexDirection:'column', gap: 20 }}>

                {/* Image upload */}
                <div>
                  <label style={{ ...pjs(14, 600, '20px', '#475569'), display:'block', marginBottom: 8 }}>Item Photo <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional)</span></label>
                  {imagePreview ? (
                    <div style={{ position: 'relative', width: '100%', height: 180, borderRadius: 16, overflow: 'hidden', border: '1.5px solid #e2e8f0' }}>
                      <img src={imagePreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      {uploadingImg && (
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                          <Loader size={28} color="#fff" style={{ animation: 'spin 1s linear infinite' }} />
                          <span style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>Uploading...</span>
                        </div>
                      )}
                      {!uploadingImg && (
                        <button type="button" onClick={clearImage} style={{ position: 'absolute', top: 10, right: 10, width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <X size={14} color="#fff" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <button type="button" onClick={() => fileInputRef.current?.click()}
                      style={{ width: '100%', height: 120, borderRadius: 16, border: '2px dashed #e2e8f0', background: '#f8fafc', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'border-color 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = '#4f46e5'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e8f0'}
                    >
                      <ImagePlus size={24} color="#94a3b8" />
                      <span style={pjs(13, 500, '18px', '#94a3b8')}>Click to upload a photo</span>
                    </button>
                  )}
                </div>

                <div>
                  <label style={{ ...pjs(14, 600, '20px', '#475569'), display:'block', marginBottom: 8 }}>Item Title</label>
                  <input
                    required type="text" placeholder="e.g. Organic Chemistry Textbook (10th Ed)"
                    value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
                    style={{ width:'100%', padding:'12px 16px', borderRadius:12, border:'1.5px solid #e2e8f0', outline:'none', ...pjs(14, 400, '20px', '#0f172a') }}
                  />
                </div>

                <div style={{ display:'flex', gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ ...pjs(14, 600, '20px', '#475569'), display:'block', marginBottom: 8 }}>Price (₹)</label>
                    <input
                      required type="number" placeholder="499"
                      value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})}
                      style={{ width:'100%', padding:'12px 16px', borderRadius:12, border:'1.5px solid #e2e8f0', outline:'none', ...pjs(14, 400, '20px', '#0f172a') }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ ...pjs(14, 600, '20px', '#475569'), display:'block', marginBottom: 8 }}>Category</label>
                    <select
                      value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}
                      style={{ width:'100%', padding:'12px 16px', borderRadius:12, border:'1.5px solid #e2e8f0', outline:'none', ...pjs(14, 500, '20px', '#0f172a'), height:48, background:'#fff' }}
                    >
                      {categories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ ...pjs(14, 600, '20px', '#475569'), display:'block', marginBottom: 8 }}>Description</label>
                  <textarea
                    rows={3} placeholder="Tell us about the condition and how to pick it up..."
                    value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                    style={{ width:'100%', padding:'12px 16px', borderRadius:12, border:'1.5px solid #e2e8f0', outline:'none', ...pjs(14, 400, '20px', '#0f172a'), resize:'none' }}
                  />
                </div>

                <button
                  disabled={posting || uploadingImg}
                  style={{ marginTop: 8, padding:'14px', borderRadius:14, background:'#4f46e5', color:'#fff', border:'none', ...pjs(16, 600, '24px', '#fff'), cursor: (posting || uploadingImg) ? 'not-allowed' : 'pointer', opacity: (posting || uploadingImg) ? 0.7 : 1 }}
                >
                  {uploadingImg ? 'Uploading image...' : posting ? 'Listing...' : 'Post Listing'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </PageLayout>
  )
}
