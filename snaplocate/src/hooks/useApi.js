import { useState, useEffect, useCallback } from 'react'
import api from '../lib/api'

/**
 * useApi — generic data-fetching hook
 *
 * Usage:
 *   const { data, loading, error, refetch } = useApi('/api/faculty')
 *
 * Options:
 *   { immediate: false }  → don't fetch on mount (good for mutations)
 *   { initialData: [] }   → what data starts as before first fetch
 */
export function useApi(path, options = {}) {
  const { immediate = true, initialData = null } = options
  const [data,    setData]    = useState(initialData)
  const [loading, setLoading] = useState(immediate)
  const [error,   setError]   = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get(path)
      setData(res.data ?? res)
    } catch (err) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }, [path])

  useEffect(() => { if (immediate) fetch() }, [fetch, immediate])

  return { data, loading, error, refetch: fetch }
}

/**
 * useMutation — for POST/PATCH/DELETE calls
 *
 * Usage:
 *   const { mutate, loading, error } = useMutation('patch', '/api/requests/123')
 *   await mutate({ status: 'accepted' })
 */
export function useMutation(method, path) {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  const [data,    setData]    = useState(null)

  const mutate = useCallback(async (body) => {
    setLoading(true)
    setError(null)
    try {
      const res = await api[method](path, body)
      setData(res)
      return res
    } catch (err) {
      setError(err.message || 'Something went wrong')
      throw err
    } finally {
      setLoading(false)
    }
  }, [method, path])

  return { mutate, loading, error, data }
}
