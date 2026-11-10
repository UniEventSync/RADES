import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SocietyWorkspaceShell } from "@/components/society-workspace-shell";

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
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const published = events.filter(event => event.status === "published");
  const upcoming = published.filter(event => Date.parse(event.ends_at) >= now);
  const past = events.filter(event => Date.parse(event.ends_at) < now);
  const drafts = events.filter(event => ["draft", "pending_patron", "pending_ossie"].includes(event.status));
  const metrics = [["All events", events.length], ["Published", published.length], ["Upcoming", upcoming.length], ["Past", past.length], ["In review or draft", drafts.length]] as const;
  const categories = [...new Set(events.map(event => event.category))].sort();
  const maxCategoryCount = Math.max(1, ...categories.map(category => events.filter(event => event.category === category).length));
  const metricAccents = ["border-t-blue-600", "border-t-emerald-600", "border-t-cyan-600", "border-t-violet-600", "border-t-amber-500"];
  return <SocietyWorkspaceShell society={society} societies={societies} tab="analytics">
    <p className="text-xs font-bold uppercase tracking-[.16em] text-blue-700">Society analytics</p><h1 className="mt-2 text-3xl font-bold">{society.name} events</h1><p className="mt-2 text-sm text-slate-600">Counts from this society’s event records.</p>
    <section aria-label="Event summary" className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">{metrics.map(([label, count], index) => <article key={label} className={`rounded-xl border border-slate-200 border-t-4 ${metricAccents[index]} bg-white p-5 shadow-sm`}><p className="text-sm text-slate-600">{label}</p><p className="mt-2 text-3xl font-bold tabular-nums">{count}</p></article>)}</section>
    <section className="mt-8 grid gap-6 lg:grid-cols-[.7fr_1.3fr]"><article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-bold">Events by category</h2>{categories.length ? <ul className="mt-5 space-y-4">{categories.map(category => {const count = events.filter(event => event.category === category).length;return <li key={category}><div className="flex justify-between text-sm"><span>{category}</span><span className="font-semibold tabular-nums">{count}</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600" style={{ width: `${Math.max(5, count / maxCategoryCount * 100)}%` }}/></div></li>})}</ul> : <p className="mt-3 text-sm text-slate-500">No event records yet.</p>}</article>
      <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-bold">Recent events</h2>{events.length ? <ul className="mt-4 divide-y divide-slate-100">{events.slice(0, 8).map(event => <li key={event.id} className="flex flex-wrap justify-between gap-2 py-3 text-sm"><Link href={`/admin/events/${event.id}/analytics`} className="font-semibold text-blue-700 hover:underline">{event.title}</Link><span className="text-slate-600">{new Date(event.starts_at).toLocaleDateString("en-PK", { year: "numeric", month: "short", day: "numeric", timeZone: "Asia/Karachi" })} · {event.status.replaceAll("_", " ")}</span></li>)}</ul> : <p className="mt-3 text-sm text-slate-500">No event records yet.</p>}</article>
    </section>
  </SocietyWorkspaceShell>;
}
