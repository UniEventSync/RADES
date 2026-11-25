import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const ticketValue = z.string().trim().regex(/^RADES-TICKET:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i, "This is not a RADES event ticket.");
type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Context) {
  const { id: eventId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in with an active society admin account to scan tickets." }, { status: 401 });
  let raw: unknown;
  try { raw = await request.json(); } catch { return NextResponse.json({ error: "Scan a ticket or enter its code." }, { status: 400 }); }
  const parsed = z.object({ value: z.string().trim().min(1).max(200) }).safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: "Scan a ticket or enter its code." }, { status: 400 });
  const value = ticketValue.safeParse(parsed.data.value);
  if (!value.success) return NextResponse.json({ error: "This is not a RADES event ticket." }, { status: 400 });
  const { data: event } = await supabase.from("events").select("id,title,society_id,status,starts_at,ends_at").eq("id", eventId).maybeSingle();
  if (!event) return NextResponse.json({ error: "Event not found." }, { status: 404 });
  const { data: admin } = await supabase.from("society_members").select("id").eq("society_id", event.society_id).eq("user_id", user.id).eq("status", "active").maybeSingle();
  const { data: profile } = await supabase.from("profiles").select("global_role").eq("id", user.id).maybeSingle();
  if (!admin && !["office", "super_admin"].includes(profile?.global_role ?? "")) return NextResponse.json({ error: "Only this society’s active admins can validate event tickets." }, { status: 403 });
  const now = Date.now();
  if (now < Date.parse(event.starts_at)) return NextResponse.json({ error: "Check-in opens when the event starts." }, { status: 409 });
  if (now > Date.parse(event.ends_at)) return NextResponse.json({ error: "Check-in is closed because the event has ended." }, { status: 409 });
  const ticketId = value.data.slice("RADES-TICKET:".length);
  const { data: ticket } = await supabase.from("event_tickets").select("id,status,registration_member_id,event_id").eq("id", ticketId).eq("event_id", eventId).maybeSingle();
  if (!ticket) return NextResponse.json({ error: "This ticket does not belong to this event or is not recognized." }, { status: 404 });
  const { data: member } = await supabase.from("registration_members").select("user_id,display_name,email,active,registration_id").eq("id", ticket.registration_member_id).maybeSingle();
  if (!member) return NextResponse.json({ error: "Ticket attendee information is unavailable." }, { status: 404 });
  const { data: actualRegistration } = await supabase.from("registrations").select("status,team_name").eq("id", member.registration_id).maybeSingle();
  const { data: attendance } = await supabase.from("event_attendance").select("checked_in_at").eq("ticket_id", ticket.id).maybeSingle();
  if (ticket.status !== "active" || !member.active || actualRegistration?.status !== "confirmed" || event.status === "cancelled") {
    return NextResponse.json({ error: "This ticket has been cancelled or is no longer active." }, { status: 409 });
  }
  return NextResponse.json({ valid: true, ticketId: ticket.id, attendee: member.display_name, email: member.email, teamName: actualRegistration.team_name, event: event.title, eventStatus: event.status, checkedInAt: attendance?.checked_in_at ?? null });
}
