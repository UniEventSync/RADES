import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";

export default async function ExploreSocietiesPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("societies").select("id,name,slug,description,logo_url").eq("is_active", true).order("name");
  return <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8"><p className="text-xs font-bold uppercase tracking-[.16em] text-blue-700">Campus community</p><h1 className="mt-2 text-3xl font-bold">Explore Societies</h1><p className="mt-3 max-w-2xl text-slate-600">Meet IBA societies, learn what they do, and find their upcoming events.</p>{error ? <p role="alert" className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-800">Societies could not be loaded.</p> : <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{(data??[]).map(s=> <Link key={s.id} href={`/societies/${s.slug}`} className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-blue-300 hover:shadow-sm"><div className="flex min-w-0 items-center gap-4"><div className="shrink-0">{s.logo_url?<Image src={s.logo_url} alt={`${s.name} logo`} width={64} height={64} unoptimized className="h-16 w-16 rounded-xl object-cover"/>:<span aria-hidden className="flex h-16 w-16 items-center justify-center rounded-xl bg-blue-50 text-xl font-bold text-blue-800">{s.name.slice(0,2).toUpperCase()}</span>}</div><h2 className="break-long-words min-w-0 text-lg font-bold">{s.name}</h2></div><p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">{s.description||"Learn more about this IBA society."}</p><span className="mt-4 inline-block text-sm font-semibold text-blue-700">View society →</span></Link>)}</div>}</main>;
}
