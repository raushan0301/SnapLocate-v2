import axios from 'axios'
import { supabaseAdmin } from './supabase.js'

function normalizeBaseUrl(url) {
  try {
    const u = new URL(url)
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

  async login(username, password) {
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

  async getSiteInfo() { return this.call('core_webservice_get_site_info') }
  async getMyCourses(userId) { return this.call('core_enrol_get_users_courses', { userid: userId }) }
  async getAllCourses() { return this.call('core_course_get_courses') }
  async getCourseContents(courseId) { return this.call('core_course_get_contents', { courseid: courseId }) }

  async getForumsByCourses(courseIds = []) {
    return this.call('mod_forum_get_forums_by_courses',
      Object.fromEntries(courseIds.map((id, i) => [`courseids[${i}]`, id]))
    )
  }

  async getForumDiscussions(forumId, page = 0, perpage = 50) {
    return this.call('mod_forum_get_forum_discussions', { forumid: forumId, page, perpage })
  }

  async getCategories(categoryIds = []) {
    if (categoryIds.length === 0) return []
    const params = {}
    categoryIds.forEach((id, i) => {
      params[`criteria[${i}][key]`]   = 'id'
      params[`criteria[${i}][value]`] = id
    })
    try {
      const res = await this.call('core_course_get_categories', params)
      return Array.isArray(res) ? res : []
    } catch { return [] }
  }

  async getAssignments(courseIds = []) {
    return this.call('mod_assign_get_assignments',
      Object.fromEntries(courseIds.map((id, i) => [`courseids[${i}]`, id]))
    )
  }

  async getGradesTable(courseId, userId) {
    return this.call('gradereport_user_get_grades_table', { courseid: courseId, userid: userId })
  }
}

// ─── Parse department/branch from Moodle course fullname ─────────────────────
function parseDept(fullname = '') {
  const match = fullname.match(/\b(CSE|ECE|ENC|MEE|CHE|ELE|CIV|BIO|PHY|MAT|MCA|MBA|BCA|CSAI|CSBS|AIDS|IT)\b/i)
  if (match) return match[1].toUpperCase()
  const parts = fullname.split('-')
  if (parts.length >= 2) {
    const candidate = parts[parts.length - 2].trim()
    if (candidate.length <= 6 && /^[A-Z]+$/i.test(candidate)) return candidate.toUpperCase()
  }
  return null
}

// ─── Run promises in batches of N ────────────────────────────────────────────
async function batch(items, concurrency, fn) {
  const results = []
  for (let i = 0; i < items.length; i += concurrency) {
    const chunk = items.slice(i, i + concurrency)
    const res = await Promise.allSettled(chunk.map(fn))
    results.push(...res)
  }
  return results
}

// ─── Build local course cache (bulk fetch once) ──────────────────────────────
async function buildCourseCache(codes) {
  if (codes.length === 0) return {}
  const { data } = await supabaseAdmin
    .from('courses')
    .select('id, code, faculty_id')
    .in('code', codes)
  const map = {}
  for (const c of data || []) map[c.code] = { id: c.id, faculty_id: c.faculty_id }
  return map
}

// ─── DB upsert helper: check existing by moodle_id, then bulk insert/update ─
async function upsertByMoodleId(table, rows, log) {
  if (rows.length === 0) return 0
  const moodleIds = rows.map(r => r.moodle_id).filter(Boolean)
  const { data: existing } = await supabaseAdmin
    .from(table).select('id, moodle_id').in('moodle_id', moodleIds)
  const existMap = {}
  for (const e of existing || []) existMap[e.moodle_id] = e.id

  const toInsert = []
  const toUpdate = []
  for (const row of rows) {
    if (existMap[row.moodle_id]) {
      toUpdate.push({ ...row, id: existMap[row.moodle_id], updated_at: new Date().toISOString() })
    } else {
      toInsert.push(row)
    }
  }

  let count = 0
  if (toInsert.length > 0) {
    const { error } = await supabaseAdmin.from(table).insert(toInsert)
    if (error) log.push(`  ✗ ${table} insert: ${error.message}`)
    else count += toInsert.length
  }
  // Batch updates in chunks of 20
  for (let i = 0; i < toUpdate.length; i += 20) {
    const chunk = toUpdate.slice(i, i + 20)
    const results = await Promise.allSettled(
      chunk.map(row => {
        const { id, ...rest } = row
        return supabaseAdmin.from(table).update(rest).eq('id', id)
      })
    )
    count += results.filter(r => r.status === 'fulfilled' && !r.value.error).length
  }
  return count
}

// ─── Main admin sync runner (parallelized) ───────────────────────────────────
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

      const siteInfo = await client.getSiteInfo()
      const userId   = siteInfo.userid
      log.push(`Logged in as: ${siteInfo.fullname} (id: ${userId})`)

      // ── 1. Sync courses ───────────────────────────────────────────────────
      let moodleCourses = []
      try {
        let raw = []
        try { raw = await client.getMyCourses(userId) }
        catch { raw = await client.getAllCourses() }

        moodleCourses = (raw || []).filter(c => c.id !== 1 && c.id !== 0)
        log.push(`Found ${moodleCourses.length} courses in Moodle`)

        const categoryIds = [...new Set(moodleCourses.map(c => c.category).filter(Boolean))]
        const categories  = await client.getCategories(categoryIds)
        const catMap = {}
        for (const cat of categories) catMap[cat.id] = cat.name
        log.push(`Fetched ${categories.length} semester categories`)

        // Bulk fetch existing courses
        const codes = moodleCourses.map(mc => mc.shortname || `MOODLE-${mc.id}`)
        const { data: existingCourses } = await supabaseAdmin
          .from('courses').select('id, code').in('code', codes)
        const existMap = {}
        for (const c of existingCourses || []) existMap[c.code] = c.id

        const toInsert = []
        const toUpdate = []
        for (const mc of moodleCourses) {
          const code = mc.shortname || `MOODLE-${mc.id}`
          const name = mc.fullname  || mc.shortname
          const semester = catMap[mc.category] || mc.categoryname || null
          const dept = parseDept(name)
          if (existMap[code]) {
            toUpdate.push({ id: existMap[code], name, semester, dept, synced_from: 'moodle' })
          } else {
            toInsert.push({ code, name, semester, dept, synced_from: 'moodle' })
          }
        }

        let coursesSynced = 0
        if (toInsert.length > 0) {
          const { error } = await supabaseAdmin.from('courses').insert(toInsert)
          if (error) log.push(`  ✗ course insert: ${error.message}`)
          else coursesSynced += toInsert.length
        }
        if (toUpdate.length > 0) {
          const results = await Promise.allSettled(
            toUpdate.map(({ id, ...rest }) => supabaseAdmin.from('courses').update(rest).eq('id', id))
          )
          coursesSynced += results.filter(r => r.status === 'fulfilled' && !r.value.error).length
        }
        log.push(`Synced ${coursesSynced} courses into SnapLocate`)
      } catch (e) {
        log.push(`Course sync failed: ${e.message}`)
        status = 'partial'
      }

      if (moodleCourses.length === 0) {
        log.push('No courses to sync content for.')
        status = status === 'success' ? 'partial' : status
      } else {
        const moodleCourseIds = moodleCourses.map(c => c.id)
        const courseCodeMap = {}
        for (const mc of moodleCourses) courseCodeMap[mc.id] = mc.shortname || `MOODLE-${mc.id}`

        // Build local course cache once
        const allCodes = Object.values(courseCodeMap)
        const localCache = await buildCourseCache(allCodes)

        // ── Fire assignments + announcements + materials fetch in PARALLEL ───
        const [assignResult, forumResult, contentsResult] = await Promise.allSettled([
          client.getAssignments(moodleCourseIds),
          client.getForumsByCourses(moodleCourseIds),
          batch(moodleCourses, 5, async (mc) => {
            const sections = await client.getCourseContents(mc.id)
            return { moodleId: mc.id, shortname: mc.shortname || `MOODLE-${mc.id}`, sections }
          }),
        ])

        // ── 2. Process assignments ──────────────────────────────────────────
        try {
          if (assignResult.status !== 'fulfilled') throw new Error(assignResult.reason?.message || 'fetch failed')
          const { courses: assignCourses } = assignResult.value
          const rows = []
          for (const ac of assignCourses || []) {
            const local = localCache[ac.shortname]
            if (!local) continue
            for (const asgn of ac.assignments || []) {
              rows.push({
                course_id: local.id, faculty_id: local.faculty_id || null,
                title: asgn.name,
                description: asgn.intro ? asgn.intro.replace(/<[^>]+>/g, '').trim() : null,
                due_date: asgn.duedate ? new Date(asgn.duedate * 1000).toISOString() : new Date(Date.now() + 30 * 86400000).toISOString(),
                max_marks: asgn.grade > 0 ? asgn.grade : 100,
                synced_from: 'moodle', moodle_id: asgn.id,
              })
            }
          }
          const count = await upsertByMoodleId('assignments', rows, log)
          log.push(`Synced ${count} assignments from Moodle`)
        } catch (e) {
          log.push(`Assignment sync failed: ${e.message}`)
          status = 'partial'
        }

        // ── 3. Process announcements ────────────────────────────────────────
        try {
          if (forumResult.status !== 'fulfilled') throw new Error(forumResult.reason?.message || 'fetch failed')
          const forums = forumResult.value
          const newsForums = (forums || []).filter(f => f.type === 'news')

          // Fetch all forum discussions in parallel (batches of 5)
          const discResults = await batch(newsForums, 5, async (forum) => {
            const shortname = courseCodeMap[forum.course] || ''
            const local = localCache[shortname]
            if (!local) return { rows: [] }
            const result = await client.getForumDiscussions(forum.id)
            const discussions = result?.discussions || result || []
            return {
              rows: discussions.map(disc => ({
                course_id: local.id, faculty_id: null,
                title: disc.name || disc.subject || 'Announcement',
                message: disc.message ? disc.message.replace(/<[^>]+>/g, '').trim().slice(0, 2000) : '',
                is_pinned: disc.pinned || false,
                synced_from: 'moodle', moodle_id: disc.discussion || disc.id,
              }))
            }
          })
          const annRows = discResults.flatMap(r => r.status === 'fulfilled' ? r.value.rows : [])
          const count = await upsertByMoodleId('course_announcements', annRows, log)
          log.push(`Synced ${count} announcements from Moodle`)
        } catch (e) {
          log.push(`Announcement sync failed: ${e.message}`)
          status = 'partial'
        }

        // ── 4. Process course materials ─────────────────────────────────────
        try {
          if (contentsResult.status !== 'fulfilled') throw new Error('contents fetch failed')
          const matRows = []
          for (const r of contentsResult.value) {
            if (r.status !== 'fulfilled') continue
            const { shortname, sections } = r.value
            const local = localCache[shortname]
            if (!local) continue
            for (const section of sections || []) {
              for (const mod of section.modules || []) {
                if (['assign', 'forum', 'quiz', 'choice', 'feedback', 'chat'].includes(mod.modname)) continue
                let fileUrl = null, externalUrl = null
                if (mod.modname === 'url') {
                  externalUrl = mod.contents?.[0]?.fileurl || null
                } else if (mod.contents?.length > 0) {
                  const f = mod.contents.find(c => c.type === 'file') || mod.contents[0]
                  if (f?.fileurl) fileUrl = `${f.fileurl}${f.fileurl.includes('?') ? '&' : '?'}token=${client.token}`
                }
                if (!fileUrl && !externalUrl && mod.modname !== 'label') continue
                matRows.push({
                  course_id: local.id, title: mod.name,
                  description: mod.description ? mod.description.replace(/<[^>]+>/g, '').trim().slice(0, 500) : null,
                  module_type: mod.modname, file_url: fileUrl, external_url: externalUrl,
                  section_name: section.name || `Section ${section.section}`,
                  section_num: section.section ?? 0,
                  synced_from: 'moodle', moodle_id: mod.id,
                })
              }
            }
          }
          const count = await upsertByMoodleId('course_materials', matRows, log)
          log.push(`Synced ${count} course materials from Moodle`)
        } catch (e) {
          log.push(`Materials sync failed: ${e.message}`)
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
        last_synced_at:   new Date().toISOString(),
        last_sync_status: status,
        last_sync_log:    log.join('\n'),
      })
      .eq('id', config.id)
  }
}

// ─── Student-level personal sync (parallelized) ─────────────────────────────
export async function runStudentSync(userId) {
  const { data: config } = await supabaseAdmin
    .from('student_sync_config')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (!config) throw new Error('No sync config found')

  const log    = []
  let   status = 'success'

  try {
    const creds = config.credentials_json || {}
    if (!creds.username || !creds.password) throw new Error('Missing credentials')

    const client = new MoodleClient(config.base_url)
    log.push(`Connecting to ${client.baseUrl}...`)
    await client.login(creds.username, creds.password)
    log.push('Authenticated')

    const siteInfo = await client.getSiteInfo()
    const moodleUserId = siteInfo.userid
    log.push(`Logged in as: ${siteInfo.fullname}`)

    // 1. Fetch enrolled courses + categories in parallel
    let moodleCourses = []
    try {
      moodleCourses = ((await client.getMyCourses(moodleUserId)) || []).filter(c => c.id !== 1 && c.id !== 0)
    } catch {
      moodleCourses = ((await client.getAllCourses()) || []).filter(c => c.id !== 1 && c.id !== 0)
    }
    log.push(`Found ${moodleCourses.length} courses`)

    const categoryIds = [...new Set(moodleCourses.map(c => c.category).filter(Boolean))]
    const categories  = await client.getCategories(categoryIds)
    const catMap = {}
    for (const cat of categories) catMap[cat.id] = cat.name

    // 2. Bulk upsert courses
    const codes = moodleCourses.map(mc => mc.shortname || `MOODLE-${mc.id}`)
    const { data: existingCourses } = await supabaseAdmin
      .from('courses').select('id, code').in('code', codes)
    const existMap = {}
    for (const c of existingCourses || []) existMap[c.code] = c.id

    const toInsert = []
    const toUpdate = []
    for (const mc of moodleCourses) {
      const code = mc.shortname || `MOODLE-${mc.id}`
      const name = mc.fullname  || mc.shortname
      const semester = catMap[mc.category] || null
      const dept = parseDept(name)
      if (existMap[code]) {
        toUpdate.push({ id: existMap[code], name, semester, dept, synced_from: 'moodle' })
      } else {
        toInsert.push({ code, name, semester, dept, synced_from: 'moodle' })
      }
    }

    let coursesSynced = 0
    if (toInsert.length > 0) {
      const { data: inserted, error } = await supabaseAdmin.from('courses').insert(toInsert).select('id, code')
      if (error) log.push(`  ✗ course insert: ${error.message}`)
      else {
        coursesSynced += toInsert.length
        for (const c of inserted || []) existMap[c.code] = c.id
      }
    }
    if (toUpdate.length > 0) {
      const results = await Promise.allSettled(
        toUpdate.map(({ id, ...rest }) => supabaseAdmin.from('courses').update(rest).eq('id', id))
      )
      coursesSynced += results.filter(r => r.status === 'fulfilled' && !r.value.error).length
    }
    log.push(`Synced ${coursesSynced} courses`)

    // Auto-enroll student in all courses (bulk)
    const enrollRows = Object.values(existMap)
      .filter(Boolean)
      .map(courseId => ({ student_id: userId, course_id: courseId, status: 'active' }))
    if (enrollRows.length > 0) {
      await supabaseAdmin.from('course_enrollments')
        .upsert(enrollRows, { onConflict: 'student_id,course_id', ignoreDuplicates: true })
    }

    if (moodleCourses.length === 0) {
      log.push('No courses found'); status = 'partial'
    } else {
      const moodleCourseIds = moodleCourses.map(c => c.id)
      const courseCodeMap = {}
      for (const mc of moodleCourses) courseCodeMap[mc.id] = mc.shortname || `MOODLE-${mc.id}`

      // Build local cache from existMap
      const localCache = await buildCourseCache(Object.values(courseCodeMap))

      // ── Fire ALL Moodle fetches in parallel ─────────────────────────────
      const [assignResult, forumResult, contentsResult] = await Promise.allSettled([
        client.getAssignments(moodleCourseIds),
        client.getForumsByCourses(moodleCourseIds),
        batch(moodleCourses, 5, async (mc) => {
          const sections = await client.getCourseContents(mc.id)
          return { shortname: mc.shortname || `MOODLE-${mc.id}`, sections }
        }),
      ])

      // 3. Process assignments
      try {
        if (assignResult.status !== 'fulfilled') throw new Error(assignResult.reason?.message || 'fetch failed')
        const { courses: assignCourses } = assignResult.value
        const rows = []
        for (const ac of assignCourses || []) {
          const local = localCache[ac.shortname]
          if (!local) continue
          for (const asgn of ac.assignments || []) {
            rows.push({
              course_id: local.id, faculty_id: local.faculty_id || null,
              title: asgn.name,
              description: asgn.intro ? asgn.intro.replace(/<[^>]+>/g, '').trim() : null,
              due_date: asgn.duedate ? new Date(asgn.duedate * 1000).toISOString() : new Date(Date.now() + 30*86400000).toISOString(),
              max_marks: asgn.grade > 0 ? asgn.grade : 100,
              synced_from: 'moodle', moodle_id: asgn.id,
            })
          }
        }
        const count = await upsertByMoodleId('assignments', rows, log)
        log.push(`Synced ${count} assignments`)
      } catch (e) { log.push(`Assignment sync failed: ${e.message}`); status = 'partial' }

      // 4. Process announcements
      try {
        if (forumResult.status !== 'fulfilled') throw new Error(forumResult.reason?.message || 'fetch failed')
        const forums = forumResult.value
        const newsForums = (forums || []).filter(f => f.type === 'news')

        const discResults = await batch(newsForums, 5, async (forum) => {
          const shortname = courseCodeMap[forum.course] || ''
          const local = localCache[shortname]
          if (!local) return { rows: [] }
          const result = await client.getForumDiscussions(forum.id)
          const discussions = result?.discussions || result || []
          return {
            rows: discussions.map(disc => ({
              course_id: local.id, faculty_id: null,
              title: disc.name || disc.subject || 'Announcement',
              message: disc.message ? disc.message.replace(/<[^>]+>/g, '').trim().slice(0, 2000) : '',
              is_pinned: disc.pinned || false,
              synced_from: 'moodle', moodle_id: disc.discussion || disc.id,
            }))
          }
        })
        const annRows = discResults.flatMap(r => r.status === 'fulfilled' ? r.value.rows : [])
        const count = await upsertByMoodleId('course_announcements', annRows, log)
        log.push(`Synced ${count} announcements`)
      } catch (e) { log.push(`Announcement sync failed: ${e.message}`); status = 'partial' }

      // 5. Process course materials
      try {
        if (contentsResult.status !== 'fulfilled') throw new Error('contents fetch failed')
        const matRows = []
        for (const r of contentsResult.value) {
          if (r.status !== 'fulfilled') continue
          const { shortname, sections } = r.value
          const local = localCache[shortname]
          if (!local) continue
          for (const section of sections || []) {
            for (const mod of section.modules || []) {
              if (['assign', 'forum', 'quiz', 'choice', 'feedback', 'chat'].includes(mod.modname)) continue
              let fileUrl = null, externalUrl = null
              if (mod.modname === 'url') {
                externalUrl = mod.contents?.[0]?.fileurl || null
              } else if (mod.contents?.length > 0) {
                const f = mod.contents.find(c => c.type === 'file') || mod.contents[0]
                if (f?.fileurl) fileUrl = `${f.fileurl}${f.fileurl.includes('?') ? '&' : '?'}token=${client.token}`
              }
              if (!fileUrl && !externalUrl && mod.modname !== 'label') continue
              matRows.push({
                course_id: local.id, title: mod.name,
                description: mod.description ? mod.description.replace(/<[^>]+>/g, '').trim().slice(0, 500) : null,
                module_type: mod.modname, file_url: fileUrl, external_url: externalUrl,
                section_name: section.name || `Section ${section.section}`,
                section_num: section.section ?? 0,
                synced_from: 'moodle', moodle_id: mod.id,
              })
            }
          }
        }
        const count = await upsertByMoodleId('course_materials', matRows, log)
        log.push(`Synced ${count} materials`)
      } catch (e) { log.push(`Materials sync failed: ${e.message}`); status = 'partial' }
    }

    log.push('Sync complete')
  } catch (err) {
    status = 'failed'
    log.push(`Sync failed: ${err.message}`)
  }

  await supabaseAdmin
    .from('student_sync_config')
    .update({
      last_synced_at: new Date().toISOString(),
      last_sync_status: status,
      last_sync_log: log.join('\n'),
    })
    .eq('user_id', userId)
}
