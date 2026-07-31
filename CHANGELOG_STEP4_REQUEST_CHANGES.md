# Step 4 — "Request Changes" as a third moderation action

## What changed

Per spec 8.2: "Approve, reject, or request changes, with an optional reason sent to
the uploader via the Notification Centre." Request Changes now exists alongside the
existing Approve/Reject.

**2 files changed:**

1. **`components/moderate/ModerationQueue.tsx`** (replaces the whole file) —
   - New "Request Changes" button (amber) next to Approve and Reject on every paper
     and material row.
   - Clicking it opens the same kind of reason panel Reject already uses, just
     without the "issue a strike" checkbox — a strike is a punitive action and
     doesn't fit "this just needs a fix."
   - Sets the item's status to `needs_revision`, saves the feedback as the reason,
     and notifies the uploader with encouraging wording ("needs some changes before
     it can be approved... please re-upload once it's updated") rather than the
     flatter rejection wording.
   - The item leaves the moderation queue either way (queue only ever shows
     `pending` items) — same as how Reject already behaves.

2. **`app/admin/moderation-log/page.tsx`** (replaces the version from the last
   change) — now also lists `needs_revision` items in the audit trail, with an
   amber "changes requested" badge distinct from the red "rejected" one.

## Manual steps for John

Both files already exist from recent commits:
1. `components/moderate/ModerationQueue.tsx` — pencil-edit, select all, delete,
   paste, commit.
2. `app/admin/moderation-log/page.tsx` — same process.

No database changes — `status` on `past_papers`/`study_materials` and `type` on
`notifications` are both free text with no restrictive check constraint, so the new
`needs_revision` / `upload_needs_revision` values didn't need a migration.

## The part that's still not built (by design, discussed and agreed)

There is still no "My Uploads" page for a student to see a `needs_revision` item and
resubmit it — they'll get the notification telling them what to fix, but the only way
to act on it today is to upload again from scratch via the normal upload form. That's
the same situation rejected uploads have always been in, so this isn't a new gap, but
it's worth building properly at some point as its own feature (a page listing a
student's own submissions with their status, and a way to edit/replace one in place).

## Next task after this

Per the priority order: Study Vault folder organization.
