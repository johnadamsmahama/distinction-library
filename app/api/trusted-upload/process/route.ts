// app/api/trusted-upload/process/route.ts
//
// Admin-only fast-path processing for a Trusted Upload batch. Mirrors the
// cursor/batch/self-triggering pattern from app/api/bulk-upload/process,
// re-using the same bulk_upload_jobs table (job_type = 'trusted').
//
// Per-file logic lives in lib/trusted-upload/process-entry.ts, shared with
// app/api/trusted-upload/resolve/route.ts — this file only owns the
// batch/cursor loop and duplicate pre-check.
//
// DUPLICATE HANDLING (shared files): a file's content hash identifies the
// stored file. If identical content already exists:
//   - and it is already linked to THIS batch's course -> skipped_duplicate
//   - and it is linked only to OTHER courses -> we don't store it again;
//     we add a link (past_paper_courses / study_material_courses) so the
//     same file is also shown under this course. Reported as 'approved'
//     with a note saying it was linked, not re-uploaded.
//
// HOW BATCHES RUN: each request processes one batch (BATCH_SIZE files) and
// returns { cursor, totalFiles, done }. The browser (TrustedUploadPanel)
// calls this route again until done, so no request ever waits on another.
//
// AUTH NOTE: calls are authenticated via the admin's Supabase session
// cookie. A request carrying the x-internal-trigger-secret header matching
// TRUSTED_UPLOAD_INTERNAL_SECRET is also accepted (no longer used for
// chaining, kept for manual/server-side triggering).

import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import crypto from 'crypto';
import { SupabaseClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentProfile, isAdminRole } from '@/lib/auth-helpers';
import { createClient } from '@/lib/supabase/server';
import { processPastPaperEntry, processStudyMaterialEntry } from '@/lib/trusted-upload/process-entry';
import { JobResult, TrustedUploadConfig } from '@/lib/trusted-upload/types';
import { CourseRef, findCourseInPath, loadCourseMap } from '@/lib/trusted-upload/multi-course';

// Without this, the route runs on Vercel's default timeout (10s on the
// Hobby plan) — easily blown past by downloading a multi-MB zip, parsing
// it with JSZip, and processing a batch, especially on a cold start. When
// Vercel kills a function for running too long it's an abrupt termination,
// not a catchable JS error, so none of the try/catch error_message capture
// below ever runs — the job just sits at status 'failed' with no reason
// recorded. 60s is the maximum allowed on Hobby.
export const maxDuration = 60;

const BATCH_SIZE = 3; // same reasoning as bulk-upload: stay under Vercel's function timeout
const INTERNAL_HEADER = 'x-internal-trigger-secret';

function hashBuffer(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Checks whether identical content (by hash) already exists in the library.
 *
 * Returns null when the content is brand new — the caller should process
 * the file normally. Otherwise returns the JobResult to record for this
 * file (already linked here -> skipped_duplicate; linked now -> approved).
 * Throws on database errors so the caller's per-file catch records them.
 */
async function handleExistingContent(params: {
  admin: SupabaseClient;
  uploadType: string;
  fileHash: string;
  fileName: string;
  courseId: string;
  courseCode: string;
}): Promise<JobResult | null> {
  const { admin, uploadType, fileHash, fileName, courseId, courseCode } = params;

  const [papersRes, materialsRes] = await Promise.all([
    admin.from('past_papers').select('id, course_id').eq('file_hash', fileHash),
    admin.from('study_materials').select('id, course_id').eq('file_hash', fileHash),
  ]);
  if (papersRes.error) throw new Error(papersRes.error.message);
  if (materialsRes.error) throw new Error(materialsRes.error.message);

  const papers = papersRes.data ?? [];
  const materials = materialsRes.data ?? [];
  if (papers.length === 0 && materials.length === 0) return null;

  const isPaperUpload = uploadType === 'past_paper';
  const sameKind = isPaperUpload ? papers : materials;

  // Identical content exists, but as the other kind (a study material
  // uploaded as a past paper or vice versa). Linking across kinds would be
  // wrong, so keep the old behavior: skip and say why.
  if (sameKind.length === 0) {
    return {
      filename: fileName,
      status: 'skipped_duplicate',
      note: `Identical file already exists in the library as a ${
        isPaperUpload ? 'study material' : 'past paper'
      }, so it was not added as a ${isPaperUpload ? 'past paper' : 'study material'}.`,
    };
  }

  const linkTable = isPaperUpload ? 'past_paper_courses' : 'study_material_courses';
  const fkColumn = isPaperUpload ? 'past_paper_id' : 'study_material_id';
  const ids = sameKind.map((r: { id: string }) => r.id);

  const { data: alreadyLinked, error: linkedErr } = await admin
    .from(linkTable)
    .select(fkColumn)
    .in(fkColumn, ids)
    .eq('course_id', courseId)
    .limit(1);
  if (linkedErr) throw new Error(linkedErr.message);

  if (alreadyLinked && alreadyLinked.length > 0) {
    return {
      filename: fileName,
      status: 'skipped_duplicate',
      note: `Already in the library under ${courseCode} (matched by content, not filename).`,
    };
  }

  // Same content, different course: link the existing file to this course
  // instead of storing it a second time.
  const target = sameKind[0] as { id: string; course_id: string | null };
  const { error: linkErr } = await admin
    .from(linkTable)
    .upsert(
      { [fkColumn]: target.id, course_id: courseId },
      { onConflict: `${fkColumn},course_id`, ignoreDuplicates: true }
    );
  if (linkErr) throw new Error(linkErr.message);

  let originalCode: string | null = null;
  if (target.course_id) {
    const { data: originalCourse } = await admin
      .from('courses')
      .select('code')
      .eq('id', target.course_id)
      .maybeSingle();
    originalCode = originalCourse?.code ?? null;
  }

  return {
    filename: fileName,
    status: 'approved',
    note: `Already in the library${
      originalCode ? ` under ${originalCode}` : ''
    } (matched by content) — not stored again, now also shown under ${courseCode}.`,
  };
}

export async function POST(req: NextRequest) {
  const internalSecret = req.headers.get(INTERNAL_HEADER);
  const isInternalCall =
    !!process.env.TRUSTED_UPLOAD_INTERNAL_SECRET &&
    internalSecret === process.env.TRUSTED_UPLOAD_INTERNAL_SECRET;

  if (!isInternalCall) {
    const supabase = createClient();
    const { user, profile } = await getCurrentProfile(supabase);
    if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    if (!isAdminRole(profile?.role)) {
      return NextResponse.json({ error: 'Admin only.' }, { status: 403 });
    }
  }

  const body = await req.json().catch(() => ({}));
  const jobId: string | undefined = body.jobId;
  if (!jobId) {
    return NextResponse.json({ error: 'jobId is required' }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: job, error: jobErr } = await admin
    .from('bulk_upload_jobs')
    .select('id, uploaded_by, zip_path, status, total_files, cursor, results, job_type, trusted_upload_config')
    .eq('id', jobId)
    .eq('job_type', 'trusted')
    .single();

  if (jobErr || !job) {
    return NextResponse.json({ error: 'Trusted upload job not found' }, { status: 404 });
  }

  if (job.status === 'completed' || job.status === 'failed') {
    return NextResponse.json({ skipped: true, reason: `job already ${job.status}` });
  }

  const config = job.trusted_upload_config as TrustedUploadConfig | null;
  // Many-course batches carry no single course — each file's course comes
  // from its zip folder — so courseId/courseCode are only required for
  // one-course batches.
  const isMulti = !!config?.multiCourse;
  if (!config?.uploadType || (!isMulti && (!config.courseId || !config.courseCode))) {
    await admin
      .from('bulk_upload_jobs')
      .update({ status: 'failed', error_message: 'Job is missing trusted_upload_config (courseId, courseCode, or uploadType not set).' })
      .eq('id', jobId);
    return NextResponse.json({ error: 'Job is missing trusted_upload_config' }, { status: 500 });
  }

  try {
    const { data: zipBlob, error: downloadErr } = await admin.storage
      .from('trusted-uploads')
      .download(job.zip_path);

    if (downloadErr || !zipBlob) {
      await admin
        .from('bulk_upload_jobs')
        .update({
          status: 'failed',
          error_message: `Could not download zip file from storage: ${downloadErr?.message ?? 'file missing or empty'} (path: ${job.zip_path})`,
        })
        .eq('id', jobId);
      return NextResponse.json({ error: 'Could not download zip file' }, { status: 500 });
    }

    let zip;
    try {
      zip = await JSZip.loadAsync(await zipBlob.arrayBuffer());
    } catch (zipErr: any) {
      await admin
        .from('bulk_upload_jobs')
        .update({
          status: 'failed',
          error_message: `Could not open the zip file — it may be corrupted, password-protected, or not a valid zip: ${zipErr?.message ?? String(zipErr)}`,
        })
        .eq('id', jobId);
      return NextResponse.json({ error: 'Could not open zip file' }, { status: 500 });
    }
    const entries = Object.values(zip.files).filter((f) => !f.dir);

    const totalFiles = job.total_files ?? entries.length;
    if (job.total_files === null) {
      await admin.from('bulk_upload_jobs').update({ total_files: totalFiles }).eq('id', jobId);
    }

    const startIndex = job.cursor;
    const endIndex = Math.min(startIndex + BATCH_SIZE, totalFiles);
    const batch = entries.slice(startIndex, endIndex);
    const newResults: JobResult[] = [];

    // Many-course batches: load the code -> course map once per batch.
    const courseByCode = isMulti ? await loadCourseMap(admin) : null;

    for (let i = 0; i < batch.length; i++) {
      const entry = batch[i];
      const fileName = entry.name.split('/').pop() ?? entry.name;

      // Which course this file belongs to. One-course batches: the course
      // chosen for the whole batch. Many-course batches: the course whose
      // code names the folder the file sits in.
      let fileCourse: CourseRef = { id: config.courseId, code: config.courseCode };
      // The name shown in the results list. Many-course batches prefix the
      // course code so two files with the same name stay distinguishable.
      let displayName = fileName;

      if (isMulti) {
        const found = findCourseInPath(entry.name, courseByCode!);
        if (!found) {
          newResults.push({
            filename: entry.name,
            status: 'skipped_manual',
            note: `No course in the Library matches the folder for this file (${entry.name}). Add the course, then upload it again.`,
          });
          continue;
        }
        fileCourse = found;
        displayName = `${found.code}/${fileName}`;
      }

      try {
        const buffer = Buffer.from(await entry.async('arraybuffer'));
        const fileHash = hashBuffer(buffer);

        // Duplicate pre-check by content hash. Identical content for the
        // SAME course is skipped; identical content from a DIFFERENT course
        // is linked to this course instead of being stored again.
        const existingResult = await handleExistingContent({
          admin,
          uploadType: config.uploadType,
          fileHash,
          fileName,
          courseId: fileCourse.id,
          courseCode: fileCourse.code,
        });

        if (existingResult) {
          newResults.push({ ...existingResult, filename: displayName });
          continue;
        }

        const pathSalt = `${Date.now()}-${startIndex + i}`;

        const result =
          config.uploadType === 'past_paper'
            ? await processPastPaperEntry({
                admin,
                buffer,
                fileHash,
                fileName,
                uploadedBy: job.uploaded_by,
                courseId: fileCourse.id,
                courseCode: fileCourse.code,
                pathSalt,
              })
            : await processStudyMaterialEntry({
                admin,
                buffer,
                fileHash,
                fileName,
                uploadedBy: job.uploaded_by,
                courseId: fileCourse.id,
                courseCode: fileCourse.code,
                pathSalt,
              });

        newResults.push({ ...result, filename: displayName });
      } catch (e: any) {
        console.error(`Trusted upload processing failed for ${fileName}:`, e);
        newResults.push({
          filename: displayName,
          status: 'error',
          note: e?.message ?? 'Failed to process this file.',
        });
      }
    }

    const updatedResults = [...(job.results as JobResult[]), ...newResults];
    const newCursor = endIndex;
    const isDone = newCursor >= totalFiles;

    await admin
      .from('bulk_upload_jobs')
      .update({
        cursor: newCursor,
        results: updatedResults,
        status: isDone ? 'completed' : 'processing',
        completed_at: isDone ? new Date().toISOString() : null,
      })
      .eq('id', jobId);

    // No server-to-server chaining here. This request handles ONE batch and
    // returns { cursor, totalFiles, done }; the browser (TrustedUploadPanel)
    // keeps calling this route until done. The old design had each batch
    // await the next one, so a zip of more than ~15 files nested requests
    // deeper than Vercel allows and failed with HTTP 508 (loop detected).

    return NextResponse.json({ cursor: newCursor, totalFiles, done: isDone });
  } catch (e: any) {
    console.error('Trusted upload batch processing crashed:', e);
    await admin
      .from('bulk_upload_jobs')
      .update({ status: 'failed', error_message: e?.message ?? String(e) })
      .eq('id', jobId);
    return NextResponse.json({ error: e?.message ?? 'Batch processing failed.' }, { status: 500 });
  }
}
