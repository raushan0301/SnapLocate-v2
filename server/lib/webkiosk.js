/**
 * Thapar WebKiosk Scraper  (webkiosk.thapar.edu — JSP-based)
 *
 *  Login  : POST /index.jsp   type=S  loginid=ENROLL  passwd=PASS
 *  Session: JSESSIONID cookie (auto-propagated)
 *  Data   : /StudentFiles/*.jsp
 */
import axios    from 'axios'
import * as cheerio from 'cheerio'
import crypto   from 'crypto'
import https    from 'https'
import { supabaseAdmin } from './supabase.js'

const THAPAR_BASE = 'https://webkiosk.thapar.edu'
const httpsAgent  = new https.Agent({ rejectUnauthorized: false })

// ─── Encryption ───────────────────────────────────────────────────
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

// ─── Thapar WebKiosk Scraper (JSP) ───────────────────────────────
export class ThaparWebKioskScraper {
  constructor() {
    this._cookie = {}
    this.client  = axios.create({
      baseURL:        THAPAR_BASE,
      timeout:        30_000,
      maxRedirects:   10,
      httpsAgent,
      validateStatus: () => true,
      headers: {
        'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept':          'text/html,application/xhtml+xml,*/*;q=0.9',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control':   'no-cache',
      },
    })

    // Auto-accumulate Set-Cookie headers
    this.client.interceptors.response.use(res => {
      const setCookies = res.headers['set-cookie'] || []
      for (const c of setCookies) {
        const [pair] = c.split(';')
        const [k, v] = pair.split('=')
        if (k) this._cookie[k.trim()] = (v || '').trim()
      }
      this.client.defaults.headers['Cookie'] =
        Object.entries(this._cookie).map(([k, v]) => `${k}=${v}`).join('; ')
      return res
    })
  }

  // ── Login ───────────────────────────────────────────────────────
  async login(enrollmentNo, password) {
    // 1. GET login page — capture any hidden ASP/JSP ViewState fields
    let hiddenFields = {}
    try {
      const getRes = await this.client.get('/index.jsp')
      const $ = cheerio.load(getRes.data)
      $('input[type=hidden]').each((_, el) => {
        const name = $(el).attr('name')
        const val  = $(el).attr('value') || ''
        if (name) hiddenFields[name] = val
      })
    } catch { /* ignore — we'll try without hidden fields */ }

    // 2. POST credentials
    const form = new URLSearchParams({
      ...hiddenFields,
      type:    'S',
      loginid: String(enrollmentNo).trim(),
      passwd:  String(password).trim(),
    })

    const res = await this.client.post('/index.jsp', form, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })

    const html = res.data || ''
    const text = html.toLowerCase()

    // Detect explicit failure messages
    if (
      text.includes('invalid login') ||
      text.includes('incorrect password') ||
      text.includes('wrong password') ||
      text.includes('login failed') ||
      text.includes('authentication failed') ||
      text.includes('कृपया') // Hindi error messages
    ) {
      throw new Error('Invalid enrollment number or password. Please verify your credentials.')
    }

    // SUCCESS indicator: JSESSIONID cookie was set, or page changed to student data
    const hasSession =
      this._cookie['JSESSIONID'] ||
      text.includes('studentpage') ||
      text.includes('student personal information') ||
      text.includes('tiet [')

    if (!hasSession) {
      // One more attempt with a slightly different form field name
      const form2 = new URLSearchParams({
        ...hiddenFields,
        type:      'S',
        LoginId:   String(enrollmentNo).trim(),
        Password:  String(password).trim(),
      })
      const res2 = await this.client.post('/index.jsp', form2, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
      if (!this._cookie['JSESSIONID']) {
        throw new Error(
          'Login unsuccessful — session not established. ' +
          'This may be caused by a CAPTCHA or incorrect credentials. ' +
          'Please verify your enrollment number and password.'
        )
      }
    }

    return true
  }

  // ── Fetch a JSP page (after login) ─────────────────────────────
  async _fetch(path) {
    const res = await this.client.get(path)
    const url = res.request?.res?.responseUrl || ''
    if (url.includes('index.jsp') && !path.includes('index.jsp')) {
      throw new Error(`Session expired or page ${path} requires re-login.`)
    }
    return res.data || ''
  }

  // ── Generic helpers ─────────────────────────────────────────────
  _largest_table($) {
    let best = { len: 0, el: null }
    $('table').each((_, t) => {
      const len = $(t).find('tr').length
      if (len > best.len) { best.len = len; best.el = t }
    })
    return best.el
  }

  _table_data($, tableEl) {
    const headers = []
    const rows    = []
    $(tableEl).find('tr').each((i, tr) => {
      const cells = []
      $(tr).find('td, th').each((_, td) =>
        cells.push($(td).text().replace(/\s+/g, ' ').trim())
      )
      if (!cells.some(c => c)) return
      if (i === 0 || !rows.length && cells.every((c, ci) => !parseFloat(c) && ci > 0))
        headers.push(...cells)
      else rows.push(cells)
    })
    return { headers, rows }
  }

  _hi(headers, ...keywords) {
    for (const kw of keywords) {
      const i = headers.findIndex(h => h.toLowerCase().includes(kw.toLowerCase()))
      if (i >= 0) return i
    }
    return -1
  }

  // ── Student Personal Information ────────────────────────────────
  async fetchProfile() {
    const html = await this._fetch('/StudentFiles/StudentPage.jsp')
    const $ = cheerio.load(html)

    const kv = {}
    $('table tr').each((_, tr) => {
      const tds = $(tr).find('td')
      if (tds.length < 2) return
      const key   = $(tds.first()).text().replace(/[:*]+$/, '').replace(/\s+/g, ' ').trim()
      const value = $(tds.last()).text().replace(/\s+/g, ' ').trim()
      if (key && value && key !== value && key.length < 60) kv[key] = value
    })

    const g  = (...keys) => keys.reduce((v, k) => v || kv[k] || '', '')
    const photoEl = $('img[src*="photo" i], img[src*="Photo"], img[src*="student" i]').first()
    const photoSrc = photoEl.attr('src') || ''

    return {
      name:             g('Name', 'Student Name', 'STUDENT NAME'),
      enrollmentNo:     g('Enrollment No', 'Enrollment Number', 'EnrollmentNo'),
      rollNo:           g('Roll No', 'Roll Number', 'RollNo'),
      dateOfBirth:      g('Date of Birth', 'DOB', 'Birth Date'),
      fatherName:       g("Father's Name", 'Father Name', 'FatherName'),
      motherName:       g("Mother's Name", 'Mother Name', 'MotherName'),
      program:          g('Program', 'Course', 'Programme'),
      branch:           g('Branch', 'Department', 'Discipline'),
      section:          g('Section', 'Sec'),
      semester:         g('Semester', 'Current Semester', 'Sem'),
      batchYear:        g('Batch Year', 'Batch', 'Year of Admission', 'Admission Year'),
      category:         g('Category', 'Caste'),
      bloodGroup:       g('Blood Group', 'Blood'),
      email:            g('Email', 'E-Mail', 'Email ID'),
      mobile:           g('Mobile No', 'Mobile Number', 'Contact No', 'Phone'),
      address:          g('Permanent Address', 'Address', 'Local Address'),
      photoUrl:         photoSrc
        ? (photoSrc.startsWith('http') ? photoSrc : `${THAPAR_BASE}/${photoSrc.replace(/^\//, '')}`)
        : null,
      raw: kv,
    }
  }

  // ── Attendance ──────────────────────────────────────────────────
  async fetchAttendance() {
    const html = await this._fetch('/StudentFiles/StudentAttendanceDetails.jsp')
    const $ = cheerio.load(html)
    const tableEl = this._largest_table($)
    if (!tableEl) return []
    const { headers, rows } = this._table_data($, tableEl)
    if (!headers.length && !rows.length) return []

    const hi = (...kw) => this._hi(headers, ...kw)
    const codeI = hi('code', 'subject code', 'sub code')
    const nameI = hi('name', 'subject', 'title', 'course')
    const totI  = hi('total', 'held', 'conducted')
    const preI  = hi('present', 'attended', 'attend')
    const absI  = hi('absent')
    const pctI  = hi('%', 'percent', 'attendance %')

    return rows
      .map(cols => {
        const total   = parseInt((cols[totI >= 0 ? totI : 3]  || '').replace(/\D/g, '')) || 0
        const present = parseInt((cols[preI >= 0 ? preI : 4]  || '').replace(/\D/g, '')) || 0
        const absent  = absI >= 0
          ? parseInt((cols[absI] || '').replace(/\D/g, '')) || (total - present)
          : total - present
        const pct     = pctI >= 0
          ? parseFloat((cols[pctI] || '').replace(/[^\d.]/g, '')) || (total > 0 ? +(present / total * 100).toFixed(1) : 0)
          : (total > 0 ? +(present / total * 100).toFixed(1) : 0)

        return {
          courseCode:  (cols[codeI >= 0 ? codeI : 1] || '').trim(),
          courseName:  (cols[nameI >= 0 ? nameI : 2] || '').trim(),
          total,
          present,
          absent,
          percentage:  pct,
        }
      })
      .filter(r => r.courseCode || r.courseName)
  }

  // ── Academic Result (SGPA / CGPA + marks) ──────────────────────
  async fetchResult() {
    const html = await this._fetch('/StudentFiles/StudentResultDetails.jsp')
    const $ = cheerio.load(html)
    const text = $.text()

    const matchNum = (pattern) => {
      const m = text.match(pattern)
      return m ? parseFloat(m[1]) : null
    }

    const cgpa = matchNum(/CGPA\s*[:\-]?\s*(\d+\.?\d*)/i)
    const sgpa = matchNum(/SGPA\s*[:\-]?\s*(\d+\.?\d*)/i)

    const tableEl = this._largest_table($)
    const { headers, rows } = tableEl ? this._table_data($, tableEl) : { headers: [], rows: [] }

    return { cgpa, sgpa, headers, rows: rows.filter(r => r.some(c => c)) }
  }

  // ── Registered Courses ──────────────────────────────────────────
  async fetchRegisteredCourses() {
    const html = await this._fetch('/StudentFiles/StudentRegisteredCourses.jsp')
    const $ = cheerio.load(html)
    const tableEl = this._largest_table($)
    if (!tableEl) return []
    const { headers, rows } = this._table_data($, tableEl)

    const hi = (...kw) => this._hi(headers, ...kw)
    const codeI   = hi('code', 'course code')
    const nameI   = hi('name', 'title', 'subject')
    const creditI = hi('credit', 'unit', 'ch')
    const facI    = hi('faculty', 'teacher', 'instructor', 'professor')

    return rows
      .map(cols => ({
        code:    (cols[codeI >= 0 ? codeI : 1]    || '').trim(),
        name:    (cols[nameI >= 0 ? nameI : 2]    || '').trim(),
        credits: parseFloat((cols[creditI >= 0 ? creditI : 3] || '').replace(/\D/g, '')) || 0,
        faculty: (cols[facI >= 0 ? facI : 4]      || '').trim(),
      }))
      .filter(r => r.code || r.name)
  }

  // ── Fee Details ─────────────────────────────────────────────────
  async fetchFees() {
    const html = await this._fetch('/StudentFiles/FeeDetails.jsp')
    const $ = cheerio.load(html)
    const text = $.text()
    const tableEl = this._largest_table($)
    const { headers, rows } = tableEl ? this._table_data($, tableEl) : { headers: [], rows: [] }

    const parseAmt = (str) => parseFloat((str || '').replace(/[^\d.]/g, '')) || 0

    const hi = (...kw) => this._hi(headers, ...kw)
    const semI  = hi('sem', 'semester')
    const typeI = hi('type', 'particular', 'fee')
    const dueI  = hi('due', 'demand', 'required')
    const paidI = hi('paid', 'receipt', 'deposited')
    const balI  = hi('balance', 'remaining', 'arrear')
    const stI   = hi('status')

    const records = rows
      .map(cols => ({
        semester:   parseInt((cols[semI >= 0 ? semI : 0] || '').replace(/\D/g, '')) || null,
        feeType:    (cols[typeI >= 0 ? typeI : 1] || 'tuition').trim(),
        amountDue:  parseAmt(cols[dueI >= 0 ? dueI : 2]),
        amountPaid: parseAmt(cols[paidI >= 0 ? paidI : 3]),
        balance:    balI >= 0 ? parseAmt(cols[balI]) : null,
        status:     (cols[stI >= 0 ? stI : cols.length - 1] || '').trim() || 'pending',
      }))
      .filter(r => r.amountDue > 0 || r.amountPaid > 0)

    const totalDue  = records.reduce((s, r) => s + r.amountDue, 0)
    const totalPaid = records.reduce((s, r) => s + r.amountPaid, 0)

    // Also try to read summary figures from page text
    const dueTxt  = text.match(/(?:total due|amount due|outstanding)\s*:?\s*₹?\s*([\d,]+\.?\d*)/i)
    const paidTxt = text.match(/(?:total paid|amount paid)\s*:?\s*₹?\s*([\d,]+\.?\d*)/i)

    return {
      records,
      summary: {
        totalDue:  dueTxt  ? parseFloat(dueTxt[1].replace(/,/g, ''))  : totalDue,
        totalPaid: paidTxt ? parseFloat(paidTxt[1].replace(/,/g, '')) : totalPaid,
        balance:   (dueTxt ? parseFloat(dueTxt[1].replace(/,/g, '')) : totalDue) -
                   (paidTxt ? parseFloat(paidTxt[1].replace(/,/g, '')) : totalPaid),
      },
    }
  }

  // ── Timetable ───────────────────────────────────────────────────
  async fetchTimetable() {
    try {
      const html = await this._fetch('/StudentFiles/StudentTimeTable.jsp')
      const $ = cheerio.load(html)
      const tableEl = this._largest_table($)
      if (!tableEl) return []
      const { headers, rows } = this._table_data($, tableEl)
      return { headers, rows: rows.filter(r => r.some(c => c)) }
    } catch { return [] }
  }

  // ── Logout ──────────────────────────────────────────────────────
  async logout() {
    for (const path of ['/Logout.jsp', '/logout.do', '/LogOff.jsp']) {
      try { await this.client.get(path) } catch {}
    }
    this._cookie = {}
  }
}

// Alias for any existing code referencing WebKioskScraper
export const WebKioskScraper = ThaparWebKioskScraper

// ─── Per-Student WebKiosk Sync ────────────────────────────────────
export async function runStudentWebKioskSync(userId) {
  // Fetch the user's webkiosk config
  const { data: config } = await supabaseAdmin
    .from('student_sync_config')
    .select('*')
    .eq('user_id', userId)
    .eq('provider', 'webkiosk')
    .maybeSingle()

  if (!config) throw new Error('No WebKiosk credentials configured.')
  const creds = config.credentials_json || {}
  if (!creds.username || !creds.password) throw new Error('Missing WebKiosk credentials.')

  const log  = []
  let status = 'success'
  let data   = {}

  try {
    const scraper = new ThaparWebKioskScraper()

    log.push('Connecting to Thapar WebKiosk...')
    await scraper.login(creds.username, creds.password)
    log.push('Login successful')

    // Parallel scrape of all modules
    const [profRes, attRes, resultRes, coursesRes, feesRes, ttRes] = await Promise.allSettled([
      scraper.fetchProfile(),
      scraper.fetchAttendance(),
      scraper.fetchResult(),
      scraper.fetchRegisteredCourses(),
      scraper.fetchFees(),
      scraper.fetchTimetable(),
    ])

    if (profRes.status === 'fulfilled') {
      data.profile = profRes.value
      log.push(`✓ Profile: ${profRes.value.name || '—'}`)
      // Mirror into student_profiles
      await supabaseAdmin.from('student_profiles').upsert({
        user_id:       userId,
        enrollment_no: profRes.value.enrollmentNo || creds.username,
        roll_no:       profRes.value.rollNo       || null,
        branch:        profRes.value.branch        || null,
        dept:          profRes.value.branch        || null,
        section:       profRes.value.section       || null,
        batch_year:    parseInt(profRes.value.batchYear) || null,
        updated_at:    new Date().toISOString(),
      }, { onConflict: 'user_id' }).catch(() => {})
    } else {
      log.push(`✗ Profile: ${profRes.reason?.message}`)
      status = 'partial'
    }

    if (attRes.status === 'fulfilled') {
      data.attendance = attRes.value
      log.push(`✓ Attendance: ${attRes.value.length} subjects`)
    } else {
      log.push(`✗ Attendance: ${attRes.reason?.message}`)
      status = 'partial'
    }

    if (resultRes.status === 'fulfilled') {
      data.result = resultRes.value
      log.push(`✓ Result: CGPA=${resultRes.value.cgpa ?? '—'}, SGPA=${resultRes.value.sgpa ?? '—'}`)
      if (resultRes.value.cgpa) {
        await supabaseAdmin.from('student_profiles').upsert({
          user_id:      userId,
          current_cgpa: resultRes.value.cgpa,
          updated_at:   new Date().toISOString(),
        }, { onConflict: 'user_id' }).catch(() => {})
      }
    } else {
      log.push(`✗ Result: ${resultRes.reason?.message}`)
      status = 'partial'
    }

    if (coursesRes.status === 'fulfilled') {
      data.registeredCourses = coursesRes.value
      log.push(`✓ Registered Courses: ${coursesRes.value.length}`)
    } else {
      log.push(`✗ Courses: ${coursesRes.reason?.message}`)
    }

    if (feesRes.status === 'fulfilled') {
      data.fees = feesRes.value
      log.push(`✓ Fees: balance ₹${feesRes.value.summary.balance.toLocaleString()}`)
    } else {
      log.push(`✗ Fees: ${feesRes.reason?.message}`)
      status = 'partial'
    }

    if (ttRes.status === 'fulfilled') {
      data.timetable = ttRes.value
      log.push(`✓ Timetable: fetched`)
    } else {
      log.push(`○ Timetable: ${ttRes.reason?.message}`)
    }

    await scraper.logout()
    log.push('Sync complete')
  } catch (err) {
    status = 'failed'
    log.push(`✗ Error: ${err.message}`)
  }

  // Persist sync status + all data
  await supabaseAdmin
    .from('student_sync_config')
    .update({
      last_synced_at:   new Date().toISOString(),
      last_sync_status: status,
      last_sync_log:    JSON.stringify({ log: log.join('\n'), data }),
    })
    .eq('user_id', userId)
    .eq('provider', 'webkiosk')

  return { status, log, data }
}

// ─── Admin-level sync (unchanged contract) ────────────────────────
export async function runWebKioskSync() {
  const { data: configs } = await supabaseAdmin
    .from('external_sync_config')
    .select('*')
    .eq('provider', 'webkiosk')
    .eq('is_active', true)

  for (const config of configs || []) {
    const log    = []
    let   status = 'success'
    try {
      let creds = {}
      try { creds = JSON.parse(decrypt(config.credentials_json?.encrypted)) } catch {
        throw new Error('Could not decrypt stored credentials.')
      }
      if (!creds.username || !creds.password) throw new Error('No credentials stored.')

      const scraper = new ThaparWebKioskScraper()
      log.push(`Discovering login on ${THAPAR_BASE}...`)
      await scraper.login(creds.username, creds.password)
      log.push('Login successful')

      const [att, marks, fees] = await Promise.allSettled([
        scraper.fetchAttendance(),
        scraper.fetchResult(),
        scraper.fetchFees(),
      ])

      if (att.status === 'fulfilled') log.push(`Attendance: ${att.value.length} rows`)
      else { log.push(`Attendance failed: ${att.reason?.message}`); status = 'partial' }

      if (marks.status === 'fulfilled') log.push(`Result: CGPA=${marks.value.cgpa}`)
      else { log.push(`Result failed: ${marks.reason?.message}`); status = 'partial' }

      if (fees.status === 'fulfilled') log.push(`Fees: ${fees.value.records.length} records`)
      else { log.push(`Fees failed: ${fees.reason?.message}`); status = 'partial' }

      await scraper.logout()
      log.push('Done')
    } catch (err) {
      status = 'failed'
      log.push(`Error: ${err.message}`)
    }

    await supabaseAdmin.from('external_sync_config')
      .update({ last_synced_at: new Date().toISOString(), last_sync_status: status, last_sync_log: log.join('\n') })
      .eq('id', config.id)
  }
}
