import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTrackedEmail } from "@/lib/email/tracked-send";
import { emailTemplates } from "@/lib/email/templates";

const decisionSchema = z.object({ decision: z.enum(["approved", "rejected"]), comments: z.string().trim().max(1000).optional() });
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const input = decisionSchema.safeParse(await request.json());
  if (!input.success) return NextResponse.json({ error: "Invalid review decision." }, { status: 400 });
  const { data: event } = await supabase.from("events").select("id,title,created_by").eq("id", id).maybeSingle();
  if (!event) return NextResponse.json({ error: "Event not found or not available for review." }, { status: 404 });
  const { data, error } = await supabase.rpc("review_event", { target_event: id, requested_decision: input.data.decision, reviewer_comments: input.data.comments ?? null });
  if (error) return NextResponse.json({ error: error.message }, { status: error.code === "42501" ? 403 : 400 });
  try {
    const admin = createAdminClient();
    const recipientQuery = data === "pending_ossie"
      ? admin.from("profiles").select("id,email").eq("email", (process.env.OSSIE_EMAIL ?? "").toLowerCase()).maybeSingle()
      : admin.from("profiles").select("id,email").eq("id", event.created_by).maybeSingle();
    const { data: recipient } = await recipientQuery;
    const email = recipient?.email ?? (data === "pending_ossie" ? process.env.OSSIE_EMAIL : undefined);
    const label = data === "pending_ossie" ? "awaiting final OSSIE review" : data === "published" ? "approved and published" : "not approved";
    if (email) await sendTrackedEmail({ to: email, ...emailTemplates.eventApproved(event.title,label,`${process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin}/dashboard`) }, { userId: recipient?.id ?? null, eventId: id, type: `event_${data}` });
  } catch (notifyError) { console.error("RADES could not send review notification", notifyError); }
  return NextResponse.json({ ok: true, status: data });
}
