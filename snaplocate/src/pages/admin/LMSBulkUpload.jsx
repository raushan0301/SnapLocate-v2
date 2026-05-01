import { useState, useCallback } from 'react'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'
import { Upload, Download, CheckCircle, XCircle, AlertTriangle, BookOpen, Users, BarChart2, CalendarCheck, ChevronDown } from 'lucide-react'

const pjs = (sz, fw, lh, col) => ({ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:sz, fontWeight:fw, lineHeight:lh, color:col })

function Toast({ msg, type }) {
  if (!msg) return null
  return <div style={{ position:'fixed', bottom:24, right:24, background:type==='error'?'#dc2626':'#0f172a', color:'#fff', padding:'12px 20px', borderRadius:12, zIndex:999, fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:14, fontWeight:600 }}>{msg}</div>
}

const UPLOAD_TYPES = [
  {
    key: 'courses',
    label: 'Bulk Course Creation',
    icon: BookOpen,
    color: '#4f46e5', bg: '#eef2ff', border: '#c7d2fe',
    endpoint: '/api/lms/native/bulk/courses',
    template: 'courses',
    description: 'Create multiple native LMS courses at once.',
    format: 'code, title, academic_year, branch, semester, is_published',
    example: 'UCS701, Theory of Computation, 2025-26, CSE, 7, false',
    requiresId: false,
    idLabel: null,
  },
  {
    key: 'enrollments',
    label: 'Bulk Student Enrollment',
    icon: Users,
    color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0',
    endpoint: '/api/lms/native/bulk/enrollments',
    template: 'enrollments',
    description: 'Enroll students into a section by roll number + email.',
    format: 'roll_number, email',
    example: '102183001, student@thapar.edu',
    requiresId: true,
    idLabel: 'Section ID',
    idPlaceholder: 'Paste section UUID from LMS Structure page',
  },
  {
    key: 'grades',
    label: 'Bulk Marks Import',
    icon: BarChart2,
    color: '#d97706', bg: '#fffbeb', border: '#fde68a',
    endpoint: '/api/lms/native/bulk/grades',
    template: 'grades',
    description: 'Import MST1, MST2, End-Sem marks. Column headers must match your grade component names exactly.',
    format: 'roll_number, email, [component names...]',
    example: '102183001, student@thapar.edu, 14, 13, 52',
    requiresId: true,
    idLabel: 'Course ID',
    idPlaceholder: 'Paste course UUID from LMS Structure page',
  },
  {
    key: 'attendance',
    label: 'Bulk Attendance Import',
    icon: CalendarCheck,
    color: '#0284c7', bg: '#f0f9ff', border: '#bae6fd',
    endpoint: '/api/lms/native/bulk/attendance',
    template: 'attendance',
    description: 'Import historical attendance records. Date format: YYYY-MM-DD. Status: P, A, or L.',
    format: 'date, roll_number, email, status',
    example: '2026-02-03, 102183001, student@thapar.edu, P',
    requiresId: true,
    idLabel: 'Section ID',
    idPlaceholder: 'Paste section UUID from LMS Structure page',
  },
]

function UploadCard({ type }) {
  const { key, label, icon: Icon, color, bg, border, endpoint, template, description, format, example, requiresId, idLabel, idPlaceholder } = type
  const [expanded, setExpanded] = useState(false)
  const [csvText, setCsvText] = useState('')
  const [entityId, setEntityId] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const downloadTemplate = () => {
    window.open(`/api/lms/native/bulk/templates/${template}`, '_blank')
  }

  const handleUpload = async () => {
    if (!csvText.trim()) return
    if (requiresId && !entityId.trim()) return
    setLoading(true)
    setResult(null)
    try {
      const url = requiresId ? `${endpoint}/${entityId.trim()}` : endpoint
      const res = await api.post(url, { csv_text: csvText })
      setResult(res)
    } catch (e) {
      setResult({ success: false, error: e?.message || 'Network error' })
    } finally {
      setLoading(false)
    }
  }

  const handleFileRead = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setCsvText(ev.target.result)
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div style={{ background:'#fff', borderRadius:20, border:`1.5px solid ${expanded?border:'#f1f5f9'}`, boxShadow: expanded?`0 4px 24px rgba(0,0,0,0.06)`:'0 2px 8px rgba(0,0,0,0.03)', overflow:'hidden', transition:'all 0.2s' }}>
      {/* Header */}
      <div onClick={() => setExpanded(e => !e)}
        style={{ padding:'18px 20px', display:'flex', alignItems:'center', gap:14, cursor:'pointer', background: expanded?bg:'transparent' }}>
        <div style={{ width:42, height:42, borderRadius:12, background:bg, border:`1.5px solid ${border}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <Icon size={20} color={color} />
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={pjs(15,700,'20px','#0f172a')}>{label}</div>
          <div style={pjs(12,400,'16px','#64748b')}>{description}</div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <button onClick={e => { e.stopPropagation(); downloadTemplate() }}
            style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', borderRadius:8, border:`1.5px solid ${border}`, background:bg, cursor:'pointer', ...pjs(12,600,'16px',color) }}>
            <Download size={12} /> Template
          </button>
          <ChevronDown size={16} color="#94a3b8" style={{ transform: expanded?'rotate(180deg)':'none', transition:'transform 0.2s' }} />
        </div>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div style={{ padding:'0 20px 20px', borderTop:`1px solid ${border}20` }}>
          {/* Format hint */}
          <div style={{ background:'#f8fafc', borderRadius:12, padding:'12px 14px', margin:'16px 0', border:'1px solid #f1f5f9' }}>
            <div style={{ ...pjs(11,700,'14px','#94a3b8'), letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:6 }}>CSV Format</div>
            <code style={{ fontSize:12, color:'#334155', fontFamily:'monospace', display:'block', marginBottom:4 }}>{format}</code>
            <div style={{ ...pjs(11,400,'16px','#94a3b8'), marginTop:2 }}>Example: <code style={{ fontSize:11, color:'#475569' }}>{example}</code></div>
          </div>

          {/* Entity ID if needed */}
          {requiresId && (
            <div style={{ marginBottom:14 }}>
              <div style={pjs(12,600,'16px','#374151')}>{idLabel} <span style={{ color:'#dc2626' }}>*</span></div>
              <input value={entityId} onChange={e => setEntityId(e.target.value)} placeholder={idPlaceholder}
                style={{ width:'100%', marginTop:4, padding:'9px 12px', borderRadius:10, border:`1.5px solid ${entityId?border:'#e2e8f0'}`, fontSize:13, fontFamily:"'Plus Jakarta Sans',sans-serif", outline:'none', boxSizing:'border-box', fontFamily:'monospace' }} />
            </div>
          )}

          {/* CSV input */}
          <div style={{ marginBottom:14 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
              <div style={pjs(12,600,'16px','#374151')}>CSV Data</div>
              <label style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 10px', borderRadius:8, border:'1.5px solid #e2e8f0', background:'#fff', cursor:'pointer', ...pjs(11,600,'14px','#475569') }}>
                <Upload size={11} /> Upload .csv file
                <input type="file" accept=".csv" onChange={handleFileRead} style={{ display:'none' }} />
              </label>
            </div>
            <textarea value={csvText} onChange={e => setCsvText(e.target.value)} rows={6}
              placeholder={`Paste CSV here or upload a file above...\n${format}\n${example}`}
              style={{ width:'100%', padding:'10px 12px', borderRadius:10, border:`1.5px solid ${csvText?border:'#e2e8f0'}`, fontSize:13, fontFamily:'monospace', outline:'none', boxSizing:'border-box', resize:'vertical', lineHeight:'1.6' }} />
            <div style={{ ...pjs(11,400,'14px','#94a3b8'), marginTop:4 }}>
              {csvText ? `${csvText.trim().split('\n').length - 1} data rows detected` : 'First row must be header'}
            </div>
          </div>

          {/* Upload button */}
          <button onClick={handleUpload} disabled={loading || !csvText.trim() || (requiresId && !entityId.trim())}
            style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'11px 0', borderRadius:12, border:'none',
              background: loading||!csvText.trim()||(requiresId&&!entityId.trim()) ? '#e2e8f0' : `linear-gradient(135deg, ${color}, ${color}cc)`,
              cursor: loading||!csvText.trim()||(requiresId&&!entityId.trim()) ? 'not-allowed' : 'pointer',
              ...pjs(14,700,'20px','#fff') }}>
            <Upload size={16} />
            {loading ? 'Uploading...' : `Upload ${label}`}
          </button>

          {/* Result */}
          {result && (
            <div style={{ marginTop:14, padding:'14px', borderRadius:12, background: result.success?'#f0fdf4':'#fef2f2', border:`1.5px solid ${result.success?'#bbf7d0':'#fecaca'}` }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom: result.errors?.length?10:0 }}>
                {result.success
                  ? <CheckCircle size={16} color="#16a34a" />
                  : <XCircle size={16} color="#dc2626" />}
                <span style={pjs(13,700,'18px',result.success?'#16a34a':'#dc2626')}>
                  {result.success
                    ? `Success! ${result.created||result.enrolled||result.saved||result.records_saved||0} records processed${result.failed||result.failed_rows?` · ${result.failed||result.failed_rows} failed`:''}`
                    : result.error || 'Upload failed'}
                </span>
              </div>
              {result.errors?.length > 0 && (
                <div style={{ maxHeight:160, overflowY:'auto' }}>
                  {result.errors.map((e, i) => (
                    <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:6, padding:'4px 0', borderTop: i>0?'1px solid rgba(0,0,0,0.05)':'' }}>
                      <AlertTriangle size={12} color="#d97706" style={{ flexShrink:0, marginTop:2 }} />
                      <span style={pjs(11,400,'16px','#92400e')}>{e}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function BulkUpload() {
  return (
    <PageLayout>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ width:44, height:44, borderRadius:14, background:'linear-gradient(135deg,#eef2ff,#e0e7ff)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Upload size={22} color="#4f46e5" />
            </div>
            <div>
              <h1 style={{ fontSize:26, fontWeight:800, color:'#0f172a', margin:0 }}>Bulk Data Upload</h1>
              <p style={{ fontSize:13, color:'#64748b', margin:0 }}>Import courses, enrollments, marks and attendance from CSV files</p>
            </div>
          </div>
        </div>
      </div>

      {/* Info banner */}
      <div style={{ background:'linear-gradient(135deg,#eef2ff,#e0e7ff)', border:'1.5px solid #c7d2fe', borderRadius:16, padding:'14px 18px' }}>
        <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
          <AlertTriangle size={16} color="#4f46e5" style={{ flexShrink:0, marginTop:2 }} />
          <div>
            <div style={pjs(13,700,'18px','#3730a3')}>How bulk upload works</div>
            <div style={pjs(12,400,'18px','#4f46e5')}>
              1. Download the CSV template for each type. &nbsp;
              2. Fill your data following the column format. &nbsp;
              3. Upload or paste the CSV. &nbsp;
              4. Review the row-level error report. &nbsp;
              For <b>enrollments, grades, and attendance</b> — you need the Section/Course ID from the <b>LMS Structure</b> page.
            </div>
          </div>
        </div>
      </div>

      {/* Upload cards */}
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {UPLOAD_TYPES.map(t => <UploadCard key={t.key} type={t} />)}
      </div>
    </PageLayout>
  )
}
