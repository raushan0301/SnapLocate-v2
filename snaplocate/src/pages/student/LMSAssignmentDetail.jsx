import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'
import { ClipboardList, Upload, FileText, CheckCircle, ArrowLeft, Clock, AlertCircle } from 'lucide-react'

const pjs = (size, weight, lh, color) => ({
  fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: size, fontWeight: weight, lineHeight: lh, color,
})

export default function LMSAssignmentDetail() {
  const { id }        = useParams()
  const navigate      = useNavigate()
  const fileRef       = useRef(null)
  const [asgn, setAsgn]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [text, setText]         = useState('')
  const [fileUrl, setFileUrl]   = useState('')
  const [preview, setPreview]   = useState(null)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState(false)

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
    } catch (err) {
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
      if (res.success) {
        setSuccess(true)
        load()
      } else {
        setError(res.error || 'Submission failed')
      }
    } catch (err) {
      setError(err?.message || 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  const isOverdue = asgn && new Date(asgn.due_date) < Date.now()
  const submitted = asgn?.my_submission
  const graded    = submitted?.status === 'graded'

  if (loading) return <PageLayout><div style={{ padding: 60, textAlign: 'center', ...pjs(14, 500, '20px', '#94a3b8') }}>Loading...</div></PageLayout>
  if (!asgn)   return <PageLayout><div style={{ padding: 60, textAlign: 'center', ...pjs(14, 500, '20px', '#94a3b8') }}>Assignment not found.</div></PageLayout>

  return (
    <PageLayout>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => navigate(-1)} style={{ width: 36, height: 36, borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ArrowLeft size={16} color="#64748b" />
        </button>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0 }}>{asgn.title}</h1>
        {isOverdue && !submitted && <span style={{ ...pjs(11, 700, '14px', '#dc2626'), background: '#fee2e2', padding: '4px 10px', borderRadius: 8 }}>Overdue</span>}
        {submitted && !graded && <span style={{ ...pjs(11, 700, '14px', '#4f46e5'), background: '#eef2ff', padding: '4px 10px', borderRadius: 8 }}>Submitted</span>}
        {graded && <span style={{ ...pjs(11, 700, '14px', '#16a34a'), background: '#f0fdf4', padding: '4px 10px', borderRadius: 8 }}>Graded</span>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>
        {/* Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
            <div style={pjs(15, 700, '20px', '#0f172a')}>Assignment Details</div>
            <div style={{ display: 'flex', gap: 24, marginTop: 16, flexWrap: 'wrap' }}>
              <div>
                <div style={pjs(11, 600, '14px', '#94a3b8')}>DUE DATE</div>
                <div style={{ ...pjs(13, 700, '18px', isOverdue ? '#dc2626' : '#0f172a'), marginTop: 4 }}>
                  {new Date(asgn.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              <div>
                <div style={pjs(11, 600, '14px', '#94a3b8')}>MAX MARKS</div>
                <div style={{ ...pjs(13, 700, '18px', '#4f46e5'), marginTop: 4 }}>{asgn.max_marks}</div>
              </div>
            </div>
            {asgn.description && (
              <div style={{ marginTop: 16, padding: '14px 16px', background: '#f8fafc', borderRadius: 12, ...pjs(14, 400, '22px', '#475569') }}>
                {asgn.description}
              </div>
            )}
            {asgn.file_url && (
              <a href={asgn.file_url} target="_blank" rel="noopener noreferrer"
                style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 6, color: '#4f46e5', fontWeight: 600, fontSize: 13 }}>
                <FileText size={14} /> Download attachment
              </a>
            )}
          </div>

          {/* Graded result */}
          {graded && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 20, padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <CheckCircle size={18} color="#16a34a" />
                <span style={pjs(15, 700, '20px', '#16a34a')}>Graded</span>
              </div>
              <div style={{ ...pjs(32, 800, '40px', '#0f172a') }}>{submitted.marks}<span style={pjs(16, 500, '20px', '#64748b')}>/{asgn.max_marks}</span></div>
              {submitted.feedback && <div style={{ marginTop: 10, ...pjs(14, 400, '20px', '#475569') }}>{submitted.feedback}</div>}
            </div>
          )}
        </div>

        {/* Submission panel */}
        <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', height: 'fit-content' }}>
          <div style={pjs(15, 700, '20px', '#0f172a')}>
            {submitted ? 'Your Submission' : 'Submit Assignment'}
          </div>

          {submitted && !graded && (
            <div style={{ marginTop: 12, padding: '10px 14px', background: '#eef2ff', borderRadius: 10, ...pjs(12, 600, '16px', '#4f46e5') }}>
              Submitted {new Date(submitted.submitted_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </div>
          )}

          {!submitted && (
            <>
              <div style={{ marginTop: 16 }}>
                <div style={pjs(12, 600, '16px', '#374151')}>Text Answer (optional)</div>
                <textarea
                  value={text} onChange={e => setText(e.target.value)}
                  placeholder="Type your answer here..."
                  rows={5}
                  style={{ width: '100%', marginTop: 6, padding: '10px 12px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 14, fontFamily: "'Plus Jakarta Sans', sans-serif", resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = '#4f46e5'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>

              <div style={{ marginTop: 14 }}>
                <div style={pjs(12, 600, '16px', '#374151')}>Upload File (optional)</div>
                <input type="file" ref={fileRef} onChange={handleFileSelect} accept=".pdf,.doc,.docx,.jpg,.png" style={{ display: 'none' }} />
                {preview ? (
                  <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#f0fdf4', borderRadius: 10 }}>
                    <FileText size={16} color="#16a34a" />
                    <span style={pjs(13, 600, '18px', '#16a34a')}>{uploading ? 'Uploading...' : preview}</span>
                  </div>
                ) : (
                  <button onClick={() => fileRef.current?.click()} disabled={uploading}
                    style={{ marginTop: 8, width: '100%', padding: '10px', border: '2px dashed #e2e8f0', borderRadius: 10, background: '#fafafa', cursor: 'pointer', ...pjs(13, 600, '18px', '#64748b'), display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <Upload size={14} /> Choose file
                  </button>
                )}
              </div>

              {error && (
                <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', background: '#fee2e2', borderRadius: 8 }}>
                  <AlertCircle size={14} color="#dc2626" />
                  <span style={pjs(12, 600, '16px', '#dc2626')}>{error}</span>
                </div>
              )}

              <button onClick={handleSubmit} disabled={submitting || uploading}
                style={{ marginTop: 16, width: '100%', padding: '12px', borderRadius: 12, border: 'none', background: submitting || uploading ? '#e2e8f0' : '#4f46e5', color: '#fff', cursor: submitting || uploading ? 'not-allowed' : 'pointer', ...pjs(14, 700, '20px', '#fff') }}>
                {submitting ? 'Submitting...' : 'Submit Assignment'}
              </button>
            </>
          )}

          {submitted?.file_url && (
            <a href={submitted.file_url} target="_blank" rel="noopener noreferrer"
              style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6, color: '#4f46e5', fontWeight: 600, fontSize: 13 }}>
              <FileText size={14} /> View submitted file
            </a>
          )}
          {submitted?.text_content && (
            <div style={{ marginTop: 12, padding: '12px 14px', background: '#f8fafc', borderRadius: 10, ...pjs(13, 400, '20px', '#475569') }}>
              {submitted.text_content}
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  )
}
