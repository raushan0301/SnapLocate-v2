import { useState, useEffect, useRef } from 'react'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import { Settings, Save, Lock, CheckCircle, Eye, EyeOff, Camera, Loader, KeyRound, Shield, ShieldCheck } from 'lucide-react'
import Modal from '../../components/admin/Modal'

const pjs = (size, weight, lh, color) => ({
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  fontSize: size, fontWeight: weight, lineHeight: lh, color,
})
const inter = (size, weight, lh, color) => ({
  fontFamily: "'Inter', sans-serif",
  fontSize: size, fontWeight: weight, lineHeight: lh, color,
})

function Section({ title, icon, children }) {
  return (
    <div style={{ background: '#fff', borderRadius: 24, padding: 32, border: '1px solid #f1f5f9', boxShadow: '0 4px 24px rgba(0,0,0,0.03)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
        <span style={pjs(18, 700, '23px', '#0f172a')}>{title}</span>
      </div>
      {children}
    </div>
  )
}

function Toast({ msg, type, onClose }) {
  if (!msg) return null
  return (
    <div style={{
      position: 'fixed', bottom: 32, right: 32, zIndex: 9999,
      padding: '14px 22px', borderRadius: 14,
      background: type === 'success' ? '#16a34a' : '#ef4444',
      color: '#fff', boxShadow: '0 8px 32px rgba(0,0,0,.18)',
      fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, fontWeight: 600,
      display: 'flex', alignItems: 'center', gap: 10,
      animation: 'slideIn 0.3s ease-out'
    }}>
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20, borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }}>
        {type === 'success' ? '✓' : '!'}
      </div>
      <span>{msg}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', marginLeft: 10, opacity: 0.7, fontSize: 16 }}>×</button>
    </div>
  )
}

function Toggle({ on, onChange }) {
  return (
    <div
      onClick={() => onChange(!on)}
      style={{
        width: 44, height: 24, borderRadius: 12, cursor: 'pointer',
        background: on ? '#4f46e5' : '#e2e8f0',
        position: 'relative', transition: 'background 0.2s', flexShrink: 0,
      }}
    >
      <div style={{
        position: 'absolute', top: 3, left: on ? 23 : 3,
        width: 18, height: 18, borderRadius: '50%', background: '#ffffff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.15)', transition: 'left 0.2s',
      }} />
    </div>
  )
}

export default function FacultySettings() {
  const { user, updateUser } = useAuth()
  const fileInputRef = useRef(null)

  const [displayName, setDisplayName] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState(null)

  const [pwModal, setPwModal] = useState(false)
  const [currPwd, setCurrPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [pwError, setPwError] = useState('')
  const [showPwd, setShowPwd] = useState({ current: false, next: false, confirm: false })
  const [savingPwd, setSavingPwd] = useState(false)

  const [toast, setToast] = useState({ msg: '', type: 'success' })

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast({ msg: '', type: 'success' }), 4000)
  }

  useEffect(() => {
    if (user) setDisplayName(user.full_name || '')
  }, [user])

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
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
    setPwError('')
    if (currPwd === newPwd) return setPwError('New password cannot be the same as current password')
    if (newPwd !== confirmPwd) return setPwError('New passwords do not match')
    if (newPwd.length < 8) return setPwError('Password must be at least 8 characters')

    setSavingPwd(true)
    try {
      const res = await api.put('/api/users/password', {
        current_password: currPwd,
        new_password: newPwd
      })
      if (res.success) {
        showToast('Password changed successfully!')
        closePwModal()
      }
    } catch (err) {
      setPwError(err?.message || 'Current password is incorrect')
    } finally {
      setSavingPwd(false)
    }
  }

  const closePwModal = () => {
    setPwModal(false)
    setPwError('')
    setCurrPwd('')
    setNewPwd('')
    setConfirmPwd('')
    setShowPwd({ current: false, next: false, confirm: false })
  }

  const currentAvatar = avatarPreview || user?.avatar_url
  const initials = (displayName || 'F').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  const inputStyle = {
    width: '100%', padding: '12px 14px',
    borderRadius: 12, border: '1px solid #e2e8f0', background: '#f8fafc',
    ...pjs(14, 400, '20px', '#0f172a'), outline: 'none', boxSizing: 'border-box',
    transition: 'all 0.15s',
  }
  const labelStyle = { ...pjs(10, 700, '14px', '#64748b'), textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }

  const primaryButtonStyle = {
    padding: '12px 34px', background: '#4f46e5', borderRadius: 16, border: 'none', cursor: 'pointer',
    ...pjs(14, 700, '18px', '#ffffff'), transition: 'all 0.2s',
  }
  const secondaryButtonStyle = {
    padding: '12px 34px', background: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0', cursor: 'pointer',
    ...pjs(14, 700, '18px', '#1e293b'), transition: 'all 0.2s',
  }

  return (
    <PageLayout>
      <Toast msg={toast.msg} type={toast.type} onClose={() => setToast({ msg: '', type: 'success' })} />

      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />

      {/* Page Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={pjs(30, 700, '38px', '#0f172a')}>Settings</h1>
        <p style={{ ...pjs(16, 400, '22px', '#64748b'), marginTop: 2 }}>
          Manage your faculty profile picture, display name, and account security.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>

        {/* Left — Profile */}
        <Section title="Faculty Profile" icon={<Settings size={20} color="#4f46e5" strokeWidth={2.5} />}>
          <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start' }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{ width: 104, height: 104, borderRadius: '50%', background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '4px solid #fff', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
                {currentAvatar
                  ? <img src={currentAvatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: 36, fontWeight: 700, color: '#4f46e5' }}>{initials}</span>
                }
                {uploadingAvatar && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Loader size={24} color="#fff" style={{ animation: 'spin 1s linear infinite' }} />
                  </div>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                style={{
                  position: 'absolute', bottom: 2, right: 2,
                  width: 32, height: 32, borderRadius: '50%',
                  background: '#4f46e5', border: '2.5px solid #fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: uploadingAvatar ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)', transition: 'transform 0.1s'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                <Camera size={14} color="#fff" />
              </button>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label style={labelStyle}>DISPLAY NAME</label>
                <input
                  value={displayName} onChange={e => setDisplayName(e.target.value)}
                  placeholder="Your full name"
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#4f46e5'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>
              <div>
                <label style={labelStyle}>PROFESSIONAL EMAIL</label>
                <input
                  value={user?.email || ''} disabled
                  style={{ ...inputStyle, background: '#f8fafc', color: '#94a3b8' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                <button
                  onClick={handleSaveProfile}
                  disabled={savingProfile || !displayName.trim()}
                  style={primaryButtonStyle}
                  onMouseEnter={e => e.currentTarget.style.background = '#4338ca'}
                  onMouseLeave={e => e.currentTarget.style.background = '#4f46e5'}
                >
                  {savingProfile ? 'Syncing...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </Section>

        {/* Right — Security & Account Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <Section title="Security & Access" icon={<Shield size={20} color="#4f46e5" strokeWidth={2.5} />}>
            <div style={{ background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: 16, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 20, marginBottom: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <KeyRound size={20} color="#4f46e5" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={pjs(15, 700, '21px', '#0f172a')}>Reset Password</div>
                <div style={inter(13, 400, '18px', '#64748b')}>Update your security credentials.</div>
              </div>
              <button onClick={() => setPwModal(true)} style={{
                padding: '12px 20px', background: '#fff', border: '1px solid #e2e8f0',
                borderRadius: 12, cursor: 'pointer', ...pjs(13, 700, '18px', '#0f172a'),
                transition: 'all 0.15s'
              }} onMouseEnter={e => e.currentTarget.style.borderColor = '#4f46e5'} onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e8f0'}>
                Update
              </button>
            </div>
            <div style={{ background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: 16, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <ShieldCheck size={20} color="#10b981" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={pjs(15, 700, '21px', '#0f172a')}>Two-Factor Auth</div>
                <div style={inter(13, 400, '18px', '#64748b')}>Enhanced account protection.</div>
              </div>
              <Toggle on={true} onChange={() => { }} />
            </div>
          </Section>

          <Section title="Context" icon={<CheckCircle size={20} color="#4f46e5" strokeWidth={2.5} />}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { label: 'Role', value: 'Faculty Agent' },
                { label: 'Status', value: user?.is_verified ? 'Approved' : 'Pending', type: user?.is_verified ? 'success' : 'warning' },
              ].map((row, i) => (
                <div key={i} style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: 14, border: '1px solid #f1f5f9' }}>
                  <div style={{ ...pjs(10, 700, '14px', '#94a3b8'), textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>{row.label}</div>
                  <div style={{ ...pjs(14, 700, '18px', row.type === 'success' ? '#10b981' : (row.type === 'warning' ? '#f59e0b' : '#0f172a')) }}>{row.value}</div>
                </div>
              ))}
            </div>
          </Section>
        </div>
      </div>

      {/* Password Modal */}
      <Modal isOpen={pwModal} onClose={closePwModal} title="Change Password">
        <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {pwError && (
            <div style={{ padding: '10px 14px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fee2e2', color: '#b91c1c', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>⚠️</span> {pwError}
            </div>
          )}
          <div>
            <label style={labelStyle}>Current Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPwd.current ? 'text' : 'password'}
                required style={{ ...inputStyle, paddingRight: 44 }}
                value={currPwd} onChange={e => setCurrPwd(e.target.value)}
              />
              <button type="button" onClick={() => setShowPwd({ ...showPwd, current: !showPwd.current })}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                {showPwd.current ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div>
            <label style={labelStyle}>New Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPwd.next ? 'text' : 'password'}
                required style={{ ...inputStyle, paddingRight: 44 }}
                value={newPwd} onChange={e => setNewPwd(e.target.value)}
              />
              <button type="button" onClick={() => setShowPwd({ ...showPwd, next: !showPwd.next })}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                {showPwd.next ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div>
            <label style={labelStyle}>Confirm New Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPwd.confirm ? 'text' : 'password'}
                required style={{ ...inputStyle, paddingRight: 44, borderColor: confirmPwd && newPwd && confirmPwd !== newPwd ? '#ef4444' : '#e2e8f0' }}
                value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)}
              />
              <button type="button" onClick={() => setShowPwd({ ...showPwd, confirm: !showPwd.confirm })}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                {showPwd.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {confirmPwd && newPwd && confirmPwd !== newPwd && (
              <p style={{ fontSize: 11, color: '#ef4444', margin: '4px 0 0' }}>Passwords do not match</p>
            )}
          </div>
          <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 14 }}>
            <button type="button" onClick={closePwModal} style={secondaryButtonStyle}>Cancel</button>
            <button type="submit" disabled={savingPwd} style={primaryButtonStyle}>
              {savingPwd ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </Modal>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </PageLayout>
  )
}
