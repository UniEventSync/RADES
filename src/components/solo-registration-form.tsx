"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarDays, Check, LoaderCircle, MapPin } from "lucide-react";
import type { EventItem } from "@/lib/events/demo";

type Conflict = { id: string; title: string; starts_at: string; ends_at: string };
export type RegistrationPreflight = { isStudent: boolean; isOpen: boolean; alreadyRegistered: boolean; availableSeats: number | null; scheduleConflicts: Conflict[]; registrationType: string };
type Profile = { firstName: string; lastName: string; email: string; erpNumber: string | null; phone: string };
const field = "mt-1.5 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-700 focus:ring-4 focus:ring-blue-100";
const pkt = { timeZone: "Asia/Karachi" } as const;

export function SoloRegistrationForm({ event, profile, preflight }: { event: EventItem; profile: Profile; preflight: RegistrationPreflight | null }) {
  const [phone, setPhone] = useState(profile.phone);
  const [confirmedSchedule, setConfirmedSchedule] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ registrationId: string; status: string; paymentRequired: boolean } | null>(null);
  const conflicts = preflight?.scheduleConflicts ?? [];
  const isClosed = !preflight?.isOpen;
  const isFull = preflight?.availableSeats === 0;
  const alreadyRegistered = preflight?.alreadyRegistered ?? false;
  const start = new Date(event.starts_at);
  const formatRange = (from: string, to: string) => `${new Date(from).toLocaleTimeString("en-PK", { hour: "numeric", minute: "2-digit", ...pkt })}–${new Date(to).toLocaleTimeString("en-PK", { hour: "numeric", minute: "2-digit", ...pkt })} PKT`;

  const submit = async (submission: React.FormEvent<HTMLFormElement>) => {
    submission.preventDefault(); setError(""); setBusy(true);
    try {
      const response = await fetch(`/api/events/${event.id}/register`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone }) });
      const body = await response.json();
      if (!response.ok) { setError(body.error ?? "Registration could not be completed."); return; }
      if (body.checkoutUrl) { window.location.assign(body.checkoutUrl); return; }
      if (body.paymentRequired) { setError("Payment checkout was not started. Please try again."); return; }
      setResult(body as { registrationId: string; status: string; paymentRequired: boolean });
    } catch { setError("Could not reach RADES. Check your connection and try again."); }
    finally { setBusy(false); }
  };

  if (result) return <section aria-live="polite" className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-6 shadow-sm sm:p-8"><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-700"><Check size={30}/></span><h2 className="mt-4 text-center text-2xl font-bold text-green-950">You’re in!</h2><p className="mt-2 text-center text-sm text-green-900">{result.paymentRequired ? "Your place is held for 15 minutes while payment is completed." : "Your registration is confirmed."}</p><div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row"><Link href="/profile" className="inline-flex h-11 items-center justify-center rounded-lg bg-blue-700 px-5 text-sm font-semibold text-white hover:bg-blue-800">View registration history</Link><Link href={`/events/${event.id}`} className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-800 hover:bg-slate-50">Back to event</Link></div></section>;

  return <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-5"><div><h2 className="text-lg font-bold">{event.title}</h2><p className="mt-2 flex items-center gap-2 text-sm text-slate-600"><CalendarDays size={16} className="text-blue-700"/>{start.toLocaleDateString("en-PK", { dateStyle: "medium", ...pkt })} · {formatRange(event.starts_at, event.ends_at)}</p><p className="mt-1 flex items-center gap-2 text-sm text-slate-600"><MapPin size={16} className="text-blue-700"/>{event.venue}</p></div><span className="rounded-full bg-blue-50 px-3 py-1.5 text-sm font-bold text-blue-800">{(event.price_pkr ?? 0) === 0 ? "FREE" : `PKR ${event.price_pkr}`}</span></div>
    {!preflight ? <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">Registration status could not be checked. Refresh this page to try again.</p> : alreadyRegistered ? <div role="status" className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-4"><h3 className="font-semibold text-blue-950">You are already registered</h3><p className="mt-1 text-sm text-blue-900">Your registration is in your profile history.</p><Link href="/profile" className="mt-3 inline-block text-sm font-semibold text-blue-800 underline">View profile</Link></div> : conflicts.length > 0 ? <div role="alert" className="mt-5 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-950"><h3 className="font-semibold">Schedule conflict</h3><p className="mt-1 text-sm">This event overlaps with an active registration:</p><ul className="mt-2 space-y-2">{conflicts.map(conflict => <li key={conflict.id} className="text-sm"><Link href={`/events/${conflict.id}`} className="font-semibold underline">{conflict.title}</Link> · {new Date(conflict.starts_at).toLocaleDateString("en-PK", { dateStyle: "medium", ...pkt })} · {formatRange(conflict.starts_at, conflict.ends_at)}</li>)}</ul></div> : isFull ? <p role="status" className="mt-5 rounded-xl border border-slate-300 bg-slate-50 p-4 text-sm font-semibold text-slate-700">This event is sold out.</p> : isClosed ? <p role="status" className="mt-5 rounded-xl border border-slate-300 bg-slate-50 p-4 text-sm font-semibold text-slate-700">Registration for this event is closed.</p> : <>
      <div className="mt-5 grid gap-4 sm:grid-cols-2"><div><p className="text-sm font-semibold">Student name</p><p className="mt-1 rounded-lg bg-slate-50 px-3 py-2.5 text-sm">{profile.firstName} {profile.lastName}</p></div><div><p className="text-sm font-semibold">ERP ID</p><p className="mt-1 rounded-lg bg-slate-50 px-3 py-2.5 text-sm">{profile.erpNumber ?? "—"}</p></div><div className="sm:col-span-2"><p className="text-sm font-semibold">Email</p><p className="mt-1 rounded-lg bg-slate-50 px-3 py-2.5 text-sm">{profile.email}</p></div></div>
      <form onSubmit={submit} className="mt-5 space-y-5"><label className="block text-sm font-semibold">Contact number for venue updates <span className="font-normal text-slate-500">(optional)</span><input className={field} type="tel" inputMode="tel" autoComplete="tel" value={phone} maxLength={20} onChange={e => setPhone(e.target.value)} placeholder="+923001234567"/><span className="mt-1.5 block text-xs font-normal text-slate-500">Use international format, for example +923001234567.</span></label><label className="flex items-start gap-3 rounded-xl border border-slate-200 p-3 text-sm"><input type="checkbox" className="mt-0.5 h-4 w-4 accent-blue-700" checked={confirmedSchedule} onChange={e => setConfirmedSchedule(e.target.checked)} required/><span>I checked my schedule and can attend this event.</span></label>{error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}<button type="submit" disabled={busy || !preflight || !confirmedSchedule} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600">{busy ? <><LoaderCircle size={17} className="animate-spin"/>Registering…</> : (event.price_pkr ?? 0) === 0 ? "Confirm solo registration" : "Continue to payment"}</button></form>
    </>}
  </section>;
}
