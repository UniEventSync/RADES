import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in with an event admin account to check in tickets." }, { status: 401 });
  let raw: unknown;
  try { raw = await request.json(); } catch { return NextResponse.json({ error: "Scan and validate a ticket first." }, { status: 400 }); }
  const parsed = z.object({ ticketId: z.string().uuid() }).safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: "Scan and validate a ticket first." }, { status: 400 });
  const { data, error } = await supabase.rpc("check_in_event_ticket", { p_event_id: id, p_ticket_id: parsed.data.ticketId });
  if (error) {
    const status = error.code === "42501" ? 403 : error.code === "P0002" ? 404 : error.code === "P0001" ? 409 : 400;
    return NextResponse.json({ error: error.message }, { status });
  }
  return NextResponse.json(data);
}
