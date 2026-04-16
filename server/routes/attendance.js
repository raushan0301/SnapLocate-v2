import { Router } from 'express'
import { z } from 'zod'
import { supabaseAdmin } from '../lib/supabase.js'
import { authenticate, requireFaculty, requireStudent } from '../middleware/auth.js'

const router = Router()

// GET /api/attendance/summary — MUST be before /:id
router.get('/summary', authenticate, async (req, res) => {
  const { role, id: userId } = req.user
  const { course_id } = req.query
  if (!course_id) return res.status(400).json({ success: false, error: 'course_id query param required' })

  try {
    let query = supabaseAdmin
      .from('attendance')
      .select('student_id, status, users!student_id(full_name, avatar_url)')
      .eq('course_id', course_id)

    if (role === 'student') query = query.eq('student_id', userId)

    const { data, error } = await query
    if (error) throw error

    const map = {}
    for (const row of data) {
      const sid = row.student_id
      if (!map[sid]) map[sid] = { student_id: sid, user: row.users, present: 0, absent: 0, late: 0, excused: 0, total: 0 }
      map[sid][row.status] = (map[sid][row.status] || 0) + 1
      map[sid].total++
    }
    const summary = Object.values(map).map(s => ({
      ...s,
      percentage: s.total > 0 ? +((s.present + s.late * 0.5) / s.total * 100).toFixed(1) : 0,
    }))
    res.json({ success: true, data: summary })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// GET /api/attendance/my — MUST be before /:id
router.get('/my', authenticate, requireStudent, async (req, res) => {
  const { id: userId } = req.user
  try {
    const { data, error } = await supabaseAdmin
      .from('attendance')
      .select('*, courses(id, code, name)')
      .eq('student_id', userId)
      .order('date', { ascending: false })
    if (error) throw error

    const map = {}
    for (const row of data) {
      const cid = row.course_id
      if (!map[cid]) map[cid] = { course: row.courses, present: 0, absent: 0, late: 0, excused: 0, total: 0, records: [] }
      map[cid][row.status]++
      map[cid].total++
      map[cid].records.push({ id: row.id, date: row.date, status: row.status })
    }
    const summary = Object.values(map).map(c => ({
      ...c,
      percentage: c.total > 0 ? +((c.present + c.late * 0.5) / c.total * 100).toFixed(1) : 0,
    }))
    res.json({ success: true, data: summary })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// POST /api/attendance/bulk — MUST be before /:id
router.post('/bulk', authenticate, requireFaculty, async (req, res) => {
  const { id: userId } = req.user
  const schema = z.object({
    course_id: z.string().uuid(),
    date:      z.string(),
    records:   z.array(z.object({
      student_id: z.string().uuid(),
      status:     z.enum(['present', 'absent', 'late', 'excused']),
    })).min(1),
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.errors })

  try {
    const rows = parsed.data.records.map(r => ({
      course_id:   parsed.data.course_id,
      student_id:  r.student_id,
      date:        parsed.data.date,
      status:      r.status,
      marked_by:   userId,
      synced_from: 'manual',
    }))
    const { data, error } = await supabaseAdmin
      .from('attendance')
      .upsert(rows, { onConflict: 'course_id,student_id,date' })
      .select()
    if (error) throw error
    res.json({ success: true, data, marked: data.length })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// GET /api/attendance?course_id=&student_id=&date_from=&date_to=
router.get('/', authenticate, async (req, res) => {
  const { role, id: userId } = req.user
  const { course_id, student_id, date_from, date_to } = req.query

  try {
    let query = supabaseAdmin
      .from('attendance')
      .select('*, users!student_id(full_name, avatar_url)')
      .order('date', { ascending: false })

    if (role === 'student') {
      query = query.eq('student_id', userId)
    } else {
      if (student_id) query = query.eq('student_id', student_id)
    }
    if (course_id) query = query.eq('course_id', course_id)
    if (date_from) query = query.gte('date', date_from)
    if (date_to)   query = query.lte('date', date_to)

    const { data, error } = await query
    if (error) throw error
    res.json({ success: true, data })
  } catch (err) {
    console.error('[Attendance] Error:', err)
    res.status(500).json({ success: false, error: err.message })
  }
})

// PATCH /api/attendance/:id
router.patch('/:id', authenticate, requireFaculty, async (req, res) => {
  const schema = z.object({ status: z.enum(['present', 'absent', 'late', 'excused']) })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.errors })

  try {
    const { data, error } = await supabaseAdmin
      .from('attendance')
      .update({ status: parsed.data.status, synced_from: 'manual' })
      .eq('id', req.params.id)
      .select()
      .single()
    if (error) throw error
    if (!data) return res.status(404).json({ success: false, error: 'Attendance record not found' })
    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
