import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const pjs   = (size, weight, color) => ({ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: size, fontWeight: weight, color, margin: 0 })
const inter = (size, weight, color) => ({ fontFamily: "'Inter', sans-serif", fontSize: size, fontWeight: weight, color, margin: 0 })

export default function Register() {
  const navigate = useNavigate()
  const { register } = useAuth()

  const [step,    setStep]    = useState(1) // 1 = fill form, 2 = pick role
  const [form,    setForm]    = useState({ full_name: '', email: '', password: '', confirm: '', role: 'student' })
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const validate = () => {
    if (!form.full_name.trim()) return 'Please enter your full name.'
    if (!form.email.includes('@')) return 'Please enter a valid email.'
    if (form.password.length < 8) return 'Password must be at least 8 characters.'
    if (form.password !== form.confirm) return 'Passwords do not match.'
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const err = validate()
    if (err) { setError(err); return }
    setLoading(true)
    try {
      const res = await register({ full_name: form.full_name, email: form.email, password: form.password, role: form.role })
      // Go to OTP verify page — pass email and dev_otp (if server returned it)
      navigate('/verify-otp', { state: { email: form.email, dev_otp: res.dev_otp || '' } })
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      {/* Left branding */}
      <div style={styles.left}>
        <div style={styles.leftInner}>
          <div style={styles.logo}>
            <img src="/images/img_logo.svg" alt="SnapLocate" style={{ width: 28, height: 28 }} onError={e => e.target.style.display='none'} />
            <span style={pjs(20, 700, '#0f172a')}>SnapLocate</span>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 16 }}>
            <div style={styles.badge}>🏫 Join Campus OS</div>
            <h1 style={{ ...pjs(36, 800, '#0f172a'), lineHeight: '44px' }}>
              Start your<br />
              <span style={{ color: '#4f46e5' }}>campus journey.</span>
            </h1>
            <p style={{ ...inter(15, 400, '#64748b'), lineHeight: '23px', maxWidth: 320 }}>
              Students and faculty — one platform, zero friction. Sign up in seconds.
            </p>
          </div>

          {/* Role preview cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { icon: '🎓', label: 'Student', desc: 'Access resources, find professors, more' },
              { icon: '🧑‍🏫', label: 'Faculty', desc: 'Manage profile, accept requests, share resources' },
              { icon: '👑', label: 'Admin', desc: 'Manage platform, verify users, control campus data' },
            ].map(r => (
              <div key={r.label} style={{
                ...styles.roleCard,
                background: form.role === r.label.toLowerCase() ? '#eef2ff' : '#fff',
                border: form.role === r.label.toLowerCase() ? '1.5px solid #6366f1' : '1px solid #f1f5f9',
              }}>
                <span style={{ fontSize: 22 }}>{r.icon}</span>
                <div>
                  <div style={pjs(13, 700, '#0f172a')}>{r.label}</div>
                  <div style={inter(12, 400, '#64748b')}>{r.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — form */}
      <div style={styles.right}>
        <div style={styles.card}>
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ ...pjs(26, 700, '#0f172a'), marginBottom: 6 }}>Create your account</h2>
            <p style={inter(14, 400, '#64748b')}>Join thousands of students & faculty on campus</p>
          </div>

          {error && (
            <div style={styles.errorBox}>
              <span style={{ fontSize: 16 }}>⚠️</span>
              <span style={inter(13, 500, '#991b1b')}>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Role toggle */}
            <div style={styles.field}>
              <label style={styles.label}>I am a</label>
              <div style={styles.roleToggle}>
                {['student', 'faculty', 'admin'].map(r => (
                  <button
                    key={r} type="button"
                    id={`role-${r}`}
                    onClick={() => setForm(f => ({ ...f, role: r }))}
                    style={{
                      ...styles.roleBtn,
                      background: form.role === r ? '#4f46e5' : 'transparent',
                      color:      form.role === r ? '#fff'    : '#64748b',
                      fontWeight: form.role === r ? 700       : 500,
                    }}
                  >
                    {r === 'student' ? '🎓 Student' : r === 'faculty' ? '🧑‍🏫 Faculty' : '👑 Admin'}
                  </button>
                ))}
              </div>
            </div>

            {/* Full name */}
            <div style={styles.field}>
              <label style={styles.label}>Full name</label>
              <input
                id="reg-name"
                type="text"
                autoComplete="name"
                placeholder="Raushan Raj"
                value={form.full_name}
                onChange={set('full_name')}
                style={styles.input}
                onFocus={e => e.target.style.borderColor = '#4f46e5'}
                onBlur={e  => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>

            {/* Email */}
            <div style={styles.field}>
              <label style={styles.label}>Email address</label>
              <input
                id="reg-email"
                type="email"
                autoComplete="email"
                placeholder="you@university.edu"
                value={form.email}
                onChange={set('email')}
                style={styles.input}
                onFocus={e => e.target.style.borderColor = '#4f46e5'}
                onBlur={e  => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>

            {/* Password */}
            <div style={styles.field}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <label style={styles.label}>Password</label>
                <button type="button" onClick={() => setShowPass(p => !p)} style={styles.textBtn}>
                  {showPass ? 'Hide' : 'Show'}
                </button>
              </div>
              <input
                id="reg-password"
                type={showPass ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Min. 8 characters"
                value={form.password}
                onChange={set('password')}
                style={styles.input}
                onFocus={e => e.target.style.borderColor = '#4f46e5'}
                onBlur={e  => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>

            {/* Confirm password */}
            <div style={styles.field}>
              <label style={styles.label}>Confirm password</label>
              <input
                id="reg-confirm"
                type={showPass ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Re-enter password"
                value={form.confirm}
                onChange={set('confirm')}
                style={{
                  ...styles.input,
                  borderColor: form.confirm && form.confirm !== form.password ? '#f87171' : '#e2e8f0',
                }}
                onFocus={e => e.target.style.borderColor = '#4f46e5'}
                onBlur={e  => e.target.style.borderColor = form.confirm !== form.password ? '#f87171' : '#e2e8f0'}
              />
            </div>

            {/* Submit */}
            <button
              id="reg-submit"
              type="submit"
              disabled={loading}
              style={{ ...styles.btnPrimary, opacity: loading ? 0.7 : 1, marginTop: 4 }}
            >
              {loading ? 'Creating account…' : 'Create Account →'}
            </button>
          </form>

          <div style={styles.divider}>
            <span style={inter(13, 400, '#64748b')}>Already have an account? </span>
            <Link to="/login" style={{ ...inter(13, 600, '#4f46e5'), textDecoration: 'none' }}>Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

const styles = {
  page: { display: 'flex', minHeight: '100vh', background: '#f8fafc' },
  left: {
    flex: 1, background: '#fff', borderRight: '1px solid #f1f5f9',
    display: 'flex', alignItems: 'stretch', padding: '48px 56px',
  },
  leftInner: { display: 'flex', flexDirection: 'column', width: '100%', gap: 16 },
  logo: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 },
  badge: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    background: '#eef2ff', borderRadius: 20, padding: '6px 14px',
    fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 600, color: '#4f46e5',
    width: 'fit-content',
  },
  roleCard: {
    display: 'flex', alignItems: 'center', gap: 12,
    borderRadius: 14, padding: '12px 16px',
    transition: 'all 0.15s',
  },
  right: { width: 460, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 32px' },
  card: {
    width: '100%', background: '#fff', border: '1px solid #f1f5f9',
    borderRadius: 24, padding: '32px 28px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
  },
  errorBox: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10,
    padding: '10px 14px', marginBottom: 14,
  },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 600, color: '#374151' },
  input: {
    width: '100%', padding: '11px 14px',
    border: '1.5px solid #e2e8f0', borderRadius: 10,
    fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#0f172a',
    outline: 'none', background: '#fff', transition: 'border-color 0.15s',
    boxSizing: 'border-box',
  },
  roleToggle: {
    display: 'flex', background: '#f1f5f9', borderRadius: 10,
    padding: 3, gap: 3,
  },
  roleBtn: {
    flex: 1, padding: '9px', border: 'none', borderRadius: 8,
    fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14,
    cursor: 'pointer', transition: 'all 0.15s',
  },
  btnPrimary: {
    width: '100%', padding: '13px',
    background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 12,
    fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 15, fontWeight: 700,
    cursor: 'pointer',
  },
  textBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 500, color: '#4f46e5',
  },
  divider: { textAlign: 'center', paddingTop: 20 },
}
