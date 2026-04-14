import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'
import {
  BookOpen, RefreshCw, Settings, Link2, Unlink, AlertCircle,
  ChevronDown, ArrowRight, BookMarked, GraduationCap,
  Layers, FlaskConical, Binary, Calculator, Cpu,
} from 'lucide-react'

// ─── Font helper ──────────────────────────────────────────────
const pjs = (size, weight, lh, color) => ({
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  fontSize: size, fontWeight: weight, lineHeight: lh, color,
})

// ─── Session label prettifier ──────────────────────────────────
function semLabel(raw) {
  if (!raw) return 'All Sessions'
  const m = raw.match(/(\d{2})(\d{2})(EVE|EVEN|ODD)SEM/i)
  if (!m) return raw
  const [, y1, y2, type] = m
  const s = type.toUpperCase().startsWith('EVE') ? 'Even' : 'Odd'
  return `${s} Sem 20${y1}–20${y2}`
}

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

// ─── Department → icon map ─────────────────────────────────────
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

// ─── Strip Moodle session+code suffix from display name ────────────────
// "OPTIMIZATION TECHNIQUES-UMA035-2526EVESEM" → "Optimization Techniques"
// "THEORY OF COMPUTATION-UCS701-2526EVESEM" → "Theory of Computation"
function cleanDisplayName(raw = '') {
  let s = raw
    // Remove trailing -XXXXSEM (session suffix) and the code before it
    .replace(/-\d{4}(?:EVE|ODD|EVEN)SEM\s*$/i, '') // remove -2526EVESEM
    .replace(/-[A-Z]{2,4}\d{3,4}[A-Z0-9]*\s*$/i, '\n')  // remove -UCS701 style code
    .replace(/-\d{4}\s*$/i, '')                            // remove -2023 old style
    .trim()
  // Title-case
  return s.split('\n')[0].trim()
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase())
}

// Extract clean code from shortname or course.code field
function cleanCode(course) {
  const raw = course.code || course.shortname || ''
  return raw.replace(/-\d{4}(?:EVE|ODD|EVEN)SEM$/i, '').trim()
}

// ─── Tech pattern SVG overlay for card headers ────────────────
function TechPatternOverlay({ deptKey }) {
  const DeptIcon = DEPT_ICONS[deptKey] || BookOpen
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {/* Circuit grid pattern */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.12 }}
        viewBox="0 0 200 120" preserveAspectRatio="xMidYMid slice">
        {/* horizontal lines */}
        {[20, 40, 60, 80, 100].map(y => <line key={y} x1="0" y1={y} x2="200" y2={y} stroke="#7dd3fc" strokeWidth="0.5" />)}
        {/* vertical lines */}
        {[30, 60, 90, 120, 150, 180].map(x => <line key={x} x1={x} y1="0" x2={x} y2="120" stroke="#7dd3fc" strokeWidth="0.5" />)}
        {/* nodes */}
        {[[30,20],[60,40],[90,60],[120,20],[150,80],[60,80],[90,100],[150,40]].map(([cx,cy],i) => (
          <circle key={i} cx={cx} cy={cy} r="2.5" fill="#38bdf8" opacity="0.8" />
        ))}
        {/* connecting paths */}
        <polyline points="30,20 60,20 60,40" fill="none" stroke="#38bdf8" strokeWidth="0.8" opacity="0.6" />
        <polyline points="90,60 90,80 120,80" fill="none" stroke="#38bdf8" strokeWidth="0.8" opacity="0.6" />
        <polyline points="150,40 150,80" fill="none" stroke="#38bdf8" strokeWidth="0.8" opacity="0.6" />
        <polyline points="30,80 60,80" fill="none" stroke="#38bdf8" strokeWidth="0.8" opacity="0.5" />
      </svg>
      {/* Glow orb */}
      <div style={{
        position: 'absolute', bottom: -30, right: -20,
        width: 120, height: 120, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.4) 0%, transparent 70%)',
      }} />
      {/* Center icon */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        width: 56, height: 56, borderRadius: 16,
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(4px)',
      }}>
        <DeptIcon size={26} color="rgba(255,255,255,0.85)" />
      </div>
    </div>
  )
}

// ─── Moodle Sync Card ──────────────────────────────────────────
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
  const statusColors = { success: '#16a34a', failed: '#dc2626', partial: '#d97706', never: '#94a3b8' }

  return (
    <>
      {/* ── Unlink Confirmation Modal ───────────────────────────────── */}
      {unlinkConfirm && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        }}>
          <div style={{
            background: '#fff', borderRadius: 20, padding: '32px 28px',
            maxWidth: 420, width: '100%',
            boxShadow: '0 24px 80px rgba(0,0,0,0.2)',
            animation: 'dropIn 0.2s ease',
            textAlign: 'center',
          }}>
            {/* Warning icon */}
            <div style={{
              width: 56, height: 56, borderRadius: 16,
              background: '#fef2f2', border: '2px solid #fecaca',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 18px',
            }}>
              <Unlink size={24} color="#dc2626" />
            </div>
            <div style={{ ...pjs(20, 800, '26px', '#0f172a'), marginBottom: 10 }}>Unlink Moodle?</div>
            <div style={{ ...pjs(14, 400, '22px', '#64748b'), marginBottom: 24 }}>
              This will remove your saved Moodle credentials and stop automatic syncing.
              Your existing courses and data will remain in SnapLocate.
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setUnlinkConfirm(false)} style={{
                flex: 1, padding: '11px 20px', borderRadius: 12,
                border: '1.5px solid #e2e8f0', background: '#fff',
                cursor: 'pointer', ...pjs(14, 600, '20px', '#475569'),
              }}>
                Cancel
              </button>
              <button onClick={handleDisconnect} style={{
                flex: 1, padding: '11px 20px', borderRadius: 12,
                border: 'none', background: '#dc2626',
                cursor: 'pointer', ...pjs(14, 700, '20px', '#fff'),
                boxShadow: '0 4px 12px rgba(220,38,38,0.3)',
              }}>
                Yes, Unlink
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 999,
          background: '#0f172a', color: '#fff',
          padding: '12px 20px', borderRadius: 12,
          ...pjs(14, 600, '20px', '#fff'),
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          animation: 'slideUp 0.25s ease',
        }}>
          {toast}
        </div>
      )}

      {/* Moodle bar */}
      <div style={{
        background: connected ? 'linear-gradient(135deg, #f0fdf4, #dcfce7)' : 'linear-gradient(135deg, #fffbeb, #fef9c3)',
        border: `1.5px solid ${connected ? '#86efac' : '#fde68a'}`,
        borderRadius: 16, padding: '16px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: connected ? '#dcfce7' : '#fef9c3',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `1px solid ${connected ? '#86efac' : '#fde68a'}`,
          }}>
            {connected ? <Link2 size={16} color="#16a34a" /> : <AlertCircle size={16} color="#d97706" />}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={pjs(14, 700, '18px', '#0f172a')}>
                {connected ? 'Moodle Connected' : 'Connect Your LMS'}
              </span>
              {connected && (
                <span style={{
                  ...pjs(10, 700, '14px', statusColors[st]),
                  background: '#fff', padding: '2px 8px', borderRadius: 6, textTransform: 'capitalize',
                }}>{st}</span>
              )}
            </div>
            <div style={pjs(12, 400, '16px', '#64748b')}>
              {connected
                ? `Last synced: ${config.last_synced_at
                    ? new Date(config.last_synced_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                    : 'Never'}`
                : 'Sync your Moodle courses, assignments and materials automatically.'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {connected ? (
            <>
              <button onClick={handleSync} disabled={syncing} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 16px', borderRadius: 10, border: 'none',
                background: syncing ? '#e2e8f0' : '#4f46e5',
                cursor: syncing ? 'not-allowed' : 'pointer',
                ...pjs(13, 700, '18px', syncing ? '#64748b' : '#fff'),
              }}>
                <RefreshCw size={13} style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
                {syncing ? `Syncing… ${Math.floor(syncElapsed / 60)}:${String(syncElapsed % 60).padStart(2, '0')}` : 'Sync Now'}
              </button>
              <button onClick={() => setShowForm(f => !f)} style={{
                padding: '8px 12px', borderRadius: 10, border: '1.5px solid #e2e8f0',
                background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                ...pjs(13, 600, '18px', '#475569'),
              }}>
                <Settings size={13} />
              </button>
              <button onClick={() => setUnlinkConfirm(true)} style={{
                padding: '8px 12px', borderRadius: 10, border: '1.5px solid #fecaca',
                background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                ...pjs(13, 600, '18px', '#dc2626'),
              }} title="Disconnect Moodle">
                <Unlink size={13} />
              </button>
            </>
          ) : (
            <button onClick={() => setShowForm(f => !f)} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '9px 18px', borderRadius: 10, border: 'none',
              background: '#4f46e5', cursor: 'pointer',
              ...pjs(13, 700, '18px', '#fff'),
            }}>
              <Link2 size={14} /> Connect Moodle
            </button>
          )}
        </div>
      </div>

      {/* Sync progress */}
      {syncing && (
        <div style={{
          padding: '16px 20px',
          background: 'linear-gradient(135deg, #eef2ff, #e0e7ff)',
          border: '1px solid #c7d2fe', borderRadius: 14,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <RefreshCw size={16} color="#fff" style={{ animation: 'spin 1s linear infinite' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={pjs(14, 700, '20px', '#1e1b4b')}>Syncing your Moodle data…</div>
              <div style={pjs(12, 500, '16px', '#6366f1')}>
                {syncElapsed < 5 ? 'Authenticating with Moodle...' :
                 syncElapsed < 12 ? 'Fetching your enrolled courses...' :
                 syncElapsed < 25 ? 'Loading assignments, announcements & materials...' :
                 syncElapsed < 45 ? 'Saving data to SnapLocate...' :
                 'Wrapping up, almost done...'}
              </div>
            </div>
            <div style={{ ...pjs(20, 800, '24px', '#4f46e5'), fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
              {Math.floor(syncElapsed / 60)}:{String(syncElapsed % 60).padStart(2, '0')}
            </div>
          </div>
          <div style={{ height: 6, borderRadius: 6, background: '#c7d2fe', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 6, transition: 'width 1s ease-out',
              background: 'linear-gradient(90deg, #4f46e5, #6366f1, #818cf8)',
              width: `${Math.min(95, syncElapsed < 5 ? syncElapsed * 4 : syncElapsed < 12 ? 20 + (syncElapsed - 5) * 4 : syncElapsed < 25 ? 48 + (syncElapsed - 12) * 2 : syncElapsed < 45 ? 74 + (syncElapsed - 25) * 0.8 : Math.min(95, 90 + (syncElapsed - 45) * 0.1))}%`,
            }} />
          </div>
        </div>
      )}

      {/* Connect form */}
      {showForm && (
        <div style={{
          background: '#fff', borderRadius: 16, padding: '20px',
          border: '1.5px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
          display: 'flex', flexDirection: 'column', gap: 14,
        }}>
          <div style={pjs(15, 700, '20px', '#0f172a')}>Moodle Credentials</div>
          <div>
            <div style={pjs(12, 600, '16px', '#374151')}>Moodle URL</div>
            <input
              type="url"
              value={form.base_url}
              onChange={e => setForm(p => ({ ...p, base_url: e.target.value }))}
              placeholder={DEFAULT_MOODLE_URL}
              style={{ width: '100%', marginTop: 6, padding: '9px 12px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 13, fontFamily: "'Plus Jakarta Sans', sans-serif", outline: 'none', boxSizing: 'border-box' }} />
            <div style={{ ...pjs(11, 400, '16px', '#94a3b8'), marginTop: 4 }}>
              Pre-filled with Thapar's Moodle URL — change only if needed
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={pjs(12, 600, '16px', '#374151')}>Username</div>
              <input type="text" value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                style={{ width: '100%', marginTop: 6, padding: '9px 12px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 13, fontFamily: "'Plus Jakarta Sans', sans-serif", outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div>
              <div style={pjs(12, 600, '16px', '#374151')}>Password</div>
              <input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                style={{ width: '100%', marginTop: 6, padding: '9px 12px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 13, fontFamily: "'Plus Jakarta Sans', sans-serif", outline: 'none', boxSizing: 'border-box' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handleSave} disabled={saving} style={{
              padding: '10px 20px', borderRadius: 10, border: 'none',
              background: saving ? '#e2e8f0' : '#4f46e5',
              cursor: saving ? 'not-allowed' : 'pointer',
              ...pjs(13, 700, '18px', '#fff'),
            }}>
              {saving ? 'Saving...' : 'Save & Connect'}
            </button>
            <button onClick={() => setShowForm(false)} style={{
              padding: '10px 20px', borderRadius: 10, border: '1.5px solid #e2e8f0',
              background: '#fff', cursor: 'pointer', ...pjs(13, 600, '18px', '#475569'),
            }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
@keyframes slideUp { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: translateY(0) } }`}
      </style>
    </>
  )
}

// ─── Session Filter Dropdown ───────────────────────────────────
function SessionDropdown({ value, onChange, sessions = [] }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const label = value === 'ALL' ? 'All Sessions' : value
  const allSessions = ['ALL', ...sessions]

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        id="session-filter-btn"
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '9px 16px', borderRadius: 40,
          background: open ? '#4f46e5' : '#f1f5f9',
          border: `1.5px solid ${open ? '#4f46e5' : '#e2e8f0'}`,
          cursor: 'pointer', transition: 'all 0.2s',
          ...pjs(14, 700, '18px', open ? '#fff' : '#1e293b'),
        }}
        onMouseEnter={e => { if (!open) { e.currentTarget.style.background = '#eef2ff'; e.currentTarget.style.borderColor = '#c7d2fe' } }}
        onMouseLeave={e => { if (!open) { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.borderColor = '#e2e8f0' } }}
      >
        <GraduationCap size={15} color={open ? '#fff' : '#4f46e5'} />
        {label}
        <ChevronDown size={14} color={open ? '#fff' : '#64748b'} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0,
          background: '#fff', border: '1.5px solid #e2e8f0',
          borderRadius: 14, boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          minWidth: 200, zIndex: 200, overflow: 'hidden',
          animation: 'dropIn 0.2s ease',
        }}>
          <div style={{ padding: '8px 12px 4px', ...pjs(10, 700, '14px', '#94a3b8'), letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Filter by Session
          </div>
          {allSessions.length <= 1 ? (
            <div style={{ padding: '12px 16px', ...pjs(13, 400, '18px', '#94a3b8') }}>No sessions found</div>
          ) : allSessions.map(s => (
            <button key={s} onClick={() => { onChange(s); setOpen(false) }} style={{
              width: '100%', textAlign: 'left', padding: '10px 16px',
              background: value === s ? '#eef2ff' : 'transparent',
              border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
              ...pjs(14, value === s ? 700 : 500, '20px', value === s ? '#4f46e5' : '#334155'),
              transition: 'background 0.15s',
            }}
              onMouseEnter={e => { if (value !== s) e.currentTarget.style.background = '#f8fafc' }}
              onMouseLeave={e => { if (value !== s) e.currentTarget.style.background = 'transparent' }}
            >
              {value === s && <div style={{ width: 6, height: 6, borderRadius: 3, background: '#4f46e5' }} />}
              {value !== s && <div style={{ width: 6, height: 6, borderRadius: 3, background: 'transparent' }} />}
              {s === 'ALL' ? 'All Sessions' : s}
            </button>
          ))}
        </div>
      )}
      <style>{`@keyframes dropIn { from { opacity: 0; transform: translateY(-6px) } to { opacity: 1; transform: translateY(0) } }`}</style>
    </div>
  )
}

// ─── Course Card ───────────────────────────────────────────────
function CourseCard({ course }) {
  const dept     = course.dept || course.department || ''
  const deptKey  = getDeptKey(dept)
  const grad     = DEPT_GRADIENTS[deptKey]
  const progress = course.progress ?? 0
  const [hovered, setHovered] = useState(false)

  // Clean the display name — strip Moodle session/code suffixes
  const displayName = cleanDisplayName(course.name || course.fullname || '')
  const displayCode = cleanCode(course)

  return (
    <Link to={`/lms/courses/${course.id}`} style={{ textDecoration: 'none' }}>
      <div
        id={`course-card-${course.id}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: '#fff',
          borderRadius: 20,
          overflow: 'hidden',
          boxShadow: hovered
            ? '0 20px 60px rgba(79,70,229,0.18), 0 8px 24px rgba(0,0,0,0.08)'
            : '0 4px 20px rgba(0,0,0,0.06)',
          transform: hovered ? 'translateY(-4px) scale(1.01)' : 'translateY(0) scale(1)',
          transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          display: 'flex', flexDirection: 'column',
          border: '1px solid #f1f5f9',
          cursor: 'pointer',
        }}
      >
        {/* ── Card Image Header ──────────────────── */}
        <div style={{
          height: 160, position: 'relative',
          backgroundImage: grad, backgroundColor: '#1e1b4b',
          overflow: 'hidden', flexShrink: 0,
        }}>
          <TechPatternOverlay deptKey={deptKey} />
          {/* Dept badge on image */}
          <div style={{
            position: 'absolute', top: 12, left: 12,
            background: 'rgba(255,255,255,0.12)',
            backdropFilter: 'blur(6px)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 8, padding: '3px 10px',
            ...pjs(10, 700, '16px', 'rgba(255,255,255,0.9)'),
            letterSpacing: '0.06em', textTransform: 'uppercase',
          }}>
            {dept || 'GENERAL'}
          </div>
        </div>

        {/* ── Card Body ────────────────────────── */}
        <div style={{ padding: '18px 20px 20px', display: 'flex', flexDirection: 'column', flex: 1 }}>

          {/* Course name + code — clean, no session noise */}
          <h3 style={{
            ...pjs(16, 700, '22px', '#0f172a'),
            margin: 0, marginBottom: 16, flex: 1,
          }}>
            {displayName}
            {displayCode
              ? <span style={{ color: '#94a3b8', fontWeight: 500, fontSize: 14 }}> &nbsp;·&nbsp; {displayCode}</span>
              : ''}
          </h3>

          {/* Progress */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={pjs(10, 700, '14px', '#94a3b8') && { fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, fontWeight: 700, lineHeight: '14px', color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Progress
              </span>
              <span style={{
                ...pjs(15, 800, '20px', '#4f46e5'),
                fontVariantNumeric: 'tabular-nums',
              }}>
                {progress}%
              </span>
            </div>
            {/* Track */}
            <div style={{
              height: 6, background: '#f1f5f9', borderRadius: 6, overflow: 'hidden',
            }}>
              <div style={{
                height: '100%', borderRadius: 6,
                width: `${progress}%`,
                background: progress >= 75
                  ? 'linear-gradient(90deg, #4f46e5, #6366f1)'
                  : progress >= 40
                    ? 'linear-gradient(90deg, #4f46e5, #818cf8)'
                    : 'linear-gradient(90deg, #94a3b8, #c7d2fe)',
                transition: 'width 0.6s ease',
              }} />
            </div>
          </div>

          {/* Footer: progress label only — no redundant session tag */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            paddingTop: 14, borderTop: '1px solid #f8fafc',
          }}>
            {/* Progress status pill */}
            <span style={{
              ...pjs(11, 700, '16px',
                progress >= 75 ? '#16a34a' : progress >= 40 ? '#d97706' : '#94a3b8'),
              background:
                progress >= 75 ? '#f0fdf4' : progress >= 40 ? '#fffbeb' : '#f8fafc',
              padding: '4px 10px', borderRadius: 8,
              border: `1px solid ${progress >= 75 ? '#bbf7d0' : progress >= 40 ? '#fde68a' : '#f1f5f9'}`,
            }}>
              {progress >= 75 ? '✓ On Track' : progress >= 40 ? 'In Progress' : progress > 0 ? 'Just Started' : 'Not Started'}
            </span>

            {/* Arrow button */}
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: hovered ? '#4f46e5' : '#eef2ff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.25s',
            }}>
              <ArrowRight size={15} color={hovered ? '#fff' : '#4f46e5'} />
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

// ─── Empty State ───────────────────────────────────────────────
function EmptyState({ session }) {
  return (
    <div style={{
      gridColumn: '1 / -1',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '80px 24px', textAlign: 'center',
      background: '#fff', borderRadius: 24,
      border: '1.5px dashed #e2e8f0',
    }}>
      <div style={{
        width: 72, height: 72, borderRadius: 20,
        background: 'linear-gradient(135deg, #eef2ff, #e0e7ff)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 20,
      }}>
        <BookMarked size={32} color="#4f46e5" />
      </div>
      <div style={pjs(20, 700, '28px', '#0f172a')}>No Courses Found</div>
      <div style={{ ...pjs(14, 400, '22px', '#64748b'), maxWidth: 320, marginTop: 8 }}>
        {session === 'ALL'
          ? 'Connect your Moodle account and sync to see your enrolled courses here.'
          : `No courses are mapped to session "${session}". Try selecting a different session or "All Sessions".`}
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
        <Link to="/lms" style={{ textDecoration: 'none' }}>
          <button style={{
            padding: '10px 22px', borderRadius: 12, border: 'none',
            background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
            cursor: 'pointer', ...pjs(14, 700, '20px', '#fff'),
          }}>
            Sync Moodle
          </button>
        </Link>
      </div>
    </div>
  )
}

// ─── Main LMSDashboard ─────────────────────────────────────────
const SESSION_STORAGE_KEY = 'lms_session_filter'

export default function LMSDashboard() {
  const [courses, setCourses]       = useState([])
  const [sessions, setSessions]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [sessionsLoading, setSessionsLoading] = useState(true)
  // Restore last-selected session from localStorage (fallback 'ALL')
  const [session, setSession]       = useState(() => localStorage.getItem(SESSION_STORAGE_KEY) || 'ALL')
  const [filterAnim, setFilterAnim] = useState(false)

  // Load available sessions from server (real data from enrolled courses)
  const loadSessions = useCallback(async () => {
    try {
      const res = await api.get('/api/lms/courses/sessions')
      if (res.success) setSessions(res.data || [])
    } catch {}
    finally { setSessionsLoading(false) }
  }, [])

  // Load courses — pass session filter to server for efficiency
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
    // Load with the restored session on first mount
    load(localStorage.getItem(SESSION_STORAGE_KEY) || 'ALL')
  }, [load, loadSessions])

  // Animate grid on session change, re-fetch, and persist selection
  const handleSessionChange = (s) => {
    setFilterAnim(true)
    setSession(s)
    localStorage.setItem(SESSION_STORAGE_KEY, s)   // 💾 remember for next visit
    setTimeout(() => {
      load(s)
      setFilterAnim(false)
    }, 250)
  }

  // Unwrap nested course objects and DEDUPLICATE by code
  const displayCourses = (() => {
    const raw = courses.map(e => e.courses || e).filter(Boolean)
    const map = {}
    
    for (const c of raw) {
      const code = cleanCode(c) || c.id
      const existing = map[code]
      
      // If we haven't seen this code, or this record is "better" than the existing one:
      // A record is better if:
      // 1. Existing has no semester but this one does
      // 2. Both have semesters (or both don't), but this one has more progress
      if (!existing) {
        map[code] = c
      } else {
        const existingHasSem = !!existing.semester
        const currentHasSem  = !!c.semester
        
        if (!existingHasSem && currentHasSem) {
          map[code] = c
        } else if (currentHasSem === existingHasSem) {
          if ((c.progress || 0) > (existing.progress || 0)) {
            map[code] = c
          }
        }
      }
    }
    return Object.values(map)
  })()

  const activeCount = displayCourses.length

  return (
    <PageLayout>
      {/* ── Page Header Row ──────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'flex-start',
        justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
      }}>
        {/* Left: breadcrumb + title */}
        <div>
          {/* Breadcrumb: Dashboard › Courses */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <Link to="/dashboard" style={{ ...pjs(13, 500, '18px', '#94a3b8'), textDecoration: 'none', transition: 'color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.color = '#4f46e5'}
              onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
            >Dashboard</Link>
            <span style={{ color: '#cbd5e1', fontSize: 12 }}>›</span>
            <span style={pjs(13, 700, '18px', '#4f46e5')}>Courses</span>
          </div>
          <h1 style={{
            ...pjs(36, 800, '42px', '#0f172a'),
            margin: 0, letterSpacing: '-0.02em',
          }}>
            My Courses
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: 4, background: '#4f46e5', animation: 'pulse 2s infinite' }} />
            <span style={pjs(13, 600, '18px', '#64748b') && {
              fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 600,
              lineHeight: '18px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em',
            }}>
              {loading ? '— Active' : `${activeCount} Active`}
            </span>
          </div>
        </div>

        {/* Right: Session filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <SessionDropdown value={session} onChange={handleSessionChange} sessions={sessions} />
        </div>
      </div>

      {/* ── Moodle Connected Bar ──────────────────────────────── */}
      <SyncBar />

      {/* ── Stats row ─────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }} className="lms-stats-grid">
        {[
          { label: 'Enrolled Courses', value: displayCourses.length, bg: '#eef2ff', color: '#4f46e5', icon: <BookOpen size={18} color="#4f46e5" />, small: false },
          { label: 'Avg. Completion',
            value: displayCourses.length
              ? Math.round(displayCourses.reduce((s, c) => s + (c.progress || 0), 0) / displayCourses.length) + '%'
              : '—',
            bg: '#f0fdf4', color: '#16a34a', icon: <GraduationCap size={18} color="#16a34a" />, small: true },
          { label: 'Sessions', value: sessionsLoading ? '—' : sessions.length, bg: '#fdf4ff', color: '#a855f7', icon: <Layers size={18} color="#a855f7" />, small: false },
        ].map((s, i) => (
          <div key={i} style={{
            background: '#fff', borderRadius: 18, padding: '18px 20px',
            border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <div style={{
              width: 42, height: 42, borderRadius: 12, background: s.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              {s.icon}
            </div>
            <div>
              <div style={pjs(12, 600, '16px', '#64748b')}>{s.label}</div>
              <div style={{ ...pjs(s.small ? 22 : 26, 800, s.small ? '28px' : '32px', s.color), marginTop: 2 }}>{loading ? '—' : s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Course Card Grid ──────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 24,
        opacity: filterAnim ? 0 : 1,
        transform: filterAnim ? 'translateY(8px)' : 'translateY(0)',
        transition: 'opacity 0.25s ease, transform 0.25s ease',
      }} className="lms-card-grid">
        {loading ? (
          // Skeleton loading cards
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{
              borderRadius: 20, background: '#fff', border: '1px solid #f1f5f9',
              overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
            }}>
              <div style={{ height: 160, background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)', animation: 'shimmer 1.5s infinite' }} />
              <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ height: 10, borderRadius: 6, background: '#f1f5f9', width: '40%' }} />
                <div style={{ height: 18, borderRadius: 6, background: '#f1f5f9', width: '90%' }} />
                <div style={{ height: 14, borderRadius: 6, background: '#f1f5f9', width: '70%' }} />
                <div style={{ height: 6, borderRadius: 6, background: '#f1f5f9', marginTop: 8 }} />
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

      {/* Responsive + animation styles */}
      <style>{`
        @media (max-width: 1024px) {
          .lms-card-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .lms-stats-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 640px) {
          .lms-card-grid { grid-template-columns: 1fr !important; gap: 16px !important; }
          .lms-stats-grid { grid-template-columns: repeat(3, 1fr) !important; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }
        @keyframes cardFadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
      `}</style>
    </PageLayout>
  )
}
