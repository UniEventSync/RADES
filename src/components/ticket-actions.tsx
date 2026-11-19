"use client";

import { Download, Printer } from "lucide-react";

export function TicketActions({ qrDataUrl, ticketId }: { qrDataUrl: string; ticketId: string }) {
  return <div className="flex flex-wrap gap-3 print:hidden"><a href={qrDataUrl} download={`rades-ticket-${ticketId}.png`} className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50"><Download size={16}/>Download QR</a><button type="button" onClick={() => window.print()} className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-700 px-4 text-sm font-semibold text-white hover:bg-blue-800"><Printer size={16}/>Print ticket</button></div>;
}
