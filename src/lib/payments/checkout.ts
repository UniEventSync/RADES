import "server-only";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { getStripe } from "@/lib/stripe/server";
import { STRIPE_MIN_REGISTRATION_PKR } from "@/lib/payments/constants";

type Registration = { id: string; event_id: string; leader_id: string; status: string; amount_pkr: number; payment_expires_at: string | null };
type CheckoutResult = { checkoutUrl: string } | { error: string; status: number };

async function releaseHold(supabase: SupabaseClient, registrationId: string) {
  await supabase.rpc("release_event_payment_hold", { p_registration_id: registrationId });
}

export async function createOrReuseCheckout(supabase: SupabaseClient, user: User, registrationId: string, requestUrl: string): Promise<CheckoutResult> {
  const { data: registration } = await supabase.from("registrations").select("id,event_id,leader_id,status,amount_pkr,payment_expires_at").eq("id", registrationId).maybeSingle();
  if (!registration || registration.leader_id !== user.id) return { error: "Registration could not be found for payment.", status: 404 };
  if (registration.status !== "pending_payment" || registration.amount_pkr <= 0) return { error: "This registration is no longer waiting for payment.", status: 409 };
  const row = registration as Registration;
  const [{ data: event }, { data: existingPayment }, { data: profile }] = await Promise.all([
    supabase.from("events").select("title,price_pkr").eq("id", row.event_id).maybeSingle(),
    supabase.from("event_payments").select("checkout_session_id,checkout_url,checkout_expires_at,checkout_idempotency_key,status").eq("registration_id", row.id).maybeSingle(),
    supabase.from("profiles").select("email").eq("id", user.id).maybeSingle(),
  ]);
  if (!event) { await releaseHold(supabase, row.id); return { error: "The event could not be found for payment.", status: 404 }; }

  let stripe: ReturnType<typeof getStripe>;
  try { stripe = getStripe(); }
  catch (error) {
    if (!existingPayment?.checkout_session_id) await releaseHold(supabase, row.id);
    return { error: error instanceof Error ? error.message : "Stripe test-mode keys are not configured.", status: 503 };
  }

  if (existingPayment?.status === "pending" && existingPayment.checkout_session_id) {
    try {
      const session = await stripe.checkout.sessions.retrieve(existingPayment.checkout_session_id);
      if (session.status === "open" && session.url) return { checkoutUrl: session.url };
      if (session.status === "complete") {
        const site = (process.env.APP_URL ?? new URL(requestUrl).origin).replace(/\/$/, "");
        return { checkoutUrl: `${site}/checkout/success?session_id=${encodeURIComponent(session.id)}` };
      }
      if (session.status === "open") await stripe.checkout.sessions.expire(session.id);
    } catch { /* The checkout may have expired or been removed; release the unpayable hold. */ }
    await releaseHold(supabase, row.id);
    return { error: "The payment window expired. Register again to reserve a new place.", status: 409 };
  }

  if (existingPayment?.status === "pending" && Date.parse(existingPayment.checkout_expires_at) <= Date.now()) {
    await releaseHold(supabase, row.id);
    return { error: "The payment window expired. Register again to reserve a new place.", status: 409 };
  }
  if (!existingPayment && (!row.payment_expires_at || Date.parse(row.payment_expires_at) <= Date.now())) {
    await releaseHold(supabase, row.id);
    return { error: "The payment hold expired. Register again to reserve a new place.", status: 409 };
  }
  const amountMinor = row.amount_pkr * 100;
  if (!Number.isSafeInteger(amountMinor) || amountMinor < STRIPE_MIN_REGISTRATION_PKR * 100 || amountMinor > 99_999_999) {
    await releaseHold(supabase, row.id);
    return { error: `The registration total must be at least PKR ${STRIPE_MIN_REGISTRATION_PKR} for Stripe card payment.`, status: 400 };
  }
  const site = (process.env.APP_URL ?? new URL(requestUrl).origin).replace(/\/$/, "");
  const { data: prepared, error: prepareError } = await supabase.rpc("prepare_event_checkout", { p_registration_id: row.id });
  if (prepareError || !prepared?.expiresAt || !prepared?.idempotencyKey) {
    await releaseHold(supabase, row.id);
    return { error: prepareError?.message ?? "Checkout could not be prepared. The reserved seats have been released.", status: 409 };
  }
  let session;
  try {
    session = await stripe.checkout.sessions.create({
      mode: "payment",
      currency: "pkr",
      allowed_payment_method_types: ["card"],
      line_items: [{ quantity: 1, price_data: { currency: "pkr", unit_amount: amountMinor, product_data: { name: event.title, description: "RADES event registration" } } }],
      customer_email: profile?.email ?? user.email ?? undefined,
      client_reference_id: row.id,
      metadata: { registration_id: row.id, user_id: user.id },
      payment_intent_data: { metadata: { registration_id: row.id, user_id: user.id } },
      success_url: `${site}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${site}/checkout/cancel?registration_id=${encodeURIComponent(row.id)}`,
      expires_at: Number(prepared.expiresAt),
    }, { idempotencyKey: String(prepared.idempotencyKey) });
  } catch (error) {
    console.error("RADES Stripe Checkout session could not be created", {
      registrationId: row.id,
      amountPkr: row.amount_pkr,
      error: error instanceof Error ? error.message : String(error),
    });
    await releaseHold(supabase, row.id);
    const stripeMessage = error instanceof Error ? error.message : "";
    const detail = stripeMessage.includes("at least 50 cents")
      ? "The registration total is below Stripe’s minimum PKR card-payment amount."
      : "Stripe rejected the test checkout configuration or account payment settings.";
    return { error: `${detail} The reserved seats have been released; try again or use a higher event registration total.`, status: 502 };
  }
  if (!session.url) {
    await releaseHold(supabase, row.id);
    return { error: "Stripe did not return a checkout page. The reserved seats have been released.", status: 502 };
  }
  const { error: attachError } = await supabase.rpc("attach_event_checkout_session", {
    p_registration_id: row.id,
    p_session_id: session.id,
    p_checkout_url: session.url,
    p_expires_at: new Date(session.expires_at * 1000).toISOString(),
  });
  if (attachError) {
    await stripe.checkout.sessions.expire(session.id).catch(() => undefined);
    await releaseHold(supabase, row.id);
    return { error: "RADES could not safely reserve your seats for checkout. The test payment session was closed; try again.", status: 409 };
  }
  return { checkoutUrl: session.url };
}
