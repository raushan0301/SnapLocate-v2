import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'
import { ShieldAlert, CheckCircle, AlertTriangle, BookOpen, Calculator } from 'lucide-react'

function statusOf(pct) {
  if (pct >= 75) return { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', hex: '#16a34a', label: 'Safe' }
  if (pct >= 65) return { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-600', hex: '#d97706', label: 'Warning' }
  return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-600', hex: '#dc2626', label: 'Detained Risk' }
}

function AttendanceMeter({ pct }) {
  const s = statusOf(pct)
  const safe = pct >= 75
  const warn = pct >= 65 && pct < 75
  return (
    <div className={`${s.bg} border-[1.5px] ${s.border} rounded-2xl px-5 py-4`}>
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          {safe ? <CheckCircle size={16} color={s.hex} /> : warn ? <AlertTriangle size={16} color={s.hex} /> : <ShieldAlert size={16} color={s.hex} />}
          <span className={`text-[13px] font-bold leading-[18px] ${s.text}`}>{s.label}</span>
        </div>
        <span className={`text-[26px] font-extrabold leading-[30px] tabular-nums ${s.text}`}>{pct ?? '—'}%</span>
      </div>
      <div className="h-2 bg-black/[0.08] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-[width] duration-[0.8s] ease-out"
          style={{ width: `${Math.min(100, pct || 0)}%`, background: `linear-gradient(90deg, ${s.hex}aa, ${s.hex})` }} />
      </div>
      <div className="flex justify-between mt-2">
        <span className="text-[11px] font-normal leading-[14px] text-slate-400">0%</span>
        <span className="text-[11px] font-bold leading-[14px] text-amber-500 relative">75% ▼</span>
        <span className="text-[11px] font-normal leading-[14px] text-slate-400">100%</span>
      </div>
    </div>
  )
}

const STATS_ROW = [
  { label: 'Attended',      key: 'attended',        bg: 'bg-green-50',   text: 'text-green-700' },
  { label: 'Absent',        key: 'absent',           bg: 'bg-red-50',     text: 'text-red-600'   },
  { label: 'Total Classes', key: 'total_conducted',  bg: 'bg-indigo-50',  text: 'text-brand'     },
]

function CourseAttendanceCard({ item }) {
  const { course, section_name, percentage, total_conducted, attended, absent, can_miss_more, at_risk_status } = item
  const pct = percentage
  const s = statusOf(pct)
  const [showCalc, setShowCalc] = useState(false)
  const [extra, setExtra] = useState(0)

  const futureTotal   = total_conducted + extra
  const futureAttended = attended + extra
  const futurePct     = futureTotal > 0 ? Math.round((futureAttended / futureTotal) * 100) : pct
  const toSafe        = Math.max(0, Math.ceil(total_conducted * 0.75) - attended)
  const futureIsSafe  = futurePct >= 75

  return (
    <div className="bg-white rounded-[20px] border-[1.5px] border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden">
      {/* Color top bar */}
      <div className="h-1" style={{ background: `linear-gradient(90deg, ${s.hex}88, ${s.hex})` }} />
      <div className="px-5 py-[18px]">
        <div className="flex items-start justify-between mb-3.5">
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-bold leading-[14px] text-slate-400 uppercase tracking-[0.08em] mb-1">
              {course?.branch} · Sem {course?.semester}
            </div>
            <div className="text-[15px] font-bold leading-5 t-primary mb-0.5">{course?.title || course?.code}</div>
            <div className="text-[12px] font-normal leading-4 text-slate-500">Section {section_name} · {course?.code}</div>
          </div>
          <div className={`text-[28px] font-extrabold leading-8 shrink-0 tabular-nums ${s.text}`}>{pct ?? '—'}%</div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-3">
          <div className="h-full rounded-full transition-[width] duration-[0.8s] ease-out"
            style={{ width: `${Math.min(100, pct || 0)}%`, background: `linear-gradient(90deg, ${s.hex}88, ${s.hex})` }} />
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mb-3.5">
          {STATS_ROW.map(({ label, key, bg, text }) => (
            <div key={label} className={`${bg} rounded-[10px] px-2.5 py-2 text-center`}>
              <div className={`text-[18px] font-extrabold leading-[22px] ${text}`}>{item[key]}</div>
              <div className="text-[10px] font-medium leading-[14px] text-slate-400">{label}</div>
            </div>
          ))}
        </div>

        {/* Can miss indicator */}
        {can_miss_more !== null && (
          <div className={`${can_miss_more > 0 ? 'bg-green-50' : 'bg-red-50'} rounded-[10px] px-3 py-2 mb-3 flex items-center gap-2`}>
            {can_miss_more > 0
              ? <><CheckCircle size={14} color="#16a34a" /><span className="text-[13px] font-semibold leading-[18px] text-green-700">You can miss <b>{can_miss_more}</b> more class{can_miss_more !== 1 ? 'es' : ''} and stay safe</span></>
              : at_risk_status === 'detained'
                ? <><ShieldAlert size={14} color="#dc2626" /><span className="text-[13px] font-semibold leading-[18px] text-red-600">Attendance critical — detainment risk. Need <b>{toSafe}</b> more class{toSafe !== 1 ? 'es' : ''}</span></>
                : <><AlertTriangle size={14} color="#d97706" /><span className="text-[13px] font-semibold leading-[18px] text-amber-600">Below 75% — need <b>{toSafe}</b> more class{toSafe !== 1 ? 'es' : ''} to be safe</span></>
            }
          </div>
        )}

        {/* Calculator toggle */}
        <button onClick={() => setShowCalc(c => !c)}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-[10px] border-[1.5px] border-slate-200 bg-slate-50 cursor-pointer text-[12px] font-semibold leading-4 text-slate-600">
          <Calculator size={13} /> Attendance Calculator
        </button>

        {showCalc && (
          <div className="mt-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-[12px] font-semibold leading-4 text-slate-700 mb-2">If I attend <b>X</b> more classes consecutively:</div>
            <input type="number" min={0} max={100} value={extra} onChange={e => setExtra(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 rounded-lg border-[1.5px] border-slate-200 text-[14px] outline-none box-border mb-2.5" />
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-indigo-50 rounded-[10px] p-2.5 text-center">
                <div className="text-[20px] font-extrabold leading-6 text-brand tabular-nums">{futurePct}%</div>
                <div className="text-[11px] font-medium leading-[14px] text-slate-500">Projected %</div>
              </div>
              <div className={`${futureIsSafe ? 'bg-green-50' : 'bg-red-50'} rounded-[10px] p-2.5 text-center`}>
                <div className={`text-[14px] font-bold leading-5 ${futureIsSafe ? 'text-green-700' : 'text-red-600'}`}>{futureIsSafe ? '✓ Safe' : '✗ Still at risk'}</div>
                <div className="text-[11px] font-medium leading-[14px] text-slate-500">After {extra} classes</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function NativeAttendance() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const me = await api.get('/api/auth/me')
      if (me.success) {
        const res = await api.get(`/api/lms/native/attendance/student/${me.data.id}/summary`)
        if (res.success) setData(res.data || [])
      }
    } catch {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const overallPct = data.length > 0
    ? Math.round(data.reduce((s, d) => s + (d.percentage || 0), 0) / data.filter(d => d.total_conducted > 0).length)
    : null

  const detained = data.filter(d => d.at_risk_status === 'detained').length
  const warned   = data.filter(d => d.at_risk_status === 'warning').length

  return (
    <PageLayout>
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-1.5 mb-2.5">
            <Link to="/dashboard" className="text-[13px] font-medium leading-[18px] text-slate-400 no-underline hover:text-brand transition-colors">Dashboard</Link>
            <span className="text-slate-300">›</span>
            <span className="text-[13px] font-bold leading-[18px] text-brand">Attendance</span>
          </div>
          <h1 className="text-[34px] font-extrabold leading-10 t-primary m-0 tracking-tight">My Attendance</h1>
          <p className="text-[13px] font-medium leading-[18px] text-slate-500 mt-1.5 m-0">Thapar University · 75% minimum attendance rule</p>
        </div>
        {overallPct !== null && (
          <div className="rounded-[20px] px-6 py-4 text-center min-w-[140px]"
            style={{ background: 'linear-gradient(135deg,#4f46e5,#6366f1)' }}>
            <div className="text-[32px] font-extrabold leading-9 text-white tabular-nums">{overallPct}%</div>
            <div className="text-[12px] font-medium leading-4 text-white/70">Overall Average</div>
          </div>
        )}
      </div>

      {/* Alert banners */}
      {detained > 0 && (
        <div className="bg-red-50 border-[1.5px] border-red-200 rounded-[14px] px-[18px] py-3.5 flex gap-3 items-center">
          <ShieldAlert size={20} color="#dc2626" />
          <div>
            <div className="text-[14px] font-bold leading-[18px] text-red-600">Detainment Risk</div>
            <div className="text-[12px] font-normal leading-4 text-red-500">{detained} subject{detained > 1 ? 's' : ''} below 65% — you may be detained from exams. Attend every class immediately.</div>
          </div>
        </div>
      )}
      {warned > 0 && (
        <div className="bg-amber-50 border-[1.5px] border-amber-200 rounded-[14px] px-[18px] py-3.5 flex gap-3 items-center">
          <AlertTriangle size={20} color="#d97706" />
          <div>
            <div className="text-[14px] font-bold leading-[18px] text-amber-600">Below 75% Threshold</div>
            <div className="text-[12px] font-normal leading-4 text-amber-500">{warned} subject{warned > 1 ? 's' : ''} below 75%. Attend more classes to avoid detainment risk.</div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center t-base font-medium text-slate-400">Loading attendance data...</div>
      ) : data.length === 0 ? (
        <div className="bg-white rounded-[20px] border-[1.5px] border-dashed border-slate-200 py-16 px-6 text-center">
          <BookOpen size={40} color="#e2e8f0" className="mx-auto mb-3 block" />
          <div className="text-[15px] font-semibold leading-5 t-primary">No attendance data yet</div>
          <div className="text-[13px] font-normal leading-[18px] text-slate-400 mt-1">Your faculty needs to start marking attendance sessions for your sections.</div>
        </div>
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))' }}>
          {data.map((item, i) => <CourseAttendanceCard key={i} item={item} />)}
        </div>
      )}
    </PageLayout>
  )
}
