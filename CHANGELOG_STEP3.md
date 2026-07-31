# Step 3 — Navigation Restructure (per Feature Spec v3, Section 2)

## New pages created
- `app/profile/page.tsx` — Profile, now the confirmed destination for your own avatar (spec 2.1).
- `app/ai-tools/page.tsx` — consolidates AI Study Companion + AI Quiz Generator under one nav entry.
- `app/opportunity-hub/page.tsx` — real listing page reading from the new `opportunities` table (currently empty — nothing published yet, shows an empty state).
- `app/success-centre/page.tsx` — hub linking to Distinction Mentors (`/tutors`) and Opportunity Hub; Career Centre and Events & Sessions shown as "Coming soon" / "Phase 2" since they don't exist in code yet.
- `app/buy-data/page.tsx` + `components/buydata/BuyDataForm.tsx` — the Section 11.1 "Coming Soon" interest-capture form (network + phone + email → `buy_data_signups`).

## Nav changes (`components/dashboard/DashboardNav.tsx`)
Primary nav is now: Dashboard, Library, AI Tools, Exam Predictor, Opportunity Hub, Success Centre, Blog, Notifications, Settings — matching spec Section 2.

Items removed from the primary bar (per spec 2.1, now nested elsewhere, NOT deleted):
- **Leaderboard** — was top-level, now reachable from the Profile page (`/profile` has a "View Leaderboard" button) and from the Dashboard's Profile card.
- **Tutors** — now reachable from Success Centre.
- **Support** — now reachable from Settings (added a Support link on `/dashboard/settings`).

The user's own avatar (initials circle, previously non-clickable) now links to `/profile`. The brand logo (square "D" + wordmark, top-left) still links to `/dashboard` — that's standard "click logo to go home" behavior, kept unchanged.

## Bugs fixed along the way
- `ProfileCard.tsx` linked to `/dashboard/leaderboard`, a route that doesn't exist (real route is `/leaderboard`). Now links to `/profile`.
- The Dashboard's "Buy Data" tile had no `href` at all — it was a dead click. Now links to `/buy-data`.

## Known follow-ups (not done in this pass, flagged honestly)
- Career Centre (AI CV Builder, Cover Letter Generator, Interview Coach) — genuinely unbuilt, not just unwired. See spec Section 5.
- Events & Sessions — Phase 2 per spec, intentionally not built.
- Settings is still one flat page — spec 10.1–10.3 wants it split into Account / Notifications / Support tabs. Support is linked from Settings now but not yet a true sub-tab.
- Desktop nav bar now holds 9 items instead of 5 — added horizontal scroll (`overflow-x-auto`) rather than a visual redesign, per the "wiring pass, not a redesign" constraint. Worth a look on a real desktop screen to confirm it reads well.
