import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'
import { CalendarCheck, AlertCircle, RefreshCw, ArrowLeft, TrendingDown, TrendingUp, Minus } from 'lucide-react'

const pjs = (s, w, lh, c) => ({ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: s, fontWeight: w, lineHeight: lh, color: c })

function AttendanceBar({ pct }) {
  const good    = pct >= 75
  const warn    = pct >= 60 && pct < 75
  const color   = good ? '#16a34a' : warn ? '#d97706' : '#dc2626'
  const fill    = good ? 'linear-gradient(90deg,#16a34a,#22c55e)' : warn ? 'linear-gradient(90deg,#d97706,#f59e0b)' : 'linear-gradient(90deg,#dc2626,#f87171)'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ flex: 1, height: 7, borderRadius: 6, background: '#f1f5f9', overflow: 'hidden' }}>
        <div style={{ width: `${Math.min(100, pct)}%`, height: '100%', borderRadius: 6, background: fill, transition: 'width 0.8s ease' }} />
      </div>
      <span style={{
        ...pjs(11, 700, '14px', color), minWidth: 44, textAlign: 'center',
        background: good ? '#f0fdf4' : warn ? '#fffbeb' : '#fef2f2',
        border: `1px solid ${color}30`, padding: '2px 8px', borderRadius: 6,
      }}>{pct.toFixed(1)}%</span>
    </div>
  )
}

export default function AttendanceView() {
  const [attendance, setAttendance] = useState([])
  const [loading, setLoading]       = useState(true)
  const [syncing, setSyncing]       = useState(false)
  const [status, setStatus]         = useState('')
  const [lastSync, setLastSync]     = useState('')
  const [connected, setConnected]   = useState(true)
  const [filter, setFilter]         = useState('all')  // all | low | good

  const load = useCallback(async () => {
    try {
      const res = await api.get('/api/webkiosk/attendance')
      if (res.success) {
        setAttendance(res.data || [])
        setStatus(res.syncStatus || '')
        setLastSync(res.lastSyncedAt || '')
      }
    } catch { setConnected(false) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const syncNow = async () => {
    setSyncing(true)
    try { await api.post('/api/webkiosk/sync', {}) } catch {}
    // Poll until done
    for (let i = 0; i < 40; i++) {
      await new Promise(r => setTimeout(r, 3000))
      const r = await api.get('/api/webkiosk/attendance').catch(() => null)
      if (r?.syncStatus && r.syncStatus !== 'pending' && r.syncStatus !== 'running') {
        setAttendance(r.data || [])
        setStatus(r.syncStatus)
        setLastSync(r.lastSyncedAt || '')
        break
      }
    }
    setSyncing(false)
  }

  const filtered = attendance.filter(c => {
    if (filter === 'low')  return c.percentage < 75
    if (filter === 'good') return c.percentage >= 75
    return true
  })

  const avg      = attendance.length ? attendance.reduce((s, c) => s + c.percentage, 0) / attendance.length : 0
  const lowCount = attendance.filter(c => c.percentage < 75).length
  const goodCount = attendance.filter(c => c.percentage >= 75).length

  return (
    <PageLayout>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link to="/webkiosk" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', textDecoration: 'none', ...pjs(13, 600, '18px', '#64748b') }}>
            <ArrowLeft size={14} /> WebKiosk
          </Link>
          <div>
            <h1 style={{ ...pjs(26, 800, '32px', '#0f172a'), margin: 0 }}>Attendance</h1>
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

      {/* Stats */}
      {attendance.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14 }}>
          {[
            { label: 'Average',       value: `${avg.toFixed(1)}%`,   color: avg >= 75 ? '#16a34a' : '#dc2626', bg: avg >= 75 ? '#f0fdf4' : '#fef2f2' },
            { label: 'Above 75%',     value: goodCount,               color: '#16a34a', bg: '#f0fdf4' },
            { label: 'Below 75%',     value: lowCount,                color: lowCount > 0 ? '#dc2626' : '#16a34a', bg: lowCount > 0 ? '#fef2f2' : '#f0fdf4' },
            { label: 'Total Subjects',value: attendance.length,       color: '#4f46e5', bg: '#eef2ff' },
          ].map((s, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 16, padding: '18px 20px', border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <div style={pjs(11, 600, '14px', '#64748b')}>{s.label.toUpperCase()}</div>
              <div style={{ ...pjs(28, 800, '34px', s.color), marginTop: 4 }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Low attendance alert */}
      {lowCount > 0 && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 14, padding: '14px 18px' }}>
          <AlertCircle size={18} color="#ea580c" style={{ marginTop: 1, flexShrink: 0 }} />
          <div>
            <div style={{ ...pjs(14, 700, '20px', '#c2410c'), marginBottom: 4 }}>Attendance Warning</div>
            <div style={pjs(13, 500, '18px', '#c2410c')}>
              {lowCount} subject{lowCount > 1 ? 's' : ''} below 75% threshold. Minimum attendance required for exams!
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      {attendance.length > 0 && (
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { key: 'all',  label: `All (${attendance.length})` },
            { key: 'good', label: `✓ ≥75% (${goodCount})` },
            { key: 'low',  label: `⚠ <75% (${lowCount})` },
          ].map(t => (
            <button key={t.key} onClick={() => setFilter(t.key)} style={{
              padding: '8px 16px', borderRadius: 10, border: '1.5px solid',
              cursor: 'pointer', fontFamily: "'Plus Jakarta Sans'", fontSize: 13, fontWeight: 600,
              borderColor: filter === t.key ? '#4f46e5' : '#e2e8f0',
              background:  filter === t.key ? '#4f46e5' : '#fff',
              color:       filter === t.key ? '#fff' : '#64748b',
            }}>{t.label}</button>
          ))}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div style={{ padding: 60, textAlign: 'center', ...pjs(14, 500, '20px', '#94a3b8') }}>
          Loading attendance…
        </div>
      ) : !connected ? (
        <div style={{ background: '#fff', borderRadius: 20, border: '1.5px dashed #e2e8f0', padding: '60px 24px', textAlign: 'center' }}>
          <CalendarCheck size={40} color="#e2e8f0" style={{ margin: '0 auto 12px', display: 'block' }} />
          <div style={pjs(15, 700, '20px', '#0f172a')}>WebKiosk not connected</div>
          <div style={{ ...pjs(13, 400, '18px', '#64748b'), marginTop: 6 }}>
            <Link to="/webkiosk" style={{ color: '#4f46e5', textDecoration: 'none', fontWeight: 700 }}>Connect WebKiosk</Link> to see your attendance.
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9', padding: '60px 24px', textAlign: 'center' }}>
          <CalendarCheck size={40} color="#e2e8f0" style={{ margin: '0 auto 12px', display: 'block' }} />
          <div style={pjs(15, 600, '20px', '#0f172a')}>
            {attendance.length === 0 ? 'No attendance data yet — sync to load.' : 'No subjects in this filter.'}
          </div>
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
          {/* Table header */}
          <div style={{ padding: '14px 24px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9', display: 'grid', gridTemplateColumns: '50px 120px 1fr 1fr 120px 80px 80px 80px', gap: 16, alignItems: 'center' }}>
            {['S.No', 'Code', 'Subject Name', 'Attendance', 'Progress', 'Present', 'Absent', 'Total'].map(h => (
              <div key={h} style={{ ...pjs(11, 700, '14px', '#64748b'), textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
            ))}
          </div>

          {filtered.map((c, i) => {
            const good = c.percentage >= 75
            const warn = c.percentage >= 60 && c.percentage < 75
            const color = good ? '#16a34a' : warn ? '#d97706' : '#dc2626'
            return (
              <div key={i} style={{
                padding: '16px 24px', borderBottom: '1px solid #f8fafc',
                display: 'grid', gridTemplateColumns: '50px 120px 1fr 1fr 120px 80px 80px 80px',
                gap: 16, alignItems: 'center',
                transition: 'background 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <span style={pjs(13, 500, '18px', '#94a3b8')}>{c.sno || i + 1}</span>
                <span style={{ ...pjs(12, 700, '16px', '#4f46e5'), background: '#eef2ff', padding: '3px 8px', borderRadius: 6 }}>{c.courseCode}</span>
                <span style={pjs(13, 600, '18px', '#0f172a')}>{c.courseName}</span>
                <span style={{ ...pjs(15, 800, '20px', color), display: 'flex', alignItems: 'center', gap: 6 }}>
                  {good ? <TrendingUp size={14} /> : warn ? <Minus size={14} /> : <TrendingDown size={14} />}
                  {c.percentage.toFixed(1)}%
                </span>
                <AttendanceBar pct={c.percentage} />
                <span style={{ ...pjs(14, 700, '18px', '#16a34a'), textAlign: 'center' }}>{c.present}</span>
                <span style={{ ...pjs(14, 700, '18px', '#dc2626'), textAlign: 'center' }}>{c.absent}</span>
                <span style={{ ...pjs(14, 700, '18px', '#64748b'), textAlign: 'center' }}>{c.total}</span>
              </div>
            )
          })}
        </div>
      )}

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </PageLayout>
  )
}
