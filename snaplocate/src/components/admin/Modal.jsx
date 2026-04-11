import React from 'react'

const pjs = (size, weight, color) => ({
  fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: size, fontWeight: weight, color, margin: 0
})
const inter = (size, weight, color) => ({
  fontFamily: "'Inter', sans-serif", fontSize: size, fontWeight: weight, color, margin: 0
})

export default function Modal({ isOpen, onClose, title, children, width = 500 }) {
  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: 20
    }}>
      <div style={{
        background: '#ffffff', borderRadius: 24, width: '100%', maxWidth: width,
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)', overflow: 'hidden',
        display: 'flex', flexDirection: 'column', maxHeight: '90vh'
      }}>
        {/* Header */}
        <div style={{ 
          padding: '24px 28px', borderBottom: '1px solid #f1f5f9', 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <h2 style={{ ...pjs(20, 700, '#0f172a') }}>{title}</h2>
          <button 
            onClick={onClose}
            style={{ 
              background: 'transparent', border: 'none', fontSize: 24, 
              color: '#94a3b8', cursor: 'pointer', lineHeight: 1 
            }}
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '28px', overflowY: 'auto', flex: 1 }}>
          {children}
        </div>
      </div>
    </div>
  )
}
