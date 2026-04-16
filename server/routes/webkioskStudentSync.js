/**
 * Per-Student WebKiosk Sync Routes
 *  GET  /api/webkiosk/status        — connection status + cached data
 *  POST /api/webkiosk/connect       — save credentials + run first sync
 *  POST /api/webkiosk/sync          — re-trigger sync (async)
 *  DELETE /api/webkiosk/disconnect  — remove credentials & data
 */
import { Router } from 'express'
import { z } from 'zod'
import { supabaseAdmin } from '../lib/supabase.js'
import { authenticate, requireStudent } from '../middleware/auth.js'
import { runStudentWebKioskSync } from '../lib/webkiosk.js'

const router = Router()

// ── Helper: get or null the webkiosk config row ───────────────────
async function getConfig(userId) {
  const { data } = await supabaseAdmin
    .from('student_sync_config')
    .select('*')
    .eq('user_id', userId)
    .eq('provider', 'webkiosk')
    .maybeSingle()
  return data || null
}

// ── Parse the stored JSON blob (log+data) from last_sync_log ──────
function parseLogBlob(raw) {
  if (!raw) return { log: '', data: null }
  try { return JSON.parse(raw) } catch { return { log: raw, data: null } }
}

// ─────────────────────────────────────────────────────────────────
// GET /api/webkiosk/status
// Returns connection status + all cached scraped data
// ─────────────────────────────────────────────────────────────────
router.get('/status', authenticate, requireStudent, async (req, res) => {
  try {
    const config = await getConfig(req.user.id)
    if (!config) return res.json({ success: true, connected: false, data: null })

    const { log, data } = parseLogBlob(config.last_sync_log)

    res.json({
      success:   true,
      connected: true,
      enrollmentNo:     config.credentials_json?.username || null,
      lastSyncedAt:     config.last_synced_at || null,
      lastSyncStatus:   config.last_sync_status || 'never',
      lastSyncLog:      log,
      data:             data || null,
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ─────────────────────────────────────────────────────────────────
// POST /api/webkiosk/connect
// Body: { enrollment_no, password }
// Saves creds and triggers first sync (responds immediately, sync runs async)
// ─────────────────────────────────────────────────────────────────
router.post('/connect', authenticate, requireStudent, async (req, res) => {
  const schema = z.object({
    enrollment_no: z.string().min(3),
    password:      z.string().min(1),
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.errors })

  const { enrollment_no, password } = parsed.data
  const userId = req.user.id

  try {
    // Upsert using manual select-update/insert to support both Moodle + WebKiosk
    const existing = await getConfig(userId)

    const payload = {
      user_id:          userId,
      provider:         'webkiosk',
      base_url:         'https://webkiosk.thapar.edu',
      credentials_json: { username: enrollment_no, password },
      last_sync_status: 'pending',
      last_sync_log:    null,
      last_synced_at:   null,
    }

    let config
    if (existing) {
      const { data } = await supabaseAdmin
        .from('student_sync_config')
        .update(payload)
        .eq('id', existing.id)
        .select()
        .single()
      config = data
    } else {
      const { data } = await supabaseAdmin
        .from('student_sync_config')
        .insert(payload)
        .select()
        .single()
      config = data
    }

    // Return immediately so the client can show the syncing UI
    res.json({ success: true, message: 'Credentials saved. Sync started.', config })

    // Run sync in background
    runStudentWebKioskSync(userId).catch(err =>
      console.error('[WebKiosk student sync]', err.message)
    )
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ─────────────────────────────────────────────────────────────────
// POST /api/webkiosk/sync
// Re-triggers a sync for the authenticated student
// ─────────────────────────────────────────────────────────────────
router.post('/sync', authenticate, requireStudent, async (req, res) => {
  const userId = req.user.id
  try {
    const config = await getConfig(userId)
    if (!config) return res.status(404).json({ success: false, error: 'WebKiosk not connected. Please connect first.' })

    // Mark as pending
    await supabaseAdmin
      .from('student_sync_config')
      .update({ last_sync_status: 'pending' })
      .eq('id', config.id)

    res.json({ success: true, message: 'WebKiosk sync started.' })

    // Background sync
    runStudentWebKioskSync(userId).catch(err =>
      console.error('[WebKiosk student sync]', err.message)
    )
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ─────────────────────────────────────────────────────────────────
// DELETE /api/webkiosk/disconnect
// Removes credentials and cached data for this student
// ─────────────────────────────────────────────────────────────────
router.delete('/disconnect', authenticate, requireStudent, async (req, res) => {
  try {
    await supabaseAdmin
      .from('student_sync_config')
      .delete()
      .eq('user_id', req.user.id)
      .eq('provider', 'webkiosk')

    res.json({ success: true, message: 'WebKiosk disconnected.' })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ─────────────────────────────────────────────────────────────────
// GET /api/webkiosk/attendance — quick accessor
// ─────────────────────────────────────────────────────────────────
router.get('/attendance', authenticate, requireStudent, async (req, res) => {
  try {
    const config = await getConfig(req.user.id)
    if (!config) return res.json({ success: true, data: [] })
    const { data: blob } = parseLogBlob(config.last_sync_log)
    res.json({ success: true, data: blob?.attendance || [] })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ─────────────────────────────────────────────────────────────────
// GET /api/webkiosk/result
// ─────────────────────────────────────────────────────────────────
router.get('/result', authenticate, requireStudent, async (req, res) => {
  try {
    const config = await getConfig(req.user.id)
    if (!config) return res.json({ success: true, data: null })
    const { data: blob } = parseLogBlob(config.last_sync_log)
    res.json({ success: true, data: blob?.result || null })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ─────────────────────────────────────────────────────────────────
// GET /api/webkiosk/fees
// ─────────────────────────────────────────────────────────────────
router.get('/fees', authenticate, requireStudent, async (req, res) => {
  try {
    const config = await getConfig(req.user.id)
    if (!config) return res.json({ success: true, data: null })
    const { data: blob } = parseLogBlob(config.last_sync_log)
    res.json({ success: true, data: blob?.fees || null })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ─────────────────────────────────────────────────────────────────
// GET /api/webkiosk/profile
// ─────────────────────────────────────────────────────────────────
router.get('/profile', authenticate, requireStudent, async (req, res) => {
  try {
    const config = await getConfig(req.user.id)
    if (!config) return res.json({ success: true, data: null })
    const { data: blob } = parseLogBlob(config.last_sync_log)
    res.json({ success: true, data: blob?.profile || null })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ─────────────────────────────────────────────────────────────────
// GET /api/webkiosk/courses
// ─────────────────────────────────────────────────────────────────
router.get('/courses', authenticate, requireStudent, async (req, res) => {
  try {
    const config = await getConfig(req.user.id)
    if (!config) return res.json({ success: true, data: [] })
    const { data: blob } = parseLogBlob(config.last_sync_log)
    res.json({ success: true, data: blob?.registeredCourses || [] })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
