-- ============================================================================
-- DISTINCTION LIBRARY — STAGE 12 SCHEMA ADDITIONS
-- Run AFTER stage11_leaderboard_v2.sql.
--
-- NOTE: Already applied directly to the live database via the Supabase
-- connector. This file is only a record for the repo — no need to run it.
--
-- Adds the two columns needed for the Settings split (spec Sections 10.1 and
-- 10.2), which previously had no backing data at all:
--   - profiles.leaderboard_opt_out: Section 10.1 "Privacy controls (e.g.
--     leaderboard visibility opt-out)". Also wired into app/leaderboard/page.tsx
--     to actually exclude opted-out students from both the semester and
--     all-time views.
--   - profiles.notification_prefs: Section 10.2 / 3.7, storing the student's
--     chosen categories, channels, and frequency as JSON. No existing
--     relational schema fit this cleanly for a single per-user preference
--     blob, so jsonb was used instead of a new table.
--
-- No new RLS policy needed — the existing "users update own profile" policy
-- (auth.uid() = id) already covers any column on the table.
-- ============================================================================

alter table public.profiles
  add column if not exists leaderboard_opt_out boolean not null default false;

alter table public.profiles
  add column if not exists notification_prefs jsonb not null default '{
    "categories": {
      "Academic": true,
      "Opportunities": true,
      "Career": true,
      "Events": true,
      "Account & Security": true
    },
    "channels": {
      "In-app": true,
      "Push": false,
      "Email": true
    },
    "frequency": "Instant"
  }'::jsonb;
