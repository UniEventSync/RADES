import { NextResponse } from "next/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isUploadedMediaUrl } from "@/lib/storage/media";

const societyFields = {
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(2000).default(""),
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
  const input = z.object({ ...societyFields, patronEmail: z.string().trim().email(), logoUrl:z.string().url().refine(isUploadedMediaUrl).optional().or(z.literal("")),facebookUrl:social,linkedinUrl:social,instagramUrl:social }).safeParse(await request.json()); if (!input.success) return NextResponse.json({ error: input.error.issues[0]?.message }, { status: 400 });
  const patronEmail = input.data.patronEmail.toLowerCase();
  if (!/^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*@iba\.edu\.pk$/i.test(patronEmail)) return NextResponse.json({ error: "Societies need a faculty patron with an IBA faculty email." }, { status: 400 });
  const adminClient = admin();
  const { data: profile, error: profileError } = await adminClient.from("profiles").select("id,account_type").eq("email",patronEmail).maybeSingle();
  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 400 });
  let patronId = profile?.id;
  if (profile && profile.account_type !== "faculty") return NextResponse.json({ error: "The society patron must have a faculty account." }, { status: 400 });
  if (!patronId) {
    const { data: invited, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(patronEmail,{redirectTo:`${process.env.NEXT_PUBLIC_APP_URL??"http://localhost:3000"}/auth/callback`});
    if (inviteError) return NextResponse.json({ error: inviteError.message }, { status: 400 });
    patronId=invited.user.id;
  }
  const { data, error } = await auth.supabase.rpc("create_society_with_patron",{society_name:input.data.name,society_slug:input.data.slug,society_description:input.data.description,society_contact_email:input.data.contactEmail||null,patron_profile_id:patronId,society_logo_url:input.data.logoUrl||null,society_facebook_url:input.data.facebookUrl||null,society_linkedin_url:input.data.linkedinUrl||null,society_instagram_url:input.data.instagramUrl||null});
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
  if (!userId && body.data.action === "assign") {
    const allowed = body.data.role === "patron" ? /^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*@iba\.edu\.pk$/i.test(email) : /^[a-z]+\.[a-z]+\.\d{5}@khi\.iba\.edu\.pk$/i.test(email);
    if (!allowed) return NextResponse.json({ error: body.data.role === "patron" ? "Patrons need an IBA faculty email." : "Society admins need an IBA student email." }, { status: 400 });
    const { data: invited, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/auth/callback` });
    if (inviteError) return NextResponse.json({ error: inviteError.message }, { status: 400 }); userId = invited.user.id;
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
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    } else {
      const { error } = await adminClient.from("society_patrons").upsert({ society_id: body.data.societyId, user_id: userId, assigned_by: auth.user.id }, { onConflict: "society_id,user_id" });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }
  return NextResponse.json({ ok: true });
}
