# Distinction Library

A J.A. Mahama Initiative — exclusive academic PWA for UPSA students.

## Progress

- **Stage 2 — done.** Next.js + Tailwind scaffold with the landing page
  (Section 8 spec) ported into React components.
- **Stage 3 — done.** Full Supabase/Postgres schema, Row Level Security
  policies, and storage bucket setup. See `supabase/` below.
- **Stage 4 — done.** Self-signup auth flow: signup, login, forgot/reset
  password, email confirmation callback, session middleware, and
  auto-logout after 30 minutes idle.
- **Stage 5 — done.** Student Dashboard + Course Bookmarking, live against
  Supabase. See below.
- **Stage 6 — done.** Past Questions + Study Materials repository, with
  search and filters — including a **week filter for study materials**,
  since UPSA courses like BACS 102 post a new slide deck every week.
- **Stage 7 — done.** Community upload, moderation queue, strikes, and
  automatic watermarking. See below.
- **Stage 8 — done.** AI Quiz Generator + AI Study Companion + Study
  Vault, running on **Claude (Anthropic)** rather than the brief's original
  OpenAI spec — swap is isolated to `lib/anthropic.ts` and the two API
  routes below, nothing else in the app cares which model is behind it.
- **Stage 9 — done.** Leaderboard, Blog, Contact & Support, About, and the
  notification triggers the earlier stages left as stubs. See below.
- **Stage 10 — done.** Admin Dashboard: grant staff roles, manage courses,
  publish blog posts, view/resolve all support tickets. See below.
- **Stage 11 — done.** Real PWA: installable, offline fallback, cached
  downloads for weak connectivity, brand icons rendered and wired in.
- **Stage 12 — done.** Deployment runbook — see **`DEPLOYMENT.md`** for the
  exact steps from `git push` to a live domain. This is the one stage I
  can't run for you directly (no live network access from where I build),
  but every step is written out precisely.

**The build is complete.** Everything from the original feature brief is
either fully implemented or explicitly flagged as a known scope trim in
this README — nothing is silently missing.

## Admin Dashboard (Stage 10)

```
app/admin/layout.tsx                    admin-only gate (redirects non-admins
                                        to /dashboard), tab navigation
app/admin/page.tsx                       overview: student count, pending
                                        reviews, open tickets
app/admin/users/page.tsx                  search students, change role
                                        (student/moderator/admin)
app/admin/courses/page.tsx                add/delete courses
app/admin/blog/page.tsx                   write posts, publish/unpublish, delete
app/admin/support/page.tsx                every ticket, not just your own;
                                        filter open/resolved, mark resolved

components/admin/UserManager.tsx
components/admin/CourseManager.tsx
components/admin/BlogManager.tsx
components/admin/SupportManager.tsx

supabase/stage10_admin.sql               IMPORTANT security fix — see below
```

**Why `stage10_admin.sql` matters:** the original Stage 3 policy let *any*
staff member (including moderators) update *any* profile — which meant a
moderator could quietly grant themselves admin. Now that role management is
a real, built feature, that gap actually matters. Fixed by restricting
profile updates-by-others to admins only; students and moderators can still
edit their own profile as before. **Run this file** even if you've already
run everything through Stage 9.

## PWA (Stage 11)

```
next.config.js                          wrapped with next-pwa — generates a
                                        real service worker at build time
app/offline/page.tsx                     shown when there's no connection
                                        and nothing cached for the page
public/manifest.json                     updated with real icons
public/icon-192.png, icon-512.png,
  apple-touch-icon.png, favicon.png       brand-consistent "D" monogram,
                                        rendered from public/icon.svg
```

**Caching strategy** (in `next.config.js`): approved past papers and study
materials use cache-first — once a student opens one, it stays available
offline. Everything else is network-first with a cache fallback, so the app
shell still loads on a weak connection.

**One thing to actually test**, not just trust: `next-pwa` is disabled in
development (`NODE_ENV === 'development'`) to avoid service-worker caching
fighting you while you code — so PWA install/offline behavior only shows up
in a production build (`npm run build && npm run start`), not `npm run dev`.

## Deployment (Stage 12)

See **`DEPLOYMENT.md`** — covers pushing to GitHub, deploying to Vercel,
setting environment variables, connecting Supabase Auth to your live URL,
buying and pointing a custom domain, a first-run checklist, and what this
will actually cost you to run month to month.

## Leaderboard, Blog, Support, About (Stage 9)

```
app/leaderboard/page.tsx                top contributors, live from profiles.upload_count
components/leaderboard/Leaderboard.tsx   badge display, highlights the current user's row

app/blog/page.tsx                        published posts grid
app/blog/[id]/page.tsx                    single post (404s if unpublished or missing)
                                          — no post-creation UI yet, that's Stage 10 (Admin)

app/support/page.tsx                     ticket form + the student's own ticket history
components/support/SupportForm.tsx

app/about/page.tsx                       PUBLIC — not gated by middleware, styled like
                                          the landing page rather than the app shell

supabase/stage9_notifications.sql        closes a real gap: upload_count was never
                                          being incremented anywhere before this
```

**What `stage9_notifications.sql` actually fixes**, run after all previous
`supabase/*.sql` files:
1. `profiles.upload_count` existed since Stage 3 but nothing ever
   incremented it — a Stage 7 oversight. Fixed now: approving a paper
   triggers the increment automatically.
2. **Contributor badges are now live**, not manual — a statement-level
   trigger recomputes Gold/Silver/Bronze across all profiles whenever
   upload counts change, so the Leaderboard and dashboard Profile Card
   reflect real standing.
3. **Bookmark notifications** — approving a paper or material now notifies
   every student who bookmarked that course (`new_paper_bookmarked_course`
   / `new_material_bookmarked_course`), fulfilling the two notification
   types that were defined in the Stage 3 enum but never triggered.

**Known trim, worth knowing about:** badge *changes* (e.g. going from no
badge to Bronze) don't yet fire a `badge_earned` notification — the badge
itself updates correctly and shows on the Leaderboard/Profile Card, but the
"you got a badge!" nudge isn't wired up. Reasonable follow-up, not a
blocker.

## AI features & Study Vault (Stage 8)

```
lib/anthropic.ts                            server-only Claude client wrapper

app/api/vault/generate-quiz/route.ts          extracts text (PDF via pdf-parse,
                                              or pasted text) → Claude → strict
                                              JSON quiz → saved to vault
app/api/vault/companion/route.ts               stateless chat turn — client
                                              resends full history each time
app/api/vault/companion/save/route.ts          explicit "save this session"
                                              action, separate from the chat
                                              itself so casual questions
                                              aren't force-saved

components/vault/QuizGenerator.tsx             paste/upload form → interactive
                                              quiz-taking → instant grading
components/vault/Companion.tsx                 chat UI, optional pasted-notes
                                              context panel, save button
components/vault/VaultList.tsx                 expandable list of everything
                                              saved, delete per item

app/vault/page.tsx                             Study Vault (real, replaces stub)
app/vault/quiz-generator/page.tsx               (real, replaces stub)
app/vault/companion/page.tsx                    (real, replaces stub)
```

**Why Claude instead of OpenAI:** the original brief specified OpenAI, but
since you asked to switch, everything model-specific lives in
`lib/anthropic.ts` (model name: `claude-sonnet-4-5`) and the two route
files above — no other part of the app references a provider, so swapping
back or trying a different model later is a small, contained change.

**Privacy, matching the brief's "Study Vault is strictly private" rule:**
every quiz and companion session is saved with `user_id` set from the
authenticated session, and `study_vault_items` has exactly one RLS
policy — owner-only, no staff exception (see Stage 3). The AI routes
themselves also re-check `auth.getUser()` server-side before doing
anything, so a request can't be forged to write into someone else's vault.

**Scope notes:**
- Quiz generator accepts PDF or plain text uploads (`.pdf`, `.txt`) plus
  pasted text — Word/PowerPoint notes need to be pasted as text for now.
- The Companion's "attach notes" panel is paste-only in this stage; file
  upload there would reuse the same `pdf-parse` extraction as the quiz
  generator if you want it added later.
- Quiz grading for short-answer questions does an exact-ish string match
  against Claude's model answer — fine for MCQ/true-false, a bit blunt for
  short answer (a correct-but-differently-worded response could grade as
  wrong). Worth revisiting with a second AI call to grade short answers
  specifically, if that turns out to matter in practice.

**New env var required:** `ANTHROPIC_API_KEY` (see `.env.local.example`).

## Upload, moderation & watermarking (Stage 7)

```
components/papers/UploadForm.tsx        student-facing submission form
app/papers/upload/page.tsx                real page, replaces the Stage-5 stub

components/moderate/ModerationQueue.tsx  staff review UI — approve/reject,
                                          optional strike on rejection
app/moderate/page.tsx                     staff-only (redirects non-staff to
                                          /dashboard), lists pending items
app/moderate/layout.tsx

app/api/moderation/approve-paper/[id]/route.ts   the watermarking pipeline
lib/supabase/admin.ts                     service-role client — SERVER ONLY,
                                          used solely by the route above
lib/auth-helpers.ts                       getCurrentProfile / isStaffRole

supabase/stage7_moderation.sql            adds reviewed_by/reviewed_at/
                                          rejection_reason to study_materials
                                          (past_papers already had these)
```

**How watermarking actually works, end to end:**
1. Student submits → raw file lands in the private `past-papers` bucket,
   row created with `status = 'pending'`.
2. A moderator on `/moderate` clicks Approve.
3. That calls `POST /api/moderation/approve-paper/[id]`, which re-checks the
   caller is staff server-side (never trusts the button alone), downloads
   the raw PDF using the **service-role client**, stamps a diagonal
   "Distinction Library — A J.A. Mahama Initiative" watermark plus a footer
   credit onto every page with `pdf-lib`, and uploads the result to the
   public `past-papers-final` bucket.
4. The row updates: `watermarked_url` set, `status = 'approved'`,
   `reviewed_by`/`reviewed_at` stamped. The uploader gets a notification.
5. Rejecting works differently and doesn't need the API route — it's a
   direct RLS-permitted table update from the moderator's own session, with
   an optional checkbox to also issue a strike (which auto-updates
   `strikes_count` / `upload_suspended` via the Stage 3 trigger).

**Two things to know before this goes live:**
- Watermarking only runs on PDFs. Word/PowerPoint uploads are published
  as-is — stamping those formats needs a different library and is a
  reasonable Stage 7.5, not a blocker for launch since PDF is what most
  past papers actually are.
- Study materials don't go through the watermark pipeline — they upload
  straight to the (already public) `study-materials` bucket and only need
  their status flipped on approval, no service-role step required.

**New env var required:** `SUPABASE_SERVICE_ROLE_KEY` (see
`.env.local.example` — Project Settings → API → service_role in Supabase).
This key bypasses RLS entirely, so it's referenced in exactly one file
(`lib/supabase/admin.ts`) and must never reach the browser bundle.

**To test moderation locally**, manually set a test account's `role` to
`moderator` or `admin` in the Supabase Table Editor (`profiles` table) —
there's no UI for granting roles yet.

## Repository (Stage 6)

```
app/papers/page.tsx                    server component: loads course list,
                                        renders the browser
components/papers/RepositoryBrowser.tsx  client component: tabs, search,
                                        filters, results, download links
lib/papers-data.ts                       course/department list for filter dropdowns
```

**Filter design, matched to how UPSA actually organises content:**
- **Past Papers** tab: filter by department, level, course, exam type
  (Mid-Semester / End of Semester), and year.
- **Study Materials** tab: filter by department, level, course, material
  type (Lecture Slides / Study Notes / Study Guide), and **week** (1–14) —
  since a course like BACS 102 has a different slide deck every week, this
  is the filter students will actually reach for.
- Free-text search runs on top of whichever filters are active, matching
  course code, course name, or (for materials) the item's title.

**Note on testing this page:** `past_papers.uploaded_by` is required and
must reference a real student account (enforced by RLS), so there's no seed
data for papers/materials — the repository will show empty states until
either you upload something once Stage 7 (moderation/upload) is built, or
you manually insert a test row in the Supabase Table Editor using an
account you've already signed up.

## Dashboard (Stage 5)

```
app/dashboard/layout.tsx              wraps every /dashboard/* page in AppShell
app/dashboard/page.tsx                 the dashboard itself — server component,
                                        fetches everything in parallel via lib/dashboard-data.ts
app/dashboard/notifications/page.tsx    full notification history
components/dashboard/AppShell.tsx       shared nav + inactivity logout, reused by
                                        /dashboard, /papers, /vault layouts
components/dashboard/DashboardNav.tsx   top bar: logo, notification bell, logout
components/dashboard/ProfileCard.tsx    name, department, level, upload count,
                                        leaderboard rank, strike indicator (0-3 dots)
components/dashboard/BookmarkedCourses.tsx  saved courses with live paper/material
                                        counts, unbookmark button
components/dashboard/RecentActivity.tsx  platform-wide recently-approved feed
components/dashboard/VaultAndActions.tsx  Study Vault summary + quick-action shortcuts
```

Run `supabase/dashboard_functions.sql` in the SQL Editor (after the Stage 3
files) — it adds two Postgres functions the dashboard depends on:
`get_dashboard_bookmarks` (bookmarked courses with live counts, no N+1
queries) and `get_leaderboard_rank`.

**Stub pages**, so nothing dashboard links to 404s before its real stage
lands: `/papers`, `/papers/upload`, `/vault`, `/vault/quiz-generator`,
`/vault/companion` all show a plain "Coming in Stage N" message using
`components/dashboard/ComingSoon.tsx`. They'll be replaced page-by-page as
we build each stage — nothing to redo, just delete the stub and drop the
real page in.

## Auth flow (Stage 4)

Students sign up with just their **8-digit student ID** — the form appends
`@upsamail.edu.gh` automatically, so there's no chance of a typo'd domain.

```
app/(auth)/signup/page.tsx           sign up: student ID + name + password
app/(auth)/login/page.tsx             log in: student ID + password
app/(auth)/forgot-password/page.tsx   request a reset link
app/(auth)/reset-password/page.tsx    set new password (after clicking email link)
app/auth/callback/route.ts            exchanges the emailed link's code for a session
middleware.ts                          protects /dashboard, /vault, /admin, /moderate;
                                        refreshes the session on every request
components/auth/InactivityLogout.tsx   mount in the authenticated layout (Stage 5) —
                                        signs the student out after 30 idle minutes
```

**Testing signup locally:** Supabase's free tier sends real confirmation
emails via its built-in SMTP (rate-limited — fine for testing, swap in
Resend/SendGrid per the brief before launch). In the Supabase dashboard
under Authentication → Email Templates, you can also temporarily disable
"Confirm email" while developing so you don't need to click a link every
time you test signup.

**Important Supabase setting:** in Authentication → URL Configuration, add
`http://localhost:3000/auth/callback` (and your production domain's
equivalent later) to the Redirect URLs allow-list, or the email links won't
work.

## Database setup (Stage 3)

In your Supabase project's SQL Editor, run these files **in order**:

1. `supabase/schema.sql` — tables, enums, the UPSA-email-validation trigger
2. `supabase/rls_policies.sql` — Row Level Security (privacy enforcement)
3. `supabase/storage_setup.sql` — file storage buckets + their policies
4. `supabase/seed.sql` — optional sample courses for testing

**How UPSA-only access is enforced:** every signup email must match
`^[0-9]{8}@upsamail\.edu\.gh$` — an 8-digit student ID at the exact domain.
This is checked in a Postgres trigger (`handle_new_user`) that runs on the
`auth.users` table itself, so it's enforced at the database level, not just
in the app's UI — even a direct API call can't create an account with a
non-UPSA email.

**How Study Vault privacy is enforced:** `study_vault_items` has exactly one
RLS policy — the owner can read/write their own rows. There is no
staff/admin policy on that table at all, so even a bug in the admin
dashboard code can't leak a student's private AI sessions.

## Project structure

```
distinction-library/
├── app/
│   ├── layout.tsx        # root layout, metadata
│   ├── page.tsx           # landing page (assembles all sections)
│   └── globals.css        # fonts, base styles, .reveal animation
├── components/
│   ├── Navbar.tsx
│   ├── Hero.tsx
│   ├── Stats.tsx
│   ├── Features.tsx       # carousel, client component
│   ├── HowItWorks.tsx
│   ├── FoundersNote.tsx
│   ├── FAQ.tsx             # accordion, client component
│   ├── FinalCTA.tsx
│   ├── Footer.tsx
│   └── Reveal.tsx          # scroll-reveal wrapper (IntersectionObserver)
├── public/
│   └── manifest.json       # PWA manifest — icons still needed (192px, 512px)
├── tailwind.config.js       # design tokens from Section 8.1
├── .env.local.example
└── package.json
```

## Running this locally

You'll need Node.js 18+ installed.

```bash
cd distinction-library
npm install
npm run dev
```

Then open http://localhost:3000.

## What's still missing before this is a real PWA

1. **App icons** — 192×192 and 512×512 PNGs referenced in `manifest.json`, in
   navy/gold per the brand.
2. **Service worker** for offline support (Section 6 requirement). Recommend
   `next-pwa` package once you're ready for that stage.
3. **Real content** — the "3,400+ past questions" stats are placeholder from
   the brief; wire these to live Supabase counts once Stage 3 (database) is
   done.
4. **Supabase project** — you'll need to create one at supabase.com and drop
   the URL/anon key into `.env.local` (copy from `.env.local.example`).

## Next stage

Stage 3: database schema (Supabase/Postgres tables for users, past papers,
study materials, study vault, strikes, blog posts) — SQL migration file,
ready to run in the Supabase SQL editor.
