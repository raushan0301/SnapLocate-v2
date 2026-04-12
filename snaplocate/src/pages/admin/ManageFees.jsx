import { useState, useEffect, useCallback } from 'react'
import { CreditCard, DollarSign, AlertCircle, CheckCircle, Search, Plus, Edit } from 'lucide-react'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'

const pjs = (size, weight, lh, color) => ({
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  fontSize: size,
  fontWeight: weight,
  lineHeight: lh,
  color,
})

const STATUS_COLORS = {
  paid: { bg: '#dcfce7', color: '#15803d', label: 'Paid' },
  partial: { bg: '#fef9c3', color: '#a16207', label: 'Partial' },
  overdue: { bg: '#fee2e2', color: '#b91c1c', label: 'Overdue' },
  pending: { bg: '#f3f4f6', color: '#6b7280', label: 'Pending' },
}

const EMPTY_UPDATE = { amount_paid: '', status: 'pending', receipt_url: '' }
const EMPTY_CREATE = { student_id: '', semester: '', fee_type: '', amount_due: '', due_date: '' }

export default function ManageFees() {
  const [fees, setFees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')

  const [updateModal, setUpdateModal] = useState(null) // { record }
  const [updateForm, setUpdateForm] = useState(EMPTY_UPDATE)
  const [updateLoading, setUpdateLoading] = useState(false)

  const [createModal, setCreateModal] = useState(false)
  const [createForm, setCreateForm] = useState(EMPTY_CREATE)
  const [createLoading, setCreateLoading] = useState(false)
  const [students, setStudents] = useState([])

  useEffect(() => {
    api.get('/api/admin/users?role=student').then(res => {
      setStudents(res.data || [])
    }).catch(() => {})
  }, [])

  const fetchFees = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await api.get('/api/fees')
      setFees(res.data?.data ?? res.data ?? [])
    } catch (err) {
      setError(err.message || 'Failed to load fee records')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFees()
  }, [fetchFees])

  const filtered = fees.filter((f) => {
    const matchStatus = statusFilter === 'all' || f.status === statusFilter
    const name = (f.student_name || f.student?.name || '').toLowerCase()
    const email = (f.student_email || f.student?.email || '').toLowerCase()
    const matchSearch = !search || name.includes(search.toLowerCase()) || email.includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  // Stats
  const totalStudents = new Set(fees.map((f) => f.student_id)).size
  const totalDue = fees.reduce((s, f) => s + (parseFloat(f.amount_due) || 0), 0)
  const totalPaid = fees.reduce((s, f) => s + (parseFloat(f.amount_paid) || 0), 0)
  const overdueCount = fees.filter((f) => f.status === 'overdue').length

  // Update modal
  const openUpdateModal = (record) => {
    setUpdateModal(record)
    setUpdateForm({
      amount_paid: record.amount_paid ?? '',
      status: record.status ?? 'pending',
      receipt_url: record.receipt_url ?? '',
    })
  }
  const closeUpdateModal = () => { setUpdateModal(null); setUpdateForm(EMPTY_UPDATE) }

  const handleUpdate = async (e) => {
    e.preventDefault()
    setUpdateLoading(true)
    try {
      await api.patch(`/api/fees/${updateModal.id}`, {
        amount_paid: parseFloat(updateForm.amount_paid) || 0,
        status: updateForm.status,
        receipt_url: updateForm.receipt_url || null,
      })
      closeUpdateModal()
      fetchFees()
    } catch (err) {
      alert(err.message || 'Update failed')
    } finally {
      setUpdateLoading(false)
    }
  }

  // Create modal
  const openCreateModal = () => { setCreateModal(true); setCreateForm(EMPTY_CREATE) }
  const closeCreateModal = () => { setCreateModal(false); setCreateForm(EMPTY_CREATE) }

  const handleCreate = async (e) => {
    e.preventDefault()
    setCreateLoading(true)
    try {
      await api.post('/api/fees', {
        student_id: createForm.student_id.trim(),
        semester: parseInt(createForm.semester, 10),
        fee_type: createForm.fee_type || 'tuition',
        amount_due: parseFloat(createForm.amount_due) || 0,
        due_date: createForm.due_date || null,
      })
      closeCreateModal()
      fetchFees()
    } catch (err) {
      alert(err.message || 'Create failed')
    } finally {
      setCreateLoading(false)
    }
  }

  const formatCurrency = (val) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0)

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN') : '—')

  return (
    <PageLayout title="Fee Management">
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={pjs('24px', 700, '32px', '#111827')}>Fee Management</h1>
          <p style={pjs('14px', 400, '20px', '#6b7280')}>Track and manage student fee records</p>
        </div>
        <button
          onClick={openCreateModal}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#4f46e5', color: '#fff', border: 'none',
            borderRadius: 8, padding: '10px 18px', cursor: 'pointer',
            ...pjs('14px', 600, '20px', '#fff'),
          }}
        >
          <Plus size={16} />
          Add Fee Record
        </button>
      </div>

      {/* Stats cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard icon={<CreditCard size={20} color="#4f46e5" />} label="Students with Fees" value={totalStudents} bg="#eef2ff" />
        <StatCard icon={<DollarSign size={20} color="#b45309" />} label="Total Amount Due" value={formatCurrency(totalDue)} bg="#fffbeb" />
        <StatCard icon={<CheckCircle size={20} color="#15803d" />} label="Total Amount Paid" value={formatCurrency(totalPaid)} bg="#f0fdf4" />
        <StatCard icon={<AlertCircle size={20} color="#b91c1c" />} label="Overdue Records" value={overdueCount} bg="#fef2f2" />
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input
            type="text"
            placeholder="Search by student name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%', paddingLeft: 38, paddingRight: 12, paddingTop: 9, paddingBottom: 9,
              border: '1px solid #e5e7eb', borderRadius: 8, outline: 'none', boxSizing: 'border-box',
              ...pjs('14px', 400, '20px', '#111827'),
            }}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: '9px 14px', border: '1px solid #e5e7eb', borderRadius: 8, outline: 'none', cursor: 'pointer',
            ...pjs('14px', 400, '20px', '#111827'),
          }}
        >
          <option value="all">All Statuses</option>
          <option value="paid">Paid</option>
          <option value="partial">Partial</option>
          <option value="overdue">Overdue</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', ...pjs('14px', 400, '20px', '#9ca3af') }}>Loading fee records…</div>
        ) : error ? (
          <div style={{ padding: 48, textAlign: 'center', ...pjs('14px', 400, '20px', '#ef4444') }}>{error}</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', ...pjs('14px', 400, '20px', '#9ca3af') }}>No fee records found.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  {['Student', 'Semester', 'Fee Type', 'Amount Due', 'Amount Paid', 'Status', 'Due Date', 'Receipt', 'Action'].map((h) => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', ...pjs('12px', 600, '16px', '#6b7280'), whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((record) => {
                  const studentName = record.student_name || record.student?.name || '—'
                  const studentEmail = record.student_email || record.student?.email || ''
                  const badge = STATUS_COLORS[record.status] || STATUS_COLORS.pending
                  return (
                    <tr key={record.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={pjs('14px', 600, '20px', '#111827')}>{studentName}</div>
                        {studentEmail && <div style={pjs('12px', 400, '16px', '#9ca3af')}>{studentEmail}</div>}
                      </td>
                      <td style={{ padding: '14px 16px', ...pjs('14px', 400, '20px', '#374151') }}>{record.semester || '—'}</td>
                      <td style={{ padding: '14px 16px', ...pjs('14px', 400, '20px', '#374151') }}>{record.fee_type || '—'}</td>
                      <td style={{ padding: '14px 16px', ...pjs('14px', 500, '20px', '#111827') }}>{formatCurrency(record.amount_due)}</td>
                      <td style={{ padding: '14px 16px', ...pjs('14px', 500, '20px', '#111827') }}>{formatCurrency(record.amount_paid)}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          display: 'inline-block', padding: '2px 10px', borderRadius: 9999,
                          background: badge.bg, ...pjs('12px', 600, '18px', badge.color),
                        }}>
                          {badge.label}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', ...pjs('14px', 400, '20px', '#374151'), whiteSpace: 'nowrap' }}>{formatDate(record.due_date)}</td>
                      <td style={{ padding: '14px 16px' }}>
                        {record.receipt_url ? (
                          <a href={record.receipt_url} target="_blank" rel="noopener noreferrer"
                            style={pjs('13px', 500, '18px', '#4f46e5')}>View</a>
                        ) : (
                          <span style={pjs('13px', 400, '18px', '#d1d5db')}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <button
                          onClick={() => openUpdateModal(record)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            background: '#f3f4f6', border: 'none', borderRadius: 6,
                            padding: '6px 12px', cursor: 'pointer',
                            ...pjs('13px', 500, '18px', '#374151'),
                          }}
                        >
                          <Edit size={13} />
                          Update
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Update Payment Modal */}
      {updateModal && (
        <Modal title="Update Payment" onClose={closeUpdateModal}>
          <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={pjs('13px', 600, '18px', '#374151')}>Student</label>
              <div style={{ marginTop: 4, ...pjs('14px', 400, '20px', '#6b7280') }}>
                {updateModal.student_name || updateModal.student?.name || updateModal.student_id}
              </div>
            </div>
            <FormField label="Amount Paid (₹)" required>
              <input
                type="number" min="0" step="0.01" required
                value={updateForm.amount_paid}
                onChange={(e) => setUpdateForm((p) => ({ ...p, amount_paid: e.target.value }))}
                style={inputStyle}
              />
            </FormField>
            <FormField label="Status" required>
              <select
                value={updateForm.status}
                onChange={(e) => setUpdateForm((p) => ({ ...p, status: e.target.value }))}
                style={inputStyle}
              >
                <option value="pending">Pending</option>
                <option value="partial">Partial</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>
            </FormField>
            <FormField label="Receipt URL">
              <input
                type="url"
                placeholder="https://…"
                value={updateForm.receipt_url}
                onChange={(e) => setUpdateForm((p) => ({ ...p, receipt_url: e.target.value }))}
                style={inputStyle}
              />
            </FormField>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
              <button type="button" onClick={closeUpdateModal} style={cancelBtnStyle}>Cancel</button>
              <button type="submit" disabled={updateLoading} style={primaryBtnStyle}>
                {updateLoading ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Create Fee Record Modal */}
      {createModal && (
        <Modal title="Add Fee Record" onClose={closeCreateModal}>
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <FormField label="Student" required>
              <select
                required
                value={createForm.student_id}
                onChange={(e) => setCreateForm((p) => ({ ...p, student_id: e.target.value }))}
                style={inputStyle}
              >
                <option value="">Select student…</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>{s.full_name} ({s.email})</option>
                ))}
              </select>
            </FormField>
            <FormField label="Semester" required>
              <input
                type="number" min="1" max="12" required placeholder="e.g. 3"
                value={createForm.semester}
                onChange={(e) => setCreateForm((p) => ({ ...p, semester: e.target.value }))}
                style={inputStyle}
              />
            </FormField>
            <FormField label="Fee Type" required>
              <select
                required value={createForm.fee_type}
                onChange={(e) => setCreateForm((p) => ({ ...p, fee_type: e.target.value }))}
                style={inputStyle}>
                <option value="">Select type…</option>
                <option value="tuition">Tuition</option>
                <option value="hostel">Hostel</option>
                <option value="transport">Transport</option>
                <option value="misc">Misc</option>
                <option value="total">Total</option>
              </select>
            </FormField>
            <FormField label="Amount Due (₹)" required>
              <input
                type="number" min="0" step="0.01" required
                value={createForm.amount_due}
                onChange={(e) => setCreateForm((p) => ({ ...p, amount_due: e.target.value }))}
                style={inputStyle}
              />
            </FormField>
            <FormField label="Due Date">
              <input
                type="date"
                value={createForm.due_date}
                onChange={(e) => setCreateForm((p) => ({ ...p, due_date: e.target.value }))}
                style={inputStyle}
              />
            </FormField>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
              <button type="button" onClick={closeCreateModal} style={cancelBtnStyle}>Cancel</button>
              <button type="submit" disabled={createLoading} style={primaryBtnStyle}>
                {createLoading ? 'Creating…' : 'Create Record'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </PageLayout>
  )
}

// ── Sub-components ──────────────────────────────────────────────────────────

function StatCard({ icon, label, value, bg }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12,
      padding: '20px 24px', display: 'flex', alignItems: 'flex-start', gap: 16,
    }}>
      <div style={{ background: bg, borderRadius: 10, padding: 10, flexShrink: 0 }}>{icon}</div>
      <div>
        <div style={pjs('13px', 500, '18px', '#6b7280')}>{label}</div>
        <div style={{ marginTop: 4, ...pjs('22px', 700, '28px', '#111827') }}>{value}</div>
      </div>
    </div>
  )
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: '#fff', borderRadius: 14, padding: 28, width: '100%', maxWidth: 460,
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={pjs('18px', 700, '26px', '#111827')}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <span style={pjs('20px', 400, '20px', '#9ca3af')}>✕</span>
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function FormField({ label, required, children }) {
  return (
    <div>
      <label style={pjs('13px', 600, '18px', '#374151')}>
        {label}{required && <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>}
      </label>
      <div style={{ marginTop: 6 }}>{children}</div>
    </div>
  )
}

// ── Shared input/button styles ───────────────────────────────────────────────

const inputStyle = {
  width: '100%', padding: '9px 12px', border: '1px solid #e5e7eb', borderRadius: 8,
  outline: 'none', boxSizing: 'border-box',
  fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '14px', lineHeight: '20px', color: '#111827',
}

const primaryBtnStyle = {
  background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8,
  padding: '10px 20px', cursor: 'pointer',
  fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '14px', fontWeight: 600, lineHeight: '20px',
}

const cancelBtnStyle = {
  background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 8,
  padding: '10px 20px', cursor: 'pointer',
  fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '14px', fontWeight: 500, lineHeight: '20px',
}
