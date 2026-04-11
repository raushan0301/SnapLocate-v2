import { SESClient, SendEmailCommand, SendTemplatedEmailCommand } from '@aws-sdk/client-ses'
import dotenv from 'dotenv'
dotenv.config()

const sesClient = new SESClient({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId:     process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
})

const FROM = `${process.env.SES_FROM_NAME || 'SnapLocate'} <${process.env.SES_FROM_EMAIL || 'noreply@snaplocate.app'}>`

/**
 * Send a plain/HTML email via AWS SES
 */
export async function sendEmail({ to, subject, html, text }) {
  const command = new SendEmailCommand({
    Source: FROM,
    Destination: { ToAddresses: Array.isArray(to) ? to : [to] },
    Message: {
      Subject: { Data: subject, Charset: 'UTF-8' },
      Body: {
        Html: { Data: html, Charset: 'UTF-8' },
        Text: { Data: text || subject, Charset: 'UTF-8' },
      },
    },
  })
  return sesClient.send(command)
}

/**
 * Send OTP email
 */
export async function sendOTPEmail(to, otp, name = 'Student') {
  return sendEmail({
    to,
    subject: `${otp} — Your SnapLocate Verification Code`,
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 500px; margin: 0 auto; padding: 32px; background: #f9f9f7; border-radius: 16px;">
        <h2 style="color: #1a1a1a; margin-bottom: 8px;">Hello, ${name} 👋</h2>
        <p style="color: #555; font-size: 16px;">Your SnapLocate verification code is:</p>
        <div style="background: #1a1a1a; color: #fff; font-size: 36px; font-weight: 700; letter-spacing: 8px; text-align: center; padding: 20px; border-radius: 12px; margin: 24px 0;">
          ${otp}
        </div>
        <p style="color: #888; font-size: 14px;">This code expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
        <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />
        <p style="color: #aaa; font-size: 12px;">SnapLocate Campus OS · If you didn't request this, ignore this email.</p>
      </div>
    `,
    text: `Your SnapLocate OTP is: ${otp}. Expires in 10 minutes.`,
  })
}

/**
 * Send request status email to student
 */
export async function sendRequestStatusEmail(to, { studentName, facultyName, requestType, status, notes }) {
  const isAccepted = status === 'accepted'
  return sendEmail({
    to,
    subject: `Your ${requestType} request was ${isAccepted ? 'Accepted ✅' : 'Declined ❌'} — SnapLocate`,
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 500px; margin: 0 auto; padding: 32px; background: #f9f9f7; border-radius: 16px;">
        <h2 style="color: #1a1a1a;">Hi ${studentName} 👋</h2>
        <p style="color: #555; font-size: 16px;">
          Your <strong>${requestType}</strong> request to <strong>Prof. ${facultyName}</strong> has been
          <strong style="color: ${isAccepted ? '#16a34a' : '#dc2626'};">${status}</strong>.
        </p>
        ${notes ? `<p style="background: #f0f0ec; padding: 16px; border-radius: 8px; color: #444;">📝 Note: ${notes}</p>` : ''}
        <p style="color: #888; font-size: 14px; margin-top: 24px;">Log in to SnapLocate to view full details.</p>
        <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />
        <p style="color: #aaa; font-size: 12px;">SnapLocate Campus OS</p>
      </div>
    `,
    text: `Your ${requestType} request to Prof. ${facultyName} was ${status}.${notes ? ` Note: ${notes}` : ''}`,
  })
}

export default sesClient
