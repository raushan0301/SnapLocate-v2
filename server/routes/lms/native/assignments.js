import { Router } from 'express'
import { z } from 'zod'
import { supabaseAdmin } from '../../../lib/supabase.js'
import { authenticate } from '../../../middleware/auth.js'

const router = Router()
router.use(authenticate)

// GET /api/lms/native/assignments/sections/:sectionId
router.get('/sections/:sectionId', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('lms_assignments')
      .select('*')
      .eq('section_id', req.params.sectionId)
      .order('due_date')
    if (error) throw error
    res.json({ success: true, data: data || [] })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// GET /api/lms/native/assignments/student — all assignments for logged-in student
router.get('/student', async (req, res) => {
  const { id: userId } = req.user
  try {
    const { data: enrollments } = await supabaseAdmin
      .from('lms_enrollments').select('section_id').eq('student_id', userId)
    if (!enrollments?.length) return res.json({ success: true, data: [] })
    const sectionIds = enrollments.map(e => e.section_id)
    const { data, error } = await supabaseAdmin
      .from('lms_assignments')
      .select('*, lms_course_sections(section_name, lms_courses(code,title))')
      .in('section_id', sectionIds)
      .order('due_date')
    if (error) throw error
    // Attach submission status per assignment
    const assignmentIds = (data||[]).map(a => a.id)
    const { data: subs } = await supabaseAdmin
      .from('lms_submissions')
      .select('assignment_id, status, marks_obtained, submitted_at')
      .in('assignment_id', assignmentIds)
      .eq('student_id', userId)
    const subMap = {}
    for (const s of subs||[]) subMap[s.assignment_id] = s
    const result = (data||[]).map(a => ({ ...a, my_submission: subMap[a.id] || null }))
    res.json({ success: true, data: result })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// POST /api/lms/native/assignments — create assignment (faculty)
router.post('/', async (req, res) => {
  const { role, id: userId } = req.user
  if (role === 'student') return res.status(403).json({ success: false, error: 'Forbidden' })
  const schema = z.object({
    section_id: z.string().uuid(),
    title: z.string().min(1).max(200),
    description: z.string().optional(),
    due_date: z.string(),
    max_marks: z.number().min(0).default(100),
    allow_resubmission: z.boolean().default(false),
    max_attempts: z.number().int().min(1).default(1),
    allow_late: z.boolean().default(false),
    late_penalty_percent: z.number().min(0).max(100).default(0),
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.errors })
  try {
    const { data, error } = await supabaseAdmin
      .from('lms_assignments')
      .insert({ ...parsed.data, created_by: userId })
      .select().single()
    if (error) throw error
    // Notify all enrolled students
    const { data: enrollments } = await supabaseAdmin
      .from('lms_enrollments').select('student_id').eq('section_id', parsed.data.section_id)
    if (enrollments?.length) {
      await supabaseAdmin.from('lms_notifications').insert(
        enrollments.map(e => ({
          user_id: e.student_id, type: 'assignment', reference_id: data.id,
          message: `New assignment posted: "${parsed.data.title}" — due ${new Date(parsed.data.due_date).toLocaleDateString('en-IN')}`,
        }))
      )
    }
    res.status(201).json({ success: true, data })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// GET /api/lms/native/assignments/:id/submissions — all submissions (faculty)
router.get('/:id/submissions', async (req, res) => {
  const { role } = req.user
  if (role === 'student') return res.status(403).json({ success: false, error: 'Forbidden' })
  try {
    const { data, error } = await supabaseAdmin
      .from('lms_submissions')
      .select('*, users!student_id(id, full_name, email, avatar_url)')
      .eq('assignment_id', req.params.id)
      .order('submitted_at', { ascending: false })
    if (error) throw error
    res.json({ success: true, data: data || [] })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// POST /api/lms/native/assignments/:id/submit — student submit
router.post('/:id/submit', async (req, res) => {
  const { id: userId } = req.user
  const schema = z.object({
    file_url: z.string().url().optional().nullable(),
    text_content: z.string().optional().nullable(),
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.errors })
  try {
    const { data: asgn } = await supabaseAdmin
      .from('lms_assignments').select('*').eq('id', req.params.id).single()
    if (!asgn) return res.status(404).json({ success: false, error: 'Assignment not found' })
    const isLate = new Date() > new Date(asgn.due_date)
    const status = isLate ? 'late' : 'submitted'
    const { data: existing } = await supabaseAdmin
      .from('lms_submissions').select('id,attempt_number').eq('assignment_id', req.params.id).eq('student_id', userId).order('attempt_number', { ascending: false }).limit(1).single()
    const attempt = (existing?.attempt_number || 0) + 1
    if (!asgn.allow_resubmission && existing) return res.status(400).json({ success: false, error: 'Resubmission not allowed' })
    if (attempt > asgn.max_attempts) return res.status(400).json({ success: false, error: `Max attempts (${asgn.max_attempts}) reached` })
    const { data, error } = await supabaseAdmin
      .from('lms_submissions')
      .insert({ assignment_id: req.params.id, student_id: userId, attempt_number: attempt, status, submitted_at: new Date().toISOString(), ...parsed.data })
      .select().single()
    if (error) throw error
    res.status(201).json({ success: true, data })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// PATCH /api/lms/native/assignments/submissions/:submissionId/grade — grade a submission
router.patch('/submissions/:submissionId/grade', async (req, res) => {
  const { role, id: userId } = req.user
  if (role === 'student') return res.status(403).json({ success: false, error: 'Forbidden' })
  const schema = z.object({
    marks_obtained: z.number().min(0),
    feedback_text: z.string().optional(),
    rubric_scores_json: z.record(z.number()).optional(),
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.errors })
  try {
    const { data, error } = await supabaseAdmin
      .from('lms_submissions')
      .update({ ...parsed.data, status: 'graded', graded_at: new Date().toISOString(), grader_id: userId })
      .eq('id', req.params.submissionId)
      .select('*, users!student_id(id)').single()
    if (error) throw error
    // Notify student
    await supabaseAdmin.from('lms_notifications').insert({
      user_id: data.users.id, type: 'grade', reference_id: data.id,
      message: `Your assignment has been graded: ${parsed.data.marks_obtained} marks`,
    })
    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
