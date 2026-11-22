import nodemailer from 'nodemailer';

// SMTP configurable via .env. Sans SMTP_HOST, on utilise le transport JSON de
// nodemailer : l'email est journalisé dans la console du serveur (mode test).
const host = String(process.env.SMTP_HOST || '').trim();
const port = Number(process.env.SMTP_PORT || (process.env.SMTP_SECURE === 'true' ? 465 : 587));
const secure = String(process.env.SMTP_SECURE || '').toLowerCase() === 'true' || port === 465;
const user = String(process.env.SMTP_USER || '').trim();
const pass = String(process.env.SMTP_PASS || '');
const from = String(process.env.MAIL_FROM || 'Karriery <no-reply@karriery.tn>').trim();
const newsletterFrom = String(process.env.NEWSLETTER_FROM || 'Karriery Newsletter <newsletter@karriery.tn>').trim();

export const mailMode = host ? 'smtp' : 'log';

const transporter = host
  ? nodemailer.createTransport({
      host,
      port: Number.isFinite(port) ? port : 587,
      secure,
      ...(user ? { auth: { user, pass } } : {}),
    })
  : nodemailer.createTransport({ jsonTransport: true });

export async function sendImprovedCvEmail({ to, name, demandeId, filename, content, source = 'admin' }) {
  const isNewsletter = source === 'newsletter';
  const sender = isNewsletter ? newsletterFrom : from;
  const signature = isNewsletter ? 'La newsletter Karriery' : 'L’équipe Karriery';
  const subject = isNewsletter
    ? `Karriery Newsletter — Votre CV amélioré (dossier n° ${demandeId})`
    : `Votre CV amélioré — dossier n° ${demandeId}`;
  const text = [
    `Bonjour ${name || ''},`,
    '',
    'Votre CV amélioré est prêt. Vous le trouverez en pièce jointe au format PDF.',
    `Il a été généré dans le cadre de votre dossier n° ${demandeId} sur Karriery.`,
    '',
    'Bien cordialement,',
    signature,
  ].join('\n');
  const html = `
    <div style="font-family:Arial,sans-serif;color:#15151B;line-height:1.6">
      <p>Bonjour ${name ? escapeHtml(name) : ''},</p>
      <p>Votre <b>CV amélioré</b> est prêt. Vous le trouverez en pièce jointe au format PDF.</p>
      <p>Il a été généré dans le cadre de votre dossier n° ${demandeId} sur Karriery.</p>
      <p>Bien cordialement,<br>${signature}</p>
    </div>`;

  const info = await transporter.sendMail({
    from: sender,
    to,
    subject,
    text,
    html,
    attachments: [{ filename, content }],
  });

  if (mailMode === 'log') {
    console.log(`[MAIL:LOG] ${isNewsletter ? 'Newsletter' : 'Admin'} — CV amélioré pour ${to} (dossier ${demandeId}) — pièce jointe ${filename}`);
  }
  return { mode: mailMode, messageId: info.messageId, source, sender };
}

const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
