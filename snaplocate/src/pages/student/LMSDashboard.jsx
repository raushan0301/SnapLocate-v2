import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'
import {
  BookOpen, RefreshCw, Settings, Link2, Unlink, AlertCircle,
  ChevronDown, ArrowRight, BookMarked, GraduationCap,
  Layers, FlaskConical, Binary, Calculator, Cpu,
} from 'lucide-react'

// ─── Department → gradient map ─────────────────────────────────
const DEPT_GRADIENTS = {
  'CSE':  'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0d3b6e 100%)',
  'ECE':  'linear-gradient(135deg, #0a1628 0%, #1a2e52 50%, #0e2a50 100%)',
  'EE':   'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
  'ME':   'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
  'CE':   'linear-gradient(135deg, #0d0d0d 0%, #2c3e50 50%, #3d5a80 100%)',
  'MATH': 'linear-gradient(135deg, #1a0533 0%, #2d0945 50%, #0d1b2a 100%)',
  'PHY':  'linear-gradient(135deg, #0b132b 0%, #1c2541 50%, #3a506b 100%)',
  'CHEM': 'linear-gradient(135deg, #1d2b3a 0%, #2c3e50 50%, #1a3a4a 100%)',
  'DEFAULT': 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
}

const DEPT_ICONS = {
  'CSE': Binary, 'ECE': Cpu, 'EE': Cpu, 'ME': Layers,
  'CE': Layers, 'MATH': Calculator, 'PHY': FlaskConical,
  'CHEM': FlaskConical, 'DEFAULT': BookOpen,
}

function getDeptKey(dept = '') {
  const d = dept.toUpperCase()
  if (d.includes('COMPUTER') || d.includes('CSE')) return 'CSE'
  if (d.includes('ELECTRONICS') || d.includes('ECE')) return 'ECE'
  if (d.includes('ELECTRICAL') || d.includes('EE')) return 'EE'
  if (d.includes('MECHANICAL') || d.includes('ME')) return 'ME'
  if (d.includes('CIVIL') || d.includes('CE')) return 'CE'
  if (d.includes('MATH') || d.includes('UMA')) return 'MATH'
  if (d.includes('PHYSICS') || d.includes('PHY')) return 'PHY'
  if (d.includes('CHEM')) return 'CHEM'
  return 'DEFAULT'
}

function cleanDisplayName(raw = '') {
  const s = raw
    .replace(/-\d{4}(?:EVE|ODD|EVEN)SEM\s*$/i, '')
    .replace(/-[A-Z]{2,4}\d{3,4}[A-Z0-9]*\s*$/i, '\n')
    .replace(/-\d{4}\s*$/i, '')
    .trim()
  return s.split('\n')[0].trim().toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
}

function cleanCode(course) {
  const raw = course.code || course.shortname || ''
  return raw.replace(/-\d{4}(?:EVE|ODD|EVEN)SEM$/i, '').trim()
}

function TechPatternOverlay({ deptKey }) {
  const DeptIcon = DEPT_ICONS[deptKey] || BookOpen
  return (
    <div className="absolute inset-0 overflow-hidden">
      <svg className="absolute inset-0 w-full h-full opacity-[0.12]" viewBox="0 0 200 120" preserveAspectRatio="xMidYMid slice">
        {[20, 40, 60, 80, 100].map(y => <line key={y} x1="0" y1={y} x2="200" y2={y} stroke="#7dd3fc" strokeWidth="0.5" />)}
        {[30, 60, 90, 120, 150, 180].map(x => <line key={x} x1={x} y1="0" x2={x} y2="120" stroke="#7dd3fc" strokeWidth="0.5" />)}
        {[[30,20],[60,40],[90,60],[120,20],[150,80],[60,80],[90,100],[150,40]].map(([cx,cy],i) => (
          <circle key={i} cx={cx} cy={cy} r="2.5" fill="#38bdf8" opacity="0.8" />
        ))}
        <polyline points="30,20 60,20 60,40"   fill="none" stroke="#38bdf8" strokeWidth="0.8" opacity="0.6" />
        <polyline points="90,60 90,80 120,80"  fill="none" stroke="#38bdf8" strokeWidth="0.8" opacity="0.6" />
        <polyline points="150,40 150,80"        fill="none" stroke="#38bdf8" strokeWidth="0.8" opacity="0.6" />
        <polyline points="30,80 60,80"          fill="none" stroke="#38bdf8" strokeWidth="0.8" opacity="0.5" />
      </svg>
      <div className="absolute rounded-full" style={{ bottom: -30, right: -20, width: 120, height: 120, background: 'radial-gradient(circle, rgba(99,102,241,0.4) 0%, transparent 70%)' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-2xl flex items-center justify-center backdrop-blur-sm bg-white/[0.08] border border-white/[0.15]">
        <DeptIcon size={26} color="rgba(255,255,255,0.85)" />
      </div>
    </div>
  )
}

const DEFAULT_MOODLE_URL = 'https://lms.thapar.edu/moodle/login/index.php'

function SyncBar() {
  const [config, setConfig]       = useState(null)
  const [loading, setLoading]     = useState(true)
  const [showForm, setShowForm]   = useState(false)
  const [form, setForm]           = useState({ provider: 'moodle', base_url: DEFAULT_MOODLE_URL, username: '', password: '' })
  const [saving, setSaving]       = useState(false)
  const [syncing, setSyncing]     = useState(false)
  const [syncElapsed, setSyncElapsed] = useState(0)
  const [toast, setToast]         = useState('')
  const [unlinkConfirm, setUnlinkConfirm] = useState(false)
  const pollRef = useRef(null)
  const timerRef = useRef(null)

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3500) }

  const load = useCallback(async () => {
    try {
      const res = await api.get('/api/student-sync/status')
      if (res.success) { setConfig(res.data); return res.data }
    } catch {}
    return null
  }, [])

  useEffect(() => { load().finally(() => setLoading(false)) }, [load])
  useEffect(() => () => {
    if (pollRef.current) clearInterval(pollRef.current)
    if (timerRef.current) clearInterval(timerRef.current)
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await api.post('/api/student-sync/config', form)
      if (res.success) { setConfig(res.data); setShowForm(false); showToast('Credentials saved') }
      else showToast(res.error || 'Save failed')
    } catch (err) { showToast(err?.message || 'Save failed') }
    finally { setSaving(false) }
  }

  const handleSync = async () => {
    setSyncing(true); setSyncElapsed(0)
    const prevSyncedAt = config?.last_synced_at || null
    try { await api.post('/api/student-sync/trigger', {}) }
    catch (err) { showToast(err?.message || 'Sync failed'); setSyncing(false); return }

    timerRef.current = setInterval(() => setSyncElapsed(p => p + 1), 1000)
    let attempts = 0
    pollRef.current = setInterval(async () => {
      attempts++
      const latest = await load()
      const done = latest && latest.last_synced_at && latest.last_synced_at !== prevSyncedAt
      if (done || attempts >= 100) {
        clearInterval(pollRef.current); pollRef.current = null
        clearInterval(timerRef.current); timerRef.current = null
        setSyncing(false); setSyncElapsed(0)
        if (done) { showToast(`Sync complete — ${latest.last_sync_status}`); window.location.reload() }
        else showToast('Sync timed out. Check back in a moment.')
      }
    }, 3000)
  }

  const handleDisconnect = async () => {
    setUnlinkConfirm(false)
    try { await api.delete('/api/student-sync/config'); setConfig(null); showToast('LMS disconnected') }
    catch { showToast('Failed to disconnect') }
  }

  if (loading) return null
  const connected = !!config
  const st = config?.last_sync_status || 'never'
  const statusColorClass = { success: 'text-success', failed: 'text-danger', partial: 'text-warning', never: 'text-ink-subtle' }

  return (
    <>
      {/* Unlink confirm modal */}
      {unlinkConfirm && (
        <div className="fixed inset-0 z-[1000] bg-ink/55 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white rounded-[20px] p-8 max-w-[420px] w-full shadow-[0_24px_80px_rgba(0,0,0,0.2)] text-center" style={{ animation: 'dropIn 0.2s ease' }}>
            <div className="w-14 h-14 rounded-2xl bg-danger-light border-2 border-danger-border flex items-center justify-center mx-auto mb-[18px]">
              <Unlink size={24} className="text-danger" />
            </div>
            <div className="t-heading-xl t-primary mb-2.5">Unlink Moodle?</div>
            <div className="t-base t-secondary mb-6 leading-[22px]">
              This will remove your saved Moodle credentials and stop automatic syncing.
              Your existing courses and data will remain in SnapLocate.
            </div>
            <div className="flex gap-2.5">
              <button onClick={() => setUnlinkConfirm(false)} className="flex-1 py-2.5 px-5 rounded-xl border border-ink-border bg-white cursor-pointer t-md font-semibold t-muted">Cancel</button>
              <button onClick={handleDisconnect} className="flex-1 py-2.5 px-5 rounded-xl border-none bg-danger text-white cursor-pointer t-md font-bold shadow-[0_4px_12px_rgba(220,38,38,0.3)]">Yes, Unlink</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[999] bg-ink text-white px-5 py-3 rounded-xl t-md font-semibold shadow-[0_8px_24px_rgba(0,0,0,0.3)]" style={{ animation: 'slideUp 0.25s ease' }}>
          {toast}
        </div>
      )}

      {/* Moodle bar */}
      <div className={`rounded-2xl px-5 py-4 flex items-center justify-between flex-wrap gap-3 border-[1.5px] ${connected ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-300' : 'bg-gradient-to-br from-amber-50 to-yellow-100 border-amber-200'}`}>
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-[10px] flex items-center justify-center border ${connected ? 'bg-green-100 border-green-300' : 'bg-yellow-100 border-amber-200'}`}>
            {connected ? <Link2 size={16} className="text-success" /> : <AlertCircle size={16} className="text-warning" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="t-md font-bold t-primary">
                {connected ? 'Moodle Connected' : 'Connect Your LMS'}
              </span>
              {connected && (
                <span className={`text-[10px] font-bold bg-white px-2 py-0.5 rounded-md capitalize ${statusColorClass[st]}`}>{st}</span>
              )}
            </div>
            <div className="t-xs t-secondary">
              {connected
                ? `Last synced: ${config.last_synced_at
                    ? new Date(config.last_synced_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                    : 'Never'}`
                : 'Sync your Moodle courses, assignments and materials automatically.'}
            </div>
          </div>
        </div>

        <div className="flex gap-2 items-center">
          {connected ? (
            <>
              <button onClick={handleSync} disabled={syncing}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-[10px] border-none t-md font-bold transition-colors ${syncing ? 'bg-slate-200 text-ink-subtle cursor-not-allowed' : 'bg-brand text-white cursor-pointer'}`}>
                <RefreshCw size={13} className={syncing ? 'animate-spin' : ''} />
                {syncing ? `Syncing… ${Math.floor(syncElapsed / 60)}:${String(syncElapsed % 60).padStart(2, '0')}` : 'Sync Now'}
              </button>
              <button onClick={() => setShowForm(f => !f)}
                className="p-2 rounded-[10px] border border-ink-border bg-white cursor-pointer flex items-center gap-1 t-md font-semibold t-muted">
                <Settings size={13} />
              </button>
              <button onClick={() => setUnlinkConfirm(true)} title="Disconnect Moodle"
                className="p-2 rounded-[10px] border border-danger-border bg-white cursor-pointer flex items-center gap-1 t-md font-semibold text-danger">
                <Unlink size={13} />
              </button>
            </>
          ) : (
            <button onClick={() => setShowForm(f => !f)}
              className="flex items-center gap-1.5 px-[18px] py-2 rounded-[10px] border-none bg-brand text-white t-md font-bold cursor-pointer">
              <Link2 size={14} /> Connect Moodle
            </button>
          )}
        </div>
      </div>

      {/* Sync progress */}
      {syncing && (
        <div className="px-5 py-4 rounded-[14px] bg-gradient-to-br from-brand-light to-brand-soft border border-[#c7d2fe]">
          <div className="flex items-center gap-3.5 mb-3">
            <div className="w-9 h-9 rounded-[10px] bg-brand flex items-center justify-center shrink-0">
              <RefreshCw size={16} className="text-white animate-spin" />
            </div>
            <div className="flex-1">
              <div className="t-md font-bold text-[#1e1b4b]">Syncing your Moodle data…</div>
              <div className="t-xs font-medium text-brand">
                {syncElapsed < 5  ? 'Authenticating with Moodle...' :
                 syncElapsed < 12 ? 'Fetching your enrolled courses...' :
                 syncElapsed < 25 ? 'Loading assignments, announcements & materials...' :
                 syncElapsed < 45 ? 'Saving data to SnapLocate...' :
                 'Wrapping up, almost done...'}
              </div>
            </div>
            <div className="text-xl font-extrabold text-brand tabular-nums shrink-0">
              {Math.floor(syncElapsed / 60)}:{String(syncElapsed % 60).padStart(2, '0')}
            </div>
          </div>
          <div className="h-1.5 rounded-full bg-[#c7d2fe] overflow-hidden">
            <div
              className="h-full rounded-full transition-[width] duration-1000 ease-out"
              style={{
                background: 'linear-gradient(90deg, #4f46e5, #6366f1, #818cf8)',
                width: `${Math.min(95, syncElapsed < 5 ? syncElapsed * 4 : syncElapsed < 12 ? 20 + (syncElapsed - 5) * 4 : syncElapsed < 25 ? 48 + (syncElapsed - 12) * 2 : syncElapsed < 45 ? 74 + (syncElapsed - 25) * 0.8 : Math.min(95, 90 + (syncElapsed - 45) * 0.1))}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Connect form */}
      {showForm && (
        <div className="bg-white rounded-2xl p-5 border border-ink-border shadow-[0_4px_16px_rgba(0,0,0,0.06)] flex flex-col gap-3.5">
          <div className="t-md font-bold t-primary">Moodle Credentials</div>
          <div>
            <label className="t-label-md t-light block mb-1.5">Moodle URL</label>
            <input
              type="url" value={form.base_url}
              onChange={e => setForm(p => ({ ...p, base_url: e.target.value }))}
              placeholder={DEFAULT_MOODLE_URL}
              className="input"
            />
            <div className="t-xs t-subtle mt-1">Pre-filled with Thapar's Moodle URL — change only if needed</div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="t-label-md t-light block mb-1.5">Username</label>
              <input type="text" value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))} className="input" />
            </div>
            <div>
              <label className="t-label-md t-light block mb-1.5">Password</label>
              <input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} className="input" />
            </div>
          </div>
          <div className="flex gap-2.5">
            <button onClick={handleSave} disabled={saving}
              className={`px-5 py-2.5 rounded-[10px] border-none text-white t-md font-bold ${saving ? 'bg-slate-200 cursor-not-allowed' : 'bg-brand cursor-pointer'}`}>
              {saving ? 'Saving...' : 'Save & Connect'}
            </button>
            <button onClick={() => setShowForm(false)}
              className="px-5 py-2.5 rounded-[10px] border border-ink-border bg-white cursor-pointer t-md font-semibold t-muted">
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  )
}

function SessionDropdown({ value, onChange, sessions = [] }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const allSessions = ['ALL', ...sessions]

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-2 px-4 py-2 rounded-[40px] border-[1.5px] cursor-pointer transition-all t-md font-bold ${open ? 'bg-brand border-brand text-white' : 'bg-surface-muted border-ink-border t-primary hover:bg-brand-light hover:border-brand-border'}`}
      >
        <GraduationCap size={15} className={open ? 'text-white' : 'text-brand'} />
        {value === 'ALL' ? 'All Sessions' : value}
        <ChevronDown size={14} className={`transition-transform duration-200 ${open ? 'text-white rotate-180' : 't-secondary'}`} />
      </button>

      {open && (
        <div className="absolute top-[calc(100%+8px)] right-0 bg-white border border-ink-border rounded-[14px] shadow-[0_8px_32px_rgba(0,0,0,0.12)] min-w-[200px] z-[200] overflow-hidden" style={{ animation: 'dropIn 0.2s ease' }}>
          <div className="px-3 pt-2 pb-1 t-xs font-extrabold t-subtle uppercase tracking-[0.08em]">Filter by Session</div>
          {allSessions.length <= 1 ? (
            <div className="px-4 py-3 t-md t-subtle">No sessions found</div>
          ) : allSessions.map(s => (
            <button key={s} onClick={() => { onChange(s); setOpen(false) }}
              className={`w-full text-left px-4 py-2.5 border-none cursor-pointer flex items-center gap-2.5 transition-colors t-md ${value === s ? 'bg-brand-light font-bold text-brand' : 'bg-transparent font-medium t-primary hover:bg-surface-muted'}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${value === s ? 'bg-brand' : 'bg-transparent'}`} />
              {s === 'ALL' ? 'All Sessions' : s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function CourseCard({ course }) {
  const dept     = course.dept || course.department || ''
  const deptKey  = getDeptKey(dept)
  const progress = course.progress ?? 0

  const displayName = cleanDisplayName(course.name || course.fullname || '')
  const displayCode = cleanCode(course)

  const progressGrad =
    progress >= 75 ? 'linear-gradient(90deg, #4f46e5, #6366f1)' :
    progress >= 40 ? 'linear-gradient(90deg, #4f46e5, #818cf8)' :
                     'linear-gradient(90deg, #94a3b8, #c7d2fe)'

  const progressLabel = progress >= 75 ? '✓ On Track' : progress >= 40 ? 'In Progress' : progress > 0 ? 'Just Started' : 'Not Started'
  const progressBadgeCls =
    progress >= 75 ? 'bg-success-light text-success-dark border-success-border' :
    progress >= 40 ? 'bg-warning-light text-[#92400e] border-[#fde68a]' :
                     'bg-surface t-subtle border-slate-100'

  return (
    <Link to={`/lms/courses/${course.id}`} className="no-underline block group">
      <div className="bg-white rounded-[20px] overflow-hidden border border-slate-100 flex flex-col cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:shadow-[0_20px_60px_rgba(79,70,229,0.18),0_8px_24px_rgba(0,0,0,0.08)] hover:-translate-y-1 hover:scale-[1.01] transition-all duration-300">
        {/* Card image header */}
        <div className="h-40 relative overflow-hidden shrink-0" style={{ backgroundImage: DEPT_GRADIENTS[deptKey], backgroundColor: '#1e1b4b' }}>
          <TechPatternOverlay deptKey={deptKey} />
          <div
            className="absolute top-3 left-3 rounded-lg px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] text-white/90 backdrop-blur-sm"
            className="bg-white/[0.12] border border-white/20"
          >
            {dept || 'GENERAL'}
          </div>
        </div>

        {/* Card body */}
        <div className="p-5 flex flex-col flex-1">
          <h3 className="t-md font-bold t-primary m-0 mb-4 flex-1 leading-[22px]">
            {displayName}
            {displayCode && <span className="t-secondary font-medium text-sm"> &nbsp;·&nbsp; {displayCode}</span>}
          </h3>

          {/* Progress */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-bold t-subtle uppercase tracking-[0.1em]">Progress</span>
              <span className="text-[15px] font-extrabold text-brand tabular-nums">{progress}%</span>
            </div>
            <div className="h-1.5 bg-surface-muted rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${progress}%`, background: progressGrad }} />
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center pt-3.5 border-t border-slate-50">
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${progressBadgeCls}`}>{progressLabel}</span>
            <div className="w-8 h-8 rounded-[10px] flex items-center justify-center transition-all duration-200 bg-brand-light group-hover:bg-brand">
              <ArrowRight size={15} className="text-brand group-hover:text-white" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

function EmptyState({ session }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-20 px-6 text-center bg-white rounded-3xl border-2 border-dashed border-ink-border">
      <div className="w-[72px] h-[72px] rounded-[20px] bg-gradient-to-br from-brand-light to-brand-soft flex items-center justify-center mb-5">
        <BookMarked size={32} className="text-brand" />
      </div>
      <div className="t-heading-xl t-primary mb-2">No Courses Found</div>
      <div className="t-base t-secondary max-w-[320px] mt-2 leading-[22px]">
        {session === 'ALL'
          ? 'Connect your Moodle account and sync to see your enrolled courses here.'
          : `No courses are mapped to session "${session}". Try selecting a different session or "All Sessions".`}
      </div>
      <div className="flex gap-3 mt-6">
        <Link to="/lms">
          <button className="px-5 py-2.5 rounded-xl border-none bg-brand text-white t-md font-bold cursor-pointer">Sync Moodle</button>
        </Link>
      </div>
    </div>
  )
}

const SESSION_STORAGE_KEY = 'lms_session_filter'

export default function LMSDashboard() {
  const [courses, setCourses]       = useState([])
  const [sessions, setSessions]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [sessionsLoading, setSessionsLoading] = useState(true)
  const [session, setSession]       = useState(() => localStorage.getItem(SESSION_STORAGE_KEY) || 'ALL')
  const [filterAnim, setFilterAnim] = useState(false)

  const loadSessions = useCallback(async () => {
    try {
      const res = await api.get('/api/lms/courses/sessions')
      if (res.success) setSessions(res.data || [])
    } catch {}
    finally { setSessionsLoading(false) }
  }, [])

  const load = useCallback(async (sessionFilter = 'ALL') => {
    setLoading(true)
    try {
      const url = sessionFilter && sessionFilter !== 'ALL'
        ? `/api/lms/courses?session=${encodeURIComponent(sessionFilter)}`
        : '/api/lms/courses'
      const res = await api.get(url)
      if (res.success) setCourses(res.data || [])
    } catch {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    loadSessions()
    load(localStorage.getItem(SESSION_STORAGE_KEY) || 'ALL')
  }, [load, loadSessions])

  const handleSessionChange = (s) => {
    setFilterAnim(true)
    setSession(s)
    localStorage.setItem(SESSION_STORAGE_KEY, s)
    setTimeout(() => { load(s); setFilterAnim(false) }, 250)
  }

  const displayCourses = (() => {
    const raw = courses.map(e => e.courses || e).filter(Boolean)
    const map = {}
    for (const c of raw) {
      const code = cleanCode(c) || c.id
      const existing = map[code]
      if (!existing) {
        map[code] = c
      } else {
        const existingHasSem = !!existing.semester
        const currentHasSem  = !!c.semester
        if (!existingHasSem && currentHasSem) {
          map[code] = c
        } else if (currentHasSem === existingHasSem) {
          if ((c.progress || 0) > (existing.progress || 0)) map[code] = c
        }
      }
    }
    return Object.values(map)
  })()

  const activeCount = displayCourses.length

  const stats = [
    { label: 'Enrolled Courses', value: activeCount,                           bg: 'bg-brand-light', color: 'text-brand', icon: <BookOpen size={18} className="text-brand" /> },
    { label: 'Avg. Completion',  value: activeCount ? Math.round(displayCourses.reduce((s, c) => s + (c.progress || 0), 0) / activeCount) + '%' : '—', bg: 'bg-green-50', color: 'text-green-600', icon: <GraduationCap size={18} className="text-green-600" /> },
    { label: 'Sessions',         value: sessionsLoading ? '—' : sessions.length, bg: 'bg-purple-50', color: 'text-purple-500', icon: <Layers size={18} className="text-purple-500" /> },
  ]

  return (
    <PageLayout>
      {/* Page header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-1.5 mb-2.5">
            <Link to="/dashboard" className="t-sm font-medium t-subtle no-underline hover:text-brand transition-colors">Dashboard</Link>
            <span className="t-xs t-subtle">›</span>
            <span className="t-sm font-bold text-brand">Courses</span>
          </div>
          <h1 className="t-heading-3xl t-primary m-0 tracking-[-0.02em]">My Courses</h1>
          <div className="flex items-center gap-2 mt-1.5">
            <div className="w-2 h-2 rounded-full bg-brand animate-pulse" />
            <span className="text-[13px] font-semibold t-secondary uppercase tracking-[0.08em]">
              {loading ? '— Active' : `${activeCount} Active`}
            </span>
          </div>
        </div>
        <SessionDropdown value={session} onChange={handleSessionChange} sessions={sessions} />
      </div>

      {/* Moodle bar */}
      <SyncBar />

      {/* Stats row */}
      <div className="grid grid-cols-3 sm:grid-cols-3 gap-3.5">
        {stats.map((s, i) => (
          <div key={i} className="bg-white rounded-[18px] px-4 py-[18px] border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex items-center gap-3.5">
            <div className={`w-[42px] h-[42px] rounded-xl flex items-center justify-center shrink-0 ${s.bg}`}>
              {s.icon}
            </div>
            <div>
              <div className="t-xs font-semibold t-secondary">{s.label}</div>
              <div className={`text-2xl font-extrabold mt-0.5 ${s.color}`}>{loading ? '—' : s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Course card grid */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        style={{
          opacity:   filterAnim ? 0 : 1,
          transform: filterAnim ? 'translateY(8px)' : 'translateY(0)',
          transition: 'opacity 0.25s ease, transform 0.25s ease',
        }}
      >
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-[20px] bg-white border border-slate-100 overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
              <div className="h-40" style={{ background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)', backgroundSize: '800px 100%', animation: 'shimmer 1.5s infinite' }} />
              <div className="p-5 flex flex-col gap-3">
                <div className="h-2.5 rounded-full bg-slate-100 w-[40%]" />
                <div className="h-[18px] rounded-full bg-slate-100 w-[90%]" />
                <div className="h-3.5 rounded-full bg-slate-100 w-[70%]" />
                <div className="h-1.5 rounded-full bg-slate-100 mt-2" />
              </div>
            </div>
          ))
        ) : displayCourses.length === 0 ? (
          <EmptyState session={session} />
        ) : (
          displayCourses.map((course, i) => (
            <div key={course.id || i} style={{ animation: `cardFadeIn 0.4s ease ${i * 0.06}s both` }}>
              <CourseCard course={course} />
            </div>
          ))
        )}
      </div>
    </PageLayout>
  )
}
