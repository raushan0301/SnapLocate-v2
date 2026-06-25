import { Router } from 'express'
import { supabaseAdmin } from '../lib/supabase.js'
import { authenticate } from '../middleware/auth.js'
import { getFirestoreCollection } from '../lib/firestore.js'

const router = Router()

// ─── Helper: parse raw v0 president/VP string ───────────────────
// v0 stores e.g. "Dr. Amrita Kaur Assistant Professor, CSED"
// We just keep the full string as the display name.
function parseV0Person(nameStr, emailStr) {
  if (!nameStr || nameStr === 'N/A' || nameStr === 'NA') return null
  // Guard against nested JSON accidentally stored
  if (nameStr.startsWith('{')) {
    try { nameStr = JSON.parse(nameStr)?.stringValue || '' } catch (_) { nameStr = '' }
  }
  if (!nameStr.trim()) return null
  const email = (!emailStr || emailStr.startsWith('{') || emailStr === 'N/A') ? '' : emailStr.trim()
  return { name: nameStr.trim(), email }
}

// ─── GET /api/societies ──────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { category } = req.query

    // ── 1. Fetch from Supabase (v2) ──────────────────────────────
    let supabaseData = []
    try {
      let query = supabaseAdmin.from('societies').select('*').order('name')
      if (category) query = query.eq('category', category)
      const { data, error } = await query
      if (!error && data) supabaseData = data
    } catch (err) {
      console.warn('Supabase societies fetch failed:', err.message)
    }

    // ── 2. Fetch from Firestore (v0 — 59 societies) ──────────────
    let firestoreData = []
    try {
      const rawDocs = await getFirestoreCollection('societies')
      // Build a set of Supabase names for deduplication
      const supabaseNames = new Set(supabaseData.map(s => s.name.toLowerCase().trim()))

      rawDocs.forEach(v0 => {
        const name = v0.societyName || v0.name || ''
        if (!name || supabaseNames.has(name.toLowerCase().trim())) return // skip if already in v2

        // Parse president — v0 stores full string like "Dr. Amrita Kaur, CSED"
        const president = parseV0Person(v0.president, v0.presidentEmail)
        const vicePresident = parseV0Person(v0.vicePresident, v0.vicePresidentEmail)

        firestoreData.push({
          id: `v0_${v0.id}`,
          name,
          description: v0.objective || '',
          category: v0.TYPE || 'General',
          logo_img: null,
          email_id: v0.email || '',
          website_link: v0.website || '',
          cover_url: null,
          member_count: null,
          presidents: president ? [president] : [],
          vice_presidents: vicePresident ? [vicePresident] : [],
          is_legacy: true
        })
      })
    } catch (err) {
      console.warn('Firestore societies fetch failed:', err.message)
    }

    // ── 3. Merge: Supabase first, then Firestore legacy ──────────
    const merged = [...supabaseData, ...firestoreData]
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''))

    // Apply category filter to merged result if requested
    const finalData = category
      ? merged.filter(s => s.category === category)
      : merged

    res.json({ success: true, data: finalData })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})


// ─── GET /api/societies/:id ──────────────────────────────────
router.get('/:id', async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('societies').select('*').eq('id', req.params.id).single()
  if (error || !data) return res.status(404).json({ success: false, message: 'Society not found' })
  res.json({ success: true, data })
})

// ─── POST /api/societies/bulk ─────────────────────────────────────
// Admin only
router.post('/bulk', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' })
  try {
    const { rows } = req.body
    if (!rows || !Array.isArray(rows)) return res.status(400).json({ success: false, message: 'Invalid data format' })

    const { data, error } = await supabaseAdmin
      .from('societies')
      .insert(rows)
      .select()
    if (error) throw error
    res.status(201).json({ success: true, count: data.length, data })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// ─── POST /api/societies ─────────────────────────────────────
// Admin only
router.post('/', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' })
  const { name, description, cover_url, category, logo_img, email_id, website_link, presidents, vice_presidents } = req.body
  const { data, error } = await supabaseAdmin
    .from('societies')
    .insert({ 
      name, description, cover_url, category, member_count: 0,
      logo_img, email_id, website_link, presidents, vice_presidents
    })
    .select().single()
  if (error) throw error
  res.status(201).json({ success: true, data })
})

// ─── PUT /api/societies/:id ────────────────────────────────────
// Admin only
router.put('/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' })
  const { name, description, cover_url, category, logo_img, email_id, website_link, presidents, vice_presidents } = req.body
  const { data, error } = await supabaseAdmin
    .from('societies')
    .update({ 
      name, description, cover_url, category,
      logo_img, email_id, website_link, presidents, vice_presidents
    })
    .eq('id', req.params.id)
    .select().single()
  if (error) throw error
  res.json({ success: true, data })
})

// ─── DELETE /api/societies/:id ───────────────────────────────
// Admin only
router.delete('/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' })
  const { error } = await supabaseAdmin.from('societies').delete().eq('id', req.params.id)
  if (error) throw error
  res.json({ success: true, message: 'Society deleted' })
})

export default router
