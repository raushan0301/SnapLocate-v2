import { useState, useEffect } from 'react'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'

function getTypeStyle(type) {
  if (type === 'MST' || type === 'EST') return { cls: 'bg-amber-200 text-amber-800', label: type }
  if (type === 'NON-TEACHING (NT) WEEK')  return { cls: 'bg-amber-200 text-amber-900', label: 'NON-TEACHING (NT) WEEK' }
  return { cls: 'bg-rose-100 text-red-800', label: 'TEACHING' }
}

const weeks = []

function WeekCard({ week }) {
  const ts   = getTypeStyle(week.type)
  const isNT = week.ntWeek

  return (
    <div className="border-[1.5px] border-slate-300 rounded-[10px] overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
      <div className={`py-1.5 px-2.5 text-center ${isNT ? 'bg-amber-200' : 'bg-brand'}`}>
        <span className={`text-[11px] font-bold leading-[15px] uppercase tracking-[0.06em] ${isNT ? 'text-amber-900' : 'text-white'}`}>
          {isNT ? 'NON-TEACHING (NT) WEEK' : `WEEK ${week.num} (${week.month})`}
        </span>
      </div>

      <div className="border-t border-b border-slate-300 bg-slate-100"
        style={{ display: 'grid', gridTemplateColumns: `repeat(${week.days.length}, 1fr)` }}>
        {week.days.map(d => (
          <div key={d} className="text-center py-1 px-0.5 border-r border-slate-300 text-[9px] font-bold leading-[13px] tracking-[0.04em] text-slate-700">{d}</div>
        ))}
      </div>

      <div className="bg-white" style={{ display: 'grid', gridTemplateColumns: `repeat(${week.days.length}, 1fr)` }}>
        {week.dates.map((cell, i) => {
          const isHoliday = cell.flag === 'H'
          const isNTCell  = cell.flag === 'NT'
          return (
            <div key={i} className={`text-center py-[7px] px-0.5 border-r border-slate-300 last:border-r-0 ${isHoliday ? 'bg-green-500' : isNTCell ? 'bg-green-400' : 'bg-white'}`}>
              <div className={`text-[12px] leading-4 ${isHoliday || isNTCell ? 'font-bold' : 'font-medium'} ${isHoliday ? 'text-white' : isNTCell ? 'text-green-900' : 'text-slate-900'}`}>
                {cell.d}{isHoliday ? '-H' : isNTCell ? '-NT' : ''}
              </div>
            </div>
          )
        })}
      </div>

      <div className={`py-[5px] px-1.5 text-center border-t border-slate-300 ${ts.cls}`}>
        <span className="text-[9px] font-bold leading-[13px] uppercase tracking-[0.08em]">{ts.label}</span>
      </div>
    </div>
  )
}

export default function CalendarPage() {
  const [calendars, setCalendars] = useState([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    const fetchCalendars = async () => {
      try {
        const res = await api.get('/api/settings/calendar_images')
        if (res.success && res.value) {
          setCalendars(Array.isArray(res.value) ? res.value : [res.value])
        }
      } catch (err) { console.error('Failed to load calendars:', err) }
      finally { setLoading(false) }
    }
    fetchCalendars()
  }, [])

  return (
    <PageLayout>
      <div className="mb-1.5">
        <h1 className="text-[26px] font-bold leading-[34px] t-primary m-0">Academic Calendar</h1>
        <p className="text-[12px] font-medium leading-4 text-slate-500 mt-1 uppercase tracking-[0.06em]">
          Academic Session UG &amp; PG
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.05)] px-7 py-6">
        {loading ? (
          <div className="text-center py-10 text-slate-500">Loading...</div>
        ) : calendars.length > 0 ? (
          <div className="flex flex-col gap-8">
            {calendars.map((cal, i) => (
              <img
                key={cal.id || i}
                src={cal.url || cal}
                alt={`Academic Calendar ${i + 1}`}
                className="w-full rounded-lg border border-slate-300 shadow-[0_4px_12px_rgba(0,0,0,0.05)]"
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 px-10 text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-300">
            <p className="text-[16px] font-semibold leading-6 text-slate-600 m-0 mb-1">No Calendar Available</p>
            <p className="text-[14px] font-normal leading-5 text-slate-500 m-0">The administration has not uploaded an academic calendar yet.</p>
          </div>
        )}

        {weeks.length > 0 && (
          <div className="mt-8 grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
            {weeks.map(w => <WeekCard key={w.num} week={w} />)}
          </div>
        )}
      </div>
    </PageLayout>
  )
}
