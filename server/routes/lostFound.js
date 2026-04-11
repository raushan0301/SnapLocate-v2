import { Router } from 'express'
import { supabaseAdmin } from '../lib/supabase.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

// ─── GET /api/lost-found ─────────────────────────────────────
router.get('/', async (req, res) => {
  const { status, search } = req.query

  let query = supabaseAdmin
    .from('lost_found')
    .select('*, reporter:reporter_id(full_name, avatar_url)')
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)
  if (search) query = query.ilike('title', `%${search}%`)

  const { data, error } = await query
  if (error) throw error
  res.json({ success: true, data })
})

// ─── POST /api/lost-found ────────────────────────────────────
router.post('/', authenticate, async (req, res) => {
  const { title, description, image_url, status, location, date } = req.body
  if (!title || !status) return res.status(400).json({ success: false, message: 'title and status required' })

  const { data, error } = await supabaseAdmin
    .from('lost_found')
    .insert({ title, description, image_url, status, location, date, reporter_id: req.user.id })
    .select().single()

  if (error) throw error
  res.status(201).json({ success: true, data })
})

// ─── PATCH /api/lost-found/:id ───────────────────────────────
router.patch('/:id', authenticate, async (req, res) => {
  const { data: item } = await supabaseAdmin
    .from('lost_found').select('reporter_id').eq('id', req.params.id).single()

  if (!item) return res.status(404).json({ success: false, message: 'Not found' })
  if (item.reporter_id !== req.user.id) return res.status(403).json({ success: false, message: 'Forbidden' })

  const { title, description, image_url, status, location } = req.body
  const { data, error } = await supabaseAdmin
    .from('lost_found')
    .update({ title, description, image_url, status, location })
    .eq('id', req.params.id).select().single()

  if (error) throw error
  res.json({ success: true, data })
})

// ─── DELETE /api/lost-found/:id ──────────────────────────────
router.delete('/:id', authenticate, async (req, res) => {
  const { data: item } = await supabaseAdmin
    .from('lost_found').select('reporter_id').eq('id', req.params.id).single()

  if (!item) return res.status(404).json({ success: false, message: 'Not found' })
  if (item.reporter_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Forbidden' })
  }

  await supabaseAdmin.from('lost_found').delete().eq('id', req.params.id)
  res.json({ success: true, message: 'Post deleted' })
})

export default router
