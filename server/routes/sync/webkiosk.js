import { Router } from 'express'
import { z } from 'zod'
import { supabaseAdmin } from '../../lib/supabase.js'
import { authenticate, requireAdmin } from '../../middleware/auth.js'
import { runWebKioskSync, encryptCredentials, redactConfig } from '../../lib/webkiosk.js'

const router = Router()

// GET /api/sync/webkiosk/status
router.get('/status', authenticate, requireAdmin, async (_req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('external_sync_config')
      .select('*')
      .eq('provider', 'webkiosk')
      .single()
    if (error && error.code !== 'PGRST116') throw error
    res.json({ success: true, data: data ? redactConfig(data) : null })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// GET /api/sync/webkiosk/config
router.get('/config', authenticate, requireAdmin, async (_req, res) => {
  try {
    const { data } = await supabaseAdmin
      .from('external_sync_config')
      .select('*')
      .eq('provider', 'webkiosk')
      .single()
    res.json({ success: true, data: data ? redactConfig(data) : null })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// POST /api/sync/webkiosk/config
router.post('/config', authenticate, requireAdmin, async (req, res) => {
  const schema = z.object({
    base_url:    z.string().url(),
    username:    z.string().min(1),
    password:    z.string().min(1),
    sync_modules: z.object({
      attendance:    z.boolean().optional(),
      grades:        z.boolean().optional(),
      fees:          z.boolean().optional(),
      exam_schedule: z.boolean().optional(),
    }).optional(),
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.errors })

  try {
    const encCreds = encryptCredentials({ username: parsed.data.username, password: parsed.data.password })
    const { data, error } = await supabaseAdmin
      .from('external_sync_config')
      .upsert({
        provider:         'webkiosk',
        base_url:         parsed.data.base_url,
        credentials_json: encCreds,
        sync_modules:     parsed.data.sync_modules || { attendance: true, grades: true, fees: true, exam_schedule: true },
        is_active:        true,
        updated_at:       new Date().toISOString(),
      }, { onConflict: 'provider' })
      .select()
      .single()
    if (error) throw error
    res.json({ success: true, data: redactConfig(data), message: 'WebKiosk credentials saved' })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// POST /api/sync/webkiosk/trigger
router.post('/trigger', authenticate, requireAdmin, async (_req, res) => {
  try {
    res.json({ success: true, message: 'WebKiosk sync started. Check /status for progress.' })
    await runWebKioskSync()
  } catch (err) {
    console.error('[WebKiosk sync error]', err.message)
  }
})

export default router
