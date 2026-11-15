import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UnpublishEventButton } from "@/components/unpublish-event-button";

export default async function EventAnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/sign-in?next=/admin/events/${id}/analytics`);
  const [{ data: event }, { data: profile }] = await Promise.all([
    supabase.from("events").select("id,title,society_id,description,category,venue,starts_at,ends_at,status,capacity,price_pkr,registration_type,cancellation_reason,societies(name)").eq("id", id).maybeSingle(),
    supabase.from("profiles").select("global_role").eq("id", user.id).maybeSingle(),
  ]);
  if (!event) notFound();
  const { data: membership } = await supabase.from("society_members").select("id").eq("society_id", event.society_id).eq("user_id", user.id).eq("status", "active").maybeSingle();
  const office = profile?.global_role === "office" || profile?.global_role === "super_admin";
  if (!office && !membership) redirect("/events");

  const { data: refunds } = await supabase.from("event_refund_transactions").select("id,status,amount_pkr,created_at").eq("event_id", id).order("created_at", { ascending: false });
  const start = Date.parse(event.starts_at);
  const end = Date.parse(event.ends_at);
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const phase = event.status === "cancelled" ? "Cancelled" : now < start ? "Upcoming" : now <= end ? "In progress" : "Past";
  const societyName = Array.isArray(event.societies) ? event.societies[0]?.name ?? "Society" : "Society";
  const metrics = [["Registrations", "Not available"], ["Check-ins", "Not available"], ["Attendance", "Not available"], ["Ticket revenue", "Not available"], ["Capacity", event.capacity ?? "Unlimited"], ["Price", event.price_pkr === 0 ? "Free" : `PKR ${event.price_pkr}`]] as const;
  const csvCell = (value: unknown) => `"${String(value).replaceAll('"', '""')}"`;
  const csv = [
    ["Metric", "Value"], ["Event", event.title], ["Society", societyName], ["Status", event.status], ["Phase", phase],
    ["Venue", event.venue], ["Starts", new Date(event.starts_at).toISOString()], ["Ends", new Date(event.ends_at).toISOString()],
    ["Capacity", event.capacity ?? "Unlimited"], ["Ticket price PKR", event.price_pkr], ["Refund records", refunds?.length ?? 0],
    ...metrics, ["Note", "Registration, check-in, and payment data are not implemented; refund entries are zero-value demo records."],
  ].map(row => row.map(csvCell).join(",")).join("\n");

  return <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
    <Link href={office ? "/dashboard" : `/admin/analytics?society=${event.society_id}`} className="text-sm font-semibold text-blue-700 hover:underline">{office ? "← OSSIE Overview" : "← Society Analytics"}</Link>
    <header className="mt-5 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wider text-blue-700">{office ? "OSSIE · All societies" : "Society event analytics"}</p><h1 className="mt-2 text-3xl font-bold">{event.title}</h1><p className="mt-2 text-slate-600">{societyName} · {phase} · {event.status.replaceAll("_", " ")}</p></div>
      <div className="flex flex-wrap items-center gap-3"><a href={`data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`} download="event-analytics.csv" className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-50">Export CSV</a>{event.status === "published" && <><span className="px-1 py-2 text-sm font-medium text-slate-600">Public event</span><UnpublishEventButton eventId={id}/></>}{event.status !== "cancelled" && (office || now < start) && <Link href={`/admin/events/${id}/cancel`} className="rounded-lg border border-red-300 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50">{office ? "Force cancel" : "Cancel event"}</Link>}</div>
    </header>
    <section className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{metrics.map(([label, value], index) => <article key={label} className={`rounded-xl border border-t-4 ${["border-t-blue-600", "border-t-cyan-600", "border-t-violet-600", "border-t-emerald-600", "border-t-amber-500", "border-t-slate-500"][index]} border-slate-200 bg-white p-5 shadow-sm`}><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold tabular-nums">{value}</p></article>)}</section>
    <section className="mt-6 grid gap-5 lg:grid-cols-2"><article className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="font-bold">Event details</h2><dl className="mt-4 grid grid-cols-2 gap-y-3 text-sm"><dt className="text-slate-500">Category</dt><dd>{event.category}</dd><dt className="text-slate-500">Venue</dt><dd>{event.venue}</dd><dt className="text-slate-500">Starts</dt><dd>{new Date(event.starts_at).toLocaleString("en-PK", { timeZone: "Asia/Karachi" })} PKT</dd><dt className="text-slate-500">Ends</dt><dd>{new Date(event.ends_at).toLocaleString("en-PK", { timeZone: "Asia/Karachi" })} PKT</dd></dl></article>
      <article className="rounded-xl border border-amber-200 bg-amber-50 p-5"><h2 className="font-bold">Attendance and refund data</h2><p className="mt-2 text-sm leading-6 text-slate-700">Registration, check-in, and payment records are not implemented; cancellation writes a zero-value demo refund placeholder only.</p><div aria-label="Attendance chart unavailable" className="mt-4 space-y-2"><div className="h-3 rounded-full border border-dashed border-amber-400"/><p className="text-xs text-slate-600">Attendance rate unavailable</p></div>{refunds?.length ? <ul className="mt-3 space-y-2 text-sm">{refunds.map(refund => <li key={refund.id}>Dummy refund record · PKR {refund.amount_pkr} · {refund.status}</li>)}</ul> : null}{event.cancellation_reason && <p className="mt-3 text-sm"><strong>Cancellation reason:</strong> {event.cancellation_reason}</p>}</article></section>
  </main>;
}
