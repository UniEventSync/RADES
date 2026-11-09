import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, Clock3, MapPin, UsersRound } from "lucide-react";
import Image from "next/image";
import { getEvent } from "@/lib/events/data";
import { createClient } from "@/lib/supabase/server";

const pkt = { timeZone: "Asia/Karachi" } as const;
export default async function EventDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const event = await getEvent(id); if (!event) notFound();
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = user ? await supabase.from("profiles").select("account_type").eq("id", user.id).maybeSingle() : { data: null };
  const start = new Date(event.starts_at); const end = new Date(event.ends_at); const student = profile?.account_type === "student";
  return <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
    <Link href="/events" className="text-sm font-semibold text-blue-700 hover:underline">← Back to Events</Link>
    <div className="mt-5 grid items-start gap-6 lg:grid-cols-[1.2fr_.8fr]">
      <div className="relative min-h-64 overflow-hidden rounded-2xl border border-slate-200 bg-blue-50 p-6 sm:min-h-[420px] sm:p-10" aria-label="Event banner">{event.image_url&&<Image src={event.image_url} alt={`${event.title} banner`} fill unoptimized className="object-cover"/>}{event.society_logo_url&&<Image src={event.society_logo_url} alt={`${event.society} logo`} width={72} height={72} unoptimized className="absolute left-6 top-6 z-10 h-16 w-16 rounded-xl bg-white object-contain p-1"/>}<div className="relative z-10 flex h-full min-h-52 items-end"><span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-blue-800">{event.category}</span></div></div>
      <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><p className="text-xs font-bold uppercase tracking-wider text-blue-700">Hosted by {event.society_slug ? <Link href={`/societies/${event.society_slug}`} className="hover:underline">{event.society}</Link> : event.society}</p><h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{event.title}</h1><div className="mt-6 space-y-4 text-sm text-slate-600"><div className="flex gap-3"><CalendarDays className="shrink-0 text-blue-700" size={18}/><span>{start.toLocaleDateString("en-PK",{weekday:"long",year:"numeric",month:"long",day:"numeric",...pkt})}</span></div><div className="flex gap-3"><Clock3 className="shrink-0 text-blue-700" size={18}/><span>{start.toLocaleTimeString("en-PK",{hour:"numeric",minute:"2-digit",...pkt})} – {end.toLocaleTimeString("en-PK",{hour:"numeric",minute:"2-digit",...pkt})} PKT</span></div><div className="flex gap-3"><MapPin className="shrink-0 text-blue-700" size={18}/><span>{event.venue}</span></div><div className="flex gap-3"><UsersRound className="shrink-0 text-blue-700" size={18}/><span>{event.capacity?`Capacity ${event.capacity}`:"Unlimited capacity"}</span></div></div><div className="mt-5 border-t border-slate-100 pt-4 text-sm font-semibold">{(event.price_pkr??0)===0?"FREE":`PKR ${event.price_pkr}`}</div>{student?<button disabled title="Not available yet" className="mt-5 h-11 w-full cursor-not-allowed rounded-xl bg-slate-300 text-sm font-semibold text-slate-600">Register ({event.registration_type??"solo"})</button>:<p className="mt-5 text-sm text-slate-600">Only students can register for events.</p>}<button disabled title="Not available yet" className="mt-3 h-11 w-full cursor-not-allowed rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-500">+ Google Calendar</button></aside>
    </div>
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8"><h2 className="text-xl font-bold">About Event</h2><p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-600">{event.description}</p></section>
  </div>;
}
