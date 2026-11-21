import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTrackedEmail } from "@/lib/email/tracked-send";
import { emailTemplates } from "@/lib/email/templates";
import { sendEventParticipantNotices } from "@/lib/email/event-participant-notifications";
import { isUploadedMediaUrl } from "@/lib/storage/media";

const plainText = (min: number, max: number) => z.string().trim().min(min).max(max).refine(value => !/[<>]/.test(value), "HTML markup is not allowed.");
const inputSchema = z.object({ title: plainText(3,150), description: plainText(10,8000), category: plainText(2,50), venue: plainText(2,200), startsAt: z.string().datetime({ offset: true }), endsAt: z.string().datetime({ offset: true }), capacity: z.number().int().positive().nullable(), pricePkr: z.number().int().min(0), registrationType: z.enum(["solo", "team"]), teamMin: z.number().int().min(2).max(50).default(2), teamMax: z.number().int().min(2).max(50).default(5), image_url: z.string().trim().url().refine(isUploadedMediaUrl).or(z.literal("")).optional(), status: z.enum(["draft", "pending_patron"]) }).refine(value => value.teamMin <= value.teamMax, { message: "Maximum team size must be at least the minimum team size.", path: ["teamMax"] });
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const input = inputSchema.safeParse(await request.json()); if (!input.success) return NextResponse.json({ error: input.error.issues[0]?.message }, { status: 400 });
  if (new Date(input.data.startsAt) <= new Date()) return NextResponse.json({ error: "An event must start in the future." }, { status: 400 });
  if (new Date(input.data.endsAt) <= new Date(input.data.startsAt)) return NextResponse.json({ error: "Choose an end date and time later than the event start." }, { status: 400 });
  const { data: event } = await supabase.from("events").select("id,society_id,status,image_url,is_public,title,description,category,venue,starts_at,ends_at,capacity,price_pkr,registration_type,team_min,team_max").eq("id", id).maybeSingle();
  if (!event) return NextResponse.json({ error: "Event not found." }, { status: 404 });
  const { data: membership } = await supabase.from("society_members").select("id").eq("society_id", event.society_id).eq("user_id", user.id).eq("status", "active").maybeSingle();
  if (!membership) return NextResponse.json({ error: "You are not assigned as a society admin for this event." }, { status: 403 });
  if (!["draft", "pending_patron", "pending_ossie", "rejected", "published"].includes(event.status)) return NextResponse.json({ error: "This event is locked after patron approval." }, { status: 409 });
  if (["published", "rejected"].includes(event.status) && input.data.status !== "pending_patron") return NextResponse.json({ error: "Edits to this event must be resubmitted for patron review." }, { status: 409 });
  const { data: overlap, error: overlapError } = await supabase.from("events").select("id").eq("society_id", event.society_id).neq("id", id).neq("status", "cancelled").lt("starts_at", input.data.endsAt).gt("ends_at", input.data.startsAt).limit(1).maybeSingle();
  if (overlapError) return NextResponse.json({ error: "Could not check this society’s existing event schedule." }, { status: 500 });
  if (overlap) return NextResponse.json({ error: "This society already has an event scheduled during that time. Choose a different time." }, { status: 409 });
  let patrons: Array<{user_id:string;profiles:{email?:string}|null}> = [];
  const resubmitting = input.data.status === "pending_patron" && (event.status === "draft" || event.status === "pending_ossie" || event.status === "rejected" || event.status === "published");
  if (input.data.status === "pending_patron") {
    const { data, error } = await createAdminClient().from("society_patrons").select("user_id,profiles!society_patrons_user_id_fkey(email)").eq("society_id", event.society_id);
    if (error) return NextResponse.json({ error: "Could not check this society’s patron assignment." }, { status: 500 });
    patrons=(data??[]) as unknown as typeof patrons;
    if (!patrons.length) return NextResponse.json({ error: "This society needs an assigned faculty patron before an event can be submitted." }, { status: 400 });
  }
  const nextStatus = ["pending_ossie", "published", "rejected"].includes(event.status) ? "pending_patron" : input.data.status;
  const { data: updatedEvent, error } = await supabase.from("events").update({ title: input.data.title, description: input.data.description, category: input.data.category, venue: input.data.venue, starts_at: input.data.startsAt, ends_at: input.data.endsAt, capacity: input.data.capacity, price_pkr: input.data.pricePkr, registration_type: input.data.registrationType, team_min: input.data.teamMin, team_max: input.data.teamMax, image_url: input.data.image_url || event.image_url || null, status: nextStatus, is_public: event.is_public || event.status === "published", rejection_reason: null }).eq("id", id).eq("status", event.status).select("id,image_url,updated_at").maybeSingle();
  if (error?.code === "23P01") return NextResponse.json({ error: "This society already has an event scheduled during that time. Choose a different time." }, { status: 409 });
  if (error) return NextResponse.json({ error: error.message }, { status: 403 });
  if (!updatedEvent) return NextResponse.json({ error: "The event changed while you were editing. Refresh it before saving again." }, { status: 409 });
  if (resubmitting) {
    const url=`${process.env.APP_URL??new URL(request.url).origin}/dashboard`;
    for(const patron of patrons){const email=patron.profiles?.email;if(email)await sendTrackedEmail({to:email,...emailTemplates.eventSubmitted(input.data.title,url)},{userId:patron.user_id,eventId:id,type:"event_resubmitted_for_patron_review"});}
  }
  const participantDetailsChanged = event.status === "published" && (
    event.title !== input.data.title || event.description !== input.data.description || event.category !== input.data.category || event.venue !== input.data.venue ||
    Date.parse(event.starts_at) !== Date.parse(input.data.startsAt) || Date.parse(event.ends_at) !== Date.parse(input.data.endsAt) || event.capacity !== input.data.capacity ||
    event.price_pkr !== input.data.pricePkr || event.registration_type !== input.data.registrationType || event.team_min !== input.data.teamMin || event.team_max !== input.data.teamMax
  );
  let participantNotifications = { sent: 0, failed: 0, skipped: 0 };
  if (participantDetailsChanged) {
    try {
      const notificationKey = updatedEvent.updated_at;
      participantNotifications = await sendEventParticipantNotices(createAdminClient(), id, process.env.APP_URL ?? new URL(request.url).origin, "event_update", undefined, notificationKey);
    }
    catch (noticeError) { console.error("RADES event update notifications could not be sent", noticeError); participantNotifications = { sent: 0, failed: 1, skipped: 0 }; }
  }
  return NextResponse.json({ ok: true, participantNotifications });
}
