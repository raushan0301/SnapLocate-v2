import React, { useState, useEffect } from 'react'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'
import { Megaphone, Trash2, AlertTriangle, Info, Zap, X } from 'lucide-react'

const TYPE_CONFIG = {
  info:    { label: 'Info',    icon: <Info size={16} />,          chipCls: 'bg-blue-50 text-blue-700',   borderCls: 'border-blue-200',  leftBorderCls: 'border-l-blue-600',  previewCls: 'bg-blue-50 border border-blue-200 text-blue-700',   btnActiveCls: 'border-blue-600 bg-blue-50 text-blue-700' },
  warning: { label: 'Warning', icon: <AlertTriangle size={16} />, chipCls: 'bg-amber-50 text-amber-800', borderCls: 'border-amber-200', leftBorderCls: 'border-l-amber-600', previewCls: 'bg-amber-50 border border-amber-200 text-amber-800', btnActiveCls: 'border-amber-600 bg-amber-50 text-amber-800' },
  urgent:  { label: 'Urgent',  icon: <Zap size={16} />,          chipCls: 'bg-red-50 text-red-800',     borderCls: 'border-red-200',   leftBorderCls: 'border-l-red-600',   previewCls: 'bg-red-50 border border-red-200 text-red-800',     btnActiveCls: 'border-red-600 bg-red-50 text-red-800' },
}

const fieldCls = 'w-full px-4 py-3 rounded-[12px] border-[1.5px] border-slate-200 text-[14px] outline-none box-border bg-white focus:border-brand transition-colors'

function AnnouncementForm({ onCreated }) {
  const [form, setForm] = useState({ title: '', message: '', type: 'info' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim() || !form.message.trim()) { setError('Title and message are required.'); return }
    setLoading(true); setError('')
    try {
      const res = await api.post('/api/announcements', form)
      if (res.success) { onCreated(res.data); setForm({ title: '', message: '', type: 'info' }) }
    } catch (err) { setError(err.message || 'Failed to send announcement.') }
    finally { setLoading(false) }
  }

  const tc = TYPE_CONFIG[form.type]

  return (
    <div className="bg-white rounded-[20px] p-7 border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.03)]">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-[12px] bg-indigo-50 flex items-center justify-center">
          <Megaphone size={20} color="#4f46e5" />
        </div>
        <div>
          <h2 className="text-[18px] font-extrabold t-primary m-0">New Announcement</h2>
          <p className="text-[13px] t-muted m-0">Broadcast a message to all campus users</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-[10px] px-3.5 py-2.5 text-red-800 text-[13px] mb-4 flex items-center gap-2">
          <X size={14} />{error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="text-[12px] font-bold text-slate-500 uppercase tracking-[0.05em] mb-2 block">Announcement Type</label>
          <div className="flex gap-2.5">
            {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
              <button key={key} type="button" onClick={() => setForm({ ...form, type: key })}
                className={`flex-1 py-[10px] rounded-[12px] border-2 font-bold text-[13px] flex items-center justify-center gap-1.5 cursor-pointer transition-all ${form.type === key ? cfg.btnActiveCls : 'border-slate-200 bg-slate-50 text-slate-500'}`}>
                {cfg.icon}{cfg.label}
              </button>
            ))}
          </div>
        </div>

        <div className={`rounded-[12px] px-4 py-2.5 flex items-center gap-2 text-[13px] font-semibold ${tc.previewCls}`}>
          {tc.icon}
          <span>This will be shown as a <strong>{tc.label}</strong> announcement to all users.</span>
        </div>

        <div>
          <label className="text-[12px] font-bold text-slate-500 uppercase tracking-[0.05em] mb-1.5 block">Title</label>
          <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. Campus WiFi Maintenance on Friday" className={fieldCls} />
        </div>

        <div>
          <label className="text-[12px] font-bold text-slate-500 uppercase tracking-[0.05em] mb-1.5 block">Message</label>
          <textarea required value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
            placeholder="Enter the full announcement text..." rows={4}
            className={`${fieldCls} resize-y font-[inherit]`} />
        </div>

        <button type="submit" disabled={loading}
          className={`py-[13px] rounded-[12px] border-none text-white font-bold text-[15px] flex items-center justify-center gap-2 transition-colors ${loading ? 'bg-indigo-200 cursor-not-allowed' : 'bg-brand cursor-pointer'}`}>
          {loading ? 'Publishing...' : <><Megaphone size={18} /> Publish Announcement</>}
        </button>
      </form>
    </div>
  )
}

export default function Broadcast() {
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchAnnouncements() }, [])

  const fetchAnnouncements = async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/announcements')
      if (res.success) setAnnouncements(res.data || [])
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }

  const handleCreated = (newItem) => setAnnouncements(prev => [newItem, ...prev])

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete "${item.title}"?`)) return
    try {
      await api.delete(`/api/announcements/${item.id}`)
      setAnnouncements(prev => prev.filter(a => a.id !== item.id))
    } catch { alert('Failed to delete announcement.') }
  }

  return (
    <PageLayout>
      <div>
        <h1 className="text-[26px] font-bold t-primary m-0">Broadcast & Announcements</h1>
        <p className="text-[14px] t-muted mt-1 mb-0">Send campus-wide announcements visible to all students and faculty.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <AnnouncementForm onCreated={handleCreated} />

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[16px] font-bold t-primary m-0">Recent Announcements</h3>
            <span className="text-[13px] t-muted bg-slate-100 px-3 py-1 rounded-[20px] font-semibold">
              {announcements.length} total
            </span>
          </div>

          {loading ? (
            <div className="bg-white rounded-[16px] p-8 text-center t-muted border border-slate-100">Loading...</div>
          ) : announcements.length === 0 ? (
            <div className="bg-white rounded-[16px] p-10 text-center border border-slate-100">
              <Megaphone size={32} className="text-slate-300 mx-auto mb-3 block" />
              <p className="text-slate-400 m-0 font-medium">No announcements yet.<br />Create one using the form.</p>
            </div>
          ) : announcements.map(ann => {
            const tc = TYPE_CONFIG[ann.type] || TYPE_CONFIG.info
            return (
              <div key={ann.id}
                className={`bg-white rounded-[16px] p-5 border border-l-[4px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] ${tc.borderCls} ${tc.leftBorderCls}`}>
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-[3px] rounded-full text-[10px] font-extrabold tracking-[0.05em] ${tc.chipCls}`}>
                        {tc.icon}{tc.label.toUpperCase()}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(ann.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="font-bold t-primary text-[14px] mb-1">{ann.title}</div>
                    <div className="text-[13px] text-slate-500 leading-relaxed">{ann.message}</div>
                    {ann.author?.full_name && (
                      <div className="text-[11px] text-slate-400 mt-2">By {ann.author.full_name}</div>
                    )}
                  </div>
                  <button onClick={() => handleDelete(ann)}
                    className="text-slate-400 bg-transparent border-0 cursor-pointer p-1 shrink-0 flex items-center hover:text-red-500 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </PageLayout>
  )
}
