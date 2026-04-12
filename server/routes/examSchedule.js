import { Router } from 'express'
import { z } from 'zod'
import { supabaseAdmin } from '../lib/supabase.js'
import { authenticate, requireAdmin } from '../middleware/auth.js'

const router = Router()

const examSchema = z.object({
  course_id:        z.string().uuid().optional().nullable(),
  course_code:      z.string().optional(),
  course_name:      z.string().optional(),
  exam_type:        z.enum(['mid', 'end', 'internal', 'quiz', 'practical', 'supplementary']),
  exam_date:        z.string(),
  start_time:       z.string(),
  end_time:         z.string().optional().nullable(),
  venue:            z.string().optional(),
  duration_mins:    z.coerce.number().int().positive().optional().nullable(),
  seating_plan_url: z.string().url().optional().nullable(),
})

// GET /api/exam-schedule
router.get('/', authenticate, async (req, res) => {
  const { exam_type, from_date, to_date, course_id } = req.query
  try {
    let query = supabaseAdmin
      .from('exam_schedule')
      .select('*, courses(code, name)')
      .order('exam_date', { ascending: true })
      .order('start_time', { ascending: true })

    if (exam_type)  query = query.eq('exam_type', exam_type)
    if (from_date)  query = query.gte('exam_date', from_date)
    if (to_date)    query = query.lte('exam_date', to_date)
    if (course_id)  query = query.eq('course_id', course_id)

    const { data, error } = await query
    if (error) throw error
    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// POST /api/exam-schedule/bulk-upload — MUST be before /:id
router.post('/bulk-upload', authenticate, requireAdmin, async (req, res) => {
  const schema = z.object({ exams: z.array(examSchema).min(1) })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.errors })

  try {
    const { data, error } = await supabaseAdmin
      .from('exam_schedule')
      .insert(parsed.data.exams)
      .select()
    if (error) throw error
    res.json({ success: true, data, inserted: data.length })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// GET /api/exam-schedule/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('exam_schedule')
      .select('*, courses(code, name)')
      .eq('id', req.params.id)
      .single()
    if (error || !data) return res.status(404).json({ success: false, error: 'Exam not found' })
    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// POST /api/exam-schedule
router.post('/', authenticate, requireAdmin, async (req, res) => {
  const payload = Object.fromEntries(Object.entries(req.body).filter(([, v]) => v !== '' && v !== null && v !== undefined))
  const parsed = examSchema.safeParse(payload)
  if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.errors })

  try {
    const { data, error } = await supabaseAdmin
      .from('exam_schedule')
      .insert(parsed.data)
      .select()
      .single()
    if (error) throw error
    res.status(201).json({ success: true, data })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// PATCH /api/exam-schedule/:id
router.patch('/:id', authenticate, requireAdmin, async (req, res) => {
  const payload = Object.fromEntries(Object.entries(req.body).filter(([, v]) => v !== '' && v !== null && v !== undefined))
  const parsed = examSchema.partial().safeParse(payload)
  if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.errors })

  try {
    const { data, error } = await supabaseAdmin
      .from('exam_schedule')
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single()
    if (error) throw error
    if (!data) return res.status(404).json({ success: false, error: 'Exam not found' })
    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// DELETE /api/exam-schedule/:id
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { error } = await supabaseAdmin.from('exam_schedule').delete().eq('id', req.params.id)
    if (error) throw error
    res.json({ success: true, message: 'Exam deleted' })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
