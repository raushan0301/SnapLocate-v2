import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'
import { CreditCard, AlertCircle, RefreshCw, ArrowLeft, CheckCircle } from 'lucide-react'

const pjs = (s, w, lh, c) => ({ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: s, fontWeight: w, lineHeight: lh, color: c })

const statusColors = {
  paid:    { bg: '#f0fdf4', color: '#16a34a', label: 'Paid' },
  partial: { bg: '#fef3c7', color: '#d97706', label: 'Partial' },
  pending: { bg: '#f1f5f9', color: '#64748b', label: 'Pending' },
  overdue: { bg: '#fee2e2', color: '#dc2626', label: 'Overdue' },
  waived:  { bg: '#eef2ff', color: '#4f46e5', label: 'Waived' },
}

const fmt = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })

export default function FeesView() {
  const [fees, setFees]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [syncing, setSyncing]   = useState(false)
  const [lastSync, setLastSync] = useState('')
  const [connected, setConnected] = useState(true)

  const load = useCallback(async () => {
    try {
      const res = await api.get('/api/webkiosk/fees')
      if (res.success) {
        setFees(res.data || null)
        setLastSync(res.lastSyncedAt || '')
      }
    } catch { setConnected(false) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const syncNow = async () => {
    setSyncing(true)
    try { await api.post('/api/webkiosk/sync', {}) } catch {}
    for (let i = 0; i < 40; i++) {
      await new Promise(r => setTimeout(r, 3000))
      const r = await api.get('/api/webkiosk/fees').catch(() => null)
      if (r?.syncStatus && r.syncStatus !== 'pending' && r.syncStatus !== 'running') {
        setFees(r.data || null)
        setLastSync(r.lastSyncedAt || '')
        break
      }
    }
    setSyncing(false)
  }

  const records  = fees?.records  || []
  const summary  = fees?.summary  || null
  const balance  = summary?.balance  ?? 0
  const totalDue = summary?.totalDue ?? 0
  const totalPaid= summary?.totalPaid?? 0

  return (
    <PageLayout>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link to="/webkiosk" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', textDecoration: 'none', ...pjs(13, 600, '18px', '#64748b') }}>
            <ArrowLeft size={14} /> WebKiosk
          </Link>
          <div>
            <h1 style={{ ...pjs(26, 800, '32px', '#0f172a'), margin: 0 }}>Fee Status</h1>
            <div style={{ ...pjs(12, 400, '16px', '#64748b'), marginTop: 2 }}>
              {lastSync ? `Synced ${new Date(lastSync).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}` : 'Not yet synced'}
            </div>
          </div>
        </div>
        <button onClick={syncNow} disabled={syncing} style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 12,
          border: 'none', cursor: syncing ? 'not-allowed' : 'pointer',
          background: syncing ? '#e2e8f0' : '#4f46e5',
          ...pjs(13, 700, '18px', syncing ? '#94a3b8' : '#fff'),
        }}>
          <RefreshCw size={13} style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
          {syncing ? 'Syncing…' : 'Sync Now'}
        </button>
      </div>

      {/* Balance alert */}
      {!loading && summary && balance > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 14, padding: '14px 20px' }}>
          <AlertCircle size={18} color="#dc2626" />
          <span style={pjs(14, 600, '20px', '#dc2626')}>Outstanding balance of {fmt(balance)}. Please clear dues to avoid hold on exam/results.</span>
        </div>
      )}
      {!loading && summary && balance <= 0 && records.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 14, padding: '14px 20px' }}>
          <CheckCircle size={18} color="#16a34a" />
          <span style={pjs(14, 600, '20px', '#16a34a')}>All fees paid. Your account is clear!</span>
        </div>
      )}

      {/* Summary cards */}
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
          {[
            { label: 'Total Due',  value: fmt(totalDue),  color: '#0f172a', bg: '#f8fafc' },
            { label: 'Total Paid', value: fmt(totalPaid), color: '#16a34a', bg: '#f0fdf4' },
            { label: 'Balance',    value: fmt(balance),   color: balance > 0 ? '#dc2626' : '#16a34a', bg: balance > 0 ? '#fef2f2' : '#f0fdf4' },
          ].map((s, i) => (
            <div key={i} style={{ background: s.bg, borderRadius: 20, padding: '22px 26px', border: '1px solid #f1f5f9', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
              <div style={pjs(12, 600, '16px', '#64748b')}>{s.label.toUpperCase()}</div>
              <div style={{ ...pjs(30, 800, '38px', s.color), marginTop: 6, fontVariantNumeric: 'tabular-nums' }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Records table */}
      <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', ...pjs(14, 500, '20px', '#94a3b8') }}>Loading fee records…</div>
        ) : !connected ? (
          <div style={{ padding: '60px 24px', textAlign: 'center' }}>
            <CreditCard size={40} color="#e2e8f0" style={{ margin: '0 auto 12px', display: 'block' }} />
            <div style={pjs(15, 600, '20px', '#0f172a')}>
              <Link to="/webkiosk" style={{ color: '#4f46e5', textDecoration: 'none' }}>Connect WebKiosk</Link> to see fee details.
            </div>
          </div>
        ) : records.length === 0 ? (
          <div style={{ padding: '60px 24px', textAlign: 'center' }}>
            <CreditCard size={40} color="#e2e8f0" style={{ margin: '0 auto 12px', display: 'block' }} />
            <div style={pjs(15, 600, '20px', '#0f172a')}>No fee records found. Sync to load.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  {['Semester', 'Fee Type', 'Amount Due', 'Amount Paid', 'Balance', 'Status'].map(h => (
                    <th key={h} style={{ padding: '14px 20px', textAlign: 'left', ...pjs(11, 700, '14px', '#64748b'), textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.map((r, i) => {
                  const st = statusColors[(r.status || '').toLowerCase()] || statusColors.pending
                  const bal = r.balance ?? (r.amountDue - r.amountPaid)
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid #f8fafc' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '14px 20px', ...pjs(13, 700, '18px', '#0f172a') }}>
                        {r.semester ? `Sem ${r.semester}` : '—'}
                      </td>
                      <td style={{ padding: '14px 20px', ...pjs(13, 500, '18px', '#475569') }}>
                        {r.feeType || '—'}
                      </td>
                      <td style={{ padding: '14px 20px', ...pjs(13, 700, '18px', '#0f172a') }}>{fmt(r.amountDue)}</td>
                      <td style={{ padding: '14px 20px', ...pjs(13, 600, '18px', '#16a34a') }}>{fmt(r.amountPaid)}</td>
                      <td style={{ padding: '14px 20px', ...pjs(13, 700, '18px', bal > 0 ? '#dc2626' : '#16a34a') }}>{fmt(bal)}</td>
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{ ...pjs(11, 700, '14px', st.color), background: st.bg, padding: '4px 10px', borderRadius: 8 }}>{st.label}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </PageLayout>
  )
}
