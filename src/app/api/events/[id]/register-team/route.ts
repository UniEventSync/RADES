import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { STUDENT_EMAIL } from "@/lib/auth/email-rules";

type Context = { params: Promise<{ id: string }> };
const schema = z.object({
  teamName: z.string().trim().min(2).max(60).refine(value => !/[<>]/.test(value), "HTML markup is not allowed in a team name."),
  memberEmails: z.array(z.string().trim().email().max(254)).max(49),
  phone: z.string().trim().max(20).optional().default("").refine(value => !value || /^\+[1-9]\d{7,14}$/.test(value), "Enter a phone number in international format."),
});

export async function GET(_request: Request, { params }: Context) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to check registration availability." }, { status: 401 });
  const { data, error } = await supabase.rpc("get_registration_preflight", { p_event_id: id });
  if (error) return NextResponse.json({ error: error.message }, { status: error.code === "P0002" ? 404 : 400 });
  return NextResponse.json(data);
}

export async function POST(request: Request, { params }: Context) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to register your team." }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Enter your team details and try again." }, { status: 400 }); }
  const input = schema.safeParse(body);
  if (!input.success) return NextResponse.json({ error: input.error.issues[0]?.message ?? "Check the team details." }, { status: 400 });
  const emails = input.data.memberEmails.map(email => email.toLowerCase());
  if (emails.some(email => !STUDENT_EMAIL.test(email))) return NextResponse.json({ error: "Every teammate must use an IBA student email address." }, { status: 400 });
  if (new Set(emails).size !== emails.length) return NextResponse.json({ error: "Each teammate email must be unique." }, { status: 400 });
  const { data, error } = await supabase.rpc("register_team_for_event", {
    p_event_id: id, p_team_name: input.data.teamName, p_member_emails: emails, p_phone: input.data.phone || null,
  });
  if (error) {
    const status = error.code === "42501" ? 403 : error.code === "P0002" ? 404 : ["23505", "23P01", "23514"].includes(error.code ?? "") ? 409 : 400;
    return NextResponse.json({ error: error.message }, { status });
  }
  return NextResponse.json(data, { status: 201 });
}
