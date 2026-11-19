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
  const { data, error } = await supabase.rpc("submit_event_feedback", { p_event_id: id, p_rating: input.data.rating, p_comments: input.data.comments });
  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "You already submitted feedback for this event." }, { status: 409 });
    const status = error.code === "P0002" ? 404 : error.code === "42501" ? 403 : error.code === "P0001" ? 409 : 400;
    return NextResponse.json({ error: error.message || "Feedback could not be saved. Please try again." }, { status });
  }
  return NextResponse.json({ ok: true, feedbackId: data }, { status: 201 });
}
