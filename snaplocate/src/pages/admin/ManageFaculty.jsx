import { useState, useEffect } from 'react'
import AdminPageTemplate from '../../components/admin/AdminPageTemplate'
import api from '../../lib/api'
import { UserX, Mail, BadgeCheck, Users, ShieldCheck, Clock, X, Save, Plus, Download, CheckSquare } from 'lucide-react'

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
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
      <form onSubmit={handleSubmit} style={{ background: '#fff', borderRadius: 24, width: '100%', maxWidth: 440, padding: 32, boxShadow: '0 20px 50px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0 }}>{user ? 'Edit Professor' : 'Add New Professor'}</h2>
          <button type="button" onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b' }}><X size={24} /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6, display: 'block' }}>FULL NAME</label>
            <input
              required value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })}
              style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #e2e8f0', outline: 'none', boxSizing: 'border-box' }}
              placeholder="e.g. Dr. Jane Doe"
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6, display: 'block' }}>OFFICIAL EMAIL</label>
            <input
              required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
              disabled={!!user}
              style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #e2e8f0', outline: 'none', boxSizing: 'border-box', background: user ? '#f8fafc' : '#fff' }}
              placeholder="jane.doe@thapar.edu"
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6, display: 'block' }}>DEPARTMENT</label>
            <select
              value={formData.dept} onChange={e => setFormData({ ...formData, dept: e.target.value })}
              style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #e2e8f0', outline: 'none', background: '#fff' }}
            >
              {['CSED', 'Electronics', 'Mechanical', 'Civil', 'Physics', 'Mathematics', 'Biotech'].map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: '#f8fafc', borderRadius: 12 }}>
            <input type="checkbox" checked={formData.is_verified} onChange={e => setFormData({ ...formData, is_verified: e.target.checked })} style={{ width: 18, height: 18, cursor: 'pointer' }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>Verified Scholar Account</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
          <button type="button" onClick={onClose} style={{ flex: 1, padding: '12px', borderRadius: 12, border: '1.5px solid #e2e8f0', background: 'transparent', fontWeight: 600, color: '#475569', cursor: 'pointer' }}>Cancel</button>
          <button type="submit" disabled={loading} style={{ flex: 2, padding: '12px', borderRadius: 12, border: 'none', background: '#4f46e5', color: '#fff', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {loading ? 'Processing...' : (user ? <Save size={18} /> : <Plus size={18} />)}
            {loading ? '' : (user ? 'Update Profile' : 'Add Professor')}
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
      label: '',
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
        <div
          onClick={(e) => { e.stopPropagation(); toggleVerify(row) }}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: row.is_verified ? '#ecfdf5' : '#fff7ed',
            color: row.is_verified ? '#047857' : '#9a3412',
            padding: '6px 14px', borderRadius: 50, fontSize: 10, fontWeight: 800,
            cursor: 'pointer', border: row.is_verified ? '1px solid #a7f3d0' : '1px solid #fed7aa',
            transition: 'all 0.2s', letterSpacing: '0.05em'
          }}
        >
          {row.is_verified ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L14.8 5.4L19.2 6L19.8 10.4L23 13L20 16L19.8 20.4L15.4 21L12 24L8.6 21L4.2 20.4L4 16L1 13L4.2 10.4L4.8 6L9.2 5.4L12 2Z" fill="#10b981"/>
              <path d="M8.5 12.5L10.5 14.5L15.5 9.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ) : <UserX size={14} />}
          {row.is_verified ? 'VERIFIED' : 'PENDING'}
        </div>
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

      {/* CSV Export */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16, marginTop: -8 }}>
        <button
          onClick={() => exportFacultyCSV(data)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#fff', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: '0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#4f46e5'; e.currentTarget.style.color = '#4f46e5' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#475569' }}
        >
          <Download size={15} /> Export CSV
        </button>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div style={{ background: '#1e293b', borderRadius: 16, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
            <CheckSquare size={18} color="#a5b4fc" />
            <span style={{ color: '#e2e8f0', fontSize: 14, fontWeight: 600 }}>
              {selectedIds.size} member{selectedIds.size !== 1 ? 's' : ''} selected
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={() => bulkVerify(true)} disabled={bulkLoading}
              style={{ padding: '8px 16px', borderRadius: 10, border: 'none', background: '#10b981', color: '#fff', fontSize: 13, fontWeight: 600, cursor: bulkLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <BadgeCheck size={15} /> Bulk Verify
            </button>
            <button
              onClick={() => bulkVerify(false)} disabled={bulkLoading}
              style={{ padding: '8px 16px', borderRadius: 10, border: 'none', background: '#f59e0b', color: '#fff', fontSize: 13, fontWeight: 600, cursor: bulkLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <UserX size={15} /> Bulk Unverify
            </button>
            <button
              onClick={bulkDelete} disabled={bulkLoading}
              style={{ padding: '8px 16px', borderRadius: 10, border: 'none', background: '#ef4444', color: '#fff', fontSize: 13, fontWeight: 600, cursor: bulkLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              Delete Selected
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              style={{ padding: '8px', borderRadius: 10, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              <X size={16} />
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
