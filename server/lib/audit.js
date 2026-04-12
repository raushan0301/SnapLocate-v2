import { supabaseAdmin } from './supabase.js'

/**
 * Write a row to audit_log. Never throws — a logging failure
 * must never break the operation that triggered it.
 *
 * @param {object} actor       req.user  { id, full_name, email }
 * @param {string} action      e.g. 'CREATE_USER' | 'DELETE_USER' | 'REMOVE_LISTING'
 * @param {string} targetType  e.g. 'user' | 'listing' | 'post' | 'resource' | 'announcement'
 * @param {string} targetId    UUID of the affected row
 * @param {string} targetName  Human-readable label (name/title) of the affected row
 * @param {object} meta        Any extra key-value context
 */
export async function logAudit(actor, action, targetType, targetId, targetName, meta = {}) {
  try {
    await supabaseAdmin.from('audit_log').insert({
      actor_id:    actor?.id    || null,
      actor_name:  actor?.full_name || actor?.email || 'System',
      action,
      target_type: targetType  || null,
      target_id:   targetId    || null,
      target_name: targetName  || null,
      meta,
    })
  } catch (err) {
    console.error('[audit] log write failed:', err.message)
  }
}
