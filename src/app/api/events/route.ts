import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTrackedEmail } from "@/lib/email/tracked-send";
import { emailTemplates } from "@/lib/email/templates";
import { isUploadedMediaUrl } from "@/lib/storage/media";

const plainText = (min: number, max: number) => z.string().trim().min(min).max(max).refine(value => !/[<>]/.test(value), "HTML markup is not allowed.");
const eventInput = z.object({ societyId: z.string().uuid(), title: plainText(3,150), description: plainText(10,8000), category: plainText(2,50), venue: plainText(2,200), startsAt: z.string().datetime({ offset: true }), endsAt: z.string().datetime({ offset: true }), capacity: z.number().int().positive().nullable().optional(), pricePkr: z.number().int().min(0).default(0), registrationType: z.enum(["solo", "team"]).default("solo"), teamMin: z.number().int().min(2).max(50).default(2), teamMax: z.number().int().min(2).max(50).default(5), image_url: z.string().trim().url().refine(isUploadedMediaUrl).or(z.literal("")).optional(), status: z.enum(["draft", "pending_patron"]).default("pending_patron") }).refine(value => value.teamMin <= value.teamMax, { message: "Maximum team size must be at least the minimum team size.", path: ["teamMax"] });
type PatronRow = { user_id: string; profiles: { email?: string } | null };

export async function POST(request: Request) {
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to create an event." }, { status: 401 });
  const input = eventInput.safeParse(await request.json());
  if (!input.success) return NextResponse.json({ error: input.error.issues[0]?.message ?? "Check the event details." }, { status: 400 });
  if (new Date(input.data.startsAt) <= new Date()) return NextResponse.json({ error: "An event must start in the future." }, { status: 400 });
  if (new Date(input.data.endsAt) <= new Date(input.data.startsAt)) return NextResponse.json({ error: "Choose an end date and time later than the event start." }, { status: 400 });
  const { data: membership, error: membershipError } = await supabase.from("society_members").select("id").eq("society_id", input.data.societyId).eq("user_id", user.id).eq("status", "active").maybeSingle();
  if (membershipError) return NextResponse.json({ error: "Could not verify your society admin assignment." }, { status: 500 });
  if (!membership) return NextResponse.json({ error: "You are not assigned as a society admin for this society." }, { status: 403 });
  const { data: overlap, error: overlapError } = await supabase.from("events").select("id").eq("society_id", input.data.societyId).neq("status", "cancelled").lt("starts_at", input.data.endsAt).gt("ends_at", input.data.startsAt).limit(1).maybeSingle();
  if (overlapError) return NextResponse.json({ error: "Could not check this society’s existing event schedule." }, { status: 500 });
  if (overlap) return NextResponse.json({ error: "This society already has an event scheduled during that time. Choose a different time." }, { status: 409 });
  let patrons: PatronRow[] = [];
  if (input.data.status === "pending_patron") {
    const admin = createAdminClient();
    const { data: assignments, error } = await admin.from("society_patrons").select("user_id").eq("society_id", input.data.societyId);
    if (error) return NextResponse.json({ error: "Could not check the society’s patron assignment." }, { status: 500 });
    const userIds = (assignments ?? []).map(row => row.user_id);
    const { data: patronProfiles, error: profilesError } = userIds.length
      ? await admin.from("profiles").select("id,email").in("id", userIds)
      : { data: [] as { id: string; email: string }[], error: null };
    if (profilesError) return NextResponse.json({ error: "Could not load the society’s patron account." }, { status: 500 });
    patrons = (patronProfiles ?? []).map(profile => ({ user_id: profile.id, profiles: { email: profile.email } }));
    if (!patrons.length) return NextResponse.json({ error: "This society needs an assigned faculty patron before it can submit events." }, { status: 400 });
  }
  const { data, error } = await supabase.from("events").insert({ society_id: input.data.societyId, title: input.data.title, description: input.data.description, category: input.data.category, venue: input.data.venue, starts_at: input.data.startsAt, ends_at: input.data.endsAt, capacity: input.data.capacity ?? null, price_pkr: input.data.pricePkr, registration_type: input.data.registrationType, team_min: input.data.teamMin, team_max: input.data.teamMax, image_url: input.data.image_url || null, status: input.data.status, created_by: user.id }).select("id").single();
  if (error?.code === "23P01") return NextResponse.json({ error: "This society already has an event scheduled during that time. Choose a different time." }, { status: 409 });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (input.data.status === "pending_patron") {
    const siteUrl = process.env.APP_URL ?? new URL(request.url).origin;
    for (const patron of patrons) { const email = patron.profiles?.email; if (email) await sendTrackedEmail({ to: email, ...emailTemplates.eventSubmitted(input.data.title, `${siteUrl}/dashboard`) }, { userId: patron.user_id, eventId: data.id, type: "event_submitted_for_patron_review" }); }
  }
  return NextResponse.json({ id: data.id }, { status: 201 });
}
