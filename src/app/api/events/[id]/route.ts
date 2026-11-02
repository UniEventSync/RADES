import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const inputSchema = z.object({ title: z.string().trim().min(3).max(150), description: z.string().trim().min(10).max(8000), category: z.string().trim().min(2).max(50), venue: z.string().trim().min(2).max(200), startsAt: z.string().datetime({ offset: true }), endsAt: z.string().datetime({ offset: true }), capacity: z.number().int().positive().nullable() });
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const input = inputSchema.safeParse(await request.json()); if (!input.success) return NextResponse.json({ error: input.error.issues[0]?.message }, { status: 400 });
  if (new Date(input.data.endsAt) <= new Date(input.data.startsAt)) return NextResponse.json({ error: "The event end must be after its start." }, { status: 400 });
  const { data: event } = await supabase.from("events").select("id,society_id,status").eq("id", id).maybeSingle();
  if (!event) return NextResponse.json({ error: "Event not found." }, { status: 404 });
  const status = ["draft", "pending_patron"].includes(event.status) ? event.status : "pending_patron";
  const { error } = await supabase.from("events").update({ title: input.data.title, description: input.data.description, category: input.data.category, venue: input.data.venue, starts_at: input.data.startsAt, ends_at: input.data.endsAt, capacity: input.data.capacity, status }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 403 }); return NextResponse.json({ ok: true });
}
