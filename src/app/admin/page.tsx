import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SocietyWorkspaceShell } from "@/components/society-workspace-shell";

const statusNames: Record<string, string> = { draft: "Draft", pending_patron: "Awaiting patron", pending_ossie: "Awaiting OSSIE", published: "Published", rejected: "Rejected", cancelled: "Cancelled" };
export default async function SocietyDashboard({ searchParams }: { searchParams: Promise<{ society?: string }> }) {
  const { society: requestedSociety } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/admin");
  const { data: rows } = await supabase.from("society_members").select("society_id,societies(id,name)").eq("user_id", user.id).eq("status", "active");
  const societies = (rows ?? []).flatMap(row => row.societies ?? []);
  if (!societies.length) redirect("/events");
  const society = societies.find(item => item.id === requestedSociety) ?? societies[0];
  const { data: events } = await supabase.from("events").select("id,title,starts_at,ends_at,status").eq("society_id", society.id).order("starts_at", { ascending: true });
  const records = events ?? [];
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const upcoming = records.filter(event => event.status === "published" && Date.parse(event.ends_at) >= now);
  const awaitingReview = records.filter(event => ["pending_patron", "pending_ossie"].includes(event.status));
  const nextEvents = upcoming.slice(0, 5);
  return <SocietyWorkspaceShell society={society} societies={societies} tab="dashboard">
    <p className="text-xs font-bold uppercase tracking-[.16em] text-blue-700">Society workspace</p>
    <h1 className="mt-2 text-3xl font-bold">{society.name} dashboard</h1>
    <p className="mt-2 text-sm text-slate-600">A quick view of your society’s event schedule and review queue.</p>
    <section aria-label="Society event summary" className="mt-6 grid gap-4 sm:grid-cols-3">
      {[["All events", records.length], ["Upcoming", upcoming.length], ["Awaiting review", awaitingReview.length]].map(([label, value]) => <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-3xl font-bold tabular-nums">{value}</p></article>)}
    </section>
    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-xl font-bold">Upcoming events</h2><p className="mt-1 text-sm text-slate-500">Published events that have not finished.</p></div><Link href={`/admin/events?society=${society.id}`} className="text-sm font-semibold text-blue-700 hover:underline">All events →</Link></div>
      {nextEvents.length ? <ul className="mt-4 divide-y divide-slate-100">{nextEvents.map(event => <li key={event.id} className="flex flex-wrap items-center justify-between gap-3 py-4"><div><Link href={`/admin/events/${event.id}/analytics`} className="font-semibold text-blue-700 hover:underline">{event.title}</Link><p className="mt-1 text-sm text-slate-500">{new Date(event.starts_at).toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Karachi" })} PKT</p></div><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">{statusNames[event.status] ?? event.status}</span></li>)}</ul> : <p className="mt-5 rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">No upcoming published events. Visit Events to manage drafts or create a new event.</p>}
    </section>
    <div className="mt-5 flex flex-wrap gap-3"><Link href={`/admin/events/new?society=${society.id}`} className="inline-flex h-11 items-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700">Create event</Link><Link href={`/admin/members?society=${society.id}`} className="inline-flex h-11 items-center rounded-xl border border-slate-300 px-4 text-sm font-semibold">View society panel</Link></div>
  </SocietyWorkspaceShell>;
}
