import Link from "next/link";
import { ArrowUpRight, CalendarDays, MapPin } from "lucide-react";
import Image from "next/image";
import type { EventItem } from "@/lib/events/demo";

export function EventCard({ event, compact = false }: { event: EventItem; compact?: boolean }) {
  const date = new Date(event.starts_at);
  return <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:shadow-md">
    <div className="relative flex h-36 items-end bg-blue-50 p-5 sm:h-40" aria-label={`${event.title} event artwork`}>{event.image_url&&<Image src={event.image_url} alt={`${event.title} banner`} fill unoptimized className="object-cover"/>}<span className="absolute right-5 top-5 z-10 rounded-full border border-blue-100 bg-white px-3 py-1 text-xs font-semibold text-blue-800">{event.category}{event.subcategory ? ` · ${event.subcategory}` : ""}</span>{!event.image_url&&<div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white"><CalendarDays size={22}/></div>}</div>
    <div className="flex flex-1 flex-col p-5"><p className="text-xs font-semibold uppercase tracking-wide text-blue-700">{event.society_slug ? <Link href={`/societies/${event.society_slug}`} className="hover:underline">{event.society}</Link> : event.society}</p><h2 className="mt-2 text-lg font-bold leading-snug text-slate-950">{event.title}</h2>{!compact&&<p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{event.description}</p>}<div className="mt-auto space-y-2 pt-5 text-sm text-slate-500"><div className="flex items-center gap-2"><CalendarDays size={16}/>{date.toLocaleDateString("en-PK",{weekday:"short",month:"short",day:"numeric",timeZone:"Asia/Karachi"})} · {date.toLocaleTimeString("en-PK",{hour:"numeric",minute:"2-digit",timeZone:"Asia/Karachi"})} PKT</div><div className="flex items-center gap-2"><MapPin size={16}/>{event.venue}</div><div className="text-xs font-semibold text-slate-700">{(event.price_pkr??0)===0?"FREE":`PKR ${event.price_pkr}`} · {event.capacity?`Capacity ${event.capacity}`:"Unlimited capacity"}</div></div><Link href={`/events/${event.id}`} className="mt-5 inline-flex h-10 items-center justify-center gap-1 rounded-lg bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700">View Details <ArrowUpRight size={15}/></Link></div>
  </article>;
}
