import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/* ─────────────────────────────────────────────────────────────
   Loading spinner — shown while token is being verified on mount
───────────────────────────────────────────────────────────── */
function AuthLoading() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', flexDirection: 'column', gap: 16,
      background: '#f8fafc',
    }}>
      <div style={spinnerStyle} />
      <span style={{
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        fontSize: 14, fontWeight: 500, color: '#64748b',
      }}>
        Loading SnapLocate…
      </span>
    </div>
  )
}

const spinnerStyle = {
  width: 36, height: 36,
  border: '3px solid #e2e8f0',
  borderTop: '3px solid #4f46e5',
  borderRadius: '50%',
  animation: 'spin 0.8s linear infinite',
}

/* ─────────────────────────────────────────────────────────────
   ProtectedRoute
   - Redirects to /login if not authenticated
   - Optionally restricts to a specific role (allowedRole)
───────────────────────────────────────────────────────────── */
export function ProtectedRoute({ children, allowedRole }) {
  const { isAuthenticated, user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <AuthLoading />

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRole) {
    const roles = Array.isArray(allowedRole) ? allowedRole : [allowedRole];
    if (!roles.includes(user?.role)) {
      const redirect = user?.role === 'admin' ? '/admin/dashboard' : user?.role === 'faculty' ? '/faculty/dashboard' : '/dashboard'
      return <Navigate to={redirect} replace />
    }
  }

  return children
}

/* ─────────────────────────────────────────────────────────────
   PublicRoute
   - If already logged in, redirect away from /login /register etc.
───────────────────────────────────────────────────────────── */
export function PublicRoute({ children }) {
  const { isAuthenticated, user, loading } = useAuth()

  if (loading) return <AuthLoading />

  if (isAuthenticated) {
    const redirect = user?.role === 'admin' ? '/admin/dashboard' : user?.role === 'faculty' ? '/faculty/dashboard' : '/dashboard'
    return <Navigate to={redirect} replace />
  }

  return children
}
