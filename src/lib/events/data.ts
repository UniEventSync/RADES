import { createClient } from "@/lib/supabase/server";
import { type EventItem } from "@/lib/events/demo";

export type EventQueryResult = { events: EventItem[]; error: string | null; demo: boolean };
const configured = () => Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY));

export async function getUpcomingPublishedEvents(): Promise<EventQueryResult> {
  if (!configured()) return { events: [], error: null, demo: false };
  const supabase = await createClient();
  const { data, error } = await supabase.from("events").select("id,society_id,title,description,category,venue,starts_at,ends_at,status,capacity,price_pkr,registration_type,team_min,team_max,image_url,societies(name,slug,logo_url)").eq("is_public", true).neq("status", "cancelled").gt("ends_at", new Date().toISOString()).order("starts_at");
  if (error) return { events: [], error: "Events could not be loaded. Please try again later.", demo: false };
  const events = (data ?? []) as unknown as Array<EventItem & { societies?: { name: string; slug: string; logo_url: string | null } | null }>;
  return { events: events.map(event => ({ ...event, society: event.societies?.name ?? "IBA Society", society_slug: event.societies?.slug, society_logo_url: event.societies?.logo_url })), error: null, demo: false };
}

export async function getEvent(id: string): Promise<EventItem | null> {
  if (!configured()) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("events").select("id,society_id,title,description,category,venue,starts_at,ends_at,status,capacity,price_pkr,registration_type,team_min,team_max,image_url,societies(name,slug,logo_url)").eq("id", id).eq("is_public", true).neq("status", "cancelled").maybeSingle();
  if (!data) return null;
  const event = data as unknown as EventItem & { societies?: { name: string; slug: string; logo_url: string | null } | null };
  if (new Date(event.ends_at) <= new Date()) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: profile } = await supabase.from("profiles").select("account_type,global_role").eq("id", user.id).maybeSingle();
    if (!profile || (profile.account_type === "student" && !["office", "super_admin"].includes(profile.global_role))) return null;
  }
  return { ...event, society: event.societies?.name ?? "IBA Society", society_slug: event.societies?.slug, society_logo_url: event.societies?.logo_url };
}

export async function getPublishedEvents(): Promise<EventItem[]> {
  return (await getUpcomingPublishedEvents()).events;
}
