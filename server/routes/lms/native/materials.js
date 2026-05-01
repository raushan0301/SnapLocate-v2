import { Router } from 'express'
import { z } from 'zod'
import { supabaseAdmin } from '../../../lib/supabase.js'
import { authenticate } from '../../../middleware/auth.js'

const router = Router()
router.use(authenticate)

// GET /api/lms/native/materials/courses/:courseId/modules
router.get('/courses/:courseId/modules', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('lms_modules')
      .select('*, lms_materials(*)')
      .eq('course_id', req.params.courseId)
      .order('order_index')
    if (error) throw error
    res.json({ success: true, data: data || [] })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// POST /api/lms/native/materials/courses/:courseId/modules
router.post('/courses/:courseId/modules', async (req, res) => {
  if (req.user.role === 'student') return res.status(403).json({ success: false, error: 'Forbidden' })
  const schema = z.object({
    title: z.string().min(1).max(200),
    order_index: z.number().int().min(0).default(0),
    is_visible: z.boolean().default(true),
    release_date: z.string().optional().nullable(),
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.errors })
  try {
    const { data, error } = await supabaseAdmin
      .from('lms_modules').insert({ course_id: req.params.courseId, ...parsed.data }).select().single()
    if (error) throw error
    res.status(201).json({ success: true, data })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// PATCH /api/lms/native/materials/modules/:moduleId
router.patch('/modules/:moduleId', async (req, res) => {
  if (req.user.role === 'student') return res.status(403).json({ success: false, error: 'Forbidden' })
  const allowed = ['title', 'order_index', 'is_visible', 'release_date']
  const updates = {}
  for (const k of allowed) if (req.body[k] !== undefined) updates[k] = req.body[k]
  try {
    const { data, error } = await supabaseAdmin
      .from('lms_modules').update(updates).eq('id', req.params.moduleId).select().single()
    if (error) throw error
    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// DELETE /api/lms/native/materials/modules/:moduleId
router.delete('/modules/:moduleId', async (req, res) => {
  if (req.user.role === 'student') return res.status(403).json({ success: false, error: 'Forbidden' })
  try {
    const { error } = await supabaseAdmin.from('lms_modules').delete().eq('id', req.params.moduleId)
    if (error) throw error
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// POST /api/lms/native/materials/modules/:moduleId/items
router.post('/modules/:moduleId/items', async (req, res) => {
  if (req.user.role === 'student') return res.status(403).json({ success: false, error: 'Forbidden' })
  const schema = z.object({
    type: z.enum(['pdf','link','video','docx','zip','other']),
    title: z.string().min(1).max(200),
    file_url: z.string().url().optional().nullable(),
    external_url: z.string().url().optional().nullable(),
    order_index: z.number().int().min(0).default(0),
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.errors })
  try {
    const { data, error } = await supabaseAdmin
      .from('lms_materials')
      .insert({ module_id: req.params.moduleId, uploaded_by: req.user.id, ...parsed.data })
      .select().single()
    if (error) throw error
    res.status(201).json({ success: true, data })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// DELETE /api/lms/native/materials/items/:itemId
router.delete('/items/:itemId', async (req, res) => {
  if (req.user.role === 'student') return res.status(403).json({ success: false, error: 'Forbidden' })
  try {
    const { error } = await supabaseAdmin.from('lms_materials').delete().eq('id', req.params.itemId)
    if (error) throw error
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// GET /api/lms/native/materials/pyq
router.get('/pyq', async (req, res) => {
  const { subject_code, exam_year, exam_type, course_id } = req.query
  try {
    let query = supabaseAdmin
      .from('lms_pyq_resources').select('*, lms_courses(code, title)')
      .order('exam_year', { ascending: false })
    if (subject_code) query = query.ilike('subject_code', `%${subject_code}%`)
    if (exam_year) query = query.eq('exam_year', parseInt(exam_year))
    if (exam_type) query = query.eq('exam_type', exam_type)
    if (course_id) query = query.eq('course_id', course_id)
    const { data, error } = await query
    if (error) throw error
    res.json({ success: true, data: data || [] })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// POST /api/lms/native/materials/pyq
router.post('/pyq', async (req, res) => {
  if (req.user.role === 'student') return res.status(403).json({ success: false, error: 'Faculty/Admin only' })
  const schema = z.object({
    course_id: z.string().uuid().optional().nullable(),
    subject_code: z.string().min(2).max(20),
    exam_year: z.number().int().min(2000).max(2100),
    exam_type: z.enum(['mid','end','mst1','mst2']),
    file_url: z.string().url(),
    verified: z.boolean().default(false),
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.errors })
  try {
    const { data, error } = await supabaseAdmin
      .from('lms_pyq_resources')
      .insert({ ...parsed.data, uploaded_by: req.user.id })
      .select().single()
    if (error) throw error
    res.status(201).json({ success: true, data })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
