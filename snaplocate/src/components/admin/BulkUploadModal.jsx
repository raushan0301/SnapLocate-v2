import React, { useState } from 'react'
import * as XLSX from 'xlsx'
import { X, UploadCloud, Download, FileSpreadsheet, AlertCircle } from 'lucide-react'

export default function BulkUploadModal({ isOpen, onClose, title, templateType, templateColumns, templateData, expectedHeaders, onUpload }) {
  const [file, setFile] = useState(null)
  const [parsedData, setParsedData] = useState([])
  const [error, setError] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  if (!isOpen) return null

  const handleDownloadTemplate = () => {
    // Create a worksheet with the template columns and optional dummy data
    const wsData = [templateColumns]
    if (templateData && templateData.length > 0) {
      wsData.push(...templateData)
    }
    const ws = XLSX.utils.aoa_to_sheet(wsData)
    // Create a workbook and append the worksheet
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Template')
    // Trigger download
    XLSX.writeFile(wb, `${templateType}_Bulk_Upload_Template.xlsx`)
  }

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (!selectedFile) return
    
    setFile(selectedFile)
    setError('')
    setParsedData([])
    
    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result
        const wb = XLSX.read(bstr, { type: 'binary' })
        const wsname = wb.SheetNames[0]
        const ws = wb.Sheets[wsname]
        const data = XLSX.utils.sheet_to_json(ws)
        
        if (data.length === 0) {
          setError('The uploaded file is empty.')
          return
        }

        // Validate headers loosely (ensure at least some required headers exist)
        const fileHeaders = Object.keys(data[0])
        const missingHeaders = expectedHeaders.filter(h => !fileHeaders.includes(h))
        
        if (missingHeaders.length > 0) {
          setError(`Missing required columns: ${missingHeaders.join(', ')}`)
          return
        }

        setParsedData(data)
      } catch (err) {
        setError('Failed to parse the file. Ensure it is a valid Excel (.xlsx) or CSV file.')
        console.error(err)
      }
    }
    reader.readAsBinaryString(selectedFile)
  }

  const handleConfirmUpload = async () => {
    if (parsedData.length === 0) return
    setIsProcessing(true)
    try {
      await onUpload(parsedData)
      setFile(null)
      setParsedData([])
      onClose()
    } catch (err) {
      setError(err.message || 'Upload failed.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
    }}>
      <div style={{
        background: '#fff', padding: 32, borderRadius: 24, width: '100%', maxWidth: 540,
        boxShadow: '0 20px 50px rgba(0,0,0,0.15)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 20, fontWeight: 800, color: '#0f172a' }}>
            {title || 'Bulk Upload'}
          </h2>
          <button onClick={onClose} disabled={isProcessing} style={{ border: 'none', background: '#f1f5f9', cursor: 'pointer', width: 32, height: 32, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
             <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <div style={{ flex: 1, padding: 16, background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <div style={{ fontWeight: 600, color: '#334155', fontSize: 14, marginBottom: 8 }}>Step 1: Download Template</div>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>Use our exact format to prevent errors during upload.</div>
            <button onClick={handleDownloadTemplate} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#4f46e5', transition: '0.2s' }} onMouseEnter={e => e.currentTarget.style.borderColor='#4f46e5'} onMouseLeave={e => e.currentTarget.style.borderColor='#cbd5e1'}>
              <Download size={16} /> Download .XLSX
            </button>
          </div>
        </div>

        <div style={{ fontWeight: 600, color: '#334155', fontSize: 14, marginBottom: 8 }}>Step 2: Upload Filled File</div>
        <div style={{ 
          position: 'relative', width: '100%', padding: '32px 20px', borderRadius: 16, 
          border: '2px dashed #cbd5e1', background: '#f8fafc', display: 'flex', 
          flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
          cursor: 'pointer', transition: '0.2s', marginBottom: 24
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = '#4f46e5'}
        onMouseLeave={e => e.currentTarget.style.borderColor = '#cbd5e1'}
        >
          {file ? (
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <FileSpreadsheet size={32} color="#4f46e5" />
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{file.name}</div>
              {parsedData.length > 0 && (
                <div style={{ fontSize: 13, color: '#10b981', fontWeight: 600, marginTop: 4 }}>
                  Ready to import {parsedData.length} records
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: '#64748b', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <UploadCloud size={28} />
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, fontWeight: 700 }}>Click to browse file</div>
              <div style={{ fontSize: 12 }}>Accepts .XLSX or .CSV</div>
            </div>
          )}
          <input type="file" style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} onChange={handleFileChange} accept=".xlsx, .csv" />
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '12px 16px', borderRadius: 12, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
            <AlertCircle color="#ef4444" size={20} />
            <div style={{ color: '#991b1b', fontSize: 13, fontWeight: 500 }}>{error}</div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 12 }}>
          <button type="button" onClick={onClose} disabled={isProcessing} style={{ flex: 1, padding: '14px', borderRadius: 12, border: '1.5px solid #e2e8f0', background: 'transparent', fontWeight: 600, color: '#475569', cursor: 'pointer' }}>Cancel</button>
          <button disabled={parsedData.length === 0 || isProcessing} onClick={handleConfirmUpload} style={{ 
            flex: 2, background: parsedData.length > 0 ? '#4f46e5' : '#94a3b8', color: '#fff', border: 'none', padding: '14px', borderRadius: 12, 
            fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 15, fontWeight: 700, cursor: (parsedData.length === 0 || isProcessing) ? 'not-allowed' : 'pointer'
          }}>
            {isProcessing ? 'Importing...' : 'Start Import'}
          </button>
        </div>
      </div>
    </div>
  )
}
