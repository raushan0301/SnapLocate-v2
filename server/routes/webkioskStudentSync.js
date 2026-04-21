/**
 * Per-Student WebKiosk Sync Routes
 *
 * DB Note: `student_sync_config` has a UNIQUE constraint on `user_id` alone.
 * WebKiosk credentials are stored NESTED inside `credentials_json.webkiosk`
 * so Moodle and WebKiosk can coexist in the same row.
 *
 * credentials_json shape:
 *   {
 *     username: "moodle_user",   ← Moodle creds (top-level, set by studentSync.js)
 *     password: "moodle_pass",
 *     webkiosk: {                ← WebKiosk creds (nested, set by this file)
 *       username: "102303986",
 *       password: "1501"
 *     }
 *   }
 *
 * last_sync_log shape after webkiosk sync:
 *   {
 *     webkiosk: { log: "...", data: {...} },
 *     [other providers preserved]
 *   }
 */
import { Router }                 from 'express'
import { z }                      from 'zod'
import { supabaseAdmin }          from '../lib/supabase.js'
import { authenticate, requireStudent } from '../middleware/auth.js'
import { runStudentWebKioskSync } from '../lib/webkiosk.js'

const router = Router()

// ─── Helpers ──────────────────────────────────────────────────────

/** Get the student_sync_config row that has webkiosk credentials */
async function getWebkioskRow(userId) {
  const { data } = await supabaseAdmin
    .from('student_sync_config')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (!data) return null

  // Check if webkiosk creds exist (nested or top-level for pure webkiosk rows)
  const hasWk =
    !!(data.credentials_json?.webkiosk?.username) ||
    (data.provider === 'webkiosk' && !!data.credentials_json?.username)

  return hasWk ? data : null
}

/** Parse last_sync_log → { log, data } for the webkiosk section */
function parseWkBlob(config) {
  if (!config?.last_sync_log) return { log: '', data: {} }
  try {
    const parsed = JSON.parse(config.last_sync_log)
    // v2: merged multi-provider format
    if (parsed.webkiosk) return { log: parsed.webkiosk.log || '', data: parsed.webkiosk.data || {} }
    // v1: old flat webkiosk-only format
    if (parsed.data)     return { log: parsed.log  || '', data: parsed.data  || {} }
    return { log: '', data: {} }
  } catch {
    return { log: typeof config.last_sync_log === 'string' ? config.last_sync_log : '', data: {} }
  }
}

/** Run sync in background (fire-and-forget) */
function bgSync(userId) {
  runStudentWebKioskSync(userId).catch(err =>
    console.error('[WebKiosk BG Sync]', err.message)
  )
}

// ─── GET /status ──────────────────────────────────────────────────
router.get('/status', authenticate, requireStudent, async (req, res) => {
  try {
    const row = await getWebkioskRow(req.user.id)
    if (!row) return res.json({ success: true, connected: false, data: null })

    const { log, data } = parseWkBlob(row)
    const enrollmentNo  = row.credentials_json?.webkiosk?.username ||
                          (row.provider === 'webkiosk' ? row.credentials_json?.username : null)

    res.json({
      success:        true,
      connected:      true,
      enrollmentNo,
      lastSyncedAt:   row.last_synced_at   || null,
      lastSyncStatus: row.last_sync_status || 'never',
      lastSyncLog:    log,
      data:           Object.keys(data).length ? data : null,
    })
  } catch (err) {
    console.error('[WebKiosk /status]', err)
    res.status(500).json({ success: false, error: err.message })
  }
})

// ─── POST /connect ────────────────────────────────────────────────
router.post('/connect', authenticate, requireStudent, async (req, res) => {
  const schema = z.object({
    enrollment_no: z.string().min(3, 'Enrollment number required'),
    password:      z.string().min(1, 'Password required'),
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: parsed.error.errors.map(e => e.message).join(', '),
    })
  }

  const { enrollment_no, password } = parsed.data
  const userId  = req.user.id
  const wkCreds = { username: enrollment_no.trim(), password: password.trim() }

  try {
    // Get ANY existing row for this user (any provider)
    const { data: existingRow } = await supabaseAdmin
      .from('student_sync_config')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    let config

    if (existingRow) {
      // Merge WebKiosk creds into existing row's credentials_json
      const mergedCreds = {
        ...(existingRow.credentials_json || {}),
        webkiosk: wkCreds,
      }
      const { data, error } = await supabaseAdmin
        .from('student_sync_config')
        .update({
          credentials_json: mergedCreds,
          last_sync_status: 'pending',
        })
        .eq('id', existingRow.id)
        .select()
        .single()
      if (error) throw error
      config = data
    } else {
      // No row at all — insert a fresh webkiosk row
      const { data, error } = await supabaseAdmin
        .from('student_sync_config')
        .insert({
          user_id:          userId,
          provider:         'webkiosk',
          base_url:         'https://webkiosk.thapar.edu',
          credentials_json: { webkiosk: wkCreds },
          last_sync_status: 'pending',
        })
        .select()
        .single()
      if (error) throw error
      config = data
    }

    res.json({ success: true, message: 'Connected. Sync started in background.', config })
    bgSync(userId)

  } catch (err) {
    console.error('[WebKiosk /connect]', err)
    res.status(500).json({ success: false, error: err.message })
  }
})

// ─── POST /sync ───────────────────────────────────────────────────
router.post('/sync', authenticate, requireStudent, async (req, res) => {
  try {
    const row = await getWebkioskRow(req.user.id)
    if (!row) {
      return res.status(404).json({ success: false, error: 'WebKiosk not connected. Please connect first.' })
    }

    await supabaseAdmin
      .from('student_sync_config')
      .update({ last_sync_status: 'pending' })
      .eq('id', row.id)

    res.json({ success: true, message: 'Sync started.' })
    bgSync(req.user.id)
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ─── DELETE /disconnect ───────────────────────────────────────────
router.delete('/disconnect', authenticate, requireStudent, async (req, res) => {
  try {
    const { data: existingRow } = await supabaseAdmin
      .from('student_sync_config')
      .select('*')
      .eq('user_id', req.user.id)
      .maybeSingle()

    if (!existingRow) return res.json({ success: true, message: 'Already disconnected.' })

    const creds = { ...(existingRow.credentials_json || {}) }
    delete creds.webkiosk

    if (existingRow.provider === 'webkiosk') {
      // Webkiosk-only row — delete it entirely
      await supabaseAdmin.from('student_sync_config').delete().eq('id', existingRow.id)
    } else {
      // Moodle row — just remove the webkiosk key
      await supabaseAdmin
        .from('student_sync_config')
        .update({ credentials_json: creds })
        .eq('id', existingRow.id)
    }

    res.json({ success: true, message: 'WebKiosk disconnected.' })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ─── Cached data sub-endpoints ────────────────────────────────────
async function sendCachedData(userId, key, res) {
  try {
    const row = await getWebkioskRow(userId)
    if (!row) {
      return res.json({ success: true, data: key === 'fees' ? null : [], syncStatus: 'disconnected' })
    }
    const { data } = parseWkBlob(row)
    return res.json({
      success:      true,
      data:         data?.[key] ?? (key === 'fees' ? null : []),
      syncStatus:   row.last_sync_status || 'never',
      lastSyncedAt: row.last_synced_at   || null,
    })
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message })
  }
}

router.get('/attendance', authenticate, requireStudent, (req, res) => sendCachedData(req.user.id, 'attendance',        res))
router.get('/result',     authenticate, requireStudent, (req, res) => sendCachedData(req.user.id, 'result',            res))
router.get('/fees',       authenticate, requireStudent, (req, res) => sendCachedData(req.user.id, 'fees',              res))
router.get('/profile',    authenticate, requireStudent, (req, res) => sendCachedData(req.user.id, 'profile',           res))
router.get('/courses',    authenticate, requireStudent, (req, res) => sendCachedData(req.user.id, 'registeredCourses', res))
router.get('/timetable',  authenticate, requireStudent, (req, res) => sendCachedData(req.user.id, 'timetable',         res))
router.get('/exams',      authenticate, requireStudent, (req, res) => sendCachedData(req.user.id, 'examSchedule',      res))

export default router
