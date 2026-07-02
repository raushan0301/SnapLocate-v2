import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'
import { Upload, FileText, CheckCircle, ArrowLeft, AlertCircle } from 'lucide-react'

export default function LMSAssignmentDetail() {
  const { id }       = useParams()
  const navigate     = useNavigate()
  const fileRef      = useRef(null)
  const [asgn, setAsgn]           = useState(null)
  const [loading, setLoading]     = useState(true)
  const [text, setText]           = useState('')
  const [fileUrl, setFileUrl]     = useState('')
  const [preview, setPreview]     = useState(null)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]         = useState('')
  const [success, setSuccess]     = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await api.get(`/api/lms/assignments/${id}`)
      if (res.success) {
        setAsgn(res.data)
        if (res.data.my_submission?.text_content) setText(res.data.my_submission.text_content)
        if (res.data.my_submission?.file_url)     setFileUrl(res.data.my_submission.file_url)
      }
    } catch {}
    finally { setLoading(false) }
  }, [id])

  useEffect(() => { load() }, [load])

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPreview(file.name)
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('type', 'pdf')
      const res = await api.upload('/api/upload/pdf', fd)
      if (res.url) setFileUrl(res.url)
      else throw new Error('Upload failed')
    } catch {
      setError('File upload failed. Please try again.')
      setPreview(null)
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const handleSubmit = async () => {
    if (!text && !fileUrl) return setError('Please add a text answer or upload a file.')
    setError('')
    setSubmitting(true)
    try {
      const res = await api.post('/api/lms/submissions', {
        assignment_id: id,
        file_url:      fileUrl || null,
        text_content:  text || null,
      })
      if (res.success) { setSuccess(true); load() }
      else setError(res.error || 'Submission failed')
    } catch (err) {
      setError(err?.message || 'Submission failed')
    } finally { setSubmitting(false) }
  }

  const isOverdue = asgn && new Date(asgn.due_date) < Date.now()
  const submitted = asgn?.my_submission
  const graded    = submitted?.status === 'graded'

  if (loading) return <PageLayout><div className="py-16 text-center t-base font-medium text-slate-400">Loading...</div></PageLayout>
  if (!asgn)   return <PageLayout><div className="py-16 text-center t-base font-medium text-slate-400">Assignment not found.</div></PageLayout>

  return (
    <PageLayout>
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-[10px] border-[1.5px] border-slate-200 bg-white cursor-pointer flex items-center justify-center">
          <ArrowLeft size={16} color="#64748b" />
        </button>
        <h1 className="text-[22px] font-bold t-primary m-0">{asgn.title}</h1>
        {isOverdue && !submitted && (
          <span className="text-[11px] font-bold leading-[14px] text-red-600 bg-red-100 px-2.5 py-1 rounded-lg">Overdue</span>
        )}
        {submitted && !graded && (
          <span className="text-[11px] font-bold leading-[14px] text-brand bg-indigo-50 px-2.5 py-1 rounded-lg">Submitted</span>
        )}
        {graded && (
          <span className="text-[11px] font-bold leading-[14px] text-green-700 bg-green-50 px-2.5 py-1 rounded-lg">Graded</span>
        )}
      </div>

      <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))' }}>
        {/* Details */}
        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-[20px] border border-slate-100 p-6 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
            <div className="text-[15px] font-bold leading-5 t-primary">Assignment Details</div>
            <div className="flex gap-6 mt-4 flex-wrap">
              <div>
                <div className="text-[11px] font-semibold leading-[14px] text-slate-400 uppercase tracking-wide">DUE DATE</div>
                <div className={`text-[13px] font-bold leading-[18px] mt-1 ${isOverdue ? 'text-red-600' : 't-primary'}`}>
                  {new Date(asgn.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              <div>
                <div className="text-[11px] font-semibold leading-[14px] text-slate-400 uppercase tracking-wide">MAX MARKS</div>
                <div className="text-[13px] font-bold leading-[18px] text-brand mt-1">{asgn.max_marks}</div>
              </div>
            </div>
            {asgn.description && (
              <div className="mt-4 px-4 py-3.5 bg-slate-50 rounded-xl t-base font-normal leading-[22px] text-slate-600">
                {asgn.description}
              </div>
            )}
            {asgn.file_url && (
              <a href={asgn.file_url} target="_blank" rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-brand font-semibold text-[13px] no-underline">
                <FileText size={14} /> Download attachment
              </a>
            )}
          </div>

          {/* Graded result */}
          {graded && (
            <div className="bg-green-50 border border-green-200 rounded-[20px] p-6">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle size={18} color="#16a34a" />
                <span className="text-[15px] font-bold leading-5 text-green-700">Graded</span>
              </div>
              <div className="text-[32px] font-extrabold leading-10 t-primary">
                {submitted.marks}<span className="text-[16px] font-medium leading-5 text-slate-500">/{asgn.max_marks}</span>
              </div>
              {submitted.feedback && (
                <div className="mt-2.5 t-base font-normal leading-5 text-slate-600">{submitted.feedback}</div>
              )}
            </div>
          )}
        </div>

        {/* Submission panel */}
        <div className="bg-white rounded-[20px] border border-slate-100 p-6 shadow-[0_2px_8px_rgba(0,0,0,0.03)] h-fit">
          <div className="text-[15px] font-bold leading-5 t-primary">
            {submitted ? 'Your Submission' : 'Submit Assignment'}
          </div>

          {submitted && !graded && (
            <div className="mt-3 px-3.5 py-2.5 bg-indigo-50 rounded-[10px] text-[12px] font-semibold leading-4 text-brand">
              Submitted {new Date(submitted.submitted_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </div>
          )}

          {!submitted && (
            <>
              <div className="mt-4">
                <div className="text-[12px] font-semibold leading-4 text-slate-700">Text Answer (optional)</div>
                <textarea
                  value={text} onChange={e => setText(e.target.value)}
                  placeholder="Type your answer here..."
                  rows={5}
                  className="w-full mt-1.5 px-3 py-2.5 rounded-[10px] border-[1.5px] border-slate-200 text-[14px] resize-y outline-none box-border focus:border-brand transition-colors"
                />
              </div>

              <div className="mt-3.5">
                <div className="text-[12px] font-semibold leading-4 text-slate-700">Upload File (optional)</div>
                <input type="file" ref={fileRef} onChange={handleFileSelect} accept=".pdf,.doc,.docx,.jpg,.png" className="hidden" />
                {preview ? (
                  <div className="mt-2 flex items-center gap-2 px-3.5 py-2.5 bg-green-50 rounded-[10px]">
                    <FileText size={16} color="#16a34a" />
                    <span className="text-[13px] font-semibold leading-[18px] text-green-700">{uploading ? 'Uploading...' : preview}</span>
                  </div>
                ) : (
                  <button onClick={() => fileRef.current?.click()} disabled={uploading}
                    className="mt-2 w-full py-2.5 border-2 border-dashed border-slate-200 rounded-[10px] bg-slate-50 cursor-pointer text-[13px] font-semibold leading-[18px] text-slate-500 flex items-center justify-center gap-2">
                    <Upload size={14} /> Choose file
                  </button>
                )}
              </div>

              {error && (
                <div className="mt-2.5 flex items-center gap-1.5 px-3 py-2 bg-red-50 rounded-lg">
                  <AlertCircle size={14} color="#dc2626" />
                  <span className="text-[12px] font-semibold leading-4 text-red-600">{error}</span>
                </div>
              )}

              <button onClick={handleSubmit} disabled={submitting || uploading}
                className={`mt-4 w-full py-3 rounded-xl border-none text-white text-[14px] font-bold leading-5 transition-colors ${submitting || uploading ? 'bg-slate-200 cursor-not-allowed' : 'bg-brand cursor-pointer'}`}>
                {submitting ? 'Submitting...' : 'Submit Assignment'}
              </button>
            </>
          )}

          {submitted?.file_url && (
            <a href={submitted.file_url} target="_blank" rel="noopener noreferrer"
              className="mt-3 flex items-center gap-1.5 text-brand font-semibold text-[13px] no-underline">
              <FileText size={14} /> View submitted file
            </a>
          )}
          {submitted?.text_content && (
            <div className="mt-3 px-3.5 py-3 bg-slate-50 rounded-[10px] text-[13px] font-normal leading-5 text-slate-600">
              {submitted.text_content}
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  )
}
