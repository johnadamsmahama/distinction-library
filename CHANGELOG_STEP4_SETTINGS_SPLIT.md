# Step 4 — Settings split (Account / Notifications / Support)

## What changed

Settings was one flat page (name/department/level + a link out to Support). Per spec
Sections 10.1–10.3, it's now a tabbed page with three sections: **Account**,
**Notifications**, **Support**.

**Database (already applied live via Supabase — no action needed there):**
- `stage12_settings_split.sql` — two new columns on `profiles`:
  - `leaderboard_opt_out` (boolean) — for the new privacy toggle
  - `notification_prefs` (jsonb) — stores each student's category/channel/frequency choices
  - Included in this delivery for the repo's record only; already live.

**Code (6 files — 5 new, 1 replaces the old settings page):**

1. **`app/dashboard/settings/page.tsx`** — replaced. Now fetches profile (including
   the two new columns) and the user's support tickets, and hands everything to a new
   tabbed component.
2. **`components/dashboard/SettingsTabs.tsx`** — new. The tab bar and switcher.
3. **`components/dashboard/AccountSettings.tsx`** — new. Covers spec 10.1:
   - Profile (name, department/programme, level) — same as before
   - Email verification status badge (real data — reads Supabase's own
     `email_confirmed_at`, not a fake badge)
   - Change email and change password forms (using Supabase Auth directly)
   - Privacy: "Hide me from the Leaderboard" toggle
   - "Request data export" / "Request account deletion" — these file a support
     ticket for staff to action manually rather than doing anything irreversible
     automatically. See note below on why.
4. **`components/dashboard/NotificationSettings.tsx`** — new. Covers spec 10.2/3.7:
   category toggles (Academic, Opportunities, Career, Events, Account & Security),
   channel toggles (In-app, Push, Email), and a frequency picker (Instant, Daily
   summary, Weekly summary). Saves to the new `notification_prefs` column.
5. **`app/leaderboard/page.tsx`** — updated (not new). Now excludes students who've
   opted out via the new privacy toggle, from both the semester and all-time views.
   This had to change so the toggle isn't a fake control that does nothing.

The old `components/dashboard/SettingsForm.tsx` is no longer used (its logic is now
inside `AccountSettings.tsx`). You can leave it in the repo — it's harmless sitting
unused — or delete it later as cleanup. Not required.

## Manual steps for John

Same GitHub web-editor workflow:
1. For `app/dashboard/settings/page.tsx` and `app/leaderboard/page.tsx` — these
   already exist, so pencil-edit → select all → delete → paste → commit.
2. For the 3 new files under `components/dashboard/` — use "Add file → Create new
   file", type the exact path (e.g. `components/dashboard/SettingsTabs.tsx`), paste
   contents, commit.
3. Optionally add `supabase/stage12_settings_split.sql` the same way, for your records.

No strict ordering between these 6 — commit them all, ideally close together.

## Two honest scope notes

**1. "Request" language, not instant delete/export.** Spec 10.1 says "Account deletion
/ data export request" — I read "request" as intentional: these actions are
consequential enough (irreversible deletion, personal data export) that they should
go to a human for review rather than fire automatically from the client. Both buttons
create a support ticket with a clear subject line, so you'll see them show up in
`/admin/support` like any other ticket, just clearly labeled. If you'd rather these be
fully automatic, that's a separate, larger piece of work (actual deletion needs to
cascade through every table with a `user_id`, and export needs a real data-dump job) —
let me know if you want that built out later.

**2. Avatar upload wasn't added.** Spec 10.1 lists "avatar" under Profile information,
but there's no `avatar_url` column on `profiles` and no image upload wired up for it
yet. I left it out rather than fake a placeholder — it needs Supabase Storage wiring
similar to how past papers/study materials work, which is its own small task.

## Next task after this

Per the priority order: Moderation Queue UI check — confirm `/moderate` shows only the
review queue and nothing else (no user management or analytics leaking in), per spec 8.2.
