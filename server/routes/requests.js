import { Router } from 'express'
import { supabaseAdmin } from '../lib/supabase.js'
import { authenticate, requireFaculty } from '../middleware/auth.js'
import { sendRequestStatusEmail } from '../lib/ses.js'
import { createNotification } from '../lib/notifications.js'

const router = Router()

// ─── GET /api/requests ──────────────────────────────────────
// Student: see their own requests; Faculty: see requests directed to them
router.get('/', authenticate, async (req, res) => {
  const { user } = req
  let query = supabaseAdmin.from('requests').select(`
    *,
    users:student_id(id, full_name, email, avatar_url),
    faculty_profile:faculty_id(id, users:user_id(full_name, avatar_url))
  `)

  if (user.role === 'student' || user.role === 'guest') {
    query = query.eq('student_id', user.id)
  } else if (user.role === 'faculty') {
    const { data: fp } = await supabaseAdmin
      .from('faculty_profiles').select('id').eq('user_id', user.id).single()
    if (!fp) return res.json({ success: true, data: [] })
    query = query.eq('faculty_id', fp.id)
  }

  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) throw error
  res.json({ success: true, data })
})

// ─── GET /api/requests/faculty ──────────────────────────────
// Faculty-specific shorthand (same as above but always scoped to faculty)
router.get('/faculty', authenticate, requireFaculty, async (req, res) => {
  const { data: fp } = await supabaseAdmin
    .from('faculty_profiles').select('id').eq('user_id', req.user.id).single()
  if (!fp) return res.json({ success: true, data: [] })

  const { data, error } = await supabaseAdmin
    .from('requests')
    .select(`*, users:student_id(id, full_name, email, avatar_url)`)
    .eq('faculty_id', fp.id)
    .order('created_at', { ascending: false })

  if (error) throw error
  res.json({ success: true, data })
})

// ─── POST /api/requests ──────────────────────────────────────
// Student creates a request to a faculty
router.post('/', authenticate, async (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ success: false, message: 'Only students can create requests' })
  }

  const { faculty_profile_id, type, detail } = req.body
  if (!faculty_profile_id || !type) {
    return res.status(400).json({ success: false, message: 'faculty_profile_id and type are required' })
  }

  const { data: fp } = await supabaseAdmin.from('faculty_profiles').select('user_id').eq('id', faculty_profile_id).single()

  const { data, error } = await supabaseAdmin
    .from('requests')
    .insert({
      student_id: req.user.id,
      faculty_id: faculty_profile_id,
      type,
      detail,
      status: 'pending',
    })
    .select()
    .single()

  if (error) throw error

  if (fp && fp.user_id) {
    createNotification(
      fp.user_id,
      'New Student Request',
      `You have a new ${type} request from ${req.user.full_name || 'a student'}.`,
      '/faculty/requests'
    )
  }

  res.status(201).json({ success: true, data })
})

// ─── PATCH /api/requests/:id ─────────────────────────────────
// Faculty accepts or rejects a request
router.patch('/:id', authenticate, requireFaculty, async (req, res) => {
  const { status, notes } = req.body
  if (!['accepted', 'rejected'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Status must be accepted or rejected' })
  }

  // Get request + student info
  const { data: request, error: rErr } = await supabaseAdmin
    .from('requests')
    .select(`*, student:student_id(full_name, email), faculty_profile:faculty_id(user_id)`)
    .eq('id', req.params.id)
    .single()

  if (rErr || !request) {
    return res.status(404).json({ success: false, message: 'Request not found' })
  }

  // Ensure this faculty owns the request
  if (request.faculty_profile.user_id !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Forbidden' })
  }

  const { data, error } = await supabaseAdmin
    .from('requests')
    .update({ status, notes, updated_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .select()
    .single()

  if (error) throw error

  // Email + in-app notification to student
  sendRequestStatusEmail(request.student.email, {
    studentName: request.student.full_name,
    facultyName: req.user.full_name,
    requestType: request.type,
    status,
    notes,
  }).catch(console.error)

  createNotification(
    request.student_id,
    status === 'accepted' ? 'Request Accepted ✓' : 'Request Update',
    `Your ${request.type} request to ${req.user.full_name} was ${status}.${notes ? ` Note: ${notes}` : ''}`,
    '/requests'
  )

  res.json({ success: true, message: `Request ${status}`, data })
})

// ─── PATCH /api/requests/:id/accept ─────────────────────────
router.patch('/:id/accept', authenticate, requireFaculty, async (req, res) => {
  req.body = { status: 'accepted' }
  // reuse the main PATCH logic inline
  const { data: request, error: rErr } = await supabaseAdmin
    .from('requests')
    .select(`*, users:student_id(full_name, email), fp:faculty_id(user_id)`)
    .eq('id', req.params.id).single()

  if (rErr || !request) return res.status(404).json({ success: false, message: 'Request not found' })
  if (request.fp?.user_id !== req.user.id) return res.status(403).json({ success: false, message: 'Forbidden' })

  const { data, error } = await supabaseAdmin
    .from('requests').update({ status: 'accepted', updated_at: new Date().toISOString() })
    .eq('id', req.params.id).select().single()
  if (error) throw error

  sendRequestStatusEmail(request.users?.email, {
    studentName: request.users?.full_name,
    facultyName: req.user.full_name,
    requestType: request.type,
    status: 'accepted',
  }).catch(console.error)

  createNotification(
    request.student_id,
    'Request Accepted ✓',
    `Your ${request.type} request to ${req.user.full_name} was accepted.`,
    '/requests'
  )

  res.json({ success: true, message: 'Request accepted', data })
})

// ─── PATCH /api/requests/:id/reject ─────────────────────────
router.patch('/:id/reject', authenticate, requireFaculty, async (req, res) => {
  const { data: request, error: rErr } = await supabaseAdmin
    .from('requests')
    .select(`*, users:student_id(full_name, email), fp:faculty_id(user_id)`)
    .eq('id', req.params.id).single()

  if (rErr || !request) return res.status(404).json({ success: false, message: 'Request not found' })
  if (request.fp?.user_id !== req.user.id) return res.status(403).json({ success: false, message: 'Forbidden' })

  const { data, error } = await supabaseAdmin
    .from('requests').update({ status: 'rejected', updated_at: new Date().toISOString() })
    .eq('id', req.params.id).select().single()
  if (error) throw error

  sendRequestStatusEmail(request.users?.email, {
    studentName: request.users?.full_name,
    facultyName: req.user.full_name,
    requestType: request.type,
    status: 'rejected',
  }).catch(console.error)

  createNotification(
    request.student_id,
    'Request Update',
    `Your ${request.type} request to ${req.user.full_name} was rejected.`,
    '/requests'
  )

  res.json({ success: true, message: 'Request rejected', data })
})

// ─── DELETE /api/requests/:id ────────────────────────────────
// Student can cancel a pending request
router.delete('/:id', authenticate, async (req, res) => {
  const { data: request } = await supabaseAdmin
    .from('requests').select('student_id, status').eq('id', req.params.id).single()

  if (!request) return res.status(404).json({ success: false, message: 'Request not found' })
  if (request.student_id !== req.user.id) return res.status(403).json({ success: false, message: 'Forbidden' })
  if (request.status !== 'pending') return res.status(400).json({ success: false, message: 'Can only cancel pending requests' })

  await supabaseAdmin.from('requests').delete().eq('id', req.params.id)
  res.json({ success: true, message: 'Request cancelled' })
})

export default router
