import { useState, useEffect, useCallback } from 'react'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'
import { CalendarDays, MapPin, Clock } from 'lucide-react'

const pjs = (size, weight, lh, color) => ({
  fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: size, fontWeight: weight, lineHeight: lh, color,
})

const typeStyle = {
  mid:          { bg: '#eef2ff', color: '#4f46e5', label: 'Mid Sem' },
  end:          { bg: '#fef3c7', color: '#d97706', label: 'End Sem' },
  internal:     { bg: '#f0fdf4', color: '#16a34a', label: 'Internal' },
  quiz:         { bg: '#fdf4ff', color: '#7e22ce', label: 'Quiz' },
  practical:    { bg: '#fff7ed', color: '#ea580c', label: 'Practical' },
  supplementary:{ bg: '#fee2e2', color: '#dc2626', label: 'Supplementary' },
}

function daysUntil(dateStr) {
  const diff = new Date(dateStr).setHours(0,0,0,0) - new Date().setHours(0,0,0,0)
  const days = Math.round(diff / 86400000)
  if (days < 0)  return null
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  return `${days} days`
}

export default function ExamScheduleView() {
  const [exams, setExams]   = useState([])
  const [filter, setFilter] = useState('upcoming')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const res = await api.get('/api/exam-schedule')
      if (res.success) setExams(res.data || [])
    } catch {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const now = new Date().setHours(0,0,0,0)
  const upcoming = exams.filter(e => new Date(e.exam_date).setHours(0,0,0,0) >= now)
  const past     = exams.filter(e => new Date(e.exam_date).setHours(0,0,0,0) < now)
  const shown    = filter === 'upcoming' ? upcoming : past

  return (
    <PageLayout>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 44, height: 44, borderRadius: 14, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CalendarDays size={22} color="#4f46e5" />
        </div>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#0f172a', margin: 0 }}>Exam Schedule</h1>
          <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>Upcoming and past examination dates.</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        {[
          { key: 'upcoming', label: `Upcoming (${upcoming.length})` },
          { key: 'past',     label: `Past (${past.length})` },
        ].map(t => (
          <button key={t.key} onClick={() => setFilter(t.key)}
            style={{ padding: '8px 16px', borderRadius: 10, border: '1.5px solid', cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 600,
              borderColor: filter === t.key ? '#4f46e5' : '#e2e8f0',
              background:  filter === t.key ? '#4f46e5' : '#fff',
              color:       filter === t.key ? '#fff' : '#64748b',
            }}>{t.label}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: 60, textAlign: 'center', ...pjs(14, 500, '20px', '#94a3b8') }}>Loading exams...</div>
      ) : shown.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9', padding: '60px 24px', textAlign: 'center' }}>
          <CalendarDays size={40} color="#e2e8f0" style={{ margin: '0 auto 12px', display: 'block' }} />
          <div style={pjs(15, 600, '20px', '#0f172a')}>No {filter} exams</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {shown.map((e, i) => {
            const ts     = typeStyle[e.exam_type] || typeStyle.end
            const remain = daysUntil(e.exam_date)
            return (
              <div key={i} style={{ background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                {/* Date block */}
                <div style={{ width: 56, height: 56, borderRadius: 16, background: ts.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <div style={pjs(18, 800, '22px', ts.color)}>{new Date(e.exam_date).getDate()}</div>
                  <div style={pjs(10, 600, '12px', ts.color)}>{new Date(e.exam_date).toLocaleString('en-US', { month: 'short' }).toUpperCase()}</div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={pjs(15, 700, '20px', '#0f172a')}>{e.course_code || e.courses?.code} — {e.course_name || e.courses?.name}</span>
                    <span style={{ ...pjs(11, 700, '14px', ts.color), background: ts.bg, padding: '3px 8px', borderRadius: 6 }}>{ts.label}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 16, marginTop: 6, flexWrap: 'wrap' }}>
                    {e.start_time && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={12} color="#94a3b8" />
                        <span style={pjs(12, 500, '16px', '#64748b')}>{e.start_time}{e.end_time ? ` – ${e.end_time}` : ''}{e.duration_mins ? ` (${e.duration_mins} min)` : ''}</span>
                      </div>
                    )}
                    {e.venue && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MapPin size={12} color="#94a3b8" />
                        <span style={pjs(12, 500, '16px', '#64748b')}>{e.venue}</span>
                      </div>
                    )}
                  </div>
                </div>
                {remain && (
                  <div style={{ flexShrink: 0, textAlign: 'right' }}>
                    <div style={pjs(13, 700, '18px', remain === 'Today' ? '#dc2626' : '#4f46e5')}>{remain}</div>
                    <div style={pjs(11, 400, '14px', '#94a3b8')}>{new Date(e.exam_date).toLocaleDateString('en-IN', { weekday: 'short' })}</div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </PageLayout>
  )
}
