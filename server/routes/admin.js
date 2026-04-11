import { Router } from 'express'
import { supabaseAdmin } from '../lib/supabase.js'
import { authenticate, requireAdmin } from '../middleware/auth.js'

const router = Router()

// GET /api/admin/stats
router.get('/stats', authenticate, requireAdmin, async (req, res) => {
  const today = new Date()
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const todayName = days[today.getDay()]

  const [
    students, faculty, classrooms, tickets,
    recentClassroomActivity, adminTimetable
  ] = await Promise.all([
    supabaseAdmin.from('users').select('id', { count: 'exact', head: true }).eq('role', 'student'),
    supabaseAdmin.from('users').select('id', { count: 'exact', head: true }).eq('role', 'faculty'),
    supabaseAdmin.from('classrooms').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('support_tickets').select('id', { count: 'exact', head: true }).eq('status', 'Open'),
    supabaseAdmin.from('classroom_timetable').select('*, classrooms(name, block)').ilike('day', todayName).order('time_slot'),
    supabaseAdmin.from('student_timetable').select('*').eq('student_id', req.user.id).ilike('day', todayName).order('time_slot'),
  ])

  // Combine into a "Recent Activity" list for the dashboard
  const activity = []
  
  // Add classroom schedule
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

  // Add open tickets
  const { data: openTickets } = await supabaseAdmin.from('support_tickets').select('subject, user_name, created_at').eq('status', 'Open').order('created_at', { ascending: false }).limit(2)
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
      recent_activity: activity.length > 0 ? activity : [
         { time: 'Today', title: 'System Running', desc: 'No urgent alerts or classes scheduled.', type: 'Success' }
      ],
      admin_personal_schedule: adminTimetable.data || []
    },
  })
})

// GET /api/admin/users
router.get('/users', authenticate, requireAdmin, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select(`
      id, email, full_name, role, is_verified, created_at, avatar_url,
      faculty_profiles(dept)
    `)
    .order('created_at', { ascending: false })
  
  if (error) throw error

  // Flatten the dept into the user object
  const flat = (data || []).map(u => ({
    ...u,
    dept: u.faculty_profiles?.[0]?.dept || u.faculty_profiles?.dept || null,
    faculty_profiles: undefined
  }))

  res.json({ success: true, data: flat })
})

// POST /api/admin/users
router.post('/users', authenticate, requireAdmin, async (req, res) => {
  const { full_name, email, dept, role = 'faculty' } = req.body
  
  // 1. Create the auth user (requires service_role)
  const { data: authUser, error: authErr } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: 'Password123!', // Default password
    email_confirm: true,
    user_metadata: { full_name, role }
  })

  if (authErr) throw authErr

  // 2. Profile creation will be handled by DB triggers, 
  // but if not, we can manually update the dept if needed.
  if (role === 'faculty' && dept) {
    await supabaseAdmin
      .from('faculty_profiles')
      .upsert({ user_id: authUser.user.id, dept })
  }

  res.json({ success: true, message: 'User created successfully', user: authUser.user })
})

// PATCH /api/admin/users/:id
router.patch('/users/:id', authenticate, requireAdmin, async (req, res) => {
  const { id } = req.params
  const { full_name, dept, is_verified } = req.body

  // 1. Update users table
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

  // 2. Update faculty_profiles table
  if (dept) {
    const { error: fErr } = await supabaseAdmin
      .from('faculty_profiles')
      .upsert({ user_id: id, dept }, { onConflict: 'user_id' })
    if (fErr) throw fErr
  }

  res.json({ success: true, message: 'User updated successfully' })
})

// POST /api/admin/verify-user
router.post('/verify-user', authenticate, requireAdmin, async (req, res) => {
  const { userId, isVerified } = req.body
  const { error } = await supabaseAdmin
    .from('users')
    .update({ is_verified: isVerified })
    .eq('id', userId)

  if (error) throw error
  res.json({ success: true, message: `User ${isVerified ? 'verified' : 'unverified'} successfully` })
})

// DELETE /api/admin/users/:id
router.delete('/users/:id', authenticate, requireAdmin, async (req, res) => {
  const { id } = req.params
  const { error } = await supabaseAdmin
    .from('users')
    .delete()
    .eq('id', id)

  if (error) throw error
  res.json({ success: true, message: 'User deleted successfully' })
})

export default router
