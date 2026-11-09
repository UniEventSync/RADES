import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTrackedEmail } from "@/lib/email/tracked-send";
import { emailTemplates } from "@/lib/email/templates";
import { isUploadedMediaUrl } from "@/lib/storage/media";

const eventInput = z.object({ societyId: z.string().uuid(), title: z.string().trim().min(3).max(150), description: z.string().trim().min(10).max(8000), category: z.string().trim().min(2).max(50), venue: z.string().trim().min(2).max(200), startsAt: z.string().datetime({ offset: true }), endsAt: z.string().datetime({ offset: true }), capacity: z.number().int().positive().nullable().optional(), pricePkr: z.number().int().min(0).default(0), registrationType: z.enum(["solo", "team"]).default("solo"), image_url: z.string().trim().url().refine(isUploadedMediaUrl).or(z.literal("")).optional(), status: z.enum(["draft", "pending_patron"]).default("pending_patron") });
type PatronRow = { user_id: string; profiles: { email?: string } | null };

export async function POST(request: Request) {
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to create an event." }, { status: 401 });
  const input = eventInput.safeParse(await request.json());
  if (!input.success) return NextResponse.json({ error: input.error.issues[0]?.message ?? "Check the event details." }, { status: 400 });
  if (new Date(input.data.endsAt) <= new Date(input.data.startsAt)) return NextResponse.json({ error: "The event end must be after its start." }, { status: 400 });
  const { data: membership, error: membershipError } = await supabase.from("society_members").select("id").eq("society_id", input.data.societyId).eq("user_id", user.id).eq("status", "active").maybeSingle();
  if (membershipError) return NextResponse.json({ error: "Could not verify your society admin assignment." }, { status: 500 });
  if (!membership) return NextResponse.json({ error: "You are not assigned as a society admin for this society." }, { status: 403 });
  let patrons: PatronRow[] = [];
  if (input.data.status === "pending_patron") {
    const { data, error } = await createAdminClient().from("society_patrons").select("user_id,profiles!society_patrons_user_id_fkey(email)").eq("society_id", input.data.societyId);
    if (error) return NextResponse.json({ error: "Could not check the societyâ€™s patron assignment." }, { status: 500 });
    patrons = (data ?? []) as unknown as PatronRow[];
    if (!patrons.length) return NextResponse.json({ error: "This society needs an assigned faculty patron before it can submit events." }, { status: 400 });
  }
  const { data, error } = await supabase.from("events").insert({ society_id: input.data.societyId, title: input.data.title, description: input.data.description, category: input.data.category, venue: input.data.venue, starts_at: input.data.startsAt, ends_at: input.data.endsAt, capacity: input.data.capacity ?? null, price_pkr: input.data.pricePkr, registration_type: input.data.registrationType, image_url: input.data.image_url || null, status: input.data.status, created_by: user.id }).select("id").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (input.data.status === "pending_patron") {
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
    for (const patron of patrons) { const email = patron.profiles?.email; if (email) await sendTrackedEmail({ to: email, ...emailTemplates.eventSubmitted(input.data.title, `${siteUrl}/dashboard`) }, { userId: patron.user_id, eventId: data.id, type: "event_submitted_for_patron_review" }); }
  }
  return NextResponse.json({ id: data.id }, { status: 201 });
}
