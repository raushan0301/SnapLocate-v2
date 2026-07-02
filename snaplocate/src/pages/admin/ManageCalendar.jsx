import React, { useState, useEffect } from 'react'
import AdminPageTemplate from '../../components/admin/AdminPageTemplate'
import ImageCropper from '../../components/ImageCropper'
import api from '../../lib/api'

export default function ManageCalendar() {
  const [loading, setLoading] = useState(true)
  const [calendars, setCalendars] = useState([])
  const [imageToCrop, setImageToCrop] = useState(null)
  const [imageAspectRatio, setImageAspectRatio] = useState(16 / 9)
  const [uploadingImage, setUploadingImage] = useState(false)

  const fetchCalendars = async () => {
    try {
      const res = await api.get('/api/settings/calendar_images')
      if (res.success && res.value) {
        setCalendars(Array.isArray(res.value) ? res.value : [res.value])
      }
    } catch (err) { console.error('Failed to load calendars:', err) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchCalendars() }, [])

  const saveCalendarsToBackend = async (newCalendars) => {
    try {
      await api.post('/api/settings', { key: 'calendar_images', value: newCalendars })
      setCalendars(newCalendars)
    } catch { alert('Failed to save calendars.') }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]; if (!file) return
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => { setImageAspectRatio(img.width / img.height); setImageToCrop(url) }
    img.src = url
    e.target.value = null
  }

  const handleCropComplete = async (croppedBlob) => {
    setImageToCrop(null); setUploadingImage(true)
    try {
      const fileForm = new FormData()
      fileForm.append('file', croppedBlob); fileForm.append('type', 'workspace')
      const uploadRes = await api.upload('/api/upload/image', fileForm)
      if (uploadRes?.success) {
        const newCal = { id: Date.now().toString(), url: uploadRes.url }
        await saveCalendarsToBackend([...calendars, newCal])
        alert('Calendar added successfully!')
      }
    } catch (err) { alert('Failed to upload calendar image'); console.error(err) }
    finally { setUploadingImage(false) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this calendar?')) return
    await saveCalendarsToBackend(calendars.filter(c => c.id !== id))
  }

  return (
    <AdminPageTemplate
      title="Manage Academic Calendars"
      description="Upload and organize multiple calendar images to show students and faculty."
      hideTable={true}
    >
      <div className="bg-white p-6 rounded-[16px] border border-slate-200">

        <div className="flex justify-between items-center mb-6 pb-6 border-b border-slate-100">
          <div>
            <h3 className="text-[18px] font-bold t-primary mt-0 mb-2">Add New Calendar</h3>
            <p className="text-[14px] t-muted m-0">Upload an image, crop it, and append it to the list.</p>
          </div>
          <div>
            <input type="file" id="calendar-upload" accept="image/*" onChange={handleFileChange} className="hidden" />
            <label htmlFor="calendar-upload"
              className={`inline-flex items-center gap-2 px-5 py-3 rounded-[8px] text-white font-bold transition-colors ${uploadingImage ? 'bg-slate-400 cursor-not-allowed' : 'bg-brand cursor-pointer'}`}>
              {uploadingImage ? 'Uploading...' : '+ Upload & Crop'}
            </label>
          </div>
        </div>

        <h3 className="text-[18px] font-bold t-primary mt-0 mb-5">Current Calendars ({calendars.length})</h3>

        {loading ? (
          <div className="py-10 text-center t-muted">Loading calendars...</div>
        ) : calendars.length > 0 ? (
          <div className="flex flex-col gap-6">
            {calendars.map((c, i) => (
              <div key={c.id} className="border border-slate-200 rounded-[12px] p-4 bg-slate-50 flex gap-5 items-start">
                <div className="w-10 h-10 bg-indigo-100 text-brand rounded-full flex items-center justify-center font-bold shrink-0">
                  {i + 1}
                </div>
                <img src={c.url} alt={`Calendar ${i + 1}`}
                  className="flex-1 min-w-0 max-w-[500px] rounded-[8px] border border-slate-300" />
                <button onClick={() => handleDelete(c.id)}
                  className="px-4 py-2 rounded-[8px] bg-red-100 text-red-500 border border-red-200 font-semibold cursor-pointer hover:bg-red-200 transition-colors">
                  Delete
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-slate-300 bg-slate-50 py-[60px] text-center rounded-[12px]">
            <p className="font-semibold text-[16px] text-slate-400 m-0 mb-2">No Calendars Found</p>
            <p className="m-0 text-[14px] t-muted">Upload one using the button above.</p>
          </div>
        )}
      </div>

      {imageToCrop && (
        <ImageCropper
          imageSrc={imageToCrop} title="Crop Calendar Image"
          buttonText="Upload Calendar" aspect={imageAspectRatio}
          cropShape="rect" onCancel={() => setImageToCrop(null)}
          onCropComplete={handleCropComplete}
        />
      )}
    </AdminPageTemplate>
  )
}
