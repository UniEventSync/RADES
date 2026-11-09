import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "RADES | Campus events at IBA",
  description: "Discover IBA Karachi campus events, created and approved by the IBA community.",
  icons: { icon: "/Icon.png", shortcut: "/Icon.png", apple: "/Icon.png" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" suppressHydrationWarning><body><Script id="rades-theme-init" strategy="beforeInteractive">{`try { document.documentElement.dataset.theme = localStorage.getItem("rades-theme") === "dark" ? "dark" : "light"; } catch { document.documentElement.dataset.theme = "light"; }`}</Script><SiteHeader /><main className="min-h-[calc(100vh-72px)]">{children}</main><footer className="border-t border-slate-200 bg-slate-950 px-5 py-8 text-sm text-slate-400"><div className="mx-auto flex max-w-7xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><span>RADES &middot; SMCS, IBA Karachi</span><span>Campus events, in one place &middot; &copy; {new Date().getFullYear()}</span></div></footer></body></html>;
}
