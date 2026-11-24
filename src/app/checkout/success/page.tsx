import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, Clock3, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe/server";
import { sendRegistrationConfirmationEmails } from "@/lib/email/registration-confirmations";
import { sendTicketInformationEmails } from "@/lib/email/ticket-information";

export default async function CheckoutSuccessPage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id: sessionId } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/sign-in?next=${encodeURIComponent(`/checkout/success?session_id=${sessionId ?? ""}`)}`);
  if (!sessionId || !/^cs_test_[A-Za-z0-9]+$/.test(sessionId)) return <main className="mx-auto max-w-xl px-5 py-16"><div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-950"><XCircle size={28}/><h1 className="mt-3 text-xl font-bold">Checkout session not recognized</h1><p className="mt-2 text-sm">Open the success page from the Stripe checkout window.</p></div><Link href="/profile" className="mt-5 inline-block text-sm font-semibold text-blue-700 underline">Go to profile</Link></main>;
  const initialPayment = await supabase.from("event_payments").select("status,registration_id,amount_pkr,currency,checkout_session_id").eq("checkout_session_id", sessionId).maybeSingle();
  if (!initialPayment.data) return <main className="mx-auto max-w-xl px-5 py-16"><div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-950"><XCircle size={28}/><h1 className="mt-3 text-xl font-bold">Payment session not found</h1><p className="mt-2 text-sm">The session may have expired or does not belong to your account.</p></div><Link href="/profile" className="mt-5 inline-block text-sm font-semibold text-blue-700 underline">Go to profile</Link></main>;

  const ownedRegistration = await supabase.from("registrations").select("id,leader_id").eq("id", initialPayment.data.registration_id).eq("leader_id", user.id).maybeSingle();
  if (!ownedRegistration.data) redirect("/profile");

  if (initialPayment.data.status === "pending") {
    try {
      const stripe = getStripe();
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (session.status === "complete" && session.payment_status === "paid") {
        const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null;
        if (session.metadata?.registration_id === initialPayment.data.registration_id && session.metadata?.user_id === user.id) {
          const admin = createAdminClient();
          await admin.rpc("process_stripe_checkout_event", {
            p_event_id: `success:${session.id}`,
            p_event_type: "checkout.session.completed",
            p_session_id: session.id,
            p_registration_id: initialPayment.data.registration_id,
            p_user_id: user.id,
            p_payment_intent_id: paymentIntentId,
            p_amount_total: session.amount_total ?? 0,
            p_currency: session.currency ?? "",
            p_payment_status: session.payment_status,
          });
          await Promise.all([
            sendRegistrationConfirmationEmails(admin, initialPayment.data.registration_id, process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
            sendTicketInformationEmails(admin, initialPayment.data.registration_id, process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
          ]).catch(error => console.error("RADES success-page ticket delivery could not be attempted", error));
        }
      }
    } catch (error) {
      console.error("RADES could not reconcile the Stripe success page", error);
    }
  }
  const { data: payment } = await supabase.from("event_payments").select("status,registration_id,amount_pkr,currency").eq("checkout_session_id", sessionId).maybeSingle();
  if (!payment) return <main className="mx-auto max-w-xl px-5 py-16"><div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-950"><XCircle size={28}/><h1 className="mt-3 text-xl font-bold">Payment session not found</h1><p className="mt-2 text-sm">The session may have expired or does not belong to your account.</p></div><Link href="/profile" className="mt-5 inline-block text-sm font-semibold text-blue-700 underline">Go to profile</Link></main>;
  const paid = payment.status === "paid";
  const failed = payment.status === "failed";
  return <main className="mx-auto max-w-xl px-5 py-16"><section role="status" className={`rounded-2xl border p-6 ${paid ? "border-green-200 bg-green-50 text-green-950" : failed ? "border-red-200 bg-red-50 text-red-950" : "border-blue-200 bg-blue-50 text-blue-950"}`}>
    {paid ? <CheckCircle2 size={30}/> : failed ? <XCircle size={30}/> : <Clock3 size={30}/>}
    <h1 className="mt-3 text-2xl font-bold">{paid ? "Payment confirmed" : failed ? "Payment could not be confirmed" : "Confirming your payment"}</h1>
    <p className="mt-2 text-sm">{paid ? "Your registration is confirmed. Your individual QR ticket is available in your profile." : failed ? "Your registration is not active. You can return to the event and try again." : "Stripe returned you to RADES. We are waiting for Stripe’s signed payment update; your place and ticket become confirmed after that update arrives."}</p>
    <p className="mt-3 text-sm font-semibold">Amount: PKR {payment.amount_pkr.toLocaleString()}</p>
  </section><div className="mt-5 flex flex-wrap gap-3"><Link href="/profile" className="inline-flex h-11 items-center rounded-lg bg-blue-700 px-5 text-sm font-semibold text-white hover:bg-blue-800">View profile</Link><Link href="/events" className="inline-flex h-11 items-center rounded-lg border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-800 hover:bg-slate-50">Explore events</Link></div></main>;
}
