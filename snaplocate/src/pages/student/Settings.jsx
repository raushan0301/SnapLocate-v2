import { useState, useEffect, useRef } from 'react'
import PageLayout from '../../components/PageLayout'
import { useAuth } from '../../context/AuthContext'
import api from '../../lib/api'
import Modal from '../../components/admin/Modal'
import {
  User, Shield, Palette, Bell, Camera,
  KeyRound, ShieldCheck, Sun, Moon, Loader2, Globe, Eye, EyeOff
} from 'lucide-react'

function Toast({ msg, type, onClose }) {
  if (!msg) return null
  return (
    <div
      className={`fixed bottom-8 right-8 z-[9999] px-5 py-3.5 rounded-2xl flex items-center gap-2.5 text-white shadow-[0_8px_32px_rgba(0,0,0,0.18)] t-md font-semibold ${type === 'success' ? 'bg-success' : 'bg-danger'}`}
      style={{ animation: 'slideUp 0.3s ease-out' }}
    >
      <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">{type === 'success' ? '✓' : '!'}</div>
      <span>{msg}</span>
      <button onClick={onClose} className="bg-none border-none text-white cursor-pointer ml-2.5 opacity-70 text-base">×</button>
    </div>
  )
}

function SectionHeading({ icon, title }) {
  return (
    <div className="flex items-center gap-3 mb-7">
      <div className="flex items-center justify-center">{icon}</div>
      <span className="t-heading-lg t-primary">{title}</span>
    </div>
  )
}

function Toggle({ on, onChange }) {
  return (
    <div onClick={() => onChange(!on)} className="relative cursor-pointer shrink-0 transition-colors" style={{ width: 44, height: 24, borderRadius: 12, background: on ? '#4f46e5' : '#e2e8f0' }}>
      <div className="absolute top-[3px] w-[18px] h-[18px] rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.15)] transition-[left] duration-200" style={{ left: on ? 23 : 3 }} />
    </div>
  )
}

function Checkbox({ checked, onChange }) {
  return (
    <div
      onClick={() => onChange(!checked)}
      className={`w-[22px] h-[22px] rounded-md cursor-pointer shrink-0 flex items-center justify-center transition-all border-[1.5px] ${checked ? 'bg-brand border-brand' : 'bg-white border-slate-300'}`}
    >
      {checked && (
        <svg width="12" height="9" viewBox="0 0 12 9" fill="none">
          <path d="M1 4.5L4.5 8L11 1.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  )
}

export default function SettingsPage() {
  const { user, updateUser } = useAuth()
  const fileInputRef = useRef(null)

  const [profile, setProfile] = useState({
    firstName: user?.full_name?.split(' ')[0] || '',
    lastName:  user?.full_name?.split(' ').slice(1).join(' ') || '',
    email:     user?.email || '',
    avatar_url: user?.avatar_url || ''
  })
  const [prefs, setPrefs] = useState({
    theme: 'light', language: 'English', timezone: 'Asia/Kolkata (IST)',
    push_notifs: true, email_notifs: true, weekly_analytics: false
  })
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [uploading, setUploading] = useState(false)
  const [savingPwd, setSavingPwd] = useState(false)
  const [pwModal, setPwModal]     = useState(false)
  const [pwForm, setPwForm]       = useState({ current: '', next: '', confirm: '' })
  const [pwError, setPwError]     = useState('')
  const [showPwd, setShowPwd]     = useState({ current: false, next: false, confirm: false })
  const [toast, setToast]         = useState({ msg: '', type: 'success' })

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast({ msg: '', type: 'success' }), 4000)
  }

  useEffect(() => {
    const fetchFullProfile = async () => {
      try {
        const res = await api.get('/api/users/profile')
        if (res.success && res.data) {
          const u = res.data
          setProfile({ firstName: u.full_name?.split(' ')[0] || '', lastName: u.full_name?.split(' ').slice(1).join(' ') || '', email: u.email, avatar_url: u.avatar_url || '' })
          if (u.preferences) setPrefs(p => ({ ...p, ...u.preferences }))
        }
      } catch (err) { console.error('Failed to fetch profile:', err) }
      finally { setLoading(false) }
    }
    fetchFullProfile()
  }, [])

  const handleProfileSave = async (e) => {
    if (e) e.preventDefault()
    setSaving(true)
    try {
      const full_name = `${profile.firstName} ${profile.lastName}`.trim()
      const res = await api.patch('/api/users/profile', { full_name })
      if (res.success) { updateUser({ full_name }); showToast('Profile updated!') }
    } catch (err) { showToast(err.message, 'error') }
    finally { setSaving(false) }
  }

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0]; if (!file) return
    setUploading(true)
    try {
      const formData = new FormData(); formData.append('file', file); formData.append('type', 'avatar')
      const uploadRes = await api.upload('/api/upload/image', formData)
      if (!uploadRes.success) throw new Error('Upload failed')
      const newUrl = uploadRes.url
      const profileRes = await api.patch('/api/users/profile', { avatar_url: newUrl })
      if (!profileRes.success) throw new Error('Profile update failed')
      setProfile(s => ({ ...s, avatar_url: newUrl })); updateUser({ avatar_url: newUrl }); showToast('Avatar updated!')
    } catch (err) { showToast(`Error uploading image: ${err.message}`, 'error') }
    finally { setUploading(false) }
  }

  const handlePrefChange = async (key, value) => {
    const prev = { ...prefs }
    const nextPrefs = { ...prefs, [key]: value }
    setPrefs(nextPrefs)
    try { await api.put('/api/users/preferences', { preferences: nextPrefs }); showToast('Preferences updated!') }
    catch (err) { console.error('Failed to sync preferences:', err); setPrefs(prev); showToast('Failed to save preference', 'error') }
  }

  const handlePasswordUpdate = async (e) => {
    e.preventDefault(); setPwError('')
    if (pwForm.current === pwForm.next) return setPwError('New password cannot be the same as current password')
    if (pwForm.next !== pwForm.confirm) return setPwError('Passwords do not match')
    if (pwForm.next.length < 8) return setPwError('Password must be at least 8 characters')
    setSavingPwd(true)
    try {
      const res = await api.put('/api/users/password', { current_password: pwForm.current, new_password: pwForm.next })
      if (res.success) { showToast('Password updated successfully!'); setPwModal(false); setPwForm({ current: '', next: '', confirm: '' }) }
    } catch (err) { setPwError(err.message || 'Update failed') }
    finally { setSavingPwd(false) }
  }

  const closePwModal = () => {
    setPwModal(false); setPwError(''); setPwForm({ current: '', next: '', confirm: '' })
    setShowPwd({ current: false, next: false, confirm: false })
  }

  if (loading) return <PageLayout><div className="text-center py-24 t-base t-subtle">Loading settings...</div></PageLayout>

  return (
    <PageLayout>
      <Toast msg={toast.msg} type={toast.type} onClose={() => setToast({ msg: '', type: 'success' })} />

      <div className="mb-8">
        <h1 className="t-heading-3xl t-primary">Settings</h1>
        <p className="t-lg t-secondary mt-0.5">Manage your account preferences, security settings, and notifications.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">

        {/* Left column */}
        <div className="flex flex-col gap-5">

          {/* Profile card */}
          <div className="card p-7">
            <SectionHeading title="User Profile" icon={<User size={20} color="#4f46e5" strokeWidth={2.5} />} />
            <div className="flex gap-7 items-start flex-col sm:flex-row">
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="w-[104px] h-[104px] rounded-full overflow-hidden border-4 border-white shadow-[0_4px_12px_rgba(0,0,0,0.08)] bg-gradient-to-br from-brand-light to-surface-muted flex items-center justify-center">
                  {uploading ? (
                    <Loader2 size={32} color="#4f46e5" className="animate-spin" />
                  ) : profile.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-brand to-violet-600 flex items-center justify-center text-white text-4xl font-bold">
                      {profile.firstName[0]}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0.5 right-0.5 w-8 h-8 rounded-full bg-brand border-[2.5px] border-white flex items-center justify-center cursor-pointer shadow-[0_2px_4px_rgba(0,0,0,0.1)] transition-transform hover:scale-110"
                >
                  <Camera size={14} color="white" />
                </button>
                <input type="file" ref={fileInputRef} onChange={handleAvatarChange} accept="image/*" className="hidden" />
              </div>

              {/* Form */}
              <div className="flex-1 flex flex-col gap-[18px]">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="text-[12px] font-semibold t-secondary uppercase tracking-[0.05em] block mb-2">First Name</label>
                    <input className="input" value={profile.firstName} onChange={e => setProfile({ ...profile, firstName: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-[12px] font-semibold t-secondary uppercase tracking-[0.05em] block mb-2">Last Name</label>
                    <input className="input" value={profile.lastName} onChange={e => setProfile({ ...profile, lastName: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="text-[12px] font-semibold t-secondary uppercase tracking-[0.05em] block mb-2">Email Address</label>
                  <input className="input bg-surface t-secondary" value={profile.email} disabled />
                </div>
                <div className="flex justify-end mt-2">
                  <button onClick={handleProfileSave} disabled={saving}
                    className="px-8 py-3 bg-brand text-white rounded-2xl border-none cursor-pointer t-heading-md transition-colors hover:bg-brand-dark disabled:bg-slate-300 disabled:cursor-not-allowed">
                    {saving ? 'Syncing...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Security card */}
          <div className="card p-7">
            <SectionHeading title="Security & Access" icon={<Shield size={20} color="#4f46e5" strokeWidth={2.5} />} />

            <div className="bg-surface border border-slate-100 rounded-2xl px-6 py-5 flex items-center gap-5 mb-4">
              <div className="w-11 h-11 rounded-xl bg-brand-light flex items-center justify-center shrink-0">
                <KeyRound size={20} color="#4f46e5" />
              </div>
              <div className="flex-1">
                <div className="t-base font-bold t-primary">Reset Password</div>
                <div className="t-md t-secondary">Change your password to keep your account secure.</div>
              </div>
              <button onClick={() => setPwModal(true)}
                className="px-5 py-3 bg-white border border-ink-border rounded-xl cursor-pointer t-md font-bold t-primary transition-colors hover:border-brand">
                Update Password
              </button>
            </div>

            <div className="bg-surface border border-slate-100 rounded-2xl px-6 py-5 flex items-center gap-5">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                <ShieldCheck size={20} color="#10b981" />
              </div>
              <div className="flex-1">
                <div className="t-base font-bold t-primary">Two-Factor Authentication</div>
                <div className="t-md t-secondary">Add an extra layer of security with SMS or App verification.</div>
              </div>
              <Toggle on={true} onChange={() => {}} />
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-5">

          {/* Appearance card */}
          <div className="card p-7">
            <SectionHeading title="Appearance" icon={<Palette size={20} color="#4f46e5" strokeWidth={2.5} />} />
            <p className="t-base t-secondary mb-5">Choose how SnapLocate looks for you.</p>
            <div className="grid grid-cols-2 gap-3.5">
              {[
                { id: 'light', label: 'Light Mode', icon: <Sun size={24} /> },
                { id: 'dark',  label: 'Dark Mode',  icon: <Moon size={24} /> },
              ].map(t => (
                <div key={t.id} onClick={() => handlePrefChange('theme', t.id)}
                  className="py-7 px-4 rounded-2xl cursor-pointer text-center transition-all border-2"
                  style={{
                    border:      `2px solid ${prefs.theme === t.id ? '#4f46e5' : '#e2e8f0'}`,
                    background:  t.id === 'dark' ? '#1a202c' : '#f8fafc',
                    color:       t.id === 'dark' ? '#fff' : '#0f172a',
                  }}
                >
                  <div className={`flex justify-center mb-3 ${prefs.theme === t.id ? 'text-brand' : 't-secondary'}`}>{t.icon}</div>
                  <div className={`t-md font-bold ${prefs.theme === t.id ? (t.id === 'dark' ? 'text-white' : 'text-brand') : 't-secondary'}`}>{t.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Region & Language card */}
          <div className="card p-7">
            <SectionHeading title="Region & Language" icon={<Globe size={20} color="#4f46e5" strokeWidth={2.5} />} />
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-[12px] font-semibold t-secondary uppercase tracking-[0.05em] block mb-2">Language</label>
                <select value={prefs.language} onChange={e => handlePrefChange('language', e.target.value)} className="input cursor-pointer bg-white">
                  <option>English</option><option>Hindi</option><option>Spanish</option><option>French</option>
                </select>
              </div>
              <div>
                <label className="text-[12px] font-semibold t-secondary uppercase tracking-[0.05em] block mb-2">Timezone</label>
                <select value={prefs.timezone} onChange={e => handlePrefChange('timezone', e.target.value)} className="input cursor-pointer bg-white">
                  <option>Asia/Kolkata (IST)</option><option>UTC</option><option>America/New_York</option><option>Europe/London</option>
                </select>
              </div>
            </div>
          </div>

          {/* Notifications card */}
          <div className="card p-7">
            <SectionHeading title="Notifications" icon={<Bell size={20} color="#4f46e5" strokeWidth={2.5} />} />
            <div className="flex flex-col gap-5">
              {[
                { k: 'push_notifs',      title: 'Push Notifications',  desc: 'Real-time alerts on your device' },
                { k: 'email_notifs',     title: 'Email Notifications', desc: 'Summary and critical event emails' },
                { k: 'weekly_analytics', title: 'Weekly Analytics',    desc: 'Detailed weekly usage reports' },
              ].map(n => (
                <div key={n.k} onClick={() => handlePrefChange(n.k, !prefs[n.k])} className="flex items-start gap-3.5 cursor-pointer">
                  <div className="pointer-events-none"><Checkbox checked={prefs[n.k]} onChange={() => {}} /></div>
                  <div className="-mt-0.5">
                    <div className="t-base font-bold t-primary">{n.title}</div>
                    <div className="t-xs t-secondary">{n.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Change password modal */}
      <Modal isOpen={pwModal} onClose={closePwModal} title="Change Password">
        <form onSubmit={handlePasswordUpdate} className="flex flex-col gap-4">
          {pwError && (
            <div className="px-3.5 py-2.5 rounded-lg bg-danger-light border border-danger-border text-danger text-[13px] font-medium flex items-center gap-2">
              <span>⚠️</span> {pwError}
            </div>
          )}
          {[
            { field: 'current', label: 'Current Password' },
            { field: 'next',    label: 'New Password' },
            { field: 'confirm', label: 'Confirm New Password' },
          ].map(({ field, label }) => (
            <div key={field}>
              <label className="text-[12px] font-semibold t-secondary uppercase tracking-[0.05em] block mb-2">{label}</label>
              <div className="relative">
                <input
                  type={showPwd[field] ? 'text' : 'password'} required
                  value={pwForm[field]}
                  onChange={e => setPwForm({ ...pwForm, [field]: e.target.value })}
                  className="input pr-11"
                  style={field === 'confirm' && pwForm.confirm && pwForm.next && pwForm.confirm !== pwForm.next ? { borderColor: '#ef4444' } : {}}
                />
                <button type="button" onClick={() => setShowPwd({ ...showPwd, [field]: !showPwd[field] })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-none border-none cursor-pointer t-subtle flex items-center">
                  {showPwd[field] ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {field === 'confirm' && pwForm.confirm && pwForm.next && pwForm.confirm !== pwForm.next && (
                <p className="text-[11px] text-danger mt-1">Passwords do not match</p>
              )}
            </div>
          ))}
          <div className="mt-5 flex justify-end gap-3.5">
            <button type="button" onClick={() => setPwModal(false)}
              className="px-8 py-3 rounded-2xl border border-ink-border bg-white cursor-pointer t-heading-md t-primary hover:bg-surface transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={savingPwd}
              className="px-8 py-3 rounded-2xl border-none bg-brand text-white cursor-pointer t-heading-md hover:bg-brand-dark transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed">
              {savingPwd ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </Modal>
    </PageLayout>
  )
}
