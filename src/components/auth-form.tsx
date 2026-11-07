"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { deriveStudentIdentity, emailSchema, loginEmailSchema } from "@/lib/auth/email-rules";
import { Check, Eye, EyeOff, LoaderCircle } from "lucide-react";

type Mode = "signup" | "signin" | "forgot" | "reset" | "verify";
const field = "mt-1.5 h-11 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-700 focus:ring-4 focus:ring-blue-100";
const button = "flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60";
const safeNext = (value?: string) => {
  if (!value?.startsWith("/")) return null;
  try { const url = new URL(value, window.location.origin); return url.origin === window.location.origin && !url.pathname.startsWith("/auth/") ? `${url.pathname}${url.search}${url.hash}` : null; }
  catch { return null; }
};

export function AuthForm({ mode, initialEmail = "", nextPath }: { mode: Mode; initialEmail?: string; nextPath?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail); const [fullName, setFullName] = useState(""); const [phone, setPhone] = useState("");
  const [password, setPassword] = useState(""); const [confirm, setConfirm] = useState(""); const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const [notice, setNotice] = useState("");
  const getSupabase = () => { if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) throw new Error("Authentication is not configured yet. Add your Supabase keys to .env.local."); return createClient(); };
  const setResult = (message: string) => { setError(message); setBusy(false); };
  const validateEmail = () => { const result = (mode === "signup" ? emailSchema : loginEmailSchema).safeParse(email); if (!result.success) { setResult(result.error.issues[0]?.message ?? "Enter a valid email address."); return false; } return true; };
  const destination = async (supabase: ReturnType<typeof createClient>) => {
    const requested = safeNext(nextPath); if (requested) return requested;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return "/events";
    const { data: profile } = await supabase.from("profiles").select("account_type,global_role").eq("id", user.id).maybeSingle();
    if (profile?.global_role === "office" || profile?.global_role === "super_admin" || profile?.account_type === "faculty" || profile?.account_type === "developer") return "/home";
    const { data: memberships } = await supabase.from("society_members").select("id").eq("user_id", user.id).eq("status", "active").limit(1);
    return memberships?.length ? "/admin" : "/events";
  };
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError(""); setNotice(""); setBusy(true);
    if (["signup", "signin", "forgot"].includes(mode) && !validateEmail()) return;
    try {
      const supabase = getSupabase();
      if (mode === "signup") {
        const names = fullName.trim().split(/\s+/).filter(Boolean);
        if (names.length < 2) return setResult("Enter your first and last name.");
        if (password.length < 10) return setResult("Use a password with at least 10 characters.");
        if (password !== confirm) return setResult("The passwords do not match.");
        const response = await fetch("/api/auth/signup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: email.trim().toLowerCase(), password, firstName: names[0], lastName: names.slice(1).join(" ") }) });
        const body = await response.json(); if (!response.ok) return setResult(body.error ?? "We couldn’t create your account.");
        router.push(`/verify-email?email=${encodeURIComponent(email.trim().toLowerCase())}`); return;
      }
      if (mode === "signin") {
        const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
        if (authError) return setResult(authError.message.toLowerCase().includes("email not confirmed") ? "Please verify your email before signing in." : "Incorrect email or password.");
        router.replace(await destination(supabase)); router.refresh(); return;
      }
      if (mode === "forgot") {
        const { error: authError } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo: `${location.origin}/reset-password?email=${encodeURIComponent(email.trim().toLowerCase())}` });
        if (authError) return setResult(authError.message);
        setNotice("If this email is registered, a password reset code is on its way."); return;
      }
      if (mode === "verify") { setNotice("Open the confirmation link in your inbox. It will verify your email and sign you in."); setBusy(false); return; }
      if (mode === "reset") {
        if (!/^\d{6}$/.test(otp)) return setResult("Enter the 6-digit code from your email.");
        if (password.length < 10) return setResult("Use a password with at least 10 characters.");
        if (password !== confirm) return setResult("The passwords do not match.");
        const { error: verifyError } = await supabase.auth.verifyOtp({ email: email.trim().toLowerCase(), token: otp, type: "recovery" });
        if (verifyError) return setResult("That code is invalid or expired. Request a new reset code.");
        const { error: updateError } = await supabase.auth.updateUser({ password });
        if (updateError) return setResult(updateError.message);
        setNotice("Password updated. You can now sign in with your new password.");
      }
    } catch { setResult("Could not reach the authentication service. Check your connection and try again."); }
    setBusy(false);
  };
  const resend = async () => { setError(""); setBusy(true); try { const { error: resendError } = await getSupabase().auth.resend({ type: "signup", email: email.trim().toLowerCase() }); setBusy(false); if (resendError) setError(resendError.message); else setNotice("A new confirmation link has been sent."); } catch (cause) { setBusy(false); setError(cause instanceof Error ? cause.message : "Unable to resend the confirmation email."); } };
  const onEmail = (value: string) => setEmail(value);
  const identityMode = mode === "signup" || mode === "signin" || mode === "forgot";
  const title = { signup: "Create Account", signin: "Welcome Back", forgot: "Reset Password", reset: "Choose a new password", verify: "Check your inbox" }[mode];
  const description = { signup: "Sign up with your IBA Email", signin: "Sign in with your IBA email and password.", forgot: "Enter your institutional email to receive a password reset code.", reset: "Enter the code from your email and choose a new password.", verify: "Open the confirmation link in your email to activate your account." }[mode];
  const identity = deriveStudentIdentity(email);
  return <section className="w-full max-w-[650px]">
    <div className="mb-6 text-center"><h1 className="text-3xl font-bold tracking-tight text-slate-950">{title}</h1><p className="mt-2 text-sm text-slate-600">{description}</p></div>
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
      {mode === "signup" && <>
        <label className="block text-sm font-semibold">Full Name<input className={field} autoComplete="name" value={fullName} onChange={e=>setFullName(e.target.value)} required placeholder="First and last name"/></label>
        <label className="block text-sm font-semibold">IBA Email<input className={field} type="email" autoComplete="email" value={email} onChange={e=>onEmail(e.target.value)} required placeholder="name@khi.iba.edu.pk"/><span className="mt-1 block text-xs font-normal text-slate-500">Students: firstname.lastname.ERP@khi.iba.edu.pk · Faculty: name@iba.edu.pk</span></label>
      </>}
      {identityMode && mode !== "signup" && <label className="block text-sm font-semibold">IBA Email<input className={field} type="email" autoComplete="email" value={email} onChange={e=>onEmail(e.target.value)} required/></label>}
      {(mode === "signin" || mode === "signup" || mode === "reset") && <div className={mode === "signup" ? "grid gap-4 sm:grid-cols-2" : ""}><label className="block text-sm font-semibold">{mode === "reset" ? "New Password" : "Password"}<span className="relative block"><input className={`${field} pr-12`} type={showPassword?"text":"password"} autoComplete={mode==="signin"?"current-password":"new-password"} value={password} onChange={e=>setPassword(e.target.value)} required minLength={10}/><button type="button" aria-label={showPassword?"Hide password":"Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" onClick={()=>setShowPassword(!showPassword)}>{showPassword?<EyeOff size={18}/>:<Eye size={18}/>}</button></span></label>
        {mode === "signup" && <label className="block text-sm font-semibold">Confirm Password<input className={field} type="password" autoComplete="new-password" value={confirm} onChange={e=>setConfirm(e.target.value)} required minLength={10}/></label>}</div>}
      {mode === "signup" && <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-semibold">ERP / Student ID<input className={`${field} bg-slate-50`} value={identity?.erpNumber ?? ""} readOnly placeholder="Auto-filled from student email"/><span className="mt-1 block text-xs font-normal text-slate-500">Derived from a valid student email.</span></label><label className="block text-sm font-semibold">Phone Number <span className="font-normal text-slate-500">(optional)</span><input className={field} type="tel" autoComplete="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+92"/><span className="mt-1 block text-xs font-normal text-slate-500">Phone is not currently stored during sign-up.</span></label></div>}
      {(mode === "verify" || mode === "reset") && mode === "reset" && <label className="block text-sm font-semibold">Email<input className={field} type="email" value={email} onChange={e=>setEmail(e.target.value)} required/></label>}
      {mode === "reset" && <label className="block text-sm font-semibold">6-digit recovery code<input className={`${field} tracking-[.35em]`} inputMode="numeric" maxLength={6} value={otp} onChange={e=>setOtp(e.target.value.replace(/\D/g,""))} required/></label>}
      {mode === "signin" && <div className="text-right"><Link href="/forgot-password" className="text-sm font-semibold text-blue-700">Forgot Password?</Link></div>}
      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}{notice && <p role="status" className="flex gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800"><Check size={18}/>{notice}</p>}
      {mode === "forgot" && notice && <Link href={`/reset-password?email=${encodeURIComponent(email)}`} className="block text-center text-sm font-semibold text-blue-700">I have a code · continue</Link>}
      {mode !== "verify" && <button className={button} disabled={busy}>{busy&&<LoaderCircle className="animate-spin" size={18}/>}{{signup:"Create Account",signin:"Sign In",forgot:"Send reset code",reset:"Update Password",verify:"Verify email"}[mode]}</button>}
      {mode === "verify" && <button type="button" disabled={busy} onClick={resend} className="w-full py-2 text-sm font-semibold text-blue-700">Resend confirmation link</button>}
      {mode === "reset" && notice && <Link className={`${button} mt-2`} href="/sign-in">Go to Sign In</Link>}
      <div className="border-t border-slate-100 pt-4 text-center text-sm text-slate-500">{mode === "signup" ? <>Already have an account? <Link className="font-semibold text-blue-700" href="/sign-in">Sign In</Link></> : mode === "signin" ? <>Don’t have an account? <Link className="font-semibold text-blue-700" href="/sign-up">Sign Up</Link></> : <Link className="font-semibold text-blue-700" href="/sign-in">Back to Sign In</Link>}</div>
    </form>
  </section>;
}
