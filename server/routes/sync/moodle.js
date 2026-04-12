import { Router } from 'express'
import { z } from 'zod'
import { supabaseAdmin } from '../../lib/supabase.js'
import { authenticate, requireAdmin } from '../../middleware/auth.js'
import { runMoodleSync } from '../../lib/moodle.js'

const router = Router()

function redactConfig(config) {
  const { credentials_json, ...safe } = config
  return { ...safe, credentials_json: { configured: !!(credentials_json?.username) } }
}

// GET /api/sync/moodle/status
router.get('/status', authenticate, requireAdmin, async (_req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('external_sync_config')
      .select('*')
      .eq('provider', 'moodle')
      .single()
    if (error && error.code !== 'PGRST116') throw error
    res.json({ success: true, data: data ? redactConfig(data) : null })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// GET /api/sync/moodle/config
router.get('/config', authenticate, requireAdmin, async (_req, res) => {
  try {
    const { data } = await supabaseAdmin
      .from('external_sync_config')
      .select('*')
      .eq('provider', 'moodle')
      .single()
    res.json({ success: true, data: data ? redactConfig(data) : null })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// POST /api/sync/moodle/config
router.post('/config', authenticate, requireAdmin, async (req, res) => {
  const schema = z.object({
    base_url:  z.string().url(),
    username:  z.string().min(1),
    password:  z.string().min(1),
    sync_modules: z.object({
      assignments: z.boolean().optional(),
      grades:      z.boolean().optional(),
    }).optional(),
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.errors })

  try {
    const { data, error } = await supabaseAdmin
      .from('external_sync_config')
      .upsert({
        provider:         'moodle',
        base_url:         parsed.data.base_url,
        credentials_json: { username: parsed.data.username, password: parsed.data.password },
        sync_modules:     parsed.data.sync_modules || { assignments: true, grades: true },
        is_active:        true,
        updated_at:       new Date().toISOString(),
      }, { onConflict: 'provider' })
      .select()
      .single()
    if (error) throw error
    res.json({ success: true, data: redactConfig(data), message: 'Moodle credentials saved' })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// POST /api/sync/moodle/trigger
router.post('/trigger', authenticate, requireAdmin, async (_req, res) => {
  try {
    res.json({ success: true, message: 'Moodle sync started. Check /status for progress.' })
    await runMoodleSync()
  } catch (err) {
    console.error('[Moodle sync error]', err.message)
  }
})

export default router
