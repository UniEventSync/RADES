import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SocietyWorkspaceShell } from "@/components/society-workspace-shell";
import { ToastOnMount } from "@/components/toast-provider";

type Person = { first_name: string | null; last_name: string | null; email: string };
type Member = { id: string; user_id: string; role: string; status: string; profiles: Person | Person[] | null };
const personOf = (relation: Person | Person[] | null) => Array.isArray(relation) ? relation[0] : relation;
const displayName = (person: Person | null | undefined, fallback: string) => person ? [person.first_name, person.last_name].filter(Boolean).join(" ") || fallback : fallback;

export default async function SocietyPanelPage({ searchParams }: { searchParams: Promise<{ society?: string }> }) {
  const { society: requestedSociety } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/admin/members");
  const { data: rows } = await supabase.from("society_members").select("society_id,societies(id,name)").eq("user_id", user.id).eq("status", "active");
  const societies = (rows ?? []).flatMap(row => row.societies ?? []);
  if (!societies.length) redirect("/events");
  const society = societies.find(item => item.id === requestedSociety) ?? societies[0];

  // The server-only client loads names and email addresses after the session user
  // has been verified as an active panelist for this exact society.
  const admin = createAdminClient();
  const [{ data: memberRows, error: memberError }, { data: patronRows, error: patronError }] = await Promise.all([
    admin.from("society_members").select("id,user_id,role,status,profiles!society_members_user_id_fkey(first_name,last_name,email)").eq("society_id", society.id).eq("status", "active").order("created_at"),
    admin.from("society_patrons").select("id,user_id,profiles!society_patrons_user_id_fkey(first_name,last_name,email)").eq("society_id", society.id),
  ]);
  const members = (memberRows ?? []) as unknown as Member[];
  const patrons = (patronRows ?? []) as unknown as Array<{ id: string; user_id: string; profiles: Person | Person[] | null }>;
  const patron = patrons[0];
  const patronPerson = patron ? personOf(patron.profiles) : undefined;

  return <SocietyWorkspaceShell society={society} societies={societies} tab="panel">
    <p className="text-xs font-bold uppercase tracking-[.16em] text-blue-700">Society workspace</p><h1 className="mt-2 text-3xl font-bold">Society panel</h1><p className="mt-2 text-sm text-slate-600">The active student admins and faculty patron assigned to {society.name}.</p>
    {memberError || patronError ? <><ToastOnMount message="Society assignments could not be loaded." kind="error"/><p className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">Society assignments are temporarily unavailable.</p></> : <div className="mt-6 grid gap-5 lg:grid-cols-2">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"><div className="flex items-start justify-between gap-3"><div><h2 className="text-xl font-bold">Society admins</h2><p className="mt-1 text-sm text-slate-500">{members.length} of 3 active assignments</p></div><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800">Student panel</span></div>
        {members.length ? <ul className="mt-5 divide-y divide-slate-100">{members.map(member => {const person = personOf(member.profiles);return <li key={member.id} className="flex items-center gap-3 py-4"><span aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-800">{(person?.first_name?.[0] ?? person?.email?.[0] ?? "S").toUpperCase()}</span><div className="min-w-0"><p className="truncate font-semibold">{displayName(person, "Society admin")}</p>{person?.email ? <a href={`mailto:${person.email}`} className="block truncate text-sm text-blue-700 hover:underline">{person.email}</a> : <p className="text-sm text-slate-500">Contact details unavailable</p>}</div><span className="ml-auto text-xs font-medium text-slate-500">Admin</span></li>})}</ul> : <p className="mt-5 rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">No active society admins are assigned.</p>}
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"><div className="flex items-start justify-between gap-3"><div><h2 className="text-xl font-bold">Faculty patron</h2><p className="mt-1 text-sm text-slate-500">The society’s assigned faculty reviewer.</p></div><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">Faculty</span></div>
        {patron ? <div className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-5"><span aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-sm font-bold text-emerald-800">{(patronPerson?.first_name?.[0] ?? patronPerson?.email?.[0] ?? "P").toUpperCase()}</span><div className="min-w-0"><p className="truncate font-semibold">{displayName(patronPerson, "Faculty patron")}</p>{patronPerson?.email ? <a href={`mailto:${patronPerson.email}`} className="block truncate text-sm text-blue-700 hover:underline">{patronPerson.email}</a> : <p className="text-sm text-slate-500">Contact details unavailable</p>}</div></div> : <p className="mt-5 rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">No faculty patron is assigned to this society.</p>}
      </section>
    </div>}
    <p className="mt-5 text-sm text-slate-500">Need an assignment changed? Contact OSSIE.</p>
  </SocietyWorkspaceShell>;
}
