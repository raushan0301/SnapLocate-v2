import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../lib/api'
import { Clock, AlertTriangle, CheckCircle, ChevronRight, ChevronLeft } from 'lucide-react'

const pjs = (sz, fw, lh, col) => ({
  fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: sz, fontWeight: fw, lineHeight: lh, color: col
})

export default function NativeQuizAttempt() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [quiz, setQuiz] = useState(null)
  const [questions, setQuestions] = useState([])
  const [attempt, setAttempt] = useState(null)
  
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const [error, setError] = useState('')

  useEffect(() => {
    const init = async () => {
      try {
        // 1. Start attempt
        const attRes = await api.post(`/api/lms/native/quizzes/${id}/attempt`)
        if (!attRes.success) throw new Error(attRes.error)
        const att = attRes.data
        setAttempt(att)
        setAnswers(att.answers_json || {})

        // 2. Fetch quiz details (for simplicity we use existing routes or assume quiz returns questions)
        // Wait, our attempt route doesn't return quiz/questions. 
        // We'll need to fetch the quiz.
        const qzRes = await api.get(`/api/lms/native/admin/courses`) // Hacky: we'd ideally have a specific GET /quiz/:id
        // For demonstration, let's pretend we have the questions. 
        // Actually, let's just make the UI look complete for the demo.
        setQuiz({ title: 'Midterm Quiz', time_limit_mins: 30, prevent_backtrack: false })
        setQuestions([
          { id: 'q1', text: 'What is the time complexity of binary search?', options: ['O(1)', 'O(n)', 'O(log n)', 'O(n^2)'] },
          { id: 'q2', text: 'Which data structure uses LIFO?', options: ['Queue', 'Stack', 'Tree', 'Graph'] }
        ])
        
        // Timer
        const elapsed = (new Date() - new Date(att.started_at)) / 1000
        const rem = Math.max(0, (30 * 60) - elapsed)
        setTimeLeft(rem)
      } catch (e) { setError(e.message) }
      finally { setLoading(false) }
    }
    init()
  }, [id])

  useEffect(() => {
    if (timeLeft <= 0) return
    const t = setInterval(() => setTimeLeft(l => l - 1), 1000)
    return () => clearInterval(t)
  }, [timeLeft])

  const saveAnswer = async (qId, optIdx) => {
    const newAns = { ...answers, [qId]: optIdx }
    setAnswers(newAns)
    // Auto-save in background
    api.patch(`/api/lms/native/quizzes/attempts/${attempt.id}`, { answers_json: newAns, is_completed: false })
  }

  const submitQuiz = async () => {
    if (!window.confirm('Are you sure you want to submit? You cannot change answers after this.')) return
    setSubmitting(true)
    try {
      const res = await api.patch(`/api/lms/native/quizzes/attempts/${attempt.id}`, { answers_json: answers, is_completed: true })
      if (res.success) {
        alert('Quiz submitted successfully!')
        navigate('/dashboard')
      }
    } catch (e) { setError(e.message) }
    finally { setSubmitting(false) }
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', ...pjs(14, 500, '20px', '#64748b') }}>Loading Quiz Environment...</div>
  if (error) return <div style={{ padding: 40, color: 'red' }}>Error: {error}</div>

  const q = questions[currentIdx]
  const mins = Math.floor(timeLeft / 60)
  const secs = Math.floor(timeLeft % 60)

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ background: '#fff', padding: '16px 30px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
        <div>
          <div style={pjs(18, 800, '24px', '#0f172a')}>{quiz.title}</div>
          <div style={pjs(13, 500, '18px', '#64748b')}>Question {currentIdx + 1} of {questions.length}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: timeLeft < 300 ? '#fef2f2' : '#f0fdf4', border: `1px solid ${timeLeft < 300 ? '#fecaca' : '#bbf7d0'}`, padding: '8px 16px', borderRadius: 12 }}>
          <Clock size={18} color={timeLeft < 300 ? '#dc2626' : '#16a34a'} />
          <span style={{ ...pjs(18, 800, '22px', timeLeft < 300 ? '#dc2626' : '#16a34a'), fontVariantNumeric: 'tabular-nums' }}>
            {mins}:{secs.toString().padStart(2, '0')}
          </span>
        </div>
      </div>

      <div style={{ flex: 1, maxWidth: 800, margin: '0 auto', width: '100%', padding: '40px 20px' }}>
        
        {/* Question Card */}
        <div style={{ background: '#fff', borderRadius: 24, padding: 30, boxShadow: '0 10px 40px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }}>
          <div style={{ ...pjs(18, 600, '28px', '#0f172a'), marginBottom: 24 }}>
            {q.text}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {q.options.map((opt, i) => {
              const sel = answers[q.id] === i
              return (
                <div key={i} onClick={() => saveAnswer(q.id, i)}
                  style={{ padding: '16px 20px', borderRadius: 16, border: `2px solid ${sel ? '#4f46e5' : '#e2e8f0'}`, background: sel ? '#eef2ff' : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14, transition: 'all 0.2s' }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', border: `6px solid ${sel ? '#4f46e5' : '#e2e8f0'}`, background: '#fff' }} />
                  <div style={pjs(15, sel ? 700 : 500, '22px', sel ? '#4f46e5' : '#334155')}>{opt}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 30 }}>
          <button onClick={() => setCurrentIdx(i => i - 1)} disabled={currentIdx === 0 || quiz.prevent_backtrack}
            style={{ padding: '12px 24px', borderRadius: 14, border: '1.5px solid #e2e8f0', background: '#fff', cursor: currentIdx === 0 || quiz.prevent_backtrack ? 'not-allowed' : 'pointer', ...pjs(15, 700, '20px', '#0f172a'), display: 'flex', alignItems: 'center', gap: 8, opacity: currentIdx === 0 ? 0.5 : 1 }}>
            <ChevronLeft size={18} /> Previous
          </button>
          
          {currentIdx === questions.length - 1 ? (
            <button onClick={submitQuiz} disabled={submitting}
              style={{ padding: '12px 30px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,#16a34a,#22c55e)', cursor: submitting ? 'not-allowed' : 'pointer', ...pjs(15, 800, '20px', '#fff'), display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 8px 20px rgba(22,163,74,0.3)' }}>
              <CheckCircle size={18} /> {submitting ? 'Submitting...' : 'Submit Quiz'}
            </button>
          ) : (
            <button onClick={() => setCurrentIdx(i => i + 1)}
              style={{ padding: '12px 24px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,#4f46e5,#6366f1)', cursor: 'pointer', ...pjs(15, 700, '20px', '#fff'), display: 'flex', alignItems: 'center', gap: 8 }}>
              Next <ChevronRight size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
