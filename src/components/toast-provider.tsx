"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

type Toast = { id: number; message: string; kind: "error" | "success" | "info" };
const ToastContext = createContext<(message: string, kind?: Toast["kind"]) => void>(() => {});
export const useToast = () => useContext(ToastContext);

export function ToastOnMount({ message, kind = "info" }: { message: string; kind?: Toast["kind"] }) {
  const toast = useToast();
  useEffect(() => { toast(message, kind); }, [kind, message, toast]);
  return null;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = useCallback((message: string, kind: Toast["kind"] = "info") => {
    const id = Date.now() + Math.random();
    setToasts(current => [...current, { id, message, kind }]);
    window.setTimeout(() => setToasts(current => current.filter(item => item.id !== id)), 5000);
  }, []);
  useEffect(() => {
    const onToast = (event: Event) => {
      const detail = (event as CustomEvent<{ message: string; kind?: Toast["kind"] }>).detail;
      if (detail?.message) toast(detail.message, detail.kind);
    };
    window.addEventListener("rades:toast", onToast);
    return () => window.removeEventListener("rades:toast", onToast);
  }, [toast]);
  return <ToastContext.Provider value={toast}>{children}<div aria-live="polite" aria-atomic="false" className="fixed right-4 top-4 z-[100] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2">{toasts.map(item => <div key={item.id} role={item.kind === "error" ? "alert" : "status"} className={`rounded-xl border p-4 text-sm font-medium shadow-lg ${item.kind === "error" ? "border-red-200 bg-red-50 text-red-900" : item.kind === "success" ? "border-green-200 bg-green-50 text-green-900" : "border-slate-200 bg-white text-slate-900"}`}>{item.message}</div>)}</div></ToastContext.Provider>;
}
