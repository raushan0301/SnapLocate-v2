import { useState, useEffect, useRef } from 'react'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import { Settings, Download, Users, GraduationCap, Ticket, CheckCircle, Key, Save, Camera, Loader } from 'lucide-react'

function exportToCSV(filename, headers, rows) {
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
  ].join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

function Toast({ msg, type }) {
  if (!msg) return null
  return (
    <div className={`fixed bottom-8 right-8 z-[9999] px-[22px] py-3.5 rounded-[14px] text-white shadow-[0_8px_32px_rgba(0,0,0,0.18)] text-[14px] font-semibold flex items-center gap-2 ${type === 'success' ? 'bg-green-600' : 'bg-red-500'}`}>
      {type === 'success' ? <CheckCircle size={16} /> : '✕'} {msg}
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-[20px] p-7 border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.03)]">
      <h3 className="text-[15px] font-extrabold t-primary m-0 pb-5 mb-5 border-b border-slate-100">{title}</h3>
      {children}
    </div>
  )
}

export default function AdminSettings() {
  const { user, updateUser } = useAuth()
  const fileInputRef = useRef(null)

  const [adminName, setAdminName] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [saveStatus, setSaveStatus] = useState('')
  const [exporting, setExporting] = useState('')
  const [systemStats, setSystemStats] = useState(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [toast, setToast] = useState({ msg: '', type: 'success' })

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast({ msg: '', type: 'success' }), 3000)
  }

  useEffect(() => {
    if (user) { setAdminName(user.full_name || ''); setAdminEmail(user.email || '') }
  }, [user])

  useEffect(() => {
    api.get('/api/admin/stats').then(res => { if (res.success) setSystemStats(res.data) }).catch(() => {})
  }, [])

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]; if (!file) return
    setAvatarPreview(URL.createObjectURL(file)); setUploadingAvatar(true)
    try {
      const fd = new FormData(); fd.append('file', file); fd.append('type', 'avatar')
      const uploadRes = await api.upload('/api/upload/image', fd)
      if (!uploadRes.url) throw new Error('No URL returned')
      await api.patch('/api/users/profile', { avatar_url: uploadRes.url })
      updateUser({ avatar_url: uploadRes.url }); showToast('Profile picture updated')
    } catch (err) { setAvatarPreview(null); showToast(err?.message || 'Failed to upload image', 'error') }
    finally { setUploadingAvatar(false); if (fileInputRef.current) fileInputRef.current.value = '' }
  }

  const handleSaveProfile = async () => {
    if (!user?.id || !adminName.trim()) return
    setSaveStatus('saving')
    try {
      await api.patch(`/api/admin/users/${user.id}`, { full_name: adminName })
      updateUser({ full_name: adminName }); setSaveStatus('saved')
      setTimeout(() => setSaveStatus(''), 2500)
    } catch { setSaveStatus('error'); setTimeout(() => setSaveStatus(''), 2500) }
  }

  const handleExport = async (type) => {
    setExporting(type)
    try {
      if (type === 'faculty') {
        const res = await api.get('/api/admin/users?role=faculty')
        if (res.success) exportToCSV('faculty.csv', ['Name', 'Email', 'Department', 'Status', 'Joined'], res.data.map(u => [u.full_name, u.email, u.dept || '', u.is_verified ? 'Verified' : 'Pending', new Date(u.created_at).toLocaleDateString()]))
      } else if (type === 'students') {
        const res = await api.get('/api/admin/users?role=student')
        if (res.success) exportToCSV('students.csv', ['Name', 'Email', 'Status', 'Joined'], res.data.map(u => [u.full_name, u.email, u.is_verified ? 'Active' : 'Suspended', new Date(u.created_at).toLocaleDateString()]))
      } else if (type === 'tickets') {
        const res = await api.get('/api/support/tickets')
        if (res.success) exportToCSV('support_tickets.csv', ['Subject', 'Category', 'Priority', 'Status', 'Submitted By', 'Created'], res.data.map(t => [t.subject, t.category || '', t.priority || '', t.status, t.user_name, new Date(t.created_at).toLocaleDateString()]))
      }
    } catch (err) { alert('Export failed: ' + (err.message || 'Unknown error')) }
    finally { setExporting('') }
  }

  const saveLabel = saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? '✓ Saved' : saveStatus === 'error' ? 'Failed' : 'Save Changes'
  const saveCls = saveStatus === 'saved' ? 'bg-emerald-500' : saveStatus === 'error' ? 'bg-red-500' : 'bg-brand'
  const currentAvatar = avatarPreview || user?.avatar_url
  const initials = (adminName || 'A').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  const fieldCls = 'w-full px-3.5 py-[11px] rounded-[10px] border-[1.5px] border-slate-200 text-[14px] outline-none box-border focus:border-brand transition-colors'

  return (
    <PageLayout>
      <Toast msg={toast.msg} type={toast.type} />
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />

      <div className="flex items-center gap-4">
        <div className="w-11 h-11 rounded-[14px] bg-indigo-50 flex items-center justify-center">
          <Settings size={22} color="#4f46e5" />
        </div>
        <div>
          <h1 className="text-[26px] font-bold t-primary m-0">Admin Settings</h1>
          <p className="text-[14px] t-muted m-0">Manage your profile, export data, and view system configuration.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">

        {/* Left column */}
        <div className="flex flex-col gap-6">

          <Section title="Admin Profile">
            <div className="flex flex-col gap-3.5">
              <div className="flex items-center gap-4 pb-3.5 border-b border-slate-100">
                <div className="relative shrink-0">
                  <div className="w-[68px] h-[68px] rounded-[18px] bg-indigo-50 flex items-center justify-center overflow-hidden border-2 border-slate-200 relative">
                    {currentAvatar
                      ? <img src={currentAvatar} alt="" className="w-full h-full object-cover" />
                      : <span className="text-[24px] font-bold text-brand">{initials}</span>}
                    {uploadingAvatar && (
                      <div className="absolute inset-0 bg-black/45 flex items-center justify-center rounded-[18px]">
                        <Loader size={20} color="#fff" className="animate-spin" />
                      </div>
                    )}
                  </div>
                  <button onClick={() => fileInputRef.current?.click()} disabled={uploadingAvatar} title="Change profile picture"
                    className={`absolute -bottom-1 -right-1 w-[26px] h-[26px] rounded-full bg-brand border-2 border-white flex items-center justify-center ${uploadingAvatar ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                    <Camera size={12} color="#fff" />
                  </button>
                </div>
                <div>
                  <div className="text-[14px] font-bold t-primary">{user?.full_name || '—'}</div>
                  <div className="text-[12px] t-muted mt-0.5">Administrator · {user?.email}</div>
                  <button onClick={() => fileInputRef.current?.click()} disabled={uploadingAvatar}
                    className="mt-1.5 text-[12px] font-semibold text-brand bg-transparent border-0 p-0 cursor-pointer underline">
                    {uploadingAvatar ? 'Uploading...' : 'Change photo'}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[12px] font-bold text-slate-500 uppercase tracking-[0.05em] mb-1.5 block">DISPLAY NAME</label>
                <input value={adminName} onChange={e => setAdminName(e.target.value)} placeholder="Your name" className={fieldCls} />
              </div>
              <div>
                <label className="text-[12px] font-bold text-slate-500 uppercase tracking-[0.05em] mb-1.5 block">EMAIL</label>
                <input value={adminEmail} disabled className={`${fieldCls} bg-slate-50 text-slate-400`} />
                <p className="text-[11px] t-muted mt-1 mb-0">Email cannot be changed from the panel.</p>
              </div>
              <button onClick={handleSaveProfile} disabled={saveStatus === 'saving'}
                className={`py-[11px] rounded-[10px] border-0 text-white font-bold text-[14px] cursor-pointer flex items-center justify-center gap-2 transition-colors ${saveCls}`}>
                <Save size={16} /> {saveLabel}
              </button>
            </div>
          </Section>

          <Section title="Default Faculty Password">
            <div className="bg-amber-50 border border-amber-200 rounded-[12px] p-4">
              <div className="flex items-center gap-2 mb-2">
                <Key size={16} color="#92400e" />
                <span className="text-[13px] font-bold text-amber-800">New faculty accounts are created with a default password</span>
              </div>
              <code className="text-[15px] font-extrabold t-primary bg-white px-3 py-1.5 rounded-[8px] border border-slate-200 inline-block tracking-[1px]">
                Password123!
              </code>
              <p className="text-[12px] text-amber-900 mt-2 mb-0">
                Faculty members should be advised to change this immediately after their first login.
              </p>
            </div>
          </Section>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-6">

          <Section title="Export Data (CSV)">
            <div className="flex flex-col gap-3">
              {[
                { key: 'faculty',  label: 'Export Faculty List',      desc: 'Name, email, department, verification status', icon: <Users size={18} />,        iconBg: 'bg-indigo-50 text-brand' },
                { key: 'students', label: 'Export Student List',       desc: 'Name, email, account status, join date',       icon: <GraduationCap size={18} />, iconBg: 'bg-green-50 text-emerald-600' },
                { key: 'tickets',  label: 'Export Support Tickets',    desc: 'Subject, category, status, submitter',         icon: <Ticket size={18} />,        iconBg: 'bg-amber-50 text-amber-600' },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between px-4 py-3.5 bg-slate-50 rounded-[12px] border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-[10px] flex items-center justify-center ${item.iconBg}`}>{item.icon}</div>
                    <div>
                      <div className="font-semibold text-[14px] t-primary">{item.label}</div>
                      <div className="text-[12px] t-muted">{item.desc}</div>
                    </div>
                  </div>
                  <button onClick={() => handleExport(item.key)} disabled={exporting === item.key}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-[10px] border-[1.5px] border-slate-200 text-slate-600 text-[13px] font-semibold whitespace-nowrap transition-colors ${exporting === item.key ? 'bg-slate-100 cursor-not-allowed' : 'bg-white cursor-pointer hover:bg-slate-50'}`}>
                    <Download size={14} />{exporting === item.key ? 'Exporting...' : 'Download'}
                  </button>
                </div>
              ))}
            </div>
          </Section>

          <Section title="System Status">
            <div className="flex flex-col gap-2.5">
              {[
                { label: 'Platform',        value: 'SnapLocate Campus OS' },
                { label: 'Version',         value: '1.0.0' },
                { label: 'API Status',      value: 'Connected', ok: true },
                { label: 'Total Users',     value: systemStats ? (systemStats.total_students + systemStats.total_faculty) : '—' },
                { label: 'Open Tickets',    value: systemStats?.open_tickets ?? '—' },
                { label: 'Active Listings', value: systemStats?.marketplace_listings ?? '—' },
              ].map((row, i) => (
                <div key={i} className="flex justify-between items-center py-2.5 border-b border-slate-50">
                  <span className="text-[13px] t-muted font-medium">{row.label}</span>
                  <span className={`text-[13px] font-bold flex items-center gap-1 ${row.ok ? 'text-emerald-600' : 't-primary'}`}>
                    {row.ok && <CheckCircle size={13} />}{row.value}
                  </span>
                </div>
              ))}
            </div>
          </Section>
        </div>
      </div>
    </PageLayout>
  )
}
