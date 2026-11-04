import { z } from "zod";

export const ERP_DIGITS = 5;
const erp = `\\d{${ERP_DIGITS}}`;
export const STUDENT_EMAIL = new RegExp(`^[a-z]+\\.[a-z]+\\.${erp}@khi\\.iba\\.edu\\.pk$`, "i");
export const FACULTY_EMAIL = /^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*@iba\.edu\.pk$/i;

export type AccountType = "student" | "faculty";
export const DEVELOPMENT_ADMINS = [
  { email: "rayyan@iba.edu.pk", firstName: "Rayyan Hassan", lastName: "Khan" },
  { email: "emad@iba.edu.pk", firstName: "Emad Yar", lastName: "Khan" },
  { email: "shahzaib@iba.edu.pk", firstName: "Shahzaib", lastName: "Kazmi" },
  { email: "duaa@iba.edu.pk", firstName: "Duaa", lastName: "Naz" },
  { email: "abdullah@iba.edu.pk", firstName: "Abdullah", lastName: "Tariq" },
] as const;
export function isDevelopmentAdminEmail(email: string) {
  return DEVELOPMENT_ADMINS.some((developer) => developer.email === email.trim().toLowerCase());
}
export function getAccountType(email: string): AccountType | null {
  const normalized = email.trim().toLowerCase();
  if (STUDENT_EMAIL.test(normalized)) return "student";
  if (FACULTY_EMAIL.test(normalized)) return "faculty";
  return null;
}

export const emailSchema = z.string().trim().email().refine((email) => getAccountType(email) !== null, {
  message: "Use your IBA student or faculty email address.",
});
export const loginEmailSchema = z.string().trim().email().refine((email) => getAccountType(email) !== null || isDevelopmentAdminEmail(email), {
  message: "Use your IBA student or faculty email, or a seeded developer email.",
});

export function deriveStudentIdentity(email: string) {
  if (!STUDENT_EMAIL.test(email)) return null;
  const [firstName, lastName, erpNumber] = email.toLowerCase().split("@")[0].split(".");
  const titleCase = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);
  return { firstName: titleCase(firstName), lastName: titleCase(lastName), erpNumber };
}
