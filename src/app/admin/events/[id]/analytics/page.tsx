import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { UnpublishEventButton } from "@/components/unpublish-event-button";
import { RetryEventRefundsButton } from "@/components/retry-event-refunds-button";

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

  const admin = createAdminClient();
  const reportQueries = await Promise.all([
    admin.from("registrations").select("id,status,member_count,payment_expires_at").eq("event_id", id),
    admin.from("registration_members").select("id,registration_id").eq("event_id", id),
    admin.from("event_tickets").select("id,registration_member_id,status").eq("event_id", id),
    admin.from("event_attendance").select("ticket_id,checked_in_at").eq("event_id", id),
    admin.from("event_feedback").select("rating,created_at").eq("event_id", id),
    admin.from("event_refund_transactions").select("id,registration_id,status,amount_pkr,created_at,note").eq("event_id", id).order("created_at", { ascending: false }),
  ]);
  const [{ data: registrations }, { data: memberRows }, { data: tickets }, { data: attendance }, { data: feedback }, { data: refunds }] = reportQueries;
  const reportUnavailable = reportQueries.some(result => Boolean(result.error));
  const paymentIds = (registrations ?? []).map(registration => registration.id);
  const paymentResult = paymentIds.length ? await admin.from("event_payments").select("registration_id,amount_pkr,status").in("registration_id", paymentIds) : { data: [], error: null };
  const payments = paymentResult.data;
  const reportDataUnavailable = reportUnavailable || Boolean(paymentResult.error);
  // eslint-disable-next-line react-hooks/purity -- Request-time phase and hold calculations.
  const now = Date.now();
  const activeHolds = (registrations ?? []).filter(row => row.status === "pending_payment" && row.payment_expires_at && Date.parse(row.payment_expires_at) > now);
  const heldParticipants = activeHolds.reduce((total, row) => total + row.member_count, 0);
  const registrationIdsByMember = new Map((memberRows ?? []).map(member => [member.id, member.registration_id]));
  const activeTickets = (tickets ?? []).filter(ticket => ticket.status === "active");
  const issuedRegistrationIds = new Set(activeTickets.map(ticket => registrationIdsByMember.get(ticket.registration_member_id)).filter((registrationId): registrationId is string => Boolean(registrationId)));
  const registeredParticipants = activeTickets.length + heldParticipants;
  const checkedIn = attendance?.length ?? 0;
  const noShows = Math.max(0, activeTickets.length - checkedIn);
  const attendanceRate = activeTickets.length ? Math.min(100, checkedIn / activeTickets.length * 100) : 0;
  const grossRevenue = (payments ?? []).filter(payment => ["paid", "refund_pending", "refunded"].includes(payment.status)).reduce((total, payment) => total + payment.amount_pkr, 0);
  const refundedRevenue = (payments ?? []).filter(payment => payment.status === "refunded").reduce((total, payment) => total + payment.amount_pkr, 0);
  const netRevenue = grossRevenue - refundedRevenue;
  const pendingRefundAmount = (payments ?? []).filter(payment => payment.status === "refund_pending").reduce((total, payment) => total + payment.amount_pkr, 0);
  const refundRows = refunds ?? [];
  const actualRefundRows = refundRows.filter(refund => refund.registration_id !== null);
  const averageRating = feedback?.length ? feedback.reduce((sum, row) => sum + row.rating, 0) / feedback.length : null;
  const start = Date.parse(event.starts_at);
  const end = Date.parse(event.ends_at);
  const phase = event.status === "cancelled" ? "Cancelled" : now < start ? "Upcoming" : now <= end ? "In progress" : "Past";
  const societyName = Array.isArray(event.societies) ? event.societies[0]?.name ?? "Society" : "Society";
  const rateLabel = activeTickets.length ? `${attendanceRate.toFixed(1)}%` : "—";
  const metrics = [
    { label: "Registered participants", value: reportDataUnavailable ? "—" : registeredParticipants.toLocaleString(), help: reportDataUnavailable ? "Reporting data could not be loaded" : `${issuedRegistrationIds.size} confirmed registration${issuedRegistrationIds.size === 1 ? "" : "s"}${heldParticipants ? ` · ${heldParticipants} held seats` : ""}`, accent: "border-t-blue-600" },
    { label: "Total check-ins", value: reportDataUnavailable ? "—" : checkedIn.toLocaleString(), help: reportDataUnavailable ? "Reporting data could not be loaded" : "Unique validated tickets", accent: "border-t-cyan-600" },
    { label: "Attendance", value: reportDataUnavailable ? "—" : rateLabel, help: reportDataUnavailable ? "Reporting data could not be loaded" : activeTickets.length ? `${checkedIn} checked in · ${noShows} no-shows` : "No confirmed ticket holders", accent: "border-t-violet-600" },
    { label: "Ticket revenue", value: reportDataUnavailable ? "—" : event.price_pkr === 0 ? "Free" : `PKR ${netRevenue.toLocaleString()}`, help: reportDataUnavailable ? "Reporting data could not be loaded" : event.price_pkr === 0 ? "No ticket charges" : `PKR ${grossRevenue.toLocaleString()} captured · PKR ${refundedRevenue.toLocaleString()} refunded`, accent: "border-t-emerald-600" },
    { label: "Capacity", value: reportDataUnavailable ? "—" : event.capacity ? `${registeredParticipants.toLocaleString()} / ${event.capacity.toLocaleString()}` : `${registeredParticipants.toLocaleString()} · Unlimited`, help: reportDataUnavailable ? "Reporting data could not be loaded" : event.capacity ? `${Math.min(100, registeredParticipants / event.capacity * 100).toFixed(1)}% of available places` : "No capacity limit", accent: "border-t-amber-500" },
    { label: "Feedback", value: reportDataUnavailable ? "—" : averageRating === null ? "—" : `${averageRating.toFixed(1)} / 5`, help: reportDataUnavailable ? "Reporting data could not be loaded" : `${feedback?.length ?? 0} response${feedback?.length === 1 ? "" : "s"}`, accent: "border-t-fuchsia-600" },
  ];
  const csvCell = (input: unknown) => {
    const value = String(input ?? "");
    const safeValue = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
    return `"${safeValue.replaceAll('"', '""')}"`;
  };
  const csvRows: unknown[][] = [
    ["Metric", "Value"], ["Event", event.title], ["Society", societyName], ["Status", event.status], ["Phase", phase],
    ["Venue", event.venue], ["Starts (PKT)", new Date(event.starts_at).toLocaleString("en-PK", { timeZone: "Asia/Karachi" })], ["Ends (PKT)", new Date(event.ends_at).toLocaleString("en-PK", { timeZone: "Asia/Karachi" })],
    ["Registration type", event.registration_type], ["Registered participants", registeredParticipants], ["Issued tickets", tickets?.length ?? 0], ["Check-ins", checkedIn], ["No-shows", noShows], ["Attendance percent", activeTickets.length ? attendanceRate.toFixed(1) : "Not yet measurable"],
    ["Capacity", event.capacity ?? "Unlimited"], ["Ticket price PKR", event.price_pkr], ["Gross captured PKR", grossRevenue], ["Refunded PKR", refundedRevenue], ["Refund pending PKR", pendingRefundAmount], ["Net retained PKR", netRevenue],
    ["Feedback responses", feedback?.length ?? 0], ["Average feedback rating", averageRating === null ? "No responses" : averageRating.toFixed(2)], ["Refund records", refundRows.length],
    ["Cancellation reason", event.cancellation_reason ?? ""],
  ];
  const csv = csvRows.map(row => row.map(csvCell).join(",")).join("\r\n");
  const noShowWidth = activeTickets.length ? 100 - attendanceRate : 0;

  return <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
    <Link href={office ? "/dashboard" : `/admin/analytics?society=${event.society_id}`} className="text-sm font-semibold text-blue-700 hover:underline">{office ? "← OSSIE Overview" : "← Society Analytics"}</Link>
    <header className="mt-5 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wider text-blue-700">{office ? "OSSIE · All societies" : "Society event analytics"}</p><h1 className="mt-2 text-3xl font-bold">{event.title}</h1><p className="mt-2 text-slate-600">{societyName} · {phase} · {event.status.replaceAll("_", " ")}</p></div>
      <div className="flex flex-wrap items-center gap-3"><Link href={`/admin/events/${id}/check-in`} className="rounded-lg bg-blue-700 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-800">Open ticket scanner</Link><a href={`data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`} download="event-analytics.csv" className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-50">Export CSV</a>{event.status === "published" && <><span className="px-1 py-2 text-sm font-medium text-slate-600">Public event</span><UnpublishEventButton eventId={id}/></>}{event.status !== "cancelled" && (office || now < start) && <Link href={`/admin/events/${id}/cancel`} className="rounded-lg border border-red-300 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50">{office ? "Force cancel" : "Cancel event"}</Link>}</div>
    </header>
    {reportDataUnavailable && <p role="status" className="mt-5 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">Some report data could not be loaded. Confirm the database setup and your reporting access, then refresh this page.</p>}
    <section aria-label="Event report metrics" className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{metrics.map(metric => <article key={metric.label} className={`rounded-xl border border-t-4 ${metric.accent} border-slate-200 bg-white p-5 shadow-sm`}><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{metric.label}</p><p className="mt-2 text-2xl font-bold tabular-nums">{metric.value}</p><p className="mt-1 text-xs text-slate-600">{metric.help}</p></article>)}</section>
    <section className="mt-6 grid gap-5 lg:grid-cols-2"><article className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="font-bold">Event details</h2><dl className="mt-4 grid grid-cols-2 gap-y-3 text-sm"><dt className="text-slate-500">Category</dt><dd>{event.category}</dd><dt className="text-slate-500">Venue</dt><dd>{event.venue}</dd><dt className="text-slate-500">Starts</dt><dd>{new Date(event.starts_at).toLocaleString("en-PK", { timeZone: "Asia/Karachi" })} PKT</dd><dt className="text-slate-500">Ends</dt><dd>{new Date(event.ends_at).toLocaleString("en-PK", { timeZone: "Asia/Karachi" })} PKT</dd></dl></article>
      <article className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="font-bold">Attendance and refunds</h2><p className="mt-2 text-sm leading-6 text-slate-600">Attendance is based on unique ticket check-ins. No-shows are active tickets without a recorded check-in.</p><div className="mt-5 space-y-3" aria-label={`${checkedIn} of ${activeTickets.length} active ticket holders checked in`}><div><div className="mb-1 flex justify-between text-xs"><span>Checked in</span><span>{checkedIn} · {rateLabel}</span></div><div className="flex h-3 overflow-hidden rounded-full bg-slate-100"><div className="bg-emerald-600" style={{ width: `${attendanceRate}%` }}/><div className="bg-slate-300" style={{ width: `${noShowWidth}%` }}/></div></div><div className="flex justify-between text-xs text-slate-600"><span>No-shows</span><span>{noShows}</span></div></div>
        <div className="mt-5 border-t border-slate-200 pt-4"><h3 className="text-sm font-semibold">Refund status</h3>{refundRows.length ? <ul className="mt-3 space-y-2 text-sm">{refundRows.map(refund => <li key={refund.id} className="flex flex-wrap justify-between gap-2 rounded-lg bg-slate-50 p-3"><span>{refund.registration_id ? "Registration refund" : "Legacy record"}</span><span className="font-medium">PKR {refund.amount_pkr.toLocaleString()} · {refund.status.replaceAll("_", " ")}</span></li>)}</ul> : <p className="mt-2 text-sm text-slate-600">No refund records.</p>}{actualRefundRows.some(refund => ["pending", "processing", "failed"].includes(refund.status)) && event.status === "cancelled" && <RetryEventRefundsButton eventId={id}/>}</div>
        {event.cancellation_reason && <p className="mt-3 text-sm"><strong>Cancellation reason:</strong> {event.cancellation_reason}</p>}
      </article></section>
  </main>;
}
