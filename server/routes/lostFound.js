import { Router } from 'express'
import { z } from 'zod'
import { supabaseAdmin } from '../lib/supabase.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

const ITEM_SELECT = `*, reporter:reporter_id(id, full_name, avatar_url, role)`
const CATEGORIES  = ['electronics','keys','id_card','clothing','books','bag','wallet','jewellery','sports','other']

// ─── GET /api/lost-found ─────────────────────────────────────
router.get('/', authenticate, async (req, res) => {
  const { status, category, search } = req.query

  let query = supabaseAdmin
    .from('lost_found')
    .select(ITEM_SELECT)
    .order('created_at', { ascending: false })
  if (req.user.org_id) query = query.eq('org_id', req.user.org_id)

  if (status && status !== 'all')     query = query.eq('status', status)
  if (category && category !== 'all') query = query.eq('category', category)
  if (search) query = query.or(
    `title.ilike.%${search}%,location.ilike.%${search}%,description.ilike.%${search}%`
  )

  const { data, error } = await query
  if (error) throw error
  res.json({ success: true, data })
})

// ─── GET /api/lost-found/my ──────────────────────────────────
// Own posts + their incoming claims
router.get('/my', authenticate, async (req, res) => {
  const { data: items, error } = await supabaseAdmin
    .from('lost_found')
    .select(ITEM_SELECT)
    .eq('org_id', req.user.org_id)
    .eq('reporter_id', req.user.id)
    .order('created_at', { ascending: false })

  if (error) throw error

  const itemIds = (items || []).map(i => i.id)
  let claims = []
  if (itemIds.length > 0) {
    const { data: claimsData } = await supabaseAdmin
      .from('lost_found_claims')
      .select(`*, claimer:claimer_id(id, full_name, avatar_url, role)`)
      .in('item_id', itemIds)
      .order('created_at', { ascending: false })
    claims = claimsData || []
  }

  const itemsWithClaims = (items || []).map(item => ({
    ...item,
    claims: claims.filter(c => c.item_id === item.id),
  }))

  res.json({ success: true, data: itemsWithClaims })
})

// ─── GET /api/lost-found/my-claims ──────────────────────────
// Items where the current user has submitted a claim
router.get('/my-claims', authenticate, async (req, res) => {
  // Get all claims by this user
  const { data: myClaims, error: claimsErr } = await supabaseAdmin
    .from('lost_found_claims')
    .select('*, item:item_id(' + `id, title, description, status, category, location, date, image_url, contact_info, created_at, org_id, reporter:reporter_id(id, full_name, avatar_url, role)` + ')')
    .eq('claimer_id', req.user.id)
    .order('created_at', { ascending: false })

  if (claimsErr) throw claimsErr

  // Filter to org claims only (safety)
  const filtered = (myClaims || []).filter(c => {
    if (!req.user.org_id) return true
    return c.item?.org_id === req.user.org_id
  })

  res.json({ success: true, data: filtered })
})

// ─── GET /api/lost-found/:id ─────────────────────────────────
router.get('/:id', authenticate, async (req, res) => {
  const { data: item, error } = await supabaseAdmin
    .from('lost_found')
    .select(ITEM_SELECT)
    .eq('id', req.params.id)
    .eq('org_id', req.user.org_id)
    .single()

  if (error || !item) return res.status(404).json({ success: false, error: 'Item not found' })

  const { data: claims } = await supabaseAdmin
    .from('lost_found_claims')
    .select(`*, claimer:claimer_id(id, full_name, avatar_url, role)`)
    .eq('item_id', req.params.id)
    .order('created_at', { ascending: false })

  res.json({ success: true, data: { ...item, claims: claims || [] } })
})

// ─── POST /api/lost-found ────────────────────────────────────
router.post('/', authenticate, async (req, res) => {
  const schema = z.object({
    title:        z.string().min(1).max(200),
    description:  z.string().max(1000).optional(),
    image_url:    z.string().url().optional(),
    status:       z.enum(['lost', 'found']),
    category:     z.enum(CATEGORIES).default('other'),
    location:     z.string().max(200).optional(),
    contact_info: z.string().max(200).optional(),
    date:         z.string().optional(),
  })

  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.errors })

  const { data, error } = await supabaseAdmin
    .from('lost_found')
    .insert({ ...parsed.data, reporter_id: req.user.id, org_id: req.user.org_id })
    .select(ITEM_SELECT)
    .single()

  if (error) throw error
  res.status(201).json({ success: true, data })
})

// ─── PATCH /api/lost-found/:id ───────────────────────────────
router.patch('/:id', authenticate, async (req, res) => {
  const schema = z.object({
    title:        z.string().min(1).max(200).optional(),
    description:  z.string().max(1000).optional(),
    image_url:    z.string().url().optional().nullable(),
    status:       z.enum(['lost', 'found', 'resolved']).optional(),
    category:     z.enum(CATEGORIES).optional(),
    location:     z.string().max(200).optional(),
    contact_info: z.string().max(200).optional(),
    date:         z.string().optional(),
  })

  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.errors })

  const { data: existing } = await supabaseAdmin
    .from('lost_found').select('reporter_id').eq('id', req.params.id).eq('org_id', req.user.org_id).single()
  if (!existing) return res.status(404).json({ success: false, error: 'Not found' })
  if (existing.reporter_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Forbidden' })
  }

  const updates = { ...parsed.data }
  if (updates.status === 'resolved') {
    updates.resolved_at = new Date().toISOString()
    updates.resolved_by = req.user.id
  }

  const { data, error } = await supabaseAdmin
    .from('lost_found').update(updates).eq('id', req.params.id).select(ITEM_SELECT).single()
  if (error) throw error
  res.json({ success: true, data })
})

// ─── PATCH /api/lost-found/:id/resolve ──────────────────────
router.patch('/:id/resolve', authenticate, async (req, res) => {
  const { data: existing } = await supabaseAdmin
    .from('lost_found').select('reporter_id').eq('id', req.params.id).eq('org_id', req.user.org_id).single()
  if (!existing) return res.status(404).json({ success: false, error: 'Not found' })
  if (existing.reporter_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Forbidden' })
  }

  const { data, error } = await supabaseAdmin
    .from('lost_found')
    .update({ status: 'resolved', resolved_at: new Date().toISOString(), resolved_by: req.user.id })
    .eq('id', req.params.id).select().single()
  if (error) throw error
  res.json({ success: true, data })
})

// ─── DELETE /api/lost-found/:id ──────────────────────────────
router.delete('/:id', authenticate, async (req, res) => {
  const { data: existing } = await supabaseAdmin
    .from('lost_found').select('reporter_id').eq('id', req.params.id).eq('org_id', req.user.org_id).single()
  if (!existing) return res.status(404).json({ success: false, error: 'Not found' })
  if (existing.reporter_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Forbidden' })
  }

  const { error } = await supabaseAdmin.from('lost_found').delete().eq('id', req.params.id)
  if (error) throw error
  res.json({ success: true, message: 'Post deleted' })
})

// ─── POST /api/lost-found/:id/claim ─────────────────────────
router.post('/:id/claim', authenticate, async (req, res) => {
  const schema = z.object({
    message:   z.string().min(20, 'Please describe why this is yours (min 20 characters)').max(1000),
    proof_url: z.string().url().optional(),
  })

  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.errors })

  const { data: item } = await supabaseAdmin
    .from('lost_found').select('reporter_id, status').eq('id', req.params.id).eq('org_id', req.user.org_id).single()
  if (!item) return res.status(404).json({ success: false, error: 'Item not found' })
  if (item.status === 'resolved') return res.status(400).json({ success: false, error: 'This item is already resolved' })
  if (item.reporter_id === req.user.id) return res.status(400).json({ success: false, error: 'You cannot claim your own post' })

  const { data, error } = await supabaseAdmin
    .from('lost_found_claims')
    .insert({ item_id: req.params.id, claimer_id: req.user.id, message: parsed.data.message, proof_url: parsed.data.proof_url || null })
    .select(`*, claimer:claimer_id(id, full_name, avatar_url, role)`)
    .single()

  if (error) {
    if (error.code === '23505') return res.status(409).json({ success: false, error: 'You have already submitted a claim for this item' })
    throw error
  }
  res.status(201).json({ success: true, data })
})

// ─── PATCH /api/lost-found/:id/claim/:claimId ───────────────
// Reporter approves or rejects a claim
router.patch('/:id/claim/:claimId', authenticate, async (req, res) => {
  const schema = z.object({
    action:     z.enum(['approve', 'reject']),
    admin_note: z.string().max(500).optional(),
  })

  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.errors })

  const { data: item } = await supabaseAdmin
    .from('lost_found').select('reporter_id').eq('id', req.params.id).eq('org_id', req.user.org_id).single()
  if (!item) return res.status(404).json({ success: false, error: 'Item not found' })
  if (item.reporter_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Only the reporter or admin can action claims' })
  }

  const newStatus = parsed.data.action === 'approve' ? 'approved' : 'rejected'

  const { data: claim, error } = await supabaseAdmin
    .from('lost_found_claims')
    .update({ status: newStatus, admin_note: parsed.data.admin_note || null })
    .eq('id', req.params.claimId)
    .eq('item_id', req.params.id)
    .select().single()
  if (error) throw error

  // Approving → auto-resolve item + reject all other pending claims
  if (parsed.data.action === 'approve') {
    await supabaseAdmin
      .from('lost_found')
      .update({ status: 'resolved', resolved_at: new Date().toISOString(), resolved_by: req.user.id })
      .eq('id', req.params.id)

    await supabaseAdmin
      .from('lost_found_claims')
      .update({ status: 'rejected', admin_note: 'Another claim was approved.' })
      .eq('item_id', req.params.id)
      .eq('status', 'pending')
      .neq('id', req.params.claimId)
  }

  res.json({ success: true, data: claim })
})

// ─── DELETE /api/lost-found/:id/claim/:claimId ──────────────
// Claimer withdraws their own pending claim
router.delete('/:id/claim/:claimId', authenticate, async (req, res) => {
  const { data: claim } = await supabaseAdmin
    .from('lost_found_claims')
    .select('claimer_id, status')
    .eq('id', req.params.claimId)
    .eq('item_id', req.params.id)
    .single()

  if (!claim) return res.status(404).json({ success: false, error: 'Claim not found' })
  if (claim.claimer_id !== req.user.id) return res.status(403).json({ success: false, error: 'Forbidden' })
  if (claim.status !== 'pending') return res.status(400).json({ success: false, error: 'Cannot withdraw an already-actioned claim' })

  await supabaseAdmin.from('lost_found_claims').delete().eq('id', req.params.claimId)
  res.json({ success: true, message: 'Claim withdrawn' })
})

export default router
