import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { processEventRefunds } from "@/lib/payments/event-refunds";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const { data: event } = await supabase.from("events").select("id,status,cancellation_reason,society_id").eq("id", id).maybeSingle();
  if (!event) return NextResponse.json({ error: "Event not found." }, { status: 404 });
  if (event.status !== "cancelled") return NextResponse.json({ error: "Refund retries are available only for cancelled events." }, { status: 409 });
  const { data: profile } = await supabase.from("profiles").select("global_role").eq("id", user.id).maybeSingle();
  const { data: member } = await supabase.from("society_members").select("id").eq("society_id", event.society_id).eq("user_id", user.id).eq("status", "active").maybeSingle();
  if (!member && !["office", "super_admin"].includes(profile?.global_role ?? "")) return NextResponse.json({ error: "You cannot manage refunds for this event." }, { status: 403 });
  const { error } = await supabase.rpc("cancel_event_and_queue_refunds", { p_event_id: id, p_reason: event.cancellation_reason ?? "Cancellation refund retry" , p_actor_id: user.id });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  const refunds = await processEventRefunds(createAdminClient(), id);
  return NextResponse.json({ ok: true, refunds });
}
