import { Router } from 'express'
import { z } from 'zod'
import { supabaseAdmin } from '../../lib/supabase.js'
import { authenticate, requireAdmin, requireStudent } from '../../middleware/auth.js'

const router = Router()

// GET /api/lms/courses — student: enrolled; faculty: taught; admin: all
router.get('/', authenticate, async (req, res) => {
  const { role, id: userId } = req.user
  try {
    if (role === 'student' || (role === 'admin' && req.query.student_id)) {
      const sid = role === 'student' ? userId : req.query.student_id
      const { data, error } = await supabaseAdmin
        .from('course_enrollments')
        .select('*, courses(id, code, name, dept, semester, year, faculty_profiles(users(full_name)))')
        .eq('student_id', sid)
        .eq('status', 'active')
      if (error) throw error
      return res.json({ success: true, data })
    }

    if (role === 'faculty') {
      const { data: fp } = await supabaseAdmin
        .from('faculty_profiles')
        .select('id')
        .eq('user_id', userId)
        .single()
      if (!fp) return res.json({ success: true, data: [] })
      const { data, error } = await supabaseAdmin
        .from('courses')
        .select('*, faculty_profiles(users(full_name))')
        .eq('faculty_id', fp.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return res.json({ success: true, data })
    }

    // admin: all courses
    const { data, error } = await supabaseAdmin
      .from('courses')
      .select('*, faculty_profiles(users(full_name))')
      .order('created_at', { ascending: false })
    if (error) throw error
    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// GET /api/lms/courses/:id — single course detail
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

// GET /api/lms/courses/:id/students — enrolled student list (faculty/admin)
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
    // Flatten so each item has student_id + user fields at top level
    const flat = (data || []).map(e => ({
      student_id: e.student_id,
      ...e.users,
    }))
    res.json({ success: true, data: flat })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// POST /api/lms/courses/:id/enroll — student self-enroll
router.post('/:id/enroll', authenticate, requireStudent, async (req, res) => {
  const { id: userId } = req.user
  try {
    const { data: course } = await supabaseAdmin
      .from('courses')
      .select('id')
      .eq('id', req.params.id)
      .single()
    if (!course) return res.status(404).json({ success: false, error: 'Course not found' })
    const { data, error } = await supabaseAdmin
      .from('course_enrollments')
      .upsert({ course_id: req.params.id, student_id: userId, status: 'active' }, { onConflict: 'course_id,student_id' })
      .select()
      .single()
    if (error) throw error
    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// DELETE /api/lms/courses/:id/enroll — student self-drop
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

// POST /api/lms/courses/:id/bulk-enroll — admin bulk enroll
router.post('/:id/bulk-enroll', authenticate, requireAdmin, async (req, res) => {
  const schema = z.object({ student_ids: z.array(z.string().uuid()).min(1) })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.errors })
  try {
    const rows = parsed.data.student_ids.map(sid => ({
      course_id: req.params.id,
      student_id: sid,
      status: 'active',
    }))
    const { data, error } = await supabaseAdmin
      .from('course_enrollments')
      .upsert(rows, { onConflict: 'course_id,student_id' })
      .select()
    if (error) throw error

    // Update the cached enrolled_count on the courses row
    const { count } = await supabaseAdmin
      .from('course_enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('course_id', req.params.id)
      .eq('status', 'active')
    await supabaseAdmin
      .from('courses')
      .update({ enrolled_count: count || 0 })
      .eq('id', req.params.id)

    res.json({ success: true, data, enrolled: data.length })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
