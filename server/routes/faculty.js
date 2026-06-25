import { Router } from 'express'
import { supabaseAdmin } from '../lib/supabase.js'
import { authenticate, requireFaculty } from '../middleware/auth.js'
import { getFirestoreCollection } from '../lib/firestore.js'

const router = Router()

// Helper to parse cabin No into building and room number
function parseCabinNo(cabinNo) {
  if (!cabinNo || cabinNo.toUpperCase() === 'NA' || cabinNo.toUpperCase() === 'N/A') {
    return { cabin_building: '', cabin_room: cabinNo || '' };
  }
  
  const match = cabinNo.match(/^([a-zA-Z]+)\s*-?\s*(.+)$/);
  if (match) {
    const building = match[1].toUpperCase();
    const room = match[2].trim();
    return { cabin_building: building, cabin_room: room };
  }
  
  return { cabin_building: '', cabin_room: cabinNo };
}

// Helper to infer floor from cabin room
function getFloorName(room) {
  if (!room) return '';
  const match = room.match(/^\d/);
  if (!match) return '';
  const digit = parseInt(match[0], 10);
  if (digit === 0) return 'GROUND';
  if (digit === 1) return '1st';
  if (digit === 2) return '2nd';
  if (digit === 3) return '3rd';
  return `${digit}th`;
}

// GET /api/faculty
router.get('/', async (req, res) => {
  const { dept, search } = req.query

  let supabaseFaculty = []
  try {
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
    if (!error && data) {
      supabaseFaculty = data.map(f => ({
        ...f,
        user_id:     f.users?.id,
        full_name:   f.users?.full_name,
        email:       f.users?.email,
        avatar_url:  f.users?.avatar_url,
        is_verified: f.users?.is_verified,
        users:       undefined,
      }))
    }
  } catch (err) {
    console.warn('Supabase faculty fetch failed:', err.message)
  }

  let firestoreProfs = []
  try {
    const rawFirestore = await getFirestoreCollection('professors')
    firestoreProfs = rawFirestore.map(p => {
      const cabinInfo = parseCabinNo(p.cabinNo)
      return {
        id: p.id,
        designation: p.designation || p.Designation || 'Faculty',
        dept: p.department || '',
        teacher_code: p.teacher_code || '',
        bio: p.specialization || '',
        cabin_room: cabinInfo.cabin_room,
        cabin_building: cabinInfo.cabin_building,
        accepting_students: true,
        citations: 0,
        research_interests: p.specialization ? [p.specialization] : [],
        user_id: null,
        full_name: p.name || 'Faculty',
        email: p.email || p.contact || '',
        avatar_url: null,
        is_verified: false,
        is_legacy: true
      }
    })

    if (dept) {
      const deptLower = dept.toLowerCase().trim()
      firestoreProfs = firestoreProfs.filter(p => p.dept.toLowerCase().includes(deptLower))
    }
    if (search) {
      const searchLower = search.toLowerCase().trim()
      firestoreProfs = firestoreProfs.filter(p => 
        p.full_name.toLowerCase().includes(searchLower) ||
        p.dept.toLowerCase().includes(searchLower) ||
        p.designation.toLowerCase().includes(searchLower)
      )
    }
  } catch (err) {
    console.warn('Firestore professors fetch failed:', err.message)
  }

  const mergedMap = new Map()

  firestoreProfs.forEach(p => {
    const emailLower = p.email ? p.email.toLowerCase().trim() : ''
    const hasValidEmail = emailLower && emailLower !== 'na' && emailLower !== 'n/a'
    const key = hasValidEmail ? emailLower : `name:${p.full_name.toLowerCase().trim()}`
    mergedMap.set(key, p)
  })

  supabaseFaculty.forEach(p => {
    const emailLower = p.email ? p.email.toLowerCase().trim() : ''
    const hasValidEmail = emailLower && emailLower !== 'na' && emailLower !== 'n/a'
    const key = hasValidEmail ? emailLower : `name:${p.full_name.toLowerCase().trim()}`
    mergedMap.set(key, p)
  })

  const mergedList = Array.from(mergedMap.values())

  res.json({ success: true, data: mergedList })
})

// ─── Named routes MUST come before /:id ──────────────────────

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
    return res.json({ success: true, data: null })
  }

  const flat = {
    ...data,
    full_name:   data.users?.full_name,
    email:       data.users?.email,
    avatar_url:  data.users?.avatar_url,
    is_verified: data.users?.is_verified,
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
      faculty_id: profile.id, title: i.title, journal: i.journal, year: i.year || null, doi: i.link || i.doi
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

// GET /api/faculty/my-students
// Returns students allocated to this faculty by admin (via student_advisors table)
// Falls back to request-based history if no allocations exist
router.get('/my-students', authenticate, requireFaculty, async (req, res) => {
  const { data: profile } = await supabaseAdmin
    .from('faculty_profiles').select('id').eq('user_id', req.user.id).single()

  if (!profile) return res.json({ success: true, data: [], source: 'none' })

  // Primary: admin-allocated students
  const { data: allocated } = await supabaseAdmin
    .from('student_advisors')
    .select(`subject, assigned_at, student:student_id(id, full_name, email, avatar_url, created_at)`)
    .eq('faculty_profile_id', profile.id)
    .order('assigned_at', { ascending: false })

  if (allocated && allocated.length > 0) {
    const students = allocated.map(a => ({
      ...a.student,
      subject:     a.subject || null,
      assigned_at: a.assigned_at,
      source:      'allocated',
    }))
    return res.json({ success: true, data: students, source: 'allocated' })
  }

  // Fallback: students who've sent requests
  const { data: requests, error } = await supabaseAdmin
    .from('requests')
    .select(`id, type, status, created_at, updated_at, student:student_id(id, full_name, email, avatar_url)`)
    .eq('faculty_id', profile.id)
    .order('created_at', { ascending: false })

  if (error) throw error

  const map = new Map()
  for (const r of (requests || [])) {
    const sid = r.student?.id
    if (!sid) continue
    if (!map.has(sid)) {
      map.set(sid, {
        ...r.student,
        last_request_type:   r.type,
        last_request_status: r.status,
        last_interaction:    r.updated_at || r.created_at,
        total_requests:      1,
        source:              'requests',
      })
    } else {
      map.get(sid).total_requests++
    }
  }

  res.json({ success: true, data: Array.from(map.values()), source: 'requests' })
})

// GET /api/faculty/dashboard/stats
router.get('/dashboard/stats', authenticate, requireFaculty, async (req, res) => {
  try {
    const { data: profile, error: pErr } = await supabaseAdmin
      .from('faculty_profiles').select('id, dept, citations').eq('user_id', req.user.id).single()

    if (pErr || !profile) {
      return res.json({ success: true, stats: { scheduleToday: [], pendingRequests: 0, totalCitations: 0, pendingGrades: 0 } })
    }

    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' })

    const [scheduleRes, requestsRes, gradesRes] = await Promise.all([
      supabaseAdmin.from('timetable').select('*').eq('faculty_id', profile.id).ilike('day', today),
      supabaseAdmin.from('requests').select('id', { count: 'exact' }).eq('faculty_id', profile.id).eq('status', 'pending'),
      supabaseAdmin.from('courses').select('id', { count: 'exact' }).eq('faculty_id', profile.id)
    ])

    res.json({
      success: true,
      stats: {
        scheduleToday:   scheduleRes.data || [],
        pendingRequests: requestsRes.count || 0,
        pendingGrades:   (gradesRes.count || 0) * 4,
        totalCitations:  profile.citations || 0,
        dept:            profile.dept
      }
    })
  } catch (err) {
    console.error('Faculty stats error:', err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// ─── GET /api/faculty/:id — must be LAST to avoid swallowing named routes ────
router.get('/:id', async (req, res) => {
  const { id } = req.params

  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
    if (isUuid) {
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

      if (!error && profile) {
        const flatProfile = {
          ...profile,
          email: profile.users?.email || '',
          full_name: profile.users?.full_name || '',
          avatar_url: profile.users?.avatar_url || null,
          is_verified: profile.users?.is_verified || false
        }
        return res.json({ success: true, data: flatProfile })
      }
    }
  } catch (err) {
    console.warn('Supabase single faculty fetch failed:', err.message)
  }

  try {
    const rawFirestore = await getFirestoreCollection('professors')
    const legacyProf = rawFirestore.find(p => p.id === id)

    if (legacyProf) {
      const cabinInfo = parseCabinNo(legacyProf.cabinNo)
      const floorName = getFloorName(cabinInfo.cabin_room)
      const mappedProfile = {
        id: legacyProf.id,
        user_id: null,
        designation: legacyProf.designation || legacyProf.Designation || 'Faculty',
        dept: legacyProf.department || '',
        teacher_code: legacyProf.teacher_code || '',
        phone: '',
        dept_website: '',
        linkedin: '',
        bio: legacyProf.specialization || '',
        cabin_room: cabinInfo.cabin_room,
        cabin_building: cabinInfo.cabin_building,
        cabin_floor: floorName || 'GROUND',
        campus_section: '',
        research_interests: legacyProf.specialization ? [legacyProf.specialization] : [],
        lab_name: '',
        lab_website: '',
        academic_links: [],
        accepting_students: true,
        citations: 0,
        publications_count: 0,
        conferences: 0,
        teaching_exp_years: 0,
        email: legacyProf.email || legacyProf.contact || '',
        full_name: legacyProf.name || 'Faculty',
        avatar_url: null,
        is_verified: false,
        users: {
          id: legacyProf.id,
          full_name: legacyProf.name || 'Faculty',
          email: legacyProf.email || legacyProf.contact || '',
          avatar_url: null,
          is_verified: false
        },
        qualifications: [],
        publications: [],
        awards: [],
        timetable: [],
        office_hours: [],
        courses: [],
        is_legacy: true
      }
      return res.json({ success: true, data: mappedProfile })
    }
  } catch (err) {
    console.warn('Firestore fallback fetch failed:', err.message)
  }

  return res.status(404).json({ success: false, message: 'Faculty not found' })
})

export default router
