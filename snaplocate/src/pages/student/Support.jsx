import { useState, useEffect, useRef } from 'react'
import PageLayout from '../../components/PageLayout'
import { useAuth } from '../../context/AuthContext'
import api from '../../lib/api'

const pjs = (size, weight, lh, color) => ({
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  fontSize: size, fontWeight: weight, lineHeight: lh, color,
})
const inter = (size, weight, lh, color) => ({
  fontFamily: "'Inter', sans-serif",
  fontSize: size, fontWeight: weight, lineHeight: lh, color,
})

const STATUS_COLORS = {
  'Open': { bg: '#eff6ff', color: '#3b82f6', border: '#bfdbfe' },
  'In Progress': { bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
  'Resolved': { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  'Closed': { bg: '#f8fafc', color: '#64748b', border: '#e2e8f0' },
}
const PRIORITY_COLORS = {
  'Low': { bg: '#f0fdf4', color: '#16a34a' },
  'Med': { bg: '#fffbeb', color: '#d97706' },
  'High': { bg: '#fff7ed', color: '#ea580c' },
  'Urgent': { bg: '#fff1f2', color: '#ef4444' },
}

/* ─── FAQ Item ─────────────────────────────────────────────────── */
function FaqItem({ item }) {
  const [open, setOpen] = useState(false)
  return (
    <div
      style={{
        border: '1px solid #f1f5f9', borderRadius: 12, overflow: 'hidden',
        background: '#fff', transition: 'box-shadow 0.15s',
      }}
    >
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          padding: '14px 18px', cursor: 'pointer', display: 'flex',
          justifyContent: 'space-between', alignItems: 'center', gap: 12,
          background: open ? '#f8fafc' : '#fff',
        }}
      >
        <span style={pjs(13, 600, '18px', '#0f172a')}>{item.question}</span>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s', flexShrink: 0 }}>
          <path d="M3 5l5 5 5-5" stroke="#64748b" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      {open && (
        <div style={{ padding: '0 18px 16px', ...inter(13, 400, '20px', '#475569'), borderTop: '1px solid #f1f5f9' }}>
          <div style={{ paddingTop: 12 }}>{item.answer}</div>
        </div>
      )}
    </div>
  )
}

/* ─── Live Chat Panel ──────────────────────────────────────────── */
function ChatPanel({ ticket, user, onClose }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    fetchMessages()
    const interval = setInterval(fetchMessages, 5000) // poll every 5s
    return () => clearInterval(interval)
  }, [ticket.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchMessages = async () => {
    try {
      const res = await api.get(`/api/support/tickets/${ticket.id}/messages`)
      if (res.success) setMessages(res.data)
    } catch (e) { }
  }

  const sendMessage = async () => {
    if (!input.trim() || sending) return
    setSending(true)
    try {
      await api.post(`/api/support/tickets/${ticket.id}/messages`, { message: input })
      setInput('')
      await fetchMessages()
    } finally {
      setSending(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, width: 380, height: 520,
      background: '#fff', borderRadius: 20, boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
      border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', zIndex: 1000,
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px', background: '#0f172a', borderRadius: '20px 20px 0 0',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={pjs(14, 700, '18px', '#fff')}>Live Chat</div>
          <div style={{ ...inter(11, 400, '15px', '#94a3b8'), marginTop: 2 }}>
            Ticket #{ticket.id.slice(0, 8).toUpperCase()}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
            <span style={inter(11, 600, '15px', '#22c55e')}>Online</span>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 18, lineHeight: 1 }}>✕</button>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', margin: 'auto', ...inter(13, 400, '18px', '#94a3b8') }}>
            Start the conversation. Our support team will respond shortly.
          </div>
        )}
        {messages.map(m => {
          const isMe = m.sender_id === user?.id
          return (
            <div key={m.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '80%', padding: '10px 14px', borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                background: isMe ? '#4f46e5' : '#f8fafc',
                border: isMe ? 'none' : '1px solid #e2e8f0',
              }}>
                {!isMe && (
                  <div style={{ ...inter(10, 700, '14px', '#4f46e5'), marginBottom: 4, textTransform: 'uppercase' }}>
                    {m.sender_role === 'admin' ? '🛡 Support Agent' : m.sender_name}
                  </div>
                )}
                <div style={inter(13, 400, '18px', isMe ? '#fff' : '#0f172a')}>{m.message}</div>
                <div style={{ ...inter(10, 400, '14px', isMe ? 'rgba(255,255,255,0.6)' : '#94a3b8'), marginTop: 4, textAlign: 'right' }}>
                  {new Date(m.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: 10 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          placeholder="Type a message..."
          style={{
            flex: 1, padding: '10px 14px', borderRadius: 12, border: '1px solid #e2e8f0',
            background: '#f8fafc', ...inter(13, 400, '18px', '#0f172a'), outline: 'none',
          }}
        />
        <button
          onClick={sendMessage}
          disabled={sending || !input.trim()}
          style={{
            width: 40, height: 40, borderRadius: 12, background: input.trim() ? '#4f46e5' : '#e2e8f0',
            border: 'none', cursor: input.trim() ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            transition: 'background 0.15s',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   Main Support Page
   ════════════════════════════════════════════════════════════════ */
export default function SupportPage() {
  const { user } = useAuth()
  const [tickets, setTickets] = useState([])
  const [faqs, setFaqs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('tickets') // tickets | faqs
  const [chatTicket, setChatTicket] = useState(null)

  // New Ticket Form
  const [form, setForm] = useState({ subject: '', description: '', category: 'Technical Issue', priority: 'Low' })
  const [submitting, setSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [tRes, fRes] = await Promise.all([
        api.get('/api/support/tickets'),
        api.get('/api/support/faqs'),
      ])
      if (tRes.success) setTickets(tRes.data)
      if (fRes.success) setFaqs(fRes.data)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!form.subject.trim()) return
    setSubmitting(true)
    try {
      const res = await api.post('/api/support/tickets', form)
      if (res.success) {
        setTickets(t => [res.data, ...t])
        setForm({ subject: '', description: '', category: 'Technical Issue', priority: 'Low' })
        setSubmitSuccess(true)
        setTimeout(() => setSubmitSuccess(false), 3000)
      } else {
        alert('Failed to submit ticket: ' + (res.message || 'Unknown error'))
      }
    } catch (err) {
      alert('Error: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  // FAQ groups
  const userRole = user?.role === 'faculty' ? 'Faculty' : 'Student'
  const filteredFaqs = faqs.filter(f =>
    (f.category === 'General' || f.category === userRole) &&
    (f.question.toLowerCase().includes(search.toLowerCase()) || f.answer.toLowerCase().includes(search.toLowerCase()))
  )

  const inputStyle = {
    width: '100%', padding: '11px 14px', borderRadius: 10,
    border: '1px solid #e2e8f0', background: '#f8fafc',
    ...pjs(13, 400, '18px', '#0f172a'), outline: 'none', boxSizing: 'border-box',
  }
  const labelStyle = { ...inter(10, 700, '14px', '#64748b'), textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }

  return (
    <PageLayout>
      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '4px 0 8px' }}>
        <h1 style={pjs(30, 700, '38px', '#0f172a')}>How can we help you?</h1>
        <p style={{ ...pjs(14, 400, '20px', '#94a3b8'), marginTop: 6, marginBottom: 22 }}>
          Search FAQs, submit a ticket, or open a live chat with our support team
        </p>
        <div style={{ position: 'relative', maxWidth: 400, margin: '0 auto' }}>
          <svg style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} width="15" height="15" viewBox="0 0 15 15" fill="none">
            <circle cx="6.5" cy="6.5" r="5.5" stroke="#94a3b8" strokeWidth="1.3"/>
            <path d="M11 11l3 3" stroke="#94a3b8" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search FAQs or describe your issue..."
            style={{
              width: '100%', padding: '12px 16px 12px 42px',
              background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 14,
              ...pjs(14, 400, '20px', '#0f172a'), outline: 'none', boxSizing: 'border-box',
              boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
            }}
          />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, background: '#f1f5f9', borderRadius: 12, padding: 4, width: 'fit-content', marginBottom: 4 }}>
        {[{ id: 'tickets', label: `My Tickets (${tickets.length})` }, { id: 'faqs', label: 'FAQs' }].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            padding: '10px 24px', borderRadius: 10, border: 'none', cursor: 'pointer',
            background: activeTab === t.id ? '#fff' : 'transparent',
            ...pjs(13, activeTab === t.id ? 700 : 500, '18px', activeTab === t.id ? '#0f172a' : '#64748b'),
            boxShadow: activeTab === t.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
            transition: 'all 0.15s',
          }}>{t.label}</button>
        ))}
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>

        {/* LEFT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {activeTab === 'tickets' && (
            <>
              {/* Ticket List */}
              <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9', padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <h2 style={{ ...pjs(17, 700, '23px', '#0f172a'), marginBottom: 20 }}>Your Support Tickets</h2>
                {loading ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', ...inter(14, 400, '20px', '#94a3b8') }}>Loading tickets...</div>
                ) : tickets.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>🎫</div>
                    <div style={pjs(15, 600, '21px', '#0f172a')}>No tickets yet</div>
                    <div style={{ ...inter(13, 400, '18px', '#94a3b8'), marginTop: 4 }}>Submit a ticket using the form on the right</div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {tickets.map(t => {
                      const sc = STATUS_COLORS[t.status] || STATUS_COLORS['Open']
                      const pc = PRIORITY_COLORS[t.priority] || PRIORITY_COLORS['Low']
                      return (
                        <div key={t.id} style={{
                          border: '1px solid #f1f5f9', borderRadius: 14, padding: '16px 20px',
                          display: 'flex', alignItems: 'center', gap: 16, background: '#fff',
                          boxShadow: '0 1px 4px rgba(0,0,0,0.04)', cursor: 'pointer',
                          transition: 'border-color 0.15s',
                        }}
                          onClick={() => setChatTicket(t)}
                          onMouseEnter={e => e.currentTarget.style.borderColor = '#4f46e5'}
                          onMouseLeave={e => e.currentTarget.style.borderColor = '#f1f5f9'}
                        >
                          <div style={{
                            width: 42, height: 42, borderRadius: 10, background: pc.bg,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18,
                          }}>
                            {t.category === 'Technical Issue' ? '💻' : t.category === 'Network Issue' ? '📡' : t.category === 'Access Problem' ? '🔐' : t.category === 'Academic' ? '📚' : '🎫'}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={pjs(14, 700, '19px', '#0f172a')}>{t.subject}</div>
                            <div style={{ ...inter(12, 400, '16px', '#94a3b8'), marginTop: 2 }}>
                              #{t.id.slice(0, 8).toUpperCase()} · {new Date(t.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </div>
                            {t.admin_reply && (
                              <div style={{ ...inter(12, 400, '16px', '#4f46e5'), marginTop: 4 }}>
                                💬 Admin replied · Click to view chat
                              </div>
                            )}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                            <div style={{ padding: '4px 10px', borderRadius: 20, background: sc.bg, border: `1px solid ${sc.border}`, ...inter(11, 700, '15px', sc.color) }}>{t.status}</div>
                            <div style={{ padding: '3px 8px', borderRadius: 8, background: pc.bg, ...inter(11, 600, '15px', pc.color) }}>{t.priority}</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'faqs' && (
            <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9', padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <h2 style={{ ...pjs(17, 700, '23px', '#0f172a'), marginBottom: 20 }}>Frequently Asked Questions</h2>
              {filteredFaqs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', ...inter(13, 400, '18px', '#94a3b8') }}>No FAQs match your search.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {filteredFaqs.map(f => <FaqItem key={f.id} item={f} />)}
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT — New Ticket + Live Chat */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Submit Ticket */}
          <div style={{ background: '#fff', border: '1px solid #f1f5f9', borderRadius: 16, padding: '24px', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
            <h3 style={{ ...pjs(18, 700, '22px', '#0f172a'), marginBottom: 20 }}>Open New Ticket</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={labelStyle}>Issue Category</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                  {['Technical Issue', 'Network Issue', 'Access Problem', 'Academic', 'Billing', 'Other'].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Priority</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['Low', 'Med', 'High', 'Urgent'].map(p => (
                    <button key={p} onClick={() => setForm({ ...form, priority: p })} style={{
                      flex: 1, padding: '10px 4px', borderRadius: 10, cursor: 'pointer',
                      border: `1.5px solid ${form.priority === p ? '#4f46e5' : '#e2e8f0'}`,
                      background: form.priority === p ? '#4f46e5' : '#fff',
                      ...pjs(12, 700, '16px', form.priority === p ? '#fff' : '#64748b'),
                      transition: 'all 0.15s',
                    }}>{p}</button>
                  ))}
                </div>
              </div>
              <div>
                <label style={labelStyle}>Subject</label>
                <input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })}
                  placeholder="Brief summary of issue" style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#4f46e5'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>
              <div>
                <label style={labelStyle}>Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Detailed explanation of the issue..."
                  rows={4} style={{ ...inputStyle, resize: 'vertical', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  onFocus={e => e.target.style.borderColor = '#4f46e5'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>
              <button onClick={handleSubmit} disabled={submitting || !form.subject.trim()} style={{
                width: '100%', padding: '14px', borderRadius: 12, border: 'none', cursor: 'pointer',
                background: submitSuccess ? '#16a34a' : '#0f172a',
                ...pjs(14, 700, '20px', '#ffffff'), transition: 'background 0.2s', marginTop: 4
              }}>
                {submitting ? 'Submitting...' : submitSuccess ? '✓ Ticket Submitted!' : 'Submit Ticket'}
              </button>
            </div>
          </div>

          {/* Live Chat CTA */}
          <div style={{ background: '#0f172a', borderRadius: 16, padding: '24px', boxShadow: '0 4px 20px rgba(15,23,42,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M2 3h16v12H11l-3 3-1-3H2V3z" stroke="#ffffff" strokeWidth="1.4" strokeLinejoin="round" />
                <path d="M6 8h8M6 11h5" stroke="#ffffff" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
              <span style={pjs(17, 700, '23px', '#ffffff')}>Live Chat</span>
            </div>
            <p style={{ ...pjs(13, 400, '18px', '#94a3b8'), marginBottom: 16 }}>
              {tickets.length > 0 ? 'Click any ticket on the left to open live chat with our support team.' : 'Submit a ticket first, then use live chat to communicate with support.'}
            </p>
            {tickets.length > 0 && (
              <button
                onClick={() => setChatTicket(tickets[0])}
                style={{
                  width: '100%', padding: '13px', borderRadius: 12, border: 'none', cursor: 'pointer',
                  background: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  ...pjs(14, 700, '20px', '#ffffff'), transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#4338ca'}
                onMouseLeave={e => e.currentTarget.style.background = '#4f46e5'}
              >
                Open Latest Chat
              </button>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, justifyContent: 'center' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
              <span style={{ ...inter(11, 600, '15px', '#22c55e'), letterSpacing: '0.06em', textTransform: 'uppercase' }}>Support Online</span>
            </div>
          </div>

        </div>
      </div>

      {/* Live Chat Panel */}
      {chatTicket && (
        <ChatPanel ticket={chatTicket} user={user} onClose={() => setChatTicket(null)} />
      )}
    </PageLayout>
  )
}
