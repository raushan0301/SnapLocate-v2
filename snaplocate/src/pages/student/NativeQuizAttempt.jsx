import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../lib/api'
import { Clock, CheckCircle, ChevronRight, ChevronLeft } from 'lucide-react'

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
        const attRes = await api.post(`/api/lms/native/quizzes/${id}/attempt`)
        if (!attRes.success) throw new Error(attRes.error)
        const att = attRes.data
        setAttempt(att)
        setAnswers(att.answers_json || {})

        await api.get('/api/lms/native/admin/courses')
        setQuiz({ title: 'Midterm Quiz', time_limit_mins: 30, prevent_backtrack: false })
        setQuestions([
          { id: 'q1', text: 'What is the time complexity of binary search?', options: ['O(1)', 'O(n)', 'O(log n)', 'O(n^2)'] },
          { id: 'q2', text: 'Which data structure uses LIFO?', options: ['Queue', 'Stack', 'Tree', 'Graph'] },
        ])

        const elapsed = (new Date() - new Date(att.started_at)) / 1000
        setTimeLeft(Math.max(0, (30 * 60) - elapsed))
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
    api.patch(`/api/lms/native/quizzes/attempts/${attempt.id}`, { answers_json: newAns, is_completed: false })
  }

  const submitQuiz = async () => {
    if (!window.confirm('Are you sure you want to submit? You cannot change answers after this.')) return
    setSubmitting(true)
    try {
      const res = await api.patch(`/api/lms/native/quizzes/attempts/${attempt.id}`, { answers_json: answers, is_completed: true })
      if (res.success) { alert('Quiz submitted successfully!'); navigate('/dashboard') }
    } catch (e) { setError(e.message) }
    finally { setSubmitting(false) }
  }

  if (loading) return <div className="py-10 text-center t-base font-medium text-slate-500">Loading Quiz Environment...</div>
  if (error)   return <div className="py-10 text-red-600 px-10">Error: {error}</div>

  const q    = questions[currentIdx]
  const mins = Math.floor(timeLeft / 60)
  const secs = Math.floor(timeLeft % 60)
  const urgent = timeLeft < 300

  return (
    <div className="min-h-dvh bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="bg-white px-7 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 z-10">
        <div>
          <div className="text-[18px] font-extrabold leading-6 t-primary">{quiz.title}</div>
          <div className="text-[13px] font-medium leading-[18px] text-slate-500">Question {currentIdx + 1} of {questions.length}</div>
        </div>
        <div className={`flex items-center gap-2.5 px-4 py-2 rounded-xl border ${urgent ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
          <Clock size={18} color={urgent ? '#dc2626' : '#16a34a'} />
          <span className={`text-[18px] font-extrabold leading-[22px] ${urgent ? 'text-red-600' : 'text-green-700'}`}
            style={{ fontVariantNumeric: 'tabular-nums' }}>
            {mins}:{secs.toString().padStart(2, '0')}
          </span>
        </div>
      </div>

      <div className="flex-1 max-w-[800px] mx-auto w-full px-5 py-10">
        {/* Question Card */}
        <div className="bg-white rounded-3xl p-7 shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-slate-100">
          <div className="text-[18px] font-semibold leading-7 t-primary mb-6">{q.text}</div>

          <div className="flex flex-col gap-3">
            {q.options.map((opt, i) => {
              const sel = answers[q.id] === i
              return (
                <div key={i} onClick={() => saveAnswer(q.id, i)}
                  className={`px-5 py-4 rounded-2xl border-2 cursor-pointer flex items-center gap-3.5 transition-all duration-200 ${sel ? 'border-brand bg-indigo-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                  <div className={`w-[22px] h-[22px] rounded-full bg-white flex-shrink-0 border-[6px] ${sel ? 'border-brand' : 'border-slate-200'}`} />
                  <div className={`text-[15px] leading-[22px] ${sel ? 'font-bold text-brand' : 'font-medium text-slate-700'}`}>{opt}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-7">
          <button onClick={() => setCurrentIdx(i => i - 1)} disabled={currentIdx === 0 || quiz.prevent_backtrack}
            className={`px-6 py-3 rounded-[14px] border-[1.5px] border-slate-200 bg-white text-[15px] font-bold t-primary flex items-center gap-2 transition-all ${(currentIdx === 0 || quiz.prevent_backtrack) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-slate-50'}`}>
            <ChevronLeft size={18} /> Previous
          </button>

          {currentIdx === questions.length - 1 ? (
            <button onClick={submitQuiz} disabled={submitting}
              className={`px-7 py-3 rounded-[14px] border-none text-white text-[15px] font-extrabold flex items-center gap-2 shadow-[0_8px_20px_rgba(22,163,74,0.3)] ${submitting ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}`}
              style={{ background: 'linear-gradient(135deg,#16a34a,#22c55e)' }}>
              <CheckCircle size={18} /> {submitting ? 'Submitting...' : 'Submit Quiz'}
            </button>
          ) : (
            <button onClick={() => setCurrentIdx(i => i + 1)}
              className="px-6 py-3 rounded-[14px] border-none text-white text-[15px] font-bold flex items-center gap-2 cursor-pointer"
              style={{ background: 'linear-gradient(135deg,#4f46e5,#6366f1)' }}>
              Next <ChevronRight size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
