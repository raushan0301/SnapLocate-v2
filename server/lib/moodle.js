import axios from 'axios'
import { supabaseAdmin } from './supabase.js'

// Strip any path suffixes the user may have pasted (e.g. /login/index.php)
function normalizeBaseUrl(url) {
  try {
    const u = new URL(url)
    // Remove known Moodle login/page paths, keep only the Moodle root
    u.pathname = u.pathname
      .replace(/\/login\/index\.php$/i, '')
      .replace(/\/login\/?$/i, '')
      .replace(/\/index\.php$/i, '')
      .replace(/\/$/, '')
    u.search = ''
    u.hash   = ''
    return u.toString()
  } catch {
    return url.replace(/\/$/, '')
  }
}

export class MoodleClient {
  constructor(baseUrl) {
    this.baseUrl = normalizeBaseUrl(baseUrl)
    this.token   = null
    this.client  = axios.create({ baseURL: this.baseUrl, timeout: 30000 })
  }

  // Authenticate with username/password → get a token
  async login(username, password) {
    // Try both the mobile app service and the default service
    const services = ['moodle_mobile_app', 'moodle_mobile_app_lms', 'moodle_mobile_app_os']
    let lastErr = null
    for (const service of services) {
      try {
        const res = await this.client.get('/login/token.php', {
          params: { username, password, service },
        })
        if (res.data?.token) {
          this.token = res.data.token
          return this.token
        }
        if (res.data?.error) lastErr = new Error(`Moodle: ${res.data.error}`)
      } catch (e) { lastErr = e }
    }
    throw lastErr || new Error('Moodle did not return a token. Check credentials and that Web Services are enabled.')
  }

  async call(wsfunction, params = {}) {
    if (!this.token) throw new Error('Not authenticated — call login() first')
    const res = await this.client.get('/webservice/rest/server.php', {
      params: { wstoken: this.token, wsfunction, moodlewsrestformat: 'json', ...params },
    })
    if (res.data?.exception) throw new Error(res.data.message || wsfunction + ' failed')
    return res.data
  }

  // Get current user info (returns userid, sitename, etc.)
  async getSiteInfo() {
    return this.call('core_webservice_get_site_info')
  }

  // Get courses the authenticated user is enrolled in (works for non-admin users)
  async getMyCourses(userId) {
    return this.call('core_enrol_get_users_courses', { userid: userId })
  }

  // Fallback: try to get all courses (requires manager/admin capability)
  async getAllCourses() {
    return this.call('core_course_get_courses')
  }

  async getAssignments(courseIds = []) {
    return this.call('mod_assign_get_assignments', Object.fromEntries(
      courseIds.map((id, i) => [`courseids[${i}]`, id])
    ))
  }

  async getGradesTable(courseId, userId) {
    return this.call('gradereport_user_get_grades_table', { courseid: courseId, userid: userId })
  }
}

// ─── Main sync runner ──────────────────────────────────────────────────────────
export async function runMoodleSync() {
  const { data: configs } = await supabaseAdmin
    .from('external_sync_config')
    .select('*')
    .eq('provider', 'moodle')
    .eq('is_active', true)

  for (const config of configs || []) {
    const log    = []
    let   status = 'success'

    try {
      const creds = config.credentials_json || {}
      if (!creds.username || !creds.password) {
        throw new Error('No username/password stored. Please re-configure Moodle credentials.')
      }

      const client = new MoodleClient(config.base_url)
      log.push(`Connecting to ${client.baseUrl}...`)
      await client.login(creds.username, creds.password)
      log.push('Authenticated with Moodle')

      // Get logged-in user's ID so we can fetch their enrolled courses
      const siteInfo = await client.getSiteInfo()
      const userId = siteInfo.userid
      log.push(`Logged in as: ${siteInfo.fullname} (id: ${userId})`)

      const modules = config.sync_modules || {}

      // ── 1. Always sync courses ──────────────────────────────────────────────
      let moodleCourses = []
      try {
        // Use enrolled courses API first (works for any user role)
        let raw = []
        try {
          raw = await client.getMyCourses(userId)
        } catch {
          // Fallback to admin-level get all courses
          raw = await client.getAllCourses()
        }
        // Filter out the "site" course (id=1) which is always present
        moodleCourses = (raw || []).filter(c => c.id !== 1 && c.id !== 0)
        log.push(`Found ${moodleCourses.length} courses in Moodle`)

        let coursesSynced = 0
        for (const mc of moodleCourses) {
          // Map Moodle fields → SnapLocate courses table
          const row = {
            code:           mc.shortname  || `MOODLE-${mc.id}`,
            name:           mc.fullname   || mc.shortname,
            dept:           mc.categoryname || null,
            synced_from:    'moodle',
          }

          // Upsert by course code (shortname is unique per Moodle course)
          const { error } = await supabaseAdmin
            .from('courses')
            .upsert(row, { onConflict: 'code', ignoreDuplicates: false })
          if (!error) coursesSynced++
        }
        log.push(`Synced ${coursesSynced} courses into SnapLocate`)
      } catch (e) {
        log.push(`Course sync failed: ${e.message}`)
        status = 'partial'
      }

      // ── 2. Sync assignments (if enabled) ───────────────────────────────────
      if (modules.assignments && moodleCourses.length > 0) {
        try {
          const moodleCourseIds = moodleCourses.map(c => c.id)
          const { courses: assignCourses } = await client.getAssignments(moodleCourseIds)
          let assignSynced = 0

          for (const ac of assignCourses || []) {
            // Find the local course by shortname/code
            const { data: localCourse } = await supabaseAdmin
              .from('courses')
              .select('id, faculty_id')
              .eq('code', ac.shortname)
              .single()
            if (!localCourse) continue

            for (const asgn of ac.assignments || []) {
              await supabaseAdmin.from('assignments').upsert({
                course_id:   localCourse.id,
                faculty_id:  localCourse.faculty_id,
                title:       asgn.name,
                description: asgn.intro || null,
                due_date:    asgn.duedate ? new Date(asgn.duedate * 1000).toISOString() : null,
                max_marks:   asgn.grade || 100,
                synced_from: 'moodle',
              }, { onConflict: 'course_id,title' })
              assignSynced++
            }
          }
          log.push(`Synced ${assignSynced} assignments from Moodle`)
        } catch (e) {
          log.push(`Assignment sync failed: ${e.message}`)
          status = 'partial'
        }
      }

      log.push('Moodle sync complete')
    } catch (err) {
      status = 'failed'
      log.push(`Moodle sync failed: ${err.message}`)
    }

    await supabaseAdmin
      .from('external_sync_config')
      .update({
        last_synced_at:    new Date().toISOString(),
        last_sync_status:  status,
        last_sync_log:     log.join('\n'),
      })
      .eq('id', config.id)
  }
}
