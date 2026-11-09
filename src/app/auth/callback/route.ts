import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code"); const requested = request.nextUrl.searchParams.get("next");
  let next = "/dashboard";
  if (requested) { try { const destination = new URL(requested, request.url); if (destination.origin === new URL(request.url).origin && !destination.pathname.startsWith("/auth/")) next = `${destination.pathname}${destination.search}${destination.hash}`; } catch {} }
  if (code) { const supabase = await createClient(); const { error } = await supabase.auth.exchangeCodeForSession(code); if (!error) return NextResponse.redirect(new URL(next, request.url)); }
  return NextResponse.redirect(new URL("/sign-in?message=Could not verify your email. Request a new code.", request.url));
}
