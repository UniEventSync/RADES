import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTrackedEmail } from "@/lib/email/tracked-send";
import { emailTemplates } from "@/lib/email/templates";

const eventInput = z.object({ societyId: z.string().uuid(), title: z.string().trim().min(3).max(150), description: z.string().trim().min(10).max(8000), category: z.string().trim().min(2).max(50), venue: z.string().trim().min(2).max(200), startsAt: z.string().datetime({ offset: true }), endsAt: z.string().datetime({ offset: true }), capacity: z.number().int().positive().nullable().optional() });
export async function POST(request: Request) {
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to create an event." }, { status: 401 });
  const input = eventInput.safeParse(await request.json());
  if (!input.success) return NextResponse.json({ error: input.error.issues[0]?.message ?? "Check the event details." }, { status: 400 });
  if (new Date(input.data.endsAt) <= new Date(input.data.startsAt)) return NextResponse.json({ error: "The event end must be after its start." }, { status: 400 });
  const admin = createAdminClient();
  const { data: patrons, error: patronLookupError } = await admin.from("society_patrons").select("user_id,profiles(email)").eq("society_id", input.data.societyId);
  if (patronLookupError) return NextResponse.json({ error: "Could not check the society’s patron assignment." }, { status: 500 });
  if (!patrons?.length) return NextResponse.json({ error: "This society needs an assigned faculty patron before it can submit events." }, { status: 400 });
  const { data, error } = await supabase.from("events").insert({ society_id: input.data.societyId, title: input.data.title, description: input.data.description, category: input.data.category, venue: input.data.venue, starts_at: input.data.startsAt, ends_at: input.data.endsAt, capacity: input.data.capacity ?? null, status: "pending_patron", created_by: user.id }).select("id").single();
  if (error) return NextResponse.json({ error: error.message.includes("row-level security") ? "You are not assigned as a panelist for this society." : error.message }, { status: 400 });
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
  for (const patron of patrons) {
    const email = (patron.profiles as unknown as { email?: string } | null)?.email;
    if (email) await sendTrackedEmail({ to: email, ...emailTemplates.eventSubmitted(input.data.title, `${siteUrl}/home`) }, { userId: patron.user_id, eventId: data.id, type: "event_submitted_for_patron_review" });
  }
  return NextResponse.json({ id: data.id }, { status: 201 });
}
