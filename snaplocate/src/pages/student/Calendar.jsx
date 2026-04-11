import { useState, useEffect } from 'react'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'

/* ─── Typography helpers ─────────────────────────────────────────── */
const pjs = (size, weight, lh, color) => ({
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  fontSize: size, fontWeight: weight, lineHeight: lh, color,
})
const inter = (size, weight, lh, color) => ({
  fontFamily: "'Inter', sans-serif",
  fontSize: size, fontWeight: weight, lineHeight: lh, color,
})

/* ─── Colors matching Figma exactly ─────────────────────────────── */
const COL = {
  headerBg:   '#4f46e5',  // indigo week header
  headerTxt:  '#ffffff',
  dayBg:      '#f1f5f9',  // day label row bg
  dayTxt:     '#334155',
  teachBg:    '#fce4e4',  // pink teaching row
  teachTxt:   '#991b1b',
  mstBg:      '#fde68a',  // amber MST
  mstTxt:     '#92400e',
  estBg:      '#fde68a',
  estTxt:     '#92400e',
  ntBg:       '#fde68a',  // yellow NT week header
  ntTxt:      '#78350f',
  holGreen:   '#22c55e',  // green holiday cell
  holTxt:     '#ffffff',
  ntGreen:    '#4ade80',  // light green NT cell
  ntCellTxt:  '#14532d',
  borderC:    '#cbd5e1',
  rowBg:      '#ffffff',
  altRowBg:   '#f8fafc',
  noteBg:     '#fffbeb',
  noteBorder: '#f59e0b',
}

/* ─── All 19 weeks data ──────────────────────────────────────────── */
// cell: null = normal, 'H' = holiday (green), 'NT' = non-teaching (light green)
// sat / sun: true if this week includes SAT
const weeks = []

/* ─── Week type styling ──────────────────────────────────────────── */
function getTypeSyle(type) {
  if (type === 'MST')  return { bg: COL.mstBg,   color: COL.mstTxt,   label: 'MST' }
  if (type === 'EST')  return { bg: COL.estBg,   color: COL.estTxt,   label: 'EST' }
  if (type === 'NON-TEACHING (NT) WEEK') return { bg: COL.ntBg, color: COL.ntTxt, label: 'NON-TEACHING (NT) WEEK' }
  return { bg: COL.teachBg,  color: COL.teachTxt, label: 'TEACHING' }
}

/* ─── Single Week Card ───────────────────────────────────────────── */
function WeekCard({ week }) {
  const ts = getTypeSyle(week.type)
  const isNT = week.ntWeek

  return (
    <div style={{
      border: `1.5px solid ${COL.borderC}`,
      borderRadius: 10, overflow: 'hidden',
      boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
    }}>
      {/* Week header */}
      <div style={{
        background: isNT ? COL.ntBg : COL.headerBg,
        padding: '6px 10px', textAlign: 'center',
      }}>
        <span style={{
          ...inter(11, 700, '15px', isNT ? COL.ntTxt : COL.headerTxt),
          letterSpacing: '0.06em', textTransform: 'uppercase',
        }}>
          {isNT ? 'NON-TEACHING (NT) WEEK' : `WEEK ${week.num} (${week.month})`}
        </span>
      </div>

      {/* Day labels */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${week.days.length}, 1fr)`,
        background: COL.dayBg,
        borderTop: `1px solid ${COL.borderC}`,
        borderBottom: `1px solid ${COL.borderC}`,
      }}>
        {week.days.map(d => (
          <div key={d} style={{
            ...inter(9, 700, '13px', COL.dayTxt),
            textAlign: 'center', padding: '4px 2px',
            borderRight: `1px solid ${COL.borderC}`,
            letterSpacing: '0.04em',
          }}>{d}</div>
        ))}
      </div>

      {/* Date cells */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${week.days.length}, 1fr)`,
        background: '#ffffff',
      }}>
        {week.dates.map((cell, i) => {
          const isHoliday = cell.flag === 'H'
          const isNTCell  = cell.flag === 'NT'
          return (
            <div key={i} style={{
              textAlign: 'center', padding: '7px 2px',
              background: isHoliday ? COL.holGreen : isNTCell ? COL.ntGreen : '#ffffff',
              borderRight: i < week.dates.length - 1 ? `1px solid ${COL.borderC}` : 'none',
            }}>
              <div style={inter(12, isHoliday || isNTCell ? 700 : 500, '16px',
                isHoliday ? COL.holTxt : isNTCell ? COL.ntCellTxt : '#1e293b')}>
                {cell.d}
                {isHoliday ? '-H' : isNTCell ? '-NT' : ''}
              </div>
            </div>
          )
        })}
      </div>

      {/* Status bar */}
      <div style={{
        background: ts.bg, padding: '5px 6px',
        textAlign: 'center',
        borderTop: `1px solid ${COL.borderC}`,
      }}>
        <span style={{ ...inter(9, 700, '13px', ts.color), letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          {ts.label}
        </span>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   Calendar Page
═══════════════════════════════════════════════════════════════════ */
export default function CalendarPage() {
  const [calendars, setCalendars] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCalendars = async () => {
      try {
        const res = await api.get('/api/settings/calendar_images')
        if (res.success && res.value) {
          setCalendars(Array.isArray(res.value) ? res.value : [res.value])
        }
      } catch (err) {
        console.error('Failed to load calendars:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchCalendars()
  }, [])

  return (
    <PageLayout>

      {/* ── Page heading ───────────────────────────────────── */}
      <div style={{ marginBottom: 6 }}>
        <h1 style={pjs(26, 700, '34px', '#0f172a')}>Academic Calendar 2025-26</h1>
        <p  style={{ ...inter(12, 500, '16px', '#64748b'), marginTop: 4, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Academic Session UG &amp; PG
        </p>
      </div>

      {/* ── Main calendar card ─────────────────────────────── */}
      <div style={{
        background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 16,
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)', padding: '24px 28px',
      }}>

        {/* Banner */}
        <div style={{
          background: COL.ntBg, border: `1.5px solid #f59e0b`,
          borderRadius: 8, padding: '10px 16px', marginBottom: 24, textAlign: 'center',
        }}>
          <span style={{ ...inter(12, 700, '16px', '#78350f'), letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            ACADEMIC CALENDAR – UG‑ I, II, III, IV, PG‑I AND PG‑II (EVEN SEM 2025‑26)
          </span>
        </div>

        {/* Title */}
        <h2 style={{ ...inter(20, 800, '26px', '#0f172a'), textAlign: 'center', marginBottom: 24, letterSpacing: '0.02em', textTransform: 'uppercase' }}>
          Academic Calendar (UG and PG)
        </h2>
        <div style={{ width: 60, height: 3, background: '#4f46e5', margin: '0 auto 28px' }} />

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading...</div>
        ) : calendars.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            {calendars.map((cal, i) => (
              <img 
                key={cal.id || i}
                src={cal.url || cal} 
                alt={`Academic Calendar ${i+1}`} 
                style={{ width: '100%', borderRadius: 8, border: '1px solid #cbd5e1', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
              />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 40px', color: '#64748b', background: '#f8fafc', borderRadius: 8, border: '1px dashed #cbd5e1' }}>
            <p style={pjs(16, 600, '24px', '#475569')}>No Calendar Available</p>
            <p style={inter(14, 400, '20px', '#64748b')}>The administration has not uploaded an academic calendar yet.</p>
          </div>
        )}

      </div>
    </PageLayout>
  )
}
