import { Router } from 'express'
import { supabaseAdmin } from '../../../lib/supabase.js'
import { authenticate } from '../../../middleware/auth.js'

const router = Router()

// GET /api/lms/native/pyq - Browse PYQs
router.get('/', authenticate, async (req, res) => {
  try {
    const { subject_code, exam_year, exam_type } = req.query
    
    let query = supabaseAdmin.from('lms_pyq_resources').select('*')
    
    if (subject_code) query = query.ilike('subject_code', `%${subject_code}%`)
    if (exam_year) query = query.eq('exam_year', exam_year)
    if (exam_type) query = query.eq('exam_type', exam_type)
    
    // Only show verified ones to students
    if (req.user.role === 'student') {
      query = query.eq('verified', true)
    }

    const { data, error } = await query.order('exam_year', { ascending: false })
    if (error) throw error
    
    res.json({ success: true, data })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// POST /api/lms/native/pyq - Upload a PYQ (Faculty/Admin)
router.post('/', authenticate, async (req, res) => {
  try {
    if (req.user.role === 'student') {
      return res.status(403).json({ success: false, error: 'Unauthorized' })
    }

    const { course_id, subject_code, exam_year, exam_type, file_url } = req.body
    
    if (!subject_code || !exam_year || !exam_type || !file_url) {
      return res.status(400).json({ success: false, error: 'Missing required fields' })
    }

    const { data, error } = await supabaseAdmin
      .from('lms_pyq_resources')
      .insert({
        course_id: course_id || null,
        subject_code: subject_code.toUpperCase(),
        exam_year,
        exam_type,
        file_url,
        verified: true // Faculty uploads are auto-verified
      })
      .select()
      .single()

    if (error) throw error
    res.json({ success: true, data })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// DELETE /api/lms/native/pyq/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    if (req.user.role === 'student') {
      return res.status(403).json({ success: false, error: 'Unauthorized' })
    }

    const { error } = await supabaseAdmin
      .from('lms_pyq_resources')
      .delete()
      .eq('id', req.params.id)

    if (error) throw error
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router
