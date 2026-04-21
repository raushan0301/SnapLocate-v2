import { useState, useEffect, useMemo, useRef } from 'react'
import PageLayout from '../../components/PageLayout'
import { db } from '../../lib/firebase'
import {
  collection, getDocs,
  doc, updateDoc, getDoc, increment, onSnapshot,
} from 'firebase/firestore'

/* ─── Typography helper ─────────────────────────────────────── */
const pjs = (size, weight, lh, color) => ({
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  fontSize: size, fontWeight: weight, lineHeight: lh, color,
})

/* ─── Rated subjects cache (persisted in localStorage) ──────── */
const getRated = () => JSON.parse(localStorage.getItem('ratedSubjects') || '{}')
const setRated = map => localStorage.setItem('ratedSubjects', JSON.stringify(map))

/* ─── Inline Breadcrumb Dropdown ────────────────────────────── */
const BreadItem = ({ value, placeholder, options, onChange, disabled, isLast }) => {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = e => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const textColor = isLast ? '#3730a3' : value ? '#4f46e5' : '#9ca3af'

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => { if (!disabled) setOpen(o => !o) }}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '4px 10px 4px 4px',
          background: 'transparent', border: 'none', borderRadius: 8,
          cursor: disabled ? 'default' : 'pointer',
          ...pjs(13, isLast ? 700 : 600, '18px', textColor),
          opacity: disabled ? 0.4 : 1, transition: 'opacity 0.15s',
        }}
      >
        <span>{value || placeholder}</span>
        {!disabled && (
          <svg width="10" height="10" viewBox="0 0 10 6" fill="none"
            style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>
            <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.6"
              strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>

      {open && options.length > 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 999,
          background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 12,
          boxShadow: '0 8px 24px rgba(79,70,229,0.14)',
          minWidth: 180, maxHeight: 240, overflowY: 'auto', padding: '6px 0',
        }}>
          {options.map(opt => (
            <div
              key={opt}
              onClick={() => { onChange(opt); setOpen(false) }}
              style={{
                padding: '9px 16px',
                ...pjs(13, opt === value ? 700 : 500, '18px', opt === value ? '#4f46e5' : '#374151'),
                cursor: 'pointer',
                background: opt === value ? '#f5f3ff' : 'transparent',
                transition: 'background 0.12s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f5f3ff' }}
              onMouseLeave={e => { e.currentTarget.style.background = opt === value ? '#f5f3ff' : 'transparent' }}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── Breadcrumb separator ──────────────────────────────────── */
const Sep = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#a5b4fc" strokeWidth="2.5">
    <path d="M9 18l6-6-6-6"/>
  </svg>
)

/* ─── Resource Chip ─────────────────────────────────────────── */
const ResourceChip = ({ label, url }) => (
  <a
    href={url || '#'}
    target={url ? '_blank' : undefined}
    rel="noopener noreferrer"
    style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '5px 16px', border: '1.5px solid #93c5fd',
      borderRadius: 999, background: '#ffffff', textDecoration: 'none',
      ...pjs(13, 500, '20px', '#2563eb'),
      transition: 'all 0.15s', cursor: url ? 'pointer' : 'default',
    }}
    onMouseEnter={e => { if (url) { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.borderColor = '#3b82f6' } }}
    onMouseLeave={e => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.borderColor = '#93c5fd' }}
  >
    {label}
  </a>
)

/* ─── PYQ sub-filter pill — indigo theme ────────────────────── */
const PYQPill = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    style={{
      padding: '6px 20px', borderRadius: 999, border: 'none',
      background: active ? '#4f46e5' : '#e5e7eb',
      ...pjs(13, 600, '20px', active ? '#ffffff' : '#6b7280'),
      cursor: 'pointer', transition: 'all 0.2s',
      boxShadow: active ? '0 2px 8px rgba(79,70,229,0.25)' : 'none',
    }}
  >
    {label}
  </button>
)

/* ─── Star Rating (functional) ──────────────────────────────── */
const StarRating = ({ rating, onRate, disabled }) => {
  const [hov, setHov] = useState(0)
  return (
    <span style={{ display: 'inline-flex', gap: 3 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <span
          key={i}
          onMouseEnter={() => !disabled && setHov(i)}
          onMouseLeave={() => !disabled && setHov(0)}
          onClick={() => !disabled && onRate && onRate(i)}
          style={{
            fontSize: 20,
            cursor: disabled ? 'not-allowed' : onRate ? 'pointer' : 'default',
            color: i <= (hov || rating) ? '#f59e0b' : '#d1d5db',
            lineHeight: 1,
            transition: 'color 0.15s',
            opacity: disabled ? 0.5 : 1,
          }}
        >
          {i <= (hov || rating) ? '★' : '☆'}
        </span>
      ))}
    </span>
  )
}

/* ─── Tab names ─────────────────────────────────────────────── */
const TABS = ['Syllabus', 'Notes', 'Lab Manual', 'Tutorial', 'PYQs', 'Playlist']

/* ─── Main Page ─────────────────────────────────────────────── */
export default function Resources() {
  const [loading, setLoading] = useState(true)
  const [allDocs, setAllDocs] = useState([])

  // 4-step cascade
  const [selYear,    setSelYear]    = useState('')
  const [selSem,     setSelSem]     = useState('')
  const [selBranch,  setSelBranch]  = useState('')
  const [selSubject, setSelSubject] = useState('')

  // Content state
  const [tab,    setTab]    = useState('Syllabus')
  const [pyqCat, setPyqCat] = useState('MST')

  // Live rating/views from Firestore
  const [liveRating, setLiveRating] = useState(null)
  const [liveViews,  setLiveViews]  = useState(null)
  const [userRating, setUserRating] = useState(0)
  const [alreadyRated, setAlreadyRated] = useState(false)

  /* ── Fetch all docs ──────────────────────────────────────── */
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const snap = await getDocs(collection(db, 'academic'))
        const docs = []
        snap.forEach(d => docs.push({ id: d.id, data: d.data() }))
        setAllDocs(docs)
      } catch (err) { console.error('Resources:', err) }
      finally { setLoading(false) }
    }
    load()
  }, [])

  /* ── Filter options ──────────────────────────────────────── */
  const yearOptions = useMemo(() => {
    const s = new Set()
    allDocs.forEach(d => { if (d.data.year != null) s.add(String(d.data.year)) })
    return [...s].sort((a, b) => parseInt(a) - parseInt(b))
  }, [allDocs])

  const semOptions = useMemo(() => {
    if (!selYear) return []
    const s = new Set()
    allDocs
      .filter(d => String(d.data.year) === selYear)
      .forEach(d => { if (d.data.semester != null) s.add(String(d.data.semester)) })
    return [...s].sort((a, b) => {
      const na = parseInt(a.replace(/\D/g, ''), 10)
      const nb = parseInt(b.replace(/\D/g, ''), 10)
      return (isNaN(na) || isNaN(nb)) ? a.localeCompare(b) : na - nb
    })
  }, [allDocs, selYear])

  const branchOptions = useMemo(() => {
    if (!selYear || !selSem) return []
    const s = new Set()
    allDocs
      .filter(d => String(d.data.year) === selYear && String(d.data.semester) === selSem)
      .forEach(d => { if (d.data.branch) s.add(d.data.branch) })
    return [...s].sort()
  }, [allDocs, selYear, selSem])

  const subjectOptions = useMemo(() => {
    if (!selYear || !selSem || !selBranch) return []
    return allDocs
      .filter(d =>
        String(d.data.year)     === selYear   &&
        String(d.data.semester) === selSem    &&
        d.data.branch           === selBranch
      )
      .map(d => d.data.subject || d.id)
      .filter(Boolean)
      .sort()
  }, [allDocs, selYear, selSem, selBranch])

  /* ── Active doc ──────────────────────────────────────────── */
  const activeDoc = useMemo(() => {
    if (!selSubject) return null
    return allDocs.find(d =>
      String(d.data.year)      === selYear   &&
      String(d.data.semester)  === selSem    &&
      d.data.branch            === selBranch &&
      (d.data.subject || d.id) === selSubject
    ) || null
  }, [allDocs, selYear, selSem, selBranch, selSubject])

  /* ── On subject open: increment views + live snapshot ───── */
  useEffect(() => {
    if (!activeDoc) {
      setLiveRating(null); setLiveViews(null); setUserRating(0); setAlreadyRated(false)
      return
    }

    const docRef = doc(db, 'academic', activeDoc.id)

    // Increment view count
    updateDoc(docRef, { views: increment(1) }).catch(console.error)

    // Check if already rated
    const rated = getRated()
    setAlreadyRated(!!rated[activeDoc.id])
    setUserRating(rated[activeDoc.id] ? rated[activeDoc.id] : 0)

    // Live snapshot for rating + views
    const unsub = onSnapshot(docRef, snap => {
      const d = snap.data() || {}
      setLiveRating(typeof d.rating === 'number' ? d.rating : null)
      setLiveViews(d.views ?? null)
    })
    return () => unsub()
  }, [activeDoc?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Submit star rating ──────────────────────────────────── */
  const handleRate = async (stars) => {
    if (!activeDoc || alreadyRated) return
    const ok = window.confirm(`Submit your ${stars}★ rating?`)
    if (!ok) return

    try {
      const docRef = doc(db, 'academic', activeDoc.id)
      const snap   = await getDoc(docRef)
      const d      = snap.data() || {}
      const newCount  = (d.ratingCount || 0) + 1
      const newRating = ((d.rating || 0) * (newCount - 1) + stars) / newCount

      await updateDoc(docRef, { rating: newRating, ratingCount: newCount })

      const rated = getRated()
      rated[activeDoc.id] = stars
      setRated(rated)
      setUserRating(stars)
      setAlreadyRated(true)
    } catch (err) {
      console.error('Rating error:', err)
    }
  }

  /* ── Reset cascade ───────────────────────────────────────── */
  const handleYearChange    = v => { setSelYear(v);   setSelSem('');    setSelBranch('');  setSelSubject(''); setTab('Syllabus') }
  const handleSemChange     = v => { setSelSem(v);    setSelBranch(''); setSelSubject(''); setTab('Syllabus') }
  const handleBranchChange  = v => { setSelBranch(v); setSelSubject(''); setTab('Syllabus') }
  const handleSubjectChange = v => { setSelSubject(v); setTab('Syllabus') }

  /* ── Derived content ─────────────────────────────────────── */
  const docData     = activeDoc?.data || {}
  const contributor = docData.contributor || 'Unknown'
  const displayRating = liveRating !== null ? liveRating.toFixed(1) : (typeof docData.rating === 'number' ? docData.rating.toFixed(1) : '0.0')
  const displayViews  = liveViews  !== null ? liveViews  : (docData.views || 0)

  const arr = v => (Array.isArray(v) && v.length > 0 ? v : [])

  const tabItems = useMemo(() => {
    if (tab === 'Syllabus')   return arr(docData.syllabus)
    if (tab === 'Notes')      return arr(docData.notes)
    if (tab === 'Lab Manual') return arr(docData.labManual)
    if (tab === 'Tutorial')   return arr(docData.tutorial)
    if (tab === 'Playlist')   return arr(docData.playlist)
    return []
  }, [tab, docData])

  const pyqItems = useMemo(() => {
    if (!docData.pyq) return []
    const map = { MST: docData.pyq.mst, EST: docData.pyq.est, AUXI: docData.pyq.auxi }
    return arr(map[pyqCat])
  }, [pyqCat, docData])

  const items = tab === 'PYQs' ? pyqItems : tabItems

  /* ── Render ──────────────────────────────────────────────── */
  return (
    <PageLayout>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ ...pjs(24, 700, '32px', '#0f172a'), margin: '0 0 6px 0' }}>
          Academic Resources
        </h1>
        <p style={{ ...pjs(14, 400, '22px', '#64748b'), margin: 0 }}>
          Review and rate academic content to help fellow Thapar students choose the best resources.
        </p>
      </div>

      {loading ? (
        <div style={{ padding: '60px 0', textAlign: 'center' }}>
          <span style={pjs(14, 500, '22px', '#94a3b8')}>Synchronizing with Academic Cloud…</span>
        </div>
      ) : (
        <div style={{
          background: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 2px 16px rgba(79,70,229,0.08)',
          width: '100%',
        }}>

          {/* ── Breadcrumb nav ── */}
          <div style={{
            background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 60%, #e0e7ff 100%)',
            padding: '14px 24px',
            display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
          }}>
            <BreadItem value={selYear}    placeholder="-- Year --"     options={yearOptions}    onChange={handleYearChange}    disabled={false}       isLast={false} />
            <Sep />
            <BreadItem value={selSem}     placeholder="-- Semester --" options={semOptions}     onChange={handleSemChange}     disabled={!selYear}    isLast={false} />
            <Sep />
            <BreadItem value={selBranch}  placeholder="-- Branch --"   options={branchOptions}  onChange={handleBranchChange}  disabled={!selSem}     isLast={false} />
            <Sep />
            <BreadItem value={selSubject} placeholder="-- Subject --"  options={subjectOptions} onChange={handleSubjectChange} disabled={!selBranch}  isLast={true}  />
          </div>

          {selSubject && activeDoc ? (
            <>
              {/* ── Hero banner ── */}
              <div style={{
                background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 55%, #e0e7ff 100%)',
                padding: '20px 24px 24px',
                display: 'flex', alignItems: 'center', gap: 20,
                position: 'relative', overflow: 'hidden',
                borderTop: '1px solid rgba(165,180,252,0.3)',
              }}>
                <div style={{
                  position: 'absolute', right: -40, top: -40,
                  width: 200, height: 200, borderRadius: '50%',
                  background: 'rgba(167,139,250,0.12)', pointerEvents: 'none',
                }} />
                <div style={{
                  width: 60, height: 60, borderRadius: 14, background: '#ffffff',
                  boxShadow: '0 4px 16px rgba(79,70,229,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="1.8">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                  </svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                    <h2 style={{ ...pjs(22, 700, '30px', '#1e1b4b'), margin: 0 }}>{selSubject}</h2>
                    <span style={{
                      padding: '3px 12px', borderRadius: 999,
                      background: '#ede9fe', ...pjs(12, 600, '18px', '#6d28d9'),
                    }}>Core Subject</span>
                  </div>
                  <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, ...pjs(13, 500, '18px', '#4b5563') }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                      Contributor: {contributor}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, ...pjs(13, 500, '18px', '#059669') }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="8 12 11 15 16 10"/>
                      </svg>
                      Resource Health: Available
                    </span>
                  </div>
                </div>
              </div>

              {/* ── Tab bar ── */}
              <div style={{
                display: 'flex', borderBottom: '1px solid #e5e7eb',
                padding: '0 8px', background: '#ffffff', overflowX: 'auto',
              }}>
                {TABS.map(t => (
                  <button key={t} onClick={() => setTab(t)} style={{
                    flexShrink: 0, padding: '13px 16px', border: 'none',
                    borderBottom: tab === t ? '2.5px solid #4f46e5' : '2.5px solid transparent',
                    background: 'transparent',
                    ...pjs(14, tab === t ? 700 : 400, '20px', tab === t ? '#4f46e5' : '#6b7280'),
                    cursor: 'pointer', transition: 'color 0.15s', marginBottom: -1,
                  }}>
                    {t}
                  </button>
                ))}
              </div>

              {/* ── Content ── */}
              <div style={{ padding: '20px 24px 4px', minHeight: 80 }}>
                {tab === 'PYQs' && (
                  <div style={{ marginBottom: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {['MST', 'EST', 'AUXI'].map(c => (
                      <PYQPill key={c} label={c} active={pyqCat === c} onClick={() => setPyqCat(c)} />
                    ))}
                  </div>
                )}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {items.length === 0 ? (
                    <p style={{ ...pjs(13, 400, '20px', '#9ca3af'), padding: '4px 0 12px' }}>
                      No content available.
                    </p>
                  ) : items.map((item, i) => (
                    <ResourceChip key={i} label={item.name} url={item.url} />
                  ))}
                </div>
              </div>

              {/* ── Footer: live Rating | live Views | Rate ── */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 36,
                padding: '14px 24px 20px', marginTop: 12,
                borderTop: '1px solid #f3f4f6',
              }}>
                {/* Rating */}
                <div>
                  <div style={{ ...pjs(11, 500, '15px', '#9ca3af'), marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rating</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={pjs(17, 700, '22px', '#111827')}>{displayRating}</span>
                    <span style={{ fontSize: 16 }}>⭐</span>
                  </div>
                </div>

                {/* Views */}
                <div>
                  <div style={{ ...pjs(11, 500, '15px', '#9ca3af'), marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Views</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                    <span style={pjs(17, 700, '22px', '#111827')}>{displayViews}</span>
                  </div>
                </div>

                {/* Rate */}
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={pjs(14, 700, '20px', '#111827')}>Rate:</span>
                  <StarRating
                    rating={userRating}
                    onRate={alreadyRated ? null : handleRate}
                    disabled={alreadyRated}
                  />
                  {alreadyRated && (
                    <span style={{ ...pjs(12, 500, '16px', '#6b7280'), marginLeft: 4 }}>
                      (already rated)
                    </span>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div style={{ padding: '60px 32px', textAlign: 'center', background: '#ffffff' }}>
              <div style={{ fontSize: 38, marginBottom: 14 }}>📚</div>
              <p style={{ ...pjs(15, 600, '22px', '#374151'), marginBottom: 6 }}>
                Select a subject to view resources
              </p>
              <p style={{ ...pjs(13, 400, '20px', '#9ca3af') }}>
                Click the breadcrumb above: Year → Semester → Branch → Subject
              </p>
            </div>
          )}
        </div>
      )}
    </PageLayout>
  )
}
