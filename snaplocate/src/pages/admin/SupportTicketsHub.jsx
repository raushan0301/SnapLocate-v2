import React, { useState, useEffect } from 'react'
import AdminPageTemplate from '../../components/admin/AdminPageTemplate'
import Modal from '../../components/admin/Modal'
import api from '../../lib/api'
import { Search, Plus, Filter, MessageSquare, BookOpen, Trash2, Edit3, X, ChevronDown } from 'lucide-react'

const pjs = (size, weight, lh, color) => ({
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  fontSize: size, fontWeight: weight, lineHeight: lh, color,
})
const inter = (size, weight, lh, color) => ({
  fontFamily: "'Inter', sans-serif",
  fontSize: size, fontWeight: weight, lineHeight: lh, color,
})

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

export default function AdminSupportHub() {
  const [activeTab, setActiveTab] = useState('tickets') // tickets | faqs
  
  const [tickets, setTickets] = useState([])
  const [faqs, setFaqs] = useState([])
  const [loading, setLoading] = useState(true)
  
  const [search, setSearch] = useState('')

  // Chat/Drawer state
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [messages, setMessages] = useState([])
  const [chatInput, setChatInput] = useState('')

  // FAQ state
  const [faqModalOpen, setFaqModalOpen] = useState(false)
  const [faqForm, setFaqForm] = useState({ id: null, question: '', answer: '', category: 'General', sort_order: 0 })
  const [faqSubmitting, setFaqSubmitting] = useState(false)
  const [msgError, setMsgError] = useState(null)
  const [sendError, setSendError] = useState(null)
  const [statusError, setStatusError] = useState(null)

  const handleAddFaq = () => {
    setFaqForm({ id: null, question: '', answer: '', category: 'General', sort_order: 0 })
    setFaqModalOpen(true)
  }

  const handleEditFaq = (faq) => {
    setFaqForm(faq)
    setFaqModalOpen(true)
  }

  const handleDeleteFaq = async (id) => {
    if (!window.confirm('Are you sure you want to delete this FAQ?')) return
    try {
      await api.delete(`/api/support/faqs/${id}`)
      setFaqs(faqs.filter(f => f.id !== id))
    } catch (e) { alert('Failed to delete') }
  }

  const handleSaveFaq = async (e) => {
    e.preventDefault()
    setFaqSubmitting(true)
    try {
      if (faqForm.id) {
        const res = await api.put(`/api/support/faqs/${faqForm.id}`, faqForm)
        if (res.success) setFaqs(faqs.map(f => f.id === faqForm.id ? res.data : f))
      } else {
        const payload = { ...faqForm }
        delete payload.id
        const res = await api.post('/api/support/faqs', payload)
        if (res.success) setFaqs([...faqs, res.data])
      }
      setFaqModalOpen(false)
    } catch (err) {
      alert('Failed to save FAQ')
    } finally {
      setFaqSubmitting(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [tRes, fRes] = await Promise.all([
        api.get('/api/support/tickets'),
        api.get('/api/support/faqs')
      ])
      if (tRes.success) setTickets(tRes.data)
      if (fRes.success) setFaqs(fRes.data)
    } finally {
      setLoading(false)
    }
  }

  // Poll messages while a ticket drawer is open (15s to avoid hammering the server)
  useEffect(() => {
    if (!selectedTicket) return
    setMsgError(null)
    const fetchMsgs = async () => {
      try {
        const res = await api.get(`/api/support/tickets/${selectedTicket.id}/messages`)
        if (res.success) setMessages(res.data)
        else setMsgError('Failed to load messages.')
      } catch (e) {
        setMsgError('Could not reach server.')
      }
    }
    fetchMsgs()
    const int = setInterval(fetchMsgs, 15000)
    return () => clearInterval(int)
  }, [selectedTicket])

  const handleUpdateStatus = async (ticketId, newStatus) => {
    setStatusError(null)
    try {
      const res = await api.patch(`/api/support/tickets/${ticketId}`, { status: newStatus })
      if (res.success) {
        setTickets(tickets.map(t => t.id === ticketId ? { ...t, status: newStatus } : t))
        if (selectedTicket?.id === ticketId) setSelectedTicket({ ...selectedTicket, status: newStatus })
      } else {
        setStatusError('Failed to update status.')
      }
    } catch (err) {
      setStatusError('Could not reach server.')
    }
  }

  const handleSendAdminReply = async () => {
    if (!chatInput.trim() || !selectedTicket) return
    setSendError(null)
    try {
      const [msgRes] = await Promise.all([
        api.post(`/api/support/tickets/${selectedTicket.id}/messages`, { message: chatInput }),
        api.patch(`/api/support/tickets/${selectedTicket.id}`, { admin_reply: chatInput }),
      ])
      if (!msgRes.success) { setSendError('Failed to send reply.'); return }
      setChatInput('')
      setTickets(tickets.map(t => t.id === selectedTicket.id ? { ...t, admin_reply: chatInput } : t))
    } catch (err) {
      setSendError('Could not send reply. Please try again.')
    }
  }

  const filteredTickets = tickets.filter(t => 
    t.subject.toLowerCase().includes(search.toLowerCase()) || 
    t.id.toLowerCase().includes(search.toLowerCase()) ||
    t.user_name?.toLowerCase().includes(search.toLowerCase())
  )

  const ticketColumns = [
    { label: 'Ticket ID', key: 'id', render: r => <span style={{ fontFamily: "monospace", fontSize: 13 }}>#{r.id.slice(0,8).toUpperCase()}</span> },
    { label: 'Submitter', key: 'user_name', render: r => (
      <div>
        <div style={pjs(14, 700, '18px', '#0f172a')}>{r.user_name || 'N/A'}</div>
        <div style={{ ...inter(12, 400, '16px', '#64748b'), textTransform: 'capitalize' }}>{r.user_role}</div>
      </div>
    )},
    { label: 'Subject', key: 'subject', render: r => (
      <div style={{ maxWidth: 220 }}>
        <div style={{ ...pjs(14, 600, '18px', '#0f172a'), whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.subject}</div>
        <div style={{ ...inter(12, 400, '16px', '#64748b'), whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.category}</div>
      </div>
    )},
    { label: 'Priority', key: 'priority', render: r => {
        const pc = PRIORITY_COLORS[r.priority] || PRIORITY_COLORS['Low']
        return <span style={{ background: pc.bg, color: pc.color, padding: '4px 8px', borderRadius: 8, ...inter(12, 700) }}>{r.priority}</span>
    }},
    { label: 'Status', key: 'status', render: r => {
        const sc = STATUS_COLORS[r.status] || STATUS_COLORS['Open']
        return (
          <select 
            value={r.status}
            onChange={(e) => handleUpdateStatus(r.id, e.target.value)}
            style={{ 
              background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`,
              padding: '4px 8px', borderRadius: 8, ...inter(12, 700), outline: 'none', cursor: 'pointer'
            }}
          >
            {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        )
    }},
    { label: 'Action', key: 'view', render: r => (
      <button onClick={() => setSelectedTicket(r)} style={{
        padding: '6px 12px', background: '#eef2ff', color: '#4f46e5', border: 'none', borderRadius: 8,
        cursor: 'pointer', ...inter(12, 600)
      }}>View & Reply</button>
    )}
  ]

  return (
    <>
      <AdminPageTemplate
        title="Support Desk Hub"
        description="Manage incoming student/faculty tickets and conduct live chat support."
        hideTable={true}
      >
        
        {/* View Toggles & Search Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 4, background: '#f1f5f9', borderRadius: 14, padding: 4 }}>
            {[
              { id: 'tickets', label: 'Support Tickets', icon: MessageSquare }, 
              { id: 'faqs', label: 'Manage FAQs', icon: BookOpen }
            ].map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 8,
                background: activeTab === t.id ? '#fff' : 'transparent',
                ...pjs(14, activeTab === t.id ? 700 : 500, '18px', activeTab === t.id ? '#4f46e5' : '#64748b'),
                boxShadow: activeTab === t.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.2s'
              }}>
                <t.icon size={16} />
                {t.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
            {activeTab === 'tickets' && (
              <div style={{ position: 'relative', width: '300px', flexShrink: 0 }}>
                <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
                <input
                  type="text"
                  placeholder="Search tickets by subject, ID, or user..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 16px 10px 34px', borderRadius: 10, border: '1.5px solid #e2e8f0',
                    ...inter(14, 400, '20px', '#0f172a'), outline: 'none', appearance: 'none', transition: '0.2s'
                  }}
                  onFocus={e => e.target.style.borderColor = '#4f46e5'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>
            )}
            
            {activeTab === 'tickets' && (
              <div style={{ position: 'relative' }}>
                <select
                  style={{
                    padding: '10px 36px 10px 16px', borderRadius: 10, border: '1.5px solid #e2e8f0',
                    fontSize: 14, fontWeight: 500, color: '#0f172a', background: '#fff',
                    outline: 'none', cursor: 'pointer', appearance: 'none', fontFamily: "'Inter', sans-serif",
                    transition: '0.2s', backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="%2364748b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>')`,
                    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center',
                    minWidth: 140
                  }}
                  onFocus={e => e.target.style.borderColor = '#4f46e5'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                >
                  <option value="all">All Status</option>
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
            )}

            {activeTab === 'faqs' && (
              <button 
                onClick={handleAddFaq}
                style={{ 
                  padding: '10px 20px', background: '#4f46e5', color: '#fff', border: 'none', 
                  borderRadius: 10, ...pjs(14, 700, '20px'), cursor: 'pointer', 
                  display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 12px rgba(79, 70, 229, 0.2)'
                }}
              >
                <Plus size={18} /> Add FAQ
              </button>
            )}
          </div>
        </div>

        {statusError && (
          <div style={{ marginBottom: 12, background: '#fff1f2', border: '1px solid #fda4af', borderRadius: 10, padding: '10px 16px', ...inter(13, 500, '18px', '#e11d48') }}>
            {statusError}
          </div>
        )}
        {activeTab === 'tickets' && (
          <div style={{ background: '#ffffff', borderRadius: 20, padding: 24, border: '1px solid #f1f5f9', boxShadow: '0 4px 24px rgba(0,0,0,0.03)' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ minWidth: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    {ticketColumns.map((col, i) => (
                      <th key={i} style={{ ...pjs(12, 600, '16px', '#64748b'), textTransform: 'uppercase', letterSpacing: '0.5px', padding: '14px 16px', textAlign: 'left', whiteSpace: 'nowrap' }}>
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} style={{ padding: '40px 0', textAlign: 'center' }}>Loading...</td></tr>
                  ) : filteredTickets.length === 0 ? (
                    <tr><td colSpan={6} style={{ padding: '40px 0', textAlign: 'center' }}>No tickets found.</td></tr>
                  ) : (
                    filteredTickets.map((row) => (
                      <tr key={row.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        {ticketColumns.map((col, j) => (
                          <td key={j} style={{ padding: '16px', ...inter(14, 400, '20px', '#334155') }}>{col.render(row)}</td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'faqs' && (
          <div style={{ background: '#ffffff', borderRadius: 20, padding: 24, border: '1px solid #f1f5f9', boxShadow: '0 4px 24px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, alignItems: 'center' }}>
              <h2 style={pjs(18, 700, '24px', '#0f172a')}>Knowledge Base FAQs</h2>
            </div>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ minWidth: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ ...pjs(12, 600, '16px', '#64748b'), textTransform: 'uppercase', padding: '14px 16px', textAlign: 'left' }}>Question</th>
                    <th style={{ ...pjs(12, 600, '16px', '#64748b'), textTransform: 'uppercase', padding: '14px 16px', textAlign: 'left' }}>Category</th>
                    <th style={{ ...pjs(12, 600, '16px', '#64748b'), textTransform: 'uppercase', padding: '14px 16px', textAlign: 'left' }}>Sort Order</th>
                    <th style={{ ...pjs(12, 600, '16px', '#64748b'), textTransform: 'uppercase', padding: '14px 16px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {faqs.length === 0 ? (
                    <tr><td colSpan={4} style={{ padding: '40px 0', textAlign: 'center' }}>No FAQs found.</td></tr>
                  ) : (
                    faqs.sort((a,b) => a.sort_order - b.sort_order).map((row) => (
                      <tr key={row.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '16px', ...pjs(14, 600, '18px', '#0f172a') }}>{row.question}</td>
                        <td style={{ padding: '16px', ...inter(13, 400, '18px', '#64748b') }}>{row.category}</td>
                        <td style={{ padding: '16px', ...inter(13, 400, '18px', '#64748b') }}>{row.sort_order}</td>
                        <td style={{ padding: '16px', textAlign: 'right' }}>
                          <button onClick={() => handleEditFaq(row)} style={{ marginRight: 8, padding: '7px 14px', background: '#f1f5f9', border: 'none', borderRadius: 10, cursor: 'pointer', ...inter(13, 600), color: '#475569' }}>
                            <Edit3 size={14} style={{ marginRight: 4 }} />
                            Edit
                          </button>
                          <button onClick={() => handleDeleteFaq(row.id)} style={{ padding: '7px 14px', background: '#fff1f2', color: '#ef4444', border: 'none', borderRadius: 10, cursor: 'pointer', ...inter(13, 600) }}>
                            <Trash2 size={14} style={{ marginRight: 4 }} />
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </AdminPageTemplate>

      {/* Ticket Side Drawer */}
      {selectedTicket && (
        <div style={{
          position: 'fixed', top: 0, right: 0, width: 440, height: '100vh',
          background: '#fff', boxShadow: '-10px 0 40px rgba(0,0,0,0.1)', zIndex: 1000,
          display: 'flex', flexDirection: 'column'
        }}>
          {/* Drawer Header */}
          <div style={{ padding: '24px', borderBottom: '1px solid #f1f5f9', background: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ ...inter(12, 600, '16px', '#64748b'), marginBottom: 4 }}>ID: #{selectedTicket.id.split('-')[0].toUpperCase()}</div>
                <h2 style={pjs(20, 700, '26px', '#0f172a')}>{selectedTicket.subject}</h2>
              </div>
              <button onClick={() => setSelectedTicket(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 24, color: '#94a3b8' }}>✕</button>
            </div>
            
            <div style={{ padding: '16px', background: '#f8fafc', borderRadius: 12, marginTop: 16 }}>
              <div style={{ ...inter(12, 600, '16px', '#64748b'), marginBottom: 4, textTransform: 'uppercase' }}>Issue Description</div>
              <div style={inter(14, 400, '22px', '#0f172a')}>{selectedTicket.description}</div>
            </div>
          </div>

          {/* Chat Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: 16, background: '#f8fafc' }}>
             {msgError && (
               <div style={{ background: '#fff1f2', border: '1px solid #fda4af', borderRadius: 8, padding: '10px 14px', ...inter(13, 500, '18px', '#e11d48') }}>
                 {msgError}
               </div>
             )}
             {messages.length === 0 && !msgError && (
                <div style={{ textAlign: 'center', ...inter(13, 400, '18px', '#94a3b8'), marginTop: 40 }}>
                  No messages yet. Send a reply to start the conversation.
                </div>
              )}
              {messages.map(m => {
                const isAdmin = m.sender_role === 'admin'
                return (
                  <div key={m.id} style={{ display: 'flex', justifyContent: isAdmin ? 'flex-end' : 'flex-start' }}>
                    <div style={{
                      maxWidth: '85%', padding: '12px 16px', 
                      borderRadius: isAdmin ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      background: isAdmin ? '#4f46e5' : '#ffffff',
                      border: isAdmin ? 'none' : '1px solid #e2e8f0',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                    }}>
                      {!isAdmin && (
                        <div style={{ ...inter(11, 700, '16px', '#64748b'), marginBottom: 4 }}>
                          {m.sender_name} <span style={{ fontWeight: 400, opacity: 0.7 }}>({m.sender_role})</span>
                        </div>
                      )}
                      <div style={inter(14, 400, '20px', isAdmin ? '#ffffff' : '#0f172a')}>{m.message}</div>
                      <div style={{ ...inter(10, 400, '14px', isAdmin ? 'rgba(255,255,255,0.7)' : '#94a3b8'), marginTop: 6, textAlign: 'right' }}>
                        {new Date(m.created_at).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                )
              })}
          </div>

          {/* Input Area */}
          <div style={{ padding: '20px 24px', background: '#fff', borderTop: '1px solid #e2e8f0' }}>
            <textarea
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Type your official reply..."
              rows={3}
              style={{
                width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid #e2e8f0',
                ...inter(14, 400, '20px', '#0f172a'), outline: 'none', resize: 'none', marginBottom: 12,
                boxSizing: 'border-box'
              }}
              onFocus={e => e.target.style.borderColor = '#4f46e5'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />
            {sendError && (
              <div style={{ marginBottom: 8, background: '#fff1f2', border: '1px solid #fda4af', borderRadius: 8, padding: '8px 12px', ...inter(12, 500, '16px', '#e11d48') }}>
                {sendError}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ ...inter(12, 500, '16px', '#64748b') }}>
                Pressing send will notify the user.
              </div>
              <button
                onClick={handleSendAdminReply}
                disabled={!chatInput.trim()}
                style={{
                  padding: '10px 24px', background: chatInput.trim() ? '#4f46e5' : '#e2e8f0',
                  color: chatInput.trim() ? '#fff' : '#94a3b8', border: 'none', borderRadius: 10,
                  ...pjs(13, 700, '18px'), cursor: chatInput.trim() ? 'pointer' : 'default',
                  transition: 'background 0.2s'
                }}
              >
                Send Reply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FAQ Modal */}
      <Modal isOpen={faqModalOpen} onClose={() => !faqSubmitting && setFaqModalOpen(false)} title={faqForm.id ? "Edit FAQ" : "Add FAQ"}>
        <form onSubmit={handleSaveFaq} style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '10px 0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Category</label>
              <div style={{ position: 'relative' }}>
                <select 
                  value={faqForm.category} 
                  onChange={e => setFaqForm({ ...faqForm, category: e.target.value })} 
                  style={{ 
                    width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', 
                    outline: 'none', appearance: 'none', background: '#fff', ...inter(14, 500, '20px', '#0f172a'),
                    backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="%2364748b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>')`,
                    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center'
                  }}
                  onFocus={e => e.target.style.borderColor = '#4f46e5'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                >
                  <option>General</option>
                  <option>Student</option>
                  <option>Faculty</option>
                </select>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sort Order (Priority)</label>
              <input 
                type="number" 
                value={faqForm.sort_order} 
                onChange={e => setFaqForm({ ...faqForm, sort_order: parseInt(e.target.value) || 0 })} 
                style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', outline: 'none', ...inter(14, 500, '20px', '#0f172a'), boxSizing: 'border-box' }} 
                onFocus={e => e.target.style.borderColor = '#4f46e5'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Question</label>
            <input 
              required 
              type="text" 
              placeholder="Enter a descriptive question..."
              value={faqForm.question} 
              onChange={e => setFaqForm({ ...faqForm, question: e.target.value })} 
              style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', outline: 'none', ...inter(14, 500, '20px', '#0f172a'), boxSizing: 'border-box' }} 
              onFocus={e => e.target.style.borderColor = '#4f46e5'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Answer</label>
            <textarea 
              required 
              placeholder="Provide a detailed answer or explanation..."
              value={faqForm.answer} 
              onChange={e => setFaqForm({ ...faqForm, answer: e.target.value })} 
              style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', outline: 'none', minHeight: 120, resize: 'vertical', ...inter(14, 400, '22px', '#0f172a'), boxSizing: 'border-box' }} 
              onFocus={e => e.target.style.borderColor = '#4f46e5'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>
          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button type="button" onClick={() => setFaqModalOpen(false)} disabled={faqSubmitting} style={{ padding: '12px 24px', borderRadius: 12, border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer', ...pjs(14, 700, '20px', '#64748b'), transition: 'all 0.2s' }}>Cancel</button>
            <button type="submit" disabled={faqSubmitting} style={{ padding: '12px 24px', borderRadius: 12, border: 'none', background: '#4f46e5', color: '#fff', cursor: 'pointer', ...pjs(14, 700, '20px', '#fff'), boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)', transition: 'all 0.2s' }}>
              {faqSubmitting ? 'Saving...' : (faqForm.id ? 'Save Changes' : 'Publish FAQ')}
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}
