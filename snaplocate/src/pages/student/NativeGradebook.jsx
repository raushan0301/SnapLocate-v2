import { useState, useEffect } from 'react'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'
import { BarChart2, TrendingUp, Award, BookOpen, ChevronDown } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const pjs = (sz, fw, lh, col) => ({
  fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: sz, fontWeight: fw, lineHeight: lh, color: col
})

// Thapar 10-pt grading scale
const GRADE_SCALE = [
  { min: 90, grade: 'A+', points: 10, color: '#16a34a' },
  { min: 80, grade: 'A',  points: 9,  color: '#22c55e' },
  { min: 70, grade: 'B+', points: 8,  color: '#84cc16' },
  { min: 60, grade: 'B',  points: 7,  color: '#eab308' },
  { min: 50, grade: 'C+', points: 6,  color: '#f97316' },
  { min: 40, grade: 'C',  points: 5,  color: '#f97316' },
  { min: 35, grade: 'D',  points: 4,  color: '#ef4444' },
  { min: 0,  grade: 'F',  points: 0,  color: '#dc2626' },
]

function getGrade(pct) {
  if (pct == null) return null
  return GRADE_SCALE.find(g => pct >= g.min) || GRADE_SCALE[GRADE_SCALE.length - 1]
}

function ScoreBar({ obtained, max, color }) {
  const pct = max > 0 ? Math.min(100, Math.round((obtained / max) * 100)) : 0
  return (
    <div style={{ position: 'relative', height: 6, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden', margin: '6px 0 2px' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${pct}%`, background: color || '#4f46e5', borderRadius: 4, transition: 'width 0.6s ease' }} />
    </div>
  )
}

function CourseCard({ courseData }) {
  const [open, setOpen] = useState(false)
  const { course, section_name, components, final_percentage } = courseData
  const grade = getGrade(final_percentage)
  const hasAnyMark = components.some(c => c.marks_obtained != null)

  return (
    <div style={{ background: '#fff', borderRadius: 20, border: `1.5px solid ${open ? '#c7d2fe' : '#f1f5f9'}`, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', overflow: 'hidden', transition: 'border-color 0.2s' }}>
      {/* Header row */}
      <div onClick={() => setOpen(o => !o)} style={{ padding: '18px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#eef2ff,#e0e7ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <BookOpen size={20} color="#4f46e5" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ ...pjs(14, 700, '20px', '#0f172a'), whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {course.title}
          </div>
          <div style={{ ...pjs(11, 500, '14px', '#94a3b8'), marginTop: 2 }}>
            {course.code} · Section {section_name} · Sem {course.semester}
          </div>
        </div>

        {/* Grade badge */}
        {grade && hasAnyMark ? (
          <div style={{ display: 'flex', flex: 0, flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: grade.color, fontFamily: "'Plus Jakarta Sans',sans-serif", lineHeight: 1 }}>{grade.grade}</div>
            <div style={{ ...pjs(10, 600, '12px', '#94a3b8') }}>{final_percentage}%</div>
          </div>
        ) : (
          <div style={{ ...pjs(12, 500, '16px', '#94a3b8') }}>—</div>
        )}
        <ChevronDown size={15} color="#94a3b8" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
      </div>

      {/* Expanded: component breakdown */}
      {open && (
        <div style={{ padding: '0 20px 20px', borderTop: '1px solid #f8fafc' }}>
          {/* Component grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 10, marginTop: 16 }}>
            {components.map(comp => {
              const pct = comp.percentage
              const g = getGrade(pct)
              return (
                <div key={comp.id} style={{ background: '#f8fafc', borderRadius: 14, padding: '14px 16px', border: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ ...pjs(11, 700, '14px', '#94a3b8'), textTransform: 'uppercase', letterSpacing: '0.06em' }}>{comp.name}</div>
                    <span style={{ ...pjs(10, 600, '12px', comp.type === 'internal' ? '#4f46e5' : '#d97706'), background: comp.type === 'internal' ? '#eef2ff' : '#fffbeb', border: `1px solid ${comp.type === 'internal' ? '#c7d2fe' : '#fde68a'}`, padding: '2px 7px', borderRadius: 5 }}>
                      {comp.type}
                    </span>
                  </div>
                  {comp.marks_obtained != null ? (
                    <>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 8 }}>
                        <span style={{ ...pjs(22, 800, '26px', g?.color || '#0f172a'), fontVariantNumeric: 'tabular-nums' }}>{comp.marks_obtained}</span>
                        <span style={{ ...pjs(13, 400, '18px', '#94a3b8') }}>/ {comp.max_marks}</span>
                      </div>
                      <ScoreBar obtained={comp.marks_obtained} max={comp.max_marks} color={g?.color} />
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ ...pjs(11, 600, '14px', '#94a3b8') }}>{pct}%</span>
                        {g && <span style={{ ...pjs(12, 700, '14px', g.color) }}>{g.grade}</span>}
                      </div>
                      {comp.weightage_percent && (
                        <div style={{ ...pjs(10, 400, '14px', '#94a3b8'), marginTop: 4 }}>Weight: {comp.weightage_percent}%</div>
                      )}
                    </>
                  ) : (
                    <div style={{ ...pjs(13, 400, '18px', '#94a3b8'), marginTop: 10 }}>Not graded yet</div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Weighted total footer */}
          {hasAnyMark && (
            <div style={{ marginTop: 14, background: 'linear-gradient(135deg,#eef2ff,#e0e7ff)', borderRadius: 14, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={pjs(12, 600, '16px', '#4f46e5')}>Weighted Score</div>
                <div style={{ ...pjs(11, 400, '14px', '#6366f1'), marginTop: 2 }}>Based on components with weightage</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ ...pjs(28, 800, '32px', '#4f46e5'), fontVariantNumeric: 'tabular-nums' }}>{final_percentage ?? '—'}%</div>
                </div>
                {grade && (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ ...pjs(28, 800, '32px', grade.color) }}>{grade.grade}</div>
                    <div style={{ ...pjs(11, 600, '14px', '#94a3b8') }}>{grade.points}/10</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function NativeGradebook() {
  const { user } = useAuth()
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return
    api.get(`/api/lms/native/gradebook/student/${user.id}/summary`)
      .then(res => { if (res.success) setCourses(res.data || []) })
      .finally(() => setLoading(false))
  }, [user?.id])

  // Estimated SGPA
  const gradedCourses = courses.filter(c => c.final_percentage != null)
  const sgpa = gradedCourses.length > 0
    ? (gradedCourses.reduce((s, c) => s + (getGrade(c.final_percentage)?.points || 0), 0) / gradedCourses.length).toFixed(2)
    : null

  const stats = [
    { label: 'Enrolled Courses', val: courses.length, color: '#4f46e5', bg: '#eef2ff' },
    { label: 'Graded Courses',   val: gradedCourses.length, color: '#16a34a', bg: '#f0fdf4' },
    { label: 'Est. SGPA',        val: sgpa ?? '—', color: '#d97706', bg: '#fffbeb' },
    { label: 'Components Total', val: courses.reduce((s, c) => s + c.components.length, 0), color: '#0284c7', bg: '#f0f9ff' },
  ]

  return (
    <PageLayout>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <div style={{ width: 46, height: 46, borderRadius: 14, background: 'linear-gradient(135deg,#fffbeb,#fef3c7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Award size={22} color="#d97706" />
        </div>
        <div>
          <h1 style={{ ...pjs(26, 800, '32px', '#0f172a'), margin: 0, letterSpacing: '-0.02em' }}>Native Gradebook</h1>
          <p style={{ ...pjs(13, 400, '18px', '#64748b'), margin: '4px 0 0' }}>Thapar 10-point grading scale · Internal & External components</p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
        {stats.map(({ label, val, color, bg }) => (
          <div key={label} style={{ background: bg, borderRadius: 16, padding: '14px 18px' }}>
            <div style={{ ...pjs(26, 800, '30px', color), fontVariantNumeric: 'tabular-nums' }}>{val}</div>
            <div style={{ ...pjs(11, 500, '14px', '#94a3b8'), marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Thapar grade scale legend */}
      <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #f1f5f9', padding: '16px 20px' }}>
        <div style={{ ...pjs(11, 700, '14px', '#94a3b8'), letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>Thapar Grade Scale</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {GRADE_SCALE.map(g => (
            <div key={g.grade} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 8, background: '#f8fafc', border: '1px solid #f1f5f9' }}>
              <span style={{ ...pjs(13, 800, '16px', g.color) }}>{g.grade}</span>
              <span style={{ ...pjs(11, 400, '14px', '#94a3b8') }}>{g.points}/10</span>
              <span style={{ ...pjs(10, 400, '12px', '#cbd5e1') }}>≥{g.min}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Course cards */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, ...pjs(14, 400, '20px', '#94a3b8') }}>Loading gradebook...</div>
      ) : courses.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 20, border: '1.5px dashed #e2e8f0', padding: '60px 24px', textAlign: 'center' }}>
          <BarChart2 size={40} color="#e2e8f0" style={{ margin: '0 auto 12px', display: 'block' }} />
          <div style={pjs(15, 600, '20px', '#0f172a')}>No graded courses yet</div>
          <div style={{ ...pjs(13, 400, '18px', '#94a3b8'), marginTop: 4 }}>Marks will appear here once your faculty posts grades.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {courses.map(c => <CourseCard key={c.course.id} courseData={c} />)}
        </div>
      )}
    </PageLayout>
  )
}
