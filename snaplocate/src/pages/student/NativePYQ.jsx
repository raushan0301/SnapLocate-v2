import { useState, useEffect } from 'react'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'
import { FileText, Search, Filter, Download, FolderOpen, Calendar } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const fieldCls = 'w-full px-3.5 py-2.5 rounded-xl border-[1.5px] border-slate-200 text-[14px] outline-none box-border'

export default function NativePYQ() {
  const { user } = useAuth()
  const [pyqs, setPyqs] = useState([])
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [yearFilter, setYearFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  const [showUpload, setShowUpload] = useState(false)
  const [form, setForm] = useState({ subject_code: '', exam_year: new Date().getFullYear(), exam_type: 'mid', file_url: '' })
  const [uploading, setUploading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      let url = '/api/lms/native/pyq?'
      if (search)     url += `subject_code=${search.toUpperCase()}&`
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
    try { await api.delete(`/api/lms/native/pyq/${id}`); load() } catch {}
  }

  const isFaculty = user?.role === 'faculty' || user?.role === 'admin'

  return (
    <PageLayout>
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3.5">
        <div className="flex items-start gap-3.5">
          <div className="w-[46px] h-[46px] rounded-[14px] flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)' }}>
            <FolderOpen size={22} color="#16a34a" />
          </div>
          <div>
            <h1 className="text-[26px] font-extrabold leading-8 t-primary m-0 tracking-tight">PYQ Library</h1>
            <p className="text-[13px] font-normal leading-[18px] text-slate-500 mt-1 m-0">Previous Year Question Papers for Mid/End Semesters</p>
          </div>
        </div>
        {isFaculty && (
          <button onClick={() => setShowUpload(!showUpload)}
            className="px-[18px] py-2.5 rounded-xl border-none bg-green-600 cursor-pointer text-[13px] font-bold leading-[18px] text-white">
            {showUpload ? 'Cancel' : 'Upload PYQ'}
          </button>
        )}
      </div>

      {/* Upload Form */}
      {showUpload && isFaculty && (
        <div className="bg-white rounded-[20px] border-[1.5px] border-green-200 p-5 shadow-[0_10px_30px_rgba(22,163,74,0.05)]">
          <div className="text-[15px] font-bold leading-5 t-primary mb-4">Upload New PYQ</div>
          <div className="grid gap-3 mb-3.5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
            <input value={form.subject_code} onChange={e => setForm({ ...form, subject_code: e.target.value.toUpperCase() })}
              placeholder="Subject Code (e.g. UCS101)" className={fieldCls} />
            <input type="number" value={form.exam_year} onChange={e => setForm({ ...form, exam_year: e.target.value })}
              placeholder="Year (e.g. 2023)" className={fieldCls} />
            <select value={form.exam_type} onChange={e => setForm({ ...form, exam_type: e.target.value })} className={fieldCls}>
              <option value="mid">Mid Semester (MST)</option>
              <option value="end">End Semester (EST)</option>
            </select>
          </div>
          <input value={form.file_url} onChange={e => setForm({ ...form, file_url: e.target.value })}
            placeholder="File/Drive Link URL" className={`${fieldCls} mb-3.5`} />
          <button onClick={handleUpload} disabled={uploading}
            className={`w-full py-3 rounded-xl border-none bg-slate-900 text-white text-[14px] font-bold leading-5 ${uploading ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}`}>
            {uploading ? 'Uploading...' : 'Publish PYQ'}
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px] relative">
          <Search size={16} color="#94a3b8" className="absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search subject code (e.g. UMA010)..."
            className={`${fieldCls} pl-10`} />
        </div>
        <select value={yearFilter} onChange={e => setYearFilter(e.target.value)} className={`${fieldCls} w-[140px]`}>
          <option value="">All Years</option>
          <option value="2025">2025</option>
          <option value="2024">2024</option>
          <option value="2023">2023</option>
          <option value="2022">2022</option>
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className={`${fieldCls} w-[150px]`}>
          <option value="">All Types</option>
          <option value="mid">Mid Sem (MST)</option>
          <option value="end">End Sem (EST)</option>
        </select>
      </div>

      {/* Results */}
      {loading ? (
        <div className="py-16 text-center t-base font-medium text-slate-400">Loading PYQs...</div>
      ) : pyqs.length === 0 ? (
        <div className="bg-white rounded-[20px] border-[1.5px] border-dashed border-slate-200 py-16 px-6 text-center mt-4">
          <Filter size={40} className="text-slate-200 mx-auto mb-3 block" />
          <div className="text-[15px] font-semibold leading-5 t-primary">No PYQs Found</div>
          <div className="text-[13px] font-normal leading-[18px] text-slate-400 mt-1">Try adjusting your filters or search term.</div>
        </div>
      ) : (
        <div className="mt-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {pyqs.map(p => (
            <div key={p.id} className="bg-white rounded-[20px] border-[1.5px] border-slate-100 px-5 py-[18px] shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <span className={`text-[11px] font-bold leading-[14px] px-2.5 py-[3px] rounded-md ${p.exam_type === 'mid' ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-brand'}`}>
                  {p.exam_type === 'mid' ? 'MST' : 'EST'}
                </span>
                {p.verified && <span className="text-[10px] font-bold leading-3 text-green-600">✓ Verified</span>}
              </div>

              <div className="flex-1">
                <div className="text-[18px] font-extrabold leading-6 t-primary">{p.subject_code}</div>
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-1.5 text-[12px] font-medium leading-4 text-slate-500">
                    <Calendar size={14} /> {p.exam_year}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-5">
                <a href={p.file_url} target="_blank" rel="noreferrer"
                  className="flex-1 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 no-underline flex items-center justify-center gap-2 text-[13px] font-bold leading-[18px]">
                  <Download size={15} /> Open Paper
                </a>
                {isFaculty && (
                  <button onClick={() => handleDelete(p.id)}
                    className="px-3.5 rounded-xl bg-red-50 border border-red-200 text-red-600 cursor-pointer text-[13px] font-semibold">
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
