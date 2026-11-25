import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import { emailTemplates } from "@/lib/email/templates";

const inputSchema = z.object({ email: z.string().trim().email().max(254) });

export async function POST(request: Request) {
  const input = inputSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });

  const email = input.data.email.toLowerCase();
  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json({ error: "Password recovery is not configured on this server." }, { status: 503 });
  }
  const { data, error } = await admin.auth.admin.generateLink({ type: "recovery", email });
  if (error) {
    console.error("RADES recovery code generation failed", { code: error.code, status: error.status });
    // Keep recovery responses indistinguishable for addresses without an account.
    if (error.status === 404 || error.code === "user_not_found") return NextResponse.json({ ok: true });
    return NextResponse.json({ error: "The authentication service could not create a recovery code. Try again shortly." }, { status: 503 });
  }
  if (!data?.properties.email_otp) return NextResponse.json({ error: "The authentication service returned no recovery code." }, { status: 503 });

  const siteUrl = process.env.APP_URL ?? new URL(request.url).origin;
  const delivery = await sendEmail({ to: email, ...emailTemplates.passwordRecovery(data.properties.email_otp, siteUrl) });
  if (!delivery.sent) {
    console.error("RADES recovery code delivery failed", delivery.reason);
    return NextResponse.json({ error: "Recovery email could not be sent. Check the configured email provider and try again." }, { status: 503 });
  }
  return NextResponse.json({ ok: true });
}
