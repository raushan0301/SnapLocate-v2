import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'
import { ClipboardList, CheckCircle, Clock, AlertCircle } from 'lucide-react'

const STATUS_CLS = {
  graded:    { bg: 'bg-green-50',  text: 'text-green-700',  label: 'Graded',    Icon: CheckCircle },
  submitted: { bg: 'bg-indigo-50', text: 'text-brand',      label: 'Submitted', Icon: CheckCircle },
  overdue:   { bg: 'bg-red-50',    text: 'text-red-600',    label: 'Overdue',   Icon: AlertCircle },
  pending:   { bg: 'bg-amber-50',  text: 'text-amber-600',  label: 'Pending',   Icon: Clock },
}

function statusOf(a) {
  if (a.my_submission?.status === 'graded') return STATUS_CLS.graded
  if (a.my_submission)                       return STATUS_CLS.submitted
  if (new Date(a.due_date) < Date.now())     return STATUS_CLS.overdue
  return STATUS_CLS.pending
}

function dueLabel(d) {
  const diff = new Date(d).getTime() - Date.now()
  const days = Math.ceil(diff / 86400000)
  if (days < 0)   return `${Math.abs(days)}d overdue`
  if (days === 0) return 'Due today'
  if (days === 1) return 'Due tomorrow'
  return `${days}d left`
}

export default function LMSAssignments() {
  const [items, setItems]     = useState([])
  const [courses, setCourses] = useState([])
  const [filter, setFilter]   = useState('all')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const cRes = await api.get('/api/lms/courses')
      if (!cRes.success) return
      setCourses(cRes.data || [])
      const enrolled = cRes.data || []
      const results = await Promise.allSettled(
        enrolled.map(e => api.get(`/api/lms/assignments?course_id=${e.courses?.id || e.course_id}`))
      )
      const all = results.flatMap(r => r.status === 'fulfilled' ? (r.value.data || []) : [])
      all.sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
      setItems(all)
    } catch {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = items.filter(a => {
    if (filter === 'pending')   return !a.my_submission && new Date(a.due_date) >= Date.now()
    if (filter === 'submitted') return !!a.my_submission
    if (filter === 'overdue')   return !a.my_submission && new Date(a.due_date) < Date.now()
    return true
  })

  const counts = {
    all:       items.length,
    pending:   items.filter(a => !a.my_submission && new Date(a.due_date) >= Date.now()).length,
    submitted: items.filter(a => !!a.my_submission).length,
    overdue:   items.filter(a => !a.my_submission && new Date(a.due_date) < Date.now()).length,
  }

  const tabs = [
    { key: 'all',       label: `All (${counts.all})` },
    { key: 'pending',   label: `Pending (${counts.pending})` },
    { key: 'submitted', label: `Submitted (${counts.submitted})` },
    { key: 'overdue',   label: `Overdue (${counts.overdue})` },
  ]

  return (
    <PageLayout>
      <div className="flex items-center gap-4">
        <div className="w-11 h-11 rounded-[14px] bg-amber-50 flex items-center justify-center">
          <ClipboardList size={22} color="#d97706" />
        </div>
        <div>
          <h1 className="text-[26px] font-bold t-primary m-0">Assignments</h1>
          <p className="t-base t-muted m-0">All assignments across your enrolled courses.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setFilter(t.key)}
            className={`px-4 py-2 rounded-[10px] border-[1.5px] cursor-pointer text-[13px] font-semibold transition-all ${filter === t.key ? 'border-brand bg-brand text-white' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-[20px] border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.03)] overflow-hidden">
        {loading ? (
          <div className="py-16 text-center t-base font-medium text-slate-400">Loading assignments...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 px-6 text-center">
            <CheckCircle size={40} className="text-slate-200 mx-auto mb-3 block" />
            <div className="text-[15px] font-semibold leading-5 t-primary">No assignments here</div>
          </div>
        ) : filtered.map((a, i) => {
          const s = statusOf(a)
          const Icon = s.Icon
          return (
            <Link key={i} to={`/lms/assignments/${a.id}`} className="no-underline">
              <div className="px-6 py-4 border-b border-slate-50 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>
                  <Icon size={18} className={s.text} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-bold leading-[18px] t-primary">{a.title}</div>
                  <div className="text-[12px] font-normal leading-4 text-slate-400">{a.max_marks} marks · {dueLabel(a.due_date)}</div>
                </div>
                <span className={`text-[11px] font-bold leading-[14px] ${s.text} ${s.bg} px-2.5 py-1 rounded-lg shrink-0`}>
                  {a.my_submission?.status === 'graded' ? `${a.my_submission.marks}/${a.max_marks}` : s.label}
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    </PageLayout>
  )
}
