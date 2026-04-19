import { useState, useEffect } from 'react'
import AdminPageTemplate from '../../components/admin/AdminPageTemplate'
import api from '../../lib/api'
import { UserX, Mail, BadgeCheck, Users, ShieldCheck, Clock, X, Save, Plus, Download, CheckSquare, Trash2 } from 'lucide-react'

const inputStyle = { 
  width: '100%', padding: '0 16px', height: '48px', borderRadius: 12, border: '1.5px solid #e2e8f0', 
  outline: 'none', boxSizing: 'border-box', fontFamily: "'Inter', sans-serif", 
  fontSize: 14, color: '#1e293b', background: '#fff', transition: 'border-color 0.2s'
}

const selectStyle = {
  ...inputStyle,
  cursor: 'pointer',
  appearance: 'none',
  backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3Csvg width='12' height='7' viewBox='0 0 12 7' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L6 6L11 1' stroke='%2364748b' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 16px center'
}

/* ─── Faculty Form Modal ────────────────────────── */
function FacultyModal({ user, onClose, onSave }) {
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    dept: user?.dept || 'CSED',
    is_verified: user?.is_verified || false
  })
  const [loading, setLoading] = useState(false)

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
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0 }}>{user ? 'Edit Professor' : 'Add New Professor'}</h2>
          <button type="button" onClick={onClose} style={{ border: 'none', background: '#f1f5f9', cursor: 'pointer', width: 32, height: 32, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}><X size={18} /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 8, display: 'block' }}>Full Name *</label>
            <input
              required value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })}
              style={inputStyle}
              placeholder="e.g. Dr. Jane Doe"
            />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 8, display: 'block' }}>Official Email *</label>
            <input
              required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
              disabled={!!user}
              style={{ ...inputStyle, background: user ? '#f8fafc' : '#fff', color: user ? '#94a3b8' : '#1e293b' }}
              placeholder="jane.doe@thapar.edu"
            />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 8, display: 'block' }}>Department *</label>
            <select
              value={formData.dept} onChange={e => setFormData({ ...formData, dept: e.target.value })}
              style={selectStyle}
            >
              {['CSED', 'Electronics', 'Mechanical', 'Civil', 'Physics', 'Mathematics', 'Biotech'].map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', background: '#f8fafc', borderRadius: 12, border: '1.5px solid #e2e8f0', marginTop: 4 }}>
            <input type="checkbox" checked={formData.is_verified} onChange={e => setFormData({ ...formData, is_verified: e.target.checked })} style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#4f46e5' }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Verified Scholar Account</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
          <button type="button" onClick={onClose} style={{ flex: 1, padding: '14px', borderRadius: 12, border: '1.5px solid #e2e8f0', background: 'transparent', fontWeight: 700, color: '#475569', cursor: 'pointer', fontSize: 15 }}>Cancel</button>
          <button type="submit" disabled={loading} style={{ flex: 2, padding: '14px', borderRadius: 12, border: 'none', background: '#4f46e5', color: '#fff', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 15 }}>
            {loading ? 'Processing...' : (user ? 'Update Profile' : 'Add Professor')}
          </button>
        </div>
      </form>
    </div>
  )
}

/* ─── CSV Export Helper ─────────────────────────── */
function exportFacultyCSV(data) {
  const headers = ['Name', 'Email', 'Department', 'Status', 'Joined']
  const rows = data.map(u => [
    u.full_name,
    u.email,
    u.dept || '',
    u.is_verified ? 'Verified' : 'Pending',
    new Date(u.created_at).toLocaleDateString()
  ])
  const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'faculty.csv'
  a.click()
  URL.revokeObjectURL(url)
}

/* ═══════════════════════════════════════════════════════════════
   Main Management Component
════════════════════════════════════════════════════════════════ */
export default function ManageFaculty() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalUser, setModalUser] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/admin/users?role=faculty')
      if (res.success && res.data) setData(res.data)
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleSave = async (payload) => {
    setLoading(true)
    try {
      if (modalUser) {
        const res = await api.patch(`/api/admin/users/${modalUser.id}`, payload)
        if (res.success) setData(prev => prev.map(u => u.id === modalUser.id ? { ...u, ...payload } : u))
      } else {
        const res = await api.post('/api/admin/users', payload)
        if (res.success) {
          const newUser = { ...res.user, full_name: payload.full_name, dept: payload.dept, is_verified: payload.is_verified, created_at: new Date().toISOString() }
          setData(prev => [newUser, ...prev])
          alert(`Successfully added ${payload.full_name}. Default password: Password123!`)
        }
      }
    } catch (err) {
      console.error('Save failed:', err)
      alert(err.message || 'Operation failed. Please try again.')
    } finally { setLoading(false) }
  }

  const toggleVerify = async (user) => {
    const isUnverifying = user.is_verified
    const msg = isUnverifying
      ? `Revoke verification for ${user.full_name}?`
      : `Verify ${user.full_name} as an official Faculty member?`
    if (!window.confirm(msg)) return
    try {
      const res = await api.post('/api/admin/verify-user', { userId: user.id, isVerified: !user.is_verified })
      if (res.success) setData(prev => prev.map(u => u.id === user.id ? { ...u, is_verified: !u.is_verified } : u))
    } catch { alert('Action failed. Please try again.') }
  }

  const handleDelete = async (user) => {
    if (!window.confirm(`Permanently remove ${user.full_name}? ALL personal data will be lost.`)) return
    setLoading(true)
    try {
      const res = await api.delete(`/api/admin/users/${user.id}`)
      if (res.success) {
        setData(prev => prev.filter(u => u.id !== user.id))
        setSelectedIds(prev => { const n = new Set(prev); n.delete(user.id); return n })
      }
    } catch { alert('Removal failed.') } finally { setLoading(false) }
  }

  // ─── Bulk Actions ─────────────────────────────
  const bulkVerify = async (isVerified) => {
    if (!window.confirm(`${isVerified ? 'Verify' : 'Unverify'} ${selectedIds.size} selected faculty member(s)?`)) return
    setBulkLoading(true)
    try {
      await Promise.all([...selectedIds].map(id =>
        api.post('/api/admin/verify-user', { userId: id, isVerified })
      ))
      setData(prev => prev.map(u => selectedIds.has(u.id) ? { ...u, is_verified: isVerified } : u))
      setSelectedIds(new Set())
    } catch { alert('Bulk action failed. Some updates may not have applied.') } finally { setBulkLoading(false) }
  }

  const bulkDelete = async () => {
    if (!window.confirm(`Permanently delete ${selectedIds.size} faculty member(s)? This cannot be undone.`)) return
    setBulkLoading(true)
    try {
      await Promise.all([...selectedIds].map(id => api.delete(`/api/admin/users/${id}`)))
      setData(prev => prev.filter(u => !selectedIds.has(u.id)))
      setSelectedIds(new Set())
    } catch { alert('Bulk delete failed. Some records may not have been removed.') } finally { setBulkLoading(false) }
  }

  const stats = {
    total: data.length,
    verified: data.filter(u => u.is_verified).length,
    pending: data.filter(u => !u.is_verified).length
  }

  const columns = [
    {
      key: 'select',
      label: (
        <input
          type="checkbox"
          checked={data.length > 0 && selectedIds.size === data.length}
          onChange={(e) => {
            if (e.target.checked) setSelectedIds(new Set(data.map(d => d.id)))
            else setSelectedIds(new Set())
          }}
          style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#4f46e5' }}
        />
      ),
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedIds.has(row.id)}
          onChange={() => toggleSelect(row.id)}
          onClick={e => e.stopPropagation()}
          style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#4f46e5' }}
        />
      )
    },
    {
      key: 'full_name',
      label: 'Professor',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {row.avatar_url ? (
            <img src={row.avatar_url} alt={row.full_name} style={{ width: 40, height: 40, borderRadius: 12, objectFit: 'cover', border: '1px solid #e2e8f0' }} />
          ) : (
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#475569', fontSize: 16, border: '1px solid #e2e8f0' }}>
              {row.full_name.charAt(0)}
            </div>
          )}
          <div>
            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 14 }}>{row.full_name}</div>
            <div style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
              <Mail size={12} /> {row.email}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'dept',
      label: 'Department',
      render: (row) => (
        <span style={{ fontSize: 11, fontWeight: 800, color: '#4f46e5', background: '#eef2ff', padding: '4px 10px', borderRadius: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {row.dept || 'CSED'}
        </span>
      )
    },
    {
      key: 'created_at',
      label: 'Joined Date',
      render: (row) => (
        <div style={{ fontSize: 13, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Clock size={14} />
          {new Date(row.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
      )
    },
    {
      key: 'is_verified',
      label: 'Status',
      render: (row) => (
        <select
          value={row.is_verified ? 'verified' : 'pending'}
          onChange={(e) => { e.stopPropagation(); toggleVerify(row); }}
          onClick={(e) => e.stopPropagation()}
          style={{
            backgroundColor: row.is_verified ? '#ecfdf5' : '#fff7ed',
            color: row.is_verified ? '#047857' : '#9a3412',
            padding: '6px 28px 6px 14px', borderRadius: 50, fontSize: 10, fontWeight: 800,
            cursor: 'pointer', border: row.is_verified ? '1px solid #a7f3d0' : '1px solid #fed7aa',
            outline: 'none', letterSpacing: '0.05em', fontFamily: "'Plus Jakarta Sans', sans-serif",
            appearance: 'none',
            backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='${encodeURIComponent(row.is_verified ? '#047857' : '#9a3412')}' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center'
          }}
        >
          <option value="verified" style={{color: '#0f172a'}}>VERIFIED</option>
          <option value="pending" style={{color: '#0f172a'}}>PENDING</option>
        </select>
      )
    }
  ]

  return (
    <AdminPageTemplate
      title="Faculty Management"
      description="Holistic administrative control over faculty access, verification status, and profile integrity."
      columns={columns}
      data={data}
      loading={loading}
      onAdd={() => setShowAddModal(true)}
      onEdit={(u) => setModalUser(u)}
      onDelete={handleDelete}
      hideTable={false}
      headerAction={
        <button
          onClick={() => exportFacultyCSV(data)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#fff', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: '0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#4f46e5'; e.currentTarget.style.color = '#4f46e5' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#475569' }}
        >
          <Download size={15} /> Export CSV
        </button>
      }
    >
      {/* Stats Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: selectedIds.size > 0 ? 16 : 24 }}>
        {[
          { label: 'Total Faculty', value: stats.total, icon: <Users size={20} />, color: '#4f46e5', bg: '#eef2ff' },
          { label: 'Verified Accounts', value: stats.verified, icon: <ShieldCheck size={20} />, color: '#10b981', bg: '#ecfdf5' },
          { label: 'Pending Approval', value: stats.pending, icon: <Clock size={20} />, color: '#f59e0b', bg: '#fffbeb' },
        ].map((s, idx) => (
          <div key={idx} style={{ background: '#fff', padding: '24px', borderRadius: 20, border: '1px solid #f1f5f9', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: s.bg, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a' }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div style={{ background: '#ffffff', borderRadius: 16, padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 20, border: '1px solid #e2e8f0', boxShadow: '0 8px 24px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
            <div style={{ background: '#eef2ff', padding: '8px 12px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckSquare size={18} color="#4f46e5" />
              <span style={{ color: '#4f46e5', fontSize: 14, fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {selectedIds.size} member{selectedIds.size !== 1 ? 's' : ''} selected
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={() => bulkVerify(true)} disabled={bulkLoading}
              style={{ padding: '10px 18px', borderRadius: 12, border: '1px solid #a7f3d0', background: '#ecfdf5', color: '#047857', fontSize: 13, fontWeight: 700, cursor: bulkLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: '0.2s', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              onMouseEnter={e => { e.currentTarget.style.background = '#d1fae5' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#ecfdf5' }}
            >
              <BadgeCheck size={16} /> Bulk Verify
            </button>
            <button
              onClick={() => bulkVerify(false)} disabled={bulkLoading}
              style={{ padding: '10px 18px', borderRadius: 12, border: '1px solid #fed7aa', background: '#fff7ed', color: '#9a3412', fontSize: 13, fontWeight: 700, cursor: bulkLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: '0.2s', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              onMouseEnter={e => { e.currentTarget.style.background = '#ffedd5' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#fff7ed' }}
            >
              <UserX size={16} /> Bulk Unverify
            </button>
            <button
              onClick={bulkDelete} disabled={bulkLoading}
              style={{ padding: '10px 18px', borderRadius: 12, border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', fontSize: 13, fontWeight: 700, cursor: bulkLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: '0.2s', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#fef2f2' }}
            >
              <Trash2 size={16} /> Delete Selected
            </button>
            <div style={{ width: 1, background: '#e2e8f0', margin: '0 4px' }} />
            <button
              onClick={() => setSelectedIds(new Set())}
              style={{ padding: '10px', borderRadius: 12, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: '0.2s' }}
               onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {(showAddModal || modalUser) && (
        <FacultyModal
          user={modalUser}
          onClose={() => { setModalUser(null); setShowAddModal(false) }}
          onSave={handleSave}
        />
      )}
    </AdminPageTemplate>
  )
}
