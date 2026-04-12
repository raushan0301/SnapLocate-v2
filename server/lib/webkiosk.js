import axios from 'axios'
import * as cheerio from 'cheerio'
import crypto from 'crypto'
import https from 'https'
import { supabaseAdmin } from './supabase.js'

const httpsAgent = new https.Agent({ rejectUnauthorized: false })

const ALGORITHM = 'aes-256-gcm'

function encrypt(text) {
  const key = Buffer.from(process.env.SYNC_ENCRYPTION_KEY || 'default_key_32bytes_placeholder!!', 'utf8').slice(0, 32)
  const iv  = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return iv.toString('hex') + ':' + tag.toString('hex') + ':' + encrypted.toString('hex')
}

function decrypt(ciphertext) {
  const key = Buffer.from(process.env.SYNC_ENCRYPTION_KEY || 'default_key_32bytes_placeholder!!', 'utf8').slice(0, 32)
  const [ivHex, tagHex, encHex] = ciphertext.split(':')
  const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(ivHex, 'hex'))
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'))
  const decrypted = Buffer.concat([decipher.update(Buffer.from(encHex, 'hex')), decipher.final()])
  return decrypted.toString('utf8')
}

// Common WebKiosk login paths used by different institutions
const LOGIN_PATHS = [
  '/Login.aspx',
  '/login.aspx',
  '/Account/Login',
  '/account/login',
  '/WebKiosk/Login.aspx',
  '/',
]

// Candidate paths for each data page
const DATA_PATHS = {
  attendance: [
    '/Attendance.aspx',
    '/StudentAttendanceDetails.aspx',
    '/Student/Attendance.aspx',
    '/webkiosk/Attendance.aspx',
    '/StudentPortal/Attendance.aspx',
    '/attendance',
  ],
  marks: [
    '/Marks.aspx',
    '/StudentMarks.aspx',
    '/Student/Marks.aspx',
    '/GradeReport.aspx',
    '/Grades.aspx',
    '/webkiosk/Marks.aspx',
  ],
  fees: [
    '/FeeDetails.aspx',
    '/FeeStatus.aspx',
    '/Student/FeeDetails.aspx',
    '/Fees.aspx',
  ],
  examSchedule: [
    '/ExamSchedule.aspx',
    '/DateSheet.aspx',
    '/Student/ExamSchedule.aspx',
    '/Exam/Schedule.aspx',
    '/ExamDateSheet.aspx',
  ],
}

export class WebKioskScraper {
  constructor(baseUrl) {
    this.baseUrl    = baseUrl.replace(/\/$/, '') // strip trailing slash
    this.cookie     = null
    this.loginPath  = null
    this.client     = axios.create({ baseURL: this.baseUrl, timeout: 30000, withCredentials: true, httpsAgent })
  }

  // Try to find a reachable data page from a list of candidates
  async discoverDataPath(candidates) {
    for (const path of candidates) {
      try {
        const res = await this.client.get(path, { maxRedirects: 5 })
        // Accept any 200 response that isn't redirected back to login
        if (res.status === 200 && !res.request?.path?.toLowerCase().includes('login')) {
          return path
        }
      } catch {}
    }
    throw new Error(`Could not find page. Tried: ${candidates.slice(0, 3).join(', ')}...`)
  }

  // Try to find a reachable login page
  async discoverLoginPath() {
    for (const path of LOGIN_PATHS) {
      try {
        const res = await this.client.get(path, { maxRedirects: 5 })
        if (res.status === 200) { this.loginPath = path; return path }
      } catch {}
    }
    throw new Error(`Could not reach any login page on ${this.baseUrl}. Tried: ${LOGIN_PATHS.join(', ')}`)
  }

  async login(username, password) {
    if (!this.loginPath) await this.discoverLoginPath()

    // First GET the login page to grab any hidden form fields (ASP.NET ViewState etc.)
    let extraFields = {}
    try {
      const getRes = await this.client.get(this.loginPath, { maxRedirects: 5 })
      const $ = cheerio.load(getRes.data)
      $('input[type=hidden]').each((_, el) => {
        const name = $(el).attr('name')
        const val  = $(el).attr('value') || ''
        if (name) extraFields[name] = val
      })
      // Store any cookies from the GET
      const getCookies = getRes.headers['set-cookie']
      if (getCookies) {
        this.cookie = getCookies.map(c => c.split(';')[0]).join('; ')
        this.client.defaults.headers['Cookie'] = this.cookie
      }
    } catch {}

    // Try common username/password field name variations
    const fieldCombos = [
      { usernameField: 'username', passwordField: 'password' },
      { usernameField: 'UserName', passwordField: 'Password' },
      { usernameField: 'userid',   passwordField: 'password' },
      { usernameField: 'user_id',  passwordField: 'user_password' },
      { usernameField: 'LoginId',  passwordField: 'Password' },
    ]

    let lastErr = null
    for (const { usernameField, passwordField } of fieldCombos) {
      try {
        const body = new URLSearchParams({ ...extraFields, [usernameField]: username, [passwordField]: password })
        const res = await this.client.post(this.loginPath, body, {
          maxRedirects: 5,
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        })
        const setCookie = res.headers['set-cookie']
        if (setCookie) {
          this.cookie = setCookie.map(c => c.split(';')[0]).join('; ')
          this.client.defaults.headers['Cookie'] = this.cookie
          return true
        }
      } catch (err) { lastErr = err }
    }
    throw new Error(`Login failed. The portal may use a custom login form. Last error: ${lastErr?.message || 'unknown'}`)
  }

  // Generic table scraper — finds the largest table on the page
  _scrapeTable(html) {
    const $ = cheerio.load(html)
    let bestRows = []
    $('table').each((_, table) => {
      const rows = []
      $(table).find('tr').each((i, tr) => {
        const cells = []
        $(tr).find('td, th').each((_, td) => cells.push($(td).text().trim()))
        if (cells.length > 0) rows.push(cells)
      })
      if (rows.length > bestRows.length) bestRows = rows
    })
    return bestRows // bestRows[0] = header, bestRows[1..] = data rows
  }

  async fetchAttendance() {
    const path = await this.discoverDataPath(DATA_PATHS.attendance)
    const res  = await this.client.get(path)
    const rows = this._scrapeTable(res.data)
    if (rows.length < 2) return []
    // Try to auto-detect columns by header names
    const header = rows[0].map(h => h.toLowerCase())
    const codeIdx = header.findIndex(h => h.includes('code') || h.includes('subject'))
    const nameIdx = header.findIndex(h => h.includes('name') || h.includes('subject'))
    const totIdx  = header.findIndex(h => h.includes('total') || h.includes('held'))
    const preIdx  = header.findIndex(h => h.includes('present') || h.includes('pres'))
    const absIdx  = header.findIndex(h => h.includes('absent') || h.includes('abs'))
    const pctIdx  = header.findIndex(h => h.includes('%') || h.includes('percent') || h.includes('attend'))

    return rows.slice(1).map(cols => ({
      course_code: cols[codeIdx >= 0 ? codeIdx : 0] || '',
      course_name: cols[nameIdx >= 0 ? nameIdx : 1] || '',
      total:       parseInt(cols[totIdx  >= 0 ? totIdx  : 2]) || 0,
      present:     parseInt(cols[preIdx  >= 0 ? preIdx  : 3]) || 0,
      absent:      parseInt(cols[absIdx  >= 0 ? absIdx  : 4]) || 0,
      percentage:  parseFloat(cols[pctIdx >= 0 ? pctIdx : 5]) || 0,
    })).filter(r => r.course_code)
  }

  async fetchMarks() {
    const path = await this.discoverDataPath(DATA_PATHS.marks)
    const res  = await this.client.get(path)
    const rows = this._scrapeTable(res.data)
    if (rows.length < 2) return []
    const header   = rows[0].map(h => h.toLowerCase())
    const codeIdx  = header.findIndex(h => h.includes('code') || h.includes('subject'))
    const typeIdx  = header.findIndex(h => h.includes('exam') || h.includes('type') || h.includes('test'))
    const marksIdx = header.findIndex(h => h.includes('obtain') || h.includes('marks') || h.includes('score'))
    const maxIdx   = header.findIndex(h => h.includes('max') || h.includes('total') || h.includes('out'))

    return rows.slice(1).map(cols => ({
      course_code: cols[codeIdx  >= 0 ? codeIdx  : 0] || '',
      exam_type:   (cols[typeIdx  >= 0 ? typeIdx  : 1] || 'internal').toLowerCase(),
      marks:       parseFloat(cols[marksIdx >= 0 ? marksIdx : 2]) || 0,
      max_marks:   parseFloat(cols[maxIdx   >= 0 ? maxIdx   : 3]) || 100,
    })).filter(r => r.course_code)
  }

  async fetchFeeDetails() {
    const path = await this.discoverDataPath(DATA_PATHS.fees)
    const res  = await this.client.get(path)
    const rows = this._scrapeTable(res.data)
    if (rows.length < 2) return []
    const header  = rows[0].map(h => h.toLowerCase())
    const semIdx  = header.findIndex(h => h.includes('sem'))
    const typeIdx = header.findIndex(h => h.includes('type') || h.includes('fee'))
    const dueIdx  = header.findIndex(h => h.includes('due') || h.includes('demand'))
    const paidIdx = header.findIndex(h => h.includes('paid') || h.includes('deposited'))
    const stIdx   = header.findIndex(h => h.includes('status'))

    return rows.slice(1).map(cols => ({
      semester:    parseInt(cols[semIdx  >= 0 ? semIdx  : 0]) || 1,
      fee_type:    (cols[typeIdx >= 0 ? typeIdx : 1] || 'tuition').toLowerCase().split(' ')[0],
      amount_due:  parseFloat((cols[dueIdx  >= 0 ? dueIdx  : 2] || '').replace(/[^0-9.]/g, '')) || 0,
      amount_paid: parseFloat((cols[paidIdx >= 0 ? paidIdx : 3] || '').replace(/[^0-9.]/g, '')) || 0,
      status:      (cols[stIdx >= 0 ? stIdx : 4] || 'pending').toLowerCase(),
    })).filter(r => r.amount_due > 0)
  }

  async fetchExamSchedule() {
    const path = await this.discoverDataPath(DATA_PATHS.examSchedule)
    const res  = await this.client.get(path)
    const rows = this._scrapeTable(res.data)
    if (rows.length < 2) return []
    const header  = rows[0].map(h => h.toLowerCase())
    const codeIdx = header.findIndex(h => h.includes('code') || h.includes('subject'))
    const nameIdx = header.findIndex(h => h.includes('name'))
    const dateIdx = header.findIndex(h => h.includes('date'))
    const timeIdx = header.findIndex(h => h.includes('time'))
    const venIdx  = header.findIndex(h => h.includes('venue') || h.includes('room') || h.includes('hall'))

    return rows.slice(1).map(cols => ({
      course_code: cols[codeIdx >= 0 ? codeIdx : 0] || '',
      course_name: cols[nameIdx >= 0 ? nameIdx : 1] || '',
      exam_type:   'end',
      exam_date:   cols[dateIdx >= 0 ? dateIdx : 2] || '',
      start_time:  cols[timeIdx >= 0 ? timeIdx : 3] || '09:00',
      venue:       cols[venIdx  >= 0 ? venIdx  : 4] || '',
    })).filter(r => r.course_code && r.exam_date)
  }

  async logout() {
    try { await this.client.get('/Logout.aspx') } catch {}
    this.cookie = null
  }
}

// ─── Main sync runner ────────────────────────────────────────────────────────
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
      // Decrypt stored credentials
      let creds = {}
      try {
        creds = JSON.parse(decrypt(config.credentials_json?.encrypted))
      } catch {
        throw new Error('Could not decrypt stored credentials. Please re-save your credentials in Sync Config.')
      }

      if (!creds.username || !creds.password) {
        throw new Error('No username/password found in stored credentials. Please re-configure.')
      }

      const scraper = new WebKioskScraper(config.base_url)
      log.push(`Discovering login page on ${config.base_url}...`)

      try {
        await scraper.login(creds.username, creds.password)
      } catch (loginErr) {
        if (loginErr.message?.includes('404') || loginErr.message?.includes('ECONNREFUSED') || loginErr.message?.includes('ENOTFOUND')) {
          throw new Error(`Cannot reach ${config.base_url}. WebKiosk is likely on an internal campus network — your server must be running on the same network (e.g., campus Wi-Fi or VPN). Original error: ${loginErr.message}`)
        }
        throw loginErr
      }
      log.push('Login successful')

      const modules = config.sync_modules || {}

      if (modules.exam_schedule) {
        try {
          const exams = await scraper.fetchExamSchedule()
          if (exams.length > 0) {
            const rows = exams.map(e => ({ ...e, synced_from: 'webkiosk' }))
            await supabaseAdmin.from('exam_schedule').upsert(rows, { onConflict: 'course_code,exam_type,exam_date' })
            log.push(`Synced ${exams.length} exam schedule entries`)
          } else {
            log.push('Exam schedule: no data found on page')
          }
        } catch (e) { log.push(`Exam schedule sync failed: ${e.message}`); status = 'partial' }
      }

      if (modules.attendance) {
        try {
          const rows = await scraper.fetchAttendance()
          log.push(`Attendance: fetched ${rows.length} course rows`)
        } catch (e) { log.push(`Attendance sync failed: ${e.message}`); status = 'partial' }
      }

      if (modules.grades) {
        try {
          const rows = await scraper.fetchMarks()
          log.push(`Grades: fetched ${rows.length} mark rows`)
        } catch (e) { log.push(`Grades sync failed: ${e.message}`); status = 'partial' }
      }

      await scraper.logout()
      log.push('Sync complete')
    } catch (err) {
      status = 'failed'
      log.push(`Sync failed: ${err.message}`)
    }

    await supabaseAdmin
      .from('external_sync_config')
      .update({ last_synced_at: new Date().toISOString(), last_sync_status: status, last_sync_log: log.join('\n') })
      .eq('id', config.id)
  }
}

export function encryptCredentials(creds) {
  return { encrypted: encrypt(JSON.stringify(creds)) }
}

export function redactConfig(config) {
  const { credentials_json, ...safe } = config
  return { ...safe, credentials_json: { configured: !!credentials_json?.encrypted } }
}
