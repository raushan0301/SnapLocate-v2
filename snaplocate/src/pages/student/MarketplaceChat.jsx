import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import { ArrowLeft, Send, MessageCircle, Archive, Package, Loader } from 'lucide-react'

const FONT = "'Plus Jakarta Sans', 'Inter', sans-serif"

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
    <div style={{ padding: '48px 20px', textAlign: 'center' }}>
      <MessageCircle size={36} color="#e2e8f0" style={{ marginBottom: 12 }} />
      <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: 15, color: '#0f172a', margin: '0 0 6px' }}>No chats yet</p>
      <p style={{ fontFamily: FONT, fontSize: 13, color: '#94a3b8', margin: 0 }}>Open a listing and tap "Chat with Seller".</p>
    </div>
  )

  return (
    <div style={{ overflowY: 'auto', flex: 1 }}>
      {chats.map(chat => {
        const isActive = chat.id === activeId
        const listing  = chat.listing

        return (
          <button key={chat.id} onClick={() => onSelect(chat)} style={{
            width: '100%', textAlign: 'left',
            background: isActive ? 'linear-gradient(90deg, #eef2ff, #f5f3ff)' : 'transparent',
            borderLeft: `3px solid ${isActive ? '#6366f1' : 'transparent'}`,
            border: 'none',
            borderBottom: '1px solid #f1f5f9',
            padding: '14px 18px', cursor: 'pointer',
            display: 'flex', gap: 12, alignItems: 'center',
            transition: 'background 0.15s',
          }}>
            {/* Listing thumbnail */}
            <div style={{ width: 46, height: 46, borderRadius: 12, overflow: 'hidden', background: '#f8fafc', flexShrink: 0, border: '1.5px solid #f1f5f9' }}>
              {listing?.images?.[0]
                ? <img src={listing.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Package size={18} color="#cbd5e1" /></div>
              }
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 4 }}>
                <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: 13, color: isActive ? '#6366f1' : '#0f172a', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140 }}>
                  {listing?.title || 'Listing'}
                </p>
                <span style={{ fontFamily: FONT, fontSize: 11, color: '#94a3b8', flexShrink: 0 }}>
                  {timeAgo(chat.last_message_at)}
                </span>
              </div>
              <p style={{ fontFamily: FONT, fontSize: 12, fontWeight: 700, color: '#10b981', margin: '3px 0 0' }}>
                {formatPrice(listing?.price)}
              </p>
            </div>

            {/* Unread badge */}
            {chat.unread_count > 0 && (
              <div style={{ minWidth: 20, height: 20, borderRadius: 10, background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, padding: '0 5px' }}>
                <span style={{ fontFamily: FONT, fontSize: 10, fontWeight: 800, color: '#fff' }}>{chat.unread_count}</span>
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}

// ─── Chat Thread Panel ────────────────────────────────────────
function ChatThread({ chat, currentUserId, onMarkRead }) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading]   = useState(true)
  const [input, setInput]       = useState('')
  const [sending, setSending]   = useState(false)
  const bottomRef = useRef(null)
  const pollingRef = useRef(null)
  const inputRef = useRef(null)

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
  const other = currentUserId === chat.buyer_id ? chat.seller : chat.buyer

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {/* Thread header */}
      <div style={{
        padding: '14px 20px', borderBottom: '1px solid #f1f5f9',
        display: 'flex', alignItems: 'center', gap: 14,
        background: '#fff', flexShrink: 0,
      }}>
        <div style={{ width: 42, height: 42, borderRadius: 11, overflow: 'hidden', background: '#f8fafc', flexShrink: 0, border: '1.5px solid #f1f5f9' }}>
          {listing?.images?.[0]
            ? <img src={listing.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <Package size={18} color="#cbd5e1" style={{ margin: '12px' }} />
          }
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: 14, color: '#0f172a', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {listing?.title}
          </p>
          <div style={{ display: 'flex', gap: 8, marginTop: 2, alignItems: 'center' }}>
            <span style={{ fontFamily: FONT, fontSize: 12, fontWeight: 800, color: '#6366f1' }}>{formatPrice(listing?.price)}</span>
            <span style={{ fontFamily: FONT, fontSize: 12, color: '#94a3b8' }}>with {other?.full_name || '...'}</span>
            {chat.is_archived && (
              <span style={{ fontFamily: FONT, fontSize: 10, fontWeight: 700, background: '#fef3c7', color: '#d97706', padding: '2px 8px', borderRadius: 10 }}>Archived</span>
            )}
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '20px',
        display: 'flex', flexDirection: 'column', gap: 8,
        background: '#fafaff',
      }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
            <Loader size={22} color="#6366f1" style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>👋</div>
            <p style={{ fontFamily: FONT, fontSize: 14, color: '#94a3b8', margin: 0 }}>No messages yet. Say hello!</p>
          </div>
        ) : (
          messages.map(msg => {
            const isMe = msg.sender_id === currentUserId
            return (
              <div key={msg.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '68%', padding: '10px 14px',
                  borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  background: isMe ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : '#fff',
                  boxShadow: isMe ? '0 2px 10px rgba(99,102,241,0.22)' : '0 1px 6px rgba(0,0,0,0.06)',
                  border: isMe ? 'none' : '1px solid #f1f5f9',
                }}>
                  <p style={{ margin: 0, fontFamily: FONT, fontSize: 14, color: isMe ? '#fff' : '#0f172a', lineHeight: 1.5, wordBreak: 'break-word' }}>
                    {msg.content}
                  </p>
                  <p style={{ margin: '3px 0 0', fontFamily: FONT, fontSize: 10, color: isMe ? 'rgba(255,255,255,0.6)' : '#94a3b8', textAlign: 'right' }}>
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
        <div style={{ padding: '14px 20px', background: '#fffbeb', borderTop: '1px solid #fef3c7', textAlign: 'center', flexShrink: 0 }}>
          <p style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: '#d97706', margin: 0 }}>
            🔒 Listing sold — this chat is archived.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSend} style={{
          padding: '12px 16px', borderTop: '1px solid #f1f5f9',
          display: 'flex', gap: 10, background: '#fff', flexShrink: 0, alignItems: 'center',
        }}>
          <input
            ref={inputRef}
            value={input} onChange={e => setInput(e.target.value)}
            placeholder="Type a message…"
            style={{
              flex: 1, padding: '11px 16px', borderRadius: 24, border: '1.5px solid #e2e8f0',
              outline: 'none', fontFamily: FONT, fontSize: 14, color: '#0f172a',
              background: '#f8fafc', transition: 'border-color 0.15s',
            }}
            onFocus={e => e.target.style.borderColor = '#6366f1'}
            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
          />
          <button type="submit" disabled={!input.trim() || sending} style={{
            width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
            background: input.trim() ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : '#e2e8f0',
            border: 'none', cursor: input.trim() ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: input.trim() ? '0 4px 12px rgba(99,102,241,0.3)' : 'none',
            transition: 'all 0.18s',
          }}>
            {sending
              ? <Loader size={16} color="#fff" style={{ animation: 'spin 1s linear infinite' }} />
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

  const [chats, setChats]           = useState([])
  const [loading, setLoading]       = useState(true)
  const [activeChat, setActiveChat] = useState(null)
  const [showArchived, setShowArchived] = useState(false)

  const loadChats = useCallback(async () => {
    try {
      const res = await api.get(`/api/marketplace-chat/chats?archived=${showArchived}`)
      const data = res.data || []
      setChats(data)

      if (location.state?.chatId && !activeChat) {
        const target = data.find(c => c.id === location.state.chatId)
        if (target) setActiveChat(target)
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

  const totalUnread = chats.reduce((acc, c) => acc + (c.unread_count || 0), 0)

  return (
    <PageLayout>
      <style>{`
        .mc-input { font-family: 'Plus Jakarta Sans', sans-serif; }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>

      <div style={{ width: '100%', maxWidth: '100%', padding: '0 24px', fontFamily: FONT, boxSizing: 'border-box' }}>

        {/* Back + Title row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button onClick={() => navigate('/marketplace')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', fontFamily: FONT, fontWeight: 600, fontSize: 14, color: '#6366f1', padding: 0 }}>
              <ArrowLeft size={16} /> Back
            </button>
            <div>
              <h1 style={{ fontFamily: FONT, fontWeight: 800, fontSize: 22, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                My Chats
                {totalUnread > 0 && (
                  <span style={{ background: '#6366f1', color: '#fff', borderRadius: 20, padding: '1px 10px', fontSize: 13, fontWeight: 800 }}>{totalUnread}</span>
                )}
              </h1>
              <p style={{ fontFamily: FONT, fontSize: 13, color: '#94a3b8', margin: '2px 0 0' }}>
                Marketplace messages · {chats.length} {showArchived ? 'archived' : 'active'}
              </p>
            </div>
          </div>
          <button onClick={() => setShowArchived(a => !a)} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
            borderRadius: 12, border: '1.5px solid #e2e8f0',
            background: showArchived ? '#eef2ff' : '#fff',
            color: showArchived ? '#6366f1' : '#475569',
            fontFamily: FONT, fontWeight: 600, fontSize: 13, cursor: 'pointer',
          }}>
            <Archive size={14} /> {showArchived ? 'Hide Archived' : 'Archived'}
          </button>
        </div>

        {/* Two-panel layout — fills viewport height sensibly */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '310px 1fr',
          height: 'calc(100vh - 220px)',
          minHeight: 500,
          maxHeight: 720,
          background: '#fff',
          borderRadius: 24,
          overflow: 'hidden',
          boxShadow: '0 4px 28px rgba(0,0,0,0.08)',
          border: '1px solid #e2e8f0',
        }}>
          {/* ── Left: Inbox ── */}
          <div style={{ borderRight: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#fdfdff' }}>
            <div style={{ padding: '16px 18px', borderBottom: '1px solid #f1f5f9', flexShrink: 0 }}>
              <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: 12, color: '#94a3b8', margin: 0, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                {showArchived ? '🗄 Archived' : '✉️ Active'} ({chats.length})
              </p>
            </div>
            {loading ? (
              <div style={{ padding: '16px' }}>
                {[1, 2, 3, 4].map(i => (
                  <div key={i} style={{ height: 60, background: '#f1f5f9', borderRadius: 12, marginBottom: 10, animation: 'pulse 1.5s infinite' }} />
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

          {/* ── Right: Thread ── */}
          <div style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {activeChat ? (
              <ChatThread
                key={activeChat.id}
                chat={activeChat}
                currentUserId={user?.id}
                onMarkRead={handleMarkRead}
              />
            ) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, background: '#fafaff' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
                  <MessageCircle size={30} color="#6366f1" />
                </div>
                <h3 style={{ fontFamily: FONT, fontWeight: 700, fontSize: 18, color: '#0f172a', margin: 0 }}>Select a conversation</h3>
                <p style={{ fontFamily: FONT, fontSize: 14, color: '#94a3b8', margin: 0, textAlign: 'center', maxWidth: 260 }}>
                  Pick a chat from the left to start messaging
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
