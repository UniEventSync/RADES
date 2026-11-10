import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const authRoutes = ["/sign-in", "/sign-up", "/forgot-password", "/reset-password", "/verify-email"];

export default async function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const requestHeaders = await headers();
      const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
      const referer = requestHeaders.get("referer");
      let returnPath = "/";
      if (host && referer) {
        try {
          const previous = new URL(referer);
          if (previous.host === host && !authRoutes.includes(previous.pathname)) returnPath = previous.pathname + previous.search;
        } catch {}
      }
      redirect(returnPath);
    }
  }
  return children;
}
