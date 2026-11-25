const esc = (value: string) => value.replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]!);

type EmailAction = { label: string; url: string };

const shell = (content: string, siteUrl: string, action?: EmailAction) => {
  const logoUrl = esc(new URL("/Icon.png", siteUrl).toString());
  const actionMarkup = action
    ? `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:28px 0 4px"><tr><td bgcolor="#274B5C" style="background:#274B5C;border:1px solid #274B5C;padding:13px 20px"><a href="${esc(action.url)}" style="display:inline-block;color:#FFFDF6;font-family:Georgia,'Times New Roman',serif;font-size:14px;font-weight:700;line-height:1.3;text-decoration:none">${esc(action.label)}</a></td></tr></table>`
    : "";

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;background:#F5F0E4;color:#222A2E;font-family:Georgia,'Times New Roman',serif"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#F5F0E4" style="width:100%;background:#F5F0E4"><tr><td align="center" style="padding:32px 16px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px;background:#FFFDF6;border:1px solid #D7CDB9"><tr><td style="padding:24px 32px;border-bottom:1px solid #D7CDB9"><table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr><td width="72" valign="middle"><img src="${logoUrl}" width="64" height="64" alt="RADES" style="display:block;width:64px;height:64px;object-fit:contain"></td><td valign="middle" style="padding-left:14px"><p style="margin:0;color:#274B5C;font-size:12px;font-weight:700;letter-spacing:1.4px">IBA KARACHI</p><p style="margin:5px 0 0;color:#747D79;font-size:12px;letter-spacing:.5px">CAMPUS EVENTS</p></td></tr></table></td></tr><tr><td style="padding:32px;color:#222A2E;font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.65">${content}${actionMarkup}</td></tr><tr><td style="padding:18px 32px;border-top:1px solid #D7CDB9"><p style="margin:0;color:#747D79;font-family:Georgia,'Times New Roman',serif;font-size:12px;line-height:1.6">RADES · SMCS, IBA Karachi</p></td></tr></table></td></tr></table></body></html>`;
};

const heading = (text: string) => `<h1 style="margin:0 0 16px;color:#222A2E;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:700;line-height:1.3">${text}</h1>`;
const paragraph = (text: string) => `<p style="margin:0 0 16px;color:#4B5656;font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.7">${text}</p>`;
const details = (text: string) => `<p style="margin:20px 0;color:#3F4A4E;font-family:Georgia,'Times New Roman',serif;font-size:14px;line-height:1.8">${text}</p>`;

export const emailTemplates = {
  passwordRecovery: (otp: string, siteUrl: string) => ({
    subject: "Your RADES password reset code",
    html: shell(`${heading("Reset your password")}${paragraph("Enter this code on RADES to choose a new password:")}<p style="margin:0 0 16px"><span style="display:inline-block;border:1px solid #BDCDD2;background:#E7EDF0;padding:12px 18px;color:#274B5C;font-family:monospace;font-size:30px;font-weight:700;letter-spacing:8px">${esc(otp)}</span></p><p style="margin:0;color:#5E6764;font-family:Georgia,'Times New Roman',serif;font-size:13px;line-height:1.6">If you did not request this code, you can ignore this email.</p>`, siteUrl),
    text: `Your RADES password reset code is ${otp}. If you did not request it, ignore this email.`,
  }),
  eventSubmitted: (title: string, url: string) => ({
    subject: `Event submitted for review: ${title}`,
    html: shell(`${heading("Event submitted for review")}${paragraph(`${esc(title)} has been submitted to the society patron. Once approved, OSSIE will complete the final review.`)}`, url, { label: "Open RADES", url }),
    text: `${title} has been submitted to the society patron for review. ${url}`,
  }),
  eventApproved: (title: string, status: string, url: string) => ({
    subject: `RADES event update: ${title}`,
    html: shell(`${heading("Your event has an update")}${paragraph(`<strong>${esc(title)}</strong> is now ${esc(status)}.`)}`, url, { label: "View event", url }),
    text: `${title} is now ${status}. ${url}`,
  }),
  roleAssigned: (society: string, role: string, url: string) => ({
    subject: `You have a RADES ${role} assignment`,
    html: shell(`${heading("A RADES role was assigned to you")}${paragraph(`You have been assigned as ${esc(role)} for ${esc(society)}.`)}`, url, { label: "Open RADES", url }),
    text: `You have been assigned as ${role} for ${society}. ${url}`,
  }),
  registrationConfirmation: (event: { title: string; startsAt: string; endsAt: string; venue: string; eventUrl: string }) => {
    const starts = new Date(event.startsAt).toLocaleString("en-PK", { dateStyle: "full", timeStyle: "short", timeZone: "Asia/Karachi" });
    const ends = new Date(event.endsAt).toLocaleTimeString("en-PK", { timeStyle: "short", timeZone: "Asia/Karachi" });
    return {
      subject: `Registration confirmed: ${event.title}`,
      html: shell(`${heading("Your registration is confirmed")}${paragraph(`You are registered for <strong>${esc(event.title)}</strong>.`)}${details(`<strong>When:</strong> ${esc(starts)} – ${esc(ends)} PKT<br><strong>Where:</strong> ${esc(event.venue)}`)}${paragraph("Your individual digital ticket is available from your RADES profile. Keep it ready for event check-in.")}`, event.eventUrl, { label: "View event", url: event.eventUrl }),
      text: `Your registration is confirmed for ${event.title}. When: ${starts} – ${ends} PKT. Where: ${event.venue}. View event: ${event.eventUrl}`,
    };
  },
  ticketInformation: (ticket: { eventTitle: string; holder: string; startsAt: string; endsAt: string; venue: string; ticketUrl: string }) => {
    const starts = new Date(ticket.startsAt).toLocaleString("en-PK", { dateStyle: "full", timeStyle: "short", timeZone: "Asia/Karachi" });
    const ends = new Date(ticket.endsAt).toLocaleTimeString("en-PK", { timeStyle: "short", timeZone: "Asia/Karachi" });
    return {
      subject: `Your RADES ticket: ${ticket.eventTitle}`,
      html: shell(`${heading("Your digital event ticket")}${paragraph(`Hi ${esc(ticket.holder)}, your individual ticket for <strong>${esc(ticket.eventTitle)}</strong> is attached as a QR code.`)}${details(`<strong>When:</strong> ${esc(starts)} – ${esc(ends)} PKT<br><strong>Where:</strong> ${esc(ticket.venue)}`)}${paragraph("Present the attached QR code at event check-in, or open your ticket online. Each team member has a separate ticket.")}<p style="margin:20px 0;text-align:center"><img src="cid:ticket-qr" width="280" height="280" alt="Your event ticket QR code" style="display:inline-block;width:280px;height:280px"></p>`, ticket.ticketUrl, { label: "Open digital ticket", url: ticket.ticketUrl }),
      text: `Your individual ticket for ${ticket.eventTitle} is attached as a QR code. Holder: ${ticket.holder}. When: ${starts} – ${ends} PKT. Where: ${ticket.venue}. Open ticket: ${ticket.ticketUrl}`,
    };
  },
  eventParticipantUpdate: (event: { title: string; startsAt: string; endsAt: string; venue: string; profileUrl: string }) => {
    const starts = new Date(event.startsAt).toLocaleString("en-PK", { dateStyle: "full", timeStyle: "short", timeZone: "Asia/Karachi" });
    const ends = new Date(event.endsAt).toLocaleTimeString("en-PK", { timeStyle: "short", timeZone: "Asia/Karachi" });
    return {
      subject: `Event update: ${event.title}`,
      html: shell(`${heading("An event you registered for was updated")}${paragraph(`<strong>${esc(event.title)}</strong> has updated event details.`)}${details(`<strong>When:</strong> ${esc(starts)} – ${esc(ends)} PKT<br><strong>Where:</strong> ${esc(event.venue)}`)}${paragraph("Review your registration and ticket in your RADES profile.")}`, event.profileUrl, { label: "View registration", url: event.profileUrl }),
      text: `${event.title} has updated event details. When: ${starts} – ${ends} PKT. Where: ${event.venue}. Review your RADES profile: ${event.profileUrl}`,
    };
  },
  eventCancelled: (event: { title: string; reason: string; profileUrl: string }) => ({
    subject: `Event cancelled: ${event.title}`,
    html: shell(`${heading("An event you registered for was cancelled")}${paragraph(`<strong>${esc(event.title)}</strong> has been cancelled.`)}${details(`<strong>Reason:</strong> ${esc(event.reason)}`)}${paragraph("If your registration has an eligible paid ticket, its refund status is available in your RADES profile. Refund settlement times vary.")}`, event.profileUrl, { label: "View registration status", url: event.profileUrl }),
    text: `${event.title} has been cancelled. Reason: ${event.reason}. If your registration has an eligible paid ticket, its refund status is available in your RADES profile: ${event.profileUrl}. Refund settlement times vary.`,
  }),
};
