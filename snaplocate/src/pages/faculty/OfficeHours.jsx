import { useState, useEffect, useCallback } from 'react'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'
import { Clock, Plus, Trash2, Save, Monitor, MapPin, CheckCircle } from 'lucide-react'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const SLOT_OPTIONS = [
  '08:00 - 09:00', '09:00 - 10:00', '10:00 - 11:00', '11:00 - 12:00',
  '12:00 - 13:00', '13:00 - 14:00', '14:00 - 15:00', '15:00 - 16:00',
  '16:00 - 17:00', '17:00 - 18:00',
]

const EMPTY_SLOT = { day: 'Monday', slot: '10:00 - 11:00', mode: 'in-person', room_or_link: '' }

const modeStyle = {
  'in-person': { bg: '#ecfdf5', color: '#059669', border: '#a7f3d0', icon: <MapPin size={13} /> },
  'online':    { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe', icon: <Monitor size={13} /> },
}

function Toast({ msg, type }) {
  if (!msg) return null
  return (
    <div style={{
      position: 'fixed', bottom: 32, right: 32, zIndex: 9999,
      padding: '14px 22px', borderRadius: 14,
      background: type === 'success' ? '#16a34a' : '#ef4444',
      color: '#fff', boxShadow: '0 8px 32px rgba(0,0,0,.18)',
      fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, fontWeight: 600,
      display: 'flex', alignItems: 'center', gap: 8,
    }}>
      {type === 'success' ? <CheckCircle size={16} /> : '✕'} {msg}
    </div>
  )
}

export default function OfficeHours() {
  const [slots, setSlots]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [toast, setToast]         = useState({ msg: '', type: 'success' })
  const [addForm, setAddForm]     = useState(EMPTY_SLOT)
  const [showAdd, setShowAdd]     = useState(false)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast({ msg: '', type: 'success' }), 3000)
  }

  const fetchHours = useCallback(async () => {
    try {
      const res = await api.get('/api/faculty/me/profile')
      if (res.success && res.data) {
        setSlots(res.data.office_hours || [])
      }
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchHours() }, [fetchHours])

  const saveAll = async (nextSlots) => {
    setSaving(true)
    try {
      await api.put('/api/faculty/me/office-hours', { hours: nextSlots })
      setSlots(nextSlots)
      showToast('Office hours saved')
    } catch {
      showToast('Failed to save', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleAdd = (e) => {
    e.preventDefault()
    if (!addForm.room_or_link.trim()) return showToast('Enter a room or meeting link', 'error')
    const next = [...slots, { ...addForm }]
    setShowAdd(false)
    setAddForm(EMPTY_SLOT)
    saveAll(next)
  }

  const handleDelete = (idx) => {
    const next = slots.filter((_, i) => i !== idx)
    saveAll(next)
  }

  // Group by day for display
  const grouped = DAYS.reduce((acc, day) => {
    acc[day] = slots.filter(s => s.day === day)
    return acc
  }, {})

  const totalSlots = slots.length

  return (
    <PageLayout>
      <Toast msg={toast.msg} type={toast.type} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={22} color="#059669" />
          </div>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: '#0f172a', margin: 0 }}>Office Hours</h1>
            <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>
              Set when students can reach you — {totalSlots} slot{totalSlots !== 1 ? 's' : ''} active
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 12, background: '#4f46e5', color: '#fff', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          <Plus size={16} /> Add Slot
        </button>
      </div>

      {/* Info banner */}
      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 14, padding: '14px 20px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <Monitor size={16} color="#2563eb" style={{ marginTop: 2, flexShrink: 0 }} />
        <p style={{ margin: 0, fontSize: 13, color: '#1e40af', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          These slots are visible to students on your professor profile page. Students will see your availability and can send you a meeting request.
        </p>
      </div>

      {/* Loading */}
      {loading ? (
        <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8', fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14 }}>
          Loading your schedule...
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {DAYS.map(day => (
            <div key={day} style={{ background: '#fff', borderRadius: 20, padding: 20, border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, fontWeight: 800, color: '#0f172a' }}>{day}</span>
                {grouped[day].length > 0 && (
                  <span style={{ background: '#eef2ff', color: '#4f46e5', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6 }}>
                    {grouped[day].length} slot{grouped[day].length > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {grouped[day].length === 0 ? (
                <div style={{ padding: '16px 0', textAlign: 'center', color: '#cbd5e1', fontFamily: "'Inter', sans-serif", fontSize: 13 }}>
                  No availability set
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {grouped[day].map((s, i) => {
                    const globalIdx = slots.findIndex(x => x === s)
                    const ms = modeStyle[s.mode] || modeStyle['in-person']
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#f8fafc', borderRadius: 12, border: '1px solid #f1f5f9' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{s.slot}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: ms.bg, color: ms.color, border: `1px solid ${ms.border}`, padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                              {ms.icon} {s.mode}
                            </span>
                            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>
                              {s.room_or_link}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDelete(globalIdx)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fca5a5', padding: 4, borderRadius: 8, display: 'flex', alignItems: 'center' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                          onMouseLeave={e => e.currentTarget.style.background = 'none'}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Slot Modal */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 24, width: '100%', maxWidth: 440, padding: 32, position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.12)' }}>
            <button onClick={() => setShowAdd(false)} style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: '#94a3b8' }}>×</button>

            <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 20, fontWeight: 700, color: '#0f172a', margin: '0 0 24px' }}>Add Office Hour Slot</h2>

            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6, display: 'block' }}>DAY</label>
                  <select
                    value={addForm.day} onChange={e => setAddForm(f => ({ ...f, day: e.target.value }))}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none', background: '#fff', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6, display: 'block' }}>TIME SLOT</label>
                  <select
                    value={addForm.slot} onChange={e => setAddForm(f => ({ ...f, slot: e.target.value }))}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none', background: '#fff', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    {SLOT_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 8, display: 'block' }}>MODE</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  {['in-person', 'online'].map(m => (
                    <button
                      key={m} type="button"
                      onClick={() => setAddForm(f => ({ ...f, mode: m }))}
                      style={{
                        flex: 1, padding: '10px', borderRadius: 10, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 700,
                        border: addForm.mode === m ? '2px solid #4f46e5' : '1.5px solid #e2e8f0',
                        background: addForm.mode === m ? '#eef2ff' : '#fff',
                        color: addForm.mode === m ? '#4f46e5' : '#64748b',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      }}
                    >
                      {m === 'in-person' ? <MapPin size={14} /> : <Monitor size={14} />}
                      {m === 'in-person' ? 'In-Person' : 'Online'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6, display: 'block' }}>
                  {addForm.mode === 'online' ? 'MEETING LINK' : 'ROOM / CABIN'}
                </label>
                <input
                  required
                  value={addForm.room_or_link}
                  onChange={e => setAddForm(f => ({ ...f, room_or_link: e.target.value }))}
                  placeholder={addForm.mode === 'online' ? 'e.g. meet.google.com/abc-xyz' : 'e.g. Room 302, Block C'}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  onFocus={e => e.target.style.borderColor = '#4f46e5'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>

              <button
                type="submit" disabled={saving}
                style={{ marginTop: 4, padding: '12px', borderRadius: 12, background: '#4f46e5', color: '#fff', border: 'none', fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: saving ? 0.7 : 1 }}
              >
                <Save size={16} /> {saving ? 'Saving...' : 'Add Slot'}
              </button>
            </form>
          </div>
        </div>
      )}
    </PageLayout>
  )
}
