import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !secretKey) throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local first.");

const supabase = createClient(url, secretKey, { auth: { autoRefreshToken: false, persistSession: false } });

async function remove(table: string, column: string, value: string) {
  const query = supabase.from(table).delete().neq(column, value);
  const { error } = await query;
  if (error) throw new Error(`Could not clear ${table}: ${error.message}`);
}

await remove("event_attendance", "ticket_id", "00000000-0000-0000-0000-000000000000");
await remove("event_tickets", "id", "00000000-0000-0000-0000-000000000000");
await remove("registration_email_deliveries", "id", "00000000-0000-0000-0000-000000000000");
await remove("event_feedback", "id", "00000000-0000-0000-0000-000000000000");
await remove("event_refund_transactions", "id", "00000000-0000-0000-0000-000000000000");
await remove("event_payments", "id", "00000000-0000-0000-0000-000000000000");
await remove("stripe_webhook_events", "event_id", "");
await remove("registration_members", "id", "00000000-0000-0000-0000-000000000000");
await remove("registrations", "id", "00000000-0000-0000-0000-000000000000");
await remove("event_approvals", "id", "00000000-0000-0000-0000-000000000000");
await remove("notifications_log", "id", "00000000-0000-0000-0000-000000000000");
await remove("audit_log", "id", "00000000-0000-0000-0000-000000000000");
await remove("events", "id", "00000000-0000-0000-0000-000000000000");

console.log(JSON.stringify({ cleared: true }));
