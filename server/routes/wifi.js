import { Router } from 'express'
import { supabaseAdmin } from '../lib/supabase.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

// ─── GET /api/wifi ────────────────────────────────────────────
router.get('/', async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('wifi')
    .select('*')
    .order('created_at', { ascending: false })
    
  if (error) return res.status(500).json({ success: false, message: error.message })
  res.json({ success: true, data })
})

// ─── POST /api/wifi ───────────────────────────────────────────
router.post('/', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' })
  
  const payload = req.body
  const { data, error } = await supabaseAdmin
    .from('wifi')
    .insert(payload)
    .select().single()
    
  if (error) return res.status(500).json({ success: false, message: error.message })
  res.status(201).json({ success: true, data })
})

// ─── PUT /api/wifi/:id ────────────────────────────────────────
router.put('/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' })
  
  const payload = { ...req.body }
  delete payload.id

  const { data, error } = await supabaseAdmin
    .from('wifi')
    .update(payload)
    .eq('id', req.params.id)
    .select().single()

  if (error) return res.status(500).json({ success: false, message: error.message })
  res.json({ success: true, data })
})

// ─── DELETE /api/wifi/:id ─────────────────────────────────────
router.delete('/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' })

  const { error } = await supabaseAdmin
    .from('wifi')
    .delete()
    .eq('id', req.params.id)

  if (error) return res.status(500).json({ success: false, message: error.message })
  res.json({ success: true, message: 'Network deleted' })
})

export default router
