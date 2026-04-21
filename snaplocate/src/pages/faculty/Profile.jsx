import { useState, useEffect, useRef } from 'react'
import PageLayout from '../../components/PageLayout'
import { useAuth } from '../../context/AuthContext'
import api from '../../lib/api'
import ImageCropper from '../../components/ImageCropper'

/* ─── Font helpers ─── */
const f = (size, weight, lh, color) => ({
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  fontSize: size, fontWeight: weight, lineHeight: lh, color,
})
const mono = (size, color) => ({
  fontFamily: "'ui-monospace','SFMono-Regular',monospace", fontSize: size, color,
})

/* ─── Toast ─── */
function Toast({ msg, type = 'success' }) {
  if (!msg) return null
  return (
    <div style={{
      position: 'fixed', bottom: 32, right: 32, zIndex: 9999,
      padding: '14px 24px', borderRadius: 14,
      background: type === 'success' ? '#16a34a' : '#ef4444',
      color: '#fff', boxShadow: '0 8px 32px rgba(0,0,0,.18)',
      ...f(14, 600, '20px', '#fff'),
      display: 'flex', alignItems: 'center', gap: 10,
      animation: 'slideUp .3s ease',
    }}>
      {type === 'success' ? '✓' : '✕'} {msg}
    </div>
  )
}

/* ─── Controlled Field ─── */
function Field({ label, value, onChange, placeholder, type = 'text', span2, multiline, rows = 4 }) {
  const base = {
    width: '100%', padding: '12px 18px',
    border: '1px solid #e2e8f0', borderRadius: multiline ? 14 : 40,
    background: '#f8fafc', ...f(14, 400, '20px', '#0f172a'),
    outline: 'none', boxSizing: 'border-box',
    transition: 'border-color .15s, box-shadow .15s',
    resize: multiline ? 'vertical' : undefined,
  }
  const focus = e => { e.target.style.borderColor = '#4f46e5'; e.target.style.boxShadow = '0 0 0 3px rgba(79,70,229,.07)' }
  const blur = e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none' }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7, gridColumn: span2 ? '1 / -1' : undefined }}>
      <label style={f(12, 600, '16px', '#475569')}>{label}</label>
      {multiline
        ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} style={base} onFocus={focus} onBlur={blur} />
        : <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={base} onFocus={focus} onBlur={blur} />
      }
    </div>
  )
}

/* ─── Section card ─── */
function Section({ icon, title, badge, children, action }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #f1f5f9', borderRadius: 18, padding: '26px 30px', boxShadow: '0 1px 6px rgba(0,0,0,.05)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {icon}
          <span style={f(15, 700, '21px', '#0f172a')}>{title}</span>
          {badge && <span style={{ ...f(10, 700, '14px', '#4f46e5'), background: '#eef2ff', padding: '3px 10px', borderRadius: 20, letterSpacing: '.06em' }}>{badge}</span>}
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

/* ─── Add btn ─── */
function AddBtn({ onClick, label = 'Add Row' }) {
  return (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', ...f(12, 700, '16px', '#4f46e5') }}>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6.5" stroke="#4f46e5" strokeWidth="1.1" /><path d="M7 4v6M4 7h6" stroke="#4f46e5" strokeWidth="1.2" strokeLinecap="round" /></svg>
      {label}
    </button>
  )
}

/* ─── Trash ─── */
const Trash = ({ onClick }) => (
  <button onClick={onClick} style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background .14s' }}
    onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 3h9M4 3V2h5v1M5 5.5v4M8 5.5v4M3 3l.5 8a1 1 0 001 1h4a1 1 0 001-1L10 3" stroke="#ef4444" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" /></svg>
  </button>
)

/* ─── Editable table ─── */
function EditTable({ cols, rows, setRows, emptyMsg = 'No entries yet. Click Add Row.' }) {
  const update = (rowIdx, colKey, val) =>
    setRows(rs => rs.map((r, i) => i === rowIdx ? { ...r, [colKey]: val } : r))
  return (
    <div style={{ border: '1px solid #f1f5f9', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: cols.map(c => `${c.flex || 1}fr`).join(' ') + ' 36px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9', padding: '9px 16px', gap: 8 }}>
        {cols.map(c => <span key={c.key} style={{ ...f(10, 700, '14px', '#4f46e5'), textTransform: 'uppercase', letterSpacing: '.08em' }}>{c.label}</span>)}
        <span />
      </div>
      {rows.length === 0 && <div style={{ padding: '18px 16px', ...f(13, 400, '18px', '#94a3b8'), textAlign: 'center' }}>{emptyMsg}</div>}
      {rows.map((row, ri) => (
        <div key={ri} style={{ display: 'grid', gridTemplateColumns: cols.map(c => `${c.flex || 1}fr`).join(' ') + ' 36px', padding: '12px 16px', gap: 8, alignItems: 'center', borderTop: ri > 0 ? '1px solid #f8fafc' : 'none' }}>
          {cols.map(c => (
            c.options ? (
              <select key={c.key} value={row[c.key] || ''} onChange={e => update(ri, c.key, e.target.value)}
                style={{ ...f(13, 500, '18px', '#0f172a'), background: 'transparent', border: 'none', borderBottom: '1px solid transparent', outline: 'none', paddingBottom: 1, width: '100%', transition: 'border-color .14s', cursor: 'pointer' }}
                onFocus={e => e.target.style.borderBottomColor = '#4f46e5'} onBlur={e => e.target.style.borderBottomColor = 'transparent'}>
                <option value="" disabled>{c.ph || c.label}</option>
                {c.options.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : (
              <input key={c.key} value={row[c.key] || ''} placeholder={c.ph || c.label}
                style={{ ...f(13, 400, '18px', '#0f172a'), background: 'transparent', border: 'none', borderBottom: '1px solid transparent', outline: 'none', paddingBottom: 1, width: '100%', transition: 'border-color .14s', ...(c.mono ? mono(13, '#4f46e5') : {}) }}
                onFocus={e => e.target.style.borderBottomColor = '#4f46e5'} onBlur={e => e.target.style.borderBottomColor = 'transparent'}
                onChange={e => update(ri, c.key, e.target.value)}
              />
            )
          ))}
          <Trash onClick={() => setRows(rs => rs.filter((_, i) => i !== ri))} />
        </div>
      ))}
    </div>
  )
}

/* ══════════════════════════════════════════════════ */
export default function FacultyProfile() {
  const { user, updateUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)
  const [profileId, setProfileId] = useState(null)

  /* ── Basic contact state ── */
  const [form, setForm] = useState({
    designation: '', dept: '', teacher_code: '', phone: '',
    dept_website: '', linkedin: '', bio: '',
    cabin_room: '', cabin_building: '', cabin_floor: '', campus_section: '',
    research_interests: '', lab_name: '', lab_website: '',
    accepting_students: true,
    citations: '', publications_count: '', conferences: '', teaching_exp_years: '',
  })

  /* ── Sub-resource state ── */
  const [quals, setQuals] = useState([])
  const [pubs, setPubs] = useState([])
  const [awards, setAwards] = useState([])
  const [timetable, setTimetable] = useState([])
  const [visiting, setVisiting] = useState([])
  const [academicLinks, setAcademicLinks] = useState([])

  /* ── Avatar upload ── */
  const avatarRef = useRef()
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [cropSrc, setCropSrc] = useState(null)

  /* ── Load on mount ── */
  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/api/faculty/me/profile')
        const d = res.data
        if (d) {
          setProfileId(d.id)
          // Update user context with fresh verification status from flattened data
          updateUser({
            ...user,
            full_name: d.full_name || user?.full_name,
            avatar_url: d.avatar_url || user?.avatar_url,
            is_verified: !!d.is_verified
          })
          setForm({
            designation: d.designation || '',
            dept: d.dept || '',
            teacher_code: d.teacher_code || '',
            phone: d.phone || '',
            dept_website: d.dept_website || '',
            linkedin: d.linkedin || '',
            bio: d.bio || '',
            cabin_room: d.cabin_room || '',
            cabin_building: d.cabin_building || '',
            cabin_floor: d.cabin_floor || '',
            campus_section: d.campus_section || '',
            research_interests: Array.isArray(d.research_interests) ? d.research_interests.join(', ') : (d.research_interests || ''),
            lab_name: d.lab_name || '',
            lab_website: d.lab_website || '',
            accepting_students: !!d.accepting_students,
            citations: d.citations || '',
            publications_count: d.publications_count || '',
            conferences: d.conferences || '',
            teaching_exp_years: d.teaching_exp_years || '',
          })
          setQuals(d.qualifications || [])
          setPubs(d.publications || [])
          setAwards(d.awards || [])
          setTimetable((d.timetable || []).map(t => ({ ...t, time: t.time_slot || t.time })))
          setVisiting((d.office_hours || []).map(v => ({ ...v, room: v.room_or_link || v.room })))
          setAcademicLinks(d.academic_links && d.academic_links.length > 0 ? d.academic_links : [
            { label: 'LinkedIn', url: d.linkedin || '' }, { label: 'Dept Website', url: d.dept_website || '' }, { label: 'Lab Website', url: d.lab_website || '' }
          ])
        }
      } catch (err) {
        console.error('Could not load profile:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const set = (key) => (val) => setForm(f => ({ ...f, [key]: val }))

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const [avatarFile, setAvatarFile] = useState(null)

  /* ── Save all sections ── */
  const saveAll = async () => {
    setSaving(true)
    try {
      let newAvatarUrl = undefined
      if (avatarFile) {
        const formData = new FormData()
        formData.append('file', avatarFile)
        formData.append('type', 'avatar')
        const uploadRes = await api.upload('/api/upload/image', formData)
        if (uploadRes.success) {
          newAvatarUrl = uploadRes.url
        }
      }

      // Upsert avatar in users table if changed
      if (newAvatarUrl || form.full_name) {
        await api.patch('/api/users/profile', {
          full_name: form.full_name,
          ...(newAvatarUrl && { avatar_url: newAvatarUrl })
        })
      }

      // 1. Upsert main profile
      await api.put('/api/faculty/me/profile', {
        ...form,
        research_interests: form.research_interests.split(',').map(s => s.trim()).filter(Boolean),
        academic_links: academicLinks.filter(l => l.label || l.url),
      })

      // 2. Sub-collections (bulk replace)
      if (profileId) {
        await api.put('/api/faculty/me/qualifications', { items: quals.filter(q => q.degree) })
        await api.put('/api/faculty/me/publications', { items: pubs.filter(p => p.title) })
        await api.put('/api/faculty/me/awards', { items: awards.filter(a => a.title) })

        if (timetable.length > 0) {
          await api.put('/api/faculty/me/timetable', {
            slots: timetable.filter(t => t.day).map(t => ({ ...t, time_slot: t.time }))
          })
        }
        if (visiting.length > 0) {
          await api.put('/api/faculty/me/office-hours', {
            hours: visiting.filter(v => v.day).map(v => ({ ...v, room_or_link: v.room }))
          })
        }
      }

      // Update user context so header shows changes instantly
      updateUser({
        full_name: user?.full_name,
        ...(newAvatarUrl && { avatar_url: newAvatarUrl })
      })

      showToast('Profile saved successfully!')
    } catch (err) {
      console.error('Save error:', err)
      showToast(err.message || 'Failed to save profile', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleCropComplete = (blob) => {
    const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' })
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(blob))
    setCropSrc(null)
  }

  /* ── Initials ── */
  const initials = (user?.full_name || 'FA').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  if (loading) {
    return (
      <PageLayout>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {[260, 180, 200, 340, 280].map((h, i) => (
            <div key={i} style={{ height: h, background: '#fff', borderRadius: 18, border: '1px solid #f1f5f9', animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))}
        </div>
        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      {cropSrc && <ImageCropper imageSrc={cropSrc} onCropComplete={handleCropComplete} onCancel={() => setCropSrc(null)} />}
      {toast && <Toast msg={toast.msg} type={toast.type} />}
      <style>{`
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
        @keyframes slideUp{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}
      `}</style>

      {/* ══ Header ════════════════════════════════════ */}
      <div style={{ background: '#fff', border: '1px solid #f1f5f9', borderRadius: 18, padding: '26px 32px', boxShadow: '0 1px 6px rgba(0,0,0,.05)', display: 'flex', alignItems: 'center', gap: 26 }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{ width: 90, height: 90, borderRadius: '50%', background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', boxShadow: '0 4px 20px rgba(79,70,229,.28)' }}>
            {(avatarPreview || user?.avatar_url)
              ? <img src={avatarPreview || user?.avatar_url} alt={user?.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={f(26, 800, '32px', '#fff')}>{initials}</span>
            }
          </div>
          <button
            onClick={() => avatarRef.current?.click()}
            style={{ position: 'absolute', bottom: 2, right: 2, width: 28, height: 28, borderRadius: '50%', background: '#fff', border: '2px solid #e0e7ff', boxShadow: '0 2px 8px rgba(0,0,0,.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            title="Change photo"
          >
            <svg width="13" height="12" viewBox="0 0 13 12" fill="none"><path d="M5 1.5H8L9.5 3H12a.5.5 0 01.5.5v7a.5.5 0 01-.5.5H1a.5.5 0 01-.5-.5v-7A.5.5 0 011 3h2.5L5 1.5z" stroke="#4f46e5" strokeWidth="1" strokeLinejoin="round" /><circle cx="6.5" cy="6.5" r="2" stroke="#4f46e5" strokeWidth="1" /></svg>
          </button>
          <input ref={avatarRef} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={e => { const f = e.target.files[0]; if (f) { setCropSrc(URL.createObjectURL(f)); e.target.value = ''; } }} />
        </div>

        <div style={{ flex: 1 }}>
          <h1 style={f(22, 800, '28px', '#0f172a')}>{user?.full_name || 'Profile Information'}</h1>
          <p style={{ ...f(13, 400, '18px', '#64748b'), marginTop: 4, marginBottom: 14 }}>Update your public presence and contact details.</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {form.dept && <span style={{ ...f(10, 700, '14px', '#4f46e5'), background: '#eef2ff', padding: '5px 12px', borderRadius: 20, letterSpacing: '.06em', textTransform: 'uppercase' }}>{form.dept}</span>}
            {user?.is_verified ? (
              <span style={{
                ...f(10, 700, '14px', '#10b981'), background: '#ecfdf5', padding: '5px 12px', borderRadius: 20,
                letterSpacing: '.06em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L14.8 5.4L19.2 6L19.8 10.4L23 13L20 16L19.8 20.4L15.4 21L12 24L8.6 21L4.2 20.4L4 16L1 13L4.2 10.4L4.8 6L9.2 5.4L12 2Z" fill="#10b981" />
                  <path d="M8.5 12.5L10.5 14.5L15.5 9.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Verified
              </span>
            ) : (
              <span style={{ ...f(10, 700, '14px', '#d97706'), background: '#fff7ed', padding: '5px 12px', borderRadius: 20, letterSpacing: '.06em', textTransform: 'uppercase' }}>Pending Verification</span>
            )}
            {form.accepting_students && <span style={{ ...f(10, 700, '14px', '#7c3aed'), background: '#faf5ff', padding: '5px 12px', borderRadius: 20, letterSpacing: '.06em', textTransform: 'uppercase' }}>☑ Accepting Students</span>}
          </div>
        </div>

        <button onClick={saveAll} disabled={saving} style={{ padding: '12px 28px', borderRadius: 40, border: 'none', cursor: saving ? 'default' : 'pointer', background: saving ? '#6366f1' : '#4f46e5', ...f(13, 700, '18px', '#fff'), boxShadow: '0 2px 12px rgba(79,70,229,.25)', transition: 'background .2s', flexShrink: 0, opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>

      {/* ══ Stats ════════════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
        {[
          { label: 'ONGOING PROJECTS', key: 'citations', sub: 'Active', subColor: '#16a34a', bg: '#f0fdf4' },
          { label: 'PUBLICATIONS', key: 'publications_count', sub: 'Peer Reviewed', subColor: '#4f46e5', bg: '#eef2ff' },
          { label: 'CONFERENCES', key: 'conferences', sub: 'Verified', subColor: '#0ea5e9', bg: '#f0f9ff' },
          { label: 'TEACHING EXP.', key: 'teaching_exp_years', sub: 'Years', subColor: '#d97706', bg: '#fffbeb' },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', border: '1px solid #f1f5f9', borderRadius: 16, padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,.04)' }}>
            <div style={{ ...f(10, 700, '14px', '#94a3b8'), textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 6 }}>{s.label}</div>
            <input
              type="text"
              value={form[s.key]}
              onChange={e => set(s.key)(e.target.value)}
              placeholder="—"
              style={{ ...f(28, 800, '34px', '#0f172a'), border: 'none', outline: 'none', background: 'transparent', width: '100%', padding: 0 }}
            />
            <div style={{ ...f(11, 600, '15px', s.subColor), marginTop: 6 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ══ Basic & Contact ═════════════════════════════ */}
      <Section
        icon={<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7.5" stroke="#4f46e5" strokeWidth="1.4" /><path d="M9 8v4" stroke="#4f46e5" strokeWidth="1.4" strokeLinecap="round" /><circle cx="9" cy="5.5" r=".8" fill="#4f46e5" /></svg>}
        title="Basic & Contact Details"
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Field label="Full Name" value={user?.full_name || ''} onChange={() => { }} placeholder="Dr. Your Name" />
          <Field label="Designation" value={form.designation} onChange={set('designation')} placeholder="e.g. Professor / HOD" />
          <Field label="Teacher Code" value={form.teacher_code} onChange={set('teacher_code')} placeholder="e.g. RAJ" />
          <Field label="Department" value={form.dept} onChange={set('dept')} placeholder="e.g. CSED" />
          <Field label="Phone Extension" value={form.phone} onChange={set('phone')} placeholder="+91 xxxxx xxxxx" />
          <Field label="Department Website" value={form.dept_website} onChange={set('dept_website')} type="url" placeholder="https://..." />
          <Field label="LinkedIn / ORCID" value={form.linkedin} onChange={set('linkedin')} type="url" placeholder="https://linkedin.com/in/..." />
          <Field label="Professional Bio" span2 multiline rows={5}
            value={form.bio} onChange={set('bio')} placeholder="Write a short professional bio that will appear on your public profile…" />
        </div>
      </Section>

      {/* ══ Office & Visiting Hours ════════════════════ */}
      <Section
        icon={<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 1.5C6.2 1.5 4 3.7 4 6.5c0 4 5 10 5 10s5-6 5-10c0-2.8-2.2-5-5-5z" stroke="#4f46e5" strokeWidth="1.4" strokeLinejoin="round" /><circle cx="9" cy="6.5" r="2" stroke="#4f46e5" strokeWidth="1.3" /></svg>}
        title="Office, Location & Visiting Hours"
        action={<AddBtn onClick={() => setVisiting(v => [...v, { day: '', slot: '', mode: 'In-Person', room: '' }])} label="Add Slot" />}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
          {/* Left — location */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ ...f(11, 700, '15px', '#94a3b8'), textTransform: 'uppercase', letterSpacing: '.09em', marginBottom: 2 }}>Location Details</div>
            <Field label="Cabin / Office Room" value={form.cabin_room} onChange={set('cabin_room')} placeholder="e.g. Room 402" />
            <Field label="Building" value={form.cabin_building} onChange={set('cabin_building')} placeholder="e.g. CS Block" />
            <Field label="Floor" value={form.cabin_floor} onChange={set('cabin_floor')} placeholder="e.g. 4th Floor" />
            <Field label="Campus Section" value={form.campus_section} onChange={set('campus_section')} placeholder="e.g. North Wing" />
            {/* Map preview */}
            <div style={{ height: 90, borderRadius: 14, background: 'linear-gradient(135deg,#eef2ff 0%,#f0fdf4 100%)', border: '1px solid #e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 4 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 2C8.7 2 6 4.7 6 8c0 5.3 6 14 6 14s6-8.7 6-14c0-3.3-2.7-6-6-6z" fill="#4f46e5" opacity=".15" /><path d="M12 2C8.7 2 6 4.7 6 8c0 5.3 6 14 6 14s6-8.7 6-14c0-3.3-2.7-6-6-6z" stroke="#4f46e5" strokeWidth="1.5" /><circle cx="12" cy="8" r="2.5" stroke="#4f46e5" strokeWidth="1.4" /></svg>
              <div>
                <div style={f(13, 700, '18px', '#4f46e5')}>{form.cabin_room || 'Set your room'}</div>
                <div style={f(11, 400, '15px', '#64748b')}>{[form.campus_section, form.cabin_floor].filter(Boolean).join(' · ') || 'Fill location details'}</div>
              </div>
            </div>
          </div>
          {/* Right — office hours */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ ...f(11, 700, '15px', '#94a3b8'), textTransform: 'uppercase', letterSpacing: '.09em', marginBottom: 2 }}>Visiting / Office Hours</div>
            {visiting.map((v, i) => (
              <div key={i} style={{ background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: 14, padding: '12px 16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 10, marginBottom: 8 }}>
                  {[{ val: v.day || '', ph: 'Select Day', label: 'Day', options: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] },
                  {
                    val: v.slot || '', ph: 'Select Slot', label: 'Time', options: [
                      '08:00 AM - 08:50 AM', '08:50 AM - 09:40 AM', '09:40 AM - 10:30 AM', '10:30 AM - 11:20 AM',
                      '11:20 AM - 12:10 PM', '12:10 PM - 01:00 PM', '01:00 PM - 01:50 PM', '01:50 PM - 02:40 PM',
                      '02:40 PM - 03:30 PM', '03:30 PM - 04:20 PM', '04:20 PM - 05:10 PM', '05:10 PM - 06:00 PM',
                      '06:00 PM - 06:30 PM'
                    ]
                  }].map((c, ci) => (
                    <div key={ci}>
                      <div style={{ ...f(10, 600, '14px', '#94a3b8'), marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.06em' }}>{c.label}</div>
                      <select value={c.val}
                        style={{ ...f(13, 500, '18px', '#0f172a'), background: 'transparent', border: 'none', borderBottom: '1px solid #e2e8f0', outline: 'none', paddingBottom: 2, width: '100%', transition: 'border-color .14s', cursor: 'pointer' }}
                        onFocus={e => e.target.style.borderBottomColor = '#4f46e5'} onBlur={e => e.target.style.borderBottomColor = '#e2e8f0'}
                        onChange={e => setVisiting(vs => vs.map((x, j) => j === i ? { ...x, [ci === 0 ? 'day' : 'slot']: e.target.value } : x))}
                      >
                        <option value="" disabled>{c.ph}</option>
                        {c.options.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr 28px', gap: 10, alignItems: 'center' }}>
                  {[{ val: v.mode || '', ph: 'Select Mode', label: 'Mode', options: ['In-Person', 'Virtual'] }, { val: v.room || '', ph: 'Room / Link', label: 'Location' }].map((c, ci) => (
                    <div key={ci}>
                      <div style={{ ...f(10, 600, '14px', '#94a3b8'), marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.06em' }}>{c.label}</div>
                      {c.options ? (
                        <select value={c.val}
                          style={{ ...f(13, 400, '18px', '#0f172a'), background: 'transparent', border: 'none', borderBottom: '1px solid #e2e8f0', outline: 'none', paddingBottom: 2, width: '100%', cursor: 'pointer' }}
                          onFocus={e => e.target.style.borderBottomColor = '#4f46e5'} onBlur={e => e.target.style.borderBottomColor = '#e2e8f0'}
                          onChange={e => setVisiting(vs => vs.map((x, j) => j === i ? { ...x, mode: e.target.value } : x))}
                        >
                          <option value="" disabled>{c.ph}</option>
                          {c.options.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      ) : (
                        <input value={c.val} placeholder={c.ph}
                          style={{ ...f(13, 400, '18px', '#0f172a'), background: 'transparent', border: 'none', borderBottom: '1px solid #e2e8f0', outline: 'none', paddingBottom: 2, width: '100%' }}
                          onFocus={e => e.target.style.borderBottomColor = '#4f46e5'} onBlur={e => e.target.style.borderBottomColor = '#e2e8f0'}
                          onChange={e => setVisiting(vs => vs.map((x, j) => j === i ? { ...x, room: e.target.value } : x))}
                        />
                      )}
                    </div>
                  ))}
                  <div style={{ paddingTop: 18 }}><Trash onClick={() => setVisiting(vs => vs.filter((_, j) => j !== i))} /></div>
                </div>
                <div style={{ marginTop: 10 }}>
                  <span style={{ ...f(10, 700, '14px', v.mode === 'Virtual' || v.mode === 'virtual' ? '#0ea5e9' : '#16a34a'), background: v.mode === 'Virtual' || v.mode === 'virtual' ? '#f0f9ff' : '#dcfce7', padding: '3px 10px', borderRadius: 20 }}>
                    {v.mode === 'Virtual' || v.mode === 'virtual' ? '🔗 Virtual' : '📍 In-Person'}
                  </span>
                </div>
              </div>
            ))}
            {visiting.length === 0 && (
              <div style={{ padding: '24px 0', textAlign: 'center', ...f(13, 400, '18px', '#94a3b8'), border: '1px dashed #e2e8f0', borderRadius: 14 }}>
                No office hours set. Click "Add Slot".
              </div>
            )}
          </div>
        </div>
      </Section>

      {/* ══ Research & Openings ═════════════════════════ */}
      <Section
        icon={<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2 16l4-4m0 0a5 5 0 117.07-7.07A5 5 0 016 12z" stroke="#4f46e5" strokeWidth="1.4" strokeLinecap="round" /><path d="M13.5 2.5l2 2" stroke="#4f46e5" strokeWidth="1.4" strokeLinecap="round" /></svg>}
        title="Research & Openings"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field label="Research Interests (comma separated)" span2
              value={form.research_interests} onChange={set('research_interests')} placeholder="e.g. Machine Learning, IoT, Cloud" />
            <Field label="Lab / Research Group Name" value={form.lab_name} onChange={set('lab_name')} placeholder="e.g. SmartNodes Lab" />
            <Field label="Research Lab Website" value={form.lab_website} onChange={set('lab_website')} type="url" placeholder="https://..." />
          </div>
          {/* Toggle */}
          <div onClick={() => set('accepting_students')(!form.accepting_students)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderRadius: 14, background: '#f8fafc', border: '1px solid #e0e7ff', cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="6" cy="5" r="3" stroke="#4f46e5" strokeWidth="1.2" /><path d="M2 14c0-3 1.8-5 4-5" stroke="#4f46e5" strokeWidth="1.2" strokeLinecap="round" /><path d="M10 8v6m-2-2l2 2 2-2" stroke="#4f46e5" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
              <div>
                <div style={f(13, 700, '18px', '#0f172a')}>Currently Accepting Research Students</div>
                <div style={f(11, 400, '15px', '#64748b')}>Toggle to show openings on your public profile</div>
              </div>
            </div>
            <div style={{ width: 48, height: 28, borderRadius: 14, background: form.accepting_students ? '#4f46e5' : '#e2e8f0', position: 'relative', transition: 'background .2s', flexShrink: 0 }}>
              <div style={{ position: 'absolute', top: 4, left: form.accepting_students ? 24 : 4, width: 20, height: 20, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,.22)', transition: 'left .2s' }} />
            </div>
          </div>
        </div>
      </Section>

      {/* ══ Academic Qualifications ════════════════════ */}
      <Section
        icon={<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 1L1 5.5l8 4.5 8-4.5L9 1z" stroke="#4f46e5" strokeWidth="1.4" strokeLinejoin="round" /><path d="M5 7.5V13c0 2 1.8 3.5 4 3.5s4-1.5 4-3.5V7.5" stroke="#4f46e5" strokeWidth="1.4" strokeLinecap="round" /></svg>}
        title="Academic Qualifications"
        action={<AddBtn onClick={() => setQuals(q => [...q, { degree: '', institution: '', year: '', division: '', cgpa: '' }])} />}
      >
        <EditTable
          cols={[
            { key: 'degree', label: 'Degree', flex: 2.5, ph: 'e.g. Ph.D. in CS' },
            { key: 'institution', label: 'Institution', flex: 2, ph: 'University name' },
            { key: 'year', label: 'Year', flex: 0.8, ph: 'YYYY' },
            { key: 'division', label: 'Division', flex: 1.2, ph: 'First / Dist.' },
            { key: 'cgpa', label: 'CGPA', flex: 1.2, ph: '4.0/4.0', mono: true },
          ]}
          rows={quals} setRows={setQuals}
        />
      </Section>

      {/* ══ Publications + Links ════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 18 }}>
        <Section
          icon={<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M4 1h10a1 1 0 011 1v14a1 1 0 01-1 1H4a1 1 0 01-1-1V2a1 1 0 011-1z" stroke="#4f46e5" strokeWidth="1.4" /><path d="M6 5h6M6 8h6M6 11h4" stroke="#4f46e5" strokeWidth="1.3" strokeLinecap="round" /></svg>}
          title="Journal Publications" badge="SCI / Scopus"
          action={<AddBtn onClick={() => setPubs(p => [...p, { title: '', journal: '', year: '', doi: '' }])} />}
        >
          <EditTable
            cols={[
              { key: 'title', label: 'Title', flex: 3, ph: 'Paper title' },
              { key: 'journal', label: 'Journal', flex: 2, ph: 'Journal / Conference' },
              { key: 'year', label: 'Year', flex: 0.6, ph: 'YYYY' },
              { key: 'doi', label: 'DOI', flex: 1.5, ph: 'doi:xx.xxxx', mono: true },
            ]}
            rows={pubs} setRows={setPubs} emptyMsg="No publications yet. Click Add Row."
          />
        </Section>

        <Section
          icon={<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M7 11a4 4 0 006 0l2-2a4 4 0 00-6-5.66L8 4.5" stroke="#4f46e5" strokeWidth="1.4" strokeLinecap="round" /><path d="M11 7a4 4 0 00-6 0L3 9a4 4 0 006 5.66l1-1" stroke="#4f46e5" strokeWidth="1.4" strokeLinecap="round" /></svg>}
          title="Academic Links"
          action={<AddBtn onClick={() => setAcademicLinks(ll => [...ll, { label: '', url: '' }])} label="Add Link" />}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {academicLinks.map((l, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 9a3 3 0 004.4 0l1.6-1.6a3 3 0 00-4.4-4.1L5.5 4.5" stroke="#4f46e5" strokeWidth="1.2" strokeLinecap="round" /><path d="M9 5a3 3 0 00-4.4 0L3 6.6a3 3 0 004.4 4.1l1-1" stroke="#4f46e5" strokeWidth="1.2" strokeLinecap="round" /></svg>
                </div>
                <div style={{ flex: 0.6 }}>
                  <div style={{ ...f(9, 700, '13px', '#94a3b8'), textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4 }}>Platform Name</div>
                  <input value={l.label} placeholder="e.g. LinkedIn"
                    style={{ ...f(13, 600, '18px', '#0f172a'), background: 'transparent', border: 'none', borderBottom: '1px solid #e2e8f0', outline: 'none', width: '100%', paddingBottom: 2 }}
                    onFocus={e => e.target.style.borderBottomColor = '#4f46e5'} onBlur={e => e.target.style.borderBottomColor = '#e2e8f0'}
                    onChange={e => setAcademicLinks(ll => ll.map((x, j) => j === i ? { ...x, label: e.target.value } : x))}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ ...f(9, 700, '13px', '#94a3b8'), textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4 }}>URL</div>
                  <input value={l.url} placeholder="https://"
                    style={{ ...f(13, 400, '18px', '#4f46e5'), background: 'transparent', border: 'none', borderBottom: '1px solid #e2e8f0', outline: 'none', width: '100%', paddingBottom: 2 }}
                    onFocus={e => e.target.style.borderBottomColor = '#4f46e5'} onBlur={e => e.target.style.borderBottomColor = '#e2e8f0'}
                    onChange={e => setAcademicLinks(ll => ll.map((x, j) => j === i ? { ...x, url: e.target.value } : x))}
                  />
                </div>
                <div style={{ paddingBottom: 4 }}><Trash onClick={() => setAcademicLinks(ll => ll.filter((_, j) => j !== i))} /></div>
              </div>
            ))}
            {academicLinks.length === 0 && (
              <div style={{ textAlign: 'center', padding: '16px', border: '1px dashed #e2e8f0', borderRadius: 12, ...f(12, 500, '18px', '#94a3b8') }}>
                No active links.
              </div>
            )}
          </div>
        </Section>
      </div>

      {/* ══ Awards ════════════════════════════════════ */}
      <Section
        icon={<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 1l2 6h6l-5 3.5 2 6L9 13l-5 3.5 2-6L1 7h6L9 1z" stroke="#4f46e5" strokeWidth="1.4" strokeLinejoin="round" /></svg>}
        title="Awards & Achievements"
        action={<AddBtn onClick={() => setAwards(a => [...a, { title: '', org: '', year: '', description: '' }])} />}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {awards.map((aw, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 0.7fr 2.5fr 28px', gap: 12, alignItems: 'start', padding: '14px 16px', border: '1px solid #f1f5f9', borderRadius: 14, background: i % 2 === 0 ? '#fafbfc' : '#fff' }}>
              {[
                { val: aw.title || '', key: 'title', ph: 'Award Title', label: 'TITLE' },
                { val: aw.org || '', key: 'org', ph: 'Awarding Body', label: 'Organisation' },
                { val: aw.year || '', key: 'year', ph: 'YYYY', label: 'Year' },
                { val: aw.description || '', key: 'description', ph: 'Short description', label: 'Description' },
              ].map((c, ci) => (
                <div key={ci}>
                  <div style={{ ...f(9, 700, '13px', '#94a3b8'), textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4 }}>{c.label}</div>
                  <input value={c.val} placeholder={c.ph}
                    style={{ ...f(13, 400, '18px', '#0f172a'), background: 'transparent', border: 'none', borderBottom: '1px solid transparent', outline: 'none', paddingBottom: 2, width: '100%', transition: 'border-color .14s' }}
                    onFocus={e => e.target.style.borderBottomColor = '#4f46e5'} onBlur={e => e.target.style.borderBottomColor = 'transparent'}
                    onChange={e => setAwards(as => as.map((x, j) => j === i ? { ...x, [c.key]: e.target.value } : x))}
                  />
                </div>
              ))}
              <div style={{ paddingTop: 18 }}><Trash onClick={() => setAwards(as => as.filter((_, j) => j !== i))} /></div>
            </div>
          ))}
          {awards.length === 0 && <div style={{ ...f(13, 400, '18px', '#94a3b8'), textAlign: 'center', padding: '10px 0' }}>No awards added.</div>}
        </div>
      </Section>

      {/* ══ Timetable ════════════════════════════════ */}
      <Section
        icon={<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="1" y="2" width="16" height="15" rx="2" stroke="#4f46e5" strokeWidth="1.4" /><path d="M5 1v3M13 1v3M1 7h16" stroke="#4f46e5" strokeWidth="1.4" strokeLinecap="round" /></svg>}
        title="Weekly Teaching Timetable"
        action={<AddBtn onClick={() => setTimetable(t => [...t, { day: '', time: '', course: '', location: '', type: '' }])} />}
      >
        <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
          {[{ type: 'Lecture', bg: '#eef2ff', color: '#4f46e5' }, { type: 'Lab', bg: '#f0fdf4', color: '#16a34a' }, { type: 'Tutorial', bg: '#fefce8', color: '#ca8a04' }, { type: 'Meeting', bg: '#f8fafc', color: '#64748b' }].map(t => (
            <span key={t.type} style={{ ...f(11, 600, '15px', t.color), background: t.bg, padding: '3px 10px', borderRadius: 20 }}>{t.type}</span>
          ))}
        </div>
        <EditTable
          cols={[
            { key: 'day', label: 'Day', flex: 1, ph: 'Select Day', options: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] },
            {
              key: 'time', label: 'Time (12 hr)', flex: 1.8, ph: 'Select Slot', options: [
                '08:00 AM - 08:50 AM', '08:50 AM - 09:40 AM', '09:40 AM - 10:30 AM', '10:30 AM - 11:20 AM',
                '11:20 AM - 12:10 PM', '12:10 PM - 01:00 PM', '01:00 PM - 01:50 PM', '01:50 PM - 02:40 PM',
                '02:40 PM - 03:30 PM', '03:30 PM - 04:20 PM', '04:20 PM - 05:10 PM', '05:10 PM - 06:00 PM',
                '06:00 PM - 06:30 PM'
              ]
            },
            { key: 'course', label: 'Course', flex: 2, ph: 'CS101: Intro' },
            { key: 'location', label: 'Location', flex: 1.5, ph: 'Room 402' },
            { key: 'type', label: 'Type', flex: 1, ph: 'Select Type', options: ['Lecture', 'Lab', 'Tutorial', 'Meeting', 'Open Session'] },
          ]}
          rows={timetable} setRows={setTimetable} emptyMsg="No classes added. Click Add Row."
        />
      </Section>

      {/* ══ Save footer ════════════════════════════════ */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingBottom: 16 }}>
        <button onClick={saveAll} disabled={saving} style={{ padding: '13px 40px', borderRadius: 40, border: 'none', cursor: saving ? 'default' : 'pointer', background: saving ? '#6366f1' : '#4f46e5', ...f(14, 700, '20px', '#fff'), boxShadow: '0 2px 12px rgba(79,70,229,.25)', transition: 'background .2s', opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Saving…' : 'Save All Changes'}
        </button>
      </div>
    </PageLayout>
  )
}
