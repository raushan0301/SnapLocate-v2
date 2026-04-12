import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'
import { BookOpen, Users, ClipboardList, ChevronRight } from 'lucide-react'

const pjs = (size, weight, lh, color) => ({
  fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: size, fontWeight: weight, lineHeight: lh, color,
})

export default function LMSCourseManagement() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const res = await api.get('/api/lms/courses')
      if (res.success) setCourses(res.data || [])
    } catch {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <PageLayout>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 44, height: 44, borderRadius: 14, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <BookOpen size={22} color="#4f46e5" />
        </div>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#0f172a', margin: 0 }}>My Courses</h1>
          <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>Manage assignments, announcements and grades for your courses.</p>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 60, textAlign: 'center', ...pjs(14, 500, '20px', '#94a3b8') }}>Loading courses...</div>
      ) : courses.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9', padding: '60px 24px', textAlign: 'center' }}>
          <BookOpen size={40} color="#e2e8f0" style={{ margin: '0 auto 12px', display: 'block' }} />
          <div style={pjs(15, 600, '20px', '#0f172a')}>No courses assigned</div>
          <div style={{ ...pjs(13, 400, '18px', '#94a3b8'), marginTop: 4 }}>Admin will assign courses to you.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {courses.map((c, i) => (
            <Link key={i} to={`/faculty/lms/courses/${c.id}`} style={{ textDecoration: 'none' }}>
              <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9', padding: '20px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', cursor: 'pointer', transition: 'box-shadow 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.03)'}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg, #6366f1, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <BookOpen size={20} color="#fff" />
                  </div>
                  <ChevronRight size={16} color="#cbd5e1" />
                </div>
                <div style={{ marginTop: 14 }}>
                  <div style={pjs(16, 800, '20px', '#0f172a')}>{c.code}</div>
                  <div style={pjs(13, 500, '18px', '#64748b')}>{c.name}</div>
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Users size={13} color="#94a3b8" />
                    <span style={pjs(12, 500, '16px', '#64748b')}>{c.enrolled_count || 0} students</span>
                  </div>
                  <span style={pjs(12, 400, '16px', '#94a3b8')}>·</span>
                  <span style={pjs(12, 500, '16px', '#64748b')}>{c.dept}</span>
                  <span style={pjs(12, 400, '16px', '#94a3b8')}>·</span>
                  <span style={pjs(12, 500, '16px', '#64748b')}>Sem {c.semester}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </PageLayout>
  )
}
