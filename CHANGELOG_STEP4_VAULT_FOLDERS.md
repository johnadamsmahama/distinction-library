# Step 4 — Study Vault folder organization

## What changed

Per spec 7.2: "Organize saved items by course or custom folder." Vault items were a
flat, ungrouped list before this — no way to sort or filter them at all.

**Database (already applied live):**
- Two new nullable columns on `study_vault_items`: `course_id` (links to `courses`)
  and `folder_name` (free text). Both optional — an item can have a course, a custom
  folder, both, or neither (shows as "Unsorted"). No new RLS policy needed — students
  already had full ownership rights on their own vault rows.

**Code (2 files):**

1. **`app/vault/page.tsx`** (edited) — now also fetches the course list and each
   item's linked course code.
2. **`components/vault/VaultList.tsx`** (replaces the whole file) —
   - A row of filter tabs at the top: All, Unsorted, then one tab per course and one
     per custom folder that actually has items in it (tabs only appear once
     something's been organized into them — no empty ones to manage).
   - Each item has a new "Organize" button that opens a small panel to pick a course
     from a dropdown and/or type a custom folder name.
   - Course and folder tags now show directly on each item in the list.

## A gap found but not built (separate, larger piece of work)

While checking spec 7.2 line by line, I noticed the first bullet — **"Save any past
question, note, or AI-generated summary from the Library for later"** — is only
half true. AI-generated quizzes and Study Companion sessions *can* be saved to the
Vault (that already works), but there's **no way to save an actual past paper or
study material from the Library** into the Vault at all. There's no "Save" button
anywhere on the Library pages, and the underlying `item_type` on `study_vault_items`
doesn't even have a value for "this is a saved paper" vs "this is a saved material" —
only quiz/companion_session/summary exist.

Building that properly means: adding a "Save to Vault" button on Library paper/material
cards, adding new item types, and deciding whether a saved paper is a link/reference
back to the original (so it always reflects moderation status, file updates, etc.) or
a snapshot copy. That's its own feature, not something to fold into "folder
organization" — flagging it here so it's tracked, not lost.

## Manual steps for John

1. **`app/vault/page.tsx`** — already exists, pencil-edit → select all → delete →
   paste → commit.
2. **`components/vault/VaultList.tsx`** — already exists, same process.

No further database action — the two columns are already live.

## Next task after this

That was the last item in the Step 4 punch list. Per the plan, Step 5 is a final
verification pass against the spec's Feature Priority Matrix (Section 13) — going
through the whole platform once more to confirm nothing on the launch list was missed.
