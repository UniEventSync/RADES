import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | RADES",
  description: "Terms governing use of the RADES campus events platform.",
};

export default function TermsOfServicePage() {
  return (
    <article className="mx-auto max-w-3xl px-5 py-14 sm:px-8 sm:py-20">
      <header>
        <p className="text-sm font-semibold text-blue-700">Legal</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-950">Terms of Service</h1>
        <p className="mt-4 text-sm text-slate-500">Effective date: November 21, 2026</p>
      </header>

      <div className="mt-10 space-y-9 text-sm leading-7 text-slate-600 sm:text-base">
        <section>
          <h2 className="text-xl font-bold text-slate-900">Acceptance of terms</h2>
          <p className="mt-3">By accessing or using RADES, you agree to these Terms of Service and to applicable IBA policies. If you do not agree, do not use the platform.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900">Accounts and eligibility</h2>
          <p className="mt-3">You must provide accurate account information and keep it secure. Access may depend on verification of eligibility or an assigned society or office role. You are responsible for activity performed through your account.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900">Events and registrations</h2>
          <p className="mt-3">Society organizers are responsible for event details, approval, scheduling, capacity, communication, and cancellation handling. Publishing an event or issuing a ticket does not guarantee attendance, participation, or that an event will proceed unchanged. Registration does not create a relationship with RADES beyond the platform services described here.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900">Payments and refunds</h2>
          <p className="mt-3">Where an event requires payment, fees are processed through the designated payment provider. Refund eligibility and timing are controlled by the event organizer and any applicable university or payment rules. RADES may assist with communication or records but is not the seller of event admission unless expressly stated.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900">Acceptable use</h2>
          <p className="mt-3">You may not misuse RADES, attempt unauthorized access, interfere with the service, submit false registrations, infringe intellectual-property or privacy rights, or use the platform for unlawful or harmful conduct. RADES may suspend or restrict access to protect users, university operations, or the service.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900">Content and availability</h2>
          <p className="mt-3">Organizers remain responsible for content they publish. RADES may remove content or disable features where necessary to maintain safety, accuracy, or compliance. The service may be unavailable temporarily for maintenance, updates, or circumstances outside our control.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900">Limitation of liability</h2>
          <p className="mt-3">To the extent permitted by law, RADES is provided on an as-available basis. We are not responsible for indirect losses arising from event changes, cancellations, third-party services, or your use of the platform.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900">Changes and contact</h2>
          <p className="mt-3">We may update these terms as the platform or applicable requirements change. Continued use after an update constitutes acceptance of the revised terms. For questions, contact the Student Societies Office at <a className="font-semibold text-blue-700 hover:underline" href="mailto:ossie@iba.edu.pk">ossie@iba.edu.pk</a>.</p>
        </section>
      </div>
    </article>
  );
}
