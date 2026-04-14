import { Router } from 'express'
import axios from 'axios'
import { supabaseAdmin } from '../../lib/supabase.js'
import { authenticate } from '../../middleware/auth.js'

const router = Router()

// GET /api/lms/materials?course_id=
router.get('/', authenticate, async (req, res) => {
  const { course_id } = req.query
  if (!course_id) return res.status(400).json({ success: false, error: 'course_id required' })

  try {
    const { data, error } = await supabaseAdmin
      .from('course_materials')
      .select('*')
      .eq('course_id', course_id)
      .order('section_num', { ascending: true })
      .order('created_at', { ascending: true })
    if (error) throw error
    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ─── File Proxy ────────────────────────────────────────────────────────────────
// GET /api/lms/materials/file-proxy?url=<encoded>&filename=<encoded>&snap_token=<jwt>
//
// The snap_token query param is required because this URL is opened in a new
// browser tab — the browser won't send an Authorization header for tab navigations.
router.get('/file-proxy', async (req, res) => {
  // Accept token from Authorization header (API calls) OR snap_token param (browser tab)
  const authHeader = req.headers.authorization
  const rawToken   = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : req.query.snap_token
  if (!rawToken) return res.status(401).json({ success: false, message: 'Unauthorized — no token provided' })

  let user
  try {
    const { default: jwt } = await import('jsonwebtoken')
    const decoded = jwt.verify(rawToken, process.env.JWT_SECRET)
    const { data, error } = await supabaseAdmin
      .from('users').select('id, role').eq('id', decoded.userId).single()
    if (error || !data) throw new Error('user not found')
    user = data
  } catch {
    return res.status(401).json({ success: false, message: 'Unauthorized — invalid token' })
  }

  const { url, filename } = req.query
  if (!url) return res.status(400).json({ success: false, error: 'url param required' })

  try {
    const decoded = decodeURIComponent(url)

    // ── Security: ensure URL comes from the student's configured Moodle ──────
    let allowed = false
    const KNOWN_HOSTS = ['lms.thapar.edu', 'moodle.thapar.edu', 'thapar.edu']
    try {
      const parsed = new URL(decoded)
      if (KNOWN_HOSTS.some(h => parsed.hostname.endsWith(h))) allowed = true

      if (!allowed) {
        // Fallback: check against the student's own configured Moodle base URL
        const { data: cfg } = await supabaseAdmin
          .from('student_sync_config')
          .select('base_url')
          .eq('user_id', user.id)
          .single()
        if (cfg?.base_url) {
          const cfgHost = new URL(cfg.base_url).hostname
          if (parsed.hostname.endsWith(cfgHost)) allowed = true
        }
      }
    } catch { /* URL parse error */ }

    if (!allowed) return res.status(403).json({ success: false, error: 'URL domain not permitted' })

    // ── Fetch the file from Moodle (follows redirects, streams) ─────────────
    const response = await axios.get(decoded, {
      responseType: 'stream',
      timeout: 60000,
      maxRedirects: 5,
      headers: { 'User-Agent': 'SnapLocate/1.0 (file proxy)' },
    })

    // Content type from Moodle (keep as-is so browser handles it correctly)
    const ct = response.headers['content-type'] || 'application/octet-stream'

    // Determine the definitive filename:
    // 1) Use the caller-supplied name (from mat.title — most reliable)
    // 2) Try to extract from Moodle's Content-Disposition header
    // 3) Fall back to 'download'
    let safeFilename = filename ? decodeURIComponent(filename) : ''
    if (!safeFilename) {
      const cd = response.headers['content-disposition'] || ''
      const m  = cd.match(/filename[^;=\n]*=[\s"']*(.*?)[\s"']*(;|$)/i)
      if (m) safeFilename = m[1].trim()
    }
    if (!safeFilename) safeFilename = 'download'

    // Strip any path separators — only bare filename allowed
    safeFilename = safeFilename.split(/[/\\]/).pop()
    // Remove chars that could break Content-Disposition
    safeFilename = safeFilename.replace(/"/g, "'")

    res.setHeader('Content-Type', ct)
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`)
    if (response.headers['content-length']) {
      res.setHeader('Content-Length', response.headers['content-length'])
    }

    response.data.pipe(res)
    response.data.on('error', (err) => { if (!res.headersSent) res.destroy(err) })

  } catch (err) {
    if (!res.headersSent) {
      res.status(502).json({ success: false, error: `Moodle fetch failed: ${err.message}` })
    }
  }
})

export default router
