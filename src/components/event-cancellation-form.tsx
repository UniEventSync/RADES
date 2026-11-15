"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast-provider";

export function EventCancellationForm({eventId}:{eventId:string}) {
 const [reason,setReason]=useState(""); const [busy,setBusy]=useState(false); const [error,setError]=useState(""); const router=useRouter(); const toast=useToast();
 useEffect(()=>{if(error)toast(error,"error")},[error,toast]);
 async function submit(e:React.FormEvent){e.preventDefault();setBusy(true);setError("");try{const response=await fetch(`/api/events/${eventId}/cancel`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({reason})});const body=await response.json();if(!response.ok){setError(body.error??"Cancellation failed.");return;}router.push(`/admin/events/${eventId}/analytics`);router.refresh();}catch{setError("Could not reach RADES.");}finally{setBusy(false);}}
 return <form onSubmit={submit} className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-8"><label className="block text-sm font-semibold">Reason for cancellation<textarea className="mt-2 min-h-28 w-full rounded-xl border border-slate-300 p-3 font-normal" value={reason} onChange={e=>setReason(e.target.value)} minLength={5} maxLength={1000} required/></label><div className="mt-5 rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-950"><h2 className="font-bold">Refund information</h2><p className="mt-1">Participant count and paid amount cannot be calculated because registration and payment records are not implemented. Confirming adds a PKR 0 dummy refund record; it does not send money.</p></div><div className="mt-6 flex flex-wrap justify-end gap-3"><Link href={`/admin/events/${eventId}/analytics`} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold">Keep event</Link><button disabled={busy} className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{busy?"Cancelling…":"Confirm cancellation"}</button></div></form>;
}
