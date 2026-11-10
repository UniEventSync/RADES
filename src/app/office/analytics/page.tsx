import Link from "next/link";
import { redirect } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { createClient } from "@/lib/supabase/server";

type AnalyticsEvent = {
  id: string;
  title: string;
  society_id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  category: string;
  societies: { name: string } | null;
};

export default async function OfficeAnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/office/analytics");

  const { data: profile } = await supabase.from("profiles").select("global_role").eq("id", user.id).maybeSingle();
  if (!profile || !["office", "super_admin"].includes(profile.global_role)) redirect("/dashboard");

  const [{ data: eventsData, error: eventsError }, { data: societiesData, error: societiesError }] = await Promise.all([
    supabase.from("events").select("id,title,society_id,starts_at,ends_at,status,category,societies(name)").order("starts_at", { ascending: false }),
    supabase.from("societies").select("id,name,is_active").order("name"),
  ]);

  const error = eventsError ?? societiesError;
  const events = (eventsData ?? []) as unknown as AnalyticsEvent[];
  const societies = societiesData ?? [];
  // This report is request-rendered and deliberately counts from event records only.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const published = events.filter(event => event.status === "published");
  const upcoming = published.filter(event => Date.parse(event.ends_at) >= now);
  const past = events.filter(event => Date.parse(event.ends_at) < now);
  const reviewOrDraft = events.filter(event => ["draft", "pending_patron", "pending_ossie"].includes(event.status));
  const stats = [
    ["Societies", societies.length],
    ["Events", events.length],
    ["Published", published.length],
    ["Upcoming", upcoming.length],
    ["Past", past.length],
    ["Draft or in review", reviewOrDraft.length],
  ] as const;
  const societyStats = societies.map(society => {
    const societyEvents = events.filter(event => event.society_id === society.id);
    return {
      ...society,
      total: societyEvents.length,
      published: societyEvents.filter(event => event.status === "published").length,
      upcoming: societyEvents.filter(event => event.status === "published" && Date.parse(event.ends_at) >= now).length,
      past: societyEvents.filter(event => Date.parse(event.ends_at) < now).length,
      pending: societyEvents.filter(event => ["draft", "pending_patron", "pending_ossie"].includes(event.status)).length,
    };
  });
  const categories = [...new Set(events.map(event => event.category))].sort();

  return <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
    <div className="flex items-center justify-between"><Link href="/dashboard" className="text-sm font-semibold text-blue-700 hover:underline">← OSSIE workspace</Link><ThemeToggle /></div>
    <header className="mt-5"><p className="text-xs font-bold uppercase tracking-[.16em] text-blue-700">Institutional oversight</p><h1 className="mt-2 text-3xl font-bold">All-society event analytics</h1><p className="mt-2 text-sm text-slate-600">Event counts across every society. Attendance and revenue are not included because registration and check-in records are not available.</p></header>
    {error ? <p role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">Analytics could not be loaded. Try again later.</p> : <>
      <section aria-label="Campus event totals" className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">{stats.map(([label, count]) => <article key={label} className="rounded-xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-600">{label}</p><p className="mt-2 text-3xl font-bold">{count}</p></article>)}</section>
      <section className="mt-8 grid gap-6 lg:grid-cols-[.7fr_1.3fr]">
        <article className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="font-bold">Events by category</h2>{categories.length ? <ul className="mt-4 space-y-3">{categories.map(category => <li key={category} className="flex justify-between gap-3 text-sm"><span>{category}</span><span className="font-semibold">{events.filter(event => event.category === category).length}</span></li>)}</ul> : <p className="mt-3 text-sm text-slate-500">No event records yet.</p>}</article>
        <article className="overflow-x-auto rounded-xl border border-slate-200 bg-white p-5"><h2 className="font-bold">Society breakdown</h2>{societyStats.length ? <table className="mt-4 w-full min-w-[620px] text-left text-sm"><thead><tr className="border-b border-slate-200 text-slate-500"><th className="py-2 pr-4 font-medium">Society</th><th className="px-2 py-2 font-medium">Events</th><th className="px-2 py-2 font-medium">Published</th><th className="px-2 py-2 font-medium">Upcoming</th><th className="px-2 py-2 font-medium">Past</th><th className="px-2 py-2 font-medium">Draft / review</th></tr></thead><tbody>{societyStats.map(society => <tr key={society.id} className="border-b border-slate-100 last:border-0"><th scope="row" className="py-3 pr-4 font-semibold">{society.name}{!society.is_active && <span className="ml-2 text-xs font-normal text-slate-500">Inactive</span>}</th><td className="px-2 py-3">{society.total}</td><td className="px-2 py-3">{society.published}</td><td className="px-2 py-3">{society.upcoming}</td><td className="px-2 py-3">{society.past}</td><td className="px-2 py-3">{society.pending}</td></tr>)}</tbody></table> : <p className="mt-3 text-sm text-slate-500">No society records yet.</p>}</article>
      </section>
      <section className="mt-8 rounded-xl border border-slate-200 bg-white p-5"><h2 className="font-bold">Recent events across societies</h2>{events.length ? <ul className="mt-4 divide-y divide-slate-100">{events.slice(0, 10).map(event => <li key={event.id} className="flex flex-wrap justify-between gap-2 py-3 text-sm"><span><Link href={`/admin/events/${event.id}/analytics`} className="font-semibold text-blue-700 hover:underline">{event.title}</Link><span className="ml-2 text-slate-500">{event.societies?.name ?? "Society"}</span></span><span className="text-slate-600">{new Date(event.starts_at).toLocaleDateString("en-PK", { year: "numeric", month: "short", day: "numeric", timeZone: "Asia/Karachi" })} Â· {event.status.replaceAll("_", " ")}</span></li>)}</ul> : <p className="mt-3 text-sm text-slate-500">No event records yet.</p>}</section>
    </>}
  </main>;
}

