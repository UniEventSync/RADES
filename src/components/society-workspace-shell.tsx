import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export type WorkspaceSociety = { id: string; name: string };
export type WorkspaceTab = "dashboard" | "events" | "panel" | "analytics";

export function SocietyWorkspaceShell({ society, societies, tab, children }: { society: WorkspaceSociety; societies: WorkspaceSociety[]; tab: WorkspaceTab; children: React.ReactNode }) {
  const query = `?society=${encodeURIComponent(society.id)}`;
  const tabs: Array<{ id: WorkspaceTab; label: string; href: string }> = [
    { id: "dashboard", label: "Dashboard", href: `/admin${query}` },
    { id: "events", label: "Events", href: `/admin/events${query}` },
    { id: "panel", label: "Panel", href: `/admin/members${query}` },
    { id: "analytics", label: "Analytics", href: `/admin/analytics${query}` },
  ];
  return <div className="min-h-[calc(100vh-72px)]">
    <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
      <Link href={`/admin${query}`} className="text-lg font-bold">RADES Society Workspace <span className="font-normal text-slate-400">|</span> {society.name}</Link>
      <div className="flex flex-wrap items-center gap-2"><ThemeToggle/>{societies.length > 1 && <form method="get" className="flex items-center gap-2"><label className="sr-only" htmlFor="society-switch">Switch society</label><select id="society-switch" name="society" defaultValue={society.id} className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm">{societies.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select><button className="h-10 rounded-lg border border-slate-300 px-3 text-sm font-semibold">Switch Society</button></form>}<Link href="/" className="inline-flex h-10 items-center rounded-lg border border-slate-300 px-3 text-sm font-semibold">Switch Portal</Link></div>
    </div></header>
    <div className="mx-auto grid max-w-7xl gap-6 px-5 py-7 sm:px-8 lg:grid-cols-[210px_1fr]">
      <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-3"><nav aria-label="Society workspace" className="space-y-1">{tabs.map(item => <Link key={item.id} aria-current={tab === item.id ? "page" : undefined} href={item.href} className={`block rounded-lg px-3 py-2.5 text-sm font-semibold ${tab === item.id ? "bg-blue-50 text-blue-800" : "text-slate-700 hover:bg-slate-50"}`}>{item.label}</Link>)}</nav></aside>
      <main className="min-w-0">{children}</main>
    </div>
  </div>;
}
