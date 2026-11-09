import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request, { params }: { params: Promise<{id:string}> }) {
  const {id}=await params; const body=z.object({reason:z.string().trim().min(5).max(1000)}).safeParse(await request.json());
  if(!body.success) return NextResponse.json({error:"Add a cancellation reason (at least 5 characters)."},{status:400});
  const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser(); if(!user) return NextResponse.json({error:"Sign in required."},{status:401});
  const {data:event}=await supabase.from("events").select("id,society_id,status,starts_at").eq("id",id).maybeSingle(); if(!event) return NextResponse.json({error:"Event not found."},{status:404});
  const [{data:profile},{data:membership}]=await Promise.all([supabase.from("profiles").select("global_role").eq("id",user.id).maybeSingle(),supabase.from("society_members").select("id").eq("society_id",event.society_id).eq("user_id",user.id).eq("status","active").maybeSingle()]);
  const office=profile?.global_role==="office"||profile?.global_role==="super_admin"; const panelist=Boolean(membership);
  if(!office&&!panelist) return NextResponse.json({error:"You cannot manage this event."},{status:403});
  if(event.status==="cancelled") return NextResponse.json({error:"This event is already cancelled."},{status:409});
  if(!office&&Date.parse(event.starts_at)<=Date.now()) return NextResponse.json({error:"Only OSSIE can force-cancel an event after it has started."},{status:403});
  const {error}=await supabase.from("events").update({status:"cancelled",cancellation_reason:body.data.reason,cancelled_at:new Date().toISOString(),cancelled_by:user.id}).eq("id",id);
  if(error) return NextResponse.json({error:error.message},{status:400});
  const {error:refundError}=await createAdminClient().from("event_refund_transactions").insert({event_id:id,amount_pkr:0,status:"dummy_recorded",note:"Demo placeholder only. No attendee registration or real payment/refund exists.",created_by:user.id});
  if(refundError) return NextResponse.json({error:`Event cancelled, but the demo refund record could not be written: ${refundError.message}`},{status:500});
  return NextResponse.json({ok:true,refund:"dummy_recorded"});
}
