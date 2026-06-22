import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import {
  ArrowLeft, Heart, MessageCircle, Flag, ChevronLeft, ChevronRight,
  Eye, Tag, CheckCircle, Clock, AlertTriangle, Share2, Edit, Trash2,
  MapPin, Package, Star, MoreVertical, X
} from 'lucide-react'

const FONT = "'Plus Jakarta Sans', 'Inter', sans-serif"

const CONDITION_BADGE = {
  'Like New':    { bg: '#dcfce7', color: '#16a34a', icon: '✨' },
  'Good':        { bg: '#dbeafe', color: '#1d4ed8', icon: '👍' },
  'Fair':        { bg: '#fef3c7', color: '#d97706', icon: '👌' },
  'Needs Repair':{ bg: '#fee2e2', color: '#dc2626', icon: '🔧' },
}

const STATUS_CONFIG = {
  Active:   { bg: '#dcfce7', color: '#16a34a', label: 'Available' },
  Reserved: { bg: '#fef3c7', color: '#d97706', label: 'Reserved' },
  Sold:     { bg: '#fee2e2', color: '#dc2626', label: 'Sold' },
}

/* ── Static style objects (Phase 2 — values unchanged) ── */
const S = {
  pageWrapLoading: {
    width: '100%', maxWidth: '100%', padding: '40px 24px',
    fontFamily: FONT, boxSizing: 'border-box',
  },
  skeletonTall: {
    height: 480, background: '#f1f5f9', borderRadius: 24,
    animation: 'pulse 1.5s infinite', marginBottom: 24,
  },
  skeletonShort: {
    height: 200, background: '#f1f5f9', borderRadius: 24,
    animation: 'pulse 1.5s infinite',
  },
  pageWrap: {
    width: '100%', maxWidth: '100%', padding: '0 24px',
    fontFamily: FONT, boxSizing: 'border-box',
  },
  backBtn: {
    display: 'flex', alignItems: 'center', gap: 8, background: 'none',
    border: 'none', cursor: 'pointer', fontFamily: FONT, fontWeight: 600,
    fontSize: 14, color: '#6366f1', marginBottom: 24, padding: 0,
  },
  grid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'start',
  },
  imgBox: {
    position: 'relative', width: '100%', paddingTop: '100%',
    background: '#f8fafc', borderRadius: 24, overflow: 'hidden',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
  },
  imgFull: {
    position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
  },
  imgPlaceholder: {
    position: 'absolute', inset: 0, display: 'flex',
    alignItems: 'center', justifyContent: 'center', fontSize: 72,
  },
  arrowLeft: {
    position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
    width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.9)',
    border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center',
    justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
  },
  arrowRight: {
    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
    width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.9)',
    border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center',
    justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
  },
  counterBadge: {
    position: 'absolute', bottom: 12, right: 14,
    background: 'rgba(0,0,0,0.55)', padding: '3px 10px', borderRadius: 20,
  },
  counterText:   { color: '#fff', fontSize: 12, fontWeight: 600 },
  soldOverlay: {
    position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  soldText:      { color: '#fff', fontWeight: 800, fontSize: 36, letterSpacing: 2 },
  thumbRow:      { display: 'flex', gap: 8, marginTop: 12 },
  thumbImg:      { width: '100%', height: '100%', objectFit: 'cover' },
  viewsRow:      { display: 'flex', alignItems: 'center', gap: 6, marginTop: 12 },
  viewsText:     { fontFamily: FONT, fontSize: 13, color: '#94a3b8' },
  badgeRow:      { display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' },
  categoryBadge: {
    padding: '4px 12px', borderRadius: 20, background: '#f1f5f9',
    color: '#475569', fontFamily: FONT, fontWeight: 600, fontSize: 12,
  },
  title: {
    fontFamily: FONT, fontWeight: 800, fontSize: 26, color: '#0f172a',
    margin: '0 0 12px', lineHeight: 1.3,
  },
  priceRow:       { display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 8 },
  negotiableBadge: {
    fontFamily: FONT, fontSize: 13, fontWeight: 600, color: '#6366f1',
    background: '#eef2ff', padding: '3px 10px', borderRadius: 20,
  },
  description: {
    fontFamily: FONT, fontSize: 15, color: '#475569', lineHeight: 1.7,
    margin: '0 0 24px', whiteSpace: 'pre-wrap',
  },
  sellerCard: {
    background: '#f8fafc', borderRadius: 16, padding: '16px 20px',
    marginBottom: 24, display: 'flex', alignItems: 'center', gap: 14,
  },
  sellerAvatar:  { width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' },
  sellerName: {
    fontFamily: FONT, fontWeight: 700, fontSize: 15, color: '#0f172a', margin: 0,
  },
  sellerDate:    { fontFamily: FONT, fontSize: 13, color: '#64748b', margin: '2px 0 0' },
  ctaCol:        { display: 'flex', flexDirection: 'column', gap: 12 },
  chatBtn: {
    width: '100%', padding: '16px', borderRadius: 16,
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    border: 'none', color: '#fff', fontFamily: FONT, fontWeight: 700, fontSize: 16,
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: 10, boxShadow: '0 4px 14px rgba(99,102,241,0.35)', transition: 'transform 0.18s',
  },
  btnRow:   { display: 'flex', gap: 10 },
  reportBtn: {
    flex: 1, padding: '12px', borderRadius: 14,
    background: '#f8fafc', border: '1.5px solid #e2e8f0',
    color: '#94a3b8', fontFamily: FONT, fontWeight: 600, fontSize: 14, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  editBtn: {
    flex: 1, padding: '12px', borderRadius: 14,
    background: '#eef2ff', border: '1.5px solid #c7d2fe',
    color: '#6366f1', fontFamily: FONT, fontWeight: 700, fontSize: 14, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  statusBtnRow:   { display: 'flex', gap: 8 },
  modalOverlay: {
    position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)',
    backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
    justifyContent: 'center', zIndex: 1000, padding: 20,
  },
  modalBox: {
    background: '#fff', borderRadius: 24, padding: 32,
    maxWidth: 400, width: '100%', position: 'relative',
  },
  modalClose: {
    position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', cursor: 'pointer',
  },
  reportDoneWrap:  { textAlign: 'center', padding: '20px 0' },
  reportDoneIcon:  { fontSize: 48, marginBottom: 12 },
  reportDoneTitle: { fontFamily: FONT, fontWeight: 700, fontSize: 20, color: '#0f172a', margin: '0 0 8px' },
  reportDoneText:  { fontFamily: FONT, fontSize: 14, color: '#64748b', margin: 0 },
  reportTitle:     { fontFamily: FONT, fontWeight: 700, fontSize: 20, color: '#0f172a', margin: '0 0 8px' },
  reportSubtitle:  { fontFamily: FONT, fontSize: 14, color: '#64748b', margin: '0 0 20px' },
  reportReasonCol: { display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 },
  submitBtn: {
    width: '100%', padding: '14px', borderRadius: 14, background: '#ef4444',
    border: 'none', color: '#fff', fontFamily: FONT, fontWeight: 700, fontSize: 15, cursor: 'pointer',
  },
}

function formatPrice(price) {
  if (price === null || price === undefined || price === 0) return 'Free'
  return `₹${Number(price).toLocaleString('en-IN')}`
}

export default function ListingDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isGuest } = useAuth()

  const [listing,      setListing]      = useState(null)
  const [loading,      setLoading]      = useState(true)
  const [imgIdx,       setImgIdx]       = useState(0)
  const [saved,        setSaved]        = useState(false)
  const [savePending,  setSavePending]  = useState(false)
  const [showMenu,     setShowMenu]     = useState(false)
  const [showReport,   setShowReport]   = useState(false)
  const [reportReason, setReportReason] = useState('Spam')
  const [reporting,    setReporting]    = useState(false)
  const [reportDone,   setReportDone]   = useState(false)
  const [deleting,     setDeleting]     = useState(false)
  const [statusLoading,setStatusLoading]= useState(false)

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.view(`/api/marketplace/${id}`, id)
        setListing(res.data)
        setSaved(res.data.is_saved || false)
      } catch { navigate('/marketplace') }
      finally { setLoading(false) }
    }
    fetch()
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
    } catch (err) {
      alert(err.message || 'Could not start chat')
    }
  }

  const handleReport = async () => {
    setReporting(true)
    try {
      await api.post(`/api/marketplace/report/${id}`, { reason: reportReason })
      setReportDone(true)
      setTimeout(() => setShowReport(false), 2000)
    } catch (err) {
      alert(err.message || 'Could not submit report')
    } finally {
      setReporting(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Remove this listing? This action cannot be undone.')) return
    setDeleting(true)
    try {
      await api.delete(`/api/marketplace/${id}`)
      navigate('/marketplace/dashboard')
    } catch (err) {
      alert(err.message || 'Failed to delete')
    } finally {
      setDeleting(false)
    }
  }

  const handleStatusChange = async (status) => {
    setStatusLoading(true)
    try {
      const res = await api.patch(`/api/marketplace/${id}/status`, { status })
      setListing(prev => ({ ...prev, status: res.data.status }))
    } catch (err) {
      alert(err.message || 'Failed to update status')
    } finally {
      setStatusLoading(false)
    }
  }

  if (loading) return (
    <PageLayout>
      <div style={S.pageWrapLoading}>
        <div style={S.skeletonTall} />
        <div style={S.skeletonShort} />
      </div>
    </PageLayout>
  )

  if (!listing) return null

  const images    = listing.images?.length ? listing.images : []
  const condStyle = CONDITION_BADGE[listing.condition] || CONDITION_BADGE['Good']
  const statusConf= STATUS_CONFIG[listing.status]    || STATUS_CONFIG['Active']

  return (
    <PageLayout>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .ld-img-thumb:hover { opacity: 1 !important; transform: scale(1.05); }
      `}</style>

      <div style={S.pageWrap}>

        {/* Back */}
        <button onClick={() => navigate(-1)} style={S.backBtn}>
          <ArrowLeft size={18} /> Back to Marketplace
        </button>

        <div style={S.grid}>

          {/* ─── Left: Image gallery ─── */}
          <div>
            {/* Main image */}
            <div style={S.imgBox}>
              {images.length > 0 ? (
                <img src={images[imgIdx]} alt={listing.title} style={S.imgFull} />
              ) : (
                <div style={S.imgPlaceholder}>📦</div>
              )}

              {/* Nav arrows */}
              {images.length > 1 && (
                <>
                  <button onClick={() => setImgIdx(i => (i - 1 + images.length) % images.length)}
                    style={S.arrowLeft}>
                    <ChevronLeft size={18} color="#0f172a" />
                  </button>
                  <button onClick={() => setImgIdx(i => (i + 1) % images.length)}
                    style={S.arrowRight}>
                    <ChevronRight size={18} color="#0f172a" />
                  </button>
                  <div style={S.counterBadge}>
                    <span style={S.counterText}>{imgIdx + 1}/{images.length}</span>
                  </div>
                </>
              )}

              {/* Status overlay */}
              {isSold && (
                <div style={S.soldOverlay}>
                  <span style={S.soldText}>{listing.status.toUpperCase()}</span>
                </div>
              )}
            </div>

            {/* Thumbnails — border is dynamic (active state), kept inline */}
            {images.length > 1 && (
              <div style={S.thumbRow}>
                {images.map((img, i) => (
                  <button key={i} className="ld-img-thumb" onClick={() => setImgIdx(i)} style={{
                    width: 64, height: 64, borderRadius: 12, overflow: 'hidden',
                    border: `2.5px solid ${i === imgIdx ? '#6366f1' : '#e2e8f0'}`,
                    cursor: 'pointer', padding: 0, opacity: i === imgIdx ? 1 : 0.6,
                    transition: 'all 0.15s',
                  }}>
                    <img src={img} alt="" style={S.thumbImg} />
                  </button>
                ))}
              </div>
            )}

            {/* Views */}
            <div style={S.viewsRow}>
              <Eye size={14} color="#94a3b8" />
              <span style={S.viewsText}>{listing.views_count || 0} views</span>
            </div>
          </div>

          {/* ─── Right: Listing info ─── */}
          <div>
            {/* Status + Category row — bg/color from dynamic config objects, kept inline */}
            <div style={S.badgeRow}>
              <span style={{ padding: '4px 12px', borderRadius: 20, background: statusConf.bg, color: statusConf.color, fontFamily: FONT, fontWeight: 700, fontSize: 12 }}>
                {statusConf.label}
              </span>
              <span style={S.categoryBadge}>
                {listing.category}
              </span>
              <span style={{ padding: '4px 12px', borderRadius: 20, background: condStyle.bg, color: condStyle.color, fontFamily: FONT, fontWeight: 700, fontSize: 12 }}>
                {condStyle.icon} {listing.condition}
              </span>
            </div>

            <h1 style={S.title}>
              {listing.title}
            </h1>

            {/* Price — color is dynamic (free vs paid), kept inline */}
            <div style={S.priceRow}>
              <span style={{
                fontFamily: FONT, fontWeight: 800, fontSize: 36,
                color: listing.price === null || listing.price === 0 ? '#10b981' : '#6366f1',
              }}>
                {formatPrice(listing.price)}
              </span>
              {listing.is_negotiable && !(listing.price === null || listing.price === 0) && (
                <span style={S.negotiableBadge}>
                  Price Negotiable
                </span>
              )}
            </div>

            {/* Description */}
            {listing.description && (
              <p style={S.description}>
                {listing.description}
              </p>
            )}

            {/* Seller card */}
            <div style={S.sellerCard}>
              <img
                src={listing.seller?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(listing.seller?.full_name || 'U')}&background=eef2ff&color=6366f1&size=128`}
                alt="" style={S.sellerAvatar}
              />
              <div>
                <p style={S.sellerName}>{listing.seller?.full_name}</p>
                <p style={S.sellerDate}>Listed {new Date(listing.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              </div>
            </div>

            {/* ─── CTAs ─── */}
            {!isMine ? (
              <div style={S.ctaCol}>
                {!isSold && !isGuest && (
                  <button onClick={handleChat} style={S.chatBtn}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    <MessageCircle size={20} /> Chat with Seller
                  </button>
                )}
                {!isGuest && (
                  <div style={S.btnRow}>
                    {/* Save — bg/border/color dynamic (saved state), kept inline */}
                    <button onClick={handleSave} style={{
                      flex: 1, padding: '12px', borderRadius: 14,
                      background: saved ? '#fff5f5' : '#f8fafc',
                      border: `1.5px solid ${saved ? '#fecaca' : '#e2e8f0'}`,
                      color: saved ? '#ef4444' : '#475569', fontFamily: FONT,
                      fontWeight: 600, fontSize: 14, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    }}>
                      <Heart size={16} fill={saved ? '#ef4444' : 'none'} color={saved ? '#ef4444' : '#475569'} />
                      {saved ? 'Saved' : 'Save'}
                    </button>
                    <button onClick={() => setShowReport(true)} style={S.reportBtn}>
                      <Flag size={15} /> Report
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Seller actions */
              <div style={S.ctaCol}>
                <div style={S.btnRow}>
                  <button onClick={() => navigate(`/marketplace/edit/${id}`)} style={S.editBtn}>
                    <Edit size={15} /> Edit Listing
                  </button>
                  {/* Delete — opacity dynamic (deleting state), kept inline */}
                  <button onClick={handleDelete} disabled={deleting} style={{
                    flex: 1, padding: '12px', borderRadius: 14,
                    background: '#fff5f5', border: '1.5px solid #fecaca',
                    color: '#ef4444', fontFamily: FONT, fontWeight: 700,
                    fontSize: 14, cursor: 'pointer', opacity: deleting ? 0.6 : 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}>
                    <Trash2 size={15} /> {deleting ? 'Removing…' : 'Remove'}
                  </button>
                </div>
                {listing.status !== 'Sold' && (
                  <div style={S.statusBtnRow}>
                    {/* Status buttons — opacity dynamic (statusLoading), kept inline */}
                    {['Active', 'Reserved', 'Sold'].filter(s => s !== listing.status).map(s => (
                      <button key={s} onClick={() => handleStatusChange(s)} disabled={statusLoading} style={{
                        flex: 1, padding: '10px', borderRadius: 12,
                        background: '#f8fafc', border: '1.5px solid #e2e8f0',
                        color: '#475569', fontFamily: FONT, fontWeight: 600,
                        fontSize: 13, cursor: 'pointer', opacity: statusLoading ? 0.6 : 1,
                      }}>
                        Mark as {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Report modal ─── */}
      {showReport && (
        <div style={S.modalOverlay}>
          <div style={S.modalBox}>
            <button onClick={() => setShowReport(false)} style={S.modalClose}>
              <X size={20} color="#94a3b8" />
            </button>
            {reportDone ? (
              <div style={S.reportDoneWrap}>
                <div style={S.reportDoneIcon}>✅</div>
                <h3 style={S.reportDoneTitle}>Report Submitted</h3>
                <p style={S.reportDoneText}>Our team will review this listing.</p>
              </div>
            ) : (
              <>
                <h3 style={S.reportTitle}>Report Listing</h3>
                <p style={S.reportSubtitle}>Help us keep the marketplace safe.</p>
                <div style={S.reportReasonCol}>
                  {/* Reason buttons — bg/border/color dynamic (active reason), kept inline */}
                  {['Spam', 'Inappropriate', 'Scam', 'Other'].map(r => (
                    <button key={r} onClick={() => setReportReason(r)} style={{
                      padding: '12px 16px', borderRadius: 12, textAlign: 'left',
                      background: reportReason === r ? '#eef2ff' : '#f8fafc',
                      border: `1.5px solid ${reportReason === r ? '#6366f1' : '#e2e8f0'}`,
                      color: reportReason === r ? '#6366f1' : '#0f172a',
                      fontFamily: FONT, fontWeight: 600, fontSize: 14, cursor: 'pointer',
                    }}>
                      {r}
                    </button>
                  ))}
                </div>
                {/* Submit — opacity dynamic (reporting state), spread over base */}
                <button onClick={handleReport} disabled={reporting} style={{
                  ...S.submitBtn, opacity: reporting ? 0.7 : 1,
                }}>
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
