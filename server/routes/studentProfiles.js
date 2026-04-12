import { Router } from 'express'
import { z } from 'zod'
import { supabaseAdmin } from '../lib/supabase.js'
import { authenticate, requireAdmin, requireStudent } from '../middleware/auth.js'

const router = Router()

const profileSchema = z.object({
  enrollment_no: z.string().optional(),
  roll_no:       z.string().optional(),
  branch:        z.string().optional(),
  dept:          z.string().optional(),
  semester:      z.coerce.number().int().min(1).max(12).optional(),
  section:       z.string().optional(),
  batch_year:    z.coerce.number().int().optional(),
  current_cgpa:  z.coerce.number().min(0).max(10).optional(),
})

// GET /api/student-profiles/me — MUST be before /:userId
router.get('/me', authenticate, requireStudent, async (req, res) => {
  const { id: userId } = req.user
  try {
    const { data, error } = await supabaseAdmin
      .from('student_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()
    if (error && error.code !== 'PGRST116') throw error
    res.json({ success: true, data: data || null })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// PATCH /api/student-profiles/me — MUST be before /:userId
router.patch('/me', authenticate, requireStudent, async (req, res) => {
  const { id: userId } = req.user
  const parsed = profileSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.errors })

  try {
    const { data, error } = await supabaseAdmin
      .from('student_profiles')
      .upsert({ ...parsed.data, user_id: userId, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
      .select()
      .single()
    if (error) throw error
    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// GET /api/student-profiles/:userId
router.get('/:userId', authenticate, async (req, res) => {
  const { role, id: currentUserId } = req.user
  if (role === 'student' && req.params.userId !== currentUserId)
    return res.status(403).json({ success: false, error: 'Unauthorized' })

  try {
    const { data, error } = await supabaseAdmin
      .from('student_profiles')
      .select('*, users(full_name, email, avatar_url)')
      .eq('user_id', req.params.userId)
      .single()
    if (error && error.code !== 'PGRST116') throw error
    res.json({ success: true, data: data || null })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// PATCH /api/student-profiles/:userId — admin override
router.patch('/:userId', authenticate, requireAdmin, async (req, res) => {
  const parsed = profileSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.errors })

  try {
    const { data, error } = await supabaseAdmin
      .from('student_profiles')
      .upsert({ ...parsed.data, user_id: req.params.userId, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
      .select()
      .single()
    if (error) throw error
    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
