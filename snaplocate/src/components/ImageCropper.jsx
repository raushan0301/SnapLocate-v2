import React, { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'

const f = (size, weight, lh, color) => ({
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  fontSize: size, fontWeight: weight, lineHeight: lh, color,
})

const getCroppedImg = (imageSrc, pixelCrop) => {
  const canvas = document.createElement('canvas')
  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height
  const ctx = canvas.getContext('2d')
  
  const image = new Image()
  image.src = imageSrc
  
  return new Promise((resolve, reject) => {
    image.onload = () => {
      ctx.drawImage(
        image,
        pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
        0, 0, pixelCrop.width, pixelCrop.height
      )
      canvas.toBlob((blob) => {
        if (!blob) return reject('Canvas is empty')
        blob.name = 'avatar.jpg'
        resolve(blob)
      }, 'image/jpeg', 0.95)
    }
    image.onerror = () => reject('Image load error')
  })
}

export default function ImageCropper({ 
  imageSrc, 
  onCropComplete, 
  onCancel,
  title = "Adjust Profile Picture",
  aspect = 1,
  cropShape = "round",
  buttonText = "Set Avatar"
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
  const [loading, setLoading] = useState(false)

  const onCropChange = useCallback((crop) => setCrop(crop), [])
  const onZoomChange = useCallback((zoom) => setZoom(zoom), [])
  const onCropCompleteEvent = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const handleSave = async () => {
    if (!croppedAreaPixels) return
    setLoading(true)
    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels)
      onCropComplete(croppedBlob)
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(15,23,42,0.7)',
      backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20
    }}>
      <div style={{
        background: '#fff', borderRadius: 24, width: '100%', maxWidth: 700,
        boxShadow: '0 24px 80px rgba(0,0,0,0.4)', overflow: 'hidden', display: 'flex', flexDirection: 'column'
      }}>
        <div style={{ padding: '24px 28px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={f(18, 800, '22px', '#0f172a')}>{title}</h2>
          <button onClick={onCancel} style={{ background:'transparent', border:'none', fontSize:24, color:'#94a3b8', cursor:'pointer' }}>&times;</button>
        </div>
        
        <div style={{ position: 'relative', width: '100%', height: 400, background: '#f8fafc' }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            cropShape={cropShape}
            showGrid={true}
            onCropChange={onCropChange}
            onCropComplete={onCropCompleteEvent}
            onZoomChange={onZoomChange}
          />
        </div>

        <div style={{ padding: '24px 28px', background: '#fff' }}>
          <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
             <span style={f(20, 700, '1', '#cbd5e1')}>-</span>
             <input
               type="range"
               value={zoom}
               min={1}
               max={3}
               step={0.1}
               aria-labelledby="Zoom"
               onChange={(e) => setZoom(e.target.value)}
               style={{ flex: 1, accentColor: '#4f46e5' }}
             />
             <span style={f(20, 700, '1', '#cbd5e1')}>+</span>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={onCancel} style={{ flex: 1, padding: '12px', borderRadius: 12, border: '1px solid #e2e8f0', background: 'transparent', cursor: 'pointer', ...f(13, 600, '18px', '#64748b') }}>
              Cancel
            </button>
            <button onClick={handleSave} disabled={loading} style={{ flex: 2, padding: '12px', borderRadius: 12, border: 'none', background: '#4f46e5', cursor: 'pointer', ...f(13, 700, '18px', '#fff'), boxShadow: '0 4px 12px rgba(79,70,229,.2)' }}>
              {loading ? 'Saving...' : buttonText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
