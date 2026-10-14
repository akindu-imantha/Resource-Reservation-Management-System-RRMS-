import nodemailer from "nodemailer";
import { db } from "../../database/pool.js";

const sender = process.env.COMPANY_MAIL_ADDRESS?.trim();
const appPassword = process.env.COMPANY_MAIL_APP_PASSWORD?.replace(/\s+/g, "");

const transporter = sender && appPassword
  ? nodemailer.createTransport({ host: "smtp.gmail.com", port: 465, secure: true, auth: { user: sender, pass: appPassword } })
  : null;

export async function sendReservationApprovalNotification(reservationId: string): Promise<void> {
  if (!transporter || !sender) return;

  const result = await db.query<{ resourceName: string; requesterName: string; requesterEmail: string; purpose: string; startTime: Date; endTime: Date; recipients: string[] }>(
    `SELECT r.name AS "resourceName",u.full_name AS "requesterName",u.email AS "requesterEmail",b.purpose,b.start_time AS "startTime",b.end_time AS "endTime",
      ARRAY(SELECT DISTINCT recipient.email FROM public.users recipient
        WHERE recipient.account_status='active' AND lower(recipient.email)<>lower($2)) AS recipients
     FROM public.reservations b
     JOIN public.resources r ON r.resource_id=b.resource_id
     JOIN public.users u ON u.user_id=b.user_id
     WHERE b.reservation_id=$1 AND b.status='approved'`,
    [reservationId, sender],
  );
  const reservation = result.rows[0];
  if (!reservation) return;

  const dateTime = (value: Date) => new Intl.DateTimeFormat("en-LK", {
    dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Colombo",
  }).format(new Date(value));
  const start = dateTime(reservation.startTime);
  const end = dateTime(reservation.endTime);
  const htmlEntities: Record<string, string> = {
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  };
  const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (character) => htmlEntities[character]);
  const resourceName = escapeHtml(reservation.resourceName);
  const requesterName = escapeHtml(reservation.requesterName);
  const purpose = escapeHtml(reservation.purpose);
  const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/$/, "");
  const reservationUrl = `${frontendUrl}/admin/reservations`;

  await transporter.sendMail({
    from: { name: "RRMS Reservations", address: sender },
    replyTo: sender,
    to: sender,
    bcc: reservation.recipients,
    subject: `Reservation approved: ${reservation.resourceName}`,
    text: [
      "RESOURCE RESERVATION MANAGEMENT SYSTEM",
      "Reservation approved",
      "",
      `Resource: ${reservation.resourceName}`,
      `Requested by: ${reservation.requesterName}`,
      `Date and time: ${start} – ${end} (Sri Lanka time)`,
      `Purpose: ${reservation.purpose}`,
      "",
      `View reservation details: ${reservationUrl}`,
      "This is an automated notification from RRMS.",
    ].join("\n"),
    html: `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:32px 12px;background:#f3f6fb;font-family:Arial,Helvetica,sans-serif;color:#182230;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e5eaf1;border-radius:16px;overflow:hidden;">
      <tr><td style="padding:24px 32px;background:#123b35;color:#ffffff;">
        <div style="font-size:12px;letter-spacing:1.5px;font-weight:bold;color:#b8e5d4;">RRMS</div>
        <div style="margin-top:8px;font-size:22px;font-weight:bold;">Reservation approved</div>
      </td></tr>
      <tr><td style="padding:28px 32px 12px;font-size:15px;line-height:1.6;">An administrator approved this reservation. The details are below.</td></tr>
      <tr><td style="padding:8px 32px 24px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;font-size:14px;line-height:1.5;">
          <tr><td style="padding:12px 0;color:#667085;border-bottom:1px solid #edf0f4;width:34%;">Resource</td><td style="padding:12px 0;border-bottom:1px solid #edf0f4;font-weight:bold;">${resourceName}</td></tr>
          <tr><td style="padding:12px 0;color:#667085;border-bottom:1px solid #edf0f4;">Requested by</td><td style="padding:12px 0;border-bottom:1px solid #edf0f4;">${requesterName}</td></tr>
          <tr><td style="padding:12px 0;color:#667085;border-bottom:1px solid #edf0f4;">When</td><td style="padding:12px 0;border-bottom:1px solid #edf0f4;">${escapeHtml(start)} – ${escapeHtml(end)}<br><span style="color:#667085;font-size:12px;">Sri Lanka time</span></td></tr>
          <tr><td style="padding:12px 0;color:#667085;vertical-align:top;">Purpose</td><td style="padding:12px 0;">${purpose}</td></tr>
        </table>
      </td></tr>
      <tr><td style="padding:0 32px 28px;">
        <a href="${escapeHtml(reservationUrl)}" style="display:inline-block;padding:12px 20px;border-radius:8px;background:#176b57;color:#ffffff;text-decoration:none;font-size:14px;font-weight:bold;">View reservation details</a>
      </td></tr>
      <tr><td style="padding:18px 32px;background:#f8fafc;color:#667085;font-size:12px;line-height:1.5;">Automated reservation update from RRMS, sent to active members.</td></tr>
    </table>
  </body>
</html>`,
  });
}
