import { google } from 'googleapis'

// ─── OAuth2 Client ─────────────────────────────────────────────────────────────

/**
 * Creates and returns an authenticated OAuth2 client using env credentials.
 * The refresh token is stored in .env and used to automatically obtain
 * new access tokens without user intervention.
 */
export function getOAuth2Client() {
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    process.env.GMAIL_REDIRECT_URI
  )
  oAuth2Client.setCredentials({
    refresh_token: process.env.GMAIL_REFRESH_TOKEN,
  })
  return oAuth2Client
}

/** Returns a Gmail API v1 client. */
export function getGmailClient() {
  return google.gmail({ version: 'v1', auth: getOAuth2Client() })
}

/** Returns true if all Gmail env vars are set. */
export function isGmailConfigured() {
  return !!(
    process.env.GMAIL_CLIENT_ID &&
    process.env.GMAIL_CLIENT_SECRET &&
    process.env.GMAIL_REDIRECT_URI &&
    process.env.GMAIL_REFRESH_TOKEN
  )
}

// ─── Email Fetching ────────────────────────────────────────────────────────────

/**
 * Fetches unread emails from the monitored inbox that were sent by any
 * address in the sender whitelist array.
 *
 * @param {string[]} senderWhitelist  e.g. ['adminofficer@thapar.edu']
 * @returns {Promise<ParsedEmail[]>}
 */
export async function fetchUnreadEmails(senderWhitelist = []) {
  const gmail = getGmailClient()

  // Build Gmail search query
  const fromParts = senderWhitelist.map(e => `from:${e}`).join(' OR ')
  const query = `(${fromParts}) is:unread in:inbox`

  const listRes = await gmail.users.messages.list({
    userId: 'me',
    q: query,
    maxResults: 20,
  })

  const messages = listRes.data.messages || []
  if (messages.length === 0) return []

  const results = []
  for (const msg of messages) {
    try {
      const full = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id,
        format: 'full',
      })
      results.push(parseMessage(full.data))
    } catch (err) {
      console.error(`[Gmail] Failed to fetch message ${msg.id}:`, err.message)
    }
  }
  return results
}

// ─── Message Parsing Helpers ───────────────────────────────────────────────────

function parseMessage(message) {
  const headers = message.payload?.headers || []
  const getHeader = (name) =>
    headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || ''

  const from    = getHeader('From')
  const subject = getHeader('Subject')
  const date    = getHeader('Date')

  // Extract bare email address from "Name <email>" format
  const senderEmail = (from.match(/<(.+)>/) ? from.match(/<(.+)>/)[1] : from)
    .toLowerCase()
    .trim()

  const body        = extractBody(message.payload)
  const attachments = extractAttachments(message.payload, message.id)

  return { id: message.id, threadId: message.threadId, from, senderEmail, subject, date, body, attachments }
}

/**
 * Recursively walks the MIME tree to find the plain-text body part.
 */
function extractBody(payload) {
  if (!payload) return ''

  if (payload.mimeType === 'text/plain' && payload.body?.data) {
    return Buffer.from(payload.body.data, 'base64url').toString('utf-8')
  }
  // Some messages use text/html only — strip tags as fallback
  if (payload.mimeType === 'text/html' && payload.body?.data) {
    const html = Buffer.from(payload.body.data, 'base64url').toString('utf-8')
    return html.replace(/<[^>]+>/g, ' ').replace(/\s{2,}/g, '\n').trim()
  }

  if (payload.parts) {
    for (const part of payload.parts) {
      const text = extractBody(part)
      if (text) return text
    }
  }
  return ''
}

/**
 * Recursively collects image attachments from a MIME payload.
 * Returns metadata; actual data is fetched later via downloadAttachment().
 */
function extractAttachments(payload, messageId) {
  const attachments = []

  function walk(part) {
    if (!part) return
    const hasData = part.body && (part.body.attachmentId || part.body.data)
    const isImageMime = part.mimeType?.startsWith('image/')
    const isImageFile = part.filename && /\.(jpe?g|png|gif|webp|bmp|heic|tiff)$/i.test(part.filename)
    
    if (hasData && (isImageMime || isImageFile)) {
      attachments.push({
        messageId,
        attachmentId: part.body.attachmentId,
        filename: part.filename || 'image.jpg',
        mimeType: isImageMime ? part.mimeType : 'image/jpeg',
        data: part.body.data || null, // inline base64url if small
      })
    }
    if (part.parts) part.parts.forEach(walk)
  }

  walk(payload)
  return attachments
}

// ─── Attachment Download ───────────────────────────────────────────────────────

/**
 * Downloads a Gmail attachment and returns its base64url-encoded data.
 *
 * @param {string} messageId
 * @param {string} attachmentId
 * @returns {Promise<string>}  base64url data
 */
export async function downloadAttachment(messageId, attachmentId) {
  const gmail = getGmailClient()
  const res   = await gmail.users.messages.attachments.get({
    userId: 'me',
    messageId,
    id: attachmentId,
  })
  return res.data.data // base64url encoded bytes
}

// ─── Mark As Read ──────────────────────────────────────────────────────────────

/**
 * Removes the UNREAD label from a Gmail message so the poller won't
 * pick it up again on the next cycle.
 *
 * @param {string} messageId
 */
export async function markAsRead(messageId) {
  const gmail = getGmailClient()
  await gmail.users.messages.modify({
    userId: 'me',
    id: messageId,
    requestBody: { removeLabelIds: ['UNREAD'] },
  })
}
