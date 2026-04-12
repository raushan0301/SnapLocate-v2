import React, { useState, useEffect } from 'react'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'
import { Megaphone, Trash2, AlertTriangle, Info, Zap, Plus, X } from 'lucide-react'

const TYPE_CONFIG = {
  info:    { label: 'Info',    bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe', icon: <Info size={16} /> },
  warning: { label: 'Warning', bg: '#fffbeb', color: '#92400e', border: '#fde68a', icon: <AlertTriangle size={16} /> },
  urgent:  { label: 'Urgent',  bg: '#fef2f2', color: '#991b1b', border: '#fecaca', icon: <Zap size={16} /> },
}

function AnnouncementForm({ onCreated }) {
  const [form, setForm] = useState({ title: '', message: '', type: 'info' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim() || !form.message.trim()) {
      setError('Title and message are required.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/api/announcements', form)
      if (res.success) {
        onCreated(res.data)
        setForm({ title: '', message: '', type: 'info' })
      }
    } catch (err) {
      setError(err.message || 'Failed to send announcement.')
    } finally {
      setLoading(false)
    }
  }

  const tc = TYPE_CONFIG[form.type]

  return (
    <div style={{ background: '#fff', borderRadius: 20, padding: 28, border: '1px solid #f1f5f9', boxShadow: '0 4px 24px rgba(0,0,0,0.03)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Megaphone size={20} color="#4f46e5" />
        </div>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: 0 }}>New Announcement</h2>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>Broadcast a message to all campus users</p>
        </div>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', color: '#991b1b', fontSize: 13, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <X size={14} />{error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Type selector */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 8, display: 'block' }}>ANNOUNCEMENT TYPE</label>
          <div style={{ display: 'flex', gap: 10 }}>
            {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
              <button
                key={key} type="button" onClick={() => setForm({ ...form, type: key })}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s',
                  border: `2px solid ${form.type === key ? cfg.color : '#e2e8f0'}`,
                  background: form.type === key ? cfg.bg : '#f8fafc',
                  color: form.type === key ? cfg.color : '#64748b',
                  fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                }}
              >
                {cfg.icon}{cfg.label}
              </button>
            ))}
          </div>
        </div>

        {/* Preview strip */}
        <div style={{ background: tc.bg, border: `1px solid ${tc.border}`, borderRadius: 12, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8, color: tc.color, fontSize: 13, fontWeight: 600 }}>
          {tc.icon}
          <span>This will be shown as a <strong>{tc.label}</strong> announcement to all users.</span>
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6, display: 'block' }}>TITLE</label>
          <input
            required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. Campus WiFi Maintenance on Friday"
            style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #e2e8f0', outline: 'none', fontSize: 14, boxSizing: 'border-box' }}
            onFocus={e => e.target.style.borderColor = '#4f46e5'}
            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
          />
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6, display: 'block' }}>MESSAGE</label>
          <textarea
            required value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
            placeholder="Enter the full announcement text..."
            rows={4}
            style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #e2e8f0', outline: 'none', fontSize: 14, resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
            onFocus={e => e.target.style.borderColor = '#4f46e5'}
            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
          />
        </div>

        <button
          type="submit" disabled={loading}
          style={{ padding: '13px', borderRadius: 12, border: 'none', background: loading ? '#c7d2fe' : '#4f46e5', color: '#fff', fontWeight: 700, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'background 0.2s' }}
        >
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

  const handleCreated = (newItem) => {
    setAnnouncements(prev => [newItem, ...prev])
  }

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
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#0f172a', margin: 0 }}>Broadcast & Announcements</h1>
        <p style={{ fontSize: 14, color: '#64748b', marginTop: 4, marginBottom: 0 }}>Send campus-wide announcements visible to all students and faculty.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
        {/* Create form */}
        <AnnouncementForm onCreated={handleCreated} />

        {/* Announcements list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0 }}>Recent Announcements</h3>
            <span style={{ fontSize: 13, color: '#64748b', background: '#f1f5f9', padding: '4px 12px', borderRadius: 20, fontWeight: 600 }}>
              {announcements.length} total
            </span>
          </div>

          {loading ? (
            <div style={{ background: '#fff', borderRadius: 16, padding: 32, textAlign: 'center', color: '#64748b', border: '1px solid #f1f5f9' }}>Loading...</div>
          ) : announcements.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: 16, padding: 40, textAlign: 'center', border: '1px solid #f1f5f9' }}>
              <Megaphone size={32} color="#cbd5e1" style={{ margin: '0 auto 12px' }} />
              <p style={{ color: '#94a3b8', margin: 0, fontWeight: 500 }}>No announcements yet.<br />Create one using the form.</p>
            </div>
          ) : announcements.map(ann => {
            const tc = TYPE_CONFIG[ann.type] || TYPE_CONFIG.info
            return (
              <div key={ann.id} style={{ background: '#fff', borderRadius: 16, padding: 20, border: `1px solid ${tc.border}`, borderLeft: `4px solid ${tc.color}`, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{ background: tc.bg, color: tc.color, padding: '3px 10px', borderRadius: 50, fontSize: 10, fontWeight: 800, letterSpacing: '0.05em', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        {tc.icon}{tc.label.toUpperCase()}
                      </span>
                      <span style={{ fontSize: 11, color: '#94a3b8' }}>
                        {new Date(ann.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 14, marginBottom: 4 }}>{ann.title}</div>
                    <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.5 }}>{ann.message}</div>
                    {ann.author?.full_name && (
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 8 }}>By {ann.author.full_name}</div>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(ann)}
                    style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4, flexShrink: 0, display: 'flex', alignItems: 'center' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                    onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
                  >
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
