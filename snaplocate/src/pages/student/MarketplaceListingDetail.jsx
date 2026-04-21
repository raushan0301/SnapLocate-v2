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

function formatPrice(price) {
  if (price === null || price === undefined || price === 0) return 'Free'
  return `₹${Number(price).toLocaleString('en-IN')}`
}

export default function ListingDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [listing, setListing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [imgIdx,  setImgIdx]  = useState(0)
  const [saved,   setSaved]   = useState(false)
  const [savePending, setSavePending] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [reportReason, setReportReason] = useState('Spam')
  const [reporting, setReporting] = useState(false)
  const [reportDone, setReportDone] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [statusLoading, setStatusLoading] = useState(false)

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
      <div style={{ width: '100%', maxWidth: '100%', padding: '40px 24px', fontFamily: FONT, boxSizing: 'border-box' }}>
        <div style={{ height: 480, background: '#f1f5f9', borderRadius: 24, animation: 'pulse 1.5s infinite', marginBottom: 24 }} />
        <div style={{ height: 200, background: '#f1f5f9', borderRadius: 24, animation: 'pulse 1.5s infinite' }} />
      </div>
    </PageLayout>
  )

  if (!listing) return null

  const images = listing.images?.length ? listing.images : []
  const condStyle = CONDITION_BADGE[listing.condition] || CONDITION_BADGE['Good']
  const statusConf = STATUS_CONFIG[listing.status] || STATUS_CONFIG['Active']

  return (
    <PageLayout>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .ld-img-thumb:hover { opacity: 1 !important; transform: scale(1.05); }
      `}</style>

      <div style={{ width: '100%', maxWidth: '100%', padding: '0 24px', fontFamily: FONT, boxSizing: 'border-box' }}>

        {/* Back */}
        <button onClick={() => navigate(-1)} style={{
          display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none',
          cursor: 'pointer', fontFamily: FONT, fontWeight: 600, fontSize: 14, color: '#6366f1',
          marginBottom: 24, padding: 0,
        }}>
          <ArrowLeft size={18} /> Back to Marketplace
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'start' }}>

          {/* ─── Left: Image gallery ─── */}
          <div>
            {/* Main image */}
            <div style={{
              position: 'relative', width: '100%', paddingTop: '100%',
              background: '#f8fafc', borderRadius: 24, overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            }}>
              {images.length > 0 ? (
                <img src={images[imgIdx]} alt={listing.title}
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 72 }}>📦</div>
              )}

              {/* Nav arrows */}
              {images.length > 1 && (
                <>
                  <button onClick={() => setImgIdx(i => (i - 1 + images.length) % images.length)}
                    style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                    <ChevronLeft size={18} color="#0f172a" />
                  </button>
                  <button onClick={() => setImgIdx(i => (i + 1) % images.length)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                    <ChevronRight size={18} color="#0f172a" />
                  </button>
                  <div style={{ position: 'absolute', bottom: 12, right: 14, background: 'rgba(0,0,0,0.55)', padding: '3px 10px', borderRadius: 20 }}>
                    <span style={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>{imgIdx + 1}/{images.length}</span>
                  </div>
                </>
              )}

              {/* Status overlay */}
              {isSold && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: '#fff', fontWeight: 800, fontSize: 36, letterSpacing: 2 }}>{listing.status.toUpperCase()}</span>
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                {images.map((img, i) => (
                  <button key={i} className="ld-img-thumb" onClick={() => setImgIdx(i)} style={{
                    width: 64, height: 64, borderRadius: 12, overflow: 'hidden',
                    border: `2.5px solid ${i === imgIdx ? '#6366f1' : '#e2e8f0'}`,
                    cursor: 'pointer', padding: 0, opacity: i === imgIdx ? 1 : 0.6,
                    transition: 'all 0.15s',
                  }}>
                    <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            )}

            {/* Views */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12 }}>
              <Eye size={14} color="#94a3b8" />
              <span style={{ fontFamily: FONT, fontSize: 13, color: '#94a3b8' }}>{listing.views_count || 0} views</span>
            </div>
          </div>

          {/* ─── Right: Listing info ─── */}
          <div>
            {/* Status + Category row */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
              <span style={{ padding: '4px 12px', borderRadius: 20, background: statusConf.bg, color: statusConf.color, fontFamily: FONT, fontWeight: 700, fontSize: 12 }}>
                {statusConf.label}
              </span>
              <span style={{ padding: '4px 12px', borderRadius: 20, background: '#f1f5f9', color: '#475569', fontFamily: FONT, fontWeight: 600, fontSize: 12 }}>
                {listing.category}
              </span>
              <span style={{ padding: '4px 12px', borderRadius: 20, background: condStyle.bg, color: condStyle.color, fontFamily: FONT, fontWeight: 700, fontSize: 12 }}>
                {condStyle.icon} {listing.condition}
              </span>
            </div>

            <h1 style={{ fontFamily: FONT, fontWeight: 800, fontSize: 26, color: '#0f172a', margin: '0 0 12px', lineHeight: 1.3 }}>
              {listing.title}
            </h1>

            {/* Price */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 8 }}>
              <span style={{
                fontFamily: FONT, fontWeight: 800, fontSize: 36,
                color: listing.price === null || listing.price === 0 ? '#10b981' : '#6366f1',
              }}>
                {formatPrice(listing.price)}
              </span>
              {listing.is_negotiable && !(listing.price === null || listing.price === 0) && (
                <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: '#6366f1', background: '#eef2ff', padding: '3px 10px', borderRadius: 20 }}>
                  Price Negotiable
                </span>
              )}
            </div>

            {/* Description */}
            {listing.description && (
              <p style={{ fontFamily: FONT, fontSize: 15, color: '#475569', lineHeight: 1.7, margin: '0 0 24px', whiteSpace: 'pre-wrap' }}>
                {listing.description}
              </p>
            )}

            {/* Seller card */}
            <div style={{ background: '#f8fafc', borderRadius: 16, padding: '16px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 14 }}>
              <img
                src={listing.seller?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(listing.seller?.full_name || 'U')}&background=eef2ff&color=6366f1&size=128`}
                alt="" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }}
              />
              <div>
                <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: 15, color: '#0f172a', margin: 0 }}>{listing.seller?.full_name}</p>
                <p style={{ fontFamily: FONT, fontSize: 13, color: '#64748b', margin: '2px 0 0' }}>Listed {new Date(listing.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              </div>
            </div>

            {/* ─── CTAs ─── */}
            {!isMine ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {!isSold && (
                  <button onClick={handleChat} style={{
                    width: '100%', padding: '16px', borderRadius: 16,
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    border: 'none', color: '#fff', fontFamily: FONT,
                    fontWeight: 700, fontSize: 16, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
                    transition: 'transform 0.18s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    <MessageCircle size={20} /> Chat with Seller
                  </button>
                )}
                <div style={{ display: 'flex', gap: 10 }}>
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
                  <button onClick={() => setShowReport(true)} style={{
                    flex: 1, padding: '12px', borderRadius: 14,
                    background: '#f8fafc', border: '1.5px solid #e2e8f0',
                    color: '#94a3b8', fontFamily: FONT, fontWeight: 600,
                    fontSize: 14, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}>
                    <Flag size={15} /> Report
                  </button>
                </div>
              </div>
            ) : (
              /* Seller actions */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => navigate(`/marketplace/edit/${id}`)} style={{
                    flex: 1, padding: '12px', borderRadius: 14,
                    background: '#eef2ff', border: '1.5px solid #c7d2fe',
                    color: '#6366f1', fontFamily: FONT, fontWeight: 700,
                    fontSize: 14, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}>
                    <Edit size={15} /> Edit Listing
                  </button>
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
                  <div style={{ display: 'flex', gap: 8 }}>
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 24, padding: 32, maxWidth: 400, width: '100%', position: 'relative' }}>
            <button onClick={() => setShowReport(false)} style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={20} color="#94a3b8" />
            </button>
            {reportDone ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
                <h3 style={{ fontFamily: FONT, fontWeight: 700, fontSize: 20, color: '#0f172a', margin: '0 0 8px' }}>Report Submitted</h3>
                <p style={{ fontFamily: FONT, fontSize: 14, color: '#64748b', margin: 0 }}>Our team will review this listing.</p>
              </div>
            ) : (
              <>
                <h3 style={{ fontFamily: FONT, fontWeight: 700, fontSize: 20, color: '#0f172a', margin: '0 0 8px' }}>Report Listing</h3>
                <p style={{ fontFamily: FONT, fontSize: 14, color: '#64748b', margin: '0 0 20px' }}>Help us keep the marketplace safe.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
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
                <button onClick={handleReport} disabled={reporting} style={{
                  width: '100%', padding: '14px', borderRadius: 14, background: '#ef4444',
                  border: 'none', color: '#fff', fontFamily: FONT, fontWeight: 700,
                  fontSize: 15, cursor: 'pointer', opacity: reporting ? 0.7 : 1,
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
