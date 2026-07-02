import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import {
  ArrowLeft, Heart, MessageCircle, Flag, ChevronLeft, ChevronRight,
  Eye, X, Edit, Trash2,
} from 'lucide-react'

const CONDITION_BADGE = {
  'Like New':     { bg: 'bg-green-100', text: 'text-green-700', icon: '✨' },
  'Good':         { bg: 'bg-blue-100',  text: 'text-blue-700',  icon: '👍' },
  'Fair':         { bg: 'bg-amber-100', text: 'text-amber-600', icon: '👌' },
  'Needs Repair': { bg: 'bg-red-100',   text: 'text-red-600',   icon: '🔧' },
}

const STATUS_CONFIG = {
  Active:   { bg: 'bg-green-100', text: 'text-green-700', label: 'Available' },
  Reserved: { bg: 'bg-amber-100', text: 'text-amber-600', label: 'Reserved' },
  Sold:     { bg: 'bg-red-100',   text: 'text-red-600',   label: 'Sold' },
}

function formatPrice(price) {
  if (price === null || price === undefined || price === 0) return 'Free'
  return `₹${Number(price).toLocaleString('en-IN')}`
}

export default function ListingDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isGuest } = useAuth()

  const [listing,       setListing]       = useState(null)
  const [loading,       setLoading]       = useState(true)
  const [imgIdx,        setImgIdx]        = useState(0)
  const [saved,         setSaved]         = useState(false)
  const [savePending,   setSavePending]   = useState(false)
  const [showReport,    setShowReport]    = useState(false)
  const [reportReason,  setReportReason]  = useState('Spam')
  const [reporting,     setReporting]     = useState(false)
  const [reportDone,    setReportDone]    = useState(false)
  const [deleting,      setDeleting]      = useState(false)
  const [statusLoading, setStatusLoading] = useState(false)

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const res = await api.view(`/api/marketplace/${id}`, id)
        setListing(res.data)
        setSaved(res.data.is_saved || false)
      } catch { navigate('/marketplace') }
      finally { setLoading(false) }
    }
    fetchListing()
  }, [id])

  const isMine = listing?.seller_id === user?.id
  const isSold = listing?.status !== 'Active'

  const handleSave = async () => {
    if (savePending) return
    setSavePending(true)
    const next = !saved
    setSaved(next)
    try {
      if (next) await api.post(`/api/marketplace/save/${id}`)
      else await api.delete(`/api/marketplace/save/${id}`)
    } catch { setSaved(!next) }
    finally { setSavePending(false) }
  }

  const handleChat = async () => {
    try {
      const res = await api.post('/api/marketplace-chat/chats/initiate', { listing_id: id })
      navigate('/marketplace/chat', { state: { chatId: res.data.id } })
    } catch (err) { alert(err.message || 'Could not start chat') }
  }

  const handleReport = async () => {
    setReporting(true)
    try {
      await api.post(`/api/marketplace/report/${id}`, { reason: reportReason })
      setReportDone(true)
      setTimeout(() => setShowReport(false), 2000)
    } catch (err) { alert(err.message || 'Could not submit report') }
    finally { setReporting(false) }
  }

  const handleDelete = async () => {
    if (!window.confirm('Remove this listing? This action cannot be undone.')) return
    setDeleting(true)
    try {
      await api.delete(`/api/marketplace/${id}`)
      navigate('/marketplace/dashboard')
    } catch (err) { alert(err.message || 'Failed to delete') }
    finally { setDeleting(false) }
  }

  const handleStatusChange = async (status) => {
    setStatusLoading(true)
    try {
      const res = await api.patch(`/api/marketplace/${id}/status`, { status })
      setListing(prev => ({ ...prev, status: res.data.status }))
    } catch (err) { alert(err.message || 'Failed to update status') }
    finally { setStatusLoading(false) }
  }

  if (loading) return (
    <PageLayout>
      <div className="w-full p-6 box-border">
        <div className="h-[480px] bg-slate-100 rounded-3xl mb-6" style={{ animation: 'pulse 1.5s infinite' }} />
        <div className="h-[200px] bg-slate-100 rounded-3xl" style={{ animation: 'pulse 1.5s infinite' }} />
      </div>
    </PageLayout>
  )

  if (!listing) return null

  const images     = listing.images?.length ? listing.images : []
  const condStyle  = CONDITION_BADGE[listing.condition] || CONDITION_BADGE['Good']
  const statusConf = STATUS_CONFIG[listing.status] || STATUS_CONFIG['Active']
  const isFree     = listing.price === null || listing.price === 0

  return (
    <PageLayout>
      <button onClick={() => navigate(-1)}
        className="flex items-center gap-2 bg-transparent border-none cursor-pointer text-[14px] font-semibold text-indigo-500 mb-6 p-0">
        <ArrowLeft size={18} /> Back to Marketplace
      </button>

      <div className="grid gap-8 items-start" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 400px), 1fr))' }}>

        {/* Left: Image gallery */}
        <div>
          {/* Main image */}
          <div className="relative w-full pt-[100%] bg-slate-50 rounded-3xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
            {images.length > 0 ? (
              <img src={images[imgIdx]} alt={listing.title} className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-[72px]">📦</div>
            )}

            {images.length > 1 && (
              <>
                <button onClick={() => setImgIdx(i => (i - 1 + images.length) % images.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 border-none cursor-pointer flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.15)]">
                  <ChevronLeft size={18} color="#0f172a" />
                </button>
                <button onClick={() => setImgIdx(i => (i + 1) % images.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 border-none cursor-pointer flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.15)]">
                  <ChevronRight size={18} color="#0f172a" />
                </button>
                <div className="absolute bottom-3 right-3.5 bg-black/55 px-2.5 py-[3px] rounded-[20px]">
                  <span className="text-white text-[12px] font-semibold">{imgIdx + 1}/{images.length}</span>
                </div>
              </>
            )}

            {isSold && (
              <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center">
                <span className="text-white font-extrabold text-[36px] tracking-[2px]">{listing.status.toUpperCase()}</span>
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-2 mt-3 flex-wrap">
              {images.map((img, i) => (
                <button key={i} onClick={() => setImgIdx(i)}
                  className={`w-16 h-16 rounded-xl overflow-hidden cursor-pointer p-0 transition-all border-[2.5px] ${i === imgIdx ? 'border-indigo-500 opacity-100' : 'border-slate-200 opacity-60 hover:opacity-100 hover:scale-105'}`}>
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-1.5 mt-3">
            <Eye size={14} color="#94a3b8" />
            <span className="text-[13px] font-normal leading-[18px] text-slate-400">{listing.views_count || 0} views</span>
          </div>
        </div>

        {/* Right: Listing info */}
        <div>
          {/* Status + Category + Condition badges */}
          <div className="flex gap-2 mb-3.5 flex-wrap">
            <span className={`px-3 py-1 rounded-[20px] ${statusConf.bg} ${statusConf.text} text-[12px] font-bold`}>
              {statusConf.label}
            </span>
            <span className="px-3 py-1 rounded-[20px] bg-slate-100 text-slate-600 text-[12px] font-semibold">
              {listing.category}
            </span>
            <span className={`px-3 py-1 rounded-[20px] ${condStyle.bg} ${condStyle.text} text-[12px] font-bold`}>
              {condStyle.icon} {listing.condition}
            </span>
          </div>

          <h1 className="text-[26px] font-extrabold t-primary m-0 mb-3 leading-[1.3]">{listing.title}</h1>

          {/* Price */}
          <div className="flex items-baseline gap-3 mb-2">
            <span className={`text-[36px] font-extrabold leading-none ${isFree ? 'text-emerald-500' : 'text-indigo-500'}`}>
              {formatPrice(listing.price)}
            </span>
            {listing.is_negotiable && !isFree && (
              <span className="text-[13px] font-semibold text-indigo-500 bg-indigo-50 px-2.5 py-[3px] rounded-[20px]">
                Price Negotiable
              </span>
            )}
          </div>

          {/* Description */}
          {listing.description && (
            <p className="text-[15px] text-slate-600 leading-[1.7] m-0 mb-6 whitespace-pre-wrap">{listing.description}</p>
          )}

          {/* Seller card */}
          <div className="bg-slate-50 rounded-2xl px-5 py-4 mb-6 flex items-center gap-3.5">
            <img
              src={listing.seller?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(listing.seller?.full_name || 'U')}&background=eef2ff&color=6366f1&size=128`}
              alt="" className="w-12 h-12 rounded-full object-cover"
            />
            <div>
              <p className="text-[15px] font-bold t-primary m-0">{listing.seller?.full_name}</p>
              <p className="text-[13px] text-slate-500 m-0 mt-0.5">Listed {new Date(listing.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            </div>
          </div>

          {/* CTAs */}
          {!isMine ? (
            <div className="flex flex-col gap-3">
              {!isSold && !isGuest && (
                <button onClick={handleChat}
                  className="w-full py-4 rounded-2xl border-none text-white text-[16px] font-bold flex items-center justify-center gap-2.5 cursor-pointer shadow-[0_4px_14px_rgba(99,102,241,0.35)] hover:-translate-y-0.5 transition-transform"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                  <MessageCircle size={20} /> Chat with Seller
                </button>
              )}
              {!isGuest && (
                <div className="flex gap-2.5">
                  <button onClick={handleSave}
                    className={`flex-1 py-3 rounded-[14px] border-[1.5px] text-[14px] font-semibold cursor-pointer flex items-center justify-center gap-2 transition-colors ${saved ? 'bg-red-50 border-red-200 text-red-500' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
                    <Heart size={16} fill={saved ? '#ef4444' : 'none'} color={saved ? '#ef4444' : undefined} />
                    {saved ? 'Saved' : 'Save'}
                  </button>
                  <button onClick={() => setShowReport(true)}
                    className="flex-1 py-3 rounded-[14px] bg-slate-50 border-[1.5px] border-slate-200 text-slate-400 text-[14px] font-semibold cursor-pointer flex items-center justify-center gap-2">
                    <Flag size={15} /> Report
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex gap-2.5">
                <button onClick={() => navigate(`/marketplace/edit/${id}`)}
                  className="flex-1 py-3 rounded-[14px] bg-indigo-50 border-[1.5px] border-indigo-100 text-indigo-500 text-[14px] font-bold cursor-pointer flex items-center justify-center gap-2">
                  <Edit size={15} /> Edit Listing
                </button>
                <button onClick={handleDelete} disabled={deleting}
                  className={`flex-1 py-3 rounded-[14px] bg-red-50 border-[1.5px] border-red-200 text-red-500 text-[14px] font-bold cursor-pointer flex items-center justify-center gap-2 transition-opacity ${deleting ? 'opacity-60 cursor-not-allowed' : ''}`}>
                  <Trash2 size={15} /> {deleting ? 'Removing…' : 'Remove'}
                </button>
              </div>
              {listing.status !== 'Sold' && (
                <div className="flex gap-2">
                  {['Active', 'Reserved', 'Sold'].filter(s => s !== listing.status).map(s => (
                    <button key={s} onClick={() => handleStatusChange(s)} disabled={statusLoading}
                      className={`flex-1 py-2.5 rounded-xl bg-slate-50 border-[1.5px] border-slate-200 text-slate-600 text-[13px] font-semibold cursor-pointer transition-opacity ${statusLoading ? 'opacity-60 cursor-not-allowed' : ''}`}>
                      Mark as {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Report modal */}
      {showReport && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[1000] p-5">
          <div className="bg-white rounded-3xl p-8 max-w-[400px] w-full relative">
            <button onClick={() => setShowReport(false)} className="absolute top-5 right-5 bg-transparent border-none cursor-pointer">
              <X size={20} color="#94a3b8" />
            </button>
            {reportDone ? (
              <div className="text-center py-5">
                <div className="text-[48px] mb-3">✅</div>
                <h3 className="text-[20px] font-bold t-primary m-0 mb-2">Report Submitted</h3>
                <p className="text-[14px] text-slate-500 m-0">Our team will review this listing.</p>
              </div>
            ) : (
              <>
                <h3 className="text-[20px] font-bold t-primary m-0 mb-2">Report Listing</h3>
                <p className="text-[14px] text-slate-500 m-0 mb-5">Help us keep the marketplace safe.</p>
                <div className="flex flex-col gap-2.5 mb-5">
                  {['Spam', 'Inappropriate', 'Scam', 'Other'].map(r => (
                    <button key={r} onClick={() => setReportReason(r)}
                      className={`px-4 py-3 rounded-xl text-left border-[1.5px] text-[14px] font-semibold cursor-pointer transition-colors ${reportReason === r ? 'bg-indigo-50 border-brand text-brand' : 'bg-slate-50 border-slate-200 t-primary hover:bg-slate-100'}`}>
                      {r}
                    </button>
                  ))}
                </div>
                <button onClick={handleReport} disabled={reporting}
                  className={`w-full py-3.5 rounded-[14px] bg-red-500 border-none text-white text-[15px] font-bold cursor-pointer transition-opacity ${reporting ? 'opacity-70 cursor-not-allowed' : ''}`}>
                  {reporting ? 'Submitting…' : 'Submit Report'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </PageLayout>
  )
}
