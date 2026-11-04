"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { deriveStudentIdentity, emailSchema, getAccountType, loginEmailSchema } from "@/lib/auth/email-rules";
import { ArrowLeft, Check, Eye, EyeOff, LoaderCircle, LockKeyhole, Mail } from "lucide-react";

type Mode = "signup" | "signin" | "forgot" | "reset" | "verify";
const field = "mt-1.5 h-12 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-900 outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100";
const button = "flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60";

export function AuthForm({ mode, initialEmail = "" }: { mode: Mode; initialEmail?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail);
  const [firstName, setFirstName] = useState(""); const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState(""); const [confirm, setConfirm] = useState(""); const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const [notice, setNotice] = useState("");
  const getSupabase = () => { if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) throw new Error("Authentication is not configured yet. Add your Supabase keys to .env.local."); return createClient(); };
  const titles: Record<Mode, string> = { signup: "Create your account", signin: "Welcome back", forgot: "Reset your password", reset: "Choose a new password", verify: "Check your inbox" };
  const descriptions: Record<Mode, string> = { signup: "Use your IBA email to join the campus community.", signin: "Students, faculty, OSSIE, society panelists, and developers sign in with their IBA email and password.", forgot: "We’ll email a one-time code if this account exists.", reset: "Enter the code from your email and set a new password.", verify: "We sent a confirmation link to your email. Open it to activate your RADES account." };
  const setResult = (message: string) => { setError(message); setBusy(false); };
  const validateEmail = () => { const result = (mode === "signup" ? emailSchema : loginEmailSchema).safeParse(email); if (!result.success) { setResult(result.error.issues[0]?.message ?? "Enter a valid email address."); return false; } return true; };
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError(""); setNotice(""); setBusy(true);
    if (["signup", "signin", "forgot"].includes(mode) && !validateEmail()) return;
    try {
      const supabase = getSupabase();
      if (mode === "signup") {
        if (password.length < 10) return setResult("Use a password with at least 10 characters.");
        if (password !== confirm) return setResult("The passwords do not match.");
        const kind = getAccountType(email)!; const derived = deriveStudentIdentity(email);
        const response = await fetch("/api/auth/signup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: email.trim().toLowerCase(), password, firstName: firstName || derived?.firstName || "", lastName: lastName || derived?.lastName || "", accountType: kind }) });
        const body = await response.json(); if (!response.ok) return setResult(body.error ?? "We couldn’t create your account.");
        router.push(`/verify-email?email=${encodeURIComponent(email.trim().toLowerCase())}`); return;
      }
      if (mode === "signin") {
        const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
        if (authError) return setResult(authError.message.toLowerCase().includes("email not confirmed") ? "Please verify your email before signing in." : "Incorrect email or password.");
        router.replace("/home"); router.refresh(); return;
      }
      if (mode === "forgot") {
        const { error: authError } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo: `${location.origin}/reset-password?email=${encodeURIComponent(email.trim().toLowerCase())}` });
        if (authError) return setResult(authError.message);
        setNotice("If this email is registered, a password reset code is on its way."); return;
      }
      if (mode === "verify") {
        setNotice("Open the confirmation link in your inbox. It will verify your email and sign you in.");
        setBusy(false); return;
      }
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
  const onEmail = (value: string) => { setEmail(value); if (mode === "signup") { const identity = deriveStudentIdentity(value); if (identity) { setFirstName(identity.firstName); setLastName(identity.lastName); } } };
  const isIdentityMode = mode === "signup" || mode === "signin" || mode === "forgot";
  return <div className="w-full max-w-[460px]">
    <div className="mb-7 text-center"><Link href="/" aria-label="RADES home" className="mx-auto mb-5 flex h-16 w-16 items-center justify-center"><Image src="/Icon.png" alt="RADES" width={72} height={72} priority className="h-16 w-16 object-contain"/></Link><h1 className="text-3xl font-bold tracking-tight text-slate-950">{titles[mode]}</h1><p className="mt-2 text-sm leading-6 text-slate-600">{descriptions[mode]}</p></div>
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      {mode === "signup" && <div className="grid grid-cols-2 gap-3"><label className="text-sm font-semibold">First name<input className={field} autoComplete="given-name" value={firstName} onChange={e => setFirstName(e.target.value)} required /></label><label className="text-sm font-semibold">Last name<input className={field} autoComplete="family-name" value={lastName} onChange={e => setLastName(e.target.value)} required /></label></div>}
      {isIdentityMode && <label className="block text-sm font-semibold">{mode === "signin" ? "Email" : "IBA email"}<div className="relative"><Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18}/><input className={`${field} pl-10`} type="email" autoComplete="email" value={email} onChange={e => onEmail(e.target.value)} placeholder={mode === "signin" ? "you@iba.edu.pk" : "name@khi.iba.edu.pk"} required /></div>{mode === "signup" && <span className="mt-2 block text-xs font-normal leading-5 text-slate-500">Students: firstname.lastname.ERP@khi.iba.edu.pk · Faculty: name@iba.edu.pk</span>}</label>}
      {(mode === "signin" || mode === "signup" || mode === "reset") && <label className="block text-sm font-semibold">{mode === "reset" ? "New password" : "Password"}<div className="relative"><LockKeyhole className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18}/><input className={`${field} pl-10 pr-11`} type={showPassword ? "text" : "password"} autoComplete={mode === "signin" ? "current-password" : "new-password"} value={password} onChange={e => setPassword(e.target.value)} required minLength={10} placeholder="At least 10 characters"/><button className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button></div></label>}
      {(mode === "signup" || mode === "reset") && <label className="block text-sm font-semibold">Confirm password<input className={field} type="password" autoComplete="new-password" value={confirm} onChange={e => setConfirm(e.target.value)} required minLength={10}/></label>}
      {(mode === "verify" || mode === "reset") && <label className="block text-sm font-semibold">Email<input className={field} type="email" value={email} onChange={e => setEmail(e.target.value)} required/></label>}
      {mode === "reset" && <label className="block text-sm font-semibold">6-digit recovery code<input className={`${field} tracking-[.35em]`} inputMode="numeric" maxLength={6} value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ""))} placeholder="000000" required/></label>}
      {mode === "signin" && <div className="-mt-1 text-right"><Link href="/forgot-password" className="text-sm font-semibold text-blue-700 hover:underline">Forgot password?</Link></div>}
      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700">{error}</p>}
      {notice && <p role="status" className="flex gap-2 rounded-lg border border-green-200 bg-green-50 px-3.5 py-3 text-sm text-green-800"><Check size={18} className="shrink-0"/>{notice}</p>}
      {mode === "forgot" && notice && <Link href={`/reset-password?email=${encodeURIComponent(email)}`} className="block text-center text-sm font-semibold text-blue-700">I have a code · continue to reset password</Link>}
      {mode !== "verify" && <button className={button} disabled={busy}>{busy && <LoaderCircle className="animate-spin" size={18}/>}{{ signup: "Create account", signin: "Sign in", forgot: "Send reset code", reset: "Update password", verify: "Verify email" }[mode]}</button>}
      {mode === "verify" && <button type="button" disabled={busy} onClick={resend} className="w-full py-2 text-sm font-semibold text-blue-700">Resend confirmation link</button>}
      {mode === "reset" && notice && <Link className={`${button} mt-2`} href="/sign-in">Go to sign in</Link>}
      <div className="border-t border-slate-100 pt-4 text-center text-sm text-slate-500">{mode === "signup" ? <>Already have an account? <Link className="font-semibold text-blue-700" href="/sign-in">Sign in</Link></> : mode === "signin" ? <>New to RADES? <Link className="font-semibold text-blue-700" href="/sign-up">Create account</Link></> : <Link className="inline-flex items-center gap-1 font-semibold text-blue-700" href="/sign-in"><ArrowLeft size={15}/> Back to sign in</Link>}</div>
    </form><p className="mt-5 text-center text-xs leading-5 text-slate-400">Sign-up is for IBA student and faculty emails. Developer accounts are invited by OSSIE.</p>
  </div>;
}

