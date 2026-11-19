"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";

export function FeedbackForm({ eventId }: { eventId: string }) {
  const [rating, setRating] = useState(0);
  const [comments, setComments] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch(`/api/events/${eventId}/feedback`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rating, comments }) });
      const body = await response.json();
      if (!response.ok) { setError(body.error ?? "Feedback could not be saved."); return; }
      router.refresh();
    } catch { setError("Could not reach RADES. Check your connection and try again."); }
    finally { setBusy(false); }
  }
  return <form onSubmit={submit} className="space-y-6">
    <fieldset><legend className="text-sm font-semibold text-slate-900">Overall Rating</legend><div className="mt-2 flex gap-2" role="radiogroup" aria-label="Overall event rating">{[1,2,3,4,5].map(value => <label key={value} className="group cursor-pointer rounded-lg p-1 focus-within:outline focus-within:outline-2 focus-within:outline-blue-700"><input className="sr-only" type="radio" name="rating" value={value} checked={rating === value} onChange={() => setRating(value)} required aria-label={`${value} ${value === 1 ? "star" : "stars"}`}/><span aria-hidden="true" className={`text-3xl ${rating >= value ? "text-amber-500" : "text-slate-300"}`}>★</span></label>)}</div><p aria-live="polite" className="mt-1 text-sm text-slate-600">{rating ? `${rating} / 5 stars` : "Choose a rating from 1 to 5 stars."}</p></fieldset>
    <label className="block text-sm font-semibold text-slate-900">Detailed Written Feedback<textarea className="mt-2 min-h-36 w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-700" value={comments} onChange={event => setComments(event.target.value)} minLength={10} maxLength={2000} required aria-describedby="feedback-hint" placeholder="Tell us what worked well or what could be improved."/><span id="feedback-hint" className="mt-1 block text-xs font-normal text-slate-600">10–2,000 characters. Keep feedback focused on the event.</span></label>
    {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-900">{error}</p>}
    <button type="submit" disabled={busy || rating < 1 || comments.trim().length < 10} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60">{busy && <LoaderCircle size={17} className="animate-spin"/>}{busy ? "Submitting feedback…" : "Submit Feedback"}</button>
  </form>;
}
