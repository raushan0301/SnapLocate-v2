import { Router } from 'express'
import { supabaseAdmin } from '../../../lib/supabase.js'
import { authenticate, requireAdmin } from '../../../middleware/auth.js'

const router = Router()
router.use(authenticate, requireAdmin)

// ─────────────────────────────────────────────────────────────────────────────
// Utility: parse CSV text into array of row-objects
// First row = headers (lowercased, trimmed)
// ─────────────────────────────────────────────────────────────────────────────
function parseCSV(text) {
  const lines = text.trim().split('\n').filter(Boolean)
  if (lines.length < 2) return { headers: [], rows: [] }
  const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim().toLowerCase().replace(/\s+/g, '_'))
  const rows = lines.slice(1).map(line => {
    const vals = line.split(',').map(v => v.replace(/^"|"$/g, '').trim())
    const obj = {}
    headers.forEach((h, i) => { obj[h] = vals[i] ?? '' })
    return obj
  })
  return { headers, rows }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/lms/native/bulk/courses
// Bulk create native LMS courses from CSV text
// Expected CSV columns: code, title, academic_year, branch, semester
// ─────────────────────────────────────────────────────────────────────────────
router.post('/courses', async (req, res) => {
  const { csv_text } = req.body
  if (!csv_text) return res.status(400).json({ success: false, error: 'csv_text is required' })

  const { rows } = parseCSV(csv_text)
  if (!rows.length) return res.status(400).json({ success: false, error: 'No data rows found in CSV' })

  const errors = []
  const valid = []

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]
    const rowNum = i + 2
    if (!r.code)          { errors.push(`Row ${rowNum}: missing 'code'`); continue }
    if (!r.title)         { errors.push(`Row ${rowNum}: missing 'title'`); continue }
    if (!r.academic_year) { errors.push(`Row ${rowNum}: missing 'academic_year' (e.g. 2025-26)`); continue }
    if (!r.branch)        { errors.push(`Row ${rowNum}: missing 'branch'`); continue }
    const sem = parseInt(r.semester)
    if (isNaN(sem) || sem < 1 || sem > 12) { errors.push(`Row ${rowNum}: 'semester' must be 1-12`); continue }
    valid.push({
      code: r.code.toUpperCase(),
      title: r.title,
      academic_year: r.academic_year,
      branch: r.branch.toUpperCase(),
      semester: sem,
      is_published: r.is_published === 'true' || r.is_published === '1' || false,
      org_id: '00000000-0000-0000-0000-000000000001',
    })
  }

  if (!valid.length) return res.status(400).json({ success: false, errors, created: 0 })

  try {
    const { data, error } = await supabaseAdmin
      .from('lms_courses')
      .upsert(valid, { onConflict: 'code,academic_year' })
      .select()
    if (error) throw error
    res.json({ success: true, created: data.length, skipped: rows.length - valid.length, errors, data })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/lms/native/bulk/enrollments/:sectionId
// Bulk enroll students with roll numbers from CSV
// Expected CSV columns: roll_number, email (one identifier per row)
// Matches against users table by email or roll_number field
// ─────────────────────────────────────────────────────────────────────────────
router.post('/enrollments/:sectionId', async (req, res) => {
  const { csv_text } = req.body
  if (!csv_text) return res.status(400).json({ success: false, error: 'csv_text is required' })

  const { rows } = parseCSV(csv_text)
  if (!rows.length) return res.status(400).json({ success: false, error: 'No data rows found' })

  // Load all students to match
  const { data: allStudents } = await supabaseAdmin
    .from('users').select('id, email').eq('role', 'student')
  const emailMap = {}
  for (const s of allStudents || []) emailMap[s.email?.toLowerCase()] = s.id

  const errors = []
  const inserts = []

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]
    const rowNum = i + 2
    const email = r.email?.toLowerCase()
    const rollNum = r.roll_number || r.roll_no || r.rollnumber || ''

    const studentId = emailMap[email]
    if (!studentId) { errors.push(`Row ${rowNum}: no student found for email '${email}'`); continue }
    inserts.push({ section_id: req.params.sectionId, student_id: studentId, roll_number: rollNum || null, at_risk_status: 'safe' })
  }

  if (!inserts.length) return res.status(400).json({ success: false, errors, enrolled: 0 })

  try {
    const { data, error } = await supabaseAdmin
      .from('lms_enrollments')
      .upsert(inserts, { onConflict: 'section_id,student_id' })
      .select()
    if (error) throw error
    res.json({ success: true, enrolled: data.length, failed: errors.length, errors })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/lms/native/bulk/grades/:courseId
// Bulk import marks from CSV
// Expected CSV: roll_number or email, then one column per grade component name
// e.g.: roll_number,email,MST1,MST2,End Semester
// ─────────────────────────────────────────────────────────────────────────────
router.post('/grades/:courseId', async (req, res) => {
  const { csv_text } = req.body
  if (!csv_text) return res.status(400).json({ success: false, error: 'csv_text is required' })

  const { headers, rows } = parseCSV(csv_text)
  if (!rows.length) return res.status(400).json({ success: false, error: 'No data rows found' })

  // Check gradebook lock
  const { data: lockConfig } = await supabaseAdmin
    .from('lms_gradebook_config').select('is_locked').eq('course_id', req.params.courseId).single()
  if (lockConfig?.is_locked) return res.status(423).json({ success: false, error: 'Gradebook is locked. Use Admin override.' })

  // Load grade components for this course
  const { data: components } = await supabaseAdmin
    .from('lms_grade_components').select('*').eq('course_id', req.params.courseId).order('display_order')
  if (!components?.length) return res.status(400).json({ success: false, error: 'No grade components found for this course. Configure them first.' })

  // Match header columns to component names (case-insensitive)
  const compMap = {} // csv_column_name → component
  for (const comp of components) {
    const key = comp.name.toLowerCase().replace(/\s+/g, '_')
    if (headers.includes(key)) compMap[key] = comp
    // also try original name
    const orig = comp.name.toLowerCase()
    const altKey = headers.find(h => h === orig || h.replace(/_/g, ' ') === orig)
    if (altKey) compMap[altKey] = comp
  }
  if (!Object.keys(compMap).length) {
    return res.status(400).json({
      success: false,
      error: `No matching component columns found. CSV headers: [${headers.join(', ')}]. Component names: [${components.map(c=>c.name).join(', ')}]`
    })
  }

  // Load all enrollments for this course to match students
  const { data: sections } = await supabaseAdmin
    .from('lms_course_sections').select('id').eq('course_id', req.params.courseId)
  const sectionIds = (sections||[]).map(s=>s.id)
  const { data: enrollments } = await supabaseAdmin
    .from('lms_enrollments').select('student_id, roll_number, users!student_id(email)')
    .in('section_id', sectionIds)

  const rollMap = {}, emailMap2 = {}
  for (const enr of enrollments||[]) {
    if (enr.roll_number) rollMap[enr.roll_number.toLowerCase()] = enr.student_id
    if (enr.users?.email) emailMap2[enr.users.email.toLowerCase()] = enr.student_id
  }

  const errors = []
  const allInserts = {} // componentId → [{student_id, marks_obtained, ...}]
  for (const comp of components) allInserts[comp.id] = []

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]
    const rowNum = i + 2
    const roll = r.roll_number || r.roll_no || r.rollnumber || ''
    const email = r.email?.toLowerCase()

    const studentId = rollMap[roll?.toLowerCase()] || emailMap2[email]
    if (!studentId) { errors.push(`Row ${rowNum}: no enrolled student for roll='${roll}' email='${email}'`); continue }

    for (const [col, comp] of Object.entries(compMap)) {
      const raw = r[col]
      if (raw === '' || raw === undefined) continue
      const marks = parseFloat(raw)
      if (isNaN(marks)) { errors.push(`Row ${rowNum} col '${col}': '${raw}' is not a number`); continue }
      if (marks > comp.max_marks) { errors.push(`Row ${rowNum} col '${col}': ${marks} exceeds max ${comp.max_marks}`); continue }
      allInserts[comp.id].push({ component_id: comp.id, student_id: studentId, marks_obtained: marks, graded_at: new Date().toISOString() })
    }
  }

  let totalSaved = 0
  try {
    for (const [compId, insertRows] of Object.entries(allInserts)) {
      if (!insertRows.length) continue
      const { data, error } = await supabaseAdmin
        .from('lms_gradebook_entries')
        .upsert(insertRows, { onConflict: 'component_id,student_id' })
        .select()
      if (error) throw error
      totalSaved += data.length
    }
    res.json({ success: true, saved: totalSaved, failed: errors.length, errors })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/lms/native/bulk/attendance/:sectionId
// Bulk import historical attendance records from CSV
// Expected CSV: date, roll_number or email, status (P/A/L)
// ─────────────────────────────────────────────────────────────────────────────
router.post('/attendance/:sectionId', async (req, res) => {
  const { csv_text } = req.body
  if (!csv_text) return res.status(400).json({ success: false, error: 'csv_text is required' })

  const { rows } = parseCSV(csv_text)
  if (!rows.length) return res.status(400).json({ success: false, error: 'No data rows found' })

  // Load enrollments for this section
  const { data: enrollments } = await supabaseAdmin
    .from('lms_enrollments').select('student_id, roll_number, users!student_id(email)')
    .eq('section_id', req.params.sectionId)
  const rollMap = {}, emailMap = {}
  for (const enr of enrollments||[]) {
    if (enr.roll_number) rollMap[enr.roll_number.toLowerCase()] = enr.student_id
    if (enr.users?.email) emailMap[enr.users.email.toLowerCase()] = enr.student_id
  }

  // Group rows by date
  const byDate = {}
  const errors = []
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]
    const rowNum = i + 2
    const date = r.date
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) { errors.push(`Row ${rowNum}: invalid date '${date}'. Use YYYY-MM-DD`); continue }
    const status = (r.status || r.attendance || '').toUpperCase()
    if (!['P','A','L'].includes(status)) { errors.push(`Row ${rowNum}: status '${status}' must be P, A, or L`); continue }
    const roll = r.roll_number || r.roll_no || ''
    const email = r.email?.toLowerCase()
    const studentId = rollMap[roll?.toLowerCase()] || emailMap[email]
    if (!studentId) { errors.push(`Row ${rowNum}: no enrolled student for roll='${roll}'`); continue }
    if (!byDate[date]) byDate[date] = []
    byDate[date].push({ student_id: studentId, status })
  }

  let totalSessions = 0, totalRecords = 0
  try {
    for (const [date, records] of Object.entries(byDate)) {
      // Upsert session for that date
      const { data: session, error: se } = await supabaseAdmin
        .from('lms_attendance_sessions')
        .upsert({ section_id: req.params.sectionId, date, total_conducted_counter: 0, is_holiday: false }, { onConflict: 'section_id,date' })
        .select().single()
      if (se) { errors.push(`Session error for ${date}: ${se.message}`); continue }
      totalSessions++

      const inserts = records.map(r => ({
        session_id: session.id, student_id: r.student_id, status: r.status,
        marked_at: new Date().toISOString(),
      }))
      const { data: marked, error: me } = await supabaseAdmin
        .from('lms_attendance_records')
        .upsert(inserts, { onConflict: 'session_id,student_id' })
        .select()
      if (me) { errors.push(`Records error for ${date}: ${me.message}`); continue }
      totalRecords += marked.length

      // Update the counter for this session
      await supabaseAdmin.from('lms_attendance_sessions')
        .update({ total_conducted_counter: (await supabaseAdmin.from('lms_attendance_sessions').select('total_conducted_counter').eq('section_id', req.params.sectionId).order('date',{ascending:false}).limit(1).single()).data?.total_conducted_counter || totalSessions })
        .eq('id', session.id)
    }
    res.json({ success: true, sessions_created: totalSessions, records_saved: totalRecords, failed_rows: errors.length, errors })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/lms/native/bulk/templates/:type — download CSV template
// ─────────────────────────────────────────────────────────────────────────────
router.get('/templates/:type', (req, res) => {
  const templates = {
    courses: `code,title,academic_year,branch,semester,is_published\nUCS701,Theory of Computation,2025-26,CSE,7,false\nUCS703,Compiler Design,2025-26,CSE,7,false`,
    enrollments: `roll_number,email\n102183001,student1@thapar.edu\n102183002,student2@thapar.edu`,
    grades: `roll_number,email,MST1,MST2,End Semester\n102183001,student1@thapar.edu,14,13,52\n102183002,student2@thapar.edu,12,15,48`,
    attendance: `date,roll_number,email,status\n2026-02-03,102183001,student1@thapar.edu,P\n2026-02-03,102183002,student2@thapar.edu,A\n2026-02-05,102183001,student1@thapar.edu,L`,
  }
  const csv = templates[req.params.type]
  if (!csv) return res.status(404).json({ success: false, error: 'Unknown template type' })
  res.setHeader('Content-Type', 'text/csv')
  res.setHeader('Content-Disposition', `attachment; filename="template_${req.params.type}.csv"`)
  res.send(csv)
})

export default router
