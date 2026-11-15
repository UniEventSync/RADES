import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const { data: event } = await supabase.from("events").select("id,society_id,status").eq("id", id).maybeSingle();
  if (!event) return NextResponse.json({ error: "Event not found." }, { status: 404 });
  const [{ data: profile }, { data: membership }] = await Promise.all([
    supabase.from("profiles").select("global_role").eq("id", user.id).maybeSingle(),
    supabase.from("society_members").select("id").eq("society_id", event.society_id).eq("user_id", user.id).eq("status", "active").maybeSingle(),
  ]);
  const office = profile?.global_role === "office" || profile?.global_role === "super_admin";
  if (!office && !membership) return NextResponse.json({ error: "Society admin access required." }, { status: 403 });
  if (event.status !== "published") return NextResponse.json({ error: "Only published events can be unpublished." }, { status: 409 });
  const { error } = await supabase.from("events").update({ status: "draft", is_public: false }).eq("id", id);
  if (error) return NextResponse.json({ error: "Could not unpublish this event." }, { status: error.code === "42501" ? 403 : 400 });
  return NextResponse.json({ ok: true });
}
