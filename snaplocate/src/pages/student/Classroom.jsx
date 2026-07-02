import { useState, useEffect } from 'react'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'

const categories = ['All Units', 'Block B', 'Block TAN', 'CSED', 'Lab', 'Lecture Hall']

function RoomCard({ room, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`bg-white border border-slate-100 rounded-2xl overflow-hidden text-left cursor-pointer w-full transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-[0_6px_24px_rgba(0,0,0,0.1)] ${selected ? 'shadow-[0_4px_20px_rgba(79,70,229,0.15)] outline outline-[2px] outline-brand outline-offset-2' : 'shadow-[0_1px_4px_rgba(0,0,0,0.05)]'}`}
    >
      {/* Image */}
      <div className="relative h-[180px] overflow-hidden">
        <img src={room.img} alt={room.name} className="w-full h-full object-cover blur-[3px] scale-105" />
        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm rounded-md px-2.5 py-1">
          <span className="text-[11px] font-bold text-white tracking-[0.04em]">{room.type}</span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-[3px]" style={{ background: room.indicatorBg }} />
      </div>

      {/* Info */}
      <div className="px-4 py-3.5">
        <div className="t-base font-bold t-primary">{room.name}</div>
        <div className="flex items-center gap-1 mt-1">
          <svg width="12" height="14" viewBox="0 0 12 14" fill="none">
            <path d="M6 0C3.79 0 2 1.79 2 4c0 3 4 9 4 9s4-6 4-9c0-2.21-1.79-4-4-4Z" fill="#94a3b8"/>
            <circle cx="6" cy="4" r="1.5" fill="white"/>
          </svg>
          <span className="t-xs t-subtle">{room.subtitle}</span>
        </div>
        <div className="flex justify-between mt-3.5 pt-3 border-t border-slate-100">
          {[['BLOCK', room.block], ['FLOOR', room.floor], ['CAPACITY', room.capacity], ['CODE', room.classcode || room.classCode]]
            .filter(([, val]) => val)
            .map(([label, val]) => (
              <div key={label}>
                <div className="text-[10px] font-semibold t-subtle uppercase tracking-[0.08em] mb-0.5">{label}</div>
                <div className="t-md font-bold t-primary">{val}</div>
              </div>
            ))}
        </div>
      </div>
    </button>
  )
}

const getSearchRelevance = (room, query) => {
  if (!query) return 0
  const q = query.toLowerCase().trim()
  const code = (room.classcode || room.classCode || '').toLowerCase().trim()
  const name = (room.name || '').toLowerCase().trim()
  const subtitle = (room.subtitle || '').toLowerCase().trim()
  const isExactWord = (str, sub) => str === sub || str.startsWith(sub + ' ') || str.startsWith(sub + '-') || str.startsWith(sub + '_')
  if (code === q)                  return 6
  if (isExactWord(code, q))        return 5
  if (code.startsWith(q))          return 4
  if (code.includes(q))            return 3
  if (isExactWord(name, q))        return 2.5
  if (name.startsWith(q))          return 2
  if (name.includes(q) || subtitle.includes(q) || (room.block || '').toLowerCase().includes(q)) return 1
  return 0
}

export default function ClassroomPage() {
  const [selected, setSelected]     = useState('All Units')
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [sort, setSort]             = useState('A-Z')
  const [searchTerm, setSearchTerm] = useState('')
  const [rooms, setRooms]           = useState([])
  const [timetable, setTimetable]   = useState([])
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await api.get('/api/classrooms')
        if (res.success) setRooms(res.data)
      } catch (err) { console.error('Failed to load classrooms:', err) }
      finally { setLoading(false) }
    }
    fetchRooms()
  }, [])

  useEffect(() => {
    if (!selectedRoom) return
    const fetchTimetable = async () => {
      try {
        const res = await api.get(`/api/classrooms/${selectedRoom.id}/timetable`)
        if (res.success) setTimetable(res.data)
      } catch (err) { console.error('Failed to load timetable:', err) }
    }
    fetchTimetable()
  }, [selectedRoom])

  const filteredRooms = rooms
    .filter(room => {
      if (selected !== 'All Units') {
        const selLower = selected.toLowerCase()
        if (selLower === 'lab')                       { if (room.type !== 'LAB') return false }
        else if (selLower === 'lecture hall')          { if (room.type !== 'LEC') return false }
        else if (selLower.startsWith('block '))        { if (room.block?.toLowerCase() !== selLower.replace('block ', '')) return false }
        else if (selLower === 'csed')                 { if (room.block?.toLowerCase() !== 'csed') return false }
      }
      if (searchTerm) {
        const q = searchTerm.toLowerCase().trim()
        const code = (room.classcode || room.classCode || '').toLowerCase().trim()
        if (!room.name?.toLowerCase().includes(q) && !room.subtitle?.toLowerCase().includes(q) &&
            !room.block?.toLowerCase().includes(q) && !room.type?.toLowerCase().includes(q) && !code.includes(q)) return false
      }
      return true
    })
    .sort((a, b) => {
      if (searchTerm) {
        const diff = getSearchRelevance(b, searchTerm) - getSearchRelevance(a, searchTerm)
        if (diff !== 0) return diff
      }
      if (sort === 'A-Z')      return (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' })
      if (sort === 'Z-A')      return (b.name || '').localeCompare(a.name || '', undefined, { sensitivity: 'base' })
      if (sort === 'Capacity') return (parseInt(b.capacity) || 0) - (parseInt(a.capacity) || 0)
      return 0
    })

  return (
    <PageLayout>
      {/* Page header */}
      <div className="flex justify-between items-center flex-wrap gap-4 mb-7">
        <div>
          <h1 className="t-heading-2xl t-primary">Classroom Discovery</h1>
          <p  className="t-base t-secondary mt-1">Discover and Join your classes</p>
        </div>
        <div className="relative flex-1 max-w-[400px] min-w-[200px]">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2" width="15" height="15" viewBox="0 0 15 15" fill="none">
            <circle cx="6.5" cy="6.5" r="5.5" stroke="#94a3b8" strokeWidth="1.3"/>
            <path d="M11 11l3 3" stroke="#94a3b8" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
          <input
            placeholder="Find a room, block or lab..."
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="w-full py-3 pr-4 pl-10 bg-white border border-ink-border rounded-2xl t-base t-primary outline-none shadow-[0_1px_4px_rgba(0,0,0,0.04)]"
          />
        </div>
      </div>

      {/* Two-column layout */}
      <div className="flex gap-6 items-start flex-col lg:flex-row">

        {/* Left: filters + grid */}
        <div className="flex-1 min-w-0 w-full flex flex-col gap-5">
          {/* Filter bar */}
          <div className="flex flex-col gap-2.5">
            <div className="overflow-hidden">
              <div className="flex gap-2 flex-nowrap overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {categories.map(cat => (
                  <button key={cat} onClick={() => setSelected(cat)}
                    className={`shrink-0 whitespace-nowrap px-[18px] py-2 rounded-3xl cursor-pointer transition-all t-md ${selected === cat ? 'bg-brand text-white font-bold border-none' : 'bg-white border border-ink-border font-medium t-secondary'}`}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="t-md t-secondary">Sort:</span>
              <select value={sort} onChange={e => setSort(e.target.value)}
                className="t-md font-semibold t-primary bg-white border border-ink-border rounded-[10px] px-3 py-1.5 outline-none cursor-pointer">
                <option value="A-Z">A-Z</option>
                <option value="Z-A">Z-A</option>
                <option value="Capacity">Capacity</option>
              </select>
            </div>
          </div>

          {/* Rooms grid */}
          {filteredRooms.length === 0 ? (
            <div className="py-10 px-5 text-center bg-white rounded-2xl border border-slate-100">
              <div className="t-lg font-semibold t-subtle">No classrooms found matching your criteria.</div>
            </div>
          ) : (
            <div className={`grid gap-4 ${selectedRoom ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
              {filteredRooms.map(room => (
                <RoomCard key={room.id} room={room} selected={selectedRoom?.id === room.id} onClick={() => setSelectedRoom(room)} />
              ))}
            </div>
          )}
        </div>

        {/* Right: detail panel */}
        {selectedRoom && (
          <div className="w-full lg:w-[300px] lg:shrink-0 bg-white border border-slate-100 rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col">

            {/* Panel header */}
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-start">
              <div>
                <div className="text-[11px] font-bold text-brand uppercase tracking-[0.08em] mb-1.5">Selected Venue</div>
                <div className="t-heading-lg t-primary">{selectedRoom.name}</div>
                <div className="t-xs t-secondary mt-1">Computer Science &amp; Engineering Department</div>
                {(selectedRoom.classcode || selectedRoom.classCode) && (
                  <div className="mt-1.5 inline-block text-[12px] font-bold text-brand bg-brand-light px-2 py-0.5 rounded-md">
                    Lab Code: {selectedRoom.classcode || selectedRoom.classCode}
                  </div>
                )}
              </div>
              <button onClick={() => setSelectedRoom(null)} className="bg-transparent border-none cursor-pointer p-1 t-subtle">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M2 2l12 12M14 2L2 14" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5">

              {/* Live metrics */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <rect x="1" y="1" width="12" height="12" rx="2" stroke="#4f46e5" strokeWidth="1.3"/>
                    <path d="M4 9l2-3 2 2 2-4" stroke="#4f46e5" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="t-md font-bold t-primary">Live Metrics</span>
                </div>
                {(() => {
                  const cap  = parseInt(selectedRoom.capacity) || 40
                  const seed = (selectedRoom.name?.length || 5) * 7
                  const occ  = Math.floor(cap * ((seed % 60 + 20) / 100))
                  const pct  = Math.round((occ / cap) * 100)
                  return (
                    <>
                      <div className="text-[10px] font-semibold t-subtle uppercase tracking-[0.08em] mb-1.5">Occupancy</div>
                      <div className="flex items-baseline gap-1 mb-2">
                        <span className="text-[22px] font-bold t-primary">{occ}</span>
                        <span className="t-md t-subtle">/ {cap}</span>
                      </div>
                      <div className="h-1.5 bg-surface-muted rounded-full">
                        <div className="h-full bg-brand rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </>
                  )
                })()}
              </div>

              {/* Today's timetable */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <rect x="1" y="2" width="12" height="11" rx="1.5" stroke="#4f46e5" strokeWidth="1.3"/>
                      <path d="M4 1v2M10 1v2M1 5h12" stroke="#4f46e5" strokeWidth="1.3" strokeLinecap="round"/>
                    </svg>
                    <span className="t-md font-bold t-primary">Today's Timetable</span>
                  </div>
                  <span className="t-xs t-subtle">{new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}</span>
                </div>

                <div className="flex flex-col gap-2.5">
                  {timetable.length === 0 ? (
                    <div className="t-xs t-subtle py-2.5">No classes today.</div>
                  ) : timetable.map((t, i) => (
                    <div key={i} className="flex gap-2.5 items-start">
                      <div className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 ${t.active ? 'bg-brand' : 'bg-slate-300'}`} />
                      <div className="flex-1">
                        <div className="flex justify-between items-baseline">
                          <span className={`t-xs ${t.active ? 'font-bold text-brand' : 'font-medium t-primary'}`}>{t.label}</span>
                          <span className="text-[10px] t-subtle">{t.time}</span>
                        </div>
                        <div className="text-[11px] t-secondary mt-0.5">{t.sub}</div>
                        {t.ongoing && (
                          <div className="inline-flex items-center gap-1 mt-1 bg-brand-light rounded-md px-2 py-0.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-brand" />
                            <span className="text-[10px] font-semibold text-brand">Ongoing</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Lab inventory */}
              {selectedRoom.type === 'LAB' && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <rect x="1" y="3" width="12" height="9" rx="1.5" stroke="#4f46e5" strokeWidth="1.3"/>
                      <path d="M4 3V2a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" stroke="#4f46e5" strokeWidth="1.3"/>
                    </svg>
                    <span className="t-md font-bold t-primary">Lab Inventory</span>
                  </div>
                  {[
                    { label: 'Workstations', val: selectedRoom.capacity || 40, cls: 't-primary' },
                    { label: '4K Projector',  val: 'Available',               cls: 'text-success' },
                  ].map((item, i) => (
                    <div key={i} className={`flex justify-between items-center py-2.5 ${i > 0 ? 'border-t border-slate-100' : ''} border-b border-slate-100`}>
                      <div className="flex items-center gap-2">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <rect x="1" y="1" width="12" height="9" rx="1.5" stroke="#64748b" strokeWidth="1.2"/>
                          <path d="M4 13h6M7 10v3" stroke="#64748b" strokeWidth="1.2" strokeLinecap="round"/>
                        </svg>
                        <span className="t-xs font-medium t-primary">{item.label}</span>
                      </div>
                      <span className={`t-xs font-bold ${item.cls}`}>{item.val}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Book button */}
            <div className="px-5 py-4 border-t border-slate-100">
              <button className="w-full py-3.5 bg-brand text-white rounded-2xl border-none cursor-pointer t-heading-md transition-colors hover:bg-brand-dark">
                Book Slot for Tomorrow
              </button>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  )
}
