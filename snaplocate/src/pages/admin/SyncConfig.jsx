import { useState, useEffect, useCallback } from 'react'
import PageLayout from '../../components/PageLayout'
import api from '../../lib/api'
import { RefreshCw, CheckCircle, AlertCircle, Settings } from 'lucide-react'

const pjs = (size, weight, lh, color) => ({
  fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: size, fontWeight: weight, lineHeight: lh, color,
})

function ProviderCard({ provider, displayName, color, bg }) {
  const [config, setConfig]     = useState(null)
  const [form, setForm]         = useState({})
  const [showForm, setShowForm] = useState(false)
  const [syncing, setSyncing]   = useState(false)
  const [saving, setSaving]     = useState(false)
  const [toast, setToast]       = useState('')

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3500) }

  const load = useCallback(async () => {
    try {
      const res = await api.get(`/api/sync/${provider}/status`)
      if (res.success && res.data) setConfig(res.data)
    } catch {}
  }, [provider])

  useEffect(() => { load() }, [load])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await api.post(`/api/sync/${provider}/config`, form)
      if (res.success) { setConfig(res.data); setShowForm(false); showToast('Credentials saved') }
      else showToast(res.error || 'Save failed')
    } catch (err) {
      showToast(err?.message || 'Save failed')
    } finally { setSaving(false) }
  }

  const handleSync = async () => {
    setSyncing(true)
    try {
      const res = await api.post(`/api/sync/${provider}/trigger`, {})
      showToast(res.message || 'Sync started')
      setTimeout(() => load(), 3000)
    } catch (err) {
      showToast(err?.message || 'Sync failed')
    } finally { setSyncing(false) }
  }

  const statusBg = { success: '#f0fdf4', failed: '#fee2e2', partial: '#fef3c7', never: '#f8fafc' }
  const statusColor = { success: '#16a34a', failed: '#dc2626', partial: '#d97706', never: '#94a3b8' }
  const st = config?.last_sync_status || 'never'

  return (
    <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.03)' }}>
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#0f172a', color: '#fff', padding: '12px 20px', borderRadius: 12, zIndex: 999, ...pjs(14, 600, '20px', '#fff') }}>
          {toast}
        </div>
      )}
      <div style={{ padding: '20px 24px', borderBottom: '1px solid #f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <RefreshCw size={18} color={color} />
          </div>
          <div>
            <div style={pjs(15, 700, '20px', '#0f172a')}>{displayName}</div>
            {config?.last_synced_at && (
              <div style={pjs(11, 400, '14px', '#94a3b8')}>
                Last synced: {new Date(config.last_synced_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ ...pjs(11, 700, '14px', statusColor[st] || '#94a3b8'), background: statusBg[st] || '#f8fafc', padding: '4px 10px', borderRadius: 8, textTransform: 'capitalize' }}>{st}</span>
        </div>
      </div>

      <div style={{ padding: '20px 24px' }}>
        {config?.credentials_json?.configured ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, padding: '10px 14px', background: '#f0fdf4', borderRadius: 10 }}>
            <CheckCircle size={14} color="#16a34a" />
            <span style={pjs(12, 600, '16px', '#16a34a')}>Credentials configured</span>
            <span style={{ ...pjs(12, 400, '16px', '#64748b'), marginLeft: 'auto' }}>Base URL: {config.base_url}</span>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, padding: '10px 14px', background: '#fef3c7', borderRadius: 10 }}>
            <AlertCircle size={14} color="#d97706" />
            <span style={pjs(12, 600, '16px', '#d97706')}>No credentials configured</span>
          </div>
        )}

        {/* Sync log */}
        {config?.last_sync_log && (
          <div style={{ marginBottom: 16, padding: '12px 14px', background: '#f8fafc', borderRadius: 10, ...pjs(11, 400, '18px', '#64748b'), fontFamily: 'monospace', whiteSpace: 'pre-wrap', maxHeight: 100, overflowY: 'auto' }}>
            {config.last_sync_log}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => setShowForm(!showForm)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer', ...pjs(13, 600, '18px', '#475569') }}>
            <Settings size={13} /> Configure
          </button>
          <button onClick={handleSync} disabled={syncing || !config?.credentials_json?.configured}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, border: 'none', background: syncing || !config?.credentials_json?.configured ? '#e2e8f0' : color, color: '#fff', cursor: syncing || !config?.credentials_json?.configured ? 'not-allowed' : 'pointer', ...pjs(13, 700, '18px', '#fff') }}>
            <RefreshCw size={13} style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
            {syncing ? 'Syncing...' : 'Sync Now'}
          </button>
        </div>

        {showForm && (
          <div style={{ marginTop: 16, padding: '16px', background: '#f8fafc', borderRadius: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <div style={pjs(12, 600, '16px', '#374151')}>Base URL</div>
              <input type="url" placeholder={`https://${provider}.university.edu`} value={form.base_url || ''}
                onChange={e => setForm(p => ({ ...p, base_url: e.target.value }))}
                style={{ width: '100%', marginTop: 4, padding: '8px 10px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 13, fontFamily: "'Plus Jakarta Sans', sans-serif", outline: 'none', boxSizing: 'border-box' }} />
            </div>
            {provider === 'webkiosk' ? (
              <>
                <div>
                  <div style={pjs(12, 600, '16px', '#374151')}>Username</div>
                  <input type="text" value={form.username || ''} onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                    style={{ width: '100%', marginTop: 4, padding: '8px 10px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 13, fontFamily: "'Plus Jakarta Sans', sans-serif", outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <div style={pjs(12, 600, '16px', '#374151')}>Password</div>
                  <input type="password" value={form.password || ''} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                    style={{ width: '100%', marginTop: 4, padding: '8px 10px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 13, fontFamily: "'Plus Jakarta Sans', sans-serif", outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </>
            ) : (
              <>
                <div>
                  <div style={pjs(12, 600, '16px', '#374151')}>Username</div>
                  <input type="text" value={form.username || ''} onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                    style={{ width: '100%', marginTop: 4, padding: '8px 10px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 13, fontFamily: "'Plus Jakarta Sans', sans-serif", outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <div style={pjs(12, 600, '16px', '#374151')}>Password</div>
                  <input type="password" value={form.password || ''} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                    style={{ width: '100%', marginTop: 4, padding: '8px 10px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 13, fontFamily: "'Plus Jakarta Sans', sans-serif", outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </>
            )}
            <button onClick={handleSave} disabled={saving}
              style={{ alignSelf: 'flex-start', padding: '9px 18px', borderRadius: 10, border: 'none', background: saving ? '#e2e8f0' : '#4f46e5', color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', ...pjs(13, 700, '18px', '#fff') }}>
              {saving ? 'Saving...' : 'Save Credentials'}
            </button>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

export default function SyncConfig() {
  return (
    <PageLayout>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 44, height: 44, borderRadius: 14, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <RefreshCw size={22} color="#16a34a" />
        </div>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#0f172a', margin: 0 }}>Sync Configuration</h1>
          <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>Connect WebKiosk and Moodle to sync attendance, grades and fees automatically.</p>
        </div>
      </div>

      <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 14, padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <AlertCircle size={16} color="#d97706" />
        <span style={pjs(13, 600, '18px', '#92400e')}>
          Synced data never overwrites manually entered records. Manual entries always take priority.
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <ProviderCard provider="webkiosk" displayName="WebKiosk (Thapar)" color="#4f46e5" bg="#eef2ff" />
        <ProviderCard provider="moodle"   displayName="Moodle LMS" color="#f97316" bg="#fff7ed" />
      </div>
    </PageLayout>
  )
}
