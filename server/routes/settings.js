import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import fs from 'fs/promises'
import path from 'path'

const router = Router()
const settingsFilePath = path.join(process.cwd(), 'data', 'settings.json')

// Helper to reliably read settings
async function readSettings() {
  try {
    const data = await fs.readFile(settingsFilePath, 'utf8')
    return JSON.parse(data)
  } catch (err) {
    if (err.code === 'ENOENT') {
      // Create data directory if not exists
      await fs.mkdir(path.dirname(settingsFilePath), { recursive: true }).catch(() => {})
      return {}
    }
    return {}
  }
}

// Helper to write settings
async function writeSettings(settings) {
  await fs.mkdir(path.dirname(settingsFilePath), { recursive: true }).catch(() => {})
  await fs.writeFile(settingsFilePath, JSON.stringify(settings, null, 2))
}

// GET /api/settings/:key
router.get('/:key', authenticate, async (req, res) => {
  try {
    const settings = await readSettings()
    const value = settings[req.params.key] || null
    res.json({ success: true, value })
  } catch (err) {
    console.error('Settings fetch failed:', err.message)
    res.json({ success: true, value: null })
  }
})

// POST /api/settings (Admin only)
router.post('/', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Forbidden' })
  }

  const { key, value } = req.body

  try {
    const settings = await readSettings()
    settings[key] = value
    await writeSettings(settings)
    
    res.json({ success: true, message: 'Setting saved' })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

export default router
