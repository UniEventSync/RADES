import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { HomeDashboard, type Society, type ReviewEvent } from "@/components/home-dashboard";

export default async function DashboardPage() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) redirect("/sign-in?next=/dashboard");
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) redirect("/sign-in?next=/dashboard");
  const { data: profile } = await supabase.from("profiles").select("first_name,last_name,account_type,global_role").eq("id",user.id).maybeSingle();
  if (!profile) redirect("/");
  const { data: societyAdminAccess } = await supabase.from("society_members").select("id").eq("user_id",user.id).eq("status","active").eq("role","panelist").limit(1).maybeSingle();
  if (societyAdminAccess) redirect("/admin");
  const [membershipResult, patronResult, eventResult, societyResult] = await Promise.all([
    supabase.from("society_members").select("society_id,user_id,role,status,societies(id,name,slug,description,logo_url)").eq("user_id",user.id).eq("status","active"),
    supabase.from("society_patrons").select("society_id,user_id,societies(id,name,slug,description,logo_url)").eq("user_id",user.id),
    supabase.from("events").select("*, societies(name)").order("starts_at",{ascending:true}),
    supabase.from("societies").select("id,name,slug,description,logo_url,society_members(id,user_id,role,status,profiles!society_members_user_id_fkey(email,first_name,last_name,avatar_url)),society_patrons(id,user_id,profiles!society_patrons_user_id_fkey(email,first_name,last_name,avatar_url))")
  ]);
  type SocietyRef = Pick<Society, "id" | "name" | "slug" | "description" | "logo_url">;
  type MembershipRow = { role: string; societies: SocietyRef | null };
  type PatronRow = { society_id: string; societies: SocietyRef | null };
  type EventRow = ReviewEvent & { societies: { name: string } | null };
  const societies: Society[] = [];
  const ensureSociety = (society: SocietyRef) => {
    let item = societies.find(candidate => candidate.id === society.id);
    if (!item) { item = { ...society, society_members: [], society_patrons: [] }; societies.push(item); }
    return item;
  };
  for (const row of (membershipResult.data ?? []) as unknown as MembershipRow[]) {
    if (row.societies) ensureSociety(row.societies).society_members?.push({ user_id: user.id, status: "active", role: row.role });
  }
  for (const row of (patronResult.data ?? []) as unknown as PatronRow[]) {
    if (row.societies) ensureSociety(row.societies).society_patrons?.push({ user_id: user.id });
  }
  if (profile.global_role === "office" || profile.global_role === "super_admin") {
    for (const society of (societyResult.data ?? []) as unknown as Society[]) {
      const item = ensureSociety(society);
      item.society_members = society.society_members ?? [];
      item.society_patrons = society.society_patrons ?? [];
    }
  }
  const events = ((eventResult.data ?? []) as unknown as EventRow[]).map(event => ({ ...event, society: event.societies?.name ?? "IBA Society" }));
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  let officeCheckIns: number | null = null;
  let officeCapacity: string | null = null;
  if (profile.global_role === "office" || profile.global_role === "super_admin") {
    try {
      const admin = createAdminClient();
      const { data: attendance, error: attendanceError } = await admin.from("event_attendance").select("ticket_id");
      const capacityEvents = events.filter(event => event.status === "published" && Date.parse(event.ends_at) >= now && event.capacity !== null);
      const eventIds = capacityEvents.map(event => event.id);
      const { data: registrations, error: registrationsError } = eventIds.length
        ? await admin.from("registrations").select("event_id,status,member_count,payment_expires_at").in("event_id", eventIds)
        : { data: [], error: null };
      if (!attendanceError && !registrationsError) {
        officeCheckIns = attendance?.length ?? 0;
        const reservedSeats = (registrations ?? []).filter(row => row.status === "confirmed" || (row.status === "pending_payment" && row.payment_expires_at && Date.parse(row.payment_expires_at) > now)).reduce((sum, row) => sum + row.member_count, 0);
        const totalCapacity = capacityEvents.reduce((sum, event) => sum + (event.capacity ?? 0), 0);
        officeCapacity = `${reservedSeats.toLocaleString()} / ${totalCapacity.toLocaleString()}`;
      }
    } catch {
      // Keep the report honest when analytics tables are unavailable or not configured.
    }
  }
  const patronSocietyIds = (patronResult.data ?? []).map(row => row.society_id);
  return <HomeDashboard user={{id:user.id,email:user.email??"",firstName:profile.first_name,lastName:profile.last_name,accountType:profile.account_type,globalRole:profile.global_role}} initialSocieties={societies} initialEvents={events} now={now} patronSocietyIds={patronSocietyIds} officeCheckIns={officeCheckIns} officeCapacity={officeCapacity} />;
}
