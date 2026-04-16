import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '../lib/supabase.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

// ─── GET /api/users/profile ──────────────────────────────────
router.get('/profile', authenticate, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('id, email, full_name, role, avatar_url, preferences, created_at')
    .eq('id', req.user.id)
    .single()

  if (error) return res.status(500).json({ success: false, message: error.message })
  res.json({ success: true, data })
})

// ─── PATCH /api/users/profile ────────────────────────────────
router.patch('/profile', authenticate, async (req, res) => {
  const { full_name, avatar_url } = req.body
  const { data, error } = await supabaseAdmin
    .from('users')
    .update({ 
      full_name, 
      avatar_url, 
      updated_at: new Date().toISOString() 
    })
    .eq('id', req.user.id)
    .select('id, email, full_name, role, avatar_url, preferences')
    .single()

  if (error) return res.status(500).json({ success: false, message: error.message })
  res.json({ success: true, data })
})

// ─── PUT /api/users/password ─────────────────────────────────
router.put('/password', authenticate, async (req, res) => {
  const { current_password, new_password } = req.body

  if (!current_password || !new_password) {
    return res.status(400).json({ success: false, message: 'Missing passwords' })
  }

  // Verification step: get original hash
  const { data: user, error: fetchErr } = await supabaseAdmin
    .from('users')
    .select('password_hash')
    .eq('id', req.user.id)
    .single()

  if (fetchErr || !user) {
    console.error(`[PasswordUpdate] User fetch error:`, fetchErr)
    return res.status(404).json({ success: false, message: 'User not found' })
  }

  if (!user.password_hash) {
    console.warn(`[PasswordUpdate] User ${req.user.id} has no password hash set`)
    return res.status(400).json({ success: false, message: 'No password set for this account. Please use social login or contact support.' })
  }

  console.log(`[PasswordUpdate] ID: ${req.user.id}, Input: "${current_password}" (len: ${current_password.length})`)
  
  let isMatch = false
  if (user.password_hash.startsWith('$2')) {
    isMatch = await bcrypt.compare(current_password, user.password_hash)
  } else {
    isMatch = (current_password === user.password_hash)
  }

  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Incorrect current password' })
  }

  if (new_password.length < 8) {
    return res.status(400).json({ success: false, message: 'New password must be at least 8 characters long' })
  }

  // Hash new password
  const new_hash = await bcrypt.hash(new_password, 12)

  const { error: patchErr } = await supabaseAdmin
    .from('users')
    .update({ 
      password_hash: new_hash,
      updated_at: new Date().toISOString()
    })
    .eq('id', req.user.id)

  if (patchErr) return res.status(500).json({ success: false, message: patchErr.message })

  res.json({ success: true, message: 'Password updated successfully' })
})

// ─── PUT /api/users/preferences ──────────────────────────────
router.put('/preferences', authenticate, async (req, res) => {
  const { preferences } = req.body
  
  const { data, error } = await supabaseAdmin
    .from('users')
    .update({ preferences })
    .eq('id', req.user.id)
    .select('preferences')
    .single()

  if (error) return res.status(500).json({ success: false, message: error.message })
  res.json({ success: true, data: data.preferences })
})

export default router
