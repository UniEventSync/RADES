"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, CheckCircle2, LoaderCircle, QrCode, Search, XCircle } from "lucide-react";

type Validation = { valid: true; ticketId: string; attendee: string; email: string; teamName: string | null; event: string; checkedInAt: string | null };

export function EventTicketScanner({ eventId, eventTitle }: { eventId: string; eventTitle: string }) {
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [manual, setManual] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Validation | null>(null);
  const [cameraError, setCameraError] = useState("");
  const scannerRef = useRef<{ stop: () => Promise<void>; clear: () => void } | null>(null);
  const scannedRef = useRef(false);

  const validate = useCallback(async (value: string) => {
    setError(""); setResult(null); setBusy(true);
    try {
      const response = await fetch(`/api/events/${eventId}/check-in/validate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ value }) });
      const body = await response.json();
      if (!response.ok) { setError(body.error ?? "Ticket could not be validated."); return; }
      setResult(body as Validation);
    } catch { setError("Could not reach RADES. Check your connection and try again."); }
    finally { setBusy(false); }
  }, [eventId]);

  useEffect(() => {
    if (!cameraEnabled) return;
    let disposed = false;
    let scanner: { stop: () => Promise<void>; clear: () => void } | null = null;
    void (async () => {
      try {
        const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import("html5-qrcode");
        if (disposed) return;
        const instance = new Html5Qrcode("rades-event-qr-reader", { formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE], verbose: false });
        scanner = instance;
        scannerRef.current = instance;
        await instance.start({ facingMode: "environment" }, { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1 }, decoded => {
          if (scannedRef.current) return;
          scannedRef.current = true;
          void instance.stop().catch(() => undefined);
          setCameraEnabled(false);
          void validate(decoded);
        }, () => undefined);
      } catch {
        if (!disposed) { setCameraError("Camera access is unavailable. Allow camera permission or use the manual ticket field below."); setCameraEnabled(false); }
      }
    })();
    return () => {
      disposed = true;
      const activeScanner = scanner ?? scannerRef.current;
      if (activeScanner) void activeScanner.stop().catch(() => undefined).finally(() => activeScanner.clear());
      scannerRef.current = null;
    };
  }, [cameraEnabled, validate]);

  const submitManual = (event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); scannedRef.current = true; setCameraEnabled(false); void validate(manual); };
  const restartScanner = () => { scannedRef.current = false; setError(""); setResult(null); setCameraError(""); setCameraEnabled(true); };
  const checkIn = async () => {
    if (!result || result.checkedInAt) return;
    setError(""); setBusy(true);
    try {
      const response = await fetch(`/api/events/${eventId}/check-in`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ticketId: result.ticketId }) });
      const body = await response.json();
      if (!response.ok) { setError(body.error ?? "Check-in could not be recorded."); return; }
      setResult(current => current ? { ...current, checkedInAt: body.checkedInAt } : current);
    } catch { setError("Could not reach RADES. Check your connection and try again."); }
    finally { setBusy(false); }
  };

  return <section className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,.8fr)]">
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-white"><QrCode size={20}/></span><div><h2 className="font-bold">Scan an event ticket</h2><p className="text-sm text-slate-600">Camera access requires HTTPS or localhost.</p></div></div>
      {cameraEnabled ? <><div id="rades-event-qr-reader" className="mt-5 overflow-hidden rounded-xl bg-slate-950" aria-label="Camera QR scanner"/><button type="button" onClick={() => setCameraEnabled(false)} className="mt-3 inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"><Camera size={16}/>Stop camera</button></> : <button type="button" onClick={restartScanner} className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-blue-700 px-4 text-sm font-semibold text-white hover:bg-blue-800"><Camera size={17}/>Start camera scanner</button>}
      <form onSubmit={submitManual} className="mt-6 border-t border-slate-200 pt-5"><label htmlFor="ticket-code" className="block text-sm font-semibold">Manual ticket code</label><div className="mt-1.5 flex gap-2"><input id="ticket-code" className="h-11 min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 font-mono text-sm text-slate-900 outline-none focus:border-blue-700 focus:ring-4 focus:ring-blue-100" value={manual} onChange={event => setManual(event.target.value)} placeholder="RADES-TICKET:…" maxLength={200} required/><button type="submit" disabled={busy} className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"><Search size={16}/>Validate</button></div><p className="mt-2 text-xs text-slate-500">Use this if the device has no camera or camera permission is unavailable.</p></form>
    </div>
    <aside aria-live="polite" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><h2 className="font-bold">Validation result</h2><p className="mt-1 text-sm text-slate-600">Event: {eventTitle}</p>{cameraError&&<p role="status" className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{cameraError}</p>}{busy&&<p className="mt-5 flex items-center gap-2 text-sm text-slate-600"><LoaderCircle size={17} className="animate-spin"/>Checking ticket…</p>}{error&&<p role="alert" className="mt-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800"><XCircle size={18} className="mt-0.5 shrink-0"/>{error}</p>}{result&&<div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4 text-green-950"><p className="flex items-center gap-2 font-bold"><CheckCircle2 size={19}/>{result.checkedInAt ? "Already checked in" : "Valid ticket"}</p><dl className="mt-3 space-y-2 text-sm"><div><dt className="text-green-800">Attendee</dt><dd className="font-semibold">{result.attendee}</dd></div><div><dt className="text-green-800">IBA email</dt><dd className="break-all font-semibold">{result.email}</dd></div>{result.teamName&&<div><dt className="text-green-800">Team</dt><dd className="font-semibold">{result.teamName}</dd></div>}<div><dt className="text-green-800">Ticket ID</dt><dd className="font-mono text-xs">{result.ticketId}</dd></div></dl>{result.checkedInAt ? <p className="mt-3 border-t border-green-200 pt-3 text-sm font-semibold text-green-900">Checked in at {new Date(result.checkedInAt).toLocaleTimeString("en-PK", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Karachi" })} PKT.</p> : <><button type="button" onClick={() => void checkIn()} disabled={busy} className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-green-700 px-4 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-50">Confirm check-in</button><p className="mt-2 text-xs text-green-900">Checking in once disables this ticket for repeat entry.</p></>}</div>}{!busy&&!error&&!result&&!cameraError&&<div className="mt-5 rounded-xl border border-dashed border-slate-300 p-6 text-center"><p className="text-sm text-slate-600">Scan a QR ticket or enter the printed code to see its validation result.</p></div>}</aside>
  </section>;
}
