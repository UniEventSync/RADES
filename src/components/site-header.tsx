"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import { LogOut, Menu, X, CircleUserRound, ChevronDown } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

function AccountAvatar({ url }: { url: string }) {
  return <span aria-hidden="true" className="relative inline-flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full">
    {url ? <Image src={url} alt="" fill unoptimized sizes="24px" className="object-cover"/> : <CircleUserRound size={17}/>}
  </span>;
}

export function SiteHeader() {
  const [email, setEmail] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [hasSocietyAdminAccess, setHasSocietyAdminAccess] = useState(false);
  const [hasSocietyPatronAccess, setHasSocietyPatronAccess] = useState(false);
  const [open, setOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDetailsElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;
    const supabase = createClient();
    const loadAccess = async (userId: string) => { const [{ data: profile }, { data: memberships }, { data: patrons }] = await Promise.all([supabase.from("profiles").select("global_role,avatar_url,first_name,last_name").eq("id", userId).maybeSingle(), supabase.from("society_members").select("id").eq("user_id", userId).eq("status", "active").limit(1), supabase.from("society_patrons").select("id").eq("user_id", userId).limit(1)]); setRole(profile?.global_role ?? "user"); setAvatarUrl(profile?.avatar_url ?? ""); setDisplayName([profile?.first_name, profile?.last_name].filter(Boolean).join(" ")); setHasSocietyAdminAccess(Boolean(memberships?.length)); setHasSocietyPatronAccess(Boolean(patrons?.length)); };
    supabase.auth.getUser().then(async ({ data }) => { setEmail(data.user?.email ?? null); if (data.user) await loadAccess(data.user.id); else { setRole(null); setDisplayName(""); setAvatarUrl(""); setHasSocietyAdminAccess(false); setHasSocietyPatronAccess(false); } });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => { setEmail(session?.user.email ?? null); if (session?.user) queueMicrotask(() => { void loadAccess(session.user.id); }); else { setRole(null); setDisplayName(""); setAvatarUrl(""); setHasSocietyAdminAccess(false); setHasSocietyPatronAccess(false); } });
    return () => listener.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    const updateProfile = (event: Event) => {
      const detail = (event as CustomEvent<{ avatarUrl: string; firstName?: string; lastName?: string }>).detail;
      setAvatarUrl(detail.avatarUrl);
      if (detail.firstName !== undefined || detail.lastName !== undefined) setDisplayName([detail.firstName, detail.lastName].filter(Boolean).join(" "));
    };
    window.addEventListener("rades-profile-updated", updateProfile);
    return () => window.removeEventListener("rades-profile-updated", updateProfile);
  }, []);
  useEffect(() => {
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (event.target instanceof Node && !accountMenuRef.current?.contains(event.target)) {
        accountMenuRef.current?.removeAttribute("open");
      }
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, []);
  const signOut = async () => { await createClient().auth.signOut(); setEmail(null); setDisplayName(""); setRole(null); setAvatarUrl(""); setHasSocietyAdminAccess(false); setHasSocietyPatronAccess(false); setOpen(false); router.push("/"); router.refresh(); };
  const authPage = ["/sign-in", "/sign-up", "/forgot-password", "/reset-password", "/verify-email"].includes(pathname);
  const adminPage = pathname === "/admin" || pathname.startsWith("/admin/");
  const eventDetailsPage = pathname.startsWith("/events/");
  const office = role === "office" || role === "super_admin";
  const accountLabel = displayName || email?.split("@")[0] || "Account";
  const links = <>{email && <Link href="/" onClick={() => setOpen(false)}>Home</Link>}<Link href="/events" onClick={() => setOpen(false)}>Explore Events</Link><Link href="/societies" onClick={() => setOpen(false)}>Explore Societies</Link>{email && office && <Link href="/dashboard" onClick={() => setOpen(false)}>Workspace</Link>}{email && hasSocietyAdminAccess && <Link href="/admin" onClick={() => setOpen(false)}>Workspace</Link>}{email && !office && !hasSocietyAdminAccess && hasSocietyPatronAccess && <Link href="/dashboard" onClick={() => setOpen(false)}>Workspace</Link>}</>;
  if (adminPage) return null;
  return <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
    <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8">
      <Link className="flex items-center gap-3" href="/" aria-label="RADES home"><Image src="/Icon.png" alt="RADES" width={56} height={56} priority className="h-12 w-12 object-contain" /><span><strong className="block text-lg leading-5 tracking-tight">RADES</strong><span className="text-[10px] font-semibold uppercase tracking-[.16em] text-slate-500">IBA Karachi</span></span></Link>
      {pathname === "/sign-in" ? null : <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">{authPage ? pathname === "/sign-up" ? <><Link href="/sign-in">Sign In</Link><a href="mailto:ossie@iba.edu.pk">Help</a></> : pathname === "/forgot-password" || pathname === "/reset-password" ? <Link href="/sign-in">Back to Sign In</Link> : null : eventDetailsPage ? <>{links}<Link href="/events">← Back to Events</Link></> : links}</nav>}
      <div className="hidden items-center gap-3 md:flex"><ThemeToggle />{!authPage && (email ? <details ref={accountMenuRef} className="relative"><summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:border-slate-300"><AccountAvatar url={avatarUrl}/><span className="max-w-40 truncate">{accountLabel}</span><ChevronDown size={14} className="text-slate-500"/></summary><div className="absolute right-0 z-40 mt-2 w-52 rounded-xl border border-slate-200 bg-white p-2 shadow-lg"><Link href="/profile" onClick={() => accountMenuRef.current?.removeAttribute("open")} className="block rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-slate-50">View profile</Link><div className="my-1 border-t border-slate-100"/><button onClick={signOut} className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"><LogOut size={16}/>Sign out</button></div></details> : <Link href="/sign-in" className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Sign In</Link>)}</div>
      <div className="flex items-center gap-2 md:hidden"><ThemeToggle />{eventDetailsPage && <Link href="/events" className="text-sm font-semibold text-blue-700">← Back to Events</Link>}{(!authPage || pathname === "/sign-up") && <button className="rounded-lg p-2 text-slate-700" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>}</div>
    </div>
    {open && <nav className="flex flex-col gap-4 border-t border-slate-100 bg-white px-5 py-5 text-sm font-medium text-slate-700 md:hidden">{authPage ? <>{pathname === "/sign-up" && <><Link href="/sign-in">Sign In</Link><a href="mailto:ossie@iba.edu.pk">Help</a></>}{(pathname === "/forgot-password" || pathname === "/reset-password") && <Link href="/sign-in">Back to Sign In</Link>}</> : <>{links}{email && <div className="border-t border-slate-100 pt-4"/>}{email && <Link href="/profile" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 hover:bg-slate-50">View profile</Link>}{email ? <button onClick={signOut} className="flex items-center gap-2 rounded-lg px-3 py-2 text-left text-slate-700 hover:bg-slate-50"><LogOut size={16}/>Sign out</button> : <Link href="/sign-in">Sign In</Link>}</>}</nav>}
  </header>;
}
