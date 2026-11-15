"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/toast-provider";

export function UnpublishEventButton({ eventId }: { eventId: string }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const toast = useToast();
  return <button type="button" disabled={busy} onClick={async () => {
    if (!window.confirm("Unpublish this event? It will be hidden from public event listings and returned to drafts.")) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/events/${eventId}/unpublish`, { method: "POST" });
      const body = await response.json();
      if (!response.ok) { toast(body.error ?? "Could not unpublish this event.", "error"); return; }
      toast("Event unpublished and moved to drafts.", "success");
      router.refresh();
    } catch { toast("Could not reach RADES. Please try again.", "error"); }
    finally { setBusy(false); }
  }} className="rounded-lg border border-amber-300 px-3 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-50 disabled:opacity-50">{busy ? "Unpublishing…" : "Unpublish event"}</button>;
}
