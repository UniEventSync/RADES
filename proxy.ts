import { createServerClient, type SetAllCookies } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up") || pathname.startsWith("/forgot-password") || pathname.startsWith("/reset-password") || pathname.startsWith("/verify-email") || pathname.startsWith("/auth/callback") || pathname === "/api/auth/signup") return NextResponse.next();
  if (pathname === "/" || pathname === "/home" || pathname === "/events" || pathname.startsWith("/events/") || pathname === "/societies" || pathname.startsWith("/societies/")) return NextResponse.next();
  let response = NextResponse.next({ request });
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !publishableKey) {
    if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    const url = request.nextUrl.clone(); url.pathname = "/sign-in"; url.searchParams.set("next", `${pathname}${request.nextUrl.search}`); return NextResponse.redirect(url);
  }
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, publishableKey, {
    cookies: { getAll: () => request.cookies.getAll(), setAll: (cookies: Parameters<SetAllCookies>[0]) => { cookies.forEach(({ name,value }) => request.cookies.set(name,value)); response=NextResponse.next({request}); cookies.forEach(({name,value,options})=>response.cookies.set(name,value,options)); } },
  });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    const url=request.nextUrl.clone();url.pathname="/sign-in";url.searchParams.set("next", `${pathname}${request.nextUrl.search}`);return NextResponse.redirect(url);
  }
  if (pathname.startsWith("/office")) {
    const { data: profile }=await supabase.from("profiles").select("global_role").eq("id",user.id).maybeSingle();
    if(!profile||!["office","super_admin"].includes(profile.global_role)) return new NextResponse("OSSIE access required.", { status: 403, headers: { "content-type": "text/plain; charset=utf-8" } });
  }
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const [{ data: profile }, { data: memberships }] = await Promise.all([
      supabase.from("profiles").select("global_role").eq("id", user.id).maybeSingle(),
      supabase.from("society_members").select("society_id").eq("user_id", user.id).eq("status", "active"),
    ]);
    const office = profile && ["office", "super_admin"].includes(profile.global_role);
    const eventId = pathname.match(/^\/admin\/events\/([^/]+)\/(?:analytics|cancel)$/)?.[1];
    if (eventId) {
      const { data: event } = await supabase.from("events").select("society_id").eq("id", eventId).maybeSingle();
      if (!event || (!office && !memberships?.some(member => member.society_id === event.society_id))) return new NextResponse("Society admin access required.", { status: 403, headers: { "content-type": "text/plain; charset=utf-8" } });
    } else if (!office && !memberships?.length) {
      return new NextResponse("Society admin access required.", { status: 403, headers: { "content-type": "text/plain; charset=utf-8" } });
    }
  }
  return response;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|Icon.png).*)"] };
