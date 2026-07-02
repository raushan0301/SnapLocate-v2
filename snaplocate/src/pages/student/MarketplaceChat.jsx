import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import { ArrowLeft, Send, MessageCircle, Archive, Package, Loader } from 'lucide-react'

function timeAgo(d) {
  if (!d) return ''
  const diff = (Date.now() - new Date(d)) / 1000
  if (diff < 60)    return 'just now'
  if (diff < 3600)  return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

function formatPrice(p) {
  if (p === null || p === undefined || p === 0) return 'Free'
  return `₹${Number(p).toLocaleString('en-IN')}`
}

// ─── Chat Inbox Panel ─────────────────────────────────────────
function ChatInbox({ chats, activeId, onSelect }) {
  if (chats.length === 0) return (
    <div className="py-12 px-5 text-center">
      <MessageCircle size={36} className="text-slate-200 mx-auto mb-3" />
      <p className="t-base font-bold t-primary m-0 mb-1.5">No chats yet</p>
      <p className="t-md t-subtle m-0">Open a listing and tap "Chat with Seller".</p>
    </div>
  )

  return (
    <div className="overflow-y-auto flex-1">
      {chats.map(chat => {
        const isActive = chat.id === activeId
        const listing  = chat.listing
        return (
          <button key={chat.id} onClick={() => onSelect(chat)}
            className={`w-full text-left px-4 py-3.5 flex gap-3 items-center border-b border-slate-100 cursor-pointer transition-colors ${isActive ? 'bg-gradient-to-r from-indigo-50 to-violet-50 border-l-[3px] border-l-indigo-500' : 'bg-transparent border-l-[3px] border-l-transparent hover:bg-surface'}`}>
            <div className="w-11 h-11 rounded-xl overflow-hidden bg-surface shrink-0 border-[1.5px] border-slate-100">
              {listing?.images?.[0]
                ? <img src={listing.images[0]} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center"><Package size={18} className="text-slate-300" /></div>
              }
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start gap-1">
                <p className={`text-[13px] font-bold m-0 truncate max-w-[140px] ${isActive ? 'text-indigo-500' : 't-primary'}`}>
                  {listing?.title || 'Listing'}
                </p>
                <span className="text-[11px] t-subtle shrink-0">{timeAgo(chat.last_message_at)}</span>
              </div>
              <p className="text-[12px] font-bold text-emerald-500 m-0 mt-0.5">{formatPrice(listing?.price)}</p>
            </div>
            {chat.unread_count > 0 && (
              <div className="min-w-[20px] h-5 rounded-full bg-indigo-500 flex items-center justify-center shrink-0 px-1.5">
                <span className="text-[10px] font-extrabold text-white">{chat.unread_count}</span>
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}

// ─── Chat Thread Panel ────────────────────────────────────────
function ChatThread({ chat, currentUserId, onMarkRead, onToggleArchive }) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading]   = useState(true)
  const [input, setInput]       = useState('')
  const [sending, setSending]   = useState(false)
  const bottomRef  = useRef(null)
  const pollingRef = useRef(null)
  const inputRef   = useRef(null)

  const loadMessages = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const res = await api.get(`/api/marketplace-chat/chats/${chat.id}/messages?limit=80`)
      setMessages(res.data || [])
      onMarkRead?.(chat.id)
    } catch (err) { console.error(err) }
    finally { if (!silent) setLoading(false) }
  }, [chat.id])

  useEffect(() => {
    loadMessages()
    pollingRef.current = setInterval(() => loadMessages(true), 3000)
    return () => clearInterval(pollingRef.current)
  }, [loadMessages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!input.trim() || sending || chat.is_archived) return
    const text = input.trim()
    setInput('')
    setSending(true)
    const temp = { id: `temp-${Date.now()}`, sender_id: currentUserId, content: text, created_at: new Date().toISOString() }
    setMessages(p => [...p, temp])
    try {
      const res = await api.post(`/api/marketplace-chat/chats/${chat.id}/messages`, { content: text })
      setMessages(p => p.map(m => m.id === temp.id ? res.data : m))
    } catch {
      setMessages(p => p.filter(m => m.id !== temp.id))
      setInput(text)
      alert('Failed to send message')
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  const listing = chat.listing
  const other   = currentUserId === chat.buyer_id ? chat.seller : chat.buyer

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Thread header */}
      <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-3.5 bg-white shrink-0">
        <div className="w-[42px] h-[42px] rounded-[11px] overflow-hidden bg-surface shrink-0 border-[1.5px] border-slate-100 flex items-center justify-center">
          {listing?.images?.[0]
            ? <img src={listing.images[0]} alt="" className="w-full h-full object-cover" />
            : <Package size={18} className="text-slate-300" />
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="t-base font-bold t-primary m-0 truncate">{listing?.title}</p>
          <div className="flex gap-2 mt-0.5 items-center flex-wrap">
            <span className="text-[12px] font-extrabold text-indigo-500">{formatPrice(listing?.price)}</span>
            <span className="text-[12px] t-subtle">with {other?.full_name || '…'}</span>
            {chat.is_archived && (
              <span className="text-[10px] font-bold bg-warning-light text-warning px-2 py-0.5 rounded-full">Archived</span>
            )}
            <button
              onClick={() => onToggleArchive?.(chat.id, !chat.is_archived)}
              className="flex items-center gap-1 ml-auto px-2 py-0.5 rounded-md border border-slate-200 bg-transparent text-[10px] font-bold t-secondary cursor-pointer hover:bg-surface transition-colors">
              <Archive size={10} /> {chat.is_archived ? 'Unarchive' : 'Archive'}
            </button>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-2 bg-[#fafaff]">
        {loading ? (
          <div className="flex justify-center pt-16">
            <Loader size={22} className="text-indigo-500 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-16 px-5">
            <div className="text-4xl mb-3">👋</div>
            <p className="t-base t-subtle m-0">No messages yet. Say hello!</p>
          </div>
        ) : (
          messages.map(msg => {
            const isMe = msg.sender_id === currentUserId
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[68%] px-3.5 py-2.5 ${isMe ? 'rounded-[18px_18px_4px_18px] bg-gradient-to-br from-indigo-500 to-violet-500 shadow-[0_2px_10px_rgba(99,102,241,0.22)]' : 'rounded-[18px_18px_18px_4px] bg-white border border-slate-100 shadow-[0_1px_6px_rgba(0,0,0,0.06)]'}`}>
                  <p className={`m-0 text-[14px] leading-[1.5] break-words ${isMe ? 'text-white' : 't-primary'}`}>{msg.content}</p>
                  <p className={`m-0 mt-0.5 text-[10px] text-right ${isMe ? 'text-white/60' : 't-subtle'}`}>
                    {new Date(msg.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      {chat.is_archived ? (
        <div className="px-5 py-3.5 bg-warning-light border-t border-[#fef3c7] text-center shrink-0">
          <p className="t-md font-semibold text-warning m-0">🗄️ This chat is archived and read-only.</p>
        </div>
      ) : (
        <form onSubmit={handleSend} className="px-4 py-3 border-t border-slate-100 flex gap-2.5 bg-white shrink-0 items-center">
          <input
            ref={inputRef}
            value={input} onChange={e => setInput(e.target.value)}
            placeholder="Type a message…"
            className="flex-1 px-4 py-2.5 rounded-full border-[1.5px] border-slate-200 outline-none t-base t-primary bg-surface focus:border-indigo-400 transition-colors"
          />
          <button type="submit" disabled={!input.trim() || sending}
            className={`w-11 h-11 rounded-full shrink-0 border-none flex items-center justify-center transition-all duration-200 ${input.trim() ? 'bg-gradient-to-br from-indigo-500 to-violet-500 shadow-[0_4px_12px_rgba(99,102,241,0.3)] cursor-pointer' : 'bg-slate-200 cursor-not-allowed'}`}>
            {sending
              ? <Loader size={16} color="#fff" className="animate-spin" />
              : <Send size={16} color={input.trim() ? '#fff' : '#94a3b8'} />
            }
          </button>
        </form>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────
export default function MarketplaceChat() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()

  const [chats, setChats]               = useState([])
  const [loading, setLoading]           = useState(true)
  const [activeChat, setActiveChat]     = useState(null)
  const [showArchived, setShowArchived] = useState(false)
  const [mobileView, setMobileView]     = useState('inbox') // 'inbox' | 'thread'

  const loadChats = useCallback(async () => {
    try {
      const res  = await api.get(`/api/marketplace-chat/chats?archived=${showArchived}`)
      const data = res.data || []
      setChats(data)
      if (location.state?.chatId && !activeChat) {
        const target = data.find(c => c.id === location.state.chatId)
        if (target) { setActiveChat(target); setMobileView('thread') }
      } else if (!activeChat && data.length > 0) {
        setActiveChat(data[0])
      }
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }, [showArchived])

  useEffect(() => { loadChats() }, [loadChats])

  const handleMarkRead = (chatId) => {
    setChats(p => p.map(c => c.id === chatId ? { ...c, unread_count: 0 } : c))
    api.patch(`/api/marketplace-chat/chats/${chatId}/read`).catch(() => {})
  }

  const handleToggleArchive = async (chatId, is_archived) => {
    try {
      await api.patch(`/api/marketplace-chat/chats/${chatId}/archive`, { is_archived })
      setChats(p => p.filter(c => c.id !== chatId))
      if (activeChat?.id === chatId) { setActiveChat(null); setMobileView('inbox') }
    } catch (err) { console.error(err) }
  }

  const handleSelectChat = (c) => {
    setActiveChat(c)
    handleMarkRead(c.id)
    setMobileView('thread')
  }

  const totalUnread = chats.reduce((acc, c) => acc + (c.unread_count || 0), 0)

  return (
    <PageLayout>
      {/* Header — shown only on inbox view (mobile) or always on desktop */}
      <div className={`${mobileView === 'thread' ? 'hidden lg:flex' : 'flex'} justify-between items-center mb-4 sm:mb-6 flex-wrap gap-3`}>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/marketplace')}
            className="flex items-center gap-1.5 bg-transparent border-none cursor-pointer text-[14px] font-semibold text-indigo-500 p-0">
            <ArrowLeft size={16} /> Back
          </button>
          <div>
            <h1 className="t-heading-xl t-primary m-0 flex items-center gap-2.5">
              My Chats
              {totalUnread > 0 && (
                <span className="bg-indigo-500 text-white rounded-full px-2.5 py-0.5 text-[13px] font-extrabold">{totalUnread}</span>
              )}
            </h1>
            <p className="t-md t-subtle m-0 mt-0.5">
              Marketplace messages · {chats.length} {showArchived ? 'archived' : 'active'}
            </p>
          </div>
        </div>
        <button onClick={() => setShowArchived(a => !a)}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border-[1.5px] border-slate-200 text-[13px] font-semibold cursor-pointer transition-colors ${showArchived ? 'bg-indigo-50 text-indigo-500' : 'bg-white t-secondary hover:bg-surface'}`}>
          <Archive size={14} /> {showArchived ? 'Hide Archived' : 'Archived'}
        </button>
      </div>

      {/* ── Mobile: single panel at a time ── */}
      <div className="lg:hidden bg-white rounded-3xl overflow-hidden shadow-[0_4px_28px_rgba(0,0,0,0.08)] border border-slate-200"
        style={{ height: 'calc(100dvh - 180px)' }}>

        {mobileView === 'inbox' ? (
          <div className="flex flex-col h-full">
            <div className="px-4 py-3.5 border-b border-slate-100 shrink-0">
              <p className="text-[12px] font-bold t-subtle m-0 uppercase tracking-[0.8px]">
                {showArchived ? '🗄 Archived' : '✉️ Active'} ({chats.length})
              </p>
            </div>
            {loading ? (
              <div className="p-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-14 bg-slate-100 rounded-xl mb-2.5 animate-pulse" />
                ))}
              </div>
            ) : (
              <ChatInbox chats={chats} activeId={activeChat?.id} onSelect={handleSelectChat} />
            )}
          </div>
        ) : (
          <div className="flex flex-col h-full">
            {/* Mobile thread: back button bar */}
            <div className="px-4 py-3 border-b border-slate-100 shrink-0 flex items-center gap-3 bg-white">
              <button onClick={() => setMobileView('inbox')}
                className="flex items-center gap-1.5 bg-transparent border-none cursor-pointer text-[13px] font-semibold text-indigo-500 p-0">
                <ArrowLeft size={15} /> Inbox
              </button>
            </div>
            {activeChat && (
              <ChatThread
                key={activeChat.id}
                chat={activeChat}
                currentUserId={user?.id}
                onMarkRead={handleMarkRead}
                onToggleArchive={handleToggleArchive}
              />
            )}
          </div>
        )}
      </div>

      {/* ── Desktop: two-panel ── */}
      <div className="hidden lg:grid bg-white rounded-3xl overflow-hidden shadow-[0_4px_28px_rgba(0,0,0,0.08)] border border-slate-200 min-h-[500px] max-h-[720px]"
        style={{ gridTemplateColumns: '310px 1fr', height: 'calc(100dvh - 220px)' }}>

        {/* Left: Inbox */}
        <div className="border-r border-slate-100 flex flex-col overflow-hidden bg-[#fdfdff]">
          <div className="px-4.5 py-4 border-b border-slate-100 shrink-0">
            <p className="text-[12px] font-bold t-subtle m-0 uppercase tracking-[0.8px]">
              {showArchived ? '🗄 Archived' : '✉️ Active'} ({chats.length})
            </p>
          </div>
          {loading ? (
            <div className="p-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-14 bg-slate-100 rounded-xl mb-2.5 animate-pulse" />
              ))}
            </div>
          ) : (
            <ChatInbox
              chats={chats}
              activeId={activeChat?.id}
              onSelect={c => { setActiveChat(c); handleMarkRead(c.id) }}
            />
          )}
        </div>

        {/* Right: Thread */}
        <div className="overflow-hidden flex flex-col">
          {activeChat ? (
            <ChatThread
              key={activeChat.id}
              chat={activeChat}
              currentUserId={user?.id}
              onMarkRead={handleMarkRead}
              onToggleArchive={handleToggleArchive}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-2.5 bg-[#fafaff]">
              <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center mb-1">
                <MessageCircle size={30} className="text-indigo-500" />
              </div>
              <h3 className="t-heading-lg t-primary m-0">Select a conversation</h3>
              <p className="t-base t-subtle m-0 text-center max-w-[260px]">
                Pick a chat from the left to start messaging
              </p>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  )
}
