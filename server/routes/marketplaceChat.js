import { Router } from 'express'
import { z } from 'zod'
import { supabaseAdmin } from '../lib/supabase.js'
import { authenticate } from '../middleware/auth.js'
import { createNotification } from '../lib/notifications.js'

const router = Router()

const USER_SELECT = 'id, full_name, avatar_url'
const LISTING_SELECT = 'id, title, price, images, status, category'

// ─── POST /api/marketplace-chat/chats/initiate ────────────────
// Create or retrieve an existing chat between buyer and seller for a listing
router.post('/chats/initiate', authenticate, async (req, res) => {
  const schema = z.object({ listing_id: z.string().uuid() })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.errors })

  const { listing_id } = parsed.data
  const buyer_id = req.user.id

  // Verify listing belongs to same org and is not deleted
  const { data: listing } = await supabaseAdmin
    .from('marketplace_listings')
    .select('id, seller_id, title, status, org_id')
    .eq('id', listing_id)
    .eq('org_id', req.user.org_id)
    .neq('status', 'Deleted')
    .single()

  if (!listing) return res.status(404).json({ success: false, error: 'Listing not found' })
  if (listing.seller_id === buyer_id) {
    return res.status(400).json({ success: false, error: 'Cannot chat on your own listing' })
  }

  const seller_id = listing.seller_id

  // Upsert chat (unique on buyer_id + listing_id)
  const { data: chat, error } = await supabaseAdmin
    .from('marketplace_chats')
    .upsert(
      {
        listing_id,
        buyer_id,
        seller_id,
        org_id: req.user.org_id,
        last_message_at: new Date().toISOString(),
      },
      { onConflict: 'buyer_id,listing_id', ignoreDuplicates: false }
    )
    .select(`
      *,
      listing:listing_id(${LISTING_SELECT}),
      buyer:buyer_id(${USER_SELECT}),
      seller:seller_id(${USER_SELECT})
    `)
    .single()

  if (error) throw error
  res.json({ success: true, data: chat })
})

// ─── GET /api/marketplace-chat/chats ──────────────────────────
// User's chat inbox — sorted by last_message_at DESC, with unread counts
router.get('/chats', authenticate, async (req, res) => {
  const me = req.user.id
  const archived = req.query.archived === 'true'

  const [asBuyer, asSeller] = await Promise.all([
    supabaseAdmin
      .from('marketplace_chats')
      .select(`*, listing:listing_id(${LISTING_SELECT}), buyer:buyer_id(${USER_SELECT}), seller:seller_id(${USER_SELECT})`)
      .eq('buyer_id', me)
      .eq('org_id', req.user.org_id)
      .eq('is_archived', archived)
      .order('last_message_at', { ascending: false }),
    supabaseAdmin
      .from('marketplace_chats')
      .select(`*, listing:listing_id(${LISTING_SELECT}), buyer:buyer_id(${USER_SELECT}), seller:seller_id(${USER_SELECT})`)
      .eq('seller_id', me)
      .eq('org_id', req.user.org_id)
      .eq('is_archived', archived)
      .order('last_message_at', { ascending: false }),
  ])

  const all = [...(asBuyer.data || []), ...(asSeller.data || [])]
  all.sort((a, b) => new Date(b.last_message_at) - new Date(a.last_message_at))

  // Remove duplicate chat IDs (shouldn't happen but be safe)
  const seen = new Set()
  const unique = all.filter(c => { if (seen.has(c.id)) return false; seen.add(c.id); return true })

  // Attach per-chat unread counts
  const chatIds = unique.map(c => c.id)
  let unreadMap = {}
  if (chatIds.length > 0) {
    const { data: unread } = await supabaseAdmin
      .from('marketplace_messages')
      .select('chat_id')
      .in('chat_id', chatIds)
      .eq('is_read', false)
      .neq('sender_id', me)

    ;(unread || []).forEach(m => {
      unreadMap[m.chat_id] = (unreadMap[m.chat_id] || 0) + 1
    })
  }

  const enriched = unique.map(c => ({ ...c, unread_count: unreadMap[c.id] || 0 }))
  res.json({ success: true, data: enriched })
})

// ─── GET /api/marketplace-chat/chats/:chatId/messages ─────────
// Paginated message history oldest-first, with auto-mark-as-read
router.get('/chats/:chatId/messages', authenticate, async (req, res) => {
  const me = req.user.id
  const { chatId } = req.params
  const limit  = Math.min(parseInt(req.query.limit) || 50, 100)
  const before = req.query.before // ISO timestamp cursor

  // Verify participant + org
  const { data: chat } = await supabaseAdmin
    .from('marketplace_chats')
    .select('buyer_id, seller_id, org_id')
    .eq('id', chatId)
    .single()

  if (!chat) return res.status(404).json({ success: false, error: 'Chat not found' })
  if (chat.org_id !== req.user.org_id) return res.status(403).json({ success: false, error: 'Forbidden' })
  if (chat.buyer_id !== me && chat.seller_id !== me) {
    return res.status(403).json({ success: false, error: 'Not a participant' })
  }

  let q = supabaseAdmin
    .from('marketplace_messages')
    .select(`*, sender:sender_id(${USER_SELECT})`)
    .eq('chat_id', chatId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (before) q = q.lt('created_at', before)

  const { data, error } = await q
  if (error) throw error

  // Mark other party's messages as read (non-blocking)
  supabaseAdmin
    .from('marketplace_messages')
    .update({ is_read: true })
    .eq('chat_id', chatId)
    .eq('is_read', false)
    .neq('sender_id', me)
    .then(() => {})
    .catch(() => {})

  res.json({ success: true, data: (data || []).reverse() }) // oldest first
})

// ─── POST /api/marketplace-chat/chats/:chatId/messages ────────
// Send a message
router.post('/chats/:chatId/messages', authenticate, async (req, res) => {
  const schema = z.object({ content: z.string().min(1).max(1000).trim() })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.errors })

  const me = req.user.id
  const { chatId } = req.params

  // Verify participant + org
  const { data: chat } = await supabaseAdmin
    .from('marketplace_chats')
    .select('buyer_id, seller_id, org_id, is_archived')
    .eq('id', chatId)
    .single()

  if (!chat) return res.status(404).json({ success: false, error: 'Chat not found' })
  if (chat.org_id !== req.user.org_id) return res.status(403).json({ success: false, error: 'Forbidden' })
  if (chat.buyer_id !== me && chat.seller_id !== me) {
    return res.status(403).json({ success: false, error: 'Not a participant' })
  }
  if (chat.is_archived) {
    return res.status(400).json({ success: false, error: 'This chat is archived (listing is sold)' })
  }

  const { data: msg, error } = await supabaseAdmin
    .from('marketplace_messages')
    .insert({
      chat_id:   chatId,
      sender_id: me,
      org_id:    req.user.org_id,
      content:   parsed.data.content,
    })
    .select(`*, sender:sender_id(${USER_SELECT})`)
    .single()

  if (error) throw error

  // Update last_message_at + updated_at on the chat
  await supabaseAdmin
    .from('marketplace_chats')
    .update({ last_message_at: msg.created_at, updated_at: msg.created_at })
    .eq('id', chatId)

  // Notify the other user
  const otherUserId = chat.buyer_id === me ? chat.seller_id : chat.buyer_id
  createNotification(
    otherUserId,
    `Marketplace: New message from ${msg.sender?.full_name || 'someone'}`,
    msg.content.slice(0, 60) + (msg.content.length > 60 ? '...' : ''),
    '/marketplace'
  )

  res.status(201).json({ success: true, data: msg })
})

// ─── PATCH /api/marketplace-chat/chats/:chatId/read ───────────
// Mark all messages in this chat as read for current user
router.patch('/chats/:chatId/read', authenticate, async (req, res) => {
  const me = req.user.id
  const { chatId } = req.params

  // Verify participant
  const { data: chat } = await supabaseAdmin
    .from('marketplace_chats')
    .select('buyer_id, seller_id, org_id')
    .eq('id', chatId)
    .single()

  if (!chat) return res.status(404).json({ success: false, error: 'Chat not found' })
  if (chat.org_id !== req.user.org_id) return res.status(403).json({ success: false, error: 'Forbidden' })
  if (chat.buyer_id !== me && chat.seller_id !== me) {
    return res.status(403).json({ success: false, error: 'Not a participant' })
  }

  await supabaseAdmin
    .from('marketplace_messages')
    .update({ is_read: true })
    .eq('chat_id', chatId)
    .eq('is_read', false)
    .neq('sender_id', me)

  res.json({ success: true })
})

// ─── PATCH /api/marketplace-chat/chats/:chatId/archive ───────────
// Toggle archive status
router.patch('/chats/:chatId/archive', authenticate, async (req, res) => {
  const me = req.user.id
  const { chatId } = req.params
  const { is_archived } = req.body

  // Verify participant
  const { data: chat } = await supabaseAdmin
    .from('marketplace_chats')
    .select('buyer_id, seller_id, org_id')
    .eq('id', chatId)
    .single()

  if (!chat) return res.status(404).json({ success: false, error: 'Chat not found' })
  if (chat.org_id !== req.user.org_id) return res.status(403).json({ success: false, error: 'Forbidden' })
  if (chat.buyer_id !== me && chat.seller_id !== me) {
    return res.status(403).json({ success: false, error: 'Not a participant' })
  }

  const { error } = await supabaseAdmin
    .from('marketplace_chats')
    .update({ is_archived: !!is_archived })
    .eq('id', chatId)

  if (error) throw error
  res.json({ success: true })
})

export default router
