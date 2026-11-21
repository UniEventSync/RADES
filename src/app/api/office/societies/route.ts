import { NextResponse } from "next/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isUploadedMediaUrl } from "@/lib/storage/media";

const societyFields = {
  name: z.string().trim().min(2).max(100).refine(value => !/[<>]/.test(value), "HTML markup is not allowed."),
  description: z.string().trim().max(2000).refine(value => !/[<>]/.test(value), "HTML markup is not allowed.").default(""),
  contactEmail: z.string().trim().email().optional().or(z.literal("")),
  slug: z.string().trim().min(2).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
};
const admin = () => createSupabaseAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, (process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY)!, { auth: { autoRefreshToken: false, persistSession: false } });
async function officeUser() {
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("global_role").eq("id", user.id).maybeSingle();
  return profile && ["office", "super_admin"].includes(profile.global_role) ? { user, supabase } : null;
}
export async function GET() {
  const auth = await officeUser(); if (!auth) return NextResponse.json({ error: "OSSIE access required." }, { status: 403 });
  const { data, error } = await admin().from("societies").select("*, society_members(id,user_id,role,status,profiles!society_members_user_id_fkey(email,first_name,last_name)), society_patrons(id,user_id,profiles!society_patrons_user_id_fkey(email,first_name,last_name))").order("name");
  if (error) return NextResponse.json({ error: error.message }, { status: 400 }); return NextResponse.json({ societies: data });
}

export async function PATCH(request: Request) {
  const auth = await officeUser(); if (!auth) return NextResponse.json({ error: "OSSIE access required." }, { status: 403 });
  const parsed = z.object({ societyId: z.string().uuid(), ...societyFields, isActive: z.boolean() }).safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  const { societyId, name, description, slug, contactEmail, isActive } = parsed.data;
  const { data, error } = await admin().from("societies").update({ name, description, slug, contact_email: contactEmail || null, is_active: isActive }).eq("id", societyId).select("id,name,slug,description,contact_email,is_active").maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!data) return NextResponse.json({ error: "Society not found." }, { status: 404 });
  return NextResponse.json({ society: data });
}
export async function POST(request: Request) {
  const auth = await officeUser(); if (!auth) return NextResponse.json({ error: "OSSIE access required." }, { status: 403 });
  const social=z.string().url().refine(value=>/^https?:\/\//i.test(value)).optional().or(z.literal(""));
  const input = z.object({ ...societyFields, logoUrl:z.string().url().refine(isUploadedMediaUrl).optional().or(z.literal("")),facebookUrl:social,linkedinUrl:social,instagramUrl:social }).safeParse(await request.json()); if (!input.success) return NextResponse.json({ error: input.error.issues[0]?.message }, { status: 400 });
  const { data, error } = await admin().from("societies").insert({ name: input.data.name, slug: input.data.slug, description: input.data.description, contact_email: input.data.contactEmail || null, logo_url: input.data.logoUrl || null, facebook_url: input.data.facebookUrl || null, linkedin_url: input.data.linkedinUrl || null, instagram_url: input.data.instagramUrl || null, created_by: auth.user.id }).select("id,name,slug,description,contact_email,is_active,logo_url").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ society: data }, { status: 201 });
}

export async function PUT(request: Request) {
  const auth = await officeUser(); if (!auth) return NextResponse.json({ error: "OSSIE access required." }, { status: 403 });
  const body = z.object({ societyId: z.string().uuid(), email: z.string().email(), role: z.enum(["panelist", "patron"]), action: z.enum(["assign", "remove"]).default("assign") }).safeParse(await request.json());
  if (!body.success) return NextResponse.json({ error: body.error.issues[0]?.message }, { status: 400 });
  const email = body.data.email.trim().toLowerCase();
  const adminClient = admin();
  const { data: profile, error: profileError } = await adminClient.from("profiles").select("id,account_type,email").eq("email", email).maybeSingle();
  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 400 });
  let userId = profile?.id;
  if (body.data.action === "assign") {
    if (profile && body.data.role === "panelist" && profile.account_type !== "student") return NextResponse.json({ error: "Society admins must have student accounts." }, { status: 400 });
    if (profile && body.data.role === "patron" && profile.account_type !== "faculty") return NextResponse.json({ error: "Society patrons must have faculty accounts." }, { status: 400 });
    const roleEmailValid = body.data.role === "patron"
      ? /^[a-z0-9]+@iba\.edu\.pk$/i.test(email)
      : /^[a-z]+\.[a-z]+\.\d{5}@khi\.iba\.edu\.pk$/i.test(email);
    if (!roleEmailValid) return NextResponse.json({ error: body.data.role === "patron" ? "Enter a faculty email in the format name@iba.edu.pk." : "Enter a student email in the format firstname.lastname.ERP@khi.iba.edu.pk." }, { status: 400 });
    if (body.data.role === "panelist") {
      const [{ data: existing }, { count, error: countError }] = await Promise.all([
        userId ? adminClient.from("society_members").select("society_id,status").eq("user_id", userId).eq("status", "active").maybeSingle() : Promise.resolve({ data: null, error: null }),
        adminClient.from("society_members").select("id", { count: "exact", head: true }).eq("society_id", body.data.societyId).eq("status", "active"),
      ]);
      if (countError) return NextResponse.json({ error: "Could not validate the society admin limit." }, { status: 500 });
      if (existing && existing.society_id !== body.data.societyId) return NextResponse.json({ error: "A student can be an admin for only one society at a time." }, { status: 409 });
      if ((count ?? 0) >= 3 && existing?.society_id !== body.data.societyId) return NextResponse.json({ error: "This society already has the maximum of three active admins." }, { status: 409 });
    } else {
      const [{ data: existing }, { count, error: countError }] = await Promise.all([
        userId ? adminClient.from("society_patrons").select("society_id").eq("user_id", userId).maybeSingle() : Promise.resolve({ data: null, error: null }),
        adminClient.from("society_patrons").select("id", { count: "exact", head: true }).eq("society_id", body.data.societyId),
      ]);
      if (countError) return NextResponse.json({ error: "Could not validate the patron assignment." }, { status: 500 });
      if (existing && existing.society_id !== body.data.societyId) return NextResponse.json({ error: "A faculty patron can be assigned to only one society at a time." }, { status: 409 });
      if ((count ?? 0) >= 1 && existing?.society_id !== body.data.societyId) return NextResponse.json({ error: "This society already has a faculty patron." }, { status: 409 });
    }

    if (!userId) {
      const { data: invited, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, { redirectTo: `${process.env.APP_URL ?? "http://localhost:3000"}/auth/callback` });
      if (inviteError) return NextResponse.json({ error: inviteError.message }, { status: 400 });
      userId = invited.user.id;
    }
  }
  if (!userId) return NextResponse.json({ error: "This email has no RADES account to remove." }, { status: 404 });
  if (body.data.action === "remove") {
    const query = body.data.role !== "patron"
      ? adminClient.from("society_members").update({ status: "removed" }).eq("society_id", body.data.societyId).eq("user_id", userId)
      : adminClient.from("society_patrons").delete().eq("society_id", body.data.societyId).eq("user_id", userId);
    const { error } = await query; if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  } else {
    if (body.data.role !== "patron" && profile && profile.account_type !== "student") return NextResponse.json({ error: "Society admins must have student accounts." }, { status: 400 });
    if (body.data.role === "patron" && profile && profile.account_type !== "faculty") return NextResponse.json({ error: "Society patrons must have faculty accounts." }, { status: 400 });
    if (body.data.role !== "patron") {
      const { error } = await adminClient.from("society_members").upsert({ society_id: body.data.societyId, user_id: userId, role: body.data.role, status: "active", added_by: auth.user.id }, { onConflict: "society_id,user_id" });
      if (error) return NextResponse.json({ error: error.code === "23505" ? "This student already has an active society admin assignment." : error.code === "23514" ? "This society already has the maximum of three active admins." : error.message }, { status: error.code === "23505" || error.code === "23514" ? 409 : 400 });
    } else {
      const { error } = await adminClient.from("society_patrons").upsert({ society_id: body.data.societyId, user_id: userId, assigned_by: auth.user.id }, { onConflict: "society_id,user_id" });
      if (error) return NextResponse.json({ error: error.code === "23505" ? "This patron is already assigned or the society already has a patron." : error.message }, { status: error.code === "23505" ? 409 : 400 });
    }
  }
  return NextResponse.json({ ok: true, invited: body.data.action === "assign" && !profile, email });
}
