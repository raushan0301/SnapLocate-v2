import cron from 'node-cron'
import { v2 as cloudinary } from 'cloudinary'
import { supabaseAdmin } from './supabase.js'
import { fetchUnreadEmails, downloadAttachment, markAsRead, isGmailConfigured } from './gmail.js'

// ─── Config ─────────────────────────────────────────────────────────────────────

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const SENDER_WHITELIST = (process.env.GMAIL_SENDER_WHITELIST || 'adminofficer@thapar.edu')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean)

// ─── Smart Email Parser ────────────────────────────────────────────────────────
//
// Handles both structured and free-form email bodies.
//
// Structured example:
//   Item: Black Wallet
//   Location: COS Lobby
//   Date Found: 20 June 2026
//   Contact: 9876543210
//
// Free-form example:
//   Found a laptop near the library. Please contact 9876543210.

function inferCategory(text) {
  const t = text.toLowerCase()
  if (/phone|mobile|laptop|tablet|earbuds|headphone|airpods|charger|cable|keyboard|mouse|camera|ipad/.test(t)) return 'electronics'
  if (/\bkeys?\b|keychain/.test(t)) return 'keys'
  if (/id[\s-]?card|identity[\s]?card|student[\s]?id|admit[\s]?card|aadhar|pan[\s]?card/.test(t)) return 'id_card'
  if (/shirt|jacket|jeans|hoodie|sweater|coat|shoes|sandal|cap|\bhat\b|scarf|dress|t-shirt|tshirt/.test(t)) return 'clothing'
  if (/\bbook\b|notebook|textbook|\bnotes\b|register/.test(t)) return 'books'
  if (/\bbag\b|backpack|luggage|handbag/.test(t)) return 'bag'
  if (/wallet/.test(t)) return 'wallet'
  if (/ring|necklace|bracelet|\bwatch\b|chain|earring|jewel/.test(t)) return 'jewellery'
  if (/\bball\b|racket|\bbat\b|jersey|\bkit\b|sports/.test(t)) return 'sports'
  return 'other'
}

/**
 * Extracts a labeled field from email body text.
 * e.g. fieldExtract(['Item', 'Item Name'], body) → "Black Wallet"
 */
function fieldExtract(labels, text) {
  for (const label of labels) {
    const re = new RegExp(`${label}\\s*[:：]\\s*([^\\n]{1,200})`, 'i')
    const m  = text.match(re)
    if (m) return m[1].trim()
  }
  return null
}

/**
 * Main email parser — tries structured fields first, falls back to free-form.
 */
function parseEmailContent(subject = '', body = '') {
  // ── Status detection ───────────────────────────────────────────────────────
  let status = 'found' // admin officers typically report found items
  const subLow = subject.toLowerCase()
  if (/\blost\b/.test(subLow) && !/\bfound\b/.test(subLow)) status = 'lost'
  if (/^found\s*[:–—]/i.test(subject)) status = 'found'
  if (/^lost\s*[:–—]/i.test(subject))  status = 'lost'

  // ── Structured field extraction ────────────────────────────────────────────
  let title       = fieldExtract(['item name', 'item', 'object', 'article', 'lost item', 'found item'], body)
  let location    = fieldExtract(['location found', 'location lost', 'location', 'place', 'area', 'found at', 'found near', 'lost at'], body)
  let contact     = fieldExtract(['contact number', 'contact no', 'contact', 'phone', 'mobile', 'whatsapp', 'mob', 'reach'], body)
  let description = fieldExtract(['description', 'details', 'detail', 'desc', 'note'], body)
  let dateRaw     = fieldExtract(['date found', 'date lost', 'date', 'found on', 'lost on'], body)

  // ── Free-form fallbacks ────────────────────────────────────────────────────
  if (!title) {
    // Strip common subject prefixes to get the item name
    let s = subject
      .replace(/^(lost\s*[&and]*\s*found\s*[-:–—]?\s*)/i, '')
      .replace(/^(found|lost)\s*[-:–—]?\s*/i, '')
      .trim()
    title = s || 'Unknown Item'
  }

  if (!location) {
    const m = body.match(/(?:near|at|in|found\s+(?:at|near|in))\s+([^\n.!?,]{3,60})/i)
    if (m) location = m[1].trim()
  }

  if (!contact) {
    // Look for phone number patterns
    const m = body.match(/\b(\+?91[-\s]?)?[6-9]\d{9}\b/)
    if (m) contact = m[0].trim()
    // or "contact: xxx" free-form
    if (!contact) {
      const m2 = body.match(/(?:\b(?:contact|call|reach|mob(?:ile)?|ph(?:one)?)\b\s*[:\s]?\s*)([0-9\s+\-()]{7,20})/i)
      if (m2) contact = m2[1].trim()
    }
  }

  if (!description) {
    // Use the entire body, stripped of known structured labels
    description = body
      .replace(/^(item name?|item|object|article|location.*?|contact.*?|date.*?|description|phone|mobile)\s*[:：][^\n]*/gim, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
      .slice(0, 1000) || null
  }

  // ── Date parsing ───────────────────────────────────────────────────────────
  let parsedDate = null
  if (dateRaw) {
    const d = new Date(dateRaw)
    if (!isNaN(d.getTime())) parsedDate = d.toISOString().split('T')[0]
  }
  if (!parsedDate) parsedDate = new Date().toISOString().split('T')[0]

  // ── Category ───────────────────────────────────────────────────────────────
  const category = inferCategory(`${title} ${description || ''} ${subject}`)

  return {
    title:        title.slice(0, 200),
    description:  description,
    status,
    category,
    location:     location ? location.slice(0, 200) : null,
    contact_info: contact  ? contact.slice(0, 200)  : null,
    date:         parsedDate,
  }
}

// ─── Cloudinary Upload ─────────────────────────────────────────────────────────

/**
 * Uploads a base64url-encoded image to Cloudinary and returns the secure URL.
 */
async function uploadToCloudinary(base64urlData, filename) {
  // Convert base64url → standard base64
  const base64 = base64urlData.replace(/-/g, '+').replace(/_/g, '/')
  const dataUri = `data:image/jpeg;base64,${base64}`

  const result = await cloudinary.uploader.upload(dataUri, {
    folder:        'snaplocate/lost_found',
    public_id:     `email_${Date.now()}_${filename.replace(/\.[^.]+$/, '').replace(/\W/g, '_')}`,
    resource_type: 'image',
  })
  return result.secure_url
}

// ─── Duplicate Detection ───────────────────────────────────────────────────────

/**
 * Returns true if a listing with the same title was created in the last 24 h.
 */
async function isDuplicate(title) {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { data } = await supabaseAdmin
    .from('lost_found')
    .select('id')
    .ilike('title', title.trim())
    .gte('created_at', since)
    .limit(1)
  return !!(data && data.length > 0)
}

// ─── Email Log ─────────────────────────────────────────────────────────────────

/**
 * Upserts a row into email_logs. Uses gmail_message_id as conflict target so
 * a single email is never logged twice even on crash/retry.
 */
async function logEmailResult({ gmail_message_id, sender_email, subject, status, item_id = null, error_message = null }) {
  try {
    await supabaseAdmin.from('email_logs').upsert(
      { gmail_message_id, sender_email, subject, status, item_id, error_message },
      { onConflict: 'gmail_message_id' }
    )
  } catch (err) {
    console.error('[Poller] Failed to write email log:', err.message)
  }
}

// ─── Campus Notifications ──────────────────────────────────────────────────────

async function notifyCampus(item, orgId, excludeUserId) {
  if (!orgId) return
  try {
    const { data: members } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('org_id', orgId)
      .neq('id', excludeUserId)

    if (!members?.length) return

    const statusLabel = item.status === 'found' ? '🟢 Found' : '🔴 Lost'
    const msgParts = [
      item.location    ? `📍 ${item.location}` : null,
      item.description ? item.description.slice(0, 100) + (item.description.length > 100 ? '…' : '') : null,
    ].filter(Boolean)

    const rows = members.map((m) => ({
      user_id: m.id,
      title:   `${statusLabel}: ${item.title}`,
      message: msgParts.join(' · ') || 'A new item has been reported on Lost & Found.',
      link:    '/lost-found',
    }))

    await supabaseAdmin.from('notifications').insert(rows)
  } catch (err) {
    console.error('[Poller] Notification error:', err.message)
  }
}

// ─── Single Email Processor ────────────────────────────────────────────────────

async function processEmail(email, systemUserId, orgId) {
  const { id: messageId, senderEmail, subject, body, attachments } = email

  console.log(`[Poller] → Processing: "${subject}" from ${senderEmail}`)

  try {
    const listing = parseEmailContent(subject, body)

    // Duplicate check
    if (await isDuplicate(listing.title)) {
      console.log(`[Poller]   ↳ Duplicate detected for "${listing.title}" — skipping`)
      await markAsRead(messageId)
      await logEmailResult({ gmail_message_id: messageId, sender_email: senderEmail, subject, status: 'duplicate' })
      return
    }

    // Upload first image attachment (if any)
    let imageUrl = null
    if (attachments.length > 0) {
      try {
        const att = attachments[0]
        let data  = att.data // may be null for large attachments

        if (!data && att.attachmentId) {
          data = await downloadAttachment(messageId, att.attachmentId)
        }
        if (data) {
          imageUrl = await uploadToCloudinary(data, att.filename)
          console.log(`[Poller]   ↳ Attachment uploaded → ${imageUrl}`)
        }
      } catch (uploadErr) {
        console.error('[Poller]   ↳ Attachment upload failed (continuing without image):', uploadErr.message)
      }
    }

    // Create listing in Supabase
    const { data: item, error: insertErr } = await supabaseAdmin
      .from('lost_found')
      .insert({ ...listing, image_url: imageUrl, reporter_id: systemUserId, org_id: orgId })
      .select('*, reporter:reporter_id(id, full_name, avatar_url, role)')
      .single()

    if (insertErr) throw new Error(`DB insert: ${insertErr.message}`)

    console.log(`[Poller]   ↳ ✅ Created listing: "${item.title}" (${item.status})`)

    await notifyCampus(item, orgId, systemUserId)
    await markAsRead(messageId)
    await logEmailResult({ gmail_message_id: messageId, sender_email: senderEmail, subject, status: 'success', item_id: item.id })

  } catch (err) {
    console.error(`[Poller]   ↳ ❌ Failed: ${err.message}`)
    await logEmailResult({
      gmail_message_id: messageId,
      sender_email:     senderEmail,
      subject,
      status:           'failed',
      error_message:    err.message.slice(0, 500),
    })
    // Always mark as read to prevent infinite reprocessing loops
    try { await markAsRead(messageId) } catch { /* ignore */ }
  }
}

// ─── Poll Cycle ────────────────────────────────────────────────────────────────

async function pollGmail() {
  const ts = new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })
  console.log(`[Poller] 📧 Poll cycle started at ${ts} (IST)`)

  try {
    // Use the first admin user as the "reporter" for email-sourced listings
    const { data: adminUser, error: adminErr } = await supabaseAdmin
      .from('users')
      .select('id, org_id')
      .eq('role', 'admin')
      .order('created_at', { ascending: true })
      .limit(1)
      .single()

    if (adminErr || !adminUser) {
      console.warn('[Poller] No admin user found — cannot create listings. Ensure an admin account exists in Supabase.')
      return
    }

    const emails = await fetchUnreadEmails(SENDER_WHITELIST)

    if (emails.length === 0) {
      console.log('[Poller] No new emails.')
      return
    }

    console.log(`[Poller] Found ${emails.length} email(s) to process.`)

    for (const email of emails) {
      // Re-verify sender (Gmail query already filters, this is a safety net)
      if (!SENDER_WHITELIST.includes(email.senderEmail)) {
        console.log(`[Poller] Skipping non-whitelisted sender: ${email.senderEmail}`)
        await markAsRead(email.id)
        await logEmailResult({
          gmail_message_id: email.id,
          sender_email:     email.senderEmail,
          subject:          email.subject,
          status:           'skipped',
          error_message:    'Sender not in GMAIL_SENDER_WHITELIST',
        })
        continue
      }

      await processEmail(email, adminUser.id, adminUser.org_id)
    }

  } catch (err) {
    console.error('[Poller] Poll cycle error:', err.message)
  }
}

// ─── Exports ───────────────────────────────────────────────────────────────────

/**
 * Starts the Gmail poller as a node-cron background job.
 * Called once from server/index.js after the Express server boots.
 * Does nothing if GMAIL_REFRESH_TOKEN is not set in .env.
 */
export function startEmailPoller() {
  if (!isGmailConfigured()) {
    console.warn('⚠️  Gmail poller not started: GMAIL_REFRESH_TOKEN not set in .env')
    console.warn('   Complete one-time OAuth setup at: http://65.1.111.102:3001/api/gmail-auth/setup')
    return
  }

  const schedule = process.env.GMAIL_POLL_INTERVAL || '*/5 * * * *'

  cron.schedule(schedule, pollGmail, {
    scheduled: true,
    timezone:  'Asia/Kolkata',
  })

  console.log(`📧 Gmail poller active — checking every 5 min (whitelist: ${SENDER_WHITELIST.join(', ')})`)
}
