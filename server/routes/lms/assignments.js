import { Router } from 'express'
import { z } from 'zod'
import { supabaseAdmin } from '../../lib/supabase.js'
import { authenticate, requireFaculty } from '../../middleware/auth.js'

const router = Router()

const assignmentSchema = z.object({
  course_id:       z.string().uuid(),
  title:           z.string().min(1).max(300),
  description:     z.string().optional(),
  due_date:        z.string(),
  max_marks:       z.coerce.number().positive().optional(),
  file_url:        z.string().url().optional().nullable(),
  attachment_type: z.enum(['pdf', 'image', 'doc', 'link', 'none']).optional(),
  is_published:    z.boolean().optional(),
})

// GET /api/lms/assignments?course_id=
router.get('/', authenticate, async (req, res) => {
  const { role, id: userId } = req.user
  const { course_id } = req.query
  if (!course_id) return res.status(400).json({ success: false, error: 'course_id query param required' })

  try {
    let query = supabaseAdmin
      .from('assignments')
      .select('*')
      .eq('course_id', course_id)
      .order('due_date', { ascending: true })

    if (role === 'student') query = query.neq('is_published', false)

    const { data, error } = await query
    if (error) throw error

    if (role === 'student' && data.length > 0) {
      const ids = data.map(a => a.id)
      const { data: subs } = await supabaseAdmin
        .from('assignment_submissions')
        .select('assignment_id, status, marks, submitted_at')
        .eq('student_id', userId)
        .in('assignment_id', ids)
      const subMap = {}
      subs?.forEach(s => { subMap[s.assignment_id] = s })
      return res.json({ success: true, data: data.map(a => ({ ...a, my_submission: subMap[a.id] || null })) })
    }

    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// GET /api/lms/assignments/:id
router.get('/:id', authenticate, async (req, res) => {
  const { id: userId, role } = req.user
  try {
    const { data, error } = await supabaseAdmin
      .from('assignments')
      .select('*')
      .eq('id', req.params.id)
      .single()
    if (error || !data) return res.status(404).json({ success: false, error: 'Assignment not found' })

    if (role === 'student') {
      const { data: sub } = await supabaseAdmin
        .from('assignment_submissions')
        .select('*')
        .eq('assignment_id', req.params.id)
        .eq('student_id', userId)
        .single()
      return res.json({ success: true, data: { ...data, my_submission: sub || null } })
    }
    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// POST /api/lms/assignments
router.post('/', authenticate, requireFaculty, async (req, res) => {
  const { id: userId } = req.user
  const parsed = assignmentSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.errors })

  try {
    const { data, error } = await supabaseAdmin
      .from('assignments')
      .insert({ ...parsed.data, faculty_id: userId })
      .select()
      .single()
    if (error) throw error
    res.status(201).json({ success: true, data })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// PATCH /api/lms/assignments/:id
router.patch('/:id', authenticate, requireFaculty, async (req, res) => {
  const { id: userId } = req.user
  const parsed = assignmentSchema.partial().safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.errors })

  try {
    const { data, error } = await supabaseAdmin
      .from('assignments')
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .eq('faculty_id', userId)
      .select()
      .single()
    if (error) throw error
    if (!data) return res.status(404).json({ success: false, error: 'Assignment not found or unauthorized' })
    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// DELETE /api/lms/assignments/:id
router.delete('/:id', authenticate, requireFaculty, async (req, res) => {
  const { id: userId } = req.user
  try {
    const { error } = await supabaseAdmin
      .from('assignments')
      .delete()
      .eq('id', req.params.id)
      .eq('faculty_id', userId)
    if (error) throw error
    res.json({ success: true, message: 'Assignment deleted' })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
