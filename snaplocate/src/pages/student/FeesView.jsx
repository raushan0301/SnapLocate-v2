import { useState, useEffect, useCallback } from 'react'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'
import { CreditCard, AlertCircle, CheckCircle, FileText } from 'lucide-react'

const pjs = (size, weight, lh, color) => ({
  fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: size, fontWeight: weight, lineHeight: lh, color,
})

const statusStyle = {
  paid:    { bg: '#f0fdf4', color: '#16a34a', label: 'Paid' },
  partial: { bg: '#fef3c7', color: '#d97706', label: 'Partial' },
  pending: { bg: '#f8fafc', color: '#64748b', label: 'Pending' },
  overdue: { bg: '#fee2e2', color: '#dc2626', label: 'Overdue' },
  waived:  { bg: '#eef2ff', color: '#4f46e5', label: 'Waived'  },
}

function fmt(n) {
  return '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })
}

export default function FeesView() {
  const [records, setRecords] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const res = await api.get('/api/fees/summary')
      if (res.success) {
        setRecords(res.data || [])
        setSummary(res.summary || null)
      }
    } catch {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <PageLayout>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 44, height: 44, borderRadius: 14, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CreditCard size={22} color="#d97706" />
        </div>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#0f172a', margin: 0 }}>Fee Status</h1>
          <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>Your semester-wise fee payment records.</p>
        </div>
      </div>

      {!loading && summary && (
        <>
          {summary.overdue_count > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 14, padding: '12px 18px' }}>
              <AlertCircle size={16} color="#dc2626" />
              <span style={pjs(13, 600, '18px', '#dc2626')}>{summary.overdue_count} overdue payment{summary.overdue_count > 1 ? 's' : ''}. Please clear dues immediately.</span>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {[
              { label: 'Total Due',   value: fmt(summary.total_due),   color: '#0f172a', bg: '#f8fafc' },
              { label: 'Total Paid',  value: fmt(summary.total_paid),  color: '#16a34a', bg: '#f0fdf4' },
              { label: 'Balance',     value: fmt(summary.balance),     color: summary.balance > 0 ? '#dc2626' : '#16a34a', bg: summary.balance > 0 ? '#fee2e2' : '#f0fdf4' },
            ].map((s, i) => (
              <div key={i} style={{ background: s.bg, borderRadius: 20, padding: '20px 24px', border: '1px solid #f1f5f9' }}>
                <div style={pjs(12, 600, '16px', '#64748b')}>{s.label}</div>
                <div style={{ ...pjs(26, 800, '34px', s.color), marginTop: 6 }}>{s.value}</div>
              </div>
            ))}
          </div>
        </>
      )}

      <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9', boxShadow: '0 4px 24px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', ...pjs(14, 500, '20px', '#94a3b8') }}>Loading fee records...</div>
        ) : records.length === 0 ? (
          <div style={{ padding: '60px 24px', textAlign: 'center' }}>
            <CreditCard size={40} color="#e2e8f0" style={{ margin: '0 auto 12px', display: 'block' }} />
            <div style={pjs(15, 600, '20px', '#0f172a')}>No fee records found</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  {['Semester', 'Type', 'Amount Due', 'Amount Paid', 'Due Date', 'Status', 'Receipt'].map(h => (
                    <th key={h} style={{ padding: '13px 20px', textAlign: 'left', ...pjs(11, 700, '14px', '#64748b'), textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.map((r, i) => {
                  const ss = statusStyle[r.status] || statusStyle.pending
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid #f8fafc' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '14px 20px', ...pjs(13, 700, '18px', '#0f172a') }}>Sem {r.semester}</td>
                      <td style={{ padding: '14px 20px', ...pjs(13, 500, '18px', '#475569') }}>{r.fee_type?.charAt(0).toUpperCase() + r.fee_type?.slice(1)}</td>
                      <td style={{ padding: '14px 20px', ...pjs(13, 700, '18px', '#0f172a') }}>{fmt(r.amount_due)}</td>
                      <td style={{ padding: '14px 20px', ...pjs(13, 600, '18px', '#16a34a') }}>{fmt(r.amount_paid)}</td>
                      <td style={{ padding: '14px 20px', ...pjs(13, 400, '18px', '#64748b') }}>
                        {r.due_date ? new Date(r.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{ ...pjs(11, 700, '14px', ss.color), background: ss.bg, padding: '4px 10px', borderRadius: 8 }}>{ss.label}</span>
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        {r.receipt_url
                          ? <a href={r.receipt_url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#4f46e5', fontWeight: 600, fontSize: 13 }}><FileText size={13} /> View</a>
                          : <span style={pjs(12, 400, '16px', '#cbd5e1')}>—</span>
                        }
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageLayout>
  )
}
