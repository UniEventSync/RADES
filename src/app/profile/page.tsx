import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileEditor } from "@/components/profile-editor";

export default async function ProfilePage() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) redirect("/sign-in?next=/profile");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/profile");

  const [{ data: profile }, { count: adminCount }, { count: patronCount }] = await Promise.all([
    supabase.from("profiles").select("first_name,last_name,email,erp_number,account_type,global_role,phone").eq("id", user.id).maybeSingle(),
    supabase.from("society_members").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "active"),
    supabase.from("society_patrons").select("id", { count: "exact", head: true }).eq("user_id", user.id),
  ]);
  if (!profile) redirect("/");

  const { data: memberships } = await supabase.from("registration_members").select("id,event_id,registration_id,active,is_leader,display_name,created_at").eq("user_id", user.id).order("created_at", { ascending: false });
  const memberRows = memberships ?? [];
  const [{ data: registrations }, { data: ticketRows }, { data: eventRows }, { data: paymentRows }] = memberRows.length ? await Promise.all([
    supabase.from("registrations").select("id,status,team_name,amount_pkr,created_at").in("id", [...new Set(memberRows.map(row => row.registration_id))]),
    supabase.from("event_tickets").select("id,registration_member_id,status").in("registration_member_id", memberRows.map(row => row.id)),
    supabase.from("events").select("id,title,description,starts_at,ends_at,venue,status").in("id", [...new Set(memberRows.map(row => row.event_id))]),
    supabase.from("event_payments").select("registration_id,status").in("registration_id", [...new Set(memberRows.map(row => row.registration_id))]),
  ]) : [{ data: [] }, { data: [] }, { data: [] }, { data: [] }];
  const allTickets = ticketRows ?? [];
  const { data: attendanceRows } = allTickets.length ? await supabase.from("event_attendance").select("ticket_id,checked_in_at").in("ticket_id", allTickets.map(row => row.id)) : { data: [] };
  const registrationsById = new Map((registrations ?? []).map(row => [row.id, row]));
  const paymentsByRegistration = new Map((paymentRows ?? []).map(row => [row.registration_id, row.status]));
  const ticketsByMember = new Map(allTickets.map(row => [row.registration_member_id, row]));
  const eventsById = new Map((eventRows ?? []).map(row => [row.id, row]));
  const attendanceByTicket = new Map((attendanceRows ?? []).map(row => [row.ticket_id, row.checked_in_at]));
  // eslint-disable-next-line react-hooks/purity -- This is a request-time server page, not client render state.
  const now = Date.now();
  const history = memberRows.flatMap(member => {
    const registration = registrationsById.get(member.registration_id);
    const event = eventsById.get(member.event_id);
    if (!registration || !event) return [];
    const ticket = ticketsByMember.get(member.id);
    const checkedInAt = ticket ? attendanceByTicket.get(ticket.id) ?? null : null;
    const status = event.status === "cancelled" ? "Event cancelled" : registration.status === "refunded" ? "Refunded" : registration.status === "cancelled" || !member.active ? "Cancelled" : registration.status === "pending_payment" ? "Payment pending" : checkedInAt ? "Checked in" : Date.parse(event.starts_at) > now ? "Upcoming" : Date.parse(event.ends_at) < now ? "Ended · no check-in" : "Registered";
    const ticketId = ticket?.status === "active" && registration.status === "confirmed" && event.status !== "cancelled" ? ticket.id : null;
    return [{ id: member.id, registrationId: member.registration_id, eventId: event.id, title: event.title, description: event.description, startsAt: event.starts_at, endsAt: event.ends_at, venue: event.venue, status, paymentStatus: paymentsByRegistration.get(member.registration_id) ?? null, checkedInAt, ticketId, calendarEligible: Boolean(ticketId && Date.parse(event.ends_at) > now), feedbackAvailable: Boolean(checkedInAt && registration.status === "confirmed" && event.status !== "cancelled" && Date.parse(event.ends_at) <= now), teamName: registration.team_name, amountPkr: registration.amount_pkr, isLeader: member.is_leader }];
  });
  const tickets = history.filter(item => item.ticketId).map(item => ({ id: item.ticketId!, eventTitle: item.title, startsAt: item.startsAt, venue: item.venue, holder: profile.first_name + " " + profile.last_name }));

  return <ProfileEditor profile={{
    firstName: profile.first_name,
    lastName: profile.last_name,
    email: profile.email,
    erpNumber: profile.erp_number,
    accountType: profile.account_type,
    globalRole: profile.global_role,
    phone: profile.phone ?? "",
    isSocietyAdmin: (adminCount ?? 0) > 0,
    isPatron: (patronCount ?? 0) > 0,
  }} tickets={tickets} history={history} />;
}
