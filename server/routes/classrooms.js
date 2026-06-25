import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { supabaseAdmin } from '../lib/supabase.js'

import { getFirestoreCollection } from '../lib/firestore.js'

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
  { label: 'Lecture Class (Demo)', sub: 'Faculty Name • Room Code', time: '08:50 - 10:30', active: false },
  { label: 'Practical Lab Slot (Demo)', sub: 'Faculty Name • Room Code', time: '10:30 - 12:10', active: true, ongoing: true },
  { label: 'Open Lab Access (Demo)',    sub: 'Self Study / Open Access', time: '12:00 - 14:00', active: false },
  { label: 'Lecture Class (Demo)',   sub: 'Faculty Name • Room Code', time: '15:30 - 17:10', active: false },
]

// GET /api/classrooms
router.get('/', authenticate, async (req, res) => {
  let supabaseRooms = []
  try {
    const { data, error } = await supabaseAdmin
      .from('classrooms')
      .select('*')
      .order('name')

    if (!error && data) {
      supabaseRooms = data.map(r => ({
        ...r,
        statusBg: r.status_bg,
        statusC: r.status_c,
        indicatorBg: r.indicator_bg,
        img: r.image_url,
        classcode: '',
        classCode: ''
      }))
    }
  } catch (err) {
    console.warn('Supabase fetch failed:', err.message)
  }

  let firestoreRooms = []
  try {
    const rawFirestore = await getFirestoreCollection('classrooms')
    firestoreRooms = rawFirestore.map(room => {
      const hasLabName = room.labName && room.labName !== 'N/A' && room.labName !== 'NA'
      const roomName = hasLabName ? room.labName : (room.roomNo && room.roomNo !== 'N/A' ? room.roomNo : 'Classroom')

      // Avoid repeating the room number in subtitle if name is already the room number
      const subtitle = room.roomNo && room.roomNo !== 'N/A' && hasLabName
        ? `${room.block || ''} • Room ${room.roomNo}`
        : `${room.block || ''}`

      // Standardize type
      let type = 'GENERAL'
      if (room.classType) {
        const ct = room.classType.toUpperCase()
        if (ct.includes('LAB')) type = 'LAB'
        else if (ct.includes('LEC') || ct.includes('AUDITORIUM')) type = 'LEC'
      }

      return {
        id: room.id,
        name: roomName,
        subtitle: subtitle,
        type: type,
        status: room.status || 'AVAILABLE NOW',
        statusBg: room.status_bg || (room.ACStatus === 'AC' ? '#22c55e' : '#f97316'),
        statusC: '#ffffff',
        block: room.block || '',
        floor: room.floor || '',
        capacity: room.capacity || '',
        indicatorBg: '#4f46e5',
        img: room.image_url || 'https://images.unsplash.com/photo-1562774053-701939374585?w=600&auto=format&fit=crop&q=80',
        classcode: room.classcode && room.classcode !== 'N/A' ? room.classcode : '',
        classCode: room.classcode && room.classcode !== 'N/A' ? room.classcode : '',
        is_legacy: true
      }
    })
  } catch (err) {
    console.warn('Firestore fetch failed:', err.message)
  }

  const mergedMap = new Map()

  firestoreRooms.forEach(room => {
    const key = `${room.name.toLowerCase().trim()}_${(room.subtitle || '').toLowerCase().trim()}`
    mergedMap.set(key, room)
  })

  supabaseRooms.forEach(room => {
    const key = `${room.name.toLowerCase().trim()}_${(room.subtitle || '').toLowerCase().trim()}`
    mergedMap.set(key, room)
  })

  const mergedList = Array.from(mergedMap.values())
  const finalData = mergedList.length > 0 ? mergedList : mockRooms

  res.json({ success: true, data: finalData })
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

// POST /api/classrooms/bulk (Admin only)
router.post('/bulk', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Forbidden' })
  }
  try {
    const { rows } = req.body
    if (!rows || !Array.isArray(rows)) return res.status(400).json({ success: false, message: 'Invalid data format' })

    const { data, error } = await supabaseAdmin
      .from('classrooms')
      .insert(rows)
      .select()

    if (error) throw error
    res.json({ success: true, count: data.length, data })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
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
