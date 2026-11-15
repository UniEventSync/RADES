import { NextResponse } from "next/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const admin = () => createSupabaseAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, (process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY)!, { auth: { autoRefreshToken: false, persistSession: false } });

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "OSSIE access required." }, { status: 403 });
  const { data: actor } = await supabase.from("profiles").select("global_role").eq("id", user.id).maybeSingle();
  if (!actor || !["office", "super_admin"].includes(actor.global_role)) return NextResponse.json({ error: "OSSIE access required." }, { status: 403 });

  const parsed = z.object({ email: z.string().trim().email(), role: z.enum(["panelist", "patron"]), societyId: z.string().uuid().optional(), replacing: z.boolean().optional() }).safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Enter a valid email address." }, { status: 400 });
  const email = parsed.data.email.toLowerCase();
  const { role, societyId } = parsed.data;
  const client = admin();
  const { data: profile, error: profileError } = await client.from("profiles").select("id,account_type").eq("email", email).maybeSingle();
  if (profileError) return NextResponse.json({ error: "Could not verify this IBA account. Try again." }, { status: 500 });
  if (profile && role === "panelist" && profile.account_type !== "student") return NextResponse.json({ error: "Society admins must have student accounts." }, { status: 400 });
  if (profile && role === "patron" && profile.account_type !== "faculty") return NextResponse.json({ error: "Society patrons must have faculty accounts." }, { status: 400 });
  const validEmail = role === "patron" ? /^[a-z0-9]+@iba\.edu\.pk$/i.test(email) : /^[a-z]+\.[a-z]+\.\d{5}@khi\.iba\.edu\.pk$/i.test(email);
  if (!validEmail) return NextResponse.json({ error: role === "patron" ? "Enter a faculty email in the format name@iba.edu.pk." : "Enter a student email in the format firstname.lastname.ERP@khi.iba.edu.pk." }, { status: 400 });

  if (profile && role === "panelist") {
    const { data: active } = await client.from("society_members").select("society_id").eq("user_id", profile.id).eq("status", "active").maybeSingle();
    if (active) return NextResponse.json({ error: societyId && active.society_id === societyId ? "This student is already an active admin of this society." : "A student can be an admin for only one society at a time." }, { status: 409 });
    if (societyId) {
      const { count, error } = await client.from("society_members").select("id", { count: "exact", head: true }).eq("society_id", societyId).eq("status", "active");
      if (error) return NextResponse.json({ error: "Could not check the society admin limit. Try again." }, { status: 500 });
      if ((count ?? 0) >= 3 && !parsed.data.replacing) return NextResponse.json({ error: "This society already has the maximum of three active admins." }, { status: 409 });
    }
  }
  if (profile && role === "patron") {
    const { data: existing } = await client.from("society_patrons").select("society_id").eq("user_id", profile.id).maybeSingle();
    if (existing) return NextResponse.json({ error: societyId && existing.society_id === societyId ? "This faculty member is already the patron of this society." : "A faculty patron can be assigned to only one society at a time." }, { status: 409 });
  }
  if (societyId && role === "patron") {
    const { count, error } = await client.from("society_patrons").select("id", { count: "exact", head: true }).eq("society_id", societyId);
    if (error) return NextResponse.json({ error: "Could not check the society patron assignment. Try again." }, { status: 500 });
    if ((count ?? 0) >= 1 && !parsed.data.replacing) return NextResponse.json({ error: "This society already has a faculty patron. Remove the current patron before adding another." }, { status: 409 });
  }
  return NextResponse.json({ ok: true, invitationRequired: !profile });
}
