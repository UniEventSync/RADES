import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ToastProvider } from "@/components/toast-provider";

export const metadata: Metadata = {
  title: "RADES | Campus events at IBA",
  description: "Discover IBA Karachi campus events, created and approved by the IBA community.",
  icons: { icon: "/Icon.png", shortcut: "/Icon.png", apple: "/Icon.png" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" suppressHydrationWarning><body><ToastProvider><Script id="rades-theme-init" strategy="beforeInteractive">{`try { document.documentElement.dataset.theme = localStorage.getItem("rades-theme") === "dark" ? "dark" : "light"; } catch { document.documentElement.dataset.theme = "light"; }`}</Script><SiteHeader /><main className="min-h-[calc(100vh-72px)]">{children}</main><SiteFooter /></ToastProvider></body></html>;
}
