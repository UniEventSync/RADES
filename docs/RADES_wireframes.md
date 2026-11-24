# RADES visual wireframes

This index links to full-page desktop captures of the deployed RADES site. They are direct screenshots of the current UI, not reconstructed mockups. All refreshed captures use the same dark theme; the header’s **Light mode** control confirms that dark mode is active. The browser viewport was 1425 px wide. Mobile layouts are out of scope for this pass.

Event-specific captures use two events created during this review and then approved by the patron and OSSIE. Screens showing the approval queue were captured while those events were awaiting the relevant review; the public listings, details, registrations, tickets, and dashboards were captured after publication. No registration changes were made beyond the authorized solo registration, and no teammate was invited.

## Public pages

| Page | Route | Visual capture |
| --- | --- | --- |
| Landing, signed out | `/` | [Open capture](wireframes/live/landing-anonymous.png) |
| Landing, signed in | `/` | [Open capture](wireframes/live/landing.png) |
| Event discovery and filters | `/events` | [Open capture](wireframes/live/events.png) |
| Event details | `/events/[id]` | [Open capture](wireframes/live/event-detail.png) |
| Solo registration form and registered state | `/events/[id]/register-solo` | [Open form](wireframes/live/register-solo.png) · [Open completed registration in profile](wireframes/live/profile-student.png) |
| Team registration form | `/events/[id]/register-team` | [Open capture](wireframes/live/register-team.png) |
| Post-event feedback | `/events/[id]/feedback` | [Open capture](wireframes/live/feedback.png) |
| Society directory | `/societies` | [Open capture](wireframes/live/societies.png) |
| Society profile | `/societies/[slug]` | [Open capture](wireframes/live/society-profile.png) |
| Privacy policy | `/privacy` | [Open capture](wireframes/live/privacy.png) |
| Terms of service | `/terms` | [Open capture](wireframes/live/terms.png) |

## Authentication and account

| Page | Route | Visual capture |
| --- | --- | --- |
| Sign in | `/sign-in` | [Open capture](wireframes/live/sign-in.png) |
| Create account | `/sign-up` | [Open capture](wireframes/live/sign-up.png) |
| Request password reset | `/forgot-password` | [Open capture](wireframes/live/forgot-password.png) |
| Choose a new password | `/reset-password` | [Open capture](wireframes/live/reset-password.png) |
| Email verification notice | `/verify-email` | [Open capture](wireframes/live/verify-email.png) |
| Change password | `/change-password` | [Open capture](wireframes/live/change-password.png) |

## Student pages

| Page | Route | Visual capture |
| --- | --- | --- |
| Regular student dashboard | `/dashboard` | [Open capture](wireframes/live/student-dashboard.png) |
| Student profile and registration history | `/profile` | [Open capture](wireframes/live/profile-student.png) |
| Digital event ticket and QR pass | `/tickets/[id]` | [Open capture](wireframes/live/ticket-detail.png) |
| Checkout success return | `/checkout/success` | [Open capture](wireframes/live/checkout-success.png) |
| Checkout cancellation return | `/checkout/cancel` | [Open capture](wireframes/live/checkout-cancel.png) |

The checkout return routes were captured without a live payment session, so they show the route’s current response rather than a completed paid registration.

## Society workspace

| Page | Route | Visual capture |
| --- | --- | --- |
| Society dashboard | `/admin` | [Open capture](wireframes/live/society-dashboard.png) |
| Event list and workflow statuses | `/admin/events` | [Open capture](wireframes/live/society-events.png) |
| Create event form | `/admin/events/new` | [Open capture](wireframes/live/event-editor.png) |
| Society analytics | `/admin/analytics` | [Open capture](wireframes/live/society-analytics.png) |
| Society panel and admins | `/admin/members` | [Open capture](wireframes/live/society-panel.png) |
| Event analytics | `/admin/events/[id]/analytics` | [Open capture](wireframes/live/event-analytics.png) |
| Event cancellation form | `/admin/events/[id]/cancel` | [Open capture](wireframes/live/event-cancel.png) |
| Ticket check-in | `/admin/events/[id]/check-in` | [Open capture](wireframes/live/check-in.png) |

## Faculty patron workspace

| Page or view | Route | Visual capture |
| --- | --- | --- |
| Patron dashboard | `/dashboard` | [Open capture](wireframes/live/faculty-dashboard.png) |
| Event reviews tab after approval | `/dashboard` | [Open current empty queue](wireframes/live/faculty-event-reviews.png) |

## OSSIE workspace

| Page or view | Route | Visual capture |
| --- | --- | --- |
| Institutional overview and published event directory | `/office` (workspace route resolves to `/dashboard`) | [Open capture](wireframes/live/office-dashboard.png) |
| Society directory and assignment controls | `/office` — Societies tab | [Open capture](wireframes/live/office-societies.png) |
| Final approval queue with the two review events pending | `/office` — Approval queue tab | [Open approval snapshot](wireframes/live/office-approvals.png) |

## Route notes

`/admin/panel`, `/office/analytics`, and `/home` route into their parent workspace/dashboard views and do not have separate page layouts. The student-dashboard capture uses a regular student account, while the society and institutional workspaces use their corresponding accounts. The ticket capture is for the successful solo registration. The team form is shown without submitting or sending an invitation.
