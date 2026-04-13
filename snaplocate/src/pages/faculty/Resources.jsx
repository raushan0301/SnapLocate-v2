import { useState, useEffect, useRef } from 'react'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'
import { Plus, Trash2, Upload, FileText, BookOpen, FlaskConical, FileQuestion, ExternalLink, X, Check } from 'lucide-react'

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
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: 32, width: '100%', maxWidth: 520, boxShadow: '0 20px 60px rgba(0,0,0,0.15)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0 }}>Upload Resource</h2>
            <p style={{ fontSize: 13, color: '#64748b', marginTop: 4, marginBottom: 0 }}>Share notes, PYQs, lab files with your students.</p>
          </div>
          <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', borderRadius: 10, padding: 8, cursor: 'pointer', color: '#64748b' }}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Title */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Title *</label>
            <input
              value={form.title} onChange={e => set('title', e.target.value)}
              placeholder="e.g. Unit 2 Notes — Database Design"
              required
              style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              onFocus={e => e.target.style.borderColor = '#4f46e5'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>

          {/* Type */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 8 }}>Type *</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {TYPE_OPTIONS.map(t => (
                <button
                  key={t.value} type="button"
                  onClick={() => set('type', t.value)}
                  style={{
                    padding: '7px 14px', borderRadius: 10, border: '1.5px solid',
                    borderColor: form.type === t.value ? t.color : '#e2e8f0',
                    background: form.type === t.value ? t.color : '#fff',
                    color: form.type === t.value ? '#fff' : '#475569',
                    fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  }}
                >{t.label}</button>
              ))}
            </div>
          </div>

          {/* Course */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Course <span style={{ fontWeight: 400, color: '#94a3b8' }}>(optional)</span></label>
            <select
              value={form.course_id} onChange={e => set('course_id', e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none', background: '#fff', cursor: 'pointer' }}
            >
              <option value="">— Not linked to a course —</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
            </select>
          </div>

          {/* Description */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Description <span style={{ fontWeight: 400, color: '#94a3b8' }}>(optional)</span></label>
            <textarea
              value={form.description} onChange={e => set('description', e.target.value)}
              placeholder="Brief description of this resource..."
              rows={2}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
              onFocus={e => e.target.style.borderColor = '#4f46e5'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>

          {/* File Upload */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>File * <span style={{ fontWeight: 400, color: '#94a3b8' }}>(PDF, DOC, PPT, XLSX — max 10MB)</span></label>
            <input type="file" ref={fileRef} onChange={handleFile} accept=".pdf,.doc,.docx,.ppt,.pptx,.xlsx,.xls,.txt" style={{ display: 'none' }} />

            {form.file_url ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 10, border: '1.5px solid #22c55e', background: '#f0fdf4' }}>
                <Check size={16} color="#16a34a" />
                <span style={{ fontSize: 13, color: '#15803d', fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{uploadedName}</span>
                <button type="button" onClick={() => { set('file_url', ''); setUploadedName('') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={14} /></button>
              </div>
            ) : (
              <button
                type="button" onClick={() => fileRef.current?.click()}
                disabled={uploading}
                style={{ width: '100%', padding: '18px 14px', borderRadius: 10, border: '2px dashed #e2e8f0', background: uploading ? '#f8fafc' : '#fafafa', cursor: uploading ? 'not-allowed' : 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}
                onMouseEnter={e => { if (!uploading) e.currentTarget.style.borderColor = '#4f46e5' }}
                onMouseLeave={e => { if (!uploading) e.currentTarget.style.borderColor = '#e2e8f0' }}
              >
                {uploading ? (
                  <>
                    <div style={{ width: 22, height: 22, border: '2px solid #e2e8f0', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    <span style={{ fontSize: 13, color: '#64748b' }}>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload size={22} color="#94a3b8" />
                    <span style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>Click to select file</span>
                  </>
                )}
              </button>
            )}
          </div>

          {error && <div style={{ padding: '10px 14px', borderRadius: 10, background: '#fef2f2', color: '#dc2626', fontSize: 13 }}>{error}</div>}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 20px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', color: '#475569' }}>Cancel</button>
            <button
              type="submit" disabled={saving || uploading || !form.file_url}
              style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: saving || uploading || !form.file_url ? '#c7d2fe' : '#4f46e5', color: '#fff', fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}
            >
              {saving ? 'Saving...' : 'Upload Resource'}
            </button>
          </div>
        </form>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
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

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', margin: 0 }}>My Resources</h1>
          <p style={{ fontSize: 14, color: '#64748b', marginTop: 4, marginBottom: 0 }}>Upload and manage academic resources for your students.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 22px', borderRadius: 12, border: 'none', background: '#4f46e5', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}
        >
          <Plus size={17} /> Upload Resource
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {[
          { label: 'Total Uploads', value: resources.length, color: '#4f46e5', bg: '#eef2ff' },
          { label: 'Notes',         value: counts.note || 0, color: '#4f46e5', bg: '#eef2ff' },
          { label: 'PYQs',          value: counts.pyq || 0,  color: '#7e22ce', bg: '#fdf4ff' },
          { label: 'Other',         value: (counts.lab || 0) + (counts.syllabus || 0) + (counts.doc || 0) + (counts.paper || 0), color: '#047857', bg: '#ecfdf5' },
        ].map((s, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 16, border: '1px solid #f1f5f9', padding: '18px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={() => setTypeFilter('all')} style={{
          padding: '8px 16px', borderRadius: 10, border: '1.5px solid',
          borderColor: typeFilter === 'all' ? '#4f46e5' : '#e2e8f0',
          background: typeFilter === 'all' ? '#4f46e5' : '#fff',
          color: typeFilter === 'all' ? '#fff' : '#475569',
          fontSize: 12, fontWeight: 600, cursor: 'pointer',
        }}>All ({resources.length})</button>
        {TYPE_OPTIONS.map(t => counts[t.value] > 0 && (
          <button key={t.value} onClick={() => setTypeFilter(t.value)} style={{
            padding: '8px 16px', borderRadius: 10, border: '1.5px solid',
            borderColor: typeFilter === t.value ? t.color : '#e2e8f0',
            background: typeFilter === t.value ? t.color : '#fff',
            color: typeFilter === t.value ? '#fff' : '#475569',
            fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}>{t.label} ({counts[t.value]})</button>
        ))}
      </div>

      {/* Resource List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8', fontSize: 14 }}>Loading your resources...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
          <FileText size={44} style={{ opacity: 0.2, marginBottom: 14, display: 'block', margin: '0 auto 14px' }} />
          <div style={{ fontSize: 15, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>No resources yet</div>
          <div style={{ fontSize: 13, marginBottom: 20 }}>Upload your first resource to share with students.</div>
          <button onClick={() => setShowModal(true)} style={{ padding: '10px 22px', borderRadius: 12, border: 'none', background: '#4f46e5', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            Upload Resource
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(item => {
            const ti = typeInfo(item.type)
            return (
              <div key={item.id} style={{ background: '#fff', borderRadius: 16, border: '1px solid #f1f5f9', padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: ti.bg, color: ti.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <FileText size={18} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ background: ti.bg, color: ti.color, padding: '2px 9px', borderRadius: 6, fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>{item.type}</span>
                    {item.course && <span style={{ fontSize: 12, color: '#64748b' }}>{item.course.code} — {item.course.name}</span>}
                    <span style={{ fontSize: 12, color: '#94a3b8' }}>{new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                  {item.description && <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{item.description}</div>}
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <a href={item.file_url} target="_blank" rel="noopener noreferrer"
                    style={{ padding: '8px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#f8fafc', color: '#475569', fontSize: 13, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ExternalLink size={14} /> View
                  </a>
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={deletingId === item.id}
                    style={{ padding: '8px', borderRadius: 10, border: '1px solid #fee2e2', background: '#fff', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: deletingId === item.id ? 0.5 : 1 }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                    onMouseLeave={e => e.currentTarget.style.background = '#fff'}
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
