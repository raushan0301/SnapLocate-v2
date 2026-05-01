import { useState, useEffect, useCallback } from 'react'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'
import {
  ClipboardList, ChevronDown, ChevronLeft, ChevronRight,
  CheckCircle, Star, ExternalLink, FileText, Plus, Trash2, Search
} from 'lucide-react'

const pjs = (sz, fw, lh, col) => ({
  fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: sz, fontWeight: fw, lineHeight: lh, color: col
})

const inp = {
  width: '100%', padding: '9px 12px', borderRadius: 10,
  border: '1.5px solid #e2e8f0', fontSize: 14,
  fontFamily: "'Plus Jakarta Sans',sans-serif", outline: 'none', boxSizing: 'border-box',
}

function Toast({ msg, type }) {
  if (!msg) return null
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, background: type === 'error' ? '#dc2626' : '#0f172a', color: '#fff', padding: '12px 20px', borderRadius: 12, zIndex: 9999, fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 14, fontWeight: 600 }}>
      {msg}
    </div>
  )
}

// ── Create Assignment Modal ──────────────────────────────────────────────────
function CreateAssignmentModal({ sectionId, onClose, onCreated }) {
  const [form, setForm] = useState({
    title: '', description: '', due_date: '', max_marks: 100,
    allow_resubmission: false, max_attempts: 1,
    allow_late: false, late_penalty_percent: 0,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = async () => {
    if (!form.title || !form.due_date) { setError('Title and due date are required'); return }
    setLoading(true); setError('')
    try {
      const res = await api.post('/api/lms/native/assignments', {
        section_id: sectionId, ...form,
        max_marks: Number(form.max_marks), max_attempts: Number(form.max_attempts),
        late_penalty_percent: Number(form.late_penalty_percent),
      })
      if (res.success) { onCreated(); onClose() }
      else setError(res.error || 'Failed to create')
    } catch (e) { setError(e?.message || 'Network error') }
    finally { setLoading(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 24, width: '100%', maxWidth: 560, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,0.18)' }}>
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={pjs(16, 800, '22px', '#0f172a')}>New Assignment</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', ...pjs(13, 600, '18px', '#64748b') }}>Cancel</button>
        </div>
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <div style={{ ...pjs(12, 600, '16px', '#374151'), marginBottom: 6 }}>Title *</div>
            <input value={form.title} onChange={e => set('title', e.target.value)} style={inp} placeholder="e.g. Lab Report 1" />
          </div>
          <div>
            <div style={{ ...pjs(12, 600, '16px', '#374151'), marginBottom: 6 }}>Description</div>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} style={{ ...inp, resize: 'vertical' }} placeholder="Instructions for students..." />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={{ ...pjs(12, 600, '16px', '#374151'), marginBottom: 6 }}>Due Date & Time *</div>
              <input type="datetime-local" value={form.due_date} onChange={e => set('due_date', e.target.value)} style={inp} />
            </div>
            <div>
              <div style={{ ...pjs(12, 600, '16px', '#374151'), marginBottom: 6 }}>Max Marks</div>
              <input type="number" value={form.max_marks} onChange={e => set('max_marks', e.target.value)} style={inp} min={0} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={{ ...pjs(12, 600, '16px', '#374151'), marginBottom: 6 }}>Max Attempts</div>
              <input type="number" value={form.max_attempts} onChange={e => set('max_attempts', e.target.value)} style={inp} min={1} max={10} />
            </div>
            <div>
              <div style={{ ...pjs(12, 600, '16px', '#374151'), marginBottom: 6 }}>Late Penalty (%)</div>
              <input type="number" value={form.late_penalty_percent} onChange={e => set('late_penalty_percent', e.target.value)} style={inp} min={0} max={100} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 20 }}>
            {[
              { key: 'allow_resubmission', label: 'Allow Re-submission' },
              { key: 'allow_late', label: 'Allow Late Submission' },
            ].map(({ key, label }) => (
              <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={form[key]} onChange={e => set(key, e.target.checked)} />
                <span style={pjs(13, 500, '18px', '#374151')}>{label}</span>
              </label>
            ))}
          </div>

          {error && <div style={{ ...pjs(13, 500, '18px', '#dc2626'), background: '#fef2f2', borderRadius: 10, padding: '10px 12px' }}>{error}</div>}

          <button onClick={submit} disabled={loading}
            style={{ padding: '11px 0', borderRadius: 12, border: 'none', background: loading ? '#e2e8f0' : 'linear-gradient(135deg,#4f46e5,#6366f1)', cursor: loading ? 'not-allowed' : 'pointer', ...pjs(14, 700, '20px', '#fff') }}>
            {loading ? 'Creating...' : 'Create Assignment'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── SpeedGrader Panel ────────────────────────────────────────────────────────
function SpeedGrader({ submissions, assignmentId, maxMarks, onGraded }) {
  const [idx, setIdx] = useState(0)
  const [marks, setMarks] = useState('')
  const [feedback, setFeedback] = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)

  const sub = submissions[idx]

  const grade = async () => {
    if (!marks || isNaN(Number(marks))) return
    setLoading(true)
    try {
      const res = await api.patch(`/api/lms/native/assignments/submissions/${sub.id}/grade`, {
        marks_obtained: Number(marks), feedback_text: feedback || undefined,
      })
      if (res.success) {
        setToast({ msg: `Graded ${sub.users?.full_name} · ${marks}/${maxMarks}`, type: 'success' })
        onGraded()
        if (idx < submissions.length - 1) { setIdx(i => i + 1); setMarks(''); setFeedback('') }
      } else setToast({ msg: res.error || 'Failed', type: 'error' })
    } catch (e) { setToast({ msg: e?.message, type: 'error' }) }
    finally { setLoading(false); setTimeout(() => setToast(null), 2500) }
  }

  if (!sub) return (
    <div style={{ textAlign: 'center', padding: 40, ...pjs(13, 400, '18px', '#94a3b8') }}>No submissions to grade.</div>
  )

  return (
    <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9', overflow: 'hidden' }}>
      <Toast msg={toast?.msg} type={toast?.type} />
      {/* Navigation bar */}
      <div style={{ padding: '12px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fafafa' }}>
        <div style={pjs(13, 700, '18px', '#0f172a')}>SpeedGrader — {idx + 1} / {submissions.length}</div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => { setIdx(i => Math.max(0, i - 1)); setMarks(''); setFeedback('') }} disabled={idx === 0}
            style={{ padding: '6px 10px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#fff', cursor: idx === 0 ? 'not-allowed' : 'pointer' }}>
            <ChevronLeft size={15} color="#64748b" />
          </button>
          <button onClick={() => { setIdx(i => Math.min(submissions.length - 1, i + 1)); setMarks(''); setFeedback('') }} disabled={idx === submissions.length - 1}
            style={{ padding: '6px 10px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#fff', cursor: idx === submissions.length - 1 ? 'not-allowed' : 'pointer' }}>
            <ChevronRight size={15} color="#64748b" />
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px', minHeight: 280 }}>
        {/* Submission viewer */}
        <div style={{ padding: 20, borderRight: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg,#eef2ff,#e0e7ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={pjs(14, 700, '16px', '#4f46e5')}>{(sub.users?.full_name || '?').charAt(0)}</span>
            </div>
            <div>
              <div style={pjs(14, 700, '20px', '#0f172a')}>{sub.users?.full_name}</div>
              <div style={pjs(11, 400, '14px', '#94a3b8')}>
                {sub.users?.email} · Submitted {new Date(sub.submitted_at).toLocaleString('en-IN')}
                {sub.status === 'late' && <span style={{ color: '#d97706', fontWeight: 700 }}> · Late</span>}
              </div>
            </div>
            {sub.marks_obtained != null && (
              <div style={{ marginLeft: 'auto', ...pjs(13, 700, '18px', '#16a34a'), background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '4px 12px', borderRadius: 8 }}>
                {sub.marks_obtained}/{maxMarks} ✓
              </div>
            )}
          </div>

          {sub.text_content && (
            <div style={{ background: '#f8fafc', borderRadius: 12, padding: '14px 16px', ...pjs(13, 400, '20px', '#334155'), maxHeight: 200, overflowY: 'auto' }}>
              {sub.text_content}
            </div>
          )}
          {sub.file_url && (
            <a href={sub.file_url} target="_blank" rel="noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 10, padding: '8px 14px', borderRadius: 10, border: '1.5px solid #c7d2fe', background: '#eef2ff', textDecoration: 'none', ...pjs(13, 600, '18px', '#4f46e5') }}>
              <ExternalLink size={13} /> View Submission File
            </a>
          )}
          {!sub.text_content && !sub.file_url && (
            <div style={{ ...pjs(13, 400, '18px', '#94a3b8'), fontStyle: 'italic' }}>No content provided by student.</div>
          )}
        </div>

        {/* Grade panel */}
        <div style={{ padding: 20 }}>
          <div style={{ ...pjs(12, 700, '16px', '#374151'), marginBottom: 8 }}>Marks (out of {maxMarks})</div>
          <input type="number" value={marks} onChange={e => setMarks(e.target.value)}
            placeholder={`0–${maxMarks}`} min={0} max={maxMarks}
            style={{ ...inp, fontSize: 22, fontWeight: 800, color: '#0f172a', textAlign: 'center', padding: '12px' }} />

          <div style={{ ...pjs(12, 700, '16px', '#374151'), marginTop: 14, marginBottom: 8 }}>Feedback (optional)</div>
          <textarea value={feedback} onChange={e => setFeedback(e.target.value)} rows={3}
            placeholder="Well done! / Needs improvement..."
            style={{ ...inp, resize: 'none', fontSize: 13 }} />

          <button onClick={grade} disabled={loading || !marks}
            style={{ width: '100%', marginTop: 12, padding: '11px 0', borderRadius: 12, border: 'none', background: loading || !marks ? '#e2e8f0' : 'linear-gradient(135deg,#16a34a,#22c55e)', cursor: loading || !marks ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, ...pjs(14, 700, '20px', '#fff') }}>
            <CheckCircle size={15} /> {loading ? 'Saving...' : 'Save & Next'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function FacultyAssignments() {
  const [sections, setSections] = useState([])
  const [selSection, setSelSection] = useState(null)
  const [assignments, setAssignments] = useState([])
  const [selAssignment, setSelAssignment] = useState(null)
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [toast, setToast] = useState(null)
  const [search, setSearch] = useState('')

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000) }

  const loadSections = useCallback(async () => {
    try {
      const res = await api.get('/api/lms/native/faculty/my-sections')
      if (res.success) {
        const all = (res.data || []).map(sec => ({ ...sec, course: sec.lms_courses }))
        setSections(all)
        if (all.length > 0 && !selSection) setSelSection(all[0])
      }
    } catch { }
    finally { setLoading(false) }
  }, [selSection])

  useEffect(() => { loadSections() }, [loadSections])

  const loadAssignments = useCallback(async () => {
    if (!selSection) return
    try {
      const res = await api.get(`/api/lms/native/assignments/sections/${selSection.id}`)
      if (res.success) { setAssignments(res.data || []); setSelAssignment(null); setSubmissions([]) }
    } catch { }
  }, [selSection])

  useEffect(() => { loadAssignments() }, [loadAssignments])

  const loadSubmissions = async (asgn) => {
    setSelAssignment(asgn)
    try {
      const res = await api.get(`/api/lms/native/assignments/${asgn.id}/submissions`)
      if (res.success) setSubmissions(res.data || [])
    } catch { }
  }

  const filteredAssignments = assignments.filter(a =>
    !search || a.title.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <PageLayout>
      <Toast msg={toast?.msg} type={toast?.type} />
      {showCreate && selSection && (
        <CreateAssignmentModal
          sectionId={selSection.id}
          onClose={() => setShowCreate(false)}
          onCreated={() => { showToast('Assignment created & students notified'); loadAssignments() }}
        />
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div style={{ width: 46, height: 46, borderRadius: 14, background: 'linear-gradient(135deg,#eef2ff,#e0e7ff)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ClipboardList size={22} color="#4f46e5" />
          </div>
          <div>
            <h1 style={{ ...pjs(26, 800, '32px', '#0f172a'), margin: 0, letterSpacing: '-0.02em' }}>Assignments</h1>
            <p style={{ ...pjs(13, 400, '18px', '#64748b'), margin: '4px 0 0' }}>Post assignments · SpeedGrade submissions</p>
          </div>
        </div>
        <button onClick={() => setShowCreate(true)} disabled={!selSection}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#4f46e5,#6366f1)', cursor: selSection ? 'pointer' : 'not-allowed', ...pjs(13, 700, '18px', '#fff') }}>
          <Plus size={15} /> New Assignment
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 20, alignItems: 'start' }}>
        {/* Section picker */}
        <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', ...pjs(11, 700, '14px', '#94a3b8'), textTransform: 'uppercase', letterSpacing: '0.08em' }}>Sections</div>
          {sections.map(sec => {
            const active = selSection?.id === sec.id
            return (
              <div key={sec.id} onClick={() => { setSelSection(sec); setSelAssignment(null); setSubmissions([]) }}
                style={{ padding: '11px 16px', cursor: 'pointer', borderBottom: '1px solid #f8fafc', background: active ? '#eef2ff' : 'transparent', borderLeft: `3px solid ${active ? '#4f46e5' : 'transparent'}`, transition: 'all 0.15s' }}>
                <div style={pjs(13, active ? 700 : 500, '18px', active ? '#4f46e5' : '#334155')}>{sec.course?.title}</div>
                <div style={{ ...pjs(11, 400, '14px', '#94a3b8'), marginTop: 2 }}>Section {sec.section_name}</div>
              </div>
            )
          })}
        </div>

        {/* Right pane */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Assignment list */}
          <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={13} color="#94a3b8" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search assignments..."
                  style={{ width: '100%', padding: '7px 10px 7px 30px', borderRadius: 9, border: '1.5px solid #e2e8f0', fontSize: 13, fontFamily: "'Plus Jakarta Sans',sans-serif", outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>

            {filteredAssignments.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', ...pjs(13, 400, '18px', '#94a3b8') }}>
                {selSection ? 'No assignments posted yet.' : 'Select a section first.'}
              </div>
            ) : filteredAssignments.map(a => {
              const isSelected = selAssignment?.id === a.id
              const isOverdue = new Date() > new Date(a.due_date)
              return (
                <div key={a.id} onClick={() => loadSubmissions(a)}
                  style={{ padding: '13px 18px', cursor: 'pointer', borderBottom: '1px solid #f8fafc', background: isSelected ? '#eef2ff' : 'transparent', borderLeft: `3px solid ${isSelected ? '#4f46e5' : 'transparent'}`, transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={pjs(13, isSelected ? 700 : 600, '18px', isSelected ? '#4f46e5' : '#0f172a')}>{a.title}</div>
                    <div style={{ ...pjs(11, 400, '14px', '#94a3b8'), marginTop: 2 }}>
                      Due {new Date(a.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      &nbsp;· {a.max_marks} marks
                    </div>
                  </div>
                  {isOverdue && (
                    <span style={{ ...pjs(10, 700, '12px', '#dc2626'), background: '#fef2f2', border: '1px solid #fecaca', padding: '2px 7px', borderRadius: 5 }}>Closed</span>
                  )}
                </div>
              )
            })}
          </div>

          {/* SpeedGrader */}
          {selAssignment && (
            <div>
              <div style={{ ...pjs(13, 700, '18px', '#0f172a'), marginBottom: 10 }}>
                SpeedGrader — <span style={{ color: '#4f46e5' }}>{selAssignment.title}</span>
                <span style={{ ...pjs(12, 400, '16px', '#94a3b8'), marginLeft: 8 }}>{submissions.length} submission{submissions.length !== 1 ? 's' : ''}</span>
              </div>
              <SpeedGrader
                submissions={submissions}
                assignmentId={selAssignment.id}
                maxMarks={selAssignment.max_marks}
                onGraded={() => loadSubmissions(selAssignment)}
              />
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  )
}
