import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { STUDENT_EMAIL } from "@/lib/auth/email-rules";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to verify teammates." }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Enter a valid student email." }, { status: 400 }); }
  const parsed = z.object({ email: z.string().trim().email().max(254) }).safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid student email." }, { status: 400 });
  const email = parsed.data.email.toLowerCase();
  if (!STUDENT_EMAIL.test(email)) return NextResponse.json({ error: "Use an IBA student email address." }, { status: 400 });
  const { data: leader } = await supabase.from("profiles").select("email").eq("id", user.id).maybeSingle();
  if (leader?.email?.toLowerCase() === email) return NextResponse.json({ error: "You are already included as the team leader." }, { status: 400 });
  const admin = createAdminClient();
  const { data: profile, error } = await admin.from("profiles").select("id,first_name,last_name,account_type,email").eq("email", email).maybeSingle();
  if (error) return NextResponse.json({ error: "Could not verify this student account. Try again." }, { status: 503 });
  if (!profile || profile.account_type !== "student") return NextResponse.json({ error: "This email is not registered as an IBA student in RADES." }, { status: 404 });
  const { data: authUser, error: authError } = await admin.auth.admin.getUserById(profile.id);
  if (authError || !authUser.user?.email_confirmed_at) return NextResponse.json({ error: "This student must verify their RADES email before joining a team." }, { status: 409 });
  return NextResponse.json({ email, firstName: profile.first_name, lastName: profile.last_name });
}
