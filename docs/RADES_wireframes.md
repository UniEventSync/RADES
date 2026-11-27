# RADES visual wireframes

This index links to full-page desktop captures of the deployed RADES site. They are direct screenshots, not reconstructed mockups. The images were captured before the current theme refresh and are retained as layout references; their colors, typography, and corner treatments no longer represent the app. The original captures used a 1425 px browser viewport. Mobile layouts are out of scope for this capture set.

## Current visual theme

The app uses the **Ink & Parchment** palette in both light and dark modes. The theme toggle switches the same semantic colors without changing page layout or content placement. Surfaces are solid, corners are square, hover effects are limited to color changes, and scrollbars use the active theme colors. The footer uses a neutral theme-aware surface with high-contrast text and a transparent logo that blends into the surface. Transactional emails use a consistent light palette and the transparent RADES brand logo.

| Token | Light | Dark |
| --- | --- | --- |
| Page background | `#F5F0E4` | `#10191E` |
| Surface | `#FFFDF6` | `#18252B` |
| Primary action | `#274B5C` | `#315A67` |
| Accent | `#946F2F` | `#D6B674` |
| Main text | `#222A2E` | `#EFE8D8` |
| Border | `#D7CDB9` | `#3A494B` |

The interface uses Georgia with a Times New Roman serif fallback. Transactional emails use the light palette because email clients do not share the app’s theme preference. Success, warning, error, and informational states retain distinct accessible colors within the palette.

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
| Profile and registration history | `/profile` | [Open capture](wireframes/live/profile-student.png) |
| Edit profile details | `/profile/edit` | Separate settings page linked from the profile summary |
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

## Change password

Source: wireframes/live/change-password.png

desktop view

```
+---------------------------------------------------------------------------------------+
|[X] RADES Explore Societies Explore Events Home Workspace [Light mode] [Student Name]  |
+---------------------------------------------------------------------------------------+
|                                                                                       |
|                                    Change Password                                    |
|                 Choose a new password for your RADES account.                         |
|                                                                                       |
|              +--------------------------------------------------------+               |
|              | New Password                                           |               |
|              | [____________________________________________]         |               |
|              | Confirm Password                                       |               |
|              | [____________________________________________]         |               |
|              | [          Update Password          ]                  |               |
|              | Back to RADES                                          |               |
|              +--------------------------------------------------------+               |
|                                                                                       |
|[X] RADES IBA KARACHI        EXPLORE          STUDENT SOCIETIES OFFICE                 |
|Discover what is happening across campus and keep society events in one place.         |
|Explore events    Explore societies    Contact OSSIE                                   |
+---------------------------------------------------------------------------------------+
|RADES - SMCS, IBA Karachi  Privacy Policy  Terms of Service  (c) 2026 RADES            |
+---------------------------------------------------------------------------------------+
```

Regions: Header, centered title, password form card, footer. Purpose: Update a RADES account password.

## Ticket scanner

Source: wireframes/live/check-in.png

desktop view

```
+---------------------------------------------------------------------------------------+
|<- Back to event analytics                                                             |
+---------------------------------------------------------------------------------------+
|SOCIETY EVENT CHECK-IN                                                                 |
|Ticket Scanner                                                                         |
|Validate a participant's QR pass for RADES Wireframe Evidence - Solo                   |
|                                                                                       |
| +----------------------------------------------+  +----------------------------------+|
| |[X] Scan an event ticket                      |  |Validation result                 ||
| |Camera access requires HTTPS or localhost.    |  |Event: RADES Wireframe Evidence   ||
| |                                              |  |- Solo                            ||
| |[ Start camera scanner ]                      |  |                                  ||
| +----------------------------------------------+  | +------------------------------+ ||
| |Manual ticket code                            |  |Scan a QR ticket or enter         ||
| |[ RADES-TICKET...______ ] [ Validate ]        |  |the printed code to see its       ||
| |Use this if the device has no camera          |  |validation result.                ||
| |or camera permission is unavailable.          |  |                                  ||
| |                                              |  | +------------------------------+ ||
| +----------------------------------------------+  +----------------------------------+|
+---------------------------------------------------------------------------------------+
|[X] RADES IBA KARACHI        EXPLORE          STUDENT SOCIETIES OFFICE                 |
|Discover what is happening across campus and keep society events in one place.         |
|Explore events    Explore societies                         Contact OSSIE              |
+---------------------------------------------------------------------------------------+
|RADES - SMCS, IBA Karachi  Privacy Policy  Terms of Service  (c) 2026 RADES            |
+---------------------------------------------------------------------------------------+
```

Regions: Back link, event check-in heading, scanner/manual code card, validation result card, footer. Purpose: Check in participants by scanning a QR pass or validating a printed ticket code.

## Payment not completed

Source: wireframes/live/checkout-cancel.png

desktop view

```
+---------------------------------------------------------------------------------------+
|[X] RADES   Explore Societies   Explore Events   Home   Workspace   [Light mode]       |
+---------------------------------------------------------------------------------------+
|                                                                                       |
|                         +--------------------------------------+                      |
|                         | Payment not completed                |                      |
|                         | No payment was recorded. The event   |                      |
|                         | place may have been released; check  |                      |
|                         | your registration history before    |                       |
|                         | trying again.                       |                       |
|                         +--------------------------------------+                      |
|                         [ View profile ]                                              |
+---------------------------------------------------------------------------------------+
|[X] RADES - IBA Karachi     EXPLORE     STUDENT SOCIETIES OFFICE                       |
|Discover campus events and society activities.   Explore events   Contact OSSIE        |
|Explore societies                  Privacy Policy  Terms of Service  (c) 2026 RADES    |
+---------------------------------------------------------------------------------------+
```

Regions: Header navigation, payment notice, profile button, footer. Purpose: Explain that checkout was cancelled and link to the profile.

## Checkout session not recognized

Source: wireframes/live/checkout-success.png

desktop view

```
+---------------------------------------------------------------------------------------+
|[X] RADES   Explore Societies   Explore Events   Home   Workspace   [Light mode]       |
+---------------------------------------------------------------------------------------+
|                                                                                       |
|                         +--------------------------------------+                      |
|                         | Checkout session not recognized      |                      |
|                         | Open the success page from the Stripe|                      |
|                         | checkout window.                     |                      |
|                         +--------------------------------------+                      |
|                         Go to profile                                                 |
+---------------------------------------------------------------------------------------+
|[X] RADES - IBA Karachi     EXPLORE     STUDENT SOCIETIES OFFICE                       |
|Discover campus events and society activities.   Explore events   Contact OSSIE        |
|Explore societies                  Privacy Policy  Terms of Service  (c) 2026 RADES    |
+---------------------------------------------------------------------------------------+
```

Regions: Header navigation, error notice, profile link, footer. Purpose: Show the checkout-session error and profile link.

## Society event analytics

Source: wireframes/live/event-analytics.png

desktop view

```
+---------------------------------------------------------------------------------------+
|[X] RADES   Explore Societies   Explore Events   Home   Workspace   [Light mode]       |
+---------------------------------------------------------------------------------------+
| <- Society Analytics                                                                  |
| SOCIETY EVENT ANALYTICS                                                               |
| RADES Wireframe Evidence - Solo                                                       |
| Society - Upcoming - published                                                        |
| [ Open ticket scanner ] [ Export CSV ] Public event                                   |
| [ Unpublish event ] [ Cancel event ]                                                  |
|                                                                                       |
| +--------------------------+ +--------------------------+ +--------------------------+|
| | REGISTERED PARTICIPANTS 1 | | TOTAL CHECK-INS 0        | | ATTENDANCE 0.0%         ||
| +--------------------------+ +--------------------------+ +--------------------------+|
| +--------------------------+ +--------------------------+ +--------------------------+|
| | TICKET REVENUE Free       | | CAPACITY 1 / 20          | | FEEDBACK -              ||
| +--------------------------+ +--------------------------+ +--------------------------+|
|                                                                                       |
| +-------------------------------------+ +--------------------------------------+      |
| | Event details                       | | Attendance and refunds              |       |
| | Category: Technology                | | Checked in 0 - 0.0%                 |       |
| | Subcategory: Tech Seminar           | | [==============================]     |      |
| | Venue(s): Student Center            | | No-shows 1                           |      |
| | Starts: 12/12/2026 11:00 am PKT     | | Refund status: No refund records.   |       |
| | Ends: 12/12/2026 12:00 pm PKT       | +--------------------------------------+      |
| +-------------------------------------+                                               |
+---------------------------------------------------------------------------------------+
|[X] RADES - IBA Karachi     EXPLORE     STUDENT SOCIETIES OFFICE                       |
|Discover campus events and society activities.   Explore events   Contact OSSIE        |
|Explore societies                  Privacy Policy  Terms of Service  (c) 2026 RADES    |
+---------------------------------------------------------------------------------------+
```

Regions: Back link, event title/status/actions, metric cards, details and attendance/refunds cards, footer. Purpose: Summarize registrations, check-ins, attendance, ticket revenue, capacity and feedback.

## Cancel event

Source: wireframes/live/event-cancel.png

desktop view

```
+---------------------------------------------------------------------------------------+
|[X] RADES   Explore Societies   Explore Events   Home   Workspace   [Light mode]       |
+---------------------------------------------------------------------------------------+
| <- Event analytics                                                                    |
| SOCIETY EVENT MANAGEMENT                                                              |
| Cancel event                                                                          |
|                                                                                       |
| +--------------------------------------------------------------+                      |
| | CONFIRM EVENT CANCELLATION                                   |                      |
| | RADES Wireframe Evidence - Solo                              |                      |
| | Society - published                                          |                      |
| | Active participants                               1          |                      |
| | Paid registrations eligible for refund            0          |                      |
| | Total refund amount                          PKR 0           |                      |
| +--------------------------------------------------------------+                      |
|                                                                                       |
| +--------------------------------------------------------------+                      |
| | Reason for cancellation                                      |                      |
| | [________________________________________________________]   |                      |
| | This reason will appear in the event record. Use 5-1,000     |                      |
| | characters.                                                  |                      |
| | +----------------------------------------------------------+ |                      |
| | | Refund information                                       | |                      |
| | | No paid registrations are currently eligible for a refund.| |                     |
| | | Unpaid registrations will be cancelled and places released.| |                    |
| | +----------------------------------------------------------+ |                      |
| | [ ] I understand this will cancel the event and deactivate  |                       |
| |     its registrations and tickets.                          |                       |
| | [ Keep event ] [ Confirm cancellation ]                     |                       |
| +--------------------------------------------------------------+                      |
+---------------------------------------------------------------------------------------+
|[X] RADES - IBA Karachi     EXPLORE     STUDENT SOCIETIES OFFICE                       |
|Discover campus events and society activities.   Explore events   Contact OSSIE        |
|Explore societies                  Privacy Policy  Terms of Service  (c) 2026 RADES    |
+---------------------------------------------------------------------------------------+
```

Regions: Back link, title, event/refund summary, cancellation reason, refund info, checkbox, buttons, footer. Purpose: Review cancellation and refund impact before confirming.

## Event details

Source: wireframes/live/event-detail.png

desktop view

```
+---------------------------------------------------------------------------------------+
|[X] RADES   Explore Societies   Explore Events   Home   Workspace   [Light mode]       |
+---------------------------------------------------------------------------------------+
| <- Back to Events                                                                     |
|                                                                                       |
| +---------------------------------------------------+ +---------------------------+   |
| |                                                   | | HOSTED BY COMPUTER SCIENCE|   |
| |                                                   | | SOCIETY                   |   |
| |                    [ Image ]                     | | RADES Wireframe Evidence  |    |
| |                                                   | | - Solo                    |   |
| |                                                   | | Saturday, 12 December 2026|   |
| |                                                   | | 11:00 am - 12:00 pm PKT   |   |
| |                                                   | | Student Center            |   |
| |                                                   | | Seats left 19             |   |
| |                                                   | | FREE                      |   |
| |                                                   | | [You are registered]     |    |
| |                                                   | | [View history]            |   |
| |                                                   | | [ + Google Calendar ]     |   |
| +---------------------------------------------------+ +---------------------------+   |
|                                                                                       |
| +-------------------------------------------------------------------------------+     |
| | About Event                                                                   |     |
| | A free campus technology seminar created to document the complete RADES      |      |
| | event workflow.                                                               |     |
| +-------------------------------------------------------------------------------+     |
+---------------------------------------------------------------------------------------+
|[X] RADES - IBA Karachi     EXPLORE     STUDENT SOCIETIES OFFICE                       |
|Discover campus events and society activities.   Explore events   Contact OSSIE        |
|Explore societies                  Privacy Policy  Terms of Service  (c) 2026 RADES    |
+---------------------------------------------------------------------------------------+
```

Regions: Header navigation, back link, event image, summary/actions, about-event card, footer. Purpose: Show published event information and registration status.

## Create new event

Source: wireframes/live/event-editor.png

desktop view

```
+---------------------------------------------------------------------------------------+
|[X] RADES   Explore Societies   Explore Events   Home   Workspace   [Light mode]       |
+---------------------------------------------------------------------------------------+
| Cancel / Exit                                                                         |
| RADES ADMIN | COMPUTER SCIENCE SOCIETY                                                |
| Create New Event                                                                      |
|                                                                                       |
| +-------------------------------------+  +-------------------------------------+      |
| | Basic Details                       |  | Logistics & Configuration          |       |
| | Event Title                         |  | Venue(s) (choose 1-9)              |       |
| | [_________________________________] |  | [ ] OBS courtyard   [ ] Tabba      |       |
| | Category             Subcategory   |  | [ ] Aman CED        [ ] Fauji lawn |        |
| | [ Technology v ]     [ Hackathon v]|  | [x] Student Center  [ ] Auditorium|         |
| | Event Description                   |  | [ ] Cricket ground  [ ] Football   |       |
| | [_________________________________] |  | [ ] Amphi theatre                   |      |
| | Event banner                        |  | Selected venues appear on event    |       |
| | [ Choose an image ] [ Upload image ]|  | details and registration screens. |        |
| |                                     |  | Start Date and Time (PKT)          |       |
| |                                     |  | [ dd/mm/yyyy --:-- ]               |       |
| |                                     |  | End Date and Time (PKT)            |       |
| |                                     |  | [ dd/mm/yyyy --:-- ]               |       |
| |                                     |  | Capacity Limit (blank = unlimited) |       |
| |                                     |  | [________________]                 |       |
| |                                     |  | Registration Price (PKR) [ 0 ]     |       |
| |                                     |  | Participation Mode                 |       |
| |                                     |  | (o) Solo   ( ) Team                |       |
| +-------------------------------------+  +-------------------------------------+      |
| [ Cancel ]                    [ Save Draft ] [ Submit for approval ]                  |
+---------------------------------------------------------------------------------------+
|[X] RADES - IBA Karachi     EXPLORE     STUDENT SOCIETIES OFFICE                       |
|Discover campus events and society activities.   Explore events   Contact OSSIE        |
|Explore societies                  Privacy Policy  Terms of Service  (c) 2026 RADES    |
+---------------------------------------------------------------------------------------+
```

Regions: Cancel/exit, title, basic-details form, logistics/configuration form, action buttons, footer. Purpose: Create an event and configure venue, schedule, capacity, price and participation mode.

## Upcoming campus events

Source: wireframes/live/events.png

desktop view

```
+---------------------------------------------------------------------------------------+
|[X] RADES   Explore Societies   Explore Events   Home   Workspace   [Light mode]       |
+---------------------------------------------------------------------------------------+
| DISCOVER WHAT'S HAPPENING                                                             |
| UPCOMING CAMPUS EVENTS                                                                |
| 2 upcoming events                                                                     |
|                              [ Search events, societies, venues... ]                  |
|                                                                                       |
| +------------------+   Sort by [ Soonest v ]                                          |
| | Filters          |   +--------------------------+  +--------------------------+     |
| | Category         |   | [ Image ]                |  | [ Image ]                |     |
| | [ ] Technology   |   | Technology - Tech Seminar|  | Technology - Tech Workshop|    |
| | Society          |   | COMPUTER SCIENCE SOCIETY |  | COMPUTER SCIENCE SOCIETY |     |
| | [ All societies v]|  | RADES Wireframe Evidence |  | RADES Wireframe Evidence |     |
| | Event date       |   | - Solo                   |  | - Team Challenge         |     |
| | [ dd/mm/yyyy ]   |   | A free campus technology |  | A free campus technology |     |
| | Registration Type|   | seminar created to doc... |  | workshop with team...    |    |
| | (o) All          |   | Sat, 12 Dec - 11:00 am   |  | Sun, 13 Dec - 11:00 am   |     |
| | ( ) Free         |   | Student Center           |  | Student Center           |     |
| | ( ) Paid         |   | FREE - Capacity 20       |  | FREE - Capacity 24       |     |
| | [ Clear All      |   | [ View Details ]         |  | [ View Details ]         |     |
| |     Filters ]    |   +--------------------------+  +--------------------------+     |
| +------------------+                                                                  |
+---------------------------------------------------------------------------------------+
|[X] RADES - IBA Karachi     EXPLORE     STUDENT SOCIETIES OFFICE                       |
|Discover campus events and society activities.   Explore events   Contact OSSIE        |
|Explore societies                  Privacy Policy  Terms of Service  (c) 2026 RADES    |
+---------------------------------------------------------------------------------------+
```

Regions: Header, title/count, search, filter sidebar, sort control, event cards, footer. Purpose: Discover and filter upcoming campus events.

## Faculty patron dashboard

Source: wireframes/live/faculty-dashboard.png

desktop view

```
+---------------------------------------------------------------------------------------+
|[X] RADES   Explore Societies   Explore Events   Home   Workspace   [Light mode]       |
+---------------------------------------------------------------------------------------+
| Your RADES workspace                                                                  |
|Good to see you, Faculty Patron                                                        |
| [x Overview] [ Event reviews ] [ Explore events ]                                     |
|                                                                                       |
| Your societies                                                                        |
|                                                                                       |
| +--------------------------------------+                                              |
| | [X] Computer Science Society         |                                              |
| | A computer Science Society to handle |                                              |
| | the CS stuff.                        |                                              |
| | View society                         |                                              |
| +--------------------------------------+                                              |
+---------------------------------------------------------------------------------------+
|[X] RADES - IBA Karachi     EXPLORE     STUDENT SOCIETIES OFFICE                       |
|Discover campus events and society activities.   Explore events   Contact OSSIE        |
|Explore societies                  Privacy Policy  Terms of Service  (c) 2026 RADES    |
+---------------------------------------------------------------------------------------+
```

Regions: Header, greeting, tabs, society card, footer. Purpose: Show assigned societies and provide access to event reviews.

## Faculty event reviews

Source: wireframes/live/faculty-event-reviews.png

desktop view

```
+---------------------------------------------------------------------------------------+
|[X] RADES   Explore Societies   Explore Events   Home   Workspace   [Light mode]       |
+---------------------------------------------------------------------------------------+
| Your RADES workspace                                                                  |
|Good to see you, Faculty Patron                                                        |
| [ Overview ] [x Event reviews] [ Explore events ]                                     |
|                                                                                       |
| +-------------------------------------------------------------------------------+     |
| | No events are waiting for your review                                        |      |
| | The patron review queue is clear for now.                                    |      |
| +-------------------------------------------------------------------------------+     |
+---------------------------------------------------------------------------------------+
|[X] RADES - IBA Karachi     EXPLORE     STUDENT SOCIETIES OFFICE                       |
|Discover campus events and society activities.   Explore events   Contact OSSIE        |
|Explore societies                  Privacy Policy  Terms of Service  (c) 2026 RADES    |
+---------------------------------------------------------------------------------------+
```

Regions: Header, greeting, tabs with Event reviews selected, empty review notice, footer. Purpose: Show that the patron review queue is clear.

## Post-event feedback submission

Source: wireframes/live/feedback.png

desktop view

```
+---------------------------------------------------------------------------------------+
|[X]|Explore Societies|Explore Events|Home|Workspace|<-Back to Events|Light mode|name...|
+---------------------------------------------------------------------------------------+
|<- Back to profile                                                                     |
|RADES - POST-EVENT FEEDBACK                                                            |
|Post-Event Feedback Submission                                                         |
|                                                                                       |
|                +-------------------------------------------------------+              |
|                |Event: RADES Wireframe Evidence - Solo | Host: Society |              |
|                +-------------------------------------------------------+              |
|                | +---------------------------------------------------+ |              |
|                | |Feedback opens after the event ends.               | |              |
|                | +---------------------------------------------------+ |              |
|                +-------------------------------------------------------+              |
|                                                                                       |
+---------------------------------------------------------------------------------------+
|[X] RADES IBA KARACHI        EXPLORE          STUDENT SOCIETIES OFFICE                 |
|Discover what is happening across campus and keep society events in one place.         |
|Explore events    Explore societies                         Contact OSSIE              |
+---------------------------------------------------------------------------------------+
|RADES - SMCS, IBA Karachi  Privacy Policy  Terms of Service  (c) 2026 RADES            |
+---------------------------------------------------------------------------------------+
```

Regions: Header and navigation, profile back link, feedback heading, event summary card, notice, footer. Purpose: Tell the participant that feedback opens after the event ends.

## Reset password

Source: wireframes/live/forgot-password.png

desktop view

```
+---------------------------------------------------------------------------------------+
|[X] RADES                    Back to Sign In                 [Light mode]              |
+---------------------------------------------------------------------------------------+
|                                                                                       |
|                                    Reset Password                                     |
|           Enter your institutional email to receive a password reset code.            |
|                                                                                       |
|             +----------------------------------------------------------+              |
|             | IBA Email                                                |              |
|             | [____________________________________________]           |              |
|             | [          Send reset code          ]                    |              |
|             | Back to Sign In                                          |              |
|             +----------------------------------------------------------+              |
|                                                                                       |
|[X] RADES - IBA Karachi     EXPLORE     STUDENT SOCIETIES OFFICE                       |
|Discover campus events and society activities.   Explore events   Contact OSSIE        |
|Explore societies                  Privacy Policy  Terms of Service  (c) 2026 RADES    |
+---------------------------------------------------------------------------------------+
```

Regions: Auth header, back-to-sign-in link, title, email form card, footer. Purpose: Request a password reset code by institutional email.

## Landing page - signed out

Source: wireframes/live/landing-anonymous.png

desktop view

```
+---------------------------------------------------------------------------------------+
|[X] RADES   Explore Societies   Explore Events   Home   Workspace   [Light mode]       |
+---------------------------------------------------------------------------------------+
| [X] RADES   Explore Societies   Explore Events   [Light mode] [Sign In]               |
|                                                                                       |
| [ IBA campus events, together ]                                                       |
| Find your next campus moment.                                                         |
| Discover what's happening across IBA Karachi. Explore society events,                 |
| get the details, and make campus life yours.                                          |
| [ Browse events ] [ Join RADES ]                                                      |
| Sign in with your verified IBA email.                                                 |
|                                                                                       |
| +---------------------------------------+  +--------------------------------------+   |
| | YOUR CAMPUS CALENDAR                  |  | [ Image ]                            |   |
| | RADES Wireframe Evidence - Solo       |  | RADES Wireframe Evidence - Team      |   |
| | Student Center - 11:00 am PKT         |  | Challenge - Student Center            |  |
| | RADES Wireframe Evidence - Team       |  | Events reviewed by your campus       |   |
| | Challenge - Student Center            |  | community                            |   |
| | [ Trusted events, one place ]         |  +--------------------------------------+   |
| +---------------------------------------+                                             |
|                                                                                       |
| Discover              Reviewed               Stay in the loop                         |
|                                                                                       |
| What's coming up - Upcoming events                                                    |
|                                                                                       |
| +--------------------------------------+  +--------------------------------------+    |
| | RADES Wireframe Evidence - Solo      |  | RADES Wireframe Evidence - Team      |    |
| | Computer Science Society            |  | Challenge - Computer Science Society |     |
| | Student Center - FREE - Capacity 20  |  | Student Center - FREE - Capacity 24  |    |
| | [ View Details ]                    |  | [ View Details ]                     |     |
| +--------------------------------------+  +--------------------------------------+    |
|                                                                                       |
| Bring your society events to RADES       [ Society workspace ]                        |
+---------------------------------------------------------------------------------------+
|[X] RADES - IBA Karachi     EXPLORE     STUDENT SOCIETIES OFFICE                       |
|Discover campus events and society activities.   Explore events   Contact OSSIE        |
|Explore societies                  Privacy Policy  Terms of Service  (c) 2026 RADES    |
+---------------------------------------------------------------------------------------+
```

Regions: Public nav, hero, campus calendar, value strip, event cards, join prompt, footer. Purpose: Introduce campus events and invite visitors to browse or join RADES.

## Landing page - signed in

Source: wireframes/live/landing.png

desktop view

```
+---------------------------------------------------------------------------------------+
|[X] RADES   Explore Societies   Explore Events   Home   Workspace   [Light mode]       |
+---------------------------------------------------------------------------------------+
| [X] RADES  Explore Societies  Explore Events  Home  Workspace [Light mode] [account]  |
|                                                                                       |
| [ IBA campus events, together ]                                                       |
| Find your next campus moment.                                                         |
| Discover what's happening across IBA Karachi. Explore society events,                 |
| get the details, and make campus life yours.                                          |
| [ Browse events ] [ Open workspace ]                                                  |
|                                                                                       |
| +---------------------------------------+  +--------------------------------------+   |
| | YOUR CAMPUS CALENDAR                  |  | [ Image ]                            |   |
| | RADES Wireframe Evidence - Solo       |  | RADES Wireframe Evidence - Team      |   |
| | Student Center - 11:00 am PKT         |  | Challenge - Student Center            |  |
| | RADES Wireframe Evidence - Team       |  | Events reviewed by your campus       |   |
| | Challenge - Student Center            |  | community                            |   |
| | [ Trusted events, one place ]         |  +--------------------------------------+   |
| +---------------------------------------+                                             |
|                                                                                       |
| Discover              Reviewed               Stay in the loop                         |
|                                                                                       |
| What's coming up - Upcoming events                                                    |
|                                                                                       |
| +--------------------------------------+  +--------------------------------------+    |
| | RADES Wireframe Evidence - Solo      |  | RADES Wireframe Evidence - Team      |    |
| | Computer Science Society            |  | Challenge - Computer Science Society |     |
| | Student Center - FREE - Capacity 20  |  | Student Center - FREE - Capacity 24  |    |
| | [ View Details ]                    |  | [ View Details ]                     |     |
| +--------------------------------------+  +--------------------------------------+    |
|                                                                                       |
| Bring your society events to RADES       [ Open workspace ]                           |
+---------------------------------------------------------------------------------------+
|[X] RADES - IBA Karachi     EXPLORE     STUDENT SOCIETIES OFFICE                       |
|Discover campus events and society activities.   Explore events   Contact OSSIE        |
|Explore societies                  Privacy Policy  Terms of Service  (c) 2026 RADES    |
+---------------------------------------------------------------------------------------+
```

Regions: Public nav, hero, calendar, value strip, event cards, workspace prompt, footer. Purpose: Show campus events and actions available to a signed-in visitor.

## OSSIE approval queue

Source: wireframes/live/office-approvals.png

desktop view

```
+---------------------------------------------------------------------------------------+
|[X] RADES   Explore Societies   Explore Events   Home   Workspace   [Light mode]       |
+---------------------------------------------------------------------------------------+
| Institutional workspace                                                               |
| Good to see you, RADES                                                                |
| [ Overview ] [ Societies ] [x Approval queue ]                                        |
|                                                                                       |
| Events awaiting your review (2)                                                       |
|                                                                                       |
| +--------------------------------------+  +--------------------------------------+    |
| | COMPUTER SCIENCE SOCIETY             |  | COMPUTER SCIENCE SOCIETY             |    |
| | OSSIE FINAL APPROVAL [pending ossie]  |  | OSSIE FINAL APPROVAL [pending ossie] |   |
| | RADES Wireframe Evidence - Solo      |  | RADES Wireframe Evidence - Team      |    |
| | 12-Dec-2026, 11:00 am PKT            |  | Challenge                           |     |
| | Student Center                       |  | 13-Dec-2026, 11:00 am PKT            |    |
| | A free campus technology seminar...  |  | Student Center                       |    |
| | [ Publish event ] [ Reject ]         |  | [ Publish event ] [ Reject ]         |    |
| +--------------------------------------+  +--------------------------------------+    |
|                                                                                       |
| OSSIE can attach you to a society as its faculty patron.                              |
+---------------------------------------------------------------------------------------+
|[X] RADES - IBA Karachi     EXPLORE     STUDENT SOCIETIES OFFICE                       |
|Discover campus events and society activities.   Explore events   Contact OSSIE        |
|Explore societies                  Privacy Policy  Terms of Service  (c) 2026 RADES    |
+---------------------------------------------------------------------------------------+
```

Regions: Header, workspace heading, tabs, pending event cards, OSSIE notice, footer. Purpose: Review pending society events for publication approval.

## Institutional workspace

Source: wireframes/live/office-dashboard.png

desktop view

```
+---------------------------------------------------------------------------------------+
|[X] RADES|Explore Societies|Explore Events|Home|Workspace|Light mode|name@khi...       |
+---------------------------------------------------------------------------------------+
|Institutional workspace                                                                |
|Good to see you, RADES                                                                 |
|[x Overview] [ Societies ] [ Approval queue ]                                          |
|                                                                                       |
| +------------------------+  +------------------------+  +------------------------+    |
| |ACTIVE SOCIETIES        |  |ALL EVENTS              |  |PUBLISHED EVENTS        |    |
| |5                       |  |3                       |  |3                       |    |
| +------------------------+  +------------------------+  +------------------------+    |
| +------------------------+  +------------------------+  +------------------------+    |
| |UPCOMING                |  |PAST                    |  |DRAFT OR IN REVIEW      |    |
| |2                       |  |1                       |  |0                       |    |
| +------------------------+  +------------------------+  +------------------------+    |
| +-------------------------------------+  +-------------------------------------+      |
| |TOTAL CHECK-INS                      |  |CAPACITY USAGE                       |      |
| |0                                    |  |1 / 44                               |      |
| +-------------------------------------+  +-------------------------------------+      |
|Capacity usage counts confirmed registrations and unexpired payment holds for          |
|upcoming published events with a seat limit. A dash means reporting data               |
|could not be loaded.                                                                   |
|                                                                                       |
| +---------------------------------+  +-----------------------------------------------+|
| |Events by category               |  |Society breakdown                              ||
| |Technology  3  [Chart]           |  |+--------------------------+--------+---------+||
| |                                 |  ||Society                   |Events  |Published|||
| |                                 |  |+--------------------------+--------+---------+||
| |                                 |  ||Rayyan's Mortuary         |0       |0        |||
| |                                 |  ||Computer Science Society  |3       |3        |||
| |                                 |  ||abdullah gang             |0       |0        |||
| |                                 |  ||Data Science Society      |0       |0        |||
| |                                 |  ||asasa                     |0       |0        |||
| +---------------------------------+  +-----------------------------------------------+|
| +-----------------------------------------------------------------------------------+ |
| |You can view published events. OSSIE can attach you to a society as its            | |
| |faculty patron.                                                                    | |
| +-----------------------------------------------------------------------------------+ |
|                                                                                       |
|All societies event directory                                                          |
|Filter events by society, status, category, timeframe, or exact date.     3 events     |
| +-----------------------------------------------------------------------------------+ |
| |Society         Status          Category        Timeframe       Event date         | |
| |[All societies] [All statuses]  [All categories] [All time]      [dd/mm/yyyy]      | |
| +-----------------------------------------------------------------------------------+ |
|                                                                                       |
| +--------------------------------------------+------------+-------------+----------+  |
| |EVENT / SOCIETY                             |DATE        |CATEGORY     |STATUS    |  |
| +--------------------------------------------+------------+-------------+----------+  |
| |Test event 1                                |22-Nov-2026 |Technology   |Finished  |  |
| |Computer Science Society                    |            |             |          |  |
| +--------------------------------------------+------------+-------------+----------+  |
| |RADES Wireframe Evidence - Solo             |12-Dec-2026 |Technology   |Upcoming  |  |
| |Computer Science Society                    |            |             |          |  |
| +--------------------------------------------+------------+-------------+----------+  |
| |RADES Wireframe Evidence - Team Challenge   |13-Dec-2026 |Technology   |Upcoming  |  |
| |Computer Science Society                    |            |             |          |  |
| +--------------------------------------------+------------+-------------+----------+  |
+---------------------------------------------------------------------------------------+
|[X] RADES IBA KARACHI        EXPLORE          STUDENT SOCIETIES OFFICE                 |
|Discover what is happening across campus and keep society events in one place.         |
|Explore events    Explore societies                         Contact OSSIE              |
+---------------------------------------------------------------------------------------+
|RADES - SMCS, IBA Karachi  Privacy Policy  Terms of Service  (c) 2026 RADES            |
+---------------------------------------------------------------------------------------+
```

Regions: Header and navigation, workspace heading and tabs, metric cards, chart and society breakdown, notice, filters, event table, footer. Purpose: Review institutional totals and browse the society event directory.

## Society management

Source: wireframes/live/office-societies.png

desktop view

```
+---------------------------------------------------------------------------------------+
|[X] RADES   Explore Societies   Explore Events   Home   Workspace   [Light mode]       |
+---------------------------------------------------------------------------------------+
| Institutional workspace                                                               |
| Good to see you, RADES                                                                |
| [ Overview ] [x Societies ] [ Approval queue ]                                        |
|                                                                                       |
| +--------------------------------------+  +--------------------------------------+    |
| | Create a society profile             |  | Initial assignments                  |    |
| | Society name                         |  | Assignment type                      |    |
| | [__________________________________] |  | [ Society admin (student) v ]        |    |
| | URL slug                             |  | IBA email                            |    |
| | [ arts-society____________________ ] |  | [ firstname.lastname.ERP@khi... ]   |     |
| | Short description                    |  | [ Add assignment ]                   |    |
| | [__________________________________] |  | Will be assigned on save             |    |
| | Contact email (optional)             |  | No assignments added yet.            |    |
| | Society logo [ Choose an image ]     |  +--------------------------------------+    |
| | Facebook URL (optional)              |                                              |
| | LinkedIn URL (optional)              |                                              |
| | Instagram URL (optional)             |                                              |
| +--------------------------------------+                                              |
| [ Cancel ] [ Create society ]                                                         |
|                                                                                       |
| SOCIETY DIRECTORY - Manage societies (5 societies)                                    |
|                                                                                       |
| +--------------------------------------+  +--------------------------------------+    |
| | Rayyan's Mortuary [ Manage ]         |  | Computer Science Society [ Manage ]  |    |
| | 0 / 3 admins - No patron yet - Public |  | 3 / 3 admins - Patron assigned       |   |
| +--------------------------------------+  +--------------------------------------+    |
|                                                                                       |
| OSSIE can attach you to a society as its faculty patron.                              |
+---------------------------------------------------------------------------------------+
|[X] RADES - IBA Karachi     EXPLORE     STUDENT SOCIETIES OFFICE                       |
|Discover campus events and society activities.   Explore events   Contact OSSIE        |
|Explore societies                  Privacy Policy  Terms of Service  (c) 2026 RADES    |
+---------------------------------------------------------------------------------------+
```

Regions: Header, workspace tabs, create-society/assignment forms, society cards, notice, footer. Purpose: Create society profiles, assign admins, and manage the society directory.

## Privacy policy

Source: wireframes/live/privacy.png

desktop view

```
+---------------------------------------------------------------------------------------+
|[X] RADES IBA KARACHI  Explore Societies  Explore Events  [Light mode]  Sign In        |
+---------------------------------------------------------------------------------------+
|Legal                                                                                  |
|Privacy Policy                                                                         |
|Effective date: November 21, 2026                                                      |
|                                                                                       |
|About this policy                                                                      |
|RADES helps students discover, register for, and manage campus events at IBA Karachi.  |
|This policy explains what information we collect, why we collect it, and how it is     |
|handled.                                                                               |
|                                                                                       |
|Information we collect                                                                 |
|We may collect account details such as your name, email address, profile information,  |
|and account role; event and registration details; and technical information necessary  |
|to operate and secure the platform. When you make a paid registration, payment card    |
|details are processed by our payment provider and are not stored by RADES.             |
|                                                                                       |
|How we use information                                                                 |
|We use information to create and administer accounts, process event registrations and  |
|tickets, communicate event updates and confirmations, prevent misuse, provide support, |
|and improve the reliability of RADES. Society and office users may see information     |
|needed to manage their events and participants.                                        |
|                                                                                       |
|Sharing and service providers                                                          |
|We do not sell personal information. Information may be shared with authorized         |
|university offices and society organizers as needed to provide the service, or with    |
|service providers that support authentication, database, email, storage, analytics,    |
|calendar, or payment operations. Providers process information under their respective  |
|privacy and security obligations.                                                      |
|                                                                                       |
|Retention and security                                                                 |
|We retain information only for as long as reasonably necessary for account, event,     |
|legal, administrative, and security purposes. We use reasonable technical and          |
|organizational safeguards, but no internet service can guarantee absolute security.    |
|                                                                                       |
|Your choices                                                                           |
|You may review or update certain profile details through your account. You can contact |
|the Student Societies Office to request access, correction, or deletion of information,|
|subject to applicable university requirements and legitimate operational records.      |
|                                                                                       |
|Contact                                                                                |
|For privacy questions or requests, contact the Student Societies Office at             |
|ossie@iba.edu.pk.                                                                      |
|[X] RADES - IBA Karachi     EXPLORE     STUDENT SOCIETIES OFFICE                       |
|Discover campus events and society activities.   Explore events   Contact OSSIE        |
|Explore societies                  Privacy Policy  Terms of Service  (c) 2026 RADES    |
+---------------------------------------------------------------------------------------+
```

Regions: Header, legal heading/date, policy sections, footer. Purpose: Summarize privacy information for account, event, and registration data.

## Student profile

Source: wireframes/live/profile-student.png

desktop view

```
+---------------------------------------------------------------------------------------+
|[X] RADES   Explore Societies   Explore Events   Home   Workspace   [Light mode]       |
+---------------------------------------------------------------------------------------+
| Your account                                                                          |
| Profile                                                                               |
| Manage your contact details and view your RADES activity.                             |
|                                                                                       |
| +-----------------------------+  +-----------------------------------------------+    |
| | [X] Student Name            |  | Digital tickets                               |    |
| | testing.user.12345@khi.iba.edu.pk | Each team member has an individual QR pass.  |  |
| | Student                     |  | RADES Wireframe Evidence - Solo              |     |
| | Email                       |  | Student Name - 12-Dec-2026 - Student Center  |     |
| | Student ID: 12345           |  | [ View ticket ]                               |    |
| | Phone: +92XXXXXXXXXX        |  +-----------------------------------------------+    |
| | [ Edit profile ]            |  | Registration and participation history       |     |
| +-----------------------------+  | Event registrations, payment, cancellations...|    |
|                                  | RADES Wireframe Evidence - Solo [Upcoming]   |     |
|                                  | 12-Dec-2026 - Student Center - Individual    |     |
|                                  | [ View ticket ] [ + Google Calendar ]         |    |
|                                  +-----------------------------------------------+    |
+---------------------------------------------------------------------------------------+
|[X] RADES - IBA Karachi     EXPLORE     STUDENT SOCIETIES OFFICE                       |
|Discover campus events and society activities.   Explore events   Contact OSSIE        |
|Explore societies                  Privacy Policy  Terms of Service  (c) 2026 RADES    |
+---------------------------------------------------------------------------------------+
```

Regions: Header, account heading, read-only profile summary, digital ticket card, registration history, footer. Purpose: View account contact details and event activity; the Edit profile button opens `/profile/edit` for changes. Student ID is shown only for student accounts.

## Edit profile

Route: `/profile/edit`

The separate profile settings page contains the profile image, first and last name, phone number, Save changes, and Change password controls. The profile summary displays the account email and phone number. Non-student accounts do not show a Student ID row.

## Solo event registration

Source: wireframes/live/register-solo.png

desktop view

```
+---------------------------------------------------------------------------------------+
|[X] RADES   Explore Societies   Explore Events   Home   Workspace   [Light mode]       |
+---------------------------------------------------------------------------------------+
| <- Back to event details                                                              |
|                                                                                       |
|                         Solo Event Registration                                       |
|                                                                                       |
|                 +---------------------------------------+                             |
|                 | RADES Wireframe Evidence - Solo       |                             |
|                 | FREE                                  |                             |
|                 | 12-Dec-2026 - 11:00 am-12:00 pm PKT  |                              |
|                 | Student Center                        |                             |
|                 |---------------------------------------|                             |
|                 | You are already registered            |                             |
|                 | Your registration is in your profile  |                             |
|                 | history.                              |                             |
|                 | View profile                          |                             |
|                 +---------------------------------------+                             |
+---------------------------------------------------------------------------------------+
|[X] RADES - IBA Karachi     EXPLORE     STUDENT SOCIETIES OFFICE                       |
|Discover campus events and society activities.   Explore events   Contact OSSIE        |
|Explore societies                  Privacy Policy  Terms of Service  (c) 2026 RADES    |
+---------------------------------------------------------------------------------------+
```

Regions: Header, back link, event summary card, already-registered notice, footer. Purpose: Show the current registration status and profile history link.

## Team event registration

Source: wireframes/live/register-team.png

desktop view

```
+---------------------------------------------------------------------------------------+
|[X] RADES   Explore Societies   Explore Events   Home   Workspace   [Light mode]       |
+---------------------------------------------------------------------------------------+
| <- Back to event details                                                              |
|                                                                                       |
|                         Team Event Registration                                       |
|                                                                                       |
|                 +---------------------------------------+                             |
|                 | RADES Wireframe Evidence - Team       |                             |
|                 | Challenge                         FREE |                            |
|                 | 13-Dec-2026 - 11:00 am-1:00 pm PKT    |                             |
|                 | Student Center                        |                             |
|                 | Team size: 2-4 members including lead  |                            |
|                 | Team Name                             |                             |
|                 | [ Code Ninjas______________________ ] |                             |
|                 | Team Leader (You)                     |                             |
|                 | Student Name (testing.user.12345@...) |                             |
|                 | Teammates                             |                             |
|                 | Member 2 Institutional Email          |                             |
|                 | [ name.surname.12345@khi.iba.edu.pk ] |                             |
|                 | [ + Add teammate ]                    |                             |
|                 | Contact Number for Venue Updates      |                             |
|                 | [ +92XXXXXXXXXX___________________ ]  |                             |
|                 | [ ] I checked the team schedule.      |                             |
|                 | [ Submit Team Registration ]          |                             |
|                 +---------------------------------------+                             |
+---------------------------------------------------------------------------------------+
|[X] RADES - IBA Karachi     EXPLORE     STUDENT SOCIETIES OFFICE                       |
|Discover campus events and society activities.   Explore events   Contact OSSIE        |
|Explore societies                  Privacy Policy  Terms of Service  (c) 2026 RADES    |
+---------------------------------------------------------------------------------------+
```

Regions: Header, back link, event summary, team name, leader, teammate email, contact number, checkbox, submit, footer. Purpose: Register a team and enter teammate and venue-update details.

## Choose a new password

Source: wireframes/live/reset-password.png

desktop view

```
+---------------------------------------------------------------------------------------+
|[X] RADES                    Back to Sign In                 [Light mode]              |
+---------------------------------------------------------------------------------------+
|                                                                                       |
|                         Choose a new password                                         |
|          Enter the code from your email and choose a new password.                    |
|                                                                                       |
|                  +------------------------------------------------+                   |
|                  | New Password                                   |                   |
|                  | [___________________________________]          |                   |
|                  | Confirm Password                               |                   |
|                  | [___________________________________]          |                   |
|                  | Email                                          |                   |
|                  | [___________________________________]          |                   |
|                  | Recovery code (6-8 digits)                     |                   |
|                  | [___________________________________]          |                   |
|                  | [       Update Password       ]                |                   |
|                  | Back to Sign In                                |                   |
|                  +------------------------------------------------+                   |
|                                                                                       |
|[X] RADES - IBA Karachi     EXPLORE     STUDENT SOCIETIES OFFICE                       |
|Discover campus events and society activities.   Explore events   Contact OSSIE        |
|Explore societies                  Privacy Policy  Terms of Service  (c) 2026 RADES    |
+---------------------------------------------------------------------------------------+
```

Regions: Auth header, back link, title, password/recovery form, footer. Purpose: Set a new password using the emailed recovery code.

## Sign in

Source: wireframes/live/sign-in.png

desktop view

```
+---------------------------------------------------------------------------------------+
|[X] RADES IBA KARACHI                         [Light mode]                             |
+---------------------------------------------------------------------------------------+
|                                                                                       |
|                              Welcome Back                                             |
|              Sign in with your IBA email and password.                                |
|                                                                                       |
|                  +------------------------------------------------+                   |
|                  | IBA Email                                      |                   |
|                  | [___________________________________]          |                   |
|                  | Password                                       |                   |
|                  | [___________________________________]          |                   |
|                  | Forgot Password?                               |                   |
|                  | [               Sign In               ]        |                   |
|                  | Don't have an account? Sign Up                 |                   |
|                  +------------------------------------------------+                   |
|                                                                                       |
|[X] RADES - IBA Karachi     EXPLORE     STUDENT SOCIETIES OFFICE                       |
|Discover campus events and society activities.   Explore events   Contact OSSIE        |
|Explore societies                  Privacy Policy  Terms of Service  (c) 2026 RADES    |
+---------------------------------------------------------------------------------------+
```

Regions: Auth header, centered title/subtitle, email/password form, footer. Purpose: Sign in with an IBA email and password.

## Create account

Source: wireframes/live/sign-up.png

desktop view

```
+---------------------------------------------------------------------------------------+
|[X] RADES IBA KARACHI   Sign In   Help              [Light mode]                       |
+---------------------------------------------------------------------------------------+
|                                                                                       |
|                         Create Account                                                |
|                   Sign up with your IBA Email                                         |
|                                                                                       |
|                +----------------------------------------------------+                 |
|                | Full Name                                          |                 |
|                | [ Student Name________________________ ]           |                 |
|                | IBA Email                                          |                 |
|                | [ name@khi.iba.edu.pk________________ ]            |                 |
|                | Students: firstname.secondname.ERP@khi.iba.edu.pk  |                 |
|                | Faculty: name@iba.edu.pk                           |                 |
|                | Password           Confirm Password                |                 |
|                | [________________]  [______________]               |                 |
|                | ERP / Student ID   Phone Number                    |                 |
|                | [ Auto-filled ]      [ +92XXXXXXXXXX ]             |                 |
|                | [              Create Account              ]       |                 |
|                | Already have an account? Sign In                   |                 |
|                +----------------------------------------------------+                 |
|                                                                                       |
|[X] RADES - IBA Karachi     EXPLORE     STUDENT SOCIETIES OFFICE                       |
|Discover campus events and society activities.   Explore events   Contact OSSIE        |
|Explore societies                  Privacy Policy  Terms of Service  (c) 2026 RADES    |
+---------------------------------------------------------------------------------------+
```

Regions: Auth header, sign-in/help links, centered title, account form, footer. Purpose: Create an account with an IBA email and contact details.

## Explore societies

Source: wireframes/live/societies.png

desktop view

```
+---------------------------------------------------------------------------------------+
|[X] RADES IBA KARACHI  Explore Societies  Explore Events  [Light mode]  Sign In        |
+---------------------------------------------------------------------------------------+
|CAMPUS COMMUNITY                                                                       |
|Explore Societies                                                                      |
|Meet IBA societies, learn what they do, and find their upcoming events.                |
|                                                                                       |
|  +------------------------+   +------------------------+   +------------------------+ |
| |[X] abdullah gang       |  |[X] asasa               |  |[X] Computer Science    |    |
| |we are abdullah gang    |  |Learn more about this IBA|  |Society                 |   |
| |[ View society -> ]     |  |society.                |  |A computer Science      |    |
| |                        |  |[ View society -> ]     |  |Society to handle the CS|    |
| |                        |  |                        |  |stuff.                  |    |
| |                        |  |                        |  |[ View society -> ]     |    |
|  +------------------------+   +------------------------+   +------------------------+ |
|                                                                                       |
|  +----------------------------------+   +----------------------------------+          |
| |[X] Data Science Society          |  |[X] Rayyan's Mortuary             |            |
| |Data Science Society              |  |What were you expecting           |            |
| |[ View society -> ]               |  |[ View society -> ]               |            |
|  +----------------------------------+   +----------------------------------+          |
|[X] RADES - IBA Karachi     EXPLORE     STUDENT SOCIETIES OFFICE                       |
|Discover campus events and society activities.   Explore events   Contact OSSIE        |
|Explore societies                  Privacy Policy  Terms of Service  (c) 2026 RADES    |
+---------------------------------------------------------------------------------------+
```

Regions: Header, campus-community title/description, society cards, footer. Purpose: Browse IBA societies and open their profiles.

## Society analytics

Source: wireframes/live/society-analytics.png

desktop view

```
+---------------------------------------------------------------------------------------+
|RADES Society Workspace | Computer Science Society [Light mode] [Switch Portal]        |
+---------------------------------------------------------------------------------------+
|                                                                                       |
|+----------------+  SOCIETY ANALYTICS                                                  |
|| Dashboard      |  Computer Science Society events                                    |
|| Events         |  Counts from this society's event records.                          |
|| Panel          |                                                                     |
|| [x] Analytics  |                                                                     |
||                |  +----------------------+  +----------------------+                 |
||                |  | All events: 3        |  | Published: 3         |                 |
||                |  +----------------------+  +----------------------+                 |
||                |  +----------------------+  +----------------------+                 |
||                |  | Upcoming: 2          |  | Past: 1              |                 |
||                |  +----------------------+  +----------------------+                 |
||                |  In review: 0                                                       |
|                                                                                       |
||                |  +--------------------------------------+                           |
||                |  | Events by category                   |                           |
||                |  | Technology: 3                        |                           |
||                |  +--------------------------------------+                           |
||                |  +--------------------------------------+                           |
||                |  | Recent events                        |                           |
||                |  | RADES Wireframe Evidence - Team      |                           |
||                |  | RADES Wireframe Evidence - Solo      |                           |
||                |  +--------------------------------------+                           |
|+----------------+                                                                     |
|[X] RADES - IBA Karachi     EXPLORE     STUDENT SOCIETIES OFFICE                       |
|Discover campus events and society activities.   Explore events   Contact OSSIE        |
|Explore societies                  Privacy Policy  Terms of Service  (c) 2026 RADES    |
+---------------------------------------------------------------------------------------+
```

Regions: Workspace header, sidebar navigation, metrics, category bar, recent-events card, footer. Purpose: Summarize society event totals and recent events.

## Society dashboard

Source: wireframes/live/society-dashboard.png

desktop view

```
+---------------------------------------------------------------------------------------+
|RADES Society Workspace | Computer Science Society [Light mode] [Switch Portal]        |
+---------------------------------------------------------------------------------------+
|                                                                                       |
|+----------------+  SOCIETY WORKSPACE                                                  |
|| [x] Dashboard |  Computer Science Society dashboard                                  |
|| Events         |  A quick view of your event schedule and review queue.              |
|| Analytics      |                                                                     |
||                |  +----------------------+  +----------------------+                 |
||                |  | All events: 3         |  | Upcoming: 2          |                |
||                |  +----------------------+  +----------------------+                 |
||                |  +----------------------+                                           |
||                |  | Awaiting review: 0   |                                           |
||                |  +----------------------+                                           |
||                |  +---------------------------------------------------------------+  |
|| | | Upcoming events All events -> |                                                  |
||                |  | Published events that have not finished.                        ||
|| | | RADES Wireframe Evidence - Solo Published |                                      |
|| | | 12-Dec-2026, 11:00 am PKT |                                                      |
||                |  +---------------------------------------------------------------+  |
|+----------------+                                                                     |
|[X] RADES - IBA Karachi     EXPLORE     STUDENT SOCIETIES OFFICE                       |
|Discover campus events and society activities.   Explore events   Contact OSSIE        |
|Explore societies                  Privacy Policy  Terms of Service  (c) 2026 RADES    |
+---------------------------------------------------------------------------------------+
```

Regions: Workspace header, sidebar, title/summary, metric cards, upcoming-events card and actions, footer. Purpose: Show the society event schedule and review queue.

## Society events

Source: wireframes/live/society-events.png

desktop view

```
+---------------------------------------------------------------------------------------+
|RADES Society Workspace | Computer Science Society [Light mode] [Switch Portal]        |
+---------------------------------------------------------------------------------------+
|                                                                                       |
|+----------------+  Events                                                             |
|| Dashboard      |  Manage society event drafts, reviews, and published events.        |
|| [x] Events     |  Status [ All statuses v ] Event date [ dd/mm/yyyy ] [ Apply ]      |
|| Panel          |  [ + Create event ]  [ Clear ]                                      |
|| Analytics      |                                                                     |
||                | EVENT              DATE        TYPE    STATUS      ACTIONS          |
||                | +---------------------------------------------------------------+   |
||                | | Test event 1       22-Nov-2026  Team    Finished    Analytics |   |
||                | | RADES Wireframe    12-Dec-2026  Solo    Upcoming    Analytics |   |
||                | | Evidence - Solo    13-Dec-2026  Team    Upcoming    Analytics |   |
||                | +---------------------------------------------------------------+   |
||                | Showing events 1-3                                                  |
|+----------------+                                                                     |
|[X] RADES - IBA Karachi     EXPLORE     STUDENT SOCIETIES OFFICE                       |
|Discover campus events and society activities.   Explore events   Contact OSSIE        |
|Explore societies                  Privacy Policy  Terms of Service  (c) 2026 RADES    |
+---------------------------------------------------------------------------------------+
```

Regions: Workspace header, sidebar, event heading, status/date filters, create button, event table, footer. Purpose: Manage event drafts, reviews, and published events.

## Society panel

Source: wireframes/live/society-panel.png

desktop view

```
+---------------------------------------------------------------------------------------+
|RADES Society Workspace | Computer Science Society [Light mode] [Switch Portal]        |
+---------------------------------------------------------------------------------------+
|                                                                                       |
|+----------------+  SOCIETY WORKSPACE                                                  |
|| Dashboard      |  Society panel                                                      |
|| Events         |  Assigned Computer Science Society admins and faculty patron.       |
|| [x] Panel      |                                                                     |
|| Analytics      | +----------------------------------------+                          |
||                | | Society admins (3 of 3)                |                          |
||                | | Student Admin 1 - Admin                |                          |
||                | | admin1@khi.iba.edu.pk                  |                          |
||                | |----------------------------------------|                          |
||                | | Student Admin 2 - Admin                |                          |
||                | | admin2@khi.iba.edu.pk                  |                          |
||                | |----------------------------------------|                          |
||                | | Student Admin 3 - Admin                |                          |
||                | | admin3@khi.iba.edu.pk                  |                          |
||                | +----------------------------------------+                          |
||                | +----------------------------------------+                          |
||                | | Faculty patron                         |                          |
||                | | Faculty Patron                         |                          |
||                | | faculty@iba.edu.pk                     |                          |
||                | | Society assigned faculty               |                          |
||                | +----------------------------------------+                          |
|+----------------+                                                                     |
|[X] RADES - IBA Karachi     EXPLORE     STUDENT SOCIETIES OFFICE                       |
|Discover campus events and society activities.   Explore events   Contact OSSIE        |
|Explore societies                  Privacy Policy  Terms of Service  (c) 2026 RADES    |
+---------------------------------------------------------------------------------------+
```

Regions: Workspace header, sidebar, panel heading, society-admin and faculty-patron cards, contact note, footer. Purpose: View assigned society admins and faculty patron.

## Society profile

Source: wireframes/live/society-profile.png

desktop view

```
+---------------------------------------------------------------------------------------+
|[X] RADES   Explore Societies   Explore Events   Home   Workspace   [Light mode]       |
+---------------------------------------------------------------------------------------+
| <- Explore Events                                                                     |
|                                                                                       |
| +-------------------------------------------------------------------------------+     |
| | [X] IBA KARACHI SOCIETY                                                       |     |
| | Computer Science Society                                                     |      |
| | A computer Science Society to handle the CS stuff.                           |      |
| +-------------------------------------------------------------------------------+     |
|                                                                                       |
| WHAT'S HAPPENING                                                                      |
| Published Events by Computer Science Society                                          |
|                                                                                       |
| +--------------------------------------+  +--------------------------------------+    |
| | [ Image ]                            |  | [ Image ]                            |    |
| | Technology - Tech Seminar           |  | Technology - Tech Workshop           |     |
| | COMPUTER SCIENCE SOCIETY             |  | COMPUTER SCIENCE SOCIETY             |    |
| | RADES Wireframe Evidence - Solo      |  | RADES Wireframe Evidence - Team      |    |
| | A free campus technology seminar...  |  | Challenge                             |   |
| | Sat, 12 Dec - 11:00 am PKT           |  | Sun, 13 Dec - 11:00 am PKT          |     |
| | Student Center - FREE - Capacity 20  |  | Student Center - FREE - Capacity 24  |    |
| | [ View Details ]                    |  | [ View Details ]                    |      |
| +--------------------------------------+  +--------------------------------------+    |
+---------------------------------------------------------------------------------------+
|[X] RADES - IBA Karachi     EXPLORE     STUDENT SOCIETIES OFFICE                       |
|Discover campus events and society activities.   Explore events   Contact OSSIE        |
|Explore societies                  Privacy Policy  Terms of Service  (c) 2026 RADES    |
+---------------------------------------------------------------------------------------+
```

Regions: Header, back link, society identity card, published-events heading, event cards, footer. Purpose: Introduce a society and display its published events.

## Student dashboard

Source: wireframes/live/student-dashboard.png

desktop view

```
+---------------------------------------------------------------------------------------+
|[X] RADES   Explore Societies   Explore Events   Home   Workspace   [Light mode]       |
+---------------------------------------------------------------------------------------+
| Your RADES workspace                                                                  |
| Good to see you, Testing                                                              |
| [x Overview] [ Explore events ]                                                       |
|                                                                                       |
| Events for everyone                                                                   |
|                                                                                       |
| +--------------------------------------+  +--------------------------------------+    |
| | [ Image ]                            |  | [ Image ]                            |    |
| | Technology - Tech Seminar            |  | Technology - Tech Workshop           |    |
| | COMPUTER SCIENCE SOCIETY             |  | COMPUTER SCIENCE SOCIETY             |    |
| | RADES Wireframe Evidence - Solo      |  | RADES Wireframe Evidence - Team      |    |
| | A free campus technology seminar...  |  | Challenge - team registration...     |    |
| | Sat, 12 Dec - 11:00 am PKT           |  | Sun, 13 Dec - 11:00 am PKT           |    |
| | Student Center - FREE - Capacity 20  |  | Student Center - FREE - Capacity 24  |    |
| | [ View Details ]                     |  | [ View Details ]                     |    |
| +--------------------------------------+  +--------------------------------------+    |
|                                                                                       |
| You are signed in as a student. Browse event details below. Society admins receive    |
| event management access from OSSIE.                                                   |
+---------------------------------------------------------------------------------------+
|[X] RADES - IBA Karachi     EXPLORE     STUDENT SOCIETIES OFFICE                       |
|Discover campus events and society activities.   Explore events   Contact OSSIE        |
|Explore societies                  Privacy Policy  Terms of Service  (c) 2026 RADES    |
+---------------------------------------------------------------------------------------+
```

Regions: Header, greeting, tabs, event cards, signed-in notice, footer. Purpose: Show upcoming events to a signed-in student.

## Terms of service

Source: wireframes/live/terms.png

desktop view

```
+---------------------------------------------------------------------------------------+
|[X] RADES IBA KARACHI  Explore Societies  Explore Events  [Light mode]  Sign In        |
+---------------------------------------------------------------------------------------+
|Legal                                                                                  |
|Terms of Service                                                                       |
|Effective date: November 21, 2026                                                      |
|                                                                                       |
|Acceptance of terms                                                                    |
|By accessing or using RADES, you agree to these Terms of Service and to applicable IBA |
|policies. If you do not agree, do not use the platform.                                |
|                                                                                       |
|Accounts and eligibility                                                               |
|You must provide accurate account information and keep it secure. Access may depend on |
|verification of eligibility or an assigned society or office role. You are responsible |
|for activity performed through your account.                                           |
|                                                                                       |
|Events and registrations                                                               |
|Society organizers are responsible for event details, approval, scheduling, capacity,  |
|communication, and cancellation handling. Publishing an event or issuing a ticket does |
|not guarantee attendance, participation, or that an event will proceed unchanged.      |
|Registration does not create a relationship with RADES beyond the platform services    |
|described here.                                                                        |
|                                                                                       |
|Payments and refunds                                                                   |
|Where an event requires payment, fees are processed through the designated payment     |
|provider. Refund eligibility and timing are controlled by the event organizer and any  |
|applicable university or payment rules. RADES may assist with communication or records |
|but is not the seller of event admission unless expressly stated.                      |
|                                                                                       |
|Acceptable use                                                                         |
|You may not misuse RADES, attempt unauthorized access, interfere with the service,     |
|submit false registrations, infringe intellectual-property or privacy rights, or use   |
|the platform for unlawful or harmful conduct. RADES may suspend or restrict access to  |
|protect users, university operations, or the service.                                  |
|                                                                                       |
|Content and availability                                                               |
|Organizers remain responsible for content they publish. RADES may remove content or    |
|disable features where necessary to maintain safety, accuracy, or compliance. The      |
|service may be unavailable temporarily for maintenance, updates, or circumstances      |
|outside our control.                                                                   |
|                                                                                       |
|Limitation of liability                                                                |
|To the extent permitted by law, RADES is provided on an as-available basis. We are not |
|responsible for indirect losses arising from event changes, cancellations, third-party |
|services, or your use of the platform.                                                 |
|                                                                                       |
|Changes and contact                                                                    |
|We may update these terms as the platform or applicable requirements change. Continued |
|use after an update constitutes acceptance of the revised terms. For questions, contact|
|the Student Societies Office at ossie@iba.edu.pk.                                      |
|[X] RADES - IBA Karachi     EXPLORE     STUDENT SOCIETIES OFFICE                       |
|Discover campus events and society activities.   Explore events   Contact OSSIE        |
|Explore societies                  Privacy Policy  Terms of Service  (c) 2026 RADES    |
+---------------------------------------------------------------------------------------+
```

Regions: Header, legal heading/date, section headings, footer. Purpose: Cover accounts, events, payments, acceptable use, service availability, and contact.

## RADES official event pass

Source: wireframes/live/ticket-detail.png

desktop view

```
+---------------------------------------------------------------------------------------+
|[X] RADES   Explore Societies   Explore Events   Home   Workspace   [Light mode]       |
+---------------------------------------------------------------------------------------+
| <- Back to My Profile                                                                 |
|                                                                                       |
| +---------------------------------------------------------------+                     |
| | RADES OFFICIAL EVENT PASS                      #4B384120       |                    |
| | RADES Wireframe Evidence - Solo                               |                     |
| |---------------------------------------------------------------|                     |
| | TICKET HOLDER                         +---------------------+ |                     |
| | Student Name                          |                     | |                     |
| | testing.user.12345@khi.iba.edu.pk     |      [ QR CODE ]   | |                      |
| |                                       |                     | |                     |
| | DATE AND TIME                         | 4b384120-7e76-42fa | |                      |
| | Saturday, 12 December 2026            | -90ff-8efd059468a4 | |                      |
| | 11:00 am-12:00 pm PKT                 +---------------------+ |                     |
| | VENUE                                                         |                     |
| | Student Center                                                |                     |
| | Confirmed - Show this QR code at check-in.                    |                     |
| |---------------------------------------------------------------|                     |
| | [ Download QR ] [ Email ticket copy ] [ Print ticket ]        |                     |
| +---------------------------------------------------------------+                     |
+---------------------------------------------------------------------------------------+
|[X] RADES - IBA Karachi     EXPLORE     STUDENT SOCIETIES OFFICE                       |
|Discover campus events and society activities.   Explore events   Contact OSSIE        |
|Explore societies                  Privacy Policy  Terms of Service  (c) 2026 RADES    |
+---------------------------------------------------------------------------------------+
```

Regions: Back link, ticket heading/number, holder/date/venue, QR placeholder, actions, footer. Purpose: Display an official event ticket and QR pass with download, email, and print actions.

## Check your inbox

Source: wireframes/live/verify-email.png

desktop view

```
+---------------------------------------------------------------------------------------+
|[X] RADES   Explore Societies   Explore Events   Home   Workspace   [Light mode]       |
+---------------------------------------------------------------------------------------+
|                         Check your inbox                                              |
|        Open the confirmation link in your email to activate your account.             |
|                                                                                       |
|                 +---------------------------------------+                             |
|                 | [ Resend confirmation link ]          |                             |
|                 |---------------------------------------|                             |
|                 | Back to Sign In                        |                            |
|                 +---------------------------------------+                             |
+---------------------------------------------------------------------------------------+
|[X] RADES - IBA Karachi     EXPLORE     STUDENT SOCIETIES OFFICE                       |
|Discover campus events and society activities.   Explore events   Contact OSSIE        |
|Explore societies                  Privacy Policy  Terms of Service  (c) 2026 RADES    |
+---------------------------------------------------------------------------------------+
```

Regions: Theme-only header, centered title/instruction, confirmation card/actions, footer. Purpose: Prompt email verification or resending the confirmation link.
