import { Router } from 'express'
import { z } from 'zod'
import { supabaseAdmin } from '../lib/supabase.js'
import { authenticate } from '../middleware/auth.js'
import { createNotification } from '../lib/notifications.js'

const router = Router()

const ITEM_SELECT = `*, reporter:reporter_id(id, full_name, avatar_url, role)`
const CATEGORIES = ['electronics', 'keys', 'id_card', 'clothing', 'books', 'bag', 'wallet', 'jewellery', 'sports', 'other']


// ─── GET /api/lost-found ─────────────────────────────────────
router.get('/', authenticate, async (req, res) => {
  const { status, category, search } = req.query

  let query = supabaseAdmin
    .from('lost_found')
    .select(ITEM_SELECT)
    .order('created_at', { ascending: false })
  if (req.user.org_id) query = query.eq('org_id', req.user.org_id)

  if (status && status !== 'all') query = query.eq('status', status)
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

// ─── POST /api/lost-found/email-ingest ──────────────────────
// Called by the Google Apps Script running in rraj_be23@thapar.edu.
// The script polls Gmail every 5 min and POSTs email data here.
// No user auth needed — secured by WEBHOOK_SECRET only.
router.post('/email-ingest', async (req, res) => {
  // Validate webhook secret
  const secret = process.env.WEBHOOK_SECRET
  if (!secret || req.body.secret !== secret) {
    return res.status(401).json({ success: false, error: 'Invalid webhook secret.' })
  }

  const { from = '', subject = '', body = '' } = req.body

  // Extract sender email
  const senderEmail = from.replace(/.*<(.+)>/, '$1').trim().toLowerCase() || from.toLowerCase().trim()

  // Validate sender is whitelisted
  const whitelist = (process.env.GMAIL_SENDER_WHITELIST || 'adminofficer@thapar.edu')
    .split(',').map(e => e.trim().toLowerCase())
  if (!whitelist.includes(senderEmail)) {
    return res.status(403).json({ success: false, error: `Sender ${senderEmail} not in whitelist.` })
  }

  // ── Lost & Found relevance check ──────────────────────────────────────────
  // Only process emails that are genuinely about lost or found items.
  // Non-L&F emails (notices, circulars, road closures etc.) are skipped.
  const lostFoundKeywords = /\b(lost|found|missing|item|keys?|wallet|phone|laptop|mobile|bag|earring|airpods|jewel|id card|belongings|article|object|recover|claim)\b/i
  if (!lostFoundKeywords.test(subject)) {
    console.log(`[Email Ingest] Skipping non-L&F email: "${subject}"`)
    return res.json({ success: true, skipped: true, message: 'Not a Lost & Found email — skipped.' })
  }

  // Smart parser (handles structured + free-form emails)
  function inferCat(text) {
    const t = text.toLowerCase()
    if (/phone|mobile|laptop|tablet|earbuds|headphone|airpods|charger|cable|keyboard|mouse|camera|ipad/.test(t)) return 'electronics'
    if (/\bkeys?\b|keychain/.test(t)) return 'keys'
    if (/id[\s-]?card|identity[\s]?card|student[\s]?id|admit[\s]?card|aadhar|pan[\s]?card/.test(t)) return 'id_card'
    if (/shirt|jacket|jeans|hoodie|sweater|coat|shoes|sandal|cap|\bhat\b|scarf|dress|t-shirt|tshirt/.test(t)) return 'clothing'
    if (/\bbook\b|notebook|textbook|\bnotes\b|register/.test(t)) return 'books'
    if (/\bbag\b|backpack|luggage|handbag/.test(t)) return 'bag'
    if (/wallet/.test(t)) return 'wallet'
    if (/ring|necklace|bracelet|\bwatch\b|chain|earring|jewel/.test(t)) return 'jewellery'
    if (/\bball\b|racket|\bbat\b|jersey|\bkit\b|sports/.test(t)) return 'sports'
    return 'other'
  }

  function fieldGet(labels, text) {
    for (const label of labels) {
      const m = text.match(new RegExp(`${label}\\s*[:：]\\s*([^\\n]{1,200})`, 'i'))
      if (m) return m[1].trim()
    }
    return null
  }

  // Determine status from subject
  let status = 'found'
  if (/\blost\b/i.test(subject) && !/\bfound\b/i.test(subject)) status = 'lost'

  // Extract fields — structured first, free-form fallback
  let title = fieldGet(['item name', 'item', 'object', 'article', 'lost item', 'found item'], body)
  if (!title) {
    title = subject.replace(/^(lost|found)\s*[-:–—]?\s*/i, '').trim() || subject.trim() || 'Unknown Item'
  }

  let location = fieldGet(['location found', 'location lost', 'location', 'place', 'found at', 'found near'], body)
  if (!location) {
    const m = body.match(/(?:near|at|in|found\s+(?:at|near|in))\s+([^\n.!?,]{3,60})/i)
    if (m) location = m[1].trim()
  }

  let contact_info = fieldGet(['contact number', 'contact no', 'contact', 'phone', 'mobile', 'whatsapp'], body)
  if (!contact_info) {
    const m = body.match(/\b(\+?91[-\s]?)?[6-9]\d{9}\b/)
    if (m) contact_info = m[0].trim()
  }

  let description = fieldGet(['description', 'details', 'desc'], body)
  if (!description) description = body.trim().slice(0, 1000) || null

  let parsedDate = null
  const dateRaw = fieldGet(['date found', 'date lost', 'date', 'found on', 'lost on'], body)
  if (dateRaw) { const d = new Date(dateRaw); if (!isNaN(d)) parsedDate = d.toISOString().split('T')[0] }
  if (!parsedDate) parsedDate = new Date().toISOString().split('T')[0]

  const listing = {
    title: title.slice(0, 200),
    description,
    status,
    category: inferCat(`${title} ${description || ''} ${subject}`),
    location:     location    ? location.slice(0, 200) : null,
    contact_info: contact_info ? contact_info.slice(0, 200) : null,
    date: parsedDate,
  }

  // Duplicate check — same title in last 24h
  const { data: dup } = await supabaseAdmin
    .from('lost_found').select('id').ilike('title', listing.title)
    .gte('created_at', new Date(Date.now() - 86400000).toISOString()).limit(1)
  if (dup?.length) {
    return res.json({ success: true, message: 'Duplicate — listing already exists', duplicate: true })
  }

  // Use first admin user as reporter
  const { data: adminUser } = await supabaseAdmin
    .from('users').select('id, org_id').eq('role', 'admin')
    .order('created_at', { ascending: true }).limit(1).single()

  if (!adminUser) {
    return res.status(503).json({ success: false, error: 'No admin user found in database.' })
  }

  const { data: item, error: insertErr } = await supabaseAdmin
    .from('lost_found')
    .insert({ ...listing, reporter_id: adminUser.id, org_id: adminUser.org_id })
    .select(ITEM_SELECT).single()

  if (insertErr) {
    console.error('[Email Ingest] DB error:', insertErr.message)
    return res.status(500).json({ success: false, error: 'Failed to create listing.' })
  }

  // Campus notifications
  try {
    const { data: members } = await supabaseAdmin
      .from('users').select('id').eq('org_id', adminUser.org_id).neq('id', adminUser.id)
    if (members?.length) {
      const label = item.status === 'found' ? '🟢 Found' : '🔴 Lost'
      await supabaseAdmin.from('notifications').insert(
        members.map(m => ({
          user_id: m.id,
          title: `${label}: ${item.title}`,
          message: [item.location ? `📍 ${item.location}` : null, description?.slice(0, 100)].filter(Boolean).join(' · ') || 'New Lost & Found listing.',
          link: '/lost-found',
        }))
      )
    }
  } catch (e) { console.error('[Email Ingest] Notification error:', e.message) }

  // Log to email_logs if table exists
  try {
    await supabaseAdmin.from('email_logs').upsert({
      gmail_message_id: `appsscript_${Date.now()}`,
      sender_email: senderEmail,
      subject,
      status: 'success',
      item_id: item.id,
    }, { onConflict: 'gmail_message_id' })
  } catch { /* table may not exist yet */ }

  console.log(`[Email Ingest] ✅ Created listing: "${item.title}" from ${senderEmail}`)
  return res.status(201).json({ success: true, data: item })
})

// ─── POST /api/lost-found ────────────────────────────────────
router.post('/', authenticate, async (req, res) => {
  const schema = z.object({
    title: z.string().min(1).max(200),
    description: z.string().max(1000).optional(),
    image_url: z.string().url().optional(),
    status: z.enum(['lost', 'found']),
    category: z.enum(CATEGORIES).default('other'),
    location: z.string().max(200).optional(),
    contact_info: z.string().max(200).optional(),
    date: z.string().optional(),
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
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(1000).optional(),
    image_url: z.string().url().optional().nullable(),
    status: z.enum(['lost', 'found', 'resolved']).optional(),
    category: z.enum(CATEGORIES).optional(),
    location: z.string().max(200).optional(),
    contact_info: z.string().max(200).optional(),
    date: z.string().optional(),
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

// ─── PATCH /api/lost-found/:id/unresolve ────────────────────
router.patch('/:id/unresolve', authenticate, async (req, res) => {
  const { data: existing } = await supabaseAdmin
    .from('lost_found').select('*').eq('id', req.params.id).eq('org_id', req.user.org_id).single()
  if (!existing) return res.status(404).json({ success: false, error: 'Not found' })
  if (existing.reporter_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Forbidden' })
  }

  // Restore to original status (we can infer it from fields or use 'lost' as safe default)
  // Since we don't store "previous_status", but resolve implies the item was either lost or found.
  // We can check if image_url exists or other indicators, but usually, we just need to know it's not 'resolved' anymore.
  // Let's assume the user wants it back to its state. If we don't know, 'lost' is the default in the table.
  // Actually, 'lost'/'found' is usually set at creation. Let's just unset resolved.
  // We'll trust the database default or previous value if possible, but actually we need to pick one.
  // A better way: fetch the current status. If it's resolved, we need to know what it WAS.
  // But since we don't store it, we'll try to keep it as 'lost' if it was a lost report.
  // Most items in LostFound have a type.
  const { data, error } = await supabaseAdmin
    .from('lost_found')
    .update({ status: 'lost', resolved_at: null, resolved_by: null }) // Reverting to 'lost' as active
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
    message: z.string().min(20, 'Please describe why this is yours (min 20 characters)').max(1000),
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

  // Notify Reporter about the new claim
  createNotification(
    item.reporter_id,
    `New Claim on "${item.title || 'your item'}"`,
    `Someone submitted a claim. Review it in the Lost & Found section.`,
    '/lost-found'
  )

  res.status(201).json({ success: true, data })
})

// ─── PATCH /api/lost-found/:id/claim/:claimId ───────────────
// Reporter approves or rejects a claim
router.patch('/:id/claim/:claimId', authenticate, async (req, res) => {
  const schema = z.object({
    action: z.enum(['approve', 'reject']),
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

  // Notify the claimer
  const title = parsed.data.action === 'approve' ? 'Claim Approved! 🎉' : 'Claim Rejected'
  const message = parsed.data.action === 'approve' 
    ? `Your claim was approved. Coordinate with the reporter to collect the item.`
    : `Your claim was rejected. Note: ${parsed.data.admin_note || 'No reason provided.'}`
  
  createNotification(claim.claimer_id, title, message, '/lost-found')

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
