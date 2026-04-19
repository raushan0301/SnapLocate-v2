import { useState, useEffect, useCallback } from 'react'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'
import { Mail, Users, ShieldCheck, UserMinus, Clock, GraduationCap, Search, Trash2, ChevronDown, X, CheckCircle, AlertCircle, UserPlus } from 'lucide-react'

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

// ─── Assign Faculty Modal ─────────────────────────────────────
function AssignModal({ student, faculty, onAssign, onRemove, onClose }) {
  const [search, setSearch]     = useState('')
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')
  const [subject, setSubject]   = useState(student.advisor_subject || '')

  const filtered = faculty.filter(f =>
    !search ||
    f.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    f.dept?.toLowerCase().includes(search.toLowerCase())
  )

  const handleAssign = async (fp) => {
    setError('')
    setSaving(true)
    try {
      await onAssign(student.id, fp.id, subject)
      onClose()
    } catch (err) {
      setError(err?.message || 'Failed to assign advisor. Please try again.')
      setSaving(false)
    }
  }

  const handleRemove = async () => {
    setError('')
    setSaving(true)
    try {
      await onRemove(student.id)
      onClose()
    } catch (err) {
      setError(err?.message || 'Failed to remove advisor.')
      setSaving(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 24, width: '100%', maxWidth: 480, boxShadow: '0 20px 40px rgba(0,0,0,0.14)', overflow: 'hidden', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #f1f5f9', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #bbf7d0', overflow: 'hidden', flexShrink: 0 }}>
              {student.avatar_url
                ? <img src={student.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={pjs(14, 700, '18px', '#16a34a')}>{student.full_name?.charAt(0)}</span>}
            </div>
            <div>
              <div style={pjs(15, 700, '20px', '#0f172a')}>Assign Faculty Advisor</div>
              <div style={pjs(12, 400, '16px', '#64748b')}>{student.full_name} · {student.email}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4 }}><X size={20} /></button>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto' }}>

          {/* Error banner */}
          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px' }}>
              <AlertCircle size={14} color="#ef4444" />
              <span style={pjs(13, 500, '18px', '#dc2626')}>{error}</span>
            </div>
          )}

          {/* Current assignment */}
          {student.advisor_name && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: '#eef2ff', borderRadius: 12, border: '1px solid #c7d2fe' }}>
              <div>
                <div style={pjs(11, 700, '14px', '#6366f1')}>CURRENTLY ASSIGNED</div>
                <div style={{ ...pjs(14, 700, '20px', '#4f46e5'), marginTop: 2 }}>{student.advisor_name}</div>
                {student.advisor_dept && <div style={pjs(11, 400, '14px', '#818cf8')}>{student.advisor_dept}</div>}
                {student.advisor_subject && <div style={{ ...pjs(11, 600, '14px', '#7c3aed'), marginTop: 2 }}>{student.advisor_subject}</div>}
              </div>
              <button
                onClick={handleRemove}
                disabled={saving}
                style={{ background: '#fff', border: '1px solid #fecaca', borderRadius: 8, padding: '6px 12px', cursor: saving ? 'not-allowed' : 'pointer', color: '#ef4444', fontSize: 12, fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", opacity: saving ? 0.6 : 1 }}
              >
                Remove
              </button>
            </div>
          )}

          {/* Subject label */}
          <div>
            <label style={{ ...pjs(11, 700, '14px', '#475569'), display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Class / Subject Label <span style={{ fontWeight: 400, color: '#94a3b8', textTransform: 'none' }}>(optional)</span>
            </label>
            <input
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="e.g. Class Advisor — CSE-4A or B.Tech Year 2"
              style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              onFocus={e => e.target.style.borderColor = '#4f46e5'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>

          {/* Faculty search */}
          <div>
            <label style={{ ...pjs(11, 700, '14px', '#475569'), display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Select Faculty
            </label>
            <div style={{ position: 'relative', marginBottom: 8 }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or department..."
                style={{ width: '100%', padding: '9px 12px 9px 30px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                onFocus={e => e.target.style.borderColor = '#4f46e5'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>

            <div style={{ maxHeight: 240, overflowY: 'auto', borderRadius: 12, border: '1px solid #f1f5f9' }}>
              {faculty.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center' }}>
                  <GraduationCap size={28} color="#e2e8f0" style={{ margin: '0 auto 8px', display: 'block' }} />
                  <div style={pjs(13, 600, '18px', '#94a3b8')}>No faculty profiles found</div>
                  <div style={{ ...pjs(12, 400, '16px', '#cbd5e1'), marginTop: 4 }}>Faculty must be created from Manage Faculty first.</div>
                </div>
              ) : filtered.length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', ...pjs(13, 400, '18px', '#94a3b8') }}>No faculty match your search</div>
              ) : filtered.map(f => {
                const isCurrent = f.id === student.advisor_id
                return (
                  <div
                    key={f.id}
                    onClick={() => !saving && handleAssign(f)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px',
                      cursor: saving ? 'not-allowed' : 'pointer',
                      borderBottom: '1px solid #f8fafc',
                      background: isCurrent ? '#f5f3ff' : 'transparent',
                      transition: 'background 0.1s',
                      opacity: saving ? 0.6 : 1,
                    }}
                    onMouseEnter={e => { if (!saving && !isCurrent) e.currentTarget.style.background = '#f8fafc' }}
                    onMouseLeave={e => { if (!isCurrent) e.currentTarget.style.background = 'transparent' }}
                  >
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                      {f.avatar_url
                        ? <img src={f.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <span style={pjs(13, 700, '16px', '#4f46e5')}>{(f.full_name || 'F').charAt(0)}</span>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={pjs(13, 700, '18px', '#0f172a')}>{f.full_name}</span>
                        {f.is_verified && (
                          <div style={{ width: 14, height: 14, borderRadius: 7, background: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <svg width="8" height="6" viewBox="0 0 9 7" fill="none"><path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </div>
                        )}
                      </div>
                      <div style={pjs(11, 400, '14px', '#64748b')}>{[f.designation, f.dept].filter(Boolean).join(' · ')}</div>
                    </div>
                    {isCurrent ? (
                      <span style={{ ...pjs(10, 700, '12px', '#7c3aed'), background: '#f5f3ff', border: '1px solid #e9d5ff', padding: '3px 8px', borderRadius: 6, flexShrink: 0 }}>CURRENT</span>
                    ) : (
                      <UserPlus size={14} color="#94a3b8" style={{ flexShrink: 0 }} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {saving && (
            <div style={{ textAlign: 'center', ...pjs(13, 500, '18px', '#64748b') }}>Saving assignment...</div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────
export default function ManageStudents() {
  const [students, setStudents]         = useState([])
  const [faculty, setFaculty]           = useState([])
  const [loading, setLoading]           = useState(true)
  const [search, setSearch]             = useState('')
  const [assignTarget, setAssignTarget] = useState(null)
  const [toast, setToast]               = useState({ msg: '', type: 'success' })

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast({ msg: '', type: 'success' }), 3000)
  }

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [stuResult, facResult, advResult] = await Promise.allSettled([
        api.get('/api/admin/users?role=student'),
        api.get('/api/faculty'),
        api.get('/api/admin/student-advisors'),
      ])

      const advisorMap = {}
      if (advResult.status === 'fulfilled' && advResult.value?.success) {
        for (const a of (advResult.value.data || [])) {
          advisorMap[a.student_id] = {
            advisor_id:      a.faculty?.id,
            advisor_name:    a.faculty?.users?.full_name,
            advisor_dept:    a.faculty?.dept,
            advisor_subject: a.subject,
          }
        }
      }

      if (stuResult.status === 'fulfilled' && stuResult.value?.success) {
        setStudents((stuResult.value.data || []).map(s => ({ ...s, ...(advisorMap[s.id] || {}) })))
      }
      if (facResult.status === 'fulfilled' && facResult.value?.success) {
        setFaculty(facResult.value.data || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const handleToggleVerify = async (student) => {
    const msg = student.is_verified
      ? `Suspend ${student.full_name}'s account?`
      : `Reactivate ${student.full_name}'s account?`
    if (!window.confirm(msg)) return
    try {
      await api.post('/api/admin/verify-user', { userId: student.id, isVerified: !student.is_verified })
      setStudents(prev => prev.map(s => s.id === student.id ? { ...s, is_verified: !s.is_verified } : s))
      showToast(`${student.full_name} ${!student.is_verified ? 'activated' : 'suspended'}`)
    } catch {
      showToast('Action failed', 'error')
    }
  }

  const handleDelete = async (student) => {
    if (!window.confirm(`Permanently delete ${student.full_name}? This cannot be undone.`)) return
    try {
      await api.delete(`/api/admin/users/${student.id}`)
      setStudents(prev => prev.filter(s => s.id !== student.id))
      showToast(`${student.full_name} deleted`)
    } catch {
      showToast('Delete failed', 'error')
    }
  }

  const handleAssign = async (studentId, facultyProfileId, subject) => {
    await api.post('/api/admin/student-advisors', {
      student_id: studentId,
      faculty_profile_id: facultyProfileId,
      subject,
    })
    const fp = faculty.find(f => f.id === facultyProfileId)
    setStudents(prev => prev.map(s => s.id === studentId ? {
      ...s,
      advisor_id:      fp?.id,
      advisor_name:    fp?.full_name,
      advisor_dept:    fp?.dept,
      advisor_subject: subject || null,
    } : s))
    showToast(`Advisor assigned to ${students.find(s => s.id === studentId)?.full_name || 'student'}`)
  }

  const handleRemoveAdvisor = async (studentId) => {
    await api.delete(`/api/admin/student-advisors/${studentId}`)
    setStudents(prev => prev.map(s => s.id === studentId ? {
      ...s, advisor_id: null, advisor_name: null, advisor_dept: null, advisor_subject: null,
    } : s))
    showToast('Advisor removed')
  }

  const filtered = students.filter(s =>
    !search ||
    s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase())
  )

  const stats = {
    total:     students.length,
    active:    students.filter(s => s.is_verified).length,
    suspended: students.filter(s => !s.is_verified).length,
    assigned:  students.filter(s => s.advisor_id).length,
  }

  return (
    <PageLayout>
      <Toast msg={toast.msg} type={toast.type} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <GraduationCap size={22} color="#059669" />
          </div>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: '#0f172a', margin: 0 }}>Manage Students</h1>
            <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>View accounts, manage status, and assign faculty advisors.</p>
          </div>
        </div>
        <button
          onClick={fetchAll}
          style={{ padding: '9px 18px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#fff', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {[
          { label: 'Total Students',   value: stats.total,     bg: '#eef2ff', color: '#4f46e5', icon: <Users size={20} /> },
          { label: 'Active',           value: stats.active,    bg: '#ecfdf5', color: '#059669', icon: <ShieldCheck size={20} /> },
          { label: 'Suspended',        value: stats.suspended, bg: '#fff7ed', color: '#d97706', icon: <UserMinus size={20} /> },
          { label: 'Advisor Assigned', value: stats.assigned,  bg: '#fdf4ff', color: '#7e22ce', icon: <GraduationCap size={20} /> },
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

      {/* Table card */}
      <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9', boxShadow: '0 4px 24px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ position: 'relative', width: '300px', flexShrink: 0 }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              style={{ width: '100%', padding: '10px 16px 10px 34px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: "'Inter', sans-serif", transition: '0.2s' }}
              onFocus={e => e.target.style.borderColor = '#4f46e5'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>
          <span style={pjs(13, 500, '18px', '#94a3b8')}>{filtered.length} student{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', ...pjs(14, 500, '20px', '#94a3b8') }}>Loading students...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '60px 24px', textAlign: 'center' }}>
            <GraduationCap size={40} color="#e2e8f0" style={{ margin: '0 auto 12px', display: 'block' }} />
            <div style={pjs(15, 600, '20px', '#0f172a')}>{search ? 'No students match your search' : 'No students registered yet'}</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  {['Student', 'Joined', 'Status', 'Faculty Advisor', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '13px 20px', textAlign: 'left', ...pjs(11, 700, '14px', '#64748b'), textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr
                    key={s.id}
                    style={{ borderBottom: '1px solid #f8fafc', transition: 'background 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {/* Student */}
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 38, height: 38, borderRadius: 12, background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden', border: '1px solid #bbf7d0' }}>
                          {s.avatar_url
                            ? <img src={s.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : <span style={pjs(14, 700, '18px', '#16a34a')}>{s.full_name?.charAt(0)}</span>}
                        </div>
                        <div>
                          <div style={pjs(14, 700, '18px', '#0f172a')}>{s.full_name}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                            <Mail size={11} color="#94a3b8" />
                            <span style={pjs(11, 400, '14px', '#64748b')}>{s.email}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Joined */}
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Clock size={13} color="#94a3b8" />
                        <span style={pjs(13, 400, '18px', '#64748b')}>
                          {new Date(s.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td style={{ padding: '14px 20px' }}>
                      <div
                        onClick={() => handleToggleVerify(s)}
                        title="Click to toggle status"
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          padding: '5px 12px', borderRadius: 20, cursor: 'pointer',
                          border: '1px solid', transition: 'all 0.15s',
                          fontSize: 10, fontWeight: 800, letterSpacing: '0.05em', fontFamily: "'Plus Jakarta Sans', sans-serif",
                          background:   s.is_verified ? '#ecfdf5' : '#fff7ed',
                          color:        s.is_verified ? '#047857' : '#9a3412',
                          borderColor:  s.is_verified ? '#a7f3d0' : '#fed7aa',
                        }}
                      >
                        {s.is_verified ? <ShieldCheck size={12} /> : <UserMinus size={12} />}
                        {s.is_verified ? 'ACTIVE' : 'SUSPENDED'}
                      </div>
                    </td>

                    {/* Faculty Advisor */}
                    <td style={{ padding: '14px 20px' }}>
                      {s.advisor_name ? (
                        <div
                          onClick={() => setAssignTarget(s)}
                          title="Click to reassign"
                          style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', padding: '7px 10px', background: '#fdf4ff', borderRadius: 10, border: '1px solid #e9d5ff', maxWidth: 200 }}
                        >
                          <div style={{ width: 22, height: 22, borderRadius: 6, background: '#7e22ce', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <span style={pjs(9, 700, '12px', '#fff')}>{s.advisor_name.charAt(0)}</span>
                          </div>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ ...pjs(11, 700, '14px', '#7e22ce'), overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.advisor_name}</div>
                            {s.advisor_subject && (
                              <div style={{ ...pjs(10, 400, '12px', '#a855f7'), overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.advisor_subject}</div>
                            )}
                          </div>
                          <ChevronDown size={11} color="#a855f7" style={{ flexShrink: 0 }} />
                        </div>
                      ) : (
                        <button
                          onClick={() => setAssignTarget(s)}
                          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 10, border: '1.5px dashed #e2e8f0', background: '#fff', cursor: 'pointer', transition: 'all 0.15s', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = '#4f46e5'; e.currentTarget.style.color = '#4f46e5'; e.currentTarget.style.background = '#eef2ff' }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = '#fff' }}
                        >
                          <GraduationCap size={13} color="inherit" />
                          <span style={pjs(11, 600, '14px', 'inherit')}>Assign Advisor</span>
                        </button>
                      )}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '14px 20px' }}>
                      <button
                        onClick={() => handleDelete(s)}
                        style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 10, border: '1px solid #fecaca', background: '#fff', cursor: 'pointer', transition: 'all 0.15s', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                        onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                        onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                      >
                        <Trash2 size={13} color="#ef4444" />
                        <span style={pjs(12, 600, '16px', '#ef4444')}>Delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assign Modal */}
      {assignTarget && (
        <AssignModal
          student={assignTarget}
          faculty={faculty}
          onAssign={handleAssign}
          onRemove={handleRemoveAdvisor}
          onClose={() => setAssignTarget(null)}
        />
      )}
    </PageLayout>
  )
}
