import { NextResponse } from "next/server";
import Stripe from "stripe";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe/server";
import { processEventRefunds } from "@/lib/payments/event-refunds";
import { sendRegistrationConfirmationEmails } from "@/lib/email/registration-confirmations";
import { sendTicketInformationEmails } from "@/lib/email/ticket-information";

const registrationIdSchema = z.string().uuid();
const checkoutEvents = new Set([
  "checkout.session.completed",
  "checkout.session.expired",
  "checkout.session.async_payment_succeeded",
  "checkout.session.async_payment_failed",
]);

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

  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    try {
      const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
      await Promise.all([sendRegistrationConfirmationEmails(admin, registrationId.data, siteUrl), sendTicketInformationEmails(admin, registrationId.data, siteUrl)]);
    } catch (sendError) { console.error("RADES paid registration confirmation email could not be attempted", sendError); }
  }

  // Stripe retries with a new delivery attempt ID after failures. This lookup
  // also resumes a refund if the database transaction committed before Stripe's
  // refund API or the final status update failed.
  if (outcome === "refund_required" || outcome === "duplicate") {
    const { data: payment } = await admin.from("event_payments").select("status,registration_id").eq("checkout_session_id", session.id).maybeSingle();
    if (payment?.status === "refund_pending") {
      const { data: registration } = await admin.from("registrations").select("event_id").eq("id", payment.registration_id).maybeSingle();
      if (registration) {
        const refunds = await processEventRefunds(admin, registration.event_id);
        if (refunds.failed) return NextResponse.json({ error: "Refund processing failed; it can be retried from event analytics." }, { status: 500 });
        outcome = refunds.refunded ? "refunded" : "refund_processing";
      }
    }
  }
  return NextResponse.json({ received: true, outcome });
}
