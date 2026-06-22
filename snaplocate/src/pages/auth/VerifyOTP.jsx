import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const pjs   = (size, weight, color) => ({ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: size, fontWeight: weight, color, margin: 0 })
const inter = (size, weight, color) => ({ fontFamily: "'Inter', sans-serif", fontSize: size, fontWeight: weight, color, margin: 0 })

const OTP_LENGTH = 6

export default function VerifyOTP() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { verifyOtp, resendOtp } = useAuth()

  // email passed via navigate state or fallback
  const email   = location.state?.email   || ''
  const dev_otp = location.state?.dev_otp || ''

  const [otp,     setOtp]     = useState(() =>
    dev_otp ? dev_otp.split('') : Array(OTP_LENGTH).fill('')
  )
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendTimer, setResendTimer] = useState(60)
  const [resending, setResending] = useState(false)
  const inputRefs = useRef([])

  // Countdown timer for resend
  useEffect(() => {
    if (resendTimer <= 0) return
    const id = setInterval(() => setResendTimer(t => t - 1), 1000)
    return () => clearInterval(id)
  }, [resendTimer])

  // Redirect if no email passed
  useEffect(() => {
    if (!email) navigate('/register', { replace: true })
  }, [email, navigate])

  const handleChange = (i, val) => {
    // Only accept digits
    if (!/^\d*$/.test(val)) return
    const next = [...otp]
    next[i] = val.slice(-1)
    setOtp(next)
    setError('')
    // Auto-focus next
    if (val && i < OTP_LENGTH - 1) inputRefs.current[i + 1]?.focus()
  }

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) {
      inputRefs.current[i - 1]?.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH)
    const next = [...otp]
    digits.split('').forEach((d, i) => { next[i] = d })
    setOtp(next)
    inputRefs.current[Math.min(digits.length, OTP_LENGTH - 1)]?.focus()
  }

  const handleVerify = async () => {
    const code = otp.join('')
    if (code.length < OTP_LENGTH) { setError('Please enter the full 6-digit code.'); return }
    setError('')
    setLoading(true)
    try {
      const res = await verifyOtp({ email, otp: code })
      setSuccess('Email verified! Redirecting…')
      setTimeout(() => {
        if (res.user?.role === 'faculty') navigate('/faculty/dashboard', { replace: true })
        else navigate('/dashboard', { replace: true })
      }, 1200)
    } catch (err) {
      setError(err.message || 'Invalid OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (resendTimer > 0 || resending) return
    setResending(true)
    try {
      await resendOtp(email)
      setSuccess('New OTP sent to your email.')
      setResendTimer(60)
      setOtp(Array(OTP_LENGTH).fill(''))
      inputRefs.current[0]?.focus()
    } catch (err) {
      setError(err.message || 'Failed to resend OTP.')
    } finally {
      setResending(false)
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Icon */}
        <div style={styles.iconWrap}>
          <span style={{ fontSize: 32 }}>📧</span>
        </div>

        <h2 style={{ ...pjs(26, 700, '#0f172a'), textAlign: 'center', marginBottom: 8 }}>
          Check your email
        </h2>
        <p style={{ ...inter(14, 400, '#64748b'), textAlign: 'center', lineHeight: '21px', marginBottom: dev_otp ? 12 : 28 }}>
          We sent a 6-digit code to<br />
          <strong style={{ color: '#0f172a' }}>{email}</strong>
        </p>

        {/* Dev mode banner — auto-filled OTP */}
        {dev_otp && (
          <div style={{
            background: '#fefce8', border: '1px solid #fde047', borderRadius: 10,
            padding: '10px 14px', marginBottom: 20,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span>🔑</span>
            <div>
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, fontWeight: 700, color: '#854d0e' }}>
                Dev Mode — OTP Auto-filled
              </div>
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#713f12', marginTop: 2 }}>
                Code: <strong>{dev_otp}</strong> · Just click Verify Email ✓
              </div>
            </div>
          </div>
        )}

        {/* Alerts */}
        {error && (
          <div style={styles.alert('error')}>
            <span>⚠️</span>
            <span style={inter(13, 500, '#991b1b')}>{error}</span>
          </div>
        )}
        {success && (
          <div style={styles.alert('success')}>
            <span>✅</span>
            <span style={inter(13, 500, '#166534')}>{success}</span>
          </div>
        )}

        {/* OTP boxes */}
        <div style={styles.otpRow} onPaste={handlePaste}>
          {otp.map((digit, i) => (
            <input
              key={i}
              id={`otp-${i}`}
              ref={el => inputRefs.current[i] = el}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              style={{
                ...styles.otpBox,
                borderColor: error ? '#f87171' : digit ? '#4f46e5' : '#e2e8f0',
                background:  digit ? '#eef2ff' : '#fff',
                color:       digit ? '#4f46e5' : '#0f172a',
              }}
            />
          ))}
        </div>

        {/* Verify button */}
        <button
          id="verify-otp-btn"
          onClick={handleVerify}
          disabled={loading || otp.join('').length < OTP_LENGTH}
          style={{
            ...styles.btnPrimary,
            opacity: loading || otp.join('').length < OTP_LENGTH ? 0.6 : 1,
          }}
        >
          {loading ? 'Verifying…' : 'Verify Email ✓'}
        </button>

        {/* Resend */}
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <span style={inter(13, 400, '#64748b')}>Didn't receive it? </span>
          <button
            id="resend-otp-btn"
            onClick={handleResend}
            disabled={resendTimer > 0 || resending}
            style={{
              background: 'none', border: 'none', cursor: resendTimer > 0 ? 'default' : 'pointer',
              ...inter(13, 600, resendTimer > 0 ? '#94a3b8' : '#4f46e5'),
            }}
          >
            {resendTimer > 0 ? `Resend in ${resendTimer}s` : resending ? 'Sending…' : 'Resend OTP'}
          </button>
        </div>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Link to="/login" style={{ ...inter(13, 500, '#64748b'), textDecoration: 'none' }}>
            ← Back to login
          </Link>
        </div>
      </div>
    </div>
  )
}

const styles = {
  page: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    minHeight: '100dvh', background: '#f8fafc',
    fontFamily: "'Inter', sans-serif", padding: 24,
  },
  card: {
    width: '100%', maxWidth: 420,
    background: '#fff', border: '1px solid #f1f5f9',
    borderRadius: 24, padding: '40px 36px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
  },
  iconWrap: {
    width: 64, height: 64, borderRadius: 32,
    background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 20px',
  },
  alert: (type) => ({
    display: 'flex', alignItems: 'center', gap: 8,
    background: type === 'error' ? '#fef2f2' : '#f0fdf4',
    border: `1px solid ${type === 'error' ? '#fca5a5' : '#86efac'}`,
    borderRadius: 10, padding: '10px 14px', marginBottom: 16,
  }),
  otpRow: {
    display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 24,
  },
  otpBox: {
    width: 52, height: 58, textAlign: 'center',
    fontSize: 24, fontWeight: 700,
    border: '2px solid', borderRadius: 12,
    outline: 'none', transition: 'all 0.15s',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  btnPrimary: {
    width: '100%', padding: '14px',
    background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 12,
    fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 15, fontWeight: 700,
    cursor: 'pointer', transition: 'opacity 0.15s',
  },
}
