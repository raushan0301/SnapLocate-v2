import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { supabaseAdmin } from '../lib/supabase.js'
import { authenticate, requireAdmin } from '../middleware/auth.js'
import { logAudit } from '../lib/audit.js'

const router = Router()

// ─── Validation Schemas ───────────────────────────────────────
const createUserSchema = z.object({
  full_name: z.string().min(2),
  email:     z.string().email(),
  dept:      z.string().min(1),
  role:      z.enum(['faculty', 'admin']).default('faculty'),
})

const updateUserSchema = z.object({
  full_name:   z.string().min(2).optional(),
  dept:        z.string().min(1).optional(),
  is_verified: z.boolean().optional(),
})

const verifyUserSchema = z.object({
  userId:     z.string().uuid(),
  isVerified: z.boolean(),
})

// GET /api/admin/stats
router.get('/stats', authenticate, requireAdmin, async (req, res) => {
  const today = new Date()
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const todayName = days[today.getDay()]

  const [
    students, faculty, classrooms, tickets,
    recentClassroomActivity, adminTimetable,
    marketplaceItems, societiesCount,
  ] = await Promise.all([
    supabaseAdmin.from('users').select('id', { count: 'exact', head: true }).eq('role', 'student'),
    supabaseAdmin.from('users').select('id', { count: 'exact', head: true }).eq('role', 'faculty'),
    supabaseAdmin.from('classrooms').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('support_tickets').select('id', { count: 'exact', head: true }).eq('status', 'Open'),
    supabaseAdmin.from('classroom_timetable').select('*, classrooms(name, block)').ilike('day', todayName).order('time_slot'),
    supabaseAdmin.from('student_timetable').select('*').eq('student_id', req.user.id).ilike('day', todayName).order('time_slot'),
    supabaseAdmin.from('marketplace').select('id', { count: 'exact', head: true }).eq('status', 'available'),
    supabaseAdmin.from('societies').select('id', { count: 'exact', head: true }),
  ])

  const activity = []

  if (recentClassroomActivity.data) {
    recentClassroomActivity.data.slice(0, 3).forEach(item => {
      activity.push({
        time: item.time_slot,
        title: `${item.label} (${item.classrooms?.name || 'Unknown Room'})`,
        desc: item.sub || 'Scheduled class in progress.',
        type: 'Info'
      })
    })
  }

  const { data: openTickets } = await supabaseAdmin
    .from('support_tickets').select('subject, user_name, created_at')
    .eq('status', 'Open').order('created_at', { ascending: false }).limit(2)
  if (openTickets) {
    openTickets.forEach(t => {
      activity.push({
        time: new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        title: 'New Support Ticket',
        desc: `${t.subject} by ${t.user_name}`,
        type: 'Warning'
      })
    })
  }

  res.json({
    success: true,
    data: {
      total_students: students.count || 0,
      total_faculty: faculty.count || 0,
      total_classrooms: classrooms.count || 0,
      open_tickets: tickets.count || 0,
      marketplace_listings: marketplaceItems.count || 0,
      societies_count: societiesCount.count || 0,
      recent_activity: activity.length > 0 ? activity : [
        { time: 'Today', title: 'System Running', desc: 'No urgent alerts or classes scheduled.', type: 'Success' }
      ],
      admin_personal_schedule: adminTimetable.data || []
    },
  })
})

// GET /api/admin/users?role=faculty|student|admin
router.get('/users', authenticate, requireAdmin, async (req, res) => {
  let query = supabaseAdmin
    .from('users')
    .select(`id, email, full_name, role, is_verified, created_at, avatar_url, faculty_profiles(dept)`)
    .order('created_at', { ascending: false })

  if (req.query.role) query = query.eq('role', req.query.role)

  const { data, error } = await query
  if (error) throw error

  const flat = (data || []).map(u => ({
    ...u,
    dept: u.faculty_profiles?.[0]?.dept || u.faculty_profiles?.dept || null,
    faculty_profiles: undefined
  }))

  res.json({ success: true, data: flat })
})

// POST /api/admin/users
router.post('/users', authenticate, requireAdmin, async (req, res) => {
  const { full_name, email, dept, role } = createUserSchema.parse(req.body)

  const { data: existing } = await supabaseAdmin
    .from('users').select('id').eq('email', email).single()
  if (existing) {
    return res.status(409).json({ success: false, message: 'Email already registered' })
  }

  const password_hash = await bcrypt.hash('Password123!', 12)
  const { data: newUser, error: userErr } = await supabaseAdmin
    .from('users')
    .insert({ full_name, email, password_hash, role, is_verified: true })
    .select('id, email, full_name, role, created_at')
    .single()
  if (userErr) throw userErr

  if (role === 'faculty' && dept) {
    await supabaseAdmin
      .from('faculty_profiles')
      .upsert({ user_id: newUser.id, dept }, { onConflict: 'user_id' })
  }

  logAudit(req.user, 'CREATE_USER', 'user', newUser.id, full_name, { role, dept })

  res.status(201).json({ success: true, message: 'User created successfully', user: newUser })
})

// PATCH /api/admin/users/:id
router.patch('/users/:id', authenticate, requireAdmin, async (req, res) => {
  const { id } = req.params
  const { full_name, dept, is_verified } = updateUserSchema.parse(req.body)

  if (full_name !== undefined || is_verified !== undefined) {
    const { error: uErr } = await supabaseAdmin
      .from('users')
      .update({
        ...(full_name && { full_name }),
        ...(is_verified !== undefined && { is_verified })
      })
      .eq('id', id)
    if (uErr) throw uErr
  }

  if (dept) {
    const { error: fErr } = await supabaseAdmin
      .from('faculty_profiles')
      .upsert({ user_id: id, dept }, { onConflict: 'user_id' })
    if (fErr) throw fErr
  }

  logAudit(req.user, 'UPDATE_USER', 'user', id, full_name || id, { dept, is_verified })

  res.json({ success: true, message: 'User updated successfully' })
})

// POST /api/admin/verify-user
router.post('/verify-user', authenticate, requireAdmin, async (req, res) => {
  const { userId, isVerified } = verifyUserSchema.parse(req.body)

  // Fetch name for audit before update
  const { data: target } = await supabaseAdmin
    .from('users').select('full_name').eq('id', userId).single()

  const { error } = await supabaseAdmin
    .from('users').update({ is_verified: isVerified }).eq('id', userId)
  if (error) throw error

  logAudit(req.user, isVerified ? 'VERIFY_USER' : 'UNVERIFY_USER', 'user', userId, target?.full_name)

  res.json({ success: true, message: `User ${isVerified ? 'verified' : 'unverified'} successfully` })
})

// DELETE /api/admin/users/:id
router.delete('/users/:id', authenticate, requireAdmin, async (req, res) => {
  const { id } = req.params

  // Fetch name for audit before delete
  const { data: target } = await supabaseAdmin
    .from('users').select('full_name, role').eq('id', id).single()

  const { error } = await supabaseAdmin.from('users').delete().eq('id', id)
  if (error) throw error

  logAudit(req.user, 'DELETE_USER', 'user', id, target?.full_name, { role: target?.role })

  res.json({ success: true, message: 'User deleted successfully' })
})

// ─── STUDENT ADVISOR ALLOCATION ──────────────────────────────

// GET /api/admin/student-advisors — all current assignments
router.get('/student-advisors', authenticate, requireAdmin, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('student_advisors')
    .select(`
      student_id, subject, assigned_at,
      faculty:faculty_profile_id(id, dept, designation, users:user_id(full_name, avatar_url))
    `)
  if (error) throw error
  res.json({ success: true, data: data || [] })
})

// POST /api/admin/student-advisors — assign (or reassign) faculty to student
router.post('/student-advisors', authenticate, requireAdmin, async (req, res) => {
  const { student_id, faculty_profile_id, subject } = req.body
  if (!student_id || !faculty_profile_id)
    return res.status(400).json({ success: false, message: 'student_id and faculty_profile_id required' })

  // Fetch names for audit
  const [{ data: student }, { data: fp }] = await Promise.all([
    supabaseAdmin.from('users').select('full_name').eq('id', student_id).single(),
    supabaseAdmin.from('faculty_profiles').select('users:user_id(full_name)').eq('id', faculty_profile_id).single(),
  ])

  const { error } = await supabaseAdmin
    .from('student_advisors')
    .upsert({ student_id, faculty_profile_id, subject, assigned_at: new Date().toISOString() },
             { onConflict: 'student_id' })
  if (error) throw error

  logAudit(req.user, 'ASSIGN_ADVISOR', 'user', student_id,
    student?.full_name, { faculty: fp?.users?.full_name })

  res.json({ success: true, message: 'Advisor assigned' })
})

// DELETE /api/admin/student-advisors/:studentId — remove advisor from student
router.delete('/student-advisors/:studentId', authenticate, requireAdmin, async (req, res) => {
  const { data: student } = await supabaseAdmin
    .from('users').select('full_name').eq('id', req.params.studentId).single()

  const { error } = await supabaseAdmin
    .from('student_advisors').delete().eq('student_id', req.params.studentId)
  if (error) throw error

  logAudit(req.user, 'REMOVE_ADVISOR', 'user', req.params.studentId, student?.full_name)
  res.json({ success: true, message: 'Advisor removed' })
})

// ─── ADMIN MODERATION ENDPOINTS ──────────────────────────────

// GET /api/admin/marketplace — All listings for moderation
router.get('/marketplace', authenticate, requireAdmin, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('marketplace')
    .select('*, seller:seller_id(full_name, avatar_url)')
    .order('created_at', { ascending: false })
  if (error) throw error
  res.json({ success: true, data })
})

// DELETE /api/admin/marketplace/:id
router.delete('/marketplace/:id', authenticate, requireAdmin, async (req, res) => {
  const { data: target } = await supabaseAdmin
    .from('marketplace').select('title, seller_id').eq('id', req.params.id).single()

  const { error } = await supabaseAdmin.from('marketplace').delete().eq('id', req.params.id)
  if (error) throw error

  logAudit(req.user, 'REMOVE_LISTING', 'listing', req.params.id, target?.title)

  res.json({ success: true, message: 'Listing removed' })
})

// GET /api/admin/lost-found/stats
router.get('/lost-found/stats', authenticate, requireAdmin, async (req, res) => {
  // Get all items for this org (fallback: all items if org_id not set)
  let itemsQuery = supabaseAdmin.from('lost_found').select('id, status, category')
  if (req.user.org_id) itemsQuery = itemsQuery.eq('org_id', req.user.org_id)
  const { data: items, error: itemsErr } = await itemsQuery
  if (itemsErr) throw itemsErr

  const ids = (items || []).map(i => i.id)
  let pendingClaims = 0
  if (ids.length > 0) {
    const { data: claims } = await supabaseAdmin
      .from('lost_found_claims').select('status').in('item_id', ids).eq('status', 'pending')
    pendingClaims = (claims || []).length
  }

  const byCategory = (items || []).reduce((acc, i) => {
    acc[i.category || 'other'] = (acc[i.category || 'other'] || 0) + 1
    return acc
  }, {})

  res.json({
    success: true,
    data: {
      total:          (items || []).length,
      lost:           (items || []).filter(i => i.status === 'lost').length,
      found:          (items || []).filter(i => i.status === 'found').length,
      resolved:       (items || []).filter(i => i.status === 'resolved').length,
      pending_claims: pendingClaims,
      by_category:    byCategory,
    },
  })
})

// GET /api/admin/lost-found/claims — all claims across org
router.get('/lost-found/claims', authenticate, requireAdmin, async (req, res) => {
  // First get all item IDs for this org (fallback: all items if org_id not set)
  let orgItemsQuery = supabaseAdmin.from('lost_found').select('id')
  if (req.user.org_id) orgItemsQuery = orgItemsQuery.eq('org_id', req.user.org_id)
  const { data: orgItems } = await orgItemsQuery
  const orgItemIds = (orgItems || []).map(i => i.id)

  if (orgItemIds.length === 0) return res.json({ success: true, data: [] })

  const { status } = req.query
  let query = supabaseAdmin
    .from('lost_found_claims')
    .select(`*, claimer:claimer_id(id, full_name, avatar_url, role), item:item_id(id, title, status, category)`)
    .in('item_id', orgItemIds)
    .order('created_at', { ascending: false })

  if (status && status !== 'all') query = query.eq('status', status)

  const { data, error } = await query
  if (error) throw error
  res.json({ success: true, data: data || [] })
})

// GET /api/admin/lost-found — All posts for moderation
router.get('/lost-found', authenticate, requireAdmin, async (req, res) => {
  const { status, category, search } = req.query
  let query = supabaseAdmin
    .from('lost_found')
    .select('*, reporter:reporter_id(full_name, avatar_url)')
    .order('created_at', { ascending: false })
  // Only filter by org_id if it exists (graceful fallback for single-tenant setups)
  if (req.user.org_id) query = query.eq('org_id', req.user.org_id)
  if (status && status !== 'all')     query = query.eq('status', status)
  if (category && category !== 'all') query = query.eq('category', category)
  if (search) query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,location.ilike.%${search}%`)
  const { data, error } = await query
  if (error) throw error

  // Attach claim counts
  const ids = (data || []).map(i => i.id)
  let claimCounts = {}
  if (ids.length > 0) {
    const { data: cc } = await supabaseAdmin
      .from('lost_found_claims').select('item_id, status').in('item_id', ids)
    ;(cc || []).forEach(c => {
      if (!claimCounts[c.item_id]) claimCounts[c.item_id] = { total: 0, pending: 0 }
      claimCounts[c.item_id].total++
      if (c.status === 'pending') claimCounts[c.item_id].pending++
    })
  }

  const enriched = (data || []).map(i => ({ ...i, claim_counts: claimCounts[i.id] || { total: 0, pending: 0 } }))
  res.json({ success: true, data: enriched })
})

// PATCH /api/admin/lost-found/:id/status — force-set status
router.patch('/lost-found/:id/status', authenticate, requireAdmin, async (req, res) => {
  const { status } = req.body
  if (!['lost','found','resolved'].includes(status)) {
    return res.status(400).json({ success: false, error: 'Invalid status' })
  }

  const updates = { status }
  if (status === 'resolved') {
    updates.resolved_at = new Date().toISOString()
    updates.resolved_by = req.user.id
  }

  const { data, error } = await supabaseAdmin
    .from('lost_found').update(updates).eq('id', req.params.id).eq('org_id', req.user.org_id).select().single()
  if (error) throw error

  logAudit(req.user, 'FORCE_RESOLVE_POST', 'post', req.params.id, data?.title)
  res.json({ success: true, data })
})

// PATCH /api/admin/lost-found/claims/:claimId — admin approve/reject any claim
router.patch('/lost-found/claims/:claimId', authenticate, requireAdmin, async (req, res) => {
  const { action, admin_note } = req.body
  if (!['approve','reject'].includes(action)) {
    return res.status(400).json({ success: false, error: 'action must be approve or reject' })
  }

  const { data: claim } = await supabaseAdmin
    .from('lost_found_claims').select('item_id').eq('id', req.params.claimId).single()
  if (!claim) return res.status(404).json({ success: false, error: 'Claim not found' })

  const newStatus = action === 'approve' ? 'approved' : 'rejected'
  const { data, error } = await supabaseAdmin
    .from('lost_found_claims')
    .update({ status: newStatus, admin_note: admin_note || null })
    .eq('id', req.params.claimId).select().single()
  if (error) throw error

  if (action === 'approve') {
    await supabaseAdmin
      .from('lost_found')
      .update({ status: 'resolved', resolved_at: new Date().toISOString(), resolved_by: req.user.id })
      .eq('id', claim.item_id)
    await supabaseAdmin
      .from('lost_found_claims')
      .update({ status: 'rejected', admin_note: 'Another claim was approved.' })
      .eq('item_id', claim.item_id).eq('status', 'pending').neq('id', req.params.claimId)
  }

  res.json({ success: true, data })
})

// DELETE /api/admin/lost-found/:id
router.delete('/lost-found/:id', authenticate, requireAdmin, async (req, res) => {
  const { data: target } = await supabaseAdmin
    .from('lost_found').select('title').eq('id', req.params.id).eq('org_id', req.user.org_id).single()

  const { error } = await supabaseAdmin.from('lost_found').delete().eq('id', req.params.id)
  if (error) throw error

  logAudit(req.user, 'REMOVE_POST', 'post', req.params.id, target?.title)
  res.json({ success: true, message: 'Post removed' })
})

// GET /api/admin/requests — All student-faculty requests
router.get('/requests', authenticate, requireAdmin, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('requests')
    .select(`
      *,
      student:student_id(full_name, email, avatar_url),
      faculty_profile:faculty_id(users:user_id(full_name))
    `)
    .order('created_at', { ascending: false })
  if (error) throw error
  res.json({ success: true, data })
})

// GET /api/admin/resources — All resources for moderation (scoped to org)
router.get('/resources', authenticate, requireAdmin, async (req, res) => {
  const { type, search } = req.query
  let query = supabaseAdmin
    .from('resources')
    .select('*, course:course_id(code, name, dept), uploader:uploaded_by(full_name)')
    .eq('org_id', req.user.org_id)
    .order('created_at', { ascending: false })
  if (type && type !== 'all') query = query.eq('type', type)
  if (search) query = query.ilike('title', `%${search}%`)
  const { data, error } = await query
  if (error) throw error
  res.json({ success: true, data })
})

// DELETE /api/admin/resources/:id
router.delete('/resources/:id', authenticate, requireAdmin, async (req, res) => {
  const { data: target } = await supabaseAdmin
    .from('resources').select('title').eq('id', req.params.id).eq('org_id', req.user.org_id).single()

  const { error } = await supabaseAdmin.from('resources').delete().eq('id', req.params.id)
  if (error) throw error

  logAudit(req.user, 'REMOVE_RESOURCE', 'resource', req.params.id, target?.title)

  res.json({ success: true, message: 'Resource removed' })
})

// ─── AUDIT LOG ────────────────────────────────────────────────

// GET /api/admin/audit-log
router.get('/audit-log', authenticate, requireAdmin, async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit || '200'), 500)
  const { action } = req.query

  let query = supabaseAdmin
    .from('audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (action) query = query.eq('action', action)

  const { data, error } = await query
  if (error) throw error
  res.json({ success: true, data })
})

// ─── Course CRUD (Admin) ──────────────────────────────────────
const courseSchema = z.object({
  code:       z.string().min(1),
  name:       z.string().min(1),
  dept:       z.string().optional(),
  semester:   z.coerce.number().int().positive().optional(),
  year:       z.coerce.number().int().optional(),
  faculty_id: z.string().uuid().optional().nullable(),
  description: z.string().optional(),
})

// GET /api/admin/courses
router.get('/courses', authenticate, requireAdmin, async (_req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('courses')
      .select('*, faculty_profiles(id, users(full_name, email)), course_enrollments(count)')
      .order('created_at', { ascending: false })
    if (error) throw error

    // Attach live enrollment count
    const enriched = (data || []).map(c => ({
      ...c,
      enrolled_count: c.course_enrollments?.[0]?.count ?? c.enrolled_count ?? 0,
      course_enrollments: undefined,
    }))
    res.json({ success: true, data: enriched })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// POST /api/admin/courses
router.post('/courses', authenticate, requireAdmin, async (req, res) => {
  const parsed = courseSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.errors })
  try {
    const { data, error } = await supabaseAdmin
      .from('courses')
      .insert(parsed.data)
      .select()
      .single()
    if (error) throw error
    res.status(201).json({ success: true, data })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// PATCH /api/admin/courses/:id
router.patch('/courses/:id', authenticate, requireAdmin, async (req, res) => {
  const parsed = courseSchema.partial().safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.errors })
  try {
    const { data, error } = await supabaseAdmin
      .from('courses')
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single()
    if (error) throw error
    if (!data) return res.status(404).json({ success: false, error: 'Course not found' })
    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// DELETE /api/admin/courses/:id
router.delete('/courses/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { error } = await supabaseAdmin.from('courses').delete().eq('id', req.params.id)
    if (error) throw error
    res.json({ success: true, message: 'Course deleted' })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
