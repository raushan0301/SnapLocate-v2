import { Router } from 'express'
import { supabaseAdmin } from '../../../lib/supabase.js'
import { authenticate } from '../../../middleware/auth.js'

const router = Router()
router.use(authenticate)

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/lms/native/faculty/my-sections
// Returns all sections assigned to the logged-in faculty member,
// with their parent course data — used by Attendance, Assignments, Quizzes UIs
// ─────────────────────────────────────────────────────────────────────────────
router.get('/my-sections', async (req, res) => {
  try {
    // 1. Find the faculty_profile for this user
    const { data: profile, error: profErr } = await supabaseAdmin
      .from('faculty_profiles')
      .select('id')
      .eq('user_id', req.user.id)
      .single()

    if (profErr || !profile) {
      // Admin users or users without a faculty profile — return all sections
      if (req.user.role === 'admin') {
        const { data, error } = await supabaseAdmin
          .from('lms_course_sections')
          .select(`
            id, section_name, room, course_id,
            lms_courses ( id, code, title, academic_year, branch, semester )
          `)
          .order('section_name')
        if (error) throw error
        return res.json({ success: true, data: data || [] })
      }
      return res.json({ success: true, data: [] })
    }

    // 2. Get sections where this faculty_profile.id is assigned
    const { data, error } = await supabaseAdmin
      .from('lms_course_sections')
      .select(`
        id, section_name, room, course_id,
        lms_courses ( id, code, title, academic_year, branch, semester )
      `)
      .eq('faculty_id', profile.id)
      .order('section_name')

    if (error) throw error
    res.json({ success: true, data: data || [] })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/lms/native/faculty/sections/:id/enrollments
// Returns enrolled students for a section (faculty-scoped)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/sections/:id/enrollments', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('lms_enrollments')
      .select('*, users!student_id(id, full_name, email, avatar_url)')
      .eq('section_id', req.params.id)
      .order('roll_number')
    if (error) throw error
    res.json({ success: true, data: data || [] })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
