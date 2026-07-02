import { useState, useEffect } from 'react'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'
import {
  ClipboardList, Upload, CheckCircle, Clock, AlertCircle,
  ChevronDown, X, ExternalLink, Star, Lock
} from 'lucide-react'

const STATUS = {
  graded:    { label: 'Graded',    cls: 'bg-green-50  text-green-700 border-green-200',  borderColor: '#bbf7d0', Icon: Star },
  submitted: { label: 'Submitted', cls: 'bg-sky-50    text-sky-700   border-sky-200',    borderColor: '#bae6fd', Icon: CheckCircle },
  late:      { label: 'Late',      cls: 'bg-amber-50  text-amber-700 border-amber-200',  borderColor: '#fde68a', Icon: Clock },
  overdue:   { label: 'Overdue',   cls: 'bg-red-50    text-red-700   border-red-200',    borderColor: '#fecaca', Icon: AlertCircle },
  pending:   { label: 'Pending',   cls: 'bg-slate-50  text-slate-500 border-slate-200',  borderColor: '#e2e8f0', Icon: ClipboardList },
}
// icon bg per status (softer tint + border)
const STATUS_ICON_BG = {
  graded:    'bg-green-50  border-green-200',
  submitted: 'bg-sky-50    border-sky-200',
  late:      'bg-amber-50  border-amber-200',
  overdue:   'bg-red-50    border-red-200',
  pending:   'bg-slate-50  border-slate-200',
}

function Toast({ msg, type }) {
  if (!msg) return null
  return (
    <div className={`fixed bottom-6 right-6 px-5 py-3 rounded-xl z-[9999] t-base font-semibold shadow-[0_8px_32px_rgba(0,0,0,0.18)] text-white ${type === 'error' ? 'bg-danger' : 'bg-ink'}`}>
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
  const [fileUrl, setFileUrl]         = useState('')
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')

  const handleSubmit = async () => {
    if (!textContent.trim() && !fileUrl.trim()) { setError('Add text or a file URL before submitting.'); return }
    setLoading(true); setError('')
    try {
      const res = await api.post(`/api/lms/native/assignments/${assignment.id}/submit`, {
        text_content: textContent || null,
        file_url:     fileUrl     || null,
      })
      if (res.success) { onSubmitted(); onClose() }
      else setError(res.error || 'Submission failed')
    } catch (e) { setError(e?.message || 'Network error') }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-ink/55 z-[1000] flex items-center justify-center p-5"
      onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-[520px] shadow-[0_24px_80px_rgba(0,0,0,0.18)] overflow-hidden"
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between">
          <div>
            <div className="t-base font-extrabold t-primary">{assignment.title}</div>
            <div className="t-md font-medium t-muted mt-0.5">
              Due: {new Date(assignment.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              &nbsp;· Max: {assignment.max_marks} marks
            </div>
          </div>
          <button onClick={onClose} className="bg-transparent border-none cursor-pointer p-1">
            <X size={20} className="t-subtle" />
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-3.5">
          {assignment.description && (
            <div className="bg-surface rounded-xl px-3.5 py-3 t-md t-primary">{assignment.description}</div>
          )}

          <div>
            <div className="text-[12px] font-semibold text-slate-600 mb-1.5">Your Answer / Description</div>
            <textarea value={textContent} onChange={e => setTextContent(e.target.value)} rows={5}
              placeholder="Write your answer or describe your submission…"
              className="w-full px-3 py-2.5 rounded-xl border-[1.5px] border-slate-200 t-base t-primary outline-none resize-y focus:border-brand box-border"
            />
          </div>

          <div>
            <div className="text-[12px] font-semibold text-slate-600 mb-1.5">File / Drive Link (optional)</div>
            <input value={fileUrl} onChange={e => setFileUrl(e.target.value)}
              placeholder="https://drive.google.com/…"
              className="w-full px-3 py-2.5 rounded-xl border-[1.5px] border-slate-200 t-md t-primary outline-none focus:border-brand box-border"
            />
          </div>

          {error && (
            <div className="bg-danger-light border border-red-200 rounded-xl px-3 py-2.5 t-md font-medium text-danger">{error}</div>
          )}

          <button onClick={handleSubmit} disabled={loading}
            className={`w-full py-3 rounded-xl border-none text-white t-base font-bold flex items-center justify-center gap-2 ${loading ? 'bg-slate-200 cursor-not-allowed' : 'bg-gradient-to-br from-indigo-600 to-indigo-500 cursor-pointer'}`}>
            <Upload size={16} />
            {loading ? 'Submitting…' : 'Submit Assignment'}
          </button>
        </div>
      </div>
    </div>
  )
}

function AssignmentCard({ asgn, onRefresh }) {
  const [open, setOpen]         = useState(false)
  const [showModal, setShowModal] = useState(false)

  const sub       = asgn.my_submission
  const isOverdue = new Date() > new Date(asgn.due_date) && !sub
  const timeLeft  = countdown(asgn.due_date)

  let statusKey = 'pending'
  if (sub?.status === 'graded') statusKey = 'graded'
  else if (sub?.status === 'late') statusKey = 'late'
  else if (sub) statusKey = 'submitted'
  else if (isOverdue) statusKey = 'overdue'

  const { label, cls, borderColor, Icon } = STATUS[statusKey]
  const iconBgCls = STATUS_ICON_BG[statusKey]
  const course    = asgn.lms_course_sections?.lms_courses

  return (
    <>
      {showModal && <SubmitModal assignment={asgn} onClose={() => setShowModal(false)} onSubmitted={onRefresh} />}
      <div className="bg-white rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden transition-colors border-[1.5px]"
        style={{ borderColor: open ? borderColor : '#f1f5f9' }}>
        {/* Header */}
        <div onClick={() => setOpen(o => !o)} className="px-5 py-4 cursor-pointer flex items-center gap-3.5">
          <div className={`w-10 h-10 rounded-xl border-[1.5px] flex items-center justify-center shrink-0 ${iconBgCls}`}>
            <Icon size={18} style={{ color: STATUS[statusKey].cls.split(' ')[1].replace('text-', '').includes('-') ? undefined : undefined }} className={STATUS[statusKey].cls.split(' ').find(c => c.startsWith('text-'))} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="t-base font-bold t-primary">{asgn.title}</div>
            <div className="text-[12px] t-subtle mt-0.5">
              {course?.code} · Section {asgn.lms_course_sections?.section_name}
              &nbsp;· Due {new Date(asgn.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </div>
          </div>
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap justify-end">
            {timeLeft && statusKey === 'pending' && (
              <span className="text-[11px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">⏱ {timeLeft}</span>
            )}
            <span className={`text-[11px] font-bold border px-2.5 py-1 rounded-md ${cls}`}>{label}</span>
            {sub?.marks_obtained != null && (
              <span className="text-[13px] font-extrabold text-green-600">{sub.marks_obtained}/{asgn.max_marks}</span>
            )}
            <ChevronDown size={15} className={`text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
          </div>
        </div>

        {/* Expanded */}
        {open && (
          <div className="px-5 pb-5 border-t border-slate-50">
            {asgn.description && (
              <div className="bg-surface rounded-xl px-3.5 py-3 my-3.5 t-md t-primary">{asgn.description}</div>
            )}

            <div className="grid grid-cols-3 gap-2.5 mb-4">
              {[
                { label: 'Max Marks', val: asgn.max_marks },
                { label: 'Attempts',  val: `${asgn.max_attempts} allowed` },
                { label: 'Late Submit', val: asgn.allow_late ? `Yes (${asgn.late_penalty_percent}% penalty)` : 'No' },
              ].map(({ label: l, val }) => (
                <div key={l} className="bg-surface rounded-xl px-3.5 py-2.5">
                  <div className="text-[10px] font-semibold t-subtle">{l}</div>
                  <div className="text-[13px] font-bold t-primary mt-0.5">{val}</div>
                </div>
              ))}
            </div>

            {sub && (
              <div className={`border-[1.5px] rounded-2xl px-4 py-3.5 mb-3.5 ${statusKey === 'graded' ? 'bg-green-50 border-green-200' : 'bg-sky-50 border-sky-200'}`}>
                <div className="text-[12px] font-bold t-primary mb-1.5">Your Submission</div>
                <div className="t-md t-secondary">
                  Submitted: {new Date(sub.submitted_at).toLocaleString('en-IN')}
                  {sub.feedback_text && <div className="mt-2">Feedback: <b>{sub.feedback_text}</b></div>}
                  {sub.file_url && (
                    <a href={sub.file_url} target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-1 mt-2 text-brand no-underline font-semibold">
                      <ExternalLink size={12} /> View Submitted File
                    </a>
                  )}
                </div>
              </div>
            )}

            {!sub && !isOverdue && (
              <button onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl border-none text-white t-md font-bold cursor-pointer bg-gradient-to-br from-indigo-600 to-indigo-500">
                <Upload size={15} /> Submit Now
              </button>
            )}
            {!sub && isOverdue && !asgn.allow_late && (
              <div className="flex items-center gap-2 t-md font-medium text-danger">
                <Lock size={14} /> Submission closed — deadline passed
              </div>
            )}
            {!sub && isOverdue && asgn.allow_late && (
              <button onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl border-[1.5px] border-amber-200 bg-amber-50 cursor-pointer t-md font-bold text-amber-600">
                <Upload size={15} /> Submit Late ({asgn.late_penalty_percent}% penalty)
              </button>
            )}
            {sub && asgn.allow_resubmission && statusKey !== 'graded' && (
              <button onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl border-[1.5px] border-indigo-200 bg-brand-light cursor-pointer t-md font-bold text-brand">
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
  const [loading, setLoading]         = useState(true)
  const [filter, setFilter]           = useState('all')
  const [toast, setToast]             = useState(null)

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
    const sub       = a.my_submission
    const isOverdue = new Date() > new Date(a.due_date) && !sub
    if (filter === 'pending')   return !sub && !isOverdue
    if (filter === 'submitted') return !!sub && sub.status !== 'graded'
    if (filter === 'graded')    return sub?.status === 'graded'
    if (filter === 'overdue')   return isOverdue
    return true
  })

  const counts = {
    all:       assignments.length,
    pending:   assignments.filter(a => !a.my_submission && new Date() < new Date(a.due_date)).length,
    overdue:   assignments.filter(a => !a.my_submission && new Date() > new Date(a.due_date)).length,
    submitted: assignments.filter(a => a.my_submission && a.my_submission.status !== 'graded').length,
    graded:    assignments.filter(a => a.my_submission?.status === 'graded').length,
  }

  const FILTERS = [
    { key: 'all',       label: 'All',       dot: null },
    { key: 'pending',   label: 'Pending',   dot: 'bg-amber-500' },
    { key: 'overdue',   label: 'Overdue',   dot: 'bg-red-500' },
    { key: 'submitted', label: 'Submitted', dot: 'bg-sky-500' },
    { key: 'graded',    label: 'Graded',    dot: 'bg-green-500' },
  ]

  return (
    <PageLayout>
      <Toast msg={toast?.msg} type={toast?.type} />

      {/* Header */}
      <div className="flex items-start gap-3.5 mb-6">
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 bg-gradient-to-br from-indigo-50 to-indigo-100">
          <ClipboardList size={22} className="text-brand" />
        </div>
        <div>
          <h1 className="t-heading-xl t-primary m-0 tracking-tight">Native Assignments</h1>
          <p className="t-md t-muted mt-1 m-0">All assignments from your enrolled native LMS courses</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 flex-wrap mb-6">
        {FILTERS.map(({ key, label, dot }) => {
          const active = filter === key
          return (
            <button key={key} onClick={() => setFilter(key)}
              className={`px-4 py-2 rounded-xl border-[1.5px] cursor-pointer flex items-center gap-1.5 transition-colors text-[13px] ${active ? 'bg-brand-light border-brand text-brand font-bold' : 'bg-white border-slate-200 text-slate-500 font-medium hover:bg-surface'}`}>
              {dot && <span className={`w-1.5 h-1.5 rounded-full inline-block ${dot}`} />}
              {label}
              <span className={`text-[11px] font-bold rounded-md px-1.5 py-0.5 ${active ? 'bg-indigo-200 text-brand' : 'bg-slate-100 t-subtle'}`}>
                {counts[key]}
              </span>
            </button>
          )
        })}
      </div>

      {/* List */}
      {loading ? (
        <div className="py-16 text-center t-base t-subtle">Loading assignments…</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-[20px] border-[1.5px] border-dashed border-slate-200 py-16 px-6 text-center">
          <ClipboardList size={40} className="text-slate-200 mx-auto mb-3" />
          <div className="t-base font-semibold t-primary">No assignments found</div>
          <div className="t-md t-subtle mt-1">
            {filter === 'all' ? 'Your faculty has not posted any assignments yet.' : `No ${filter} assignments.`}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filtered.map(a => <AssignmentCard key={a.id} asgn={a} onRefresh={load} />)}
        </div>
      )}
    </PageLayout>
  )
}
