# RADES · Sprint 1

RADES is IBA Karachi's campus event portal. The current sprint includes event search, filtering and sorting, society profile updates, society-level analytics for panelists, and all-society event analytics for OSSIE. Existing functionality includes email/password authentication, student and faculty profiles, OSSIE-managed society setup, up to three student society admins per society, patrons, event creation/editing, two-stage approval, and event browsing/details. Registration, payments, attendance, and calendar integrations remain out of scope; the current database has no registration or check-in records for attendance or revenue analytics.

## What Supabase does here

Supabase is the backend as a service for this app, not just its database. Supabase Auth handles user accounts, password sign-in, sessions, confirmation links, recovery OTPs, and invitations. Supabase Postgres stores profiles, societies, assignments, and events; database triggers enforce role/profile rules, and row-level security controls what each role can read or change. Server-side Supabase Admin operations invite users and bootstrap privileged accounts. Supabase Storage stores public society logos and event banners in the `rades-media` bucket.

## Setup after creating your Supabase project

### 1. Install and configure the app

Use Node.js 20.9 or newer. From the project folder:

```powershell
npm install
Copy-Item .env.example .env.local
```

Fill `.env.local` with your Supabase Project URL, publishable key, and secret key as described in the key reference below. Choose a long unique `OSSIE_PASSWORD`. The secret key and SMTP password must never be committed or exposed in client code.

### 2. Finish the database migrations

The migration files are listed below in application order. Before running one in Supabase Dashboard → SQL Editor, check [`supabase/MIGRATION_STATUS.md`](supabase/MIGRATION_STATUS.md) and verify that the migration has not already been applied. Manually running SQL does not update this repository automatically.

1. `supabase/migrations/202611020002_developer_account_type.sql` — run this file by itself and wait for it to finish/commit.
2. `supabase/migrations/202611020003_developer_profile_constraint.sql`.
3. `supabase/migrations/202611020004_developer_auth_allowlist.sql`.
4. `supabase/migrations/202611020005_society_single_admin_role.sql`.
5. `supabase/migrations/202611080001_wireframe_event_rules.sql`.
6. `supabase/migrations/202611080002_society_profiles.sql`.
7. `supabase/migrations/202611080003_public_event_browsing.sql`.
8. `supabase/migrations/202611090001_public_media_analytics_cancellation.sql`.

The event-rules migration adds event price and participation mode, enforces event edit locks and faculty patron integrity, and adds atomic society creation with a patron. Review any existing societies without a patron and assign one manually before applying it. The society-profiles migration lets active society panelists update public profile fields while preserving OSSIE control of society availability. The public-event-browsing migration allows signed-out visitors to read active society profiles and upcoming published events; drafts, review states, and past events remain unavailable to anonymous visitors. The 9 November migration adds society social links, a public storage bucket and scoped upload policies, event cancellation metadata, a demo refund ledger, and the logo/social fields used by OSSIE's society-creation RPC. It must be applied before using those new UI paths.

The developer account type migration adds a new enum value. It must commit before the profile constraint migration can use it; do not combine these queries into one transaction. The developer auth allowlist migration lets the five named developer emails authenticate and marks their profiles as developer accounts. The seed script grants them the `super_admin` role. The fixed OSSIE account is a separate `office` role. The society role migration normalizes student assignments to the single Society admin role; patrons remain in their own table.

### 3. Configure Supabase Auth and Resend email

In Supabase Dashboard ? Authentication ? URL Configuration:

- Set Site URL to `http://localhost:3000`.
- Add `http://localhost:3000/**` to Redirect URLs.

In Authentication ? Providers ? Email, keep email/password sign-in and email confirmation enabled. Then open Authentication ? SMTP Settings and enter the Resend SMTP values:

- Host: `smtp.resend.com`
- Port: `465`
- Username: `resend`
- Password: your Resend API key
- Sender email: `onboarding@resend.dev`
- Sender name: `RADES`

The Resend API key is in Resend Dashboard ? API Keys. The SMTP password is that same API key. In `.env.local`, keep `EMAIL_PROVIDER=resend`, put the key in `RESEND_API_KEY` and `SMTP_PASSWORD`, and use the sender/host/user values above. Keep the key private and never commit `.env.local`.

Resend provides `onboarding@resend.dev` for testing, but it is not a production sender domain. Resend's verified-domain docs say you need to add and verify a domain you own for general sending. Until you do, expect test sending restrictions: you may only be able to deliver to the email address associated with your Resend account. That means invitations, signup confirmations, and reset codes may not reach the five `@iba.edu.pk` accounts. To deliver to all developers and IBA users, RADES needs a verified sender domain you control and its DNS records configured in Resend. [Resend verified-domain docs](https://resend.com/docs/dashboard/domains/introduction).

In Authentication ? Email Templates, set:

- Confirm signup: contents from `supabase/email-templates/confirm-signup.html`. Signup sends a confirmation link.
- Reset password: contents from `supabase/email-templates/reset-password.html`. Password recovery sends a six-digit OTP which the user enters on the site.
- Invite user: contents from `supabase/email-templates/invite-user.html`. Society admin and patron invitations use a link.

OTP is used only for forgot-password recovery. Account signup uses a confirmation email link. There is no OTP step for normal sign-in.

For a linked Supabase project, update Authentication ? Email Templates ? Reset Password to the contents of `supabase/email-templates/reset-password.html`; the template must include `{{ .Token }}` for the six-digit code. The local `supabase/config.toml` points at this template, but pushing the app migration does not update hosted Auth templates or SMTP settings. Recovery code delivery still depends on a configured SMTP sender that is permitted to send to the recipient's address.
### 4. Create the OSSIE and developer accounts

In `.env.local`, set `OSSIE_PASSWORD` to a strong unique password, then run:

```powershell
npm run seed:ossie
npm run seed:developers
```

The first command creates/updates the fixed OSSIE account `ossie@iba.edu.pk` and assigns it the office role. The second directly creates (or completes any unconfirmed account from an earlier attempt), confirms, and grants `super_admin` to these developers. It sends no email:

- Rayyan Hassan Khan — `rayyan@iba.edu.pk`
- Emad Yar Khan — `emad@iba.edu.pk`
- Shahzaib Kazmi — `shahzaib@iba.edu.pk`
- Duaa Naz — `duaa@iba.edu.pk`
- Abdullah Tariq — `abdullah@iba.edu.pk`

Set `DEVELOPER_PASSWORD` in `.env.local` to the shared development password you want all five to use. The seed script directly creates or updates each account, marks it confirmed, and reapplies the super-admin profile without sending email. Every run sets the same configured password on all five accounts. Developer seeding does not depend on SMTP delivery.

### 5. Run RADES

```powershell
npm run dev
```

Open `http://localhost:3000` for the public landing page. `/home` redirects there; authenticated workspaces are at `/dashboard`. Students and faculty can sign up with their IBA email addresses and confirm through the link they receive. Test forgot-password from the sign-in page; that flow sends the six-digit code for entry on the website. Society admins can use `/admin` for their assigned society's events. OSSIE manages societies and assignments from `/dashboard` and can view campus-wide analytics. Patrons review/approve their society's events first, then OSSIE reviews/approves. Society and event analytics show record fields and event metrics available today; registration, check-in, and revenue metrics need the registration/payment features first.

The site header, sign-in form, and browser icon use `public/Icon.png`.

## Environment key reference

| Variable | Value / where to get it |
| --- | --- |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` locally; deployed site URL later |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard ? Project Settings ? API ? Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase Dashboard ? Project Settings ? API Keys ? publishable key. Intended for the browser; permissions remain limited by RLS. |
| `SUPABASE_SECRET_KEY` | Same API Keys page ? secret key. Server/bootstrap only; never use in `NEXT_PUBLIC_` variables or commit it. |
| `OSSIE_EMAIL` | Fixed value `ossie@iba.edu.pk` |
| `OSSIE_PASSWORD` | Strong, unique password chosen by the developers |
| `OSSIE_FIRST_NAME`, `OSSIE_LAST_NAME` | OSSIE display name |
| `EMAIL_PROVIDER` | Set to `resend` for Resend |
| `RESEND_API_KEY` | Resend Dashboard ? API Keys; copy the same key to `SMTP_PASSWORD` |
| `EMAIL_FROM` | App email sender, `RADES <onboarding@resend.dev>` for testing |
| `SMTP_FROM_EMAIL` | `onboarding@resend.dev` for testing; production needs a verified sender domain |
| `SMTP_HOST` | `smtp.resend.com` |
| `SMTP_PORT` | `465` |
| `SMTP_USER` | `resend` |
| `SMTP_PASSWORD` | Same Resend API key as `RESEND_API_KEY` |
| `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard test keys; Sprint 2 only |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google Cloud OAuth client; Sprint 2 only |

Supabase now recommends the publishable/secret key names. The code still accepts the older anon/service-role variable names if you already configured those. A publishable key may be in browser code; the secret key is highly privileged and stays server-only.

## GitHub

Create an empty GitHub repository, then run these from the project folder (replace the remote):

```powershell
git add .
git commit -m "Build RADES sprint 1 auth and event approvals"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
git push -u origin main
```

`.env.local` is ignored by Git. Commit `.env.example` so collaborators can create their own local configuration. If `origin` already exists, use `git remote set-url origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git` instead of adding it again.















