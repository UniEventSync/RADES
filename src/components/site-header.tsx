"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import { LogOut, Menu, X } from "lucide-react";

export function SiteHeader() {
  const [email, setEmail] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;
    const supabase = createClient();
    const loadRole = async (userId: string) => { const { data: profile } = await supabase.from("profiles").select("global_role").eq("id", userId).maybeSingle(); setRole(profile?.global_role ?? "user"); };
    supabase.auth.getUser().then(async ({ data }) => { setEmail(data.user?.email ?? null); if (data.user) await loadRole(data.user.id); });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => { setEmail(session?.user.email ?? null); if (session?.user) queueMicrotask(() => { void loadRole(session.user.id); }); else setRole(null); });
    return () => listener.subscription.unsubscribe();
  }, []);
  const signOut = async () => { await createClient().auth.signOut(); setEmail(null); router.push("/"); router.refresh(); };
  const links = <><Link href="/events" onClick={() => setOpen(false)}>Events</Link>{email && <Link href="/home" onClick={() => setOpen(false)}>My home</Link>}{email && (role === "office" || role === "super_admin") && <Link href="/office" onClick={() => setOpen(false)}>OSSIE workspace</Link>}</>;
  return <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
    <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8">
      <Link className="flex items-center gap-3" href="/" aria-label="RADES home"><Image src="/Icon.png" alt="RADES" width={56} height={56} priority className="h-12 w-12 object-contain"/><span><strong className="block text-lg leading-5 tracking-tight">RADES</strong><span className="text-[10px] font-semibold uppercase tracking-[.16em] text-slate-500">IBA Karachi</span></span></Link>
      <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">{links}</nav>
      <div className="hidden items-center gap-3 md:flex">{email ? <><span className="max-w-52 truncate text-sm text-slate-500">{email}</span><button onClick={signOut} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold hover:bg-slate-50"><LogOut size={15}/> Sign out</button></> : <><Link href="/sign-in" className="px-3 py-2 text-sm font-semibold text-slate-700">Sign in</Link><Link href="/sign-up" className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">Create account</Link></>}</div>
      <button className="rounded-lg p-2 text-slate-700 md:hidden" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen(!open)}>{open ? <X/> : <Menu/>}</button>
    </div>
    {open && <nav className="flex flex-col gap-5 border-t border-slate-100 bg-white px-5 py-5 text-sm font-medium text-slate-700 md:hidden">{links}{email ? <button onClick={signOut} className="text-left">Sign out</button> : <><Link href="/sign-in">Sign in</Link><Link href="/sign-up">Create account</Link></>}</nav>}
  </header>;
}

