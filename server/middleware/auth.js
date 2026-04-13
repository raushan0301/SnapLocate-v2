import jwt from 'jsonwebtoken'
import { supabaseAdmin } from '../lib/supabase.js'

/**
 * Protect routes — verifies JWT and attaches user to req.user
 */
export async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized — no token provided' })
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    // Fetch fresh user from Supabase to ensure they still exist and get role
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, role, full_name, avatar_url, org_id')
      .eq('id', decoded.userId)
      .single()

    if (error || !user) {
      return res.status(401).json({ success: false, message: 'Unauthorized — user not found' })
    }

    req.user = user
    next()
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Unauthorized — invalid or expired token' })
  }
}

/**
 * Restrict to specific roles
 * Usage: requireRole('faculty') or requireRole('student', 'faculty')
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' })
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden — requires role: ${roles.join(' or ')}`,
      })
    }
    next()
  }
}

/**
 * Restrict to admin role only
 */
export const requireAdmin = requireRole('admin')

/**
 * Restrict to faculty role only
 */
export const requireFaculty = requireRole('faculty', 'admin')

/**
 * Restrict to student role only
 */
export const requireStudent = requireRole('student', 'admin')
