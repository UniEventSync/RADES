"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, Check, LoaderCircle, MapPin, Plus, Trash2 } from "lucide-react";
import type { EventItem } from "@/lib/events/demo";
import type { RegistrationPreflight } from "@/components/solo-registration-form";

type Profile = { firstName: string; lastName: string; email: string; phone: string };
type Teammate = { email: string; state: "idle" | "checking" | "valid" | "invalid"; name?: string; message?: string };
const field = "mt-1.5 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-700 focus:ring-4 focus:ring-blue-100";
const pkt = { timeZone: "Asia/Karachi" } as const;

function TeammateField({ eventId, index, member, onChange, onLookup, onRemove, canRemove }: { eventId: string; index: number; member: Teammate; onChange: (value: string) => void; onLookup: (email: string, result: { valid: boolean; name?: string; message?: string }) => void; onRemove: () => void; canRemove: boolean }) {
  useEffect(() => {
    const email = member.email.trim().toLowerCase();
    if (!email) return;
    let active = true;
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/events/${eventId}/register-team/lookup`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
        const body = await response.json();
        if (!active) return;
        onLookup(email, { valid: response.ok, name: response.ok ? `${body.firstName} ${body.lastName}` : undefined, message: body.error });
      } catch {
        if (active) onLookup(email, { valid: false, message: "Could not verify this email right now." });
      }
    }, 450);
    return () => { active = false; window.clearTimeout(timer); };
  }, [eventId, member.email, onChange, onLookup]);

  return <div className="rounded-xl border border-slate-200 p-3">
    <div className="flex items-end gap-2"><label className="min-w-0 flex-1 text-sm font-semibold" htmlFor={`member-${index}`}>Member {index + 2} Institutional Email{index + 2 > 2 && <span className="font-normal text-slate-500"> (optional until minimum is met)</span>}<input id={`member-${index}`} className={field} type="email" inputMode="email" autoComplete="off" value={member.email} maxLength={254} onChange={event => onChange(event.target.value)} placeholder="name.surname.12345@khi.iba.edu.pk" aria-describedby={`member-status-${index}`}/></label>{canRemove && <button type="button" onClick={onRemove} aria-label={`Remove member ${index + 2}`} className="mb-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100"><Trash2 size={17}/></button>}</div>
    <p id={`member-status-${index}`} aria-live="polite" className={`mt-2 text-xs ${member.state === "valid" ? "text-green-800" : member.state === "invalid" ? "text-red-800" : "text-slate-500"}`}>
      {member.state === "checking" ? "Checking verified student account…" : member.state === "valid" ? `Verified RADES student: ${member.name}` : member.state === "invalid" ? member.message : "Use a verified IBA student account that has already registered in RADES."}
    </p>
  </div>;
}

export function TeamRegistrationForm({ event, profile, preflight }: { event: EventItem; profile: Profile; preflight: RegistrationPreflight | null }) {
  const min = event.team_min ?? 2;
  const max = event.team_max ?? 5;
  const [teamName, setTeamName] = useState("");
  const [phone, setPhone] = useState(profile.phone);
  const [members, setMembers] = useState<Teammate[]>(Array.from({ length: min - 1 }, () => ({ email: "", state: "idle" })));
  const [confirmedSchedule, setConfirmedSchedule] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ registrationId: string; status: string; paymentRequired: boolean; teamSize: number } | null>(null);
  const [lookupResults, setLookupResults] = useState<Record<string, { valid: boolean; name?: string; message?: string }>>({});
  const conflicts = preflight?.scheduleConflicts ?? [];
  const occupied = members.filter(member => member.email.trim()).length + 1;
  const visibleCount = Math.max(min - 1, members.length);
  const isClosed = !preflight?.isOpen;
  const isFull = preflight?.availableSeats === 0;
  const alreadyRegistered = preflight?.alreadyRegistered ?? false;
  const canAdd = members.length < max - 1;
  const start = new Date(event.starts_at);
  const formatRange = (from: string, to: string) => `${new Date(from).toLocaleTimeString("en-PK", { hour: "numeric", minute: "2-digit", ...pkt })}–${new Date(to).toLocaleTimeString("en-PK", { hour: "numeric", minute: "2-digit", ...pkt })} PKT`;
  const complete = useMemo(() => members.slice(0, visibleCount).every(member => {
    const email = member.email.trim().toLowerCase();
    return email && lookupResults[email]?.valid;
  }), [members, visibleCount, lookupResults]);

  const changeMember = useCallback((index: number, value: string) => {
    setMembers(current => current.map((member, item) => item !== index ? member : { email: value, state: value.trim() ? "checking" : "idle", name: undefined, message: undefined }));
  }, []);
  const applyLookup = useCallback((email: string, result: { valid: boolean; name?: string; message?: string }) => {
    setLookupResults(current => ({ ...current, [email]: result }));
    setMembers(current => current.map(member => member.email.trim().toLowerCase() === email ? { ...member, state: result.valid ? "valid" : "invalid", name: result.name, message: result.message } : member));
  }, []);
  const submit = async (submission: React.FormEvent<HTMLFormElement>) => {
    submission.preventDefault(); setError("");
    const selected = members.slice(0, visibleCount).map(member => member.email.trim().toLowerCase());
    if (occupied < min) { setError(`Add at least ${min - 1} teammates. Team size includes you as the leader.`); return; }
    if (selected.some(email => !email)) { setError("Fill each required teammate email."); return; }
    if (new Set(selected).size !== selected.length) { setError("Each teammate email must be unique."); return; }
    if (!complete) { setError("Wait until every teammate has a verified RADES student account."); return; }
    setBusy(true);
    try {
      const response = await fetch(`/api/events/${event.id}/register-team`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ teamName, memberEmails: selected, phone }) });
      const body = await response.json();
      if (!response.ok) { setError(body.error ?? "Team registration could not be completed."); return; }
      setResult(body as { registrationId: string; status: string; paymentRequired: boolean; teamSize: number });
    } catch { setError("Could not reach RADES. Check your connection and try again."); }
    finally { setBusy(false); }
  };

  if (result) return <section aria-live="polite" className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-6 shadow-sm sm:p-8"><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-700"><Check size={30}/></span><h2 className="mt-4 text-center text-2xl font-bold text-green-950">{result.paymentRequired ? "Team place held" : "Team registration confirmed"}</h2><p className="mt-2 text-center text-sm text-green-900">{result.paymentRequired ? "Your team’s places are held for 15 minutes while payment is completed." : `${result.teamSize} team members are registered. Individual digital tickets will be available in each member’s profile.`}</p><div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row"><Link href="/profile" className="inline-flex h-11 items-center justify-center rounded-lg bg-blue-700 px-5 text-sm font-semibold text-white hover:bg-blue-800">View registration history</Link><Link href={`/events/${event.id}`} className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-800 hover:bg-slate-50">Back to event</Link></div></section>;

  return <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-5"><div><h2 className="text-lg font-bold">{event.title}</h2><p className="mt-2 flex items-center gap-2 text-sm text-slate-600"><CalendarDays size={16} className="text-blue-700"/>{start.toLocaleDateString("en-PK", { dateStyle: "medium", ...pkt })} · {formatRange(event.starts_at, event.ends_at)}</p><p className="mt-1 flex items-center gap-2 text-sm text-slate-600"><MapPin size={16} className="text-blue-700"/>{event.venue}</p></div><span className="rounded-full bg-blue-50 px-3 py-1.5 text-sm font-bold text-blue-800">{(event.price_pkr ?? 0) === 0 ? "FREE" : `PKR ${(event.price_pkr ?? 0).toLocaleString()} per member`}</span></div>
    <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800">Team size: {min}–{max} members including the leader · {occupied}/{max} entered</p>
    {!preflight ? <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">Registration status could not be checked. Refresh this page to try again.</p> : alreadyRegistered ? <div role="status" className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-4"><h3 className="font-semibold text-blue-950">You are already registered</h3><p className="mt-1 text-sm text-blue-900">You cannot register again or join another team for this event.</p><Link href="/profile" className="mt-3 inline-block text-sm font-semibold text-blue-800 underline">View profile</Link></div> : conflicts.length > 0 ? <div role="alert" className="mt-5 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-950"><h3 className="font-semibold">Schedule conflict</h3><p className="mt-1 text-sm">You have an overlapping registration: {conflicts.map(conflict => <Link key={conflict.id} href={`/events/${conflict.id}`} className="font-semibold underline">{conflict.title}</Link>)}. Only the leader’s schedule is shown here; teammate conflicts are checked when saving.</p></div> : isFull ? <p role="status" className="mt-5 rounded-xl border border-slate-300 bg-slate-50 p-4 text-sm font-semibold text-slate-700">This event is sold out.</p> : isClosed ? <p role="status" className="mt-5 rounded-xl border border-slate-300 bg-slate-50 p-4 text-sm font-semibold text-slate-700">Registration for this event is closed.</p> : <form onSubmit={submit} className="mt-5 space-y-5">
      <div><label className="block text-sm font-semibold" htmlFor="team-name">Team Name</label><input id="team-name" className={field} value={teamName} onChange={event => setTeamName(event.target.value)} minLength={2} maxLength={60} required placeholder="Code Ninjas"/><p className="mt-1 text-xs text-slate-500">2–60 characters.</p></div>
      <div className="rounded-xl bg-slate-50 p-3"><p className="text-sm font-semibold">Team Leader (You)</p><p className="mt-1 text-sm text-slate-700">{profile.firstName} {profile.lastName} ({profile.email})</p></div>
      <div className="space-y-3"><h3 className="text-sm font-semibold">Teammates</h3>{members.map((member, index) => <TeammateField key={index} eventId={event.id} index={index} member={member} onChange={value => changeMember(index, value)} onLookup={applyLookup} onRemove={() => setMembers(current => current.filter((_, item) => item !== index))} canRemove={members.length > min - 1}/>)}</div>
      {canAdd && <button type="button" onClick={() => setMembers(current => [...current, { email: "", state: "idle" }])} className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"><Plus size={16}/>Add teammate</button>}
      <label className="block text-sm font-semibold">Contact Number for Venue Updates <span className="font-normal text-slate-500">(optional)</span><input className={field} type="tel" inputMode="tel" autoComplete="tel" value={phone} maxLength={20} onChange={event => setPhone(event.target.value)} placeholder="+923001234567"/><span className="mt-1.5 block text-xs font-normal text-slate-500">Use international format, for example +923001234567.</span></label>
      <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-3 text-sm"><input type="checkbox" className="mt-0.5 h-4 w-4 accent-blue-700" checked={confirmedSchedule} onChange={event => setConfirmedSchedule(event.target.checked)} required/><span>I checked the team’s schedule. Teammates must not have another registered event at the same time.</span></label>
      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      <button type="submit" disabled={busy || !preflight || !confirmedSchedule || !complete || members.some(member => member.state === "checking")} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600">{busy ? <><LoaderCircle size={17} className="animate-spin"/>Registering team…</> : (event.price_pkr ?? 0) === 0 ? "Submit Team Registration" : `Continue to payment · PKR ${((event.price_pkr ?? 0) * occupied).toLocaleString()}`}</button>
    </form>}
  </section>;
}
