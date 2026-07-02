import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const OTP_LENGTH = 6

export default function VerifyOTP() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { verifyOtp, resendOtp } = useAuth()

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

  useEffect(() => {
    if (resendTimer <= 0) return
    const id = setInterval(() => setResendTimer(t => t - 1), 1000)
    return () => clearInterval(id)
  }, [resendTimer])

  useEffect(() => {
    if (!email) navigate('/register', { replace: true })
  }, [email, navigate])

  const handleChange = (i, val) => {
    if (!/^\d*$/.test(val)) return
    const next = [...otp]
    next[i] = val.slice(-1)
    setOtp(next)
    setError('')
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

  const isComplete = otp.join('').length === OTP_LENGTH

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-slate-50 font-inter p-6">
      <div className="w-full max-w-[420px] bg-white border border-slate-100 rounded-3xl px-9 py-10 shadow-[0_4px_24px_rgba(0,0,0,0.07)]">

        {/* Icon */}
        <div className="w-16 h-16 rounded-full bg-brand-light flex items-center justify-center mx-auto mb-5">
          <span className="text-[32px]">📧</span>
        </div>

        <h2 className="font-jakarta text-[26px] font-bold text-slate-900 text-center m-0 mb-2">
          Check your email
        </h2>
        <p className="text-[14px] text-slate-500 text-center leading-[21px] m-0 mb-7">
          We sent a 6-digit code to<br />
          <strong className="text-slate-900">{email}</strong>
        </p>

        {/* Dev mode banner */}
        {dev_otp && (
          <div className="bg-yellow-50 border border-yellow-300 rounded-[10px] px-3.5 py-2.5 mb-5 flex items-center gap-2">
            <span>🔑</span>
            <div>
              <div className="font-jakarta text-[12px] font-bold text-amber-800">Dev Mode — OTP Auto-filled</div>
              <div className="font-inter text-[13px] text-amber-900 mt-0.5">Code: <strong>{dev_otp}</strong> · Just click Verify Email ✓</div>
            </div>
          </div>
        )}

        {/* Alerts */}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-300 rounded-[10px] px-3.5 py-2.5 mb-4">
            <span>⚠️</span>
            <span className="font-inter text-[13px] font-medium text-red-800">{error}</span>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-300 rounded-[10px] px-3.5 py-2.5 mb-4">
            <span>✅</span>
            <span className="font-inter text-[13px] font-medium text-green-800">{success}</span>
          </div>
        )}

        {/* OTP boxes */}
        <div className="flex gap-2.5 justify-center mb-6" onPaste={handlePaste}>
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
              className="w-[52px] h-[58px] text-center text-[24px] font-bold border-2 rounded-xl outline-none transition-all duration-150 font-jakarta"
              style={{
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
          disabled={loading || !isComplete}
          className={`w-full py-3.5 bg-brand text-white border-none rounded-xl font-jakarta text-[15px] font-bold cursor-pointer transition-opacity ${loading || !isComplete ? 'opacity-60' : 'opacity-100'}`}
        >
          {loading ? 'Verifying…' : 'Verify Email ✓'}
        </button>

        {/* Resend */}
        <div className="text-center mt-5">
          <span className="font-inter text-[13px] text-slate-500">Didn't receive it? </span>
          <button
            id="resend-otp-btn"
            onClick={handleResend}
            disabled={resendTimer > 0 || resending}
            className={`bg-transparent border-none font-inter text-[13px] font-semibold m-0 p-0 ${resendTimer > 0 ? 'text-slate-400 cursor-default' : 'text-brand cursor-pointer'}`}
          >
            {resendTimer > 0 ? `Resend in ${resendTimer}s` : resending ? 'Sending…' : 'Resend OTP'}
          </button>
        </div>

        <div className="text-center mt-4">
          <Link to="/login" className="font-inter text-[13px] font-medium text-slate-500 no-underline">
            ← Back to login
          </Link>
        </div>
      </div>
    </div>
  )
}
