import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { emailTemplates } from "@/lib/email/templates";
import { sendTrackedEmail } from "@/lib/email/tracked-send";

export type ConfirmationDeliverySummary = { sent: number; failed: number; skipped: number };

export async function sendRegistrationConfirmationEmails(admin: SupabaseClient, registrationId: string, siteUrl: string): Promise<ConfirmationDeliverySummary> {
  const { data: registration } = await admin.from("registrations").select("id,event_id,status").eq("id", registrationId).maybeSingle();
  if (!registration || registration.status !== "confirmed") return { sent: 0, failed: 0, skipped: 0 };
  const [{ data: event }, { data: members }] = await Promise.all([
    admin.from("events").select("id,title,starts_at,ends_at,venue").eq("id", registration.event_id).maybeSingle(),
    admin.from("registration_members").select("id,user_id,email,display_name").eq("registration_id", registrationId).eq("active", true),
  ]);
  if (!event || !members?.length) return { sent: 0, failed: 0, skipped: 0 };

  const results = await Promise.all(members.map(async member => {
    const { data: deliveryId, error: claimError } = await admin.rpc("claim_registration_email", { p_registration_member_id: member.id, p_email_type: "registration_confirmation" });
    if (claimError || !deliveryId) {
      if (claimError) console.error("RADES registration email claim failed", { registrationMemberId: member.id, code: claimError.code });
      return claimError ? "failed" as const : "skipped" as const;
    }
    const result = await sendTrackedEmail({ to: member.email, ...emailTemplates.registrationConfirmation({ title: event.title, startsAt: event.starts_at, endsAt: event.ends_at, venue: event.venue, eventUrl: `${siteUrl}/events/${event.id}` }) }, { userId: member.user_id, eventId: event.id, type: "registration_confirmation" });
    const { error: finishError } = await admin.rpc("finish_registration_email", { p_delivery_id: deliveryId, p_status: result.sent ? "sent" : "failed", p_provider_id: result.sent ? result.id ?? null : null, p_error: result.sent ? null : result.reason ?? "Email provider request failed." });
    if (finishError) console.error("RADES registration email status update failed", { deliveryId, code: finishError.code });
    return result.sent ? "sent" as const : "failed" as const;
  }));
  return { sent: results.filter(result => result === "sent").length, failed: results.filter(result => result === "failed").length, skipped: results.filter(result => result === "skipped").length };
}
