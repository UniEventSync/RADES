import { createClient } from "@/lib/supabase/server";
import { demoEvents, type EventItem } from "@/lib/events/demo";

export type EventQueryResult = { events: EventItem[]; error: string | null; demo: boolean };
const configured = () => Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY));

export async function getUpcomingPublishedEvents(): Promise<EventQueryResult> {
  if (!configured()) return { events: demoEvents.filter(event => new Date(event.ends_at) > new Date()), error: null, demo: true };
  const supabase = await createClient();
  const { data, error } = await supabase.from("events").select("*, societies(name)").eq("status", "published").gt("ends_at", new Date().toISOString()).order("starts_at");
  if (error) return { events: [], error: "Events could not be loaded. Please try again later.", demo: false };
  const events = (data ?? []) as unknown as Array<EventItem & { societies?: { name: string } | null }>;
  return { events: events.map(event => ({ ...event, society: event.societies?.name ?? "IBA Society" })), error: null, demo: false };
}

export async function getEvent(id: string): Promise<EventItem | null> {
  if (!configured()) return demoEvents.find(event => event.id === id) ?? null;
  const supabase = await createClient();
  const { data } = await supabase.from("events").select("*, societies(name)").eq("id", id).eq("status", "published").gt("ends_at", new Date().toISOString()).maybeSingle();
  if (!data) return null;
  const event = data as unknown as EventItem & { societies?: { name: string } | null };
  return { ...event, society: event.societies?.name ?? "IBA Society" };
}

export async function getPublishedEvents(): Promise<EventItem[]> {
  return (await getUpcomingPublishedEvents()).events;
}
