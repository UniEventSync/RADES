import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Mail } from "lucide-react";

export function SiteFooter() {
  return <footer className="border-t border-slate-800 bg-slate-950 px-5 py-10 text-slate-300 sm:px-8">
    <div className="mx-auto grid max-w-7xl gap-9 sm:grid-cols-[1.4fr_.8fr_.8fr]">
      <div>
        <Link href="/" className="inline-flex items-center gap-3" aria-label="RADES home">
          <Image src="/Icon.png" alt="" width={44} height={44} className="h-11 w-11 object-contain" />
          <span><strong className="block text-base text-white">RADES</strong><span className="text-[10px] font-semibold uppercase tracking-[.16em] text-slate-400">IBA Karachi</span></span>
        </Link>
        <p className="mt-4 max-w-sm text-sm leading-6 text-slate-400">Discover what is happening across campus and keep society events in one place.</p>
      </div>
      <div>
        <h2 className="text-xs font-bold uppercase tracking-[.16em] text-slate-400">Explore</h2>
        <nav aria-label="Footer navigation" className="mt-4 flex flex-col items-start gap-3 text-sm">
          <Link className="hover:text-white" href="/events">Explore events</Link>
          <Link className="hover:text-white" href="/societies">Explore societies</Link>
        </nav>
      </div>
      <div>
        <h2 className="text-xs font-bold uppercase tracking-[.16em] text-slate-400">Student Societies Office</h2>
        <a className="mt-4 inline-flex items-center gap-2 text-sm hover:text-white" href="mailto:ossie@iba.edu.pk"><Mail size={16}/> Contact OSSIE <ArrowUpRight size={14}/></a>
      </div>
    </div>
    <div className="mx-auto mt-9 flex max-w-7xl flex-col gap-4 border-t border-slate-800 pt-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
      <span>RADES · SMCS, IBA Karachi</span>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <Link className="hover:text-white" href="/privacy">Privacy Policy</Link>
        <Link className="hover:text-white" href="/terms">Terms of Service</Link>
        <span>© {new Date().getFullYear()} RADES</span>
      </div>
    </div>
  </footer>;
}
