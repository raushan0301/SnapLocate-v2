import { useState, useEffect, useCallback } from 'react'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'
import {
  FileQuestion, Plus, Search, HelpCircle,
  Settings, Save, BookOpen, Clock
} from 'lucide-react'

const pjs = (sz, fw, lh, col) => ({
  fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: sz, fontWeight: fw, lineHeight: lh, color: col
})

const inp = {
  width: '100%', padding: '9px 12px', borderRadius: 10,
  border: '1.5px solid #e2e8f0', fontSize: 14,
  fontFamily: "'Plus Jakarta Sans',sans-serif", outline: 'none', boxSizing: 'border-box',
}

function Toast({ msg, type }) {
  if (!msg) return null
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, background: type === 'error' ? '#dc2626' : '#0f172a', color: '#fff', padding: '12px 20px', borderRadius: 12, zIndex: 9999, fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 14, fontWeight: 600 }}>
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
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 24, width: '100%', maxWidth: 600, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,0.18)' }}>
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={pjs(16, 800, '22px', '#0f172a')}>Add Question</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', ...pjs(13, 600, '18px', '#64748b') }}>Cancel</button>
        </div>
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div>
              <div style={{ ...pjs(12, 600, '16px', '#374151'), marginBottom: 6 }}>Topic Tag</div>
              <input value={form.topic_tag} onChange={e => set('topic_tag', e.target.value)} style={inp} placeholder="e.g. Arrays" />
            </div>
            <div>
              <div style={{ ...pjs(12, 600, '16px', '#374151'), marginBottom: 6 }}>Difficulty</div>
              <select value={form.difficulty} onChange={e => set('difficulty', e.target.value)} style={inp}>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div>
              <div style={{ ...pjs(12, 600, '16px', '#374151'), marginBottom: 6 }}>Marks</div>
              <input type="number" value={form.marks} onChange={e => set('marks', e.target.value)} style={inp} min={1} />
            </div>
          </div>

          <div>
            <div style={{ ...pjs(12, 600, '16px', '#374151'), marginBottom: 6 }}>Question Text *</div>
            <textarea value={form.text} onChange={e => set('text', e.target.value)} rows={3} style={{ ...inp, resize: 'vertical' }} />
          </div>

          <div>
            <div style={{ ...pjs(12, 600, '16px', '#374151'), marginBottom: 6 }}>Options * (Select the correct one)</div>
            {form.options.map((opt, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <input type="radio" name="correct_idx" checked={form.correct_index === i} onChange={() => set('correct_index', i)} style={{ cursor: 'pointer', width: 16, height: 16 }} />
                <input value={opt} onChange={e => setOpt(i, e.target.value)} style={inp} placeholder={`Option ${i + 1}`} />
              </div>
            ))}
          </div>

          {error && <div style={{ ...pjs(13, 500, '18px', '#dc2626'), background: '#fef2f2', borderRadius: 10, padding: '10px 12px' }}>{error}</div>}

          <button onClick={save} disabled={loading}
            style={{ padding: '11px 0', borderRadius: 12, border: 'none', background: loading ? '#e2e8f0' : 'linear-gradient(135deg,#4f46e5,#6366f1)', cursor: loading ? 'not-allowed' : 'pointer', ...pjs(14, 700, '20px', '#fff') }}>
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
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 24, width: '100%', maxWidth: 700, maxHeight: '90vh', overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.18)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={pjs(16, 800, '22px', '#0f172a')}>Create Quiz</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', ...pjs(13, 600, '18px', '#64748b') }}>Cancel</button>
        </div>

        <div style={{ padding: '20px 24px', overflow: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <div style={{ ...pjs(12, 600, '16px', '#374151'), marginBottom: 6 }}>Quiz Title *</div>
            <input value={form.title} onChange={e => set('title', e.target.value)} style={inp} placeholder="e.g. Midterm Quiz" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div>
              <div style={{ ...pjs(12, 600, '16px', '#374151'), marginBottom: 6 }}>Time Limit (mins)</div>
              <input type="number" value={form.time_limit_mins} onChange={e => set('time_limit_mins', e.target.value)} style={inp} />
            </div>
            <div>
              <div style={{ ...pjs(12, 600, '16px', '#374151'), marginBottom: 6 }}>Start Window *</div>
              <input type="datetime-local" value={form.start_at} onChange={e => set('start_at', e.target.value)} style={inp} />
            </div>
            <div>
              <div style={{ ...pjs(12, 600, '16px', '#374151'), marginBottom: 6 }}>End Window *</div>
              <input type="datetime-local" value={form.end_at} onChange={e => set('end_at', e.target.value)} style={inp} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', padding: '10px 0' }}>
            {[
              { k: 'shuffle_questions', l: 'Shuffle Questions' },
              { k: 'shuffle_options', l: 'Shuffle Options' },
              { k: 'prevent_backtrack', l: 'Prevent Backtrack' },
              { k: 'fullscreen_mode', l: 'Fullscreen Mode' }
            ].map(({ k, l }) => (
              <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', ...pjs(13, 500, '18px', '#374151') }}>
                <input type="checkbox" checked={form[k]} onChange={e => set(k, e.target.checked)} /> {l}
              </label>
            ))}
          </div>

          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 14 }}>
            <div style={{ ...pjs(14, 700, '20px', '#0f172a'), marginBottom: 10 }}>Select Questions ({selQ.length} selected)</div>
            <div style={{ maxHeight: 200, overflow: 'auto', border: '1.5px solid #e2e8f0', borderRadius: 12 }}>
              {questions.length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', ...pjs(13, 400, '18px', '#94a3b8') }}>No questions in bank. Add some first.</div>
              ) : questions.map(q => {
                const checked = selQ.includes(q.id)
                return (
                  <label key={q.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', background: checked ? '#eef2ff' : '#fff' }}>
                    <input type="checkbox" checked={checked} onChange={e => {
                      if (e.target.checked) setSelQ([...selQ, q.id])
                      else setSelQ(selQ.filter(id => id !== q.id))
                    }} style={{ marginTop: 3 }} />
                    <div>
                      <div style={pjs(13, 600, '18px', '#0f172a')}>{q.question_json?.text}</div>
                      <div style={{ ...pjs(11, 400, '14px', '#64748b'), marginTop: 2 }}>
                        Marks: {q.marks} · Tag: {q.topic_tag || 'none'}
                      </div>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>

          {error && <div style={{ ...pjs(13, 500, '18px', '#dc2626'), background: '#fef2f2', borderRadius: 10, padding: '10px 12px' }}>{error}</div>}
        </div>

        <div style={{ padding: '16px 24px', borderTop: '1px solid #f1f5f9', flexShrink: 0 }}>
          <button onClick={save} disabled={loading}
            style={{ width: '100%', padding: '11px 0', borderRadius: 12, border: 'none', background: loading ? '#e2e8f0' : 'linear-gradient(135deg,#4f46e5,#6366f1)', cursor: loading ? 'not-allowed' : 'pointer', ...pjs(14, 700, '20px', '#fff') }}>
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

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div style={{ width: 46, height: 46, borderRadius: 14, background: 'linear-gradient(135deg,#eef2ff,#e0e7ff)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileQuestion size={22} color="#4f46e5" />
          </div>
          <div>
            <h1 style={{ ...pjs(26, 800, '32px', '#0f172a'), margin: 0, letterSpacing: '-0.02em' }}>Quiz Engine</h1>
            <p style={{ ...pjs(13, 400, '18px', '#64748b'), margin: '4px 0 0' }}>Build question banks · Create timed quizzes</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 20, alignItems: 'start', marginTop: 24 }}>
        {/* Section picker */}
        <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', ...pjs(11, 700, '14px', '#94a3b8'), textTransform: 'uppercase', letterSpacing: '0.08em' }}>Sections</div>
          {sections.map(sec => {
            const active = selSection?.id === sec.id
            return (
              <div key={sec.id} onClick={() => setSelSection(sec)}
                style={{ padding: '11px 16px', cursor: 'pointer', borderBottom: '1px solid #f8fafc', background: active ? '#eef2ff' : 'transparent', borderLeft: `3px solid ${active ? '#4f46e5' : 'transparent'}`, transition: 'all 0.15s' }}>
                <div style={pjs(13, active ? 700 : 500, '18px', active ? '#4f46e5' : '#334155')}>{sec.course?.title}</div>
                <div style={{ ...pjs(11, 400, '14px', '#94a3b8'), marginTop: 2 }}>Section {sec.section_name}</div>
              </div>
            )
          })}
        </div>

        {/* Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Action Row */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setShowCQ(true)} disabled={!selSection}
              style={{ flex: 1, padding: '14px', borderRadius: 16, border: 'none', background: 'linear-gradient(135deg,#4f46e5,#6366f1)', cursor: selSection ? 'pointer' : 'not-allowed', ...pjs(14, 700, '20px', '#fff'), display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Plus size={16} /> Create New Quiz
            </button>
            <button onClick={() => setShowQB(true)} disabled={!selSection}
              style={{ flex: 1, padding: '14px', borderRadius: 16, border: '1.5px solid #e2e8f0', background: '#fff', cursor: selSection ? 'pointer' : 'not-allowed', ...pjs(14, 700, '20px', '#0f172a'), display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <HelpCircle size={16} /> Add to Question Bank ({questions.length})
            </button>
          </div>

          {/* Quizzes List */}
          <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9', padding: '16px 20px' }}>
            <div style={{ ...pjs(16, 800, '22px', '#0f172a'), marginBottom: 14 }}>Active Quizzes</div>
            {quizzes.length === 0 ? (
              <div style={{ padding: 30, textAlign: 'center', ...pjs(13, 400, '18px', '#94a3b8') }}>No quizzes created for this section yet.</div>
            ) : (
              <div style={{ display: 'grid', gap: 10 }}>
                {quizzes.map(qz => (
                  <div key={qz.id} style={{ padding: '14px 16px', border: '1.5px solid #f1f5f9', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={pjs(14, 700, '20px', '#0f172a')}>{qz.title}</div>
                      <div style={{ ...pjs(12, 500, '16px', '#64748b'), marginTop: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={13} /> {qz.time_limit_mins} mins</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><HelpCircle size={13} /> {qz.question_ids?.length || 0} Qs</span>
                        <span>Starts: {new Date(qz.start_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={pjs(18, 800, '24px', '#4f46e5')}>{qz.lms_quiz_attempts?.[0]?.count || 0}</div>
                      <div style={pjs(11, 600, '14px', '#94a3b8')}>Attempts</div>
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
