"use client";
import { useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/browser";

export function ImageUpload({kind,entityId,value,onChange}:{kind:"society-logos"|"event-images";entityId:string;value:string;onChange:(url:string)=>void}) {
 const [busy,setBusy]=useState(false); const [error,setError]=useState("");
 async function upload(file?:File){if(!file)return;setError("");if(!["image/png","image/jpeg","image/webp","image/gif"].includes(file.type)){setError("Choose a PNG, JPEG, WebP, or GIF image.");return;}if(file.size>8*1024*1024){setError("Image must be 8 MB or smaller.");return;}setBusy(true);try{const ext=file.name.split(".").pop()?.toLowerCase()??"png";const path=`${kind}/${entityId}/${crypto.randomUUID()}.${ext}`;const {data,error}=await createClient().storage.from("rades-media").upload(path,file,{contentType:file.type,upsert:false});if(error)throw error;const {data:{publicUrl}}=createClient().storage.from("rades-media").getPublicUrl(data.path);onChange(publicUrl);}catch(e){setError(e instanceof Error?e.message:"Image upload failed.");}finally{setBusy(false);}}
 return <div><label className="block text-sm font-semibold">{kind==="society-logos"?"Society logo":"Event banner"}<input className="mt-2 block w-full text-sm" type="file" accept="image/png,image/jpeg,image/webp,image/gif" disabled={busy} onChange={e=>void upload(e.target.files?.[0])}/></label>{busy&&<p className="mt-2 text-xs text-slate-500">Uploading…</p>}{error&&<p role="alert" className="mt-2 text-xs text-red-700">{error}</p>}{value&&<Image src={value} alt="Uploaded image preview" width={480} height={180} unoptimized className="mt-3 max-h-36 w-auto rounded-lg object-contain"/>}</div>;
}
