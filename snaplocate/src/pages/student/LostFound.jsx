import { useState, useEffect, useRef, useCallback } from 'react'
import PageLayout from '../../components/PageLayout'
import { useAuth } from '../../context/AuthContext'
import api from '../../lib/api'
import LFChatModal from '../../components/LFChatModal'
import {
  Plus, Search, X, ChevronDown, ChevronUp,
  MapPin, Calendar, User, AlertCircle, CheckCircle2,
  Package, Trash2, Edit2, Camera, Clock, MessageCircle, PlusSquare,
  MonitorSmartphone, Key, Book, Shirt, Backpack, Wallet, Activity, Box, LayoutGrid, Contact, RotateCcw
} from 'lucide-react'

const pjs = (size, weight, lh, color) => ({
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  fontSize: size, fontWeight: weight, lineHeight: lh, color,
})
const inter = (size, weight, lh, color) => ({
  fontFamily: "'Inter', sans-serif",
  fontSize: size, fontWeight: weight, lineHeight: lh, color,
})


const CATEGORIES = [
  { value: 'all',         label: 'All',         icon: LayoutGrid, color: '#4f46e5', bg: '#eef2ff' },
  { value: 'electronics', label: 'Electronics', icon: MonitorSmartphone, color: '#4f46e5', bg: '#eef2ff' },
  { value: 'keys',        label: 'Keys',        icon: Key, color: '#d97706', bg: '#fffbeb' },
  { value: 'id_card',     label: 'ID Card',     icon: Contact, color: '#2563eb', bg: '#eff6ff' },
  { value: 'clothing',    label: 'Clothing',    icon: Shirt, color: '#db2777', bg: '#fdf2f8' },
  { value: 'books',       label: 'Books',       icon: Book, color: '#16a34a', bg: '#f0fdf4' },
  { value: 'bag',         label: 'Bag',         icon: Backpack, color: '#ea580c', bg: '#fff7ed' },
  { value: 'wallet',      label: 'Wallet',      icon: Wallet, color: '#ca8a04', bg: '#fefce8' },
  { value: 'jewellery',   label: 'Jewellery',   icon: Activity, color: '#9333ea', bg: '#faf5ff' },
  { value: 'sports',      label: 'Sports',      icon: Activity, color: '#0d9488', bg: '#f0fdfa' },
  { value: 'other',       label: 'Other',       icon: Box, color: '#64748b', bg: '#f8fafc' },
]
const catInfo = (v) => CATEGORIES.find(c => c.value === v) || CATEGORIES[CATEGORIES.length - 1]

const STATUS_CONFIG = {
  lost: { label: 'Lost', bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' },
  found: { label: 'Found', bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
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
  const Icon = c.icon
  return (
    <span style={{ 
      background: c.bg, color: c.color, 
      padding: '2px 8px', borderRadius: 6, 
      fontSize: 11, fontWeight: 600, 
      display: 'inline-flex', alignItems: 'center', gap: 5 
    }}>
      <Icon size={12} strokeWidth={2.5} /> {c.label}
    </span>
  )
}


function CustomConfirmModal({ open, title, message, onConfirm, onCancel, confirmText = 'Confirm', type = 'danger' }) {
  if (!open) return null
  const isDanger = type === 'danger'
  const isSuccess = type === 'success'
  
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(8px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 28, padding: '32px 32px 24px', width: '100%', maxWidth: 400, boxShadow: '0 24px 64px rgba(0,0,0,0.18)', border: '1px solid #f1f5f9', textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: isDanger ? '#fef2f2' : isSuccess ? '#f0fdf4' : '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          {isDanger ? <AlertCircle size={32} color="#dc2626" /> : isSuccess ? <CheckCircle2 size={32} color="#16a34a" /> : <RotateCcw size={32} color="#4f46e5" />}
        </div>
        <h3 style={{ margin: '0 0 10px', ...pjs(20, 800, '28px', '#0f172a') }}>{title}</h3>
        <p style={{ margin: '0 0 28px', ...pjs(14, 400, '22px', '#64748b') }}>{message}</p>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: '14px', borderRadius: 16, border: '1.5px solid #e2e8f0', background: '#fff', ...pjs(14, 700, '20px', '#475569'), cursor: 'pointer' }}>Cancel</button>
          <button onClick={onConfirm} style={{ 
            flex: 1, padding: '14px', borderRadius: 16, border: 'none', 
            background: isDanger ? '#dc2626' : '#4f46e5', color: '#fff', 
            ...pjs(14, 700, '20px', '#fff'), cursor: 'pointer',
            boxShadow: isDanger ? '0 8px 20px rgba(220, 38, 38, 0.25)' : '0 8px 20px rgba(79, 70, 229, 0.25)' 
          }}>{confirmText}</button>
        </div>
      </div>
    </div>
  )
}

function ImageModal({ url, onClose }) {
  if (!url) return null
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.92)', backdropFilter: 'blur(12px)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
      <button style={{ position: 'absolute', top: 30, right: 30, background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 14, padding: 12, cursor: 'pointer', color: '#fff' }}><X size={24} /></button>
      <img src={url} alt="full view" style={{ maxWidth: '95vw', maxHeight: '90vh', borderRadius: 24, boxShadow: '0 24px 64px rgba(0,0,0,0.4)', objectFit: 'contain' }} onClick={e => e.stopPropagation()} />
    </div>
  )
}

function shareOnWhatsApp(item) {
  const status = item.status === 'lost' ? 'LOST' : item.status === 'found' ? 'FOUND' : 'RESOLVED'
  const text = `🔍 ${status} on SnapLocate Campus\n\n*${item.title}*\n📍 ${item.location || 'Campus'}\n📅 ${item.date ? new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}\n\nIf you know anything, contact via SnapLocate app.`
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
}

function ItemCard({ item, currentUserId, onClaim, onChat }) {
  const [descExpanded, setDescExpanded] = useState(false)
  const ci = catInfo(item.category)
  const isResolved = item.status === 'resolved'
  const isOwn = item.reporter?.id === currentUserId

  const itemDate = item.date ? new Date(item.date) : new Date(item.created_at || Date.now())
  const timeStr = isNaN(itemDate.getTime()) ? '' : itemDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

  const isLost = item.status === 'lost'
  const statusLabel = isLost ? 'LOST' : item.status === 'resolved' ? 'RESOLVED' : 'FOUND'
  const fallbackBg = isLost ? 'linear-gradient(135deg, #4F46E5, #818CF8)' : 'linear-gradient(135deg, #059669, #34d399)'

  return (
    <div style={{ background: '#fff', borderRadius: 24, border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s', opacity: isResolved ? 0.72 : 1 }}
      onMouseEnter={e => { if (!isResolved) e.currentTarget.style.transform = 'translateY(-4px)' }}
      onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
      <div style={{ height: 260, position: 'relative', background: fallbackBg, cursor: item.image_url ? 'zoom-in' : 'default' }} onClick={() => item.image_url && onClaim(item, 'view')}>
        {item.image_url ?
          <img src={item.image_url} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' } } /> :
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ci.icon size={64} color="rgba(255,255,255,0.2)" />
          </div>
        }
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 80, background: 'linear-gradient(to bottom, rgba(0,0,0,0.4), transparent)' }}></div>

        {!isResolved && (
          <div style={{ position: 'absolute', top: 16, left: 16, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <span style={{
              background: isLost ? '#f1f5f9' : '#14b8a6',
              color: isLost ? '#4f46e5' : '#ffffff',
              padding: '4px 12px',
              borderRadius: 20,
              fontSize: 10,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>{statusLabel}</span>
          </div>
        )}

        {isResolved && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: '#fff', borderRadius: 50, padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
              <CheckCircle2 size={18} color="#16a34a" /><span style={{ fontSize: 13, fontWeight: 800, color: '#15803d' }}>Resolved</span>
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
          <h3 style={{ margin: 0, ...pjs(18, 800, '24px', '#0f172a') }}>{item.title}</h3>
          <div style={{ background: ci.bg, color: ci.color, padding: '4px 12px', borderRadius: 10, ...inter(11, 700, '15px', ci.color), display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <ci.icon size={14} strokeWidth={2.5} /> {ci.label}
          </div>
        </div>

        {item.description && (
          <div style={{ marginBottom: 16, cursor: 'pointer' }} onClick={() => setDescExpanded(!descExpanded)}>
            <p style={{ margin: 0, ...pjs(14, 400, '22px', '#64748b'), ...(descExpanded ? {} : { display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }) }}>
              {item.description}
            </p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {item.location && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <MapPin size={14} color="#94a3b8" />
              <span style={pjs(13, 500, '18px', '#64748b')}>{item.location}</span>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar size={14} color="#94a3b8" />
            <span style={pjs(13, 500, '18px', '#64748b')}>{timeStr}</span>
          </div>
        </div>

        {item.reporter && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 'auto', marginBottom: 24, padding: '10px 14px', background: '#f8fafc', borderRadius: 16 }}>
            <Avatar name={item.reporter.full_name} url={item.reporter.avatar_url} size={28} />
            <span style={pjs(13, 600, '18px', '#475569')}>{item.reporter.full_name}</span>
          </div>
        )}

        <div style={{ marginTop: item.reporter ? 0 : 'auto', display: 'flex', gap: 12 }}>
          {!isResolved && !isOwn && item.reporter && (
            <>
              <button
                onClick={() => isLost ? onClaim(item) : onChat(item, item.reporter)}
                style={{
                  flex: 1, padding: '12px', borderRadius: 14, border: 'none',
                  background: '#4f46e5', color: '#fff',
                  ...pjs(14, 700, '20px', '#fff'), cursor: 'pointer', transition: 'all 0.2s',
                  boxShadow: '0 4px 12px rgba(79, 70, 229, 0.2)'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#4338ca'}
                onMouseLeave={e => e.currentTarget.style.background = '#4f46e5'}
              >
                {isLost ? 'This is Mine / Chat' : 'Contact Reporter'}
              </button>
              <button
                onClick={() => shareOnWhatsApp(item)}
                style={{ width: 44, height: 44, borderRadius: 14, background: '#dcfce7', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <svg viewBox="0 0 24 24" width="20" height="20" stroke="#16a34a" strokeWidth="2.5" fill="none"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
              </button>
            </>
          )}
          {isOwn && !isResolved && (
            <div style={{ flex: 1, padding: '12px', background: '#f8fafc', borderRadius: 14, textAlign: 'center', ...pjs(13, 700, '18px', '#94a3b8'), border: '1px solid #f1f5f9' }}>
              Your Post
            </div>
          )}
          {isResolved && (
            <div style={{ flex: 1, padding: '12px', background: '#f0fdf4', borderRadius: 14, textAlign: 'center', ...pjs(13, 700, '18px', '#16a34a'), border: '1px solid #dcfce7' }}>
              Resolved
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ClaimChatModal({ item, otherUser, currentUser, onClose, onSubmit, hasClaim }) {
  const [activeTab, setActiveTab] = useState(hasClaim ? 'chat' : 'claim')
  const [claimed, setClaimed] = useState(hasClaim || false)
  const [chatUnread, setChatUnread] = useState(0)
  const activeTabRef = useRef(activeTab)
  useEffect(() => { activeTabRef.current = activeTab }, [activeTab])
  // Claim form state
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: ci.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: ci.color }}>
                <ci.icon size={22} strokeWidth={2.5} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 16, color: '#0f172a' }}>{item.title}</div>
                <div style={{ fontSize: 13, color: '#64748b' }}>{item.location}</div>
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
  const [form, setForm] = useState(initial || { title: '', description: '', status: 'lost', category: 'other', location: '', date: new Date().toISOString().split('T')[0], image_url: '' })
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
      const payload = { title: form.title, description: form.description, status: form.status, category: form.category, location: form.location, date: form.date, image_url: imageUrl }
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
            {['lost', 'found'].map(s => (
              <button key={s} type="button" onClick={() => set('status', s)} style={{ flex: 1, padding: '12px', borderRadius: 12, border: '2px solid', borderColor: form.status === s ? (s === 'lost' ? '#c2410c' : '#15803d') : '#e2e8f0', background: form.status === s ? (s === 'lost' ? '#fff7ed' : '#f0fdf4') : '#fff', color: form.status === s ? (s === 'lost' ? '#c2410c' : '#15803d') : '#64748b', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                {s === 'lost' ? '😢 I Lost Something' : '😊 I Found Something'}
              </button>
            ))}
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 8 }}>Category</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {CATEGORIES.slice(1).map(c => {
                const isSel = form.category === c.value
                const Icon = c.icon
                return (
                  <button key={c.value} type="button" onClick={() => set('category', c.value)} 
                    style={{ 
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '8px 14px', borderRadius: 10, border: '1.5px solid', 
                      borderColor: isSel ? c.color : '#e2e8f0', 
                      background: isSel ? c.bg : '#fff', color: isSel ? c.color : '#64748b', 
                      fontSize: 12, fontWeight: 700, cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}>
                    <Icon size={14} strokeWidth={isSel ? 2.5 : 2} />
                    {c.label}
                  </button>
                )
              })}
            </div>
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 8 }}>Item Photo</label>
            {preview ? (
              <div style={{ position: 'relative', height: 180, borderRadius: 16, overflow: 'hidden', border: '1.5px solid #e2e8f0' }}>
                <img src={preview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.4)', opacity: 0, transition: 'opacity 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: 'default' }} 
                  onMouseEnter={e => e.currentTarget.style.opacity = 1}
                  onMouseLeave={e => e.currentTarget.style.opacity = 0}>
                  <button type="button" onClick={() => fileRef.current?.click()} style={{ padding: '8px 16px', borderRadius: 12, border: 'none', background: '#fff', color: '#0f172a', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Camera size={16} /> Change
                  </button>
                  <button type="button" onClick={() => { setPreview(''); set('image_url', '') }} style={{ width: 36, height: 36, borderRadius: 12, border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
                {uploading && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <div style={{ width: 24, height: 24, border: '2.5px solid #e2e8f0', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#4f46e5' }}>Uploading...</span>
                  </div>
                )}
              </div>
            ) : (
              <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                style={{ width: '100%', padding: '24px', borderRadius: 16, border: '2px dashed #e2e8f0', background: '#f8fafc', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#4f46e5'; e.currentTarget.style.background = '#f0f7ff' }} 
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f8fafc' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                  <Camera size={22} color={uploading ? '#cbd5e1' : '#64748b'} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>{uploading ? 'Processing...' : 'Upload Item Photo'}</span>
              </button>
            )}
            <input type="file" ref={fileRef} onChange={handleFile} accept="image/*" style={{ display: 'none' }} />
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
        <div style={{ width: 48, height: 48, borderRadius: 12, background: ci.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: ci.color, flexShrink: 0 }}>
          <ci.icon size={22} strokeWidth={2.5} />
        </div>
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
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          {item.status !== 'resolved' ? (
            <>
              <button onClick={() => onEdit(item)} style={{ padding: '8px 14px', borderRadius: 12, border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer', color: '#475569', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}><Edit2 size={14} />Edit</button>
              <button onClick={() => onResolve(item.id, item.status)} style={{ padding: '8px 14px', borderRadius: 12, border: 'none', background: '#f0fdf4', cursor: 'pointer', color: '#15803d', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}><CheckCircle2 size={14} />Resolve</button>
            </>
          ) : (
            <button onClick={() => onResolve(item.id, item.status)} style={{ padding: '8px 14px', borderRadius: 12, border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer', color: '#64748b', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}><RotateCcw size={14} />Unresolve</button>
          )}
          <button onClick={() => onDelete(item.id)} style={{ width: 40, height: 40, borderRadius: 12, border: '1.5px solid #fee2e2', background: '#fff', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={16} /></button>
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
  const [sortBy, setSortBy] = useState('recent')
  // claimChatTarget: item (for lost items — opens combined Claim+Chat modal)
  const [claimChatTarget, setClaimChatTarget] = useState(null)
  // chatTarget: { item, otherUser } (for found items — chat only)
  const [chatTarget, setChatTarget] = useState(null)
  const [reportTarget, setReportTarget] = useState(null)
  const [viewImageUrl, setViewImageUrl] = useState(null)

  useEffect(() => { const t = setTimeout(() => setDebouncedSearch(search), 350); return () => clearTimeout(t) }, [search])

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (catFilter !== 'all') params.set('category', catFilter)
      if (debouncedSearch) params.set('search', debouncedSearch)
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

  const lostCount = items.filter(i => i.status === 'lost').length
  const foundCount = items.filter(i => i.status === 'found').length
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
  const [confirmConfig, setConfirmConfig] = useState(null)

  const handleResolve = async (id, currentStatus) => {
    const isResolving = currentStatus !== 'resolved'
    setConfirmConfig({
      title: isResolving ? 'Mark as Resolved?' : 'Mark as Unresolved?',
      message: isResolving 
        ? 'This will hide the item from public browse and stop new claims.' 
        : 'This will make the item public again for browsing and claims.',
      confirmText: isResolving ? 'Confirm Resolve' : 'Make Public',
      type: isResolving ? 'success' : 'primary',
      onConfirm: async () => {
        const endpoint = isResolving ? 'resolve' : 'unresolve'
        await api.patch(`/api/lost-found/${id}/${endpoint}`)
        fetchMyItems(); fetchItems()
        setConfirmConfig(null)
      }
    })
  }

  const handleDelete = async (id) => {
    setConfirmConfig({
      title: 'Delete Post?',
      message: 'This action is permanent and cannot be undone. All claims will be removed.',
      confirmText: 'Delete Forever',
      type: 'danger',
      onConfirm: async () => {
        await api.delete(`/api/lost-found/${id}`)
        setMyItems(p => p.filter(i => i.id !== id))
        setItems(p => p.filter(i => i.id !== id))
        setConfirmConfig(null)
      }
    })
  }
  const handleClaimAction = async (itemId, claimId, action) => {
    const isApprove = action === 'approve'
    setConfirmConfig({
      title: isApprove ? 'Approve Claim?' : 'Reject Claim?',
      message: isApprove 
        ? 'This will verify the owner. You can still chat with them after approving.' 
        : 'This will remove the claim. The user can submit a new one if needed.',
      confirmText: isApprove ? 'Yes, Approve' : 'Yes, Reject',
      type: isApprove ? 'success' : 'danger',
      onConfirm: async () => {
        await api.patch(`/api/lost-found/${itemId}/claim/${claimId}`, { action })
        fetchMyItems(); fetchItems()
        setConfirmConfig(null)
      }
    })
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
      
      <ImageModal url={viewImageUrl} onClose={() => setViewImageUrl(null)} />
      
      <CustomConfirmModal 
        open={!!confirmConfig}
        {...confirmConfig}
        onCancel={() => setConfirmConfig(null)}
      />


      {/* Premium Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        padding: '20px 28px', borderRadius: 24,
        boxShadow: '0 10px 30px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9',
        gap: 24, flexWrap: 'wrap', marginBottom: 8
      }}>
        <div>
          <h1 style={{ ...pjs(28, 800, '36px', '#0f172a'), margin: 0 }}>Lost & Found</h1>
          <p style={{ ...pjs(14, 400, '22px', '#64748b'), marginTop: 4 }}>Report lost items or help return found items to the community.</p>
        </div>
        <button
          onClick={() => setReportTarget({})}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '14px 28px', borderRadius: 16,
            background: '#4f46e5', color: '#fff', border: 'none',
            ...pjs(15, 700, '22px', '#fff'), cursor: 'pointer',
            boxShadow: '0 8px 20px rgba(79, 70, 229, 0.25)',
            transition: 'all 0.2s'
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.background = '#4338ca' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = '#4f46e5' }}
        >
          <Plus size={18} strokeWidth={2.5} /> <span>Report New Item</span>
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 8, padding: 4, background: '#f1f5f9', borderRadius: 18, width: 'fit-content' }}>
        {[
          { id: 'browse', label: 'Browse Items', icon: Package },
          { id: 'claimed', label: 'My Claims', count: myClaims.length, icon: CheckCircle2 },
          { id: 'mine', label: 'My Posts', count: myItems.length, icon: PlusSquare },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '6px 14px', borderRadius: 14,
              background: tab === t.id ? '#fff' : 'transparent',
              border: 'none', cursor: 'pointer',
              ...pjs(14, tab === t.id ? 800 : 500, '20px', tab === t.id ? '#4f46e5' : '#64748b'),
              boxShadow: tab === t.id ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            <t.icon size={16} strokeWidth={tab === t.id ? 2.5 : 2} />
            {t.label}
            {!!t.count && (
              <span style={{
                background: tab === t.id ? '#4f46e5' : '#cbd5e1',
                color: '#fff', fontSize: 11, fontWeight: 700,
                padding: '2px 8px', borderRadius: 8, marginLeft: 4
              }}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === 'browse' && (
        <>
          <div style={{ background: '#fff', borderRadius: 28, border: '1px solid #f1f5f9', padding: '24px', marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 20, boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
              {/* Search */}
              <div style={{ position: 'relative', flex: '1 1 300px', maxWidth: 400 }}>
                <svg style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} width="15" height="15" viewBox="0 0 15 15" fill="none">
                  <circle cx="6.5" cy="6.5" r="5.5" stroke="#94a3b8" strokeWidth="1.3"/>
                  <path d="M11 11l3 3" stroke="#94a3b8" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
                <input
                  placeholder="Search items, areas, descriptions..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{
                    width: '100%', padding: '12px 16px 12px 42px',
                    background: '#fff', border: '1.5px solid #f1f5f9', borderRadius: 14,
                    ...pjs(14, 400, '20px', '#0f172a'), outline: 'none',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                    boxSizing: 'border-box'
                  }}
                />
                {search && <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}><X size={18} color="#94a3b8" /></button>}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                {/* Status Switcher */}
                <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 14, padding: 4 }}>
                  {['all', 'lost', 'found', 'resolved'].map(s => {
                    const isSelected = statusFilter === s
                    const lbl = s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)
                    const col = s === 'all' ? '#4f46e5' : STATUS_CONFIG[s].color
                    return (
                      <button key={s} onClick={() => setStatusFilter(s)}
                        style={{
                          padding: '8px 18px', borderRadius: 11, border: 'none',
                          background: isSelected ? '#fff' : 'transparent',
                          color: isSelected ? col : '#64748b',
                          ...pjs(13, isSelected ? 800 : 500, '18px', isSelected ? col : '#64748b'),
                          cursor: 'pointer',
                          boxShadow: isSelected ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                          transition: 'all 0.2s'
                        }}>
                        {lbl}
                      </button>
                    )
                  })}
                </div>

                {/* Sort Dropdown */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#f8fafc', border: '1px solid #e2e8f0', padding: '8px 16px', borderRadius: 14 }}>
                  <span style={pjs(13, 600, '18px', '#94a3b8')}>Sort:</span>
                  <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ border: 'none', background: 'transparent', ...pjs(13, 700, '18px', '#0f172a'), outline: 'none', cursor: 'pointer' }}>
                    <option value="recent">Newest First</option>
                    <option value="oldest">Oldest First</option>
                  </select>
                </div>
              </div>
            </div>

            <div style={{ height: 1, background: '#f1f5f9' }} />

            {/* Category Chips */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {CATEGORIES.map(c => {
                const isSelected = catFilter === c.value
                const Icon = c.icon
                return (
                  <button key={c.value} onClick={() => setCatFilter(c.value)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '8px 18px', borderRadius: 12, border: '1.5px solid',
                      borderColor: isSelected ? c.color : '#e2e8f0',
                      background: isSelected ? c.bg : '#fff',
                      ...pjs(13, isSelected ? 700 : 500, '18px', isSelected ? c.color : '#64748b'),
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => !isSelected && (e.currentTarget.style.borderColor = c.color)}
                    onMouseLeave={e => !isSelected && (e.currentTarget.style.borderColor = '#e2e8f0')}>
                    <Icon size={16} strokeWidth={isSelected ? 2.5 : 2} />
                    {c.label}
                  </button>
                )
              })}
            </div>
          </div>

          {(() => {
            const sortedItems = [...items].sort((a, b) => {
              const dA = new Date(a.date || a.created_at).getTime()
              const dB = new Date(b.date || b.created_at).getTime()
              return sortBy === 'recent' ? dB - dA : dA - dB
            })

            return loading ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8', fontSize: 14 }}>Loading items...</div>
            ) : sortedItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <Package size={44} style={{ opacity: 0.2, margin: '0 auto 14px', display: 'block' }} />
                <p style={{ fontSize: 15, color: '#64748b', fontWeight: 600 }}>No items found</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
                {sortedItems.map(item => (
                  <ItemCard key={item.id} item={item} currentUserId={user?.id} onClaim={(item, mode) => mode === 'view' ? setViewImageUrl(item.image_url) : setClaimChatTarget(item)} onChat={(item, otherUser) => setChatTarget({ item, otherUser })} />
                ))}
              </div>
            )
          })()}
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
                <div key={claim.id} style={{ background: '#fff', borderRadius: 24, border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', overflow: 'hidden', marginBottom: 16 }}>
                  <div style={{ padding: '24px', display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                    {/* Item Image or Icon */}
                    <div style={{ width: 80, height: 80, borderRadius: 18, background: ci.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden', cursor: item.image_url ? 'zoom-in' : 'default' }} onClick={() => item.image_url && setViewImageUrl(item.image_url)}>
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <ci.icon size={32} color={ci.color} strokeWidth={2.5} />
                      )}
                    </div>
                    
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                        <span style={{ fontWeight: 800, fontSize: 17, color: '#0f172a' }}>{item.title}</span>
                        <StatusBadge status={item.status} />
                        <span style={{ background: cs.bg, color: cs.color, border: `1.5px solid ${cs.border}`, padding: '3px 12px', borderRadius: 20, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{cs.label}</span>
                      </div>
                      
                      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
                        {item.location && <span style={{ fontSize: 13, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}><MapPin size={14} />{item.location}</span>}
                        {item.date && <span style={{ fontSize: 13, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}><Calendar size={14} />{new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>}
                      </div>

                      <div style={{ background: '#f8fafc', borderRadius: 16, padding: '16px', marginBottom: 16, borderLeft: `4px solid ${cs.border}` }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Your claim details</div>
                        <p style={{ fontSize: 14, color: '#334155', margin: 0, lineHeight: '22px' }}>{claim.message}</p>
                      </div>

                      {claim.admin_note && (
                        <div style={{ background: claim.status === 'approved' ? '#f0fdf4' : '#fef2f2', borderRadius: 12, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: claim.status === 'approved' ? '#15803d' : '#dc2626', border: '1px solid', borderColor: claim.status === 'approved' ? '#bbf7d0' : '#fecaca' }}>
                          <strong>Note:</strong> {claim.admin_note}
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                        <div style={{ display: 'flex', gap: 10 }}>
                          {item.reporter && item.status !== 'resolved' && (
                            <button
                              onClick={() => setClaimChatTarget({ ...item, claims: [{ ...claim, claimer_id: user?.id }] })}
                              style={{ padding: '10px 20px', borderRadius: 14, border: 'none', background: '#4f46e5', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 12px rgba(79, 70, 229, 0.2)' }}>
                              <MessageCircle size={16} /> Chat with Reporter
                            </button>
                          )}
                          {claim.proof_url && (
                            <a href={claim.proof_url} target="_blank" rel="noopener noreferrer" style={{ padding: '10px 20px', borderRadius: 14, border: '1.5px solid #e2e8f0', background: '#fff', color: '#475569', fontSize: 14, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
                              View Proof
                            </a>
                          )}
                        </div>

                          {/* Reporter Profile Info */}
                        {item.reporter && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 14px', background: '#f1f5f9', borderRadius: 14 }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Reporter:</span>
                            <Avatar name={item.reporter.full_name} url={item.reporter.avatar_url} size={24} />
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{item.reporter.full_name}</span>
                          </div>
                        )}
                      </div>
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
