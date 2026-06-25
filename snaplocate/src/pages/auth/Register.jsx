import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { GoogleLogin } from '@react-oauth/google'

const pjs = (size, weight, color) => ({ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: size, fontWeight: weight, color, margin: 0 })
const inter = (size, weight, color) => ({ fontFamily: "'Inter', sans-serif", fontSize: size, fontWeight: weight, color, margin: 0 })

export default function Register() {
  const navigate = useNavigate()
  const { register, loginWithGoogle } = useAuth()

  const [step, setStep] = useState(1) // 1 = fill form, 2 = pick role
  const [form, setForm] = useState({ full_name: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [isTablet, setIsTablet] = useState(window.innerWidth >= 768 && window.innerWidth < 1024)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

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
      const res = await register({ full_name: form.full_name, email: form.email, password: form.password })
      // Go to OTP verify page — pass email and dev_otp (if server returned it)
      navigate('/verify-otp', { state: { email: form.email, dev_otp: res.dev_otp || '' } })
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true)
    setError('')
    try {
      const res = await loginWithGoogle(credentialResponse.credential)
      handleRedirect(res.user)
    } catch (err) {
      setError(err.message || 'Google signup failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleRedirect = (user) => {
    if (user.role === 'admin') navigate('/admin/dashboard', { replace: true })
    else if (user.role === 'faculty') navigate('/faculty/dashboard', { replace: true })
    else navigate('/dashboard', { replace: true })
  }

  const pageStyle = {
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    minHeight: '100dvh',
    background: '#f8fafc',
  }

  const leftStyle = {
    display: isMobile ? 'none' : 'flex',
    flex: 1,
    background: '#fff',
    borderRight: '1px solid #f1f5f9',
    alignItems: 'stretch',
    padding: isTablet ? '40px 36px' : '48px 56px',
  }

  const rightStyle = {
    width: isMobile ? '100%' : isTablet ? '380px' : '460px',
    minWidth: isMobile ? 'unset' : isTablet ? '380px' : '460px',
    display: 'flex',
    alignItems: isMobile ? 'flex-start' : 'center',
    justifyContent: 'center',
    padding: isMobile ? '32px 20px' : '40px 32px',
    overflowY: 'auto',
  }

  const cardStyle = {
    width: '100%',
    maxWidth: isMobile ? '100%' : '400px',
    background: '#fff',
    border: '1px solid #f1f5f9',
    borderRadius: 24,
    padding: isMobile ? '28px 20px' : '32px 28px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
  }

  return (
    <div style={pageStyle}>
      {/* Left branding */}
      <div style={leftStyle}>
        <div style={styles.leftInner}>
          <div style={styles.logo}>
            <img src="/images/snaplocate-lockup-light.svg" alt="SnapLocate" style={{ width: 180, height: 'auto', display: 'block' }} onError={e => e.target.style.display = 'none'} />

          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 16 }}>
            <div style={styles.badge}>🏫 Join Campus OS</div>
            <h1 style={{ ...pjs(isTablet ? 32 : 36, 800, '#0f172a'), lineHeight: isTablet ? '40px' : '44px' }}>
              Start your<br />
              <span style={{ color: '#4f46e5' }}>campus journey.</span>
            </h1>
            <p style={{ ...inter(15, 400, '#64748b'), lineHeight: '23px', maxWidth: 320 }}>
              Students and faculty — one platform, zero friction. Sign up in seconds.
            </p>
          </div>

          {/* Feature list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { icon: '🎓', label: 'Campus Access', desc: 'Find classrooms, resources, and peers' },
              { icon: '🔒', label: 'Secure Accounts', desc: 'Verified university members only' },
            ].map(r => (
              <div key={r.label} style={{
                ...styles.roleCard,
                background: '#fff',
                border: '1px solid #f1f5f9',
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
      <div style={rightStyle}>
        <div style={cardStyle}>
          {/* Logo on mobile */}
          {isMobile && (
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
              <img
                src="/images/snaplocate-lockup-light.svg"
                alt="SnapLocate"
                style={{ width: 180, height: 'auto', display: 'block' }}
                onError={e => e.target.style.display = 'none'}
              />
            </div>
          )}

          <div style={{ marginBottom: 24 }}>
            <h2 style={{ ...pjs(isMobile ? 24 : 26, 700, '#0f172a'), marginBottom: 6 }}>Create your account</h2>
            <p style={inter(14, 400, '#64748b')}>Join thousands of students & faculty on campus</p>
          </div>

          {error && (
            <div style={styles.errorBox}>
              <span style={{ fontSize: 16 }}>⚠️</span>
              <span style={inter(13, 500, '#991b1b')}>{error}</span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Google Signup was unsuccessful.')}
              useOneTap
              shape="pill"
              theme="outline"
              size="large"
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0' }}>
            <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
            <span style={{ ...inter(12, 500, '#64748b'), margin: '0 12px' }}>OR</span>
            <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

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
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
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
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
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
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
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
                onBlur={e => e.target.style.borderColor = form.confirm !== form.password ? '#f87171' : '#e2e8f0'}
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
  page: { display: 'flex', minHeight: '100dvh', background: '#f8fafc' },
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
