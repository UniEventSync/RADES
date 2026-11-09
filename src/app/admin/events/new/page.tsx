import Link from "next/link";
import { redirect } from "next/navigation";
import { EventEditor } from "@/components/event-editor";
import { ThemeToggle } from "@/components/theme-toggle";
import { createClient } from "@/lib/supabase/server";

export default async function NewEventPage({searchParams}:{searchParams:Promise<{society?:string}>}) {
  const {society:requested}=await searchParams;const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/sign-in?next=/admin/events/new");
  const {data:members}=await supabase.from("society_members").select("society_id,societies(id,name)").eq("user_id",user.id).eq("status","active");
  const societies=(members??[]).flatMap(row=>row.societies??[]);if(!societies.length)redirect("/events");
  const selected=societies.find(item=>item.id===requested)??societies[0];
  return <main className="mx-auto max-w-7xl px-5 py-7 sm:px-8"><div className="flex items-center justify-between"><Link href={`/admin?society=${selected.id}`} className="text-sm font-semibold text-blue-700">Cancel / Exit</Link><ThemeToggle/></div><p className="mt-5 text-xs font-bold uppercase tracking-[.16em] text-blue-700">RADES Admin | {selected.name}</p><h1 className="mt-2 text-3xl font-bold">Create New Event</h1><EventEditor societies={societies} societyId={selected.id}/></main>;
}
