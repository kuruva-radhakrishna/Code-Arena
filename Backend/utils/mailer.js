// Sends transactional email over an HTTPS API (axios is already a dependency).
//
// Render's free tier blocks outbound SMTP, so use one of these providers:
//   EMAIL_PROVIDER=brevo    BREVO_API_KEY=...   MAIL_FROM=you@yourdomain.com   (sender must be verified in Brevo)
//   EMAIL_PROVIDER=resend   RESEND_API_KEY=...  MAIL_FROM="CodeArena <onboarding@resend.dev>"
// Optional: MAIL_FROM_NAME (Brevo, default "CodeArena").
//
// With no provider configured nothing is sent: the message is printed to the server log so
// the flow can still be tried locally. It never returns the contents to the caller.
const axios = require('axios');

const TIMEOUT_MS = 10000;

function parseFrom(from) {
  // "Name <a@b.com>" or "a@b.com"
  const m = /^\s*(.*?)\s*<([^>]+)>\s*$/.exec(from || '');
  return m ? { name: m[1].replace(/^"|"$/g, '') || undefined, email: m[2] } : { email: (from || '').trim() };
}

async function sendMail({ to, subject, text, html }) {
  const provider = (process.env.EMAIL_PROVIDER || '').toLowerCase();
  const from = process.env.MAIL_FROM;

  if (provider === 'brevo' && process.env.BREVO_API_KEY && from) {
    const sender = parseFrom(from);
    await axios.post('https://api.brevo.com/v3/smtp/email', {
      sender: { name: sender.name || process.env.MAIL_FROM_NAME || 'CodeArena', email: sender.email },
      to: [{ email: to }],
      subject,
      textContent: text,
      htmlContent: html,
    }, { headers: { 'api-key': process.env.BREVO_API_KEY, 'content-type': 'application/json' }, timeout: TIMEOUT_MS });
    return { sent: true, provider: 'brevo' };
  }

  if (provider === 'resend' && process.env.RESEND_API_KEY && from) {
    await axios.post('https://api.resend.com/emails', { from, to: [to], subject, text, html },
      { headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'content-type': 'application/json' }, timeout: TIMEOUT_MS });
    return { sent: true, provider: 'resend' };
  }

  console.warn(`[mailer] No email provider configured (set EMAIL_PROVIDER, an API key and MAIL_FROM). Not sent to ${to}.`);
  if (process.env.NODE_ENV !== 'production') console.warn(`[mailer] (dev only) ${subject}\n${text}`);
  return { sent: false, provider: null };
}

module.exports = { sendMail };
