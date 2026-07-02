import { useState, useEffect, useRef } from 'react'
import PageLayout from '../../components/PageLayout'
import { useAuth } from '../../context/AuthContext'
import api from '../../lib/api'

const STATUS_COLORS = {
  'Open':        { bg: '#eff6ff', color: '#3b82f6', border: '#bfdbfe' },
  'In Progress': { bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
  'Resolved':    { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  'Closed':      { bg: '#f8fafc', color: '#64748b', border: '#e2e8f0' },
}
const PRIORITY_COLORS = {
  'Low':    { bg: '#f0fdf4', color: '#16a34a' },
  'Med':    { bg: '#fffbeb', color: '#d97706' },
  'High':   { bg: '#fff7ed', color: '#ea580c' },
  'Urgent': { bg: '#fff1f2', color: '#ef4444' },
}
const CAT_EMOJI = {
  'Technical Issue': '💻', 'Network Issue': '📡',
  'Access Problem': '🔐', 'Academic': '📚',
}

function FaqItem({ item }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
      <div
        onClick={() => setOpen(o => !o)}
        className={`px-[18px] py-3.5 cursor-pointer flex justify-between items-center gap-3 ${open ? 'bg-surface' : 'bg-white'}`}
      >
        <span className="t-md font-semibold t-primary">{item.question}</span>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
          <path d="M3 5l5 5 5-5" stroke="#64748b" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      {open && (
        <div className="px-[18px] pb-4 t-md t-muted leading-[20px] border-t border-slate-100 pt-3">{item.answer}</div>
      )}
    </div>
  )
}

function ChatPanel({ ticket, user, onClose }) {
  const [messages, setMessages] = useState([])
  const [input, setInput]       = useState('')
  const [sending, setSending]   = useState(false)
  const bottomRef               = useRef(null)

  useEffect(() => {
    fetchMessages()
    const interval = setInterval(fetchMessages, 5000)
    return () => clearInterval(interval)
  }, [ticket.id])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const fetchMessages = async () => {
    try {
      const res = await api.get(`/api/support/tickets/${ticket.id}/messages`)
      if (res.success) setMessages(res.data)
    } catch {}
  }

  const sendMessage = async () => {
    if (!input.trim() || sending) return
    setSending(true)
    try {
      await api.post(`/api/support/tickets/${ticket.id}/messages`, { message: input })
      setInput('')
      await fetchMessages()
    } finally { setSending(false) }
  }

  return (
    <div className="fixed bottom-6 right-6 w-[380px] h-[520px] bg-white rounded-[20px] border border-ink-border z-[1000] flex flex-col shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
      {/* Header */}
      <div className="px-5 py-4 bg-ink rounded-[20px_20px_0_0] flex items-center justify-between">
        <div>
          <div className="t-md font-bold text-white">Live Chat</div>
          <div className="text-[11px] t-subtle mt-0.5">Ticket #{ticket.id.slice(0, 8).toUpperCase()}</div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-[11px] font-semibold text-green-400">Online</span>
          </div>
          <button onClick={onClose} className="bg-transparent border-none cursor-pointer t-subtle text-lg leading-none">✕</button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {messages.length === 0 && (
          <div className="text-center m-auto t-md t-subtle">Start the conversation. Our support team will respond shortly.</div>
        )}
        {messages.map(m => {
          const isMe = m.sender_id === user?.id
          return (
            <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] px-3.5 py-2.5 ${isMe ? 'bg-brand text-white border-none rounded-[16px_16px_4px_16px]' : 'bg-surface border border-ink-border rounded-[16px_16px_16px_4px]'}`}
              >
                {!isMe && (
                  <div className="text-[10px] font-bold text-brand mb-1 uppercase">{m.sender_role === 'admin' ? '🛡 Support Agent' : m.sender_name}</div>
                )}
                <div className={`t-md ${isMe ? 'text-white' : 't-primary'}`}>{m.message}</div>
                <div className={`text-[10px] mt-1 text-right ${isMe ? 'text-white/60' : 't-subtle'}`}>
                  {new Date(m.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-slate-100 flex gap-2.5">
        <input
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          placeholder="Type a message..."
          className="flex-1 px-3.5 py-2.5 rounded-xl border border-ink-border bg-surface t-md t-primary outline-none"
        />
        <button
          onClick={sendMessage} disabled={sending || !input.trim()}
          className={`w-10 h-10 rounded-xl border-none flex items-center justify-center shrink-0 transition-colors ${input.trim() ? 'bg-brand cursor-pointer' : 'bg-slate-200 cursor-default'}`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default function SupportPage() {
  const { user }    = useAuth()
  const [tickets, setTickets]     = useState([])
  const [faqs, setFaqs]           = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [activeTab, setActiveTab] = useState('faqs')
  const [chatTicket, setChatTicket] = useState(null)
  const [form, setForm]           = useState({ subject: '', description: '', category: 'Technical Issue', priority: 'Low' })
  const [submitting, setSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [tRes, fRes] = await Promise.all([api.get('/api/support/tickets'), api.get('/api/support/faqs')])
      if (tRes.success) setTickets(tRes.data)
      if (fRes.success) setFaqs(fRes.data)
    } finally { setLoading(false) }
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
      } else alert('Failed to submit ticket: ' + (res.message || 'Unknown error'))
    } catch (err) { alert('Error: ' + err.message) }
    finally { setSubmitting(false) }
  }

  const userRole = user?.role === 'faculty' ? 'Faculty' : 'Student'
  const filteredFaqs = faqs.filter(f =>
    (f.category === 'General' || f.category === userRole) &&
    (f.question.toLowerCase().includes(search.toLowerCase()) || f.answer.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <PageLayout>
      {/* Hero */}
      <div className="text-center py-1">
        <h1 className="t-heading-3xl t-primary">How can we help you?</h1>
        <p className="t-base t-subtle mt-1.5 mb-6">Search FAQs, submit a ticket, or open a live chat with our support team</p>
        <div className="relative max-w-[400px] mx-auto">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2" width="15" height="15" viewBox="0 0 15 15" fill="none">
            <circle cx="6.5" cy="6.5" r="5.5" stroke="#94a3b8" strokeWidth="1.3" />
            <path d="M11 11l3 3" stroke="#94a3b8" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search FAQs or describe your issue..."
            className="w-full py-3 pr-4 pl-10 bg-white border border-ink-border rounded-2xl t-base t-primary outline-none shadow-[0_4px_16px_rgba(0,0,0,0.06)]"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-muted rounded-xl p-1 w-fit">
        {[{ id: 'faqs', label: 'FAQs' }, { id: 'tickets', label: `My Tickets (${tickets.length})` }].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`px-6 py-2.5 rounded-[10px] border-none cursor-pointer t-md transition-all ${activeTab === t.id ? 'bg-white font-bold t-primary shadow-[0_1px_4px_rgba(0,0,0,0.08)]' : 'bg-transparent font-medium t-secondary'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-5 items-start">

        {/* Left */}
        <div className="flex flex-col gap-5">
          {activeTab === 'tickets' && (
            <div className="card p-6">
              <h2 className="t-heading-lg t-primary mb-5">Your Support Tickets</h2>
              {loading ? (
                <div className="text-center py-10 t-base t-subtle">Loading tickets...</div>
              ) : tickets.length === 0 ? (
                <div className="text-center py-10">
                  <div className="text-4xl mb-3">🎫</div>
                  <div className="t-lg font-semibold t-primary">No tickets yet</div>
                  <div className="t-md t-subtle mt-1">Submit a ticket using the form on the right</div>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {tickets.map(t => {
                    const sc = STATUS_COLORS[t.status] || STATUS_COLORS['Open']
                    const pc = PRIORITY_COLORS[t.priority] || PRIORITY_COLORS['Low']
                    return (
                      <div key={t.id}
                        className="border border-slate-100 rounded-[14px] px-5 py-4 flex items-center gap-4 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)] cursor-pointer transition-[border-color] duration-150 hover:border-brand"
                        onClick={() => setChatTicket(t)}>
                        <div className="w-[42px] h-[42px] rounded-[10px] flex items-center justify-center shrink-0 text-lg" style={{ background: pc.bg }}>
                          {CAT_EMOJI[t.category] || '🎫'}
                        </div>
                        <div className="flex-1">
                          <div className="t-md font-bold t-primary">{t.subject}</div>
                          <div className="t-xs t-subtle mt-0.5">
                            #{t.id.slice(0, 8).toUpperCase()} · {new Date(t.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </div>
                          {t.admin_reply && <div className="t-xs text-brand mt-1">💬 Admin replied · Click to view chat</div>}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="px-2.5 py-1 rounded-full text-[11px] font-bold border" style={{ background: sc.bg, borderColor: sc.border, color: sc.color }}>{t.status}</div>
                          <div className="px-2 py-0.5 rounded-lg text-[11px] font-semibold" style={{ background: pc.bg, color: pc.color }}>{t.priority}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'faqs' && (
            <div className="card p-6">
              <h2 className="t-heading-lg t-primary mb-5">Frequently Asked Questions</h2>
              {filteredFaqs.length === 0 ? (
                <div className="text-center py-10 t-md t-subtle">No FAQs match your search.</div>
              ) : (
                <div className="flex flex-col gap-2">
                  {filteredFaqs.map(f => <FaqItem key={f.id} item={f} />)}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right */}
        <div className="flex flex-col gap-5">
          {/* Submit ticket form */}
          <div className="card p-6">
            <h3 className="t-heading-lg t-primary mb-5">Open New Ticket</h3>
            <div className="flex flex-col gap-4">
              <div>
                <label className="t-label-sm t-subtle uppercase tracking-[0.08em] block mb-1.5">Issue Category</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="input cursor-pointer">
                  {['Technical Issue', 'Network Issue', 'Access Problem', 'Academic', 'Billing', 'Other'].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="t-label-sm t-subtle uppercase tracking-[0.08em] block mb-1.5">Priority</label>
                <div className="flex gap-2">
                  {['Low', 'Med', 'High', 'Urgent'].map(p => (
                    <button key={p} onClick={() => setForm({ ...form, priority: p })}
                      className={`flex-1 py-2.5 px-1 rounded-[10px] cursor-pointer t-md font-bold transition-all border-[1.5px] ${form.priority === p ? 'bg-brand border-brand text-white' : 'bg-white border-ink-border t-secondary'}`}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="t-label-sm t-subtle uppercase tracking-[0.08em] block mb-1.5">Subject</label>
                <input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })}
                  placeholder="Brief summary of issue" className="input"
                  onFocus={e => e.target.style.borderColor = '#4f46e5'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
              </div>
              <div>
                <label className="t-label-sm t-subtle uppercase tracking-[0.08em] block mb-1.5">Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Detailed explanation of the issue..."
                  rows={4} className="input resize-y"
                  onFocus={e => e.target.style.borderColor = '#4f46e5'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
              </div>
              <button onClick={handleSubmit} disabled={submitting || !form.subject.trim()}
                className={`w-full py-3.5 rounded-xl border-none text-white t-heading-md cursor-pointer transition-colors mt-1 ${submitSuccess ? 'bg-success' : 'bg-ink hover:bg-[#1e293b]'} disabled:bg-slate-300 disabled:cursor-not-allowed`}>
                {submitting ? 'Submitting...' : submitSuccess ? '✓ Ticket Submitted!' : 'Submit Ticket'}
              </button>
            </div>
          </div>

          {/* Live chat CTA */}
          <div className="bg-ink rounded-2xl p-6 shadow-[0_4px_20px_rgba(15,23,42,0.2)]">
            <div className="flex items-center gap-2.5 mb-2">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M2 3h16v12H11l-3 3-1-3H2V3z" stroke="#ffffff" strokeWidth="1.4" strokeLinejoin="round" />
                <path d="M6 8h8M6 11h5" stroke="#ffffff" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
              <span className="t-heading-lg text-white">Live Chat</span>
            </div>
            <p className="t-md t-subtle mb-4">
              {tickets.length > 0
                ? 'Click any ticket on the left to open live chat with our support team.'
                : 'Submit a ticket first, then use live chat to communicate with support.'}
            </p>
            {tickets.length > 0 && (
              <button
                onClick={() => setChatTicket(tickets[0])}
                className="w-full py-3 rounded-xl border-none bg-brand text-white t-heading-md cursor-pointer flex items-center justify-center gap-2.5 hover:bg-brand-dark transition-colors"
              >
                Open Latest Chat
              </button>
            )}
            <div className="flex items-center gap-2 mt-4 justify-center">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-[11px] font-semibold text-green-400 uppercase tracking-[0.06em]">Support Online</span>
            </div>
          </div>
        </div>
      </div>

      {chatTicket && <ChatPanel ticket={chatTicket} user={user} onClose={() => setChatTicket(null)} />}
    </PageLayout>
  )
}
