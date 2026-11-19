import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTicketInformationEmail } from "@/lib/email/ticket-information";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to email your ticket." }, { status: 401 });
  const { data: ticket } = await supabase.from("event_tickets").select("id,registration_member_id,status").eq("id", id).maybeSingle();
  if (!ticket) return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
  const { data: member } = await supabase.from("registration_members").select("id,user_id,email").eq("id", ticket.registration_member_id).eq("user_id", user.id).maybeSingle();
  if (!member) return NextResponse.json({ error: "This ticket does not belong to your account." }, { status: 403 });
  if (ticket.status !== "active") return NextResponse.json({ error: "This ticket is no longer active." }, { status: 409 });
  try {
    const result = await sendTicketInformationEmail(createAdminClient(), member.id, process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin, true);
    if (result === "skipped") return NextResponse.json({ error: "This ticket is no longer eligible to be emailed." }, { status: 409 });
    if (result === "failed") return NextResponse.json({ error: "Ticket email could not be delivered. Check your email settings or try again." }, { status: 503 });
    return NextResponse.json({ ok: true, testRouted: Boolean(process.env.EMAIL_TEST_RECIPIENT?.trim()) });
  } catch (error) {
    console.error("RADES ticket email could not be attempted", error);
    return NextResponse.json({ error: "Ticket email could not be delivered. Try again later." }, { status: 503 });
  }
}
