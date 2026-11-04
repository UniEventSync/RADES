import nodemailer from "nodemailer";
import { Resend } from "resend";

export type OutboundEmail = { to: string; subject: string; html: string; text: string };

export async function sendEmail(message: OutboundEmail) {
  const provider = process.env.EMAIL_PROVIDER ?? (process.env.RESEND_API_KEY ? "resend" : "smtp");
  try {
    if (provider === "resend") {
      const key = process.env.RESEND_API_KEY;
      if (!key) return { sent: false as const, reason: "RESEND_API_KEY is not configured." };
      const resend = new Resend(key);
      const { data, error } = await resend.emails.send({ from: process.env.EMAIL_FROM ?? "RADES <onboarding@resend.dev>", to: message.to, subject: message.subject, html: message.html, text: message.text });
      if (error) { console.error("RADES email delivery failed", error); return { sent: false as const, reason: error.message }; }
      return { sent: true as const, id: data?.id };
    }

    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD } = process.env;
    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD) return { sent: false as const, reason: "SMTP_HOST, SMTP_USER, and SMTP_PASSWORD must be configured." };
    const transporter = nodemailer.createTransport({ host: SMTP_HOST, port: Number(SMTP_PORT ?? 465), secure: Number(SMTP_PORT ?? 465) === 465, auth: { user: SMTP_USER, pass: SMTP_PASSWORD } });
    const result = await transporter.sendMail({ from: process.env.EMAIL_FROM ?? SMTP_USER, to: message.to, subject: message.subject, html: message.html, text: message.text });
    return { sent: true as const, id: result.messageId };
  } catch (error) {
    console.error("RADES email provider request failed", error);
    return { sent: false as const, reason: "Email provider request failed." };
  }
}
