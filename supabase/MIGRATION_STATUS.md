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

Apply migrations in filename order, but do not rerun a migration just because its status is unconfirmed. Verify the current schema or ask the project owner first. The event-rules migration requires every existing society to have a faculty patron before it can complete.
