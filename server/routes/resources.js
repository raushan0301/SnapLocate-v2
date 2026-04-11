import { Router } from 'express'
import { supabaseAdmin } from '../lib/supabase.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

// ─── GET /api/resources ──────────────────────────────────────
router.get('/', async (req, res) => {
  const { course_id, type, dept } = req.query

  let query = supabaseAdmin
    .from('resources')
    .select(`*, course:course_id(code, name, dept), uploader:uploaded_by(full_name, avatar_url)`)
    .order('created_at', { ascending: false })

  if (course_id) query = query.eq('course_id', course_id)
  if (type)      query = query.eq('type', type)

  const { data, error } = await query
  if (error) throw error

  res.json({ success: true, data })
})

// ─── GET /api/resources/:id ──────────────────────────────────
router.get('/:id', async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('resources')
    .select('*, course:course_id(*), uploader:uploaded_by(full_name)')
    .eq('id', req.params.id)
    .single()

  if (error || !data) return res.status(404).json({ success: false, message: 'Resource not found' })
  res.json({ success: true, data })
})

// ─── POST /api/resources ─────────────────────────────────────
// Faculty uploads a resource (file_url comes from upload endpoint)
router.post('/', authenticate, async (req, res) => {
  const { course_id, title, type, file_url } = req.body

  if (!title || !type || !file_url) {
    return res.status(400).json({ success: false, message: 'title, type, and file_url are required' })
  }

  const { data, error } = await supabaseAdmin
    .from('resources')
    .insert({ course_id, title, type, file_url, uploaded_by: req.user.id })
    .select()
    .single()

  if (error) throw error
  res.status(201).json({ success: true, data })
})

// ─── DELETE /api/resources/:id ───────────────────────────────
router.delete('/:id', authenticate, async (req, res) => {
  const { data } = await supabaseAdmin
    .from('resources').select('uploaded_by').eq('id', req.params.id).single()

  if (!data) return res.status(404).json({ success: false, message: 'Resource not found' })
  if (data.uploaded_by !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Forbidden' })
  }

  await supabaseAdmin.from('resources').delete().eq('id', req.params.id)
  res.json({ success: true, message: 'Resource deleted' })
})

export default router
