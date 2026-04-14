import { Router } from 'express'
import { z } from 'zod'
import { supabaseAdmin } from '../../lib/supabase.js'
import { authenticate, requireAdmin, requireStudent } from '../../middleware/auth.js'

const router = Router()

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/lms/sessions — distinct session codes for the current student
// Returns: ["2526EVESEM", "2425ODDSEM", ...]
// ─────────────────────────────────────────────────────────────────────────────
router.get('/sessions', authenticate, async (req, res) => {
  const { role, id: userId } = req.user
  try {
    if (role === 'student') {
      // Get all session codes from courses the student is enrolled in
      const { data, error } = await supabaseAdmin
        .from('course_enrollments')
        .select('courses(semester)')
        .eq('student_id', userId)
        .eq('status', 'active')
      if (error) throw error

      const sessions = [...new Set(
        (data || [])
          .map(e => e.courses?.semester)
          .filter(Boolean)
      )].sort((a, b) => b.localeCompare(a)) // newest first

      return res.json({ success: true, data: sessions })
    }

    // Faculty/admin: all distinct semesters in courses table
    const { data, error } = await supabaseAdmin
      .from('courses')
      .select('semester')
      .not('semester', 'is', null)
    if (error) throw error

    const sessions = [...new Set((data || []).map(c => c.semester).filter(Boolean))]
      .sort((a, b) => b.localeCompare(a))
    res.json({ success: true, data: sessions })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/lms/courses — filtered course list
// Query params:
//   session   — filter by semester/session code (e.g. "2526EVESEM")
//   search    — search by course name/code
//   student_id — admin only: get courses for a specific student
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', authenticate, async (req, res) => {
  const { role, id: userId } = req.user
  const { session, search, student_id } = req.query

  try {
    if (role === 'student' || (role === 'admin' && student_id)) {
      const sid = role === 'student' ? userId : student_id

      let query = supabaseAdmin
        .from('course_enrollments')
        .select(`
          id,
          status,
          enrolled_at,
          courses (
            id,
            code,
            name,
            dept,
            semester,
            year,
            progress,
            moodle_course_id,
            faculty_profiles (
              users (full_name, avatar_url)
            )
          )
        `)
        .eq('student_id', sid)
        .eq('status', 'active')

      const { data, error } = await query
      if (error) throw error

      let results = data || []

      // Filter by session
      if (session && session !== 'ALL') {
        results = results.filter(e => {
          const sem = (e.courses?.semester || '').toUpperCase()
          return sem === session.toUpperCase()
        })
      }

      // Filter by search
      if (search) {
        const q = search.toLowerCase()
        results = results.filter(e => {
          const c = e.courses
          if (!c) return false
          return (
            (c.name || '').toLowerCase().includes(q) ||
            (c.code || '').toLowerCase().includes(q) ||
            (c.dept || '').toLowerCase().includes(q)
          )
        })
      }

      return res.json({ success: true, data: results })
    }

    if (role === 'faculty') {
      const { data: fp } = await supabaseAdmin
        .from('faculty_profiles')
        .select('id')
        .eq('user_id', userId)
        .single()
      if (!fp) return res.json({ success: true, data: [] })

      let query = supabaseAdmin
        .from('courses')
        .select('*, faculty_profiles(users(full_name))')
        .eq('faculty_id', fp.id)
        .order('created_at', { ascending: false })

      if (session && session !== 'ALL') query = query.eq('semester', session)
      if (search) query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%`)

      const { data, error } = await query
      if (error) throw error
      return res.json({ success: true, data })
    }

    // Admin: all courses
    let query = supabaseAdmin
      .from('courses')
      .select('*, faculty_profiles(users(full_name))')
      .order('created_at', { ascending: false })

    if (session && session !== 'ALL') query = query.eq('semester', session)
    if (search) query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%`)

    const { data, error } = await query
    if (error) throw error
    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/lms/courses/:id — single course detail
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('courses')
      .select('*, faculty_profiles(*, users(full_name, avatar_url, email))')
      .eq('id', req.params.id)
      .single()
    if (error) throw error
    if (!data) return res.status(404).json({ success: false, error: 'Course not found' })

    const { count } = await supabaseAdmin
      .from('course_enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('course_id', req.params.id)
      .eq('status', 'active')

    res.json({ success: true, data: { ...data, enrolled_count: count || 0 } })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/lms/courses/:id/students — enrolled student list (faculty/admin)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id/students', authenticate, async (req, res) => {
  const { role } = req.user
  if (role !== 'faculty' && role !== 'admin')
    return res.status(403).json({ success: false, error: 'Forbidden' })
  try {
    const { data, error } = await supabaseAdmin
      .from('course_enrollments')
      .select('student_id, status, users!student_id(id, full_name, email, avatar_url)')
      .eq('course_id', req.params.id)
      .eq('status', 'active')
    if (error) throw error
    const flat = (data || []).map(e => ({ student_id: e.student_id, ...e.users }))
    res.json({ success: true, data: flat })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/lms/courses/:id/enroll — student self-enroll
// ─────────────────────────────────────────────────────────────────────────────
router.post('/:id/enroll', authenticate, requireStudent, async (req, res) => {
  const { id: userId } = req.user
  try {
    const { data: course } = await supabaseAdmin
      .from('courses').select('id').eq('id', req.params.id).single()
    if (!course) return res.status(404).json({ success: false, error: 'Course not found' })

    // Get org_id
    const { data: sp } = await supabaseAdmin
      .from('student_profiles').select('org_id').eq('user_id', userId).maybeSingle()
    const orgId = sp?.org_id || null

    const { data, error } = await supabaseAdmin
      .from('course_enrollments')
      .upsert({
        course_id: req.params.id, student_id: userId,
        status: 'active',
        ...(orgId ? { org_id: orgId } : {}),
      }, { onConflict: 'course_id,student_id' })
      .select().single()
    if (error) throw error
    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/lms/courses/:id/enroll — student self-drop
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/:id/enroll', authenticate, requireStudent, async (req, res) => {
  const { id: userId } = req.user
  try {
    const { error } = await supabaseAdmin
      .from('course_enrollments')
      .update({ status: 'dropped' })
      .eq('course_id', req.params.id)
      .eq('student_id', userId)
    if (error) throw error
    res.json({ success: true, message: 'Dropped from course' })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/lms/courses/:id/bulk-enroll — admin bulk enroll
// ─────────────────────────────────────────────────────────────────────────────
router.post('/:id/bulk-enroll', authenticate, requireAdmin, async (req, res) => {
  const schema = z.object({ student_ids: z.array(z.string().uuid()).min(1) })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.errors })
  try {
    const rows = parsed.data.student_ids.map(sid => ({
      course_id: req.params.id, student_id: sid, status: 'active',
    }))
    const { data, error } = await supabaseAdmin
      .from('course_enrollments')
      .upsert(rows, { onConflict: 'course_id,student_id' })
      .select()
    if (error) throw error
    const { count } = await supabaseAdmin
      .from('course_enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('course_id', req.params.id).eq('status', 'active')
    await supabaseAdmin.from('courses').update({ enrolled_count: count || 0 }).eq('id', req.params.id)
    res.json({ success: true, data, enrolled: data.length })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
