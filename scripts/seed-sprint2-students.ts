import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !secretKey) throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local first.");

const password = "RadesDevPassword123";
const students = [
  { email: "duaa.naz.30668@khi.iba.edu.pk", firstName: "Duaa", lastName: "Naz", erpNumber: "30668" },
  { email: "shahzaib.kazmi.30782@khi.iba.edu.pk", firstName: "Shahzaib", lastName: "Kazmi", erpNumber: "30782" },
  { email: "rayyan.khan.31604@khi.iba.edu.pk", firstName: "Rayyan", lastName: "Khan", erpNumber: "31604" },
] as const;

const supabase = createClient(url, secretKey, { auth: { autoRefreshToken: false, persistSession: false } });
const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
if (listError) throw listError;
const knownUsers = new Map(existingUsers.users.map(user => [user.email?.toLowerCase() ?? "", user]));

for (const student of students) {
  let user = knownUsers.get(student.email);
  if (user) {
    const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
      password,
      email_confirm: true,
      user_metadata: { first_name: student.firstName, last_name: student.lastName, account_type: "student", erp_number: student.erpNumber },
    });
    if (error) throw new Error(`Could not update ${student.email}: ${error.message}`);
    user = data.user;
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email: student.email,
      password,
      email_confirm: true,
      user_metadata: { first_name: student.firstName, last_name: student.lastName, account_type: "student", erp_number: student.erpNumber },
    });
    if (error) throw new Error(`Could not create ${student.email}: ${error.message}`);
    user = data.user;
  }
  const { error: profileError } = await supabase.from("profiles").upsert({
    id: user.id,
    email: student.email,
    first_name: student.firstName,
    last_name: student.lastName,
    erp_number: student.erpNumber,
    account_type: "student",
    global_role: "user",
  }, { onConflict: "id" });
  if (profileError) throw new Error(`Could not configure profile ${student.email}: ${profileError.message}`);
  console.log(`${student.email}: confirmed and ready`);
}
