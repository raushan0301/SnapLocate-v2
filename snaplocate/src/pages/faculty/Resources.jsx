import { useState, useEffect, useRef } from 'react'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'
import { Plus, Trash2, Upload, FileText, ExternalLink, X, Check } from 'lucide-react'

const TYPE_OPTIONS = [
  { value: 'note',     label: 'Notes',    color: '#4f46e5', bg: '#eef2ff' },
  { value: 'pyq',      label: 'PYQ',      color: '#7e22ce', bg: '#fdf4ff' },
  { value: 'lab',      label: 'Lab',      color: '#047857', bg: '#ecfdf5' },
  { value: 'syllabus', label: 'Syllabus', color: '#0369a1', bg: '#f0f9ff' },
  { value: 'paper',    label: 'Paper',    color: '#c2410c', bg: '#fff7ed' },
  { value: 'doc',      label: 'Doc',      color: '#64748b', bg: '#f8fafc' },
]

const typeInfo = (t) => TYPE_OPTIONS.find(o => o.value === t) || TYPE_OPTIONS[TYPE_OPTIONS.length - 1]

const EMPTY_FORM = { title: '', type: 'note', course_id: '', description: '', file_url: '' }

const fieldCls = 'w-full px-[14px] py-[10px] rounded-[10px] border-[1.5px] border-slate-200 text-[14px] outline-none box-border focus:border-brand transition-colors'

function UploadModal({ courses, onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadedName, setUploadedName] = useState('')
  const [error, setError] = useState('')
  const fileRef = useRef()

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleFile = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { setError('File must be under 10MB'); return }
    setUploading(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload/workspace', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: fd,
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.message || 'Upload failed')
      set('file_url', data.url)
      setUploadedName(file.name)
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title || !form.type || !form.file_url) { setError('Title, type, and file are required'); return }
    setSaving(true)
    setError('')
    try {
      const res = await api.post('/api/resources', {
        title: form.title,
        type: form.type,
        file_url: form.file_url,
        course_id: form.course_id || null,
        description: form.description || undefined,
      })
      if (!res.success) throw new Error(res.error || 'Save failed')
      onSaved(res.data)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/35 z-[100] flex items-center justify-center p-5">
      <div className="bg-white rounded-[20px] p-8 w-full max-w-[520px] shadow-[0_20px_60px_rgba(0,0,0,0.15)] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-[20px] font-extrabold t-primary m-0">Upload Resource</h2>
            <p className="text-[13px] t-muted mt-1 mb-0">Share notes, PYQs, lab files with your students.</p>
          </div>
          <button onClick={onClose} className="bg-slate-100 border-0 rounded-[10px] p-2 cursor-pointer t-muted"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-[18px]">
          <div>
            <label className="text-[13px] font-semibold text-slate-700 block mb-1.5">Title *</label>
            <input
              value={form.title} onChange={e => set('title', e.target.value)}
              placeholder="e.g. Unit 2 Notes — Database Design"
              required
              className={fieldCls}
            />
          </div>

          <div>
            <label className="text-[13px] font-semibold text-slate-700 block mb-2">Type *</label>
            <div className="flex flex-wrap gap-2">
              {TYPE_OPTIONS.map(t => (
                <button
                  key={t.value} type="button"
                  onClick={() => set('type', t.value)}
                  className="px-3.5 py-[7px] rounded-[10px] border-[1.5px] text-[12px] font-semibold cursor-pointer transition-colors"
                  style={{
                    borderColor: form.type === t.value ? t.color : '#e2e8f0',
                    background: form.type === t.value ? t.color : '#fff',
                    color: form.type === t.value ? '#fff' : '#475569',
                  }}
                >{t.label}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[13px] font-semibold text-slate-700 block mb-1.5">
              Course <span className="font-normal t-muted">(optional)</span>
            </label>
            <select
              value={form.course_id} onChange={e => set('course_id', e.target.value)}
              className={`${fieldCls} bg-white cursor-pointer`}
            >
              <option value="">— Not linked to a course —</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="text-[13px] font-semibold text-slate-700 block mb-1.5">
              Description <span className="font-normal t-muted">(optional)</span>
            </label>
            <textarea
              value={form.description} onChange={e => set('description', e.target.value)}
              placeholder="Brief description of this resource..."
              rows={2}
              className={`${fieldCls} resize-y font-[inherit]`}
            />
          </div>

          <div>
            <label className="text-[13px] font-semibold text-slate-700 block mb-1.5">
              File * <span className="font-normal t-muted">(PDF, DOC, PPT, XLSX — max 10MB)</span>
            </label>
            <input type="file" ref={fileRef} onChange={handleFile} accept=".pdf,.doc,.docx,.ppt,.pptx,.xlsx,.xls,.txt" className="hidden" />

            {form.file_url ? (
              <div className="flex items-center gap-2.5 px-3.5 py-3 rounded-[10px] border-[1.5px] border-green-500 bg-green-50">
                <Check size={16} color="#16a34a" />
                <span className="text-[13px] text-green-700 font-semibold flex-1 overflow-hidden text-ellipsis whitespace-nowrap">{uploadedName}</span>
                <button type="button" onClick={() => { set('file_url', ''); setUploadedName('') }} className="bg-transparent border-0 cursor-pointer t-muted"><X size={14} /></button>
              </div>
            ) : (
              <button
                type="button" onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className={`w-full py-[18px] px-3.5 rounded-[10px] border-2 border-dashed border-slate-200 hover:border-brand flex flex-col items-center gap-2 transition-colors ${uploading ? 'bg-slate-50 cursor-not-allowed' : 'bg-[#fafafa] cursor-pointer'}`}
              >
                {uploading ? (
                  <>
                    <div className="w-[22px] h-[22px] border-2 border-slate-200 border-t-brand rounded-full" style={{ animation: 'spin 0.8s linear infinite' }} />
                    <span className="text-[13px] t-muted">Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload size={22} color="#94a3b8" />
                    <span className="text-[13px] t-muted font-medium">Click to select file</span>
                  </>
                )}
              </button>
            )}
          </div>

          {error && <div className="px-3.5 py-2.5 rounded-[10px] bg-red-50 text-red-600 text-[13px]">{error}</div>}

          <div className="flex gap-2.5 justify-end">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-[10px] border-[1.5px] border-slate-200 bg-white text-[14px] font-semibold cursor-pointer text-slate-600">Cancel</button>
            <button
              type="submit" disabled={saving || uploading || !form.file_url}
              className={`px-6 py-2.5 rounded-[10px] border-0 text-white text-[14px] font-bold ${saving || uploading || !form.file_url ? 'bg-indigo-200 cursor-not-allowed' : 'bg-brand cursor-pointer'}`}
            >
              {saving ? 'Saving...' : 'Upload Resource'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function FacultyResources() {
  const [resources, setResources] = useState([])
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    Promise.all([fetchResources(), fetchCourses()])
  }, [])

  const fetchResources = async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/resources/my')
      if (res.success) setResources(res.data || [])
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }

  const fetchCourses = async () => {
    try {
      const res = await api.get('/api/lms/courses')
      if (res.success) setCourses(res.data || [])
    } catch {}
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this resource? Students will no longer be able to access it.')) return
    setDeletingId(id)
    try {
      await api.delete(`/api/resources/${id}`)
      setResources(prev => prev.filter(r => r.id !== id))
    } catch { alert('Failed to delete resource.') } finally { setDeletingId(null) }
  }

  const handleSaved = (newResource) => {
    setResources(prev => [newResource, ...prev])
    setShowModal(false)
  }

  const filtered = typeFilter === 'all' ? resources : resources.filter(r => r.type === typeFilter)

  const counts = TYPE_OPTIONS.reduce((acc, t) => {
    acc[t.value] = resources.filter(r => r.type === t.value).length
    return acc
  }, {})

  return (
    <PageLayout>
      {showModal && <UploadModal courses={courses} onClose={() => setShowModal(false)} onSaved={handleSaved} />}

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[26px] font-extrabold t-primary m-0">My Resources</h1>
          <p className="text-[14px] t-muted mt-1 mb-0">Upload and manage academic resources for your students.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-[22px] py-[11px] rounded-[12px] border-0 bg-brand text-white text-[14px] font-bold cursor-pointer shrink-0"
        >
          <Plus size={17} /> Upload Resource
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Uploads', value: resources.length },
          { label: 'Notes',         value: counts.note || 0 },
          { label: 'PYQs',          value: counts.pyq || 0 },
          { label: 'Other',         value: (counts.lab || 0) + (counts.syllabus || 0) + (counts.doc || 0) + (counts.paper || 0) },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-[16px] border border-slate-100 px-5 py-[18px] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
            <div className="text-[12px] font-semibold t-muted mb-1.5">{s.label}</div>
            <div className="text-[28px] font-extrabold t-primary">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setTypeFilter('all')} className="px-4 py-2 rounded-[10px] border-[1.5px] text-[12px] font-semibold cursor-pointer transition-colors"
          style={{
            borderColor: typeFilter === 'all' ? '#4f46e5' : '#e2e8f0',
            background: typeFilter === 'all' ? '#4f46e5' : '#fff',
            color: typeFilter === 'all' ? '#fff' : '#475569',
          }}>All ({resources.length})</button>
        {TYPE_OPTIONS.map(t => counts[t.value] > 0 && (
          <button key={t.value} onClick={() => setTypeFilter(t.value)} className="px-4 py-2 rounded-[10px] border-[1.5px] text-[12px] font-semibold cursor-pointer transition-colors"
            style={{
              borderColor: typeFilter === t.value ? t.color : '#e2e8f0',
              background: typeFilter === t.value ? t.color : '#fff',
              color: typeFilter === t.value ? '#fff' : '#475569',
            }}>{t.label} ({counts[t.value]})</button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-[60px] t-muted text-[14px]">Loading your resources...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-[60px]">
          <FileText size={44} className="opacity-20 mx-auto mb-3.5 block" />
          <div className="text-[15px] font-semibold text-slate-600 mb-1.5">No resources yet</div>
          <div className="text-[13px] t-muted mb-5">Upload your first resource to share with students.</div>
          <button onClick={() => setShowModal(true)} className="px-[22px] py-2.5 rounded-[12px] border-0 bg-brand text-white text-[14px] font-bold cursor-pointer">
            Upload Resource
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filtered.map(item => {
            const ti = typeInfo(item.type)
            return (
              <div key={item.id} className="bg-white rounded-[16px] border border-slate-100 px-[22px] py-[18px] flex items-center gap-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                <div className="w-11 h-11 rounded-[12px] flex items-center justify-center shrink-0" style={{ background: ti.bg, color: ti.color }}>
                  <FileText size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-[14px] t-primary mb-[3px] overflow-hidden text-ellipsis whitespace-nowrap">{item.title}</div>
                  <div className="flex gap-2 flex-wrap items-center">
                    <span className="px-[9px] py-[2px] rounded-[6px] text-[11px] font-bold uppercase" style={{ background: ti.bg, color: ti.color }}>{item.type}</span>
                    {item.course && <span className="text-[12px] t-muted">{item.course.code} — {item.course.name}</span>}
                    <span className="text-[12px] text-slate-400">{new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                  {item.description && <div className="text-[12px] t-muted mt-1">{item.description}</div>}
                </div>
                <div className="flex gap-2 shrink-0">
                  <a href={item.file_url} target="_blank" rel="noopener noreferrer"
                    className="px-3.5 py-2 rounded-[10px] border-[1.5px] border-slate-200 bg-slate-50 text-slate-600 text-[13px] font-semibold no-underline flex items-center gap-1.5">
                    <ExternalLink size={14} /> View
                  </a>
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={deletingId === item.id}
                    className={`p-2 rounded-[10px] border border-red-100 bg-white text-red-400 cursor-pointer flex items-center justify-center hover:bg-red-50 transition-colors ${deletingId === item.id ? 'opacity-50' : ''}`}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </PageLayout>
  )
}
