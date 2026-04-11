import rateLimit from 'express-rate-limit'

/**
 * General rate limiter — 300 requests per 15 minutes per IP
 */
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300, 
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
})

/**
 * Strict limiter for auth routes — 15 attempts per 15 minutes
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { success: false, message: 'Too many auth attempts, please try again later.' },
})

/**
 * OTP limiter — 5 OTP requests per 10 minutes
 */
export const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many OTP requests, please wait before requesting again.' },
})
