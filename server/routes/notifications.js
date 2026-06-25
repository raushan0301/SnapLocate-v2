import { Router } from 'express'
import { supabaseAdmin } from '../lib/supabase.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

// GET /api/notifications — current user's last 30 notifications
router.get('/', authenticate, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('notifications')
    .select('*')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false })
    .limit(30)

  if (error) throw error
  res.json({ success: true, data: data || [] })
})

// PATCH /api/notifications/read-all — mark all unread as read
// Must be defined BEFORE /:id/read so it's not swallowed as an id route
router.patch('/read-all', authenticate, async (req, res) => {
  const { error } = await supabaseAdmin
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', req.user.id)
    .eq('is_read', false)

  if (error) throw error
  res.json({ success: true })
})

// PATCH /api/notifications/:id/read — mark one notification as read
router.patch('/:id/read', authenticate, async (req, res) => {
  const { error } = await supabaseAdmin
    .from('notifications')
    .update({ is_read: true })
    .eq('id', req.params.id)
    .eq('user_id', req.user.id) // prevent reading another user's notification

  if (error) throw error
  res.json({ success: true })
})

// DELETE /api/notifications/:id — delete a notification
router.delete('/:id', authenticate, async (req, res) => {
  const { error } = await supabaseAdmin
    .from('notifications')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', req.user.id) // Ensure users can only delete their own
  
  if (error) throw error
  res.json({ success: true })
})

export default router
