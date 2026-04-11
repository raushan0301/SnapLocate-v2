const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

function getToken() {
  return localStorage.getItem('snaplocate_token')
}

async function request(path, options = {}) {
  const token = getToken()
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers })
  const data = await res.json()

  if (!res.ok) {
    const err = new Error(data.message || 'API error')
    err.status = res.status
    err.data = data
    throw err
  }

  return data
}

// ─── Auth ─────────────────────────────────────────────────────
export const api = {
  post: (path, body, opts) => request(path, { method: 'POST', body: JSON.stringify(body), ...opts }),
  get:  (path)       => request(path, { method: 'GET', cache: 'no-store' }),
  put:  (path, body) => request(path, { method: 'PUT',   body: JSON.stringify(body) }),
  patch:(path, body) => request(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete:(path)      => request(path, { method: 'DELETE' }),
  upload: async (path, formData) => {
    const token = getToken()
    const headers = { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
    const res = await fetch(`${API_URL}${path}`, { method: 'POST', headers, body: formData })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || 'Upload failed')
    return data
  }
}

export default api
