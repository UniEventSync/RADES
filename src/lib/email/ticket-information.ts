import "server-only";
import QRCode from "qrcode";
import type { SupabaseClient } from "@supabase/supabase-js";
import { emailTemplates } from "@/lib/email/templates";
import { sendTrackedEmail } from "@/lib/email/tracked-send";

export type TicketEmailResult = { sent: number; failed: number; skipped: number };
export type TicketEmailStatus = "sent" | "failed" | "skipped";

export async function sendTicketInformationEmail(admin: SupabaseClient, registrationMemberId: string, siteUrl: string, force = false): Promise<TicketEmailStatus> {
  const { data: member } = await admin.from("registration_members").select("id,user_id,email,display_name,registration_id,event_id,active").eq("id", registrationMemberId).maybeSingle();
  if (!member?.active) return "skipped";
  const [{ data: registration }, { data: event }, { data: ticket }] = await Promise.all([
    admin.from("registrations").select("status").eq("id", member.registration_id).maybeSingle(),
    admin.from("events").select("id,title,starts_at,ends_at,venue,status").eq("id", member.event_id).maybeSingle(),
    admin.from("event_tickets").select("id,status").eq("registration_member_id", member.id).maybeSingle(),
  ]);
  if (registration?.status !== "confirmed" || !event || event.status === "cancelled" || ticket?.status !== "active") return "skipped";
  const { data: deliveryId, error: claimError } = await admin.rpc("claim_registration_email", { p_registration_member_id: member.id, p_email_type: "ticket_information", p_force: force });
  if (claimError || !deliveryId) {
    if (claimError) console.error("RADES ticket email claim failed", { registrationMemberId, code: claimError.code });
    return claimError ? "failed" : "skipped";
  }
  const qr = await QRCode.toBuffer(`RADES-TICKET:${ticket.id}`, { type: "png", errorCorrectionLevel: "H", margin: 2, width: 420, color: { dark: "#0f172a", light: "#ffffff" } });
  const ticketUrl = `${siteUrl}/tickets/${ticket.id}`;
  const message = emailTemplates.ticketInformation({ eventTitle: event.title, holder: member.display_name, startsAt: event.starts_at, endsAt: event.ends_at, venue: event.venue, ticketUrl });
  const result = await sendTrackedEmail({ to: member.email, ...message, attachments: [{ filename: `rades-ticket-${ticket.id.slice(0, 8)}.png`, content: qr, contentType: "image/png", contentId: "ticket-qr" }] }, { userId: member.user_id, eventId: event.id, type: "ticket_information" });
  const { error: finishError } = await admin.rpc("finish_registration_email", { p_delivery_id: deliveryId, p_status: result.sent ? "sent" : "failed", p_provider_id: result.sent ? result.id ?? null : null, p_error: result.sent ? null : result.reason ?? "Email provider request failed." });
  if (finishError) console.error("RADES ticket email status update failed", { deliveryId, code: finishError.code });
  return result.sent ? "sent" : "failed";
}

export async function sendTicketInformationEmails(admin: SupabaseClient, registrationId: string, siteUrl: string): Promise<TicketEmailResult> {
  const { data: members, error } = await admin.from("registration_members").select("id").eq("registration_id", registrationId).eq("active", true);
  if (error) throw new Error("Could not load event ticket holders.");
  const statuses = await Promise.all((members ?? []).map(member => sendTicketInformationEmail(admin, member.id, siteUrl)));
  return { sent: statuses.filter(status => status === "sent").length, failed: statuses.filter(status => status === "failed").length, skipped: statuses.filter(status => status === "skipped").length };
}
