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

RADES accepts **Stripe test-mode payments only**. Live or production Stripe keys are not supported.

1. Open the [Stripe Dashboard](https://dashboard.stripe.com/) and switch the dashboard to **Test mode**.
2. Copy the test publishable key (`pk_test_…`) into `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
3. Copy the test secret key (`sk_test_…`) into `STRIPE_SECRET_KEY`.
4. Add `STRIPE_WEBHOOK_SECRET` for the test webhook endpoint or local Stripe CLI listener.

Do not add `rk_live_`, `sk_live_`, or `pk_live_` keys to RADES. The application validates that the secret and publishable keys use the test prefixes.

#### Test card details

Use these details only in Stripe Checkout:

| Purpose | Card number | Expiry | CVC | ZIP/postal code |
| --- | --- | --- | --- | --- |
| Successful payment | `4242 4242 4242 4242` | Any future date | Any 3 digits | Any 5 digits |
| Declined payment | `4000 0000 0000 0002` | Any future date | Any 3 digits | Any 5 digits |
| Insufficient funds | `4000 0000 0000 9995` | Any future date | Any 3 digits | Any 5 digits |

RADES creates Checkout Sessions in PKR and allows card payments only. The event total must be between PKR 0.50 and PKR 999,999.99.

#### Local webhook testing

Install the [Stripe CLI](https://docs.stripe.com/stripe-cli), authenticate it with test-mode access, and run:

```powershell
stripe listen --forward-to localhost:3000/api/stripe/webhook --events checkout.session.completed,checkout.session.expired,checkout.session.async_payment_succeeded,checkout.session.async_payment_failed
```

Copy the CLI listener’s `whsec_…` signing secret into `STRIPE_WEBHOOK_SECRET`, then run the app and complete a test payment. Never use live keys for this project.

For the deployed website, keep Stripe in **Test mode** and create a test webhook endpoint in Stripe Dashboard: Developers > Webhooks > Add endpoint. Use `https://<your-domain>/api/stripe/webhook` as the endpoint URL, subscribe to `checkout.session.completed`, `checkout.session.expired`, `checkout.session.async_payment_succeeded`, and `checkout.session.async_payment_failed`, then reveal and copy the endpoint’s `whsec_…` signing secret. Set that test endpoint secret as `STRIPE_WEBHOOK_SECRET` in the deployment environment and redeploy. A test endpoint created in Test mode remains usable on the live deployed URL; do not use a live-mode endpoint or live keys.

### Google Calendar

In Google Cloud Console, create an OAuth 2.0 **Web application** client, enable the Google Calendar API, and add `http://localhost:3000` as an authorized JavaScript origin. Put the client ID in `NEXT_PUBLIC_GOOGLE_CLIENT_ID`. The calendar action requests event access only after the user clicks it; RADES does not store the access token.

## Environment variables

Start from `.env.example`. It lists the required application URL and backend keys, optional email sender settings, Stripe test keys, Google OAuth client ID, and seeded development account settings. Keep `.env.local` private and never commit secrets. The backend secret key must remain server-side.

Set `APP_URL` to the deployed site URL for production, such as `https://rades-beryl.vercel.app`. It is a server-side application setting, not a `NEXT_PUBLIC_*` browser variable.
