import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTrackedEmail } from "@/lib/email/tracked-send";
import { emailTemplates } from "@/lib/email/templates";
import { isUploadedMediaUrl } from "@/lib/storage/media";

const inputSchema = z.object({ title: z.string().trim().min(3).max(150), description: z.string().trim().min(10).max(8000), category: z.string().trim().min(2).max(50), venue: z.string().trim().min(2).max(200), startsAt: z.string().datetime({ offset: true }), endsAt: z.string().datetime({ offset: true }), capacity: z.number().int().positive().nullable(), pricePkr: z.number().int().min(0), registrationType: z.enum(["solo", "team"]), imageUrl: z.string().url().refine(isUploadedMediaUrl).or(z.literal("")).optional(), status: z.enum(["draft", "pending_patron"]) });
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const input = inputSchema.safeParse(await request.json()); if (!input.success) return NextResponse.json({ error: input.error.issues[0]?.message }, { status: 400 });
  if (new Date(input.data.endsAt) <= new Date(input.data.startsAt)) return NextResponse.json({ error: "The event end must be after its start." }, { status: 400 });
  const { data: event } = await supabase.from("events").select("id,society_id,status").eq("id", id).maybeSingle();
  if (!event) return NextResponse.json({ error: "Event not found." }, { status: 404 });
  const { data: membership } = await supabase.from("society_members").select("id").eq("society_id", event.society_id).eq("user_id", user.id).eq("status", "active").maybeSingle();
  if (!membership) return NextResponse.json({ error: "You are not assigned as a society admin for this event." }, { status: 403 });
  if (!["draft", "pending_patron", "rejected"].includes(event.status)) return NextResponse.json({ error: "This event is locked after patron approval." }, { status: 409 });
  let patrons: Array<{user_id:string;profiles:{email?:string}|null}> = [];
  const resubmitting = input.data.status === "pending_patron" && (event.status === "draft" || event.status === "rejected");
  if (input.data.status === "pending_patron") {
    const { data, error } = await createAdminClient().from("society_patrons").select("user_id,profiles!society_patrons_user_id_fkey(email)").eq("society_id", event.society_id);
    if (error) return NextResponse.json({ error: "Could not check this society’s patron assignment." }, { status: 500 });
    patrons=(data??[]) as unknown as typeof patrons;
    if (!patrons.length) return NextResponse.json({ error: "This society needs an assigned faculty patron before an event can be submitted." }, { status: 400 });
  }
  const { error } = await supabase.from("events").update({ title: input.data.title, description: input.data.description, category: input.data.category, venue: input.data.venue, starts_at: input.data.startsAt, ends_at: input.data.endsAt, capacity: input.data.capacity, price_pkr: input.data.pricePkr, registration_type: input.data.registrationType, image_url: input.data.imageUrl || null, status: input.data.status, rejection_reason: null }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 403 });
  if (resubmitting) {
    const url=`${process.env.NEXT_PUBLIC_APP_URL??new URL(request.url).origin}/dashboard`;
    for(const patron of patrons){const email=patron.profiles?.email;if(email)await sendTrackedEmail({to:email,...emailTemplates.eventSubmitted(input.data.title,url)},{userId:patron.user_id,eventId:id,type:"event_resubmitted_for_patron_review"});}
  }
  return NextResponse.json({ ok: true });
}
