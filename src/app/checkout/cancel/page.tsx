import Link from "next/link";
import { redirect } from "next/navigation";
import { Clock3 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function CheckoutCancelPage({ searchParams }: { searchParams: Promise<{ registration_id?: string }> }) {
  const { registration_id: registrationId } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/sign-in?next=${encodeURIComponent(`/checkout/cancel?registration_id=${registrationId ?? ""}`)}`);
  const { data: registration } = registrationId ? await supabase.from("registrations").select("id,status,payment_expires_at,event_id").eq("id", registrationId).eq("leader_id", user.id).maybeSingle() : { data: null };
  const [{ data: payment }, { data: event }] = registration ? await Promise.all([
    supabase.from("event_payments").select("checkout_url,status").eq("registration_id", registration.id).maybeSingle(),
    supabase.from("events").select("title").eq("id", registration.event_id).maybeSingle(),
  ]) : [{ data: null }, { data: null }];
  // eslint-disable-next-line react-hooks/purity -- This is a request-time server page, not client render state.
  const canResume = registration?.status === "pending_payment" && payment?.status === "pending" && Date.parse(registration.payment_expires_at ?? "") > Date.now();
  return <main className="mx-auto max-w-xl px-5 py-16"><section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-950"><Clock3 size={30}/><h1 className="mt-3 text-2xl font-bold">Payment not completed</h1><p className="mt-2 text-sm">{canResume ? `Your place for ${event?.title ?? "this event"} is held until the checkout window expires. You can safely return to the Stripe test checkout.` : "No payment was recorded. The event place may have been released; check your registration history before trying again."}</p></section><div className="mt-5 flex flex-wrap gap-3">{canResume&&payment?.checkout_url&&<a href={payment.checkout_url} className="inline-flex h-11 items-center rounded-lg bg-blue-700 px-5 text-sm font-semibold text-white hover:bg-blue-800">Continue payment</a>}<Link href="/profile" className="inline-flex h-11 items-center rounded-lg border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-800 hover:bg-slate-50">View profile</Link>{registration&&<Link href={`/events/${registration.event_id}`} className="inline-flex h-11 items-center rounded-lg border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-800 hover:bg-slate-50">Back to event</Link>}</div></main>;
}
