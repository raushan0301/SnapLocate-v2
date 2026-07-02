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

const MODE_CLS = {
  'in-person': { badge: 'bg-emerald-50 text-emerald-600 border border-emerald-200', icon: <MapPin size={13} /> },
  'online':    { badge: 'bg-blue-50 text-blue-600 border border-blue-100',           icon: <Monitor size={13} /> },
}

const fieldCls = 'w-full px-[14px] py-[10px] rounded-[10px] border-[1.5px] border-slate-200 text-[14px] outline-none box-border bg-white focus:border-brand transition-colors'

function Toast({ msg, type }) {
  if (!msg) return null
  return (
    <div className={`fixed bottom-8 right-8 z-[9999] px-[22px] py-3.5 rounded-[14px] text-white shadow-[0_8px_32px_rgba(0,0,0,0.18)] text-[14px] font-semibold flex items-center gap-2 ${type === 'success' ? 'bg-green-600' : 'bg-red-500'}`}>
      {type === 'success' ? <CheckCircle size={16} /> : '✕'} {msg}
    </div>
  )
}

export default function OfficeHours() {
  const [slots, setSlots]     = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [toast, setToast]     = useState({ msg: '', type: 'success' })
  const [addForm, setAddForm] = useState(EMPTY_SLOT)
  const [showAdd, setShowAdd] = useState(false)

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
    } catch { }
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

  const grouped = DAYS.reduce((acc, day) => {
    acc[day] = slots.filter(s => s.day === day)
    return acc
  }, {})

  const totalSlots = slots.length

  return (
    <PageLayout>
      <Toast msg={toast.msg} type={toast.type} />

      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-[14px] bg-emerald-50 flex items-center justify-center">
            <Clock size={22} color="#059669" />
          </div>
          <div>
            <h1 className="text-[26px] font-bold t-primary m-0">Office Hours</h1>
            <p className="text-[14px] t-muted m-0">
              Set when students can reach you — {totalSlots} slot{totalSlots !== 1 ? 's' : ''} active
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-[12px] bg-brand text-white border-0 text-[14px] font-bold cursor-pointer"
        >
          <Plus size={16} /> Add Slot
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-[14px] px-5 py-3.5 flex gap-2.5 items-start">
        <Monitor size={16} color="#2563eb" className="mt-0.5 shrink-0" />
        <p className="m-0 text-[13px] text-blue-800">
          These slots are visible to students on your professor profile page. Students will see your availability and can send you a meeting request.
        </p>
      </div>

      {loading ? (
        <div className="py-[60px] text-center t-muted text-[14px]">
          Loading your schedule...
        </div>
      ) : (
        <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {DAYS.map(day => (
            <div key={day} className="bg-white rounded-[20px] p-5 border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
              <div className="flex justify-between items-center mb-3.5">
                <span className="text-[14px] font-extrabold t-primary">{day}</span>
                {grouped[day].length > 0 && (
                  <span className="bg-indigo-50 text-brand text-[11px] font-bold px-2 py-[2px] rounded-[6px]">
                    {grouped[day].length} slot{grouped[day].length > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {grouped[day].length === 0 ? (
                <div className="py-4 text-center text-[13px] text-slate-300">
                  No availability set
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {grouped[day].map((s, i) => {
                    const globalIdx = slots.findIndex(x => x === s)
                    const ms = MODE_CLS[s.mode] || MODE_CLS['in-person']
                    return (
                      <div key={i} className="flex items-center gap-2.5 px-3 py-2.5 bg-slate-50 rounded-[12px] border border-slate-100">
                        <div className="flex-1">
                          <div className="text-[13px] font-bold t-primary">{s.slot}</div>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className={`inline-flex items-center gap-1 px-2 py-[2px] rounded-[6px] text-[11px] font-bold ${ms.badge}`}>
                              {ms.icon} {s.mode}
                            </span>
                            <span className="text-[11px] text-slate-500 overflow-hidden text-ellipsis whitespace-nowrap max-w-[120px]">
                              {s.room_or_link}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDelete(globalIdx)}
                          className="bg-transparent border-0 cursor-pointer text-red-300 p-1 rounded-[8px] flex items-center hover:bg-red-50 transition-colors"
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

      {showAdd && (
        <div className="fixed inset-0 bg-slate-900/55 backdrop-blur-[4px] flex items-center justify-center z-[1000] p-5">
          <div className="bg-white rounded-[24px] w-full max-w-[440px] p-8 relative shadow-[0_20px_40px_rgba(0,0,0,0.12)]">
            <button onClick={() => setShowAdd(false)} className="absolute top-5 right-5 bg-transparent border-0 cursor-pointer text-[22px] text-slate-400">×</button>

            <h2 className="text-[20px] font-bold t-primary m-0 mb-6">Add Office Hour Slot</h2>

            <form onSubmit={handleAdd} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[12px] font-bold text-slate-600 mb-1.5 block">DAY</label>
                  <select
                    value={addForm.day} onChange={e => setAddForm(f => ({ ...f, day: e.target.value }))}
                    className={fieldCls}
                  >
                    {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[12px] font-bold text-slate-600 mb-1.5 block">TIME SLOT</label>
                  <select
                    value={addForm.slot} onChange={e => setAddForm(f => ({ ...f, slot: e.target.value }))}
                    className={fieldCls}
                  >
                    {SLOT_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[12px] font-bold text-slate-600 mb-2 block">MODE</label>
                <div className="flex gap-2.5">
                  {['in-person', 'online'].map(m => (
                    <button
                      key={m} type="button"
                      onClick={() => setAddForm(f => ({ ...f, mode: m }))}
                      className={`flex-1 py-2.5 rounded-[10px] cursor-pointer text-[13px] font-bold flex items-center justify-center gap-1.5 transition-colors ${addForm.mode === m ? 'border-2 border-brand bg-indigo-50 text-brand' : 'border-[1.5px] border-slate-200 bg-white text-slate-500'}`}
                    >
                      {m === 'in-person' ? <MapPin size={14} /> : <Monitor size={14} />}
                      {m === 'in-person' ? 'In-Person' : 'Online'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[12px] font-bold text-slate-600 mb-1.5 block">
                  {addForm.mode === 'online' ? 'MEETING LINK' : 'ROOM / CABIN'}
                </label>
                <input
                  required
                  value={addForm.room_or_link}
                  onChange={e => setAddForm(f => ({ ...f, room_or_link: e.target.value }))}
                  placeholder={addForm.mode === 'online' ? 'e.g. meet.google.com/abc-xyz' : 'e.g. Room 302, Block C'}
                  className={fieldCls}
                />
              </div>

              <button
                type="submit" disabled={saving}
                className={`mt-1 py-3 rounded-[12px] bg-brand text-white border-0 text-[15px] font-bold cursor-pointer flex items-center justify-center gap-2 transition-opacity ${saving ? 'opacity-70' : ''}`}
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
