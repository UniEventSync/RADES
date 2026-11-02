import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, type OutboundEmail } from "@/lib/email/send";

export async function sendTrackedEmail(message: OutboundEmail, tracking: { userId?: string | null; eventId?: string | null; type: string }) {
  const result = await sendEmail(message);
  try {
    const admin = createAdminClient();
    await admin.from("notifications_log").insert({ user_id: tracking.userId ?? null, event_id: tracking.eventId ?? null, type: tracking.type, status: result.sent ? "sent" : "failed", provider_id: result.sent ? result.id ?? null : null, error_message: result.sent ? null : result.reason });
  } catch (error) { console.error("RADES notification log could not be written", error); }
  return result;
}
