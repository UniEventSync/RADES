"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { deriveStudentIdentity, emailSchema, getAccountType, loginEmailSchema } from "@/lib/auth/email-rules";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { useToast } from "@/components/toast-provider";

type Mode = "signup" | "signin" | "forgot" | "reset" | "change" | "verify";
const field = "mt-1.5 h-11 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-700 focus:ring-4 focus:ring-blue-100";
const button = "flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60";

export function AuthForm({ mode, initialEmail = "", nextPath }: { mode: Mode; initialEmail?: string; nextPath?: string }) {
  const router = useRouter();
  const toast = useToast();
  const [email, setEmail] = useState(initialEmail); const [fullName, setFullName] = useState(""); const [phone, setPhone] = useState("");
  const [password, setPassword] = useState(""); const [confirm, setConfirm] = useState(""); const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const [notice, setNotice] = useState("");
  useEffect(() => { if (error) toast(error, "error"); }, [error, toast]);
  useEffect(() => { if (notice) toast(notice, "success"); }, [notice, toast]);
  const getSupabase = () => { if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) throw new Error("Authentication is not configured yet. Add your Supabase keys to .env.local."); return createClient(); };
  const setResult = (message: string) => { setError(message); setBusy(false); };
  const validateEmail = () => { const result = (mode === "signup" ? emailSchema : loginEmailSchema).safeParse(email); if (!result.success) { setResult(result.error.issues[0]?.message ?? "Enter a valid email address."); return false; } return true; };
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
        const response = await fetch("/api/auth/signup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: email.trim().toLowerCase(), password, firstName: names[0], lastName: names.slice(1).join(" "), accountType: getAccountType(email) }) });
        const body = await response.json(); if (!response.ok) return setResult(body.error ?? "We couldn’t create your account.");
        router.push(`/verify-email?email=${encodeURIComponent(email.trim().toLowerCase())}`); return;
      }
      if (mode === "signin") {
        const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
        if (authError) return setResult(authError.message.toLowerCase().includes("email not confirmed") ? "Please verify your email before signing in." : "Incorrect email or password.");
        const returnTo = nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//") && !["/sign-in", "/sign-up", "/forgot-password", "/reset-password", "/verify-email"].some(path => nextPath.startsWith(path)) ? nextPath : "/";
        router.replace(returnTo); router.refresh(); return;
      }
      if (mode === "forgot") {
        const response = await fetch("/api/auth/forgot-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: email.trim().toLowerCase() }) });
        const body = await response.json();
        if (!response.ok) return setResult(body.error ?? "Could not send the recovery code. Try again shortly.");
        setNotice("If this email is registered, a password reset code is on its way."); return;
      }
      if (mode === "verify") { setNotice("Open the confirmation link in your inbox. It will verify your email and sign you in."); setBusy(false); return; }
      if (mode === "change") {
        if (password.length < 10) return setResult("Use a password with at least 10 characters.");
        if (password !== confirm) return setResult("The passwords do not match.");
        const { error: updateError } = await supabase.auth.updateUser({ password });
        if (updateError) return setResult(updateError.message);
        setNotice("Password updated successfully.");
        return;
      }
      if (mode === "reset") {
        if (!/^\d{6,8}$/.test(otp)) return setResult("Enter the 6- or 8-digit code from your email.");
        if (password.length < 10) return setResult("Use a password with at least 10 characters.");
        if (password !== confirm) return setResult("The passwords do not match.");
        const { error: verifyError } = await supabase.auth.verifyOtp({ email: email.trim().toLowerCase(), token: otp, type: "recovery" });
        if (verifyError) return setResult("That code is invalid or expired. Request a new reset code.");
        const { error: updateError } = await supabase.auth.updateUser({ password });
        if (updateError) return setResult(updateError.message);
        setNotice("Password updated successfully.");
      }
    } catch { setResult("Could not reach the authentication service. Check your connection and try again."); }
    setBusy(false);
  };
  const resend = async () => { setError(""); setBusy(true); try { const { error: resendError } = await getSupabase().auth.resend({ type: "signup", email: email.trim().toLowerCase() }); setBusy(false); if (resendError) setError(resendError.message); else setNotice("A new confirmation link has been sent."); } catch (cause) { setBusy(false); setError(cause instanceof Error ? cause.message : "Unable to resend the confirmation email."); } };
  const onEmail = (value: string) => setEmail(value);
  const identityMode = mode === "signup" || mode === "signin" || mode === "forgot";
  const title = { signup: "Create Account", signin: "Welcome Back", forgot: "Reset Password", reset: "Choose a new password", change: "Change Password", verify: "Check your inbox" }[mode];
  const description = { signup: "Sign up with your IBA Email", signin: "Sign in with your IBA email and password.", forgot: "Enter your institutional email to receive a password reset code.", reset: "Enter the code from your email and choose a new password.", change: "Choose a new password for your RADES account.", verify: "Open the confirmation link in your email to activate your account." }[mode];
  const identity = deriveStudentIdentity(email);
  const accountType = getAccountType(email);
  return <section className="w-full max-w-[650px]">
    <div className="mb-6 text-center"><h1 className="text-3xl font-bold tracking-tight text-slate-950">{title}</h1><p className="mt-2 text-sm text-slate-600">{description}</p></div>
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
      {mode === "signup" && <>
        <label className="block text-sm font-semibold">Full Name<input className={field} autoComplete="name" value={fullName} onChange={e=>setFullName(e.target.value)} required placeholder="First and last name"/></label>
        <label className="block text-sm font-semibold">IBA Email<input className={field} type="email" autoComplete="email" value={email} onChange={e=>onEmail(e.target.value)} required placeholder="name@khi.iba.edu.pk"/><span className="mt-1 block text-xs font-normal text-slate-500">Students: firstname.secondname.ERP@khi.iba.edu.pk · Faculty: name@iba.edu.pk</span>{accountType&&<span className="mt-1 block text-xs font-semibold text-blue-700">{accountType === "student" ? "Student account" : "Faculty account"}</span>}</label>
      </>}
      {identityMode && mode !== "signup" && <label className="block text-sm font-semibold">IBA Email<input className={field} type="email" autoComplete="email" value={email} onChange={e=>onEmail(e.target.value)} required/></label>}
      {(mode === "signin" || mode === "signup" || mode === "reset" || mode === "change") && <div className={mode === "signup" ? "grid gap-4 sm:grid-cols-2" : ""}><label className="block text-sm font-semibold">{mode === "reset" || mode === "change" ? "New Password" : "Password"}<span className="relative block"><input className={`${field} pr-12`} type={showPassword?"text":"password"} autoComplete={mode==="signin"?"current-password":"new-password"} value={password} onChange={e=>setPassword(e.target.value)} required minLength={10}/><button type="button" aria-label={showPassword?"Hide password":"Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" onClick={()=>setShowPassword(!showPassword)}>{showPassword?<EyeOff size={18}/>:<Eye size={18}/>}</button></span></label>
        {(mode === "signup" || mode === "reset" || mode === "change") && <label className="block text-sm font-semibold">Confirm Password<input className={field} type="password" autoComplete="new-password" value={confirm} onChange={e=>setConfirm(e.target.value)} required minLength={10}/></label>}</div>}
      {mode === "signup" && <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-semibold">ERP / Student ID<input className={`${field} bg-slate-50`} value={identity?.erpNumber ?? ""} readOnly placeholder="Auto-filled from student email"/><span className="mt-1 block text-xs font-normal text-slate-500">Derived from a valid student email.</span></label><label className="block text-sm font-semibold">Phone Number <span className="font-normal text-slate-500">(optional)</span><input className={field} type="tel" autoComplete="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+92"/><span className="mt-1 block text-xs font-normal text-slate-500">Phone is not currently stored during sign-up.</span></label></div>}
      {(mode === "verify" || mode === "reset") && mode === "reset" && <label className="block text-sm font-semibold">Email<input className={field} type="email" value={email} onChange={e=>setEmail(e.target.value)} required/></label>}
      {mode === "reset" && <label className="block text-sm font-semibold">Recovery code (6-8 digits)<input className={`${field} tracking-[.35em]`} inputMode="numeric" maxLength={8} value={otp} onChange={e=>setOtp(e.target.value.replace(/\D/g,""))} required/></label>}
      {mode === "signin" && <div className="text-right"><Link href="/forgot-password" className="text-sm font-semibold text-blue-700">Forgot Password?</Link></div>}
      {mode === "forgot" && notice && <Link href={`/reset-password?email=${encodeURIComponent(email)}`} className="block text-center text-sm font-semibold text-blue-700">I have a code · continue</Link>}
      {mode !== "verify" && <button className={button} disabled={busy}>{busy&&<LoaderCircle className="animate-spin" size={18}/>}{{signup:"Create Account",signin:"Sign In",forgot:"Send reset code",reset:"Update Password",change:"Update Password",verify:"Verify email"}[mode]}</button>}
      {mode === "verify" && <button type="button" disabled={busy} onClick={resend} className="w-full py-2 text-sm font-semibold text-blue-700">Resend confirmation link</button>}
      {mode === "reset" && notice && <Link className={`${button} mt-2`} href="/">Continue to RADES</Link>}
      <div className="border-t border-slate-100 pt-4 text-center text-sm text-slate-500">{mode === "signup" ? <>Already have an account? <Link className="font-semibold text-blue-700" href="/sign-in">Sign In</Link></> : mode === "signin" ? <>Don’t have an account? <Link className="font-semibold text-blue-700" href="/sign-up">Sign Up</Link></> : mode === "change" ? <Link className="font-semibold text-blue-700" href="/">Back to RADES</Link> : <Link className="font-semibold text-blue-700" href="/sign-in">Back to Sign In</Link>}</div>
    </form>
  </section>;
}
