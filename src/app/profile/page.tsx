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
  }} />;
}
