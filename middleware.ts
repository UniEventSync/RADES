import { createServerClient, type SetAllCookies } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !publishableKey) return response;
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, publishableKey, {
    cookies: { getAll: () => request.cookies.getAll(), setAll: (cookies: Parameters<SetAllCookies>[0]) => { cookies.forEach(({ name,value }) => request.cookies.set(name,value)); response=NextResponse.next({request}); cookies.forEach(({name,value,options})=>response.cookies.set(name,value,options)); } },
  });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { const url=request.nextUrl.clone();url.pathname="/sign-in";url.searchParams.set("next",request.nextUrl.pathname);return NextResponse.redirect(url); }
  if (request.nextUrl.pathname.startsWith("/office")) {
    const { data: profile }=await supabase.from("profiles").select("global_role").eq("id",user.id).maybeSingle();
    if(!profile||!["office","super_admin"].includes(profile.global_role)) return new NextResponse("OSSIE access required.", { status: 403, headers: { "content-type": "text/plain; charset=utf-8" } });
  }
  return response;
}

export const config = { matcher: ["/home/:path*", "/office/:path*"] };
