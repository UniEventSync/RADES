import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { DEVELOPMENT_ADMINS } from "../src/lib/auth/email-rules.js";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
const developerPassword = process.env.DEVELOPER_PASSWORD;
if (!url || !secretKey || !developerPassword) throw new Error("Set NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY), and DEVELOPER_PASSWORD in .env.local first.");

const supabase = createClient(url, secretKey, { auth: { autoRefreshToken: false, persistSession: false } });
const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
if (listError) throw listError;
const knownUsers = new Map(existingUsers.users.map(user => [user.email?.toLowerCase() ?? "", user]));
for (const developer of DEVELOPMENT_ADMINS) {
  let user = knownUsers.get(developer.email);
  const userMetadata = { first_name: developer.firstName, last_name: developer.lastName };
  if (user) {
    const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
      password: developerPassword,
      email_confirm: true,
      user_metadata: userMetadata,
    });
    if (error) throw new Error(`Could not update the developer account for ${developer.email}: ${error.message}`);
    user = data.user;
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email: developer.email,
      password: developerPassword,
      email_confirm: true,
      user_metadata: userMetadata,
    });
    if (error) throw new Error(`Could not create ${developer.email}: ${error.message}`);
    user = data.user;
  }

  const { error: profileError } = await supabase.from("profiles").upsert({
    id: user.id,
    email: developer.email,
    first_name: developer.firstName,
    last_name: developer.lastName,
    erp_number: null,
    account_type: "developer",
    global_role: "super_admin",
  }, { onConflict: "id" });
  if (profileError) throw new Error(`Could not grant super-admin access to ${developer.email}: ${profileError.message}`);
  console.log(`${developer.email}: confirmed super-admin account ready`);
}
console.log("All developer accounts now use the configured DEVELOPER_PASSWORD.");
