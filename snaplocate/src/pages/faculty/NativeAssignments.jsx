import { useState, useEffect, useCallback } from 'react'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'
import {
  ClipboardList, ChevronLeft, ChevronRight,
  CheckCircle, ExternalLink, Plus, Search
} from 'lucide-react'

const fieldCls = 'w-full px-3 py-[9px] rounded-[10px] border-[1.5px] border-slate-200 text-[14px] outline-none box-border focus:border-brand transition-colors'

function Toast({ msg, type }) {
  if (!msg) return null
  return (
    <div className={`fixed bottom-6 right-6 px-5 py-3 rounded-xl z-[9999] text-[14px] font-semibold text-white ${type === 'error' ? 'bg-red-600' : 'bg-slate-900'}`}>
      {msg}
    </div>
  )
}

function CreateAssignmentModal({ sectionId, onClose, onCreated }) {
  const [form, setForm] = useState({
    title: '', description: '', due_date: '', max_marks: 100,
    allow_resubmission: false, max_attempts: 1,
    allow_late: false, late_penalty_percent: 0,
  })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
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
    <div className="fixed inset-0 bg-slate-900/55 z-[1000] flex items-center justify-center p-5">
      <div className="bg-white rounded-3xl w-full max-w-[560px] max-h-[90vh] overflow-auto shadow-[0_24px_80px_rgba(0,0,0,0.18)]">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="text-[16px] font-extrabold t-primary">New Assignment</div>
          <button onClick={onClose} className="bg-transparent border-none cursor-pointer text-[13px] font-semibold text-slate-500">Cancel</button>
        </div>
        <div className="px-6 py-5 flex flex-col gap-3.5">
          <div>
            <div className="text-[12px] font-semibold text-slate-700 mb-1.5">Title *</div>
            <input value={form.title} onChange={e => set('title', e.target.value)} className={fieldCls} placeholder="e.g. Lab Report 1" />
          </div>
          <div>
            <div className="text-[12px] font-semibold text-slate-700 mb-1.5">Description</div>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3}
              className={`${fieldCls} resize-y`} placeholder="Instructions for students..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-[12px] font-semibold text-slate-700 mb-1.5">Due Date & Time *</div>
              <input type="datetime-local" value={form.due_date} onChange={e => set('due_date', e.target.value)} className={fieldCls} />
            </div>
            <div>
              <div className="text-[12px] font-semibold text-slate-700 mb-1.5">Max Marks</div>
              <input type="number" value={form.max_marks} onChange={e => set('max_marks', e.target.value)} min={0} className={fieldCls} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-[12px] font-semibold text-slate-700 mb-1.5">Max Attempts</div>
              <input type="number" value={form.max_attempts} onChange={e => set('max_attempts', e.target.value)} min={1} max={10} className={fieldCls} />
            </div>
            <div>
              <div className="text-[12px] font-semibold text-slate-700 mb-1.5">Late Penalty (%)</div>
              <input type="number" value={form.late_penalty_percent} onChange={e => set('late_penalty_percent', e.target.value)} min={0} max={100} className={fieldCls} />
            </div>
          </div>
          <div className="flex gap-5">
            {[
              { key: 'allow_resubmission', label: 'Allow Re-submission' },
              { key: 'allow_late',         label: 'Allow Late Submission' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form[key]} onChange={e => set(key, e.target.checked)} />
                <span className="text-[13px] font-medium text-slate-700">{label}</span>
              </label>
            ))}
          </div>

          {error && <div className="text-[13px] font-medium text-red-600 bg-red-50 rounded-[10px] px-3 py-2.5">{error}</div>}

          <button onClick={submit} disabled={loading}
            className={`py-3 rounded-xl border-none text-[14px] font-bold text-white transition-all ${loading ? 'bg-slate-200 cursor-not-allowed' : 'cursor-pointer'}`}
            style={{ background: loading ? undefined : 'linear-gradient(135deg,#4f46e5,#6366f1)' }}>
            {loading ? 'Creating...' : 'Create Assignment'}
          </button>
        </div>
      </div>
    </div>
  )
}

function SpeedGrader({ submissions, assignmentId, maxMarks, onGraded }) {
  const [idx,      setIdx]      = useState(0)
  const [marks,    setMarks]    = useState('')
  const [feedback, setFeedback] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [toast,    setToast]    = useState(null)

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
    <div className="text-center py-10 text-[13px] text-slate-400">No submissions to grade.</div>
  )

  return (
    <div className="bg-white rounded-[20px] border border-slate-100 overflow-hidden">
      <Toast msg={toast?.msg} type={toast?.type} />
      {/* Nav bar */}
      <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
        <div className="text-[13px] font-bold t-primary">SpeedGrader — {idx + 1} / {submissions.length}</div>
        <div className="flex gap-1.5">
          <button onClick={() => { setIdx(i => Math.max(0, i - 1)); setMarks(''); setFeedback('') }} disabled={idx === 0}
            className={`px-2.5 py-1.5 rounded-lg border-[1.5px] border-slate-200 bg-white ${idx === 0 ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
            <ChevronLeft size={15} color="#64748b" />
          </button>
          <button onClick={() => { setIdx(i => Math.min(submissions.length - 1, i + 1)); setMarks(''); setFeedback('') }} disabled={idx === submissions.length - 1}
            className={`px-2.5 py-1.5 rounded-lg border-[1.5px] border-slate-200 bg-white ${idx === submissions.length - 1 ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
            <ChevronRight size={15} color="#64748b" />
          </button>
        </div>
      </div>

      <div className="grid min-h-[280px]" style={{ gridTemplateColumns: '1fr 240px' }}>
        {/* Submission viewer */}
        <div className="p-5 border-r border-slate-100">
          <div className="flex items-center gap-3 mb-3.5">
            <div className="w-[38px] h-[38px] rounded-[10px] bg-gradient-to-br from-indigo-50 to-indigo-100 flex items-center justify-center shrink-0">
              <span className="text-[14px] font-bold text-brand">{(sub.users?.full_name || '?').charAt(0)}</span>
            </div>
            <div>
              <div className="text-[14px] font-bold t-primary">{sub.users?.full_name}</div>
              <div className="text-[11px] text-slate-400">
                {sub.users?.email} · Submitted {new Date(sub.submitted_at).toLocaleString('en-IN')}
                {sub.status === 'late' && <span className="text-amber-600 font-bold"> · Late</span>}
              </div>
            </div>
            {sub.marks_obtained != null && (
              <div className="ml-auto text-[13px] font-bold text-green-600 bg-green-50 border border-green-200 px-3 py-1 rounded-lg">
                {sub.marks_obtained}/{maxMarks} ✓
              </div>
            )}
          </div>

          {sub.text_content && (
            <div className="bg-slate-50 rounded-xl px-4 py-3.5 text-[13px] text-slate-700 leading-5 max-h-[200px] overflow-y-auto">
              {sub.text_content}
            </div>
          )}
          {sub.file_url && (
            <a href={sub.file_url} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-1.5 mt-2.5 px-3.5 py-2 rounded-[10px] border-[1.5px] border-indigo-200 bg-indigo-50 no-underline text-[13px] font-semibold text-brand">
              <ExternalLink size={13} /> View Submission File
            </a>
          )}
          {!sub.text_content && !sub.file_url && (
            <div className="text-[13px] text-slate-400 italic">No content provided by student.</div>
          )}
        </div>

        {/* Grade panel */}
        <div className="p-5">
          <div className="text-[12px] font-bold text-slate-700 mb-2">Marks (out of {maxMarks})</div>
          <input type="number" value={marks} onChange={e => setMarks(e.target.value)}
            placeholder={`0–${maxMarks}`} min={0} max={maxMarks}
            className="w-full px-3 py-3 rounded-[10px] border-[1.5px] border-slate-200 text-[22px] font-extrabold t-primary text-center outline-none focus:border-brand transition-colors" />

          <div className="text-[12px] font-bold text-slate-700 mt-3.5 mb-2">Feedback (optional)</div>
          <textarea value={feedback} onChange={e => setFeedback(e.target.value)} rows={3}
            placeholder="Well done! / Needs improvement..."
            className="w-full px-3 py-2.5 rounded-[10px] border-[1.5px] border-slate-200 resize-none text-[13px] outline-none focus:border-brand transition-colors box-border" />

          <button onClick={grade} disabled={loading || !marks}
            className={`w-full mt-3 py-3 rounded-xl border-none flex items-center justify-center gap-2 text-[14px] font-bold text-white transition-all ${loading || !marks ? 'bg-slate-200 cursor-not-allowed' : 'cursor-pointer'}`}
            style={{ background: loading || !marks ? undefined : 'linear-gradient(135deg,#16a34a,#22c55e)' }}>
            <CheckCircle size={15} /> {loading ? 'Saving...' : 'Save & Next'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function FacultyAssignments() {
  const [sections,      setSections]      = useState([])
  const [selSection,    setSelSection]    = useState(null)
  const [assignments,   setAssignments]   = useState([])
  const [selAssignment, setSelAssignment] = useState(null)
  const [submissions,   setSubmissions]   = useState([])
  const [loading,       setLoading]       = useState(true)
  const [showCreate,    setShowCreate]    = useState(false)
  const [toast,         setToast]         = useState(null)
  const [search,        setSearch]        = useState('')

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000) }

  const loadSections = useCallback(async () => {
    try {
      const res = await api.get('/api/lms/native/faculty/my-sections')
      if (res.success) {
        const all = (res.data || []).map(sec => ({ ...sec, course: sec.lms_courses }))
        setSections(all)
        if (all.length > 0 && !selSection) setSelSection(all[0])
      }
    } catch {}
    finally { setLoading(false) }
  }, [selSection])

  useEffect(() => { loadSections() }, [loadSections])

  const loadAssignments = useCallback(async () => {
    if (!selSection) return
    try {
      const res = await api.get(`/api/lms/native/assignments/sections/${selSection.id}`)
      if (res.success) { setAssignments(res.data || []); setSelAssignment(null); setSubmissions([]) }
    } catch {}
  }, [selSection])

  useEffect(() => { loadAssignments() }, [loadAssignments])

  const loadSubmissions = async (asgn) => {
    setSelAssignment(asgn)
    try {
      const res = await api.get(`/api/lms/native/assignments/${asgn.id}/submissions`)
      if (res.success) setSubmissions(res.data || [])
    } catch {}
  }

  const filtered = assignments.filter(a => !search || a.title.toLowerCase().includes(search.toLowerCase()))

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
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-start gap-3.5">
          <div className="w-[46px] h-[46px] rounded-[14px] bg-gradient-to-br from-indigo-50 to-indigo-100 flex items-center justify-center">
            <ClipboardList size={22} color="#4f46e5" />
          </div>
          <div>
            <h1 className="text-[26px] font-extrabold t-primary m-0 tracking-[-0.02em]">Assignments</h1>
            <p className="text-[13px] text-slate-500 m-0 mt-1">Post assignments · SpeedGrade submissions</p>
          </div>
        </div>
        <button onClick={() => setShowCreate(true)} disabled={!selSection}
          className={`flex items-center gap-2 px-[18px] py-2.5 rounded-xl border-none text-[13px] font-bold text-white ${selSection ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
          style={{ background: 'linear-gradient(135deg,#4f46e5,#6366f1)' }}>
          <Plus size={15} /> New Assignment
        </button>
      </div>

      <div className="grid gap-5 items-start" style={{ gridTemplateColumns: '220px 1fr' }}>
        {/* Section picker */}
        <div className="bg-white rounded-[20px] border border-slate-100 overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="px-4 py-3 border-b border-slate-100 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400">Sections</div>
          {sections.map(sec => {
            const active = selSection?.id === sec.id
            return (
              <div key={sec.id} onClick={() => { setSelSection(sec); setSelAssignment(null); setSubmissions([]) }}
                className={`px-4 py-3 cursor-pointer border-b border-slate-50 border-l-[3px] transition-all ${active ? 'bg-indigo-50 border-l-brand' : 'bg-transparent border-l-transparent hover:bg-slate-50'}`}>
                <div className={`text-[13px] leading-[18px] ${active ? 'font-bold text-brand' : 'font-medium text-slate-700'}`}>{sec.course?.title}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Section {sec.section_name}</div>
              </div>
            )
          })}
        </div>

        {/* Right pane */}
        <div className="flex flex-col gap-3.5">
          {/* Assignment list */}
          <div className="bg-white rounded-[20px] border border-slate-100 overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2.5">
              <div className="relative flex-1">
                <Search size={13} color="#94a3b8" className="absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search assignments..."
                  className="w-full py-[7px] pl-[30px] pr-2.5 rounded-[9px] border-[1.5px] border-slate-200 text-[13px] outline-none box-border focus:border-brand transition-colors" />
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="py-10 text-center text-[13px] text-slate-400">
                {selSection ? 'No assignments posted yet.' : 'Select a section first.'}
              </div>
            ) : filtered.map(a => {
              const isSelected = selAssignment?.id === a.id
              const isOverdue  = new Date() > new Date(a.due_date)
              return (
                <div key={a.id} onClick={() => loadSubmissions(a)}
                  className={`px-[18px] py-3.5 cursor-pointer border-b border-slate-50 border-l-[3px] transition-all flex items-center gap-3 ${isSelected ? 'bg-indigo-50 border-l-brand' : 'bg-transparent border-l-transparent hover:bg-slate-50'}`}>
                  <div className="flex-1 min-w-0">
                    <div className={`text-[13px] leading-[18px] ${isSelected ? 'font-bold text-brand' : 'font-semibold t-primary'}`}>{a.title}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Due {new Date(a.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} · {a.max_marks} marks
                    </div>
                  </div>
                  {isOverdue && (
                    <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-[7px] py-0.5 rounded-[5px]">Closed</span>
                  )}
                </div>
              )
            })}
          </div>

          {/* SpeedGrader */}
          {selAssignment && (
            <div>
              <div className="text-[13px] font-bold t-primary mb-2.5">
                SpeedGrader — <span className="text-brand">{selAssignment.title}</span>
                <span className="text-[12px] font-normal text-slate-400 ml-2">{submissions.length} submission{submissions.length !== 1 ? 's' : ''}</span>
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
