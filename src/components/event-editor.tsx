"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { EventItem } from "@/lib/events/demo";
import { eventCategories, eventVenues, subcategoriesByCategory, type EventCategory } from "@/lib/events/taxonomy";
import { ImageUpload } from "@/components/image-upload";
import { useToast } from "@/components/toast-provider";
import { STRIPE_MAX_REGISTRATION_PKR, STRIPE_MIN_REGISTRATION_PKR } from "@/lib/payments/constants";

type Society = { id: string; name: string };
type InitialEvent = EventItem & { society_id: string; rejection_reason?: string | null };

const input = "mt-1.5 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-700 focus:ring-4 focus:ring-blue-100";
const localTime = (iso: string) => {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Karachi", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(iso));
  const get = (key: string) => parts.find(item => item.type === key)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
};

const asIso = (value: string) => new Date(`${value}:00+05:00`).toISOString();

function initialVenues(event?: InitialEvent) {
  const saved = event?.venues?.filter(value => eventVenues.includes(value as (typeof eventVenues)[number])) ?? [];
  if (saved.length) {
    if (saved.length === 1 && saved[0] === "Student Center" && event?.venue && event.venue !== "Student Center" && eventVenues.includes(event.venue as (typeof eventVenues)[number])) {
      return [event.venue];
    }
    return saved;
  }
  if (event?.venue && eventVenues.includes(event.venue as (typeof eventVenues)[number])) return [event.venue];
  return ["Student Center"];
}

export function EventEditor({ societies, initial, societyId }: { societies: Society[]; initial?: InitialEvent; societyId?: string }) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [category, setCategory] = useState<EventCategory>((initial?.category as EventCategory) ?? "Technology");
  const [subcategory, setSubcategory] = useState(initial?.subcategory && subcategoriesByCategory[(initial.category as EventCategory) ?? "Technology"].includes(initial.subcategory)
    ? initial.subcategory
    : subcategoriesByCategory[(initial?.category as EventCategory) ?? "Technology"][0]);
  const [description, setDescription] = useState(initial?.description ?? "");
  const [venues, setVenues] = useState<string[]>(() => initialVenues(initial));
  const [venue, setVenue] = useState(initial?.venue ?? "Student Center");
  const [startsAt, setStartsAt] = useState(initial ? localTime(initial.starts_at) : "");
  const [endsAt, setEndsAt] = useState(initial ? localTime(initial.ends_at) : "");
  const [capacity, setCapacity] = useState(initial?.capacity ? String(initial.capacity) : "");
  const [price, setPrice] = useState(String(initial?.price_pkr ?? 0));
  const [type, setType] = useState<"solo" | "team">(initial?.registration_type ?? "solo");
  const [teamMin, setTeamMin] = useState(initial?.team_min ?? 2);
  const [teamMax, setTeamMax] = useState(initial?.team_max ?? 5);
  const [selectedSociety, setSelectedSociety] = useState(societyId ?? initial?.society_id ?? societies[0]?.id ?? "");
  const [imageUrl, setImageUrl] = useState(initial?.image_url ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const toast = useToast();
  useEffect(() => { if (error) toast(error, "error"); }, [error, toast]);

  const isNew = !initial;
  const pending = initial?.status === "pending_patron" || initial?.status === "pending_ossie";
  const rejected = initial?.status === "rejected";
  const published = initial?.status === "published";
  const minStart = localTime(new Date().toISOString());

  const toggleVenue = (selectedVenue: string) => {
    const next = venues.includes(selectedVenue) ? venues.filter(value => value !== selectedVenue) : [...venues, selectedVenue];
    setVenues(next);
    if (next.length) setVenue(next.join(", "));
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    const formData = new FormData(event.currentTarget);
    const image_url = String(formData.get("image_url") ?? "").trim();
    const start = Date.parse(asIso(startsAt));
    const end = Date.parse(asIso(endsAt));
    if (start <= Date.now()) { setError("An event must start in the future."); return; }
    if (!(end > start)) { setError("End time must be after start time."); return; }
    if (!subcategoriesByCategory[category].includes(subcategory)) { setError("Choose a subcategory for the selected event category."); return; }
    if (venues.length < 1 || venues.length > 9) { setError("Choose between one and nine venues."); return; }
    if (price === "" || !Number.isInteger(Number(price)) || Number(price) < 0) { setError("Ticket price must be a whole number of PKR 0 or more."); return; }
    if (Number(price) > STRIPE_MAX_REGISTRATION_PKR) { setError(`Paid event registration cannot exceed PKR ${STRIPE_MAX_REGISTRATION_PKR.toLocaleString()}.`); return; }
    if (Number(price) > 0 && Number(price) < STRIPE_MIN_REGISTRATION_PKR) { setError(`Paid event registration must be at least PKR ${STRIPE_MIN_REGISTRATION_PKR} total. Use 0 for a free event.`); return; }
    if (capacity && (!Number.isInteger(Number(capacity)) || Number(capacity) <= 0)) { setError("Capacity must be a positive whole number or empty for unlimited."); return; }
    if (type === "team" && (!Number.isInteger(teamMin) || !Number.isInteger(teamMax) || teamMin < 2 || teamMax < teamMin || teamMax > 50)) { setError("Team size must be between 2 and 50 members, including the leader."); return; }

    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const status = pending || published ? "pending_patron" : submitter?.value === "submit" ? "pending_patron" : "draft";
    setBusy(true);
    try {
      const payload = { societyId: selectedSociety, title, category, subcategory, description, venue, venues, startsAt: asIso(startsAt), endsAt: asIso(endsAt), capacity: capacity ? Number(capacity) : null, pricePkr: Number(price), registrationType: type, teamMin, teamMax, status, image_url };
      const response = await fetch(isNew ? "/api/events" : `/api/events/${initial.id}`, { method: isNew ? "POST" : "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const body = await response.json();
      if (!response.ok) { setError(body.error ?? "Could not save this event."); return; }
      const notices = body.participantNotifications as { sent: number; failed: number } | undefined;
      if (notices?.sent || notices?.failed) toast(`${notices.sent} participant update emails sent${notices.failed ? `; ${notices.failed} failed` : ""}.`, notices.failed ? "error" : "success");
      router.push(`/admin?society=${selectedSociety}`);
      router.refresh();
    } catch {
      setError("Could not reach RADES. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return <form onSubmit={submit} className="mt-5">
    <input type="hidden" name="image_url" value={imageUrl}/>
    <div className="grid gap-5 lg:grid-cols-2">
      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <h2 className="text-lg font-bold">Basic Details</h2>
        {societies.length > 1 && <label className="block text-sm font-semibold">Society<select className={input} value={selectedSociety} onChange={event => setSelectedSociety(event.target.value)}>{societies.map(society => <option key={society.id} value={society.id}>{society.name}</option>)}</select></label>}
        <label className="block text-sm font-semibold">Event Title<input className={input} value={title} onChange={event => setTitle(event.target.value)} minLength={3} maxLength={150} required/></label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-semibold">Category<select className={input} value={category} onChange={event => { const next = event.target.value as EventCategory; setCategory(next); if (!subcategoriesByCategory[next].includes(subcategory)) setSubcategory(subcategoriesByCategory[next][0]); }}>{eventCategories.map(value => <option key={value}>{value}</option>)}</select></label>
          <label className="block text-sm font-semibold">Subcategory<select className={input} value={subcategory} onChange={event => setSubcategory(event.target.value)}>{subcategoriesByCategory[category].map(value => <option key={value}>{value}</option>)}</select></label>
        </div>
        <label className="block text-sm font-semibold">Event Description<textarea className="mt-1.5 min-h-36 w-full rounded-xl border border-slate-300 p-3 text-sm" value={description} onChange={event => setDescription(event.target.value)} minLength={10} maxLength={8000} required/></label>
        <ImageUpload kind="event-images" entityId={selectedSociety} value={imageUrl} onChange={setImageUrl}/>
      </section>

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <h2 className="text-lg font-bold">Logistics &amp; Configuration</h2>
        <fieldset>
          <legend className="text-sm font-semibold">Venue(s) <span className="font-normal">(choose 1–9)</span></legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">{eventVenues.map(value => <label key={value} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm"><input type="checkbox" checked={venues.includes(value)} onChange={() => toggleVenue(value)}/>{value}</label>)}</div>
          <p className="mt-2 text-xs font-normal text-slate-500">Selected venue names appear on the event details and registration screens.</p>
        </fieldset>
        <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-semibold">Start Date and Time (PKT)<input className={input} type="datetime-local" min={minStart} value={startsAt} onChange={event => setStartsAt(event.target.value)} required/></label><label className="block text-sm font-semibold">End Date and Time (PKT)<input className={input} type="datetime-local" min={startsAt || minStart} value={endsAt} onChange={event => setEndsAt(event.target.value)} required/></label></div>
        <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-semibold">Capacity Limit <span className="font-normal">(blank = unlimited)</span><input className={input} type="number" min="1" step="1" value={capacity} onChange={event => setCapacity(event.target.value)}/></label><label className="block text-sm font-semibold">Registration Price (PKR)<input className={input} type="number" min="0" max={STRIPE_MAX_REGISTRATION_PKR} step="1" value={price} onChange={event => setPrice(event.target.value)} required/><span className="mt-1 block text-xs font-normal text-slate-500">Use 0 for a free event. Paid events can be at most PKR {STRIPE_MAX_REGISTRATION_PKR.toLocaleString()}. This is the total charge for both solo and team registration; team size does not multiply it.</span></label></div>
        <fieldset><legend className="text-sm font-semibold">Participation Mode</legend><div className="mt-3 flex flex-wrap gap-5"><label className="flex items-center gap-2 text-sm"><input type="radio" name="mode" value="solo" checked={type === "solo"} onChange={() => setType("solo")}/>Solo</label><label className="flex items-center gap-2 text-sm"><input type="radio" name="mode" value="team" checked={type === "team"} onChange={() => setType("team")}/>Team</label></div></fieldset>
        {type === "team" && <div className="grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2"><p className="text-sm text-slate-700 sm:col-span-2">Team size includes the student who registers the team.</p><label className="block text-sm font-semibold">Minimum team size<input className={input} type="number" min="2" max="50" step="1" value={teamMin} onChange={event => setTeamMin(Number(event.target.value))} required/></label><label className="block text-sm font-semibold">Maximum team size<input className={input} type="number" min={teamMin} max="50" step="1" value={teamMax} onChange={event => setTeamMax(Number(event.target.value))} required/></label></div>}
      </section>
    </div>
    {rejected && initial?.rejection_reason && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><strong>Rejection reason:</strong> {initial.rejection_reason}</p>}
    <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between"><Link href={`/admin?society=${selectedSociety}`} className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 px-5 text-sm font-semibold">Cancel</Link><div className="flex flex-col gap-3 sm:flex-row">{(isNew || initial?.status === "draft") && <button disabled={busy} name="intent" value="draft" className="h-11 rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold">{isNew ? "Save Draft" : "Save changes"}</button>}{!isNew && initial?.status === "draft" ? <button disabled={busy} name="intent" value="submit" className="h-11 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white disabled:opacity-60">Submit for approval</button> : <button disabled={busy} name="intent" value="submit" className="h-11 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white disabled:opacity-60">{published || pending ? "Save changes" : rejected ? "Resubmit for approval" : "Submit for approval"}</button>}</div></div>
  </form>;
}
