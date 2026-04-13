import { Router } from 'express'
import { z } from 'zod'
import { supabaseAdmin } from '../../lib/supabase.js'
import { authenticate, requireAdmin, requireFaculty } from '../../middleware/auth.js'

const router = Router()

const gradeSchema = z.object({
  student_id: z.string().uuid(),
  course_id:  z.string().uuid(),
  exam_type:  z.enum(['mid', 'end', 'internal', 'quiz', 'practical']),
  marks:      z.coerce.number().min(0),
  max_marks:  z.coerce.number().positive().default(100),
  remarks:    z.string().optional(),
})

// GET /api/lms/grades?course_id=&student_id=
router.get('/', authenticate, async (req, res) => {
  const { role, id: userId } = req.user
  const { course_id, student_id } = req.query

  try {
    let query = supabaseAdmin
      .from('grades')
      .select('*, courses(code, name), users!student_id(full_name)')
      .order('created_at', { ascending: false })

    if (role === 'student') {
      query = query.eq('student_id', userId)
      if (course_id) query = query.eq('course_id', course_id)
    } else if (role === 'faculty') {
      const { data: fp } = await supabaseAdmin.from('faculty_profiles').select('id').eq('user_id', userId).single()
      if (!fp) return res.json({ success: true, data: [] })
      const { data: courses } = await supabaseAdmin.from('courses').select('id').eq('faculty_id', fp.id)
      const courseIds = (courses || []).map(c => c.id)
      if (courseIds.length === 0) return res.json({ success: true, data: [] })
      query = query.in('course_id', courseIds)
      if (student_id) query = query.eq('student_id', student_id)
      if (course_id)  query = query.eq('course_id', course_id)
    } else {
      if (student_id) query = query.eq('student_id', student_id)
      if (course_id)  query = query.eq('course_id', course_id)
    }

    const { data, error } = await query
    if (error) throw error
    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// POST /api/lms/grades — upsert single
router.post('/', authenticate, requireFaculty, async (req, res) => {
  const { id: userId } = req.user
  const parsed = gradeSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.errors })

  try {
    const { data, error } = await supabaseAdmin
      .from('grades')
      .upsert({ ...parsed.data, entered_by: userId, synced_from: 'manual', updated_at: new Date().toISOString() },
        { onConflict: 'student_id,course_id,exam_type' })
      .select()
      .single()
    if (error) throw error
    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// POST /api/lms/grades/bulk
router.post('/bulk', authenticate, requireFaculty, async (req, res) => {
  const { id: userId } = req.user
  const schema = z.object({ grades: z.array(gradeSchema).min(1) })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.errors })

  try {
    const rows = parsed.data.grades.map(g => ({
      ...g, entered_by: userId, synced_from: 'manual', updated_at: new Date().toISOString(),
    }))
    const { data, error } = await supabaseAdmin
      .from('grades')
      .upsert(rows, { onConflict: 'student_id,course_id,exam_type' })
      .select()
    if (error) throw error
    res.json({ success: true, data, saved: data.length })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// DELETE /api/lms/grades/:id
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { error } = await supabaseAdmin.from('grades').delete().eq('id', req.params.id)
    if (error) throw error
    res.json({ success: true, message: 'Grade deleted' })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
