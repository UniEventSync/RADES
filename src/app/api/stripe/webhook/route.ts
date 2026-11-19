import { NextResponse } from "next/server";
import Stripe from "stripe";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe/server";

const registrationIdSchema = z.string().uuid();
const checkoutEvents = new Set([
  "checkout.session.completed",
  "checkout.session.expired",
  "checkout.session.async_payment_succeeded",
  "checkout.session.async_payment_failed",
]);

async function refundLatePayment(stripe: Stripe, session: Stripe.Checkout.Session, admin: ReturnType<typeof createAdminClient>) {
  const paymentIntent = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
  if (!paymentIntent) throw new Error("Paid cancelled registration has no payment intent to refund.");
  const refund = await stripe.refunds.create({ payment_intent: paymentIntent, reason: "requested_by_customer", metadata: { registration_id: session.metadata?.registration_id ?? "", source: "late_registration_payment" } }, { idempotencyKey: `rades-late-payment-refund-${session.id}` });
  if (refund.status !== "succeeded") throw new Error("Stripe has not completed the refund yet.");
  const { error } = await admin.rpc("mark_event_payment_refunded", { p_session_id: session.id, p_refund_id: refund.id });
  if (error) throw new Error("The Stripe refund completed but RADES could not record it.");
}

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !secret.startsWith("whsec_")) return NextResponse.json({ error: "Stripe webhook signing secret is not configured." }, { status: 503 });
  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Stripe-Signature header is required." }, { status: 400 });

  let stripe: Stripe;
  let event: Stripe.Event;
  try {
    stripe = getStripe();
    const rawBody = await request.text();
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch {
    return NextResponse.json({ error: "Webhook signature or test-mode Stripe configuration is invalid." }, { status: 400 });
  }
  if (event.livemode) return NextResponse.json({ error: "RADES accepts Stripe test-mode webhook events only." }, { status: 400 });
  if (!checkoutEvents.has(event.type)) return NextResponse.json({ received: true, ignored: true });

  const session = event.data.object as Stripe.Checkout.Session;
  if (session.mode !== "payment" || !session.id.startsWith("cs_test_")) return NextResponse.json({ error: "Expected a Stripe test Checkout Session." }, { status: 400 });
  const registrationId = registrationIdSchema.safeParse(session.metadata?.registration_id);
  const userId = z.string().uuid().safeParse(session.metadata?.user_id);
  if (!registrationId.success || !userId.success || session.client_reference_id !== registrationId.data) return NextResponse.json({ received: true, ignored: true });

  const admin = createAdminClient();
  const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null;
  const { data, error } = await admin.rpc("process_stripe_checkout_event", {
    p_event_id: event.id,
    p_event_type: event.type,
    p_session_id: session.id,
    p_registration_id: registrationId.data,
    p_user_id: userId.data,
    p_payment_intent_id: paymentIntentId,
    p_amount_total: session.amount_total ?? 0,
    p_currency: session.currency ?? "",
    p_payment_status: session.payment_status ?? "unpaid",
  });
  if (error) return NextResponse.json({ error: "Could not record this Stripe event." }, { status: 500 });
  let outcome = (data as { outcome?: string } | null)?.outcome ?? "ignored";

  // Stripe retries with a new delivery attempt ID after failures. This lookup
  // also resumes a refund if the database transaction committed before Stripe's
  // refund API or the final status update failed.
  if (outcome === "refund_required" || outcome === "duplicate") {
    const { data: payment } = await admin.from("event_payments").select("status").eq("checkout_session_id", session.id).maybeSingle();
    if (payment?.status === "refund_pending") {
      try { await refundLatePayment(stripe, session, admin); outcome = "refunded"; }
      catch { return NextResponse.json({ error: "Refund processing is incomplete; Stripe will retry this event." }, { status: 500 }); }
    }
  }
  return NextResponse.json({ received: true, outcome });
}
