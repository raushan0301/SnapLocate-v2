import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'
import { CalendarDays, RefreshCw, ArrowLeft, Clock, MapPin, AlertCircle } from 'lucide-react'

const pjs = (s, w, lh, c) => ({ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: s, fontWeight: w, lineHeight: lh, color: c })

const typeStyle = {
  mid:           { bg: '#eef2ff', color: '#4f46e5', label: 'Mid Sem'       },
  end:           { bg: '#fef3c7', color: '#d97706', label: 'End Sem'       },
  internal:      { bg: '#f0fdf4', color: '#16a34a', label: 'Internal'      },
  quiz:          { bg: '#fdf4ff', color: '#7e22ce', label: 'Quiz'          },
  practical:     { bg: '#fff7ed', color: '#ea580c', label: 'Practical'     },
  supplementary: { bg: '#fee2e2', color: '#dc2626', label: 'Supplementary' },
  default:       { bg: '#f1f5f9', color: '#475569', label: 'Exam'          },
}

function parseDate(str) {
  if (!str) return null
  // Handle DD/MM/YYYY, YYYY-MM-DD, DD-MM-YYYY, etc.
  const dmy = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/)
  if (dmy) {
    const [, d, m, y] = dmy
    const yr = y.length === 2 ? `20${y}` : y
    return new Date(`${yr}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`)
  }
  const d = new Date(str)
  return isNaN(d) ? null : d
}

function daysUntil(dateStr) {
  const d = parseDate(dateStr)
  if (!d) return null
  const diff = d.setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)
  const days = Math.round(diff / 86400000)
  if (days < 0)  return null
  if (days === 0) return 'Today!'
  if (days === 1) return 'Tomorrow'
  return `${days} days`
}

function ExamDateBlock({ dateStr, ts }) {
  const d = parseDate(dateStr)
  if (!d) return (
    <div style={{ width: 56, height: 56, borderRadius: 16, background: ts.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <span style={pjs(10, 600, '14px', ts.color)}>TBA</span>
    </div>
  )
  return (
    <div style={{ width: 56, height: 56, borderRadius: 16, background: ts.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `1px solid ${ts.color}20` }}>
      <div style={pjs(20, 800, '24px', ts.color)}>{d.getDate()}</div>
      <div style={pjs(10, 600, '12px', ts.color)}>{d.toLocaleString('en-US', { month: 'short' }).toUpperCase()}</div>
    </div>
  )
}

export default function ExamScheduleView() {
  const [exams, setExams]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [syncing, setSyncing]   = useState(false)
  const [filter, setFilter]     = useState('upcoming')
  const [lastSync, setLastSync] = useState('')
  const [connected, setConnected] = useState(true)

  const load = useCallback(async () => {
    try {
      const res = await api.get('/api/webkiosk/exams')
      if (res.success) {
        setExams(res.data || [])
        setLastSync(res.lastSyncedAt || '')
      }
    } catch { setConnected(false) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const syncNow = async () => {
    setSyncing(true)
    try { await api.post('/api/webkiosk/sync', {}) } catch {}
    for (let i = 0; i < 40; i++) {
      await new Promise(r => setTimeout(r, 3000))
      const r = await api.get('/api/webkiosk/exams').catch(() => null)
      if (r?.syncStatus && r.syncStatus !== 'pending' && r.syncStatus !== 'running') {
        setExams(r.data || [])
        setLastSync(r.lastSyncedAt || '')
        break
      }
    }
    setSyncing(false)
  }

  const now      = new Date().setHours(0, 0, 0, 0)
  const upcoming = exams.filter(e => { const d = parseDate(e.date); return d && d.setHours(0,0,0,0) >= now })
  const past     = exams.filter(e => { const d = parseDate(e.date); return !d || d.setHours(0,0,0,0) < now })
  const shown    = filter === 'upcoming' ? upcoming : past

  return (
    <PageLayout>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link to="/webkiosk" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', textDecoration: 'none', ...pjs(13, 600, '18px', '#64748b') }}>
            <ArrowLeft size={14} /> WebKiosk
          </Link>
          <div>
            <h1 style={{ ...pjs(26, 800, '32px', '#0f172a'), margin: 0 }}>Exam Schedule</h1>
            <div style={{ ...pjs(12, 400, '16px', '#64748b'), marginTop: 2 }}>
              {lastSync ? `Synced ${new Date(lastSync).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}` : 'Not yet synced'}
            </div>
          </div>
        </div>
        <button onClick={syncNow} disabled={syncing} style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 12,
          border: 'none', cursor: syncing ? 'not-allowed' : 'pointer',
          background: syncing ? '#e2e8f0' : '#4f46e5',
          ...pjs(13, 700, '18px', syncing ? '#94a3b8' : '#fff'),
        }}>
          <RefreshCw size={13} style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
          {syncing ? 'Syncing…' : 'Sync Now'}
        </button>
      </div>

      {/* Upcoming alert */}
      {upcoming.length > 0 && upcoming.some(e => {
        const d = parseDate(e.date); if (!d) return false
        return (d.setHours(0,0,0,0) - now) <= 7 * 86400000
      }) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 14, padding: '12px 18px' }}>
          <AlertCircle size={16} color="#d97706" />
          <span style={pjs(13, 600, '18px', '#a16207')}>You have exams within the next 7 days. Good luck! 📝</span>
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8 }}>
        {[
          { key: 'upcoming', label: `Upcoming (${upcoming.length})` },
          { key: 'past',     label: `Past (${past.length})` },
        ].map(t => (
          <button key={t.key} onClick={() => setFilter(t.key)} style={{
            padding: '8px 18px', borderRadius: 10, border: '1.5px solid',
            cursor: 'pointer', fontFamily: "'Plus Jakarta Sans'", fontSize: 13, fontWeight: 600,
            borderColor: filter === t.key ? '#4f46e5' : '#e2e8f0',
            background:  filter === t.key ? '#4f46e5' : '#fff',
            color:       filter === t.key ? '#fff' : '#64748b',
          }}>{t.label}</button>
        ))}
      </div>

      {/* Exam list */}
      {loading ? (
        <div style={{ padding: 60, textAlign: 'center', ...pjs(14, 500, '20px', '#94a3b8') }}>Loading exam schedule…</div>
      ) : !connected ? (
        <div style={{ background: '#fff', borderRadius: 20, border: '1.5px dashed #e2e8f0', padding: '60px 24px', textAlign: 'center' }}>
          <CalendarDays size={40} color="#e2e8f0" style={{ margin: '0 auto 12px', display: 'block' }} />
          <div style={{ ...pjs(15, 600, '20px', '#0f172a'), marginBottom: 8 }}>WebKiosk not connected</div>
          <Link to="/webkiosk" style={{ color: '#4f46e5', textDecoration: 'none', fontWeight: 700, fontSize: 13 }}>Connect WebKiosk →</Link>
        </div>
      ) : shown.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9', padding: '60px 24px', textAlign: 'center' }}>
          <CalendarDays size={40} color="#e2e8f0" style={{ margin: '0 auto 12px', display: 'block' }} />
          <div style={pjs(15, 600, '20px', '#0f172a')}>
            {exams.length === 0
              ? 'No exam schedule found. Sync to load (not all semesters have exam data in WebKiosk).'
              : `No ${filter} exams.`}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {shown.map((e, i) => {
            const ts      = typeStyle[(e.examType || '').toLowerCase()] || typeStyle.default
            const remain  = daysUntil(e.date)
            const urgent  = remain === 'Today!' || remain === 'Tomorrow'
            return (
              <div key={i} style={{
                background: '#fff', borderRadius: 20,
                border: `1px solid ${urgent ? '#fecaca' : '#f1f5f9'}`,
                padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 20,
                boxShadow: urgent ? '0 4px 20px rgba(220,38,38,0.08)' : '0 2px 10px rgba(0,0,0,0.03)',
              }}>
                <ExamDateBlock dateStr={e.date} ts={ts} />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                    {e.courseCode && <span style={{ ...pjs(12, 700, '16px', '#4f46e5'), background: '#eef2ff', padding: '2px 8px', borderRadius: 6 }}>{e.courseCode}</span>}
                    <span style={pjs(15, 700, '20px', '#0f172a')}>{e.courseName || '—'}</span>
                    <span style={{ ...pjs(10, 700, '14px', ts.color), background: ts.bg, padding: '2px 8px', borderRadius: 6 }}>{ts.label}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
                    {e.time && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Clock size={12} color="#94a3b8" />
                        <span style={pjs(12, 500, '16px', '#64748b')}>{e.time}</span>
                      </div>
                    )}
                    {e.venue && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <MapPin size={12} color="#94a3b8" />
                        <span style={pjs(12, 500, '16px', '#64748b')}>{e.venue}</span>
                      </div>
                    )}
                    {e.date && (
                      <span style={pjs(12, 500, '16px', '#94a3b8')}>
                        {parseDate(e.date)?.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }) || e.date}
                      </span>
                    )}
                  </div>
                </div>

                {remain && (
                  <div style={{ flexShrink: 0, textAlign: 'right' }}>
                    <div style={{ ...pjs(14, 800, '18px', urgent ? '#dc2626' : '#4f46e5'), marginBottom: 2 }}>{remain}</div>
                    <div style={pjs(11, 400, '14px', '#94a3b8')}>remaining</div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </PageLayout>
  )
}
