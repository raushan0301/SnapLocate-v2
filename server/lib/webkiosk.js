/**
 * Thapar WebKiosk Scraper — webkiosk.thapar.edu (JSP)
 *
 * Fixed login flow:
 *   1. GET /index.jsp  → capture JSESSIONID + hidden fields
 *   2. POST /index.jsp → type=S  loginid=ENROLL  passwd=PASS
 *   3. Verify session by visiting /StudentFiles/StudentPage.jsp
 *
 * All data pages:
 *   /StudentFiles/StudentPage.jsp              — Personal Info
 *   /StudentFiles/StudentAttendanceDetails.jsp — Attendance
 *   /StudentFiles/StudentResultDetails.jsp     — Result / CGPA
 *   /StudentFiles/FeeDetails.jsp               — Fee records
 *   /StudentFiles/StudentRegisteredCourses.jsp — Registered courses
 *   /StudentFiles/StudentTimeTable.jsp         — Timetable
 *   /StudentFiles/StudentExamSchedule.jsp      — Exam schedule  (tries multiple paths)
 */

import axios    from 'axios'
import * as cheerio from 'cheerio'
import crypto   from 'crypto'
import https    from 'https'
import { supabaseAdmin } from './supabase.js'

const THAPAR_BASE = 'https://webkiosk.thapar.edu'

// Relaxed HTTPS agent — Thapar's cert sometimes fails strict validation
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
  keepAlive: true,
})

// ─── Encryption helpers (kept for admin-level sync compat) ─────────
const ALGORITHM = 'aes-256-gcm'
const encKey = () =>
  Buffer.from(process.env.SYNC_ENCRYPTION_KEY || 'default_key_32bytes_placeholder!!', 'utf8').slice(0, 32)

function encrypt(text) {
  const iv     = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(ALGORITHM, encKey(), iv)
  const enc    = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
  const tag    = cipher.getAuthTag()
  return `${iv.toString('hex')}:${tag.toString('hex')}:${enc.toString('hex')}`
}

function decrypt(ciphertext) {
  const [ivHex, tagHex, encHex] = ciphertext.split(':')
  const dec = crypto.createDecipheriv(ALGORITHM, encKey(), Buffer.from(ivHex, 'hex'))
  dec.setAuthTag(Buffer.from(tagHex, 'hex'))
  return Buffer.concat([dec.update(Buffer.from(encHex, 'hex')), dec.final()]).toString('utf8')
}

export const encryptCredentials = (creds) => ({ encrypted: encrypt(JSON.stringify(creds)) })
export const redactConfig = (config) => {
  const { credentials_json, ...safe } = config
  return { ...safe, credentials_json: { configured: !!credentials_json?.encrypted } }
}

// ─── Thapar WebKiosk Scraper ──────────────────────────────────────
export class ThaparWebKioskScraper {
  constructor() {
    this._cookies = {}   // cookie jar as key→value map
    this.client = axios.create({
      baseURL:        THAPAR_BASE,
      timeout:        45_000,        // generous timeout
      maxRedirects:   15,
      httpsAgent,
      validateStatus: () => true,    // don't throw on 3xx/4xx
      headers: {
        'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept':          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection':      'keep-alive',
        'Cache-Control':   'max-age=0',
        'Upgrade-Insecure-Requests': '1',
      },
    })

    // Accumulate cookies across all responses
    this.client.interceptors.response.use(res => {
      for (const raw of res.headers['set-cookie'] || []) {
        const [pair] = raw.split(';')
        const eqIdx = pair.indexOf('=')
        if (eqIdx < 1) continue
        const k = pair.slice(0, eqIdx).trim()
        const v = pair.slice(eqIdx + 1).trim()
        this._cookies[k] = v
      }
      this._applyCookies()
      return res
    })
  }

  _applyCookies() {
    const str = Object.entries(this._cookies)
      .map(([k, v]) => `${k}=${v}`)
      .join('; ')
    this.client.defaults.headers['Cookie'] = str
  }

  // ── Login to WebKiosk ─────────────────────────────────────────
  async login(enrollmentNo, password) {
    const enroll = String(enrollmentNo).trim().toUpperCase()
    const pass   = String(password).trim()

    // Step 1 — GET login page to establish initial session cookie
    try {
      await this.client.get('/index.jsp')
    } catch {
      // Non-fatal — continue anyway
    }

    /**
     * Real Thapar WebKiosk form (from HTML inspection):
     *   <form action="CommonFiles/UserAction.jsp" name="LoginForm">
     *     <select name="UserType">  ← S=Student, P=Parent
     *     <input name="MemberCode"> ← Enrollment number
     *     <input name="Password">   ← Password
     *   </form>
     */
    const formData = new URLSearchParams({
      UserType:   'S',
      MemberCode: enroll,
      Password:   pass,
      BTNSubmit:  'Submit',
    })

    // POST to the actual form action endpoint
    const loginRes = await this.client.post('/CommonFiles/UserAction.jsp', formData.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Referer':      `${THAPAR_BASE}/index.jsp`,
        'Origin':       THAPAR_BASE,
      },
      maxRedirects: 15,
    })

    const loginHtml = (loginRes.data || '').toString()
    const loginText = loginHtml.toLowerCase()

    // Detect explicit failure messages
    if (
      loginText.includes('invalid') ||
      loginText.includes('incorrect') ||
      loginText.includes('wrong') ||
      loginText.includes('does not exist') ||
      loginText.includes('authentication failed') ||
      loginText.includes('please enter') ||
      (loginText.includes('login') && loginText.includes('error'))
    ) {
      throw new Error('Invalid enrollment number or password. Please check your credentials.')
    }

    // Step 3 — Verify session by hitting the student page
    const verifyRes = await this.client.get('/StudentFiles/StudentPage.jsp', {
      headers: { 'Referer': loginRes.request?.res?.responseUrl || `${THAPAR_BASE}/CommonFiles/UserAction.jsp` },
    })

    const verifyHtml = (verifyRes.data || '').toString()
    const verifyText = verifyHtml.toLowerCase()

    // If redirected back to login, session failed
    const finalUrl = verifyRes.request?.res?.responseUrl || ''
    const isLoginPage =
      finalUrl.includes('index.jsp') ||
      finalUrl.includes('UserAction') ||
      verifyText.includes('membercode') ||
      verifyText.includes('please login') ||
      (verifyText.includes('login') && !verifyText.includes('logout'))

    if (isLoginPage) {
      throw new Error(
        'Login failed — could not establish a session. ' +
        'Please verify your enrollment number and password are correct.'
      )
    }

    return true
  }

  // ── Internal fetch helper ─────────────────────────────────────
  async _get(path) {
    const res = await this.client.get(path, {
      headers: { 'Referer': `${THAPAR_BASE}/StudentFiles/StudentPage.jsp` },
    })

    // If redirected back to login page — session expired
    const finalUrl = res.request?.res?.responseUrl || ''
    if (finalUrl.includes('index.jsp') && !path.includes('index.jsp')) {
      throw new Error(`Session expired while fetching ${path}`)
    }

    return res.data || ''
  }

  // ── Table parsing helpers ─────────────────────────────────────
  _largestTable($) {
    let best = { len: 0, el: null }
    $('table').each((_, t) => {
      const rowCount = $(t).find('tr').length
      if (rowCount > best.len) { best.len = rowCount; best.el = t }
    })
    return best.el
  }

  _parseTable($, tableEl) {
    if (!tableEl) return { headers: [], rows: [] }
    const allRows = []
    $(tableEl).find('tr').each((_, tr) => {
      const cells = []
      $(tr).find('td, th').each((_, td) => {
        cells.push($(td).text().replace(/\s+/g, ' ').trim())
      })
      if (cells.length > 0 && cells.some(c => c)) allRows.push(cells)
    })
    if (!allRows.length) return { headers: [], rows: [] }

    // First non-empty row treated as header if it contains non-numeric labels
    const firstRow    = allRows[0]
    const isHeaderRow = firstRow.every(c => !c || isNaN(Number(c)) || c === '')
    const headers     = isHeaderRow ? firstRow : []
    const rows        = isHeaderRow ? allRows.slice(1) : allRows
    return { headers, rows }
  }

  _colIdx(headers, ...keywords) {
    for (const kw of keywords) {
      const idx = headers.findIndex(h => h.toLowerCase().includes(kw.toLowerCase()))
      if (idx >= 0) return idx
    }
    return -1
  }

  // ── Fetch: Student Profile ────────────────────────────────────
  async fetchProfile() {
    const html = await this._get('/StudentFiles/StudentPage.jsp')
    const $    = cheerio.load(html)

    const kv = {}
    // Parse key-value pairs from all tables
    $('table tr').each((_, tr) => {
      const tds = $(tr).find('td')
      if (tds.length < 2) return
      const key   = $(tds.eq(0)).text().replace(/[:\s]+$/, '').replace(/\s+/g, ' ').trim()
      // Take last td as value (handles key | : | value triplets)
      const value = $(tds.last()).text().replace(/\s+/g, ' ').trim()
      if (key && value && key !== value && key.length < 80) {
        kv[key] = value
      }
    })

    const g = (...keys) => keys.reduce((acc, k) => acc || kv[k] || '', '')

    // Photo
    const photoSrc = (
      $('img[src*="Photo" i], img[src*="student" i], img[src*="photo" i]').first().attr('src') || ''
    )

    return {
      name:           g('Name', 'Student Name', 'STUDENT NAME', 'Full Name'),
      enrollmentNo:   g('Enrollment No', 'Enrollment Number', 'EnrollmentNo', 'Enroll No'),
      rollNo:         g('Roll No', 'Roll Number', 'RollNo'),
      dateOfBirth:    g('Date of Birth', 'DOB', 'Date Of Birth'),
      fatherName:     g("Father's Name", 'Father Name', 'FatherName', "Father 's Name"),
      motherName:     g("Mother's Name", 'Mother Name', 'MotherName', "Mother 's Name"),
      program:        g('Program', 'Programme', 'Course'),
      branch:         g('Branch', 'Department', 'Discipline'),
      section:        g('Section', 'Sec'),
      semester:       g('Semester', 'Current Semester', 'Sem'),
      batchYear:      g('Batch Year', 'Batch', 'Year of Admission', 'Admission Year'),
      category:       g('Category', 'Caste'),
      bloodGroup:     g('Blood Group', 'Blood'),
      email:          g('Email', 'E-Mail', 'Email ID'),
      mobile:         g('Mobile No', 'Mobile Number', 'Contact No', 'Phone'),
      address:        g('Permanent Address', 'Address', 'Local Address'),
      photoUrl:       photoSrc
        ? (photoSrc.startsWith('http') ? photoSrc : `${THAPAR_BASE}/${photoSrc.replace(/^\//, '')}`)
        : null,
      raw: kv,
    }
  }

  // ── Fetch: Attendance ─────────────────────────────────────────
  async fetchAttendance() {
    const html     = await this._get('/StudentFiles/StudentAttendanceDetails.jsp')
    const $        = cheerio.load(html)
    const tableEl  = this._largestTable($)
    const { headers, rows } = this._parseTable($, tableEl)

    if (!rows.length) return []

    const ci = (...kw) => this._colIdx(headers, ...kw)
    const codeI = ci('code', 'subject code')
    const nameI = ci('subject name', 'course name', 'subject', 'name', 'title')
    const totI  = ci('total', 'held', 'conducted', 'classes held')
    const preI  = ci('present', 'attended', 'lectures attended')
    const absI  = ci('absent')
    const pctI  = ci('%', 'percent', 'attendance %', 'attendance')

    return rows
      .map((cols, idx) => {
        const get  = (i, fb) => (i >= 0 ? cols[i] : cols[fb]) || ''
        const asInt = s => parseInt((s || '').replace(/\D/g, '')) || 0
        const asFlt = s => parseFloat((s || '').replace(/[^\d.]/g, '')) || 0

        const total   = asInt(get(totI, 2))
        const present = asInt(get(preI, 3))
        const absent  = absI >= 0 ? asInt(get(absI, 4)) : total - present
        let   pct     = pctI >= 0 ? asFlt(get(pctI, 5)) : 0
        if (!pct && total > 0) pct = parseFloat((present / total * 100).toFixed(1))

        return {
          sno:         idx + 1,
          courseCode:  get(codeI, 0).trim() || get(codeI, 1).trim(),
          courseName:  get(nameI, 1).trim(),
          total,
          present,
          absent,
          percentage:  pct,
        }
      })
      .filter(r => r.courseCode || r.courseName)
  }

  // ── Fetch: Result / Marks ─────────────────────────────────────
  async fetchResult() {
    const html = await this._get('/StudentFiles/StudentResultDetails.jsp')
    const $    = cheerio.load(html)
    const text = $.text()

    // Extract CGPA / SGPA anywhere in the page text
    const matchNum = (rx) => { const m = text.match(rx); return m ? parseFloat(m[1]) : null }
    const cgpa = matchNum(/CGPA\s*[:\-\s]+(\d+\.\d+)/i) || matchNum(/CGPA\s*(\d+\.\d+)/i)
    const sgpa = matchNum(/SGPA\s*[:\-\s]+(\d+\.\d+)/i) || matchNum(/SGPA\s*(\d+\.\d+)/i)

    // Parse semester-wise result table
    const tableEl = this._largestTable($)
    const { headers, rows } = this._parseTable($, tableEl)

    // Also extract subject-wise marks if available in smaller tables
    const subjectMarks = []
    $('table').each((_, t) => {
      const trows = []
      $(t).find('tr').each((_, tr) => {
        const cells = []
        $(tr).find('td,th').each((_, td) => cells.push($(td).text().replace(/\s+/g, ' ').trim()))
        if (cells.some(c => c)) trows.push(cells)
      })
      if (trows.length < 2) return
      const hdr = trows[0]
      // Look for marks tables
      const isMid   = hdr.some(h => /mid/i.test(h))
      const isMarks = hdr.some(h => /marks|grade|subject/i.test(h))
      if (!isMarks) return
      trows.slice(1).forEach(cols => {
        if (!cols.some(c => c)) return
        subjectMarks.push({ type: isMid ? 'mid' : 'end', cols })
      })
    })

    return {
      cgpa,
      sgpa,
      headers,
      rows: rows.filter(r => r.some(c => c)),
      subjectMarks,
    }
  }

  // ── Fetch: Registered Courses ─────────────────────────────────
  async fetchRegisteredCourses() {
    const html    = await this._get('/StudentFiles/StudentRegisteredCourses.jsp')
    const $       = cheerio.load(html)
    const tableEl = this._largestTable($)
    const { headers, rows } = this._parseTable($, tableEl)
    if (!rows.length) return []

    const ci     = (...kw) => this._colIdx(headers, ...kw)
    const codeI  = ci('code', 'course code', 'sub code')
    const nameI  = ci('name', 'subject name', 'course title', 'title')
    const credI  = ci('credit', 'ch', 'unit', 'credits')
    const facI   = ci('faculty', 'teacher', 'instructor', 'professor', 'instructor name')

    return rows
      .map(cols => ({
        code:    (codeI >= 0 ? cols[codeI] : cols[0] || cols[1] || '').trim(),
        name:    (nameI >= 0 ? cols[nameI] : cols[2] || '').trim(),
        credits: parseFloat((credI >= 0 ? cols[credI] : cols[3] || '').replace(/\D/g, '')) || 0,
        faculty: (facI  >= 0 ? cols[facI]  : cols[4] || '').trim(),
      }))
      .filter(r => r.code || r.name)
  }

  // ── Fetch: Fee Details ────────────────────────────────────────
  async fetchFees() {
    const html    = await this._get('/StudentFiles/FeeDetails.jsp')
    const $       = cheerio.load(html)
    const text    = $.text()
    const tableEl = this._largestTable($)
    const { headers, rows } = this._parseTable($, tableEl)

    const toNum = s => parseFloat((s || '').replace(/[^\d.]/g, '')) || 0
    const ci    = (...kw) => this._colIdx(headers, ...kw)

    const semI  = ci('sem', 'semester')
    const typeI = ci('type', 'fee type', 'particular', 'description')
    const dueI  = ci('due', 'demand', 'amount due', 'required')
    const paidI = ci('paid', 'deposited', 'amount paid', 'receipt')
    const balI  = ci('balance', 'remaining', 'arrear')
    const stI   = ci('status', 'remark')

    const records = rows
      .map(cols => ({
        semester:   parseInt((semI >= 0 ? cols[semI] : cols[0] || '').replace(/\D/g, '')) || null,
        feeType:    (typeI >= 0 ? cols[typeI] : cols[1] || 'tuition').trim(),
        amountDue:  toNum(dueI  >= 0 ? cols[dueI]  : cols[2]),
        amountPaid: toNum(paidI >= 0 ? cols[paidI] : cols[3]),
        balance:    balI >= 0 ? toNum(cols[balI]) : null,
        status:     (stI >= 0 ? cols[stI] : '').trim() || 'pending',
      }))
      .filter(r => r.amountDue > 0 || r.amountPaid > 0)

    const totalDue  = records.reduce((s, r) => s + r.amountDue,  0)
    const totalPaid = records.reduce((s, r) => s + r.amountPaid, 0)

    return {
      records,
      summary: {
        totalDue,
        totalPaid,
        balance: totalDue - totalPaid,
      },
    }
  }

  // ── Fetch: Timetable ──────────────────────────────────────────
  async fetchTimetable() {
    try {
      const html    = await this._get('/StudentFiles/StudentTimeTable.jsp')
      const $       = cheerio.load(html)
      const tableEl = this._largestTable($)
      const { headers, rows } = this._parseTable($, tableEl)

      // Build structured timetable: days × time slots
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      const structured = []

      rows.forEach(row => {
        if (!row.some(c => c)) return
        const dayCell = row[0] || ''
        const dayName = days.find(d => dayCell.toLowerCase().includes(d.toLowerCase().slice(0, 3)))
        if (!dayName && row.length < 3) return

        // Each remaining cell is a time slot
        for (let i = 1; i < row.length; i++) {
          const slot = row[i]?.trim()
          if (!slot) continue
          structured.push({
            day:  dayName || dayCell,
            slot: headers[i] || `Slot ${i}`,
            subject: slot,
          })
        }
      })

      return {
        raw: { headers, rows: rows.filter(r => r.some(c => c)) },
        structured: structured.filter(s => s.subject && s.subject !== '—'),
      }
    } catch (e) {
      return { raw: { headers: [], rows: [] }, structured: [] }
    }
  }

  // ── Fetch: Exam Schedule ──────────────────────────────────────
  async fetchExamSchedule() {
    // Try multiple possible paths
    const paths = [
      '/StudentFiles/StudentExamSchedule.jsp',
      '/StudentFiles/ExamSchedule.jsp',
      '/StudentFiles/StudentExamDetails.jsp',
      '/StudentFiles/Examination.jsp',
    ]

    for (const path of paths) {
      try {
        const html = await this._get(path)
        const $ = cheerio.load(html)

        // Skip if redirected back to login
        if ($.text().toLowerCase().includes('loginid')) continue

        const tableEl = this._largestTable($)
        const { headers, rows } = this._parseTable($, tableEl)
        if (!rows.length) continue

        const ci       = (...kw) => this._colIdx(headers, ...kw)
        const dateI    = ci('date', 'exam date', 'date of exam')
        const codeI    = ci('code', 'course code', 'subject code')
        const nameI    = ci('name', 'subject', 'course', 'title')
        const timeI    = ci('time', 'start time', 'timing')
        const venueI   = ci('venue', 'room', 'hall', 'centre')
        const typeI    = ci('type', 'exam type')

        const exams = rows
          .map(cols => ({
            date:      (dateI  >= 0 ? cols[dateI]  : cols[0] || '').trim(),
            courseCode:(codeI  >= 0 ? cols[codeI]  : cols[1] || '').trim(),
            courseName:(nameI  >= 0 ? cols[nameI]  : cols[2] || '').trim(),
            time:      (timeI  >= 0 ? cols[timeI]  : cols[3] || '').trim(),
            venue:     (venueI >= 0 ? cols[venueI] : cols[4] || '').trim(),
            examType:  (typeI  >= 0 ? cols[typeI]  : '').trim() || 'end',
          }))
          .filter(r => r.date || r.courseCode || r.courseName)

        if (exams.length > 0) return exams
      } catch {}
    }

    return []
  }

  // ── Logout ────────────────────────────────────────────────────
  async logout() {
    for (const path of ['/Logout.jsp', '/logout.do', '/LogOff.jsp', '/StudentFiles/Logout.jsp']) {
      try { await this.client.get(path) } catch {}
    }
    this._cookies = {}
  }
}

export const WebKioskScraper = ThaparWebKioskScraper

// ─── Per-Student Sync (called by API route) ────────────────────────
export async function runStudentWebKioskSync(userId) {
  // Load ANY config row for this user (webkiosk creds may live in a Moodle row)
  const { data: config } = await supabaseAdmin
    .from('student_sync_config')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (!config) throw new Error('No config found. Please connect WebKiosk first.')

  // Credentials stored under credentials_json.webkiosk (nested)
  // or top-level if this is a pure webkiosk-provider row
  const creds =
    config.credentials_json?.webkiosk ||
    (config.provider === 'webkiosk' ? config.credentials_json : null)

  if (!creds?.username || !creds?.password) {
    throw new Error('No WebKiosk credentials found. Please reconnect WebKiosk.')
  }

  const log    = []
  let   status = 'success'
  const data   = {}

  // Mark as running immediately (no provider filter — row may be Moodle-owned)
  await supabaseAdmin
    .from('student_sync_config')
    .update({ last_sync_status: 'running' })
    .eq('user_id', userId)

  try {
    const scraper = new ThaparWebKioskScraper()

    log.push(`[${ts()}] Connecting to Thapar WebKiosk...`)
    await scraper.login(creds.username, creds.password)
    log.push(`[${ts()}] ✓ Login successful`)

    // Parallel fetch all modules (each is independent — don't let one block others)
    const [profRes, attRes, resultRes, coursesRes, feesRes, ttRes, examRes] =
      await Promise.allSettled([
        scraper.fetchProfile(),
        scraper.fetchAttendance(),
        scraper.fetchResult(),
        scraper.fetchRegisteredCourses(),
        scraper.fetchFees(),
        scraper.fetchTimetable(),
        scraper.fetchExamSchedule(),
      ])

    // Process each result
    if (profRes.status === 'fulfilled') {
      data.profile = profRes.value
      log.push(`[${ts()}] ✓ Profile: ${profRes.value.name || 'N/A'}`)
      // Mirror into student_profiles table
      await supabaseAdmin.from('student_profiles').upsert({
        user_id:       userId,
        enrollment_no: profRes.value.enrollmentNo || creds.username,
        roll_no:       profRes.value.rollNo  || null,
        branch:        profRes.value.branch  || null,
        dept:          profRes.value.branch  || null,
        section:       profRes.value.section || null,
        batch_year:    parseInt(profRes.value.batchYear) || null,
        updated_at:    new Date().toISOString(),
      }, { onConflict: 'user_id' }).catch(() => {})
    } else {
      log.push(`[${ts()}] ✗ Profile: ${profRes.reason?.message}`)
      status = 'partial'
    }

    if (attRes.status === 'fulfilled') {
      data.attendance = attRes.value
      log.push(`[${ts()}] ✓ Attendance: ${attRes.value.length} subjects`)
    } else {
      log.push(`[${ts()}] ✗ Attendance: ${attRes.reason?.message}`)
      status = 'partial'
    }

    if (resultRes.status === 'fulfilled') {
      data.result = resultRes.value
      log.push(`[${ts()}] ✓ Result: CGPA=${resultRes.value.cgpa ?? '—'}, SGPA=${resultRes.value.sgpa ?? '—'}`)
      if (resultRes.value.cgpa) {
        await supabaseAdmin.from('student_profiles').upsert({
          user_id:      userId,
          current_cgpa: resultRes.value.cgpa,
          updated_at:   new Date().toISOString(),
        }, { onConflict: 'user_id' }).catch(() => {})
      }
    } else {
      log.push(`[${ts()}] ✗ Result: ${resultRes.reason?.message}`)
      status = 'partial'
    }

    if (coursesRes.status === 'fulfilled') {
      data.registeredCourses = coursesRes.value
      log.push(`[${ts()}] ✓ Registered Courses: ${coursesRes.value.length}`)
    } else {
      log.push(`[${ts()}] ✗ Courses: ${coursesRes.reason?.message}`)
    }

    if (feesRes.status === 'fulfilled') {
      data.fees = feesRes.value
      log.push(`[${ts()}] ✓ Fees: ₹${feesRes.value.summary.balance.toLocaleString()} balance`)
    } else {
      log.push(`[${ts()}] ✗ Fees: ${feesRes.reason?.message}`)
      status = 'partial'
    }

    if (ttRes.status === 'fulfilled') {
      data.timetable = ttRes.value
      log.push(`[${ts()}] ✓ Timetable: ${ttRes.value.structured?.length || 0} slots`)
    } else {
      log.push(`[${ts()}] ✗ Timetable: ${ttRes.reason?.message}`)
    }

    if (examRes.status === 'fulfilled') {
      data.examSchedule = examRes.value
      log.push(`[${ts()}] ✓ Exam Schedule: ${examRes.value.length} exams`)
    } else {
      log.push(`[${ts()}] ✗ Exam Schedule: ${examRes.reason?.message}`)
    }

    await scraper.logout().catch(() => {})
    log.push(`[${ts()}] Sync complete`)

  } catch (err) {
    status = 'failed'
    log.push(`[${ts()}] ✗ Fatal: ${err.message}`)
    console.error('[WebKiosk Sync]', err)
  }

  // Persist everything — store under 'webkiosk' key to preserve other providers' data
  // First read existing log to merge
  const { data: currentRow } = await supabaseAdmin
    .from('student_sync_config')
    .select('last_sync_log')
    .eq('user_id', userId)
    .maybeSingle()

  let existingLog = {}
  try { existingLog = JSON.parse(currentRow?.last_sync_log || '{}') } catch {}
  // If old format (flat, no provider key), clear it — it was old webkiosk data
  if (existingLog.log !== undefined && !existingLog.webkiosk) existingLog = {}

  const mergedLog = {
    ...existingLog,
    webkiosk: { log: log.join('\n'), data, synced_at: new Date().toISOString() },
  }

  await supabaseAdmin
    .from('student_sync_config')
    .update({
      last_synced_at:   new Date().toISOString(),
      last_sync_status: status,
      last_sync_log:    JSON.stringify(mergedLog),
    })
    .eq('user_id', userId)   // no provider filter — match any row for this user

  return { status, log, data }
}

function ts() {
  return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

// ─── Admin-level sync (unchanged API contract) ────────────────────
export async function runWebKioskSync() {
  const { data: configs = [] } = await supabaseAdmin
    .from('external_sync_config')
    .select('*')
    .eq('provider', 'webkiosk')
    .eq('is_active', true)

  for (const config of configs) {
    const log = []; let status = 'success'
    try {
      let creds = {}
      try { creds = JSON.parse(decrypt(config.credentials_json?.encrypted)) } catch {
        throw new Error('Could not decrypt credentials.')
      }
      const scraper = new ThaparWebKioskScraper()
      log.push('Logging in...')
      await scraper.login(creds.username, creds.password)
      log.push('✓ Login OK')
      const [att, res, fees] = await Promise.allSettled([
        scraper.fetchAttendance(),
        scraper.fetchResult(),
        scraper.fetchFees(),
      ])
      if (att.status  === 'fulfilled') log.push(`Attendance: ${att.value.length}`)
      else { log.push(`Attendance fail: ${att.reason?.message}`); status = 'partial' }
      if (res.status  === 'fulfilled') log.push(`CGPA: ${res.value.cgpa}`)
      else { log.push(`Result fail: ${res.reason?.message}`); status = 'partial' }
      if (fees.status === 'fulfilled') log.push(`Fees: ${fees.value.records.length}`)
      else { log.push(`Fees fail: ${fees.reason?.message}`); status = 'partial' }
      await scraper.logout().catch(() => {})
    } catch (err) {
      status = 'failed'; log.push(`Error: ${err.message}`)
    }
    await supabaseAdmin
      .from('external_sync_config')
      .update({ last_synced_at: new Date().toISOString(), last_sync_status: status, last_sync_log: log.join('\n') })
      .eq('id', config.id)
  }
}
