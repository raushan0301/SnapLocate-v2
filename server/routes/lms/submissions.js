import { Router } from 'express'
import { z } from 'zod'
import { supabaseAdmin } from '../../lib/supabase.js'
import { authenticate, requireFaculty, requireStudent } from '../../middleware/auth.js'

const router = Router()

// GET /api/lms/submissions?assignment_id=
router.get('/', authenticate, async (req, res) => {
  const { role, id: userId } = req.user
  const { assignment_id } = req.query
  if (!assignment_id) return res.status(400).json({ success: false, error: 'assignment_id query param required' })

  try {
    if (role === 'student') {
      const { data, error } = await supabaseAdmin
        .from('assignment_submissions')
        .select('*')
        .eq('assignment_id', assignment_id)
        .eq('student_id', userId)
        .single()
      if (error && error.code !== 'PGRST116') throw error
      return res.json({ success: true, data: data || null })
    }

    const { data, error } = await supabaseAdmin
      .from('assignment_submissions')
      .select('*, users(id, full_name, email, avatar_url)')
      .eq('assignment_id', assignment_id)
      .order('submitted_at', { ascending: false })
    if (error) throw error
    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// GET /api/lms/submissions/:id
router.get('/:id', authenticate, async (req, res) => {
  const { role, id: userId } = req.user
  try {
    const { data, error } = await supabaseAdmin
      .from('assignment_submissions')
      .select('*, users(full_name, email, avatar_url)')
      .eq('id', req.params.id)
      .single()
    if (error || !data) return res.status(404).json({ success: false, error: 'Submission not found' })
    if (role === 'student' && data.student_id !== userId)
      return res.status(403).json({ success: false, error: 'Unauthorized' })
    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// POST /api/lms/submissions — student submit (upsert)
router.post('/', authenticate, requireStudent, async (req, res) => {
  const { id: userId } = req.user
  const schema = z.object({
    assignment_id: z.string().uuid(),
    file_url:      z.string().url().optional().nullable(),
    text_content:  z.string().optional().nullable(),
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.errors })

  try {
    const { data: asgn } = await supabaseAdmin
      .from('assignments')
      .select('due_date')
      .eq('id', parsed.data.assignment_id)
      .single()
    const isLate = asgn && new Date() > new Date(asgn.due_date)

    const { data, error } = await supabaseAdmin
      .from('assignment_submissions')
      .upsert({
        assignment_id: parsed.data.assignment_id,
        student_id:    userId,
        file_url:      parsed.data.file_url || null,
        text_content:  parsed.data.text_content || null,
        submitted_at:  new Date().toISOString(),
        status:        isLate ? 'late' : 'submitted',
      }, { onConflict: 'assignment_id,student_id' })
      .select()
      .single()
    if (error) throw error
    res.status(201).json({ success: true, data })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// PATCH /api/lms/submissions/:id/grade — faculty grade submission
router.patch('/:id/grade', authenticate, requireFaculty, async (req, res) => {
  const { id: userId } = req.user
  const schema = z.object({
    marks:    z.coerce.number().min(0),
    feedback: z.string().optional(),
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.errors })

  try {
    const { data, error } = await supabaseAdmin
      .from('assignment_submissions')
      .update({
        marks:     parsed.data.marks,
        feedback:  parsed.data.feedback || null,
        status:    'graded',
        graded_by: userId,
        graded_at: new Date().toISOString(),
      })
      .eq('id', req.params.id)
      .select()
      .single()
    if (error) throw error
    if (!data) return res.status(404).json({ success: false, error: 'Submission not found' })
    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
