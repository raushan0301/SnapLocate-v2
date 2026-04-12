import { useState, useEffect, useCallback } from 'react'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'
import { CalendarDays, Plus, Trash2, Edit2, X, Check } from 'lucide-react'

const pjs = (size, weight, lh, color) => ({
  fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: size, fontWeight: weight, lineHeight: lh, color,
})

const TYPES = ['mid', 'end', 'internal', 'quiz', 'practical', 'supplementary']
const typeStyle = {
  mid:'#4f46e5', end:'#d97706', internal:'#16a34a', quiz:'#7e22ce', practical:'#ea580c', supplementary:'#dc2626',
}

const empty = { course_code: '', course_name: '', exam_type: 'end', exam_date: '', start_time: '09:00', end_time: '', venue: '', duration_mins: '' }

function Toast({ msg }) {
  return msg ? <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#0f172a', color: '#fff', padding: '12px 20px', borderRadius: 12, zIndex: 999, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, fontWeight: 600 }}>{msg}</div> : null
}

export default function ManageExamSchedule() {
  const [exams, setExams]     = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]     = useState(null) // null | { mode: 'create'|'edit', data: {} }
  const [saving, setSaving]   = useState(false)
  const [toast, setToast]     = useState('')
  const [form, setForm]       = useState(empty)

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const load = useCallback(async () => {
    try {
      const res = await api.get('/api/exam-schedule')
      if (res.success) setExams(res.data || [])
    } catch {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const openCreate = () => { setForm(empty); setModal({ mode: 'create' }) }
  const openEdit   = (e) => { setForm({ ...e }); setModal({ mode: 'edit', id: e.id }) }
  const closeModal = () => { setModal(null); setForm(empty) }

  const handleSave = async () => {
    if (!form.exam_date || !form.exam_type || !form.start_time) return showToast('Date, type and time are required')
    setSaving(true)
    try {
      // Strip empty optional strings so Zod doesn't get '' where it expects a number/null
      const payload = Object.fromEntries(
        Object.entries(form).filter(([, v]) => v !== '' && v !== null && v !== undefined)
      )
      const res = modal.mode === 'create'
        ? await api.post('/api/exam-schedule', payload)
        : await api.patch(`/api/exam-schedule/${modal.id}`, payload)
      if (res.success) { showToast(modal.mode === 'create' ? 'Exam added' : 'Exam updated'); load(); closeModal() }
      else showToast(res.error || 'Save failed')
    } catch (err) {
      showToast(err?.message || 'Save failed')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this exam entry?')) return
    try {
      await api.delete(`/api/exam-schedule/${id}`)
      showToast('Exam deleted')
      load()
    } catch { showToast('Delete failed') }
  }

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  return (
    <PageLayout>
      <Toast msg={toast} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CalendarDays size={22} color="#4f46e5" />
          </div>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: '#0f172a', margin: 0 }}>Exam Schedule</h1>
            <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>Manage examination timetable for all students.</p>
          </div>
        </div>
        <button onClick={openCreate}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 12, border: 'none', background: '#4f46e5', color: '#fff', cursor: 'pointer', ...pjs(14, 700, '20px', '#fff') }}>
          <Plus size={16} /> Add Exam
        </button>
      </div>

      <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9', boxShadow: '0 4px 24px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', ...pjs(14, 500, '20px', '#94a3b8') }}>Loading...</div>
        ) : exams.length === 0 ? (
          <div style={{ padding: '60px 24px', textAlign: 'center' }}>
            <CalendarDays size={40} color="#e2e8f0" style={{ margin: '0 auto 12px', display: 'block' }} />
            <div style={pjs(15, 600, '20px', '#0f172a')}>No exam schedule yet</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  {['Course', 'Type', 'Date', 'Time', 'Venue', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '13px 20px', textAlign: 'left', ...pjs(11, 700, '14px', '#64748b'), textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {exams.map((e, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f8fafc' }}
                    onMouseEnter={el => el.currentTarget.style.background = '#fafafa'}
                    onMouseLeave={el => el.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={pjs(13, 700, '18px', '#0f172a')}>{e.course_code || e.courses?.code || '—'}</div>
                      <div style={pjs(11, 400, '14px', '#94a3b8')}>{e.course_name || e.courses?.name}</div>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{ ...pjs(11, 700, '14px', typeStyle[e.exam_type] || '#64748b'), background: '#f8fafc', padding: '4px 10px', borderRadius: 8, textTransform: 'capitalize' }}>{e.exam_type}</span>
                    </td>
                    <td style={{ padding: '14px 20px', ...pjs(13, 600, '18px', '#0f172a') }}>{new Date(e.exam_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td style={{ padding: '14px 20px', ...pjs(13, 400, '18px', '#64748b') }}>{e.start_time}{e.end_time ? ` – ${e.end_time}` : ''}</td>
                    <td style={{ padding: '14px 20px', ...pjs(13, 400, '18px', '#64748b') }}>{e.venue || '—'}</td>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => openEdit(e)} style={{ padding: '6px 10px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer' }}><Edit2 size={13} color="#64748b" /></button>
                        <button onClick={() => handleDelete(e.id)} style={{ padding: '6px 10px', borderRadius: 8, border: '1.5px solid #fecaca', background: '#fee2e2', cursor: 'pointer' }}><Trash2 size={13} color="#dc2626" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }} onClick={closeModal}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 28, width: '100%', maxWidth: 520, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <span style={pjs(17, 700, '22px', '#0f172a')}>{modal.mode === 'create' ? 'Add Exam' : 'Edit Exam'}</span>
              <button onClick={closeModal} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X size={18} color="#94a3b8" /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { key: 'course_code', label: 'Course Code', placeholder: 'e.g. CSE301' },
                { key: 'course_name', label: 'Course Name', placeholder: 'e.g. Operating Systems' },
                { key: 'venue',       label: 'Venue',       placeholder: 'e.g. Block C, Room 201' },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <div style={pjs(12, 600, '16px', '#374151')}>{label}</div>
                  <input value={form[key] || ''} onChange={e => f(key, e.target.value)} placeholder={placeholder}
                    style={{ width: '100%', marginTop: 4, padding: '9px 12px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 14, fontFamily: "'Plus Jakarta Sans', sans-serif", outline: 'none', boxSizing: 'border-box' }}
                    onFocus={e => e.target.style.borderColor = '#4f46e5'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                </div>
              ))}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div style={pjs(12, 600, '16px', '#374151')}>Type</div>
                  <select value={form.exam_type} onChange={e => f('exam_type', e.target.value)}
                    style={{ width: '100%', marginTop: 4, padding: '9px 12px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 14, fontFamily: "'Plus Jakarta Sans', sans-serif", outline: 'none' }}>
                    {TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <div style={pjs(12, 600, '16px', '#374151')}>Date</div>
                  <input type="date" value={form.exam_date || ''} onChange={e => f('exam_date', e.target.value)}
                    style={{ width: '100%', marginTop: 4, padding: '9px 12px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 14, fontFamily: "'Plus Jakarta Sans', sans-serif", outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <div style={pjs(12, 600, '16px', '#374151')}>Start Time</div>
                  <input type="time" value={form.start_time || ''} onChange={e => f('start_time', e.target.value)}
                    style={{ width: '100%', marginTop: 4, padding: '9px 12px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 14, fontFamily: "'Plus Jakarta Sans', sans-serif", outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <div style={pjs(12, 600, '16px', '#374151')}>End Time (optional)</div>
                  <input type="time" value={form.end_time || ''} onChange={e => f('end_time', e.target.value)}
                    style={{ width: '100%', marginTop: 4, padding: '9px 12px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 14, fontFamily: "'Plus Jakarta Sans', sans-serif", outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
              <button onClick={closeModal} style={{ padding: '10px 18px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer', ...pjs(13, 600, '18px', '#64748b') }}>Cancel</button>
              <button onClick={handleSave} disabled={saving}
                style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: saving ? '#e2e8f0' : '#4f46e5', color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', ...pjs(13, 700, '18px', '#fff') }}>
                {saving ? 'Saving...' : modal.mode === 'create' ? 'Add Exam' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  )
}
