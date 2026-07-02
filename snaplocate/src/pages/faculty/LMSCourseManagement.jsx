import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'
import { BookOpen, Users, ChevronRight } from 'lucide-react'

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
      <div className="flex items-center gap-4">
        <div className="w-11 h-11 rounded-[14px] bg-indigo-50 flex items-center justify-center">
          <BookOpen size={22} color="#4f46e5" />
        </div>
        <div>
          <h1 className="text-[26px] font-bold t-primary m-0">My Courses</h1>
          <p className="text-[14px] t-muted m-0">Manage assignments, announcements and grades for your courses.</p>
        </div>
      </div>

      {loading ? (
        <div className="py-[60px] text-center text-[14px] t-muted">Loading courses...</div>
      ) : courses.length === 0 ? (
        <div className="bg-white rounded-[20px] border border-slate-100 py-[60px] px-6 text-center">
          <BookOpen size={40} color="#e2e8f0" className="mx-auto mb-3 block" />
          <div className="text-[15px] font-semibold t-primary">No courses assigned</div>
          <div className="text-[13px] t-muted mt-1">Admin will assign courses to you.</div>
        </div>
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {courses.map((c, i) => (
            <Link key={i} to={`/faculty/lms/courses/${c.id}`} className="no-underline">
              <div className="bg-white rounded-[20px] border border-slate-100 px-6 py-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] cursor-pointer hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-[14px] flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)' }}>
                    <BookOpen size={20} color="#fff" />
                  </div>
                  <ChevronRight size={16} color="#cbd5e1" />
                </div>
                <div className="mt-3.5">
                  <div className="text-[16px] font-extrabold t-primary">{c.code}</div>
                  <div className="text-[13px] font-medium t-muted">{c.name}</div>
                </div>
                <div className="flex gap-3 mt-3.5 flex-wrap">
                  <div className="flex items-center gap-1">
                    <Users size={13} color="#94a3b8" />
                    <span className="text-[12px] font-medium t-muted">{c.enrolled_count || 0} students</span>
                  </div>
                  <span className="text-[12px] text-slate-300">·</span>
                  <span className="text-[12px] font-medium t-muted">{c.dept}</span>
                  <span className="text-[12px] text-slate-300">·</span>
                  <span className="text-[12px] font-medium t-muted">Sem {c.semester}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </PageLayout>
  )
}
