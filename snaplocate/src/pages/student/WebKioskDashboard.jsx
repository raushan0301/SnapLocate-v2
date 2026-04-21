import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'
import {
  GraduationCap, RefreshCw, Link2, Unlink, ChevronDown,
  AlertCircle, CheckCircle, User, CalendarCheck, CreditCard,
  BookOpen, Trophy, TrendingUp, Clock, ArrowRight, Eye,
  EyeOff, Loader, Wifi, WifiOff, Info, BarChart2,
} from 'lucide-react'

// ─── Design helpers ───────────────────────────────────────────────
const pjs = (size, weight, lh, color) => ({
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  fontSize: size, fontWeight: weight, lineHeight: lh, color,
})

const COLORS = {
  primary:   '#4f46e5',
  primary2:  '#6366f1',
  success:   '#16a34a',
  warning:   '#d97706',
  danger:    '#dc2626',
  neutral:   '#64748b',
  bg:        '#f8fafc',
  surface:   '#ffffff',
  border:    '#f1f5f9',
  text:      '#0f172a',
  sub:       '#64748b',
}

// ─── AttendanceBar ────────────────────────────────────────────────
function AttendanceBar({ pct }) {
  const ok      = pct >= 75
  const warning = pct >= 60 && pct < 75
  const color   = ok ? COLORS.success : warning ? COLORS.warning : COLORS.danger
  const bg      = ok ? '#f0fdf4' : warning ? '#fffbeb' : '#fef2f2'
  const fill    = ok ? 'linear-gradient(90deg, #16a34a, #22c55e)'
                     : warning ? 'linear-gradient(90deg, #d97706, #f59e0b)'
                               : 'linear-gradient(90deg, #dc2626, #f87171)'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ flex: 1, height: 6, borderRadius: 6, background: '#f1f5f9', overflow: 'hidden' }}>
        <div style={{
          width: `${Math.min(100, pct)}%`, height: '100%', borderRadius: 6,
          background: fill, transition: 'width 0.8s ease',
        }} />
      </div>
      <span style={{
        ...pjs(11, 700, '14px', color), background: bg,
        padding: '3px 8px', borderRadius: 6, minWidth: 42, textAlign: 'center',
        border: `1px solid ${color}30`,
      }}>{pct.toFixed(1)}%</span>
    </div>
  )
}

// ─── Stat Card ────────────────────────────────────────────────────
function StatCard({ icon: Icon, title, value, sub, color, bg }) {
  return (
    <div style={{
      background: COLORS.surface, borderRadius: 20, padding: '22px 24px',
      border: `1px solid ${COLORS.border}`,
      boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 14, background: bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={20} color={color} />
        </div>
        <span style={pjs(13, 600, '18px', COLORS.sub)}>{title}</span>
      </div>
      <div style={pjs(28, 800, '34px', COLORS.text)}>{value ?? '—'}</div>
      {sub && <div style={{ ...pjs(12, 500, '16px', COLORS.sub), marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

// ─── Connect Form ─────────────────────────────────────────────────
function ConnectForm({ onConnected }) {
  const [form, setForm]           = useState({ enrollment_no: '', password: '' })
  const [showPw, setShowPw]       = useState(false)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')

  const handleConnect = async () => {
    if (!form.enrollment_no.trim() || !form.password.trim()) {
      setError('Please enter both enrollment number and password.')
      return
    }
    setSaving(true); setError('')
    try {
      const res = await api.post('/api/webkiosk/connect', {
        enrollment_no: form.enrollment_no.trim(),
        password:      form.password.trim(),
      })
      if (res.success) onConnected()
      else setError(res.error || 'Connection failed.')
    } catch (err) {
      setError(err?.message || 'Failed to connect. Please check your credentials.')
    } finally { setSaving(false) }
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
      borderRadius: 28, padding: '60px 40px', textAlign: 'center',
      position: 'relative', overflow: 'hidden',
      boxShadow: '0 32px 80px rgba(79,70,229,0.25)',
    }}>
      {/* Glow orbs */}
      <div style={{ position: 'absolute', top: -60, left: -60, width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.3) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -60, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.25) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Icon */}
      <div style={{
        width: 72, height: 72, borderRadius: 22,
        background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 24px',
        boxShadow: '0 12px 32px rgba(79,70,229,0.4)',
      }}>
        <GraduationCap size={34} color="#fff" />
      </div>

      <div style={{ ...pjs(28, 800, '34px', '#fff'), marginBottom: 8 }}>Connect Thapar WebKiosk</div>
      <div style={{ ...pjs(14, 400, '22px', 'rgba(255,255,255,0.6)'), marginBottom: 36, maxWidth: 380, margin: '0 auto 36px' }}>
        Sync your attendance, results, fees, and academic profile directly from WebKiosk.
      </div>

      {/* Form */}
      <div style={{ maxWidth: 360, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ textAlign: 'left' }}>
          <div style={{ ...pjs(12, 600, '16px', 'rgba(255,255,255,0.7)'), marginBottom: 6 }}>Enrollment Number</div>
          <input
            id="wk-enrollment"
            type="text"
            inputMode="numeric"
            value={form.enrollment_no}
            onChange={e => setForm(p => ({ ...p, enrollment_no: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && handleConnect()}
            placeholder="e.g. 102303986"
            style={{
              width: '100%', padding: '12px 16px', borderRadius: 12,
              border: '1.5px solid rgba(255,255,255,0.15)',
              background: 'rgba(255,255,255,0.08)',
              color: '#fff', fontSize: 14,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              outline: 'none', boxSizing: 'border-box',
              backdropFilter: 'blur(8px)',
            }}
          />
        </div>

        <div style={{ textAlign: 'left' }}>
          <div style={{ ...pjs(12, 600, '16px', 'rgba(255,255,255,0.7)'), marginBottom: 6 }}>Password</div>
          <div style={{ position: 'relative' }}>
            <input
              id="wk-password"
              type={showPw ? 'text' : 'password'}
              value={form.password}
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && handleConnect()}
              placeholder="Your WebKiosk password"
              style={{
                width: '100%', padding: '12px 44px 12px 16px', borderRadius: 12,
                border: '1.5px solid rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.08)',
                color: '#fff', fontSize: 14,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                outline: 'none', boxSizing: 'border-box',
                backdropFilter: 'blur(8px)',
              }}
            />
            <button
              onClick={() => setShowPw(p => !p)}
              style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)' }}
              tabIndex={-1}
            >
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {error && (
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.4)',
            borderRadius: 10, padding: '10px 14px', textAlign: 'left',
          }}>
            <AlertCircle size={15} color="#f87171" style={{ flexShrink: 0, marginTop: 1 }} />
            <span style={pjs(13, 500, '18px', '#fca5a5')}>{error}</span>
          </div>
        )}

        <button
          id="wk-connect-btn"
          onClick={handleConnect}
          disabled={saving}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '14px 28px', borderRadius: 14, border: 'none',
            background: saving ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            cursor: saving ? 'not-allowed' : 'pointer',
            ...pjs(15, 700, '20px', saving ? 'rgba(255,255,255,0.4)' : '#fff'),
            boxShadow: saving ? 'none' : '0 8px 24px rgba(79,70,229,0.5)',
            transition: 'all 0.2s',
          }}
        >
          {saving ? <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Connecting...</> : <><Link2 size={16} /> Connect WebKiosk</>}
        </button>

        <div style={{ ...pjs(11, 400, '16px', 'rgba(255,255,255,0.35)'), textAlign: 'center' }}>
          🔒 Credentials are encrypted and stored securely. Only used for syncing.
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }
      `}</style>
    </div>
  )
}

// ─── Sync Status Bar ──────────────────────────────────────────────
function SyncBar({ status, lastSyncedAt, onSync, onDisconnect, syncing, syncElapsed }) {
  const [unlinkConfirm, setUnlinkConfirm] = useState(false)

  const stColor = {
    success: COLORS.success, failed: COLORS.danger,
    partial: COLORS.warning, pending: COLORS.primary, never: COLORS.neutral,
  }[status] || COLORS.neutral

  const stBg = {
    success: '#f0fdf4', failed: '#fef2f2',
    partial: '#fffbeb', pending: '#eef2ff', never: '#f8fafc',
  }[status] || '#f8fafc'

  const lastSyncText = lastSyncedAt
    ? new Date(lastSyncedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    : 'Never synced'

  return (
    <>
      {/* Unlink modal */}
      {unlinkConfirm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: '#fff', borderRadius: 24, padding: '36px 32px', maxWidth: 400, width: '100%', textAlign: 'center', boxShadow: '0 32px 80px rgba(0,0,0,0.2)' }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: '#fef2f2', border: '2px solid #fecaca', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
              <WifiOff size={24} color="#dc2626" />
            </div>
            <div style={{ ...pjs(20, 800, '26px', '#0f172a'), marginBottom: 10 }}>Disconnect WebKiosk?</div>
            <div style={{ ...pjs(14, 400, '22px', '#64748b'), marginBottom: 28 }}>
              Your saved WebKiosk credentials and synced data will be removed.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setUnlinkConfirm(false)} style={{ flex: 1, padding: '12px 20px', borderRadius: 12, border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer', ...pjs(14, 600, '20px', '#475569') }}>
                Cancel
              </button>
              <button onClick={() => { setUnlinkConfirm(false); onDisconnect() }} style={{ flex: 1, padding: '12px 20px', borderRadius: 12, border: 'none', background: '#dc2626', cursor: 'pointer', ...pjs(14, 700, '20px', '#fff') }}>
                Disconnect
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{
        background: stBg, border: `1.5px solid ${stColor}30`,
        borderRadius: 16, padding: '14px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: `${stColor}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${stColor}25` }}>
            {status === 'success' ? <CheckCircle size={17} color={stColor} /> :
             status === 'failed'  ? <AlertCircle size={17} color={stColor} /> :
             status === 'pending' ? <Loader size={17} color={stColor} style={{ animation: 'spin 1s linear infinite' }} /> :
             <Wifi size={17} color={stColor} />}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={pjs(14, 700, '18px', COLORS.text)}>Thapar WebKiosk</span>
              <span style={{ ...pjs(10, 700, '14px', stColor), background: '#fff', padding: '2px 8px', borderRadius: 6, textTransform: 'capitalize', border: `1px solid ${stColor}30` }}>
                {status || 'connected'}
              </span>
            </div>
            <div style={pjs(12, 400, '16px', COLORS.sub)}>
              {syncing ? `Syncing… ${Math.floor(syncElapsed / 60)}:${String(syncElapsed % 60).padStart(2, '0')}` : `Last synced: ${lastSyncText}`}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button id="wk-sync-btn" onClick={onSync} disabled={syncing} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
            borderRadius: 10, border: 'none', cursor: syncing ? 'not-allowed' : 'pointer',
            background: syncing ? '#e2e8f0' : COLORS.primary,
            ...pjs(13, 700, '18px', syncing ? '#94a3b8' : '#fff'),
          }}>
            <RefreshCw size={13} style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
            {syncing ? 'Syncing…' : 'Sync Now'}
          </button>
          <button onClick={() => setUnlinkConfirm(true)} style={{
            display: 'flex', alignItems: 'center', gap: 5, padding: '8px 12px',
            borderRadius: 10, border: '1.5px solid #fecaca', background: '#fff',
            cursor: 'pointer', ...pjs(13, 600, '18px', '#dc2626'),
          }} title="Disconnect WebKiosk">
            <Unlink size={13} />
          </button>
        </div>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </>
  )
}

// ─── Syncing Progress Overlay ─────────────────────────────────────
function SyncProgress({ elapsed }) {
  const steps = [
    { at: 0,  at2: 5,  msg: 'Logging into Thapar WebKiosk...' },
    { at: 5,  at2: 12, msg: 'Fetching student profile...' },
    { at: 12, at2: 22, msg: 'Loading attendance records...' },
    { at: 22, at2: 35, msg: 'Retrieving academic results...' },
    { at: 35, at2: 50, msg: 'Checking fee details...' },
    { at: 50, at2: 70, msg: 'Syncing registered courses...' },
    { at: 70, at2: 100, msg: 'Saving data to SnapLocate...' },
  ]
  const current = steps.findLast(s => elapsed >= s.at) || steps[0]
  const pct = Math.min(95, elapsed < 5 ? elapsed * 6 : elapsed < 12 ? 30 + (elapsed - 5) * 5 : elapsed < 35 ? 65 + (elapsed - 12) : Math.min(95, 88 + (elapsed - 35) * 0.2))

  return (
    <div style={{
      background: 'linear-gradient(135deg, #eef2ff, #e0e7ff)',
      border: '1px solid #c7d2fe', borderRadius: 16, padding: '20px 24px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: COLORS.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <GraduationCap size={20} color="#fff" style={{ animation: 'pulse 1.5s infinite' }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={pjs(14, 700, '20px', '#1e1b4b')}>Syncing WebKiosk data…</div>
          <div style={pjs(12, 500, '16px', '#6366f1')}>{current.msg}</div>
        </div>
        <div style={{ ...pjs(20, 800, '24px', COLORS.primary), fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
          {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}
        </div>
      </div>
      <div style={{ height: 6, borderRadius: 6, background: '#c7d2fe', overflow: 'hidden' }}>
        <div style={{ height: '100%', borderRadius: 6, transition: 'width 1s ease', background: 'linear-gradient(90deg, #4f46e5, #818cf8)', width: `${pct}%` }} />
      </div>
    </div>
  )
}

// ─── Attendance Section ───────────────────────────────────────────
function AttendanceSection({ attendance }) {
  const [expanded, setExpanded] = useState(false)
  if (!attendance?.length) return null

  const avg     = (attendance.reduce((s, c) => s + c.percentage, 0) / attendance.length)
  const low     = attendance.filter(c => c.percentage < 75)
  const shown   = expanded ? attendance : attendance.slice(0, 5)

  return (
    <div style={{ background: COLORS.surface, borderRadius: 24, border: `1px solid ${COLORS.border}`, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
      {/* Header */}
      <div style={{ padding: '20px 24px', borderBottom: `1px solid ${COLORS.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 12, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CalendarCheck size={18} color={COLORS.success} />
          </div>
          <div>
            <div style={pjs(15, 700, '20px', COLORS.text)}>Attendance</div>
            <div style={pjs(12, 500, '16px', COLORS.sub)}>{attendance.length} subjects · {avg.toFixed(1)}% avg</div>
          </div>
        </div>
        {low.length > 0 && (
          <span style={{ ...pjs(11, 700, '14px', COLORS.danger), background: '#fef2f2', padding: '4px 10px', borderRadius: 8, border: '1px solid #fecaca' }}>
            {low.length} below 75%
          </span>
        )}
      </div>

      {/* Low attendance alert */}
      {low.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: '#fff7ed', border: 'none', borderBottom: `1px solid ${COLORS.border}`, padding: '12px 24px' }}>
          <AlertCircle size={15} color="#ea580c" style={{ marginTop: 1, flexShrink: 0 }} />
          <span style={pjs(13, 500, '18px', '#c2410c')}>
            Low attendance in: {low.map(c => c.courseCode || c.courseName).filter(Boolean).join(', ')}. Minimum 75% required.
          </span>
        </div>
      )}

      {/* Rows */}
      <div>
        {shown.map((c, i) => (
          <div key={i} style={{
            padding: '14px 24px', borderBottom: `1px solid ${COLORS.border}`,
            display: 'flex', alignItems: 'center', gap: 16,
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ ...pjs(13, 700, '18px', COLORS.text), background: '#eef2ff', padding: '1px 8px', borderRadius: 6 }}>
                  {c.courseCode}
                </span>
                <span style={pjs(13, 500, '18px', COLORS.sub)} className="truncate">{c.courseName}</span>
              </div>
              <AttendanceBar pct={c.percentage} />
            </div>
            <div style={{ display: 'flex', gap: 12, flexShrink: 0 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={pjs(14, 700, '18px', COLORS.success)}>{c.present}</div>
                <div style={pjs(10, 500, '14px', COLORS.sub)}>Present</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={pjs(14, 700, '18px', COLORS.danger)}>{c.absent}</div>
                <div style={pjs(10, 500, '14px', COLORS.sub)}>Absent</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={pjs(14, 700, '18px', COLORS.neutral)}>{c.total}</div>
                <div style={pjs(10, 500, '14px', COLORS.sub)}>Total</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {attendance.length > 5 && (
        <button onClick={() => setExpanded(e => !e)} style={{
          width: '100%', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          background: COLORS.bg, border: 'none', cursor: 'pointer', borderTop: `1px solid ${COLORS.border}`,
          ...pjs(13, 600, '18px', COLORS.primary),
        }}>
          <ChevronDown size={14} style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          {expanded ? 'Show less' : `Show ${attendance.length - 5} more`}
        </button>
      )}
    </div>
  )
}

// ─── Profile Card ─────────────────────────────────────────────────
function ProfileCard({ profile, result }) {
  if (!profile && !result) return null
  const p = profile || {}
  return (
    <div style={{
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #0d1b4a 100%)',
      borderRadius: 24, padding: '28px 28px', position: 'relative', overflow: 'hidden',
    }}>
      {/* Background glow */}
      <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.3) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', position: 'relative' }}>
        {/* Avatar / Photo */}
        <div style={{
          width: 80, height: 80, borderRadius: 20, flexShrink: 0,
          background: p.photoUrl ? 'transparent' : 'linear-gradient(135deg, #4f46e5, #7c3aed)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '2px solid rgba(255,255,255,0.15)',
          overflow: 'hidden',
        }}>
          {p.photoUrl
            ? <img src={p.photoUrl} alt="Student" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none' }} />
            : <User size={36} color="rgba(255,255,255,0.8)" />
          }
        </div>

        {/* Name + key info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ ...pjs(22, 800, '28px', '#fff'), marginBottom: 4 }}>{p.name || '—'}</div>
          <div style={{ ...pjs(13, 500, '18px', 'rgba(255,255,255,0.6)'), marginBottom: 14 }}>{p.program || '—'} · {p.branch || '—'}</div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {[
              { label: 'Enrollment', value: p.enrollmentNo },
              { label: 'Roll No',    value: p.rollNo },
              { label: 'Section',    value: p.section },
              { label: 'Semester',   value: p.semester },
              { label: 'Batch',      value: p.batchYear },
              { label: 'CGPA',       value: result?.cgpa },
            ].filter(f => f.value).map((f, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 10, padding: '6px 12px',
              }}>
                <div style={pjs(10, 600, '12px', 'rgba(255,255,255,0.45)')}>{f.label}</div>
                <div style={pjs(13, 700, '18px', '#fff')}>{f.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* CGPA badge */}
        {result?.cgpa && (
          <div style={{
            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            borderRadius: 18, padding: '14px 18px', textAlign: 'center', flexShrink: 0,
            border: '1px solid rgba(255,255,255,0.15)',
          }}>
            <div style={pjs(10, 700, '12px', 'rgba(255,255,255,0.7)')}>CGPA</div>
            <div style={{ ...pjs(28, 800, '32px', '#fff'), fontVariantNumeric: 'tabular-nums' }}>{result.cgpa}</div>
            {result.sgpa && <div style={pjs(11, 500, '14px', 'rgba(255,255,255,0.5)')}>SGPA {result.sgpa}</div>}
          </div>
        )}
      </div>

      {/* Extra info row */}
      {(p.email || p.mobile || p.bloodGroup) && (
        <div style={{ marginTop: 20, paddingTop: 18, borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          {[
            { label: 'Email',    value: p.email },
            { label: 'Mobile',   value: p.mobile },
            { label: 'Blood',    value: p.bloodGroup },
            { label: 'Category', value: p.category },
          ].filter(f => f.value).map((f, i) => (
            <div key={i}>
              <div style={pjs(10, 600, '12px', 'rgba(255,255,255,0.4)')}>{f.label}</div>
              <div style={pjs(13, 600, '18px', 'rgba(255,255,255,0.85)')}>{f.value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Fees Card ────────────────────────────────────────────────────
function FeesCard({ fees }) {
  if (!fees) return null
  const { summary, records = [] } = fees
  const bal   = summary?.balance ?? 0
  const paid  = summary?.totalPaid ?? 0
  const due   = summary?.totalDue ?? 0

  return (
    <div style={{ background: COLORS.surface, borderRadius: 24, border: `1px solid ${COLORS.border}`, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
      <div style={{ padding: '20px 24px', borderBottom: `1px solid ${COLORS.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 12, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CreditCard size={18} color={COLORS.warning} />
          </div>
          <div style={pjs(15, 700, '20px', COLORS.text)}>Fee Status</div>
        </div>
        {bal > 0 && (
          <span style={{ ...pjs(12, 700, '16px', COLORS.danger), background: '#fef2f2', padding: '4px 10px', borderRadius: 8 }}>
            ₹{bal.toLocaleString()} due
          </span>
        )}
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', padding: '16px 24px', gap: 16 }}>
        {[
          { label: 'Total Due',  value: `₹${due.toLocaleString()}`,   color: COLORS.text    },
          { label: 'Paid',       value: `₹${paid.toLocaleString()}`,  color: COLORS.success },
          { label: 'Balance',    value: `₹${bal.toLocaleString()}`,   color: bal > 0 ? COLORS.danger : COLORS.success },
        ].map((s, i) => (
          <div key={i} style={{ textAlign: 'center', padding: '12px 8px', borderRadius: 14, background: COLORS.bg }}>
            <div style={pjs(18, 800, '22px', s.color)}>{s.value}</div>
            <div style={pjs(11, 500, '14px', COLORS.sub)}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Records */}
      {records.length > 0 && (
        <div style={{ borderTop: `1px solid ${COLORS.border}` }}>
          {records.slice(0, 4).map((r, i) => (
            <div key={i} style={{ padding: '12px 24px', borderBottom: `1px solid ${COLORS.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={pjs(13, 600, '18px', COLORS.text)}>{r.feeType} {r.semester ? `(Sem ${r.semester})` : ''}</div>
                <div style={pjs(11, 400, '15px', COLORS.sub)}>Paid: ₹{(r.amountPaid || 0).toLocaleString()}</div>
              </div>
              <span style={{
                ...pjs(11, 700, '14px',
                  r.status?.toLowerCase() === 'paid' ? COLORS.success :
                  r.status?.toLowerCase() === 'overdue' ? COLORS.danger : COLORS.warning),
                background: r.status?.toLowerCase() === 'paid' ? '#f0fdf4' : r.status?.toLowerCase() === 'overdue' ? '#fef2f2' : '#fffbeb',
                padding: '3px 8px', borderRadius: 6, textTransform: 'capitalize',
              }}>
                {r.status || 'pending'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Registered Courses Card ──────────────────────────────────────
function CoursesCard({ courses }) {
  if (!courses?.length) return null
  return (
    <div style={{ background: COLORS.surface, borderRadius: 24, border: `1px solid ${COLORS.border}`, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
      <div style={{ padding: '20px 24px', borderBottom: `1px solid ${COLORS.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 38, height: 38, borderRadius: 12, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <BookOpen size={18} color={COLORS.primary} />
        </div>
        <div>
          <div style={pjs(15, 700, '20px', COLORS.text)}>Registered Courses</div>
          <div style={pjs(12, 500, '16px', COLORS.sub)}>{courses.length} courses this semester</div>
        </div>
      </div>
      <div>
        {courses.map((c, i) => (
          <div key={i} style={{ padding: '14px 24px', borderBottom: `1px solid ${COLORS.border}`, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={pjs(10, 800, '12px', COLORS.primary)}>{i + 1}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ ...pjs(12, 700, '16px', COLORS.primary), background: '#eef2ff', padding: '2px 8px', borderRadius: 6, flexShrink: 0 }}>{c.code}</span>
                <span style={{ ...pjs(13, 600, '18px', COLORS.text), overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
              </div>
              {c.faculty && <div style={{ ...pjs(11, 400, '15px', COLORS.sub), marginTop: 3 }}>{c.faculty}</div>}
            </div>
            {c.credits > 0 && (
              <span style={{ ...pjs(11, 700, '14px', COLORS.neutral), background: COLORS.bg, padding: '3px 8px', borderRadius: 6, flexShrink: 0 }}>
                {c.credits} cr
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Empty / Not Connected state ──────────────────────────────────
function EmptyDataState() {
  return (
    <div style={{
      background: COLORS.surface, borderRadius: 24, padding: '60px 24px',
      border: `1.5px dashed ${COLORS.border}`, textAlign: 'center',
    }}>
      <div style={{ width: 64, height: 64, borderRadius: 20, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
        <BarChart2 size={28} color={COLORS.primary} />
      </div>
      <div style={pjs(18, 700, '24px', COLORS.text)}>Syncing your data…</div>
      <div style={{ ...pjs(14, 400, '22px', COLORS.sub), maxWidth: 340, margin: '8px auto 0' }}>
        Your first sync is in progress. This usually takes 30–90 seconds. Refresh after a minute to see your data.
      </div>
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────
export default function WebKioskDashboard() {
  const [loading, setLoading]     = useState(true)
  const [connected, setConnected] = useState(false)
  const [syncData, setSyncData]   = useState(null)  // full status response
  const [syncing, setSyncing]     = useState(false)
  const [syncElapsed, setSyncElapsed] = useState(0)
  const [toast, setToast]         = useState('')
  const timerRef = useRef(null)
  const pollRef  = useRef(null)

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3500) }

  const loadStatus = useCallback(async () => {
    try {
      const res = await api.get('/api/webkiosk/status')
      if (res.success) {
        setConnected(res.connected)
        setSyncData(res.connected ? res : null)
        return res
      }
    } catch {}
    return null
  }, [])

  useEffect(() => {
    loadStatus().finally(() => setLoading(false))
    return () => {
      clearInterval(timerRef.current)
      clearInterval(pollRef.current)
    }
  }, [loadStatus])

  const handleConnected = () => {
    setConnected(true)
    setSyncing(true)
    setSyncElapsed(0)
    timerRef.current = setInterval(() => setSyncElapsed(p => p + 1), 1000)
    startPoll(null)
  }

  const startPoll = (prevSyncedAt) => {
    let attempts = 0
    // Max wait: 120 polls × 3s = 6 minutes (generous for slow WebKiosk)
    pollRef.current = setInterval(async () => {
      attempts++
      const latest = await loadStatus()
      const inFlight = ['pending', 'running'].includes(latest?.lastSyncStatus)
      const done = latest?.connected && !inFlight &&
        (prevSyncedAt === null || latest.lastSyncedAt !== prevSyncedAt)
      if (done || attempts >= 120) {
        clearInterval(pollRef.current);  pollRef.current  = null
        clearInterval(timerRef.current); timerRef.current = null
        setSyncing(false); setSyncElapsed(0)
        if (done) {
          const st = latest.lastSyncStatus
          showToast(st === 'success' ? '✓ Sync complete — all data loaded!' : `Sync done (${st})`)
        } else {
          showToast('Sync is taking longer than usual. Data will appear when ready.')
        }
      }
    }, 3000)
  }

  const handleSync = async () => {
    const prev = syncData?.lastSyncedAt || null
    setSyncing(true); setSyncElapsed(0)
    try {
      await api.post('/api/webkiosk/sync', {})
      timerRef.current = setInterval(() => setSyncElapsed(p => p + 1), 1000)
      startPoll(prev)
    } catch (err) {
      setSyncing(false)
      showToast(err?.message || 'Sync failed')
    }
  }

  const handleDisconnect = async () => {
    try {
      await api.delete('/api/webkiosk/disconnect')
      setConnected(false); setSyncData(null)
      showToast('WebKiosk disconnected.')
    } catch { showToast('Failed to disconnect.') }
  }

  const wkData      = syncData?.data || null
  const profile     = wkData?.profile       || null
  const attendance  = wkData?.attendance    || []
  const result      = wkData?.result        || null
  const fees        = wkData?.fees          || null
  const courses     = wkData?.registeredCourses || []
  const timetable   = wkData?.timetable     || null
  const examSchedule= wkData?.examSchedule  || []
  const hasData     = profile || attendance.length > 0 || result || fees

  const avgAtt  = attendance.length
    ? (attendance.reduce((s, c) => s + c.percentage, 0) / attendance.length)
    : null
  const lowCount = attendance.filter(c => c.percentage < 75).length

  if (loading) return (
    <PageLayout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
        <Loader size={28} color={COLORS.primary} style={{ animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </div>
    </PageLayout>
  )

  return (
    <PageLayout>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 999,
          background: '#0f172a', color: '#fff', padding: '12px 20px', borderRadius: 12,
          ...pjs(14, 600, '20px', '#fff'), boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          animation: 'slideUp 0.25s ease',
        }}>{toast}</div>
      )}

      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <Link to="/dashboard" style={{ ...pjs(13, 500, '18px', '#94a3b8'), textDecoration: 'none' }}
              onMouseEnter={e => e.currentTarget.style.color = COLORS.primary}
              onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
            >Dashboard</Link>
            <span style={{ color: '#cbd5e1', fontSize: 12 }}>›</span>
            <span style={pjs(13, 700, '18px', COLORS.primary)}>WebKiosk</span>
          </div>
          <h1 style={{ ...pjs(36, 800, '42px', COLORS.text), margin: 0, letterSpacing: '-0.02em' }}>
            Academic Portal
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: 4, background: connected ? COLORS.success : '#94a3b8', animation: connected ? 'pulse 2s infinite' : 'none' }} />
            <span style={{ fontFamily: "'Plus Jakarta Sans'", fontSize: 13, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {connected ? 'Thapar WebKiosk Connected' : 'Not Connected'}
            </span>
          </div>
        </div>
      </div>

      {/* ── NOT CONNECTED ─────────────────────────── */}
      {!connected && <ConnectForm onConnected={handleConnected} />}

      {/* ── CONNECTED ─────────────────────────────── */}
      {connected && (
        <>
          {/* Sync bar */}
          <SyncBar
            status={syncData?.lastSyncStatus}
            lastSyncedAt={syncData?.lastSyncedAt}
            onSync={handleSync}
            onDisconnect={handleDisconnect}
            syncing={syncing}
            syncElapsed={syncElapsed}
          />

          {/* Sync progress */}
          {syncing && <SyncProgress elapsed={syncElapsed} />}

          {/* No data yet */}
          {!syncing && !hasData && <EmptyDataState />}

          {/* DATA SECTIONS */}
          {hasData && (
            <>
              {/* Stats row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                {avgAtt !== null && (
                  <StatCard
                    icon={CalendarCheck} title="Avg Attendance"
                    value={`${avgAtt.toFixed(1)}%`}
                    sub={lowCount > 0 ? `${lowCount} subject${lowCount > 1 ? 's' : ''} below 75%` : 'All subjects ≥ 75%'}
                    color={avgAtt >= 75 ? COLORS.success : COLORS.danger}
                    bg={avgAtt >= 75 ? '#f0fdf4' : '#fef2f2'}
                  />
                )}
                {result?.cgpa && (
                  <StatCard
                    icon={Trophy} title="CGPA"
                    value={result.cgpa}
                    sub={result.sgpa ? `Current SGPA: ${result.sgpa}` : 'Cumulative GPA'}
                    color="#7c3aed" bg="#fdf4ff"
                  />
                )}
                {fees?.summary && (
                  <StatCard
                    icon={CreditCard} title="Fee Balance"
                    value={`₹${(fees.summary.balance || 0).toLocaleString()}`}
                    sub={fees.summary.balance > 0 ? 'Outstanding balance' : 'Fully paid'}
                    color={fees.summary.balance > 0 ? COLORS.danger : COLORS.success}
                    bg={fees.summary.balance > 0 ? '#fef2f2' : '#f0fdf4'}
                  />
                )}
                {courses.length > 0 && (
                  <StatCard
                    icon={BookOpen} title="Enrolled Courses"
                    value={courses.length}
                    sub="This semester"
                    color={COLORS.primary} bg="#eef2ff"
                  />
                )}
              </div>

              {/* Profile */}
              {(profile || result) && <ProfileCard profile={profile} result={result} />}

              {/* Quick-nav links */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                {[
                  { to: '/webkiosk/attendance', label: 'Full Attendance',  icon: CalendarCheck, color: '#16a34a', bg: '#f0fdf4', count: attendance.length > 0 ? `${attendance.length} subjects` : null },
                  { to: '/webkiosk/fees',        label: 'Fee Details',      icon: CreditCard,    color: '#d97706', bg: '#fffbeb', count: fees?.records?.length > 0 ? `${fees.records.length} records` : null },
                  { to: '/webkiosk/exams',       label: 'Exam Schedule',    icon: Clock,         color: '#4f46e5', bg: '#eef2ff', count: examSchedule.length > 0 ? `${examSchedule.length} exams` : null },
                  { to: '/webkiosk/profile',     label: 'Academic Profile', icon: User,          color: '#7c3aed', bg: '#fdf4ff', count: profile?.name ? profile.name.split(' ')[0] : null },
                ].map((nav, i) => (
                  <Link key={i} to={nav.to} style={{ textDecoration: 'none' }}>
                    <div style={{
                      background: '#fff', borderRadius: 16, padding: '16px 18px',
                      border: '1px solid #f1f5f9', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 14,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                      transition: 'all 0.15s',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = nav.color + '40'; e.currentTarget.style.boxShadow = `0 4px 16px ${nav.color}15` }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#f1f5f9'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.03)' }}
                    >
                      <div style={{ width: 40, height: 40, borderRadius: 12, background: nav.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <nav.icon size={18} color={nav.color} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={pjs(13, 700, '18px', COLORS.text)}>{nav.label}</div>
                        {nav.count && <div style={pjs(11, 500, '14px', COLORS.sub)}>{nav.count}</div>}
                      </div>
                      <ArrowRight size={14} color={COLORS.sub} style={{ marginLeft: 'auto', flexShrink: 0 }} />
                    </div>
                  </Link>
                ))}
              </div>

              {/* Attendance */}
              <AttendanceSection attendance={attendance} />

              {/* Fees + Courses side by side */}
              <div style={{ display: 'grid', gridTemplateColumns: fees && courses.length > 0 ? '1fr 1fr' : '1fr', gap: 20 }}>
                {fees && <FeesCard fees={fees} />}
                {courses.length > 0 && <CoursesCard courses={courses} />}
              </div>

              {/* Timetable preview */}
              {timetable?.structured?.length > 0 && (
                <div style={{ background: COLORS.surface, borderRadius: 24, border: `1px solid ${COLORS.border}`, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
                  <div style={{ padding: '20px 24px', borderBottom: `1px solid ${COLORS.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 12, background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Clock size={18} color="#ea580c" />
                    </div>
                    <div style={pjs(15, 700, '20px', COLORS.text)}>Timetable</div>
                    <span style={{ ...pjs(11, 600, '14px', '#ea580c'), background: '#fff7ed', padding: '2px 8px', borderRadius: 6, marginLeft: 4 }}>
                      {timetable.structured.length} slots
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 1, background: COLORS.border }}>
                    {timetable.structured.slice(0, 12).map((s, i) => (
                      <div key={i} style={{ background: '#fff', padding: '12px 16px' }}>
                        <div style={{ ...pjs(10, 700, '13px', COLORS.sub), marginBottom: 4 }}>{s.day} · {s.slot}</div>
                        <div style={pjs(13, 600, '18px', COLORS.text)}>{s.subject}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      <style>{`
        @keyframes spin    { from { transform: rotate(0deg)         } to { transform: rotate(360deg)       } }
        @keyframes pulse   { 0%, 100% { opacity: 1 } 50% { opacity: 0.5 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: translateY(0) } }
      `}</style>
    </PageLayout>
  )
}
