# Supabase migration status

The SQL files in `supabase/migrations/` are the migration source of truth. Migrations applied manually in the Supabase SQL Editor do not automatically update this repository, so record each deployment here after running it.

Statuses below are based on reports in this project conversation, not a direct query against Supabase. `Unconfirmed` means this repository does not have a reliable application record; check the project before running that file.

| Migration | Status | Record |
| --- | --- | --- |
| `202611020001_sprint1_schema.sql` | Reported applied | Previously reported in the README; application date not recorded. |
| `202611020002_developer_account_type.sql` | Unconfirmed | Verify before running. |
| `202611020003_developer_profile_constraint.sql` | Unconfirmed | Verify before running. |
| `202611020004_developer_auth_allowlist.sql` | Unconfirmed | Verify before running. |
| `202611020005_society_single_admin_role.sql` | Unconfirmed | Verify before running. |
| `202611080001_wireframe_event_rules.sql` | Reported applied | User confirmed on 2026-11-08. |
| `202611080002_society_profiles.sql` | Reported applied | User confirmed on 2026-11-08. |
| `202611080003_public_event_browsing.sql` | Not applied | New migration; apply after `202611080002_society_profiles.sql` to restore signed-out event browsing. |
| `202611090001_public_media_analytics_cancellation.sql` | Not applied | New migration; apply after `202611080003_public_event_browsing.sql`. Adds society socials, Storage bucket/policies, event cancellation fields and dummy refund records, and logo/social support for OSSIE society creation. |
| `202611090002_society_admin_protections.sql` | Not applied | Society-admin profile field protection and published-event re-review workflow. Apply after `202611090001_public_media_analytics_cancellation.sql`. |
| `202611090003_event_media_access.sql` | Not applied | Ensures uploaded event banners are readable in public and authenticated event views, including after a partial media migration. |
| `202611100001_schedule_and_assignment_guards.sql` | Not applied | Adds public social-column access fallback, society-scoped event overlap protection, a three-admin concurrency-safe limit, and one-society/one-patron assignment uniqueness. It stops with a clear error if conflicting existing assignments must be cleaned up first. |
| `202611100002_optional_society_patron.sql` | Not applied | Removes the society-create and last-patron database requirements. Society creation may omit a patron; submitting an event for review still requires one. |
| `202611190001_profile_phone_metadata.sql` | Not applied | Stores optional phone metadata for new profile rows only; does not change existing profile data. |
| `202611190002_individual_event_registration.sql` | Not applied | Adds race-safe solo registration, participant records, seat capacity checks, duplicate prevention, and schedule-conflict enforcement. Creates new registration tables and an optional registration close time; does not rewrite existing user/profile data. |
| `202611190003_team_event_registration.sql` | Not applied | Adds per-event team-size settings and atomic team registration with account, duplicate, schedule, and capacity checks. Does not rewrite existing user/profile data. |
| `202611190004_digital_qr_tickets.sql` | Not applied | Creates one revocable ticket per confirmed registration member, issues tickets on confirmation, voids them on cancellation/refund, and backfills ticket rows for already confirmed registrations. Does not modify user/profile data or passwords. |
| `202611190005_one_time_ticket_check_in.sql` | Not applied | Adds race-safe one-time attendance recording per ticket with society-admin authorization and check-in timestamps. Does not modify user/profile data or passwords. |

Apply migrations in filename order, but do not rerun a migration just because its status is unconfirmed. Verify the current schema or ask the project owner first. The event-rules migration requires every existing society to have a faculty patron before it can complete.
