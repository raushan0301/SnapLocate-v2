import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'
import { LayoutGrid, CalendarCheck, CreditCard, CalendarDays, User, ChevronRight, AlertCircle } from 'lucide-react'

const pjs = (size, weight, lh, color) => ({
  fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: size, fontWeight: weight, lineHeight: lh, color,
})

export default function WebKioskDashboard() {
  const [attendance, setAttendance] = useState([])
  const [exams, setExams]           = useState([])
  const [fees, setFees]             = useState(null)
  const [profile, setProfile]       = useState(null)
  const [loading, setLoading]       = useState(true)

  const load = useCallback(async () => {
    const [attRes, examRes, feeRes, profRes] = await Promise.allSettled([
      api.get('/api/attendance/my'),
      api.get('/api/exam-schedule'),
      api.get('/api/fees/summary'),
      api.get('/api/student-profiles/me'),
    ])
    if (attRes.status  === 'fulfilled' && attRes.value.success)  setAttendance(attRes.value.data || [])
    if (examRes.status === 'fulfilled' && examRes.value.success) setExams(examRes.value.data?.slice(0, 3) || [])
    if (feeRes.status  === 'fulfilled' && feeRes.value.success)  setFees(feeRes.value.summary || null)
    if (profRes.status === 'fulfilled' && profRes.value.success) setProfile(profRes.value.data || null)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const avgAttendance = attendance.length
    ? (attendance.reduce((s, c) => s + c.percentage, 0) / attendance.length).toFixed(1)
    : null
  const lowAttendance = attendance.filter(c => c.percentage < 75)
  const upcomingExams = exams.filter(e => new Date(e.exam_date) >= Date.now())
  const overdueFeees  = fees?.overdue_count || 0

  const quickLinks = [
    { to: '/webkiosk/attendance', icon: CalendarCheck, color: '#16a34a', bg: '#f0fdf4', label: 'Attendance', sub: attendance.length > 0 ? `${avgAttendance}% avg` : 'View records' },
    { to: '/webkiosk/exams',      icon: CalendarDays,  color: '#4f46e5', bg: '#eef2ff', label: 'Exam Schedule', sub: `${upcomingExams.length} upcoming` },
    { to: '/webkiosk/fees',       icon: CreditCard,    color: '#d97706', bg: '#fef3c7', label: 'Fee Status', sub: overdueFeees > 0 ? `${overdueFeees} overdue` : 'View dues' },
    { to: '/webkiosk/profile',    icon: User,          color: '#7e22ce', bg: '#fdf4ff', label: 'My Profile', sub: profile?.enrollment_no || 'Academic info' },
  ]

  return (
    <PageLayout>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 44, height: 44, borderRadius: 14, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <LayoutGrid size={22} color="#4f46e5" />
        </div>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#0f172a', margin: 0 }}>WebKiosk</h1>
          <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>Your academic records — attendance, exams, fees, and profile.</p>
        </div>
      </div>

      {/* Alerts */}
      {!loading && lowAttendance.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 14, padding: '12px 18px' }}>
          <AlertCircle size={16} color="#ea580c" />
          <span style={pjs(13, 600, '18px', '#c2410c')}>
            Low attendance in {lowAttendance.length} course{lowAttendance.length > 1 ? 's' : ''}: {lowAttendance.map(c => c.course?.code).join(', ')}. Minimum 75% required.
          </span>
        </div>
      )}

      {/* Quick links */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {quickLinks.map((q, i) => {
          const Icon = q.icon
          return (
            <Link key={i} to={q.to} style={{ textDecoration: 'none' }}>
              <div style={{ background: '#fff', borderRadius: 20, padding: '20px 20px', border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', cursor: 'pointer', transition: 'box-shadow 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.03)'}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: q.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                  <Icon size={20} color={q.color} />
                </div>
                <div style={pjs(14, 700, '18px', '#0f172a')}>{q.label}</div>
                <div style={pjs(12, 500, '16px', '#64748b')}>{loading ? '—' : q.sub}</div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Attendance summary */}
      {!loading && attendance.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9', boxShadow: '0 4px 24px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={pjs(15, 700, '20px', '#0f172a')}>Attendance Summary</span>
            <Link to="/webkiosk/attendance" style={{ fontSize: 13, color: '#4f46e5', fontWeight: 600, textDecoration: 'none' }}>View all</Link>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Course', 'Present', 'Absent', 'Percentage'].map(h => (
                    <th key={h} style={{ padding: '11px 20px', textAlign: 'left', ...pjs(11, 700, '14px', '#64748b'), textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {attendance.map((c, i) => {
                  const ok = c.percentage >= 75
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid #f8fafc' }}>
                      <td style={{ padding: '12px 20px', ...pjs(13, 700, '18px', '#0f172a') }}>{c.course?.code} <span style={pjs(12, 400, '16px', '#64748b')}>{c.course?.name}</span></td>
                      <td style={{ padding: '12px 20px', ...pjs(13, 600, '18px', '#16a34a') }}>{c.present}</td>
                      <td style={{ padding: '12px 20px', ...pjs(13, 600, '18px', '#dc2626') }}>{c.absent}</td>
                      <td style={{ padding: '12px 20px' }}>
                        <span style={{ ...pjs(12, 700, '16px', ok ? '#16a34a' : '#dc2626'), background: ok ? '#f0fdf4' : '#fee2e2', padding: '4px 10px', borderRadius: 8 }}>
                          {c.percentage}%
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </PageLayout>
  )
}
