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
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
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

function Section({ title, children }) {
  return (
    <div style={{ background: '#fff', borderRadius: 20, padding: 28, border: '1px solid #f1f5f9', boxShadow: '0 4px 24px rgba(0,0,0,0.03)' }}>
      <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', margin: '0 0 20px', paddingBottom: 12, borderBottom: '1px solid #f1f5f9' }}>{title}</h3>
      {children}
    </div>
  )
}

export default function AdminSettings() {
  const { user, updateUser } = useAuth()
  const fileInputRef = useRef(null)

  const [adminName, setAdminName]         = useState('')
  const [adminEmail, setAdminEmail]       = useState('')
  const [saveStatus, setSaveStatus]       = useState('')
  const [exporting, setExporting]         = useState('')
  const [systemStats, setSystemStats]     = useState(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [toast, setToast]                 = useState({ msg: '', type: 'success' })

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast({ msg: '', type: 'success' }), 3000)
  }

  useEffect(() => {
    if (user) {
      setAdminName(user.full_name || '')
      setAdminEmail(user.email || '')
    }
  }, [user])

  useEffect(() => {
    api.get('/api/admin/stats').then(res => {
      if (res.success) setSystemStats(res.data)
    }).catch(() => {})
  }, [])

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarPreview(URL.createObjectURL(file))
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
    if (!user?.id || !adminName.trim()) return
    setSaveStatus('saving')
    try {
      await api.patch(`/api/admin/users/${user.id}`, { full_name: adminName })
      updateUser({ full_name: adminName })
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus(''), 2500)
    } catch {
      setSaveStatus('error')
      setTimeout(() => setSaveStatus(''), 2500)
    }
  }

  const handleExport = async (type) => {
    setExporting(type)
    try {
      if (type === 'faculty') {
        const res = await api.get('/api/admin/users?role=faculty')
        if (res.success) {
          exportToCSV('faculty.csv',
            ['Name', 'Email', 'Department', 'Status', 'Joined'],
            res.data.map(u => [u.full_name, u.email, u.dept || '', u.is_verified ? 'Verified' : 'Pending', new Date(u.created_at).toLocaleDateString()])
          )
        }
      } else if (type === 'students') {
        const res = await api.get('/api/admin/users?role=student')
        if (res.success) {
          exportToCSV('students.csv',
            ['Name', 'Email', 'Status', 'Joined'],
            res.data.map(u => [u.full_name, u.email, u.is_verified ? 'Active' : 'Suspended', new Date(u.created_at).toLocaleDateString()])
          )
        }
      } else if (type === 'tickets') {
        const res = await api.get('/api/support/tickets')
        if (res.success) {
          exportToCSV('support_tickets.csv',
            ['Subject', 'Category', 'Priority', 'Status', 'Submitted By', 'Created'],
            res.data.map(t => [t.subject, t.category || '', t.priority || '', t.status, t.user_name, new Date(t.created_at).toLocaleDateString()])
          )
        }
      }
    } catch (err) {
      alert('Export failed: ' + (err.message || 'Unknown error'))
    } finally {
      setExporting('')
    }
  }

  const saveLabel = saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? '✓ Saved' : saveStatus === 'error' ? 'Failed' : 'Save Changes'
  const saveBg    = saveStatus === 'saved' ? '#10b981' : saveStatus === 'error' ? '#ef4444' : '#4f46e5'
  const currentAvatar = avatarPreview || user?.avatar_url
  const initials = (adminName || 'A').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  const inputStyle = { width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: "'Plus Jakarta Sans', sans-serif" }

  return (
    <PageLayout>
      <Toast msg={toast.msg} type={toast.type} />

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 44, height: 44, borderRadius: 14, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Settings size={22} color="#4f46e5" />
        </div>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#0f172a', margin: 0 }}>Admin Settings</h1>
          <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>Manage your profile, export data, and view system configuration.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Profile */}
          <Section title="Admin Profile">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Avatar upload */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingBottom: 14, borderBottom: '1px solid #f1f5f9' }}>
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
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    title="Change profile picture"
                    style={{ position: 'absolute', bottom: -4, right: -4, width: 26, height: 26, borderRadius: '50%', background: '#4f46e5', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: uploadingAvatar ? 'not-allowed' : 'pointer', opacity: uploadingAvatar ? 0.6 : 1 }}
                  >
                    <Camera size={12} color="#fff" />
                  </button>
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{user?.full_name || '—'}</div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Administrator · {user?.email}</div>
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
                  value={adminName} onChange={e => setAdminName(e.target.value)}
                  placeholder="Your name"
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#4f46e5'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6, display: 'block' }}>EMAIL</label>
                <input value={adminEmail} disabled style={{ ...inputStyle, background: '#f8fafc', color: '#94a3b8' }} />
                <p style={{ fontSize: 11, color: '#94a3b8', margin: '4px 0 0' }}>Email cannot be changed from the panel.</p>
              </div>
              <button
                onClick={handleSaveProfile}
                disabled={saveStatus === 'saving'}
                style={{ padding: '11px', borderRadius: 10, border: 'none', background: saveBg, color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'background 0.2s' }}
              >
                <Save size={16} /> {saveLabel}
              </button>
            </div>
          </Section>

          {/* Default credentials */}
          <Section title="Default Faculty Password">
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Key size={16} color="#92400e" />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#92400e' }}>New faculty accounts are created with a default password</span>
              </div>
              <code style={{ fontSize: 15, fontWeight: 800, color: '#1e293b', background: '#fff', padding: '6px 12px', borderRadius: 8, border: '1px solid #e2e8f0', display: 'inline-block', letterSpacing: 1 }}>
                Password123!
              </code>
              <p style={{ fontSize: 12, color: '#78350f', margin: '8px 0 0' }}>
                Faculty members should be advised to change this immediately after their first login.
              </p>
            </div>
          </Section>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Export */}
          <Section title="Export Data (CSV)">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { key: 'faculty',   label: 'Export Faculty List',    desc: 'Name, email, department, verification status', icon: <Users size={18} />,        color: '#4f46e5', bg: '#eef2ff' },
                { key: 'students',  label: 'Export Student List',    desc: 'Name, email, account status, join date',        icon: <GraduationCap size={18} />, color: '#10b981', bg: '#ecfdf5' },
                { key: 'tickets',   label: 'Export Support Tickets', desc: 'Subject, category, status, submitter',           icon: <Ticket size={18} />,        color: '#f59e0b', bg: '#fffbeb' },
              ].map(item => (
                <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: '#f8fafc', borderRadius: 12, border: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: item.bg, color: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{item.icon}</div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>{item.label}</div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>{item.desc}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleExport(item.key)}
                    disabled={exporting === item.key}
                    style={{ padding: '8px 16px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: exporting === item.key ? '#f1f5f9' : '#fff', color: '#475569', fontSize: 13, fontWeight: 600, cursor: exporting === item.key ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}
                  >
                    <Download size={14} />
                    {exporting === item.key ? 'Exporting...' : 'Download'}
                  </button>
                </div>
              ))}
            </div>
          </Section>

          {/* System info */}
          <Section title="System Status">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Platform',         value: 'SnapLocate Campus OS' },
                { label: 'Version',          value: '1.0.0' },
                { label: 'API Status',       value: 'Connected', ok: true },
                { label: 'Total Users',      value: systemStats ? (systemStats.total_students + systemStats.total_faculty) : '—' },
                { label: 'Open Tickets',     value: systemStats?.open_tickets ?? '—' },
                { label: 'Active Listings',  value: systemStats?.marketplace_listings ?? '—' },
              ].map((row, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f8fafc' }}>
                  <span style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>{row.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: row.ok ? '#10b981' : '#0f172a', display: 'flex', alignItems: 'center', gap: 4 }}>
                    {row.ok && <CheckCircle size={13} />}
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </Section>
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </PageLayout>
  )
}
