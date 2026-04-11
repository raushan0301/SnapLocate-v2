import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { supabaseAdmin } from '../lib/supabase.js'
import { sendOTPEmail } from '../lib/ses.js'
import { authLimiter, otpLimiter } from '../middleware/rateLimiter.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

// ─── Schemas ─────────────────────────────────────────────────
const registerSchema = z.object({
  full_name: z.string().min(2),
  email:     z.string().email(),
  password:  z.string().min(8),
  role:      z.enum(['student', 'faculty', 'admin']),
})

const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
})

const verifyOtpSchema = z.object({
  email: z.string().email(),
  otp:   z.string().length(6),
})

import crypto from 'crypto'

// Helper
function generateOTP() {
  return crypto.randomInt(100000, 999999).toString()
}

function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  })
}

// ─── POST /api/auth/register ─────────────────────────────────
router.post('/register', authLimiter, async (req, res) => {
  const data = registerSchema.parse(req.body)

  // Check if email already exists
  const { data: existing } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('email', data.email)
    .single()

  if (existing) {
    return res.status(409).json({ success: false, message: 'Email already registered' })
  }

  // Hash password
  const password_hash = await bcrypt.hash(data.password, 12)

  // Generate OTP
  const otp = generateOTP()
  const otp_expires_at = new Date(Date.now() + 10 * 60 * 1000).toISOString()

  // Insert user (unverified)
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .insert({
      full_name:      data.full_name,
      email:          data.email,
      password_hash,
      role:           data.role,
      is_verified:    false,
      otp,
      otp_expires_at,
    })
    .select('id, email, full_name, role')
    .single()

  if (error) throw error

  // Send OTP email — fire and forget (non-blocking)
  // If SES not configured, OTP is returned in dev mode
  sendOTPEmail(data.email, otp, data.full_name)
    .then(() => console.log(`✉️  OTP email sent to ${data.email}`))
    .catch((err) => console.warn(`⚠️  Email failed (using dev OTP fallback):`, err.message))

  const isDev = process.env.NODE_ENV !== 'production'
  console.log(`\n🔑 [DEV] OTP for ${data.email}: ${otp}\n`)

  res.status(201).json({
    success: true,
    message: 'Account created. Check your email for the verification OTP.',
    userId: user.id,
    // Return OTP in dev mode so you can test without email
    ...(isDev && { dev_otp: otp }),
  })
})

// ─── POST /api/auth/verify-otp ───────────────────────────────
router.post('/verify-otp', otpLimiter, async (req, res) => {
  const { email, otp } = verifyOtpSchema.parse(req.body)

  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('id, otp, otp_expires_at, is_verified, full_name, role')
    .eq('email', email)
    .single()

  if (error || !user) {
    return res.status(404).json({ success: false, message: 'User not found' })
  }

  if (user.is_verified) {
    return res.status(400).json({ success: false, message: 'Email already verified' })
  }

  if (user.otp !== otp) {
    return res.status(400).json({ success: false, message: 'Invalid OTP' })
  }

  if (new Date(user.otp_expires_at) < new Date()) {
    return res.status(400).json({ success: false, message: 'OTP expired. Please request a new one.' })
  }

  // Mark as verified
  await supabaseAdmin
    .from('users')
    .update({ is_verified: true, otp: null, otp_expires_at: null })
    .eq('id', user.id)

  const token = signToken(user.id)

  res.json({
    success: true,
    message: 'Email verified successfully!',
    token,
    user: { id: user.id, full_name: user.full_name, email, role: user.role },
  })
})

// ─── POST /api/auth/resend-otp ───────────────────────────────
router.post('/resend-otp', otpLimiter, async (req, res) => {
  const { email } = z.object({ email: z.string().email() }).parse(req.body)

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id, full_name, is_verified')
    .eq('email', email)
    .single()

  if (!user) return res.status(404).json({ success: false, message: 'User not found' })
  if (user.is_verified) return res.status(400).json({ success: false, message: 'Already verified' })

  const otp = generateOTP()
  const otp_expires_at = new Date(Date.now() + 10 * 60 * 1000).toISOString()

  await supabaseAdmin
    .from('users')
    .update({ otp, otp_expires_at })
    .eq('id', user.id)

  sendOTPEmail(email, otp, user.full_name)
    .then(() => console.log(`✉️  OTP resent to ${email}`))
    .catch((err) => console.warn(`⚠️  Resend email failed:`, err.message))

  console.log(`\n🔑 [DEV] Resend OTP for ${email}: ${otp}\n`)
  const isDev = process.env.NODE_ENV !== 'production'

  res.json({ success: true, message: 'New OTP sent to your email.', ...(isDev && { dev_otp: otp }) })
})

// ─── POST /api/auth/login ─────────────────────────────────────
router.post('/login', authLimiter, async (req, res) => {
  const { email, password } = loginSchema.parse(req.body)

  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('id, email, password_hash, full_name, role, avatar_url, is_verified')
    .eq('email', email)
    .single()

  if (error || !user) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' })
  }

  const isMatch = await bcrypt.compare(password, user.password_hash)
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' })
  }

  if (!user.is_verified) {
    return res.status(403).json({ success: false, message: 'Please verify your email first.' })
  }

  const token = signToken(user.id)

  res.json({
    success: true,
    token,
    user: {
      id:         user.id,
      email:      user.email,
      full_name:  user.full_name,
      role:       user.role,
      avatar_url: user.avatar_url,
    },
  })
})

// ─── GET /api/auth/me ─────────────────────────────────────────
router.get('/me', authenticate, async (req, res) => {
  res.json({ success: true, user: req.user })
})

// ─── POST /api/auth/logout ────────────────────────────────────
router.post('/logout', authenticate, (req, res) => {
  // JWT is stateless — client deletes the token
  res.json({ success: true, message: 'Logged out successfully' })
})

export default router
