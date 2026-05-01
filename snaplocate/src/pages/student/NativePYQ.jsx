import { useState, useEffect } from 'react'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'
import {
  FileText, Search, Filter, Download,
  FolderOpen, Calendar, BookOpen
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const pjs = (sz, fw, lh, col) => ({
  fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: sz, fontWeight: fw, lineHeight: lh, color: col
})

const inp = {
  width: '100%', padding: '10px 14px', borderRadius: 12,
  border: '1.5px solid #e2e8f0', fontSize: 14,
  fontFamily: "'Plus Jakarta Sans',sans-serif", outline: 'none', boxSizing: 'border-box'
}

export default function NativePYQ() {
  const { user } = useAuth()
  const [pyqs, setPyqs] = useState([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [search, setSearch] = useState('')
  const [yearFilter, setYearFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  // For faculty upload
  const [showUpload, setShowUpload] = useState(false)
  const [form, setForm] = useState({ subject_code: '', exam_year: new Date().getFullYear(), exam_type: 'mid', file_url: '' })
  const [uploading, setUploading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      let url = '/api/lms/native/pyq?'
      if (search) url += `subject_code=${search.toUpperCase()}&`
      if (yearFilter) url += `exam_year=${yearFilter}&`
      if (typeFilter) url += `exam_type=${typeFilter}&`

      const res = await api.get(url)
      if (res.success) setPyqs(res.data || [])
    } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => {
    const delay = setTimeout(() => load(), 300)
    return () => clearTimeout(delay)
  }, [search, yearFilter, typeFilter])

  const handleUpload = async () => {
    if (!form.subject_code || !form.exam_year || !form.file_url) return alert('Fill required fields')
    setUploading(true)
    try {
      const res = await api.post('/api/lms/native/pyq', form)
      if (res.success) {
        setShowUpload(false)
        setForm({ subject_code: '', exam_year: new Date().getFullYear(), exam_type: 'mid', file_url: '' })
        load()
      } else alert(res.error)
    } catch (e) { alert(e.message) }
    finally { setUploading(false) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this PYQ?')) return
    try {
      await api.delete(`/api/lms/native/pyq/${id}`)
      load()
    } catch {}
  }

  const isFaculty = user?.role === 'faculty' || user?.role === 'admin'

  return (
    <PageLayout>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div style={{ width: 46, height: 46, borderRadius: 14, background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FolderOpen size={22} color="#16a34a" />
          </div>
          <div>
            <h1 style={{ ...pjs(26, 800, '32px', '#0f172a'), margin: 0, letterSpacing: '-0.02em' }}>PYQ Library</h1>
            <p style={{ ...pjs(13, 400, '18px', '#64748b'), margin: '4px 0 0' }}>Previous Year Question Papers for Mid/End Semesters</p>
          </div>
        </div>
        {isFaculty && (
          <button onClick={() => setShowUpload(!showUpload)}
            style={{ padding: '10px 18px', borderRadius: 12, border: 'none', background: '#16a34a', cursor: 'pointer', ...pjs(13, 700, '18px', '#fff') }}>
            {showUpload ? 'Cancel' : 'Upload PYQ'}
          </button>
        )}
      </div>

      {/* Upload Form (Faculty/Admin only) */}
      {showUpload && isFaculty && (
        <div style={{ background: '#fff', borderRadius: 20, border: '1.5px solid #bbf7d0', padding: 20, marginTop: 20, boxShadow: '0 10px 30px rgba(22,163,74,0.05)' }}>
          <div style={{ ...pjs(15, 700, '20px', '#0f172a'), marginBottom: 16 }}>Upload New PYQ</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 14 }}>
            <input value={form.subject_code} onChange={e => setForm({...form, subject_code: e.target.value.toUpperCase()})} placeholder="Subject Code (e.g. UCS101)" style={inp} />
            <input type="number" value={form.exam_year} onChange={e => setForm({...form, exam_year: e.target.value})} placeholder="Year (e.g. 2023)" style={inp} />
            <select value={form.exam_type} onChange={e => setForm({...form, exam_type: e.target.value})} style={inp}>
              <option value="mid">Mid Semester (MST)</option>
              <option value="end">End Semester (EST)</option>
            </select>
          </div>
          <input value={form.file_url} onChange={e => setForm({...form, file_url: e.target.value})} placeholder="File/Drive Link URL" style={{ ...inp, marginBottom: 14 }} />
          <button onClick={handleUpload} disabled={uploading}
            style={{ width: '100%', padding: '12px', borderRadius: 12, border: 'none', background: '#0f172a', color: '#fff', cursor: uploading ? 'not-allowed' : 'pointer', ...pjs(14, 700, '20px', '#fff') }}>
            {uploading ? 'Uploading...' : 'Publish PYQ'}
          </button>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search subject code (e.g. UMA010)..."
            style={{ ...inp, paddingLeft: 40 }} />
        </div>
        <select value={yearFilter} onChange={e => setYearFilter(e.target.value)} style={{ ...inp, width: 140 }}>
          <option value="">All Years</option>
          <option value="2025">2025</option>
          <option value="2024">2024</option>
          <option value="2023">2023</option>
          <option value="2022">2022</option>
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ ...inp, width: 150 }}>
          <option value="">All Types</option>
          <option value="mid">Mid Sem (MST)</option>
          <option value="end">End Sem (EST)</option>
        </select>
      </div>

      {/* Results Grid */}
      {loading ? (
        <div style={{ padding: 60, textAlign: 'center', ...pjs(14, 500, '20px', '#94a3b8') }}>Loading PYQs...</div>
      ) : pyqs.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 20, border: '1.5px dashed #e2e8f0', padding: '60px 24px', textAlign: 'center', marginTop: 16 }}>
          <Filter size={40} color="#e2e8f0" style={{ margin: '0 auto 12px', display: 'block' }} />
          <div style={pjs(15, 600, '20px', '#0f172a')}>No PYQs Found</div>
          <div style={{ ...pjs(13, 400, '18px', '#94a3b8'), marginTop: 4 }}>Try adjusting your filters or search term.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14, marginTop: 16 }}>
          {pyqs.map(p => (
            <div key={p.id} style={{ background: '#fff', borderRadius: 20, border: '1.5px solid #f1f5f9', padding: '18px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ ...pjs(11, 700, '14px', p.exam_type === 'mid' ? '#d97706' : '#4f46e5'), background: p.exam_type === 'mid' ? '#fffbeb' : '#eef2ff', padding: '3px 10px', borderRadius: 6 }}>
                  {p.exam_type === 'mid' ? 'MST' : 'EST'}
                </span>
                {p.verified && <span style={{ ...pjs(10, 700, '12px', '#16a34a') }}>✓ Verified</span>}
              </div>
              
              <div style={{ flex: 1 }}>
                <div style={pjs(18, 800, '24px', '#0f172a')}>{p.subject_code}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, ...pjs(12, 500, '16px', '#64748b') }}>
                    <Calendar size={14} /> {p.exam_year}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
                <a href={p.file_url} target="_blank" rel="noreferrer"
                  style={{ flex: 1, padding: '10px 0', borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, ...pjs(13, 700, '18px', '#0f172a') }}>
                  <Download size={15} /> Open Paper
                </a>
                {isFaculty && (
                  <button onClick={() => handleDelete(p.id)}
                    style={{ padding: '0 14px', borderRadius: 12, background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', cursor: 'pointer' }}>
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </PageLayout>
  )
}
