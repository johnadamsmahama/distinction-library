# Step 4 — Blog categories in the UI

## What changed

The `category` column on `blog_posts` already existed in Supabase (added earlier this
project) but nothing in the app read or wrote it. This closes that gap, per spec Section
9.2: categories are Study Tips, Platform Updates, Opportunities Spotlight, Student Stories.

**4 files changed:**

1. **`components/admin/BlogManager.tsx`**
   - New post form now has a required Category dropdown (the 4 spec categories).
   - Each existing post in the admin list shows a category badge and has its own
     dropdown to set/change its category after the fact — useful since posts created
     before this change have no category set.

2. **`app/admin/blog/page.tsx`**
   - Added `category` to the Supabase query so the admin list has it to display.

3. **`app/blog/page.tsx`** (public listing)
   - Added filter tabs across the top: All / Study Tips / Platform Updates /
     Opportunities Spotlight / Student Stories. Clicking one filters the list
     (via a `?category=` URL param — no JavaScript state needed, works with the
     server-rendered page as-is).
   - Each post card now shows its category as a small badge.

4. **`app/blog/[id]/page.tsx`** (post detail)
   - Shows the post's category as a badge above the title.

## Manual steps for John

Same GitHub web-editor workflow as before — for each of the 4 files above:
1. Navigate to the file in GitHub.
2. Click the pencil (✏️) to edit.
3. Select all, delete, paste in the new version.
4. Commit.

Order doesn't matter for these 4 — they don't depend on each other being committed in a
particular sequence, unlike last time's leaderboard files. But it's cleanest to commit all
4 close together so the admin form and the public pages are in sync.

No database changes needed — the `category` column already exists and its check
constraint already matches the 4 spec category names exactly.

## A gap I noticed but did NOT fix in this pass

Spec Section 9.2 says the Blog should be **"Public-facing (no login required to read),
matching its current live behavior."** But both `app/blog/page.tsx` and
`app/blog/[id]/page.tsx` currently `redirect('/login')` for anyone not signed in — so
right now the blog actually requires login, which contradicts the spec.

I left this alone because fixing it isn't a category-UI change — it likely means
adjusting `middleware.ts` (or wherever the auth gate lives) to allow `/blog` and
`/blog/[id]` through without a session, which is a different kind of change with its own
risk of breaking something else in the auth flow. Flagging it now so it's not lost; happy
to take it on as its own small task whenever you're ready.

Also noted but not addressed (also spec 9.2, also not category-related): "New posts
trigger a Low-priority Notification Centre entry for opted-in students" — not built yet.

## Next task after this

Per the priority order: Settings split (Account Settings / Notification Settings /
Support) per spec Sections 10.1–10.3.
