import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
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
  return NextResponse.json({ ok: true });
}
