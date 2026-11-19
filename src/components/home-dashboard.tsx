"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/browser";
import { EventCard } from "@/components/event-card";
import { useToast } from "@/components/toast-provider";
import { ImageUpload } from "@/components/image-upload";
import { OfficeSocietyManager, type SocietyAssignmentChange } from "@/components/office-society-manager";
import { OfficeCreateAssignments } from "@/components/office-create-assignments";
import type { EventItem } from "@/lib/events/demo";
import { Building2, CalendarDays, Check, CircleUserRound, ClipboardCheck, UsersRound } from "lucide-react";

type SocietyMember = { id?: string; user_id: string; role: string; status: string; profiles?: { email?: string; first_name?: string; last_name?: string } | null };
type SocietyPatron = { id?: string; user_id: string; profiles?: { email?: string; first_name?: string; last_name?: string } | null };
export type Society = { id: string; name: string; slug: string; description?: string | null; logo_url?: string | null; contact_email?: string | null; is_active?: boolean; society_members?: SocietyMember[]; society_patrons?: SocietyPatron[] };
type UserInfo = { id: string; email: string; firstName: string; lastName: string; accountType: string; globalRole: string };
export type ReviewEvent = EventItem & { society_id: string; status: string; societies?: { name: string } | null };
const pktDateFormatter = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi", year: "numeric", month: "2-digit", day: "2-digit" });
const pktDateKey = (value: string) => {
  const parts = pktDateFormatter.formatToParts(new Date(value));
  return `${parts.find(part=>part.type==="year")?.value}-${parts.find(part=>part.type==="month")?.value}-${parts.find(part=>part.type==="day")?.value}`;
};

export function HomeDashboard({ user, initialSocieties, initialEvents, now, patronSocietyIds, officeCheckIns, officeCapacity }: { user: UserInfo; initialSocieties: Society[]; initialEvents: ReviewEvent[]; now: number; patronSocietyIds: string[]; officeCheckIns: number | null; officeCapacity: string | null }) {
  const [societies, setSocieties] = useState(initialSocieties); const [events, setEvents] = useState(initialEvents); const [published, setPublished] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(false); const [checkingAssignment, setCheckingAssignment] = useState(false); const [error, setError] = useState(""); const [success, setSuccess] = useState("");
  const [societyName, setSocietyName] = useState(""); const [societySlug, setSocietySlug] = useState(""); const [societyDesc, setSocietyDesc] = useState("");
  const [newSocietyLogo,setNewSocietyLogo]=useState("");
  const [societyFacebook,setSocietyFacebook]=useState(""); const [societyLinkedin,setSocietyLinkedin]=useState(""); const [societyInstagram,setSocietyInstagram]=useState("");
  const [editingSociety, setEditingSociety] = useState<string | null>(null); const [societyContact, setSocietyContact] = useState(""); const [societyActive, setSocietyActive] = useState(true);
  const [assignmentChanges, setAssignmentChanges] = useState<SocietyAssignmentChange[]>([]);
  const [officeTab,setOfficeTab]=useState<"overview"|"societies"|"approvals">("overview");
  const [userTab,setUserTab]=useState<"overview"|"societies"|"reviews"|"events">("overview");
  const [officeSocietyFilter,setOfficeSocietyFilter]=useState("all");
  const [officeStatusFilter,setOfficeStatusFilter]=useState("all");
  const [officeCategoryFilter,setOfficeCategoryFilter]=useState("all");
  const [officeTimeFilter,setOfficeTimeFilter]=useState<"all"|"upcoming"|"past">("all");
  const [officeDateFilter,setOfficeDateFilter]=useState("");
  const router = useRouter(); const office = ["office", "super_admin"].includes(user.globalRole); const faculty = user.accountType === "faculty";
  const toast = useToast();
  useEffect(() => { if (error) toast(error, "error"); }, [error, toast]);
  useEffect(() => { if (success) toast(success, "success"); }, [success, toast]);
  const supabase = useMemo(() => createClient(), []);
  const initialEffectStarted = useRef(false);
  const selectedSociety = societies.find(society => society.id === editingSociety);
  const reload = async ({ refreshEvents = true, refreshSocieties = office }: { refreshEvents?: boolean; refreshSocieties?: boolean } = {}) => {
    const [eventResult, response] = await Promise.all([
      refreshEvents ? supabase.from("events").select("*, societies(name)").order("starts_at", { ascending: true }) : Promise.resolve(null),
      refreshSocieties && office ? fetch("/api/office/societies") : Promise.resolve(null),
    ]);
    if (eventResult?.data) setEvents((eventResult.data as unknown as ReviewEvent[]).map((event) => ({ ...event, society: event.societies?.name ?? "IBA Society" })));
    if (response?.ok) { const data = await response.json() as { societies: Society[] }; setSocieties(data.societies); }
  };
  useEffect(() => {
    if (initialEffectStarted.current) return;
    initialEffectStarted.current = true;
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      supabase.from("events").select("*, societies(name)").eq("is_public", true).neq("status", "cancelled").gt("ends_at", new Date().toISOString()).order("starts_at").then(({data}) => { if (data) setPublished((data as unknown as ReviewEvent[]).map((e)=>({...e,society:e.societies?.name??"IBA Society"}))); });
    }
  }, [office, supabase]);
  const panelistSocieties = useMemo(() => societies.filter(s => s.society_members?.some(m => m.user_id === user.id && m.status === "active")), [societies,user.id]);
  const patronSocieties = useMemo(() => societies.filter(s => s.society_patrons?.some(p => p.user_id === user.id)), [societies,user.id]);
  const patronIds = new Set([...patronSocietyIds, ...patronSocieties.map(society => society.id)]);
  const reviewEvents = events.filter(e => (office && e.status === "pending_ossie") || (patronIds.has(e.society_id) && e.status === "pending_patron"));
  const doReview = async (eventId: string, decision: "approved"|"rejected") => { setError(""); setLoading(true); const response=await fetch(`/api/events/${eventId}/review`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({decision})}); const body=await response.json(); setLoading(false); if(!response.ok){setError(body.error);return;} setSuccess(decision === "approved" ? "Event approved and moved to the next review stage." : "Event rejected."); await reload(); router.refresh(); };
  const createSociety = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setSuccess(""); setLoading(true);
    try {
      const response = await fetch("/api/office/societies", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: societyName, slug: societySlug, description: societyDesc, contactEmail: societyContact, logoUrl: newSocietyLogo, facebookUrl: societyFacebook, linkedinUrl: societyLinkedin, instagramUrl: societyInstagram }) });
      const body = await response.json();
      if (!response.ok) { setError(body.error ?? "Society could not be created."); return; }
      const created = body.society as { id: string; name: string; slug: string; description: string; contact_email: string | null; is_active: boolean };
      const results = await Promise.all(assignmentChanges.map(async change => {
        const assignmentResponse = await fetch("/api/office/societies", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ societyId: created.id, email: change.email, role: change.role, action: "assign" }) });
        const assignmentBody = await assignmentResponse.json();
        return { change, ok: assignmentResponse.ok, error: assignmentBody.error as string | undefined, invited: assignmentBody.invited as boolean | undefined };
      }));
      const failed = results.filter(result => !result.ok);
      const invitations = results.filter(result => result.ok && result.invited).map(result => result.change.email);
      setAssignmentChanges([]);
      setSocietyName(""); setSocietySlug(""); setSocietyDesc(""); setSocietyContact(""); setNewSocietyLogo(""); setSocietyFacebook(""); setSocietyLinkedin(""); setSocietyInstagram("");
      await reload({ refreshEvents: false });
      if (failed.length) {
        setEditingSociety(created.id); setSocietyName(created.name); setSocietySlug(created.slug); setSocietyDesc(created.description ?? ""); setSocietyContact(created.contact_email ?? ""); setSocietyActive(created.is_active);
        setError(failed.map(result => result.error ?? "An assignment could not be saved.").join(" "));
        setSuccess("Society created. Failed assignments were removed from the pending list.");
      } else {
        setSuccess(invitations.length ? `Society and assignments created. Invitation email requested for ${invitations.join(", ")}.` : assignmentChanges.length ? "Society and initial assignments created." : "Society created. You can assign admins or a faculty patron at any time.");
      }
    } catch {
      setError("Could not reach RADES while creating the society. Check your connection and retry.");
    } finally { setLoading(false); }
  };
  const beginSocietyEdit = (society: Society) => { setError(""); setSuccess(""); setEditingSociety(society.id); setAssignmentChanges([]); setSocietyName(society.name); setSocietySlug(society.slug); setSocietyDesc(society.description ?? ""); setSocietyContact(society.contact_email ?? ""); setSocietyActive(society.is_active ?? true); };
  const validateAssignment = async (rawEmail: string, role: SocietyAssignmentChange["role"], societyId?: string) => {
    setError(""); setSuccess(""); setCheckingAssignment(true);
    try {
      const replacing = Boolean(societyId && assignmentChanges.some(change => change.role === role && change.action === "remove"));
      const response = await fetch("/api/office/societies/validate-assignment", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: rawEmail.trim().toLowerCase(), role, ...(societyId ? { societyId } : {}), replacing }) });
      const body = await response.json();
      if (!response.ok) { setError(body.error ?? "This assignment is not valid."); return false; }
      return true;
    } catch {
      setError("Could not verify this assignment. Check your connection and try again.");
      return false;
    } finally { setCheckingAssignment(false); }
  };
  const stageAssignment = async (rawEmail: string, role: SocietyAssignmentChange["role"]) => {
    if (!selectedSociety) return false;
    const email = rawEmail.trim().toLowerCase();
    const existing = role === "panelist"
      ? selectedSociety.society_members?.some(member => member.status === "active" && member.profiles?.email?.toLowerCase() === email)
      : selectedSociety.society_patrons?.some(patron => patron.profiles?.email?.toLowerCase() === email);
    const current = assignmentChanges.find(change => change.role === role && change.email.toLowerCase() === email);
    if (existing) {
      if (current?.action === "remove") { setAssignmentChanges(assignmentChanges.filter(change => change !== current)); setSuccess("Removal canceled; this assignment will stay active."); return true; }
      setError(role === "patron" ? "This faculty member is already the patron of this society." : "This student is already an active admin of this society."); return false;
    }
    if (current?.action === "assign") { setError("This assignment is already waiting to be saved."); return false; }
    if (!await validateAssignment(email, role, selectedSociety.id)) return false;
    setAssignmentChanges([...assignmentChanges.filter(change => !(change.role === role && change.email.toLowerCase() === email)), { email, role, action: "assign" }]);
    setSuccess(`${role === "patron" ? "Faculty patron" : "Society admin"} will be added when you save.`);
    return true;
  };
  const stageCreateAssignment = async (rawEmail: string, role: SocietyAssignmentChange["role"]) => {
    const email = rawEmail.trim().toLowerCase();
    if (assignmentChanges.some(change => change.role === role && change.email.toLowerCase() === email && change.action === "assign")) { setError("This assignment is already in the pending list."); return false; }
    if (role === "patron" && assignmentChanges.some(change => change.role === "patron" && change.action === "assign")) { setError("A society can have only one faculty patron. Remove the pending patron before adding another."); return false; }
    if (role === "panelist" && assignmentChanges.filter(change => change.role === "panelist" && change.action === "assign").length >= 3) { setError("A society can have up to three student admins."); return false; }
    if (!await validateAssignment(email, role)) return false;
    setAssignmentChanges([...assignmentChanges, { email, role, action: "assign" }]); setSuccess("Assignment will be added when the society is created."); return true;
  };
  const stageAssignmentRemoval = (email: string, role: SocietyAssignmentChange["role"]) => {
    setError("");
    const current = assignmentChanges.find(change => change.role === role && change.email.toLowerCase() === email.toLowerCase());
    if (current) {
      setAssignmentChanges(assignmentChanges.filter(change => change !== current));
      setSuccess(current.action === "assign" ? "Pending assignment canceled." : "Removal canceled; this assignment will stay active.");
      return;
    }
    setAssignmentChanges([...assignmentChanges, { email: email.toLowerCase(), role, action: "remove" }]);
    setSuccess("Removal will be applied when you save.");
  };
  const cancelSocietyManagement = () => {
    setEditingSociety(null); setAssignmentChanges([]);
    setSocietyName(""); setSocietySlug(""); setSocietyDesc(""); setSocietyContact(""); setSocietyActive(true); setError(""); setSuccess("");
  };
  const saveSocietyManagement = async () => {
    if (!selectedSociety) return;
    setError(""); setSuccess(""); setLoading(true);
    try {
      const profileResponse = await fetch("/api/office/societies", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ societyId: selectedSociety.id, name: societyName, slug: societySlug, description: societyDesc, contactEmail: societyContact, isActive: societyActive }) });
      const profileBody = await profileResponse.json();
      if (!profileResponse.ok) { setError(profileBody.error ?? "Society details could not be saved."); return; }
      const applyChanges = (changes: SocietyAssignmentChange[]) => Promise.all(changes.map(async change => {
        const response = await fetch("/api/office/societies", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ societyId: selectedSociety.id, email: change.email, role: change.role, action: change.action }) });
        const body = await response.json();
        return { change, ok: response.ok, error: body.error as string | undefined, invited: body.invited as boolean | undefined };
      }));
      // Apply removals first so a staged replacement patron can be added under
      // the unique one-patron-per-society constraint.
      const results = [
        ...await applyChanges(assignmentChanges.filter(change => change.action === "remove")),
        ...await applyChanges(assignmentChanges.filter(change => change.action === "assign")),
      ];
      const failed = results.filter(result => !result.ok);
      const succeeded = results.filter(result => result.ok);
      setAssignmentChanges([]);
      await reload({ refreshEvents: false });
      if (failed.length) {
        setError(failed.map(result => result.error ?? "An assignment change failed.").join(" "));
        if (succeeded.length) setSuccess("Society details and valid assignments were saved. Failed assignments were removed from the pending list.");
        return;
      }
      const invitationEmails = results.filter(result => result.ok && result.change.action === "assign" && result.invited).map(result => result.change.email);
      const savedMessage = invitationEmails.length ? `Society details and assignments saved. Invitation email requested for ${invitationEmails.join(", ")}.` : "Society details and assignments saved.";
      cancelSocietyManagement();
      setSuccess(savedMessage);
    } catch {
      setError("Could not reach RADES while saving. Check your connection and retry.");
    } finally { setLoading(false); }
  };
  const input = "mt-1.5 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-700 focus:ring-4 focus:ring-blue-100";
  const reviewLabel = office ? "OSSIE final approval" : "Patron review";
  const eventState = (event: ReviewEvent) => event.status === "published" ? Date.parse(event.ends_at) < now ? "Finished" : "Upcoming" : event.status === "cancelled" ? "Cancelled" : event.status.replaceAll("_", " ");
  const eventStateClass = (event: ReviewEvent) => event.status === "published" ? Date.parse(event.ends_at) < now ? "bg-slate-100 text-slate-700" : "bg-green-50 text-green-800" : event.status === "cancelled" ? "bg-red-50 text-red-700" : event.status === "rejected" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-800";
  const hasPatronReviews = patronSocieties.length > 0 || patronSocietyIds.length > 0;
  const dashboardTabs: Array<typeof userTab> = ["overview", ...(hasPatronReviews ? ["reviews" as const] : []), ...(faculty ? [] : panelistSocieties.length ? ["societies" as const] : []), "events"];
  const officeStats: Array<[string, string | number, string]> = [["Active societies", societies.filter(s=>s.is_active!==false).length, "text-blue-700"], ["All events", events.length, "text-slate-900"], ["Published events", events.filter(e=>e.status==="published").length, "text-emerald-700"], ["Upcoming", events.filter(e=>e.status==="published"&&Date.parse(e.ends_at)>=now).length, "text-cyan-700"], ["Past", events.filter(e=>e.status==="published"&&Date.parse(e.ends_at)<now).length, "text-violet-700"], ["Draft or in review", events.filter(e=>["draft","pending_patron","pending_ossie"].includes(e.status)).length, "text-amber-700"], ["Total check-ins", officeCheckIns ?? "—", "text-slate-700"], ["Capacity usage", officeCapacity ?? "—", "text-slate-700"]];
  const officeCategories = [...new Set(events.map(event=>event.category))].sort();
  const maxOfficeCategory = Math.max(1, ...officeCategories.map(category=>events.filter(event=>event.category===category).length));
  const officeSocietyStats = societies.map(society=>{const societyEvents=events.filter(event=>event.society_id===society.id);return {...society,total:societyEvents.length,published:societyEvents.filter(event=>event.status==="published").length};});
  const officeEvents = events.filter(event=>{
    return (officeSocietyFilter==="all"||event.society_id===officeSocietyFilter)&&(officeStatusFilter==="all"||event.status===officeStatusFilter)&&(officeCategoryFilter==="all"||event.category===officeCategoryFilter)&&(!officeDateFilter||pktDateKey(event.starts_at)===officeDateFilter)&&(officeTimeFilter==="all"||(officeTimeFilter==="upcoming"&&Date.parse(event.starts_at)>=now)||(officeTimeFilter==="past"&&Date.parse(event.ends_at)<now));
  });
  return <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
    <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end"><div><p className="text-sm font-semibold text-blue-700">{office?"Institutional workspace":"Your RADES workspace"}</p><h1 className="mt-2 text-3xl font-bold tracking-tight">{`Good to see you, ${user.firstName || user.email.split("@")[0]}`}</h1></div></div>
    {!office&&<nav aria-label="Dashboard sections" className="mt-5 flex flex-wrap gap-2">{dashboardTabs.map(tab=><button key={tab} type="button" onClick={()=>setUserTab(tab)} aria-current={userTab===tab?"page":undefined} className={`rounded-xl border px-4 py-2.5 text-sm font-semibold ${userTab===tab?"border-blue-700 bg-blue-700 text-white":"border-slate-300 bg-white text-slate-700 hover:bg-slate-50"}`}>{tab==="reviews"?"Event reviews":tab==="events"?"Explore events":tab==="societies"?"My societies":"Overview"}</button>)}</nav>}
    {office&&<><nav aria-label="OSSIE workspace sections" className="mt-5 flex flex-wrap gap-2">{([["overview","Overview"],["societies","Societies"],["approvals","Approval queue"]] as const).map(([tab,label])=><button type="button" key={tab} onClick={()=>setOfficeTab(tab)} aria-current={officeTab===tab?"page":undefined} className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${officeTab===tab?"border-blue-700 bg-blue-700 text-white shadow-sm":"border-slate-300 bg-white text-slate-700 hover:bg-slate-50"}`}>{label}</button>)}</nav>{officeTab==="overview"&&<><section aria-label="OSSIE overview metrics" className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{officeStats.map(([label,count,color])=><article key={label} className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p><p className={`mt-2 text-2xl font-bold ${color}`}>{count}</p></article>)}</section><p className="mt-2 text-xs text-slate-500">Capacity usage counts confirmed registrations and unexpired payment holds for upcoming published events with a seat limit. A dash means reporting data could not be loaded.</p><section className="mt-6 grid gap-5 lg:grid-cols-2"><article className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="font-bold">Events by category</h2>{officeCategories.length?<ul className="mt-4 space-y-4">{officeCategories.map(category=>{const count=events.filter(event=>event.category===category).length;return <li key={category}><div className="flex justify-between text-sm"><span>{category}</span><span className="font-semibold tabular-nums">{count}</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600" style={{width:`${Math.max(5,count/maxOfficeCategory*100)}%`}}/></div></li>})}</ul>:<p className="mt-3 text-sm text-slate-500">No event records yet.</p>}</article><article className="overflow-x-auto rounded-xl border border-slate-200 bg-white p-5"><h2 className="font-bold">Society breakdown</h2>{officeSocietyStats.length?<table className="mt-4 w-full min-w-[420px] text-left text-sm"><thead><tr className="border-b border-slate-200 text-slate-500"><th className="py-2 pr-3 font-medium">Society</th><th className="px-2 py-2 font-medium">Events</th><th className="px-2 py-2 font-medium">Published</th></tr></thead><tbody>{officeSocietyStats.map(s=><tr key={s.id} className="border-b border-slate-100 last:border-0"><th scope="row" className="py-3 pr-3 font-semibold">{s.name}</th><td className="px-2 py-3">{s.total}</td><td className="px-2 py-3">{s.published}</td></tr>)}</tbody></table>:<p className="mt-3 text-sm text-slate-500">No society records yet.</p>}</article></section></>}</>}
    {office&&officeTab==="societies"&&editingSociety&&selectedSociety&&<OfficeSocietyManager society={selectedSociety} name={societyName} slug={societySlug} description={societyDesc} contactEmail={societyContact} isActive={societyActive} setName={setSocietyName} setSlug={setSocietySlug} setDescription={setSocietyDesc} setContactEmail={setSocietyContact} setIsActive={setSocietyActive} changes={assignmentChanges} onStageAdd={stageAssignment} onStageRemove={stageAssignmentRemoval} onCancel={cancelSocietyManagement} onSave={saveSocietyManagement} busy={loading||checkingAssignment}/>}
    {office&&officeTab==="societies"&&!editingSociety&&<><section className="mt-8 grid items-start gap-5 xl:grid-cols-2"><form id="create-society-form" onSubmit={createSociety} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-center gap-3"><Building2 className="text-blue-700"/><div><h2 className="font-bold">Create a society profile</h2><p className="text-xs text-slate-500">Society is public immediately. A faculty patron may be assigned now or later.</p></div></div><div className="mt-5 space-y-4"><label className="block text-sm font-semibold">Society name<input className={input} value={societyName} onChange={e=>setSocietyName(e.target.value)} required/></label><label className="block text-sm font-semibold">URL slug<input className={input} value={societySlug} onChange={e=>setSocietySlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,"-"))} placeholder="arts-society" required/></label><label className="block text-sm font-semibold">Short description<textarea className="mt-1.5 min-h-24 w-full rounded-xl border border-slate-300 bg-white p-3 text-sm" value={societyDesc} onChange={e=>setSocietyDesc(e.target.value)} maxLength={2000}/></label><label className="block text-sm font-semibold">Contact email (optional)<input className={input} type="email" value={societyContact} onChange={e=>setSocietyContact(e.target.value)}/></label><ImageUpload kind="society-logos" entityId="00000000-0000-4000-8000-000000000001" value={newSocietyLogo} onChange={setNewSocietyLogo}/><label className="block text-sm font-semibold">Facebook URL (optional)<input className={input} type="url" value={societyFacebook} onChange={e=>setSocietyFacebook(e.target.value)}/></label><label className="block text-sm font-semibold">LinkedIn URL (optional)<input className={input} type="url" value={societyLinkedin} onChange={e=>setSocietyLinkedin(e.target.value)}/></label><label className="block text-sm font-semibold">Instagram URL (optional)<input className={input} type="url" value={societyInstagram} onChange={e=>setSocietyInstagram(e.target.value)}/></label></div></form>
      <OfficeCreateAssignments changes={assignmentChanges.filter(change=>change.action==="assign")} onAdd={stageCreateAssignment} onRemove={change=>setAssignmentChanges(assignmentChanges.filter(item=>item!==change))} busy={loading||checkingAssignment}/>
    </section><div className="mt-5 flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs text-slate-500">The society profile and optional assignments will be saved together.</p><div className="flex justify-end gap-3"><button type="button" onClick={()=>{setSocietyName("");setSocietySlug("");setSocietyDesc("");setSocietyContact("");setNewSocietyLogo("");setSocietyFacebook("");setSocietyLinkedin("");setSocietyInstagram("");setAssignmentChanges([]);setError("");setSuccess("");}} disabled={loading||checkingAssignment} className="h-11 rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Cancel</button><button type="submit" form="create-society-form" disabled={loading||checkingAssignment} className="h-11 min-w-40 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60">{loading?"Creating society…":"Create society"}</button></div></div><section className="mt-8"><div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-blue-700">Society directory</p><h2 className="mt-1 text-xl font-bold">Manage societies</h2></div><span className="text-sm text-slate-500">{societies.length} societies</span></div>{societies.length>0?<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{societies.map(s=><article key={s.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="truncate font-semibold">{s.name}</h3><p className="mt-1 truncate text-xs text-slate-500">{s.slug?`/societies/${s.slug}`:"Society profile"}</p></div><button type="button" onClick={()=>beginSocietyEdit(s)} className="shrink-0 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700">Manage</button></div><div className="mt-4 flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-800">{s.society_members?.filter(member=>member.status==="active").length??0} / 3 admins</span><span className={`rounded-full px-2.5 py-1 ${s.society_patrons?.length?"bg-emerald-50 text-emerald-800":"bg-amber-50 text-amber-800"}`}>{s.society_patrons?.length?"Patron assigned":"No patron yet"}</span><span className={`rounded-full px-2.5 py-1 ${s.is_active===false?"bg-slate-100 text-slate-600":"bg-emerald-50 text-emerald-800"}`}>{s.is_active===false?"Inactive":"Public"}</span></div></article>)}</div>:<div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">Create the first society profile using the form above.</div>}</section></>}
    {!office&&(userTab==="societies"||userTab==="overview")&&patronSocieties.length>0&&<section className="mt-8"><div className="mb-4 flex items-center gap-2"><ClipboardCheck className="text-amber-700"/><h2 className="text-xl font-bold">Your societies</h2></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{patronSocieties.map(s=><Link href={`/societies/${s.slug}`} key={s.id} className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-blue-300 hover:shadow-sm"><div className="flex items-center gap-4">{s.logo_url?<Image src={s.logo_url} alt={`${s.name} logo`} width={64} height={64} unoptimized className="h-16 w-16 rounded-xl object-cover"/>:<span aria-hidden className="flex h-16 w-16 items-center justify-center rounded-xl bg-blue-50 text-xl font-bold text-blue-800">{s.name.slice(0,2).toUpperCase()}</span>}<h3 className="text-lg font-bold">{s.name}</h3></div><p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">{s.description||"Learn more about this IBA society."}</p><span className="mt-4 inline-block text-sm font-semibold text-blue-700">View society</span></Link>)}</div></section>}
    {!office&&userTab==="societies"&&panelistSocieties.length>0&&<section className="mt-8 rounded-2xl border border-blue-100 bg-blue-50/60 p-5"><div className="flex items-center gap-2"><UsersRound className="text-blue-700"/><h2 className="font-bold">Society admin access</h2></div><p className="mt-1 text-sm text-slate-600">Open a society workspace to manage its events and submit new events for review.</p><div className="mt-4 flex flex-wrap gap-2">{panelistSocieties.map(s=><Link key={s.id} href={`/admin?society=${s.id}`} className="inline-flex h-10 items-center rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700">Manage {s.name}</Link>)}</div></section>}
    {reviewEvents.length>0&&(office?officeTab==="approvals":userTab==="reviews")&&<section id="approval-queue" className="mt-9"><div className="mb-4 flex items-center gap-2"><ClipboardCheck className="text-blue-700"/><h2 className="text-xl font-bold">Events awaiting your review</h2><span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-800">{reviewEvents.length}</span></div><div className="grid gap-4 lg:grid-cols-2">{reviewEvents.map(e=><article key={e.id} className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase text-blue-700">{e.societies?.name ?? e.society}  |  {reviewLabel}</p><h3 className="mt-2 text-lg font-bold">{e.title}</h3><p className="mt-2 text-sm text-slate-500">{new Date(e.starts_at).toLocaleString("en-PK",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Karachi"})} PKT  |  {e.venue}</p></div><span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">{e.status.replace("_"," ")}</span></div><p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{e.description}</p><div className="mt-4 flex gap-2"><button disabled={loading} onClick={()=>doReview(e.id,"approved")} className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white"><Check size={16}/>{office?"Publish event":"Approve for OSSIE"}</button><button disabled={loading} onClick={()=>doReview(e.id,"rejected")} className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700">Reject</button></div></article>)}</div></section>}
    {office&&officeTab==="approvals"&&reviewEvents.length===0&&<div role="status" className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center"><ClipboardCheck className="mx-auto text-slate-400"/><h2 className="mt-3 font-semibold">No events are waiting for approval</h2><p className="mt-1 text-sm text-slate-500">The approval queue is clear for now.</p></div>}
    {!office&&!faculty&&(userTab==="events"||userTab==="overview")&&<section className="mt-9"><div className="mb-4 flex items-center gap-2"><CalendarDays className="text-blue-700"/><h2 className="text-xl font-bold">Events for everyone</h2></div>{published.length?<div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{published.slice(0,6).map(e=><EventCard key={e.id} event={e}/>)}</div>:<div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">Approved events will appear here as they are published.</div>}</section>}
    {faculty&&userTab==="overview"&&patronSocieties.length===0&&<div className="mt-8 flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600"><CircleUserRound className="text-blue-700"/>You can view published events. OSSIE can attach you to a society as its faculty patron.</div>}
    {panelistSocieties.length===0&&patronSocieties.length===0&&!office&&!faculty&&userTab==="overview"&&<div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50 p-5 text-sm leading-6 text-blue-950">You are signed in as a student. Browse event details below. Society admins receive event management access from OSSIE.</div>}
{office&&officeTab==="overview"&&<section id="all-events" className="mt-8"><div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-end"><div><h2 className="text-xl font-bold">All societies event directory</h2><p className="mt-1 text-sm text-slate-500">Filter events by society, status, category, timeframe, or exact date.</p></div><span className="text-sm text-slate-500">{officeEvents.length} events</span></div><div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"><label className="block text-xs font-semibold">Society<select className={input} value={officeSocietyFilter} onChange={e=>setOfficeSocietyFilter(e.target.value)}><option value="all">All societies</option>{societies.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label><label className="block text-xs font-semibold">Status<select className={input} value={officeStatusFilter} onChange={e=>setOfficeStatusFilter(e.target.value)}><option value="all">All statuses</option>{["draft","pending_patron","pending_ossie","published","rejected","cancelled"].map(status=><option key={status} value={status}>{status.replaceAll("_"," ")}</option>)}</select></label><label className="block text-xs font-semibold">Category<select className={input} value={officeCategoryFilter} onChange={e=>setOfficeCategoryFilter(e.target.value)}><option value="all">All categories</option>{officeCategories.map(category=><option key={category} value={category}>{category}</option>)}</select></label><label className="block text-xs font-semibold">Timeframe<select className={input} value={officeTimeFilter} onChange={e=>setOfficeTimeFilter(e.target.value as "all"|"upcoming"|"past")}><option value="all">All time</option><option value="upcoming">Upcoming</option><option value="past">Past</option></select></label><label className="block text-xs font-semibold">Event date<input type="date" className={input} value={officeDateFilter} onChange={e=>setOfficeDateFilter(e.target.value)}/></label></div>{officeEvents.length?<div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="grid grid-cols-[1.5fr_1fr_1fr_1fr] gap-3 border-b border-slate-200 p-4 text-xs font-semibold uppercase tracking-wide text-slate-500"><span>Event / Society</span><span>Date</span><span>Category</span><span>Status</span></div>{officeEvents.map(event=><article key={event.id} className="grid grid-cols-1 gap-2 border-b border-slate-100 p-4 text-sm last:border-0 sm:grid-cols-[1.5fr_1fr_1fr_1fr] sm:items-center"><div><Link href={"/admin/events/"+event.id+"/analytics"} className="font-semibold text-blue-700 hover:underline">{event.title}</Link><p className="mt-1 text-xs text-slate-500">{event.societies?.name??event.society}</p></div><span className="text-slate-600">{new Date(event.starts_at).toLocaleDateString("en-PK",{dateStyle:"medium",timeZone:"Asia/Karachi"})}</span><span className="text-slate-600">{event.category}</span><span className={"w-fit rounded-full px-2.5 py-1 text-xs font-semibold "+eventStateClass(event)}>{eventState(event)}</span></article>)}</div>:<div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">No events match these filters.</div>}</section>}
  </div>;
}

