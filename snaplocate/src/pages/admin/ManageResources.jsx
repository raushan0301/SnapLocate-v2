import React, { useState, useEffect } from 'react'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'
import { Trash2, Search, FileText, BookOpen, FlaskConical, FileQuestion, ExternalLink } from 'lucide-react'

const TYPE_FILTERS = ['all', 'notes', 'pyq', 'lab', 'syllabus', 'paper']

const typeStyle = (t) => {
  const map = {
    notes:    { bg: '#eef2ff', color: '#4f46e5', icon: <FileText size={14} /> },
    pyq:      { bg: '#fdf4ff', color: '#7e22ce', icon: <FileQuestion size={14} /> },
    lab:      { bg: '#ecfdf5', color: '#047857', icon: <FlaskConical size={14} /> },
    syllabus: { bg: '#f0f9ff', color: '#0369a1', icon: <BookOpen size={14} /> },
    paper:    { bg: '#fff7ed', color: '#c2410c', icon: <FileText size={14} /> },
  }
  return map[t?.toLowerCase()] || { bg: '#f8fafc', color: '#64748b', icon: <FileText size={14} /> }
}

export default function ManageResources() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/admin/resources')
      if (res.success) setData(res.data || [])
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }

  const handleDelete = async (item) => {
    if (!window.confirm(`Remove "${item.title}"? This resource will be permanently deleted.`)) return
    try {
      await api.delete(`/api/admin/resources/${item.id}`)
      setData(prev => prev.filter(d => d.id !== item.id))
    } catch { alert('Failed to remove resource.') }
  }

  const filtered = data.filter(d => {
    const matchType = typeFilter === 'all' || d.type?.toLowerCase() === typeFilter
    const matchSearch = !search || d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.uploader?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      d.course?.code?.toLowerCase().includes(search.toLowerCase())
    return matchType && matchSearch
  })

  const counts = TYPE_FILTERS.slice(1).reduce((acc, t) => {
    acc[t] = data.filter(d => d.type?.toLowerCase() === t).length
    return acc
  }, {})

  return (
    <PageLayout>
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#0f172a', margin: 0 }}>Resources Moderation</h1>
        <p style={{ fontSize: 14, color: '#64748b', marginTop: 4, marginBottom: 0 }}>Review and remove inappropriate or outdated academic resources uploaded by faculty.</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
        {[
          { label: 'Total Resources', value: data.length, icon: <FileText size={20} />, color: '#4f46e5', bg: '#eef2ff' },
          { label: 'Notes & PYQs', value: (counts.notes || 0) + (counts.pyq || 0), icon: <BookOpen size={20} />, color: '#7e22ce', bg: '#fdf4ff' },
          { label: 'Labs & Syllabi', value: (counts.lab || 0) + (counts.syllabus || 0), icon: <FlaskConical size={20} />, color: '#10b981', bg: '#ecfdf5' },
        ].map((s, idx) => (
          <div key={idx} style={{ background: '#fff', padding: '24px', borderRadius: 20, border: '1px solid #f1f5f9', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: s.bg, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a' }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div style={{ background: '#fff', borderRadius: 20, padding: 24, border: '1px solid #f1f5f9', boxShadow: '0 4px 24px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text" placeholder="Search by title, course, or uploader..." value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '10px 16px 10px 36px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              onFocus={e => e.target.style.borderColor = '#4f46e5'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {TYPE_FILTERS.map(t => (
              <button key={t} onClick={() => setTypeFilter(t)} style={{
                padding: '8px 14px', borderRadius: 10, border: '1.5px solid',
                borderColor: typeFilter === t ? '#4f46e5' : '#e2e8f0',
                background: typeFilter === t ? '#4f46e5' : '#fff',
                color: typeFilter === t ? '#fff' : '#475569',
                fontSize: 12, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize'
              }}>{t === 'all' ? 'All' : t.toUpperCase()}</button>
            ))}
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ minWidth: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {['Resource', 'Type', 'Course', 'Uploaded By', 'Date', 'Action'].map(h => (
                  <th key={h} style={{ padding: '14px 16px', textAlign: h === 'Action' ? 'right' : 'left', fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ padding: '40px 0', textAlign: 'center', color: '#64748b' }}>Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '40px 0', textAlign: 'center', color: '#64748b' }}>No resources found.</td></tr>
              ) : filtered.map(item => {
                const ts = typeStyle(item.type)
                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 14 }}>{item.title}</div>
                        {item.file_url && (
                          <a href={item.file_url} target="_blank" rel="noopener noreferrer" style={{ color: '#4f46e5', display: 'flex', alignItems: 'center' }}>
                            <ExternalLink size={13} />
                          </a>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ background: ts.bg, color: ts.color, padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4, textTransform: 'uppercase' }}>
                        {ts.icon}{item.type || '—'}
                      </span>
                    </td>
                    <td style={{ padding: '16px', fontSize: 13, color: '#475569' }}>
                      {item.course ? `${item.course.code} — ${item.course.name}` : '—'}
                    </td>
                    <td style={{ padding: '16px', fontSize: 13, color: '#475569' }}>{item.uploader?.full_name || '—'}</td>
                    <td style={{ padding: '16px', fontSize: 13, color: '#64748b' }}>{new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <button onClick={() => handleDelete(item)} title="Remove resource" style={{ background: '#f8fafc', border: '1px solid #fee2e2', color: '#ef4444', padding: '8px', borderRadius: '10px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.borderColor = '#ef4444' }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#fee2e2' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </PageLayout>
  )
}
