import { useState, useEffect, useCallback, useMemo } from 'react'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'
import { Users, ShieldCheck, UserMinus, Search, Trash2, CheckCircle, AlertCircle, CheckSquare, BadgeCheck, UserX, Mail, Clock, Download, Plus, X } from 'lucide-react'

function Toast({ msg, type }) {
  if (!msg) return null
  return (
    <div className={`fixed bottom-8 right-8 z-[9999] px-[22px] py-3.5 rounded-[14px] text-white shadow-[0_8px_32px_rgba(0,0,0,0.18)] text-[14px] font-semibold flex items-center gap-2 ${type === 'success' ? 'bg-green-600' : 'bg-red-500'}`}>
      {type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />} {msg}
    </div>
  )
}

function exportUsersCSV(data, tab) {
  const headers = ['Name', 'Email', 'Role', 'Department', 'Status', 'Joined']
  const rows = data.map(u => [u.full_name, u.email, u.role, u.dept || '', u.is_verified ? 'Verified' : 'Pending/Suspended', new Date(u.created_at).toLocaleDateString()])
  const csv = [headers, ...rows].map(r => r.map(c => `"${String(c || '').replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `users_${tab}.csv`; a.click()
  URL.revokeObjectURL(url)
}

const ROLE_CLS = {
  admin:   'bg-red-100 text-red-600',
  faculty: 'bg-indigo-50 text-brand',
  guest:   'bg-slate-100 text-slate-500',
  student: 'bg-green-50 text-green-700',
}

const fieldCls = 'w-full h-12 px-4 rounded-[12px] border-[1.5px] border-slate-200 text-[14px] outline-none box-border bg-white focus:border-brand transition-colors'

function UserModal({ user, onClose, onSave }) {
  const [formData, setFormData] = useState({ full_name: user?.full_name || '', email: user?.email || '', role: user?.role || 'student', dept: user?.dept || 'CSED', is_verified: user?.is_verified ?? true })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try { await onSave(formData); onClose() } catch (err) { alert(err.message || 'Action failed') } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[4px] flex items-center justify-center z-[1000] p-5">
      <form onSubmit={handleSubmit} className="bg-white rounded-[24px] w-full max-w-[440px] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.15)]">
        <div className="flex justify-between mb-6">
          <h2 className="text-[20px] font-extrabold t-primary m-0">{user ? 'Edit User' : 'Add New User'}</h2>
          <button type="button" onClick={onClose} className="border-0 bg-slate-100 cursor-pointer w-8 h-8 rounded-full flex items-center justify-center text-slate-500"><X size={18} /></button>
        </div>
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-[13px] font-bold text-slate-600 mb-2 block">Full Name *</label>
            <input required value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })} className={fieldCls} placeholder="John Doe" />
          </div>
          <div>
            <label className="text-[13px] font-bold text-slate-600 mb-2 block">Email *</label>
            <input required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} disabled={!!user}
              className={`${fieldCls} ${user ? 'bg-slate-50 text-slate-400' : ''}`} placeholder="user@thapar.edu" />
          </div>
          {!user && (
            <div>
              <label className="text-[13px] font-bold text-slate-600 mb-2 block">Role *</label>
              <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} className={fieldCls}>
                <option value="student">Student</option>
                <option value="faculty">Faculty</option>
                <option value="admin">Admin</option>
                <option value="guest">Guest</option>
              </select>
            </div>
          )}
          {formData.role === 'faculty' && (
            <div>
              <label className="text-[13px] font-bold text-slate-600 mb-2 block">Department *</label>
              <select value={formData.dept} onChange={e => setFormData({ ...formData, dept: e.target.value })} className={fieldCls}>
                {['CSED', 'Electronics', 'Mechanical', 'Civil', 'Physics', 'Mathematics', 'Biotech'].map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          )}
          <div className="flex items-center gap-2.5 px-4 py-3.5 bg-slate-50 rounded-[12px] border-[1.5px] border-slate-200 mt-1">
            <input type="checkbox" checked={formData.is_verified} onChange={e => setFormData({ ...formData, is_verified: e.target.checked })} className="w-[18px] h-[18px] cursor-pointer accent-brand" />
            <span className="text-[14px] font-bold t-primary">Account Verified</span>
          </div>
        </div>
        <div className="flex gap-3 mt-8">
          <button type="button" onClick={onClose} className="flex-1 py-3.5 rounded-[12px] border-[1.5px] border-slate-200 bg-transparent font-bold text-slate-600 cursor-pointer text-[15px]">Cancel</button>
          <button type="submit" disabled={loading} className="flex-[2] py-3.5 rounded-[12px] border-0 bg-brand text-white font-bold cursor-pointer flex items-center justify-center text-[15px]">
            {loading ? 'Processing...' : (user ? 'Update Profile' : 'Add User')}
          </button>
        </div>
      </form>
    </div>
  )
}

export default function ManageUsers() {
  const [users, setUsers]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)
  const [toast, setToast]         = useState({ msg: '', type: 'success' })
  const [showAddModal, setShowAddModal] = useState(false)

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast({ msg: '', type: 'success' }), 3000) }

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [usersRes, advRes] = await Promise.allSettled([api.get('/api/admin/users'), api.get('/api/admin/student-advisors')])
      const advisorMap = {}
      if (advRes.status === 'fulfilled' && advRes.value?.success) {
        for (const a of (advRes.value.data || [])) advisorMap[a.student_id] = { advisor_name: a.faculty?.users?.full_name, advisor_dept: a.faculty?.dept }
      }
      if (usersRes.status === 'fulfilled' && usersRes.value?.success) {
        setUsers((usersRes.value.data || []).map(u => ({ ...u, ...(advisorMap[u.id] || {}) })))
      }
    } catch { showToast('Failed to load users', 'error') } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const toggleSelect = (id) => {
    setSelectedIds(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next })
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
    if (!window.confirm(`Change ${user.full_name}'s role to ${newRole.toUpperCase()}?`)) return
    try {
      await api.patch(`/api/admin/users/${user.id}`, { role: newRole })
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role: newRole } : u))
      showToast(`${user.full_name}'s role changed to ${newRole}`)
    } catch { showToast('Role change failed', 'error') }
  }

  const toggleVerify = async (user) => {
    if (!window.confirm(user.is_verified ? `Suspend/Unverify ${user.full_name}?` : `Verify/Activate ${user.full_name}?`)) return
    try {
      await api.post('/api/admin/verify-user', { userId: user.id, isVerified: !user.is_verified })
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_verified: !u.is_verified } : u))
      showToast(`${user.full_name} status updated`)
    } catch { showToast('Action failed', 'error') }
  }

  const handleDelete = async (user) => {
    if (!window.confirm(`Permanently delete ${user.full_name}? This cannot be undone.`)) return
    try {
      await api.delete(`/api/admin/users/${user.id}`)
      setUsers(prev => prev.filter(u => u.id !== user.id))
      setSelectedIds(prev => { const n = new Set(prev); n.delete(user.id); return n })
      showToast(`${user.full_name} deleted`)
    } catch { showToast('Delete failed', 'error') }
  }

  const bulkVerify = async (isVerified) => {
    if (!window.confirm(`${isVerified ? 'Verify' : 'Suspend'} ${selectedIds.size} users?`)) return
    setBulkLoading(true)
    try {
      await Promise.all([...selectedIds].map(id => api.post('/api/admin/verify-user', { userId: id, isVerified })))
      setUsers(prev => prev.map(u => selectedIds.has(u.id) ? { ...u, is_verified: isVerified } : u))
      setSelectedIds(new Set()); showToast(`Successfully updated ${selectedIds.size} users`)
    } catch { showToast('Bulk update failed', 'error') } finally { setBulkLoading(false) }
  }

  const bulkDelete = async () => {
    if (!window.confirm(`Permanently delete ${selectedIds.size} users?`)) return
    setBulkLoading(true)
    try {
      await Promise.all([...selectedIds].map(id => api.delete(`/api/admin/users/${id}`)))
      setUsers(prev => prev.filter(u => !selectedIds.has(u.id)))
      setSelectedIds(new Set()); showToast(`Deleted ${selectedIds.size} users`)
    } catch { showToast('Bulk delete failed', 'error') } finally { setBulkLoading(false) }
  }

  const displayedUsers = useMemo(() => users.filter(u => {
    if (activeTab !== 'all' && u.role !== activeTab) return false
    if (search && !u.full_name?.toLowerCase().includes(search.toLowerCase()) && !u.email?.toLowerCase().includes(search.toLowerCase())) return false
    return true
  }), [users, activeTab, search])

  const stats = { total: users.length, active: users.filter(s => s.is_verified).length, suspended: users.filter(s => !s.is_verified).length }

  const tabs = [
    { id: 'all', label: 'All Users' }, { id: 'student', label: 'Students' },
    { id: 'faculty', label: 'Faculty' }, { id: 'admin', label: 'Admins' }, { id: 'guest', label: 'Guests' },
  ]

  return (
    <PageLayout>
      <Toast msg={toast.msg} type={toast.type} />

      <div className="flex justify-between items-start flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-[14px] bg-indigo-50 flex items-center justify-center">
            <Users size={22} color="#4f46e5" />
          </div>
          <div>
            <h1 className="text-[26px] font-bold t-primary m-0">User Management</h1>
            <p className="text-[14px] t-muted m-0">Central hub for all roles, accounts, and permissions.</p>
          </div>
        </div>
        <div className="flex gap-2.5">
          <button onClick={() => exportUsersCSV(displayedUsers, activeTab)} className="flex items-center gap-2 px-[18px] py-[9px] rounded-[10px] border-[1.5px] border-slate-200 bg-white text-slate-600 text-[13px] font-semibold cursor-pointer hover:bg-slate-50 transition-colors">
            <Download size={16} /> Export
          </button>
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-[18px] py-[9px] rounded-[10px] border-0 bg-brand text-white text-[13px] font-semibold cursor-pointer">
            <Plus size={16} /> Add User
          </button>
        </div>
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        {[
          { label: 'Total Users',           value: stats.total,     bg: 'bg-slate-50',   iconBg: 'bg-slate-100',   icon: <Users size={20} className="text-slate-500" /> },
          { label: 'Active / Verified',      value: stats.active,    bg: 'bg-white',      iconBg: 'bg-green-50',    icon: <ShieldCheck size={20} className="text-emerald-600" /> },
          { label: 'Pending / Suspended',    value: stats.suspended, bg: 'bg-white',      iconBg: 'bg-amber-50',    icon: <UserMinus size={20} className="text-amber-600" /> },
        ].map((s, i) => (
          <div key={i} className={`${s.bg} px-6 py-5 rounded-[20px] border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex items-center gap-4`}>
            <div className={`w-11 h-11 rounded-[12px] ${s.iconBg} flex items-center justify-center shrink-0`}>{s.icon}</div>
            <div>
              <div className="text-[12px] font-semibold t-muted">{s.label}</div>
              <div className="text-[24px] font-extrabold t-primary mt-0.5">{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 border-b border-slate-200 pb-4 overflow-x-auto">
        {tabs.map(t => (
          <button key={t.id} onClick={() => { setActiveTab(t.id); setSelectedIds(new Set()) }}
            className={`px-4 py-2 rounded-[100px] border-0 cursor-pointer transition-all whitespace-nowrap text-[13px] ${activeTab === t.id ? 'bg-brand text-white font-bold' : 'bg-slate-100 text-slate-500 font-semibold'}`}>
            {t.label} ({t.id === 'all' ? users.length : users.filter(u => u.role === t.id).length})
          </button>
        ))}
      </div>

      {selectedIds.size > 0 && (
        <div className="bg-white rounded-[16px] px-6 py-4 flex items-center gap-4 flex-wrap border border-slate-200 shadow-[0_8px_24px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-2.5 flex-1">
            <div className="bg-indigo-50 px-3 py-2 rounded-[10px] flex items-center gap-2">
              <CheckSquare size={18} color="#4f46e5" />
              <span className="text-[14px] font-bold text-brand">{selectedIds.size} selected</span>
            </div>
          </div>
          <div className="flex gap-2.5 flex-wrap">
            <button onClick={() => bulkVerify(true)}  disabled={bulkLoading} className="flex items-center gap-1.5 px-[18px] py-2.5 rounded-[12px] border border-green-200 bg-green-50 text-green-800 text-[13px] font-bold cursor-pointer"><BadgeCheck size={16} /> Bulk Verify</button>
            <button onClick={() => bulkVerify(false)} disabled={bulkLoading} className="flex items-center gap-1.5 px-[18px] py-2.5 rounded-[12px] border border-orange-200 bg-orange-50 text-orange-800 text-[13px] font-bold cursor-pointer"><UserX size={16} /> Bulk Suspend</button>
            <button onClick={bulkDelete}             disabled={bulkLoading} className="flex items-center gap-1.5 px-[18px] py-2.5 rounded-[12px] border border-red-200 bg-red-50 text-red-600 text-[13px] font-bold cursor-pointer"><Trash2 size={16} /> Delete Selected</button>
            <div className="w-px bg-slate-200 mx-1" />
            <button onClick={() => setSelectedIds(new Set())} className="p-2.5 rounded-[12px] border border-slate-200 bg-slate-50 text-slate-500 cursor-pointer flex"><X size={18} /></button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-[20px] border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="px-6 py-[18px] border-b border-slate-50 flex items-center justify-between gap-3">
          <div className="relative w-[300px] shrink-0">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email..."
              className="w-full py-2.5 pl-[34px] pr-4 rounded-[10px] border-[1.5px] border-slate-200 text-[14px] outline-none box-border focus:border-brand transition-colors" />
          </div>
        </div>

        {loading ? (
          <div className="py-[60px] text-center text-[14px] text-slate-400">Loading users...</div>
        ) : displayedUsers.length === 0 ? (
          <div className="py-[60px] px-6 text-center">
            <Users size={40} color="#e2e8f0" className="mx-auto mb-3 block" />
            <div className="text-[15px] font-semibold t-primary">No users found</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-5 py-[13px] w-10">
                    <input type="checkbox" checked={displayedUsers.length > 0 && selectedIds.size === displayedUsers.length}
                      onChange={e => setSelectedIds(e.target.checked ? new Set(displayedUsers.map(d => d.id)) : new Set())}
                      className="w-4 h-4 cursor-pointer accent-brand" />
                  </th>
                  {['User', 'Role', 'Joined', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-[13px] text-left text-[11px] font-bold text-slate-500 uppercase tracking-[0.05em] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayedUsers.map(u => (
                  <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-[14px]">
                      <input type="checkbox" checked={selectedIds.has(u.id)} onChange={() => toggleSelect(u.id)} className="w-4 h-4 cursor-pointer accent-brand" />
                    </td>
                    <td className="px-5 py-[14px]">
                      <div className="flex items-center gap-2.5">
                        <div className="w-[38px] h-[38px] rounded-[12px] bg-gradient-to-br from-green-50 to-green-100 border border-green-200 flex items-center justify-center shrink-0 overflow-hidden">
                          {u.avatar_url ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" /> : <span className="text-[14px] font-bold text-green-700">{u.full_name?.charAt(0)}</span>}
                        </div>
                        <div>
                          <div className="text-[14px] font-bold t-primary">{u.full_name}</div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Mail size={11} color="#94a3b8" />
                            <span className="text-[11px] t-muted">{u.email}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-[14px]">
                      <div className="flex flex-col gap-1">
                        <span className={`text-[10px] font-extrabold px-2 py-[3px] rounded-[6px] inline-block w-fit uppercase ${ROLE_CLS[u.role] || ROLE_CLS.student}`}>{u.role}</span>
                        {u.role === 'faculty' && u.dept && <span className="text-[11px] font-semibold text-slate-600">Dept: {u.dept}</span>}
                        {u.role === 'student' && u.advisor_name && <span className="text-[11px] font-semibold text-slate-600">Adv: {u.advisor_name}</span>}
                      </div>
                    </td>
                    <td className="px-5 py-[14px]">
                      <div className="flex items-center gap-[5px]">
                        <Clock size={13} color="#94a3b8" />
                        <span className="text-[12px] font-medium t-muted">{new Date(u.created_at).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-5 py-[14px]">
                      <div onClick={() => toggleVerify(u)} title="Click to toggle status" className={`inline-flex items-center gap-[5px] px-3 py-[5px] rounded-[20px] cursor-pointer border text-[10px] font-extrabold uppercase tracking-[0.05em] transition-all ${u.is_verified ? 'bg-green-50 text-green-800 border-green-200' : 'bg-orange-50 text-orange-800 border-orange-200'}`}>
                        {u.is_verified ? <ShieldCheck size={12} /> : <UserMinus size={12} />}
                        {u.is_verified ? 'VERIFIED' : 'SUSPENDED'}
                      </div>
                    </td>
                    <td className="px-5 py-[14px]">
                      <div className="flex gap-2">
                        <select onChange={e => { if (e.target.value) handleChangeRole(u, e.target.value) }} value=""
                          className="px-2.5 py-[6px] rounded-[8px] border border-slate-200 bg-white cursor-pointer text-[12px] font-semibold text-brand">
                          <option value="" disabled>Change Role...</option>
                          {['student', 'faculty', 'admin', 'guest'].map(r => r !== u.role && <option key={r} value={r}>Make {r}</option>)}
                        </select>
                        <button onClick={() => handleDelete(u)} className="flex items-center gap-[5px] px-2.5 py-[6px] rounded-[8px] border border-red-200 bg-white cursor-pointer text-red-500 hover:bg-red-50 transition-colors">
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
