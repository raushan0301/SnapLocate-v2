import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import { User, RefreshCw, ArrowLeft, Phone, Mail, MapPin, BookOpen, Droplet, Users } from 'lucide-react'

const pjs = (s, w, lh, c) => ({ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: s, fontWeight: w, lineHeight: lh, color: c })

function InfoField({ label, value, icon: Icon, color = '#4f46e5' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, ...pjs(10, 700, '13px', '#94a3b8') }}>
        {Icon && <Icon size={10} color="#94a3b8" />}
        {label.toUpperCase()}
      </div>
      <div style={pjs(14, 600, '20px', value ? '#0f172a' : '#cbd5e1')}>
        {value || '—'}
      </div>
    </div>
  )
}

export default function StudentProfileView() {
  const { user }                          = useAuth()
  const [wkProfile, setWkProfile]         = useState(null)   // from WebKiosk sync
  const [dbProfile, setDbProfile]         = useState(null)   // from student_profiles table
  const [result, setResult]               = useState(null)
  const [loading, setLoading]             = useState(true)
  const [syncing, setSyncing]             = useState(false)
  const [lastSync, setLastSync]           = useState('')
  const [connected, setConnected]         = useState(false)

  const load = useCallback(async () => {
    try {
      // Load WebKiosk profile
      const [wkRes, dbRes, resRes] = await Promise.allSettled([
        api.get('/api/webkiosk/profile'),
        api.get('/api/student-profiles/me'),
        api.get('/api/webkiosk/result'),
      ])

      if (wkRes.status === 'fulfilled' && wkRes.value.success) {
        setWkProfile(wkRes.value.data || null)
        setLastSync(wkRes.value.lastSyncedAt || '')
        setConnected(true)
      }
      if (dbRes.status === 'fulfilled' && dbRes.value.success) setDbProfile(dbRes.value.data || null)
      if (resRes.status === 'fulfilled' && resRes.value.success) setResult(resRes.value.data || null)
    } catch {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const syncNow = async () => {
    setSyncing(true)
    try { await api.post('/api/webkiosk/sync', {}) } catch {}
    for (let i = 0; i < 40; i++) {
      await new Promise(r => setTimeout(r, 3000))
      const r = await api.get('/api/webkiosk/profile').catch(() => null)
      if (r?.syncStatus && r.syncStatus !== 'pending' && r.syncStatus !== 'running') {
        setWkProfile(r.data || null)
        setLastSync(r.lastSyncedAt || '')
        break
      }
    }
    setSyncing(false)
  }

  // Merge: WebKiosk data takes priority for academic fields
  const p = wkProfile || {}
  const d = dbProfile  || {}

  const enrollmentNo = p.enrollmentNo || d.enrollment_no || ''
  const rollNo       = p.rollNo       || d.roll_no       || ''
  const branch       = p.branch       || d.branch        || ''
  const section      = p.section      || d.section       || ''
  const semester     = p.semester     || d.semester      || ''
  const batchYear    = p.batchYear    || d.batch_year    || ''
  const cgpa         = result?.cgpa   || d.current_cgpa  || ''

  return (
    <PageLayout>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link to="/webkiosk" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', textDecoration: 'none', ...pjs(13, 600, '18px', '#64748b') }}>
            <ArrowLeft size={14} /> WebKiosk
          </Link>
          <div>
            <h1 style={{ ...pjs(26, 800, '32px', '#0f172a'), margin: 0 }}>Academic Profile</h1>
            <div style={{ ...pjs(12, 400, '16px', '#64748b'), marginTop: 2 }}>
              {lastSync ? `Synced from WebKiosk ${new Date(lastSync).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}` : 'Connect WebKiosk to auto-fill your profile'}
            </div>
          </div>
        </div>
        {connected && (
          <button onClick={syncNow} disabled={syncing} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 12,
            border: 'none', cursor: syncing ? 'not-allowed' : 'pointer',
            background: syncing ? '#e2e8f0' : '#4f46e5',
            ...pjs(13, 700, '18px', syncing ? '#94a3b8' : '#fff'),
          }}>
            <RefreshCw size={13} style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
            {syncing ? 'Syncing…' : 'Sync Now'}
          </button>
        )}
      </div>

      {/* Hero card */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 55%, #0f172a 100%)',
        borderRadius: 24, padding: '32px 36px', position: 'relative', overflow: 'hidden',
        boxShadow: '0 16px 48px rgba(79,70,229,0.2)',
      }}>
        {/* Glow blobs */}
        <div style={{ position: 'absolute', top: -60, left: -40, width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle,rgba(99,102,241,0.3) 0%,transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -50, right: -30, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle,rgba(139,92,246,0.2) 0%,transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start', position: 'relative' }}>
          {/* Avatar / WebKiosk photo */}
          <div style={{
            width: 96, height: 96, borderRadius: 24, flexShrink: 0, overflow: 'hidden',
            background: p.photoUrl ? 'transparent' : 'linear-gradient(135deg,#4f46e5,#7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '3px solid rgba(255,255,255,0.15)',
          }}>
            {p.photoUrl
              ? <img src={p.photoUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={e => { e.target.style.display = 'none' }} />
              : user?.avatar_url
                ? <img src={user.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={pjs(32, 800, '40px', '#fff')}>{(p.name || user?.full_name || 'S')[0]}</span>
            }
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ ...pjs(28, 800, '34px', '#fff'), marginBottom: 4 }}>{p.name || user?.full_name || '—'}</div>
            <div style={{ ...pjs(14, 400, '20px', 'rgba(255,255,255,0.6)'), marginBottom: 18 }}>
              {p.program || '—'} · {p.branch || '—'}
            </div>

            {/* Tags */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {[
                { label: 'Enrollment', value: enrollmentNo },
                { label: 'Roll No',    value: rollNo },
                { label: 'Section',    value: section },
                { label: 'Semester',   value: semester },
                { label: 'Batch',      value: batchYear },
                { label: 'Category',   value: p.category },
              ].filter(f => f.value).map((f, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '6px 12px' }}>
                  <div style={pjs(9, 700, '11px', 'rgba(255,255,255,0.45)')}>{f.label.toUpperCase()}</div>
                  <div style={pjs(13, 700, '18px', '#fff')}>{f.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* CGPA badge */}
          {cgpa && (
            <div style={{
              background: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
              borderRadius: 20, padding: '18px 22px', textAlign: 'center', flexShrink: 0,
              border: '1px solid rgba(255,255,255,0.15)',
              boxShadow: '0 8px 24px rgba(79,70,229,0.4)',
            }}>
              <div style={pjs(10, 700, '12px', 'rgba(255,255,255,0.7)')}>CGPA</div>
              <div style={{ ...pjs(34, 900, '40px', '#fff'), fontVariantNumeric: 'tabular-nums' }}>{cgpa}</div>
              {result?.sgpa && <div style={pjs(11, 500, '14px', 'rgba(255,255,255,0.5)')}>SGPA {result.sgpa}</div>}
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', ...pjs(14, 500, '20px', '#94a3b8') }}>Loading profile…</div>
      ) : (
        <>
          {/* Academic Info */}
          <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9', padding: '28px', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BookOpen size={18} color="#4f46e5" />
              </div>
              <div style={pjs(15, 700, '20px', '#0f172a')}>Academic Information</div>
              {connected && <span style={{ ...pjs(10, 700, '12px', '#4f46e5'), background: '#eef2ff', padding: '2px 8px', borderRadius: 6, marginLeft: 6 }}>FROM WEBKIOSK</span>}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
              <InfoField label="Enrollment No" value={enrollmentNo} />
              <InfoField label="Roll No"        value={rollNo} />
              <InfoField label="Program"        value={p.program} />
              <InfoField label="Branch"         value={branch} icon={BookOpen} />
              <InfoField label="Semester"       value={semester} />
              <InfoField label="Section"        value={section} />
              <InfoField label="Batch Year"     value={batchYear} />
              <InfoField label="Category"       value={p.category} />
              <InfoField label="Date of Birth"  value={p.dateOfBirth} />
            </div>
          </div>

          {/* Personal Info */}
          {(p.name || p.fatherName || p.motherName || p.bloodGroup) && (
            <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9', padding: '28px', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#fdf4ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={18} color="#7e22ce" />
                </div>
                <div style={pjs(15, 700, '20px', '#0f172a')}>Personal Information</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
                <InfoField label="Full Name"     value={p.name} />
                <InfoField label="Father's Name" value={p.fatherName} />
                <InfoField label="Mother's Name" value={p.motherName} />
                <InfoField label="Blood Group"   value={p.bloodGroup} icon={Droplet} />
              </div>
            </div>
          )}

          {/* Contact Info */}
          {(p.email || p.mobile || p.address) && (
            <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9', padding: '28px', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Phone size={18} color="#16a34a" />
                </div>
                <div style={pjs(15, 700, '20px', '#0f172a')}>Contact Details</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
                <InfoField label="Email"   value={p.email}   icon={Mail} />
                <InfoField label="Mobile"  value={p.mobile}  icon={Phone} />
                <InfoField label="Address" value={p.address} icon={MapPin} />
              </div>
            </div>
          )}

          {/* Not connected state */}
          {!connected && (
            <div style={{ background: '#fff', borderRadius: 20, border: '1.5px dashed #e2e8f0', padding: '48px 24px', textAlign: 'center' }}>
              <User size={40} color="#e2e8f0" style={{ margin: '0 auto 12px', display: 'block' }} />
              <div style={{ ...pjs(15, 700, '20px', '#0f172a'), marginBottom: 8 }}>Connect WebKiosk to auto-fill your academic profile</div>
              <Link to="/webkiosk" style={{ ...pjs(13, 700, '18px', '#4f46e5'), textDecoration: 'none' }}>Go to WebKiosk →</Link>
            </div>
          )}
        </>
      )}

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </PageLayout>
  )
}
