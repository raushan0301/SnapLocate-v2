import { Router } from 'express'
import { sendEmail } from '../lib/ses.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

// ─── POST /api/notify/email ──────────────────────────────────
// Internal — send a custom email (admin only)
router.post('/email', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' })

  const { to, subject, html, text } = req.body
  if (!to || !subject || !html) {
    return res.status(400).json({ success: false, message: 'to, subject, html are required' })
  }

  await sendEmail({ to, subject, html, text })
  res.json({ success: true, message: 'Email sent' })
})

export default router
