import { Router } from 'express'
import { supabaseAdmin } from '../lib/supabase.js'
import { authenticate, requireFaculty } from '../middleware/auth.js'

const router = Router()

// GET /api/faculty
router.get('/', async (req, res) => {
  const { dept, search } = req.query

  let query = supabaseAdmin
    .from('faculty_profiles')
    .select(`
      id, designation, dept, teacher_code, bio, cabin_room, cabin_building,
      accepting_students, citations, research_interests,
      users!inner(id, full_name, email, avatar_url, is_verified)
    `)

  if (dept) query = query.eq('dept', dept)
  if (search) {
    query = query.or(`users.full_name.ilike.%${search}%,dept.ilike.%${search}%,designation.ilike.%${search}%`)
  }

  const { data, error } = await query
  if (error) throw error

  // Flatten users data into each faculty object for easier frontend use
  const flat = (data || []).map(f => ({
    ...f,
    user_id:     f.users?.id,
    full_name:   f.users?.full_name,
    email:       f.users?.email,
    avatar_url:  f.users?.avatar_url,
    is_verified: f.users?.is_verified,
    users:       undefined,
  }))

  res.json({ success: true, data: flat })
})

// GET /api/faculty/:id
router.get('/:id', async (req, res) => {
  const { id } = req.params

  const { data: profile, error } = await supabaseAdmin
    .from('faculty_profiles')
    .select(`
      *,
      users!inner(id, full_name, email, avatar_url, is_verified),
      qualifications(*),
      publications(*),
      awards(*),
      timetable(*),
      office_hours(*),
      courses(*)
    `)
    .eq('id', id)
    .single()

  if (error || !profile) {
    return res.status(404).json({ success: false, message: 'Faculty not found' })
  }

  res.json({ success: true, data: profile })
})

// GET /api/faculty/me/profile
router.get('/me/profile', authenticate, requireFaculty, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('faculty_profiles')
    .select(`
      *,
      users!inner(id, full_name, email, avatar_url, is_verified),
      qualifications(*),
      publications(*),
      awards(*),
      timetable(*),
      office_hours(*),
      courses(*)
    `)
    .eq('user_id', req.user.id)
    .single()

  if (error) {
    // Profile doesn't exist yet — return empty shell
    return res.json({ success: true, data: null })
  }

  // Flatten user data for consistency
  const flat = {
    ...data,
    full_name:   data.users?.full_name,
    email:       data.users?.email,
    avatar_url:  data.users?.avatar_url,
    is_verified: data.users?.is_verified,
    // Keep users object if frontend needs it, or remove it
    users:       undefined 
  }

  res.json({ success: true, data: flat })
})

// PUT /api/faculty/me/profile
router.put('/me/profile', authenticate, requireFaculty, async (req, res) => {
  const {
    designation, dept, teacher_code, phone, dept_website, linkedin, bio,
    cabin_room, cabin_building, cabin_floor, campus_section,
    research_interests, lab_name, lab_website, accepting_students,
    citations, publications_count, conferences, teaching_exp_years, academic_links
  } = req.body

  const { data, error } = await supabaseAdmin
    .from('faculty_profiles')
    .upsert({
      user_id: req.user.id,
      designation, dept, teacher_code, phone, dept_website, linkedin, bio,
      cabin_room, cabin_building, cabin_floor, campus_section,
      research_interests, lab_name, lab_website, accepting_students,
      citations, publications_count, conferences, teaching_exp_years, academic_links,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
    .select()
    .single()

  if (error) throw error

  res.json({ success: true, message: 'Profile updated', data })
})

// PUT /api/faculty/me/qualifications
router.put('/me/qualifications', authenticate, requireFaculty, async (req, res) => {
  const { data: profile } = await supabaseAdmin.from('faculty_profiles').select('id').eq('user_id', req.user.id).single()
  if (!profile) return res.status(404).json({ success: false, message: 'Create profile first' })

  // Bulk replace
  await supabaseAdmin.from('qualifications').delete().eq('faculty_id', profile.id)
  const items = req.body.items || []
  if (items.length > 0) {
    const { error } = await supabaseAdmin.from('qualifications').insert(items.map(i => ({
      faculty_id: profile.id, degree: i.degree, institution: i.institution, year: i.year || null, division: i.division, cgpa: i.cgpa
    })))
    if (error) throw error
  }
  res.json({ success: true, message: 'Qualifications updated' })
})

// PUT /api/faculty/me/publications
router.put('/me/publications', authenticate, requireFaculty, async (req, res) => {
  const { data: profile } = await supabaseAdmin.from('faculty_profiles').select('id').eq('user_id', req.user.id).single()
  if (!profile) return res.status(404).json({ success: false, message: 'Create profile first' })

  await supabaseAdmin.from('publications').delete().eq('faculty_id', profile.id)
  const items = req.body.items || []
  if (items.length > 0) {
    const { error } = await supabaseAdmin.from('publications').insert(items.map(i => ({
      faculty_id: profile.id, title: i.title, journal: i.journal, year: i.year || null, doi: i.doi
    })))
    if (error) throw error
  }
  res.json({ success: true, message: 'Publications updated' })
})

// PUT /api/faculty/me/awards
router.put('/me/awards', authenticate, requireFaculty, async (req, res) => {
  const { data: profile } = await supabaseAdmin.from('faculty_profiles').select('id').eq('user_id', req.user.id).single()
  if (!profile) return res.status(404).json({ success: false, message: 'Create profile first' })

  await supabaseAdmin.from('awards').delete().eq('faculty_id', profile.id)
  const items = req.body.items || []
  if (items.length > 0) {
    const { error } = await supabaseAdmin.from('awards').insert(items.map(i => ({
      faculty_id: profile.id, title: i.title, org: i.org, year: i.year || null, description: i.description
    })))
    if (error) throw error
  }
  res.json({ success: true, message: 'Awards updated' })
})

// PUT /api/faculty/me/timetable
router.put('/me/timetable', authenticate, requireFaculty, async (req, res) => {
  const { data: profile } = await supabaseAdmin
    .from('faculty_profiles').select('id').eq('user_id', req.user.id).single()
  if (!profile) return res.status(404).json({ success: false, message: 'Create your profile first' })

  // Delete existing and re-insert
  await supabaseAdmin.from('timetable').delete().eq('faculty_id', profile.id)

  const slots = req.body.slots || []
  if (slots.length > 0) {
    const { error } = await supabaseAdmin
      .from('timetable')
      .insert(slots.map(s => ({
        faculty_id: profile.id,
        day: s.day,
        time_slot: s.time_slot || s.time,
        course: s.course,
        location: s.location,
        type: s.type,
        color_preset: s.color_preset || 'indigo'
      })))
    if (error) throw error
  }

  res.json({ success: true, message: 'Timetable updated' })
})

// PUT /api/faculty/me/office-hours
router.put('/me/office-hours', authenticate, requireFaculty, async (req, res) => {
  const { data: profile } = await supabaseAdmin
    .from('faculty_profiles').select('id').eq('user_id', req.user.id).single()
  if (!profile) return res.status(404).json({ success: false, message: 'Create your profile first' })

  await supabaseAdmin.from('office_hours').delete().eq('faculty_id', profile.id)

  const hours = req.body.hours || []
  if (hours.length > 0) {
    const { error } = await supabaseAdmin
      .from('office_hours')
      .insert(hours.map(h => ({
        faculty_id: profile.id,
        day: h.day,
        slot: h.slot,
        mode: h.mode,
        room_or_link: h.room_or_link || h.room
      })))
    if (error) throw error
  }

  res.json({ success: true, message: 'Office hours updated' })
})

// GET /api/faculty/dashboard/stats
router.get('/dashboard/stats', authenticate, requireFaculty, async (req, res) => {
  try {
    const { data: profile, error: pErr } = await supabaseAdmin
      .from('faculty_profiles').select('id, dept').eq('user_id', req.user.id).single()
    
    if (pErr || !profile) {
      return res.json({ success: true, stats: { scheduleToday: [], pendingRequests: 0, totalCitations: 0, pendingGrades: 0 } })
    }

    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }) // e.g. "Monday"
    
    const [scheduleRes, requestsRes, gradesRes] = await Promise.all([
      // 1. Today's schedule
      supabaseAdmin
        .from('timetable')
        .select('*')
        .eq('faculty_id', profile.id)
        .ilike('day', `${today}`),
      
      // 2. Pending student requests
      supabaseAdmin
        .from('requests')
        .select('id', { count: 'exact' })
        .eq('faculty_id', profile.id)
        .eq('status', 'pending'),
      
      // 3. (Mock) Pending grades count or filter by active courses if available
      supabaseAdmin
        .from('courses')
        .select('id', { count: 'exact' })
        .eq('faculty_id', profile.id)
    ])

    res.json({
      success: true,
      stats: {
        scheduleToday: scheduleRes.data || [],
        pendingRequests: requestsRes.count || 0,
        pendingGrades: (gradesRes.count || 0) * 4, // Mock: 4 pending papers per course
        totalCitations: profile.citations || 0,
        dept: profile.dept
      }
    })
  } catch (err) {
    console.error('Faculty stats error:', err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

export default router
