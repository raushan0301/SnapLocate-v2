import React, { useState, useEffect } from 'react'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'
import { Search, Clock, CheckCircle2, XCircle, AlertCircle, ArrowRight, RefreshCw, Trash2 } from 'lucide-react'

const STATUS_FILTERS = ['all', 'pending', 'accepted', 'rejected']

const STATUS_CLS = {
  pending:  { cls: 'bg-amber-50 text-amber-800 border border-amber-200',   label: 'PENDING' },
  accepted: { cls: 'bg-green-50 text-emerald-800 border border-green-200', label: 'ACCEPTED' },
  rejected: { cls: 'bg-red-50 text-red-800 border border-red-200',         label: 'REJECTED' },
}
const defaultStatus = { cls: 'bg-slate-50 text-slate-600 border border-slate-200', label: '' }

const TYPE_CLS = {
  'office hour':    'bg-indigo-50 text-brand',
  'attendance':     'bg-purple-50 text-purple-700',
  'grade review':   'bg-orange-50 text-orange-700',
  'extension':      'bg-green-50 text-green-700',
  'research query': 'bg-teal-50 text-teal-700',
}

const STAT_ITEMS = [
  { key: 'total',    label: 'Total Requests', icon: <ArrowRight size={20} />, iconCls: 'bg-indigo-50 text-brand' },
  { key: 'pending',  label: 'Pending',         icon: <Clock size={20} />,        iconCls: 'bg-amber-50 text-amber-600' },
  { key: 'accepted', label: 'Accepted',        icon: <CheckCircle2 size={20} />, iconCls: 'bg-green-50 text-emerald-600' },
  { key: 'rejected', label: 'Rejected',        icon: <XCircle size={20} />,      iconCls: 'bg-red-50 text-red-500' },
]

export default function ManageRequests() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/admin/requests')
      if (res.success) setData(res.data || [])
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this request?')) return
    try {
      const res = await api.delete(`/api/admin/requests/${id}`)
      if (res.success) setData(prev => prev.filter(req => req.id !== id))
    } catch (err) { console.error(err); alert('Failed to delete request') }
  }

  const filtered = data.filter(d => {
    const matchStatus = statusFilter === 'all' || d.status === statusFilter
    const studentName = d.student?.full_name || ''
    const facultyName = d.faculty_profile?.users?.full_name || ''
    const matchSearch = !search ||
      studentName.toLowerCase().includes(search.toLowerCase()) ||
      facultyName.toLowerCase().includes(search.toLowerCase()) ||
      d.type?.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  const stats = {
    total: data.length,
    pending:  data.filter(d => d.status === 'pending').length,
    accepted: data.filter(d => d.status === 'accepted').length,
    rejected: data.filter(d => d.status === 'rejected').length,
  }

  return (
    <PageLayout>
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-[26px] font-bold t-primary m-0">Requests Overview</h1>
          <p className="text-[14px] t-muted mt-1 mb-0">Monitor all student-to-faculty requests across the campus. Read-only view.</p>
        </div>
        <button onClick={fetchData} className="flex items-center gap-1.5 px-4 py-[9px] rounded-[10px] border-[1.5px] border-slate-200 bg-white text-slate-600 text-[13px] font-semibold cursor-pointer hover:bg-slate-50 transition-colors">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_ITEMS.map(s => (
          <div key={s.key} className="bg-white py-5 px-5 rounded-[20px] border border-slate-100 shadow-[0_4px_12px_rgba(0,0,0,0.02)] flex items-center gap-4">
            <div className={`w-11 h-11 rounded-[12px] flex items-center justify-center shrink-0 ${s.iconCls}`}>{s.icon}</div>
            <div>
              <div className="text-[12px] font-semibold t-muted mb-0.5">{s.label}</div>
              <div className="text-[22px] font-extrabold t-primary">{stats[s.key]}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[20px] p-6 border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.03)]">
        <div className="flex gap-3 mb-5 flex-wrap items-center justify-between">
          <div className="relative w-[300px] shrink-0">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search by student, faculty, or type..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full py-[10px] pl-[34px] pr-4 rounded-[10px] border-[1.5px] border-slate-200 text-[14px] outline-none box-border focus:border-brand transition-colors" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="py-[10px] pl-4 pr-9 rounded-[10px] border-[1.5px] border-slate-200 text-[14px] font-medium t-primary bg-white outline-none cursor-pointer focus:border-brand transition-colors">
            {STATUS_FILTERS.map(s => (
              <option value={s} key={s}>{s === 'all' ? 'All Status' : s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {['Student', 'Faculty', 'Type', 'Status', 'Conversation', 'Date', ''].map((h, i) => (
                  <th key={i} className="px-4 py-3.5 text-left text-[12px] font-semibold text-slate-500 uppercase tracking-[0.5px] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="py-10 text-center t-muted">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="py-10 text-center t-muted">No requests found.</td></tr>
              ) : filtered.map(req => {
                const st = STATUS_CLS[req.status] || { ...defaultStatus, label: req.status?.toUpperCase() }
                const typeCls = TYPE_CLS[req.type?.toLowerCase()] || 'bg-slate-100 text-slate-600'
                return (
                  <tr key={req.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-4">
                      <div className="font-semibold t-primary text-[14px]">{req.student?.full_name || '—'}</div>
                      <div className="text-[12px] t-muted">{req.student?.email || ''}</div>
                    </td>
                    <td className="px-4 py-4 text-[14px] text-slate-700 font-medium">{req.faculty_profile?.users?.full_name || '—'}</td>
                    <td className="px-4 py-4">
                      <span className={`px-3 py-1 rounded-[8px] text-[11px] font-bold capitalize ${typeCls}`}>{req.type || '—'}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold tracking-[0.05em] ${st.cls}`}>{st.label}</span>
                    </td>
                    <td className="px-4 py-4 text-[13px] text-slate-700 max-w-[320px] leading-relaxed break-words whitespace-normal">
                      {req.detail && (
                        <div className={req.notes ? 'mb-2' : ''}>
                          <span className="font-semibold text-slate-600">Student:</span> {req.detail}
                        </div>
                      )}
                      {req.notes && (
                        <div className="px-3 py-2 bg-slate-100 rounded-[8px] border-l-[3px] border-slate-300">
                          <span className="font-semibold text-slate-600">Faculty:</span> {req.notes}
                        </div>
                      )}
                      {!req.detail && !req.notes && <span className="t-muted">—</span>}
                    </td>
                    <td className="px-4 py-4 text-[13px] t-muted">{new Date(req.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    <td className="px-4 py-4 text-right">
                      <button onClick={() => handleDelete(req.id)} title="Delete Request"
                        className="text-slate-400 bg-transparent border-0 cursor-pointer p-2 rounded-[8px] flex items-center justify-center hover:text-red-500 hover:bg-red-50 transition-colors">
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
