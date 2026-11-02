import { createClient } from "@/lib/supabase/server";
import { demoEvents, type EventItem } from "@/lib/events/demo";

export async function getPublishedEvents(): Promise<EventItem[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) return demoEvents;
  const supabase = await createClient();
  const { data, error } = await supabase.from("events").select("*, societies(name)").eq("status", "published").order("starts_at");
  if (error || !data) return demoEvents;
  return (data as unknown as Array<EventItem & { societies?: { name: string } | null }>).map((event) => ({ ...event, society: event.societies?.name ?? "IBA Society" }));
}

export async function getEvent(id: string): Promise<EventItem | null> {
  const demo = demoEvents.find((event) => event.id === id);
  if (demo) return demo;
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("events").select("*, societies(name)").eq("id", id).eq("status", "published").maybeSingle();
  return data ? { ...(data as unknown as EventItem & { societies?: { name: string } | null }), society: data.societies?.name ?? "IBA Society" } : null;
}
