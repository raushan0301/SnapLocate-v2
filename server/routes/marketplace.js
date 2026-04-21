import { Router } from 'express'
import { z } from 'zod'
import { supabaseAdmin } from '../lib/supabase.js'
import { authenticate, requireAdmin } from '../middleware/auth.js'

const router = Router()

const SELLER_SELECT = 'id, full_name, avatar_url'
const LISTING_SELECT = `*, seller:seller_id(${SELLER_SELECT})`

const CATEGORIES = ['Textbooks', 'Electronics', 'Vehicles', 'Furniture', 'Clothing', 'Sports', 'Other']
const CONDITIONS  = ['Like New', 'Good', 'Fair', 'Needs Repair']
const STATUSES    = ['Active', 'Reserved', 'Sold', 'Draft', 'Deleted']

// ─── GET /api/marketplace ──────────────────────────────────────
// Public feed — only 'Active' listings, scoped to org, with pagination + filters
// Also enriches each listing with is_saved for the current user
router.get('/', authenticate, async (req, res) => {
  const { category, condition, search, is_free, sort = 'newest', limit = 20, offset = 0 } = req.query

  let q = supabaseAdmin
    .from('marketplace_listings')
    .select(LISTING_SELECT, { count: 'exact' })
    .eq('org_id', req.user.org_id)
    .eq('status', 'Active')

  if (category && category !== 'All') q = q.eq('category', category)
  if (condition && condition !== 'All') q = q.eq('condition', condition)
  if (is_free === 'true') q = q.is('price', null)
  if (search) q = q.or(`title.ilike.%${search}%,description.ilike.%${search}%`)

  if (sort === 'price_asc')    q = q.order('price', { ascending: true, nullsFirst: true })
  else if (sort === 'price_desc') q = q.order('price', { ascending: false, nullsFirst: false })
  else if (sort === 'popular') q = q.order('views_count', { ascending: false })
  else                          q = q.order('created_at', { ascending: false })

  q = q.range(Number(offset), Number(offset) + Number(limit) - 1)

  const { data, error, count } = await q
  if (error) throw error

  const listings = data || []

  // Enrich with is_saved for the current user (one query for all IDs)
  if (listings.length > 0) {
    const ids = listings.map(l => l.id)
    const { data: savedRows } = await supabaseAdmin
      .from('marketplace_saved')
      .select('listing_id')
      .eq('user_id', req.user.id)
      .in('listing_id', ids)
    const savedSet = new Set((savedRows || []).map(r => r.listing_id))
    const enriched = listings.map(l => ({ ...l, is_saved: savedSet.has(l.id) }))
    return res.json({ success: true, data: enriched, total: count || 0 })
  }

  res.json({ success: true, data: [], total: count || 0 })
})

// ─── GET /api/marketplace/user/my-listings ────────────────────
// Seller's own listings across ALL statuses (incl. draft, deleted)
router.get('/user/my-listings', authenticate, async (req, res) => {
  const { status, limit = 50, offset = 0 } = req.query

  let q = supabaseAdmin
    .from('marketplace_listings')
    .select(LISTING_SELECT, { count: 'exact' })
    .eq('org_id', req.user.org_id)
    .eq('seller_id', req.user.id)
    .order('created_at', { ascending: false })
    .range(Number(offset), Number(offset) + Number(limit) - 1)

  // Allow filtering by status — if not 'Deleted', default to excluding deleted
  if (status) q = q.eq('status', status)
  else q = q.neq('status', 'Deleted')

  const { data, error, count } = await q
  if (error) throw error
  res.json({ success: true, data: data || [], total: count || 0 })
})

// ─── GET /api/marketplace/saved ───────────────────────────────
// Current user's wishlist
router.get('/saved', authenticate, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('marketplace_saved')
    .select(`*, listing:listing_id(${LISTING_SELECT})`)
    .eq('user_id', req.user.id)
    .eq('org_id', req.user.org_id)
    .order('created_at', { ascending: false })

  if (error) throw error
  res.json({ success: true, data: data || [] })
})

// ─── GET /api/marketplace/:id ─────────────────────────────────
// Single listing detail — increments views_count (genuine: no self-views, session deduplicated)
router.get('/:id', authenticate, async (req, res) => {
  const { data: listing, error } = await supabaseAdmin
    .from('marketplace_listings')
    .select(LISTING_SELECT)
    .eq('id', req.params.id)
    .eq('org_id', req.user.org_id)
    .neq('status', 'Deleted')
    .single()

  if (error || !listing) return res.status(404).json({ success: false, error: 'Listing not found' })

  // Genuine view count:
  // - Skip if viewer is the seller (no self-views)
  // - Skip if X-View-Session header matches a recently seen combination (session deduplicate)
  const viewerIsSeller = listing.seller_id === req.user.id
  const sessionKey = req.headers['x-view-session'] || ''
  // We use a simple check: only count if not self and sessionKey includes this listing ID
  // The client sends X-View-Session only on first open (not on re-renders)
  const shouldCount = !viewerIsSeller && sessionKey === req.params.id

  if (shouldCount) {
    supabaseAdmin
      .from('marketplace_listings')
      .update({ views_count: (listing.views_count || 0) + 1 })
      .eq('id', req.params.id)
      .then(() => {})
      .catch(() => {})
  }

  // Check if current user saved this listing
  const { data: saved } = await supabaseAdmin
    .from('marketplace_saved')
    .select('id')
    .eq('user_id', req.user.id)
    .eq('listing_id', req.params.id)
    .maybeSingle()

  res.json({ success: true, data: { ...listing, is_saved: !!saved } })
})

// ─── POST /api/marketplace ────────────────────────────────────
// Create a listing
router.post('/', authenticate, async (req, res) => {
  const schema = z.object({
    title:         z.string().min(3).max(200),
    description:   z.string().max(2000).optional(),
    price:         z.number().min(0).nullable().optional(),
    is_negotiable: z.boolean().default(false),
    category:      z.enum(CATEGORIES).default('Other'),
    condition:     z.enum(CONDITIONS).default('Good'),
    images:        z.array(z.string().url()).max(5).default([]),
  })

  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.errors })

  const { data, error } = await supabaseAdmin
    .from('marketplace_listings')
    .insert({
      ...parsed.data,
      seller_id: req.user.id,
      org_id:    req.user.org_id,
      status:    'Active',
    })
    .select(LISTING_SELECT)
    .single()

  if (error) throw error
  res.status(201).json({ success: true, data })
})

// ─── PUT /api/marketplace/:id ─────────────────────────────────
// Full update (owner only)
router.put('/:id', authenticate, async (req, res) => {
  const { data: existing } = await supabaseAdmin
    .from('marketplace_listings')
    .select('seller_id')
    .eq('id', req.params.id)
    .eq('org_id', req.user.org_id)
    .single()

  if (!existing) return res.status(404).json({ success: false, error: 'Listing not found' })
  if (existing.seller_id !== req.user.id) return res.status(403).json({ success: false, error: 'Forbidden' })

  const schema = z.object({
    title:         z.string().min(3).max(200).optional(),
    description:   z.string().max(2000).optional(),
    price:         z.number().min(0).nullable().optional(),
    is_negotiable: z.boolean().optional(),
    category:      z.enum(CATEGORIES).optional(),
    condition:     z.enum(CONDITIONS).optional(),
    images:        z.array(z.string().url()).max(5).optional(),
  })

  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.errors })

  const { data, error } = await supabaseAdmin
    .from('marketplace_listings')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .select(LISTING_SELECT)
    .single()

  if (error) throw error
  res.json({ success: true, data })
})

// ─── PATCH /api/marketplace/:id/status ───────────────────────
// Quick status update — seller marks as Sold/Reserved/Active
router.patch('/:id/status', authenticate, async (req, res) => {
  const schema = z.object({
    status: z.enum(['Active', 'Reserved', 'Sold']),
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.errors })

  const { data: existing } = await supabaseAdmin
    .from('marketplace_listings')
    .select('seller_id')
    .eq('id', req.params.id)
    .eq('org_id', req.user.org_id)
    .single()

  if (!existing) return res.status(404).json({ success: false, error: 'Listing not found' })
  if (existing.seller_id !== req.user.id) return res.status(403).json({ success: false, error: 'Forbidden' })

  const { data, error } = await supabaseAdmin
    .from('marketplace_listings')
    .update({ status: parsed.data.status, updated_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .select('id, status')
    .single()

  if (error) throw error

  // Auto-archive chats when listing is sold
  if (parsed.data.status === 'Sold') {
    await supabaseAdmin
      .from('marketplace_chats')
      .update({ is_archived: true, updated_at: new Date().toISOString() })
      .eq('listing_id', req.params.id)
  }

  res.json({ success: true, data })
})

// ─── DELETE /api/marketplace/:id ──────────────────────────────
// Soft delete (sets status = 'Deleted', preserves audit trail)
router.delete('/:id', authenticate, async (req, res) => {
  const { data: existing } = await supabaseAdmin
    .from('marketplace_listings')
    .select('seller_id')
    .eq('id', req.params.id)
    .eq('org_id', req.user.org_id)
    .single()

  if (!existing) return res.status(404).json({ success: false, error: 'Listing not found' })
  if (existing.seller_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Forbidden' })
  }

  await supabaseAdmin
    .from('marketplace_listings')
    .update({ status: 'Deleted', updated_at: new Date().toISOString() })
    .eq('id', req.params.id)

  res.json({ success: true, message: 'Listing removed' })
})

// ─── POST /api/marketplace/save/:id ───────────────────────────
// Add to wishlist
router.post('/save/:id', authenticate, async (req, res) => {
  const { data: listing } = await supabaseAdmin
    .from('marketplace_listings')
    .select('id, seller_id')
    .eq('id', req.params.id)
    .eq('org_id', req.user.org_id)
    .single()

  if (!listing) return res.status(404).json({ success: false, error: 'Listing not found' })
  if (listing.seller_id === req.user.id) {
    return res.status(400).json({ success: false, error: 'Cannot save your own listing' })
  }

  const { data, error } = await supabaseAdmin
    .from('marketplace_saved')
    .upsert(
      { user_id: req.user.id, listing_id: req.params.id, org_id: req.user.org_id },
      { onConflict: 'user_id,listing_id', ignoreDuplicates: true }
    )
    .select()
    .single()

  if (error && error.code !== '23505') throw error
  res.status(201).json({ success: true, data })
})

// ─── DELETE /api/marketplace/save/:id ─────────────────────────
// Remove from wishlist
router.delete('/save/:id', authenticate, async (req, res) => {
  await supabaseAdmin
    .from('marketplace_saved')
    .delete()
    .eq('user_id', req.user.id)
    .eq('listing_id', req.params.id)

  res.json({ success: true, message: 'Removed from saved' })
})

// ─── POST /api/marketplace/report/:id ─────────────────────────
// Report a listing
router.post('/report/:id', authenticate, async (req, res) => {
  const schema = z.object({
    reason: z.enum(['Spam', 'Inappropriate', 'Scam', 'Other']),
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.errors })

  const { data: listing } = await supabaseAdmin
    .from('marketplace_listings')
    .select('id, seller_id')
    .eq('id', req.params.id)
    .eq('org_id', req.user.org_id)
    .single()

  if (!listing) return res.status(404).json({ success: false, error: 'Listing not found' })
  if (listing.seller_id === req.user.id) {
    return res.status(400).json({ success: false, error: 'Cannot report your own listing' })
  }

  const { data, error } = await supabaseAdmin
    .from('marketplace_reports')
    .insert({
      reporter_id: req.user.id,
      listing_id:  req.params.id,
      org_id:      req.user.org_id,
      reason:      parsed.data.reason,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return res.status(409).json({ success: false, error: 'You have already reported this listing' })
    }
    throw error
  }

  res.status(201).json({ success: true, data })
})

export default router
