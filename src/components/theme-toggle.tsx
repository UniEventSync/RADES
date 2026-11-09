"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

const subscribe = (callback: () => void) => {
  window.addEventListener("storage", callback);
  window.addEventListener("rades-theme-change", callback);
  return () => { window.removeEventListener("storage", callback); window.removeEventListener("rades-theme-change", callback); };
};
const getSnapshot = () => localStorage.getItem("rades-theme") === "dark";
const getServerSnapshot = () => false;

export function ThemeToggle() {
  const dark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  useEffect(() => {
    const isDark = localStorage.getItem("rades-theme") === "dark";
    document.documentElement.dataset.theme = isDark ? "dark" : "light";
  }, []);
  const toggleTheme = () => {
    const next = !dark;
    document.documentElement.dataset.theme = next ? "dark" : "light";
    localStorage.setItem("rades-theme", next ? "dark" : "light");
    window.dispatchEvent(new Event("rades-theme-change"));
  };
  return <button type="button" onClick={toggleTheme} aria-label={`Switch to ${dark ? "light" : "dark"} mode`} aria-pressed={dark} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold hover:bg-slate-50">{dark ? <Sun size={16} /> : <Moon size={16} />}<span>{dark ? "Light mode" : "Dark mode"}</span></button>;
}
