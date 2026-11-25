import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EventTicketScanner } from "@/components/event-ticket-scanner";

export default async function EventCheckInPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/sign-in?next=${encodeURIComponent(`/admin/events/${id}/check-in`)}`);
  const { data: event } = await supabase.from("events").select("id,title,society_id,status,ends_at").eq("id", id).maybeSingle();
  if (!event) notFound();
  const [{ data: member }, { data: officeRole }] = await Promise.all([
    supabase.from("society_members").select("id").eq("society_id", event.society_id).eq("user_id", user.id).eq("status", "active").maybeSingle(),
    supabase.from("profiles").select("global_role").eq("id", user.id).in("global_role", ["office", "super_admin"]).maybeSingle(),
  ]);
  if (!member && !officeRole) redirect("/events");
  // eslint-disable-next-line react-hooks/purity -- Request-time scanner availability.
  if (Date.now() > Date.parse(event.ends_at)) redirect(`/admin/events/${id}/analytics`);
  return <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8"><Link href={`/admin/events/${id}/analytics`} className="text-sm font-semibold text-blue-700 hover:underline">← Back to event analytics</Link><header className="mt-5"><p className="text-xs font-bold uppercase tracking-wider text-blue-700">Society event check-in</p><h1 className="mt-2 text-3xl font-bold">Ticket Scanner</h1><p className="mt-2 text-slate-600">Validate a participant’s QR pass for <span className="font-semibold text-slate-900">{event.title}</span>.</p></header><EventTicketScanner eventId={id} eventTitle={event.title}/></main>;
}
