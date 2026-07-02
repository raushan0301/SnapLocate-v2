import React, { useState, useEffect } from 'react'
import AdminPageTemplate from '../../components/admin/AdminPageTemplate'
import Modal from '../../components/admin/Modal'
import api from '../../lib/api'
import { Search, Plus, MessageSquare, BookOpen, Trash2, Edit3 } from 'lucide-react'

const STATUS_COLORS = {
  'Open':        { cls: 'bg-blue-50 text-blue-500 border border-blue-200' },
  'In Progress': { cls: 'bg-amber-50 text-amber-600 border border-amber-200' },
  'Resolved':    { cls: 'bg-green-50 text-green-600 border border-green-200' },
  'Closed':      { cls: 'bg-slate-50 text-slate-500 border border-slate-200' },
}

const PRIORITY_COLORS = {
  'Low':    'bg-green-50 text-green-600',
  'Med':    'bg-amber-50 text-amber-600',
  'High':   'bg-orange-50 text-orange-500',
  'Urgent': 'bg-red-50 text-red-500',
}

const fieldCls = 'w-full px-3.5 py-3 rounded-[10px] border-[1.5px] border-slate-200 text-[14px] outline-none box-border focus:border-brand transition-colors'
const labelCls = 'block text-[13px] font-bold text-slate-600 mb-1.5 uppercase tracking-[0.05em]'

export default function AdminSupportHub() {
  const [activeTab, setActiveTab]       = useState('tickets')
  const [tickets, setTickets]           = useState([])
  const [faqs, setFaqs]                 = useState([])
  const [loading, setLoading]           = useState(true)
  const [search, setSearch]             = useState('')
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [messages, setMessages]         = useState([])
  const [chatInput, setChatInput]       = useState('')
  const [faqModalOpen, setFaqModalOpen] = useState(false)
  const [faqForm, setFaqForm] = useState({ id: null, question: '', answer: '', category: 'General', sort_order: 0 })
  const [faqSubmitting, setFaqSubmitting] = useState(false)
  const [msgError, setMsgError]         = useState(null)
  const [sendError, setSendError]       = useState(null)
  const [statusError, setStatusError]   = useState(null)

  const handleAddFaq = () => { setFaqForm({ id: null, question: '', answer: '', category: 'General', sort_order: 0 }); setFaqModalOpen(true) }
  const handleEditFaq = (faq) => { setFaqForm(faq); setFaqModalOpen(true) }

  const handleDeleteFaq = async (id) => {
    if (!window.confirm('Are you sure you want to delete this FAQ?')) return
    try { await api.delete(`/api/support/faqs/${id}`); setFaqs(faqs.filter(f => f.id !== id)) } catch { alert('Failed to delete') }
  }

  const handleSaveFaq = async (e) => {
    e.preventDefault()
    setFaqSubmitting(true)
    try {
      if (faqForm.id) {
        const res = await api.put(`/api/support/faqs/${faqForm.id}`, faqForm)
        if (res.success) setFaqs(faqs.map(f => f.id === faqForm.id ? res.data : f))
      } else {
        const payload = { ...faqForm }; delete payload.id
        const res = await api.post('/api/support/faqs', payload)
        if (res.success) setFaqs([...faqs, res.data])
      }
      setFaqModalOpen(false)
    } catch { alert('Failed to save FAQ') } finally { setFaqSubmitting(false) }
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const [tRes, fRes] = await Promise.all([api.get('/api/support/tickets'), api.get('/api/support/faqs')])
      if (tRes.success) setTickets(tRes.data)
      if (fRes.success) setFaqs(fRes.data)
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  useEffect(() => {
    if (!selectedTicket) return
    setMsgError(null)
    const fetchMsgs = async () => {
      try {
        const res = await api.get(`/api/support/tickets/${selectedTicket.id}/messages`)
        if (res.success) setMessages(res.data)
        else setMsgError('Failed to load messages.')
      } catch { setMsgError('Could not reach server.') }
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
      } else setStatusError('Failed to update status.')
    } catch { setStatusError('Could not reach server.') }
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
    } catch { setSendError('Could not send reply. Please try again.') }
  }

  const filteredTickets = tickets.filter(t =>
    t.subject.toLowerCase().includes(search.toLowerCase()) ||
    t.id.toLowerCase().includes(search.toLowerCase()) ||
    t.user_name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      <AdminPageTemplate title="Support Desk Hub" description="Manage incoming student/faculty tickets and conduct live chat support." hideTable={true}>
        <div className="flex justify-between items-center mb-6 gap-4 flex-wrap">
          <div className="flex gap-1 bg-slate-100 rounded-[14px] p-1">
            {[{ id: 'tickets', label: 'Support Tickets', icon: MessageSquare }, { id: 'faqs', label: 'Manage FAQs', icon: BookOpen }].map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-[10px] border-0 cursor-pointer text-[14px] transition-all ${activeTab === t.id ? 'bg-white text-brand font-bold shadow-[0_1px_4px_rgba(0,0,0,0.08)]' : 'bg-transparent text-slate-500 font-medium'}`}>
                <t.icon size={16} /> {t.label}
              </button>
            ))}
          </div>

          <div className="flex gap-3 items-center flex-1 justify-end">
            {activeTab === 'tickets' && (
              <>
                <div className="relative w-[300px] shrink-0">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input type="text" placeholder="Search tickets by subject, ID, or user..." value={search} onChange={e => setSearch(e.target.value)}
                    className="w-full py-2.5 pl-[34px] pr-4 rounded-[10px] border-[1.5px] border-slate-200 text-[14px] outline-none focus:border-brand transition-colors" />
                </div>
                <select className="px-4 py-2.5 rounded-[10px] border-[1.5px] border-slate-200 text-[14px] t-primary bg-white outline-none cursor-pointer min-w-[140px] focus:border-brand transition-colors">
                  <option value="all">All Status</option>
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>
              </>
            )}
            {activeTab === 'faqs' && (
              <button onClick={handleAddFaq} className="flex items-center gap-2 px-5 py-2.5 rounded-[10px] border-0 bg-brand text-white font-bold text-[14px] cursor-pointer shadow-[0_4px_12px_rgba(79,70,229,0.2)]">
                <Plus size={18} /> Add FAQ
              </button>
            )}
          </div>
        </div>

        {statusError && (
          <div className="mb-3 bg-red-50 border border-red-200 rounded-[10px] px-4 py-2.5 text-[13px] font-medium text-red-600">{statusError}</div>
        )}

        {activeTab === 'tickets' && (
          <div className="bg-white rounded-[20px] p-6 border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.03)]">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {['Ticket ID', 'Submitter', 'Subject', 'Priority', 'Status', 'Action'].map((h, i) => (
                      <th key={i} className="px-4 py-3.5 text-left text-[12px] font-semibold text-slate-500 uppercase tracking-[0.5px] whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} className="py-10 text-center t-muted">Loading...</td></tr>
                  ) : filteredTickets.length === 0 ? (
                    <tr><td colSpan={6} className="py-10 text-center t-muted">No tickets found.</td></tr>
                  ) : filteredTickets.map(row => {
                    const sc = STATUS_COLORS[row.status] || STATUS_COLORS['Open']
                    const pc = PRIORITY_COLORS[row.priority] || PRIORITY_COLORS['Low']
                    return (
                      <tr key={row.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-4 font-mono text-[13px] t-muted">#{row.id.slice(0,8).toUpperCase()}</td>
                        <td className="px-4 py-4">
                          <div className="text-[14px] font-bold t-primary">{row.user_name || 'N/A'}</div>
                          <div className="text-[12px] t-muted capitalize">{row.user_role}</div>
                        </td>
                        <td className="px-4 py-4 max-w-[220px]">
                          <div className="text-[14px] font-semibold t-primary truncate">{row.subject}</div>
                          <div className="text-[12px] t-muted truncate">{row.category}</div>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`px-2 py-1 rounded-[8px] text-[12px] font-bold ${pc}`}>{row.priority}</span>
                        </td>
                        <td className="px-4 py-4">
                          <select value={row.status} onChange={e => handleUpdateStatus(row.id, e.target.value)}
                            className={`px-2 py-1 rounded-[8px] text-[12px] font-bold border outline-none cursor-pointer ${sc.cls}`}>
                            {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </td>
                        <td className="px-4 py-4">
                          <button onClick={() => setSelectedTicket(row)} className="px-3 py-1.5 bg-indigo-50 text-brand border-0 rounded-[8px] cursor-pointer text-[12px] font-semibold hover:bg-indigo-100 transition-colors">View & Reply</button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'faqs' && (
          <div className="bg-white rounded-[20px] p-6 border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.03)]">
            <h2 className="text-[18px] font-bold t-primary m-0 mb-5">Knowledge Base FAQs</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {['Question', 'Category', 'Sort Order', 'Actions'].map((h, i) => (
                      <th key={i} className={`px-4 py-3.5 text-[12px] font-semibold text-slate-500 uppercase tracking-[0.5px] ${i === 3 ? 'text-right' : 'text-left'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {faqs.length === 0 ? (
                    <tr><td colSpan={4} className="py-10 text-center t-muted">No FAQs found.</td></tr>
                  ) : faqs.sort((a,b) => a.sort_order - b.sort_order).map(row => (
                    <tr key={row.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-4 text-[14px] font-semibold t-primary">{row.question}</td>
                      <td className="px-4 py-4 text-[13px] t-muted">{row.category}</td>
                      <td className="px-4 py-4 text-[13px] t-muted">{row.sort_order}</td>
                      <td className="px-4 py-4 text-right">
                        <button onClick={() => handleEditFaq(row)} className="inline-flex items-center gap-1 mr-2 px-3.5 py-[7px] bg-slate-100 border-0 rounded-[10px] cursor-pointer text-[13px] font-semibold text-slate-600 hover:bg-slate-200 transition-colors">
                          <Edit3 size={14} /> Edit
                        </button>
                        <button onClick={() => handleDeleteFaq(row.id)} className="inline-flex items-center gap-1 px-3.5 py-[7px] bg-red-50 text-red-500 border-0 rounded-[10px] cursor-pointer text-[13px] font-semibold hover:bg-red-100 transition-colors">
                          <Trash2 size={14} /> Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </AdminPageTemplate>

      {selectedTicket && (
        <div className="fixed top-0 right-0 w-[440px] h-[100dvh] bg-white shadow-[-10px_0_40px_rgba(0,0,0,0.1)] z-[1000] flex flex-col">
          <div className="px-6 py-6 border-b border-slate-100 bg-white">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-[12px] font-semibold t-muted mb-1">ID: #{selectedTicket.id.split('-')[0].toUpperCase()}</div>
                <h2 className="text-[20px] font-bold t-primary m-0">{selectedTicket.subject}</h2>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="bg-transparent border-0 cursor-pointer text-[24px] text-slate-400">✕</button>
            </div>
            <div className="px-4 py-4 bg-slate-50 rounded-[12px] mt-4">
              <div className="text-[12px] font-semibold t-muted mb-1 uppercase">Issue Description</div>
              <div className="text-[14px] t-primary leading-[22px]">{selectedTicket.description}</div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-4 bg-slate-50">
            {msgError && <div className="bg-red-50 border border-red-200 rounded-[8px] px-3.5 py-2.5 text-[13px] font-medium text-red-600">{msgError}</div>}
            {messages.length === 0 && !msgError && (
              <div className="text-center text-[13px] t-muted mt-10">No messages yet. Send a reply to start the conversation.</div>
            )}
            {messages.map(m => {
              const isAdmin = m.sender_role === 'admin'
              return (
                <div key={m.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] px-4 py-3 shadow-[0_2px_4px_rgba(0,0,0,0.02)] ${isAdmin ? 'bg-brand rounded-[16px_16px_4px_16px]' : 'bg-white border border-slate-200 rounded-[16px_16px_16px_4px]'}`}>
                    {!isAdmin && <div className="text-[11px] font-bold t-muted mb-1">{m.sender_name} <span className="font-normal opacity-70">({m.sender_role})</span></div>}
                    <div className={`text-[14px] leading-5 ${isAdmin ? 'text-white' : 't-primary'}`}>{m.message}</div>
                    <div className={`text-[10px] mt-1.5 text-right ${isAdmin ? 'text-white/70' : 'text-slate-400'}`}>{new Date(m.created_at).toLocaleTimeString()}</div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="px-6 py-5 bg-white border-t border-slate-200">
            <textarea value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Type your official reply..." rows={3}
              className="w-full px-4 py-3 rounded-[12px] border border-slate-200 text-[14px] t-primary outline-none resize-none mb-3 box-border focus:border-brand transition-colors" />
            {sendError && <div className="mb-2 bg-red-50 border border-red-200 rounded-[8px] px-3 py-2 text-[12px] font-medium text-red-600">{sendError}</div>}
            <div className="flex justify-between items-center">
              <div className="text-[12px] font-medium t-muted">Pressing send will notify the user.</div>
              <button onClick={handleSendAdminReply} disabled={!chatInput.trim()}
                className={`px-6 py-2.5 rounded-[10px] border-0 font-bold text-[13px] transition-colors ${chatInput.trim() ? 'bg-brand text-white cursor-pointer' : 'bg-slate-200 text-slate-400 cursor-default'}`}>
                Send Reply
              </button>
            </div>
          </div>
        </div>
      )}

      <Modal isOpen={faqModalOpen} onClose={() => !faqSubmitting && setFaqModalOpen(false)} title={faqForm.id ? 'Edit FAQ' : 'Add FAQ'}>
        <form onSubmit={handleSaveFaq} className="flex flex-col gap-4 py-2.5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Category</label>
              <select value={faqForm.category} onChange={e => setFaqForm({ ...faqForm, category: e.target.value })} className={fieldCls}>
                <option>General</option>
                <option>Student</option>
                <option>Faculty</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Sort Order (Priority)</label>
              <input type="number" value={faqForm.sort_order} onChange={e => setFaqForm({ ...faqForm, sort_order: parseInt(e.target.value) || 0 })} className={fieldCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Question</label>
            <input required type="text" placeholder="Enter a descriptive question..." value={faqForm.question} onChange={e => setFaqForm({ ...faqForm, question: e.target.value })} className={fieldCls} />
          </div>
          <div>
            <label className={labelCls}>Answer</label>
            <textarea required placeholder="Provide a detailed answer or explanation..." value={faqForm.answer} onChange={e => setFaqForm({ ...faqForm, answer: e.target.value })}
              className={`${fieldCls} min-h-[120px] resize-y`} />
          </div>
          <div className="mt-3 flex justify-end gap-3">
            <button type="button" onClick={() => setFaqModalOpen(false)} disabled={faqSubmitting}
              className="px-6 py-3 rounded-[12px] border-[1.5px] border-slate-200 bg-white cursor-pointer font-bold text-[14px] t-muted">Cancel</button>
            <button type="submit" disabled={faqSubmitting}
              className="px-6 py-3 rounded-[12px] border-0 bg-brand text-white cursor-pointer font-bold text-[14px] shadow-[0_4px_12px_rgba(79,70,229,0.25)]">
              {faqSubmitting ? 'Saving...' : (faqForm.id ? 'Save Changes' : 'Publish FAQ')}
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}
