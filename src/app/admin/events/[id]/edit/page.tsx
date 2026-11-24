import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { EventEditor } from "@/components/event-editor";
import { ThemeToggle } from "@/components/theme-toggle";
import { createClient } from "@/lib/supabase/server";
import type { EventItem } from "@/lib/events/demo";

export default async function EditEventPage({params}:{params:Promise<{id:string}>}) {
  const {id}=await params;const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect(`/sign-in?next=/admin/events/${id}/edit`);
  const {data:event}=await supabase.from("events").select("id,society_id,title,description,category,subcategory,venue,venues,starts_at,ends_at,status,capacity,price_pkr,registration_type,team_min,team_max,image_url,rejection_reason").eq("id",id).maybeSingle();if(!event)notFound();
  const {data:member}=await supabase.from("society_members").select("society_id").eq("society_id",event.society_id).eq("user_id",user.id).eq("status","active").maybeSingle();if(!member)redirect("/events");
  if(!["draft","pending_patron","pending_ossie","rejected","published"].includes(event.status))redirect(`/admin?society=${event.society_id}`);
  const {data:members}=await supabase.from("society_members").select("society_id,societies(id,name)").eq("user_id",user.id).eq("status","active");
  const societies=(members??[]).flatMap(row=>row.societies??[]);
  return <main className="mx-auto max-w-7xl px-5 py-7 sm:px-8"><div className="flex items-center justify-between"><Link href={`/admin?society=${event.society_id}`} className="text-sm font-semibold text-blue-700">Cancel / Exit</Link><ThemeToggle/></div><p className="mt-5 text-xs font-bold uppercase tracking-[.16em] text-blue-700">RADES Admin</p><h1 className="mt-2 text-3xl font-bold">Edit Event</h1><EventEditor societies={societies} initial={event as EventItem & {society_id:string;rejection_reason:string|null}}/></main>;
}
