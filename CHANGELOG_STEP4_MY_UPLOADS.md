# Step 4 — "My Uploads" resubmit page

## A bug caught and fixed before it shipped

While building this, I discovered that `status` on `past_papers` and `study_materials`
is an actual Postgres **enum** (`paper_status` / `material_status`), not free text.
Their only valid values were `pending`, `approved`, `rejected` — meaning the
`needs_revision` status used by the "Request Changes" feature from the last step
**would have thrown a database error the first time a moderator clicked it**, since
that value didn't exist in either enum. This wasn't visible from the code alone; I
only caught it by checking the actual constraint definitions in Supabase.

Fixed via migration (already applied live): both enums now include `needs_revision`.
No code changes were needed — `ModerationQueue.tsx` and `moderation-log/page.tsx` from
the last step are unaffected and will now work correctly as originally written.

## What was added

**Database (already applied live):**
- Two new RLS policies — "owners can resubmit for review" (on both `past_papers` and
  `study_materials`) — let a student update *their own* row, but only when its status
  is `rejected` or `needs_revision`, and only to flip it back to `pending`. They still
  can't touch an approved or pending item, and can't set status to anything else. This
  was necessary because students previously had no UPDATE permission on these tables
  at all — only staff did.

**Code (3 files):**

1. **`app/papers/my-uploads/page.tsx`** (new) — lists everything a student has ever
   submitted, newest first, with a status badge and the moderator's feedback shown for
   anything rejected or needing changes.
2. **`components/papers/MyUploadsList.tsx`** (new) — the "Fix & resubmit" flow: pick a
   replacement file, it uploads to the same storage bucket the original used, then
   updates the record's file, clears the old feedback, and flips status back to
   `pending` so it re-enters the Moderation Queue.
3. **`app/papers/upload/page.tsx`** (edited) — added a "My uploads" link so students
   can actually find the new page; the new page links back to "+ New upload" too.

## A scope decision worth knowing about

I allowed resubmission for **both** `rejected` and `needs_revision` items, not just
`needs_revision`. Reasoning: leaving flat-out rejected items as permanent dead ends
seemed unnecessarily harsh, and a moderator can always reject it again if it's still
not right. If you'd rather rejected items NOT be resubmittable (e.g. because rejection
is meant to mean "this doesn't belong here at all," not "this is fixable"), that's an
easy one-line change to make later — just let me know.

## Manual steps for John

1. **`app/papers/my-uploads/page.tsx`** — new file. In `app/papers`, "Add file" →
   "Create new file" → path `my-uploads/page.tsx` → paste → commit.
2. **`components/papers/MyUploadsList.tsx`** — new file. Same process in
   `components/papers`.
3. **`app/papers/upload/page.tsx`** — already exists, pencil-edit → select all →
   delete → paste → commit.

No further database action needed — everything on the Supabase side (the enum fix and
the two RLS policies) is already live.

## Next task after this

Per the priority order: Study Vault folder organization.
