import { Router } from 'express'
import { z } from 'zod'
import { supabaseAdmin } from '../../../lib/supabase.js'
import { authenticate } from '../../../middleware/auth.js'

const router = Router()
router.use(authenticate)

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/lms/native/attendance/sections/:sectionId/sessions
// Returns all sessions + attendance summary for a section (faculty/admin)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/sections/:sectionId/sessions', async (req, res) => {
  const { role } = req.user
  if (role === 'student') return res.status(403).json({ success: false, error: 'Forbidden' })
  try {
    const { data, error } = await supabaseAdmin
      .from('lms_attendance_sessions')
      .select('*, lms_attendance_records(id, status, student_id)')
      .eq('section_id', req.params.sectionId)
      .order('date', { ascending: false })
    if (error) throw error
    res.json({ success: true, data: data || [] })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/lms/native/attendance/sections/:sectionId/sessions
// Create a new attendance session (faculty marks today's class)
// ─────────────────────────────────────────────────────────────────────────────
router.post('/sections/:sectionId/sessions', async (req, res) => {
  const { role, id: userId } = req.user
  if (role === 'student') return res.status(403).json({ success: false, error: 'Forbidden' })

  const schema = z.object({
    date:       z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    is_holiday: z.boolean().default(false),
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.errors })

  try {
    // Get current total_conducted_counter for this section
    const { data: lastSession } = await supabaseAdmin
      .from('lms_attendance_sessions')
      .select('total_conducted_counter')
      .eq('section_id', req.params.sectionId)
      .order('date', { ascending: false })
      .limit(1)
      .single()

    const newCounter = (lastSession?.total_conducted_counter || 0) + (parsed.data.is_holiday ? 0 : 1)

    const { data, error } = await supabaseAdmin
      .from('lms_attendance_sessions')
      .upsert({
        section_id: req.params.sectionId,
        conducted_by: userId,
        date: parsed.data.date,
        is_holiday: parsed.data.is_holiday,
        total_conducted_counter: newCounter,
      }, { onConflict: 'section_id,date' })
      .select()
      .single()
    if (error) throw error
    res.status(201).json({ success: true, data })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/lms/native/attendance/sessions/:sessionId/records
// Get all student records for a session
// ─────────────────────────────────────────────────────────────────────────────
router.get('/sessions/:sessionId/records', async (req, res) => {
  const { role } = req.user
  if (role === 'student') return res.status(403).json({ success: false, error: 'Forbidden' })
  try {
    const { data, error } = await supabaseAdmin
      .from('lms_attendance_records')
      .select('*, users!student_id(id, full_name, email, avatar_url)')
      .eq('session_id', req.params.sessionId)
      .order('marked_at')
    if (error) throw error
    res.json({ success: true, data: data || [] })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/lms/native/attendance/sessions/:sessionId/bulk-mark
// Body: { records: [{student_id, status, remark}] }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/sessions/:sessionId/bulk-mark', async (req, res) => {
  const { role, id: userId } = req.user
  if (role === 'student') return res.status(403).json({ success: false, error: 'Forbidden' })

  const schema = z.object({
    records: z.array(z.object({
      student_id: z.string().uuid(),
      status:     z.enum(['P', 'A', 'L']),
      remark:     z.string().max(200).optional(),
    })).min(1),
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.errors })

  try {
    const inserts = parsed.data.records.map(r => ({
      session_id: req.params.sessionId,
      student_id: r.student_id,
      status: r.status,
      marked_by: userId,
      remark: r.remark || null,
      marked_at: new Date().toISOString(),
    }))
    const { data, error } = await supabaseAdmin
      .from('lms_attendance_records')
      .upsert(inserts, { onConflict: 'session_id,student_id' })
      .select()
    if (error) throw error

    // After marking, trigger at-risk status update for this section
    // (async — don't wait for it)
    updateAtRiskStatus(req.params.sessionId).catch(e => console.error('[AtRisk]', e.message))

    res.json({ success: true, marked: data.length, data })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/lms/native/attendance/student/:studentId/summary
// Student's attendance summary across all their sections
// ─────────────────────────────────────────────────────────────────────────────
router.get('/student/:studentId/summary', async (req, res) => {
  const { id: userId, role } = req.user
  // Students can only see their own; faculty/admin can see any
  if (role === 'student' && userId !== req.params.studentId) {
    return res.status(403).json({ success: false, error: 'Forbidden' })
  }
  try {
    // Get all enrollments for this student
    const { data: enrollments } = await supabaseAdmin
      .from('lms_enrollments')
      .select('section_id, roll_number, at_risk_status, lms_course_sections(section_name, course_id, lms_courses(code, title, branch, semester))')
      .eq('student_id', req.params.studentId)

    if (!enrollments?.length) return res.json({ success: true, data: [] })

    // For each section, get attendance stats
    const summaries = await Promise.all(
      enrollments.map(async (enr) => {
        const sectionId = enr.section_id

        // Total sessions conducted (not holidays)
        const { data: sessions } = await supabaseAdmin
          .from('lms_attendance_sessions')
          .select('id, total_conducted_counter, is_holiday')
          .eq('section_id', sectionId)
          .eq('is_holiday', false)

        const totalConducted = sessions?.length || 0

        // Present + Late count for student
        const { count: presentCount } = await supabaseAdmin
          .from('lms_attendance_records')
          .select('id', { count: 'exact', head: true })
          .in('session_id', (sessions || []).map(s => s.id))
          .eq('student_id', req.params.studentId)
          .in('status', ['P', 'L'])

        const attended = presentCount || 0
        const percentage = totalConducted > 0
          ? Math.round((attended / totalConducted) * 100)
          : null

        // 75% rule: classes_can_miss = floor(total * 0.25) - already_absent
        const canMiss = totalConducted > 0
          ? Math.max(0, Math.floor(totalConducted * 0.25) - (totalConducted - attended))
          : null

        return {
          section_id: sectionId,
          section_name: enr.lms_course_sections?.section_name,
          course: enr.lms_course_sections?.lms_courses,
          roll_number: enr.roll_number,
          at_risk_status: enr.at_risk_status,
          total_conducted: totalConducted,
          attended,
          absent: totalConducted - attended,
          percentage,
          can_miss_more: canMiss,
        }
      })
    )

    res.json({ success: true, data: summaries })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ─── Helper: update at_risk_status for all students in a section ─────────────
async function updateAtRiskStatus(sessionId) {
  // Get section_id from session
  const { data: session } = await supabaseAdmin
    .from('lms_attendance_sessions')
    .select('section_id')
    .eq('id', sessionId)
    .single()
  if (!session) return

  const sectionId = session.section_id

  // Get all sessions for this section
  const { data: allSessions } = await supabaseAdmin
    .from('lms_attendance_sessions')
    .select('id')
    .eq('section_id', sectionId)
    .eq('is_holiday', false)

  const totalConducted = allSessions?.length || 0
  if (totalConducted === 0) return

  // Get all students enrolled in this section
  const { data: enrollments } = await supabaseAdmin
    .from('lms_enrollments')
    .select('id, student_id, at_risk_status')
    .eq('section_id', sectionId)

  if (!enrollments?.length) return

  const sessionIds = allSessions.map(s => s.id)

  for (const enr of enrollments) {
    const { count: attended } = await supabaseAdmin
      .from('lms_attendance_records')
      .select('id', { count: 'exact', head: true })
      .in('session_id', sessionIds)
      .eq('student_id', enr.student_id)
      .in('status', ['P', 'L'])

    const pct = (attended || 0) / totalConducted * 100
    const newStatus = pct >= 75 ? 'safe' : pct >= 65 ? 'warning' : 'detained'

    if (newStatus !== enr.at_risk_status) {
      await supabaseAdmin
        .from('lms_enrollments')
        .update({ at_risk_status: newStatus })
        .eq('id', enr.id)

      // Fire notification if newly at risk
      if (newStatus === 'warning' || newStatus === 'detained') {
        await supabaseAdmin.from('lms_notifications').insert({
          user_id: enr.student_id,
          type: 'attendance',
          reference_id: enr.id,
          message: newStatus === 'detained'
            ? `⚠️ Attendance below 65% — you may be detained from exams.`
            : `⚠️ Attendance dropped below 75% — please attend more classes.`,
        })
      }
    }
  }
}

export default router
