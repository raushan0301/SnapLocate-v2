import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../lib/api'

// ─── Context ─────────────────────────────────────────────────
const AuthContext = createContext(null)

const TOKEN_KEY = 'snaplocate_token'
const USER_KEY  = 'snaplocate_user'

// ─── Provider ────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(() => {
    try { return JSON.parse(localStorage.getItem(USER_KEY)) } catch { return null }
  })
  const [token,   setToken]   = useState(() => localStorage.getItem(TOKEN_KEY))
  const [loading, setLoading] = useState(true)

  // On mount — verify token is still valid with the server
  useEffect(() => {
    const verify = async () => {
      const savedToken = localStorage.getItem(TOKEN_KEY)
      if (!savedToken) { setLoading(false); return }

      try {
        const { user: freshUser } = await api.get('/api/auth/me')
        setUser(freshUser)
        setToken(savedToken)
      } catch {
        // Token expired or invalid — clear
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(USER_KEY)
        setUser(null)
        setToken(null)
      } finally {
        setLoading(false)
      }
    }
    verify()
  }, [])

  // ─── Register ───────────────────────────────────────────────
  const register = useCallback(async ({ full_name, email, password, role }) => {
    const res = await api.post('/api/auth/register', { full_name, email, password, role })
    return res // { userId, message }
  }, [])

  // ─── Verify OTP ─────────────────────────────────────────────
  const verifyOtp = useCallback(async ({ email, otp }) => {
    const res = await api.post('/api/auth/verify-otp', { email, otp })
    if (res.token) {
      localStorage.setItem(TOKEN_KEY, res.token)
      localStorage.setItem(USER_KEY, JSON.stringify(res.user))
      setToken(res.token)
      setUser(res.user)
    }
    return res
  }, [])

  // ─── Resend OTP ─────────────────────────────────────────────
  const resendOtp = useCallback(async (email) => {
    return api.post('/api/auth/resend-otp', { email })
  }, [])

  // ─── Login ──────────────────────────────────────────────────
  const login = useCallback(async ({ email, password }) => {
    const res = await api.post('/api/auth/login', { email, password })
    if (res.token) {
      localStorage.setItem(TOKEN_KEY, res.token)
      localStorage.setItem(USER_KEY, JSON.stringify(res.user))
      setToken(res.token)
      setUser(res.user)
    }
    return res
  }, [])

  // ─── Google Login ───────────────────────────────────────────
  const loginWithGoogle = useCallback(async (credential) => {
    const res = await api.post('/api/auth/google', { credential })
    if (res.token) {
      localStorage.setItem(TOKEN_KEY, res.token)
      localStorage.setItem(USER_KEY, JSON.stringify(res.user))
      setToken(res.token)
      setUser(res.user)
    }
    return res
  }, [])

  // ─── Logout ─────────────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setUser(null)
    setToken(null)
  }, [])

  // ─── Update user in context (e.g. after profile edit) ───────
  const updateUser = useCallback((updates) => {
    const updated = { ...user, ...updates }
    localStorage.setItem(USER_KEY, JSON.stringify(updated))
    setUser(updated)
  }, [user])

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    isStudent: user?.role === 'student',
    isFaculty: user?.role === 'faculty',
    isAdmin:   user?.role === 'admin',
    isGuest:   user?.role === 'guest',
    register,
    verifyOtp,
    resendOtp,
    login,
    loginWithGoogle,
    logout,
    updateUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// ─── Hook ────────────────────────────────────────────────────
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}

export default AuthContext
