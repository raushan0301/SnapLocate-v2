import { useState, useEffect, useRef } from 'react'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import { Settings, CheckCircle, Eye, EyeOff, Camera, Loader, KeyRound, Shield, ShieldCheck } from 'lucide-react'
import Modal from '../../components/admin/Modal'

function Section({ title, icon, children }) {
  return (
    <div className="bg-white rounded-[24px] p-8 border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.03)]">
      <div className="flex items-center gap-3 mb-7">
        <div className="flex items-center justify-center">{icon}</div>
        <span className="text-[18px] font-bold t-primary">{title}</span>
      </div>
      {children}
    </div>
  )
}

function Toast({ msg, type, onClose }) {
  if (!msg) return null
  return (
    <div
      className={`fixed bottom-8 right-8 z-[9999] px-[22px] py-3.5 rounded-[14px] text-white shadow-[0_8px_32px_rgba(0,0,0,0.18)] text-[14px] font-semibold flex items-center gap-2.5 ${type === 'success' ? 'bg-green-600' : 'bg-red-500'}`}
      style={{ animation: 'slideIn 0.3s ease-out' }}
    >
      <div className="flex items-center justify-center w-5 h-5 rounded-full bg-white/20">
        {type === 'success' ? '✓' : '!'}
      </div>
      <span>{msg}</span>
      <button onClick={onClose} className="bg-transparent border-0 text-white cursor-pointer ml-2.5 opacity-70 text-[16px]">×</button>
    </div>
  )
}

function Toggle({ on, onChange }) {
  return (
    <div
      onClick={() => onChange(!on)}
      className={`w-11 h-6 rounded-full cursor-pointer relative transition-colors shrink-0 ${on ? 'bg-brand' : 'bg-slate-200'}`}
    >
      <div className={`absolute top-[3px] w-[18px] h-[18px] rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.15)] transition-[left] ${on ? 'left-[23px]' : 'left-[3px]'}`} />
    </div>
  )
}

const fieldCls = 'w-full px-[14px] py-3 rounded-[12px] border border-slate-200 bg-slate-50 text-[14px] t-primary outline-none box-border transition-all focus:border-brand'
const labelCls = 'text-[10px] font-bold text-slate-500 uppercase tracking-[0.08em] block mb-1.5'

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

  return (
    <PageLayout>
      <Toast msg={toast.msg} type={toast.type} onClose={() => setToast({ msg: '', type: 'success' })} />

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />

      <div className="mb-8">
        <h1 className="text-[30px] font-bold t-primary m-0">Settings</h1>
        <p className="text-[16px] t-muted mt-0.5 mb-0">
          Manage your faculty profile picture, display name, and account security.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6 items-start">

        {/* Left — Profile */}
        <Section title="Faculty Profile" icon={<Settings size={20} color="#4f46e5" strokeWidth={2.5} />}>
          <div className="flex gap-7 items-start">
            <div className="relative shrink-0">
              <div className="w-[104px] h-[104px] rounded-full bg-indigo-50 flex items-center justify-center overflow-hidden border-4 border-white shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                {currentAvatar
                  ? <img src={currentAvatar} alt="" className="w-full h-full object-cover" />
                  : <span className="text-[36px] font-bold text-brand">{initials}</span>
                }
                {uploadingAvatar && (
                  <div className="absolute inset-0 bg-black/45 flex items-center justify-center">
                    <Loader size={24} color="#fff" style={{ animation: 'spin 1s linear infinite' }} />
                  </div>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className={`absolute bottom-0.5 right-0.5 w-8 h-8 rounded-full bg-brand border-[2.5px] border-white flex items-center justify-center shadow-[0_2px_4px_rgba(0,0,0,0.1)] transition-transform hover:scale-110 ${uploadingAvatar ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <Camera size={14} color="#fff" />
              </button>
            </div>

            <div className="flex-1 flex flex-col gap-[18px]">
              <div>
                <label className={labelCls}>DISPLAY NAME</label>
                <input
                  value={displayName} onChange={e => setDisplayName(e.target.value)}
                  placeholder="Your full name"
                  className={fieldCls}
                />
              </div>
              <div>
                <label className={labelCls}>PROFESSIONAL EMAIL</label>
                <input
                  value={user?.email || ''} disabled
                  className={`${fieldCls} text-slate-400`}
                />
              </div>
              <div className="flex justify-end mt-2">
                <button
                  onClick={handleSaveProfile}
                  disabled={savingProfile || !displayName.trim()}
                  className="px-[34px] py-3 bg-brand hover:bg-indigo-700 rounded-[16px] border-0 cursor-pointer text-[14px] font-bold text-white transition-colors"
                >
                  {savingProfile ? 'Syncing...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </Section>

        {/* Right — Security & Account Info */}
        <div className="flex flex-col gap-6">
          <Section title="Security & Access" icon={<Shield size={20} color="#4f46e5" strokeWidth={2.5} />}>
            <div className="bg-slate-50 border border-slate-100 rounded-[16px] px-6 py-5 flex items-center gap-5 mb-4">
              <div className="w-11 h-11 rounded-[12px] bg-indigo-50 flex items-center justify-center shrink-0">
                <KeyRound size={20} color="#4f46e5" />
              </div>
              <div className="flex-1">
                <div className="text-[15px] font-bold t-primary">Reset Password</div>
                <div className="text-[13px] t-muted">Update your security credentials.</div>
              </div>
              <button onClick={() => setPwModal(true)} className="px-5 py-3 bg-white border border-slate-200 hover:border-brand rounded-[12px] cursor-pointer text-[13px] font-bold t-primary transition-colors">
                Update
              </button>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-[16px] px-6 py-5 flex items-center gap-5">
              <div className="w-11 h-11 rounded-[12px] bg-emerald-50 flex items-center justify-center shrink-0">
                <ShieldCheck size={20} color="#10b981" />
              </div>
              <div className="flex-1">
                <div className="text-[15px] font-bold t-primary">Two-Factor Auth</div>
                <div className="text-[13px] t-muted">Enhanced account protection.</div>
              </div>
              <Toggle on={true} onChange={() => { }} />
            </div>
          </Section>

          <Section title="Context" icon={<CheckCircle size={20} color="#4f46e5" strokeWidth={2.5} />}>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Role', value: 'Faculty Agent', cls: 't-primary' },
                { label: 'Status', value: user?.is_verified ? 'Approved' : 'Pending', cls: user?.is_verified ? 'text-emerald-500' : 'text-amber-400' },
              ].map((row, i) => (
                <div key={i} className="px-4 py-3 bg-slate-50 rounded-[14px] border border-slate-100">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.04em] mb-1">{row.label}</div>
                  <div className={`text-[14px] font-bold ${row.cls}`}>{row.value}</div>
                </div>
              ))}
            </div>
          </Section>
        </div>
      </div>

      <Modal isOpen={pwModal} onClose={closePwModal} title="Change Password">
        <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
          {pwError && (
            <div className="px-3.5 py-2.5 rounded-[8px] bg-red-50 border border-red-200 text-red-700 text-[13px] font-medium flex items-center gap-2">
              <span>⚠️</span> {pwError}
            </div>
          )}
          <div>
            <label className={labelCls}>Current Password</label>
            <div className="relative">
              <input
                type={showPwd.current ? 'text' : 'password'}
                required
                className={`${fieldCls} pr-11`}
                value={currPwd} onChange={e => setCurrPwd(e.target.value)}
              />
              <button type="button" onClick={() => setShowPwd({ ...showPwd, current: !showPwd.current })}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-0 cursor-pointer text-slate-400">
                {showPwd.current ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div>
            <label className={labelCls}>New Password</label>
            <div className="relative">
              <input
                type={showPwd.next ? 'text' : 'password'}
                required
                className={`${fieldCls} pr-11`}
                value={newPwd} onChange={e => setNewPwd(e.target.value)}
              />
              <button type="button" onClick={() => setShowPwd({ ...showPwd, next: !showPwd.next })}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-0 cursor-pointer text-slate-400">
                {showPwd.next ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div>
            <label className={labelCls}>Confirm New Password</label>
            <div className="relative">
              <input
                type={showPwd.confirm ? 'text' : 'password'}
                required
                className={`${fieldCls} pr-11 ${confirmPwd && newPwd && confirmPwd !== newPwd ? 'border-red-500' : ''}`}
                value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)}
              />
              <button type="button" onClick={() => setShowPwd({ ...showPwd, confirm: !showPwd.confirm })}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-0 cursor-pointer text-slate-400">
                {showPwd.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {confirmPwd && newPwd && confirmPwd !== newPwd && (
              <p className="text-[11px] text-red-500 mt-1 mb-0">Passwords do not match</p>
            )}
          </div>
          <div className="mt-5 flex justify-end gap-3.5">
            <button type="button" onClick={closePwModal} className="px-[34px] py-3 bg-white rounded-[16px] border border-slate-200 cursor-pointer text-[14px] font-bold text-slate-800 transition-all">Cancel</button>
            <button type="submit" disabled={savingPwd} className="px-[34px] py-3 bg-brand hover:bg-indigo-700 rounded-[16px] border-0 cursor-pointer text-[14px] font-bold text-white transition-colors">
              {savingPwd ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </Modal>
    </PageLayout>
  )
}
