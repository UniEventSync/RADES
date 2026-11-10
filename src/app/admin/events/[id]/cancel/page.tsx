import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EventCancellationForm } from "@/components/event-cancellation-form";

export default async function CancelEventPage({params}:{params:Promise<{id:string}>}) {
 const {id}=await params;const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect(`/sign-in?next=/admin/events/${id}/cancel`);
 const [{data:event},{data:profile}]=await Promise.all([supabase.from("events").select("id,title,society_id,status,starts_at,price_pkr,societies(name)").eq("id",id).maybeSingle(),supabase.from("profiles").select("global_role").eq("id",user.id).maybeSingle()]);if(!event)notFound();if(event.status==="cancelled")redirect(`/admin/events/${id}/analytics`);
 const {data:membership}=await supabase.from("society_members").select("id").eq("society_id",event.society_id).eq("user_id",user.id).eq("status","active").maybeSingle();const office=profile?.global_role==="office"||profile?.global_role==="super_admin";if(!office&&!membership)redirect("/events");
 // eslint-disable-next-line react-hooks/purity
 const now=Date.now();if(!office&&Date.parse(event.starts_at)<=now)redirect(`/admin/events/${id}/analytics`);
 const societyName=Array.isArray(event.societies)?event.societies[0]?.name:"Society";
 return <main className="mx-auto max-w-3xl px-5 py-8 sm:px-8"><Link href={`/admin/events/${id}/analytics`} className="text-sm font-semibold text-blue-700">← Event analytics</Link><p className="mt-5 text-xs font-bold uppercase tracking-wider text-red-700">{office?"OSSIE event control":"Society event management"}</p><h1 className="mt-2 text-3xl font-bold">Cancel event</h1><section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Confirm event cancellation</p><h2 className="mt-2 text-xl font-bold">{event.title}</h2><p className="mt-1 text-sm text-slate-600">{societyName} · {event.status.replaceAll("_"," ")}</p><dl className="mt-4 grid grid-cols-2 gap-3 text-sm"><dt className="text-slate-500">Participants</dt><dd>Unavailable</dd><dt className="text-slate-500">Ticket amount</dt><dd>{event.price_pkr===0?"Free":"PKR amount unavailable"}</dd><dt className="text-slate-500">Refund status</dt><dd>Demo record only</dd></dl></section><EventCancellationForm eventId={id}/></main>;
}
