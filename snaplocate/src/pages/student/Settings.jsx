import { useState, useEffect, useRef } from 'react'
import PageLayout from '../../components/PageLayout'
import { useAuth } from '../../context/AuthContext'
import api from '../../lib/api'
import Modal from '../../components/admin/Modal'
import {
  User,
  Shield,
  Palette,
  Bell,
  Camera,
  KeyRound,
  ShieldCheck,
  Sun,
  Moon,
  Loader2,
  Globe,
  Eye,
  EyeOff
} from 'lucide-react'

const pjs = (size, weight, lh, color) => ({
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  fontSize: size, fontWeight: weight, lineHeight: lh, color,
})
const inter = (size, weight, lh, color) => ({
  fontFamily: "'Inter', sans-serif",
  fontSize: size, fontWeight: weight, lineHeight: lh, color,
})

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

/* ─── UI Components ─────────────────────────────────────────────── */
function Card({ children, style = {} }) {
  return (
    <div style={{
      background: '#ffffff', border: '1px solid #f1f5f9', borderRadius: 24,
      padding: '28px', boxShadow: '0px 2px 8px rgba(0,0,0,0.04)', ...style,
    }}>
      {children}
    </div>
  )
}

function SectionHeading({ icon, title }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
      <span style={pjs(18, 700, '23px', '#0f172a')}>{title}</span>
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

function Checkbox({ checked, onChange }) {
  return (
    <div
      onClick={() => onChange(!checked)}
      style={{
        width: 22, height: 22, borderRadius: 6, cursor: 'pointer', flexShrink: 0,
        background: checked ? '#4f46e5' : '#ffffff',
        border: `1.5px solid ${checked ? '#4f46e5' : '#d1d5db'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.1s',
      }}
    >
      {checked && (
        <svg width="12" height="9" viewBox="0 0 12 9" fill="none">
          <path d="M1 4.5L4.5 8L11 1.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   Settings Page
   ════════════════════════════════════════════════════════════════ */
export default function SettingsPage() {
  const { user, updateUser } = useAuth()
  const fileInputRef = useRef(null)

  const [profile, setProfile] = useState({
    firstName: user?.full_name?.split(' ')[0] || '',
    lastName: user?.full_name?.split(' ').slice(1).join(' ') || '',
    email: user?.email || '',
    avatar_url: user?.avatar_url || ''
  })

  const [prefs, setPrefs] = useState({
    theme: 'light',
    language: 'English',
    timezone: 'Asia/Kolkata (IST)',
    push_notifs: true,
    email_notifs: true,
    weekly_analytics: false
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [savingPwd, setSavingPwd] = useState(false)
  const [pwModal, setPwModal] = useState(false)
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
  const [pwError, setPwError] = useState('')
  const [showPwd, setShowPwd] = useState({ current: false, next: false, confirm: false })
  const [toast, setToast] = useState({ msg: '', type: 'success' })

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
          setProfile({
            firstName: u.full_name?.split(' ')[0] || '',
            lastName: u.full_name?.split(' ').slice(1).join(' ') || '',
            email: u.email,
            avatar_url: u.avatar_url || ''
          })
          if (u.preferences) {
            setPrefs(p => ({ ...p, ...u.preferences }))
          }
        }
      } catch (err) {
        console.error('Failed to fetch profile:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchFullProfile()
  }, [])

  const handleProfileSave = async (e) => {
    if (e) e.preventDefault()
    setSaving(true)
    try {
      const full_name = `${profile.firstName} ${profile.lastName}`.trim()
      const res = await api.patch('/api/users/profile', { full_name })
      if (res.success) {
        updateUser({ full_name })
        showToast('Profile updated!')
      }
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'avatar')

      const uploadRes = await api.upload('/api/upload/image', formData)
      if (!uploadRes.success) throw new Error('Upload failed')

      const newUrl = uploadRes.url
      const profileRes = await api.patch('/api/users/profile', { avatar_url: newUrl })
      if (!profileRes.success) throw new Error('Profile update failed')

      setProfile(s => ({ ...s, avatar_url: newUrl }))
      updateUser({ avatar_url: newUrl })
      showToast('Avatar updated!')
    } catch (err) {
      showToast(`Error uploading image: ${err.message}`, 'error')
    } finally {
      setUploading(false)
    }
  }

  const handlePrefChange = async (key, value) => {
    const prev = { ...prefs }
    const nextPrefs = { ...prefs, [key]: value }
    setPrefs(nextPrefs)
    try {
      await api.put('/api/users/preferences', { preferences: nextPrefs })
      showToast('Preferences updated!')
    } catch (err) {
      console.error('Failed to sync preferences:', err)
      setPrefs(prev)
      showToast('Failed to save preference', 'error')
    }
  }

  const handlePasswordUpdate = async (e) => {
    e.preventDefault()
    setPwError('')
    if (pwForm.current === pwForm.next) return setPwError('New password cannot be the same as current password')
    if (pwForm.next !== pwForm.confirm) return setPwError('Passwords do not match')
    if (pwForm.next.length < 8) return setPwError('Password must be at least 8 characters')

    setSavingPwd(true)
    try {
      const res = await api.put('/api/users/password', {
        current_password: pwForm.current,
        new_password: pwForm.next
      })
      if (res.success) {
        showToast('Password updated successfully!')
        setPwModal(false)
        setPwForm({ current: '', next: '', confirm: '' })
      }
    } catch (err) {
      setPwError(err.message || 'Update failed')
    } finally {
      setSavingPwd(false)
    }
  }

  const closePwModal = () => {
    setPwModal(false)
    setPwError('')
    setPwForm({ current: '', next: '', confirm: '' })
    setShowPwd({ current: false, next: false, confirm: false })
  }

  const inputStyle = {
    width: '100%', padding: '12px 14px', borderRadius: 12,
    border: '1px solid #e2e8f0', background: '#f8fafc',
    ...pjs(14, 400, '20px', '#0f172a'), outline: 'none', boxSizing: 'border-box',
    transition: 'all 0.15s',
  }

  const labelStyle = {
    ...inter(12, 600, '16px', '#64748b'), display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em'
  }

  // Unified Primary Button Style (Matching Sidebar Logout)
  const primaryButtonStyle = {
    padding: '12px 34px',
    background: '#4f46e5',
    borderRadius: 16,
    border: 'none',
    cursor: 'pointer',
    ...pjs(14, 700, '18px', '#ffffff'),
    transition: 'all 0.2s',
  }

  // Unified Cancel Button Style (Matching User Screenshot)
  const secondaryButtonStyle = {
    padding: '12px 34px',
    background: '#ffffff',
    borderRadius: 16,
    border: '1px solid #e2e8f0',
    cursor: 'pointer',
    ...pjs(14, 700, '18px', '#1e293b'),
    transition: 'all 0.2s',
  }

  if (loading) return <PageLayout><div style={{ textAlign: 'center', padding: '100px 0' }}>{/* Spinner... */} Loading settings...</div></PageLayout>

  return (
    <PageLayout>
      <Toast msg={toast.msg} type={toast.type} onClose={() => setToast({ msg: '', type: 'success' })} />
      {/* Page Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={pjs(30, 700, '38px', '#0f172a')}>Settings</h1>
        <p style={{ ...pjs(16, 400, '22px', '#64748b'), marginTop: 2 }}>
          Manage your account preferences, security settings, and notifications.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>

        {/* LEFT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* User Profile Card */}
          <Card>
            <SectionHeading title="User Profile" icon={<User size={20} color="#4f46e5" strokeWidth={2.5} />} />

            <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start' }}>
              {/* Avatar Section */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{
                  width: 104, height: 104, borderRadius: '50%', overflow: 'hidden',
                  border: '4px solid #fff', boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  background: 'linear-gradient(135deg,#e0e7ff,#f1f5f9)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {uploading ? (
                    <Loader2 size={32} color="#4f46e5" className="animate-spin" />
                  ) : profile.avatar_url ? (
                    <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 36, fontWeight: 700 }}>
                      {profile.firstName[0]}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    position: 'absolute', bottom: 2, right: 2,
                    width: 32, height: 32, borderRadius: '50%',
                    background: '#4f46e5', border: '2.5px solid #ffffff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)', transition: 'transform 0.1s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <Camera size={14} color="white" />
                </button>
                <input type="file" ref={fileInputRef} onChange={handleAvatarChange} accept="image/*" style={{ display: 'none' }} />
              </div>

              {/* Profile Form Content */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <div>
                    <label style={labelStyle}>First Name</label>
                    <input style={inputStyle} value={profile.firstName} onChange={e => setProfile({ ...profile, firstName: e.target.value })} />
                  </div>
                  <div>
                    <label style={labelStyle}>Last Name</label>
                    <input style={inputStyle} value={profile.lastName} onChange={e => setProfile({ ...profile, lastName: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Email Address</label>
                  <input style={{ ...inputStyle, background: '#f8fafc', color: '#64748b' }} value={profile.email} disabled />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                  <button
                    onClick={handleProfileSave}
                    disabled={saving}
                    style={primaryButtonStyle}
                    onMouseEnter={e => e.currentTarget.style.background = '#4338ca'}
                    onMouseLeave={e => e.currentTarget.style.background = '#4f46e5'}
                  >
                    {saving ? 'Syncing...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          </Card>

          {/* Security & Access Card */}
          <Card>
            <SectionHeading title="Security & Access" icon={<Shield size={20} color="#4f46e5" strokeWidth={2.5} />} />

            <div style={{ background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: 16, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 20, marginBottom: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <KeyRound size={20} color="#4f46e5" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={pjs(15, 700, '21px', '#0f172a')}>Reset Password</div>
                <div style={inter(13, 400, '18px', '#64748b')}>Change your password to keep your account secure.</div>
              </div>
              <button onClick={() => setPwModal(true)} style={{
                padding: '12px 20px', background: '#fff', border: '1px solid #e2e8f0',
                borderRadius: 12, cursor: 'pointer', ...pjs(13, 700, '18px', '#0f172a'),
                transition: 'all 0.15s'
              }} onMouseEnter={e => e.currentTarget.style.borderColor = '#4f46e5'} onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e8f0'}>
                Update Password
              </button>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: 16, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <ShieldCheck size={20} color="#10b981" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={pjs(15, 700, '21px', '#0f172a')}>Two-Factor Authentication</div>
                <div style={inter(13, 400, '18px', '#64748b')}>Add an extra layer of security with SMS or App verification.</div>
              </div>
              <Toggle on={true} onChange={() => { }} />
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Appearance Card */}
          <Card>
            <SectionHeading title="Appearance" icon={<Palette size={20} color="#4f46e5" strokeWidth={2.5} />} />
            <p style={{ ...inter(14, 400, '20px', '#64748b'), marginBottom: 20 }}>Choose how SnapLocate looks for you.</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {[
                { id: 'light', label: 'Light Mode', icon: <Sun size={24} /> },
                { id: 'dark', label: 'Dark Mode', icon: <Moon size={24} /> },
              ].map(t => (
                <div
                  key={t.id}
                  onClick={() => handlePrefChange('theme', t.id)}
                  style={{
                    padding: '28px 16px', borderRadius: 16, cursor: 'pointer', textAlign: 'center',
                    border: `2px solid ${prefs.theme === t.id ? '#4f46e5' : '#e2e8f0'}`,
                    background: t.id === 'dark' ? '#1a202c' : '#f8fafc',
                    color: t.id === 'dark' ? '#fff' : '#0f172a',
                    transition: 'all 0.15s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12, color: prefs.theme === t.id ? '#4f46e5' : '#64748b' }}>{t.icon}</div>
                  <div style={pjs(13, 700, '18px', prefs.theme === t.id ? (t.id === 'dark' ? '#fff' : '#4f46e5') : '#64748b')}>{t.label}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* Region & Language Card */}
          <Card>
            <SectionHeading title="Region & Language" icon={<Globe size={20} color="#4f46e5" strokeWidth={2.5} />} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={labelStyle}>Language</label>
                <select
                  value={prefs.language}
                  onChange={e => handlePrefChange('language', e.target.value)}
                  style={{ ...inputStyle, background: '#fff', border: '1px solid #e2e8f0', cursor: 'pointer' }}
                >
                  <option>English</option>
                  <option>Hindi</option>
                  <option>Spanish</option>
                  <option>French</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Timezone</label>
                <select
                  value={prefs.timezone}
                  onChange={e => handlePrefChange('timezone', e.target.value)}
                  style={{ ...inputStyle, background: '#fff', border: '1px solid #e2e8f0', cursor: 'pointer' }}
                >
                  <option>Asia/Kolkata (IST)</option>
                  <option>UTC</option>
                  <option>America/New_York</option>
                  <option>Europe/London</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Notifications Card */}
          <Card>
            <SectionHeading title="Notifications" icon={<Bell size={20} color="#4f46e5" strokeWidth={2.5} />} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {[
                { k: 'push_notifs', title: 'Push Notifications', desc: 'Real-time alerts on your device' },
                { k: 'email_notifs', title: 'Email Notifications', desc: 'Summary and critical event emails' },
                { k: 'weekly_analytics', title: 'Weekly Analytics', desc: 'Detailed weekly usage reports' },
              ].map(n => (
                <div
                  key={n.k}
                  onClick={() => handlePrefChange(n.k, !prefs[n.k])}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: 14, cursor: 'pointer' }}
                >
                  <div style={{ pointerEvents: 'none' }}>
                    <Checkbox checked={prefs[n.k]} onChange={() => { }} />
                  </div>
                  <div style={{ marginTop: -2 }}>
                    <div style={pjs(14, 700, '19px', '#0f172a')}>{n.title}</div>
                    <div style={inter(12, 400, '16px', '#64748b')}>{n.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

        </div>
      </div>

      <Modal isOpen={pwModal} onClose={closePwModal} title="Change Password">
        <form onSubmit={handlePasswordUpdate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
                required
                style={{ ...inputStyle, paddingRight: 44 }}
                value={pwForm.current}
                onChange={e => setPwForm({ ...pwForm, current: e.target.value })}
              />
              <button
                type="button"
                onClick={() => setShowPwd({ ...showPwd, current: !showPwd.current })}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }}
              >
                {showPwd.current ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div>
            <label style={labelStyle}>New Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPwd.next ? 'text' : 'password'}
                required
                style={{ ...inputStyle, paddingRight: 44 }}
                value={pwForm.next}
                onChange={e => setPwForm({ ...pwForm, next: e.target.value })}
              />
              <button
                type="button"
                onClick={() => setShowPwd({ ...showPwd, next: !showPwd.next })}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }}
              >
                {showPwd.next ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div>
            <label style={labelStyle}>Confirm New Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPwd.confirm ? 'text' : 'password'}
                required
                style={{ ...inputStyle, paddingRight: 44, borderColor: pwForm.confirm && pwForm.next && pwForm.confirm !== pwForm.next ? '#ef4444' : '#e2e8f0' }}
                value={pwForm.confirm}
                onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })}
              />
              <button
                type="button"
                onClick={() => setShowPwd({ ...showPwd, confirm: !showPwd.confirm })}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }}
              >
                {showPwd.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {pwForm.confirm && pwForm.next && pwForm.confirm !== pwForm.next && (
              <p style={{ fontSize: 11, color: '#ef4444', margin: '4px 0 0', fontFamily: "'Inter', sans-serif" }}>Passwords do not match</p>
            )}
          </div>
          <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 14 }}>
            <button
              type="button"
              onClick={() => setPwModal(false)}
              style={secondaryButtonStyle}
              onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
              onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingPwd}
              style={primaryButtonStyle}
              onMouseEnter={e => e.currentTarget.style.background = '#4338ca'}
              onMouseLeave={e => e.currentTarget.style.background = '#4f46e5'}
            >
              {savingPwd ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </Modal>

    </PageLayout>
  )
}
