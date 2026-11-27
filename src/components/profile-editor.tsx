"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Check, KeyRound, LoaderCircle } from "lucide-react";
import { useToast } from "@/components/toast-provider";
import { GoogleCalendarButton } from "@/components/google-calendar-button";
import { ImageUpload } from "@/components/image-upload";

type UserProfile = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  erpNumber: string | null;
  accountType: string;
  globalRole: string;
  phone: string;
  isSocietyAdmin: boolean;
  isPatron: boolean;
  avatarUrl: string;
  societyAffiliations?: Array<{ name: string; role: string }>;
};
type TicketSummary = { id: string; eventTitle: string; startsAt: string; venue: string; holder: string };
type RegistrationHistoryItem = { id: string; registrationId: string; eventId: string; title: string; description: string; startsAt: string; endsAt: string; venue: string; status: string; paymentStatus: string | null; checkedInAt: string | null; ticketId: string | null; calendarEligible: boolean; feedbackAvailable: boolean; teamName: string | null; amountPkr: number; isLeader: boolean };

const field = "mt-1.5 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-700 focus:ring-4 focus:ring-blue-100";

export function ProfileEditor({ profile, tickets, history, editMode = false }: { profile: UserProfile; tickets: TicketSummary[]; history: RegistrationHistoryItem[]; editMode?: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [phone, setPhone] = useState(profile.phone);
  const [firstName, setFirstName] = useState(profile.firstName);
  const [lastName, setLastName] = useState(profile.lastName);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl);
  const [busy, setBusy] = useState(false);
  const initials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase() || "R";
  const roles = Array.from(new Set([
    profile.accountType === "student" ? "Student" : profile.accountType === "faculty" ? "Faculty" : profile.accountType === "developer" ? "Developer" : "Account",
    profile.globalRole === "office" ? "OSSIE" : profile.globalRole === "super_admin" ? "Developer" : null,
    profile.isSocietyAdmin ? "Society admin" : null,
    profile.isPatron ? "Society patron" : null,
  ].filter((role): role is string => Boolean(role))));

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedPhone = phone.trim();
    if (normalizedPhone && !/^\+[1-9]\d{7,14}$/.test(normalizedPhone)) { toast("Enter a phone number in international format, such as +923001234567.", "error"); return; }
    setBusy(true);
    try {
      const response = await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ firstName: firstName.trim(), lastName: lastName.trim(), phone: normalizedPhone, avatarUrl }) });
      const body = await response.json();
      if (!response.ok) { toast(body.error ?? "Your profile could not be saved.", "error"); return; }
      setFirstName(body.firstName ?? firstName);
      setLastName(body.lastName ?? lastName);
      setPhone(body.phone ?? "");
      setAvatarUrl(body.avatarUrl ?? "");
      window.dispatchEvent(new CustomEvent("rades-profile-updated", { detail: { avatarUrl: body.avatarUrl ?? "", firstName: body.firstName ?? firstName, lastName: body.lastName ?? lastName } }));
      toast("Profile details saved.", "success"); router.refresh();
    } catch { toast("Could not reach RADES. Check your connection and try again.", "error"); }
    finally { setBusy(false); }
  };

  if (editMode) return <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8 sm:py-10">
    <Link href="/profile" className="text-sm font-semibold text-blue-700 hover:underline">← Back to profile</Link>
    <div className="mb-6 mt-5"><p className="text-sm font-semibold text-blue-700">Account settings</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Edit profile</h1><p className="mt-2 text-sm text-slate-600">Update your name, photo, and phone number here. Use Change password below to update your password.</p></div>
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <form onSubmit={save} className="space-y-4">
        <ImageUpload kind="profile-avatars" entityId={profile.id} value={avatarUrl} onChange={setAvatarUrl}/>
        <div className="grid gap-3 sm:grid-cols-2"><label className="block text-sm font-semibold">First name<input className={field} value={firstName} onChange={event => setFirstName(event.target.value)} minLength={1} maxLength={60} required/></label><label className="block text-sm font-semibold">Last name<input className={field} value={lastName} onChange={event => setLastName(event.target.value)} minLength={1} maxLength={60} required/></label></div>
        <label htmlFor="profile-phone" className="block text-sm font-semibold">Phone number<input id="profile-phone" className={field} type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={event => setPhone(event.target.value)} maxLength={20} placeholder="+923001234567" aria-describedby="phone-hint"/></label><p id="phone-hint" className="-mt-3 text-xs text-slate-500">Use international format, for example +923001234567.</p>
        <div className="flex flex-wrap gap-3"><button type="submit" disabled={busy} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-wait disabled:opacity-60">{busy ? <LoaderCircle size={16} className="animate-spin"/> : <Check size={16}/>}Save changes</button><Link href="/change-password" className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 px-4 text-sm font-semibold"><KeyRound size={16}/>Change password</Link></div>
      </form>
    </section>
  </div>;

  return <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
    <div className="mb-6"><p className="text-sm font-semibold text-blue-700">Your account</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Your profile</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Review your contact details, society roles, tickets, and event history. Choose Edit profile to update your details or password.</p></div>
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(280px,.8fr)_minmax(0,1.5fr)]">
      <section aria-labelledby="profile-card-title" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-4"><div aria-hidden="true" className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-xl font-bold text-blue-900">{avatarUrl ? <Image src={avatarUrl} alt="" fill unoptimized sizes="64px" className="object-cover"/> : initials}</div><div className="min-w-0"><h2 id="profile-card-title" className="truncate text-xl font-bold">{firstName} {lastName}</h2><p className="truncate text-sm text-slate-600">{profile.email}</p></div></div>
        <div className="mt-5 flex flex-wrap gap-2">{roles.map(role => <span key={role} className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-800">{role}</span>)}</div>
        {profile.societyAffiliations?.length ? <div className="mt-4 border-t border-slate-100 pt-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Society affiliations</p><ul className="mt-2 flex flex-wrap gap-2">{profile.societyAffiliations.map((item, index) => <li key={`${item.name}-${item.role}-${index}`} className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-700"><span>{item.name}</span><span className="ml-1.5 text-slate-500">{item.role}</span></li>)}</ul></div> : null}
        <dl className="mt-5 space-y-3 border-t border-slate-100 pt-5 text-sm"><div className="flex justify-between gap-4"><dt className="text-slate-500">Email</dt><dd className="truncate font-medium" title={profile.email}>{profile.email}</dd></div>{profile.accountType === "student" && <div className="flex justify-between gap-4"><dt className="text-slate-500">Student ID</dt><dd className="font-medium">{profile.erpNumber ?? "Unavailable"}</dd></div>}<div className="flex justify-between gap-4"><dt className="text-slate-500">Phone number</dt><dd className="font-medium">{profile.phone || "Not added"}</dd></div></dl>
        <Link href="/profile/edit" className="mt-5 inline-flex h-10 items-center rounded-lg bg-blue-700 px-4 text-sm font-semibold text-white hover:bg-blue-800">Edit profile</Link>
      </section>
      <div className="space-y-6">
      <section aria-labelledby="tickets-title" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="border-b border-slate-200 pb-4"><h2 id="tickets-title" className="text-lg font-bold">Digital tickets</h2><p className="mt-1 text-sm text-slate-600">Each team member has an individual QR pass.</p></div>{tickets.length ? <ul className="mt-4 divide-y divide-slate-100">{tickets.map(ticket => <li key={ticket.id} className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0"><div className="min-w-0"><p className="font-semibold">{ticket.eventTitle}</p><p className="mt-1 text-sm text-slate-600">{ticket.holder} · {new Date(ticket.startsAt).toLocaleDateString("en-PK", { dateStyle: "medium", timeZone: "Asia/Karachi" })} · {ticket.venue}</p></div><a href={`/tickets/${ticket.id}`} className="inline-flex h-10 shrink-0 items-center rounded-lg bg-blue-700 px-4 text-sm font-semibold text-white hover:bg-blue-800">View ticket</a></li>)}</ul> : <div className="mt-5 rounded-xl border border-dashed border-slate-300 p-6 text-center"><h3 className="font-semibold">No active tickets</h3><p className="mt-1 text-sm text-slate-500">Confirmed event tickets appear here. Paid tickets appear after payment.</p></div>}</section>
      <section aria-labelledby="registration-history-title" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="border-b border-slate-200 pb-4">
          <h2 id="registration-history-title" className="text-lg font-bold">Registration and participation history</h2>
          <p className="mt-1 text-sm text-slate-600">Your event registrations, payment state, cancellations, refunds, and recorded attendance.</p>
        </div>
        {history.length ? <ul className="mt-4 divide-y divide-slate-100">
          {history.map(item => <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold">{item.title}</p>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${item.status === "Checked in" ? "bg-green-100 text-green-900" : item.status === "Upcoming" || item.status === "Registered" ? "bg-blue-100 text-blue-900" : item.status === "Payment pending" ? "bg-amber-100 text-amber-950" : "bg-slate-100 text-slate-700"}`}>{item.status}</span>
                {item.paymentStatus && <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${item.paymentStatus === "paid" ? "bg-green-100 text-green-900" : item.paymentStatus === "pending" ? "bg-amber-100 text-amber-950" : item.paymentStatus === "refunded" ? "bg-violet-100 text-violet-900" : "bg-slate-100 text-slate-700"}`}>Payment: {item.paymentStatus.replaceAll("_", " ")}</span>}
              </div>
              <p className="mt-1 text-sm text-slate-600">{new Date(item.startsAt).toLocaleDateString("en-PK", { dateStyle: "medium", timeZone: "Asia/Karachi" })} · {item.venue}{item.teamName ? ` · ${item.teamName} (${item.isLeader ? "team leader" : "teammate"})` : " · Individual registration"}</p>
              {item.checkedInAt && <p className="mt-1 text-xs text-green-800">Checked in {new Date(item.checkedInAt).toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Karachi" })} PKT</p>}
            </div>
            <div className="flex flex-wrap gap-2">
              {item.ticketId && <a href={`/tickets/${item.ticketId}`} className="inline-flex h-10 shrink-0 items-center rounded-lg border border-blue-300 px-4 text-sm font-semibold text-blue-800 hover:bg-blue-50">View ticket</a>}
              {item.calendarEligible && item.ticketId && <GoogleCalendarButton event={{ id: item.eventId, title: item.title, description: item.description, startsAt: item.startsAt, endsAt: item.endsAt, venue: item.venue, url: `/events/${item.eventId}` }} userId={profile.id}/>}
              {item.feedbackAvailable && <a href={`/events/${item.eventId}/feedback`} className="inline-flex h-10 items-center rounded-lg border border-violet-300 px-4 text-sm font-semibold text-violet-800 hover:bg-violet-50">Give feedback</a>}
            </div>
          </li>)}
        </ul> : <div className="mt-5 rounded-xl border border-dashed border-slate-300 p-8 text-center"><h3 className="font-semibold">No registrations yet</h3><p className="mt-1 text-sm text-slate-500">Events you register for will appear here.</p></div>}
      </section>
      </div>
    </div>
  </div>;
}
