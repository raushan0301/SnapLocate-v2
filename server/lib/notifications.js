import { supabaseAdmin } from './supabase.js'

/**
 * Create an in-app notification for a user.
 * Never throws — notification failure must never break the parent operation.
 *
 * @param {string} userId  - recipient user id (UUID)
 * @param {string} title   - short headline, e.g. "Request Accepted"
 * @param {string} message - body text
 * @param {string} link    - optional route to navigate to on click
 */
export async function createNotification(userId, title, message, link = null) {
  try {
    await supabaseAdmin.from('notifications').insert({
      user_id: userId,
      title,
      message,
      link,
    })
  } catch (err) {
    console.error('[notify] failed to create notification:', err.message)
  }
}
