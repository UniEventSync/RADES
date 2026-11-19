"use client";

import { useState } from "react";
import { Download, LoaderCircle, Mail, Printer } from "lucide-react";

export function TicketActions({ qrDataUrl, ticketId }: { qrDataUrl: string; ticketId: string }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  async function emailTicket() {
    setBusy(true); setMessage(""); setFailed(false);
    try {
      const response = await fetch(`/api/tickets/${ticketId}/email`, { method: "POST" });
      const body = await response.json();
      if (!response.ok) { setFailed(true); setMessage(body.error ?? "Ticket email could not be sent."); return; }
      setMessage(body.testRouted ? "Ticket copy sent to the configured test inbox." : "Ticket copy sent to your registered email address.");
    } catch { setFailed(true); setMessage("Could not reach RADES. Please try again."); }
    finally { setBusy(false); }
  }
  return <div className="flex flex-wrap items-center gap-3 print:hidden"><a href={qrDataUrl} download={`rades-ticket-${ticketId}.png`} className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50"><Download size={16}/>Download QR</a><button type="button" onClick={() => void emailTicket()} disabled={busy} className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60">{busy ? <LoaderCircle size={16} className="animate-spin"/> : <Mail size={16}/>}Email ticket copy</button><button type="button" onClick={() => window.print()} className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-700 px-4 text-sm font-semibold text-white hover:bg-blue-800"><Printer size={16}/>Print ticket</button>{message && <p role={failed ? "alert" : "status"} aria-live="polite" className={`w-full text-sm ${failed ? "text-red-800" : "text-slate-700"}`}>{message}</p>}</div>;
}
