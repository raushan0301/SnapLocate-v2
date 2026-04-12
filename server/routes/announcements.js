import { Router } from 'express'
import { supabaseAdmin } from '../lib/supabase.js'
import { authenticate, requireAdmin } from '../middleware/auth.js'

const router = Router()

// GET /api/announcements — Public
router.get('/', async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('announcements')
    .select('*, author:created_by(full_name)')
    .order('created_at', { ascending: false })
  if (error) throw error
  res.json({ success: true, data })
})

// POST /api/announcements — Admin only
router.post('/', authenticate, requireAdmin, async (req, res) => {
  const { title, message, type } = req.body
  if (!title || !message) {
    return res.status(400).json({ success: false, message: 'title and message are required' })
  }
  const { data, error } = await supabaseAdmin
    .from('announcements')
    .insert({ title, message, type: type || 'info', created_by: req.user.id })
    .select('*, author:created_by(full_name)')
    .single()
  if (error) throw error
  res.status(201).json({ success: true, data })
})

// PUT /api/announcements/:id — Admin only
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  const { title, message, type } = req.body
  const { data, error } = await supabaseAdmin
    .from('announcements')
    .update({ title, message, type, updated_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .select('*, author:created_by(full_name)')
    .single()
  if (error) throw error
  res.json({ success: true, data })
})

// DELETE /api/announcements/:id — Admin only
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  const { error } = await supabaseAdmin
    .from('announcements')
    .delete()
    .eq('id', req.params.id)
  if (error) throw error
  res.json({ success: true })
})

export default router
