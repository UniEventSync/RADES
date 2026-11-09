"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImageUpload } from "@/components/image-upload";

type Fields = { description: string; contact_email: string; logo_url:string; facebook_url:string; linkedin_url:string; instagram_url:string };
export function SocietyProfileEditor({ societyId, fields }: { societyId: string; fields: Fields }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [logo,setLogo]=useState(fields.logo_url);
  const router = useRouter();
  async function save(form: FormData) {
    setBusy(true); setMessage("");
    const response = await fetch(`/api/societies/${societyId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(form)) });
    const result = await response.json();
    setBusy(false);
    if (!response.ok) { setMessage(result.error ?? "Could not save the society profile."); return; }
    setMessage("Society profile updated."); setOpen(false); router.push(`/societies/${result.society.slug}`); router.refresh();
  }
  return <div className="mt-5">
    <button type="button" onClick={() => { setOpen(!open); setMessage(""); }} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold">{open ? "Cancel edit" : "Edit society profile"}</button>
    {message && <p role="status" className="mt-2 text-sm text-slate-600">{message}</p>}
    {open && <form action={save} className="mt-4 grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
      <label className="text-sm font-medium sm:col-span-2">Description<textarea name="description" defaultValue={fields.description} maxLength={2000} rows={4} className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-3" /></label>
      <label className="text-sm font-medium sm:col-span-2">Contact email<input type="email" name="contact_email" defaultValue={fields.contact_email} className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3" /></label>
      <ImageUpload kind="society-logos" entityId={societyId} value={logo} onChange={setLogo}/><input type="hidden" name="logo_url" value={logo}/>
      <label className="text-sm font-medium">Facebook URL<input type="url" name="facebook_url" defaultValue={fields.facebook_url} placeholder="https://facebook.com/…" className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3" /></label>
      <label className="text-sm font-medium">LinkedIn URL<input type="url" name="linkedin_url" defaultValue={fields.linkedin_url} placeholder="https://linkedin.com/…" className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3" /></label>
      <label className="text-sm font-medium">Instagram URL<input type="url" name="instagram_url" defaultValue={fields.instagram_url} placeholder="https://instagram.com/…" className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3" /></label>
      <button disabled={busy} className="h-10 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white disabled:opacity-60 sm:col-span-2">{busy ? "Saving…" : "Save profile"}</button>
    </form>}
  </div>;
}
