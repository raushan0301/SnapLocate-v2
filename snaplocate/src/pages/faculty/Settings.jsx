import { useState, useEffect, useRef } from 'react'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import { Settings, Save, Lock, CheckCircle, Eye, EyeOff, Camera, Loader } from 'lucide-react'

function Section({ title, children }) {
  return (
    <div style={{ background: '#fff', borderRadius: 20, padding: 28, border: '1px solid #f1f5f9', boxShadow: '0 4px 24px rgba(0,0,0,0.03)' }}>
      <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', margin: '0 0 20px', paddingBottom: 12, borderBottom: '1px solid #f1f5f9' }}>{title}</h3>
      {children}
    </div>
  )
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

export default function FacultySettings() {
  const { user, updateUser } = useAuth()
  const fileInputRef = useRef(null)

  const [displayName, setDisplayName]     = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState(null)

  const [currPwd, setCurrPwd]       = useState('')
  const [newPwd, setNewPwd]         = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [showCurr, setShowCurr]     = useState(false)
  const [showNew, setShowNew]       = useState(false)
  const [savingPwd, setSavingPwd]   = useState(false)

  const [toast, setToast] = useState({ msg: '', type: 'success' })

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast({ msg: '', type: 'success' }), 3000)
  }

  useEffect(() => {
    if (user) setDisplayName(user.full_name || '')
  }, [user])

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Local preview immediately
    const previewUrl = URL.createObjectURL(file)
    setAvatarPreview(previewUrl)
    setUploadingAvatar(true)

    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('type', 'avatar')
      const uploadRes = await api.upload('/api/upload/image', fd)

      if (!uploadRes.url) throw new Error('No URL returned')

      await api.patch('/api/users/profile', { avatar_url: uploadRes.url })
      updateUser({ avatar_url: uploadRes.url })
      showToast('Profile picture updated')
    } catch (err) {
      setAvatarPreview(null)
      showToast(err?.message || 'Failed to upload image', 'error')
    } finally {
      setUploadingAvatar(false)
      // Reset file input so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleSaveProfile = async () => {
    if (!displayName.trim()) return
    setSavingProfile(true)
    try {
      await api.patch('/api/users/profile', { full_name: displayName.trim() })
      updateUser({ full_name: displayName.trim() })
      showToast('Profile updated successfully')
    } catch {
      showToast('Failed to update profile', 'error')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (newPwd !== confirmPwd) return showToast('New passwords do not match', 'error')
    if (newPwd.length < 8)     return showToast('Password must be at least 8 characters', 'error')
    setSavingPwd(true)
    try {
      await api.put('/api/users/password', { current_password: currPwd, new_password: newPwd })
      setCurrPwd(''); setNewPwd(''); setConfirmPwd('')
      showToast('Password changed successfully')
    } catch (err) {
      showToast(err?.message || 'Current password is incorrect', 'error')
    } finally {
      setSavingPwd(false)
    }
  }

  const currentAvatar = avatarPreview || user?.avatar_url
  const initials = (displayName || 'F').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  const inputStyle = {
    width: '100%', padding: '11px 14px',
    borderRadius: 10, border: '1.5px solid #e2e8f0',
    fontSize: 14, outline: 'none', boxSizing: 'border-box',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  }

  return (
    <PageLayout>
      <Toast msg={toast.msg} type={toast.type} />

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleAvatarChange}
      />

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 44, height: 44, borderRadius: 14, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Settings size={22} color="#4f46e5" />
        </div>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#0f172a', margin: 0 }}>Account Settings</h1>
          <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>Manage your profile picture, display name, and account security.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>

        {/* Left — Profile */}
        <Section title="Profile">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Avatar upload */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 4 }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{ width: 68, height: 68, borderRadius: 18, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '2px solid #e2e8f0' }}>
                  {currentAvatar
                    ? <img src={currentAvatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: 24, fontWeight: 700, color: '#4f46e5' }}>{initials}</span>
                  }
                  {uploadingAvatar && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 18 }}>
                      <Loader size={20} color="#fff" style={{ animation: 'spin 1s linear infinite' }} />
                    </div>
                  )}
                </div>
                {/* Camera button overlay */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  title="Change profile picture"
                  style={{
                    position: 'absolute', bottom: -4, right: -4,
                    width: 26, height: 26, borderRadius: '50%',
                    background: '#4f46e5', border: '2px solid #fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: uploadingAvatar ? 'not-allowed' : 'pointer',
                    opacity: uploadingAvatar ? 0.6 : 1,
                  }}
                >
                  <Camera size={12} color="#fff" />
                </button>
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{user?.full_name || '—'}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Faculty · {user?.email}</div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  style={{ marginTop: 6, fontSize: 12, fontWeight: 600, color: '#4f46e5', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textDecoration: 'underline' }}
                >
                  {uploadingAvatar ? 'Uploading...' : 'Change photo'}
                </button>
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6, display: 'block' }}>DISPLAY NAME</label>
              <input
                value={displayName} onChange={e => setDisplayName(e.target.value)}
                placeholder="Your full name"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#4f46e5'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6, display: 'block' }}>EMAIL</label>
              <input
                value={user?.email || ''} disabled
                style={{ ...inputStyle, background: '#f8fafc', color: '#94a3b8' }}
              />
              <p style={{ fontSize: 11, color: '#94a3b8', margin: '4px 0 0' }}>Email cannot be changed here.</p>
            </div>

            <button
              onClick={handleSaveProfile}
              disabled={savingProfile || !displayName.trim()}
              style={{ padding: '11px', borderRadius: 10, border: 'none', background: '#4f46e5', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: savingProfile ? 0.7 : 1 }}
            >
              <Save size={16} /> {savingProfile ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </Section>

        {/* Right — Password */}
        <Section title="Change Password">
          <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6, display: 'block' }}>CURRENT PASSWORD</label>
              <div style={{ position: 'relative' }}>
                <input
                  required type={showCurr ? 'text' : 'password'}
                  value={currPwd} onChange={e => setCurrPwd(e.target.value)}
                  placeholder="Enter current password"
                  style={{ ...inputStyle, paddingRight: 40 }}
                  onFocus={e => e.target.style.borderColor = '#4f46e5'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                />
                <button type="button" onClick={() => setShowCurr(p => !p)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                  {showCurr ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6, display: 'block' }}>NEW PASSWORD</label>
              <div style={{ position: 'relative' }}>
                <input
                  required type={showNew ? 'text' : 'password'}
                  value={newPwd} onChange={e => setNewPwd(e.target.value)}
                  placeholder="Min. 8 characters"
                  style={{ ...inputStyle, paddingRight: 40 }}
                  onFocus={e => e.target.style.borderColor = '#4f46e5'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                />
                <button type="button" onClick={() => setShowNew(p => !p)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6, display: 'block' }}>CONFIRM NEW PASSWORD</label>
              <input
                required type="password"
                value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)}
                placeholder="Repeat new password"
                style={{ ...inputStyle, borderColor: confirmPwd && newPwd && confirmPwd !== newPwd ? '#ef4444' : '#e2e8f0' }}
                onFocus={e => e.target.style.borderColor = '#4f46e5'}
                onBlur={e => e.target.style.borderColor = (confirmPwd && newPwd && confirmPwd !== newPwd) ? '#ef4444' : '#e2e8f0'}
              />
              {confirmPwd && newPwd && confirmPwd !== newPwd && (
                <p style={{ fontSize: 11, color: '#ef4444', margin: '4px 0 0' }}>Passwords do not match</p>
              )}
            </div>

            <button
              type="submit" disabled={savingPwd}
              style={{ padding: '11px', borderRadius: 10, border: 'none', background: '#0f172a', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: savingPwd ? 0.7 : 1, marginTop: 4 }}
            >
              <Lock size={16} /> {savingPwd ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </Section>
      </div>

      {/* Account info card */}
      <div style={{ background: '#fff', borderRadius: 20, padding: 28, border: '1px solid #f1f5f9', boxShadow: '0 4px 24px rgba(0,0,0,0.03)' }}>
        <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', margin: '0 0 16px' }}>Account Information</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
          {[
            { label: 'Role', value: 'Faculty' },
            { label: 'Account Status', value: user?.is_verified ? 'Verified ✓' : 'Pending Verification', ok: user?.is_verified },
            { label: 'Member Since', value: user?.created_at ? new Date(user.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : '—' },
          ].map((row, i) => (
            <div key={i} style={{ padding: '16px 20px', background: '#f8fafc', borderRadius: 14, border: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{row.label}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: row.ok ? '#10b981' : '#0f172a' }}>{row.value}</div>
            </div>
          ))}
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </PageLayout>
  )
}
