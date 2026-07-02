import { useState, useEffect, useMemo, useRef } from 'react'
import PageLayout from '../../components/PageLayout'
import { db } from '../../lib/firebase'
import {
  collection, getDocs,
  doc, updateDoc, getDoc, increment, onSnapshot,
} from 'firebase/firestore'

const getRated = () => JSON.parse(localStorage.getItem('ratedSubjects') || '{}')
const setRated = map => localStorage.setItem('ratedSubjects', JSON.stringify(map))

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

  const textCls = isLast ? 'text-[#3730a3] font-bold' : value ? 'text-brand font-semibold' : 'text-slate-400 font-semibold'

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => { if (!disabled) setOpen(o => !o) }}
        className={`inline-flex items-center gap-[5px] px-1 pr-2.5 py-1 bg-transparent border-none rounded-lg text-[13px] leading-[18px] transition-opacity ${disabled ? 'opacity-40 cursor-default' : 'cursor-pointer'} ${textCls}`}
      >
        <span>{value || placeholder}</span>
        {!disabled && (
          <svg width="10" height="10" viewBox="0 0 10 6" fill="none"
            className={`shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
            <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.6"
              strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>

      {open && options.length > 0 && (
        <div className="absolute top-[calc(100%+6px)] left-0 z-[999] bg-white border border-slate-200 rounded-xl shadow-[0_8px_24px_rgba(79,70,229,0.14)] min-w-[180px] max-h-60 overflow-y-auto py-1.5">
          {options.map(opt => (
            <div
              key={opt}
              onClick={() => { onChange(opt); setOpen(false) }}
              className={`px-4 py-[9px] text-[13px] leading-[18px] cursor-pointer transition-colors hover:bg-violet-50 ${opt === value ? 'font-bold text-brand bg-violet-50' : 'font-medium text-slate-700'}`}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const Sep = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#a5b4fc" strokeWidth="2.5">
    <path d="M9 18l6-6-6-6"/>
  </svg>
)

const ResourceChip = ({ label, url }) => (
  <a
    href={url || '#'}
    target={url ? '_blank' : undefined}
    rel="noopener noreferrer"
    className={`inline-flex items-center px-4 py-[5px] border-[1.5px] border-blue-300 rounded-full bg-white no-underline text-[13px] font-medium leading-5 text-blue-600 transition-all ${url ? 'cursor-pointer hover:bg-blue-50 hover:border-blue-500' : 'cursor-default'}`}
  >
    {label}
  </a>
)

const PYQPill = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-5 py-1.5 rounded-full border-none text-[13px] font-semibold leading-5 cursor-pointer transition-all ${active ? 'bg-brand text-white shadow-[0_2px_8px_rgba(79,70,229,0.25)]' : 'bg-slate-200 text-slate-500'}`}
  >
    {label}
  </button>
)

const StarRating = ({ rating, onRate, disabled }) => {
  const [hov, setHov] = useState(0)
  return (
    <span className="inline-flex gap-[3px]">
      {[1, 2, 3, 4, 5].map(i => (
        <span
          key={i}
          onMouseEnter={() => !disabled && setHov(i)}
          onMouseLeave={() => !disabled && setHov(0)}
          onClick={() => !disabled && onRate && onRate(i)}
          className={`text-[20px] leading-none transition-colors ${i <= (hov || rating) ? 'text-amber-400' : 'text-slate-300'} ${disabled ? 'opacity-50 cursor-not-allowed' : onRate ? 'cursor-pointer' : 'cursor-default'}`}
        >
          {i <= (hov || rating) ? '★' : '☆'}
        </span>
      ))}
    </span>
  )
}

const TABS = ['Syllabus', 'Notes', 'Lab Manual', 'Tutorial', 'PYQs', 'Playlist']

export default function Resources() {
  const [loading, setLoading] = useState(true)
  const [allDocs, setAllDocs] = useState([])

  const [selYear,    setSelYear]    = useState('')
  const [selSem,     setSelSem]     = useState('')
  const [selBranch,  setSelBranch]  = useState('')
  const [selSubject, setSelSubject] = useState('')

  const [tab,    setTab]    = useState('Syllabus')
  const [pyqCat, setPyqCat] = useState('MST')

  const [liveRating, setLiveRating] = useState(null)
  const [liveViews,  setLiveViews]  = useState(null)
  const [userRating, setUserRating] = useState(0)
  const [alreadyRated, setAlreadyRated] = useState(false)

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

  const activeDoc = useMemo(() => {
    if (!selSubject) return null
    return allDocs.find(d =>
      String(d.data.year)      === selYear   &&
      String(d.data.semester)  === selSem    &&
      d.data.branch            === selBranch &&
      (d.data.subject || d.id) === selSubject
    ) || null
  }, [allDocs, selYear, selSem, selBranch, selSubject])

  useEffect(() => {
    if (!activeDoc) {
      setLiveRating(null); setLiveViews(null); setUserRating(0); setAlreadyRated(false)
      return
    }
    const docRef = doc(db, 'academic', activeDoc.id)
    updateDoc(docRef, { views: increment(1) }).catch(console.error)
    const rated = getRated()
    setAlreadyRated(!!rated[activeDoc.id])
    setUserRating(rated[activeDoc.id] ? rated[activeDoc.id] : 0)
    const unsub = onSnapshot(docRef, snap => {
      const d = snap.data() || {}
      setLiveRating(typeof d.rating === 'number' ? d.rating : null)
      setLiveViews(d.views ?? null)
    })
    return () => unsub()
  }, [activeDoc?.id]) // eslint-disable-line react-hooks/exhaustive-deps

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
    } catch (err) { console.error('Rating error:', err) }
  }

  const handleYearChange    = v => { setSelYear(v);   setSelSem('');    setSelBranch('');  setSelSubject(''); setTab('Syllabus') }
  const handleSemChange     = v => { setSelSem(v);    setSelBranch(''); setSelSubject(''); setTab('Syllabus') }
  const handleBranchChange  = v => { setSelBranch(v); setSelSubject(''); setTab('Syllabus') }
  const handleSubjectChange = v => { setSelSubject(v); setTab('Syllabus') }

  const docData       = activeDoc?.data || {}
  const contributor   = docData.contributor || 'Unknown'
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

  return (
    <PageLayout>
      <div className="mb-7">
        <h1 className="t-heading-xl t-primary m-0 mb-1.5">Academic Resources</h1>
        <p className="t-base t-muted m-0">
          Review and rate academic content to help fellow Thapar students choose the best resources.
        </p>
      </div>

      {loading ? (
        <div className="py-16 text-center">
          <span className="t-base font-medium text-slate-400">Synchronizing with Academic Cloud…</span>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-[0_2px_16px_rgba(79,70,229,0.08)] w-full">

          {/* Breadcrumb nav */}
          <div className="flex items-center gap-1.5 flex-wrap px-6 py-3.5"
            style={{ background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 60%, #e0e7ff 100%)' }}>
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
              {/* Hero banner */}
              <div className="relative overflow-hidden px-6 py-5 pb-6 flex items-center gap-5 border-t border-[rgba(165,180,252,0.3)]"
                style={{ background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 55%, #e0e7ff 100%)' }}>
                <div className="absolute -right-10 -top-10 w-[200px] h-[200px] rounded-full pointer-events-none"
                  style={{ background: 'rgba(167,139,250,0.12)' }} />
                <div className="w-[60px] h-[60px] rounded-[14px] bg-white shadow-[0_4px_16px_rgba(79,70,229,0.12)] flex items-center justify-center shrink-0">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="1.8">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 mb-2 flex-wrap">
                    <h2 className="text-[22px] font-bold leading-[30px] text-[#1e1b4b] m-0">{selSubject}</h2>
                    <span className="px-3 py-[3px] rounded-full bg-[#ede9fe] text-[12px] font-semibold leading-[18px] text-[#6d28d9]">Core Subject</span>
                  </div>
                  <div className="flex gap-5 flex-wrap items-center">
                    <span className="flex items-center gap-[5px] text-[13px] font-medium leading-[18px] text-slate-600">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                      Contributor: {contributor}
                    </span>
                    <span className="flex items-center gap-[5px] text-[13px] font-medium leading-[18px] text-emerald-600">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="8 12 11 15 16 10"/>
                      </svg>
                      Resource Health: Available
                    </span>
                  </div>
                </div>
              </div>

              {/* Tab bar */}
              <div className="flex border-b border-slate-200 px-2 bg-white overflow-x-auto">
                {TABS.map(t => (
                  <button key={t} onClick={() => setTab(t)}
                    className={`shrink-0 px-4 py-[13px] border-none bg-transparent text-[14px] leading-5 cursor-pointer transition-colors duration-150 -mb-px ${tab === t ? 'font-bold text-brand border-b-[2.5px] border-b-brand' : 'font-normal text-slate-500 border-b-[2.5px] border-b-transparent'}`}>
                    {t}
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="px-6 pt-5 pb-1 min-h-[80px]">
                {tab === 'PYQs' && (
                  <div className="mb-3.5 flex gap-2 flex-wrap">
                    {['MST', 'EST', 'AUXI'].map(c => (
                      <PYQPill key={c} label={c} active={pyqCat === c} onClick={() => setPyqCat(c)} />
                    ))}
                  </div>
                )}
                <div className="flex flex-wrap gap-2.5">
                  {items.length === 0 ? (
                    <p className="text-[13px] font-normal leading-5 text-slate-400 py-1 pb-3 m-0">
                      No content available.
                    </p>
                  ) : items.map((item, i) => (
                    <ResourceChip key={i} label={item.name} url={item.url} />
                  ))}
                </div>
              </div>

              {/* Footer: Rating | Views | Rate */}
              <div className="flex items-center gap-9 px-6 pt-3.5 pb-5 mt-3 border-t border-slate-100 flex-wrap">
                <div>
                  <div className="text-[11px] font-medium leading-[15px] text-slate-400 mb-[3px] uppercase tracking-[0.05em]">Rating</div>
                  <div className="flex items-center gap-[5px]">
                    <span className="text-[17px] font-bold leading-[22px] text-slate-900">{displayRating}</span>
                    <span className="text-[16px]">⭐</span>
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-medium leading-[15px] text-slate-400 mb-[3px] uppercase tracking-[0.05em]">Views</div>
                  <div className="flex items-center gap-[5px]">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                    <span className="text-[17px] font-bold leading-[22px] text-slate-900">{displayViews}</span>
                  </div>
                </div>

                <div className="ml-auto flex items-center gap-2.5 flex-wrap">
                  <span className="text-[14px] font-bold leading-5 text-slate-900">Rate:</span>
                  <StarRating
                    rating={userRating}
                    onRate={alreadyRated ? null : handleRate}
                    disabled={alreadyRated}
                  />
                  {alreadyRated && (
                    <span className="text-[12px] font-medium leading-4 text-slate-500 ml-1">(already rated)</span>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="py-16 px-8 text-center bg-white">
              <div className="text-[38px] mb-3.5">📚</div>
              <p className="text-[15px] font-semibold leading-[22px] text-slate-700 mb-1.5 m-0">
                Select a subject to view resources
              </p>
              <p className="text-[13px] font-normal leading-5 text-slate-400 m-0">
                Click the breadcrumb above: Year → Semester → Branch → Subject
              </p>
            </div>
          )}
        </div>
      )}
    </PageLayout>
  )
}
