import { useState, useEffect, useRef } from 'react'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'
import {
  ClipboardList, Upload, CheckCircle, Clock, AlertCircle,
  ChevronDown, X, FileText, ExternalLink, Star, Lock
} from 'lucide-react'

const pjs = (sz, fw, lh, col) => ({
  fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: sz, fontWeight: fw, lineHeight: lh, color: col
})

const STATUS = {
  graded:    { label: 'Graded',      color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', Icon: Star },
  submitted: { label: 'Submitted',   color: '#0284c7', bg: '#f0f9ff', border: '#bae6fd', Icon: CheckCircle },
  late:      { label: 'Late',        color: '#d97706', bg: '#fffbeb', border: '#fde68a', Icon: Clock },
  overdue:   { label: 'Overdue',     color: '#dc2626', bg: '#fef2f2', border: '#fecaca', Icon: AlertCircle },
  pending:   { label: 'Pending',     color: '#64748b', bg: '#f8fafc', border: '#e2e8f0', Icon: ClipboardList },
}

function Toast({ msg, type }) {
  if (!msg) return null
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, background: type === 'error' ? '#dc2626' : '#0f172a', color: '#fff', padding: '12px 20px', borderRadius: 12, zIndex: 9999, fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 14, fontWeight: 600, boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
      {msg}
    </div>
  )
}

function countdown(due) {
  const diff = new Date(due) - new Date()
  if (diff <= 0) return null
  const d = Math.floor(diff / 86400000)
  const h = Math.floor((diff % 86400000) / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  if (d > 0) return `${d}d ${h}h left`
  if (h > 0) return `${h}h ${m}m left`
  return `${m}m left`
}

function SubmitModal({ assignment, onClose, onSubmitted }) {
  const [textContent, setTextContent] = useState('')
  const [fileUrl, setFileUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef()

  const handleSubmit = async () => {
    if (!textContent.trim() && !fileUrl.trim()) {
      setError('Add text or a file URL before submitting.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await api.post(`/api/lms/native/assignments/${assignment.id}/submit`, {
        text_content: textContent || null,
        file_url: fileUrl || null,
      })
      if (res.success) { onSubmitted(); onClose() }
      else setError(res.error || 'Submission failed')
    } catch (e) { setError(e?.message || 'Network error') }
    finally { setLoading(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 24, width: '100%', maxWidth: 520, boxShadow: '0 24px 80px rgba(0,0,0,0.18)', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={pjs(16, 800, '22px', '#0f172a')}>{assignment.title}</div>
            <div style={{ ...pjs(12, 500, '16px', '#64748b'), marginTop: 3 }}>
              Due: {new Date(assignment.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              &nbsp;· Max: {assignment.max_marks} marks
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <X size={20} color="#94a3b8" />
          </button>
        </div>

        <div style={{ padding: '20px 24px' }}>
          {/* Description */}
          {assignment.description && (
            <div style={{ background: '#f8fafc', borderRadius: 12, padding: '12px 14px', marginBottom: 16, ...pjs(13, 400, '20px', '#334155') }}>
              {assignment.description}
            </div>
          )}

          {/* Text answer */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ ...pjs(12, 600, '16px', '#374151'), marginBottom: 6 }}>Your Answer / Description</div>
            <textarea
              value={textContent} onChange={e => setTextContent(e.target.value)} rows={5}
              placeholder="Write your answer or describe your submission..."
              style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 14, fontFamily: "'Plus Jakarta Sans',sans-serif", outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
            />
          </div>

          {/* File URL */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ ...pjs(12, 600, '16px', '#374151'), marginBottom: 6 }}>File / Drive Link (optional)</div>
            <input
              value={fileUrl} onChange={e => setFileUrl(e.target.value)}
              placeholder="https://drive.google.com/..."
              style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 13, fontFamily: "'Plus Jakarta Sans',sans-serif", outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 12px', marginBottom: 14, ...pjs(13, 500, '18px', '#dc2626') }}>
              {error}
            </div>
          )}

          <button onClick={handleSubmit} disabled={loading}
            style={{ width: '100%', padding: '12px 0', borderRadius: 12, border: 'none', background: loading ? '#e2e8f0' : 'linear-gradient(135deg,#4f46e5,#6366f1)', cursor: loading ? 'not-allowed' : 'pointer', ...pjs(14, 700, '20px', '#fff'), display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Upload size={16} />
            {loading ? 'Submitting...' : 'Submit Assignment'}
          </button>
        </div>
      </div>
    </div>
  )
}

function AssignmentCard({ asgn, onRefresh }) {
  const [open, setOpen] = useState(false)
  const [showModal, setShowModal] = useState(false)

  const sub = asgn.my_submission
  const isOverdue = new Date() > new Date(asgn.due_date) && !sub
  const timeLeft = countdown(asgn.due_date)

  let statusKey = 'pending'
  if (sub?.status === 'graded') statusKey = 'graded'
  else if (sub?.status === 'late') statusKey = 'late'
  else if (sub) statusKey = 'submitted'
  else if (isOverdue) statusKey = 'overdue'

  const { label, color, bg, border, Icon } = STATUS[statusKey]
  const course = asgn.lms_course_sections?.lms_courses

  return (
    <>
      {showModal && <SubmitModal assignment={asgn} onClose={() => setShowModal(false)} onSubmitted={onRefresh} />}
      <div style={{ background: '#fff', borderRadius: 20, border: `1.5px solid ${open ? border : '#f1f5f9'}`, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', overflow: 'hidden', transition: 'border-color 0.2s' }}>
        {/* Card header */}
        <div onClick={() => setOpen(o => !o)} style={{ padding: '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Icon */}
          <div style={{ width: 40, height: 40, borderRadius: 12, background: bg, border: `1.5px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon size={18} color={color} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={pjs(14, 700, '20px', '#0f172a')}>{asgn.title}</div>
            <div style={{ ...pjs(12, 400, '16px', '#94a3b8'), marginTop: 2 }}>
              {course?.code} · Section {asgn.lms_course_sections?.section_name}
              &nbsp;· Due {new Date(asgn.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            {timeLeft && statusKey === 'pending' && (
              <span style={{ ...pjs(11, 700, '14px', '#d97706'), background: '#fffbeb', border: '1px solid #fde68a', padding: '3px 8px', borderRadius: 6 }}>
                ⏱ {timeLeft}
              </span>
            )}
            <span style={{ ...pjs(11, 700, '14px', color), background: bg, border: `1px solid ${border}`, padding: '3px 10px', borderRadius: 6 }}>
              {label}
            </span>
            {sub?.marks_obtained != null && (
              <span style={{ ...pjs(13, 800, '18px', '#16a34a') }}>
                {sub.marks_obtained}/{asgn.max_marks}
              </span>
            )}
            <ChevronDown size={15} color="#94a3b8" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </div>
        </div>

        {/* Expanded detail */}
        {open && (
          <div style={{ padding: '0 20px 20px', borderTop: '1px solid #f8fafc' }}>
            {asgn.description && (
              <div style={{ background: '#f8fafc', borderRadius: 12, padding: '12px 14px', margin: '14px 0', ...pjs(13, 400, '20px', '#334155') }}>
                {asgn.description}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 }}>
              {[
                { label: 'Max Marks', val: asgn.max_marks },
                { label: 'Attempts', val: `${asgn.max_attempts} allowed` },
                { label: 'Late Submit', val: asgn.allow_late ? `Yes (${asgn.late_penalty_percent}% penalty)` : 'No' },
              ].map(({ label, val }) => (
                <div key={label} style={{ background: '#f8fafc', borderRadius: 12, padding: '10px 14px' }}>
                  <div style={pjs(10, 600, '14px', '#94a3b8')}>{label}</div>
                  <div style={{ ...pjs(13, 700, '18px', '#0f172a'), marginTop: 2 }}>{val}</div>
                </div>
              ))}
            </div>

            {/* Submission info */}
            {sub && (
              <div style={{ background: statusKey === 'graded' ? '#f0fdf4' : '#f0f9ff', border: `1.5px solid ${border}`, borderRadius: 14, padding: '14px 16px', marginBottom: 14 }}>
                <div style={pjs(12, 700, '16px', '#374151')}>Your Submission</div>
                <div style={{ ...pjs(12, 400, '18px', '#64748b'), marginTop: 6 }}>
                  Submitted: {new Date(sub.submitted_at).toLocaleString('en-IN')}
                  {sub.feedback_text && <div style={{ marginTop: 8 }}>Feedback: <b>{sub.feedback_text}</b></div>}
                  {sub.file_url && (
                    <a href={sub.file_url} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 8, color: '#4f46e5', textDecoration: 'none', fontWeight: 600 }}>
                      <ExternalLink size={12} /> View Submitted File
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            {!sub && !isOverdue && (
              <button onClick={() => setShowModal(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 22px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#4f46e5,#6366f1)', cursor: 'pointer', ...pjs(13, 700, '18px', '#fff') }}>
                <Upload size={15} /> Submit Now
              </button>
            )}
            {!sub && isOverdue && !asgn.allow_late && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, ...pjs(13, 500, '18px', '#dc2626') }}>
                <Lock size={14} /> Submission closed — deadline passed
              </div>
            )}
            {!sub && isOverdue && asgn.allow_late && (
              <button onClick={() => setShowModal(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 22px', borderRadius: 12, border: '1.5px solid #fde68a', background: '#fffbeb', cursor: 'pointer', ...pjs(13, 700, '18px', '#d97706') }}>
                <Upload size={15} /> Submit Late ({asgn.late_penalty_percent}% penalty)
              </button>
            )}
            {sub && asgn.allow_resubmission && statusKey !== 'graded' && (
              <button onClick={() => setShowModal(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 22px', borderRadius: 12, border: '1.5px solid #c7d2fe', background: '#eef2ff', cursor: 'pointer', ...pjs(13, 700, '18px', '#4f46e5') }}>
                <Upload size={15} /> Re-submit
              </button>
            )}
          </div>
        )}
      </div>
    </>
  )
}

export default function NativeAssignments() {
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [toast, setToast] = useState(null)

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000) }

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/lms/native/assignments/student')
      if (res.success) setAssignments(res.data || [])
    } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const filtered = assignments.filter(a => {
    if (filter === 'all') return true
    const sub = a.my_submission
    const isOverdue = new Date() > new Date(a.due_date) && !sub
    if (filter === 'pending') return !sub && !isOverdue
    if (filter === 'submitted') return !!sub && sub.status !== 'graded'
    if (filter === 'graded') return sub?.status === 'graded'
    if (filter === 'overdue') return isOverdue
    return true
  })

  const counts = {
    all: assignments.length,
    pending: assignments.filter(a => !a.my_submission && new Date() < new Date(a.due_date)).length,
    overdue: assignments.filter(a => !a.my_submission && new Date() > new Date(a.due_date)).length,
    submitted: assignments.filter(a => a.my_submission && a.my_submission.status !== 'graded').length,
    graded: assignments.filter(a => a.my_submission?.status === 'graded').length,
  }

  return (
    <PageLayout>
      <Toast msg={toast?.msg} type={toast?.type} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <div style={{ width: 46, height: 46, borderRadius: 14, background: 'linear-gradient(135deg,#eef2ff,#e0e7ff)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ClipboardList size={22} color="#4f46e5" />
        </div>
        <div>
          <h1 style={{ ...pjs(26, 800, '32px', '#0f172a'), margin: 0, letterSpacing: '-0.02em' }}>Native Assignments</h1>
          <p style={{ ...pjs(13, 400, '18px', '#64748b'), margin: '4px 0 0' }}>All assignments from your enrolled native LMS courses</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {[
          { key: 'all', label: 'All' },
          { key: 'pending', label: 'Pending', dot: '#d97706' },
          { key: 'overdue', label: 'Overdue', dot: '#dc2626' },
          { key: 'submitted', label: 'Submitted', dot: '#0284c7' },
          { key: 'graded', label: 'Graded', dot: '#16a34a' },
        ].map(({ key, label, dot }) => (
          <button key={key} onClick={() => setFilter(key)}
            style={{ padding: '7px 16px', borderRadius: 10, border: `1.5px solid ${filter === key ? '#4f46e5' : '#e2e8f0'}`, background: filter === key ? '#eef2ff' : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, ...pjs(13, filter === key ? 700 : 500, '18px', filter === key ? '#4f46e5' : '#64748b') }}>
            {dot && <span style={{ width: 7, height: 7, borderRadius: '50%', background: dot, display: 'inline-block' }} />}
            {label}
            <span style={{ ...pjs(11, 700, '14px', filter === key ? '#4f46e5' : '#94a3b8'), background: filter === key ? '#c7d2fe' : '#f1f5f9', borderRadius: 6, padding: '1px 7px' }}>
              {counts[key]}
            </span>
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, ...pjs(14, 400, '20px', '#94a3b8') }}>Loading assignments...</div>
      ) : filtered.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 20, border: '1.5px dashed #e2e8f0', padding: '60px 24px', textAlign: 'center' }}>
          <ClipboardList size={40} color="#e2e8f0" style={{ margin: '0 auto 12px', display: 'block' }} />
          <div style={pjs(15, 600, '20px', '#0f172a')}>No assignments found</div>
          <div style={{ ...pjs(13, 400, '18px', '#94a3b8'), marginTop: 4 }}>
            {filter === 'all' ? 'Your faculty has not posted any assignments yet.' : `No ${filter} assignments.`}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(a => <AssignmentCard key={a.id} asgn={a} onRefresh={load} />)}
        </div>
      )}
    </PageLayout>
  )
}
