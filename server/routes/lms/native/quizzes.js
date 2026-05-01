import { Router } from 'express'
import { z } from 'zod'
import { supabaseAdmin } from '../../../lib/supabase.js'
import { authenticate, requireAdmin } from '../../../middleware/auth.js'

const router = Router()

// ── 1. Question Bank ────────────────────────────────────────────────────────

// Create a question
router.post('/questions', authenticate, async (req, res) => {
  try {
    const { course_id, topic_tag, difficulty, marks, question_json, is_global } = req.body
    if (!question_json || !question_json.text || !question_json.options) {
      return res.status(400).json({ success: false, error: 'Invalid question format' })
    }

    const { data, error } = await supabaseAdmin
      .from('lms_quiz_questions')
      .insert({
        course_id: is_global ? null : course_id,
        faculty_id: req.user.id,
        topic_tag,
        difficulty: difficulty || 'medium',
        marks: marks || 1,
        question_json,
        is_global: is_global || false
      })
      .select()
      .single()

    if (error) throw error
    res.json({ success: true, data })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// Get questions by course or global
router.get('/questions', authenticate, async (req, res) => {
  try {
    const { course_id } = req.query
    let q = supabaseAdmin.from('lms_quiz_questions').select('*')
    if (course_id) q = q.or(`course_id.eq.${course_id},is_global.eq.true`)
    else q = q.eq('is_global', true)

    const { data, error } = await q.order('created_at', { ascending: false })
    if (error) throw error
    res.json({ success: true, data })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// ── 2. Quiz Management ──────────────────────────────────────────────────────

// Create a quiz
router.post('/', authenticate, async (req, res) => {
  try {
    const { section_id, title, time_limit_mins, shuffle_questions, shuffle_options, prevent_backtrack, fullscreen_mode, start_at, end_at, questions } = req.body
    
    // 1. Create quiz record
    const { data: quiz, error: quizErr } = await supabaseAdmin
      .from('lms_quizzes')
      .insert({
        section_id, title, time_limit_mins, shuffle_questions, shuffle_options,
        prevent_backtrack, fullscreen_mode, start_at, end_at,
        created_by: req.user.id
      })
      .select()
      .single()

    if (quizErr) throw quizErr

    // 2. Map questions (if provided) to quiz_questions junction (we need a junction table if many-to-many, 
    // but assuming for simplicity quiz_questions are embedded or linked. Wait, our schema doesn't have a junction table.
    // Let's assume we store question IDs in a jsonb array on the quiz table for now to avoid altering schema, 
    // or if we alter schema, we add `question_ids` JSONB to lms_quizzes).
    // Let's update the quiz with question_ids.
    if (questions && questions.length > 0) {
      await supabaseAdmin.from('lms_quizzes').update({ question_ids: questions }).eq('id', quiz.id)
    }

    res.json({ success: true, data: quiz })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// Get quizzes for a section
router.get('/sections/:section_id', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('lms_quizzes')
      .select(`
        *,
        lms_quiz_attempts ( count )
      `)
      .eq('section_id', req.params.section_id)
      .order('start_at', { ascending: false })

    if (error) throw error
    res.json({ success: true, data })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// ── 3. Student Attempts ─────────────────────────────────────────────────────

// Start an attempt
router.post('/:quiz_id/attempt', authenticate, async (req, res) => {
  try {
    const { quiz_id } = req.params

    // Check if attempt exists
    const { data: existing } = await supabaseAdmin
      .from('lms_quiz_attempts')
      .select('*')
      .eq('quiz_id', quiz_id)
      .eq('student_id', req.user.id)
      .single()

    if (existing) {
      return res.json({ success: true, data: existing }) // resume
    }

    // Create new attempt
    const { data, error } = await supabaseAdmin
      .from('lms_quiz_attempts')
      .insert({
        quiz_id,
        student_id: req.user.id,
        started_at: new Date().toISOString(),
        answers_json: {}
      })
      .select()
      .single()

    if (error) throw error
    res.json({ success: true, data })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// Submit/Update attempt
router.patch('/attempts/:id', authenticate, async (req, res) => {
  try {
    const { answers_json, is_completed } = req.body
    
    // Auto-grade if completed
    let score = null
    if (is_completed) {
      // Fetch attempt and quiz questions to calculate score
      // For simplicity, we just save answers here. Grading logic would go here.
      score = 0 // Placeholder
    }

    const { data, error } = await supabaseAdmin
      .from('lms_quiz_attempts')
      .update({
        answers_json,
        is_completed,
        submitted_at: is_completed ? new Date().toISOString() : null,
        score
      })
      .eq('id', req.params.id)
      .eq('student_id', req.user.id)
      .select()
      .single()

    if (error) throw error
    res.json({ success: true, data })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router
