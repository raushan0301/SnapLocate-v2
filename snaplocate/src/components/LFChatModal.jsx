/**
 * LFChatModal — Real-time chat for Lost & Found items
 * Uses Supabase realtime for live message delivery.
 *
 * Props:
 *   item          — the lost_found item object
 *   otherUser     — { id, full_name, avatar_url } the person to chat with
 *   currentUser   — req.user equivalent from AuthContext
 *   onClose       — fn to close the modal
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { X, Send, MessageCircle, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import api from '../lib/api'

// Category config for item header colour
const CAT_BG = {
  electronics: '#eef2ff', keys: '#fffbeb', id_card: '#eff6ff', clothing: '#fdf2f8',
  books: '#f0fdf4', bag: '#fff7ed', wallet: '#fefce8', jewellery: '#faf5ff',
  sports: '#f0fdfa', other: '#f8fafc',
}
const CAT_EMOJI = {
  electronics: '💻', keys: '🔑', id_card: '🪪', clothing: '👕', books: '📚',
  bag: '🎒', wallet: '👛', jewellery: '💍', sports: '⚽', other: '📦',
}

function Avatar({ name, url, size = 32, style: extra = {} }) {
  const initials = (name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  if (url) return <img src={url} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, ...extra }} />
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: '#e0e7ff', color: '#4f46e5', fontSize: size * 0.36, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, ...extra }}>
      {initials}
    </div>
  )
}

function formatTime(iso) {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now - d
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffMins < 1440) return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

// Group messages by date for date separators
function groupByDate(messages) {
  const groups = []
  let lastDate = null
  messages.forEach(msg => {
    const d = new Date(msg.created_at).toDateString()
    if (d !== lastDate) {
      groups.push({ type: 'date', date: d, id: `date-${d}` })
      lastDate = d
    }
    groups.push({ type: 'msg', ...msg })
  })
  return groups
}

export default function LFChatModal({ item, otherUser, currentUser, onClose, embedded = false, onNewMessage, onConvReady }) {
  const [conv,     setConv]     = useState(null)
  const [messages, setMessages] = useState([])
  const [input,    setInput]    = useState('')
  const [loading,  setLoading]  = useState(true)
  const [sending,  setSending]  = useState(false)
  const [error,    setError]    = useState(null)

  const bottomRef  = useRef(null)
  const inputRef   = useRef(null)
  const channelRef = useRef(null)

  const scrollToBottom = (smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'instant' })
  }

  // ── Init: create/get conversation, load messages ─────────
  const init = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Start or get conversation
      const convRes = await api.post('/api/lf-chat/conversations', {
        item_id: item.id,
        other_user_id: otherUser.id,
      })
      if (!convRes.success) { setError(convRes.error || 'Could not start chat'); setLoading(false); return }
      setConv(convRes.data)
      if (onConvReady) onConvReady(convRes.data.id)

      // Load messages
      const msgRes = await api.get(`/api/lf-chat/conversations/${convRes.data.id}/messages?limit=50`)
      if (msgRes.success) setMessages(msgRes.data || [])
    } catch {
      setError('Failed to load chat')
    } finally {
      setLoading(false)
    }
  }, [item.id, otherUser.id])

  useEffect(() => { init() }, [init])

  // ── Supabase realtime subscription ───────────────────────
  useEffect(() => {
    if (!conv) return

    // Clean up previous channel
    if (channelRef.current) supabase.removeChannel(channelRef.current)

    const channel = supabase
      .channel(`lf-chat-${conv.id}`)
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'lf_messages',
          filter: `conversation_id=eq.${conv.id}`,
        },
        async (payload) => {
          const newMsg = payload.new
          // Fetch sender info (realtime payload doesn't include joins)
          const { data: sender } = await supabase
            .from('users')
            .select('id, full_name, avatar_url, role')
            .eq('id', newMsg.sender_id)
            .single()

          const enriched = { ...newMsg, sender: sender || { id: newMsg.sender_id, full_name: 'Unknown' } }

          setMessages(prev => {
            // Avoid duplicates (our own optimistic message)
            if (prev.find(m => m.id === enriched.id)) return prev
            return [...prev, enriched]
          })

          // Notify parent (embedded mode) about incoming message
          if (newMsg.sender_id !== currentUser.id) {
            if (embedded && onNewMessage) {
              onNewMessage()
            } else {
              api.patch(`/api/lf-chat/conversations/${conv.id}/read`)
            }
          }
        }
      )
      .subscribe()

    channelRef.current = channel
    return () => { supabase.removeChannel(channel) }
  }, [conv, currentUser.id])

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Focus input on open
  useEffect(() => {
    if (!loading) setTimeout(() => inputRef.current?.focus(), 100)
  }, [loading])

  // ── Send message ─────────────────────────────────────────
  const handleSend = async () => {
    const text = input.trim()
    if (!text || !conv || sending) return

    setSending(true)
    setInput('')

    // Optimistic UI
    const tempMsg = {
      id: `temp-${Date.now()}`,
      conversation_id: conv.id,
      sender_id: currentUser.id,
      content: text,
      is_read: false,
      created_at: new Date().toISOString(),
      sender: currentUser,
      _optimistic: true,
    }
    setMessages(prev => [...prev, tempMsg])

    try {
      const res = await api.post(`/api/lf-chat/conversations/${conv.id}/messages`, { content: text })
      if (res.success) {
        // Replace optimistic with real message
        setMessages(prev => prev.map(m => m.id === tempMsg.id ? { ...res.data, sender: currentUser } : m))
      } else {
        // Roll back optimistic
        setMessages(prev => prev.filter(m => m.id !== tempMsg.id))
        setInput(text)
      }
    } catch {
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id))
      setInput(text)
    } finally {
      setSending(false)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  // ── Render ────────────────────────────────────────────────
  const catEmoji = CAT_EMOJI[item.category] || '📦'
  const catBg    = CAT_BG[item.category]    || '#f8fafc'
  const grouped  = groupByDate(messages)

  if (embedded) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        {/* ── Partner header (slim, no item info — already shown in parent) ── */}
        <div style={{ background: CAT_BG[item.category] || '#f8fafc', borderBottom: '1px solid rgba(0,0,0,0.06)', padding: '12px 18px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar name={otherUser?.full_name} url={otherUser?.avatar_url} size={32} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{otherUser?.full_name}</div>
            <div style={{ fontSize: 11, color: '#64748b', textTransform: 'capitalize' }}>{otherUser?.role || 'student'}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(79,70,229,0.1)', borderRadius: 8, padding: '4px 10px' }}>
            <MessageCircle size={12} color="#4f46e5" />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#4f46e5' }}>Live chat</span>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {loading ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', flexDirection: 'column', gap: 10 }}>
              <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', opacity: 0.5 }} />
              <span style={{ fontSize: 13 }}>Loading messages...</span>
            </div>
          ) : error ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', fontSize: 13, textAlign: 'center', padding: 24 }}>{error}</div>
          ) : messages.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8, color: '#94a3b8' }}>
              <MessageCircle size={32} style={{ opacity: 0.25 }} />
              <span style={{ fontSize: 13, fontWeight: 600 }}>No messages yet</span>
              <span style={{ fontSize: 12, textAlign: 'center', maxWidth: 220 }}>Start the conversation about <strong style={{ color: '#475569' }}>{item.title}</strong></span>
            </div>
          ) : (
            groupByDate(messages).map(entry => {
              if (entry.type === 'date') {
                const label = entry.date === new Date().toDateString() ? 'Today' : entry.date === new Date(Date.now() - 86400000).toDateString() ? 'Yesterday' : new Date(entry.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                return (
                  <div key={entry.id} style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '8px 0' }}>
                    <div style={{ flex: 1, height: 1, background: '#f1f5f9' }} />
                    <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, whiteSpace: 'nowrap' }}>{label}</span>
                    <div style={{ flex: 1, height: 1, background: '#f1f5f9' }} />
                  </div>
                )
              }
              const isMe = entry.sender_id === currentUser.id
              const isOptimistic = entry._optimistic
              return (
                <div key={entry.id} style={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', gap: 8, alignItems: 'flex-end', marginBottom: 4 }}>
                  {!isMe && <Avatar name={entry.sender?.full_name} url={entry.sender?.avatar_url} size={26} style={{ marginBottom: 2 }} />}
                  <div style={{ maxWidth: '72%', display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', gap: 3 }}>
                    <div style={{ padding: '9px 13px', borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px', background: isMe ? '#4f46e5' : '#f1f5f9', color: isMe ? '#fff' : '#1e293b', fontSize: 13.5, lineHeight: '1.5', opacity: isOptimistic ? 0.7 : 1, wordBreak: 'break-word', boxShadow: isMe ? '0 2px 8px rgba(79,70,229,0.2)' : 'none' }}>
                      {entry.content}
                    </div>
                    <div style={{ fontSize: 10, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
                      {formatTime(entry.created_at)}
                      {isMe && !isOptimistic && <span style={{ color: entry.is_read ? '#4f46e5' : '#94a3b8' }}>{entry.is_read ? '✓✓' : '✓'}</span>}
                      {isOptimistic && <span style={{ color: '#94a3b8' }}>sending…</span>}
                    </div>
                  </div>
                </div>
              )
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        <div style={{ borderTop: '1px solid #f1f5f9', padding: '12px 14px', flexShrink: 0, display: 'flex', gap: 10, alignItems: 'flex-end', background: '#fff' }}>
          <textarea ref={inputRef} value={input} onChange={e => { setInput(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 96) + 'px' }} onKeyDown={handleKey} placeholder="Type a message... (Enter to send)" rows={1} style={{ flex: 1, resize: 'none', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '9px 13px', fontSize: 13.5, outline: 'none', fontFamily: 'inherit', lineHeight: '1.5', maxHeight: 96, overflowY: 'auto', background: '#f8fafc' }} onFocus={e => e.target.style.borderColor = '#4f46e5'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
          <button onClick={handleSend} disabled={!input.trim() || sending || loading} style={{ width: 42, height: 42, borderRadius: 12, border: 'none', flexShrink: 0, background: input.trim() && !sending ? '#4f46e5' : '#e2e8f0', color: input.trim() && !sending ? '#fff' : '#94a3b8', cursor: input.trim() && !sending ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {sending ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={16} />}
          </button>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', zIndex: 1000, backdropFilter: 'blur(2px)' }} />

      {/* Modal */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 'min(480px, 96vw)', height: 'min(620px, 90vh)',
        background: '#fff', borderRadius: 22,
        boxShadow: '0 24px 80px rgba(0,0,0,0.18)',
        zIndex: 1001, display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>

        {/* ── Header ── */}
        <div style={{ background: catBg, borderBottom: '1px solid rgba(0,0,0,0.06)', padding: '14px 18px', flexShrink: 0 }}>
          {/* Item info row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ fontSize: 22 }}>{catEmoji}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
              {item.location && <div style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>📍 {item.location}</div>}
            </div>
            <button onClick={onClose} style={{ background: 'rgba(0,0,0,0.07)', border: 'none', borderRadius: '50%', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
              <X size={15} color="#475569" />
            </button>
          </div>

          {/* Chat partner */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ position: 'relative' }}>
              <Avatar name={otherUser.full_name} url={otherUser.avatar_url} size={34} />
              <div style={{ position: 'absolute', bottom: 1, right: 1, width: 9, height: 9, borderRadius: '50%', background: '#22c55e', border: '2px solid #fff' }} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{otherUser.full_name}</div>
              <div style={{ fontSize: 11, color: '#64748b', textTransform: 'capitalize' }}>{otherUser.role || 'student'}</div>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(79,70,229,0.1)', borderRadius: 8, padding: '4px 10px' }}>
              <MessageCircle size={12} color="#4f46e5" />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#4f46e5' }}>Live chat</span>
            </div>
          </div>
        </div>

        {/* ── Messages area ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {loading ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', flexDirection: 'column', gap: 10 }}>
              <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', opacity: 0.5 }} />
              <span style={{ fontSize: 13 }}>Loading messages...</span>
            </div>
          ) : error ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', fontSize: 13, textAlign: 'center', padding: 24 }}>
              {error}
            </div>
          ) : messages.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8, color: '#94a3b8' }}>
              <MessageCircle size={32} style={{ opacity: 0.25 }} />
              <span style={{ fontSize: 13, fontWeight: 600 }}>No messages yet</span>
              <span style={{ fontSize: 12, textAlign: 'center', maxWidth: 220 }}>Start the conversation about <strong style={{ color: '#475569' }}>{item.title}</strong></span>
            </div>
          ) : (
            grouped.map(entry => {
              if (entry.type === 'date') {
                const label = entry.date === new Date().toDateString() ? 'Today'
                  : entry.date === new Date(Date.now() - 86400000).toDateString() ? 'Yesterday'
                  : new Date(entry.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                return (
                  <div key={entry.id} style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '8px 0' }}>
                    <div style={{ flex: 1, height: 1, background: '#f1f5f9' }} />
                    <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, whiteSpace: 'nowrap' }}>{label}</span>
                    <div style={{ flex: 1, height: 1, background: '#f1f5f9' }} />
                  </div>
                )
              }

              const isMe = entry.sender_id === currentUser.id
              const isOptimistic = entry._optimistic

              return (
                <div key={entry.id} style={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', gap: 8, alignItems: 'flex-end', marginBottom: 4 }}>
                  {!isMe && <Avatar name={entry.sender?.full_name} url={entry.sender?.avatar_url} size={26} style={{ marginBottom: 2 }} />}
                  <div style={{ maxWidth: '72%', display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', gap: 3 }}>
                    <div style={{
                      padding: '9px 13px',
                      borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      background: isMe ? '#4f46e5' : '#f1f5f9',
                      color: isMe ? '#fff' : '#1e293b',
                      fontSize: 13.5, lineHeight: '1.5',
                      opacity: isOptimistic ? 0.7 : 1,
                      wordBreak: 'break-word',
                      boxShadow: isMe ? '0 2px 8px rgba(79,70,229,0.2)' : 'none',
                    }}>
                      {entry.content}
                    </div>
                    <div style={{ fontSize: 10, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
                      {formatTime(entry.created_at)}
                      {isMe && !isOptimistic && (
                        <span style={{ color: entry.is_read ? '#4f46e5' : '#94a3b8' }}>
                          {entry.is_read ? '✓✓' : '✓'}
                        </span>
                      )}
                      {isOptimistic && <span style={{ color: '#94a3b8' }}>sending…</span>}
                    </div>
                  </div>
                </div>
              )
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* ── Input bar ── */}
        <div style={{ borderTop: '1px solid #f1f5f9', padding: '12px 14px', flexShrink: 0, display: 'flex', gap: 10, alignItems: 'flex-end', background: '#fff' }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => { setInput(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 96) + 'px' }}
            onKeyDown={handleKey}
            placeholder="Type a message... (Enter to send)"
            rows={1}
            style={{
              flex: 1, resize: 'none', border: '1.5px solid #e2e8f0', borderRadius: 12,
              padding: '9px 13px', fontSize: 13.5, outline: 'none', fontFamily: 'inherit',
              lineHeight: '1.5', maxHeight: 96, overflowY: 'auto', background: '#f8fafc',
              transition: 'border-color 0.15s',
            }}
            onFocus={e => e.target.style.borderColor = '#4f46e5'}
            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending || loading}
            style={{
              width: 42, height: 42, borderRadius: 12, border: 'none', flexShrink: 0,
              background: input.trim() && !sending ? '#4f46e5' : '#e2e8f0',
              color: input.trim() && !sending ? '#fff' : '#94a3b8',
              cursor: input.trim() && !sending ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.15s',
            }}
          >
            {sending ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={16} />}
          </button>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  )
}
