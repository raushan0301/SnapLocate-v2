import React, { useState } from 'react'
import { Pencil, Trash2, Plus, FileSpreadsheet } from 'lucide-react'
import PageLayout from '../PageLayout'

const pjs = (size, weight, color) => ({
  fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: size, fontWeight: weight, color, margin: 0
})
const inter = (size, weight, color) => ({
  fontFamily: "'Inter', sans-serif", fontSize: size, fontWeight: weight, color, margin: 0
})

export default function AdminPageTemplate({ title, description, columns, data, onAdd, onEdit, onDelete, onBulkUpload, loading, hideTable, headerAction, children }) {
  const [search, setSearch] = useState('')

  const filteredData = data ? data.filter(item => 
    Object.values(item).some(val => 
      String(val).toLowerCase().includes(search.toLowerCase())
    )
  ) : []

  return (
    <PageLayout>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
        <div>
          <h1 style={{ ...pjs(26, 700, '#0f172a'), lineHeight: '34px' }}>{title}</h1>
          <p style={{ ...inter(14, 400, '#64748b'), marginTop: 4 }}>{description}</p>
        </div>
        {headerAction && (
          <div>
            {headerAction}
          </div>
        )}
      </div>

      {hideTable ? children : (
        <>
          {children}
          <div style={{
            background: '#ffffff', borderRadius: 20, padding: 24,
            border: '1px solid #f1f5f9', boxShadow: '0 4px 24px rgba(0,0,0,0.03)',
            minHeight: 500
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  padding: '10px 16px', borderRadius: 10, border: '1.5px solid #e2e8f0',
                  ...inter(14, 400, '#0f172a'), width: '300px', outline: 'none',
                  transition: '0.2s'
                }}
                onFocus={e => e.target.style.borderColor = '#4f46e5'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              />
              <div style={{ display: 'flex', gap: 12 }}>
                {!hideTable && onBulkUpload && (
                  <button 
                    onClick={onBulkUpload}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '10px 20px', borderRadius: 10, border: '1.5px solid #cbd5e1', background: '#fff',
                      ...pjs(13, 700, '#475569'), cursor: 'pointer', transition: '0.2s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#94a3b8'; e.currentTarget.style.background = '#f8fafc' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.background = '#fff' }}
                  >
                    <FileSpreadsheet size={16} /> Bulk Upload
                  </button>
                )}
                {!hideTable && onAdd && (
                  <button 
                    onClick={onAdd}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '10px 20px', borderRadius: 10, border: 'none', background: '#4f46e5',
                      ...pjs(13, 700, '#ffffff'), cursor: 'pointer', transition: '0.2s',
                      boxShadow: '0 4px 12px rgba(79, 70, 229, 0.2)'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#4338ca'}
                    onMouseLeave={e => e.currentTarget.style.background = '#4f46e5'}
                  >
                    <Plus size={16} /> Add New
                  </button>
                )}
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ minWidth: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    {columns.map((col, i) => (
                      <th key={i} style={{
                        ...pjs(12, 600, '#64748b'), textTransform: 'uppercase', letterSpacing: '0.5px',
                        padding: '14px 16px', textAlign: 'left', whiteSpace: 'nowrap'
                      }}>
                        {col.label}
                      </th>
                    ))}
                    {(onEdit || onDelete) && (
                      <th style={{
                        ...pjs(12, 600, '#64748b'), textTransform: 'uppercase', letterSpacing: '0.5px',
                        padding: '14px 16px', textAlign: 'right'
                      }}>
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={columns.length + 1} style={{ padding: '40px 0', textAlign: 'center', ...inter(14, 500, '#64748b') }}>
                        Loading...
                      </td>
                    </tr>
                  ) : filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={columns.length + 1} style={{ padding: '40px 0', textAlign: 'center', ...inter(14, 500, '#64748b') }}>
                        No data found.
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((row, i) => (
                      <tr key={row.id || i} style={{ borderBottom: '1px solid #f1f5f9', transition: '0.15s' }}>
                        {columns.map((col, j) => (
                          <td key={j} style={{ padding: '16px', ...inter(14, 400, '#334155') }}>
                            {col.render ? col.render(row) : row[col.key]}
                          </td>
                        ))}
                        {(onEdit || onDelete) && (
                          <td style={{ padding: '16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                            {onEdit && (
                              <button 
                                onClick={() => onEdit(row)}
                                title="Edit Record"
                                style={{ 
                                  background: '#f8fafc', border: '1px solid #e2e8f0', color: '#4f46e5', 
                                  padding: '8px', borderRadius: '10px',
                                  cursor: 'pointer', marginRight: 8, transition: '0.2s',
                                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = '#eef2ff'; e.currentTarget.style.borderColor = '#4f46e5'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                              >
                                <Pencil size={16} />
                              </button>
                            )}
                            {onDelete && (
                              <button 
                                onClick={() => onDelete(row)}
                                title="Delete Record"
                                style={{ 
                                  background: '#f8fafc', border: '1px solid #fee2e2', color: '#ef4444', 
                                  padding: '8px', borderRadius: '10px',
                                  cursor: 'pointer', transition: '0.2s',
                                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.borderColor = '#ef4444'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#fee2e2'; }}
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </PageLayout>
  )
}
