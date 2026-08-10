import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentProfile, isStaffRole } from '@/lib/auth-helpers';

// DELETE /api/moderation/delete-item/[id]
// Staff-only. Permanently removes a past paper or study material — both the
// database row and the underlying file(s) in storage. Used for cleaning up
// duplicates, mislabeled uploads, or anything else that made it into the
// system and needs to come back out (unlike Reject, which just marks a
// pending item as declined and keeps it around for the audit trail).
//
// JSON body: { type: 'paper' | 'material', reason?: string }
//
// Papers can have files in up to two buckets depending on status:
//   - 'past-papers' (private staging) — file_url, a bare storage path
//   - 'past-papers-final' (public) — watermarked_url, a full public URL,
//     only present once the paper has been approved
// Materials only ever live in the public 'study-materials' bucket, and
// file_url there is a full public URL.
//
// Storage deletes are attempted but not fatal — if a file is already gone
// (e.g. previously orphaned) we still proceed to remove the DB row so the
// moderator isn't stuck with an item they can't clear.
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { user, profile } = await getCurrentProfile(supabase);

  if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  if (!isStaffRole(profile?.role)) {
    return NextResponse.json({ error: 'Staff only.' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const type: 'paper' | 'material' | undefined = body.type;
  const reason: string | undefined = body.reason;

  if (type !== 'paper' && type !== 'material') {
    return NextResponse.json({ error: "Body must include type: 'paper' or 'material'." }, { status: 400 });
  }

  const admin = createAdminClient();
  const table = type === 'paper' ? 'past_papers' : 'study_materials';

  const { data: item, error: fetchErr } = await admin
    .from(table)
    .select(type === 'paper' ? 'id, file_url, watermarked_url, status, uploaded_by, courses(code)' : 'id, file_url, status, uploaded_by, courses(code), title')
    .eq('id', params.id)
    .single();

  if (fetchErr || !item) {
    return NextResponse.json({ error: 'Item not found.' }, { status: 404 });
  }

  // --- Storage cleanup ---
  if (type === 'paper') {
    const fileUrl = (item as any).file_url as string | null;
    const watermarkedUrl = (item as any).watermarked_url as string | null;

    if (fileUrl) {
      await admin.storage.from('past-papers').remove([fileUrl]);
    }
    if (watermarkedUrl) {
      const finalPath = extractStoragePath('past-papers-final', watermarkedUrl);
      if (finalPath) {
        await admin.storage.from('past-papers-final').remove([finalPath]);
      }
    }
  } else {
    const fileUrl = (item as any).file_url as string | null;
    if (fileUrl) {
      const path = extractStoragePath('study-materials', fileUrl);
      // Materials have historically stored either a bare path or a full
      // public URL depending on when they were uploaded — fall back to
      // using file_url as-is if it doesn't parse as a public URL.
      await admin.storage.from('study-materials').remove([path ?? fileUrl]);
    }
  }

  // --- DB row removal ---
  const { error: deleteErr } = await admin.from(table).delete().eq('id', params.id);

  if (deleteErr) {
    return NextResponse.json({ error: deleteErr.message }, { status: 500 });
  }

  // --- Notify uploader ---
  const uploaderId = (item as any).uploaded_by as string | null;
  if (uploaderId) {
    const courseCode = (item as any).courses?.code ?? '';
    const label = type === 'paper' ? 'past paper' : 'study material';
    const name = type === 'material' ? `"${(item as any).title}"` : `for ${courseCode}`;
    const message = reason
      ? `Your ${label} ${name} was removed by a moderator. Reason: ${reason}`
      : `Your ${label} ${name} was removed by a moderator.`;

    await admin.from('notifications').insert({
      user_id: uploaderId,
      message,
      type: 'upload_removed',
    });
  }

  return NextResponse.json({ success: true });
}

// Supabase public URLs look like:
//   https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
// This pulls just the <path> part back out so it can be passed to
// storage.remove(). Returns null if the string isn't a public URL for the
// given bucket (e.g. it's already a bare path).
function extractStoragePath(bucket: string, urlOrPath: string): string | null {
  const marker = `/storage/v1/object/public/${bucket}/`;
  const idx = urlOrPath.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(urlOrPath.slice(idx + marker.length));
}
