import axios from 'axios'
import { supabaseAdmin } from './supabase.js'

// ─── URL normalizer ───────────────────────────────────────────────────────────
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

// ─── Parse session code from Moodle category name ────────────────────────────
// Moodle categories at Thapar are named like: "2526EVESEM", "2425ODDSEM", etc.
// These ARE the session codes. We normalize them to uppercase.
function parseSessionCode(categoryName = '') {
  if (!categoryName) return null
  const upper = categoryName.trim().toUpperCase()
  // Match pattern like 2526EVESEM, 2324ODDSEM, 2223EVESEM
  if (/^\d{4}(EVE|ODD|EVEN)SEM$/i.test(upper)) return upper
  // Also: some may have spaces or dashes — normalize
  const cleaned = upper.replace(/[\s\-_]/g, '')
  if (/^\d{4}(EVE|ODD|EVEN)SEM$/.test(cleaned)) return cleaned
  return categoryName.trim() // preserve as-is if doesn't match pattern
}

// ─── Extract session from Thapar course shortname ────────────────────────────
// Thapar shortnames: "UCS701-2526EVESEM", "UCS510-2526ODDSEM"
// We can also check course fullname suffix.
function parseSessionFromShortname(shortname = '') {
  const m = shortname.match(/(\d{4}(?:EVE|ODD|EVEN)SEM)$/i)
  return m ? m[1].toUpperCase() : null
}

// ─── Extract clean course code (without session suffix) ──────────────────────
// "UCS701-2526EVESEM" → "UCS701"  |  "UCS701" → "UCS701"
function cleanShortname(shortname = '') {
  return shortname.replace(/-\d{4}(?:EVE|ODD|EVEN)SEM$/i, '').trim()
}

// ─── Parse department from Thapar course fullname / category name ─────────────
// Thapar course fulnames: "THEORY OF COMPUTATION-UCS701-2526EVESEM"
// Subcategory names: "Computer Science and Engineering", "Electrical Engineering"
function parseDept(fullname = '', subCategoryName = '') {
  // Try sub-category first (most reliable) — these are the exact Moodle category names
  if (subCategoryName) {
    const sub = subCategoryName.replace(/&amp;/g, '&').trim()
    const upper = sub.toUpperCase()
    if (upper.includes('COMPUTER SCIENCE'))                       return 'COMPUTER SCIENCE & ENGINEERING'
    if (upper.includes('ELECTRONICS') && upper.includes('COMM'))  return 'ELECTRONICS & COMMUNICATION ENGINEERING'
    if (upper.includes('ELECTRICAL') && upper.includes('INST'))   return 'ELECTRICAL & INSTRUMENTATION ENGINEERING'
    if (upper.includes('ELECTRICAL'))                             return 'ELECTRICAL ENGINEERING'
    if (upper.includes('MECHANICAL'))                             return 'MECHANICAL ENGINEERING'
    if (upper.includes('CIVIL'))                                  return 'CIVIL ENGINEERING'
    if (upper.includes('CHEMICAL') && !upper.includes('BIO'))     return 'CHEMICAL ENGINEERING'
    if (upper.includes('CHEMISTRY') || upper.includes('BIOCHEM')) return 'CHEMISTRY & BIOCHEMISTRY'
    if (upper.includes('MATHEMATICS') || upper === 'MATHEMATICS') return 'MATHEMATICS'
    if (upper.includes('PHYSICS') || upper.includes('MATERIALS')) return 'PHYSICS & MATERIALS SCIENCE'
    if (upper.includes('BIOTECHNOLOGY'))                          return 'BIOTECHNOLOGY'
    if (upper.includes('ENERGY'))                                 return 'ENERGY & ENVIRONMENT'
    if (upper.includes('HUMANITIES') || upper.includes('SOCIAL')) return 'HUMANITIES & SOCIAL SCIENCES'
    if (upper.includes('LIBERAL ARTS'))                           return 'LIBERAL ARTS & SCIENCES'
    if (upper.includes('MANAGEMENT') || upper.includes('THAPAR SCHOOL')) return 'MANAGEMENT'
    if (upper.includes('TRAINING') || upper.includes('DEVELOPMENT')) return 'CENTRE FOR TRAINING & DEVELOPMENT'
    return sub // preserve original sub-category as-is
  }

  // Fall back to course code prefix parsing
  const match = fullname.match(/\b(UCS|UEE|UME|UCE|UCH|UMA|UPH|UBT|UTA|UHU|UEC|UMB|CSD|UTD|UCB|DAA)\d*/i)
  if (match) {
    const prefix = match[1].toUpperCase()
    const deptMap = {
      'UCS': 'COMPUTER SCIENCE & ENGINEERING',
      'DAA': 'COMPUTER SCIENCE & ENGINEERING',
      'CSD': 'COMPUTER SCIENCE & ENGINEERING',
      'UEE': 'ELECTRICAL & INSTRUMENTATION ENGINEERING',
      'UEC': 'ELECTRONICS & COMMUNICATION ENGINEERING',
      'UME': 'MECHANICAL ENGINEERING',
      'UCE': 'CIVIL ENGINEERING',
      'UCH': 'CHEMICAL ENGINEERING',
      'UCB': 'CHEMISTRY & BIOCHEMISTRY',
      'UMA': 'MATHEMATICS',
      'UPH': 'PHYSICS & MATERIALS SCIENCE',
      'UBT': 'BIOTECHNOLOGY',
      'UTA': 'GENERAL / ELECTIVE',
      'UTD': 'CENTRE FOR TRAINING & DEVELOPMENT',
      'UHU': 'HUMANITIES & SOCIAL SCIENCES',
      'UMB': 'MANAGEMENT',
    }
    return deptMap[prefix] || 'GENERAL'
  }

  // Fallback: try generic extraction
  const genericMatch = fullname.match(/\b(CSE|ECE|ENC|MEE|CHE|ELE|CIV|BIO|PHY|MAT|MCA|MBA|BCA|CSAI|CSBS|AIDS|IT)\b/i)
  if (genericMatch) return genericMatch[1].toUpperCase()

  return 'GENERAL'
}

// ─── Batch runner ─────────────────────────────────────────────────────────────
async function batch(items, concurrency, fn) {
  const results = []
  for (let i = 0; i < items.length; i += concurrency) {
    const chunk = items.slice(i, i + concurrency)
    const res = await Promise.allSettled(chunk.map(fn))
    results.push(...res)
  }
  return results
}

// ─── Build local course cache ─────────────────────────────────────────────────
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

// ─── DB upsert helper ─────────────────────────────────────────────────────────
async function upsertByMoodleId(table, rows, log) {
  if (rows.length === 0) return 0
  // Cast to string — works for both old BIGINT and new TEXT moodle_id columns
  const moodleIds = rows.map(r => String(r.moodle_id)).filter(Boolean)
  const { data: existing } = await supabaseAdmin
    .from(table).select('id, moodle_id').in('moodle_id', moodleIds)
  const existMap = {}
  for (const e of existing || []) existMap[String(e.moodle_id)] = e.id

  const toInsert = []
  const toUpdate = []
  for (const row of rows) {
    const mid = String(row.moodle_id)
    if (existMap[mid]) {
      toUpdate.push({ ...row, moodle_id: mid, id: existMap[mid], updated_at: new Date().toISOString() })
    } else {
      toInsert.push({ ...row, moodle_id: mid })
    }
  }

  let count = 0
  if (toInsert.length > 0) {
    const { error } = await supabaseAdmin.from(table).insert(toInsert)
    if (error) log.push(`  ✗ ${table} insert: ${error.message}`)
    else count += toInsert.length
  }
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

// ─── MoodleClient ─────────────────────────────────────────────────────────────
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

  async getSiteInfo()             { return this.call('core_webservice_get_site_info') }
  async getMyCourses(userId)      { return this.call('core_enrol_get_users_courses', { userid: userId }) }
  async getAllCourses()           { return this.call('core_course_get_courses') }
  async getCourseContents(cId)   { return this.call('core_course_get_contents', { courseid: cId }) }

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

  // Get ALL categories (session list) — no filter
  async getAllCategories() {
    try {
      const res = await this.call('core_course_get_categories', {
        'criteria[0][key]': 'parent',
        'criteria[0][value]': '0',
      })
      return Array.isArray(res) ? res : []
    } catch { return [] }
  }

  async getForumsByCourses(courseIds = []) {
    return this.call('mod_forum_get_forums_by_courses',
      Object.fromEntries(courseIds.map((id, i) => [`courseids[${i}]`, id]))
    )
  }

  async getForumDiscussions(forumId, page = 0, perpage = 50) {
    return this.call('mod_forum_get_forum_discussions', { forumid: forumId, page, perpage })
  }

  async getAssignments(courseIds = []) {
    return this.call('mod_assign_get_assignments',
      Object.fromEntries(courseIds.map((id, i) => [`courseids[${i}]`, id]))
    )
  }

  async getGradesTable(courseId, userId) {
    return this.call('gradereport_user_get_grades_table', { courseid: courseId, userid: userId })
  }

  // Get completion status for all courses (percentage viewed)
  async getCourseCompletion(courseId, userId) {
    try {
      return await this.call('core_completion_get_course_completion_status', {
        courseid: courseId, userid: userId,
      })
    } catch { return null }
  }

  // Get activities completion in bulk
  async getActivitiesCompletion(courseId, userId) {
    try {
      return await this.call('core_completion_get_activities_completion_status', {
        courseid: courseId, userid: userId,
      })
    } catch { return null }
  }
}

// ─── Student personal sync (parallelized, with session-code extraction) ────────
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
    log.push(`Logged in as: ${siteInfo.fullname} (Moodle user ID: ${moodleUserId})`)

    // ── 1. Fetch enrolled courses ─────────────────────────────────────────────
    let moodleCourses = []
    try {
      moodleCourses = ((await client.getMyCourses(moodleUserId)) || [])
        .filter(c => c.id !== 1 && c.id !== 0)
    } catch {
      moodleCourses = ((await client.getAllCourses()) || [])
        .filter(c => c.id !== 1 && c.id !== 0)
    }
    log.push(`Found ${moodleCourses.length} enrolled courses in Moodle`)

    // ── 2. Fetch categories to get session codes ──────────────────────────────
    // Build a two-level category map: catId → { name, parent }
    // For Thapar: top-level cats are sessions (2526EVESEM), children are departments
    const catIds = [...new Set(moodleCourses.map(c => c.category).filter(Boolean))]
    const categories = await client.getCategories(catIds)
    
    // Build cat map with parent resolution
    const catMap = {} // catId → { name, parent }
    for (const cat of categories) catMap[cat.id] = { name: cat.name, parent: cat.parent }

    // For parent IDs we may not have yet, fetch them too
    const parentIds = [...new Set(categories.map(c => c.parent).filter(Boolean).filter(p => !catMap[p]))]
    if (parentIds.length > 0) {
      const parentCats = await client.getCategories(parentIds)
      for (const cat of parentCats) catMap[cat.id] = { name: cat.name, parent: cat.parent }
    }

    // ── 3. Resolve session code for each course ───────────────────────────────
    // Thapar structure: course.category = dept sub-category ID
    // dept sub-category.parent = session top-category ID (e.g., 2526EVESEM)
    // We also check the shortname suffix for redundancy
    function resolveCourse(mc) {
      const catInfo = catMap[mc.category] || {}
      const subCatName = catInfo.name || mc.categoryname || ''
      const parentCatInfo = catMap[catInfo.parent] || {}
      const parentCatName = parentCatInfo.name || ''

      // Session code: prefer parent category name (top-level), fall back to shortname suffix
      let sessionCode = parseSessionCode(parentCatName)
        || parseSessionFromShortname(mc.shortname)
        || parseSessionCode(subCatName)  // sometimes the direct category IS the session
        || mc.categoryname || null

      // Department: from sub-category (most accurate)
      const dept = parseDept(mc.fullname || '', subCatName)

      // Clean shortname (strip session suffix if present)
      const cleanCode = cleanShortname(mc.shortname || `MOODLE-${mc.id}`)

      return { sessionCode, dept, subCatName, cleanCode }
    }

    // ── 4. Upsert courses into SnapLocate ────────────────────────────────────
    const courseKeyMap = {} // moodleId → { cleanCode, sessionCode, ... }
    for (const mc of moodleCourses) {
      const resolved = resolveCourse(mc)
      courseKeyMap[mc.id] = { ...resolved, moodleCourseId: mc.id, fullname: mc.fullname, shortname: mc.shortname }
    }

    // Check existing courses by code
    const allCleanCodes = Object.values(courseKeyMap).map(v => v.cleanCode)
    const { data: existingCourses } = await supabaseAdmin
      .from('courses')
      .select('id, code')
      .in('code', allCleanCodes)
    const existMap = {}
    for (const c of existingCourses || []) existMap[c.code] = c.id

    // Also check by moodle_course_id if column exists
    const { data: existByMoodleId } = await supabaseAdmin
      .from('courses')
      .select('id, code, moodle_course_id')
      .in('moodle_course_id', Object.keys(courseKeyMap).map(Number))
    for (const c of existByMoodleId || []) {
      if (c.moodle_course_id) existMap[`mid:${c.moodle_course_id}`] = c.id
    }

    const toInsert = []
    const toUpdate = []
    for (const mc of moodleCourses) {
      const r = courseKeyMap[mc.id]
      const name = mc.fullname || mc.shortname
      // Prefer lookup by moodle_course_id, then by clean code
      const existingId = existMap[`mid:${mc.id}`] || existMap[r.cleanCode]

      const row = {
        code: r.cleanCode,
        name,
        semester: r.sessionCode,  // e.g. "2526EVESEM"
        dept: r.dept,
        synced_from: 'moodle',
        moodle_course_id: mc.id,  // store the Moodle course ID for progress fetching
      }

      if (existingId) {
        toUpdate.push({ id: existingId, ...row })
        existMap[r.cleanCode] = existingId  // ensure code → id mapping
      } else {
        toInsert.push(row)
      }
    }

    let coursesSynced = 0
    if (toInsert.length > 0) {
      const { data: inserted, error } = await supabaseAdmin
        .from('courses').insert(toInsert).select('id, code, moodle_course_id')
      if (error) log.push(`  ✗ course insert: ${error.message}`)
      else {
        coursesSynced += toInsert.length
        for (const c of inserted || []) {
          existMap[c.code] = c.id
          if (c.moodle_course_id) existMap[`mid:${c.moodle_course_id}`] = c.id
        }
      }
    }
    if (toUpdate.length > 0) {
      const results = await Promise.allSettled(
        toUpdate.map(({ id, ...rest }) => supabaseAdmin.from('courses').update(rest).eq('id', id))
      )
      coursesSynced += results.filter(r => r.status === 'fulfilled' && !r.value.error).length
    }
    log.push(`Synced ${coursesSynced} courses (${toInsert.length} new, ${toUpdate.length} updated)`)

    // ── 5. Enroll student in all synced courses ───────────────────────────────
    // Get org_id from student_sync_config or student_profiles table
    let orgId = config.org_id || null
    if (!orgId) {
      const { data: sp } = await supabaseAdmin
        .from('student_profiles').select('org_id').eq('user_id', userId).maybeSingle()
      orgId = sp?.org_id || null
    }
    if (!orgId) {
      // Get the first org as fallback
      const { data: orgs } = await supabaseAdmin.from('organizations').select('id').limit(1)
      orgId = orgs?.[0]?.id || null
    }

    if (!orgId) {
      log.push('⚠ Could not determine org_id — skipping enrollment (enrollments still in course table)')
    } else {
      const enrollRows = Object.entries(courseKeyMap)
        .map(([moodleId]) => {
          const cleanCode = courseKeyMap[moodleId].cleanCode
          const courseId  = existMap[`mid:${moodleId}`] || existMap[cleanCode]
          if (!courseId) return null
          return { org_id: orgId, student_id: userId, course_id: courseId, status: 'active' }
        })
        .filter(Boolean)

      if (enrollRows.length > 0) {
        const { error: enrollErr } = await supabaseAdmin
          .from('course_enrollments')
          .upsert(enrollRows, { onConflict: 'course_id,student_id', ignoreDuplicates: true })
        if (enrollErr) log.push(`  ✗ enrollment upsert: ${enrollErr.message}`)
        else log.push(`Enrolled student in ${enrollRows.length} courses`)
      }
    }

    // ── 6. Fetch completion/progress for each course ──────────────────────────
    if (moodleCourses.length > 0) {
      const progressResults = await batch(moodleCourses, 5, async (mc) => {
        const courseId = existMap[`mid:${mc.id}`] || existMap[courseKeyMap[mc.id]?.cleanCode]
        if (!courseId) return null

        let progress = null
        try {
          const comp = await client.getActivitiesCompletion(mc.id, moodleUserId)
          if (comp?.statuses) {
            const total = comp.statuses.length
            const done  = comp.statuses.filter(s => s.state === 1).length
            progress = total > 0 ? Math.round((done / total) * 100) : 0
          }
        } catch { /* no completion tracking */ }

        if (progress !== null) {
          await supabaseAdmin.from('courses').update({ progress }).eq('id', courseId)
        }
        return { courseId, progress }
      })
      const withProgress = progressResults.filter(r => r.status === 'fulfilled' && r.value?.progress !== null).length
      log.push(`Fetched completion progress for ${withProgress} courses`)
    }

    // ── 7. Fetch assignments, announcements, materials in parallel ────────────
    if (moodleCourses.length === 0) {
      log.push('No courses to sync content for.'); status = 'partial'
    } else {
      const moodleCourseIds = moodleCourses.map(c => c.id)
      const courseCodeMap = {}
      for (const mc of moodleCourses) courseCodeMap[mc.id] = courseKeyMap[mc.id].cleanCode

      const localCache = await buildCourseCache(Object.values(courseCodeMap))

      const [assignResult, forumResult, contentsResult] = await Promise.allSettled([
        client.getAssignments(moodleCourseIds),
        client.getForumsByCourses(moodleCourseIds),
        batch(moodleCourses, 5, async (mc) => {
          const sections = await client.getCourseContents(mc.id)
          return { shortname: courseKeyMap[mc.id].cleanCode, sections }
        }),
      ])

      // Assignments
      try {
        if (assignResult.status !== 'fulfilled') throw new Error(assignResult.reason?.message || 'fetch failed')
        const { courses: assignCourses } = assignResult.value
        const rows = []
        for (const ac of assignCourses || []) {
          const cleanCode = cleanShortname(ac.shortname || '')
          const local = localCache[cleanCode]
          if (!local) continue
          for (const asgn of ac.assignments || []) {
            rows.push({
              course_id: local.id, faculty_id: local.faculty_id || null,
              title: asgn.name,
              description: asgn.intro ? asgn.intro.replace(/<[^>]+>/g, '').trim() : null,
              due_date: asgn.duedate
                ? new Date(asgn.duedate * 1000).toISOString()
                : new Date(Date.now() + 30 * 86400000).toISOString(),
              max_marks: asgn.grade > 0 ? asgn.grade : 100,
              synced_from: 'moodle', moodle_id: asgn.id,
            })
          }
        }
        // Strip org_id requirement from assignments (nullable in sync path)
        const cleanRows = rows.map(r => ({ ...r }))
        const count = await upsertByMoodleId('assignments', cleanRows, log)
        log.push(`Synced ${count} assignments`)
      } catch (e) { log.push(`Assignment sync failed: ${e.message}`); status = 'partial' }

      // Announcements (Moodle news forums)
      try {
        if (forumResult.status !== 'fulfilled') throw new Error(forumResult.reason?.message || 'fetch failed')
        const forums = forumResult.value
        const newsForums = (forums || []).filter(f => f.type === 'news')

        const discResults = await batch(newsForums, 5, async (forum) => {
          const shortname = cleanShortname(courseCodeMap[forum.course] || '')
          const local = localCache[shortname]
          if (!local) return { rows: [] }
          const result = await client.getForumDiscussions(forum.id)
          const discussions = result?.discussions || result || []
          return {
            rows: discussions.map(disc => {
              // Use real Moodle timestamp (timemodified > timecreated > timestart)
              const moodleTs = disc.timemodified || disc.timecreated || disc.timestart || null
              const postedAt = moodleTs ? new Date(moodleTs * 1000).toISOString() : null
              return {
                course_id: local.id, faculty_id: null,
                title: disc.name || disc.subject || 'Announcement',
                message: disc.message ? disc.message.replace(/<[^>]+>/g, '').trim().slice(0, 2000) : '',
                is_pinned: disc.pinned || false,
                synced_from: 'moodle', moodle_id: disc.discussion || disc.id,
                // Store real Moodle post time — falls back to now only if completely missing
                posted_at: postedAt,
              }
            })
          }
        })
        const annRows = discResults.flatMap(r => r.status === 'fulfilled' ? r.value.rows : [])
        const count = await upsertByMoodleId('course_announcements', annRows, log)
        log.push(`Synced ${count} announcements`)
      } catch (e) { log.push(`Announcement sync failed: ${e.message}`); status = 'partial' }

      // Course materials
      try {
        if (contentsResult.status !== 'fulfilled') throw new Error('contents fetch failed')
        const matRows = []
        for (const r of contentsResult.value) {
          if (r.status !== 'fulfilled') continue
          const { shortname, sections } = r.value
          const local = localCache[shortname]
          if (!local) continue
          for (const section of sections || []) {
            const sectionName = section.name || `Section ${section.section}`
            const sectionNum  = section.section ?? 0

            for (const mod of section.modules || []) {
              // Skip activity types we never display
              if (['assign', 'forum', 'quiz', 'choice', 'feedback', 'chat'].includes(mod.modname)) continue

              // ── FOLDER: expand every file inside ──────────────────────────────
              if (mod.modname === 'folder') {
                const folderFiles = (mod.contents || []).filter(c => c.type === 'file' && c.fileurl)
                if (folderFiles.length === 0) {
                  // Folder exists but no files synced yet — store the folder placeholder
                  matRows.push({
                    course_id: local.id, title: mod.name,
                    description: 'Folder (no files available)',
                    module_type: 'folder', file_url: null, external_url: null,
                    section_name: sectionName, section_num: sectionNum,
                    synced_from: 'moodle', moodle_id: mod.id,
                  })
                } else {
                  // Store each file inside the folder as its own row
                  folderFiles.forEach((f, fi) => {
                    const rawUrl = f.fileurl
                    // Moodle already embeds token in fileurl from core_course_get_contents
                    // Only append our token if not already present
                    const fileUrl = rawUrl.includes('token=')
                      ? rawUrl
                      : `${rawUrl}${rawUrl.includes('?') ? '&' : '?'}token=${client.token}`
                    matRows.push({
                      course_id: local.id,
                      title: f.filename || f.filepath || `File ${fi + 1}`,
                      description: `📁 ${mod.name}`,   // parent folder name for context
                      module_type: 'folder_file',
                      file_url: fileUrl, external_url: null,
                      section_name: sectionName, section_num: sectionNum,
                      // Use a composite moodle_id so each file is unique
                      synced_from: 'moodle', moodle_id: `${mod.id}_${fi}`,
                    })
                  })
                }
                continue
              }

              // ── URL resource ──────────────────────────────────────────────────
              let fileUrl = null, externalUrl = null
              if (mod.modname === 'url') {
                externalUrl = mod.contents?.[0]?.fileurl || mod.contents?.[0]?.externalurl || null
              } else if (mod.contents?.length > 0) {
                // For resource/page/file — pick the first actual file
                const f = mod.contents.find(c => c.type === 'file') || mod.contents[0]
                if (f?.fileurl) {
                  const raw = f.fileurl
                  // Moodle already embeds token in fileurl — only append if not already there
                  fileUrl = raw.includes('token=')
                    ? raw
                    : `${raw}${raw.includes('?') ? '&' : '?'}token=${client.token}`
                }
              }

              if (!fileUrl && !externalUrl && mod.modname !== 'label') continue

              matRows.push({
                course_id: local.id, title: mod.name,
                description: mod.description ? mod.description.replace(/<[^>]+>/g, '').trim().slice(0, 500) : null,
                module_type: mod.modname, file_url: fileUrl, external_url: externalUrl,
                section_name: sectionName, section_num: sectionNum,
                synced_from: 'moodle', moodle_id: mod.id,
              })
            }
          }
        }
        const count = await upsertByMoodleId('course_materials', matRows, log)
        log.push(`Synced ${count} course materials`)
      } catch (e) { log.push(`Materials sync failed: ${e.message}`); status = 'partial' }
    }

    log.push('Sync complete ✓')
  } catch (err) {
    status = 'failed'
    log.push(`Sync failed: ${err.message}`)
    console.error('[Student sync error]', err)
  }

  await supabaseAdmin
    .from('student_sync_config')
    .update({
      last_synced_at:   new Date().toISOString(),
      last_sync_status: status,
      last_sync_log:    log.join('\n'),
    })
    .eq('user_id', userId)

  return { status, log }
}

// ─── Admin-level Moodle sync ───────────────────────────────────────────────────
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

      // ── 1. Sync courses ─────────────────────────────────────────────────────
      let moodleCourses = []
      try {
        let raw = []
        try { raw = await client.getMyCourses(userId) }
        catch { raw = await client.getAllCourses() }

        moodleCourses = (raw || []).filter(c => c.id !== 1 && c.id !== 0)
        log.push(`Found ${moodleCourses.length} courses in Moodle`)

        // Fetch ALL categories for category tree
        const categoryIds = [...new Set(moodleCourses.map(c => c.category).filter(Boolean))]
        const categories  = await client.getCategories(categoryIds)
        const catMap = {}
        for (const cat of categories) catMap[cat.id] = { name: cat.name, parent: cat.parent }

        // Fetch parent categories
        const parentIds = [...new Set(categories.map(c => c.parent).filter(Boolean).filter(p => !catMap[p]))]
        if (parentIds.length > 0) {
          const parentCats = await client.getCategories(parentIds)
          for (const cat of parentCats) catMap[cat.id] = { name: cat.name, parent: cat.parent }
        }

        log.push(`Fetched ${categories.length} categories`)

        const codes = moodleCourses.map(mc => cleanShortname(mc.shortname || `MOODLE-${mc.id}`))
        const { data: existingCourses } = await supabaseAdmin
          .from('courses').select('id, code').in('code', codes)
        const existMap = {}
        for (const c of existingCourses || []) existMap[c.code] = c.id

        const toInsert = [], toUpdate = []
        for (const mc of moodleCourses) {
          const catInfo    = catMap[mc.category] || {}
          const parentInfo = catMap[catInfo.parent] || {}
          const sessionCode = parseSessionCode(parentInfo.name)
            || parseSessionFromShortname(mc.shortname)
            || parseSessionCode(catInfo.name)
            || mc.categoryname || null
          const dept    = parseDept(mc.fullname || '', catInfo.name || '')
          const code    = cleanShortname(mc.shortname || `MOODLE-${mc.id}`)
          const name    = mc.fullname || mc.shortname

          const row = { code, name, semester: sessionCode, dept, synced_from: 'moodle', moodle_course_id: mc.id }
          if (existMap[code]) toUpdate.push({ id: existMap[code], ...row })
          else toInsert.push(row)
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

      log.push('Admin Moodle sync complete')
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
