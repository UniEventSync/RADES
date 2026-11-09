import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ThemeToggle } from "@/components/theme-toggle";

type EventRow = { id: string; title: string; starts_at: string; ends_at: string; status: string; category: string };
export default async function SocietyAnalyticsPage({ searchParams }: { searchParams: Promise<{ society?: string }> }) {
  const { society: requestedSociety } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/admin/analytics");
  const { data: rows } = await supabase.from("society_members").select("society_id,societies(id,name)").eq("user_id", user.id).eq("status", "active");
  const societies = (rows ?? []).flatMap(row => row.societies ?? []);
  if (!societies.length) redirect("/events");
  const society = societies.find(item => item.id === requestedSociety) ?? societies[0];
  const { data } = await supabase.from("events").select("id,title,starts_at,ends_at,status,category").eq("society_id", society.id).order("starts_at", { ascending: false });
  const events = (data ?? []) as EventRow[];
  // The report is rendered on the server for each request.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const published = events.filter(event => event.status === "published");
  const upcoming = published.filter(event => Date.parse(event.ends_at) >= now);
  const past = events.filter(event => Date.parse(event.ends_at) < now);
  const drafts = events.filter(event => ["draft", "pending_patron", "pending_ossie"].includes(event.status));
  const metrics = [["All events", events.length], ["Published", published.length], ["Upcoming", upcoming.length], ["Past", past.length], ["In review or draft", drafts.length]] as const;
  const categories = [...new Set(events.map(event => event.category))].sort();
  return <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
    <Link href={`/admin?society=${society.id}`} className="text-sm font-semibold text-blue-700 hover:underline">← Society workspace</Link>
    <header className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-blue-700">Society analytics</p><h1 className="mt-2 text-3xl font-bold">{society.name} events</h1><p className="mt-2 text-sm text-slate-600">Counts from the society event records.</p></div><div className="flex items-center gap-2"><ThemeToggle/>{societies.length > 1 && <form method="get"><label className="sr-only" htmlFor="analytics-society">Society</label><select id="analytics-society" name="society" defaultValue={society.id} className="h-10 rounded-lg border border-slate-300 bg-white px-3">{societies.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select><button className="ml-2 h-10 rounded-lg border border-slate-300 px-3 text-sm font-semibold">View</button></form>}</div></header>
    <section aria-label="Event summary" className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">{metrics.map(([label, count]) => <article key={label} className="rounded-xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-600">{label}</p><p className="mt-2 text-3xl font-bold">{count}</p></article>)}</section>
    <section className="mt-8 grid gap-6 lg:grid-cols-[.7fr_1.3fr]"><article className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="font-bold">Events by category</h2>{categories.length ? <ul className="mt-4 space-y-3">{categories.map(category => <li key={category} className="flex justify-between text-sm"><span>{category}</span><span className="font-semibold">{events.filter(event => event.category === category).length}</span></li>)}</ul> : <p className="mt-3 text-sm text-slate-500">No event records yet.</p>}</article><article className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="font-bold">Recent events</h2>{events.length ? <ul className="mt-4 divide-y divide-slate-100">{events.slice(0, 8).map(event => <li key={event.id} className="flex flex-wrap justify-between gap-2 py-3 text-sm"><Link href={`/admin/events/${event.id}/analytics`} className="font-semibold text-blue-700 hover:underline">{event.title}</Link><span className="text-slate-600">{new Date(event.starts_at).toLocaleDateString("en-PK", { year: "numeric", month: "short", day: "numeric", timeZone: "Asia/Karachi" })} · {event.status.replaceAll("_", " ")}</span></li>)}</ul> : <p className="mt-3 text-sm text-slate-500">No event records yet.</p>}</article></section>
  </main>;
}
