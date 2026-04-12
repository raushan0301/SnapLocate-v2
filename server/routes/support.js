import { Router } from 'express'
import { supabaseAdmin } from '../lib/supabase.js'
import { authenticate, requireAdmin } from '../middleware/auth.js'

const router = Router()

// ─── CAMPUS SUPPORT CONTACTS (existing) ────────────────────────

router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('campus_support')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    const groups = data.reduce((acc, contact) => {
      const section = contact.section_title
      if (!acc[section]) {
        acc[section] = {
          title: section,
          color: contact.is_emergency ? '#ef4444' : (contact.category === 'Academic' ? '#4f46e5' : '#7c3aed'),
          contacts: []
        }
      }
      acc[section].contacts.push(contact)
      return acc
    }, {})
    res.json({ success: true, data: Object.values(groups) })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

router.get('/raw', authenticate, requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('campus_support').select('*').order('created_at', { ascending: false })
    if (error) throw error
    res.json({ success: true, data })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('campus_support').insert(req.body).select().single()
    if (error) throw error
    res.status(201).json({ success: true, data })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const payload = { ...req.body }
    delete payload.id
    const { data, error } = await supabaseAdmin
      .from('campus_support').update(payload).eq('id', req.params.id).select().single()
    if (error) throw error
    res.json({ success: true, data })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from('campus_support').delete().eq('id', req.params.id)
    if (error) throw error
    res.json({ success: true, message: 'Contact deleted' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// ─── SUPPORT TICKETS ───────────────────────────────────────────

// GET /api/support/tickets — User gets their own; Admin gets all
router.get('/tickets', authenticate, async (req, res) => {
  try {
    let query = supabaseAdmin
      .from('support_tickets')
      .select('*')
      .order('created_at', { ascending: false })

    if (req.user.role !== 'admin') {
      query = query.eq('user_id', req.user.id)
    }

    const { data, error } = await query
    if (error) throw error
    res.json({ success: true, data })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// POST /api/support/tickets — Any logged-in user can submit
router.post('/tickets', authenticate, async (req, res) => {
  try {
    const { subject, description, category, priority } = req.body

    // Fetch submitter details
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('full_name, email, role')
      .eq('id', req.user.id)
      .single()

    const { data, error } = await supabaseAdmin
      .from('support_tickets')
      .insert({
        user_id: req.user.id,
        user_name: userData?.full_name || 'User',
        user_email: userData?.email || '',
        user_role: userData?.role || 'student',
        subject,
        description,
        category,
        priority,
        status: 'Open',
      })
      .select()
      .single()

    if (error) throw error
    res.status(201).json({ success: true, data })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// PATCH /api/support/tickets/:id — Admin can update status/reply
router.patch('/tickets/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const payload = { ...req.body, updated_at: new Date().toISOString() }
    const { data, error } = await supabaseAdmin
      .from('support_tickets')
      .update(payload)
      .eq('id', req.params.id)
      .select()
      .single()
    if (error) throw error
    res.json({ success: true, data })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// DELETE /api/support/tickets/:id — Admin only
router.delete('/tickets/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from('support_tickets').delete().eq('id', req.params.id)
    if (error) throw error
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// ─── LIVE CHAT MESSAGES ────────────────────────────────────────

// GET /api/support/tickets/:id/messages
router.get('/tickets/:id/messages', authenticate, async (req, res) => {
  try {
    // Verify caller owns the ticket or is an admin
    if (req.user.role !== 'admin') {
      const { data: ticket } = await supabaseAdmin
        .from('support_tickets')
        .select('user_id')
        .eq('id', req.params.id)
        .single()
      if (!ticket || ticket.user_id !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Access denied' })
      }
    }

    const { data, error } = await supabaseAdmin
      .from('support_messages')
      .select('*')
      .eq('ticket_id', req.params.id)
      .order('created_at', { ascending: true })
    if (error) throw error
    res.json({ success: true, data })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// POST /api/support/tickets/:id/messages
router.post('/tickets/:id/messages', authenticate, async (req, res) => {
  try {
    // Verify caller owns the ticket or is an admin
    if (req.user.role !== 'admin') {
      const { data: ticket } = await supabaseAdmin
        .from('support_tickets')
        .select('user_id')
        .eq('id', req.params.id)
        .single()
      if (!ticket || ticket.user_id !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Access denied' })
      }
    }

    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('full_name, role')
      .eq('id', req.user.id)
      .single()

    const { data, error } = await supabaseAdmin
      .from('support_messages')
      .insert({
        ticket_id: req.params.id,
        sender_id: req.user.id,
        sender_name: userData?.full_name || 'User',
        sender_role: userData?.role || 'student',
        message: req.body.message,
      })
      .select()
      .single()

    if (error) throw error

    // Only auto-advance to 'In Progress' when admin first replies on an Open ticket.
    // Student/faculty messages just update the timestamp so admin sees activity.
    const ticketUpdate = { updated_at: new Date().toISOString() }
    if (userData?.role === 'admin') {
      ticketUpdate.status = 'In Progress'
      // Use a conditional update so Resolved/Closed tickets aren't re-opened by admin notes
      await supabaseAdmin
        .from('support_tickets')
        .update(ticketUpdate)
        .eq('id', req.params.id)
        .eq('status', 'Open')
      // Still bump updated_at even if status didn't change
      await supabaseAdmin
        .from('support_tickets')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', req.params.id)
    } else {
      await supabaseAdmin
        .from('support_tickets')
        .update(ticketUpdate)
        .eq('id', req.params.id)
    }

    res.status(201).json({ success: true, data })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// ─── FAQs ──────────────────────────────────────────────────────

// GET /api/support/faqs — Public
router.get('/faqs', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('support_faqs')
      .select('*')
      .order('category').order('sort_order')
    if (error) throw error
    res.json({ success: true, data })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// POST /api/support/faqs — Admin only
router.post('/faqs', authenticate, requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('support_faqs').insert(req.body).select().single()
    if (error) throw error
    res.status(201).json({ success: true, data })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// PUT /api/support/faqs/:id — Admin only
router.put('/faqs/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('support_faqs').update(req.body).eq('id', req.params.id).select().single()
    if (error) throw error
    res.json({ success: true, data })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// DELETE /api/support/faqs/:id — Admin only
router.delete('/faqs/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from('support_faqs').delete().eq('id', req.params.id)
    if (error) throw error
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

export default router
