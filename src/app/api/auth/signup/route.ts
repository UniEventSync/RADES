import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { deriveStudentIdentity, emailSchema, getAccountType } from "@/lib/auth/email-rules";
import { z } from "zod";
const bodySchema = z.object({ email: z.string(), password: z.string().min(10).max(128), firstName: z.string().trim().min(1).max(60), lastName: z.string().trim().min(1).max(60), phone: z.string().trim().max(20).refine(value => !value || /^\+[1-9]\d{7,14}$/.test(value), "Enter a phone number in international format.").optional().default(""), accountType: z.enum(["student", "faculty"]).optional() });
export async function POST(request: Request) {
  try {
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid signup details." }, { status: 400 });
    const email = parsed.data.email.trim().toLowerCase();
    if (email === process.env.OSSIE_EMAIL?.trim().toLowerCase()) return NextResponse.json({ error: "This address is reserved for the RADES OSSIE account." }, { status: 400 });
    const validEmail = emailSchema.safeParse(email);
    if (!validEmail.success) return NextResponse.json({ error: "Only IBA student and faculty email addresses can be used with RADES." }, { status: 400 });
    const accountType = getAccountType(email)!;
    const derived = deriveStudentIdentity(email);
    const { data: existingProfile, error: existingProfileError } = await createAdminClient().from("profiles").select("id").eq("email", email).maybeSingle();
    if (existingProfileError) {
      console.error("RADES could not check for an existing signup account", existingProfileError);
      return NextResponse.json({ error: "Could not verify whether an account already exists. Try again shortly." }, { status: 503 });
    }
    if (existingProfile) return NextResponse.json({ error: "An account already exists for this email. Sign in instead." }, { status: 400 });
    const supabase = await createClient();
    const { error } = await supabase.auth.signUp({
      email, password: parsed.data.password,
      options: { emailRedirectTo: `${process.env.APP_URL ?? new URL(request.url).origin}/auth/callback`, data: { first_name: parsed.data.firstName || derived?.firstName, last_name: parsed.data.lastName || derived?.lastName, phone: parsed.data.phone || null, account_type: accountType, erp_number: derived?.erpNumber ?? null } },
    });
    if (error) {
      const errorMessage = error.message.toLowerCase();
      const duplicateAccount = ["user_already_exists", "email_exists"].includes((error.code ?? "").toLowerCase())
        || errorMessage.includes("already registered")
        || errorMessage.includes("already exists");
      const confirmationEmailFailure = errorMessage.includes("error sending confirmation email") || errorMessage.includes("smtp");
      const message = duplicateAccount
        ? "An account already exists for this email. Sign in instead."
        : confirmationEmailFailure
          ? "Signup is temporarily unavailable because Supabase could not send the confirmation email. Configure Supabase Auth SMTP and try again."
        : error.code === "23514" || error.code === "23503"
          ? `The account could not be created because the database rejected its profile (${error.message}). Check the profile trigger/schema migration.`
          : `Supabase signup failed (${error.code ?? error.status ?? "unknown"}): ${error.message}`;
      return NextResponse.json({ error: message, code: error.code ?? null }, { status: confirmationEmailFailure ? 503 : 400 });
    }
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch { return NextResponse.json({ error: "Authentication is not configured. Add your Supabase environment keys and try again." }, { status: 503 }); }
}
