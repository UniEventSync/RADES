import { useState } from "react";
import { UserPlus, UsersRound, Building2, X } from "lucide-react";

export type SocietyAssignmentChange = { email: string; role: "panelist" | "patron"; action: "assign" | "remove" };
type Person = { email?: string; first_name?: string; last_name?: string } | null;
type SocietyAssignment = { id?: string; user_id: string; status?: string; profiles?: Person };
type ManagedSociety = {
  id: string; name: string; slug: string; description?: string | null; contact_email?: string | null; is_active?: boolean;
  society_members?: SocietyAssignment[]; society_patrons?: SocietyAssignment[];
};

const field = "mt-1.5 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100";
const displayName = (person: Person) => [person?.first_name, person?.last_name].filter(Boolean).join(" ") || person?.email || "Invited member";

export function OfficeSocietyManager({ society, name, slug, description, contactEmail, isActive, setName, setSlug, setDescription, setContactEmail, setIsActive, changes, onStageAdd, onStageRemove, onCancel, onSave, busy }: {
  society: ManagedSociety;
  name: string; slug: string; description: string; contactEmail: string; isActive: boolean;
  setName: (value: string) => void; setSlug: (value: string) => void; setDescription: (value: string) => void;
  setContactEmail: (value: string) => void; setIsActive: (value: boolean) => void;
  changes: SocietyAssignmentChange[];
  onStageAdd: (email: string, role: SocietyAssignmentChange["role"]) => void;
  onStageRemove: (email: string, role: SocietyAssignmentChange["role"]) => void;
  onCancel: () => void; onSave: () => void; busy: boolean;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<SocietyAssignmentChange["role"]>("panelist");
  const admins = society.society_members?.filter(member => member.status === "active") ?? [];
  const patrons = society.society_patrons ?? [];
  const staged = (assignmentEmail: string, assignmentRole: SocietyAssignmentChange["role"]) => changes.find(change => change.email.toLowerCase() === assignmentEmail.toLowerCase() && change.role === assignmentRole);
  const assignmentRow = (person: Person, fallbackId: string, assignmentRole: SocietyAssignmentChange["role"]) => {
    const assignmentEmail = person?.email ?? "";
    const change = staged(assignmentEmail, assignmentRole);
    const pendingRemoval = change?.action === "remove";
    return <li key={fallbackId} className={`flex min-w-0 items-center gap-3 rounded-xl border p-3 ${pendingRemoval ? "border-amber-200 bg-amber-50/70 opacity-70" : "border-slate-200 bg-white"}`}>
      <span aria-hidden className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${assignmentRole === "patron" ? "bg-emerald-50 text-emerald-800" : "bg-blue-50 text-blue-800"}`}>{(person?.first_name?.[0] ?? assignmentEmail[0] ?? "?").toUpperCase()}</span>
      <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{displayName(person)}</p><p className="truncate text-xs text-slate-500">{assignmentEmail || "Email unavailable"}</p></div>
      {pendingRemoval ? <span className="text-xs font-semibold text-amber-800">Remove on save</span> : <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">{assignmentRole === "patron" ? "Faculty patron" : "Society admin"}</span>}
      {assignmentEmail && <button type="button" disabled={busy} onClick={() => onStageRemove(assignmentEmail, assignmentRole)} aria-label={pendingRemoval ? "Undo removal" : "Remove assignment"} title={pendingRemoval ? "Undo removal" : "Remove assignment"} className="rounded-lg p-2 text-slate-500 transition hover:bg-white hover:text-red-700 disabled:opacity-50">{pendingRemoval ? <X size={16}/> : <span className="text-xs font-semibold">Remove</span>}</button>}
    </li>;
  };

  return <section className="mt-8">
    <div className="mb-5 flex flex-col justify-between gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-blue-700">Manage societies</p><h2 className="mt-1 text-2xl font-bold">{society.name}</h2><p className="mt-1 text-sm text-slate-500">Edit the public profile and stage assignment changes. Nothing is applied until you save.</p></div><span className={`w-fit rounded-full px-3 py-1.5 text-xs font-semibold ${isActive ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>{isActive ? "Public profile active" : "Profile inactive"}</span></div>
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(360px,.9fr)]">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><Building2 size={20}/></span><div><h3 className="font-bold">Society details</h3><p className="text-xs text-slate-500">Public profile information</p></div></div>
        <div className="mt-5 space-y-4"><label className="block text-sm font-semibold">Society name<input className={field} value={name} onChange={event => setName(event.target.value)} required/></label><label className="block text-sm font-semibold">URL slug<input className={field} value={slug} onChange={event => setSlug(event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} required/><span className="mt-1 block text-xs font-normal text-slate-500">Public profile: /societies/{slug || "society-slug"}</span></label><label className="block text-sm font-semibold">Short description<textarea className="mt-1.5 min-h-28 w-full rounded-xl border border-slate-300 p-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100" value={description} onChange={event => setDescription(event.target.value)} maxLength={2000}/></label><label className="block text-sm font-semibold">Contact email<input className={field} type="email" value={contactEmail} onChange={event => setContactEmail(event.target.value)} placeholder="society@iba.edu.pk"/></label><label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-slate-200 px-4 py-3"><span><span className="block text-sm font-semibold">Public visibility</span><span className="mt-0.5 block text-xs text-slate-500">Inactive societies are hidden from Explore Societies.</span></span><input type="checkbox" checked={isActive} onChange={event => setIsActive(event.target.checked)} className="h-4 w-4 accent-blue-600"/></label></div>
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700"><UsersRound size={20}/></span><div><h3 className="font-bold">Society assignments</h3><p className="text-xs text-slate-500">Up to three admins and one optional faculty patron</p></div></div>
        <form onSubmit={event => { event.preventDefault(); onStageAdd(email, role); setEmail(""); }} className="mt-5 rounded-xl bg-slate-50 p-4"><div className="grid gap-3 sm:grid-cols-[.8fr_1.2fr]"><label className="block text-xs font-semibold text-slate-600">Assignment type<select className={field} value={role} onChange={event => setRole(event.target.value as SocietyAssignmentChange["role"])}><option value="panelist">Society admin</option><option value="patron">Faculty patron (optional)</option></select></label><label className="block text-xs font-semibold text-slate-600">IBA email<input className={field} type="email" value={email} onChange={event => setEmail(event.target.value)} required placeholder={role === "patron" ? "name@iba.edu.pk" : "firstname.lastname.ERP@khi.iba.edu.pk"}/></label></div><button disabled={busy} className="mt-3 inline-flex h-10 items-center gap-2 rounded-lg border border-blue-200 bg-white px-3 text-sm font-semibold text-blue-800 transition hover:bg-blue-50 disabled:opacity-50"><UserPlus size={16}/>Add to pending changes</button></form>
        <div className="mt-5"><div className="mb-2 flex items-center justify-between"><h4 className="text-sm font-bold">Student admins</h4><span className="text-xs text-slate-500">{admins.length} / 3</span></div><ul className="space-y-2">{admins.map((member, index) => assignmentRow(member.profiles ?? null, member.id ?? member.user_id ?? String(index), "panelist"))}</ul>{admins.length === 0 && <p className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-sm text-slate-500">No student admins assigned yet.</p>}</div>
        <div className="mt-5 border-t border-slate-100 pt-5"><div className="mb-2 flex items-center justify-between"><h4 className="text-sm font-bold">Faculty patron</h4><span className="text-xs text-slate-500">Optional</span></div><ul className="space-y-2">{patrons.map((patron, index) => assignmentRow(patron.profiles ?? null, patron.id ?? patron.user_id ?? String(index), "patron"))}</ul>{patrons.length === 0 && <p className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-sm text-slate-500">No patron assigned. You can add one later before an event is submitted for review.</p>}</div>
        {changes.length > 0 && <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50/70 p-3 text-xs leading-5 text-blue-900">{changes.filter(change => change.action === "assign").length} assignment(s) to add and {changes.filter(change => change.action === "remove").length} to remove. Changes are pending save.</div>}
      </section>
    </div>
    <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs text-slate-500">Save applies the society profile and assignment changes.</p><div className="flex justify-end gap-3"><button type="button" onClick={onCancel} disabled={busy} className="h-11 rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Cancel</button><button type="button" onClick={onSave} disabled={busy} className="inline-flex h-11 min-w-36 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60">{busy ? "Saving changes…" : "Save changes"}</button></div></div>
  </section>;
}
