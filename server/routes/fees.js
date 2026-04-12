import { Router } from 'express'
import { z } from 'zod'
import { supabaseAdmin } from '../lib/supabase.js'
import { authenticate, requireAdmin, requireStudent } from '../middleware/auth.js'

const router = Router()

const feeSchema = z.object({
  student_id:      z.string().uuid(),
  semester:        z.coerce.number().int().min(1).max(12),
  fee_type:        z.enum(['tuition', 'hostel', 'transport', 'misc', 'total']).default('tuition'),
  amount_due:      z.coerce.number().min(0),
  amount_paid:     z.coerce.number().min(0).default(0),
  due_date:        z.string().optional().nullable(),
  status:          z.enum(['pending', 'partial', 'paid', 'overdue', 'waived']).default('pending'),
  receipt_url:     z.string().url().optional().nullable(),
  transaction_ref: z.string().optional().nullable(),
})

// GET /api/fees/summary — MUST be before /:id
router.get('/summary', authenticate, requireStudent, async (req, res) => {
  const { id: userId } = req.user
  try {
    const { data, error } = await supabaseAdmin
      .from('fee_records')
      .select('semester, fee_type, amount_due, amount_paid, status, due_date')
      .eq('student_id', userId)
      .order('semester', { ascending: false })
    if (error) throw error

    const totalDue  = data.reduce((s, r) => s + (r.amount_due || 0), 0)
    const totalPaid = data.reduce((s, r) => s + (r.amount_paid || 0), 0)
    const overdue   = data.filter(r => r.status === 'overdue').length
    res.json({ success: true, data, summary: { total_due: totalDue, total_paid: totalPaid, balance: totalDue - totalPaid, overdue_count: overdue } })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// GET /api/fees
router.get('/', authenticate, async (req, res) => {
  const { role, id: userId } = req.user
  const { student_id, semester, status } = req.query

  try {
    let query = supabaseAdmin
      .from('fee_records')
      .select(role === 'admin' ? '*, users(full_name, email)' : '*')
      .order('semester', { ascending: false })

    if (role === 'student') {
      query = query.eq('student_id', userId)
    } else {
      if (student_id) query = query.eq('student_id', student_id)
    }
    if (semester) query = query.eq('semester', parseInt(semester))
    if (status)   query = query.eq('status', status)

    const { data, error } = await query
    if (error) throw error
    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// GET /api/fees/:id
router.get('/:id', authenticate, async (req, res) => {
  const { role, id: userId } = req.user
  try {
    const { data, error } = await supabaseAdmin
      .from('fee_records')
      .select('*')
      .eq('id', req.params.id)
      .single()
    if (error || !data) return res.status(404).json({ success: false, error: 'Record not found' })
    if (role === 'student' && data.student_id !== userId)
      return res.status(403).json({ success: false, error: 'Unauthorized' })
    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// POST /api/fees
router.post('/', authenticate, requireAdmin, async (req, res) => {
  const parsed = feeSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.errors })

  try {
    const { data, error } = await supabaseAdmin
      .from('fee_records')
      .insert(parsed.data)
      .select()
      .single()
    if (error) throw error
    res.status(201).json({ success: true, data })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// PATCH /api/fees/:id
router.patch('/:id', authenticate, requireAdmin, async (req, res) => {
  const parsed = feeSchema.partial().safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.errors })

  try {
    const updates = { ...parsed.data, updated_at: new Date().toISOString() }
    if (parsed.data.amount_paid !== undefined && parsed.data.amount_due !== undefined) {
      updates.paid_at = parsed.data.amount_paid >= parsed.data.amount_due ? new Date().toISOString() : null
    }
    const { data, error } = await supabaseAdmin
      .from('fee_records')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single()
    if (error) throw error
    if (!data) return res.status(404).json({ success: false, error: 'Record not found' })
    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// DELETE /api/fees/:id
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { error } = await supabaseAdmin.from('fee_records').delete().eq('id', req.params.id)
    if (error) throw error
    res.json({ success: true, message: 'Fee record deleted' })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
