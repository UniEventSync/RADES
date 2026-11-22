import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe/server";
import { processEventRefunds } from "@/lib/payments/event-refunds";
import { sendEventParticipantNotices } from "@/lib/email/event-participant-notifications";

type Context = { params: Promise<{ id: string }> };
const bodySchema = z.object({ reason: z.string().trim().min(5).max(1000) });

async function expirePendingSessions(admin: ReturnType<typeof createAdminClient>, eventId: string) {
  try {
    const stripe = getStripe();
    const { data: registrations } = await admin.from("registrations").select("id").eq("event_id", eventId).eq("status", "cancelled");
    if (!registrations?.length) return;
    const { data: payments } = await admin.from("event_payments").select("checkout_session_id,checkout_expires_at").in("registration_id", registrations.map(row => row.id)).eq("status", "pending").not("checkout_session_id", "is", null);
    for (const payment of payments ?? []) {
      if (Date.parse(payment.checkout_expires_at) > Date.now()) await stripe.checkout.sessions.expire(payment.checkout_session_id!).catch(() => undefined);
    }
  } catch { /* The held place is already released; an expired-session webhook is a second release path. */ }
}

export async function POST(request: Request, { params }: Context) {
  const { id } = await params;
  let raw: unknown;
  try { raw = await request.json(); } catch { return NextResponse.json({ error: "Add a cancellation reason." }, { status: 400 }); }
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: "Add a cancellation reason (at least 5 characters)." }, { status: 400 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const { data, error } = await supabase.rpc("cancel_event_and_queue_refunds", { p_event_id: id, p_reason: parsed.data.reason, p_actor_id: user.id });
  if (error) {
    const status = error.code === "42501" ? 403 : error.code === "P0002" ? 404 : 400;
    return NextResponse.json({ error: error.message }, { status });
  }
  const admin = createAdminClient();
  await expirePendingSessions(admin, id);
  const refunds = await processEventRefunds(admin, id);
  let participantNotifications = { sent: 0, failed: 0, skipped: 0 };
  const { data: cancelledEvent } = await admin.from("events").select("cancellation_reason").eq("id", id).maybeSingle();
  try { participantNotifications = await sendEventParticipantNotices(admin, id, process.env.APP_URL ?? new URL(request.url).origin, "event_cancelled", cancelledEvent?.cancellation_reason ?? parsed.data.reason); }
  catch (noticeError) { console.error("RADES event cancellation notifications could not be sent", noticeError); participantNotifications = { sent: 0, failed: 1, skipped: 0 }; }
  return NextResponse.json({ ok: true, alreadyCancelled: Boolean((data as { alreadyCancelled?: boolean } | null)?.alreadyCancelled), refunds, participantNotifications });
}
