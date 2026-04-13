import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'
import {
  BookOpen, ClipboardList, CheckCircle, AlertCircle, ChevronRight, ChevronDown,
  RefreshCw, Settings, Link2, Unlink, Search,
} from 'lucide-react'

const pjs = (size, weight, lh, color) => ({
  fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: size, fontWeight: weight, lineHeight: lh, color,
})

function semLabel(raw) {
  if (!raw) return 'Other'
  const m = raw.match(/(\d{2})(\d{2})(EVE|EVEN|ODD)SEM/i)
  if (!m) return raw
  const [, y1, y2, type] = m
  const label = type.toUpperCase().startsWith('EVE') ? 'Even' : 'Odd'
  return `${label} Sem 20${y1}-${y2}`
}

function timeAgo(dateStr) {
  const diff = new Date(dateStr).getTime() - Date.now()
  const days = Math.ceil(diff / 86400000)
  if (days < 0) return 'Overdue'
  if (days === 0) return 'Due today'
  if (days === 1) return 'Due tomorrow'
  return `Due in ${days}d`
}

function DueChip({ dueDate }) {
  const diff = new Date(dueDate).getTime() - Date.now()
  const days = Math.ceil(diff / 86400000)
  const overdue = days < 0
  const today = days === 0
  const bg = overdue ? '#fee2e2' : today ? '#fef3c7' : '#f0fdf4'
  const color = overdue ? '#dc2626' : today ? '#d97706' : '#16a34a'
  return (
    <span style={{ background: bg, color, borderRadius: 6, padding: '2px 8px', ...pjs(11, 700, '16px', color) }}>
      {timeAgo(dueDate)}
    </span>
  )
}

const semColors = [
  { bg: '#eef2ff', border: '#c7d2fe', accent: '#4f46e5' },
  { bg: '#f0fdf4', border: '#bbf7d0', accent: '#16a34a' },
  { bg: '#fff7ed', border: '#fed7aa', accent: '#ea580c' },
  { bg: '#fdf4ff', border: '#f0abfc', accent: '#a855f7' },
  { bg: '#ecfeff', border: '#a5f3fc', accent: '#0891b2' },
  { bg: '#fef2f2', border: '#fecaca', accent: '#dc2626' },
]

function SyncCard() {
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ provider: 'moodle', base_url: '', username: '', password: '' })
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [toast, setToast] = useState('')
  const [syncElapsed, setSyncElapsed] = useState(0)
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
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); if (timerRef.current) clearInterval(timerRef.current) }, [])

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
    setSyncing(true)
    setSyncElapsed(0)
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
    try {
      await api.delete('/api/student-sync/config')
      setConfig(null); showToast('Connection removed')
    } catch { showToast('Failed to disconnect') }
  }

  if (loading) return null

  const connected = !!config
  const st = config?.last_sync_status || 'never'
  const statusColors = { success: '#16a34a', failed: '#dc2626', partial: '#d97706', never: '#94a3b8' }

  return (
    <>
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#0f172a', color: '#fff', padding: '12px 20px', borderRadius: 12, zIndex: 999, ...pjs(14, 600, '20px', '#fff') }}>
          {toast}
        </div>
      )}
      <div style={{ background: connected ? '#f0fdf4' : '#fffbeb', border: `1.5px solid ${connected ? '#bbf7d0' : '#fde68a'}`, borderRadius: 20, padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: connected ? '#dcfce7' : '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {connected ? <Link2 size={18} color="#16a34a" /> : <AlertCircle size={18} color="#d97706" />}
            </div>
            <div>
              <div style={pjs(15, 700, '20px', '#0f172a')}>
                {connected ? 'Moodle Connected' : 'Connect Your LMS'}
              </div>
              <div style={pjs(12, 400, '16px', '#64748b')}>
                {connected
                  ? `Last synced: ${config.last_synced_at ? new Date(config.last_synced_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Never'}`
                  : 'Sync your Moodle courses, assignments and materials automatically.'}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {connected && (
              <span style={{ ...pjs(11, 700, '14px', statusColors[st]), background: '#fff', padding: '4px 10px', borderRadius: 8, textTransform: 'capitalize' }}>{st}</span>
            )}
            {connected ? (
              <>
                <button onClick={handleSync} disabled={syncing}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, border: 'none', background: syncing ? '#e2e8f0' : '#4f46e5', color: syncing ? '#64748b' : '#fff', cursor: syncing ? 'not-allowed' : 'pointer', opacity: syncing ? 0.8 : 1, ...pjs(13, 700, '18px', syncing ? '#64748b' : '#fff') }}>
                  <RefreshCw size={13} style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
                  {syncing ? `Syncing... ${Math.floor(syncElapsed / 60)}:${String(syncElapsed % 60).padStart(2, '0')}` : 'Sync Now'}
                </button>
                <button onClick={() => setShowForm(!showForm)}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 12px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer', ...pjs(13, 600, '18px', '#475569') }}>
                  <Settings size={13} />
                </button>
                <button onClick={handleDisconnect}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 12px', borderRadius: 10, border: '1.5px solid #fecaca', background: '#fff', cursor: 'pointer', ...pjs(13, 600, '18px', '#dc2626') }}>
                  <Unlink size={13} />
                </button>
              </>
            ) : (
              <button onClick={() => setShowForm(!showForm)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 10, border: 'none', background: '#4f46e5', color: '#fff', cursor: 'pointer', ...pjs(13, 700, '18px', '#fff') }}>
                <Link2 size={14} /> Connect Moodle
              </button>
            )}
          </div>
        </div>

        {/* Sync progress banner */}
        {syncing && (
          <div style={{ marginTop: 14, padding: '16px 20px', background: 'linear-gradient(135deg, #eef2ff, #e0e7ff)', border: '1px solid #c7d2fe', borderRadius: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <RefreshCw size={16} color="#fff" style={{ animation: 'spin 1s linear infinite' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={pjs(14, 700, '20px', '#1e1b4b')}>Syncing your Moodle data</div>
                <div style={pjs(12, 500, '16px', '#6366f1')}>
                  {syncElapsed < 5 ? 'Authenticating with Moodle...' :
                   syncElapsed < 12 ? 'Fetching your enrolled courses...' :
                   syncElapsed < 25 ? 'Loading assignments, announcements & materials in parallel...' :
                   syncElapsed < 45 ? 'Saving data to SnapLocate...' :
                   'Wrapping up, almost done...'}
                </div>
              </div>
              <div style={{ ...pjs(20, 800, '24px', '#4f46e5'), fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                {Math.floor(syncElapsed / 60)}:{String(syncElapsed % 60).padStart(2, '0')}
              </div>
            </div>
            {/* Progress bar */}
            <div style={{ height: 6, borderRadius: 6, background: '#c7d2fe', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 6, transition: 'width 1s ease-out',
                background: 'linear-gradient(90deg, #4f46e5, #6366f1, #818cf8)',
                width: `${Math.min(95, syncElapsed < 5 ? syncElapsed * 4 : syncElapsed < 12 ? 20 + (syncElapsed - 5) * 4 : syncElapsed < 25 ? 48 + (syncElapsed - 12) * 2 : syncElapsed < 45 ? 74 + (syncElapsed - 25) * 0.8 : Math.min(95, 90 + (syncElapsed - 45) * 0.1))}%`
              }} />
            </div>
            {/* Step indicators */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
              {[
                { label: 'Connect', done: syncElapsed >= 5 },
                { label: 'Courses', done: syncElapsed >= 12 },
                { label: 'Content', done: syncElapsed >= 25 },
                { label: 'Save', done: syncElapsed >= 45 },
              ].map((step, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 6, height: 6, borderRadius: 3, background: step.done ? '#4f46e5' : '#c7d2fe', transition: 'background 0.3s' }} />
                  <span style={pjs(10, step.done ? 700 : 500, '14px', step.done ? '#4f46e5' : '#94a3b8')}>{step.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sync log */}
        {connected && config?.last_sync_log && !showForm && !syncing && (
          <div style={{ marginTop: 12, padding: '10px 14px', background: '#fff', borderRadius: 10, ...pjs(11, 400, '18px', '#64748b'), fontFamily: 'monospace', whiteSpace: 'pre-wrap', maxHeight: 80, overflowY: 'auto' }}>
            {config.last_sync_log}
          </div>
        )}

        {showForm && (
          <div style={{ marginTop: 16, padding: '16px', background: '#fff', borderRadius: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <div style={pjs(12, 600, '16px', '#374151')}>Moodle URL</div>
              <input type="url" placeholder="https://lms.thapar.edu/moodle" value={form.base_url}
                onChange={e => setForm(p => ({ ...p, base_url: e.target.value }))}
                style={{ width: '100%', marginTop: 4, padding: '8px 10px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 13, fontFamily: "'Plus Jakarta Sans', sans-serif", outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <div style={pjs(12, 600, '16px', '#374151')}>Username</div>
                <input type="text" value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                  style={{ width: '100%', marginTop: 4, padding: '8px 10px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 13, fontFamily: "'Plus Jakarta Sans', sans-serif", outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <div style={pjs(12, 600, '16px', '#374151')}>Password</div>
                <input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  style={{ width: '100%', marginTop: 4, padding: '8px 10px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 13, fontFamily: "'Plus Jakarta Sans', sans-serif", outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleSave} disabled={saving}
                style={{ padding: '9px 18px', borderRadius: 10, border: 'none', background: saving ? '#e2e8f0' : '#4f46e5', color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', ...pjs(13, 700, '18px', '#fff') }}>
                {saving ? 'Saving...' : 'Save & Connect'}
              </button>
              <button onClick={() => setShowForm(false)}
                style={{ padding: '9px 18px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer', ...pjs(13, 600, '18px', '#475569') }}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </>
  )
}

export default function LMSDashboard() {
  const [courses, setCourses] = useState([])
  const [assignments, setAssign] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [collapsed, setCollapsed] = useState({})

  const load = useCallback(async () => {
    try {
      const cRes = await api.get('/api/lms/courses')
      if (cRes.success) {
        const enrolled = cRes.data || []
        setCourses(enrolled)
        const courseIds = enrolled.map(e => (e.courses || e).id).filter(Boolean).slice(0, 8)
        const aRes = await Promise.allSettled(
          courseIds.map(id => api.get(`/api/lms/assignments?course_id=${id}`))
        )
        const all = aRes.flatMap(r => r.status === 'fulfilled' ? (r.value.data || []) : [])
        const upcoming = all
          .filter(a => !a.my_submission)
          .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
          .slice(0, 8)
        setAssign(upcoming)
      }
    } catch {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const totalCourses = courses.length
  const pendingAsgn = assignments.filter(a => new Date(a.due_date) > Date.now()).length
  const overdueAsgn = assignments.filter(a => new Date(a.due_date) < Date.now()).length

  // Group courses by semester
  const grouped = {}
  for (const e of courses) {
    const c = e.courses || e
    const sem = c.semester || 'Uncategorized'
    if (!grouped[sem]) grouped[sem] = []
    grouped[sem].push(c)
  }
  const semKeys = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

  const q = search.toLowerCase()
  const filterCourses = (list) =>
    q ? list.filter(c => (c.code + c.name + (c.dept || '')).toLowerCase().includes(q)) : list

  const toggle = (sem) => setCollapsed(p => ({ ...p, [sem]: !p[sem] }))

  return (
    <PageLayout>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 44, height: 44, borderRadius: 14, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <BookOpen size={22} color="#4f46e5" />
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#0f172a', margin: 0 }}>My Courses</h1>
          <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>Your synced courses, assignments and grades.</p>
        </div>
      </div>

      <SyncCard />

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {[
          { label: 'Enrolled Courses', value: totalCourses, bg: '#eef2ff', color: '#4f46e5' },
          { label: 'Pending Assignments', value: pendingAsgn, bg: '#fffbeb', color: '#d97706' },
          { label: 'Overdue', value: overdueAsgn, bg: '#fee2e2', color: '#dc2626' },
        ].map((s, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 20, padding: '20px 24px', border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
            <div style={pjs(12, 600, '16px', '#64748b')}>{s.label}</div>
            <div style={{ ...pjs(28, 800, '36px', s.color), marginTop: 6 }}>{loading ? '—' : s.value}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      {courses.length > 0 && (
        <div style={{ position: 'relative' }}>
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
          <input type="text" placeholder="Search courses..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '10px 14px 10px 38px', borderRadius: 12, border: '1.5px solid #e2e8f0', fontSize: 14, fontFamily: "'Plus Jakarta Sans', sans-serif", outline: 'none', boxSizing: 'border-box', background: '#fff' }} />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Semester-grouped courses */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {loading ? (
            <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9', padding: 40, textAlign: 'center', ...pjs(13, 400, '18px', '#94a3b8') }}>Loading courses...</div>
          ) : courses.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9', padding: 40, textAlign: 'center' }}>
              <BookOpen size={32} color="#e2e8f0" style={{ margin: '0 auto 8px', display: 'block' }} />
              <div style={pjs(14, 600, '20px', '#0f172a')}>No courses yet</div>
              <div style={{ ...pjs(12, 400, '16px', '#94a3b8'), marginTop: 4 }}>Connect your Moodle account to sync courses.</div>
            </div>
          ) : (
            semKeys.map((sem, si) => {
              const filtered = filterCourses(grouped[sem])
              if (filtered.length === 0) return null
              const sc = semColors[si % semColors.length]
              const isCollapsed = collapsed[sem]
              return (
                <div key={sem} style={{ background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                  <button onClick={() => toggle(sem)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', background: sc.bg, border: 'none', borderBottom: `1px solid ${sc.border}`, cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 4, background: sc.accent }} />
                      <span style={pjs(14, 700, '20px', sc.accent)}>{semLabel(sem)}</span>
                      <span style={{ ...pjs(12, 600, '16px', '#64748b'), background: '#fff', padding: '2px 8px', borderRadius: 20 }}>{filtered.length}</span>
                    </div>
                    <ChevronDown size={16} color={sc.accent} style={{ transform: isCollapsed ? 'rotate(-90deg)' : 'none', transition: 'transform 0.2s' }} />
                  </button>
                  {!isCollapsed && filtered.map((c, i) => (
                    <Link key={c.id} to={`/lms/courses/${c.id}`} style={{ textDecoration: 'none' }}>
                      <div style={{ padding: '14px 20px', borderBottom: i < filtered.length - 1 ? '1px solid #f8fafc' : 'none', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', transition: 'background 0.15s' }}
                        onMouseEnter={el => el.currentTarget.style.background = '#fafafa'}
                        onMouseLeave={el => el.currentTarget.style.background = 'transparent'}>
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: `linear-gradient(135deg, ${sc.accent}dd, ${sc.accent})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <BookOpen size={18} color="#fff" />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ ...pjs(14, 700, '18px', '#0f172a'), overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.code}</div>
                          <div style={{ ...pjs(12, 400, '16px', '#64748b'), overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                        </div>
                        {c.dept && <span style={{ ...pjs(11, 700, '14px', sc.accent), background: sc.bg, padding: '2px 8px', borderRadius: 6, flexShrink: 0 }}>{c.dept}</span>}
                        <ChevronRight size={16} color="#cbd5e1" />
                      </div>
                    </Link>
                  ))}
                </div>
              )
            })
          )}
        </div>

        {/* Upcoming Assignments */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9', boxShadow: '0 4px 24px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={pjs(15, 700, '20px', '#0f172a')}>Pending Assignments</span>
              <Link to="/lms/assignments" style={{ fontSize: 13, color: '#4f46e5', fontWeight: 600, textDecoration: 'none' }}>View all</Link>
            </div>
            {loading ? (
              <div style={{ padding: 40, textAlign: 'center', ...pjs(13, 400, '18px', '#94a3b8') }}>Loading...</div>
            ) : assignments.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center' }}>
                <CheckCircle size={32} color="#22c55e" style={{ margin: '0 auto 8px', display: 'block' }} />
                <div style={pjs(14, 600, '20px', '#0f172a')}>All caught up!</div>
                <div style={{ ...pjs(12, 400, '16px', '#94a3b8'), marginTop: 4 }}>No pending assignments</div>
              </div>
            ) : (
              <div>
                {assignments.map((a, i) => (
                  <Link key={i} to={`/lms/assignments/${a.id}`} style={{ textDecoration: 'none' }}>
                    <div style={{ padding: '14px 24px', borderBottom: '1px solid #f8fafc', display: 'flex', alignItems: 'center', gap: 12 }}
                      onMouseEnter={el => el.currentTarget.style.background = '#fafafa'}
                      onMouseLeave={el => el.currentTarget.style.background = 'transparent'}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <ClipboardList size={16} color="#d97706" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ ...pjs(13, 700, '18px', '#0f172a'), overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</div>
                        <div style={pjs(11, 400, '16px', '#94a3b8')}>{a.max_marks} marks</div>
                      </div>
                      <DueChip dueDate={a.due_date} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
