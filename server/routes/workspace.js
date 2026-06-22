import { Router } from 'express'
import { supabaseAdmin } from '../lib/supabase.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

// Middleware to ensure user is student or guest
const requireStudent = (req, res, next) => {
  if (req.user.role !== 'student' && req.user.role !== 'guest') return res.status(403).json({ success: false, message: 'Forbidden' })
  next()
}

// ─── TIMETABLE ────────────────────────────────────────────────
router.get('/timetable', authenticate, requireStudent, async (req, res) => {
  const { data, error } = await supabaseAdmin.from('student_timetable').select('*').eq('student_id', req.user.id)
  if (error) throw error
  res.json({ success: true, data })
})

router.post('/timetable', authenticate, requireStudent, async (req, res) => {
  const { day, time_slot, course, location, type, color_preset } = req.body
  const { data, error } = await supabaseAdmin.from('student_timetable').insert({
    student_id: req.user.id, day, time_slot, course, location, type, color_preset
  }).select().single()
  if (error) throw error
  res.json({ success: true, data })
})

router.put('/timetable', authenticate, requireStudent, async (req, res) => {
  // Bulk replace for unified workspace
  await supabaseAdmin.from('student_timetable').delete().eq('student_id', req.user.id)
  const slots = Array.isArray(req.body) ? req.body : req.body.slots || []
  
  if (slots.length > 0) {
    const { error } = await supabaseAdmin.from('student_timetable').insert(slots.map(s => ({
      student_id: req.user.id,
      day: s.day,
      time_slot: s.time_slot || s.time,
      course: s.course,
      location: s.location,
      type: s.type,
      color_preset: s.color_preset || 'indigo'
    })))
    if (error) throw error
  }
  res.json({ success: true, message: 'Timetable synced' })
})

router.delete('/timetable/:id', authenticate, requireStudent, async (req, res) => {
  const { error } = await supabaseAdmin.from('student_timetable').delete().eq('id', req.params.id).eq('student_id', req.user.id)
  if (error) throw error
  res.json({ success: true })
})

// ─── NOTES ────────────────────────────────────────────────────
router.get('/notes', authenticate, requireStudent, async (req, res) => {
  const { data, error } = await supabaseAdmin.from('student_notes').select('*').eq('student_id', req.user.id).order('created_at', { ascending: false })
  if (error) throw error
  res.json({ success: true, data })
})

router.post('/notes', authenticate, requireStudent, async (req, res) => {
  const { title, body, tag, tag_color_preset } = req.body
  const { data, error } = await supabaseAdmin.from('student_notes').insert({
    student_id: req.user.id, title, body, tag, tag_color_preset
  }).select().single()
  if (error) throw error
  res.json({ success: true, data })
})

router.delete('/notes/:id', authenticate, requireStudent, async (req, res) => {
  const { error } = await supabaseAdmin.from('student_notes').delete().eq('id', req.params.id).eq('student_id', req.user.id)
  if (error) throw error
  res.json({ success: true })
})

// ─── TASKS ────────────────────────────────────────────────────
router.get('/tasks', authenticate, requireStudent, async (req, res) => {
  const { data, error } = await supabaseAdmin.from('student_tasks').select('*').eq('student_id', req.user.id).order('created_at', { ascending: false })
  if (error) throw error
  res.json({ success: true, data })
})

router.post('/tasks', authenticate, requireStudent, async (req, res) => {
  const { label, sub } = req.body
  const { data, error } = await supabaseAdmin.from('student_tasks').insert({
    student_id: req.user.id, label, sub
  }).select().single()
  if (error) throw error
  res.json({ success: true, data })
})

router.patch('/tasks/:id/toggle', authenticate, requireStudent, async (req, res) => {
  const { is_done } = req.body
  const { data, error } = await supabaseAdmin.from('student_tasks').update({ is_done }).eq('id', req.params.id).eq('student_id', req.user.id).select().single()
  if (error) throw error
  res.json({ success: true, data })
})

router.delete('/tasks/:id', authenticate, requireStudent, async (req, res) => {
  const { error } = await supabaseAdmin.from('student_tasks').delete().eq('id', req.params.id).eq('student_id', req.user.id)
  if (error) throw error
  res.json({ success: true })
})

// ─── LINKS ────────────────────────────────────────────────────
router.get('/links', authenticate, requireStudent, async (req, res) => {
  const { data, error } = await supabaseAdmin.from('student_links').select('*').eq('student_id', req.user.id).order('created_at', { ascending: false })
  if (error) throw error
  res.json({ success: true, data })
})

router.post('/links', authenticate, requireStudent, async (req, res) => {
  const { label, url } = req.body
  const { data, error } = await supabaseAdmin.from('student_links').insert({
    student_id: req.user.id, label, url
  }).select().single()
  if (error) throw error
  res.json({ success: true, data })
})

router.delete('/links/:id', authenticate, requireStudent, async (req, res) => {
  const { error } = await supabaseAdmin.from('student_links').delete().eq('id', req.params.id).eq('student_id', req.user.id)
  if (error) throw error
  res.json({ success: true })
})

// ─── FILES ────────────────────────────────────────────────────
router.get('/files', authenticate, requireStudent, async (req, res) => {
  const { data, error } = await supabaseAdmin.from('student_files').select('*').eq('student_id', req.user.id).order('created_at', { ascending: false })
  if (error) throw error
  res.json({ success: true, data })
})

router.post('/files', authenticate, requireStudent, async (req, res) => {
  const { name, file_url, size_bytes } = req.body
  const { data, error } = await supabaseAdmin.from('student_files').insert({
    student_id: req.user.id, name, file_url, size_bytes
  }).select().single()
  if (error) throw error
  res.json({ success: true, data })
})

router.delete('/files/:id', authenticate, requireStudent, async (req, res) => {
  const { error } = await supabaseAdmin.from('student_files').delete().eq('id', req.params.id).eq('student_id', req.user.id)
  if (error) throw error
  res.json({ success: true })
})

export default router
