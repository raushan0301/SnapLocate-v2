import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'
import { ShieldAlert, CheckCircle, AlertTriangle, BookOpen, Calculator } from 'lucide-react'

const pjs = (sz, fw, lh, col) => ({ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:sz, fontWeight:fw, lineHeight:lh, color:col })

function AttendanceMeter({ pct }) {
  const safe = pct >= 75
  const warn = pct >= 65 && pct < 75
  const color = safe ? '#16a34a' : warn ? '#d97706' : '#dc2626'
  const bg = safe ? '#f0fdf4' : warn ? '#fffbeb' : '#fef2f2'
  const border = safe ? '#bbf7d0' : warn ? '#fde68a' : '#fecaca'
  return (
    <div style={{ background:bg, border:`1.5px solid ${border}`, borderRadius:16, padding:'16px 20px' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {safe ? <CheckCircle size={16} color={color} /> : warn ? <AlertTriangle size={16} color={color} /> : <ShieldAlert size={16} color={color} />}
          <span style={pjs(13, 700, '18px', color)}>{safe ? 'Safe' : warn ? 'Warning' : 'Detained Risk'}</span>
        </div>
        <span style={{ ...pjs(26, 800, '30px', color), fontVariantNumeric:'tabular-nums' }}>{pct ?? '—'}%</span>
      </div>
      <div style={{ height:8, background:'rgba(0,0,0,0.08)', borderRadius:8, overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${Math.min(100, pct||0)}%`, background:`linear-gradient(90deg, ${color}aa, ${color})`, borderRadius:8, transition:'width 0.8s ease' }} />
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', marginTop:8 }}>
        <span style={pjs(11, 400, '14px', '#94a3b8')}>0%</span>
        <span style={{ ...pjs(11, 700, '14px', '#d97706'), position:'relative' }}>75% ▼</span>
        <span style={pjs(11, 400, '14px', '#94a3b8')}>100%</span>
      </div>
    </div>
  )
}

function CourseAttendanceCard({ item }) {
  const { course, section_name, percentage, total_conducted, attended, absent, can_miss_more, at_risk_status } = item
  const pct = percentage
  const color = pct >= 75 ? '#16a34a' : pct >= 65 ? '#d97706' : '#dc2626'
  const [showCalc, setShowCalc] = useState(false)
  const [extra, setExtra] = useState(0)

  const futureTotal = total_conducted + extra
  const futureAttended = attended + extra
  const futurePct = futureTotal > 0 ? Math.round((futureAttended / futureTotal) * 100) : pct
  const toSafe = Math.max(0, Math.ceil(total_conducted * 0.75) - attended)

  return (
    <div style={{ background:'#fff', borderRadius:20, border:'1.5px solid #f1f5f9', boxShadow:'0 2px 12px rgba(0,0,0,0.04)', overflow:'hidden' }}>
      {/* Color top bar */}
      <div style={{ height:4, background:`linear-gradient(90deg, ${color}88, ${color})` }} />
      <div style={{ padding:'18px 20px' }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:14 }}>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ ...pjs(11, 700, '14px', '#94a3b8'), letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:4 }}>
              {course?.branch} · Sem {course?.semester}
            </div>
            <div style={{ ...pjs(15, 700, '20px', '#0f172a'), marginBottom:2 }}>{course?.title || course?.code}</div>
            <div style={pjs(12, 400, '16px', '#64748b')}>Section {section_name} · {course?.code}</div>
          </div>
          <div style={{ ...pjs(28, 800, '32px', color), fontVariantNumeric:'tabular-nums', flexShrink:0 }}>{pct ?? '—'}%</div>
        </div>

        {/* Progress bar */}
        <div style={{ height:6, background:'#f1f5f9', borderRadius:6, overflow:'hidden', marginBottom:12 }}>
          <div style={{ height:'100%', width:`${Math.min(100, pct||0)}%`, background:`linear-gradient(90deg, ${color}88, ${color})`, borderRadius:6, transition:'width 0.8s ease' }} />
        </div>

        {/* Stats row */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:14 }}>
          {[
            { label:'Attended', val:attended, col:'#16a34a', bg:'#f0fdf4' },
            { label:'Absent', val:absent, col:'#dc2626', bg:'#fef2f2' },
            { label:'Total Classes', val:total_conducted, col:'#4f46e5', bg:'#eef2ff' },
          ].map(({ label, val, col, bg }) => (
            <div key={label} style={{ background:bg, borderRadius:10, padding:'8px 10px', textAlign:'center' }}>
              <div style={pjs(18, 800, '22px', col)}>{val}</div>
              <div style={pjs(10, 500, '14px', '#94a3b8')}>{label}</div>
            </div>
          ))}
        </div>

        {/* Can miss indicator */}
        {can_miss_more !== null && (
          <div style={{ background: can_miss_more > 0 ? '#f0fdf4' : '#fef2f2', borderRadius:10, padding:'8px 12px', marginBottom:12, display:'flex', alignItems:'center', gap:8 }}>
            {can_miss_more > 0
              ? <><CheckCircle size={14} color="#16a34a" /><span style={pjs(13,600,'18px','#16a34a')}>You can miss <b>{can_miss_more}</b> more class{can_miss_more!==1?'es':''} and stay safe</span></>
              : at_risk_status === 'detained'
                ? <><ShieldAlert size={14} color="#dc2626" /><span style={pjs(13,600,'18px','#dc2626')}>Attendance critical — detainment risk. Need <b>{toSafe}</b> more class{toSafe!==1?'es':''}</span></>
                : <><AlertTriangle size={14} color="#d97706" /><span style={pjs(13,600,'18px','#d97706')}>Below 75% — need <b>{toSafe}</b> more class{toSafe!==1?'es':''} to be safe</span></>
            }
          </div>
        )}

        {/* Calculator toggle */}
        <button onClick={() => setShowCalc(s => !s)} style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'8px 0', borderRadius:10, border:'1.5px solid #e2e8f0', background:'#f8fafc', cursor:'pointer', ...pjs(12,600,'16px','#475569') }}>
          <Calculator size={13} /> Attendance Calculator
        </button>

        {showCalc && (
          <div style={{ marginTop:12, padding:'14px', background:'#f8fafc', borderRadius:12, border:'1px solid #e2e8f0' }}>
            <div style={{ ...pjs(12,600,'16px','#374151'), marginBottom:8 }}>If I attend <b>X</b> more classes consecutively:</div>
            <input type="number" min={0} max={100} value={extra} onChange={e => setExtra(parseInt(e.target.value)||0)}
              style={{ width:'100%', padding:'8px 12px', borderRadius:8, border:'1.5px solid #e2e8f0', fontSize:14, fontFamily:"'Plus Jakarta Sans',sans-serif", outline:'none', boxSizing:'border-box', marginBottom:10 }} />
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              <div style={{ background:'#eef2ff', borderRadius:10, padding:'10px', textAlign:'center' }}>
                <div style={pjs(20,800,'24px','#4f46e5')}>{futurePct}%</div>
                <div style={pjs(11,500,'14px','#64748b')}>Projected %</div>
              </div>
              <div style={{ background: futurePct>=75?'#f0fdf4':'#fef2f2', borderRadius:10, padding:'10px', textAlign:'center' }}>
                <div style={pjs(14,700,'20px',futurePct>=75?'#16a34a':'#dc2626')}>{futurePct>=75?'✓ Safe':'✗ Still at risk'}</div>
                <div style={pjs(11,500,'14px','#64748b')}>After {extra} classes</div>
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
  const [userId, setUserId] = useState(null)

  const load = useCallback(async () => {
    try {
      const me = await api.get('/api/auth/me')
      if (me.success) {
        setUserId(me.data.id)
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
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:16 }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:10 }}>
            <Link to="/dashboard" style={{ ...pjs(13,500,'18px','#94a3b8'), textDecoration:'none' }} onMouseEnter={e=>e.currentTarget.style.color='#4f46e5'} onMouseLeave={e=>e.currentTarget.style.color='#94a3b8'}>Dashboard</Link>
            <span style={{ color:'#cbd5e1' }}>›</span>
            <span style={pjs(13,700,'18px','#4f46e5')}>Attendance</span>
          </div>
          <h1 style={{ ...pjs(34,800,'40px','#0f172a'), margin:0, letterSpacing:'-0.02em' }}>My Attendance</h1>
          <p style={{ ...pjs(13,500,'18px','#64748b'), marginTop:6 }}>Thapar University · 75% minimum attendance rule</p>
        </div>
        {overallPct !== null && (
          <div style={{ background:'linear-gradient(135deg,#4f46e5,#6366f1)', borderRadius:20, padding:'16px 24px', textAlign:'center', minWidth:140 }}>
            <div style={{ ...pjs(32,800,'36px','#fff'), fontVariantNumeric:'tabular-nums' }}>{overallPct}%</div>
            <div style={pjs(12,500,'16px','rgba(255,255,255,0.7)')}>Overall Average</div>
          </div>
        )}
      </div>

      {/* Alert banners */}
      {detained > 0 && (
        <div style={{ background:'#fef2f2', border:'1.5px solid #fecaca', borderRadius:14, padding:'14px 18px', display:'flex', gap:12, alignItems:'center' }}>
          <ShieldAlert size={20} color="#dc2626" />
          <div>
            <div style={pjs(14,700,'18px','#dc2626')}>Detainment Risk</div>
            <div style={pjs(12,400,'16px','#ef4444')}>{detained} subject{detained>1?'s':''} below 65% — you may be detained from exams. Attend every class immediately.</div>
          </div>
        </div>
      )}
      {warned > 0 && (
        <div style={{ background:'#fffbeb', border:'1.5px solid #fde68a', borderRadius:14, padding:'14px 18px', display:'flex', gap:12, alignItems:'center' }}>
          <AlertTriangle size={20} color="#d97706" />
          <div>
            <div style={pjs(14,700,'18px','#d97706')}>Below 75% Threshold</div>
            <div style={pjs(12,400,'16px','#f59e0b')}>{warned} subject{warned>1?'s':''} below 75%. Attend more classes to avoid detainment risk.</div>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ padding:60, textAlign:'center', ...pjs(14,500,'20px','#94a3b8') }}>Loading attendance data...</div>
      ) : data.length === 0 ? (
        <div style={{ background:'#fff', borderRadius:20, border:'1.5px dashed #e2e8f0', padding:'60px 24px', textAlign:'center' }}>
          <BookOpen size={40} color="#e2e8f0" style={{ margin:'0 auto 12px', display:'block' }} />
          <div style={pjs(15,600,'20px','#0f172a')}>No attendance data yet</div>
          <div style={{ ...pjs(13,400,'18px','#94a3b8'), marginTop:4 }}>Your faculty needs to start marking attendance sessions for your sections.</div>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:16 }}>
          {data.map((item, i) => <CourseAttendanceCard key={i} item={item} />)}
        </div>
      )}
    </PageLayout>
  )
}
