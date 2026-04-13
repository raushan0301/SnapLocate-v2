import { useState, useEffect, useRef, useCallback } from 'react'
import PageLayout from '../../components/PageLayout'
import { useAuth } from '../../context/AuthContext'
import api from '../../lib/api'
import LFChatModal from '../../components/LFChatModal'
import {
  Plus, Search, X, ChevronDown, ChevronUp,
  MapPin, Calendar, User, AlertCircle, CheckCircle2,
  Package, Trash2, Edit2, Camera, Clock, MessageCircle
} from 'lucide-react'

const CATEGORIES = [
  { value: 'all',         label: 'All',         emoji: '🔍', color: '#4f46e5', bg: '#eef2ff' },
  { value: 'electronics', label: 'Electronics', emoji: '💻', color: '#4f46e5', bg: '#eef2ff' },
  { value: 'keys',        label: 'Keys',        emoji: '🔑', color: '#d97706', bg: '#fffbeb' },
  { value: 'id_card',     label: 'ID Card',     emoji: '🪪', color: '#2563eb', bg: '#eff6ff' },
  { value: 'clothing',    label: 'Clothing',    emoji: '👕', color: '#db2777', bg: '#fdf2f8' },
  { value: 'books',       label: 'Books',       emoji: '📚', color: '#16a34a', bg: '#f0fdf4' },
  { value: 'bag',         label: 'Bag',         emoji: '🎒', color: '#ea580c', bg: '#fff7ed' },
  { value: 'wallet',      label: 'Wallet',      emoji: '👛', color: '#ca8a04', bg: '#fefce8' },
  { value: 'jewellery',   label: 'Jewellery',   emoji: '💍', color: '#9333ea', bg: '#faf5ff' },
  { value: 'sports',      label: 'Sports',      emoji: '⚽', color: '#0d9488', bg: '#f0fdfa' },
  { value: 'other',       label: 'Other',       emoji: '📦', color: '#64748b', bg: '#f8fafc' },
]
const catInfo = (v) => CATEGORIES.find(c => c.value === v) || CATEGORIES[CATEGORIES.length - 1]

const STATUS_CONFIG = {
  lost:     { label: 'Lost',     bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' },
  found:    { label: 'Found',    bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
  resolved: { label: 'Resolved', bg: '#f0f9ff', color: '#0369a1', border: '#bae6fd' },
}


function Avatar({ name, url, size = 32 }) {
  const initials = (name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  if (url) return <img src={url} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: '#e0e7ff', color: '#4f46e5', fontSize: size * 0.38, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {initials}
    </div>
  )
}

function StatusBadge({ status }) {
  const s = STATUS_CONFIG[status] || STATUS_CONFIG.lost
  return <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</span>
}

function CatBadge({ category }) {
  const c = catInfo(category)
  return <span style={{ background: c.bg, color: c.color, padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>{c.emoji} {c.label}</span>
}

function shareOnWhatsApp(item) {
  const status = item.status === 'lost' ? 'LOST' : item.status === 'found' ? 'FOUND' : 'RESOLVED'
  const text = `🔍 ${status} on SnapLocate Campus\n\n*${item.title}*\n📍 ${item.location || 'Campus'}\n📅 ${item.date ? new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}\n\nIf you know anything, contact via SnapLocate app.`
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
}

function ItemCard({ item, currentUserId, onClaim, onChat }) {
  const ci = catInfo(item.category)
  const isResolved = item.status === 'resolved'
  const isOwn = item.reporter?.id === currentUserId
  return (
    <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #f1f5f9', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', overflow: 'hidden', opacity: isResolved ? 0.72 : 1, transition: 'box-shadow 0.15s, transform 0.15s' }}
      onMouseEnter={e => { if (!isResolved) { e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.09)'; e.currentTarget.style.transform = 'translateY(-2px)' } }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.04)'; e.currentTarget.style.transform = 'none' }}
    >
      <div style={{ height: 140, background: isResolved ? '#f8fafc' : ci.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
        {item.image_url ? <img src={item.image_url} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ fontSize: 56, filter: isResolved ? 'grayscale(0.6)' : 'none' }}>{ci.emoji}</span>}
        <div style={{ position: 'absolute', top: 10, left: 10 }}><StatusBadge status={item.status} /></div>
        {isResolved && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: '#fff', borderRadius: 50, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={16} color="#16a34a" /><span style={{ fontSize: 12, fontWeight: 700, color: '#15803d' }}>Resolved</span>
            </div>
          </div>
        )}
      </div>
      <div style={{ padding: '16px 18px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', lineHeight: '20px' }}>{item.title}</div>
          <CatBadge category={item.category} />
        </div>
        {item.description && <p style={{ fontSize: 12, color: '#64748b', lineHeight: '18px', margin: '0 0 10px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.description}</p>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
          {item.location && <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#475569' }}><MapPin size={12} color="#94a3b8" />{item.location}</div>}
          {item.date && <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#475569' }}><Calendar size={12} color="#94a3b8" />{new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <Avatar name={item.reporter?.full_name} url={item.reporter?.avatar_url} size={26} />
          <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>{item.reporter?.full_name || 'Anonymous'}</span>
          {item.claims?.length > 0 && <span style={{ marginLeft: 'auto', background: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa', borderRadius: 10, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>{item.claims.length} claim{item.claims.length !== 1 ? 's' : ''}</span>}
        </div>
        {!isResolved && !isOwn && item.reporter && (
          <div style={{ display: 'flex', gap: 8 }}>
            {item.status === 'lost' && (
              <button onClick={() => onClaim(item)} style={{ flex: 1, padding: '9px', borderRadius: 10, border: 'none', background: '#4f46e5', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>This is Mine / Chat</button>
            )}
            {item.status === 'found' && (
              <button onClick={() => onChat(item, item.reporter)} style={{ flex: 1, padding: '9px', borderRadius: 10, border: 'none', background: '#15803d', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <MessageCircle size={15} /> Chat with Reporter
              </button>
            )}
            <button onClick={() => shareOnWhatsApp(item)} title="Share on WhatsApp"
              style={{ padding: '9px 10px', borderRadius: 10, border: '1.5px solid #dcfce7', background: '#f0fdf4', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.374 0 0 5.373 0 12c0 2.917 1.044 5.589 2.763 7.663L.957 23.485l3.938-1.033A11.954 11.954 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.006-1.374l-.36-.214-3.716.974.992-3.625-.234-.374A9.818 9.818 0 1121.818 12 9.829 9.829 0 0112 21.818z"/></svg>
            </button>
          </div>
        )}
        {isOwn && !isResolved && <div style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', fontStyle: 'italic' }}>Your post</div>}
      </div>
    </div>
  )
}

function ClaimChatModal({ item, otherUser, currentUser, onClose, onSubmit, hasClaim }) {
  const [activeTab, setActiveTab]   = useState(hasClaim ? 'chat' : 'claim')
  const [claimed,   setClaimed]     = useState(hasClaim || false)
  const [chatUnread, setChatUnread] = useState(0)
  const activeTabRef = useRef(activeTab)
  useEffect(() => { activeTabRef.current = activeTab }, [activeTab])
  // Claim form state
  const [message,    setMessage]    = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]      = useState('')
  const ci = catInfo(item.category)

  const convIdRef = useRef(null)
  const switchToChat = () => {
    setActiveTab('chat')
    setChatUnread(0)
    if (convIdRef.current) api.patch(`/api/lf-chat/conversations/${convIdRef.current}/read`)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (message.length < 20) { setError('Please write at least 20 characters.'); return }
    setSubmitting(true); setError('')
    try {
      await onSubmit({ message })
      setClaimed(true)
      switchToChat()
    } catch (err) {
      const msg = err.message || ''
      // Duplicate claim — treat as already claimed, open chat
      if (msg.toLowerCase().includes('already') || msg.includes('23505') || msg.toLowerCase().includes('unique')) {
        setClaimed(true)
        switchToChat()
      } else {
        setError(msg || 'Failed to submit claim. Please try again.')
      }
    } finally { setSubmitting(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 22, width: '100%', maxWidth: 500, boxShadow: '0 24px 64px rgba(0,0,0,0.18)', maxHeight: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '20px 24px 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 24 }}>{ci.emoji}</span>
              <div>
                <div style={{ fontWeight: 800, fontSize: 15, color: '#0f172a' }}>{item.title}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>{item.location}</div>
              </div>
            </div>
            <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', borderRadius: 10, padding: 8, cursor: 'pointer' }}><X size={18} color="#64748b" /></button>
          </div>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid #f1f5f9' }}>
            <button onClick={() => setActiveTab('claim')}
              style={{ padding: '10px 18px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: activeTab === 'claim' ? 700 : 500, color: activeTab === 'claim' ? '#4f46e5' : '#64748b', borderBottom: activeTab === 'claim' ? '2px solid #4f46e5' : '2px solid transparent', marginBottom: -2, display: 'flex', alignItems: 'center', gap: 6 }}>
              {claimed ? <><CheckCircle2 size={13} color="#16a34a" /> Claimed</> : 'Claim This Item'}
            </button>
            <button onClick={switchToChat}
              style={{ padding: '10px 18px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: activeTab === 'chat' ? 700 : 500, color: activeTab === 'chat' ? '#4f46e5' : '#64748b', borderBottom: activeTab === 'chat' ? '2px solid #4f46e5' : '2px solid transparent', marginBottom: -2, display: 'flex', alignItems: 'center', gap: 6, position: 'relative' }}>
              Chat with Reporter
              {chatUnread > 0 && (
                <span style={{ background: '#ef4444', color: '#fff', borderRadius: 10, padding: '1px 6px', fontSize: 10, fontWeight: 800, lineHeight: '16px' }}>{chatUnread}</span>
              )}
            </button>
          </div>
        </div>

        {/* Claim Tab */}
        {activeTab === 'claim' && (
          <div style={{ padding: '20px 24px 24px', overflowY: 'auto', flex: 1 }}>
            {claimed ? (
              /* Locked state after claim submitted */
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 0', gap: 14 }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#f0fdf4', border: '2px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle2 size={28} color="#16a34a" />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: 800, fontSize: 16, color: '#0f172a', marginBottom: 6 }}>Claim Submitted!</div>
                  <p style={{ fontSize: 13, color: '#64748b', margin: 0, maxWidth: 280, lineHeight: '19px' }}>Your claim is under review. Chat with the reporter for quick updates.</p>
                </div>
                <button onClick={switchToChat} style={{ marginTop: 4, padding: '10px 24px', borderRadius: 12, border: 'none', background: '#4f46e5', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <MessageCircle size={15} /> Open Chat
                </button>
              </div>
            ) : (
              <>
                <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 16px' }}>Describe why this item belongs to you. The reporter will review your claim.</p>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Why is this yours? * <span style={{ fontWeight: 400, color: '#94a3b8' }}>({message.length}/1000)</span></label>
                    <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Describe identifying details — serial number, what's inside, unique marks, when/where you lost it..." rows={4} required
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 13, resize: 'vertical', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                      onFocus={e => e.target.style.borderColor = '#4f46e5'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                    {message.length > 0 && message.length < 20 && <p style={{ fontSize: 11, color: '#f59e0b', margin: '4px 0 0' }}>Need {20 - message.length} more characters</p>}
                  </div>
                  {error && <div style={{ padding: '10px 14px', borderRadius: 10, background: '#fef2f2', color: '#dc2626', fontSize: 13 }}>{error}</div>}
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button type="button" onClick={onClose} style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', color: '#475569' }}>Cancel</button>
                    <button type="submit" disabled={submitting || message.length < 20}
                      style={{ flex: 2, padding: '11px', borderRadius: 10, border: 'none', background: submitting || message.length < 20 ? '#c7d2fe' : '#4f46e5', color: '#fff', fontSize: 14, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer' }}>
                      {submitting ? 'Submitting...' : 'Submit Claim'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        )}

        {/* Chat Tab — always mounted so realtime stays alive, hidden when inactive */}
        <div style={{ flex: 1, overflow: 'hidden', display: activeTab === 'chat' ? 'flex' : 'none', flexDirection: 'column' }}>
          <LFChatModal
            item={item}
            otherUser={otherUser}
            currentUser={currentUser}
            onClose={onClose}
            embedded={true}
            onConvReady={id => { convIdRef.current = id }}
            onNewMessage={() => { if (activeTabRef.current !== 'chat') setChatUnread(n => n + 1) }}
          />
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}


function ReportModal({ initial, onClose, onSaved }) {
  const isEdit = !!initial?.id
  const [form, setForm] = useState(initial || { title: '', description: '', status: 'lost', category: 'other', location: '', contact_info: '', date: new Date().toISOString().split('T')[0], image_url: '' })
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState(initial?.image_url || '')
  const [error, setError] = useState('')
  const fileRef = useRef()
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleFile = async (e) => {
    const file = e.target.files[0]; if (!file) return
    e.target.value = ''  // allow re-selecting same file after a failure
    setPreview(URL.createObjectURL(file)); setUploading(true); setError('')
    try {
      const fd = new FormData(); fd.append('file', file)
      const data = await api.upload('/api/upload/image?folder_key=lost_found', fd)
      if (!data.success) throw new Error(data.error || data.message || 'Upload failed')
      set('image_url', data.url)
    } catch (err) {
      setError(err.message)
      setPreview(initial?.image_url || '')
      set('image_url', initial?.image_url || '')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title) { setError('Item name is required'); return }
    setSaving(true); setError('')
    try {
      // Only send image_url if it's a real URL (not a local blob preview)
      const imageUrl = form.image_url && !form.image_url.startsWith('blob:') ? form.image_url : undefined
      const payload = { title: form.title, description: form.description, status: form.status, category: form.category, location: form.location, contact_info: form.contact_info, date: form.date, image_url: imageUrl }
      const res = isEdit ? await api.patch(`/api/lost-found/${initial.id}`, payload) : await api.post('/api/lost-found', payload)
      if (!res.success) throw new Error(res.error || 'Failed')
      onSaved(res.data, isEdit)
    } catch (err) { setError(err.message) } finally { setSaving(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 22, padding: 32, width: '100%', maxWidth: 520, boxShadow: '0 24px 64px rgba(0,0,0,0.18)', maxHeight: '92vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div><h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: 0 }}>{isEdit ? 'Edit Post' : 'Report Item'}</h2><p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>{isEdit ? 'Update your report' : 'Lost or found something? Let people know.'}</p></div>
          <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', borderRadius: 10, padding: 8, cursor: 'pointer' }}><X size={18} color="#64748b" /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            {['lost','found'].map(s => (
              <button key={s} type="button" onClick={() => set('status', s)} style={{ flex: 1, padding: '12px', borderRadius: 12, border: '2px solid', borderColor: form.status === s ? (s==='lost'?'#c2410c':'#15803d') : '#e2e8f0', background: form.status === s ? (s==='lost'?'#fff7ed':'#f0fdf4') : '#fff', color: form.status === s ? (s==='lost'?'#c2410c':'#15803d') : '#64748b', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                {s === 'lost' ? '😢 I Lost Something' : '😊 I Found Something'}
              </button>
            ))}
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 8 }}>Category</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {CATEGORIES.slice(1).map(c => (
                <button key={c.value} type="button" onClick={() => set('category', c.value)} style={{ padding: '6px 12px', borderRadius: 8, border: '1.5px solid', borderColor: form.category === c.value ? c.color : '#e2e8f0', background: form.category === c.value ? c.bg : '#fff', color: form.category === c.value ? c.color : '#64748b', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  {c.emoji} {c.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Photo <span style={{ fontWeight: 400, color: '#94a3b8' }}>(optional)</span></label>
            <input type="file" ref={fileRef} onChange={handleFile} accept="image/*" style={{ display: 'none' }} />
            {preview ? (
              <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', height: 140 }}>
                <img src={preview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button type="button" onClick={() => { setPreview(''); set('image_url', '') }} style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer', color: '#fff', display: 'flex' }}><X size={14} /></button>
              </div>
            ) : (
              <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                style={{ width: '100%', padding: '18px', borderRadius: 12, border: '2px dashed #e2e8f0', background: '#fafafa', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#4f46e5'} onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e8f0'}>
                {uploading ? <div style={{ width: 20, height: 20, border: '2px solid #e2e8f0', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  : <><Camera size={22} color="#94a3b8" /><span style={{ fontSize: 13, color: '#94a3b8' }}>Upload a photo</span></>}
              </button>
            )}
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Item Name *</label>
            <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Black HP Laptop" required
              style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              onFocus={e => e.target.style.borderColor = '#4f46e5'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Location / Area</label>
              <input value={form.location} onChange={e => set('location', e.target.value)} placeholder="e.g. Library Block"
                style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = '#4f46e5'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Date</label>
              <input type="date" value={form.date} onChange={e => set('date', e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = '#4f46e5'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Description <span style={{ fontWeight: 400, color: '#94a3b8' }}>(optional)</span></label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} placeholder="Color, brand, unique marks, what's inside..."
              style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 13, resize: 'vertical', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
              onFocus={e => e.target.style.borderColor = '#4f46e5'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Contact Info <span style={{ fontWeight: 400, color: '#94a3b8' }}>(phone / email / WhatsApp)</span></label>
            <input value={form.contact_info} onChange={e => set('contact_info', e.target.value)} placeholder="e.g. 9876543210"
              style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
              onFocus={e => e.target.style.borderColor = '#4f46e5'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
          </div>
          {error && <div style={{ padding: '10px 14px', borderRadius: 10, background: '#fef2f2', color: '#dc2626', fontSize: 13 }}>{error}</div>}
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', color: '#475569' }}>Cancel</button>
            <button type="submit" disabled={saving} style={{ flex: 2, padding: '11px', borderRadius: 10, border: 'none', background: saving ? '#c7d2fe' : '#4f46e5', color: '#fff', fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}>
              {saving ? 'Posting...' : isEdit ? 'Save Changes' : 'Post Report'}
            </button>
          </div>
        </form>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

function MyPostCard({ item, onEdit, onDelete, onResolve, onClaimAction, onChat }) {
  const [expanded, setExpanded] = useState(false)
  const ci = catInfo(item.category)
  const pendingClaims = (item.claims || []).filter(c => c.status === 'pending')
  return (
    <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: ci.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{ci.emoji}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>{item.title}</span>
            <StatusBadge status={item.status} />
            <CatBadge category={item.category} />
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {item.location && <span style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={11} />{item.location}</span>}
            {item.date && <span style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={11} />{new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>}
            <span style={{ fontSize: 12, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={11} />{new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          {item.status !== 'resolved' && <>
            <button onClick={() => onEdit(item)} style={{ padding: '7px 12px', borderRadius: 9, border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer', color: '#475569', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}><Edit2 size={13} />Edit</button>
            <button onClick={() => onResolve(item.id)} style={{ padding: '7px 12px', borderRadius: 9, border: '1.5px solid #bbf7d0', background: '#f0fdf4', cursor: 'pointer', color: '#15803d', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}><CheckCircle2 size={13} />Resolve</button>
          </>}
          <button onClick={() => onDelete(item.id)} style={{ padding: '7px', borderRadius: 9, border: '1px solid #fee2e2', background: '#fff', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center' }}><Trash2 size={14} /></button>
        </div>
      </div>
      {(item.claims || []).length > 0 && (
        <div style={{ borderTop: '1px solid #f1f5f9' }}>
          <button onClick={() => setExpanded(!expanded)}
            style={{ width: '100%', padding: '10px 20px', background: pendingClaims.length > 0 ? '#fffbeb' : '#f8fafc', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: pendingClaims.length > 0 ? '#92400e' : '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
              {pendingClaims.length > 0 ? <AlertCircle size={14} color="#f59e0b" /> : <User size={14} />}
              {item.claims.length} Claim{item.claims.length !== 1 ? 's' : ''}{pendingClaims.length > 0 ? ` (${pendingClaims.length} pending)` : ''}
            </span>
            {expanded ? <ChevronUp size={16} color="#94a3b8" /> : <ChevronDown size={16} color="#94a3b8" />}
          </button>
          {expanded && (
            <div style={{ padding: '12px 20px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {item.claims.map(claim => (
                <div key={claim.id} style={{ background: '#f8fafc', borderRadius: 12, padding: '14px 16px', border: claim.status === 'pending' ? '1px solid #fed7aa' : claim.status === 'approved' ? '1px solid #bbf7d0' : '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <Avatar name={claim.claimer?.full_name} url={claim.claimer?.avatar_url} size={28} />
                    <div style={{ flex: 1 }}>
                      <span style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>{claim.claimer?.full_name}</span>
                      <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 8 }}>{new Date(claim.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', padding: '2px 8px', borderRadius: 6, background: claim.status === 'pending' ? '#fffbeb' : claim.status === 'approved' ? '#f0fdf4' : '#f8fafc', color: claim.status === 'pending' ? '#92400e' : claim.status === 'approved' ? '#15803d' : '#64748b' }}>{claim.status}</span>
                  </div>
                  <p style={{ fontSize: 13, color: '#374151', margin: '0 0 8px', lineHeight: '19px' }}>{claim.message}</p>
                  {claim.proof_url && <a href={claim.proof_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#4f46e5', fontWeight: 600 }}>View proof photo →</a>}
                  <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                    {claim.claimer && (
                      <button onClick={() => onChat(item, claim.claimer)}
                        style={{ padding: '7px 12px', borderRadius: 9, border: '1.5px solid #e0e7ff', background: '#f5f3ff', color: '#4f46e5', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <MessageCircle size={13} /> Chat
                      </button>
                    )}
                    {claim.status === 'pending' && item.status !== 'resolved' && (
                      <>
                        <button onClick={() => onClaimAction(item.id, claim.id, 'approve')} style={{ flex: 1, padding: '8px', borderRadius: 9, border: 'none', background: '#15803d', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>✓ Approve</button>
                        <button onClick={() => onClaimAction(item.id, claim.id, 'reject')} style={{ flex: 1, padding: '8px', borderRadius: 9, border: '1.5px solid #fca5a5', background: '#fff', color: '#dc2626', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>✗ Reject</button>
                      </>
                    )}
                  </div>
                  {claim.admin_note && <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 6, fontStyle: 'italic' }}>Note: {claim.admin_note}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function LostFoundPage() {
  const { user } = useAuth()
  const [tab, setTab] = useState('browse')
  const [items, setItems] = useState([])
  const [myItems, setMyItems] = useState([])
  const [myClaims, setMyClaims] = useState([])
  const [loading, setLoading] = useState(true)
  const [myLoading, setMyLoading] = useState(false)
  const [claimsLoading, setClaimsLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')
  const [catFilter, setCatFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  // claimChatTarget: item (for lost items — opens combined Claim+Chat modal)
  const [claimChatTarget, setClaimChatTarget] = useState(null)
  // chatTarget: { item, otherUser } (for found items — chat only)
  const [chatTarget, setChatTarget] = useState(null)
  const [reportTarget, setReportTarget] = useState(null)

  useEffect(() => { const t = setTimeout(() => setDebouncedSearch(search), 350); return () => clearTimeout(t) }, [search])

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (catFilter !== 'all')    params.set('category', catFilter)
      if (debouncedSearch)        params.set('search', debouncedSearch)
      const res = await api.get(`/api/lost-found?${params}`)
      const fetched = res.success ? (res.data || []) : []
      setItems(fetched)
    } catch { } finally { setLoading(false) }
  }, [statusFilter, catFilter, debouncedSearch])

  const fetchMyItems = useCallback(async () => {
    setMyLoading(true)
    try { const res = await api.get('/api/lost-found/my'); if (res.success) setMyItems(res.data || []) }
    catch { } finally { setMyLoading(false) }
  }, [])

  const fetchMyClaims = useCallback(async () => {
    setClaimsLoading(true)
    try { const res = await api.get('/api/lost-found/my-claims'); if (res.success) setMyClaims(res.data || []) }
    catch { } finally { setClaimsLoading(false) }
  }, [])

  useEffect(() => { fetchItems() }, [fetchItems])
  useEffect(() => { if (tab === 'mine') fetchMyItems() }, [tab, fetchMyItems])
  useEffect(() => { if (tab === 'claimed') fetchMyClaims() }, [tab, fetchMyClaims])

  const lostCount     = items.filter(i => i.status === 'lost').length
  const foundCount    = items.filter(i => i.status === 'found').length
  const resolvedCount = items.filter(i => i.status === 'resolved').length

  const handleClaim = async ({ message, proof_url }) => {
    const res = await api.post(`/api/lost-found/${claimChatTarget.id}/claim`, { message, proof_url })
    if (!res.success) throw new Error(res.error || 'Claim failed')
    // Refresh claims list, then switch to Claimed tab when modal closes
    fetchMyClaims()
    fetchItems()
  }
  const handleAfterClaim = (switchTab = true) => {
    setClaimChatTarget(null)
    if (switchTab && tab !== 'claimed') setTab('claimed')
  }
  const handleResolve = async (id) => {
    if (!window.confirm('Mark this item as resolved?')) return
    await api.patch(`/api/lost-found/${id}/resolve`); fetchMyItems(); fetchItems()
  }
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this post permanently?')) return
    await api.delete(`/api/lost-found/${id}`)
    setMyItems(p => p.filter(i => i.id !== id)); setItems(p => p.filter(i => i.id !== id))
  }
  const handleClaimAction = async (itemId, claimId, action) => {
    await api.patch(`/api/lost-found/${itemId}/claim/${claimId}`, { action }); fetchMyItems(); fetchItems()
  }
  const handleSaved = (data, isEdit) => {
    if (isEdit) {
      setMyItems(p => p.map(i => i.id === data.id ? { ...i, ...data } : i))
      setItems(p => p.map(i => i.id === data.id ? { ...i, ...data } : i))
    } else {
      setMyItems(p => [{ ...data, claims: [] }, ...p])
      setItems(p => [{ ...data, claims: [] }, ...p])
    }
    setReportTarget(null)
  }

  return (
    <PageLayout>
      {claimChatTarget && (() => {
        const alreadyClaimed = claimChatTarget.claims?.some(c => c.claimer_id === user?.id)
        return (
          <ClaimChatModal
            item={claimChatTarget}
            otherUser={claimChatTarget.reporter}
            currentUser={user}
            onClose={() => handleAfterClaim(!alreadyClaimed)}
            onSubmit={handleClaim}
            hasClaim={alreadyClaimed}
          />
        )
      })()}
      {chatTarget && (
        <LFChatModal
          item={chatTarget.item}
          otherUser={chatTarget.otherUser}
          currentUser={user}
          onClose={() => setChatTarget(null)}
        />
      )}
      {reportTarget !== null && <ReportModal initial={reportTarget?.id ? reportTarget : null} onClose={() => setReportTarget(null)} onSaved={handleSaved} />}

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', margin: 0 }}>Lost & Found</h1>
          <p style={{ fontSize: 14, color: '#64748b', marginTop: 4, marginBottom: 0 }}>Report lost items or help return found items to their owners.</p>
        </div>
        <button onClick={() => setReportTarget({})} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 22px', borderRadius: 12, border: 'none', background: '#4f46e5', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
          <Plus size={17} /> Report Item
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {[{ label: 'Lost Items', count: lostCount, color: '#c2410c', bg: '#fff7ed', border: '#fed7aa' },
          { label: 'Found Items', count: foundCount, color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' },
          { label: 'Resolved', count: resolvedCount, color: '#0369a1', bg: '#f0f9ff', border: '#bae6fd' }
        ].map((s, i) => (
          <div key={i} style={{ background: s.bg, borderRadius: 16, border: `1px solid ${s.border}`, padding: '18px 22px' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: s.color, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
            <div style={{ fontSize: 30, fontWeight: 800, color: s.color }}>{s.count}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid #f1f5f9' }}>
        {[
          { id: 'browse',  label: 'Browse Items' },
          { id: 'claimed', label: `My Claims${myClaims.length ? ` (${myClaims.length})` : ''}` },
          { id: 'mine',    label: `My Posts${myItems.length ? ` (${myItems.length})` : ''}` },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '12px 24px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: tab === t.id ? 700 : 500, color: tab === t.id ? '#4f46e5' : '#64748b', borderBottom: tab === t.id ? '2px solid #4f46e5' : '2px solid transparent', marginBottom: -2 }}>{t.label}</button>
        ))}
      </div>

      {tab === 'browse' && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, background: '#fff', borderRadius: 16, border: '1px solid #f1f5f9', padding: '16px 20px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by item name, location..."
                style={{ width: '100%', padding: '10px 36px 10px 36px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = '#4f46e5'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
              {search && <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer' }}><X size={14} color="#94a3b8" /></button>}
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {['all','lost','found','resolved'].map(s => {
                const lbl = s === 'all' ? 'All Items' : STATUS_CONFIG[s].label
                const col = s === 'all' ? '#4f46e5' : STATUS_CONFIG[s].color
                return <button key={s} onClick={() => setStatusFilter(s)} style={{ padding: '7px 14px', borderRadius: 10, border: '1.5px solid', borderColor: statusFilter === s ? col : '#e2e8f0', background: statusFilter === s ? col : '#fff', color: statusFilter === s ? '#fff' : '#475569', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{lbl}</button>
              })}
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {CATEGORIES.map(c => <button key={c.value} onClick={() => setCatFilter(c.value)} style={{ padding: '6px 12px', borderRadius: 8, border: '1.5px solid', borderColor: catFilter === c.value ? c.color : '#e2e8f0', background: catFilter === c.value ? c.bg : '#fff', color: catFilter === c.value ? c.color : '#64748b', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{c.emoji} {c.label}</button>)}
            </div>
          </div>

          {loading ? <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8', fontSize: 14 }}>Loading items...</div>
            : items.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <Package size={44} style={{ opacity: 0.2, margin: '0 auto 14px', display: 'block' }} />
                <p style={{ fontSize: 15, color: '#64748b', fontWeight: 600 }}>No items found</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
                {items.map(item => <ItemCard key={item.id} item={item} currentUserId={user?.id} onClaim={setClaimChatTarget} onChat={(item, otherUser) => setChatTarget({ item, otherUser })} />)}
              </div>
            )}
        </>
      )}

      {tab === 'claimed' && (
        claimsLoading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8', fontSize: 14 }}>Loading your claims...</div>
        ) : myClaims.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Package size={44} style={{ opacity: 0.2, margin: '0 auto 14px', display: 'block' }} />
            <p style={{ fontSize: 15, color: '#64748b', fontWeight: 600, marginBottom: 6 }}>No claims yet</p>
            <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 20 }}>See a lost item that's yours? Click "This is Mine / Chat" to claim it.</p>
            <button onClick={() => setTab('browse')} style={{ padding: '10px 22px', borderRadius: 12, border: 'none', background: '#4f46e5', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Browse Items</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {myClaims.map(claim => {
              const item = claim.item
              if (!item) return null
              const ci = catInfo(item.category)
              const STATUS_MAP = { pending: { label: 'Pending Review', color: '#92400e', bg: '#fffbeb', border: '#fde68a' }, approved: { label: 'Approved', color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' }, rejected: { label: 'Rejected', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' } }
              const cs = STATUS_MAP[claim.status] || STATUS_MAP.pending
              return (
                <div key={claim.id} style={{ background: '#fff', borderRadius: 18, border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', gap: 16, padding: '18px 20px', alignItems: 'flex-start' }}>
                    <div style={{ width: 52, height: 52, borderRadius: 14, background: ci.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>{ci.emoji}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                        <span style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>{item.title}</span>
                        <StatusBadge status={item.status} />
                        <span style={{ background: cs.bg, color: cs.color, border: `1px solid ${cs.border}`, padding: '2px 9px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{cs.label}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
                        {item.location && <span style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={11} />{item.location}</span>}
                        {item.date && <span style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={11} />{new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                      </div>
                      <div style={{ background: '#f8fafc', borderRadius: 10, padding: '10px 14px', marginBottom: 10, borderLeft: `3px solid ${cs.border}` }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Your claim</div>
                        <p style={{ fontSize: 13, color: '#374151', margin: 0, lineHeight: '18px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{claim.message}</p>
                      </div>
                      {claim.admin_note && (
                        <div style={{ background: claim.status === 'approved' ? '#f0fdf4' : '#fef2f2', borderRadius: 8, padding: '8px 12px', marginBottom: 10, fontSize: 12, color: claim.status === 'approved' ? '#15803d' : '#dc2626' }}>
                          <strong>Note:</strong> {claim.admin_note}
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {item.reporter && item.status !== 'resolved' && (
                          <button
                            onClick={() => setClaimChatTarget({ ...item, claims: [{ ...claim, claimer_id: user?.id }] })}
                            style={{ padding: '8px 16px', borderRadius: 10, border: 'none', background: '#4f46e5', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <MessageCircle size={14} /> Chat with Reporter
                          </button>
                        )}
                        {claim.proof_url && (
                          <a href={claim.proof_url} target="_blank" rel="noopener noreferrer" style={{ padding: '8px 16px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#fff', color: '#475569', fontSize: 13, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
                            View Proof
                          </a>
                        )}
                      </div>
                    </div>
                    <div style={{ flexShrink: 0 }}>
                      <Avatar name={item.reporter?.full_name} url={item.reporter?.avatar_url} size={32} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )
      )}

      {tab === 'mine' && (
        myLoading ? <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8', fontSize: 14 }}>Loading your posts...</div>
          : myItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <Package size={44} style={{ opacity: 0.2, margin: '0 auto 14px', display: 'block' }} />
              <p style={{ fontSize: 15, color: '#64748b', fontWeight: 600, marginBottom: 6 }}>No posts yet</p>
              <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 20 }}>Lost something? Found something? Report it now.</p>
              <button onClick={() => setReportTarget({})} style={{ padding: '10px 22px', borderRadius: 12, border: 'none', background: '#4f46e5', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Report Item</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {myItems.map(item => <MyPostCard key={item.id} item={item} onEdit={setReportTarget} onDelete={handleDelete} onResolve={handleResolve} onClaimAction={handleClaimAction} onChat={(item, otherUser) => setChatTarget({ item, otherUser })} />)}
            </div>
          )
      )}
    </PageLayout>
  )
}
