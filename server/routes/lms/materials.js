import { Router } from 'express'
import { supabaseAdmin } from '../../lib/supabase.js'
import { authenticate } from '../../middleware/auth.js'

const router = Router()

// GET /api/lms/materials?course_id=
router.get('/', authenticate, async (req, res) => {
  const { course_id } = req.query
  if (!course_id) return res.status(400).json({ success: false, error: 'course_id required' })

  try {
    const { data, error } = await supabaseAdmin
      .from('course_materials')
      .select('*')
      .eq('course_id', course_id)
      .order('created_at', { ascending: false })
    if (error) throw error
    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
