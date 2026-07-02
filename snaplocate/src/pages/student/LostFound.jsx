import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import PageLayout from '../../components/PageLayout'
import { useAuth } from '../../context/AuthContext'
import api from '../../lib/api'
import LFChatModal from '../../components/LFChatModal'
import {
  Plus, Search, X, ChevronDown, ChevronUp,
  MapPin, Calendar, User, AlertCircle, CheckCircle2,
  Package, Trash2, Edit2, Camera, Clock, MessageCircle, PlusSquare,
  MonitorSmartphone, Key, Book, Shirt, Backpack, Wallet, Activity, Box, LayoutGrid, Contact, RotateCcw, Eye
} from 'lucide-react'

const CATEGORIES = [
  { value: 'all',         label: 'All',         icon: LayoutGrid,      color: '#4f46e5', bg: '#eef2ff' },
  { value: 'electronics', label: 'Electronics',  icon: MonitorSmartphone, color: '#4f46e5', bg: '#eef2ff' },
  { value: 'keys',        label: 'Keys',         icon: Key,             color: '#d97706', bg: '#fffbeb' },
  { value: 'id_card',     label: 'ID Card',      icon: Contact,         color: '#2563eb', bg: '#eff6ff' },
  { value: 'clothing',    label: 'Clothing',     icon: Shirt,           color: '#db2777', bg: '#fdf2f8' },
  { value: 'books',       label: 'Books',        icon: Book,            color: '#16a34a', bg: '#f0fdf4' },
  { value: 'bag',         label: 'Bag',          icon: Backpack,        color: '#ea580c', bg: '#fff7ed' },
  { value: 'wallet',      label: 'Wallet',       icon: Wallet,          color: '#ca8a04', bg: '#fefce8' },
  { value: 'jewellery',   label: 'Jewellery',    icon: Activity,        color: '#9333ea', bg: '#faf5ff' },
  { value: 'sports',      label: 'Sports',       icon: Activity,        color: '#0d9488', bg: '#f0fdfa' },
  { value: 'other',       label: 'Other',        icon: Box,             color: '#64748b', bg: '#f8fafc' },
]
const catInfo = (v) => CATEGORIES.find(c => c.value === v) || CATEGORIES[CATEGORIES.length - 1]

const STATUS_CONFIG = {
  lost:     { label: 'Lost',     bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' },
  found:    { label: 'Found',    bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
  resolved: { label: 'Resolved', bg: '#f0f9ff', color: '#0369a1', border: '#bae6fd' },
}

/* ── Shared sub-components ── */

function Avatar({ name, url, size = 32 }) {
  const initials = (name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  if (url) return <img src={url} alt={name} className="rounded-full object-cover shrink-0" style={{ width: size, height: size }} />
  return (
    <div
      className="rounded-full bg-brand-soft text-brand font-bold flex items-center justify-center shrink-0 font-jakarta"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials}
    </div>
  )
}

function StatusBadge({ status }) {
  const cls = { lost: 'badge badge-warning', found: 'badge badge-success', resolved: 'badge badge-info' }
  const label = { lost: 'Lost', found: 'Found', resolved: 'Resolved' }
  return <span className={cls[status] || cls.lost}>{label[status] || 'Lost'}</span>
}

function CatBadge({ category }) {
  const c = catInfo(category)
  const Icon = c.icon
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold font-jakarta"
      style={{ background: c.bg, color: c.color }}
    >
      <Icon size={12} strokeWidth={2.5} /> {c.label}
    </span>
  )
}

function CustomConfirmModal({ open, title, message, onConfirm, onCancel, confirmText = 'Confirm', type = 'danger' }) {
  if (!open) return null
  const isDanger  = type === 'danger'
  const isSuccess = type === 'success'
  return createPortal(
    <div className="fixed inset-0 bg-ink/40 backdrop-blur-[8px] z-[2000] flex items-center justify-center p-5">
      <div className="bg-white rounded-[28px] px-8 pt-8 pb-6 w-full max-w-sm shadow-[0_24px_64px_rgba(0,0,0,0.18)] border border-slate-100 text-center">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 ${isDanger ? 'bg-danger-light' : isSuccess ? 'bg-success-light' : 'bg-brand-light'}`}>
          {isDanger   ? <AlertCircle size={32} className="text-danger" />
          : isSuccess ? <CheckCircle2 size={32} className="text-success" />
          :             <RotateCcw   size={32} className="text-brand" />}
        </div>
        <h3 className="t-heading-xl t-primary mb-2.5">{title}</h3>
        <p  className="t-base t-secondary mb-7">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel}  className="flex-1 py-3.5 rounded-2xl border border-ink-border bg-white t-heading-md t-muted cursor-pointer">Cancel</button>
          <button onClick={onConfirm} className={`flex-1 py-3.5 rounded-2xl border-none text-white t-heading-md cursor-pointer ${isDanger ? 'bg-danger shadow-[0_8px_20px_rgba(220,38,38,0.25)]' : 'bg-brand shadow-[0_8px_20px_rgba(79,70,229,0.25)]'}`}>{confirmText}</button>
        </div>
      </div>
    </div>,
    document.body
  )
}

function ImageModal({ url, onClose }) {
  if (!url) return null
  return createPortal(
    <div className="fixed inset-0 bg-[rgba(15,23,42,0.92)] backdrop-blur-[12px] z-[3000] flex items-center justify-center p-5" onClick={onClose}>
      <button className="absolute top-[30px] right-[30px] bg-white/10 border-none rounded-[14px] p-3 cursor-pointer text-white"><X size={24} /></button>
      <img src={url} alt="full view" className="max-w-[95vw] max-h-[90vh] rounded-3xl shadow-[0_24px_64px_rgba(0,0,0,0.4)] object-contain" onClick={e => e.stopPropagation()} />
    </div>,
    document.body
  )
}

function shareOnWhatsApp(item) {
  const status = item.status === 'lost' ? 'LOST' : item.status === 'found' ? 'FOUND' : 'RESOLVED'
  const text = `🔍 ${status} on SnapLocate Campus\n\n*${item.title}*\n📍 ${item.location || 'Campus'}\n📅 ${item.date ? new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}\n\nIf you know anything, contact via SnapLocate app.`
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
}

function ItemCard({ item, currentUserId, isGuest, onClaim, onChat }) {
  const [descExpanded, setDescExpanded] = useState(false)
  const ci = catInfo(item.category)
  const ageInDays = (Date.now() - new Date(item.created_at || Date.now()).getTime()) / (1000 * 60 * 60 * 24)
  const isAdminItem   = item.reporter?.role === 'admin'
  const isAutoResolved = isAdminItem && ageInDays > 20 && item.status !== 'resolved'
  const isResolved    = item.status === 'resolved' || isAutoResolved
  const isOwn         = item.reporter?.id === currentUserId
  const isLost        = item.status === 'lost'
  const statusLabel   = isLost ? 'LOST' : item.status === 'resolved' ? 'RESOLVED' : 'FOUND'
  const fallbackBg    = isLost ? 'linear-gradient(135deg, #4F46E5, #818CF8)' : 'linear-gradient(135deg, #059669, #34d399)'

  const itemDate = item.date ? new Date(item.date) : new Date(item.created_at || Date.now())
  const timeStr  = isNaN(itemDate.getTime()) ? '' : itemDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <div
      className={`bg-white rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col transition-all duration-200 ${isResolved ? 'opacity-[0.72]' : 'hover:-translate-y-1'}`}
    >
      {/* Image area */}
      <div
        className="h-[260px] relative"
        style={{ background: fallbackBg, cursor: item.image_url ? 'zoom-in' : 'default' }}
        onClick={() => item.image_url && onClaim(item, 'view')}
      >
        {item.image_url
          ? <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center"><ci.icon size={64} color="rgba(255,255,255,0.2)" /></div>
        }
        <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-black/40 to-transparent" />

        {!isResolved && (
          <div className="absolute top-4 left-4">
            <span className={`text-[10px] font-extrabold uppercase tracking-[0.05em] px-3 py-1 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.1)] ${isLost ? 'bg-slate-100 text-brand' : 'bg-teal-500 text-white'}`}>
              {statusLabel}
            </span>
          </div>
        )}

        {isResolved && (
          <div className="absolute inset-0 bg-white/40 flex items-center justify-center">
            <div className="bg-white rounded-full px-4 py-2.5 flex items-center gap-2 shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
              <CheckCircle2 size={18} className="text-success" />
              <span className="text-[13px] font-extrabold text-success-dark">Resolved</span>
            </div>
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="p-6 flex flex-col flex-1">
        <div className="flex justify-between items-start gap-3 mb-3">
          <h3 className="m-0 t-heading-lg t-primary">{item.title}</h3>
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[10px] text-[11px] font-bold font-inter shrink-0"
            style={{ background: ci.bg, color: ci.color }}
          >
            <ci.icon size={14} strokeWidth={2.5} /> {ci.label}
          </span>
        </div>

        {item.description && (
          <div className="mb-4 cursor-pointer" onClick={() => setDescExpanded(!descExpanded)}>
            <p className={`m-0 t-base t-secondary ${descExpanded ? '' : 'line-clamp-2'}`}>{item.description}</p>
          </div>
        )}

        <div className="flex flex-col gap-2.5 mb-5">
          {item.location && (
            <div className="flex items-center gap-2">
              <MapPin size={14} className="text-ink-subtle shrink-0" />
              <span className="t-md font-medium t-secondary">{item.location}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-ink-subtle shrink-0" />
            <span className="t-md font-medium t-secondary">{timeStr}</span>
          </div>
        </div>

        {item.reporter && (
          <div className="flex items-center gap-2.5 mt-auto mb-6 px-3.5 py-2.5 bg-surface rounded-2xl">
            <Avatar name={item.reporter.full_name} url={item.reporter.avatar_url} size={28} />
            <span className="t-label-md t-muted">{item.reporter.full_name}</span>
          </div>
        )}

        <div className={`${item.reporter ? '' : 'mt-auto'} flex gap-3`}>
          {!isResolved && !isOwn && item.reporter && !isGuest && (
            <>
              {item.reporter.role === 'admin' ? (
                <div className="flex-1 py-3 px-3 rounded-2xl border border-ink-border bg-surface t-label-md t-secondary flex items-center justify-center gap-1.5 text-center cursor-not-allowed"
                  title="This item was reported by the admin office. Please contact them directly.">
                  <AlertCircle size={16} /> Contact Thapar Admin Office
                </div>
              ) : (
                <button
                  onClick={() => isLost ? onClaim(item) : onChat(item, item.reporter)}
                  className="flex-1 py-3 rounded-2xl border-none bg-brand text-white t-heading-md cursor-pointer transition-all duration-200 shadow-[0_4px_12px_rgba(79,70,229,0.2)] hover:bg-brand-dark"
                >
                  {isLost ? 'This is Mine / Chat' : 'Contact Reporter'}
                </button>
              )}
              <button
                onClick={() => shareOnWhatsApp(item)}
                className="w-11 h-11 rounded-2xl bg-success-soft border-none flex items-center justify-center cursor-pointer shrink-0"
                title="Share on WhatsApp"
              >
                <svg viewBox="0 0 24 24" width="20" height="20" stroke="#16a34a" strokeWidth="2.5" fill="none">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                </svg>
              </button>
            </>
          )}
          {isOwn && !isResolved && (
            <div className="flex-1 py-3 bg-surface rounded-2xl text-center t-label-md t-subtle border border-slate-100">Your Post</div>
          )}
          {isResolved && (
            <div className="flex-1 py-3 bg-success-light rounded-2xl text-center t-label-md text-success border border-success-soft">
              {isAutoResolved ? (
                <div className="flex flex-col items-center gap-0.5">
                  <span>Resolved (20 Days)</span>
                  <span className="text-[10px] font-semibold text-success-dark">Item may still be in Admin Office</span>
                </div>
              ) : 'Resolved'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ClaimChatModal({ item, otherUser, currentUser, onClose, onSubmit, hasClaim }) {
  const [activeTab, setActiveTab]   = useState(hasClaim ? 'chat' : 'claim')
  const [claimed, setClaimed]       = useState(hasClaim || false)
  const [chatUnread, setChatUnread] = useState(0)
  const activeTabRef = useRef(activeTab)
  useEffect(() => { activeTabRef.current = activeTab }, [activeTab])
  const [message, setMessage]   = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]       = useState('')
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
      if (msg.toLowerCase().includes('already') || msg.includes('23505') || msg.toLowerCase().includes('unique')) {
        setClaimed(true); switchToChat()
      } else {
        setError(msg || 'Failed to submit claim. Please try again.')
      }
    } finally { setSubmitting(false) }
  }

  return createPortal(
    <div className="fixed inset-0 bg-ink/50 z-[2000] flex items-center justify-center p-5">
      <div className="bg-white rounded-[22px] w-full max-w-[500px] shadow-[0_24px_64px_rgba(0,0,0,0.18)] max-h-[92vh] flex flex-col overflow-hidden">

        {/* Modal header */}
        <div className="px-6 pt-5 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: ci.bg, color: ci.color }}>
                <ci.icon size={22} strokeWidth={2.5} />
              </div>
              <div>
                <div className="font-extrabold text-base t-primary">{item.title}</div>
                <div className="t-md t-secondary">{item.location}</div>
              </div>
            </div>
            <button onClick={onClose} className="bg-surface-muted border-none rounded-[10px] p-2 cursor-pointer"><X size={18} className="t-secondary" /></button>
          </div>

          {/* Tabs */}
          <div className="flex border-b-2 border-slate-100">
            {[
              { id: 'claim', label: claimed ? <><CheckCircle2 size={13} className="text-success inline" /> Claimed</> : 'Claim This Item' },
              { id: 'chat',  label: 'Chat with Reporter' },
            ].map(t => (
              <button
                key={t.id}
                onClick={t.id === 'chat' ? switchToChat : () => setActiveTab('claim')}
                className={`px-[18px] py-2.5 bg-transparent border-none cursor-pointer t-md flex items-center gap-1.5 relative -mb-0.5 border-b-2 ${activeTab === t.id ? 'font-bold text-brand border-brand' : 'font-medium t-secondary border-transparent'}`}
              >
                {t.label}
                {t.id === 'chat' && chatUnread > 0 && (
                  <span className="bg-red-500 text-white rounded-[10px] px-1.5 text-[10px] font-extrabold leading-4">{chatUnread}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Claim tab */}
        {activeTab === 'claim' && (
          <div className="p-6 overflow-y-auto flex-1">
            {claimed ? (
              <div className="flex flex-col items-center py-8 gap-3.5">
                <div className="w-14 h-14 rounded-full bg-success-light border-2 border-success-border flex items-center justify-center">
                  <CheckCircle2 size={28} className="text-success" />
                </div>
                <div className="text-center">
                  <div className="font-extrabold text-base t-primary mb-1.5">Claim Submitted!</div>
                  <p className="t-md t-secondary m-0 max-w-[280px] leading-[19px]">Your claim is under review. Chat with the reporter for quick updates.</p>
                </div>
                <button onClick={switchToChat} className="mt-1 px-6 py-2.5 rounded-xl border-none bg-brand text-white t-heading-md cursor-pointer flex items-center gap-2">
                  <MessageCircle size={15} /> Open Chat
                </button>
              </div>
            ) : (
              <>
                <p className="t-md t-secondary mb-4">Describe why this item belongs to you. The reporter will review your claim.</p>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div>
                    <label className="t-label-md t-light block mb-1.5">
                      Why is this yours? * <span className="font-normal t-subtle">({message.length}/1000)</span>
                    </label>
                    <textarea
                      value={message} onChange={e => setMessage(e.target.value)}
                      placeholder="Describe identifying details — serial number, what's inside, unique marks, when/where you lost it..."
                      rows={4} required
                      className="input resize-y"
                      onFocus={e => e.target.style.borderColor = '#4f46e5'} onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                    />
                    {message.length > 0 && message.length < 20 && <p className="text-[11px] text-amber-500 mt-1">Need {20 - message.length} more characters</p>}
                  </div>
                  {error && <div className="px-3.5 py-2.5 rounded-[10px] bg-danger-light text-danger t-md">{error}</div>}
                  <div className="flex gap-2.5">
                    <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-[10px] border border-ink-border bg-white t-base font-semibold cursor-pointer t-muted">Cancel</button>
                    <button type="submit" disabled={submitting || message.length < 20}
                      className={`flex-[2] py-2.5 rounded-[10px] border-none text-white t-heading-md ${submitting || message.length < 20 ? 'bg-brand-border cursor-not-allowed' : 'bg-brand cursor-pointer'}`}>
                      {submitting ? 'Submitting...' : 'Submit Claim'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        )}

        {/* Chat tab — always mounted */}
        <div className={`flex-1 overflow-hidden flex-col ${activeTab === 'chat' ? 'flex' : 'hidden'}`}>
          <LFChatModal
            item={item} otherUser={otherUser} currentUser={currentUser} onClose={onClose}
            embedded={true}
            onConvReady={id => { convIdRef.current = id }}
            onNewMessage={() => { if (activeTabRef.current !== 'chat') setChatUnread(n => n + 1) }}
          />
        </div>
      </div>
    </div>,
    document.body
  )
}

function ReportModal({ initial, onClose, onSaved }) {
  const isEdit  = !!initial?.id
  const [form, setForm]     = useState(initial || { title: '', description: '', status: 'lost', category: 'other', location: '', date: new Date().toISOString().split('T')[0], image_url: '' })
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [preview, setPreview]     = useState(initial?.image_url || '')
  const [error, setError]   = useState('')
  const fileRef = useRef()
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleFile = async (e) => {
    const file = e.target.files[0]; if (!file) return
    e.target.value = ''
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
    } finally { setUploading(false) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title) { setError('Item name is required'); return }
    setSaving(true); setError('')
    try {
      const imageUrl = form.image_url && !form.image_url.startsWith('blob:') ? form.image_url : undefined
      const payload = { title: form.title, description: form.description, status: form.status, category: form.category, location: form.location, date: form.date, image_url: imageUrl }
      const res = isEdit ? await api.patch(`/api/lost-found/${initial.id}`, payload) : await api.post('/api/lost-found', payload)
      if (!res.success) throw new Error(res.error || 'Failed')
      onSaved(res.data, isEdit)
    } catch (err) { setError(err.message) } finally { setSaving(false) }
  }

  return createPortal(
    <div className="fixed inset-0 bg-ink/50 z-[2000] flex items-center justify-center p-5">
      <div className="bg-white rounded-[22px] p-8 w-full max-w-[520px] shadow-[0_24px_64px_rgba(0,0,0,0.18)] max-h-[92vh] overflow-y-auto">

        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="t-heading-lg t-primary m-0">{isEdit ? 'Edit Post' : 'Report Item'}</h2>
            <p className="t-md t-secondary mt-1 mb-0">{isEdit ? 'Update your report' : 'Lost or found something? Let people know.'}</p>
          </div>
          <button onClick={onClose} className="bg-surface-muted border-none rounded-[10px] p-2 cursor-pointer shrink-0"><X size={18} className="t-secondary" /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Lost / Found toggle */}
          <div className="flex gap-2.5">
            {['lost', 'found'].map(s => (
              <button key={s} type="button" onClick={() => set('status', s)}
                className="flex-1 py-3 rounded-xl border-2 t-heading-md cursor-pointer transition-all"
                style={{
                  borderColor: form.status === s ? (s === 'lost' ? '#c2410c' : '#15803d') : '#e2e8f0',
                  background:  form.status === s ? (s === 'lost' ? '#fff7ed' : '#f0fdf4') : '#fff',
                  color:       form.status === s ? (s === 'lost' ? '#c2410c' : '#15803d') : '#64748b',
                }}
              >
                {s === 'lost' ? '😢 I Lost Something' : '😊 I Found Something'}
              </button>
            ))}
          </div>

          {/* Category */}
          <div>
            <label className="t-label-md t-light block mb-2">Category</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.slice(1).map(c => {
                const isSel = form.category === c.value
                const Icon  = c.icon
                return (
                  <button key={c.value} type="button" onClick={() => set('category', c.value)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] border text-xs font-bold cursor-pointer transition-all"
                    style={{
                      borderColor: isSel ? c.color : '#e2e8f0',
                      background:  isSel ? c.bg   : '#fff',
                      color:       isSel ? c.color : '#64748b',
                    }}
                  >
                    <Icon size={14} strokeWidth={isSel ? 2.5 : 2} /> {c.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Photo */}
          <div>
            <label className="t-label-md t-light block mb-2">Item Photo</label>
            {preview ? (
              <div className="relative h-[180px] rounded-2xl overflow-hidden border border-ink-border">
                <img src={preview} alt="preview" className="w-full h-full object-cover" />
                <div
                  className="absolute inset-0 bg-ink/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2.5 cursor-default"
                >
                  <button type="button" onClick={() => fileRef.current?.click()} className="px-4 py-2 rounded-xl border-none bg-white t-primary t-md font-bold cursor-pointer flex items-center gap-1.5"><Camera size={16} /> Change</button>
                  <button type="button" onClick={() => { setPreview(''); set('image_url', '') }} className="w-9 h-9 rounded-xl border-none bg-red-500 text-white cursor-pointer flex items-center justify-center"><Trash2 size={16} /></button>
                </div>
                {uploading && (
                  <div className="absolute inset-0 bg-white/85 flex flex-col items-center justify-center gap-2">
                    <div className="w-6 h-6 rounded-full border-[2.5px] border-slate-200 border-t-brand animate-spin" />
                    <span className="t-sm font-bold text-brand">Uploading...</span>
                  </div>
                )}
              </div>
            ) : (
              <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                className="w-full py-6 rounded-2xl border-2 border-dashed border-ink-border bg-surface cursor-pointer flex flex-col items-center gap-2 transition-all hover:border-brand hover:bg-[#f0f7ff]"
              >
                <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
                  <Camera size={22} className={uploading ? 'text-slate-300' : 't-secondary'} />
                </div>
                <span className="t-md font-semibold t-secondary">{uploading ? 'Processing...' : 'Upload Item Photo'}</span>
              </button>
            )}
            <input type="file" ref={fileRef} onChange={handleFile} accept="image/*" className="hidden" />
          </div>

          {/* Item name */}
          <div>
            <label className="t-label-md t-light block mb-1.5">Item Name *</label>
            <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Black HP Laptop" required className="input"
              onFocus={e => e.target.style.borderColor = '#4f46e5'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
          </div>

          {/* Location + Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="t-label-md t-light block mb-1.5">Location / Area</label>
              <input value={form.location} onChange={e => set('location', e.target.value)} placeholder="e.g. Library Block" className="input"
                onFocus={e => e.target.style.borderColor = '#4f46e5'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
            </div>
            <div>
              <label className="t-label-md t-light block mb-1.5">Date</label>
              <input type="date" value={form.date} onChange={e => set('date', e.target.value)} className="input"
                onFocus={e => e.target.style.borderColor = '#4f46e5'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="t-label-md t-light block mb-1.5">Description <span className="font-normal t-subtle">(optional)</span></label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3}
              placeholder="Color, brand, unique marks, what's inside..." className="input resize-y"
              onFocus={e => e.target.style.borderColor = '#4f46e5'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
          </div>

          {error && <div className="px-3.5 py-2.5 rounded-[10px] bg-danger-light text-danger t-md">{error}</div>}

          <div className="flex gap-2.5">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-[10px] border border-ink-border bg-white t-base font-semibold cursor-pointer t-muted">Cancel</button>
            <button type="submit" disabled={saving}
              className={`flex-[2] py-2.5 rounded-[10px] border-none text-white t-heading-md ${saving ? 'bg-brand-border cursor-not-allowed' : 'bg-brand cursor-pointer'}`}>
              {saving ? 'Posting...' : isEdit ? 'Save Changes' : 'Post Report'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}

function MyPostCard({ item, onView, onEdit, onDelete, onResolve, onClaimAction, onChat }) {
  const [expanded, setExpanded] = useState(false)
  const ci = catInfo(item.category)
  const pendingClaims = (item.claims || []).filter(c => c.status === 'pending')

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.03)] overflow-hidden">
      <div className="px-5 py-4 flex items-start gap-3.5">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: ci.bg, color: ci.color }}>
          <ci.icon size={22} strokeWidth={2.5} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-bold text-[15px] t-primary">{item.title}</span>
            <StatusBadge status={item.status} />
            <CatBadge category={item.category} />
          </div>
          <div className="flex gap-3 flex-wrap">
            {item.location && <span className="t-sm t-secondary flex items-center gap-1"><MapPin size={11} />{item.location}</span>}
            {item.date     && <span className="t-sm t-secondary flex items-center gap-1"><Calendar size={11} />{new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>}
            <span className="t-sm t-subtle flex items-center gap-1"><Clock size={11} />{new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>
        </div>

        {/* Action buttons — wrap on mobile */}
        <div className="flex gap-2 shrink-0 flex-wrap justify-end">
          <button onClick={() => onView(item)} className="px-3.5 py-2 rounded-xl border border-ink-border bg-white cursor-pointer t-muted t-md font-bold flex items-center gap-1.5"><Eye size={14} />View</button>
          {item.status !== 'resolved' ? (
            <>
              <button onClick={() => onEdit(item)} className="px-3.5 py-2 rounded-xl border border-ink-border bg-white cursor-pointer t-muted t-md font-bold flex items-center gap-1.5"><Edit2 size={14} />Edit</button>
              <button onClick={() => onResolve(item.id, item.status)} className="px-3.5 py-2 rounded-xl border-none bg-success-light cursor-pointer text-success-dark t-md font-bold flex items-center gap-1.5"><CheckCircle2 size={14} />Resolve</button>
            </>
          ) : (
            <button onClick={() => onResolve(item.id, item.status)} className="px-3.5 py-2 rounded-xl border border-ink-border bg-white cursor-pointer t-secondary t-md font-bold flex items-center gap-1.5"><RotateCcw size={14} />Unresolve</button>
          )}
          <button onClick={() => onDelete(item.id)} className="w-10 h-10 rounded-xl border border-danger-border bg-white cursor-pointer text-danger-alt flex items-center justify-center"><Trash2 size={16} /></button>
        </div>
      </div>

      {(item.claims || []).length > 0 && (
        <div className="border-t border-slate-100">
          <button onClick={() => setExpanded(!expanded)}
            className={`w-full px-5 py-2.5 border-none cursor-pointer flex items-center justify-between ${pendingClaims.length > 0 ? 'bg-warning-light' : 'bg-surface'}`}>
            <span className={`t-md font-semibold flex items-center gap-1.5 ${pendingClaims.length > 0 ? 'text-[#92400e]' : 't-secondary'}`}>
              {pendingClaims.length > 0 ? <AlertCircle size={14} className="text-amber-500" /> : <User size={14} />}
              {item.claims.length} Claim{item.claims.length !== 1 ? 's' : ''}{pendingClaims.length > 0 ? ` (${pendingClaims.length} pending)` : ''}
            </span>
            {expanded ? <ChevronUp size={16} className="t-subtle" /> : <ChevronDown size={16} className="t-subtle" />}
          </button>

          {expanded && (
            <div className="px-5 pt-3 pb-4 flex flex-col gap-3">
              {item.claims.map(claim => (
                <div key={claim.id} className="bg-surface rounded-xl p-4"
                  style={{ border: `1px solid ${claim.status === 'pending' ? '#fed7aa' : claim.status === 'approved' ? '#bbf7d0' : '#f1f5f9'}` }}>
                  <div className="flex items-center gap-2.5 mb-2">
                    <Avatar name={claim.claimer?.full_name} url={claim.claimer?.avatar_url} size={28} />
                    <div className="flex-1">
                      <span className="font-bold t-md t-primary">{claim.claimer?.full_name}</span>
                      <span className="t-xs t-subtle ml-2">{new Date(claim.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                    </div>
                    <span className={`t-xs font-bold uppercase px-2 py-0.5 rounded-md ${claim.status === 'pending' ? 'bg-warning-light text-[#92400e]' : claim.status === 'approved' ? 'bg-success-light text-success-dark' : 'bg-surface t-secondary'}`}>
                      {claim.status}
                    </span>
                  </div>
                  <p className="t-md t-light m-0 mb-2 leading-[19px]">{claim.message}</p>
                  {claim.proof_url && <a href={claim.proof_url} target="_blank" rel="noopener noreferrer" className="t-sm text-brand font-semibold">View proof photo →</a>}
                  <div className="flex gap-2 mt-2.5 flex-wrap">
                    {claim.claimer && (
                      <button onClick={() => onChat(item, claim.claimer)} className="px-3 py-1.5 rounded-[9px] border border-brand-soft bg-[#f5f3ff] text-brand t-sm font-semibold cursor-pointer flex items-center gap-1.5">
                        <MessageCircle size={13} /> Chat
                      </button>
                    )}
                    {claim.status === 'pending' && item.status !== 'resolved' && (
                      <>
                        <button onClick={() => onClaimAction(item.id, claim.id, 'approve')} className="flex-1 py-2 rounded-[9px] border-none bg-success-dark text-white t-md font-bold cursor-pointer">✓ Approve</button>
                        <button onClick={() => onClaimAction(item.id, claim.id, 'reject')}  className="flex-1 py-2 rounded-[9px] border border-danger-border bg-white text-danger t-md font-semibold cursor-pointer">✗ Reject</button>
                      </>
                    )}
                  </div>
                  {claim.admin_note && <p className="t-sm t-subtle mt-1.5 italic">Note: {claim.admin_note}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ── Main Page ── */
export default function LostFoundPage() {
  const { user, isGuest } = useAuth()
  const [tab, setTab]             = useState('browse')
  const [items, setItems]         = useState([])
  const [myItems, setMyItems]     = useState([])
  const [myClaims, setMyClaims]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [myLoading, setMyLoading] = useState(false)
  const [claimsLoading, setClaimsLoading] = useState(false)
  const [statusFilter, setStatusFilter]   = useState('all')
  const [catFilter, setCatFilter]         = useState('all')
  const [search, setSearch]               = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [sortBy, setSortBy]       = useState('recent')
  const [claimChatTarget, setClaimChatTarget] = useState(null)
  const [viewItemTarget, setViewItemTarget]   = useState(null)
  const [chatTarget, setChatTarget]           = useState(null)
  const [reportTarget, setReportTarget]       = useState(null)
  const [viewImageUrl, setViewImageUrl]       = useState(null)
  const [confirmConfig, setConfirmConfig]     = useState(null)

  useEffect(() => { const t = setTimeout(() => setDebouncedSearch(search), 350); return () => clearTimeout(t) }, [search])

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (debouncedSearch) params.set('search', debouncedSearch)
      const res = await api.get(`/api/lost-found?${params}`)
      setItems(res.success ? (res.data || []) : [])
    } catch { } finally { setLoading(false) }
  }, [debouncedSearch])

  const fetchMyItems  = useCallback(async () => { setMyLoading(true);    try { const res = await api.get('/api/lost-found/my');         if (res.success) setMyItems(res.data || []) }  catch { } finally { setMyLoading(false) } }, [])
  const fetchMyClaims = useCallback(async () => { setClaimsLoading(true); try { const res = await api.get('/api/lost-found/my-claims'); if (res.success) setMyClaims(res.data || []) } catch { } finally { setClaimsLoading(false) } }, [])

  useEffect(() => { fetchItems() }, [fetchItems])
  useEffect(() => { if (tab === 'mine')    fetchMyItems()  }, [tab, fetchMyItems])
  useEffect(() => { if (tab === 'claimed') fetchMyClaims() }, [tab, fetchMyClaims])

  const getItemState = (item) => {
    const ageInDays = (Date.now() - new Date(item.created_at || Date.now()).getTime()) / (1000 * 60 * 60 * 24)
    const isAutoResolved = item.reporter?.role === 'admin' && ageInDays > 20 && item.status !== 'resolved'
    return { isResolved: item.status === 'resolved' || isAutoResolved, isAutoResolved, originalStatus: item.status }
  }

  const handleClaim = async ({ message }) => {
    const res = await api.post(`/api/lost-found/${claimChatTarget.id}/claim`, { message })
    if (!res.success) throw new Error(res.error || 'Claim failed')
    fetchMyClaims(); fetchItems()
  }
  const handleAfterClaim = (switchTab = true) => {
    setClaimChatTarget(null)
    if (switchTab && tab !== 'claimed') setTab('claimed')
  }
  const handleResolve = async (id, currentStatus) => {
    const isResolving = currentStatus !== 'resolved'
    setConfirmConfig({
      title: isResolving ? 'Mark as Resolved?' : 'Mark as Unresolved?',
      message: isResolving ? 'This will hide the item from public browse and stop new claims.' : 'This will make the item public again for browsing and claims.',
      confirmText: isResolving ? 'Confirm Resolve' : 'Make Public',
      type: isResolving ? 'success' : 'primary',
      onConfirm: async () => { await api.patch(`/api/lost-found/${id}/${isResolving ? 'resolve' : 'unresolve'}`); fetchMyItems(); fetchItems(); setConfirmConfig(null) }
    })
  }
  const handleDelete = async (id) => {
    setConfirmConfig({
      title: 'Delete Post?', message: 'This action is permanent and cannot be undone. All claims will be removed.',
      confirmText: 'Delete Forever', type: 'danger',
      onConfirm: async () => { await api.delete(`/api/lost-found/${id}`); setMyItems(p => p.filter(i => i.id !== id)); setItems(p => p.filter(i => i.id !== id)); setConfirmConfig(null) }
    })
  }
  const handleClaimAction = async (itemId, claimId, action) => {
    const isApprove = action === 'approve'
    setConfirmConfig({
      title: isApprove ? 'Approve Claim?' : 'Reject Claim?',
      message: isApprove ? 'This will verify the owner. You can still chat with them after approving.' : 'This will remove the claim. The user can submit a new one if needed.',
      confirmText: isApprove ? 'Yes, Approve' : 'Yes, Reject', type: isApprove ? 'success' : 'danger',
      onConfirm: async () => { await api.patch(`/api/lost-found/${itemId}/claim/${claimId}`, { action }); fetchMyItems(); fetchItems(); setConfirmConfig(null) }
    })
  }
  const handleSaved = (data, isEdit) => {
    if (isEdit) { setMyItems(p => p.map(i => i.id === data.id ? { ...i, ...data } : i)); setItems(p => p.map(i => i.id === data.id ? { ...i, ...data } : i)) }
    else { setMyItems(p => [{ ...data, claims: [] }, ...p]); setItems(p => [{ ...data, claims: [] }, ...p]) }
    setReportTarget(null)
  }

  return (
    <PageLayout>
      {/* Modals */}
      {claimChatTarget && (() => {
        const alreadyClaimed = claimChatTarget.claims?.some(c => c.claimer_id === user?.id)
        return <ClaimChatModal item={claimChatTarget} otherUser={claimChatTarget.reporter} currentUser={user} onClose={() => setClaimChatTarget(null)} onSubmit={handleClaim} hasClaim={alreadyClaimed} />
      })()}
      {viewItemTarget && createPortal(
        <div className="fixed inset-0 bg-ink/50 z-[3000] flex items-center justify-center p-5" onClick={() => setViewItemTarget(null)}>
          <div onClick={e => e.stopPropagation()} className="w-full max-w-sm relative">
            <button onClick={() => setViewItemTarget(null)} className="absolute -top-10 right-0 bg-transparent border-none text-white cursor-pointer"><X size={24} /></button>
            <ItemCard item={viewItemTarget} currentUserId={user?.id} isGuest={true} onClaim={() => {}} onChat={() => {}} />
          </div>
        </div>,
        document.body
      )}
      {chatTarget && <LFChatModal item={chatTarget.item} otherUser={chatTarget.otherUser} currentUser={user} onClose={() => setChatTarget(null)} />}
      {reportTarget !== null && <ReportModal initial={reportTarget?.id ? reportTarget : null} onClose={() => setReportTarget(null)} onSaved={handleSaved} />}
      <ImageModal url={viewImageUrl} onClose={() => setViewImageUrl(null)} />
      <CustomConfirmModal open={!!confirmConfig} {...confirmConfig} onCancel={() => setConfirmConfig(null)} />

      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-5 mb-5 border-b border-slate-100">
        <div>
          <h1 className="t-heading-3xl t-primary m-0 tracking-[-0.5px]">Lost & Found</h1>
          <p className="t-lg t-secondary mt-1.5 mb-0">Report lost items or help return found items to the community.</p>
        </div>
        {!isGuest && (
          <button
            onClick={() => setReportTarget({})}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-brand text-white border-none t-heading-md cursor-pointer shadow-[0_8px_20px_rgba(79,70,229,0.25)] transition-all hover:-translate-y-0.5 hover:bg-brand-dark shrink-0"
          >
            <Plus size={16} strokeWidth={2.5} /> Report New Item
          </button>
        )}
      </div>

      {/* Guest banner */}
      {isGuest && (
        <div className="bg-danger-light border border-danger-border px-5 py-3 rounded-2xl mb-5 flex items-center gap-3">
          <span className="text-xl">🎓</span>
          <span className="font-jakarta t-base text-[#b91c1c] font-medium">
            <strong>Guest Mode:</strong> Register with a university email (@thapar.edu) to report items or chat with reporters.
          </span>
        </div>
      )}

      {/* Tab bar */}
      <div className="flex gap-2 p-1 bg-surface-muted rounded-[18px] w-fit mb-2">
        {[
          { id: 'browse',  label: 'Browse Items', icon: Package },
          ...(!isGuest ? [
            { id: 'claimed', label: 'My Claims', count: myClaims.length, icon: CheckCircle2 },
            { id: 'mine',    label: 'My Posts',  count: myItems.length,  icon: PlusSquare },
          ] : []),
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-2xl border-none cursor-pointer transition-all t-base ${
              tab === t.id ? 'bg-white font-extrabold text-brand shadow-[0_4px_12px_rgba(0,0,0,0.05)]' : 'bg-transparent font-medium t-secondary'
            }`}
          >
            <t.icon size={16} strokeWidth={tab === t.id ? 2.5 : 2} />
            <span className="hidden sm:inline">{t.label}</span>
            {!!t.count && (
              <span className={`text-white text-[11px] font-bold px-2 py-0.5 rounded-lg ${tab === t.id ? 'bg-brand' : 'bg-slate-300'}`}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Browse tab ── */}
      {tab === 'browse' && (
        <>
          {/* Filters card */}
          <div className="card p-6 mb-5 flex flex-col gap-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-wrap">
              {/* Search */}
              <div className="relative flex-1 min-w-0 max-w-sm w-full">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2" width="15" height="15" viewBox="0 0 15 15" fill="none">
                  <circle cx="6.5" cy="6.5" r="5.5" stroke="#94a3b8" strokeWidth="1.3" />
                  <path d="M11 11l3 3" stroke="#94a3b8" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
                <input
                  placeholder="Search items, areas, descriptions..."
                  value={search} onChange={e => setSearch(e.target.value)}
                  className="input pl-10 shadow-[0_2px_8px_rgba(0,0,0,0.03)]"
                />
                {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer flex"><X size={18} className="t-subtle" /></button>}
              </div>

              <div className="flex items-center gap-4 flex-wrap">
                {/* Status switcher */}
                <div className="flex bg-surface-muted rounded-2xl p-1">
                  {['all', 'lost', 'found', 'resolved'].map(s => {
                    const isSel = statusFilter === s
                    const col   = s === 'all' ? '#4f46e5' : STATUS_CONFIG[s]?.color
                    return (
                      <button key={s} onClick={() => setStatusFilter(s)}
                        className="px-4 py-2 rounded-xl border-none cursor-pointer transition-all t-md"
                        style={{
                          background: isSel ? '#fff' : 'transparent',
                          color:      isSel ? col   : '#64748b',
                          fontWeight: isSel ? 800   : 500,
                          boxShadow:  isSel ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                        }}
                      >
                        {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                      </button>
                    )
                  })}
                </div>

                {/* Sort */}
                <div className="flex items-center gap-2.5 bg-surface border border-ink-border px-4 py-2 rounded-2xl">
                  <span className="t-md font-semibold t-subtle">Sort:</span>
                  <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="border-none bg-transparent t-md font-bold t-primary outline-none cursor-pointer">
                    <option value="recent">Newest First</option>
                    <option value="oldest">Oldest First</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="divider" />

            {/* Category chips */}
            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.map(c => {
                const isSel = catFilter === c.value
                const Icon  = c.icon
                return (
                  <button key={c.value} onClick={() => setCatFilter(c.value)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border cursor-pointer transition-all t-md"
                    style={{
                      borderColor: isSel ? c.color : '#e2e8f0',
                      background:  isSel ? c.bg    : '#fff',
                      color:       isSel ? c.color : '#64748b',
                      fontWeight:  isSel ? 700 : 500,
                    }}
                    onMouseEnter={e => !isSel && (e.currentTarget.style.borderColor = c.color)}
                    onMouseLeave={e => !isSel && (e.currentTarget.style.borderColor = '#e2e8f0')}
                  >
                    <Icon size={16} strokeWidth={isSel ? 2.5 : 2} /> {c.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Items grid */}
          {(() => {
            const filtered = items.filter(item => {
              const { isResolved, originalStatus } = getItemState(item)
              if (statusFilter === 'resolved' && !isResolved) return false
              if (statusFilter === 'lost'     && (isResolved || originalStatus !== 'lost'))  return false
              if (statusFilter === 'found'    && (isResolved || originalStatus !== 'found')) return false
              if (catFilter !== 'all' && item.category !== catFilter) return false
              return true
            }).sort((a, b) => {
              const aR = getItemState(a).isResolved, bR = getItemState(b).isResolved
              if (aR && !bR) return 1; if (!aR && bR) return -1
              const dA = new Date(a.date || a.created_at).getTime()
              const dB = new Date(b.date || b.created_at).getTime()
              return sortBy === 'recent' ? dB - dA : dA - dB
            })

            if (loading) return <div className="text-center py-16 t-md t-subtle">Loading items...</div>
            if (filtered.length === 0) return (
              <div className="text-center py-16">
                <Package size={44} className="opacity-20 mx-auto mb-3.5 block" />
                <p className="t-lg t-secondary font-semibold">No items found</p>
              </div>
            )
            return (
              <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                {filtered.map(item => (
                  <ItemCard key={item.id} item={item} currentUserId={user?.id} isGuest={isGuest}
                    onClaim={(item, mode) => mode === 'view' ? setViewImageUrl(item.image_url) : setClaimChatTarget(item)}
                    onChat={(item, otherUser) => setChatTarget({ item, otherUser })}
                  />
                ))}
              </div>
            )
          })()}
        </>
      )}

      {/* ── Claimed tab ── */}
      {tab === 'claimed' && (
        claimsLoading ? <div className="text-center py-16 t-md t-subtle">Loading your claims...</div>
        : myClaims.length === 0 ? (
          <div className="text-center py-16">
            <Package size={44} className="opacity-20 mx-auto mb-3.5 block" />
            <p className="t-lg t-secondary font-semibold mb-1.5">No claims yet</p>
            <p className="t-md t-subtle mb-5">See a lost item that's yours? Click "This is Mine / Chat" to claim it.</p>
            <button onClick={() => setTab('browse')} className="btn btn-primary">Browse Items</button>
          </div>
        ) : (
          <div className="flex flex-col gap-3.5">
            {myClaims.map(claim => {
              const item = claim.item; if (!item) return null
              const ci = catInfo(item.category)
              const STATUS_MAP = {
                pending:  { label: 'Pending Review', color: '#92400e', bg: '#fffbeb', border: '#fde68a' },
                approved: { label: 'Approved',       color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' },
                rejected: { label: 'Rejected',       color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
              }
              const cs = STATUS_MAP[claim.status] || STATUS_MAP.pending
              return (
                <div key={claim.id} className="bg-white rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.04)] overflow-hidden">
                  <div className="p-6 flex flex-col sm:flex-row gap-5 items-start">
                    {/* Thumbnail */}
                    <div
                      className="w-20 h-20 rounded-[18px] flex items-center justify-center shrink-0 overflow-hidden"
                      style={{ background: ci.bg, cursor: item.image_url ? 'zoom-in' : 'default' }}
                      onClick={() => item.image_url && setViewImageUrl(item.image_url)}
                    >
                      {item.image_url
                        ? <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                        : <ci.icon size={32} strokeWidth={2.5} style={{ color: ci.color }} />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap mb-1.5">
                        <span className="font-extrabold text-[17px] t-primary">{item.title}</span>
                        <StatusBadge status={item.status} />
                        <span className="badge" style={{ background: cs.bg, color: cs.color, borderColor: cs.border }}>{cs.label}</span>
                      </div>

                      <div className="flex gap-4 flex-wrap mb-4">
                        {item.location && <span className="t-md t-secondary flex items-center gap-1.5"><MapPin size={14} />{item.location}</span>}
                        {item.date     && <span className="t-md t-secondary flex items-center gap-1.5"><Calendar size={14} />{new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>}
                      </div>

                      {/* Claim message */}
                      <div className="bg-surface rounded-2xl p-4 mb-4" style={{ borderLeft: `4px solid ${cs.border}` }}>
                        <div className="t-xs font-extrabold t-subtle mb-2 uppercase tracking-[0.04em]">Your claim details</div>
                        <p className="t-base text-[#334155] m-0 leading-[22px]">{claim.message}</p>
                      </div>

                      {claim.admin_note && (
                        <div className="rounded-xl p-3 px-4 mb-4 t-md border" style={{ background: cs.bg, color: cs.color, borderColor: cs.border }}>
                          <strong>Note:</strong> {claim.admin_note}
                        </div>
                      )}

                      <div className="flex justify-between items-center flex-wrap gap-4">
                        <div className="flex gap-2.5 flex-wrap">
                          {item.reporter && item.status !== 'resolved' && (
                            <button onClick={() => setClaimChatTarget({ ...item, claims: [{ ...claim, claimer_id: user?.id }] })}
                              className="btn btn-primary shadow-[0_4px_12px_rgba(79,70,229,0.2)] gap-2">
                              <MessageCircle size={16} /> Chat with Reporter
                            </button>
                          )}
                          <button onClick={() => setViewItemTarget(item)} className="btn btn-secondary gap-2"><Eye size={16} /> View Listing</button>
                          {claim.proof_url && <a href={claim.proof_url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary gap-2 no-underline">View Proof</a>}
                        </div>
                        {item.reporter && (
                          <div className="flex items-center gap-2.5 px-3.5 py-1.5 bg-surface-muted rounded-2xl">
                            <span className="t-sm font-semibold t-secondary">Reporter:</span>
                            <Avatar name={item.reporter.full_name} url={item.reporter.avatar_url} size={24} />
                            <span className="t-md font-bold t-primary">{item.reporter.full_name}</span>
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

      {/* ── My Posts tab ── */}
      {tab === 'mine' && (
        myLoading ? <div className="text-center py-16 t-md t-subtle">Loading your posts...</div>
        : myItems.length === 0 ? (
          <div className="text-center py-16">
            <Package size={44} className="opacity-20 mx-auto mb-3.5 block" />
            <p className="t-lg t-secondary font-semibold mb-1.5">No posts yet</p>
            <p className="t-md t-subtle mb-5">Lost something? Found something? Report it now.</p>
            <button onClick={() => setReportTarget({})} className="btn btn-primary">Report Item</button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {myItems.map(item => <MyPostCard key={item.id} item={item} onView={setViewItemTarget} onEdit={setReportTarget} onDelete={handleDelete} onResolve={handleResolve} onClaimAction={handleClaimAction} onChat={(item, otherUser) => setChatTarget({ item, otherUser })} />)}
          </div>
        )
      )}
    </PageLayout>
  )
}
