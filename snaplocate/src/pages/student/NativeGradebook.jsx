import { useState, useEffect } from 'react'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'
import { BarChart2, Award, BookOpen, ChevronDown } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

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
    <div className="relative h-1.5 bg-slate-100 rounded-full overflow-hidden my-1.5">
      <div className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-500" style={{ width: `${pct}%`, background: color || '#4f46e5' }} />
    </div>
  )
}

function CourseCard({ courseData }) {
  const [open, setOpen] = useState(false)
  const { course, section_name, components, final_percentage } = courseData
  const grade      = getGrade(final_percentage)
  const hasAnyMark = components.some(c => c.marks_obtained != null)

  return (
    <div className={`bg-white rounded-[20px] border-[1.5px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden transition-colors ${open ? 'border-indigo-200' : 'border-slate-100'}`}>
      <div onClick={() => setOpen(o => !o)} className="px-5 py-[18px] cursor-pointer flex items-center gap-3.5">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br from-indigo-50 to-indigo-100">
          <BookOpen size={20} className="text-brand" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="t-base font-bold t-primary truncate">{course.title}</div>
          <div className="text-[11px] font-medium t-subtle mt-0.5">{course.code} · Section {section_name} · Sem {course.semester}</div>
        </div>
        {grade && hasAnyMark ? (
          <div className="flex flex-col items-center gap-0.5">
            <div className="text-[22px] font-extrabold leading-none" style={{ color: grade.color }}>{grade.grade}</div>
            <div className="text-[10px] font-semibold t-subtle">{final_percentage}%</div>
          </div>
        ) : (
          <div className="t-md font-medium t-subtle">—</div>
        )}
        <ChevronDown size={15} className={`text-slate-400 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </div>

      {open && (
        <div className="px-5 pb-5 border-t border-slate-50">
          <div className="grid gap-2.5 mt-4" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))' }}>
            {components.map(comp => {
              const pct = comp.percentage
              const g   = getGrade(pct)
              const isInternal = comp.type === 'internal'
              return (
                <div key={comp.id} className="bg-surface rounded-2xl px-4 py-3.5 border border-slate-100">
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="text-[11px] font-bold t-subtle uppercase tracking-[0.06em]">{comp.name}</div>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md border ${isInternal ? 'text-brand bg-brand-light border-brand-border' : 'text-amber-600 bg-amber-50 border-amber-200'}`}>
                      {comp.type}
                    </span>
                  </div>
                  {comp.marks_obtained != null ? (
                    <>
                      <div className="flex items-baseline gap-1 mt-2">
                        <span className="text-[22px] font-extrabold tabular-nums" style={{ color: g?.color || '#0f172a' }}>{comp.marks_obtained}</span>
                        <span className="text-[13px] t-subtle">/ {comp.max_marks}</span>
                      </div>
                      <ScoreBar obtained={comp.marks_obtained} max={comp.max_marks} color={g?.color} />
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold t-subtle">{pct}%</span>
                        {g && <span className="text-[12px] font-bold" style={{ color: g.color }}>{g.grade}</span>}
                      </div>
                      {comp.weightage_percent && (
                        <div className="text-[10px] t-subtle mt-1">Weight: {comp.weightage_percent}%</div>
                      )}
                    </>
                  ) : (
                    <div className="t-md t-subtle mt-2.5">Not graded yet</div>
                  )}
                </div>
              )
            })}
          </div>

          {hasAnyMark && (
            <div className="mt-3.5 rounded-2xl px-4 sm:px-5 py-3.5 flex items-center justify-between bg-gradient-to-br from-indigo-50 to-indigo-100">
              <div>
                <div className="text-[12px] font-semibold text-brand">Weighted Score</div>
                <div className="text-[11px] text-indigo-400 mt-0.5">Based on components with weightage</div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-[28px] font-extrabold text-brand tabular-nums">{final_percentage ?? '—'}%</div>
                {grade && (
                  <div className="text-center">
                    <div className="text-[28px] font-extrabold" style={{ color: grade.color }}>{grade.grade}</div>
                    <div className="text-[11px] font-semibold t-subtle">{grade.points}/10</div>
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

  const gradedCourses = courses.filter(c => c.final_percentage != null)
  const sgpa = gradedCourses.length > 0
    ? (gradedCourses.reduce((s, c) => s + (getGrade(c.final_percentage)?.points || 0), 0) / gradedCourses.length).toFixed(2)
    : null

  const STATS = [
    { label: 'Enrolled Courses',  val: courses.length,                                         cls: 'bg-brand-light',   valCls: 'text-brand'     },
    { label: 'Graded Courses',    val: gradedCourses.length,                                   cls: 'bg-green-50',      valCls: 'text-green-600' },
    { label: 'Est. SGPA',         val: sgpa ?? '—',                                            cls: 'bg-amber-50',      valCls: 'text-amber-600' },
    { label: 'Components Total',  val: courses.reduce((s, c) => s + c.components.length, 0),   cls: 'bg-sky-50',        valCls: 'text-sky-600'   },
  ]

  return (
    <PageLayout>
      <div className="flex items-start gap-3.5 mb-6">
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 bg-amber-50">
          <Award size={22} className="text-amber-600" />
        </div>
        <div>
          <h1 className="t-heading-xl t-primary m-0 tracking-tight">Native Gradebook</h1>
          <p className="t-md t-muted mt-1 m-0">Thapar 10-point grading scale · Internal &amp; External components</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {STATS.map(({ label, val, cls, valCls }) => (
          <div key={label} className={`${cls} rounded-2xl px-4 sm:px-5 py-3.5`}>
            <div className={`text-[26px] font-extrabold tabular-nums ${valCls}`}>{val}</div>
            <div className="text-[11px] font-medium t-subtle mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[18px] border border-slate-100 px-5 py-4">
        <div className="text-[11px] font-bold t-subtle uppercase tracking-[0.08em] mb-3">Thapar Grade Scale</div>
        <div className="flex gap-1.5 flex-wrap">
          {GRADE_SCALE.map(g => (
            <div key={g.grade} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface border border-slate-100">
              <span className="text-[13px] font-extrabold" style={{ color: g.color }}>{g.grade}</span>
              <span className="text-[11px] t-subtle">{g.points}/10</span>
              <span className="text-[10px] text-slate-300">≥{g.min}%</span>
            </div>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center t-base t-subtle">Loading gradebook…</div>
      ) : courses.length === 0 ? (
        <div className="bg-white rounded-[20px] border-[1.5px] border-dashed border-slate-200 py-16 px-6 text-center">
          <BarChart2 size={40} className="text-slate-200 mx-auto mb-3" />
          <div className="t-base font-semibold t-primary">No graded courses yet</div>
          <div className="t-md t-subtle mt-1">Marks will appear here once your faculty posts grades.</div>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {courses.map(c => <CourseCard key={c.course.id} courseData={c} />)}
        </div>
      )}
    </PageLayout>
  )
}
