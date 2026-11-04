import { getPublishedEvents } from "@/lib/events/data";
import { EventCard } from "@/components/event-card";
import { Compass } from "lucide-react";

export default async function EventsPage() {
  const events = await getPublishedEvents();
  return <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8"><div className="mb-8"><p className="text-sm font-semibold text-blue-700">Explore campus life</p><h1 className="mt-2 text-4xl font-bold tracking-tight">Events</h1><p className="mt-3 text-slate-500">{events.length} upcoming {events.length === 1 ? "event" : "events"} from the IBA community.</p></div>{events.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{events.map(event=><EventCard key={event.id} event={event}/>)}</div> : <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center"><Compass className="mx-auto text-blue-700" size={28}/><h2 className="mt-4 text-lg font-bold">No events to show</h2><p className="mt-2 text-sm text-slate-500">Approved society events will appear here.</p></div>}</div>;
}
