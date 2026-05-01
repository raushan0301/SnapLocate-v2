import { Router } from 'express'
import { z } from 'zod'
import { supabaseAdmin } from '../../../lib/supabase.js'
import { authenticate, requireAdmin } from '../../../middleware/auth.js'

const router = Router()
router.use(authenticate)

// GET /api/lms/native/gradebook/courses/:courseId/components
router.get('/courses/:courseId/components', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('lms_grade_components')
      .select('*')
      .eq('course_id', req.params.courseId)
      .order('display_order')
    if (error) throw error
    res.json({ success: true, data: data || [] })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// POST /api/lms/native/gradebook/courses/:courseId/components
router.post('/courses/:courseId/components', async (req, res) => {
  const { role } = req.user
  if (role === 'student') return res.status(403).json({ success: false, error: 'Forbidden' })
  const schema = z.object({
    name: z.string().min(1).max(50),
    max_marks: z.number().min(0),
    weightage_percent: z.number().min(0).max(100).optional(),
    type: z.enum(['internal', 'external']),
    display_order: z.number().int().min(0).default(0),
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.errors })
  try {
    const { data, error } = await supabaseAdmin
      .from('lms_grade_components')
      .insert({ course_id: req.params.courseId, ...parsed.data })
      .select().single()
    if (error) throw error
    res.status(201).json({ success: true, data })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// DELETE /api/lms/native/gradebook/components/:id
router.delete('/components/:id', async (req, res) => {
  const { role } = req.user
  if (role === 'student') return res.status(403).json({ success: false, error: 'Forbidden' })
  try {
    const { error } = await supabaseAdmin.from('lms_grade_components').delete().eq('id', req.params.id)
    if (error) throw error
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// GET /api/lms/native/gradebook/components/:componentId/entries
router.get('/components/:componentId/entries', async (req, res) => {
  const { role } = req.user
  if (role === 'student') return res.status(403).json({ success: false, error: 'Forbidden' })
  try {
    const { data, error } = await supabaseAdmin
      .from('lms_gradebook_entries')
      .select('*, users!student_id(id, full_name, email)')
      .eq('component_id', req.params.componentId)
    if (error) throw error
    res.json({ success: true, data: data || [] })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// POST /api/lms/native/gradebook/components/:componentId/entries/bulk
// Body: { entries: [{student_id, marks_obtained, remark}] }
router.post('/components/:componentId/entries/bulk', async (req, res) => {
  const { role, id: userId } = req.user
  if (role === 'student') return res.status(403).json({ success: false, error: 'Forbidden' })

  // Check if gradebook is locked
  const { data: component } = await supabaseAdmin
    .from('lms_grade_components').select('course_id').eq('id', req.params.componentId).single()
  if (component) {
    const { data: config } = await supabaseAdmin
      .from('lms_gradebook_config').select('is_locked').eq('course_id', component.course_id).single()
    if (config?.is_locked) {
      const reason = req.body.reason_text
      if (!reason) return res.status(423).json({ success: false, error: 'Gradebook is locked. Provide reason_text to override.' })
      // Log to audit
      await supabaseAdmin.from('lms_audit_logs').insert({
        actor_id: userId, action_type: 'locked_grade_override',
        target_table: 'lms_gradebook_entries', target_id: req.params.componentId,
        reason_text: reason, new_value_json: req.body.entries,
      })
    }
  }

  const schema = z.object({
    entries: z.array(z.object({
      student_id: z.string().uuid(),
      marks_obtained: z.number().min(0).nullable(),
      remark: z.string().optional(),
    })).min(1),
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.errors })
  try {
    const rows = parsed.data.entries.map(e => ({
      component_id: req.params.componentId,
      student_id: e.student_id,
      marks_obtained: e.marks_obtained,
      remark: e.remark || null,
      graded_by: userId,
      graded_at: new Date().toISOString(),
    }))
    const { data, error } = await supabaseAdmin
      .from('lms_gradebook_entries')
      .upsert(rows, { onConflict: 'component_id,student_id' })
      .select()
    if (error) throw error
    res.json({ success: true, saved: data.length })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// GET /api/lms/native/gradebook/student/:studentId/summary
// Full gradebook summary for a student (all courses)
router.get('/student/:studentId/summary', async (req, res) => {
  const { id: userId, role } = req.user
  if (role === 'student' && userId !== req.params.studentId) return res.status(403).json({ success: false, error: 'Forbidden' })
  try {
    const { data: enrollments } = await supabaseAdmin
      .from('lms_enrollments')
      .select('section_id, lms_course_sections(course_id, section_name, lms_courses(id,code,title,semester,branch))')
      .eq('student_id', req.params.studentId)
    if (!enrollments?.length) return res.json({ success: true, data: [] })

    const result = await Promise.all(enrollments.map(async enr => {
      const course = enr.lms_course_sections?.lms_courses
      if (!course) return null
      const { data: components } = await supabaseAdmin
        .from('lms_grade_components').select('*').eq('course_id', course.id).order('display_order')
      const { data: entries } = await supabaseAdmin
        .from('lms_gradebook_entries')
        .select('component_id, marks_obtained')
        .eq('student_id', req.params.studentId)
        .in('component_id', (components||[]).map(c=>c.id))
      const entryMap = {}
      for (const e of entries||[]) entryMap[e.component_id] = e.marks_obtained

      const comps = (components||[]).map(c => ({
        ...c, marks_obtained: entryMap[c.id] ?? null,
        percentage: entryMap[c.id] != null ? Math.round(entryMap[c.id]/c.max_marks*100) : null,
      }))

      // Weighted total
      let weightedScore = 0, totalWeight = 0
      for (const c of comps) {
        if (c.marks_obtained != null && c.weightage_percent) {
          weightedScore += (c.marks_obtained / c.max_marks) * c.weightage_percent
          totalWeight += c.weightage_percent
        }
      }
      const finalPct = totalWeight > 0 ? Math.round(weightedScore) : null
      return { course, section_name: enr.lms_course_sections?.section_name, components: comps, final_percentage: finalPct }
    }))

    res.json({ success: true, data: result.filter(Boolean) })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// POST /api/lms/native/gradebook/courses/:courseId/lock — admin lock
router.post('/courses/:courseId/lock', requireAdmin, async (req, res) => {
  const { id: userId } = req.user
  try {
    const { data, error } = await supabaseAdmin
      .from('lms_gradebook_config')
      .upsert({ course_id: req.params.courseId, is_locked: true, locked_by: userId, locked_at: new Date().toISOString() }, { onConflict: 'course_id' })
      .select().single()
    if (error) throw error
    await supabaseAdmin.from('lms_audit_logs').insert({
      actor_id: userId, action_type: 'gradebook_locked',
      target_table: 'lms_gradebook_config', target_id: req.params.courseId,
    })
    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// GET /api/lms/native/gradebook/courses/:courseId/export — Thapar registry CSV format
router.get('/courses/:courseId/export', requireAdmin, async (req, res) => {
  try {
    const { data: course } = await supabaseAdmin.from('lms_courses').select('*').eq('id', req.params.courseId).single()
    const { data: sections } = await supabaseAdmin.from('lms_course_sections').select('id,section_name').eq('course_id', req.params.courseId)
    const { data: components } = await supabaseAdmin.from('lms_grade_components').select('*').eq('course_id', req.params.courseId).order('display_order')
    if (!components?.length) return res.status(400).json({ success: false, error: 'No grade components configured' })

    const sectionIds = (sections||[]).map(s=>s.id)
    const { data: enrollments } = await supabaseAdmin
      .from('lms_enrollments')
      .select('student_id, roll_number, section_id, users!student_id(full_name, email)')
      .in('section_id', sectionIds)
      .order('roll_number')

    const compIds = components.map(c=>c.id)
    const { data: entries } = await supabaseAdmin
      .from('lms_gradebook_entries')
      .select('component_id, student_id, marks_obtained')
      .in('component_id', compIds)

    const entryMap = {}
    for (const e of entries||[]) {
      if (!entryMap[e.student_id]) entryMap[e.student_id] = {}
      entryMap[e.student_id][e.component_id] = e.marks_obtained
    }
    const sectionMap = {}
    for (const s of sections||[]) sectionMap[s.id] = s.section_name

    // Build CSV
    const headers = ['Roll No','Name','Email','Section', ...components.map(c=>`${c.name} (${c.max_marks})`), 'Total']
    const rows = (enrollments||[]).map(enr => {
      const marks = components.map(c => entryMap[enr.student_id]?.[c.id] ?? '')
      const total = marks.reduce((s,m) => s + (typeof m==='number'?m:0), 0)
      return [enr.roll_number||'', enr.users?.full_name||'', enr.users?.email||'', sectionMap[enr.section_id]||'', ...marks, total]
    })

    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="${course?.code}_${course?.academic_year}_marks.csv"`)
    res.send(csv)
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
