import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getEvent } from "@/lib/events/data";
import { createClient } from "@/lib/supabase/server";
import { SoloRegistrationForm, type RegistrationPreflight } from "@/components/solo-registration-form";

export default async function SoloRegistrationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await getEvent(id);
  if (!event) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/sign-in?next=${encodeURIComponent(`/events/${id}/register-solo`)}`);
  const { data: profile } = await supabase.from("profiles").select("first_name,last_name,email,erp_number,account_type,phone").eq("id", user.id).maybeSingle();
  if (!profile) redirect("/");
  if (profile.account_type !== "student") {
    return <div className="mx-auto max-w-3xl px-5 py-10"><Link href={`/events/${id}`} className="text-sm font-semibold text-blue-700 hover:underline">← Back to event</Link><section className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-950"><h1 className="text-xl font-bold">Student registration required</h1><p className="mt-2 text-sm">Only IBA student accounts can register for events.</p></section></div>;
  }
  if (event.registration_type === "team") redirect(`/events/${id}/register-team`);
  const { data: preflightData, error } = await supabase.rpc("get_registration_preflight", { p_event_id: id });
  const preflight = error ? null : preflightData as RegistrationPreflight;
  if (preflight?.isSocietyMember && !preflight.alreadyRegistered) return <main className="mx-auto max-w-3xl px-5 py-10"><Link href={`/events/${id}`} className="text-sm font-semibold text-blue-700 hover:underline">← Back to event</Link><section role="status" className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-950"><h1 className="text-xl font-bold">Society member registration unavailable</h1><p className="mt-2 text-sm">Active student members cannot register for events hosted by their own society.</p></section></main>;

  return <main className="mx-auto max-w-3xl px-5 py-8 sm:py-10">
    <Link href={`/events/${id}`} className="text-sm font-semibold text-blue-700 hover:underline">← Back to event details</Link>
    <h1 className="mt-5 text-center text-2xl font-bold tracking-tight sm:text-3xl">Solo Event Registration</h1>
    <SoloRegistrationForm event={event} profile={{ firstName: profile.first_name, lastName: profile.last_name, email: profile.email, erpNumber: profile.erp_number, phone: profile.phone ?? "" }} preflight={preflight}/>
  </main>;
}
