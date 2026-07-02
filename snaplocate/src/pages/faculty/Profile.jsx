import { useState, useEffect, useRef } from 'react'
import PageLayout from '../../components/PageLayout'
import { useAuth } from '../../context/AuthContext'
import api from '../../lib/api'
import ImageCropper from '../../components/ImageCropper'

function Toast({ msg, type = 'success' }) {
  if (!msg) return null
  return (
    <div className={`fixed bottom-8 right-8 z-[9999] px-6 py-3.5 rounded-[14px] text-white text-[14px] font-semibold flex items-center gap-2.5 shadow-[0_8px_32px_rgba(0,0,0,.18)] ${type === 'success' ? 'bg-green-600' : 'bg-red-500'}`}
      style={{ animation: 'slideUp .3s ease' }}>
      {type === 'success' ? '✓' : '✕'} {msg}
    </div>
  )
}

const fieldBaseCls = 'w-full px-[18px] py-3 border border-slate-200 bg-slate-50 text-[14px] text-slate-900 outline-none box-border transition-[border-color,box-shadow] focus:border-brand focus:shadow-[0_0_0_3px_rgba(79,70,229,.07)]'

function Field({ label, value, onChange, placeholder, type = 'text', span2, multiline, rows = 4 }) {
  return (
    <div className="flex flex-col gap-[7px]" style={{ gridColumn: span2 ? '1 / -1' : undefined }}>
      <label className="text-[12px] font-semibold text-slate-600">{label}</label>
      {multiline
        ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
            rows={rows} className={`${fieldBaseCls} rounded-2xl resize-y`} />
        : <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
            className={`${fieldBaseCls} rounded-full`} />
      }
    </div>
  )
}

function Section({ icon, title, badge, children, action }) {
  return (
    <div className="bg-white border border-slate-100 rounded-[18px] px-[30px] py-[26px] shadow-[0_1px_6px_rgba(0,0,0,.05)]">
      <div className="flex items-center justify-between mb-[22px]">
        <div className="flex items-center gap-2.5">
          {icon}
          <span className="text-[15px] font-bold t-primary">{title}</span>
          {badge && <span className="text-[10px] font-bold text-brand bg-indigo-50 px-2.5 py-[3px] rounded-[20px] tracking-[.06em]">{badge}</span>}
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

function AddBtn({ onClick, label = 'Add Row' }) {
  return (
    <button onClick={onClick} className="flex items-center gap-1.5 bg-transparent border-none cursor-pointer text-[12px] font-bold text-brand">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6.5" stroke="#4f46e5" strokeWidth="1.1" /><path d="M7 4v6M4 7h6" stroke="#4f46e5" strokeWidth="1.2" strokeLinecap="round" /></svg>
      {label}
    </button>
  )
}

const Trash = ({ onClick }) => (
  <button onClick={onClick}
    className="w-7 h-7 rounded-lg border-none bg-transparent cursor-pointer flex items-center justify-center shrink-0 hover:bg-red-50 transition-colors">
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 3h9M4 3V2h5v1M5 5.5v4M8 5.5v4M3 3l.5 8a1 1 0 001 1h4a1 1 0 001-1L10 3" stroke="#ef4444" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" /></svg>
  </button>
)

const inlineInputCls = 'text-[13px] font-normal t-primary bg-transparent border-0 border-b border-b-transparent outline-none pb-[1px] w-full transition-colors focus:border-b-brand'
const inlineInputMonoCls = 'font-mono text-[13px] text-brand bg-transparent border-0 border-b border-b-transparent outline-none pb-[1px] w-full transition-colors focus:border-b-brand'
const inlineSelectCls = 'text-[13px] font-medium t-primary bg-transparent border-0 border-b border-b-transparent outline-none pb-[1px] w-full transition-colors focus:border-b-brand cursor-pointer'

function EditTable({ cols, rows, setRows, emptyMsg = 'No entries yet. Click Add Row.' }) {
  const update = (rowIdx, colKey, val) =>
    setRows(rs => rs.map((r, i) => i === rowIdx ? { ...r, [colKey]: val } : r))
  const colFr = cols.map(c => `${c.flex || 1}fr`).join(' ') + ' 36px'
  return (
    <div className="border border-slate-100 rounded-xl overflow-hidden">
      <div className="bg-slate-50 border-b border-slate-100 px-4 py-[9px] grid gap-2"
        style={{ gridTemplateColumns: colFr }}>
        {cols.map(c => <span key={c.key} className="text-[10px] font-bold text-brand uppercase tracking-[.08em]">{c.label}</span>)}
        <span />
      </div>
      {rows.length === 0 && <div className="px-4 py-[18px] text-[13px] text-slate-400 text-center">{emptyMsg}</div>}
      {rows.map((row, ri) => (
        <div key={ri} className={`grid px-4 py-3 gap-2 items-center ${ri > 0 ? 'border-t border-slate-50' : ''}`}
          style={{ gridTemplateColumns: colFr }}>
          {cols.map(c => (
            c.options ? (
              <select key={c.key} value={row[c.key] || ''} onChange={e => update(ri, c.key, e.target.value)}
                className={inlineSelectCls}>
                <option value="" disabled>{c.ph || c.label}</option>
                {c.options.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : (
              <input key={c.key} value={row[c.key] || ''} placeholder={c.ph || c.label}
                className={c.mono ? inlineInputMonoCls : inlineInputCls}
                onChange={e => update(ri, c.key, e.target.value)} />
            )
          ))}
          <Trash onClick={() => setRows(rs => rs.filter((_, i) => i !== ri))} />
        </div>
      ))}
    </div>
  )
}

export default function FacultyProfile() {
  const { user, updateUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [toast,   setToast]   = useState(null)
  const [profileId, setProfileId] = useState(null)

  const [form, setForm] = useState({
    designation: '', dept: '', teacher_code: '', phone: '',
    dept_website: '', linkedin: '', bio: '',
    cabin_room: '', cabin_building: '', cabin_floor: '', campus_section: '',
    research_interests: '', lab_name: '', lab_website: '',
    accepting_students: true,
    citations: '', publications_count: '', conferences: '', teaching_exp_years: '',
  })

  const [quals,         setQuals]         = useState([])
  const [pubs,          setPubs]          = useState([])
  const [awards,        setAwards]        = useState([])
  const [timetable,     setTimetable]     = useState([])
  const [visiting,      setVisiting]      = useState([])
  const [academicLinks, setAcademicLinks] = useState([])

  const avatarRef    = useRef()
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [cropSrc,    setCropSrc]    = useState(null)
  const [avatarFile, setAvatarFile] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/api/faculty/me/profile')
        const d = res.data
        if (d) {
          setProfileId(d.id)
          updateUser({ ...user, full_name: d.full_name || user?.full_name, avatar_url: d.avatar_url || user?.avatar_url, is_verified: !!d.is_verified })
          setForm({
            designation: d.designation || '', dept: d.dept || '',
            teacher_code: d.teacher_code || '', phone: d.phone || '',
            dept_website: d.dept_website || '', linkedin: d.linkedin || '',
            bio: d.bio || '', cabin_room: d.cabin_room || '',
            cabin_building: d.cabin_building || '', cabin_floor: d.cabin_floor || '',
            campus_section: d.campus_section || '',
            research_interests: Array.isArray(d.research_interests) ? d.research_interests.join(', ') : (d.research_interests || ''),
            lab_name: d.lab_name || '', lab_website: d.lab_website || '',
            accepting_students: !!d.accepting_students,
            citations: d.citations || '', publications_count: d.publications_count || '',
            conferences: d.conferences || '', teaching_exp_years: d.teaching_exp_years || '',
          })
          setQuals(d.qualifications || [])
          setPubs((d.publications || []).map(p => ({ ...p, link: p.doi || p.link })))
          setAwards(d.awards || [])
          setTimetable((d.timetable || []).map(t => ({ ...t, time: t.time_slot || t.time })))
          setVisiting((d.office_hours || []).map(v => ({ ...v, room: v.room_or_link || v.room })))
          setAcademicLinks(d.academic_links?.length > 0 ? d.academic_links : [
            { label: 'LinkedIn', url: d.linkedin || '' },
            { label: 'Dept Website', url: d.dept_website || '' },
            { label: 'Lab Website', url: d.lab_website || '' },
          ])
        }
      } catch (err) { console.error('Could not load profile:', err) }
      finally { setLoading(false) }
    }
    load()
  }, [])

  const set = key => val => setForm(f => ({ ...f, [key]: val }))

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3000)
  }

  const saveAll = async () => {
    setSaving(true)
    try {
      let newAvatarUrl
      if (avatarFile) {
        const formData = new FormData(); formData.append('file', avatarFile); formData.append('type', 'avatar')
        const uploadRes = await api.upload('/api/upload/image', formData)
        if (uploadRes.success) newAvatarUrl = uploadRes.url
      }
      if (newAvatarUrl || form.full_name) {
        await api.patch('/api/users/profile', { full_name: form.full_name, ...(newAvatarUrl && { avatar_url: newAvatarUrl }) })
      }
      await api.put('/api/faculty/me/profile', {
        ...form,
        research_interests: form.research_interests.split(',').map(s => s.trim()).filter(Boolean),
        academic_links: academicLinks.filter(l => l.label || l.url),
      })
      if (profileId) {
        await api.put('/api/faculty/me/qualifications', { items: quals.filter(q => q.degree) })
        await api.put('/api/faculty/me/publications', { items: pubs.filter(p => p.title) })
        await api.put('/api/faculty/me/awards', { items: awards.filter(a => a.title) })
        if (timetable.length > 0) await api.put('/api/faculty/me/timetable', { slots: timetable.filter(t => t.day).map(t => ({ ...t, time_slot: t.time })) })
        if (visiting.length > 0) await api.put('/api/faculty/me/office-hours', { hours: visiting.filter(v => v.day).map(v => ({ ...v, room_or_link: v.room })) })
      }
      updateUser({ full_name: user?.full_name, ...(newAvatarUrl && { avatar_url: newAvatarUrl }) })
      showToast('Profile saved successfully!')
    } catch (err) {
      console.error('Save error:', err); showToast(err.message || 'Failed to save profile', 'error')
    } finally { setSaving(false) }
  }

  const handleCropComplete = (blob) => {
    setAvatarFile(new File([blob], 'avatar.jpg', { type: 'image/jpeg' }))
    setAvatarPreview(URL.createObjectURL(blob))
    setCropSrc(null)
  }

  const initials = (user?.full_name || 'FA').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  if (loading) {
    return (
      <PageLayout>
        <div className="flex flex-col gap-5">
          {[260, 180, 200, 340, 280].map((h, i) => (
            <div key={i} className="bg-white rounded-[18px] border border-slate-100 animate-pulse"
              style={{ height: h }} />
          ))}
        </div>
      </PageLayout>
    )
  }

  const TIME_SLOTS = [
    '08:00 AM - 08:50 AM','08:50 AM - 09:40 AM','09:40 AM - 10:30 AM','10:30 AM - 11:20 AM',
    '11:20 AM - 12:10 PM','12:10 PM - 01:00 PM','01:00 PM - 01:50 PM','01:50 PM - 02:40 PM',
    '02:40 PM - 03:30 PM','03:30 PM - 04:20 PM','04:20 PM - 05:10 PM','05:10 PM - 06:00 PM',
    '06:00 PM - 06:30 PM'
  ]

  return (
    <PageLayout>
      {cropSrc && <ImageCropper imageSrc={cropSrc} onCropComplete={handleCropComplete} onCancel={() => setCropSrc(null)} />}
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* Header */}
      <div className="bg-white border border-slate-100 rounded-[18px] px-8 py-[26px] shadow-[0_1px_6px_rgba(0,0,0,.05)] flex items-center gap-[26px]">
        <div className="relative shrink-0">
          <div className="w-[90px] h-[90px] rounded-full flex items-center justify-center overflow-hidden shadow-[0_4px_20px_rgba(79,70,229,.28)] bg-gradient-to-br from-indigo-600 to-violet-700">
            {(avatarPreview || user?.avatar_url)
              ? <img src={avatarPreview || user?.avatar_url} alt={user?.full_name} className="w-full h-full object-cover" />
              : <span className="text-[26px] font-extrabold text-white">{initials}</span>
            }
          </div>
          <button onClick={() => avatarRef.current?.click()}
            className="absolute bottom-0.5 right-0.5 w-7 h-7 rounded-full bg-white border-2 border-indigo-200 shadow-[0_2px_8px_rgba(0,0,0,.14)] flex items-center justify-center cursor-pointer"
            title="Change photo">
            <svg width="13" height="12" viewBox="0 0 13 12" fill="none"><path d="M5 1.5H8L9.5 3H12a.5.5 0 01.5.5v7a.5.5 0 01-.5.5H1a.5.5 0 01-.5-.5v-7A.5.5 0 011 3h2.5L5 1.5z" stroke="#4f46e5" strokeWidth="1" strokeLinejoin="round" /><circle cx="6.5" cy="6.5" r="2" stroke="#4f46e5" strokeWidth="1" /></svg>
          </button>
          <input ref={avatarRef} type="file" accept="image/*" className="hidden"
            onChange={e => { const f = e.target.files[0]; if (f) { setCropSrc(URL.createObjectURL(f)); e.target.value = '' } }} />
        </div>

        <div className="flex-1">
          <h1 className="text-[22px] font-extrabold t-primary">{user?.full_name || 'Profile Information'}</h1>
          <p className="text-[13px] text-slate-500 mt-1 mb-3.5">Update your public presence and contact details.</p>
          <div className="flex gap-2 flex-wrap items-center">
            {form.dept && <span className="text-[10px] font-bold text-brand bg-indigo-50 px-3 py-[5px] rounded-[20px] uppercase tracking-[.06em]">{form.dept}</span>}
            {user?.is_verified ? (
              <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-3 py-[5px] rounded-[20px] uppercase tracking-[.06em] flex items-center gap-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L14.8 5.4L19.2 6L19.8 10.4L23 13L20 16L19.8 20.4L15.4 21L12 24L8.6 21L4.2 20.4L4 16L1 13L4.2 10.4L4.8 6L9.2 5.4L12 2Z" fill="#10b981" />
                  <path d="M8.5 12.5L10.5 14.5L15.5 9.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Verified
              </span>
            ) : (
              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-3 py-[5px] rounded-[20px] uppercase tracking-[.06em]">Pending Verification</span>
            )}
            {form.accepting_students && <span className="text-[10px] font-bold text-violet-600 bg-violet-50 px-3 py-[5px] rounded-[20px] uppercase tracking-[.06em]">☑ Accepting Students</span>}
          </div>
        </div>

        <button onClick={saveAll} disabled={saving}
          className={`px-7 py-3 rounded-[40px] border-none text-[13px] font-bold text-white shrink-0 shadow-[0_2px_12px_rgba(79,70,229,.25)] transition-all ${saving ? 'bg-indigo-400 cursor-default opacity-70' : 'bg-brand cursor-pointer'}`}>
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3.5">
        {[
          { label: 'ONGOING PROJECTS', key: 'citations', sub: 'Active', subCls: 'text-green-600' },
          { label: 'PUBLICATIONS', key: 'publications_count', sub: 'Peer Reviewed', subCls: 'text-brand' },
          { label: 'CONFERENCES', key: 'conferences', sub: 'Verified', subCls: 'text-sky-500' },
          { label: 'TEACHING EXP.', key: 'teaching_exp_years', sub: 'Years', subCls: 'text-amber-600' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-[0_1px_4px_rgba(0,0,0,.04)]">
            <div className="text-[10px] font-bold uppercase tracking-[.1em] text-slate-400 mb-1.5">{s.label}</div>
            <input type="text" value={form[s.key]} onChange={e => set(s.key)(e.target.value)} placeholder="—"
              className="text-[28px] font-extrabold t-primary border-none outline-none bg-transparent w-full p-0" />
            <div className={`text-[11px] font-semibold mt-1.5 ${s.subCls}`}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Basic & Contact */}
      <Section icon={<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7.5" stroke="#4f46e5" strokeWidth="1.4" /><path d="M9 8v4" stroke="#4f46e5" strokeWidth="1.4" strokeLinecap="round" /><circle cx="9" cy="5.5" r=".8" fill="#4f46e5" /></svg>}
        title="Basic & Contact Details">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Full Name"          value={user?.full_name || ''}    onChange={() => {}}          placeholder="Dr. Your Name" />
          <Field label="Designation"        value={form.designation}         onChange={set('designation')} placeholder="e.g. Professor / HOD" />
          <Field label="Teacher Code"       value={form.teacher_code}        onChange={set('teacher_code')} placeholder="e.g. RAJ" />
          <Field label="Department"         value={form.dept}                onChange={set('dept')}         placeholder="e.g. CSED" />
          <Field label="Phone Extension"    value={form.phone}               onChange={set('phone')}        placeholder="+91 xxxxx xxxxx" />
          <Field label="Portfolio"          value={form.dept_website}        onChange={set('dept_website')} type="url" placeholder="https://..." />
          <Field label="LinkedIn"           value={form.linkedin}            onChange={set('linkedin')}     type="url" placeholder="https://linkedin.com/in/..." />
          <Field label="Professional Bio"   span2 multiline rows={5}
            value={form.bio} onChange={set('bio')} placeholder="Write a short professional bio..." />
        </div>
      </Section>

      {/* Office & Visiting Hours */}
      <Section
        icon={<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 1.5C6.2 1.5 4 3.7 4 6.5c0 4 5 10 5 10s5-6 5-10c0-2.8-2.2-5-5-5z" stroke="#4f46e5" strokeWidth="1.4" strokeLinejoin="round" /><circle cx="9" cy="6.5" r="2" stroke="#4f46e5" strokeWidth="1.3" /></svg>}
        title="Office, Location & Visiting Hours"
        action={<AddBtn onClick={() => setVisiting(v => [...v, { day: '', slot: '', mode: 'In-Person', room: '' }])} label="Add Slot" />}>
        <div className="grid grid-cols-2 gap-8">
          {/* Location */}
          <div className="flex flex-col gap-3.5">
            <div className="text-[11px] font-bold uppercase tracking-[.09em] text-slate-400 mb-0.5">Location Details</div>
            <Field label="Cabin / Office Room" value={form.cabin_room}      onChange={set('cabin_room')}      placeholder="e.g. Room 402" />
            <Field label="Building"            value={form.cabin_building}  onChange={set('cabin_building')}  placeholder="e.g. CS Block" />
            <Field label="Floor"               value={form.cabin_floor}     onChange={set('cabin_floor')}     placeholder="e.g. 4th Floor" />
            <Field label="Campus Section"      value={form.campus_section}  onChange={set('campus_section')}  placeholder="e.g. North Wing" />
            <div className="h-[90px] rounded-[14px] border border-indigo-100 flex items-center justify-center gap-2.5 mt-1 bg-gradient-to-br from-indigo-50 to-green-50">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 2C8.7 2 6 4.7 6 8c0 5.3 6 14 6 14s6-8.7 6-14c0-3.3-2.7-6-6-6z" fill="#4f46e5" opacity=".15" /><path d="M12 2C8.7 2 6 4.7 6 8c0 5.3 6 14 6 14s6-8.7 6-14c0-3.3-2.7-6-6-6z" stroke="#4f46e5" strokeWidth="1.5" /><circle cx="12" cy="8" r="2.5" stroke="#4f46e5" strokeWidth="1.4" /></svg>
              <div>
                <div className="text-[13px] font-bold text-brand">{form.cabin_room || 'Set your room'}</div>
                <div className="text-[11px] text-slate-500">{[form.campus_section, form.cabin_floor].filter(Boolean).join(' · ') || 'Fill location details'}</div>
              </div>
            </div>
          </div>
          {/* Office hours */}
          <div className="flex flex-col gap-3">
            <div className="text-[11px] font-bold uppercase tracking-[.09em] text-slate-400 mb-0.5">Visiting / Office Hours</div>
            {visiting.map((v, i) => (
              <div key={i} className="bg-slate-50 border border-slate-100 rounded-[14px] px-4 py-3">
                <div className="grid gap-2.5 mb-2" style={{ gridTemplateColumns: '1fr 1.4fr' }}>
                  {[
                    { val: v.day || '',  ph: 'Select Day',  label: 'Day',  options: ['Monday','Tuesday','Wednesday','Thursday','Friday'] },
                    { val: v.slot || '', ph: 'Select Slot', label: 'Time', options: TIME_SLOTS },
                  ].map((c, ci) => (
                    <div key={ci}>
                      <div className="text-[10px] font-semibold uppercase tracking-[.06em] text-slate-400 mb-1">{c.label}</div>
                      <select value={c.val} className={inlineSelectCls}
                        onChange={e => setVisiting(vs => vs.map((x, j) => j === i ? { ...x, [ci === 0 ? 'day' : 'slot']: e.target.value } : x))}>
                        <option value="" disabled>{c.ph}</option>
                        {c.options.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
                <div className="grid gap-2.5 items-center" style={{ gridTemplateColumns: '1fr 1.4fr 28px' }}>
                  {[
                    { val: v.mode || '', ph: 'Select Mode', label: 'Mode', options: ['In-Person','Virtual'] },
                    { val: v.room || '', ph: 'Room / Link', label: 'Location' },
                  ].map((c, ci) => (
                    <div key={ci}>
                      <div className="text-[10px] font-semibold uppercase tracking-[.06em] text-slate-400 mb-1">{c.label}</div>
                      {c.options ? (
                        <select value={c.val} className={inlineSelectCls}
                          onChange={e => setVisiting(vs => vs.map((x, j) => j === i ? { ...x, mode: e.target.value } : x))}>
                          <option value="" disabled>{c.ph}</option>
                          {c.options.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      ) : (
                        <input value={c.val} placeholder={c.ph} className={inlineInputCls}
                          onChange={e => setVisiting(vs => vs.map((x, j) => j === i ? { ...x, room: e.target.value } : x))} />
                      )}
                    </div>
                  ))}
                  <div className="pt-4.5"><Trash onClick={() => setVisiting(vs => vs.filter((_, j) => j !== i))} /></div>
                </div>
                <div className="mt-2.5">
                  <span className={`text-[10px] font-bold px-2.5 py-[3px] rounded-[20px] ${(v.mode === 'Virtual' || v.mode === 'virtual') ? 'text-sky-500 bg-sky-50' : 'text-green-600 bg-green-50'}`}>
                    {(v.mode === 'Virtual' || v.mode === 'virtual') ? '🔗 Virtual' : '📍 In-Person'}
                  </span>
                </div>
              </div>
            ))}
            {visiting.length === 0 && (
              <div className="py-6 text-center text-[13px] text-slate-400 border border-dashed border-slate-200 rounded-[14px]">
                No office hours set. Click "Add Slot".
              </div>
            )}
          </div>
        </div>
      </Section>

      {/* Research & Openings */}
      <Section icon={<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2 16l4-4m0 0a5 5 0 117.07-7.07A5 5 0 016 12z" stroke="#4f46e5" strokeWidth="1.4" strokeLinecap="round" /><path d="M13.5 2.5l2 2" stroke="#4f46e5" strokeWidth="1.4" strokeLinecap="round" /></svg>}
        title="Research & Openings">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Research Interests (comma separated)" span2
              value={form.research_interests} onChange={set('research_interests')} placeholder="e.g. Machine Learning, IoT, Cloud" />
            <Field label="Lab / Research Group Name" value={form.lab_name}    onChange={set('lab_name')}    placeholder="e.g. SmartNodes Lab" />
            <Field label="Research Lab Website"      value={form.lab_website} onChange={set('lab_website')} type="url" placeholder="https://..." />
          </div>
          {/* Accepting students toggle */}
          <div onClick={() => set('accepting_students')(!form.accepting_students)}
            className="flex items-center justify-between px-[18px] py-3.5 rounded-[14px] bg-slate-50 border border-indigo-100 cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-[10px] bg-indigo-50 flex items-center justify-center shrink-0">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="6" cy="5" r="3" stroke="#4f46e5" strokeWidth="1.2" /><path d="M2 14c0-3 1.8-5 4-5" stroke="#4f46e5" strokeWidth="1.2" strokeLinecap="round" /><path d="M10 8v6m-2-2l2 2 2-2" stroke="#4f46e5" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
              <div>
                <div className="text-[13px] font-bold t-primary">Currently Accepting Research Students</div>
                <div className="text-[11px] text-slate-500">Toggle to show openings on your public profile</div>
              </div>
            </div>
            <div className={`w-12 h-7 rounded-[14px] relative transition-colors shrink-0 ${form.accepting_students ? 'bg-brand' : 'bg-slate-200'}`}>
              <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,.22)] transition-all ${form.accepting_students ? 'left-6' : 'left-1'}`} />
            </div>
          </div>
        </div>
      </Section>

      {/* Academic Qualifications */}
      <Section icon={<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 1L1 5.5l8 4.5 8-4.5L9 1z" stroke="#4f46e5" strokeWidth="1.4" strokeLinejoin="round" /><path d="M5 7.5V13c0 2 1.8 3.5 4 3.5s4-1.5 4-3.5V7.5" stroke="#4f46e5" strokeWidth="1.4" strokeLinecap="round" /></svg>}
        title="Academic Qualifications"
        action={<AddBtn onClick={() => setQuals(q => [...q, { degree: '', institution: '', year: '', division: '', cgpa: '' }])} />}>
        <EditTable
          cols={[
            { key: 'degree', label: 'Degree', flex: 2.5, ph: 'e.g. Ph.D. in CS' },
            { key: 'institution', label: 'Institution', flex: 2, ph: 'University name' },
            { key: 'year', label: 'Year', flex: 0.8, ph: 'YYYY' },
            { key: 'division', label: 'Division', flex: 1.2, ph: 'First / Dist.' },
            { key: 'cgpa', label: 'CGPA', flex: 1.2, ph: '4.0/4.0', mono: true },
          ]}
          rows={quals} setRows={setQuals} />
      </Section>

      {/* Publications + Links */}
      <div className="grid gap-[18px]" style={{ gridTemplateColumns: '2fr 1fr' }}>
        <Section icon={<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M4 1h10a1 1 0 011 1v14a1 1 0 01-1 1H4a1 1 0 01-1-1V2a1 1 0 011-1z" stroke="#4f46e5" strokeWidth="1.4" /><path d="M6 5h6M6 8h6M6 11h4" stroke="#4f46e5" strokeWidth="1.3" strokeLinecap="round" /></svg>}
          title="Journal Publications"
          action={<AddBtn onClick={() => setPubs(p => [...p, { title: '', journal: '', year: '', link: '' }])} />}>
          <EditTable
            cols={[
              { key: 'title', label: 'Title', flex: 3, ph: 'Paper title' },
              { key: 'journal', label: 'Journal', flex: 2, ph: 'Journal / Conference' },
              { key: 'year', label: 'Year', flex: 0.6, ph: 'YYYY' },
              { key: 'link', label: 'Link', flex: 1.5, ph: 'https://...', mono: true },
            ]}
            rows={pubs} setRows={setPubs} emptyMsg="No publications yet. Click Add Row." />
        </Section>

        <Section icon={<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M7 11a4 4 0 006 0l2-2a4 4 0 00-6-5.66L8 4.5" stroke="#4f46e5" strokeWidth="1.4" strokeLinecap="round" /><path d="M11 7a4 4 0 00-6 0L3 9a4 4 0 006 5.66l1-1" stroke="#4f46e5" strokeWidth="1.4" strokeLinecap="round" /></svg>}
          title="Academic Links"
          action={<AddBtn onClick={() => setAcademicLinks(ll => [...ll, { label: '', url: '' }])} label="Add Link" />}>
          <div className="flex flex-col gap-3">
            {academicLinks.map((l, i) => (
              <div key={i} className="flex items-end gap-2.5">
                <div className="w-[34px] h-[34px] rounded-[10px] bg-indigo-50 flex items-center justify-center shrink-0">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 9a3 3 0 004.4 0l1.6-1.6a3 3 0 00-4.4-4.1L5.5 4.5" stroke="#4f46e5" strokeWidth="1.2" strokeLinecap="round" /><path d="M9 5a3 3 0 00-4.4 0L3 6.6a3 3 0 004.4 4.1l1-1" stroke="#4f46e5" strokeWidth="1.2" strokeLinecap="round" /></svg>
                </div>
                <div className="flex-[0.6]">
                  <div className="text-[9px] font-bold uppercase tracking-[.08em] text-slate-400 mb-1">Platform Name</div>
                  <input value={l.label} placeholder="e.g. LinkedIn"
                    className="text-[13px] font-semibold t-primary bg-transparent border-0 border-b border-b-slate-200 outline-none w-full pb-0.5 focus:border-b-brand transition-colors"
                    onChange={e => setAcademicLinks(ll => ll.map((x, j) => j === i ? { ...x, label: e.target.value } : x))} />
                </div>
                <div className="flex-1">
                  <div className="text-[9px] font-bold uppercase tracking-[.08em] text-slate-400 mb-1">URL</div>
                  <input value={l.url} placeholder="https://"
                    className="text-[13px] text-brand bg-transparent border-0 border-b border-b-slate-200 outline-none w-full pb-0.5 focus:border-b-brand transition-colors"
                    onChange={e => setAcademicLinks(ll => ll.map((x, j) => j === i ? { ...x, url: e.target.value } : x))} />
                </div>
                <div className="pb-1"><Trash onClick={() => setAcademicLinks(ll => ll.filter((_, j) => j !== i))} /></div>
              </div>
            ))}
            {academicLinks.length === 0 && (
              <div className="text-center py-4 border border-dashed border-slate-200 rounded-xl text-[12px] font-medium text-slate-400">No active links.</div>
            )}
          </div>
        </Section>
      </div>

      {/* Awards */}
      <Section icon={<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 1l2 6h6l-5 3.5 2 6L9 13l-5 3.5 2-6L1 7h6L9 1z" stroke="#4f46e5" strokeWidth="1.4" strokeLinejoin="round" /></svg>}
        title="Awards & Achievements"
        action={<AddBtn onClick={() => setAwards(a => [...a, { title: '', org: '', year: '', description: '' }])} />}>
        <div className="flex flex-col gap-3">
          {awards.map((aw, i) => (
            <div key={i} className={`grid gap-3 items-start px-4 py-3.5 border border-slate-100 rounded-[14px] ${i % 2 === 0 ? 'bg-slate-50' : 'bg-white'}`}
              style={{ gridTemplateColumns: '2fr 1.5fr 0.7fr 2.5fr 28px' }}>
              {[
                { val: aw.title || '',       key: 'title',       ph: 'Award Title',    label: 'TITLE' },
                { val: aw.org || '',         key: 'org',         ph: 'Awarding Body',  label: 'Organisation' },
                { val: aw.year || '',        key: 'year',        ph: 'YYYY',           label: 'Year' },
                { val: aw.description || '', key: 'description', ph: 'Short description', label: 'Description' },
              ].map((c, ci) => (
                <div key={ci}>
                  <div className="text-[9px] font-bold uppercase tracking-[.08em] text-slate-400 mb-1">{c.label}</div>
                  <input value={c.val} placeholder={c.ph} className={inlineInputCls}
                    onChange={e => setAwards(as => as.map((x, j) => j === i ? { ...x, [c.key]: e.target.value } : x))} />
                </div>
              ))}
              <div className="pt-4.5"><Trash onClick={() => setAwards(as => as.filter((_, j) => j !== i))} /></div>
            </div>
          ))}
          {awards.length === 0 && <div className="text-[13px] text-slate-400 text-center py-2.5">No awards added.</div>}
        </div>
      </Section>

      {/* Timetable */}
      <Section icon={<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="1" y="2" width="16" height="15" rx="2" stroke="#4f46e5" strokeWidth="1.4" /><path d="M5 1v3M13 1v3M1 7h16" stroke="#4f46e5" strokeWidth="1.4" strokeLinecap="round" /></svg>}
        title="Weekly Teaching Timetable"
        action={<AddBtn onClick={() => setTimetable(t => [...t, { day: '', time: '', course: '', location: '', type: '' }])} />}>
        <div className="flex gap-2.5 mb-3.5 flex-wrap">
          {[
            { type: 'Lecture',  cls: 'text-brand      bg-indigo-50'   },
            { type: 'Lab',      cls: 'text-green-600  bg-green-50'    },
            { type: 'Tutorial', cls: 'text-yellow-600 bg-yellow-50'   },
            { type: 'Meeting',  cls: 'text-slate-500  bg-slate-100'   },
            { type: 'Others',   cls: 'text-fuchsia-600 bg-fuchsia-50' },
          ].map(t => (
            <span key={t.type} className={`text-[11px] font-semibold px-2.5 py-[3px] rounded-[20px] ${t.cls}`}>{t.type}</span>
          ))}
        </div>
        <EditTable
          cols={[
            { key: 'day',      label: 'Day',           flex: 1,   ph: 'Select Day',  options: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'] },
            { key: 'time',     label: 'Time (12 hr)',  flex: 1.8, ph: 'Select Slot', options: TIME_SLOTS },
            { key: 'course',   label: 'Course',        flex: 2,   ph: 'CS101: Intro' },
            { key: 'location', label: 'Location',      flex: 1.5, ph: 'Room 402' },
            { key: 'type',     label: 'Type',          flex: 1,   ph: 'Select Type', options: ['Lecture','Lab','Tutorial','Meeting','Open Session','Others'] },
          ]}
          rows={timetable} setRows={setTimetable} emptyMsg="No classes added. Click Add Row." />
      </Section>

      {/* Save footer */}
      <div className="flex justify-end pb-4">
        <button onClick={saveAll} disabled={saving}
          className={`px-10 py-3.5 rounded-[40px] border-none text-[14px] font-bold text-white shadow-[0_2px_12px_rgba(79,70,229,.25)] transition-all ${saving ? 'bg-indigo-400 cursor-default opacity-70' : 'bg-brand cursor-pointer'}`}>
          {saving ? 'Saving…' : 'Save All Changes'}
        </button>
      </div>
    </PageLayout>
  )
}
