import { Router } from 'express'
import { supabaseAdmin } from '../lib/supabase.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

// ─── GET /api/marketplace ────────────────────────────────────
router.get('/', async (req, res) => {
  const { status = 'active', search } = req.query

  let query = supabaseAdmin
    .from('marketplace')
    .select('*, seller:seller_id(full_name, avatar_url)')
    .eq('status', status)
    .order('created_at', { ascending: false })

  if (search) query = query.ilike('title', `%${search}%`)

  const { data, error } = await query
  if (error) throw error
  res.json({ success: true, data })
})

// ─── GET /api/marketplace/:id ────────────────────────────────
router.get('/:id', async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('marketplace')
    .select('*, seller:seller_id(id, full_name, avatar_url, email)')
    .eq('id', req.params.id)
    .single()

  if (error || !data) return res.status(404).json({ success: false, message: 'Listing not found' })
  res.json({ success: true, data })
})

// ─── POST /api/marketplace ───────────────────────────────────
router.post('/', authenticate, async (req, res) => {
  const { title, price, description, image_url } = req.body
  if (!title || !price) return res.status(400).json({ success: false, message: 'title and price are required' })

  const { data, error } = await supabaseAdmin
    .from('marketplace')
    .insert({ title, price, description, image_url, seller_id: req.user.id, status: 'active' })
    .select().single()

  if (error) throw error
  res.status(201).json({ success: true, data })
})

// ─── PATCH /api/marketplace/:id ──────────────────────────────
router.patch('/:id', authenticate, async (req, res) => {
  const { data: listing } = await supabaseAdmin
    .from('marketplace').select('seller_id').eq('id', req.params.id).single()

  if (!listing) return res.status(404).json({ success: false, message: 'Listing not found' })
  if (listing.seller_id !== req.user.id) return res.status(403).json({ success: false, message: 'Forbidden' })

  const { title, price, description, image_url, status } = req.body
  const { data, error } = await supabaseAdmin
    .from('marketplace')
    .update({ title, price, description, image_url, status, updated_at: new Date().toISOString() })
    .eq('id', req.params.id).select().single()

  if (error) throw error
  res.json({ success: true, data })
})

// ─── DELETE /api/marketplace/:id ─────────────────────────────
router.delete('/:id', authenticate, async (req, res) => {
  const { data: listing } = await supabaseAdmin
    .from('marketplace').select('seller_id').eq('id', req.params.id).single()

  if (!listing) return res.status(404).json({ success: false, message: 'Not found' })
  if (listing.seller_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Forbidden' })
  }

  await supabaseAdmin.from('marketplace').delete().eq('id', req.params.id)
  res.json({ success: true, message: 'Listing deleted' })
})

export default router
