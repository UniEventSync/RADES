import "server-only";
import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getStripe } from "@/lib/stripe/server";

type RefundRow = { id: string; registration_id: string; amount_pkr: number; status: string; stripe_payment_intent_id: string | null; stripe_refund_id: string | null };
export type RefundSummary = { eligible: number; eligibleAmountPkr: number; refunded: number; pending: number; failed: number };

export async function processEventRefunds(admin: SupabaseClient, eventId: string): Promise<RefundSummary> {
  const { data: allRows, error } = await admin.from("event_refund_transactions").select("id,registration_id,amount_pkr,status,stripe_payment_intent_id,stripe_refund_id").eq("event_id", eventId).not("registration_id", "is", null);
  if (error) throw new Error("Could not load refund records for this event.");
  const rows = (allRows ?? []) as RefundRow[];
  if (!rows.length) return { eligible: 0, eligibleAmountPkr: 0, refunded: 0, pending: 0, failed: 0 };
  let stripe: Stripe;
  try { stripe = getStripe(); }
  catch {
    return {
      eligible: rows.length,
      eligibleAmountPkr: rows.reduce((sum, row) => sum + row.amount_pkr, 0),
      refunded: rows.filter(row => row.status === "refunded").length,
      pending: rows.filter(row => row.status === "pending" || row.status === "processing").length,
      failed: rows.filter(row => row.status === "failed").length,
    };
  }

  for (const row of rows.filter(item => ["pending", "processing", "failed"].includes(item.status))) {
    if (!row.stripe_payment_intent_id) {
      await admin.rpc("record_event_refund_result", { p_refund_row_id: row.id, p_stripe_refund_id: null, p_status: "failed", p_failure_note: "The payment intent is unavailable; manual review is required." });
      continue;
    }
    try {
      const requestRefund = (attempt: string) => stripe.refunds.create({ payment_intent: row.stripe_payment_intent_id!, reason: "requested_by_customer", metadata: { event_id: eventId, registration_id: row.registration_id, source: "event_cancellation" } }, { idempotencyKey: `rades-event-cancel-refund-${row.registration_id}${attempt}` });
      let refund: Stripe.Refund;
      if (row.stripe_refund_id) {
        refund = await stripe.refunds.retrieve(row.stripe_refund_id);
        if (refund.status !== "succeeded" && refund.status !== "pending") refund = await requestRefund(`-retry-${row.stripe_refund_id}`);
      } else refund = await requestRefund("");
      const status = refund.status === "succeeded" ? "refunded" : refund.status === "pending" ? "processing" : "failed";
      await admin.rpc("record_event_refund_result", { p_refund_row_id: row.id, p_stripe_refund_id: refund.id, p_status: status, p_failure_note: status === "failed" ? "Stripe did not complete the refund." : null });
    } catch {
      await admin.rpc("record_event_refund_result", { p_refund_row_id: row.id, p_stripe_refund_id: row.stripe_refund_id, p_status: "failed", p_failure_note: "Stripe could not process the refund. Use Retry refunds to try again." });
    }
  }
  const { data: latest } = await admin.from("event_refund_transactions").select("amount_pkr,status").eq("event_id", eventId).not("registration_id", "is", null);
  const current = latest ?? [];
  return {
    eligible: rows.length,
    eligibleAmountPkr: rows.reduce((sum, row) => sum + row.amount_pkr, 0),
    refunded: current.filter(row => row.status === "refunded").length,
    pending: current.filter(row => row.status === "pending" || row.status === "processing").length,
    failed: current.filter(row => row.status === "failed").length,
  };
}
