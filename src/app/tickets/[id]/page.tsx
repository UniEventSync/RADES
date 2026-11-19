import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/server";
import { TicketActions } from "@/components/ticket-actions";

export default async function TicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/sign-in?next=${encodeURIComponent(`/tickets/${id}`)}`);
  const { data: ticket } = await supabase.from("event_tickets").select("id,status,registration_member_id,event_id,created_at").eq("id", id).maybeSingle();
  if (!ticket) notFound();
  const { data: member } = await supabase.from("registration_members").select("user_id,display_name,email,active,registration_id").eq("id", ticket.registration_member_id).eq("user_id", user.id).maybeSingle();
  if (!member) notFound();
  const [{ data: event }, { data: registration }] = await Promise.all([
    supabase.from("events").select("title,venue,starts_at,ends_at,status").eq("id", ticket.event_id).maybeSingle(),
    supabase.from("registrations").select("status,team_name,registration_type").eq("id", member.registration_id).maybeSingle(),
  ]);
  if (!event || !registration) notFound();
  const active = ticket.status === "active" && member.active && registration.status === "confirmed" && event.status !== "cancelled";
  const qrDataUrl = active ? await QRCode.toDataURL(`RADES-TICKET:${ticket.id}`, { errorCorrectionLevel: "H", margin: 2, width: 320, color: { dark: "#0f172a", light: "#ffffff" } }) : null;
  const pkt = { timeZone: "Asia/Karachi" } as const;
  return <main className="mx-auto max-w-3xl px-5 py-8 sm:py-10 print:max-w-none print:p-0">
    <Link href="/profile" className="text-sm font-semibold text-blue-700 hover:underline print:hidden">← Back to My Profile</Link>
    <article className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm print:mt-0 print:rounded-none print:shadow-none">
      <header className="flex items-start justify-between gap-4 bg-slate-950 px-5 py-5 text-white sm:px-8"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-blue-200">RADES Official Event Pass</p><h1 className="mt-2 text-2xl font-bold">{event.title}</h1></div><span className="rounded-lg border border-white/30 px-3 py-2 font-mono text-xs">#{ticket.id.slice(0, 8).toUpperCase()}</span></header>
      {!active ? <div role="status" className="m-5 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-950 sm:m-8"><h2 className="font-bold">This ticket is no longer valid</h2><p className="mt-1 text-sm">It may have been cancelled, refunded, checked out, or linked to a cancelled event.</p></div> : <div className="grid gap-6 p-5 sm:grid-cols-[1fr_250px] sm:p-8"><div className="space-y-5"><div><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Ticket holder</p><p className="mt-1 text-lg font-bold">{member.display_name}</p><p className="text-sm text-slate-600">{member.email}</p></div>{registration.team_name&&<div><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Team</p><p className="mt-1 font-semibold">{registration.team_name}</p></div>}<div><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Date and time</p><p className="mt-1 font-semibold">{new Date(event.starts_at).toLocaleDateString("en-PK", { dateStyle: "full", ...pkt })}</p><p className="text-sm text-slate-600">{new Date(event.starts_at).toLocaleTimeString("en-PK", { hour: "numeric", minute: "2-digit", ...pkt })}–{new Date(event.ends_at).toLocaleTimeString("en-PK", { hour: "numeric", minute: "2-digit", ...pkt })} PKT</p></div><div><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Venue</p><p className="mt-1 font-semibold">{event.venue}</p></div><p className="rounded-lg bg-green-50 px-3 py-2 text-sm font-semibold text-green-800">Confirmed · Show this QR code at check-in.</p></div><div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-4"><Image src={qrDataUrl!} alt={`Check-in QR ticket for ${event.title}, ticket ${ticket.id.slice(0, 8)}`} width={240} height={240} unoptimized className="h-60 w-60"/><p className="mt-2 font-mono text-xs text-slate-500">{ticket.id}</p></div></div>}
      {active&&qrDataUrl&&<footer className="border-t border-slate-200 px-5 py-4 sm:px-8"><TicketActions qrDataUrl={qrDataUrl} ticketId={ticket.id}/></footer>}
    </article>
  </main>;
}
