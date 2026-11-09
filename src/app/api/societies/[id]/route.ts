import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isUploadedMediaUrl } from "@/lib/storage/media";

const socialUrl = z.union([z.string().url().refine(value=>/^https?:\/\//i.test(value)),z.literal("")]).optional();
const profileSchema = z.object({
  description: z.string().trim().max(2000),
  contact_email: z.union([z.string().trim().email(), z.literal("")]),
  logo_url: z.union([z.string().url().refine(isUploadedMediaUrl),z.literal("")]).optional(),
  facebook_url:socialUrl, linkedin_url:socialUrl, instagram_url:socialUrl,
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = profileSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid profile." }, { status: 400 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to update this society." }, { status: 401 });
  const { data: membership } = await supabase.from("society_members").select("id").eq("society_id", id).eq("user_id", user.id).eq("status", "active").maybeSingle();
  if (!membership) return NextResponse.json({ error: "An active society panelist account is required." }, { status: 403 });
  const { data, error } = await supabase.from("societies").update({ ...parsed.data, contact_email: parsed.data.contact_email || null,logo_url:parsed.data.logo_url||null,facebook_url:parsed.data.facebook_url||null,linkedin_url:parsed.data.linkedin_url||null,instagram_url:parsed.data.instagram_url||null }).eq("id", id).select("id,name,slug,description,contact_email,logo_url,facebook_url,linkedin_url,instagram_url").maybeSingle();
  if (error) return NextResponse.json({ error: error.code === "23505" ? "That society URL is already in use." : error.message }, { status: 400 });
  if (!data) return NextResponse.json({ error: "Society could not be updated." }, { status: 404 });
  return NextResponse.json({ society: data });
}
