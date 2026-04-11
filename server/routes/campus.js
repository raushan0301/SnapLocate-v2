const express = require('express')
const { supabaseAdmin } = require('../config/supabase')

const router = express.Router()

// GET /api/campus/societies
router.get('/societies', async (req, res) => {
  try {
    const { data: societies, error } = await supabaseAdmin
      .from('societies')
      .select('*')
      .order('name')

    if (error) throw error

    // Fallback if empty database
    if (!societies || societies.length === 0) {
      return res.json([
        {
          id: 'mock-1', name: 'IEEE Student Branch',
          description: 'Advancing technology for humanity through technical workshops and international paper presentations.',
          category: 'Technical', member_count: 120, cover_url: 'IEEE'
        },
        {
          id: 'mock-2', name: 'The Dramatic Society',
          description: 'Bringing campus talent to life through theater productions, street plays, and script-writing.',
          category: 'Cultural', member_count: 85, cover_url: '🎭'
        }
      ])
    }
    
    res.json(societies)
  } catch (err) {
    console.error('Error fetching societies:', err)
    res.status(500).json({ error: 'Failed to fetch societies' })
  }
})

// GET /api/campus/shops
router.get('/shops', async (req, res) => {
  try {
    const { data: shops, error } = await supabaseAdmin
      .from('shops')
      .select('*')

    if (error) throw error
    res.json(shops)
  } catch (err) {
    console.error('Error fetching shops:', err)
    res.status(500).json({ error: 'Failed to fetch shops' })
  }
})

module.exports = router
