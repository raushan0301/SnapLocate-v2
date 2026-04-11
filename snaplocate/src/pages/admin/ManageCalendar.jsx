import React, { useState, useEffect } from 'react'
import AdminPageTemplate from '../../components/admin/AdminPageTemplate'
import ImageCropper from '../../components/ImageCropper'
import api from '../../lib/api'

export default function ManageCalendar() {
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [calendars, setCalendars] = useState([]) // Array of objects: { id, url }
  
  // Crop states
  const [imageToCrop, setImageToCrop] = useState(null)
  const [imageAspectRatio, setImageAspectRatio] = useState(16/9)
  const [uploadingImage, setUploadingImage] = useState(false)

  const fetchCalendars = async () => {
    try {
      const res = await api.get('/api/settings/calendar_images')
      if (res.success && res.value) {
        // value should be an array, but we fallback
        setCalendars(Array.isArray(res.value) ? res.value : [res.value])
      }
    } catch (err) {
      console.error('Failed to load calendars:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCalendars()
  }, [])

  const saveCalendarsToBackend = async (newCalendars) => {
    try {
      await api.post('/api/settings', { key: 'calendar_images', value: newCalendars })
      setCalendars(newCalendars)
    } catch (err) {
      alert('Failed to save calendars.')
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const url = URL.createObjectURL(file)
      const img = new Image()
      img.onload = () => {
        setImageAspectRatio(img.width / img.height)
        setImageToCrop(url)
      }
      img.src = url
    }
    e.target.value = null // reset so same file can be picked again
  }

  const handleCropComplete = async (croppedBlob) => {
    setImageToCrop(null)
    setUploadingImage(true)
    try {
      const fileForm = new FormData()
      fileForm.append('file', croppedBlob)
      fileForm.append('type', 'workspace')
      
      const uploadRes = await api.upload('/api/upload/image', fileForm)
      if (uploadRes?.success) {
        const newCal = { id: Date.now().toString(), url: uploadRes.url }
        const newCalendars = [...calendars, newCal]
        await saveCalendarsToBackend(newCalendars)
        alert('Calendar added successfully!')
      }
    } catch (err) {
      alert('Failed to upload calendar image')
      console.error(err)
    } finally {
      setUploadingImage(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this calendar?")) return
    const newCalendars = calendars.filter(c => c.id !== id)
    await saveCalendarsToBackend(newCalendars)
  }

  return (
    <AdminPageTemplate
      title="Manage Academic Calendars"
      description="Upload and organize multiple calendar images to show students and faculty."
      hideTable={true}
    >
      <div style={{ background: '#fff', padding: 24, borderRadius: 16, border: '1px solid #e2e8f0' }}>

        {/* Upload Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid #f1f5f9' }}>
          <div>
            <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 18, marginTop: 0, marginBottom: 8, color: '#0f172a' }}>Add New Calendar</h3>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#64748b', margin: 0 }}>Upload an image, crop it, and append it to the list.</p>
          </div>

          <div>
            <input 
              type="file" 
              id="calendar-upload"
              accept="image/*" 
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <label htmlFor="calendar-upload" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: uploadingImage ? '#94a3b8' : '#4f46e5', color: '#fff', 
              padding: '12px 20px', borderRadius: 8, fontWeight: 700, 
              fontFamily: "'Plus Jakarta Sans', sans-serif", cursor: uploadingImage ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s'
            }}>
              {uploadingImage ? 'Uploading...' : '+ Upload & Crop'}
            </label>
          </div>
        </div>

        {/* Display Current Calendars */}
        <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 18, marginTop: 0, marginBottom: 20, color: '#0f172a' }}>
          Current Calendars ({calendars.length})
        </h3>
        
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading calendars...</div>
        ) : calendars.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {calendars.map((c, i) => (
              <div key={c.id} style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 16, background: '#f8fafc', display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                <div style={{ width: 40, height: 40, background: '#e0e7ff', color: '#4f46e5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                  {i + 1}
                </div>
                <img src={c.url} alt={`Calendar ${i+1}`} style={{ flex: 1, minWidth: 0, width: '100%', maxWidth: 500, borderRadius: 8, border: '1px solid #cbd5e1' }} />
                
                <button onClick={() => handleDelete(c.id)} style={{
                  background: '#fee2e2', color: '#ef4444', border: '1px solid #fecaca',
                  padding: '8px 16px', borderRadius: 8, fontWeight: 600, cursor: 'pointer', transition: '0.2s'
                }}>
                  Delete
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ border: '1px dashed #cbd5e1', background: '#f8fafc', padding: 60, textAlign: 'center', borderRadius: 12, color: '#94a3b8' }}>
            <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: 16, margin: '0 0 8px' }}>No Calendars Found</p>
            <p style={{ fontFamily: "'Inter', sans-serif", margin: 0, fontSize: 14 }}>Upload one using the button above.</p>
          </div>
        )}
      </div>

      {imageToCrop && (
        <ImageCropper 
          imageSrc={imageToCrop} 
          title="Crop Calendar Image"
          buttonText="Upload Calendar"
          aspect={imageAspectRatio}
          cropShape="rect"
          onCancel={() => setImageToCrop(null)} 
          onCropComplete={handleCropComplete} 
        />
      )}
    </AdminPageTemplate>
  )
}
