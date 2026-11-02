import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.OSSIE_EMAIL?.trim().toLowerCase();
const password = process.env.OSSIE_PASSWORD;
if (!url || !serviceKey || !email || !password) throw new Error("Set NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY), OSSIE_EMAIL, and OSSIE_PASSWORD in .env.local first.");
if (email !== "ossie@iba.edu.pk") throw new Error("The fixed OSSIE account address is ossie@iba.edu.pk.");
if (password.length < 16) throw new Error("OSSIE_PASSWORD must be at least 16 characters.");

const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
const { data: users, error: listError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
if (listError) throw listError;
let existing = users.users.find(user => user.email?.toLowerCase() === email);
if (existing) {
  const { data, error } = await supabase.auth.admin.updateUserById(existing.id, { password, email_confirm: true, user_metadata: { first_name: process.env.OSSIE_FIRST_NAME ?? "RADES", last_name: process.env.OSSIE_LAST_NAME ?? "OSSIE" } });
  if (error) throw error; existing = data.user;
} else {
  const { data, error } = await supabase.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { first_name: process.env.OSSIE_FIRST_NAME ?? "RADES", last_name: process.env.OSSIE_LAST_NAME ?? "OSSIE" } });
  if (error) throw error; existing = data.user;
}
const { error: roleError } = await supabase.from("profiles").update({ global_role: "office" }).eq("id", existing.id);
if (roleError) throw roleError;
console.log(`OSSIE account ready: ${email}`);
