import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SocietyWorkspaceShell } from "@/components/society-workspace-shell";

const statuses = { draft: "Draft", pending_patron: "Awaiting patron approval", pending_ossie: "Awaiting OSSIE approval", published: "Published", rejected: "Rejected", cancelled: "Cancelled" };
type Status = keyof typeof statuses;

export default async function SocietyEventsPage({ searchParams }: { searchParams: Promise<{ society?: string; status?: string; date?: string }> }) {
  const { society: requestedSociety, status: requestedStatus, date: requestedDate } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/admin/events");
  const { data: rows } = await supabase.from("society_members").select("society_id,societies(id,name)").eq("user_id", user.id).eq("status", "active");
  const societies = (rows ?? []).flatMap(row => row.societies ?? []);
  if (!societies.length) redirect("/events");
  const society = societies.find(item => item.id === requestedSociety) ?? societies[0];
  let query = supabase.from("events").select("id,title,starts_at,ends_at,capacity,status,rejection_reason,registration_type").eq("society_id", society.id).order("starts_at", { ascending: true });
  if (requestedStatus && requestedStatus in statuses) query = query.eq("status", requestedStatus as Status);
  const requestedDateTimestamp = requestedDate ? Date.parse(`${requestedDate}T00:00:00Z`) : Number.NaN;
  const date = requestedDate && /^\d{4}-\d{2}-\d{2}$/.test(requestedDate) && Number.isFinite(requestedDateTimestamp) && new Date(requestedDateTimestamp).toISOString().slice(0, 10) === requestedDate ? requestedDate : "";
  if (date) {
    const from = Date.parse(`${date}T00:00:00+05:00`);
    const until = from + 24 * 60 * 60 * 1000;
    query = query.gte("starts_at", new Date(from).toISOString()).lt("starts_at", new Date(until).toISOString());
  }
  const { data: events } = await query;
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  return <SocietyWorkspaceShell society={society} societies={societies} tab="events">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-blue-700">Society workspace</p><h1 className="mt-2 text-3xl font-bold">Events</h1><p className="mt-1 text-sm text-slate-500">Manage this society’s event drafts, reviews, and published events.</p></div><div className="flex flex-wrap gap-3"><form method="get" className="flex flex-wrap items-end gap-2"><input type="hidden" name="society" value={society.id}/><label className="block text-xs font-semibold">Status<select id="status-filter" name="status" defaultValue={requestedStatus ?? "all"} className="mt-1 h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm"><option value="all">All statuses</option>{Object.entries(statuses).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="block text-xs font-semibold">Event date<input type="date" name="date" defaultValue={date} className="mt-1 h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm"/></label><button className="h-11 rounded-xl border border-slate-300 px-3 text-sm font-semibold">Apply</button><Link href={`/admin/events?society=${society.id}`} className="inline-flex h-11 items-center rounded-xl px-3 text-sm font-semibold text-slate-600 hover:bg-slate-100">Clear</Link></form><Link href={`/admin/events/new?society=${society.id}`} className="inline-flex h-11 items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700">+ Create event</Link></div></div>
    <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="hidden grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-3 border-b border-slate-200 p-4 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:grid"><span>Event</span><span>Date</span><span>Type</span><span>Status</span><span>Actions</span></div>{events?.length ? events.map(event => {const phase = event.status === "published" ? (Date.parse(event.ends_at) < now ? "Finished" : "Upcoming") : statuses[event.status as Status] ?? event.status.replaceAll("_", " "); return <article key={event.id} className="grid gap-2 border-b border-slate-100 p-4 text-sm last:border-0 sm:grid-cols-[2fr_1fr_1fr_1fr_1fr] sm:items-center"><div className="font-semibold">{event.title}{event.status === "rejected" && event.rejection_reason && <p className="mt-1 text-xs font-normal text-red-700">Reason: {event.rejection_reason}</p>}</div><span className="text-slate-600">{new Date(event.starts_at).toLocaleDateString("en-PK", { dateStyle: "medium", timeZone: "Asia/Karachi" })}</span><span className="text-slate-600">{event.registration_type === "team" ? "Team" : "Solo"} · {event.capacity ?? "Unlimited"}</span><span className="w-fit rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{phase}</span><span className="flex gap-3"><Link href={`/admin/events/${event.id}/analytics`} className="font-semibold text-blue-700 hover:underline">Analytics</Link>{["draft", "pending_patron", "pending_ossie", "rejected", "published"].includes(event.status) && <Link href={`/admin/events/${event.id}/edit`} className="font-semibold text-blue-700 hover:underline">Edit</Link>}</span></article>}) : <p className="p-10 text-center text-sm text-slate-500">No events match this filter.</p>}</div>
  </SocietyWorkspaceShell>;
}
