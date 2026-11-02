import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { HomeDashboard, type Society, type ReviewEvent } from "@/components/home-dashboard";

export default async function HomePage() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) redirect("/sign-in?next=/home");
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) redirect("/sign-in?next=/home");
  const { data: profile } = await supabase.from("profiles").select("first_name,last_name,account_type,global_role").eq("id",user.id).maybeSingle();
  if (!profile) redirect("/sign-in");
  const [membershipResult, patronResult, eventResult, societyResult] = await Promise.all([
    supabase.from("society_members").select("society_id,user_id,role,status,societies(id,name,slug)").eq("user_id",user.id).eq("status","active"),
    supabase.from("society_patrons").select("society_id,user_id,societies(id,name,slug)").eq("user_id",user.id),
    supabase.from("events").select("*, societies(name)").order("starts_at",{ascending:true}),
    supabase.from("societies").select("id,name,slug")
  ]);
  type SocietyRef = Pick<Society, "id" | "name" | "slug">;
  type MembershipRow = { role: string; societies: SocietyRef | null };
  type PatronRow = { societies: SocietyRef | null };
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
    for (const society of (societyResult.data ?? []) as SocietyRef[]) ensureSociety(society);
  }
  const events = ((eventResult.data ?? []) as unknown as EventRow[]).map(event => ({ ...event, society: event.societies?.name ?? "IBA Society" }));
  return <HomeDashboard user={{id:user.id,email:user.email??"",firstName:profile.first_name,lastName:profile.last_name,accountType:profile.account_type,globalRole:profile.global_role}} initialSocieties={societies} initialEvents={events} />;
}
