import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { emailTemplates } from "@/lib/email/templates";
import { sendTrackedEmail } from "@/lib/email/tracked-send";

export type ParticipantNotificationSummary = { sent: number; failed: number; skipped: number };

async function sendParticipantNotice(admin: SupabaseClient, member: { id: string; user_id: string; email: string }, event: { id: string; title: string; starts_at: string; ends_at: string; venue: string }, siteUrl: string, type: "event_update" | "event_cancelled", reason?: string, notificationKey = "default"): Promise<"sent" | "failed" | "skipped"> {
  const { data: deliveryId, error: claimError } = await admin.rpc("claim_registration_email", { p_registration_member_id: member.id, p_email_type: type, p_notification_key: notificationKey });
  if (claimError || !deliveryId) {
    if (claimError) console.error("RADES participant notice claim failed", { memberId: member.id, type, code: claimError.code });
    return claimError ? "failed" : "skipped";
  }
  const template = type === "event_update"
    ? emailTemplates.eventParticipantUpdate({ title: event.title, startsAt: event.starts_at, endsAt: event.ends_at, venue: event.venue, profileUrl: `${siteUrl}/profile` })
    : emailTemplates.eventCancelled({ title: event.title, reason: reason ?? "The organizer cancelled this event.", profileUrl: `${siteUrl}/profile` });
  const result = await sendTrackedEmail({ to: member.email, ...template }, { userId: member.user_id, eventId: event.id, type });
  const { error: finishError } = await admin.rpc("finish_registration_email", { p_delivery_id: deliveryId, p_status: result.sent ? "sent" : "failed", p_provider_id: result.sent ? result.id ?? null : null, p_error: result.sent ? null : result.reason ?? "Email provider request failed." });
  if (finishError) console.error("RADES participant notice status update failed", { deliveryId, code: finishError.code });
  return result.sent ? "sent" : "failed";
}

export async function sendEventParticipantNotices(admin: SupabaseClient, eventId: string, siteUrl: string, type: "event_update" | "event_cancelled", reason?: string, notificationKey = "default"): Promise<ParticipantNotificationSummary> {
  const { data: event } = await admin.from("events").select("id,title,starts_at,ends_at,venue").eq("id", eventId).maybeSingle();
  if (!event) return { sent: 0, failed: 0, skipped: 0 };
  const { data: registrations, error } = await admin.from("registrations").select("id,amount_pkr").eq("event_id", eventId).in("status", type === "event_cancelled" ? ["cancelled", "refunded"] : ["confirmed"]);
  if (error) throw new Error("Could not load event participants for notification.");
  let eligibleRegistrations = registrations ?? [];
  if (type === "event_cancelled") {
    const paidRegistrationIds = eligibleRegistrations.filter(row => row.amount_pkr > 0).map(row => row.id);
    const { data: payments, error: paymentError } = paidRegistrationIds.length
      ? await admin.from("event_payments").select("registration_id,status").in("registration_id", paidRegistrationIds)
      : { data: [], error: null };
    if (paymentError) throw new Error("Could not verify event participant payment status.");
    const paidOrRefundedIds = new Set((payments ?? [])
      .filter(payment => ["paid", "refund_pending", "refunded"].includes(payment.status))
      .map(payment => payment.registration_id));
    eligibleRegistrations = eligibleRegistrations.filter(row => row.amount_pkr === 0 || paidOrRefundedIds.has(row.id));
  }
  const ids = eligibleRegistrations.map(row => row.id);
  if (!ids.length) return { sent: 0, failed: 0, skipped: 0 };
  const { data: members, error: membersError } = await admin.from("registration_members").select("id,user_id,email").in("registration_id", ids);
  if (membersError) throw new Error("Could not load event participant emails.");
  const outcomes = await Promise.all((members ?? []).map(member => sendParticipantNotice(admin, member, event, siteUrl, type, reason, notificationKey)));
  return { sent: outcomes.filter(outcome => outcome === "sent").length, failed: outcomes.filter(outcome => outcome === "failed").length, skipped: outcomes.filter(outcome => outcome === "skipped").length };
}
