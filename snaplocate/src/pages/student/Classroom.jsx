import { useState, useEffect } from 'react'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'

const pjs = (size, weight, lh, color) => ({
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  fontSize: size, fontWeight: weight, lineHeight: lh, color,
})
const inter = (size, weight, lh, color) => ({
  fontFamily: "'Inter', sans-serif",
  fontSize: size, fontWeight: weight, lineHeight: lh, color,
})

const categories = ['All Units', 'Block B', 'Block TAN', 'CSED', 'Lab', 'Lecture Hall']

function RoomCard({ room, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: '#ffffff', border: `1px solid #f1f5f9`,
        borderRadius: 16, overflow: 'hidden', textAlign: 'left',
        cursor: 'pointer', width: '100%',
        boxShadow: selected ? '0 4px 20px rgba(79,70,229,0.15)' : '0 1px 4px rgba(0,0,0,0.05)',
        outline: selected ? '2px solid #4f46e5' : 'none',
        outlineOffset: 2,
        transition: 'box-shadow 0.15s, transform 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.1)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = selected ? '0 4px 20px rgba(79,70,229,0.15)' : '0 1px 4px rgba(0,0,0,0.05)' }}
    >
      {/* Image */}
      <div style={{ position: 'relative', height: 180, overflow: 'hidden' }}>
        <img src={room.img} alt={room.name} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(3px)', transform: 'scale(1.05)' }} />

        {/* Type badge */}
        <div style={{
          position: 'absolute', top: 12, right: 12,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          borderRadius: 6, padding: '4px 10px',
        }}>
          <span style={{ ...pjs(11, 700, '15px', '#ffffff'), letterSpacing: '0.04em' }}>{room.type}</span>
        </div>
        {/* Bottom color indicator */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: room.indicatorBg }} />
      </div>

      {/* Info */}
      <div style={{ padding: '14px 16px' }}>
        <div style={pjs(16, 700, '22px', '#0f172a')}>{room.name}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
          <svg width="12" height="14" viewBox="0 0 12 14" fill="none">
            <path d="M6 0C3.79 0 2 1.79 2 4c0 3 4 9 4 9s4-6 4-9c0-2.21-1.79-4-4-4Z" fill="#94a3b8"/>
            <circle cx="6" cy="4" r="1.5" fill="white"/>
          </svg>
          <span style={pjs(12, 400, '16px', '#94a3b8')}>{room.subtitle}</span>
        </div>

        {/* Block / Floor / Capacity / Code */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14, paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
          {[
            ['BLOCK', room.block],
            ['FLOOR', room.floor],
            ['CAPACITY', room.capacity],
            ['CODE', room.classcode || room.classCode]
          ].filter(([_, val]) => val).map(([label, val]) => (
            <div key={label}>
              <div style={{ ...pjs(10, 600, '14px', '#94a3b8'), letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 3 }}>{label}</div>
              <div style={pjs(13, 700, '18px', '#0f172a')}>{val}</div>
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
  
  const isExactWord = (str, sub) => {
    if (str === sub) return true
    return str.startsWith(sub + ' ') || str.startsWith(sub + '-') || str.startsWith(sub + '_')
  }
  
  if (code === q) return 6
  if (isExactWord(code, q)) return 5
  if (code.startsWith(q)) return 4
  if (code.includes(q)) return 3
  if (isExactWord(name, q)) return 2.5
  if (name.startsWith(q)) return 2
  if (name.includes(q) || subtitle.includes(q) || (room.block || '').toLowerCase().includes(q)) return 1
  return 0
}

export default function ClassroomPage() {
  const [selected, setSelected] = useState('All Units')
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [sort, setSort] = useState('A-Z')
  const [searchTerm, setSearchTerm] = useState('')
  
  const [rooms, setRooms] = useState([])
  const [timetable, setTimetable] = useState([])
  const [loading, setLoading] = useState(true)

  // Fetch rooms on mount
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await api.get('/api/classrooms')
        if (res.success) {
          setRooms(res.data)
        }
      } catch (err) {
        console.error('Failed to load classrooms:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchRooms()
  }, [])

  // Fetch timetable when selectedroom changes
  useEffect(() => {
    if (!selectedRoom) return
    const fetchTimetable = async () => {
      try {
        const res = await api.get(`/api/classrooms/${selectedRoom.id}/timetable`)
        if (res.success) {
          setTimetable(res.data)
        }
      } catch (err) {
        console.error('Failed to load timetable:', err)
      }
    }
    fetchTimetable()
  }, [selectedRoom])

  const filteredRooms = rooms
    .filter(room => {
      // 1. Category Filter
      if (selected !== 'All Units') {
        const selLower = selected.toLowerCase()
        if (selLower === 'lab') {
          if (room.type !== 'LAB') return false
        } else if (selLower === 'lecture hall') {
          if (room.type !== 'LEC') return false
        } else if (selLower.startsWith('block ')) {
          const blockLetter = selLower.replace('block ', '')
          if (room.block?.toLowerCase() !== blockLetter) return false
        } else if (selLower === 'csed') {
          if (room.block?.toLowerCase() !== 'csed') return false
        }
      }
      
      // 2. Search Filter
      if (searchTerm) {
        const q = searchTerm.toLowerCase().trim()
        const code = (room.classcode || room.classCode || '').toLowerCase().trim()
        const match = 
          room.name?.toLowerCase().includes(q) || 
          room.subtitle?.toLowerCase().includes(q) ||
          room.block?.toLowerCase().includes(q) ||
          room.type?.toLowerCase().includes(q) ||
          code.includes(q)
        if (!match) return false
      }
      return true
    })
    .sort((a, b) => {
      if (searchTerm) {
        const scoreA = getSearchRelevance(a, searchTerm)
        const scoreB = getSearchRelevance(b, searchTerm)
        if (scoreA !== scoreB) {
          return scoreB - scoreA
        }
      }
      if (sort === 'A-Z') return (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' })
      if (sort === 'Z-A') return (b.name || '').localeCompare(a.name || '', undefined, { sensitivity: 'base' })
      if (sort === 'Capacity') return (parseInt(b.capacity) || 0) - (parseInt(a.capacity) || 0)
      return 0
    })

  return (
    <PageLayout>

      {/* ── Page header ──────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
        <div>
          <h1 style={pjs(26, 700, '34px', '#0f172a')}>Classroom Discovery</h1>
          <p  style={{ ...pjs(14, 400, '20px', '#64748b'), marginTop: 4 }}>Discover and Join your classes</p>
        </div>

        <div style={{ position: 'relative', flex: '1 1 300px', maxWidth: 400 }}>
          <svg style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} width="15" height="15" viewBox="0 0 15 15" fill="none">
            <circle cx="6.5" cy="6.5" r="5.5" stroke="#94a3b8" strokeWidth="1.3"/>
            <path d="M11 11l3 3" stroke="#94a3b8" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
          <input
            placeholder="Find a room, block or lab..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              width: '100%', padding: '12px 16px 12px 42px',
              background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 14,
              ...pjs(14, 400, '20px', '#0f172a'), outline: 'none',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      {/* ── Two-column layout: rooms list + detail panel ─ */}
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>

        {/* ── LEFT: filters + grid ─────────────── */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Filter Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelected(cat)}
                  style={{
                    padding: '8px 18px', borderRadius: 24,
                    border: selected === cat ? 'none' : '1.5px solid #e2e8f0',
                    background: selected === cat ? '#4f46e5' : '#ffffff',
                    ...pjs(13, selected === cat ? 700 : 500, '18px', selected === cat ? '#ffffff' : '#64748b'),
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <span style={pjs(13, 400, '18px', '#64748b')}>Sort:</span>
              <select
                value={sort}
                onChange={e => setSort(e.target.value)}
                style={{
                  ...pjs(13, 600, '18px', '#0f172a'),
                  background: '#ffffff', border: '1px solid #e2e8f0',
                  borderRadius: 10, padding: '7px 12px',
                  outline: 'none', cursor: 'pointer',
                  appearance: 'none', paddingRight: '28px',
                  backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3Csvg width=\\\'10\\\' height=\\\'6\\\' viewBox=\\\'0 0 10 6\\\' fill=\\\'none\\\' xmlns=\\\'http://www.w3.org/2000/svg\\\'%3E%3Cpath d=\\\'M1 1L5 5L9 1\\\' stroke=\\\'%2364748b\\\' stroke-width=\\\'1.3\\\' stroke-linecap=\\\'round\\\' stroke-linejoin=\\\'round\\\'/%3E%3C/svg%3E")',
                  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center'
                }}>
                <option value="A-Z">A-Z</option>
                <option value="Z-A">Z-A</option>
                <option value="Capacity">Capacity</option>
              </select>
            </div>
          </div>

          {/* Rooms grid */}
          {filteredRooms.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', background: '#ffffff', borderRadius: 16, border: '1px solid #f1f5f9' }}>
              <div style={pjs(15, 600, '22px', '#94a3b8')}>No classrooms found matching your criteria.</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: selectedRoom ? '1fr 1fr' : '1fr 1fr 1fr', gap: 16 }}>
              {filteredRooms.map(room => (
                <RoomCard
                  key={room.id}
                  room={room}
                  selected={selectedRoom?.id === room.id}
                  onClick={() => setSelectedRoom(room)}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── RIGHT: detail panel ─────────────────────────── */}
        {selectedRoom && (
          <div style={{
            width: 300, flexShrink: 0,
            background: '#ffffff', border: '1px solid #f1f5f9', borderRadius: 20,
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            overflow: 'hidden', display: 'flex', flexDirection: 'column',
          }}>

            {/* Panel header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ ...pjs(11, 700, '15px', '#4f46e5'), letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Selected Venue</div>
                <div style={pjs(18, 700, '24px', '#0f172a')}>{selectedRoom.name}</div>
                <div style={{ ...pjs(12, 400, '16px', '#64748b'), marginTop: 4 }}>Computer Science &amp; Engineering Department</div>
                {(selectedRoom.classcode || selectedRoom.classCode) && (
                  <div style={{ ...pjs(12, 700, '16px', '#4f46e5'), marginTop: 6, background: '#eef2ff', padding: '2px 8px', borderRadius: 6, display: 'inline-block' }}>
                    Lab Code: {selectedRoom.classcode || selectedRoom.classCode}
                  </div>
                )}
              </div>
              <button onClick={() => setSelectedRoom(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, color: '#94a3b8' }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M2 2l12 12M14 2L2 14" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Live Metrics */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <rect x="1" y="1" width="12" height="12" rx="2" stroke="#4f46e5" strokeWidth="1.3"/>
                    <path d="M4 9l2-3 2 2 2-4" stroke="#4f46e5" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span style={pjs(13, 700, '18px', '#0f172a')}>Live Metrics</span>
                </div>
                <div>
                  {(() => {
                    const cap = parseInt(selectedRoom.capacity) || 40;
                    const seed = (selectedRoom.name?.length || 5) * 7;
                    const occ = Math.floor(cap * ((seed % 60 + 20) / 100));
                    const pct = Math.round((occ / cap) * 100);
                    return (
                      <>
                        <div style={{ ...inter(10, 600, '14px', '#94a3b8'), letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Occupancy</div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 8 }}>
                          <span style={pjs(22, 700, '28px', '#0f172a')}>{occ}</span>
                          <span style={pjs(13, 400, '18px', '#94a3b8')}>/ {cap}</span>
                        </div>
                        <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3 }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: '#4f46e5', borderRadius: 3 }} />
                        </div>
                      </>
                    )
                  })()}
                </div>
              </div>

              {/* Today's Timetable */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <rect x="1" y="2" width="12" height="11" rx="1.5" stroke="#4f46e5" strokeWidth="1.3"/>
                      <path d="M4 1v2M10 1v2M1 5h12" stroke="#4f46e5" strokeWidth="1.3" strokeLinecap="round"/>
                    </svg>
                    <span style={pjs(13, 700, '18px', '#0f172a')}>Today's Timetable</span>
                  </div>
                  <span style={inter(10, 500, '14px', '#94a3b8')}>{new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {timetable.length === 0 ? (
                    <div style={{ padding: '10px 0', ...pjs(12, 400, '18px', '#94a3b8') }}>No classes today.</div>
                  ) : timetable.map((t, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, marginTop: 6,
                        background: t.active ? '#4f46e5' : '#cbd5e1' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                          <span style={pjs(12, t.active ? 700 : 500, '16px', t.active ? '#4f46e5' : '#0f172a')}>{t.label}</span>
                          <span style={inter(10, 400, '14px', '#94a3b8')}>{t.time}</span>
                        </div>
                        <div style={{ ...pjs(11, 400, '15px', '#64748b'), marginTop: 2 }}>{t.sub}</div>
                        {t.ongoing && (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 4,
                            background: '#eef2ff', borderRadius: 6, padding: '2px 8px' }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4f46e5' }} />
                            <span style={pjs(10, 600, '14px', '#4f46e5')}>Ongoing</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Lab Inventory */}
              {selectedRoom.type === 'LAB' && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <rect x="1" y="3" width="12" height="9" rx="1.5" stroke="#4f46e5" strokeWidth="1.3"/>
                      <path d="M4 3V2a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" stroke="#4f46e5" strokeWidth="1.3"/>
                    </svg>
                    <span style={pjs(13, 700, '18px', '#0f172a')}>Lab Inventory</span>
                  </div>
                  {[{ label: 'Workstations', val: selectedRoom.capacity || 40, valC: '#0f172a' }, { label: '4K Projector', val: 'Available', valC: '#16a34a' }].map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 0', borderTop: i === 0 ? 'none' : '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <rect x="1" y="1" width="12" height="9" rx="1.5" stroke="#64748b" strokeWidth="1.2"/>
                          <path d="M4 13h6M7 10v3" stroke="#64748b" strokeWidth="1.2" strokeLinecap="round"/>
                        </svg>
                        <span style={pjs(12, 500, '16px', '#0f172a')}>{item.label}</span>
                      </div>
                      <span style={pjs(12, 700, '16px', item.valC)}>{item.val}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Book button */}
            <div style={{ padding: '16px 20px', borderTop: '1px solid #f1f5f9' }}>
              <button style={{
                width: '100%', padding: '14px 0',
                background: '#4f46e5', borderRadius: 14, border: 'none',
                cursor: 'pointer', ...pjs(14, 700, '18px', '#ffffff'),
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#4338ca'}
              onMouseLeave={e => e.currentTarget.style.background = '#4f46e5'}
              >
                Book Slot for Tomorrow
              </button>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  )
}
