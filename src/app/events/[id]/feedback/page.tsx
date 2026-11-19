import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FeedbackForm } from "@/components/feedback-form";

export default async function EventFeedbackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/sign-in?next=${encodeURIComponent(`/events/${id}/feedback`)}`);
  const { data: event } = await supabase.from("events").select("id,title,society_id,starts_at,ends_at,status,societies(name)").eq("id", id).maybeSingle();
  if (!event) notFound();
  const societyName = Array.isArray(event.societies) ? event.societies[0]?.name ?? "Society" : "Society";
  const { data: eligibility, error: eligibilityError } = await supabase.rpc("get_event_feedback_eligibility", { p_event_id: id });
  const state = eligibility as { eligible?: boolean; submitted?: boolean; rating?: number; reason?: string } | null;
  return <main className="mx-auto max-w-3xl px-5 py-8 sm:px-8 sm:py-10">
    <Link href="/profile" className="text-sm font-semibold text-blue-700 hover:underline">← Back to profile</Link>
    <p className="mt-5 text-xs font-bold uppercase tracking-wider text-blue-700">RADES · Post-event feedback</p>
    <h1 className="mt-2 text-3xl font-bold tracking-tight">Post-Event Feedback Submission</h1>
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
      <p className="text-sm font-semibold text-slate-600">Event: {event.title} <span className="font-normal">· Host: {societyName}</span></p>
      <div className="mt-5 border-t border-slate-200 pt-5">
        {eligibilityError ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">Feedback eligibility could not be checked. Refresh the page to try again.</p> : state?.submitted ? <div role="status" className="rounded-xl border border-green-200 bg-green-50 p-4 text-green-950"><h2 className="font-bold">Feedback received</h2><p className="mt-1 text-sm">Your rating: {state.rating}/5. Thank you for sharing your feedback.</p></div> : state?.eligible ? <FeedbackForm eventId={id}/> : <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">{state?.reason ?? "Feedback is not available for this event."}</p>}
      </div>
    </section>
  </main>;
}
