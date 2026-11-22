import 'server-only';
import { currentUser } from '@clerk/nextjs/server';
import { Resend } from 'resend';

type Notice = {
  subject: string;
  title: string;
  message: string;
  actionLabel?: string;
  actionPath?: string;
};

/**
 * Best-effort product email. Notification delivery must never roll back a
 * rescue transaction, so missing configuration and provider errors are safe.
 */
export async function notifyCurrentUser(notice: Notice): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  if (!apiKey || !from) return false;

  try {
    const user = await currentUser();
    const to = user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress;
    if (!to) return false;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const actionUrl = notice.actionPath ? new URL(notice.actionPath, baseUrl).toString() : undefined;
    const resend = new Resend(apiKey);
    const result = await resend.emails.send({
      from,
      to,
      subject: notice.subject,
      html: `<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:auto;color:#102b24"><div style="background:#102b24;color:#b9e88c;padding:18px 22px;border-radius:14px 14px 0 0;font-weight:800;letter-spacing:.08em">SAVORUNE</div><div style="border:1px solid #dfe7e2;border-top:0;padding:28px 22px;border-radius:0 0 14px 14px"><h1 style="font-size:24px;margin:0 0 12px">${escapeHtml(notice.title)}</h1><p style="font-size:16px;line-height:1.65;color:#52645f">${escapeHtml(notice.message)}</p>${actionUrl && notice.actionLabel ? `<a href="${actionUrl}" style="display:inline-block;margin-top:14px;background:#102b24;color:white;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:700">${escapeHtml(notice.actionLabel)}</a>` : ''}<p style="margin-top:24px;font-size:12px;color:#788984">Food rescue logistics notification · Do not reply with personal details.</p></div></div>`,
    });
    if (result.error) throw result.error;
    return true;
  } catch (error) {
    console.error('Non-blocking Resend notification failed:', error);
    return false;
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char] || char);
}
