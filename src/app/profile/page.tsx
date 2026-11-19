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

  const { data: memberships } = await supabase.from("registration_members").select("id,event_id,registration_id,active").eq("user_id", user.id).eq("active", true);
  const memberRows = memberships ?? [];
  const [{ data: registrations }, { data: ticketRows }] = memberRows.length ? await Promise.all([
    supabase.from("registrations").select("id,status").in("id", memberRows.map(row => row.registration_id)).eq("status", "confirmed"),
    supabase.from("event_tickets").select("id,registration_member_id,status").in("registration_member_id", memberRows.map(row => row.id)).eq("status", "active"),
  ]) : [{ data: [] }, { data: [] }];
  const confirmedIds = new Set((registrations ?? []).map(row => row.id));
  const activeMemberRows = memberRows.filter(row => confirmedIds.has(row.registration_id));
  const [{ data: ticketEvents }, { data: ticketMembers }] = activeMemberRows.length ? await Promise.all([
    supabase.from("events").select("id,title,starts_at,venue,status").in("id", [...new Set(activeMemberRows.map(row => row.event_id))]),
    supabase.from("registration_members").select("id,display_name").in("id", activeMemberRows.map(row => row.id)),
  ]) : [{ data: [] }, { data: [] }];
  const activeEvents = new Map((ticketEvents ?? []).filter(event => event.status !== "cancelled").map(event => [event.id, event]));
  const displayNames = new Map((ticketMembers ?? []).map(row => [row.id, row.display_name]));
  const tickets = (ticketRows ?? []).flatMap(ticket => {
    const member = activeMemberRows.find(row => row.id === ticket.registration_member_id);
    const event = member ? activeEvents.get(member.event_id) : undefined;
    return member && event ? [{ id: ticket.id, eventTitle: event.title, startsAt: event.starts_at, venue: event.venue, holder: displayNames.get(member.id) ?? profile.first_name + " " + profile.last_name }] : [];
  });

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
  }} tickets={tickets} />;
}
