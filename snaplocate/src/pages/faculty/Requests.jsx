import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'
import { ClipboardList, Clock, CheckCircle, XCircle } from 'lucide-react'

const types = ['All', 'Office Hour', 'Attendance', 'Grade Review', 'Extension', 'Research Query']

const STATUS_CLS = {
  pending:  { badge: 'bg-amber-100 text-amber-600', bar: 'bg-amber-400', label: 'Pending',  noteBg: 'bg-slate-50 border-slate-200', noteLbl: 'text-slate-500' },
  accepted: { badge: 'bg-green-100 text-green-600', bar: 'bg-green-500', label: 'Approved', noteBg: 'bg-green-50 border-green-200',  noteLbl: 'text-green-600' },
  rejected: { badge: 'bg-red-100 text-red-500',    bar: 'bg-red-400',   label: 'Rejected',  noteBg: 'bg-red-50 border-red-200',      noteLbl: 'text-red-500' },
}

export default function FacultyRequests() {
  const [requests, setRequests] = useState([])
  const [filter, setFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [apiLoading, setApiLoading] = useState(true)
  const [commentModal, setCommentModal] = useState({ isOpen: false, requestId: null, status: null, notes: '' })

  const loadRequests = useCallback(async () => {
    try {
      const res = await api.get('/api/requests/faculty')
      if (res.data) {
        setRequests(res.data.map(r => ({
          id:     r.id,
          name:   r.users?.full_name || 'Student',
          type:   r.type || 'Request',
          detail: r.detail || '—',
          notes:  r.notes || '',
          course: r.courses?.code || 'General',
          status: r.status || 'pending',
          init:   (r.users?.full_name || 'S').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(),
          date:   new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        })))
      }
    } catch (err) {
      console.error('Failed to load requests:', err)
    } finally {
      setApiLoading(false)
    }
  }, [])

  useEffect(() => { loadRequests() }, [loadRequests])

  const filtered = requests.filter(r =>
    (filter === 'All' || r.type === filter) &&
    (statusFilter === 'All' || r.status === statusFilter)
  )

  const openModal = (id, status) => {
    setCommentModal({ isOpen: true, requestId: id, status, notes: '' })
  }

  const submitStatusWithComment = async () => {
    const { requestId, status, notes } = commentModal
    setRequests(rs => rs.map(r => r.id === requestId ? { ...r, status, notes } : r))
    setCommentModal({ isOpen: false, requestId: null, status: null, notes: '' })
    try {
      await api.patch(`/api/requests/${requestId}`, { status, notes })
      loadRequests() // reflect server truth
    } catch (err) {
      console.error('Update request error:', err)
      alert(err.message || 'Failed to update request')
      loadRequests() // revert optimistic change
    }
  }

  const acceptAll = async () => {
    const pending = requests.filter(r => r.status === 'pending')
    if (pending.length === 0) return
    setRequests(rs => rs.map(r => r.status === 'pending' ? { ...r, status: 'accepted' } : r))
    try {
      await Promise.all(pending.map(r => api.patch(`/api/requests/${r.id}`, { status: 'accepted' })))
    } catch (err) {
      console.error('Accept all error:', err)
      loadRequests()
    }
  }

  const pendingCount = requests.filter(r => r.status === 'pending').length

  const statsData = [
    { label: 'Total Requests', id: 'All',      value: requests.length,                                    iconBg: 'bg-indigo-50', icon: <ClipboardList size={22} color="#4f46e5" />, valueCls: 'text-brand',     borderColor: '#4f46e5' },
    { label: 'Pending',        id: 'pending',   value: requests.filter(r => r.status === 'pending').length,  iconBg: 'bg-amber-50',  icon: <Clock size={22} color="#d97706" />,         valueCls: 'text-amber-600', borderColor: '#d97706' },
    { label: 'Approved',       id: 'accepted',  value: requests.filter(r => r.status === 'accepted').length, iconBg: 'bg-green-50',  icon: <CheckCircle size={22} color="#16a34a" />,   valueCls: 'text-green-600', borderColor: '#16a34a' },
    { label: 'Rejected',       id: 'rejected',  value: requests.filter(r => r.status === 'rejected').length, iconBg: 'bg-red-50',    icon: <XCircle size={22} color="#ef4444" />,       valueCls: 'text-red-500',   borderColor: '#ef4444' },
  ]

  return (
    <PageLayout>
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-[26px] font-extrabold t-primary m-0">Student Requests</h1>
          <p className="text-[13px] t-muted mt-1">Manage and respond to student requests</p>
        </div>
        <div className="flex gap-2.5">
          {pendingCount > 0 && (
            <button onClick={acceptAll} className="px-5 py-2.5 rounded-[12px] border-0 bg-brand cursor-pointer text-[13px] font-bold text-white">
              Accept All ({pendingCount})
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {statsData.map((s, i) => (
          <div
            key={i}
            onClick={() => setStatusFilter(s.id)}
            className="bg-white rounded-[16px] px-5 py-[18px] flex items-center gap-3.5 cursor-pointer transition-all"
            style={{ border: statusFilter === s.id ? `2px solid ${s.borderColor}` : '1px solid #f1f5f9', boxShadow: statusFilter === s.id ? '0 4px 12px rgba(0,0,0,0.08)' : '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div className={`w-11 h-11 rounded-[12px] ${s.iconBg} flex items-center justify-center`}>{s.icon}</div>
            <div>
              <div className={`text-[26px] font-extrabold leading-[32px] ${s.valueCls}`}>{s.value}</div>
              <div className="text-[12px] font-medium t-muted">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-4 flex-wrap items-center">
        <div className="flex gap-2 flex-wrap">
          {types.map(t => (
            <button key={t} onClick={() => setFilter(t)} className={`px-4 py-2 rounded-[20px] border-0 cursor-pointer text-[12px] font-semibold transition-all ${filter === t ? 'bg-brand text-white' : 'bg-slate-100 text-slate-500'}`}>{t}</button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3.5">
        {filtered.length === 0 && (
          <div className="text-center py-[60px] px-5 bg-white rounded-[20px] border border-dashed border-slate-200">
            <div className="text-[40px] mb-3">📬</div>
            <div className="text-[16px] font-semibold t-primary">No requests found</div>
            <div className="text-[13px] t-muted mt-1">Try changing your filters or check back later.</div>
          </div>
        )}
        {filtered.map((r) => {
          const ss = STATUS_CLS[r.status] || STATUS_CLS.pending
          return (
            <div key={r.id} className="flex items-center gap-5 px-6 py-5 bg-white border border-slate-100 rounded-[20px] shadow-[0_1px_3px_rgba(0,0,0,0.02)] relative overflow-hidden">
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${ss.bar}`} />

              <div className="w-[50px] h-[50px] rounded-[16px] flex items-center justify-center shrink-0 shadow-[0_4px_12px_rgba(124,58,237,0.15)]" style={{ background: 'linear-gradient(135deg,#a78bfa,#7c3aed)' }}>
                <span className="text-[16px] font-bold text-white">{r.init}</span>
              </div>

              <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                <div className="flex items-center gap-2.5">
                  <span className="text-[15px] font-bold t-primary">{r.name}</span>
                  <span className="text-[11px] t-muted">• Student Request</span>
                  <div className="ml-auto flex items-center gap-3">
                    <span className="text-[11px] font-medium text-slate-400">{r.date}</span>
                    <span className={`text-[10px] font-extrabold px-3 py-1 rounded-[20px] tracking-[0.05em] ${ss.badge}`}>{ss.label}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-bold text-brand">{r.type}</span>
                    <div className="w-1 h-1 rounded-full bg-slate-300" />
                    <span className="text-[12px] font-medium t-muted">Details below</span>
                  </div>
                  <div className="text-[13px] text-slate-600 break-words whitespace-pre-wrap bg-slate-50 px-3.5 py-2.5 rounded-[12px] mt-1 border border-slate-100">
                    {r.detail}
                  </div>
                  {r.notes && (
                    <div className={`text-[13px] t-primary px-3.5 py-2.5 rounded-[12px] mt-1 border ${ss.noteBg}`}>
                      <strong className={ss.noteLbl}>Your Comment:</strong> {r.notes}
                    </div>
                  )}
                </div>
              </div>

              {r.status === 'pending' && (
                <div className="flex flex-col gap-1.5 pl-2.5">
                  <button
                    onClick={() => openModal(r.id, 'accepted')}
                    title="Approve"
                    className="w-[38px] h-[38px] rounded-[12px] bg-green-100 border-0 cursor-pointer flex items-center justify-center hover:bg-green-200 hover:scale-105 transition-all"
                  >
                    <svg width="18" height="18" viewBox="0 0 14 14" fill="none"><path d="M2.5 7l3.5 3.5 5.5-7" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                  <button
                    onClick={() => openModal(r.id, 'rejected')}
                    title="Reject"
                    className="w-[38px] h-[38px] rounded-[12px] bg-red-100 border-0 cursor-pointer flex items-center justify-center hover:bg-red-200 hover:scale-105 transition-all"
                  >
                    <svg width="16" height="16" viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3l-8 8" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round"/></svg>
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {commentModal.isOpen && createPortal(
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[2000] p-4 backdrop-blur-[4px]">
          <div className="bg-white rounded-[24px] p-8 w-full max-w-[400px] shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1)]">
            <h3 className="text-[20px] font-bold t-primary m-0">
              {commentModal.status === 'accepted' ? 'Approve Request' : 'Reject Request'}
            </h3>
            <p className="text-[14px] t-muted mt-2 mb-5">
              Add an optional comment or reason. This will be visible to the student.
            </p>
            <textarea
              value={commentModal.notes}
              onChange={e => setCommentModal(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Your comment..."
              className="w-full h-[100px] p-4 rounded-[16px] border border-slate-200 resize-none outline-none text-[14px] t-primary box-border focus:border-brand transition-colors"
            />
            <div className="flex gap-3 mt-6 justify-end">
              <button
                onClick={() => setCommentModal({ isOpen: false, requestId: null, status: null, notes: '' })}
                className="px-5 py-2.5 rounded-[12px] border-0 bg-slate-100 cursor-pointer text-[14px] font-semibold t-muted"
              >Cancel</button>
              <button
                onClick={submitStatusWithComment}
                className={`px-5 py-2.5 rounded-[12px] border-0 cursor-pointer text-[14px] font-semibold text-white ${commentModal.status === 'accepted' ? 'bg-green-600' : 'bg-red-500'}`}
              >{commentModal.status === 'accepted' ? 'Approve' : 'Reject'}</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </PageLayout>
  )
}
