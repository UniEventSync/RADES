import Link from "next/link";
import { ArrowUpRight, CalendarDays, MapPin } from "lucide-react";
import type { EventItem } from "@/lib/events/demo";

export function EventCard({ event, compact = false }: { event: EventItem; compact?: boolean }) {
  const date = new Date(event.starts_at);
  return <Link href={`/events/${event.id}`} className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:shadow-md">
    <div className="relative flex h-36 items-end bg-blue-50 p-5 sm:h-40"><span className="absolute right-5 top-5 rounded-full border border-blue-100 bg-white px-3 py-1 text-xs font-semibold text-blue-800">{event.category}</span><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white"><CalendarDays size={22}/></div></div>
    <div className="flex flex-1 flex-col p-5"><p className="text-xs font-semibold uppercase tracking-wide text-blue-700">{event.society}</p><h3 className="mt-2 text-lg font-bold leading-snug text-slate-950 group-hover:text-blue-800">{event.title}</h3>{!compact && <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{event.description}</p>}<div className="mt-auto space-y-2 pt-5 text-sm text-slate-500"><div className="flex items-center gap-2"><CalendarDays size={16} className="text-slate-400"/>{date.toLocaleDateString("en-PK", { weekday: "short", month: "short", day: "numeric", timeZone: "Asia/Karachi" })} · {date.toLocaleTimeString("en-PK", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Karachi" })} PKT</div><div className="flex items-center gap-2"><MapPin size={16} className="text-slate-400"/>{event.venue}</div></div><span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-blue-700">View details <ArrowUpRight size={15}/></span></div>
  </Link>;
}

