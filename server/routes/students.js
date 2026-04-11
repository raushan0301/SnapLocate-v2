import { Router } from 'express'
import { supabaseAdmin } from '../lib/supabase.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

// ─── GET /api/students/me ────────────────────────────────────
router.get('/me', authenticate, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('id, email, full_name, avatar_url, created_at')
    .eq('id', req.user.id)
    .single()
  if (error) throw error
  res.json({ success: true, data })
})

export default router
