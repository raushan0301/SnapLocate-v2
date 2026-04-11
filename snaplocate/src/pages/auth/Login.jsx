import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

/* ── style helpers ──────────────────────────────────────────── */
const pjs = (size, weight, color) => ({
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  fontSize: size, fontWeight: weight, color, margin: 0,
})
const inter = (size, weight, color) => ({
  fontFamily: "'Inter', sans-serif",
  fontSize: size, fontWeight: weight, color, margin: 0,
})

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [form, setForm]     = useState({ email: '', password: '' })
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.email || !form.password) { setError('Please fill in all fields.'); return }
    setLoading(true)
    try {
      const res = await login(form)
      // Role-based redirect
      if (res.user.role === 'admin') navigate('/admin/dashboard', { replace: true })
      else if (res.user.role === 'faculty') navigate('/faculty/dashboard', { replace: true })
      else navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      {/* Left panel — branding */}
      <div style={styles.left}>
        <div style={styles.leftInner}>
          <div style={styles.logo}>
            <img src="/images/img_logo.svg" alt="SnapLocate" style={{ width: 28, height: 28 }} onError={e => e.target.style.display='none'} />
            <span style={pjs(20, 700, '#0f172a')}>SnapLocate</span>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 16 }}>
            <div style={styles.badge}>🎓 Campus OS</div>
            <h1 style={{ ...pjs(40, 800, '#0f172a'), lineHeight: '48px' }}>
              Your entire campus<br />
              <span style={{ color: '#4f46e5' }}>in one place.</span>
            </h1>
            <p style={{ ...inter(16, 400, '#64748b'), lineHeight: '24px', maxWidth: 340 }}>
              Professors, resources, societies, marketplace, lost & found — all connected for you.
            </p>
          </div>
          {/* Floating cards */}
          <div style={styles.floatCard}>
            <span style={{ fontSize: 20 }}>📚</span>
            <div>
              <div style={pjs(13, 700, '#0f172a')}>Resources</div>
              <div style={inter(12, 400, '#64748b')}>Notes, Labs, PYQs</div>
            </div>
          </div>
          <div style={{ ...styles.floatCard, bottom: 80, right: -20 }}>
            <span style={{ fontSize: 20 }}>🧑‍🏫</span>
            <div>
              <div style={pjs(13, 700, '#0f172a')}>Find Professors</div>
              <div style={inter(12, 400, '#64748b')}>Office hours & more</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div style={styles.right}>
        <div style={styles.card}>
          <div style={{ marginBottom: 28 }}>
            <h2 style={{ ...pjs(28, 700, '#0f172a'), marginBottom: 6 }}>Welcome back 👋</h2>
            <p style={inter(15, 400, '#64748b')}>Sign in to your SnapLocate account</p>
          </div>

          {error && (
            <div style={styles.errorBox}>
              <span style={{ fontSize: 16 }}>⚠️</span>
              <span style={inter(13, 500, '#991b1b')}>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Email */}
            <div style={styles.field}>
              <label style={styles.label}>Email address</label>
              <input
                id="login-email"
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={styles.label}>Password</label>
                <button type="button" onClick={() => setShowPass(p => !p)} style={styles.textBtn}>
                  {showPass ? 'Hide' : 'Show'}
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={set('password')}
                  style={styles.input}
                  onFocus={e => e.target.style.borderColor = '#4f46e5'}
                  onBlur={e  => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>
            </div>

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              style={{ ...styles.btnPrimary, opacity: loading ? 0.7 : 1, marginTop: 4 }}
            >
              {loading ? 'Signing in…' : 'Sign In →'}
            </button>
          </form>

          <div style={styles.divider}><span style={inter(12, 500, '#94a3b8')}>Don't have an account?</span></div>

          <Link to="/register" style={{ textDecoration: 'none' }}>
            <button id="go-register" style={styles.btnSecondary}>
              Create Account
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}

/* ── styles ─────────────────────────────────────────────────── */
const styles = {
  page: {
    display: 'flex', minHeight: '100vh',
    fontFamily: "'Inter', sans-serif",
    background: '#f8fafc',
  },
  left: {
    flex: 1, background: '#fff',
    borderRight: '1px solid #f1f5f9',
    display: 'flex', alignItems: 'stretch',
    padding: '48px 56px',
    position: 'relative', overflow: 'hidden',
  },
  leftInner: {
    display: 'flex', flexDirection: 'column', width: '100%', position: 'relative',
  },
  logo: {
    display: 'flex', alignItems: 'center', gap: 10, marginBottom: 48,
  },
  badge: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    background: '#eef2ff', borderRadius: 20, padding: '6px 14px',
    fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 600, color: '#4f46e5',
    width: 'fit-content',
  },
  floatCard: {
    display: 'flex', alignItems: 'center', gap: 12,
    background: '#fff', border: '1px solid #f1f5f9',
    borderRadius: 16, padding: '12px 16px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
    width: 'fit-content', marginBottom: 12,
    position: 'relative',
  },
  right: {
    width: 440, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 32px',
  },
  card: {
    width: '100%', background: '#fff',
    border: '1px solid #f1f5f9',
    borderRadius: 24, padding: '36px 32px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
  },
  errorBox: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10,
    padding: '10px 14px', marginBottom: 16,
  },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: 13, fontWeight: 600, color: '#374151',
  },
  input: {
    width: '100%', padding: '11px 14px',
    border: '1.5px solid #e2e8f0', borderRadius: 10,
    fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#0f172a',
    outline: 'none', background: '#fff',
    transition: 'border-color 0.15s',
    boxSizing: 'border-box',
  },
  btnPrimary: {
    width: '100%', padding: '13px',
    background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 12,
    fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 15, fontWeight: 700,
    cursor: 'pointer', transition: 'background 0.15s',
  },
  btnSecondary: {
    width: '100%', padding: '13px',
    background: '#f8fafc', color: '#0f172a', border: '1.5px solid #e2e8f0', borderRadius: 12,
    fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 15, fontWeight: 600,
    cursor: 'pointer',
  },
  textBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 500, color: '#4f46e5',
  },
  divider: {
    textAlign: 'center', padding: '18px 0 14px',
  },
}
