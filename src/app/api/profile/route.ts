import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isUploadedMediaUrl } from "@/lib/storage/media";

const profileInput = z.object({
  firstName: z.string().trim().min(1).max(60).optional(),
  lastName: z.string().trim().min(1).max(60).optional(),
  phone: z.string().trim().max(20).refine(value => !value || /^\+[1-9]\d{7,14}$/.test(value), "Enter a phone number in international format, such as +923001234567.").transform(value => value || null).optional(),
  avatarUrl: z.string().trim().url().refine(isUploadedMediaUrl).or(z.literal("")).optional(),
});

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to update your profile." }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Enter valid profile details." }, { status: 400 }); }
  const parsed = profileInput.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Enter a valid phone number." }, { status: 400 });

  const admin = createAdminClient();
  const { data: current, error: currentError } = await admin.from("profiles").select("avatar_url").eq("id", user.id).maybeSingle();
  if (currentError) {
    console.error("RADES could not load the current profile", currentError);
    return NextResponse.json({ error: "Your profile could not be loaded. Please try again." }, { status: 500 });
  }
  const updates: { phone?: string | null; first_name?: string; last_name?: string; avatar_url?: string | null } = {};
  if (parsed.data.phone !== undefined) updates.phone = parsed.data.phone;
  if (parsed.data.firstName !== undefined) updates.first_name = parsed.data.firstName;
  if (parsed.data.lastName !== undefined) updates.last_name = parsed.data.lastName;
  if (parsed.data.avatarUrl !== undefined) updates.avatar_url = parsed.data.avatarUrl || null;
  const { data, error } = await admin.from("profiles").update(updates).eq("id", user.id).select("id,phone,first_name,last_name,avatar_url").maybeSingle();
  if (error) {
    console.error("RADES profile update failed", { userId: user.id, code: error.code, message: error.message, details: error.details });
    return NextResponse.json({ error: "Your profile could not be saved. Please try again." }, { status: 400 });
  }
  if (!data) return NextResponse.json({ error: "Your RADES profile could not be found." }, { status: 404 });
  if (parsed.data.avatarUrl !== undefined && current?.avatar_url && current.avatar_url !== parsed.data.avatarUrl) {
    try {
      const oldUrl = new URL(current.avatar_url);
      const marker = "/storage/v1/object/public/rades-media/";
      const index = oldUrl.pathname.indexOf(marker);
      if (index >= 0) {
        const oldPath = decodeURIComponent(oldUrl.pathname.slice(index + marker.length));
        if (oldPath.startsWith(`profile-avatars/${user.id}/`)) await admin.storage.from("rades-media").remove([oldPath]);
      }
    } catch { /* The new profile value is already saved; orphan cleanup is best-effort. */ }
  }
  return NextResponse.json({ ok: true, phone: data.phone, firstName: data.first_name, lastName: data.last_name, avatarUrl: data.avatar_url ?? "" });
}
