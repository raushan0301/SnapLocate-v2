import { Router } from 'express'
import { z } from 'zod'
import { supabaseAdmin } from '../lib/supabase.js'
import { authenticate } from '../middleware/auth.js'
import { createNotification } from '../lib/notifications.js'

const router = Router()

const USER_SELECT = 'id, full_name, avatar_url, role'

// ─── POST /api/lf-chat/conversations
// Start or get existing conversation for an item.
// Body: { item_id, other_user_id }
router.post('/conversations', authenticate, async (req, res) => {
  const schema = z.object({
    item_id:       z.string().uuid(),
    other_user_id: z.string().uuid(),
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.errors })

  const { item_id, other_user_id } = parsed.data
  const me = req.user.id

  if (me === other_user_id) return res.status(400).json({ success: false, error: 'Cannot chat with yourself' })

  // Verify item exists and belongs to org
  const { data: item } = await supabaseAdmin
    .from('lost_found').select('id, title, reporter_id').eq('id', item_id).single()
  if (!item) return res.status(404).json({ success: false, error: 'Item not found' })

  // Ensure one of the two is the reporter
  if (item.reporter_id !== me && item.reporter_id !== other_user_id) {
    return res.status(403).json({ success: false, error: 'At least one participant must be the item reporter' })
  }

  // Canonical order: participant_a = reporter, participant_b = other party
  const pa = item.reporter_id
  const pb = pa === me ? other_user_id : me

  // Upsert conversation
  const { data: conv, error } = await supabaseAdmin
    .from('lf_conversations')
    .upsert(
      { item_id, participant_a: pa, participant_b: pb },
      { onConflict: 'item_id,participant_a,participant_b', ignoreDuplicates: false }
    )
    .select(`
      *,
      item:item_id(id, title, status, category),
      participant_a:participant_a(${USER_SELECT}),
      participant_b:participant_b(${USER_SELECT})
    `)
    .single()

  if (error) throw error
  res.json({ success: true, data: conv })
})

// ─── GET /api/lf-chat/conversations
// List all conversations for the current user.
router.get('/conversations', authenticate, async (req, res) => {
  const me = req.user.id

  const [resA, resB] = await Promise.all([
    supabaseAdmin
      .from('lf_conversations')
      .select(`*, item:item_id(id, title, status, category), participant_a:participant_a(${USER_SELECT}), participant_b:participant_b(${USER_SELECT})`)
      .eq('participant_a', me)
      .order('last_message_at', { ascending: false }),
    supabaseAdmin
      .from('lf_conversations')
      .select(`*, item:item_id(id, title, status, category), participant_a:participant_a(${USER_SELECT}), participant_b:participant_b(${USER_SELECT})`)
      .eq('participant_b', me)
      .order('last_message_at', { ascending: false }),
  ])

  const all = [...(resA.data || []), ...(resB.data || [])]
  all.sort((a, b) => new Date(b.last_message_at) - new Date(a.last_message_at))

  // Attach unread count per conversation
  const ids = all.map(c => c.id)
  let unreadMap = {}
  if (ids.length > 0) {
    const { data: unread } = await supabaseAdmin
      .from('lf_messages')
      .select('conversation_id')
      .in('conversation_id', ids)
      .eq('is_read', false)
      .neq('sender_id', me)
    ;(unread || []).forEach(m => { unreadMap[m.conversation_id] = (unreadMap[m.conversation_id] || 0) + 1 })
  }

  const enriched = all.map(c => ({ ...c, unread_count: unreadMap[c.id] || 0 }))
  res.json({ success: true, data: enriched })
})

// ─── GET /api/lf-chat/conversations/:convId/messages
// Load messages for a conversation (paginated, newest last).
router.get('/conversations/:convId/messages', authenticate, async (req, res) => {
  const me = req.user.id
  const { convId } = req.params
  const limit  = Math.min(parseInt(req.query.limit)  || 50, 100)
  const before = req.query.before  // ISO timestamp for pagination

  // Verify participant
  const { data: conv } = await supabaseAdmin
    .from('lf_conversations').select('participant_a, participant_b').eq('id', convId).single()
  if (!conv) return res.status(404).json({ success: false, error: 'Conversation not found' })
  if (conv.participant_a !== me && conv.participant_b !== me) {
    return res.status(403).json({ success: false, error: 'Not a participant' })
  }

  let q = supabaseAdmin
    .from('lf_messages')
    .select(`*, sender:sender_id(${USER_SELECT})`)
    .eq('conversation_id', convId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (before) q = q.lt('created_at', before)

  const { data, error } = await q
  if (error) throw error

  // Mark as read (messages sent by other party)
  await supabaseAdmin
    .from('lf_messages')
    .update({ is_read: true })
    .eq('conversation_id', convId)
    .eq('is_read', false)
    .neq('sender_id', me)

  res.json({ success: true, data: (data || []).reverse() })  // oldest first
})

// ─── POST /api/lf-chat/conversations/:convId/messages
// Send a message.
router.post('/conversations/:convId/messages', authenticate, async (req, res) => {
  const schema = z.object({ content: z.string().min(1).max(1000).trim() })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.errors })

  const me = req.user.id
  const { convId } = req.params

  // Verify participant
  const { data: conv } = await supabaseAdmin
    .from('lf_conversations').select('participant_a, participant_b, item_id').eq('id', convId).single()
  if (!conv) return res.status(404).json({ success: false, error: 'Conversation not found' })
  if (conv.participant_a !== me && conv.participant_b !== me) {
    return res.status(403).json({ success: false, error: 'Not a participant' })
  }

  const { data: msg, error } = await supabaseAdmin
    .from('lf_messages')
    .insert({ conversation_id: convId, sender_id: me, content: parsed.data.content })
    .select(`*, sender:sender_id(${USER_SELECT})`)
    .single()

  if (error) throw error

  // Update last_message_at on conversation
  await supabaseAdmin
    .from('lf_conversations')
    .update({ last_message_at: msg.created_at })
    .eq('id', convId)

  const otherUserId = conv.participant_a === me ? conv.participant_b : conv.participant_a
  createNotification(
    otherUserId,
    `New message from ${msg.sender?.full_name || 'someone'}`,
    msg.content.slice(0, 60) + (msg.content.length > 60 ? '...' : ''),
    '/lost-found'
  )

  res.status(201).json({ success: true, data: msg })
})

// ─── PATCH /api/lf-chat/conversations/:convId/read
// Mark all messages in conversation as read for current user.
router.patch('/conversations/:convId/read', authenticate, async (req, res) => {
  const me = req.user.id
  await supabaseAdmin
    .from('lf_messages')
    .update({ is_read: true })
    .eq('conversation_id', req.params.convId)
    .eq('is_read', false)
    .neq('sender_id', me)
  res.json({ success: true })
})

export default router
