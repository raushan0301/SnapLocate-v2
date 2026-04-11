import { Router } from 'express'
import { supabaseAdmin } from '../lib/supabase.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

// ─── GET /api/societies ──────────────────────────────────────
router.get('/', async (req, res) => {
  const { category } = req.query
  let query = supabaseAdmin.from('societies').select('*').order('name')
  if (category) query = query.eq('category', category)
  const { data, error } = await query
  if (error) throw error
  res.json({ success: true, data })
})

// ─── GET /api/societies/:id ──────────────────────────────────
router.get('/:id', async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('societies').select('*').eq('id', req.params.id).single()
  if (error || !data) return res.status(404).json({ success: false, message: 'Society not found' })
  res.json({ success: true, data })
})

// ─── POST /api/societies ─────────────────────────────────────
// Admin only
router.post('/', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' })
  const { name, description, cover_url, category, logo_img, email_id, website_link, presidents, vice_presidents } = req.body
  const { data, error } = await supabaseAdmin
    .from('societies')
    .insert({ 
      name, description, cover_url, category, member_count: 0,
      logo_img, email_id, website_link, presidents, vice_presidents
    })
    .select().single()
  if (error) throw error
  res.status(201).json({ success: true, data })
})

// ─── PUT /api/societies/:id ────────────────────────────────────
// Admin only
router.put('/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' })
  const { name, description, cover_url, category, logo_img, email_id, website_link, presidents, vice_presidents } = req.body
  const { data, error } = await supabaseAdmin
    .from('societies')
    .update({ 
      name, description, cover_url, category,
      logo_img, email_id, website_link, presidents, vice_presidents
    })
    .eq('id', req.params.id)
    .select().single()
  if (error) throw error
  res.json({ success: true, data })
})

// ─── DELETE /api/societies/:id ───────────────────────────────
// Admin only
router.delete('/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' })
  const { error } = await supabaseAdmin.from('societies').delete().eq('id', req.params.id)
  if (error) throw error
  res.json({ success: true, message: 'Society deleted' })
})

export default router
