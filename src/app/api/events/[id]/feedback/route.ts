import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({ rating: z.number().int().min(1).max(5), comments: z.string().trim().min(10).max(2000) });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to submit event feedback." }, { status: 401 });
  let raw: unknown;
  try { raw = await request.json(); } catch { return NextResponse.json({ error: "Enter a rating and written feedback." }, { status: 400 }); }
  const input = schema.safeParse(raw);
  if (!input.success) return NextResponse.json({ error: input.error.issues[0]?.message ?? "Check your feedback and try again." }, { status: 400 });
  const { data: event } = await supabase.from("events").select("id,ends_at,status").eq("id", id).maybeSingle();
  if (!event) return NextResponse.json({ error: "Event not found." }, { status: 404 });
  if (event.status === "cancelled") return NextResponse.json({ error: "Feedback is not available for cancelled events." }, { status: 409 });
  if (Date.parse(event.ends_at) > Date.now()) return NextResponse.json({ error: "Feedback opens after the event ends." }, { status: 409 });
  const { data, error } = await supabase.from("event_feedback").insert({ event_id: id, user_id: user.id, rating: input.data.rating, comments: input.data.comments }).select("id").single();
  if (error) return NextResponse.json({ error: error.code === "42501" ? "You cannot submit feedback for this event." : "Feedback could not be saved. Please try again." }, { status: error.code === "42501" ? 403 : 400 });
  return NextResponse.json({ ok: true, feedbackId: data.id }, { status: 201 });
}
