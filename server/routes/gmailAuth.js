import { Router } from 'express'
import { google } from 'googleapis'

const router = Router()

// ─── Helpers ───────────────────────────────────────────────────────────────────

function makeOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    process.env.GMAIL_REDIRECT_URI
  )
}

// ─── GET /api/gmail-auth/setup ─────────────────────────────────────────────────
// Starts the OAuth 2.0 authorization flow.
// Visit this URL ONCE in your browser to authorize SnapLocate to read Gmail.
// Protected by GMAIL_SETUP_SECRET in .env to prevent unauthorized access.
//
// Usage: http://65.1.111.102:3001/api/gmail-auth/setup?secret=<GMAIL_SETUP_SECRET>
router.get('/setup', (req, res) => {
  const guardSecret = process.env.GMAIL_SETUP_SECRET
  if (guardSecret && req.query.secret !== guardSecret) {
    return res.status(401).send(`
      <h2>⛔ Unauthorized</h2>
      <p>Append <code>?secret=&lt;GMAIL_SETUP_SECRET&gt;</code> from your .env to the URL.</p>
    `)
  }

  if (!process.env.GMAIL_CLIENT_ID || !process.env.GMAIL_CLIENT_SECRET) {
    return res.status(503).send(`
      <h2>⚠️ Gmail Not Configured</h2>
      <p>Set <code>GMAIL_CLIENT_ID</code> and <code>GMAIL_CLIENT_SECRET</code> in server/.env first.</p>
    `)
  }

  const oAuth2Client = makeOAuth2Client()
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.modify',
    ],
    prompt: 'consent', // forces refresh_token to be returned
  })

  res.redirect(authUrl)
})

// ─── GET /api/gmail-auth/callback ─────────────────────────────────────────────
// Google redirects here after the user authorizes the app.
// Exchanges the one-time code for access + refresh tokens.
// The refresh token is printed to console AND shown on the page — copy it to .env.
//
// Redirect URI configured in Google Cloud Console:
//   http://65.1.111.102:3001/api/gmail-auth/callback
//
// ⚡ To change this URL later: update GMAIL_REDIRECT_URI in server/.env
//    AND update the Authorized redirect URIs in Google Cloud Console.
router.get('/callback', async (req, res) => {
  const { code, error } = req.query

  if (error) {
    return res.status(400).send(`<h2>OAuth Error</h2><p>${error}</p>`)
  }
  if (!code) {
    return res.status(400).send('<h2>No authorization code received.</h2>')
  }

  try {
    const oAuth2Client = makeOAuth2Client()
    const { tokens } = await oAuth2Client.getToken(code)
    const refreshToken = tokens.refresh_token

    if (!refreshToken) {
      return res.status(400).send(`
        <!DOCTYPE html><html><head><title>SnapLocate Gmail Setup</title>
        <style>body{font-family:system-ui,sans-serif;max-width:600px;margin:60px auto;padding:0 20px}
        .warn{background:#fffbeb;border:1px solid #fde68a;border-radius:14px;padding:24px}
        h2{color:#92400e;margin:0 0 12px}p{color:#374151}ol{color:#374151}</style></head>
        <body><div class="warn">
          <h2>⚠️ No Refresh Token Received</h2>
          <p>This usually means the app was already authorized previously. To get a new refresh token:</p>
          <ol>
            <li>Go to <a href="https://myaccount.google.com/permissions" target="_blank">Google Account Permissions</a></li>
            <li>Find and remove access for your SnapLocate app</li>
            <li>Visit the setup URL again: <code>/api/gmail-auth/setup?secret=...</code></li>
          </ol>
        </div></body></html>
      `)
    }

    // Print to server logs (EC2 console)
    console.log('\n✅ Gmail OAuth Authorization Successful!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('Copy this line and add it to server/.env:')
    console.log(`GMAIL_REFRESH_TOKEN=${refreshToken}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>SnapLocate Gmail Setup Complete</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: system-ui, -apple-system, sans-serif; background: #f8fafc; min-height: 100vh;
                   display: flex; align-items: center; justify-content: center; padding: 20px; }
            .card { background: #fff; border-radius: 20px; padding: 36px; max-width: 580px; width: 100%;
                    box-shadow: 0 8px 40px rgba(0,0,0,0.08); border: 1px solid #f1f5f9; }
            .success-icon { width: 64px; height: 64px; background: #f0fdf4; border-radius: 50%;
                            display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;
                            font-size: 28px; }
            h2 { color: #15803d; font-size: 22px; font-weight: 800; text-align: center; margin-bottom: 8px; }
            .subtitle { color: #64748b; font-size: 14px; text-align: center; margin-bottom: 24px; }
            .token-label { font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase;
                           letter-spacing: 0.05em; margin-bottom: 8px; }
            .token-box { background: #1e293b; color: #7dd3fc; font-family: 'Courier New', monospace;
                         font-size: 11px; padding: 16px; border-radius: 10px; word-break: break-all;
                         margin-bottom: 24px; line-height: 1.6; }
            .steps { display: flex; flex-direction: column; gap: 10px; }
            .step { display: flex; align-items: flex-start; gap: 12px; padding: 14px 16px;
                    background: #f8fafc; border-radius: 12px; border: 1px solid #f1f5f9; }
            .step-num { width: 26px; height: 26px; background: #4f46e5; color: #fff; border-radius: 50%;
                        font-size: 12px; font-weight: 700; display: flex; align-items: center; 
                        justify-content: center; flex-shrink: 0; }
            .step-text { font-size: 13px; color: #374151; line-height: 1.5; }
            code { background: #e0e7ff; color: #4f46e5; padding: 1px 6px; border-radius: 4px; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="success-icon">✅</div>
            <h2>Gmail Authorization Complete!</h2>
            <p class="subtitle">Add the refresh token below to your server .env file</p>
            <div class="token-label">Refresh Token — copy this ↓</div>
            <div class="token-box">GMAIL_REFRESH_TOKEN=${refreshToken}</div>
            <div class="steps">
              <div class="step">
                <div class="step-num">1</div>
                <div class="step-text">SSH into your EC2 server and open <code>server/.env</code></div>
              </div>
              <div class="step">
                <div class="step-num">2</div>
                <div class="step-text">Set <code>GMAIL_REFRESH_TOKEN=&lt;paste token here&gt;</code></div>
              </div>
              <div class="step">
                <div class="step-num">3</div>
                <div class="step-text">Restart the server with <code>pm2 restart snaplocate</code> or <code>npm start</code></div>
              </div>
              <div class="step">
                <div class="step-num">4</div>
                <div class="step-text">The Gmail poller starts automatically — check server logs for <code>📧 Gmail poller active</code></div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `)
  } catch (err) {
    console.error('[Gmail Auth] Token exchange failed:', err.message)
    res.status(500).send(`<h2>Token exchange failed</h2><p>${err.message}</p>`)
  }
})

export default router
