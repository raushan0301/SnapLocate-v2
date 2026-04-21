import { Router } from 'express'
import { z } from 'zod'
import { supabaseAdmin } from '../lib/supabase.js'
import { authenticate, requireStudent } from '../middleware/auth.js'
import { runStudentSync } from '../lib/moodle.js'

const router = Router()

// GET /api/student-sync/status
router.get('/status', authenticate, requireStudent, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('student_sync_config')
      .select('id, user_id, provider, base_url, last_synced_at, last_sync_status, last_sync_log, created_at')
      .eq('user_id', req.user.id)
      .maybeSingle()
    if (error) throw error
    res.json({ success: true, data: data || null })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// POST /api/student-sync/config — save credentials
router.post('/config', authenticate, requireStudent, async (req, res) => {
  const schema = z.object({
    provider: z.enum(['moodle', 'webkiosk']).default('moodle'),
    base_url: z.string().url(),
    username: z.string().min(1),
    password: z.string().min(1),
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.errors })

  try {
    const { data, error } = await supabaseAdmin
      .from('student_sync_config')
      .upsert({
        user_id: req.user.id,
        provider: parsed.data.provider,
        base_url: parsed.data.base_url,
        credentials_json: { username: parsed.data.username, password: parsed.data.password },
      }, { onConflict: 'user_id' })
      .select('id, user_id, provider, base_url, last_synced_at, last_sync_status, created_at')
      .single()
    if (error) throw error
    res.json({ success: true, data, message: 'Credentials saved' })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// POST /api/student-sync/trigger — start sync
router.post('/trigger', authenticate, requireStudent, async (req, res) => {
  try {
    res.json({ success: true, message: 'Sync started' })
    await runStudentSync(req.user.id)
  } catch (err) {
    console.error('[Student sync error]', err.message)
  }
})

// DELETE /api/student-sync/config — remove connection
router.delete('/config', authenticate, requireStudent, async (req, res) => {
  try {
    await supabaseAdmin.from('student_sync_config').delete().eq('user_id', req.user.id)
    res.json({ success: true, message: 'Connection removed' })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/force-sync', async (req, res) => {
  try {
    const { data: configs } = await supabaseAdmin.from('student_sync_config').select('user_id').limit(1);
    const result = await runStudentSync(configs[0].user_id)
    res.json({ success: true, result })
  } catch(e) {
    res.status(500).json({ error: e.message })
  }
})

import { MoodleClient } from '../lib/moodle.js'
router.get('/moodle-test', async (req, res) => {
  try {
    const { data: configs } = await supabaseAdmin.from('student_sync_config').select('credentials_json, base_url').limit(1)
    const config = configs[0]
    const client = new MoodleClient(config.base_url)
    await client.login(config.credentials_json.username, config.credentials_json.password)
    const siteInfo = await client.getSiteInfo()
    const courses = await client.getMyCourses(siteInfo.userid)
    // find the microprocessor course
    const course = courses.find(c => c.fullname.includes('MICROPROCESSOR'))
    if(!course) return res.json({error: 'Course not found'})
    const content = await client.getCourseContents(course.id)
    res.json({ content })
  } catch(e) {
    res.status(500).json({ error: e.message })
  }
})

export default router
