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
  const { data: event } = await supabase.from("events").select("id,title,created_by,society_id,status").eq("id", id).maybeSingle();
  if (!event) return NextResponse.json({ error: "Event not found or not available for review." }, { status: 404 });
  const { data, error } = await supabase.rpc("review_event", { target_event: id, requested_decision: input.data.decision, reviewer_comments: input.data.comments ?? null });
  if (error) return NextResponse.json({ error: error.message }, { status: error.code === "42501" ? 403 : 400 });
  try {
    const admin = createAdminClient();
    const isPatronDecision = event.status === "pending_patron";
    if (isPatronDecision && input.data.decision === "approved") {
      const configured = (process.env.OSSIE_EMAIL ?? "").trim().toLowerCase();
      const { data: recipients } = await admin.from("profiles").select("id,email").eq("global_role", "office");
      const targets = new Map<string, { id: string | null; email: string }>();
      for (const recipient of recipients ?? []) if (recipient.email) targets.set(recipient.email.toLowerCase(), { id: recipient.id, email: recipient.email });
      if (configured && !targets.has(configured)) targets.set(configured, { id: null, email: configured });
      for (const recipient of targets.values()) await sendTrackedEmail({ to: recipient.email, ...emailTemplates.eventApproved(event.title, "awaiting final OSSIE review", `${process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin}/dashboard`) }, { userId: recipient.id, eventId: id, type: "event_pending_ossie" });
    } else {
      const [{ data: creator }, { data: admins }] = await Promise.all([
        admin.from("profiles").select("id,email").eq("id", event.created_by).maybeSingle(),
        admin.from("society_members").select("user_id,profiles!society_members_user_id_fkey(id,email)").eq("society_id", event.society_id).eq("status", "active"),
      ]);
      const recipients = new Map<string, { id: string | null; email: string }>();
      if (creator?.email) recipients.set(creator.email.toLowerCase(), { id: creator.id, email: creator.email });
      for (const member of admins ?? []) {
        const profile = Array.isArray(member.profiles) ? member.profiles[0] : member.profiles;
        if (profile?.email) recipients.set(profile.email.toLowerCase(), { id: profile.id, email: profile.email });
      }
      const status = input.data.decision === "rejected" ? "not approved" : "approved and published";
      for (const recipient of recipients.values()) await sendTrackedEmail({ to: recipient.email, ...emailTemplates.eventApproved(event.title, status, `${process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin}/dashboard`) }, { userId: recipient.id, eventId: id, type: `event_${data}` });
    }
  } catch (notifyError) { console.error("RADES could not send review notification", notifyError); }
  return NextResponse.json({ ok: true, status: data });
}
