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
    const errMsg = typeof data.error === 'string' ? data.error : (data.message || 'API error')
    const err = new Error(errMsg)
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
  upload: (path, formData, onProgress) => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('POST', `${API_URL}${path}`)
      
      const token = getToken()
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)

      if (onProgress && xhr.upload) {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100)
            onProgress(percent)
          }
        })
      }

      xhr.onload = () => {
        let data
        try { data = JSON.parse(xhr.responseText) } catch {
          return reject(new Error(`Upload failed (${xhr.status}): unexpected server response`))
        }
        if (xhr.status >= 200 && xhr.status < 300 && data.success) {
          resolve(data)
        } else {
          reject(new Error(data.error || data.message || `Upload failed (${xhr.status})`))
        }
      }

      xhr.onerror = () => reject(new Error('Network error during upload'))
      xhr.send(formData)
    })
  },
  // Genuine view: sends X-View-Session header only on first visit per session
  view: async (path, listingId) => {
    const token = getToken()
    const sessionKey = `viewed_${listingId}`
    const alreadyViewed = sessionStorage.getItem(sessionKey)
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(!alreadyViewed ? { 'X-View-Session': listingId } : {}),
    }
    if (!alreadyViewed) sessionStorage.setItem(sessionKey, '1')
    const res = await fetch(`${API_URL}${path}`, { method: 'GET', cache: 'no-store', headers })
    const data = await res.json()
    if (!res.ok) {
      const err = new Error(data.message || 'API error')
      err.status = res.status
      throw err
    }
    return data
  }
}

export default api
