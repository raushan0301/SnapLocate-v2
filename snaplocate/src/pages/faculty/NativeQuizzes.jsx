import { useState, useEffect, useCallback } from 'react'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'
import { FileQuestion, Plus, HelpCircle, Clock } from 'lucide-react'

const fieldCls = 'w-full px-3 py-[9px] rounded-[10px] border-[1.5px] border-slate-200 text-[14px] outline-none box-border focus:border-brand transition-colors'

function Toast({ msg, type }) {
  if (!msg) return null
  return (
    <div className={`fixed bottom-6 right-6 z-[9999] px-5 py-3 rounded-[12px] text-white text-[14px] font-semibold ${type === 'error' ? 'bg-red-600' : 'bg-slate-900'}`}>
      {msg}
    </div>
  )
}

function QuestionBankModal({ onClose, courseId, onCreated }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    topic_tag: '', difficulty: 'medium', marks: 1,
    text: '', options: ['', '', '', ''], correct_index: 0
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const setOpt = (idx, val) => {
    const opts = [...form.options]
    opts[idx] = val
    set('options', opts)
  }

  const save = async () => {
    if (!form.text.trim()) return setError('Question text is required')
    if (form.options.some(o => !o.trim())) return setError('All options must be filled')

    setLoading(true); setError('')
    try {
      const res = await api.post('/api/lms/native/quizzes/questions', {
        course_id: courseId,
        topic_tag: form.topic_tag,
        difficulty: form.difficulty,
        marks: Number(form.marks),
        question_json: {
          text: form.text,
          options: form.options,
          correct_index: Number(form.correct_index)
        }
      })
      if (res.success) { onCreated(); onClose() }
      else setError(res.error || 'Failed to save')
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/55 z-[1000] flex items-center justify-center p-5">
      <div className="bg-white rounded-[24px] w-full max-w-[600px] max-h-[90vh] overflow-auto shadow-[0_24px_80px_rgba(0,0,0,0.18)]">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="text-[16px] font-extrabold t-primary">Add Question</div>
          <button onClick={onClose} className="text-[13px] font-semibold t-muted bg-transparent border-0 cursor-pointer">Cancel</button>
        </div>
        <div className="px-6 py-5 flex flex-col gap-3.5">

          <div className="grid grid-cols-3 gap-3">
            <div>
              <div className="text-[12px] font-semibold text-slate-700 mb-1.5">Topic Tag</div>
              <input value={form.topic_tag} onChange={e => set('topic_tag', e.target.value)} className={fieldCls} placeholder="e.g. Arrays" />
            </div>
            <div>
              <div className="text-[12px] font-semibold text-slate-700 mb-1.5">Difficulty</div>
              <select value={form.difficulty} onChange={e => set('difficulty', e.target.value)} className={fieldCls}>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div>
              <div className="text-[12px] font-semibold text-slate-700 mb-1.5">Marks</div>
              <input type="number" value={form.marks} onChange={e => set('marks', e.target.value)} className={fieldCls} min={1} />
            </div>
          </div>

          <div>
            <div className="text-[12px] font-semibold text-slate-700 mb-1.5">Question Text *</div>
            <textarea value={form.text} onChange={e => set('text', e.target.value)} rows={3} className={`${fieldCls} resize-y`} />
          </div>

          <div>
            <div className="text-[12px] font-semibold text-slate-700 mb-1.5">Options * (Select the correct one)</div>
            {form.options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2.5 mb-2">
                <input type="radio" name="correct_idx" checked={form.correct_index === i} onChange={() => set('correct_index', i)} className="cursor-pointer w-4 h-4" />
                <input value={opt} onChange={e => setOpt(i, e.target.value)} className={fieldCls} placeholder={`Option ${i + 1}`} />
              </div>
            ))}
          </div>

          {error && <div className="text-[13px] font-medium text-red-600 bg-red-50 rounded-[10px] px-3 py-2.5">{error}</div>}

          <button onClick={save} disabled={loading}
            className={`py-[11px] rounded-[12px] border-0 text-[14px] font-bold text-white ${loading ? 'bg-slate-200 cursor-not-allowed' : 'cursor-pointer'}`}
            style={loading ? {} : { background: 'linear-gradient(135deg,#4f46e5,#6366f1)' }}>
            {loading ? 'Saving...' : 'Save Question'}
          </button>
        </div>
      </div>
    </div>
  )
}

function CreateQuizModal({ onClose, sectionId, courseId, questions, onCreated }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    title: '', time_limit_mins: 30, start_at: '', end_at: '',
    shuffle_questions: true, shuffle_options: true,
    prevent_backtrack: false, fullscreen_mode: true
  })
  const [selQ, setSelQ] = useState([])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const save = async () => {
    if (!form.title || !form.start_at || !form.end_at) return setError('Title and dates required')
    if (selQ.length === 0) return setError('Select at least one question')

    setLoading(true); setError('')
    try {
      const res = await api.post('/api/lms/native/quizzes', {
        section_id: sectionId,
        ...form,
        time_limit_mins: Number(form.time_limit_mins),
        questions: selQ
      })
      if (res.success) { onCreated(); onClose() }
      else setError(res.error || 'Failed to save')
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/55 z-[1000] flex items-center justify-center p-5">
      <div className="bg-white rounded-[24px] w-full max-w-[700px] max-h-[90vh] overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.18)] flex flex-col">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="text-[16px] font-extrabold t-primary">Create Quiz</div>
          <button onClick={onClose} className="text-[13px] font-semibold t-muted bg-transparent border-0 cursor-pointer">Cancel</button>
        </div>

        <div className="px-6 py-5 overflow-auto flex-1 flex flex-col gap-3.5">
          <div>
            <div className="text-[12px] font-semibold text-slate-700 mb-1.5">Quiz Title *</div>
            <input value={form.title} onChange={e => set('title', e.target.value)} className={fieldCls} placeholder="e.g. Midterm Quiz" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <div className="text-[12px] font-semibold text-slate-700 mb-1.5">Time Limit (mins)</div>
              <input type="number" value={form.time_limit_mins} onChange={e => set('time_limit_mins', e.target.value)} className={fieldCls} />
            </div>
            <div>
              <div className="text-[12px] font-semibold text-slate-700 mb-1.5">Start Window *</div>
              <input type="datetime-local" value={form.start_at} onChange={e => set('start_at', e.target.value)} className={fieldCls} />
            </div>
            <div>
              <div className="text-[12px] font-semibold text-slate-700 mb-1.5">End Window *</div>
              <input type="datetime-local" value={form.end_at} onChange={e => set('end_at', e.target.value)} className={fieldCls} />
            </div>
          </div>

          <div className="flex gap-4 flex-wrap py-2.5">
            {[
              { k: 'shuffle_questions', l: 'Shuffle Questions' },
              { k: 'shuffle_options', l: 'Shuffle Options' },
              { k: 'prevent_backtrack', l: 'Prevent Backtrack' },
              { k: 'fullscreen_mode', l: 'Fullscreen Mode' }
            ].map(({ k, l }) => (
              <label key={k} className="flex items-center gap-1.5 cursor-pointer text-[13px] font-medium text-slate-700">
                <input type="checkbox" checked={form[k]} onChange={e => set(k, e.target.checked)} /> {l}
              </label>
            ))}
          </div>

          <div className="border-t border-slate-100 pt-3.5">
            <div className="text-[14px] font-extrabold t-primary mb-2.5">Select Questions ({selQ.length} selected)</div>
            <div className="max-h-[200px] overflow-auto border-[1.5px] border-slate-200 rounded-[12px]">
              {questions.length === 0 ? (
                <div className="p-5 text-center text-[13px] t-muted">No questions in bank. Add some first.</div>
              ) : questions.map(q => {
                const checked = selQ.includes(q.id)
                return (
                  <label key={q.id} className={`flex items-start gap-2.5 px-3.5 py-2.5 border-b border-slate-100 cursor-pointer ${checked ? 'bg-indigo-50' : 'bg-white'}`}>
                    <input type="checkbox" checked={checked} onChange={e => {
                      if (e.target.checked) setSelQ([...selQ, q.id])
                      else setSelQ(selQ.filter(id => id !== q.id))
                    }} className="mt-[3px]" />
                    <div>
                      <div className="text-[13px] font-semibold t-primary">{q.question_json?.text}</div>
                      <div className="text-[11px] t-muted mt-0.5">
                        Marks: {q.marks} · Tag: {q.topic_tag || 'none'}
                      </div>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>

          {error && <div className="text-[13px] font-medium text-red-600 bg-red-50 rounded-[10px] px-3 py-2.5">{error}</div>}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 shrink-0">
          <button onClick={save} disabled={loading}
            className={`w-full py-[11px] rounded-[12px] border-0 text-[14px] font-bold text-white ${loading ? 'bg-slate-200 cursor-not-allowed' : 'cursor-pointer'}`}
            style={loading ? {} : { background: 'linear-gradient(135deg,#4f46e5,#6366f1)' }}>
            {loading ? 'Publishing...' : 'Publish Quiz'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function NativeQuizzes() {
  const [sections, setSections] = useState([])
  const [selSection, setSelSection] = useState(null)
  const [questions, setQuestions] = useState([])
  const [quizzes, setQuizzes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showQB, setShowQB] = useState(false)
  const [showCQ, setShowCQ] = useState(false)
  const [toast, setToast] = useState(null)

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000) }

  const loadSections = useCallback(async () => {
    try {
      const res = await api.get('/api/lms/native/faculty/my-sections')
      if (res.success) {
        const all = (res.data || []).map(sec => ({ ...sec, course: sec.lms_courses }))
        setSections(all)
        if (all.length > 0 && !selSection) setSelSection(all[0])
      }
    } catch { }
    finally { setLoading(false) }
  }, [selSection])

  useEffect(() => { loadSections() }, [loadSections])

  const loadData = useCallback(async () => {
    if (!selSection) return
    try {
      const [qRes, qzRes] = await Promise.all([
        api.get(`/api/lms/native/quizzes/questions?course_id=${selSection.course_id}`),
        api.get(`/api/lms/native/quizzes/sections/${selSection.id}`)
      ])
      if (qRes.success) setQuestions(qRes.data || [])
      if (qzRes.success) setQuizzes(qzRes.data || [])
    } catch { }
  }, [selSection])

  useEffect(() => { loadData() }, [loadData])

  return (
    <PageLayout>
      <Toast msg={toast?.msg} type={toast?.type} />
      {showQB && selSection && <QuestionBankModal courseId={selSection.course_id} onClose={() => setShowQB(false)} onCreated={() => { showToast('Question added'); loadData() }} />}
      {showCQ && selSection && <CreateQuizModal courseId={selSection.course_id} sectionId={selSection.id} questions={questions} onClose={() => setShowCQ(false)} onCreated={() => { showToast('Quiz published'); loadData() }} />}

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-start gap-3.5">
          <div className="w-[46px] h-[46px] rounded-[14px] flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#eef2ff,#e0e7ff)' }}>
            <FileQuestion size={22} color="#4f46e5" />
          </div>
          <div>
            <h1 className="text-[26px] font-extrabold t-primary m-0 tracking-[-0.02em]">Quiz Engine</h1>
            <p className="text-[13px] t-muted mt-1 mb-0">Build question banks · Create timed quizzes</p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 items-start mt-6" style={{ gridTemplateColumns: '220px 1fr' }}>
        {/* Section picker */}
        <div className="bg-white rounded-[20px] border border-slate-100 overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="px-4 py-3 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-[0.08em]">Sections</div>
          {sections.map(sec => {
            const active = selSection?.id === sec.id
            return (
              <div key={sec.id} onClick={() => setSelSection(sec)}
                className={`px-4 py-[11px] cursor-pointer border-b border-slate-50 transition-all ${active ? 'bg-indigo-50 border-l-[3px] border-l-brand' : 'bg-transparent border-l-[3px] border-l-transparent'}`}>
                <div className={`text-[13px] leading-[18px] ${active ? 'font-bold text-brand' : 'font-medium text-slate-700'}`}>{sec.course?.title}</div>
                <div className="text-[11px] t-muted mt-0.5">Section {sec.section_name}</div>
              </div>
            )
          })}
        </div>

        {/* Content */}
        <div className="flex flex-col gap-5">

          <div className="flex gap-2.5">
            <button onClick={() => setShowCQ(true)} disabled={!selSection}
              className={`flex-1 py-3.5 rounded-[16px] border-0 text-[14px] font-bold text-white flex items-center justify-center gap-2 ${selSection ? 'cursor-pointer' : 'cursor-not-allowed'}`}
              style={{ background: 'linear-gradient(135deg,#4f46e5,#6366f1)' }}>
              <Plus size={16} /> Create New Quiz
            </button>
            <button onClick={() => setShowQB(true)} disabled={!selSection}
              className={`flex-1 py-3.5 rounded-[16px] border-[1.5px] border-slate-200 bg-white text-[14px] font-bold t-primary flex items-center justify-center gap-2 ${selSection ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
              <HelpCircle size={16} /> Add to Question Bank ({questions.length})
            </button>
          </div>

          <div className="bg-white rounded-[20px] border border-slate-100 px-5 py-4">
            <div className="text-[16px] font-extrabold t-primary mb-3.5">Active Quizzes</div>
            {quizzes.length === 0 ? (
              <div className="py-[30px] text-center text-[13px] t-muted">No quizzes created for this section yet.</div>
            ) : (
              <div className="grid gap-2.5">
                {quizzes.map(qz => (
                  <div key={qz.id} className="px-4 py-3.5 border-[1.5px] border-slate-100 rounded-[14px] flex items-center justify-between">
                    <div>
                      <div className="text-[14px] font-bold t-primary">{qz.title}</div>
                      <div className="text-[12px] font-medium t-muted mt-1 flex items-center gap-2.5">
                        <span className="flex items-center gap-1"><Clock size={13} /> {qz.time_limit_mins} mins</span>
                        <span className="flex items-center gap-1"><HelpCircle size={13} /> {qz.question_ids?.length || 0} Qs</span>
                        <span>Starts: {new Date(qz.start_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[18px] font-extrabold text-brand">{qz.lms_quiz_attempts?.[0]?.count || 0}</div>
                      <div className="text-[11px] font-semibold t-muted">Attempts</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </PageLayout>
  )
}
