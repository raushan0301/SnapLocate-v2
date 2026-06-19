import { useState, useEffect } from 'react'
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

  const [form, setForm] = useState({ email: '', password: '' })
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

  const pageStyle = {
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    minHeight: '100vh',
    fontFamily: "'Inter', sans-serif",
    background: '#f8fafc',
  }

  const leftStyle = {
    display: isMobile ? 'none' : 'flex',
    flex: 1,
    background: '#fff',
    borderRight: '1px solid #f1f5f9',
    alignItems: 'stretch',
    padding: isTablet ? '40px 36px' : '48px 56px',
    position: 'relative',
    minWidth: 0,
  }

  const rightStyle = {
    width: isMobile ? '100%' : isTablet ? '380px' : '440px',
    minWidth: isMobile ? 'unset' : isTablet ? '380px' : '440px',
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
    padding: isMobile ? '28px 20px' : '36px 32px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
  }

  return (
    <div style={pageStyle}>
      {/* Left panel — branding (hidden on mobile) */}
      <div style={leftStyle}>

        {/* ── Logo — pinned to top, aligned with content ── */}
        <div style={{
          position: 'absolute',
          top: 20,
          left: isTablet ? 36 : 56,
        }}>
          <img
            src="/images/img_logo.svg"
            alt="SnapLocate"
            style={{ width: 200, height: 'auto', display: 'block' }}
            onError={e => e.target.style.display = 'none'}
          />
        </div>

        {/* ── Inner layout: hero + cards ── */}
        <div style={styles.leftInner}>

          {/* ── Hero text — vertically centered ── */}
          <div style={styles.heroSection}>
            {/* <div style={styles.badge}>🎓 Campus OS</div> */}
            <h1 style={{ ...pjs(isTablet ? 32 : 40, 800, '#0f172a'), lineHeight: isTablet ? '40px' : '48px' }}>
              Your entire campus<br />
              <span style={{ color: '#4f46e5' }}>in one place.</span>
            </h1>
            <p style={{ ...inter(16, 400, '#64748b'), lineHeight: '26px', maxWidth: 360 }}>
              Professors, resources, societies, marketplace, lost &amp; found — all connected for you.
            </p>
          </div>

          {/* ── Feature cards — 2×3 grid (6 cards) ── */}
          <div style={styles.cardsGrid}>
            <div style={styles.floatCard}>
              <span style={{ fontSize: 20 }}>📚</span>
              <div>
                <div style={pjs(13, 700, '#0f172a')}>Resources</div>
                <div style={inter(12, 400, '#64748b')}>Notes, Labs, PYQs</div>
              </div>
            </div>
            <div style={styles.floatCard}>
              <span style={{ fontSize: 20 }}>🧑‍🏫</span>
              <div>
                <div style={pjs(13, 700, '#0f172a')}>Professors</div>
                <div style={inter(12, 400, '#64748b')}>Office hours &amp; more</div>
              </div>
            </div>
            <div style={styles.floatCard}>
              <span style={{ fontSize: 20 }}>🏛️</span>
              <div>
                <div style={pjs(13, 700, '#0f172a')}>Societies</div>
                <div style={inter(12, 400, '#64748b')}>Clubs &amp; events</div>
              </div>
            </div>
            <div style={styles.floatCard}>
              <span style={{ fontSize: 20 }}>🔍</span>
              <div>
                <div style={pjs(13, 700, '#0f172a')}>Lost &amp; Found</div>
                <div style={inter(12, 400, '#64748b')}>Report &amp; recover</div>
              </div>
            </div>
            <div style={styles.floatCard}>
              <span style={{ fontSize: 20 }}>🛒</span>
              <div>
                <div style={pjs(13, 700, '#0f172a')}>Marketplace</div>
                <div style={inter(12, 400, '#64748b')}>Buy &amp; sell items</div>
              </div>
            </div>
            <div style={styles.floatCard}>
              <span style={{ fontSize: 20 }}>🖥️</span>
              <div>
                <div style={pjs(13, 700, '#0f172a')}>Workspace</div>
                <div style={inter(12, 400, '#64748b')}>Study &amp; collaborate</div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Right panel — form */}
      <div style={rightStyle}>
        <div style={cardStyle}>
          {/* Logo on mobile */}
          {isMobile && (
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
              <img
                src="/images/img_logo.svg"
                alt="SnapLocate"
                style={{ width: 200, height: 'auto', display: 'block' }}
                onError={e => e.target.style.display = 'none'}
              />
            </div>
          )}

          <div style={{ marginBottom: 28 }}>
            <h2 style={{ ...pjs(isMobile ? 24 : 28, 700, '#0f172a'), marginBottom: 6 }}>Welcome back 👋</h2>
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
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
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
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
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
  leftInner: {
    display: 'flex', flexDirection: 'column',
    width: '100%', height: '100%',
    justifyContent: 'space-between',
    paddingTop: 0,
  },

  heroSection: {
    display: 'flex', flexDirection: 'column', gap: 16,
    alignItems: 'flex-start',
    flex: 1, justifyContent: 'center',
  },
  cardsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
    width: '100%',
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
    minWidth: 0,
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
