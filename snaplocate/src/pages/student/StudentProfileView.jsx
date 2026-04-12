import { useState, useEffect, useCallback } from 'react'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import { User, Edit2, Check, X } from 'lucide-react'

const pjs = (size, weight, lh, color) => ({
  fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: size, fontWeight: weight, lineHeight: lh, color,
})

const Field = ({ label, value, edit, onChange, type = 'text', options }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    <div style={pjs(11, 600, '14px', '#94a3b8')}>{label.toUpperCase()}</div>
    {edit ? (
      options ? (
        <select value={value || ''} onChange={e => onChange(e.target.value)}
          style={{ padding: '8px 10px', borderRadius: 8, border: '1.5px solid #4f46e5', fontSize: 14, fontFamily: "'Plus Jakarta Sans', sans-serif", outline: 'none' }}>
          <option value="">—</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input type={type} value={value || ''} onChange={e => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
          style={{ padding: '8px 10px', borderRadius: 8, border: '1.5px solid #4f46e5', fontSize: 14, fontFamily: "'Plus Jakarta Sans', sans-serif", outline: 'none' }} />
      )
    ) : (
      <div style={pjs(14, 600, '20px', value ? '#0f172a' : '#cbd5e1')}>{value || '—'}</div>
    )}
  </div>
)

export default function StudentProfileView() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [form, setForm]       = useState({})
  const [editing, setEditing] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [loading, setLoading] = useState(true)
  const [toast, setToast]     = useState('')

  const load = useCallback(async () => {
    try {
      const res = await api.get('/api/student-profiles/me')
      if (res.success && res.data) { setProfile(res.data); setForm(res.data) }
    } catch {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = profile
        ? await api.patch('/api/student-profiles/me', form)
        : await api.post('/api/student-profiles', form)
      if (res.success) { setProfile(res.data); setEditing(false); showToast('Profile updated') }
    } catch (err) {
      showToast(err?.message || 'Save failed')
    } finally { setSaving(false) }
  }

  const f = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

  return (
    <PageLayout>
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#0f172a', color: '#fff', padding: '12px 20px', borderRadius: 12, zIndex: 999, ...pjs(14, 600, '20px', '#fff') }}>
          {toast}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: '#fdf4ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={22} color="#7e22ce" />
          </div>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: '#0f172a', margin: 0 }}>My Academic Profile</h1>
            <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>Enrollment number, branch, CGPA, and more.</p>
          </div>
        </div>
        {!editing ? (
          <button onClick={() => setEditing(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer', ...pjs(13, 600, '18px', '#475569') }}>
            <Edit2 size={13} /> Edit
          </button>
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => { setEditing(false); setForm(profile || {}) }}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer', ...pjs(13, 600, '18px', '#dc2626') }}>
              <X size={13} /> Cancel
            </button>
            <button onClick={handleSave} disabled={saving}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, border: 'none', background: '#4f46e5', cursor: 'pointer', ...pjs(13, 700, '18px', '#fff') }}>
              <Check size={13} /> {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        )}
      </div>

      {/* User card */}
      <div style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', borderRadius: 20, padding: '24px 28px', display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{ width: 60, height: 60, borderRadius: 18, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
          {user?.avatar_url ? <img src={user.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={pjs(22, 800, '28px', '#fff')}>{(user?.full_name || 'S')[0]}</span>}
        </div>
        <div>
          <div style={pjs(20, 800, '26px', '#fff')}>{user?.full_name}</div>
          <div style={pjs(13, 400, '18px', 'rgba(255,255,255,0.75)')}>{user?.email}</div>
          {profile?.enrollment_no && <div style={{ ...pjs(12, 600, '16px', 'rgba(255,255,255,0.9)'), marginTop: 4 }}>Enrollment: {profile.enrollment_no}</div>}
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', ...pjs(14, 500, '20px', '#94a3b8') }}>Loading profile...</div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9', padding: '28px', boxShadow: '0 4px 24px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            <Field label="Enrollment No" value={editing ? form.enrollment_no : profile?.enrollment_no} edit={editing} onChange={v => f('enrollment_no', v)} />
            <Field label="Roll No" value={editing ? form.roll_no : profile?.roll_no} edit={editing} onChange={v => f('roll_no', v)} />
            <Field label="Branch" value={editing ? form.branch : profile?.branch} edit={editing} onChange={v => f('branch', v)} options={editing ? ['CSE','ECE','ME','CE','EE','IT','CHE','BIO','PHY','MBA','MCA'] : null} />
            <Field label="Department" value={editing ? form.dept : profile?.dept} edit={editing} onChange={v => f('dept', v)} />
            <Field label="Semester" value={editing ? form.semester : profile?.semester} edit={editing} type="number" onChange={v => f('semester', v)} />
            <Field label="Section" value={editing ? form.section : profile?.section} edit={editing} onChange={v => f('section', v)} />
            <Field label="Batch Year" value={editing ? form.batch_year : profile?.batch_year} edit={editing} type="number" onChange={v => f('batch_year', v)} />
            <Field label="Current CGPA" value={editing ? form.current_cgpa : profile?.current_cgpa} edit={editing} type="number" onChange={v => f('current_cgpa', v)} />
          </div>
        </div>
      )}
    </PageLayout>
  )
}
