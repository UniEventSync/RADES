import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { deriveStudentIdentity, emailSchema, getAccountType } from "@/lib/auth/email-rules";
import { z } from "zod";

const bodySchema = z.object({ email: z.string(), password: z.string().min(10).max(128), firstName: z.string().trim().min(1).max(60), lastName: z.string().trim().min(1).max(60) });
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
    const supabase = await createClient();
    const { error } = await supabase.auth.signUp({
      email, password: parsed.data.password,
      options: { emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin}/auth/callback?next=/home`, data: { first_name: parsed.data.firstName || derived?.firstName, last_name: parsed.data.lastName || derived?.lastName, account_type: accountType, erp_number: derived?.erpNumber ?? null } },
    });
    if (error) return NextResponse.json({ error: error.message.includes("already registered") ? "An account already exists for this email. Sign in instead." : error.message }, { status: 400 });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch { return NextResponse.json({ error: "Authentication is not configured. Add your Supabase environment keys and try again." }, { status: 503 }); }
}
