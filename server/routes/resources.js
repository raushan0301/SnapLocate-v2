import { Router } from 'express'
import { z } from 'zod'
import { supabaseAdmin } from '../lib/supabase.js'
import { authenticate, requireFaculty, requireAdmin } from '../middleware/auth.js'

const router = Router()

// ─── GET /api/resources ──────────────────────────────────────
// Students + Faculty + Admin: browse resources (scoped by org_id)
router.get('/', authenticate, async (req, res) => {
  const { course_id, type, search } = req.query

  let query = supabaseAdmin
    .from('resources')
    .select(`*, course:course_id(code, name, dept), uploader:uploaded_by(full_name, avatar_url, role)`)
    .eq('org_id', req.user.org_id)
    .order('created_at', { ascending: false })

  if (course_id) query = query.eq('course_id', course_id)
  if (type && type !== 'all') query = query.eq('type', type)
  if (search) query = query.ilike('title', `%${search}%`)

  // Faculty only sees their own uploads unless they want to browse all
  // Faculty can browse all (for reference), but only manage their own
  const { data, error } = await query
  if (error) throw error

  res.json({ success: true, data })
})

// ─── GET /api/resources/my ────────────────────────────────────
// Faculty: only their own uploads
router.get('/my', authenticate, requireFaculty, async (req, res) => {
  const { type } = req.query

  let query = supabaseAdmin
    .from('resources')
    .select(`*, course:course_id(code, name, dept)`)
    .eq('org_id', req.user.org_id)
    .eq('uploaded_by', req.user.id)
    .order('created_at', { ascending: false })

  if (type && type !== 'all') query = query.eq('type', type)

  const { data, error } = await query
  if (error) throw error

  res.json({ success: true, data })
})

// ─── GET /api/resources/:id ──────────────────────────────────
router.get('/:id', authenticate, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('resources')
    .select('*, course:course_id(*), uploader:uploaded_by(full_name, avatar_url)')
    .eq('id', req.params.id)
    .eq('org_id', req.user.org_id)
    .single()

  if (error || !data) return res.status(404).json({ success: false, error: 'Resource not found' })
  res.json({ success: true, data })
})

// ─── POST /api/resources ─────────────────────────────────────
// Faculty uploads a resource (file_url comes from /api/upload/pdf or /api/upload/workspace)
router.post('/', authenticate, requireFaculty, async (req, res) => {
  const schema = z.object({
    course_id: z.string().uuid().optional().nullable(),
    title: z.string().min(1).max(200),
    type: z.enum(['note', 'lab', 'paper', 'doc', 'syllabus', 'pyq']),
    file_url: z.string().url(),
    description: z.string().max(500).optional(),
  })

  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.errors })

  const { course_id, title, type, file_url, description } = parsed.data

  const { data, error } = await supabaseAdmin
    .from('resources')
    .insert({
      course_id: course_id || null,
      title,
      type,
      file_url,
      description,
      uploaded_by: req.user.id,
      org_id: req.user.org_id,
    })
    .select('*, course:course_id(code, name)')
    .single()

  if (error) throw error
  res.status(201).json({ success: true, data })
})

// ─── PATCH /api/resources/:id ────────────────────────────────
// Faculty: update their own resource metadata
router.patch('/:id', authenticate, requireFaculty, async (req, res) => {
  const schema = z.object({
    title: z.string().min(1).max(200).optional(),
    type: z.enum(['note', 'lab', 'paper', 'doc', 'syllabus', 'pyq']).optional(),
    course_id: z.string().uuid().nullable().optional(),
    description: z.string().max(500).optional(),
  })

  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.errors })

  // Verify ownership
  const { data: existing } = await supabaseAdmin
    .from('resources').select('uploaded_by').eq('id', req.params.id).eq('org_id', req.user.org_id).single()
  if (!existing) return res.status(404).json({ success: false, error: 'Not found' })
  if (existing.uploaded_by !== req.user.id) return res.status(403).json({ success: false, error: 'Forbidden' })

  const { data, error } = await supabaseAdmin
    .from('resources')
    .update(parsed.data)
    .eq('id', req.params.id)
    .select('*, course:course_id(code, name)')
    .single()

  if (error) throw error
  res.json({ success: true, data })
})

// ─── DELETE /api/resources/:id ───────────────────────────────
// Faculty deletes their own; Admin deletes any
router.delete('/:id', authenticate, async (req, res) => {
  const { data } = await supabaseAdmin
    .from('resources').select('uploaded_by').eq('id', req.params.id).eq('org_id', req.user.org_id).single()

  if (!data) return res.status(404).json({ success: false, error: 'Resource not found' })
  if (data.uploaded_by !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Forbidden' })
  }

  const { error } = await supabaseAdmin.from('resources').delete().eq('id', req.params.id)
  if (error) throw error
  res.json({ success: true, message: 'Resource deleted' })
})

export default router
