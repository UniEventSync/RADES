import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createOrReuseCheckout } from "@/lib/payments/checkout";
import { sendRegistrationConfirmationEmails } from "@/lib/email/registration-confirmations";
import { sendTicketInformationEmails } from "@/lib/email/ticket-information";

type RouteContext = { params: Promise<{ id: string }> };
const bodySchema = z.object({ phone: z.string().trim().max(20).optional().default("").refine(value => !value || /^\+[1-9]\d{7,14}$/.test(value), "Enter a phone number in international format.") });

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to check registration availability." }, { status: 401 });
  const { data, error } = await supabase.rpc("get_registration_preflight", { p_event_id: id });
  if (error) return NextResponse.json({ error: error.message }, { status: error.code === "P0002" ? 404 : 400 });
  return NextResponse.json(data);
}

export async function POST(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to register for this event." }, { status: 401 });
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check your contact number." }, { status: 400 });

  const { data, error } = await supabase.rpc("register_solo_for_event", { p_event_id: id, p_phone: parsed.data.phone || null });
  if (error) {
    if (error.code === "23505") {
      const { data: pending } = await supabase.from("registrations").select("id,amount_pkr").eq("event_id", id).eq("leader_id", user.id).eq("status", "pending_payment").maybeSingle();
      if (pending) {
        const checkout = await createOrReuseCheckout(supabase, user, pending.id, request.url);
        if ("error" in checkout) return NextResponse.json({ error: checkout.error }, { status: checkout.status });
        return NextResponse.json({ registrationId: pending.id, status: "pending_payment", paymentRequired: true, checkoutUrl: checkout.checkoutUrl }, { status: 200 });
      }
    }
    const status = error.code === "42501" ? 403 : error.code === "P0002" ? 404 : error.code === "23505" || error.code === "23P01" || error.code === "23514" ? 409 : 400;
    return NextResponse.json({ error: error.message }, { status });
  }
  const result = data as { registrationId: string; status: string; paymentRequired: boolean };
  if (result.paymentRequired) {
    const checkout = await createOrReuseCheckout(supabase, user, result.registrationId, request.url);
    if ("error" in checkout) return NextResponse.json({ error: checkout.error }, { status: checkout.status });
    return NextResponse.json({ ...result, checkoutUrl: checkout.checkoutUrl }, { status: 201 });
  }
  let confirmationEmail = { sent: 0, failed: 0, skipped: 0 };
  let ticketEmail = { sent: 0, failed: 0, skipped: 0 };
  if (result.status === "confirmed") {
    try {
      const admin = createAdminClient();
      const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
      [confirmationEmail, ticketEmail] = await Promise.all([sendRegistrationConfirmationEmails(admin, result.registrationId, siteUrl), sendTicketInformationEmails(admin, result.registrationId, siteUrl)]);
    } catch (sendError) { console.error("RADES registration emails could not be attempted", sendError); confirmationEmail = { sent: 0, failed: 1, skipped: 0 }; ticketEmail = { sent: 0, failed: 1, skipped: 0 }; }
  }
  return NextResponse.json({ ...result, confirmationEmail, ticketEmail }, { status: 201 });
}
