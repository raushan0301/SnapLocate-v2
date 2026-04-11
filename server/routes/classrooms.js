import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { supabaseAdmin } from '../lib/supabase.js'

const router = Router()

const mockRooms = [
  {
    id: '1', name: 'Programming Lab I', subtitle: 'L 106  •  PL Lab I', type: 'LAB',
    status: 'AVAILABLE NOW', statusBg: '#22c55e', statusC: '#ffffff',
    block: 'CSED', floor: '01', capacity: '60',
    indicatorBg: '#4f46e5',
    img: 'https://images.unsplash.com/photo-1562774053-701939374585?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: '2', name: 'Tan Auditorium', subtitle: 'T-105', type: 'LEC',
    status: 'RESERVED (10M)', statusBg: '#f97316', statusC: '#ffffff',
    block: 'TAN', floor: '01', capacity: '120',
    indicatorBg: '#f97316',
    img: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: '3', name: 'Seminar Room', subtitle: 'B-206', type: 'GENERAL',
    status: 'AVAILABLE NOW', statusBg: '#22c55e', statusC: '#ffffff',
    block: 'B', floor: '01', capacity: '40',
    indicatorBg: '#e2e8f0',
    img: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&auto=format&fit=crop&q=80',
  },
]

const mockTimetable = [
  { label: 'Software Engg',      sub: 'Dr. Aashish Bajaj • 2C71', time: '08:50 - 10:30', active: false },
  { label: 'Operating Systems Lab', sub: 'Prof. Shailendra • 3C72', time: '10:30 - 12:10', active: true, ongoing: true },
  { label: 'Open Lab Access',    sub: 'No Instructor • Student Study', time: '12:00 - 14:00', active: false },
  { label: 'Database Systems',   sub: 'Dr. Nitin Arora • 3C74', time: '15:30 - 17:10', active: false },
]

// GET /api/classrooms
router.get('/', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('classrooms')
      .select('*')
      .order('name')

    if (error) throw error
    
    // Map database fields to frontend fields
    const formattedData = data.map(r => ({
      ...r,
      statusBg: r.status_bg,
      statusC: r.status_c,
      indicatorBg: r.indicator_bg,
      img: r.image_url
    }))

    res.json({ success: true, data: formattedData.length > 0 ? formattedData : mockRooms })
  } catch (err) {
    console.warn('Supabase fetch failed, falling back to mock data:', err.message)
    res.json({ success: true, data: mockRooms })
  }
})

// GET /api/classrooms/:id/timetable
router.get('/:id/timetable', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('classroom_timetable')
      .select('*')
      .eq('classroom_id', req.params.id)

    if (error) throw error

    const formattedTimetable = data.map(t => ({
      label: t.label,
      sub: t.sub,
      time: t.time_slot,
      active: t.is_active,
      ongoing: t.is_ongoing
    }))

    res.json({ success: true, data: formattedTimetable.length > 0 ? formattedTimetable : mockTimetable })
  } catch (err) {
    console.warn('Supabase fetch failed, falling back to mock data:', err.message)
    res.json({ success: true, data: mockTimetable })
  }
})

// POST /api/classrooms (Admin only)
router.post('/', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Forbidden' })
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('classrooms')
      .insert(req.body)
      .select()
      .single()

    if (error) throw error
    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// PUT /api/classrooms/:id (Admin only)
router.put('/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Forbidden' })
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('classrooms')
      .update(req.body)
      .eq('id', req.params.id)
      .select()
      .single()

    if (error) throw error
    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// DELETE /api/classrooms/:id (Admin only)
router.delete('/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Forbidden' })
  }

  try {
    const { error } = await supabaseAdmin
      .from('classrooms')
      .delete()
      .eq('id', req.params.id)

    if (error) throw error
    res.json({ success: true, message: 'Classroom deleted successfully' })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

export default router
