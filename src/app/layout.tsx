import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "RADES | Campus events at IBA",
  description: "Discover IBA Karachi campus events, created and approved by the IBA community.",
  icons: { icon: "/Icon.png", shortcut: "/Icon.png", apple: "/Icon.png" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><SiteHeader /><main className="min-h-[calc(100vh-72px)]">{children}</main><footer className="border-t border-slate-200 bg-slate-950 px-5 py-8 text-sm text-slate-400"><div className="mx-auto flex max-w-7xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><span>RADES · SMCS, IBA Karachi</span><span>Campus events, in one place · © {new Date().getFullYear()}</span></div></footer></body></html>;
}
