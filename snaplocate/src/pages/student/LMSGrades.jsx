import { useState, useEffect, useCallback } from 'react'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'
import { BarChart2, BookOpen } from 'lucide-react'

const pjs = (size, weight, lh, color) => ({
  fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: size, fontWeight: weight, lineHeight: lh, color,
})

const EXAM_TYPES = ['mid', 'end', 'internal', 'quiz', 'practical']

const typeStyle = {
  mid:       { bg: '#eef2ff', color: '#4f46e5', label: 'Mid' },
  end:       { bg: '#fef3c7', color: '#d97706', label: 'End' },
  internal:  { bg: '#f0fdf4', color: '#16a34a', label: 'Internal' },
  quiz:      { bg: '#fdf4ff', color: '#7e22ce', label: 'Quiz' },
  practical: { bg: '#fff7ed', color: '#ea580c', label: 'Practical' },
}

export default function LMSGrades() {
  const [grades, setGrades]   = useState([])
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const [gRes, cRes] = await Promise.allSettled([
        api.get('/api/lms/grades'),
        api.get('/api/lms/courses'),
      ])
      if (gRes.status === 'fulfilled' && gRes.value.success) setGrades(gRes.value.data || [])
      if (cRes.status === 'fulfilled' && cRes.value.success) setCourses(cRes.value.data || [])
    } catch {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  // Group grades by course
  const byCourse = {}
  for (const g of grades) {
    const cid = g.course_id
    if (!byCourse[cid]) byCourse[cid] = { course: g.courses, grades: {} }
    byCourse[cid].grades[g.exam_type] = g
  }

  const courseRows = Object.values(byCourse)

  return (
    <PageLayout>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 44, height: 44, borderRadius: 14, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <BarChart2 size={22} color="#16a34a" />
        </div>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#0f172a', margin: 0 }}>Grades</h1>
          <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>Your marks across all courses and exams.</p>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9', boxShadow: '0 4px 24px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', ...pjs(14, 500, '20px', '#94a3b8') }}>Loading grades...</div>
        ) : courseRows.length === 0 ? (
          <div style={{ padding: '60px 24px', textAlign: 'center' }}>
            <BarChart2 size={40} color="#e2e8f0" style={{ margin: '0 auto 12px', display: 'block' }} />
            <div style={pjs(15, 600, '20px', '#0f172a')}>No grades yet</div>
            <div style={{ ...pjs(13, 400, '18px', '#94a3b8'), marginTop: 4 }}>Faculty will enter marks after exams.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '13px 20px', textAlign: 'left', ...pjs(11, 700, '14px', '#64748b'), textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Course</th>
                  {EXAM_TYPES.map(t => (
                    <th key={t} style={{ padding: '13px 16px', textAlign: 'center', ...pjs(11, 700, '14px', '#64748b'), textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                      {typeStyle[t].label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {courseRows.map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f8fafc' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 10, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <BookOpen size={14} color="#4f46e5" />
                        </div>
                        <div>
                          <div style={pjs(13, 700, '18px', '#0f172a')}>{row.course?.code || '—'}</div>
                          <div style={pjs(11, 400, '14px', '#94a3b8')}>{row.course?.name}</div>
                        </div>
                      </div>
                    </td>
                    {EXAM_TYPES.map(t => {
                      const g = row.grades[t]
                      const ts = typeStyle[t]
                      return (
                        <td key={t} style={{ padding: '14px 16px', textAlign: 'center' }}>
                          {g ? (
                            <span style={{ ...pjs(13, 700, '18px', ts.color), background: ts.bg, padding: '4px 10px', borderRadius: 8, display: 'inline-block' }}>
                              {g.marks}/{g.max_marks}
                            </span>
                          ) : (
                            <span style={pjs(13, 400, '18px', '#cbd5e1')}>—</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageLayout>
  )
}
