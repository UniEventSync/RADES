import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const profileInput = z.object({
  phone: z.string().trim().max(20).refine(value => !value || /^\+[1-9]\d{7,14}$/.test(value), "Enter a phone number in international format, such as +923001234567.").transform(value => value || null),
});

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to update your profile." }, { status: 401 });

  const parsed = profileInput.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Enter a valid phone number." }, { status: 400 });

  const { data, error } = await supabase.from("profiles").update({ phone: parsed.data.phone }).eq("id", user.id).select("id").maybeSingle();
  if (error) return NextResponse.json({ error: "Your profile could not be saved. Please try again." }, { status: 400 });
  if (!data) return NextResponse.json({ error: "Your RADES profile could not be found." }, { status: 404 });
  return NextResponse.json({ ok: true, phone: parsed.data.phone });
}
