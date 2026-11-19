"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast-provider";

export function RetryEventRefundsButton({ eventId }: { eventId: string }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const toast = useToast();
  return <button type="button" disabled={busy} onClick={async () => {
    setBusy(true);
    try {
      const response = await fetch(`/api/events/${eventId}/refunds/retry`, { method: "POST" });
      const body = await response.json();
      if (!response.ok) { toast(body.error ?? "Could not retry refunds.", "error"); return; }
      const summary = body.refunds as { refunded: number; pending: number; failed: number };
      toast(`Refunds updated: ${summary.refunded} refunded, ${summary.pending} pending, ${summary.failed} failed.`, summary.failed ? "error" : "success");
      router.refresh();
    } catch { toast("Could not reach RADES. Please try again.", "error"); }
    finally { setBusy(false); }
  }} className="mt-3 rounded-lg border border-amber-400 px-3 py-2 text-sm font-semibold text-amber-950 hover:bg-amber-100 disabled:opacity-60">{busy ? "Retrying refunds…" : "Retry failed refunds"}</button>;
}
