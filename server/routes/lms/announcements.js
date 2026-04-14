import { Router } from 'express'
import { z } from 'zod'
import { supabaseAdmin } from '../../lib/supabase.js'
import { authenticate, requireFaculty } from '../../middleware/auth.js'

const router = Router()

const annSchema = z.object({
  course_id: z.string().uuid(),
  title:     z.string().min(1).max(300),
  message:   z.string().min(1),
  is_pinned: z.boolean().optional(),
})

// GET /api/lms/announcements?course_id=
router.get('/', authenticate, async (req, res) => {
  const { course_id } = req.query
  if (!course_id) return res.status(400).json({ success: false, error: 'course_id query param required' })

  try {
    const { data, error } = await supabaseAdmin
      .from('course_announcements')
      .select('*, users!faculty_id(full_name, avatar_url)')
      .eq('course_id', course_id)
      .order('is_pinned', { ascending: false })
      .order('posted_at',   { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
    if (error) throw error
    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// GET /api/lms/announcements/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('course_announcements')
      .select('*, users!faculty_id(full_name, avatar_url)')
      .eq('id', req.params.id)
      .single()
    if (error || !data) return res.status(404).json({ success: false, error: 'Announcement not found' })
    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// POST /api/lms/announcements
router.post('/', authenticate, requireFaculty, async (req, res) => {
  const { id: userId } = req.user
  const parsed = annSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.errors })

  try {
    const { data, error } = await supabaseAdmin
      .from('course_announcements')
      .insert({ ...parsed.data, faculty_id: userId })
      .select()
      .single()
    if (error) throw error
    res.status(201).json({ success: true, data })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// PATCH /api/lms/announcements/:id
router.patch('/:id', authenticate, requireFaculty, async (req, res) => {
  const { id: userId } = req.user
  const parsed = annSchema.partial().safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.errors })

  try {
    const { data, error } = await supabaseAdmin
      .from('course_announcements')
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .eq('faculty_id', userId)
      .select()
      .single()
    if (error) throw error
    if (!data) return res.status(404).json({ success: false, error: 'Announcement not found or unauthorized' })
    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// DELETE /api/lms/announcements/:id
router.delete('/:id', authenticate, requireFaculty, async (req, res) => {
  const { id: userId } = req.user
  try {
    const { error } = await supabaseAdmin
      .from('course_announcements')
      .delete()
      .eq('id', req.params.id)
      .eq('faculty_id', userId)
    if (error) throw error
    res.json({ success: true, message: 'Announcement deleted' })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
