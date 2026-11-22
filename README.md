# RADES

RADES is a campus event platform for discovering IBA Karachi society events, registering individually or as a team, paying for paid events, receiving QR tickets, checking in, and sharing post-event feedback. Society admins and OSSIE manage event workflows and reporting.

## Run locally

Requirements: Node.js 20.9 or newer, npm, and a configured RADES backend project.

```powershell
npm install
Copy-Item .env.example .env.local
```

Fill in `.env.local` using the sections below. Configure the project’s existing database and authentication setup before starting the app. Then run:

```powershell
npm run dev
```

Open <http://localhost:3000>. `npm run build`, `npm run lint`, and `npm run typecheck` are available for local verification.

## Optional service setup

### Email

Registration, ticket, invitation, and event-update emails use the configured email sender. Set `EMAIL_PROVIDER` and the matching Resend or SMTP credentials in `.env.local`. `EMAIL_TEST_RECIPIENT` can route application emails to a development inbox. Authentication confirmation and invitation messages also require a sender configured in the identity provider.

### Stripe test payments

RADES accepts Stripe test credentials only. In the Stripe Dashboard, switch to **Test mode**, then copy the test secret key (`sk_test_…`) and publishable key (`pk_test_…`) into `.env.local`. For local webhooks, install the Stripe CLI and run:

```powershell
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the CLI’s `whsec_…` signing secret to `STRIPE_WEBHOOK_SECRET` for local testing. Never use live keys for this project.

For the deployed website, keep Stripe in **Test mode** and create a test webhook endpoint in Stripe Dashboard: Developers > Webhooks > Add endpoint. Use `https://<your-domain>/api/stripe/webhook` as the endpoint URL, subscribe to `checkout.session.completed`, `checkout.session.expired`, `checkout.session.async_payment_succeeded`, and `checkout.session.async_payment_failed`, then reveal and copy the endpoint’s `whsec_…` signing secret. Set that test endpoint secret as `STRIPE_WEBHOOK_SECRET` in the deployment environment and redeploy. A test endpoint created in Test mode remains usable on the live deployed URL; do not use a live-mode endpoint or live keys.

### Google Calendar

In Google Cloud Console, create an OAuth 2.0 **Web application** client, enable the Google Calendar API, and add `http://localhost:3000` as an authorized JavaScript origin. Put the client ID in `NEXT_PUBLIC_GOOGLE_CLIENT_ID`. The calendar action requests event access only after the user clicks it; RADES does not store the access token.

## Environment variables

Start from `.env.example`. It lists the required application URL and backend keys, optional email sender settings, Stripe test keys, Google OAuth client ID, and seeded development account settings. Keep `.env.local` private and never commit secrets. The backend secret key must remain server-side.
