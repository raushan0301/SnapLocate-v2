import { Router } from 'express'
import { supabaseAdmin } from '../lib/supabase.js'
import { authenticate, requireFaculty } from '../middleware/auth.js'

const router = Router()

// ─── NOTES ────────────────────────────────────────────────────
router.get('/notes', authenticate, requireFaculty, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('faculty_notes')
    .select('*')
    .eq('faculty_user_id', req.user.id)
    .order('created_at', { ascending: false })
  if (error) return res.json({ success: true, data: [] }) // Table might not exist yet
  res.json({ success: true, data })
})

router.post('/notes', authenticate, requireFaculty, async (req, res) => {
  const { title, body, tag, tag_color_preset } = req.body
  const { data, error } = await supabaseAdmin.from('faculty_notes').insert({
    faculty_user_id: req.user.id, title, body, tag, tag_color_preset
  }).select().single()
  if (error) throw error
  res.json({ success: true, data })
})

router.delete('/notes/:id', authenticate, requireFaculty, async (req, res) => {
  const { error } = await supabaseAdmin.from('faculty_notes').delete().eq('id', req.params.id).eq('faculty_user_id', req.user.id)
  if (error) throw error
  res.json({ success: true })
})

// ─── TASKS ────────────────────────────────────────────────────
router.get('/tasks', authenticate, requireFaculty, async (req, res) => {
  const { data, error } = await supabaseAdmin.from('faculty_tasks').select('*').eq('faculty_user_id', req.user.id).order('created_at', { ascending: false })
  if (error) return res.json({ success: true, data: [] })
  res.json({ success: true, data })
})

router.post('/tasks', authenticate, requireFaculty, async (req, res) => {
  const { label, sub } = req.body
  const { data, error } = await supabaseAdmin.from('faculty_tasks').insert({
    faculty_user_id: req.user.id, label, sub
  }).select().single()
  if (error) throw error
  res.json({ success: true, data })
})

router.patch('/tasks/:id/toggle', authenticate, requireFaculty, async (req, res) => {
  const { is_done } = req.body
  const { data, error } = await supabaseAdmin.from('faculty_tasks').update({ is_done }).eq('id', req.params.id).eq('faculty_user_id', req.user.id).select().single()
  if (error) throw error
  res.json({ success: true, data })
})

router.delete('/tasks/:id', authenticate, requireFaculty, async (req, res) => {
  const { error } = await supabaseAdmin.from('faculty_tasks').delete().eq('id', req.params.id).eq('faculty_user_id', req.user.id)
  if (error) throw error
  res.json({ success: true })
})

// ─── LINKS ────────────────────────────────────────────────────
router.get('/links', authenticate, requireFaculty, async (req, res) => {
  const { data, error } = await supabaseAdmin.from('faculty_links').select('*').eq('faculty_user_id', req.user.id).order('created_at', { ascending: false })
  if (error) return res.json({ success: true, data: [] })
  res.json({ success: true, data })
})

router.post('/links', authenticate, requireFaculty, async (req, res) => {
  const { label, url } = req.body
  const { data, error } = await supabaseAdmin.from('faculty_links').insert({
    faculty_user_id: req.user.id, label, url
  }).select().single()
  if (error) throw error
  res.json({ success: true, data })
})

router.delete('/links/:id', authenticate, requireFaculty, async (req, res) => {
  const { error } = await supabaseAdmin.from('faculty_links').delete().eq('id', req.params.id).eq('faculty_user_id', req.user.id)
  if (error) throw error
  res.json({ success: true })
})

// ─── FILES ────────────────────────────────────────────────────
router.get('/files', authenticate, requireFaculty, async (req, res) => {
  const { data, error } = await supabaseAdmin.from('faculty_files').select('*').eq('faculty_user_id', req.user.id).order('created_at', { ascending: false })
  if (error) return res.json({ success: true, data: [] })
  res.json({ success: true, data })
})

router.post('/files', authenticate, requireFaculty, async (req, res) => {
  const { name, file_url, size_bytes } = req.body
  const { data, error } = await supabaseAdmin.from('faculty_files').insert({
    faculty_user_id: req.user.id, name, file_url, size_bytes
  }).select().single()
  if (error) throw error
  res.json({ success: true, data })
})

router.delete('/files/:id', authenticate, requireFaculty, async (req, res) => {
  const { error } = await supabaseAdmin.from('faculty_files').delete().eq('id', req.params.id).eq('faculty_user_id', req.user.id)
  if (error) throw error
  res.json({ success: true })
})

export default router
