import { useState, useEffect, useCallback } from 'react'
import PageLayout from '../../components/PageLayout'
import { useAuth } from '../../context/AuthContext'
import api from '../../lib/api'
import { Plus, Search, X } from 'lucide-react'

const REQUEST_TYPES = ['Office Hour', 'Attendance', 'Grade Review', 'Extension', 'Research Query']

const STATUS_CLS = {
  pending:  'bg-warning-light text-warning border border-[#fde68a]',
  accepted: 'bg-success-light text-success border border-green-200',
  rejected: 'bg-danger-light text-danger border border-red-200',
}
const STATUS_LABEL = { pending: 'PENDING', accepted: 'ACCEPTED', rejected: 'REJECTED' }

export default function StudentRequests() {
  const { user, isGuest } = useAuth()
  const [requests, setRequests]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [showModal, setShowModal]   = useState(false)

  const [faculty, setFaculty]           = useState([])
  const [facultySearch, setFacultySearch] = useState('')
  const [selectedFaculty, setSelectedFaculty] = useState(null)
  const [reqType, setReqType]           = useState(REQUEST_TYPES[0])
  const [detail, setDetail]             = useState('')
  const [submitting, setSubmitting]     = useState(false)
  const [facultyLoading, setFacultyLoading] = useState(false)

  const fetchRequests = useCallback(async () => {
    try {
      const res = await api.get('/api/requests')
      setRequests(res.data?.data || res.data || [])
    } catch (err) {
      console.error('Failed to load requests:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchRequests() }, [fetchRequests])

  useEffect(() => {
    if (!showModal) return
    setFacultyLoading(true)
    api.get('/api/faculty')
      .then(res => { if (res.success) setFaculty(res.data || []) })
      .catch(() => {})
      .finally(() => setFacultyLoading(false))
  }, [showModal])

  const filteredFaculty = faculty.filter(f =>
    !facultySearch ||
    f.full_name?.toLowerCase().includes(facultySearch.toLowerCase()) ||
    f.dept?.toLowerCase().includes(facultySearch.toLowerCase()) ||
    f.designation?.toLowerCase().includes(facultySearch.toLowerCase())
  )

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    if (!selectedFaculty || !selectedFaculty.user_id) return
    setSubmitting(true)
    try {
      await api.post('/api/requests', {
        faculty_profile_id: selectedFaculty.id,
        type: reqType,
        detail: detail.trim(),
      })
      setShowModal(false)
      setSelectedFaculty(null)
      setFacultySearch('')
      setReqType(REQUEST_TYPES[0])
      setDetail('')
      fetchRequests()
    } catch {
      alert('Failed to send request. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this request?')) return
    const prev = [...requests]
    setRequests(r => r.filter(x => x.id !== id))
    try {
      await api.delete(`/api/requests/${id}`)
    } catch {
      alert('Failed to cancel')
      setRequests(prev)
    }
  }

  const pendingCount  = requests.filter(r => r.status === 'pending').length
  const acceptedCount = requests.filter(r => r.status === 'accepted').length
  const canSend       = !!(selectedFaculty?.user_id)

  return (
    <PageLayout>
      <div className="max-w-[860px] mx-auto w-full flex flex-col gap-6">

        {/* Header */}
        <div className="flex justify-between items-center bg-white px-6 sm:px-8 py-6 rounded-3xl shadow-[0_1px_4px_rgba(0,0,0,0.04)] border border-slate-100">
          <div>
            <h1 className="t-heading-xl t-primary m-0">My Requests</h1>
            <p className="t-base font-medium t-muted mt-1 m-0">
              {pendingCount > 0 ? `${pendingCount} pending · ` : ''}{acceptedCount} accepted
            </p>
          </div>
          {!isGuest && (
            <button onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand text-white border-none t-base font-bold cursor-pointer">
              <Plus size={16} /> New Request
            </button>
          )}
        </div>

        {/* List */}
        {loading ? (
          <div className="py-10 text-center t-base font-medium t-subtle">Loading requests…</div>
        ) : requests.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-3xl border border-dashed border-slate-300">
            <div className="text-5xl mb-4">📬</div>
            <h2 className="t-heading-lg t-primary m-0 mb-2">No requests yet</h2>
            {isGuest ? (
              <p className="t-base t-muted mx-auto max-w-[360px]">Register with a university email to send requests or book appointments with professors.</p>
            ) : (
              <>
                <p className="t-base t-muted mb-5">Send a request to a professor to get started.</p>
                <button onClick={() => setShowModal(true)}
                  className="px-6 py-2.5 rounded-xl bg-brand text-white border-none t-base font-bold cursor-pointer">
                  + New Request
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {requests.map(req => {
              const statusCls = STATUS_CLS[req.status] || STATUS_CLS.pending
              const statusLbl = STATUS_LABEL[req.status] || 'PENDING'
              return (
                <div key={req.id} className="flex items-start justify-between px-5 sm:px-6 py-5 bg-white rounded-[20px] border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="w-12 h-12 bg-surface rounded-2xl flex items-center justify-center shrink-0 overflow-hidden">
                      <img
                        src={req.faculty_profile?.users?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(req.faculty_profile?.users?.full_name || 'F')}&background=eef2ff&color=4f46e5`}
                        alt="Faculty" className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex gap-2 items-center mb-1">
                        <span className="t-base font-bold t-primary">{req.type}</span>
                        <span className="text-[11px] font-semibold t-subtle">· {new Date(req.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                      </div>
                      <div className="t-md font-medium text-slate-600 break-words">{req.detail || 'No additional details'}</div>
                      <div className="text-[12px] font-semibold text-brand mt-1.5">
                        To: {req.faculty_profile?.users?.full_name || 'Faculty Member'}
                      </div>
                      {req.notes && (
                        <div className="mt-2 px-3 py-2 bg-surface rounded-lg border-l-[3px] border-brand">
                          <span className="text-[12px] font-bold t-secondary">Faculty note: </span>
                          <span className="text-[12px] t-muted">{req.notes}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3 shrink-0 ml-5">
                    <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full tracking-[0.06em] ${statusCls}`}>
                      {statusLbl}
                    </span>
                    {req.status === 'pending' && (
                      <button onClick={() => handleCancel(req.id)}
                        className="bg-transparent border-none cursor-pointer text-[12px] font-semibold t-subtle underline p-0">
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* New Request Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-ink/60 backdrop-blur-sm flex items-center justify-center z-[1000] p-5"
          onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-[28px] w-full max-w-[520px] max-h-[90vh] overflow-hidden flex flex-col shadow-[0_20px_40px_rgba(0,0,0,0.14)]"
            onClick={e => e.stopPropagation()}>
            {/* Modal header */}
            <div className="flex justify-between items-center px-7 py-6 border-b border-slate-100">
              <div>
                <h2 className="t-heading-lg t-primary m-0">Request Appointment</h2>
                <p className="t-md t-muted m-0 mt-0.5">
                  {selectedFaculty ? `Sending to ${selectedFaculty.full_name}` : 'Send a request to a professor'}
                </p>
              </div>
              <button onClick={() => setShowModal(false)} className="bg-transparent border-none cursor-pointer t-subtle flex items-center">
                <svg width="22" height="22" viewBox="0 0 14 14" fill="none">
                  <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-7 py-6 flex flex-col gap-6">
              {/* Step 1: Pick faculty */}
              <div>
                <label className="block mb-2 text-[11px] font-bold text-slate-500 uppercase tracking-[0.08em]">Select Professor</label>
                {selectedFaculty ? (
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-center gap-3 px-3.5 py-3 bg-surface rounded-2xl border-[1.5px] border-brand">
                      <div className="w-10 h-10 rounded-[10px] bg-brand flex items-center justify-center overflow-hidden shrink-0">
                        {selectedFaculty.avatar_url
                          ? <img src={selectedFaculty.avatar_url} alt="" className="w-full h-full object-cover" />
                          : <span className="text-[14px] font-bold text-white">{(selectedFaculty.full_name || 'F').charAt(0)}</span>
                        }
                      </div>
                      <div className="flex-1">
                        <div className="t-base font-bold t-primary">{selectedFaculty.full_name}</div>
                        <div className="t-md t-muted">{selectedFaculty.designation} · {selectedFaculty.dept}</div>
                      </div>
                      <button onClick={() => setSelectedFaculty(null)} className="bg-transparent border-none cursor-pointer text-brand flex items-center">
                        <X size={18} />
                      </button>
                    </div>
                    {!selectedFaculty.user_id && (
                      <div className="px-3 py-3 bg-danger-light rounded-xl border border-red-200 flex items-start gap-2">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" className="shrink-0 mt-0.5">
                          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        <p className="t-md font-medium text-red-700 m-0">This faculty member has not yet registered on SnapLocate. Requests cannot be sent to unregistered accounts.</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <div className="relative mb-2.5">
                      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type="text" value={facultySearch} onChange={e => setFacultySearch(e.target.value)}
                        placeholder="Search by name, department…"
                        autoFocus
                        className="w-full pl-9 pr-4 py-3 rounded-xl border-[1.5px] border-slate-200 t-base t-primary outline-none focus:border-brand box-border"
                      />
                    </div>
                    <div className="max-h-44 overflow-y-auto rounded-xl border border-slate-100">
                      {facultyLoading ? (
                        <div className="py-5 text-center t-md t-subtle">Loading faculty…</div>
                      ) : filteredFaculty.length === 0 ? (
                        <div className="py-5 text-center t-md t-subtle">No faculty found</div>
                      ) : filteredFaculty.map(f => (
                        <div key={f.id} onClick={() => { setSelectedFaculty(f); setFacultySearch('') }}
                          className="flex items-center gap-2.5 px-3.5 py-2.5 cursor-pointer border-b border-slate-50 hover:bg-surface transition-colors">
                          <div className="w-8 h-8 rounded-lg bg-brand-light flex items-center justify-center overflow-hidden shrink-0">
                            {f.avatar_url
                              ? <img src={f.avatar_url} alt="" className="w-full h-full object-cover" />
                              : <span className="text-[12px] font-bold text-brand">{(f.full_name || 'F').charAt(0)}</span>
                            }
                          </div>
                          <div>
                            <div className="text-[13px] font-bold t-primary">{f.full_name}</div>
                            <div className="text-[11px] t-muted">{f.designation} · {f.dept}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Step 2: Request type */}
              <div>
                <label className="block mb-2.5 text-[11px] font-bold text-slate-500 uppercase tracking-[0.08em]">Request Type</label>
                <div className="flex flex-wrap gap-2">
                  {REQUEST_TYPES.map(t => (
                    <button key={t} type="button" onClick={() => setReqType(t)}
                      className={`px-4 py-2 rounded-full cursor-pointer text-[12px] font-semibold transition-all ${reqType === t ? 'bg-brand text-white border-none' : 'bg-white text-slate-500 border border-slate-200 hover:bg-surface'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 3: Details */}
              <div>
                <label className="block mb-2 text-[11px] font-bold text-slate-500 uppercase tracking-[0.08em]">Details</label>
                <textarea value={detail} onChange={e => setDetail(e.target.value)} rows={4}
                  placeholder="Describe your request in detail…"
                  className="w-full px-4 py-3.5 rounded-2xl border-[1.5px] border-slate-200 bg-surface t-md t-primary outline-none focus:border-brand resize-none leading-[20px] box-border"
                />
              </div>

              <div className="flex gap-3 mt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-3.5 rounded-2xl bg-white border-[1.5px] border-slate-200 cursor-pointer t-base font-semibold t-secondary">
                  Cancel
                </button>
                <button type="button" onClick={handleSubmit} disabled={!canSend || submitting}
                  className={`flex-[2] py-3.5 rounded-2xl text-white border-none t-base font-bold transition-all ${canSend ? 'bg-brand cursor-pointer shadow-[0_4px_12px_rgba(79,70,229,0.3)]' : 'bg-slate-300 cursor-not-allowed'}`}>
                  {submitting ? 'Sending…' : 'Send Request →'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  )
}
