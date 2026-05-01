import { Router } from 'express'
import { z } from 'zod'
import { supabaseAdmin } from '../../../lib/supabase.js'
import { authenticate, requireAdmin } from '../../../middleware/auth.js'

const router = Router()

// All routes require admin
router.use(authenticate, requireAdmin)

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/lms/native/admin/courses — list all native LMS courses
// ─────────────────────────────────────────────────────────────────────────────
router.get('/courses', async (req, res) => {
  const { search, branch, academic_year } = req.query
  try {
    let query = supabaseAdmin
      .from('lms_courses')
      .select(`
        *,
        lms_course_sections (
          id, section_name, room,
          faculty_profiles (id, designation, users (full_name, avatar_url))
        )
      `)
      .order('academic_year', { ascending: false })
      .order('semester', { ascending: true })

    if (branch) query = query.eq('branch', branch)
    if (academic_year) query = query.eq('academic_year', academic_year)
    if (search) query = query.or(`title.ilike.%${search}%,code.ilike.%${search}%`)

    const { data, error } = await query
    if (error) throw error
    res.json({ success: true, data: data || [] })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/lms/native/admin/courses — create native LMS course
// ─────────────────────────────────────────────────────────────────────────────
const courseSchema = z.object({
  code:          z.string().min(2).max(20),
  title:         z.string().min(2).max(200),
  academic_year: z.string().min(4).max(10),  // "2025-26"
  branch:        z.string().min(2).max(20),   // "CSE"
  semester:      z.number().int().min(1).max(12),
  is_published:  z.boolean().default(false),
})

router.post('/courses', async (req, res) => {
  const parsed = courseSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.errors })
  try {
    const orgId = '00000000-0000-0000-0000-000000000001'
    const { data, error } = await supabaseAdmin
      .from('lms_courses')
      .insert({ ...parsed.data, org_id: orgId })
      .select()
      .single()
    if (error) throw error
    res.status(201).json({ success: true, data })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/lms/native/admin/courses/:id
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/courses/:id', async (req, res) => {
  const allowed = ['code','title','academic_year','branch','semester','is_published']
  const updates = {}
  for (const k of allowed) if (req.body[k] !== undefined) updates[k] = req.body[k]
  if (!Object.keys(updates).length) return res.status(400).json({ success: false, error: 'No valid fields to update' })
  try {
    const { data, error } = await supabaseAdmin
      .from('lms_courses')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single()
    if (error) throw error
    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/lms/native/admin/courses/:id
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/courses/:id', async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from('lms_courses')
      .delete()
      .eq('id', req.params.id)
    if (error) throw error
    res.json({ success: true, message: 'Course deleted' })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/lms/native/admin/courses/:id/sections — sections of a course
// ─────────────────────────────────────────────────────────────────────────────
router.get('/courses/:id/sections', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('lms_course_sections')
      .select('*, faculty_profiles(id, designation, users(full_name, avatar_url))')
      .eq('course_id', req.params.id)
      .order('section_name')
    if (error) throw error
    res.json({ success: true, data: data || [] })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/lms/native/admin/courses/:id/sections — add section
// ─────────────────────────────────────────────────────────────────────────────
router.post('/courses/:id/sections', async (req, res) => {
  const schema = z.object({
    section_name: z.string().min(1).max(10),
    faculty_id:   z.string().uuid().optional(),
    room:         z.string().max(30).optional(),
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.errors })
  try {
    const { data, error } = await supabaseAdmin
      .from('lms_course_sections')
      .insert({ course_id: req.params.id, ...parsed.data })
      .select('*, faculty_profiles(id, designation, users(full_name))')
      .single()
    if (error) throw error
    res.status(201).json({ success: true, data })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/lms/native/admin/sections/:sectionId
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/sections/:sectionId', async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from('lms_course_sections')
      .delete()
      .eq('id', req.params.sectionId)
    if (error) throw error
    res.json({ success: true, message: 'Section deleted' })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/lms/native/admin/sections/:sectionId/enroll-csv
// Body: { rows: [{roll_number, student_id}] }  — bulk CSV enroll
// ─────────────────────────────────────────────────────────────────────────────
router.post('/sections/:sectionId/enroll-csv', async (req, res) => {
  const schema = z.object({
    rows: z.array(z.object({
      student_id:  z.string().uuid(),
      roll_number: z.string().optional(),
    })).min(1).max(500),
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.errors })

  try {
    const inserts = parsed.data.rows.map(r => ({
      section_id:  req.params.sectionId,
      student_id:  r.student_id,
      roll_number: r.roll_number || null,
      at_risk_status: 'safe',
    }))
    const { data, error } = await supabaseAdmin
      .from('lms_enrollments')
      .upsert(inserts, { onConflict: 'section_id,student_id' })
      .select()
    if (error) throw error
    res.json({ success: true, enrolled: data.length, data })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/lms/native/admin/sections/:sectionId/enrollments
// ─────────────────────────────────────────────────────────────────────────────
router.get('/sections/:sectionId/enrollments', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('lms_enrollments')
      .select('*, users!student_id(id, full_name, email, avatar_url)')
      .eq('section_id', req.params.sectionId)
      .order('roll_number')
    if (error) throw error
    res.json({ success: true, data: data || [] })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/lms/native/admin/grading-scale — get org's 10-pt scale
// ─────────────────────────────────────────────────────────────────────────────
router.get('/grading-scale', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('lms_grading_scale_config')
      .select('*')
      .eq('org_id', '00000000-0000-0000-0000-000000000001')
      .order('grade_points', { ascending: false })
    if (error) throw error
    res.json({ success: true, data: data || [] })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/lms/native/admin/grading-scale/:id — update one grade row
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/grading-scale/:id', async (req, res) => {
  const schema = z.object({
    grade_letter: z.string().optional(),
    min_marks:    z.number().min(0).max(100).optional(),
    grade_points: z.number().min(0).max(10).optional(),
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.errors })
  try {
    const { data, error } = await supabaseAdmin
      .from('lms_grading_scale_config')
      .update(parsed.data)
      .eq('id', req.params.id)
      .select()
      .single()
    if (error) throw error
    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/lms/native/admin/stats — dashboard stats
// ─────────────────────────────────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const [coursesRes, sectionsRes, enrollRes] = await Promise.all([
      supabaseAdmin.from('lms_courses').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('lms_course_sections').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('lms_enrollments').select('id', { count: 'exact', head: true }),
    ])
    res.json({
      success: true,
      data: {
        total_courses:   coursesRes.count || 0,
        total_sections:  sectionsRes.count || 0,
        total_enrollments: enrollRes.count || 0,
      }
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
