import { Router } from 'express'
import { supabaseAdmin } from '../lib/supabase.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

// ─── GET /api/shops ──────────────────────────────────────────
router.get('/', async (req, res) => {
  const { category } = req.query
  let query = supabaseAdmin.from('shops').select('*').order('created_at', { ascending: false })
  if (category) query = query.eq('category', category)
  const { data, error } = await query
  if (error) throw error
  res.json({ success: true, data })
})

// ─── GET /api/shops/:id ──────────────────────────────────────
router.get('/:id', async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('shops').select('*').eq('id', req.params.id).single()
  if (error || !data) return res.status(404).json({ success: false, message: 'Shop not found' })
  res.json({ success: true, data })
})

// ─── POST /api/shops ─────────────────────────────────────────
router.post('/', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' })
  
  const payload = req.body
  const { data, error } = await supabaseAdmin
    .from('shops')
    .insert(payload)
    .select().single()
    
  if (error) return res.status(500).json({ success: false, message: error.message })
  res.status(201).json({ success: true, data })
})

// ─── PUT /api/shops/:id ──────────────────────────────────────
router.put('/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' })
  
  const payload = { ...req.body }
  delete payload.id

  const { data, error } = await supabaseAdmin
    .from('shops')
    .update(payload)
    .eq('id', req.params.id)
    .select().single()

  if (error) return res.status(500).json({ success: false, message: error.message })
  res.json({ success: true, data })
})

// ─── DELETE /api/shops/:id ───────────────────────────────────
router.delete('/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' })

  const { error } = await supabaseAdmin
    .from('shops')
    .delete()
    .eq('id', req.params.id)

  if (error) return res.status(500).json({ success: false, message: error.message })
  res.json({ success: true, message: 'Shop deleted' })
})

export default router
