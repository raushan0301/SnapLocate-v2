import React, { useState, useEffect } from 'react'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'
import { Trash2, Search, FileText, BookOpen, FlaskConical, FileQuestion, ExternalLink } from 'lucide-react'

const TYPE_FILTERS = ['all', 'notes', 'pyq', 'lab', 'syllabus', 'paper']

const TYPE_BADGE = {
  notes:    { cls: 'bg-indigo-50 text-brand',        icon: <FileText size={14} /> },
  pyq:      { cls: 'bg-purple-50 text-purple-800',   icon: <FileQuestion size={14} /> },
  lab:      { cls: 'bg-emerald-50 text-emerald-800', icon: <FlaskConical size={14} /> },
  syllabus: { cls: 'bg-sky-50 text-sky-800',         icon: <BookOpen size={14} /> },
  paper:    { cls: 'bg-orange-50 text-orange-800',   icon: <FileText size={14} /> },
}
const defaultBadge = { cls: 'bg-slate-50 text-slate-500', icon: <FileText size={14} /> }

const STAT_ITEMS = [
  { label: 'Total Resources', iconCls: 'bg-indigo-50 text-brand',         icon: <FileText size={20} /> },
  { label: 'Notes & PYQs',   iconCls: 'bg-purple-50 text-purple-700',    icon: <BookOpen size={20} /> },
  { label: 'Labs & Syllabi', iconCls: 'bg-emerald-50 text-emerald-700',  icon: <FlaskConical size={20} /> },
]

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

  const statValues = [
    data.length,
    (counts.notes || 0) + (counts.pyq || 0),
    (counts.lab || 0) + (counts.syllabus || 0),
  ]

  return (
    <PageLayout>
      <div>
        <h1 className="text-[26px] font-bold t-primary m-0">Resources Moderation</h1>
        <p className="text-[14px] t-muted mt-1 mb-0">Review and remove inappropriate or outdated academic resources uploaded by faculty.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {STAT_ITEMS.map((s, i) => (
          <div key={i} className="bg-white px-6 py-6 rounded-[20px] border border-slate-100 shadow-[0_4px_12px_rgba(0,0,0,0.02)] flex items-center gap-5">
            <div className={`w-12 h-12 rounded-[14px] flex items-center justify-center shrink-0 ${s.iconCls}`}>{s.icon}</div>
            <div>
              <div className="text-[13px] font-semibold t-muted mb-1">{s.label}</div>
              <div className="text-[24px] font-extrabold t-primary">{statValues[i]}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[20px] p-6 border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.03)]">
        <div className="flex gap-3 mb-5 flex-wrap items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search by title, course, or uploader..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full py-[10px] pl-9 pr-4 rounded-[10px] border-[1.5px] border-slate-200 text-[14px] outline-none box-border focus:border-brand transition-colors" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {TYPE_FILTERS.map(t => (
              <button key={t} onClick={() => setTypeFilter(t)}
                className={`px-3.5 py-2 rounded-[10px] border-[1.5px] text-[12px] font-semibold cursor-pointer capitalize transition-colors ${typeFilter === t ? 'border-brand bg-brand text-white' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'}`}>
                {t === 'all' ? 'All' : t.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {['Resource', 'Type', 'Course', 'Uploaded By', 'Date', 'Action'].map((h, i) => (
                  <th key={h} className={`px-4 py-3.5 text-[12px] font-semibold text-slate-500 uppercase tracking-[0.5px] whitespace-nowrap ${i === 5 ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="py-10 text-center t-muted">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="py-10 text-center t-muted">No resources found.</td></tr>
              ) : filtered.map(item => {
                const badge = TYPE_BADGE[item.type?.toLowerCase()] || defaultBadge
                return (
                  <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="font-semibold t-primary text-[14px]">{item.title}</div>
                        {item.file_url && (
                          <a href={item.file_url} target="_blank" rel="noopener noreferrer" className="text-brand flex items-center">
                            <ExternalLink size={13} />
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-[8px] text-[11px] font-bold uppercase ${badge.cls}`}>
                        {badge.icon}{item.type || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-[13px] text-slate-500">
                      {item.course ? `${item.course.code} — ${item.course.name}` : '—'}
                    </td>
                    <td className="px-4 py-4 text-[13px] text-slate-500">{item.uploader?.full_name || '—'}</td>
                    <td className="px-4 py-4 text-[13px] t-muted">{new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    <td className="px-4 py-4 text-right">
                      <button onClick={() => handleDelete(item)} title="Remove resource"
                        className="inline-flex items-center justify-center p-2 rounded-[10px] border border-red-100 bg-slate-50 text-red-400 cursor-pointer hover:bg-red-50 hover:border-red-400 transition-colors">
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
