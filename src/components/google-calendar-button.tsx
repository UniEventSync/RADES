"use client";

import Script from "next/script";
import { useCallback, useRef, useState, useSyncExternalStore } from "react";
import { CalendarPlus, LoaderCircle } from "lucide-react";

type TokenResponse = { access_token?: string; error?: string; error_description?: string };
type TokenClient = { requestAccessToken: (options?: { prompt?: string }) => void };
declare global {
  interface Window {
    google?: { accounts?: { oauth2?: { initTokenClient: (options: { client_id: string; scope: string; callback: (response: TokenResponse) => void; error_callback: (error: { type: string }) => void }) => TokenClient } } };
  }
}

function subscribeToCalendarStorage(storageKey: string, callback: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === storageKey) callback();
  };
  const onLocalUpdate = (event: Event) => {
    if (event instanceof CustomEvent && event.detail === storageKey) callback();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener("rades-calendar-storage-change", onLocalUpdate);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("rades-calendar-storage-change", onLocalUpdate);
  };
}

export function GoogleCalendarButton({ event, userId }: { event: { id: string; title: string; description?: string; startsAt: string; endsAt: string; venue: string; url: string }; userId: string }) {
  const [scriptReady, setScriptReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [calendarLink, setCalendarLink] = useState("");
  const tokenClient = useRef<TokenClient | null>(null);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const storageKey = `rades-calendar:${userId}:${event.id}`;
  const subscribe = useCallback((callback: () => void) => subscribeToCalendarStorage(storageKey, callback), [storageKey]);
  const getSnapshot = useCallback(() => window.localStorage.getItem(storageKey) === "1", [storageKey]);
  const getServerSnapshot = useCallback(() => false, []);
  const added = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function markAdded() {
    window.localStorage.setItem(storageKey, "1");
    window.dispatchEvent(new CustomEvent("rades-calendar-storage-change", { detail: storageKey }));
  }

  function showError(value: string) { setError(true); setMessage(value); setBusy(false); }
  function addEvent(accessToken: string) {
    const googleEvent = {
      id: event.id.replaceAll("-", "").toLowerCase(),
      summary: event.title,
      description: `${event.description ? `${event.description}\n\n` : ""}RADES event details: ${new URL(event.url, window.location.origin).href}`,
      location: event.venue,
      start: { dateTime: event.startsAt, timeZone: "Asia/Karachi" },
      end: { dateTime: event.endsAt, timeZone: "Asia/Karachi" },
    };
    void fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(googleEvent),
    }).then(async response => {
      if (response.status === 409) { setError(false); setMessage("This event is already in your Google Calendar."); markAdded(); setBusy(false); return; }
      const body = await response.json().catch(() => null) as { htmlLink?: string; error?: { message?: string } } | null;
      if (!response.ok) { showError(body?.error?.message ?? "Google Calendar could not add this event. Check your Google account permissions and try again."); return; }
      setError(false);
      setMessage(body?.htmlLink ? "Added to Google Calendar." : "Added to Google Calendar successfully.");
      setCalendarLink(body?.htmlLink ?? "");
      markAdded();
      setBusy(false);
    }).catch(() => showError("Could not connect to Google Calendar. Check your connection and try again."));
  }

  function requestCalendarAccess() {
    setMessage(""); setCalendarLink(""); setError(false);
    if (!clientId) { showError("Google Calendar is not configured for this RADES deployment."); return; }
    const oauth = window.google?.accounts?.oauth2;
    if (!oauth) { showError("Google sign-in is still loading. Try again in a moment."); return; }
    setBusy(true);
    tokenClient.current = oauth.initTokenClient({
      client_id: clientId,
      scope: "https://www.googleapis.com/auth/calendar.events",
      callback: response => {
        if (response.error || !response.access_token) { showError(response.error_description ?? "Google Calendar access was not granted."); return; }
        addEvent(response.access_token);
      },
      error_callback: response => showError(response.type === "popup_closed" ? "Google Calendar access was cancelled." : "Google authorization popup could not open. Allow popups and try again."),
    });
    try { tokenClient.current.requestAccessToken({ prompt: "" }); }
    catch { showError("Google Calendar authorization could not start. Try again."); }
  }

  return <div className="w-full">
    <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onReady={() => setScriptReady(true)} onError={() => { setScriptReady(false); showError("Google Calendar authorization did not load. Refresh and try again."); }}/>
    <button type="button" onClick={requestCalendarAccess} disabled={busy || added} aria-describedby={`calendar-message-${event.id}`} className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-800 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-700 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-600"><span aria-hidden="true">{busy ? <LoaderCircle size={17} className="animate-spin"/> : <CalendarPlus size={17}/>}</span>{busy ? "Adding to calendar…" : added ? "Already in Google Calendar" : "+ Google Calendar"}</button>
    {!scriptReady && !message && <p className="sr-only">Google Calendar authorization is loading.</p>}
    <p id={`calendar-message-${event.id}`} role={message ? (error ? "alert" : "status") : undefined} aria-live="polite" className={`mt-2 text-xs ${error ? "text-red-800" : "text-slate-600"}`}>{message}{calendarLink && <> <a href={calendarLink} target="_blank" rel="noopener noreferrer" className="font-semibold underline">Open calendar entry</a></>}</p>
  </div>;
}
