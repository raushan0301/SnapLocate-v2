import { useState } from 'react'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'
import { Upload, Download, CheckCircle, XCircle, AlertTriangle, BookOpen, Users, BarChart2, CalendarCheck, ChevronDown } from 'lucide-react'

function Toast({ msg, type }) {
  if (!msg) return null
  return (
    <div className={`fixed bottom-6 right-6 z-[999] px-5 py-3 rounded-[12px] text-white text-[14px] font-semibold ${type === 'error' ? 'bg-red-600' : 'bg-slate-900'}`}>
      {msg}
    </div>
  )
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
  const { label, icon: Icon, color, bg, border, endpoint, template, description, format, example, requiresId, idLabel, idPlaceholder } = type
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
    setLoading(true); setResult(null)
    try {
      const url = requiresId ? `${endpoint}/${entityId.trim()}` : endpoint
      const res = await api.post(url, { csv_text: csvText })
      setResult(res)
    } catch (e) {
      setResult({ success: false, error: e?.message || 'Network error' })
    } finally { setLoading(false) }
  }

  const handleFileRead = (e) => {
    const file = e.target.files[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setCsvText(ev.target.result)
    reader.readAsText(file); e.target.value = ''
  }

  const disabled = loading || !csvText.trim() || (requiresId && !entityId.trim())

  return (
    <div className="bg-white rounded-[20px] overflow-hidden transition-all"
      style={{ border: `1.5px solid ${expanded ? border : '#f1f5f9'}`, boxShadow: expanded ? '0 4px 24px rgba(0,0,0,0.06)' : '0 2px 8px rgba(0,0,0,0.03)' }}>

      <div onClick={() => setExpanded(e => !e)}
        className="flex items-center gap-3.5 px-5 py-[18px] cursor-pointer transition-colors"
        style={{ background: expanded ? bg : 'transparent' }}>
        <div className="w-[42px] h-[42px] rounded-[12px] flex items-center justify-center shrink-0"
          style={{ background: bg, border: `1.5px solid ${border}` }}>
          <Icon size={20} color={color} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[15px] font-bold t-primary">{label}</div>
          <div className="text-[12px] t-muted">{description}</div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={e => { e.stopPropagation(); downloadTemplate() }}
            className="flex items-center gap-[5px] px-3 py-[6px] rounded-[8px] text-[12px] font-semibold cursor-pointer"
            style={{ border: `1.5px solid ${border}`, background: bg, color }}>
            <Download size={12} /> Template
          </button>
          <ChevronDown size={16} className={`text-slate-400 transition-transform ${expanded ? 'rotate-180' : 'rotate-0'}`} />
        </div>
      </div>

      {expanded && (
        <div className="px-5 pb-5" style={{ borderTop: `1px solid ${border}20` }}>
          <div className="bg-slate-50 rounded-[12px] px-3.5 py-3 my-4 border border-slate-100">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.08em] mb-1.5">CSV Format</div>
            <code className="text-[12px] text-slate-700 font-mono block mb-1">{format}</code>
            <div className="text-[11px] t-muted mt-0.5">
              Example: <code className="text-[11px] text-slate-500">{example}</code>
            </div>
          </div>

          {requiresId && (
            <div className="mb-3.5">
              <div className="text-[12px] font-semibold text-slate-700 mb-1">
                {idLabel} <span className="text-red-500">*</span>
              </div>
              <input value={entityId} onChange={e => setEntityId(e.target.value)} placeholder={idPlaceholder}
                className="w-full mt-1 py-[9px] px-3 rounded-[10px] text-[13px] font-mono outline-none box-border transition-colors"
                style={{ border: `1.5px solid ${entityId ? border : '#e2e8f0'}` }} />
            </div>
          )}

          <div className="mb-3.5">
            <div className="flex items-center justify-between mb-1.5">
              <div className="text-[12px] font-semibold text-slate-700">CSV Data</div>
              <label className="flex items-center gap-[5px] px-2.5 py-[5px] rounded-[8px] border-[1.5px] border-slate-200 bg-white text-slate-500 text-[11px] font-semibold cursor-pointer hover:bg-slate-50 transition-colors">
                <Upload size={11} /> Upload .csv file
                <input type="file" accept=".csv" onChange={handleFileRead} className="hidden" />
              </label>
            </div>
            <textarea value={csvText} onChange={e => setCsvText(e.target.value)} rows={6}
              placeholder={`Paste CSV here or upload a file above...\n${format}\n${example}`}
              className="w-full py-[10px] px-3 rounded-[10px] text-[13px] font-mono outline-none box-border resize-y leading-relaxed"
              style={{ border: `1.5px solid ${csvText ? border : '#e2e8f0'}` }} />
            <div className="text-[11px] t-muted mt-1">
              {csvText ? `${csvText.trim().split('\n').length - 1} data rows detected` : 'First row must be header'}
            </div>
          </div>

          <button onClick={handleUpload} disabled={disabled}
            className="w-full flex items-center justify-center gap-2 py-[11px] rounded-[12px] border-none text-white text-[14px] font-bold transition-colors"
            style={{
              background: disabled ? '#e2e8f0' : `linear-gradient(135deg, ${color}, ${color}cc)`,
              cursor: disabled ? 'not-allowed' : 'pointer',
            }}>
            <Upload size={16} />
            {loading ? 'Uploading...' : `Upload ${label}`}
          </button>

          {result && (
            <div className={`mt-3.5 p-3.5 rounded-[12px] border-[1.5px] ${result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className={`flex items-center gap-2 ${result.errors?.length ? 'mb-2.5' : ''}`}>
                {result.success
                  ? <CheckCircle size={16} className="text-green-600" />
                  : <XCircle size={16} className="text-red-600" />}
                <span className={`text-[13px] font-bold ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                  {result.success
                    ? `Success! ${result.created || result.enrolled || result.saved || result.records_saved || 0} records processed${result.failed || result.failed_rows ? ` · ${result.failed || result.failed_rows} failed` : ''}`
                    : result.error || 'Upload failed'}
                </span>
              </div>
              {result.errors?.length > 0 && (
                <div className="max-h-[160px] overflow-y-auto">
                  {result.errors.map((e, i) => (
                    <div key={i} className={`flex items-start gap-1.5 py-1 ${i > 0 ? 'border-t border-black/5' : ''}`}>
                      <AlertTriangle size={12} className="text-amber-600 shrink-0 mt-0.5" />
                      <span className="text-[11px] text-amber-900">{e}</span>
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
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-[14px] flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#eef2ff,#e0e7ff)' }}>
            <Upload size={22} color="#4f46e5" />
          </div>
          <div>
            <h1 className="text-[26px] font-extrabold t-primary m-0">Bulk Data Upload</h1>
            <p className="text-[13px] t-muted m-0">Import courses, enrollments, marks and attendance from CSV files</p>
          </div>
        </div>
      </div>

      <div className="rounded-[16px] p-[18px] border-[1.5px] border-indigo-200"
        style={{ background: 'linear-gradient(135deg,#eef2ff,#e0e7ff)' }}>
        <div className="flex items-start gap-2.5">
          <AlertTriangle size={16} color="#4f46e5" className="shrink-0 mt-0.5" />
          <div>
            <div className="text-[13px] font-bold text-indigo-900 mb-1">How bulk upload works</div>
            <div className="text-[12px] text-indigo-700 leading-relaxed">
              1. Download the CSV template for each type. &nbsp;
              2. Fill your data following the column format. &nbsp;
              3. Upload or paste the CSV. &nbsp;
              4. Review the row-level error report. &nbsp;
              For <b>enrollments, grades, and attendance</b> — you need the Section/Course ID from the <b>LMS Structure</b> page.
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {UPLOAD_TYPES.map(t => <UploadCard key={t.key} type={t} />)}
      </div>
    </PageLayout>
  )
}
