import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | RADES",
  description: "Learn how RADES collects, uses, and protects information.",
};

export default function PrivacyPolicyPage() {
  return (
    <article className="mx-auto max-w-3xl px-5 py-14 sm:px-8 sm:py-20">
      <header>
        <p className="text-sm font-semibold text-blue-700">Legal</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-950">Privacy Policy</h1>
        <p className="mt-4 text-sm text-slate-500">Effective date: November 21, 2026</p>
      </header>

      <div className="mt-10 space-y-9 text-sm leading-7 text-slate-600 sm:text-base">
        <section>
          <h2 className="text-xl font-bold text-slate-900">About this policy</h2>
          <p className="mt-3">RADES helps students discover, register for, and manage campus events at IBA Karachi. This policy explains what information we collect, why we collect it, and how it is handled.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900">Information we collect</h2>
          <p className="mt-3">We may collect account details such as your name, email address, profile information, and account role; event and registration details; and technical information necessary to operate and secure the platform. When you make a paid registration, payment card details are processed by our payment provider and are not stored by RADES.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900">How we use information</h2>
          <p className="mt-3">We use information to create and administer accounts, process event registrations and tickets, communicate event updates and confirmations, prevent misuse, provide support, and improve the reliability of RADES. Society and office users may see information needed to manage their events and participants.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900">Sharing and service providers</h2>
          <p className="mt-3">We do not sell personal information. Information may be shared with authorized university offices and society organizers as needed to provide the service, or with service providers that support authentication, database, email, storage, analytics, calendar, or payment operations. Providers process information under their respective privacy and security obligations.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900">Retention and security</h2>
          <p className="mt-3">We retain information only for as long as reasonably necessary for account, event, legal, administrative, and security purposes. We use reasonable technical and organizational safeguards, but no internet service can guarantee absolute security.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900">Your choices</h2>
          <p className="mt-3">You may review or update certain profile details through your account. You can contact the Student Societies Office to request access, correction, or deletion of information, subject to applicable university requirements and legitimate operational records.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900">Contact</h2>
          <p className="mt-3">For privacy questions or requests, contact the Student Societies Office at <a className="font-semibold text-blue-700 hover:underline" href="mailto:ossie@iba.edu.pk">ossie@iba.edu.pk</a>.</p>
        </section>
      </div>
    </article>
  );
}
