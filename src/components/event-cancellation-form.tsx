"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast-provider";

type RefundSummary = { eligible: number; eligibleAmountPkr: number; refunded: number; pending: number; failed: number };

export function EventCancellationForm({ eventId, hasEligibleRefunds }: { eventId: string; hasEligibleRefunds: boolean }) {
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const toast = useToast();

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!confirmed) { setError("Confirm that you understand this event will be cancelled."); return; }
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/events/${eventId}/cancel`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason }) });
      const body = await response.json();
      if (!response.ok) { setError(body.error ?? "Cancellation failed."); return; }
      const refunds = body.refunds as RefundSummary | undefined;
      const message = !refunds?.eligible ? "Event cancelled. No paid registrations need a refund." : refunds.failed ? `Event cancelled. ${refunds.refunded} refunded; ${refunds.pending} pending; ${refunds.failed} need a refund retry.` : `Event cancelled. ${refunds.refunded} refund${refunds.refunded === 1 ? "" : "s"} processed; ${refunds.pending} pending.`;
      toast(message, refunds?.failed ? "error" : "success");
      router.push(`/admin/events/${eventId}/analytics`);
      router.refresh();
    } catch { setError("Could not reach RADES. Please try again."); }
    finally { setBusy(false); }
  }

  return <form onSubmit={submit} className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
    <label className="block text-sm font-semibold text-slate-900">Reason for cancellation<textarea className="mt-2 min-h-28 w-full rounded-xl border border-slate-300 bg-white p-3 font-normal text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-700" value={reason} onChange={event => setReason(event.target.value)} minLength={5} maxLength={1000} required aria-describedby="cancel-reason-help" /></label>
    <p id="cancel-reason-help" className="mt-1 text-xs text-slate-600">This reason will appear in the event record. Use 5–1,000 characters.</p>
    <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-950">
      <h2 className="font-bold">Refund information</h2>
      {hasEligibleRefunds ? <p className="mt-1">Eligible paid registrations will be refunded in Stripe test mode to their original payment methods. Refunds can take time to settle. Any failed or pending refund will remain visible in event analytics for retry or review.</p> : <p className="mt-1">No paid registrations are currently eligible for a refund. Unpaid registrations will be cancelled and their reserved places released.</p>}
    </div>
    <label className="mt-5 flex items-start gap-3 text-sm leading-6 text-slate-800"><input type="checkbox" checked={confirmed} onChange={event => setConfirmed(event.target.checked)} className="mt-1 h-4 w-4 rounded border-slate-400 text-red-700 focus:ring-red-700"/><span>I understand this will cancel the event and deactivate its registrations and tickets.</span></label>
    {error && <p role="alert" className="mt-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm font-medium text-red-900">{error}</p>}
    <div className="mt-6 flex flex-wrap justify-end gap-3"><Link href={`/admin/events/${eventId}/analytics`} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50">Keep event</Link><button disabled={busy || !confirmed} className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60">{busy ? "Cancelling…" : "Confirm cancellation"}</button></div>
  </form>;
}
