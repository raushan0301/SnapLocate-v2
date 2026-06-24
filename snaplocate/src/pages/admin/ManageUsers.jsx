import { useState, useEffect, useCallback, useMemo } from 'react'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'
import {
  Users, ShieldCheck, UserMinus, Search, Trash2,
  CheckCircle, AlertCircle, CheckSquare, BadgeCheck, UserX,
  Mail, Clock, Download, Plus, X, GraduationCap, ChevronDown
} from 'lucide-react'

const pjs = (size, weight, lh, color) => ({
  fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: size, fontWeight: weight, lineHeight: lh, color,
})

// ─── Toast ────────────────────────────────────────────────────
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
      {type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />} {msg}
    </div>
  )
}

// ─── CSV Export Helper ───────────────────────────
function exportUsersCSV(data, tab) {
  const headers = ['Name', 'Email', 'Role', 'Department', 'Status', 'Joined']
  const rows = data.map(u => [
    u.full_name,
    u.email,
    u.role,
    u.dept || '',
    u.is_verified ? 'Verified' : 'Pending/Suspended',
    new Date(u.created_at).toLocaleDateString()
  ])
  const csv = [headers, ...rows].map(r => r.map(c => `"${String(c || '').replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `users_${tab}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Add User Modal ──────────────────────────────
function UserModal({ user, onClose, onSave }) {
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    role: user?.role || 'student',
    dept: user?.dept || 'CSED',
    is_verified: user?.is_verified ?? true
  })
  const [loading, setLoading] = useState(false)

  const inputStyle = {
    width: '100%', padding: '0 16px', height: '48px', borderRadius: 12, border: '1.5px solid #e2e8f0',
    outline: 'none', boxSizing: 'border-box', fontFamily: "'Inter', sans-serif",
    fontSize: 14, color: '#1e293b', background: '#fff', transition: 'border-color 0.2s'
  }

  const selectStyle = {
    ...inputStyle, cursor: 'pointer', appearance: 'none',
    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3Csvg width='12' height='7' viewBox='0 0 12 7' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L6 6L11 1' stroke='%2364748b' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px center'
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSave(formData)
      onClose()
    } catch (err) {
      alert(err.message || 'Action failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
      <form onSubmit={handleSubmit} style={{ background: '#fff', borderRadius: 24, width: '100%', maxWidth: 440, padding: 32, boxShadow: '0 20px 50px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0 }}>{user ? 'Edit User' : 'Add New User'}</h2>
          <button type="button" onClick={onClose} style={{ border: 'none', background: '#f1f5f9', cursor: 'pointer', width: 32, height: 32, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}><X size={18} /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 8, display: 'block' }}>Full Name *</label>
            <input required value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })} style={inputStyle} placeholder="John Doe" />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 8, display: 'block' }}>Email *</label>
            <input required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} disabled={!!user} style={{ ...inputStyle, background: user ? '#f8fafc' : '#fff', color: user ? '#94a3b8' : '#1e293b' }} placeholder="user@thapar.edu" />
          </div>
          {!user && (
            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 8, display: 'block' }}>Role *</label>
              <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} style={selectStyle}>
                <option value="student">Student</option>
                <option value="faculty">Faculty</option>
                <option value="admin">Admin</option>
                <option value="guest">Guest</option>
              </select>
            </div>
          )}
          {formData.role === 'faculty' && (
            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 8, display: 'block' }}>Department *</label>
              <select value={formData.dept} onChange={e => setFormData({ ...formData, dept: e.target.value })} style={selectStyle}>
                {['CSED', 'Electronics', 'Mechanical', 'Civil', 'Physics', 'Mathematics', 'Biotech'].map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', background: '#f8fafc', borderRadius: 12, border: '1.5px solid #e2e8f0', marginTop: 4 }}>
            <input type="checkbox" checked={formData.is_verified} onChange={e => setFormData({ ...formData, is_verified: e.target.checked })} style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#4f46e5' }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Account Verified</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
          <button type="button" onClick={onClose} style={{ flex: 1, padding: '14px', borderRadius: 12, border: '1.5px solid #e2e8f0', background: 'transparent', fontWeight: 700, color: '#475569', cursor: 'pointer', fontSize: 15 }}>Cancel</button>
          <button type="submit" disabled={loading} style={{ flex: 2, padding: '14px', borderRadius: 12, border: 'none', background: '#4f46e5', color: '#fff', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>
            {loading ? 'Processing...' : (user ? 'Update Profile' : 'Add User')}
          </button>
        </div>
      </form>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────
export default function ManageUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('all') // all, student, faculty, admin, guest
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)
  const [toast, setToast] = useState({ msg: '', type: 'success' })
  const [showAddModal, setShowAddModal] = useState(false)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast({ msg: '', type: 'success' }), 3000)
  }

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [usersRes, advRes] = await Promise.allSettled([
        api.get('/api/admin/users'), // fetches all users
        api.get('/api/admin/student-advisors'),
      ])

      const advisorMap = {}
      if (advRes.status === 'fulfilled' && advRes.value?.success) {
        for (const a of (advRes.value.data || [])) {
          advisorMap[a.student_id] = {
            advisor_name: a.faculty?.users?.full_name,
            advisor_dept: a.faculty?.dept,
          }
        }
      }

      if (usersRes.status === 'fulfilled' && usersRes.value?.success) {
        setUsers((usersRes.value.data || []).map(u => ({ ...u, ...(advisorMap[u.id] || {}) })))
      }
    } catch (err) {
      console.error(err)
      showToast('Failed to load users', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleSaveUser = async (payload) => {
    const res = await api.post('/api/admin/users', payload)
    if (res.success) {
      const newUser = { ...res.user, full_name: payload.full_name, role: payload.role, dept: payload.dept, is_verified: payload.is_verified, created_at: new Date().toISOString() }
      setUsers(prev => [newUser, ...prev])
      showToast(`Added ${payload.full_name} successfully`)
    }
  }

  const handleChangeRole = async (user, newRole) => {
    if (!window.confirm(`Are you sure you want to change ${user.full_name}'s role to ${newRole.toUpperCase()}?`)) return
    try {
      await api.patch(`/api/admin/users/${user.id}`, { role: newRole })
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role: newRole } : u))
      showToast(`${user.full_name}'s role changed to ${newRole}`)
    } catch {
      showToast('Role change failed', 'error')
    }
  }

  const toggleVerify = async (user) => {
    const isUnverifying = user.is_verified
    const msg = isUnverifying ? `Suspend/Unverify ${user.full_name}?` : `Verify/Activate ${user.full_name}?`
    if (!window.confirm(msg)) return
    try {
      await api.post('/api/admin/verify-user', { userId: user.id, isVerified: !user.is_verified })
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_verified: !u.is_verified } : u))
      showToast(`${user.full_name} status updated`)
    } catch {
      showToast('Action failed', 'error')
    }
  }

  const handleDelete = async (user) => {
    if (!window.confirm(`Permanently delete ${user.full_name}? This cannot be undone.`)) return
    try {
      await api.delete(`/api/admin/users/${user.id}`)
      setUsers(prev => prev.filter(u => u.id !== user.id))
      setSelectedIds(prev => { const n = new Set(prev); n.delete(user.id); return n })
      showToast(`${user.full_name} deleted`)
    } catch {
      showToast('Delete failed', 'error')
    }
  }

  const bulkVerify = async (isVerified) => {
    if (!window.confirm(`${isVerified ? 'Verify' : 'Suspend'} ${selectedIds.size} users?`)) return
    setBulkLoading(true)
    try {
      await Promise.all([...selectedIds].map(id => api.post('/api/admin/verify-user', { userId: id, isVerified })))
      setUsers(prev => prev.map(u => selectedIds.has(u.id) ? { ...u, is_verified: isVerified } : u))
      setSelectedIds(new Set())
      showToast(`Successfully updated ${selectedIds.size} users`)
    } catch {
      showToast('Bulk update failed', 'error')
    } finally {
      setBulkLoading(false)
    }
  }

  const bulkDelete = async () => {
    if (!window.confirm(`Permanently delete ${selectedIds.size} users?`)) return
    setBulkLoading(true)
    try {
      await Promise.all([...selectedIds].map(id => api.delete(`/api/admin/users/${id}`)))
      setUsers(prev => prev.filter(u => !selectedIds.has(u.id)))
      setSelectedIds(new Set())
      showToast(`Deleted ${selectedIds.size} users`)
    } catch {
      showToast('Bulk delete failed', 'error')
    } finally {
      setBulkLoading(false)
    }
  }

  const displayedUsers = useMemo(() => {
    return users.filter(u => {
      if (activeTab !== 'all' && u.role !== activeTab) return false
      if (search && !u.full_name?.toLowerCase().includes(search.toLowerCase()) && !u.email?.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [users, activeTab, search])

  const stats = {
    total: users.length,
    active: users.filter(s => s.is_verified).length,
    suspended: users.filter(s => !s.is_verified).length,
  }

  const tabs = [
    { id: 'all', label: 'All Users' },
    { id: 'student', label: 'Students' },
    { id: 'faculty', label: 'Faculty' },
    { id: 'admin', label: 'Admins' },
    { id: 'guest', label: 'Guests' },
  ]

  return (
    <PageLayout>
      <Toast msg={toast.msg} type={toast.type} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={22} color="#4f46e5" />
          </div>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: '#0f172a', margin: 0 }}>User Management</h1>
            <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>Central hub for all roles, accounts, and permissions.</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => exportUsersCSV(displayedUsers, activeTab)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#fff', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <Download size={16} /> Export
          </button>
          <button onClick={() => setShowAddModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', borderRadius: 10, border: 'none', background: '#4f46e5', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <Plus size={16} /> Add User
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        {[
          { label: 'Total Users', value: stats.total, bg: '#f8fafc', color: '#64748b', icon: <Users size={20} /> },
          { label: 'Active / Verified', value: stats.active, bg: '#ecfdf5', color: '#059669', icon: <ShieldCheck size={20} /> },
          { label: 'Pending / Suspended', value: stats.suspended, bg: '#fff7ed', color: '#d97706', icon: <UserMinus size={20} /> },
        ].map((s, i) => (
          <div key={i} style={{ background: '#fff', padding: '20px 24px', borderRadius: 20, border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: s.bg, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{s.icon}</div>
            <div>
              <div style={pjs(12, 600, '16px', '#64748b')}>{s.label}</div>
              <div style={{ ...pjs(24, 800, '30px', '#0f172a'), marginTop: 2 }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid #e2e8f0', paddingBottom: 16, overflowX: 'auto' }}>
        {tabs.map(t => {
          const isActive = activeTab === t.id
          return (
            <button
              key={t.id} onClick={() => { setActiveTab(t.id); setSelectedIds(new Set()) }}
              style={{
                padding: '8px 16px', borderRadius: 100, border: 'none', cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap',
                background: isActive ? '#4f46e5' : '#f1f5f9',
                color: isActive ? '#fff' : '#64748b',
                fontWeight: isActive ? 700 : 600, fontSize: 13, fontFamily: "'Plus Jakarta Sans', sans-serif"
              }}
            >
              {t.label} ({t.id === 'all' ? users.length : users.filter(u => u.role === t.id).length})
            </button>
          )
        })}
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div style={{ background: '#ffffff', borderRadius: 16, padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', border: '1px solid #e2e8f0', boxShadow: '0 8px 24px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
            <div style={{ background: '#eef2ff', padding: '8px 12px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckSquare size={18} color="#4f46e5" />
              <span style={pjs(14, 700, '20px', '#4f46e5')}>{selectedIds.size} selected</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={() => bulkVerify(true)} disabled={bulkLoading} style={{ padding: '10px 18px', borderRadius: 12, border: '1px solid #a7f3d0', background: '#ecfdf5', color: '#047857', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', gap: 6 }}>
              <BadgeCheck size={16} /> Bulk Verify
            </button>
            <button onClick={() => bulkVerify(false)} disabled={bulkLoading} style={{ padding: '10px 18px', borderRadius: 12, border: '1px solid #fed7aa', background: '#fff7ed', color: '#9a3412', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', gap: 6 }}>
              <UserX size={16} /> Bulk Suspend
            </button>
            <button onClick={bulkDelete} disabled={bulkLoading} style={{ padding: '10px 18px', borderRadius: 12, border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', gap: 6 }}>
              <Trash2 size={16} /> Delete Selected
            </button>
            <div style={{ width: 1, background: '#e2e8f0', margin: '0 4px' }} />
            <button onClick={() => setSelectedIds(new Set())} style={{ padding: '10px', borderRadius: 12, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#64748b', cursor: 'pointer', display: 'flex' }}>
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Table card */}
      <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9', boxShadow: '0 4px 24px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ position: 'relative', width: '300px', flexShrink: 0 }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              style={{ width: '100%', padding: '10px 16px 10px 34px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: "'Inter', sans-serif" }}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', ...pjs(14, 500, '20px', '#94a3b8') }}>Loading users...</div>
        ) : displayedUsers.length === 0 ? (
          <div style={{ padding: '60px 24px', textAlign: 'center' }}>
            <Users size={40} color="#e2e8f0" style={{ margin: '0 auto 12px', display: 'block' }} />
            <div style={pjs(15, 600, '20px', '#0f172a')}>No users found</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '13px 20px', width: 40 }}>
                    <input
                      type="checkbox"
                      checked={displayedUsers.length > 0 && selectedIds.size === displayedUsers.length}
                      onChange={(e) => setSelectedIds(e.target.checked ? new Set(displayedUsers.map(d => d.id)) : new Set())}
                      style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#4f46e5' }}
                    />
                  </th>
                  {['User', 'Role', 'Joined', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '13px 20px', textAlign: 'left', ...pjs(11, 700, '14px', '#64748b'), textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayedUsers.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid #f8fafc', transition: 'background 0.1s' }} onMouseEnter={e => e.currentTarget.style.background = '#fafafa'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '14px 20px' }}>
                      <input type="checkbox" checked={selectedIds.has(u.id)} onChange={() => toggleSelect(u.id)} style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#4f46e5' }} />
                    </td>
                    {/* User info */}
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 38, height: 38, borderRadius: 12, background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden', border: '1px solid #bbf7d0' }}>
                          {u.avatar_url ? <img src={u.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={pjs(14, 700, '18px', '#16a34a')}>{u.full_name?.charAt(0)}</span>}
                        </div>
                        <div>
                          <div style={pjs(14, 700, '18px', '#0f172a')}>{u.full_name}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                            <Mail size={11} color="#94a3b8" />
                            <span style={pjs(11, 400, '14px', '#64748b')}>{u.email}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Role & Specifics */}
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 6, display: 'inline-block', width: 'fit-content', background: u.role === 'admin' ? '#fee2e2' : u.role === 'faculty' ? '#eef2ff' : u.role === 'guest' ? '#f1f5f9' : '#ecfdf5', color: u.role === 'admin' ? '#dc2626' : u.role === 'faculty' ? '#4f46e5' : u.role === 'guest' ? '#64748b' : '#059669', textTransform: 'uppercase' }}>
                          {u.role}
                        </span>
                        {u.role === 'faculty' && u.dept && <span style={pjs(11, 600, '14px', '#475569')}>Dept: {u.dept}</span>}
                        {u.role === 'student' && u.advisor_name && <span style={pjs(11, 600, '14px', '#475569')}>Adv: {u.advisor_name}</span>}
                      </div>
                    </td>

                    {/* Joined */}
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Clock size={13} color="#94a3b8" />
                        <span style={pjs(12, 500, '18px', '#64748b')}>{new Date(u.created_at).toLocaleDateString()}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td style={{ padding: '14px 20px' }}>
                      <div
                        onClick={() => toggleVerify(u)}
                        title="Click to toggle status"
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 20, cursor: 'pointer',
                          border: '1px solid', transition: 'all 0.15s', fontSize: 10, fontWeight: 800, letterSpacing: '0.05em', fontFamily: "'Plus Jakarta Sans', sans-serif",
                          background: u.is_verified ? '#ecfdf5' : '#fff7ed', color: u.is_verified ? '#047857' : '#9a3412', borderColor: u.is_verified ? '#a7f3d0' : '#fed7aa',
                        }}
                      >
                        {u.is_verified ? <ShieldCheck size={12} /> : <UserMinus size={12} />}
                        {u.is_verified ? 'VERIFIED' : 'SUSPENDED'}
                      </div>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <select
                          onChange={(e) => { if (e.target.value) handleChangeRole(u, e.target.value) }}
                          value=""
                          style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, fontWeight: 600, color: '#4f46e5' }}
                        >
                          <option value="" disabled>Change Role...</option>
                          {['student', 'faculty', 'admin', 'guest'].map(r => r !== u.role && <option key={r} value={r}>Make {r}</option>)}
                        </select>
                        <button onClick={() => handleDelete(u)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 10px', borderRadius: 8, border: '1px solid #fecaca', background: '#fff', cursor: 'pointer', color: '#ef4444' }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAddModal && <UserModal onClose={() => setShowAddModal(false)} onSave={handleSaveUser} />}
    </PageLayout>
  )
}
