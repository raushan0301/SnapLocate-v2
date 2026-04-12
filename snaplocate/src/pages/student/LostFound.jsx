import { useState, useEffect, useRef } from 'react'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import { ImagePlus, X, Loader } from 'lucide-react'

const pjs = (size, weight, lh, color) => ({
  fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: size, fontWeight: weight, lineHeight: lh, color,
})

export default function LostFoundPage() {
  const { user } = useAuth()
  const fileInputRef = useRef(null)

  const [items, setItems]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [posting, setPosting]     = useState(false)
  const [filter, setFilter]       = useState('all')

  const [formData, setFormData] = useState({
    title: '', description: '', location: '', status: 'lost',
    date: new Date().toISOString().split('T')[0], image_url: ''
  })
  const [imagePreview, setImagePreview] = useState(null)
  const [uploadingImg, setUploadingImg] = useState(false)

  const fetchItems = async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/lost-found')
      setItems(res.data || [])
    } catch (err) {
      console.error('Failed to load items:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchItems() }, [])

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImagePreview(URL.createObjectURL(file))
    setUploadingImg(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('type', 'lost_found')
      const res = await api.upload('/api/upload/image', fd)
      if (res.url) setFormData(prev => ({ ...prev, image_url: res.url }))
    } catch (err) {
      console.error('Image upload failed:', err)
      setImagePreview(null)
      setFormData(prev => ({ ...prev, image_url: '' }))
      alert('Image upload failed. Please try again.')
    } finally {
      setUploadingImg(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const clearImage = () => {
    setImagePreview(null)
    setFormData(prev => ({ ...prev, image_url: '' }))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const closeModal = () => {
    setShowModal(false)
    setFormData({ title: '', description: '', location: '', status: 'lost', date: new Date().toISOString().split('T')[0], image_url: '' })
    clearImage()
  }

  const handlePost = async (e) => {
    e.preventDefault()
    if (uploadingImg) return
    setPosting(true)
    try {
      await api.post('/api/lost-found', formData)
      closeModal()
      fetchItems()
    } catch (err) {
      alert('Failed to post report')
    } finally {
      setPosting(false)
    }
  }

  const filtered = items.filter(i => filter === 'all' || i.status === filter)

  return (
    <PageLayout>
      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageSelect} />

      <div style={{ maxWidth: 900, margin: '0 auto', width: '100%' }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', background:'#fff', padding:'32px 40px', borderRadius:28, boxShadow:'0 1px 4px rgba(0,0,0,.04)', border:'1px solid #f1f5f9', marginBottom: 32 }}>
          <div>
            <h1 style={pjs(28, 700, '36px', '#0f172a')}>Campus Lost & Found</h1>
            <p style={{ ...pjs(15, 500, '22px', '#64748b'), marginTop: 4 }}>Help classmates find their belongings or report something you've lost.</p>
            <div style={{ display:'flex', gap: 10, marginTop: 24 }}>
              {['all', 'lost', 'found'].map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{
                  padding:'8px 18px', borderRadius:20, border:'none', cursor:'pointer',
                  background: filter === f ? '#0f172a' : '#f1f5f9',
                  ...pjs(13, 600, '18px', filter === f ? '#fff' : '#64748b'),
                  textTransform:'capitalize', transition:'all 0.2s'
                }}>{f}</button>
              ))}
            </div>
          </div>
          <button onClick={() => setShowModal(true)} style={{ cursor:'pointer', padding:'12px 24px', borderRadius:16, background:'#ef4444', color:'#fff', border:'none', ...pjs(14, 700, '20px', '#fff'), display:'flex', alignItems:'center', gap: 8, boxShadow:'0 4px 12px rgba(239, 68, 68, 0.2)' }}>
            <span>Report Item</span>
            <span style={{ fontSize: 20 }}>+</span>
          </button>
        </div>

        {/* Feed */}
        {loading ? (
          <div style={{ padding: 60, textAlign:'center', ...pjs(16, 500, '24px', '#94a3b8') }}>Scanning campus records...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 80, textAlign:'center', background:'#fff', borderRadius: 28, border:'2px dashed #e2e8f0' }}>
            <span style={{ fontSize: 48 }}>🔍</span>
            <h2 style={{ ...pjs(20, 700, '28px', '#0f172a'), marginTop: 16 }}>Nothing matched</h2>
            <p style={{ ...pjs(16, 400, '24px', '#64748b'), marginTop: 8 }}>Every item is where it belongs, for now!</p>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap: 20 }}>
            {filtered.map(item => (
              <div key={item.id} style={{ background:'#fff', borderRadius: 24, padding: 24, border:'1px solid #f1f5f9', boxShadow:'0 1px 3px rgba(0,0,0,.02)', display:'flex', gap: 24, alignItems:'center' }}>
                <div style={{ width:100, height:100, background: item.image_url ? 'transparent' : (item.status==='lost'?'#fee2e2':'#dcfce7'), borderRadius:20, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, overflow: 'hidden' }}>
                  {item.image_url
                    ? <img src={item.image_url} alt={item.title} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    : <span style={{ fontSize: 40 }}>{item.status === 'lost' ? '❓' : '✅'}</span>
                  }
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                    <div>
                      <h3 style={pjs(18, 700, '24px', '#0f172a')}>{item.title}</h3>
                      <div style={{ display:'flex', gap: 12, alignItems:'center', marginTop: 4 }}>
                        <span style={{ ...pjs(11, 800, '16px', item.status==='lost'?'#ef4444':'#16a34a'), textTransform:'uppercase', letterSpacing:'.05em' }}>{item.status}</span>
                        <span style={{ width:3, height:3, borderRadius:'50%', background:'#cbd5e1' }} />
                        <span style={pjs(13, 400, '18px', '#64748b')}>{item.location}</span>
                        <span style={{ width:3, height:3, borderRadius:'50%', background:'#cbd5e1' }} />
                        <span style={pjs(13, 400, '18px', '#64748b')}>{new Date(item.date || item.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <p style={{ ...pjs(14, 400, '22px', '#475569'), marginTop: 12 }}>{item.description}</p>
                </div>
                <div style={{ textAlign:'right', flexShrink:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap: 8, justifyContent:'flex-end', marginBottom: 12 }}>
                    <div style={{ textAlign:'right' }}>
                      <div style={pjs(13, 700, '16px', '#0f172a')}>{item.reporter?.full_name?.split(' ')[0] || 'Student'}</div>
                      <div style={pjs(11, 500, '14px', '#64748b')}>Reporter</div>
                    </div>
                    <img src={item.reporter?.avatar_url || `https://ui-avatars.com/api/?name=${item.reporter?.full_name || 'U'}`} alt="" style={{ width:36, height:36, borderRadius:12, objectFit:'cover' }} />
                  </div>
                  <button style={{ ...pjs(13, 600, '18px', '#ef4444'), background:'#fff', border:'1.5px solid #fecaca', borderRadius:10, padding:'6px 14px', cursor:'pointer' }}>Contact</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Report Modal */}
        {showModal && (
          <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.6)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding: 20 }}>
            <div style={{ background:'#fff', borderRadius: 28, width:'100%', maxWidth: 500, padding: 32, position:'relative', maxHeight: '90vh', overflowY: 'auto' }}>
              <button onClick={closeModal} style={{ position:'absolute', top:24, right:24, background:'none', border:'none', cursor:'pointer', fontSize: 24, color:'#94a3b8' }}>×</button>

              <h2 style={pjs(24, 700, '32px', '#0f172a')}>Report Item</h2>
              <div style={{ display:'flex', gap: 8, marginTop: 16 }}>
                <button onClick={() => setFormData({...formData, status: 'lost'})}
                  style={{ flex:1, padding:'10px', borderRadius:12, border: formData.status==='lost'?'2px solid #ef4444':'1px solid #e2e8f0', background: formData.status==='lost'?'#fef2f2':'#fff', ...pjs(14, 700, '20px', formData.status==='lost'?'#ef4444':'#64748b'), cursor:'pointer' }}>
                  I Lost Something
                </button>
                <button onClick={() => setFormData({...formData, status: 'found'})}
                  style={{ flex:1, padding:'10px', borderRadius:12, border: formData.status==='found'?'2px solid #16a34a':'1px solid #e2e8f0', background: formData.status==='found'?'#f0fdf4':'#fff', ...pjs(14, 700, '20px', formData.status==='found'?'#16a34a':'#64748b'), cursor:'pointer' }}>
                  I Found Something
                </button>
              </div>

              <form onSubmit={handlePost} style={{ marginTop: 24, display:'flex', flexDirection:'column', gap: 20 }}>

                {/* Image upload */}
                <div>
                  <label style={{ ...pjs(14, 600, '20px', '#475569'), display:'block', marginBottom: 8 }}>Photo <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional)</span></label>
                  {imagePreview ? (
                    <div style={{ position: 'relative', width: '100%', height: 160, borderRadius: 16, overflow: 'hidden', border: '1.5px solid #e2e8f0' }}>
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
                      style={{ width: '100%', height: 100, borderRadius: 16, border: '2px dashed #e2e8f0', background: '#f8fafc', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = '#ef4444'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e8f0'}
                    >
                      <ImagePlus size={22} color="#94a3b8" />
                      <span style={pjs(13, 500, '18px', '#94a3b8')}>Click to attach a photo</span>
                    </button>
                  )}
                </div>

                <div>
                  <label style={{ ...pjs(14, 600, '20px', '#475569'), display:'block', marginBottom: 8 }}>Item Title</label>
                  <input required type="text" placeholder="e.g. Blue Nike Water Bottle"
                    value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
                    style={{ width:'100%', padding:'12px 16px', borderRadius:12, border:'1.5px solid #e2e8f0', outline:'none', ...pjs(14, 400, '20px', '#0f172a') }}
                  />
                </div>
                <div>
                  <label style={{ ...pjs(14, 600, '20px', '#475569'), display:'block', marginBottom: 8 }}>Location / Area</label>
                  <input required type="text" placeholder="e.g. Near LT-303 or Library Ground Floor"
                    value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})}
                    style={{ width:'100%', padding:'12px 16px', borderRadius:12, border:'1.5px solid #e2e8f0', outline:'none', ...pjs(14, 400, '20px', '#0f172a') }}
                  />
                </div>
                <div>
                  <label style={{ ...pjs(14, 600, '20px', '#475569'), display:'block', marginBottom: 8 }}>Description</label>
                  <textarea rows={3} placeholder="Provide details like color, brand, or unique marks..."
                    value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                    style={{ width:'100%', padding:'12px 16px', borderRadius:12, border:'1.5px solid #e2e8f0', outline:'none', ...pjs(14, 400, '20px', '#0f172a'), resize:'none' }}
                  />
                </div>
                <button disabled={posting || uploadingImg} style={{ marginTop: 8, padding:'14px', borderRadius:14, background:'#0f172a', color:'#fff', border:'none', ...pjs(16, 600, '24px', '#fff'), cursor: (posting || uploadingImg) ? 'not-allowed' : 'pointer', opacity: (posting || uploadingImg) ? 0.7 : 1 }}>
                  {uploadingImg ? 'Uploading image...' : posting ? 'Posting...' : 'Post Report'}
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
