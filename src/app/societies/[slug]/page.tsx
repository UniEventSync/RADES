import Link from "next/link";
import { notFound } from "next/navigation";
import { EventCard } from "@/components/event-card";
import { SocietyProfileEditor } from "@/components/society-profile-editor";
import { createClient } from "@/lib/supabase/server";
import type { EventItem } from "@/lib/events/demo";
import { eventVenueLabel } from "@/lib/events/taxonomy";
import Image from "next/image";

type Society = { id: string; name: string; slug: string; description: string; logo_url: string | null; contact_email: string | null; facebook_url:string|null; linkedin_url:string|null; instagram_url:string|null };

export default async function SocietyProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  let { data: society, error: societyError } = await supabase.from("societies").select("id,name,slug,description,logo_url,contact_email,facebook_url,linkedin_url,instagram_url").eq("slug", slug).eq("is_active", true).maybeSingle();
  if (societyError) {
    // Fall back to the original public profile columns if optional social fields
    // have not been added to a linked database yet.
    const fallback = await supabase.from("societies").select("id,name,slug,description,logo_url,contact_email").eq("slug", slug).eq("is_active", true).maybeSingle();
    societyError = fallback.error;
    society = fallback.data as typeof society;
  }
  if (societyError) return <main className="mx-auto max-w-3xl px-5 py-12 sm:px-8"><h1 className="text-2xl font-bold">Society profile unavailable</h1><p className="mt-3 text-sm leading-6 text-slate-600">The public profile could not be loaded. Please try again later.</p><Link href="/societies" className="mt-5 inline-block font-semibold text-blue-700 hover:underline">Back to Explore Societies</Link></main>;
  if (!society) notFound();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: membership } = user ? await supabase.from("society_members").select("id").eq("society_id", society.id).eq("user_id", user.id).eq("status", "active").maybeSingle() : { data: null };
  const { data } = await supabase.from("events").select("id,society_id,title,description,category,subcategory,venue,venues,starts_at,ends_at,status,capacity,price_pkr,registration_type,image_url,societies(name,slug,logo_url)").eq("society_id", society.id).eq("is_public", true).neq("status", "cancelled").gt("ends_at", new Date().toISOString()).order("starts_at");
  const events = ((data ?? []) as unknown as Array<EventItem & { societies: { name: string; slug: string; logo_url:string|null } | null }>).map(event => ({ ...event, venue: eventVenueLabel(event.venues, event.venue), society: event.societies?.name ?? society.name, society_slug: event.societies?.slug ?? society.slug, society_logo_url:event.societies?.logo_url }));
  const item = society as Society;
  const initials = item.name.split(/\s+/).slice(0, 2).map(part => part.charAt(0)).join("").toUpperCase();
  return <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
    <Link href="/events" className="text-sm font-semibold text-blue-700 hover:underline">← Explore Events</Link>
    <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        {item.logo_url?<Image src={item.logo_url} alt={`${item.name} logo`} width={96} height={96} unoptimized className="h-24 w-24 shrink-0 rounded-2xl object-cover"/>:<div role="img" aria-label={`${item.name} logo`} className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-3xl font-bold text-blue-800">{initials}</div>}
        <div className="min-w-0"><p className="text-xs font-bold uppercase tracking-[.16em] text-blue-700">IBA Karachi Society</p><h1 className="break-long-words mt-2 text-3xl font-bold tracking-tight">{item.name}</h1><p className="mt-3 max-w-3xl leading-7 text-slate-600">{item.description || "Learn more about this IBA society and its upcoming events."}</p>{item.contact_email && <p className="mt-3 text-sm text-slate-600">Email: <a className="font-semibold text-blue-700 hover:underline" href={`mailto:${item.contact_email}`}>{item.contact_email}</a></p>}<div className="mt-3 flex gap-4 text-sm font-semibold">{item.facebook_url&&<a className="text-blue-700 hover:underline" href={item.facebook_url} target="_blank" rel="noreferrer">Facebook</a>}{item.linkedin_url&&<a className="text-blue-700 hover:underline" href={item.linkedin_url} target="_blank" rel="noreferrer">LinkedIn</a>}{item.instagram_url&&<a className="text-blue-700 hover:underline" href={item.instagram_url} target="_blank" rel="noreferrer">Instagram</a>}</div>{membership && <SocietyProfileEditor societyId={item.id} fields={{ description: item.description ?? "", contact_email: item.contact_email ?? "",logo_url:item.logo_url??"",facebook_url:item.facebook_url??"",linkedin_url:item.linkedin_url??"",instagram_url:item.instagram_url??"" }} />}</div>
      </div>
    </section>
    <section className="mt-9"><div className="mb-5"><p className="text-xs font-bold uppercase tracking-[.16em] text-blue-700">What’s happening</p><h2 className="mt-2 text-2xl font-bold">Published Events by {item.name}</h2></div>{events.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{events.map(event => <EventCard key={event.id} event={event} />)}</div> : <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-sm text-slate-500">This society has no upcoming published events.</div>}</section>
  </main>;
}
