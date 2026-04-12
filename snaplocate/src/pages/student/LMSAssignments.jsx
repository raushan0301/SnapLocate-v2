import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'
import { ClipboardList, CheckCircle, Clock, AlertCircle } from 'lucide-react'

const pjs = (size, weight, lh, color) => ({
  fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: size, fontWeight: weight, lineHeight: lh, color,
})

function statusInfo(a) {
  if (a.my_submission?.status === 'graded') return { bg: '#f0fdf4', color: '#16a34a', label: 'Graded', icon: CheckCircle }
  if (a.my_submission)                       return { bg: '#eef2ff', color: '#4f46e5', label: 'Submitted', icon: CheckCircle }
  const overdue = new Date(a.due_date) < Date.now()
  if (overdue)  return { bg: '#fee2e2', color: '#dc2626', label: 'Overdue', icon: AlertCircle }
  return { bg: '#fef3c7', color: '#d97706', label: 'Pending', icon: Clock }
}

function dueLabel(d) {
  const diff = new Date(d).getTime() - Date.now()
  const days = Math.ceil(diff / 86400000)
  if (days < 0)  return `${Math.abs(days)}d overdue`
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

  useEffect(() => { load() }, [load] )

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
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 44, height: 44, borderRadius: 14, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ClipboardList size={22} color="#d97706" />
        </div>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#0f172a', margin: 0 }}>Assignments</h1>
          <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>All assignments across your enrolled courses.</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setFilter(t.key)}
            style={{ padding: '8px 16px', borderRadius: 10, border: '1.5px solid', cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
              borderColor: filter === t.key ? '#4f46e5' : '#e2e8f0',
              background:  filter === t.key ? '#4f46e5' : '#fff',
              color:       filter === t.key ? '#fff' : '#64748b',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9', boxShadow: '0 4px 24px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', ...pjs(14, 500, '20px', '#94a3b8') }}>Loading assignments...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '60px 24px', textAlign: 'center' }}>
            <CheckCircle size={40} color="#e2e8f0" style={{ margin: '0 auto 12px', display: 'block' }} />
            <div style={pjs(15, 600, '20px', '#0f172a')}>No assignments here</div>
          </div>
        ) : filtered.map((a, i) => {
          const s = statusInfo(a)
          const Icon = s.icon
          return (
            <Link key={i} to={`/lms/assignments/${a.id}`} style={{ textDecoration: 'none' }}>
              <div style={{ padding: '16px 24px', borderBottom: '1px solid #f8fafc', display: 'flex', alignItems: 'center', gap: 16 }}
                onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={18} color={s.color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={pjs(14, 700, '18px', '#0f172a')}>{a.title}</div>
                  <div style={pjs(12, 400, '16px', '#94a3b8')}>{a.max_marks} marks · {dueLabel(a.due_date)}</div>
                </div>
                <span style={{ ...pjs(11, 700, '14px', s.color), background: s.bg, padding: '4px 10px', borderRadius: 8, flexShrink: 0 }}>
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
