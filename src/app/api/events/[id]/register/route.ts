import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ id: string }> };
const bodySchema = z.object({ phone: z.string().trim().max(20).optional().default("").refine(value => !value || /^\+[1-9]\d{7,14}$/.test(value), "Enter a phone number in international format.") });

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to check registration availability." }, { status: 401 });
  const { data, error } = await supabase.rpc("get_registration_preflight", { p_event_id: id });
  if (error) return NextResponse.json({ error: error.message }, { status: error.code === "P0002" ? 404 : 400 });
  return NextResponse.json(data);
}

export async function POST(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to register for this event." }, { status: 401 });
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check your contact number." }, { status: 400 });

  const { data, error } = await supabase.rpc("register_solo_for_event", { p_event_id: id, p_phone: parsed.data.phone || null });
  if (error) {
    const status = error.code === "42501" ? 403 : error.code === "P0002" ? 404 : error.code === "23505" || error.code === "23P01" || error.code === "23514" ? 409 : 400;
    return NextResponse.json({ error: error.message }, { status });
  }
  return NextResponse.json(data, { status: 201 });
}
