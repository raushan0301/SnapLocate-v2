import { useState, useEffect, useCallback } from 'react'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'
import { CalendarCheck, AlertCircle } from 'lucide-react'

const pjs = (size, weight, lh, color) => ({
  fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: size, fontWeight: weight, lineHeight: lh, color,
})

const statusStyle = {
  present:  { bg: '#f0fdf4', color: '#16a34a', label: 'P' },
  absent:   { bg: '#fee2e2', color: '#dc2626', label: 'A' },
  late:     { bg: '#fef3c7', color: '#d97706', label: 'L' },
  excused:  { bg: '#f0f9ff', color: '#0284c7', label: 'E' },
}

export default function AttendanceView() {
  const [data, setData]     = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  const load = useCallback(async () => {
    try {
      const res = await api.get('/api/attendance/my')
      if (res.success) {
        setData(res.data || [])
        if (res.data?.length > 0) setSelected(0)
      }
    } catch {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const current = selected !== null ? data[selected] : null

  return (
    <PageLayout>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 44, height: 44, borderRadius: 14, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CalendarCheck size={22} color="#16a34a" />
        </div>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#0f172a', margin: 0 }}>Attendance</h1>
          <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>Your attendance records per course.</p>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 60, textAlign: 'center', ...pjs(14, 500, '20px', '#94a3b8') }}>Loading attendance...</div>
      ) : data.length === 0 ? (
        <div style={{ padding: 60, textAlign: 'center' }}>
          <CalendarCheck size={40} color="#e2e8f0" style={{ margin: '0 auto 12px', display: 'block' }} />
          <div style={pjs(15, 600, '20px', '#0f172a')}>No attendance records yet</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20 }}>
          {/* Course list */}
          <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9', overflow: 'hidden', height: 'fit-content' }}>
            {data.map((c, i) => {
              const ok  = c.percentage >= 75
              const active = selected === i
              return (
                <div key={i} onClick={() => setSelected(i)}
                  style={{ padding: '14px 20px', borderBottom: '1px solid #f8fafc', cursor: 'pointer', background: active ? '#f5f3ff' : 'transparent', borderLeft: active ? '3px solid #4f46e5' : '3px solid transparent' }}>
                  <div style={pjs(13, 700, '18px', '#0f172a')}>{c.course?.code}</div>
                  <div style={pjs(11, 400, '14px', '#94a3b8')}>{c.course?.name}</div>
                  <span style={{ ...pjs(11, 700, '14px', ok ? '#16a34a' : '#dc2626'), background: ok ? '#f0fdf4' : '#fee2e2', padding: '2px 8px', borderRadius: 6, marginTop: 4, display: 'inline-block' }}>
                    {c.percentage}%
                  </span>
                </div>
              )
            })}
          </div>

          {/* Detail */}
          {current && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {current.percentage < 75 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 14, padding: '12px 18px' }}>
                  <AlertCircle size={16} color="#ea580c" />
                  <span style={pjs(13, 600, '18px', '#c2410c')}>Below 75% threshold. You need to attend more classes.</span>
                </div>
              )}

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                {[
                  { label: 'Present',  value: current.present,  color: '#16a34a', bg: '#f0fdf4' },
                  { label: 'Absent',   value: current.absent,   color: '#dc2626', bg: '#fee2e2' },
                  { label: 'Late',     value: current.late,     color: '#d97706', bg: '#fef3c7' },
                  { label: 'Total',    value: current.total,    color: '#4f46e5', bg: '#eef2ff' },
                ].map((s, i) => (
                  <div key={i} style={{ background: '#fff', borderRadius: 16, padding: '16px 20px', border: '1px solid #f1f5f9' }}>
                    <div style={pjs(11, 600, '14px', '#64748b')}>{s.label}</div>
                    <div style={{ ...pjs(24, 800, '32px', s.color), marginTop: 4 }}>{s.value}</div>
                  </div>
                ))}
              </div>

              {/* Record list */}
              <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9', overflow: 'hidden' }}>
                <div style={{ padding: '16px 24px', borderBottom: '1px solid #f8fafc', ...pjs(14, 700, '20px', '#0f172a') }}>Attendance Records</div>
                {current.records.length === 0 ? (
                  <div style={{ padding: 40, textAlign: 'center', ...pjs(13, 400, '18px', '#94a3b8') }}>No records</div>
                ) : (
                  <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                    {current.records.map((r, i) => {
                      const ss = statusStyle[r.status] || statusStyle.absent
                      return (
                        <div key={i} style={{ padding: '12px 24px', borderBottom: '1px solid #f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={pjs(13, 600, '18px', '#475569')}>{new Date(r.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                          <span style={{ ...pjs(12, 700, '16px', ss.color), background: ss.bg, padding: '4px 12px', borderRadius: 8 }}>{r.status.charAt(0).toUpperCase() + r.status.slice(1)}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </PageLayout>
  )
}
