import { useState, useEffect, useCallback } from 'react'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'
import { BarChart2, BookOpen } from 'lucide-react'

const EXAM_TYPES = ['mid', 'end', 'internal', 'quiz', 'practical']

const TYPE_CLS = {
  mid:       { bg: 'bg-indigo-50',  text: 'text-brand',      label: 'Mid' },
  end:       { bg: 'bg-amber-50',   text: 'text-amber-600',  label: 'End' },
  internal:  { bg: 'bg-green-50',   text: 'text-green-700',  label: 'Internal' },
  quiz:      { bg: 'bg-fuchsia-50', text: 'text-purple-700', label: 'Quiz' },
  practical: { bg: 'bg-orange-50',  text: 'text-orange-600', label: 'Practical' },
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

  const byCourse = {}
  for (const g of grades) {
    const cid = g.course_id
    if (!byCourse[cid]) byCourse[cid] = { course: g.courses, grades: {} }
    byCourse[cid].grades[g.exam_type] = g
  }
  const courseRows = Object.values(byCourse)

  return (
    <PageLayout>
      <div className="flex items-center gap-4">
        <div className="w-11 h-11 rounded-[14px] bg-green-50 flex items-center justify-center">
          <BarChart2 size={22} color="#16a34a" />
        </div>
        <div>
          <h1 className="text-[26px] font-bold t-primary m-0">Grades</h1>
          <p className="t-base t-muted m-0">Your marks across all courses and exams.</p>
        </div>
      </div>

      <div className="bg-white rounded-[20px] border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.03)] overflow-hidden">
        {loading ? (
          <div className="py-16 text-center t-base font-medium text-slate-400">Loading grades...</div>
        ) : courseRows.length === 0 ? (
          <div className="py-16 px-6 text-center">
            <BarChart2 size={40} className="text-slate-200 mx-auto mb-3 block" />
            <div className="text-[15px] font-semibold leading-5 t-primary">No grades yet</div>
            <div className="text-[13px] font-normal leading-[18px] text-slate-400 mt-1">Faculty will enter marks after exams.</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold leading-[14px] text-slate-500 uppercase tracking-[0.05em] whitespace-nowrap">Course</th>
                  {EXAM_TYPES.map(t => (
                    <th key={t} className="px-4 py-3.5 text-center text-[11px] font-bold leading-[14px] text-slate-500 uppercase tracking-[0.05em] whitespace-nowrap">
                      {TYPE_CLS[t].label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {courseRows.map((row, i) => (
                  <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-[10px] bg-indigo-50 flex items-center justify-center">
                          <BookOpen size={14} color="#4f46e5" />
                        </div>
                        <div>
                          <div className="text-[13px] font-bold leading-[18px] t-primary">{row.course?.code || '—'}</div>
                          <div className="text-[11px] font-normal leading-[14px] text-slate-400">{row.course?.name}</div>
                        </div>
                      </div>
                    </td>
                    {EXAM_TYPES.map(t => {
                      const g = row.grades[t]
                      const ts = TYPE_CLS[t]
                      return (
                        <td key={t} className="px-4 py-3.5 text-center">
                          {g ? (
                            <span className={`text-[13px] font-bold leading-[18px] ${ts.text} ${ts.bg} px-2.5 py-1 rounded-lg inline-block`}>
                              {g.marks}/{g.max_marks}
                            </span>
                          ) : (
                            <span className="text-[13px] font-normal leading-[18px] text-slate-300">—</span>
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
