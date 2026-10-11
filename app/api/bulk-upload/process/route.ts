import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import crypto from 'crypto';
import { SupabaseClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile, isStaffRole } from '@/lib/auth-helpers';
import { classifyUpload } from '@/lib/course-matcher';
import { AUTO_APPROVE_THRESHOLD } from '@/lib/ai-moderation';
// @ts-ignore -- pdf-parse doesn't ship type declarations for this subpath
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import { extractPptxText } from '@/lib/pptx-text';
import mammoth from 'mammoth';

// Without this, the route runs on Vercel's default timeout (10s on the
// Hobby plan) — the same silent-kill issue found and fixed in the sibling
// /api/trusted-upload/process route. A function killed for running too
// long terminates abruptly, bypassing any try/catch, so failures here
// would go unrecorded the same way. 60s is the maximum allowed on Hobby.
export const maxDuration = 60;

// How many files to process per invocation. Kept small so each call stays
// well under Vercel's function timeout — the route re-triggers itself for
// the next batch until the whole zip is processed.
const BATCH_SIZE = 3;

// AUTH NOTE: this route is called two ways, same pattern as
// /api/trusted-upload/process —
//   1) From the browser (UploadForm's BulkUploadPanel), authenticated via
//      the user's Supabase session cookie. Any logged-in student can start
//      their own bulk upload; we verify they own the job below.
//   2) From itself, server-to-server, to process the next batch. That
//      request has no cookies, so it authenticates instead with a shared
//      secret header (x-internal-trigger-secret) set via the
//      BULK_UPLOAD_INTERNAL_SECRET env var — the original request was
//      already verified as the job owner when the job was first created.
const INTERNAL_HEADER = 'x-internal-trigger-secret';

type JobResult = { filename: string; status: string; note: string };

// A previously stored file whose content hash matches the file being
// processed. Identical content is stored ONCE and linked to every course
// it belongs to (past_paper_courses / study_material_courses).
type ExistingFile = {
  table: 'past_papers' | 'study_materials';
  id: string;
  courseId: string | null;
  status: string | null;
};

// Supabase storage-js defaults to 'text/plain;charset=UTF-8' when no
// contentType is passed to .upload() — this went unnoticed while the
// past-papers/study-materials buckets allowed any mime type, but now that
// those buckets have real allowed_mime_types lists, every upload here would
// get rejected outright without this. Same fix as trusted-upload's
// process-entry.ts.
const MIME_BY_EXT: Record<string, string> = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
};
function mimeForExt(ext: string | undefined): string {
  return MIME_BY_EXT[(ext ?? '').toLowerCase()] ?? 'application/octet-stream';
}

function hashBuffer(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Identical content was found in the library and the AI has now decided
 * which course this upload belongs to. Either it's already shown under
 * that course (skip), or we add a link so the SAME stored file is also
 * shown under it — nothing is uploaded or stored a second time.
 * Throws on database errors; the per-file catch records them.
 */
async function linkExistingFile(params: {
  admin: SupabaseClient;
  existing: ExistingFile;
  fileName: string;
  course: { id: string; code: string };
  originalCode: string | null;
}): Promise<JobResult> {
  const { admin, existing, fileName, course, originalCode } = params;
  const fromLabel = originalCode ? ` under ${originalCode}` : '';

  // Files that were rejected or removed shouldn't be linked anywhere.
  if (existing.status !== 'approved' && existing.status !== 'pending') {
    return {
      filename: fileName,
      status: 'skipped_duplicate',
      note: `Identical file exists${fromLabel} but isn't available in the library, so it wasn't added to ${course.code}.`,
    };
  }

  const linkTable = existing.table === 'past_papers' ? 'past_paper_courses' : 'study_material_courses';
  const fkColumn = existing.table === 'past_papers' ? 'past_paper_id' : 'study_material_id';

  const { data: alreadyLinked, error: linkedErr } = await admin
    .from(linkTable)
    .select(fkColumn)
    .eq(fkColumn, existing.id)
    .eq('course_id', course.id)
    .limit(1);
  if (linkedErr) throw new Error(linkedErr.message);

  if (alreadyLinked && alreadyLinked.length > 0) {
    return {
      filename: fileName,
      status: 'skipped_duplicate',
      note: `Already in the library under ${course.code} (matched by content, not filename).`,
    };
  }

  const { error: linkErr } = await admin
    .from(linkTable)
    .upsert(
      { [fkColumn]: existing.id, course_id: course.id },
      { onConflict: `${fkColumn},course_id`, ignoreDuplicates: true }
    );
  if (linkErr) throw new Error(linkErr.message);

  const isLive = existing.status === 'approved';
  return {
    filename: fileName,
    status: isLive ? 'auto_approved' : 'queued_for_review',
    note: isLive
      ? `Already in the library${fromLabel} (matched by content) — not stored again, now also live under ${course.code}.`
      : `Already in the library${fromLabel} and awaiting approval (matched by content) — not stored again, now also linked to ${course.code}.`,
  };
}

export async function POST(req: NextRequest) {
  const internalSecret = req.headers.get(INTERNAL_HEADER);
  const isInternalCall =
    !!process.env.BULK_UPLOAD_INTERNAL_SECRET &&
    internalSecret === process.env.BULK_UPLOAD_INTERNAL_SECRET;

  // Non-internal calls must be a logged-in user. We can't check ownership
  // yet (job isn't loaded), so that happens right after the job is fetched.
  let callerId: string | null = null;
  let callerIsStaff = false;
  if (!isInternalCall) {
    const supabase = createClient();
    const { user, profile } = await getCurrentProfile(supabase);
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }
    callerId = user.id;
    callerIsStaff = isStaffRole(profile?.role);
  }

  const body = await req.json().catch(() => ({}));
  const jobId: string | undefined = body.jobId;
  if (!jobId) {
    return NextResponse.json({ error: 'jobId is required' }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: job, error: jobErr } = await admin
    .from('bulk_upload_jobs')
    .select('id, uploaded_by, zip_path, status, total_files, cursor, results')
    .eq('id', jobId)
    .single();

  if (jobErr || !job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  // Only the job's owner, or staff, can process it — unless this is the
  // trusted internal self-hop (already authorized above).
  if (!isInternalCall && job.uploaded_by !== callerId && !callerIsStaff) {
    return NextResponse.json({ error: 'Not authorized to process this job.' }, { status: 403 });
  }

  if (job.status === 'completed' || job.status === 'failed') {
    return NextResponse.json({ skipped: true, reason: `job already ${job.status}` });
  }

  // Download + unzip. Re-done on every invocation since serverless functions
  // don't share memory between calls — simplest correct approach for now.
  const { data: zipBlob, error: downloadErr } = await admin.storage
    .from('bulk-uploads')
    .download(job.zip_path);

  if (downloadErr || !zipBlob) {
    await admin
      .from('bulk_upload_jobs')
      .update({ status: 'failed' })
      .eq('id', jobId);
    return NextResponse.json({ error: 'Could not download zip file' }, { status: 500 });
  }

  const zip = await JSZip.loadAsync(await zipBlob.arrayBuffer());
  const entries = Object.values(zip.files).filter((f) => !f.dir);

  const totalFiles = job.total_files ?? entries.length;
  if (job.total_files === null) {
    await admin.from('bulk_upload_jobs').update({ total_files: totalFiles }).eq('id', jobId);
  }

  // Load the active course list once for the classifier. Level 200/300/400
  // and Diploma courses are hidden while only level 100 is on campus —
  // is_active=false keeps them out of matching without deleting the data.
  const { data: courses } = await admin
    .from('courses')
    .select('id, code, name')
    .eq('is_active', true);
  const courseList = courses ?? [];

  const startIndex = job.cursor;
  const endIndex = Math.min(startIndex + BATCH_SIZE, totalFiles);
  const batch = entries.slice(startIndex, endIndex);
  const newResults: JobResult[] = [];

  for (let i = 0; i < batch.length; i++) {
    const entry = batch[i];
    const fileName = entry.name.split('/').pop() ?? entry.name;
    const lowerName = fileName.toLowerCase();

    try {
      const buffer = Buffer.from(await entry.async('arraybuffer'));
      const fileHash = hashBuffer(buffer);

      // Look up identical content by hash, but do NOT skip yet. The same
      // file can legitimately belong to more than one course (e.g. a
      // course taught under different codes at different levels), and we
      // only know which course THIS upload is for after classification.
      // The decision (skip vs. link) happens right after the course is
      // confirmed below.
      const [existingPaper, existingMaterial] = await Promise.all([
        admin.from('past_papers').select('id, course_id, status').eq('file_hash', fileHash).limit(1).maybeSingle(),
        admin.from('study_materials').select('id, course_id, status').eq('file_hash', fileHash).limit(1).maybeSingle(),
      ]);

      let existingFile: ExistingFile | null = null;
      if (existingPaper.data) {
        existingFile = {
          table: 'past_papers',
          id: existingPaper.data.id,
          courseId: existingPaper.data.course_id,
          status: existingPaper.data.status,
        };
      } else if (existingMaterial.data) {
        existingFile = {
          table: 'study_materials',
          id: existingMaterial.data.id,
          courseId: existingMaterial.data.course_id,
          status: existingMaterial.data.status,
        };
      }

      let extractedText: string | null = null;
      let imageBase64: string | undefined;
      let imageMediaType: 'image/jpeg' | 'image/png' | undefined;

      if (lowerName.endsWith('.pdf')) {
        try {
          const parsed = await pdfParse(buffer);
          extractedText = parsed.text?.trim() || null;
          // A scanned PDF (photo of a page, no real text layer) comes back
          // empty or near-empty here. We don't rasterize PDF pages to images
          // yet, so these currently fall through to manual review rather
          // than erroring — see handover notes for the follow-up.
        } catch (e) {
          console.error(`PDF extraction failed for ${fileName}:`, e);
        }
      } else if (lowerName.endsWith('.pptx')) {
        extractedText = await extractPptxText(buffer);
      } else if (lowerName.endsWith('.docx')) {
        try {
          const result = await mammoth.extractRawText({ buffer });
          extractedText = result.value?.trim() || null;
        } catch (e) {
          console.error(`DOCX extraction failed for ${fileName}:`, e);
        }
      } else if (lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg') || lowerName.endsWith('.png')) {
        // No text to extract — send the image itself to the classifier.
        imageBase64 = buffer.toString('base64');
        imageMediaType = lowerName.endsWith('.png') ? 'image/png' : 'image/jpeg';
      }
      // Old binary .doc / .ppt: no extractor available, classification
      // falls back to filename alone with lower confidence.

      const classification = await classifyUpload({
        fileName,
        extractedText,
        imageBase64,
        imageMediaType,
        courses: courseList.map((c) => ({ code: c.code, name: c.name })),
      });

      const course = courseList.find((c) => c.code === classification.courseCode);
      const alternateCourse = classification.alternateCourseCode
        ? courseList.find((c) => c.code === classification.alternateCourseCode)
        : null;

      // A file is sent to manual review if: kind/course is genuinely
      // unclear (low confidence), OR the AI flagged a real second
      // candidate course (ambiguous) — a high confidence score alone isn't
      // enough to trust if there's a plausible alternate match sitting
      // right next to it.
      if (
        classification.kind === 'unknown' ||
        !course ||
        classification.confidence < 0.4
      ) {
        newResults.push({
          filename: fileName,
          status: 'needs_manual_review',
          note:
            classification.notes ||
            'Could not confidently identify the course or document type — upload this one manually.',
        });
        continue;
      }

      if (classification.ambiguous) {
        const altLabel = alternateCourse ? `${alternateCourse.code} — ${alternateCourse.name}` : 'another course';
        newResults.push({
          filename: fileName,
          status: 'needs_manual_review',
          note: `Could be ${course.code} or ${altLabel} — please confirm which one this belongs to.`,
        });
        continue;
      }

      // Course is confirmed. If identical content already exists, link the
      // existing file to this course (or skip if it's already linked) —
      // never store the same bytes twice.
      if (existingFile) {
        const originalCode = existingFile.courseId
          ? courseList.find((c) => c.id === existingFile!.courseId)?.code ?? null
          : null;
        newResults.push(
          await linkExistingFile({
            admin,
            existing: existingFile,
            fileName,
            course,
            originalCode,
          })
        );
        continue;
      }

      const kind = classification.kind;

      // Duplicate check, mirroring the single-upload form's logic.
      if (kind === 'past_paper') {
        const year = classification.year ?? new Date().getFullYear();
        const examType = classification.examType ?? 'end_of_semester';

        const { data: existing } = await admin
          .from('past_papers')
          .select('id')
          .eq('course_id', course.id)
          .eq('year', year)
          .eq('exam_type', examType)
          .in('status', ['pending', 'approved'])
          .limit(1);

        if (existing && existing.length > 0) {
          newResults.push({
            filename: fileName,
            status: 'skipped_duplicate',
            note: `Already exists for ${course.code} (${examType.replace('_', ' ')}, ${year}).`,
          });
          continue;
        }

        const ext = fileName.split('.').pop();
        const path = `${job.uploaded_by}/${course.id}/${Date.now()}-${startIndex + i}.${ext}`;
        const { error: uploadErr } = await admin.storage
          .from('past-papers')
          .upload(path, buffer, { contentType: mimeForExt(ext) });
        if (uploadErr) throw new Error(uploadErr.message);

        await admin.from('past_papers').insert({
          course_id: course.id,
          year,
          exam_type: examType,
          file_url: path,
          file_hash: fileHash,
          uploaded_by: job.uploaded_by,
          ai_review_status: classification.confidence >= AUTO_APPROVE_THRESHOLD ? 'auto_approved' : 'needs_review',
          ai_confidence: classification.confidence,
          ai_review_notes: classification.notes,
          ai_reviewed_at: new Date().toISOString(),
        });
        // status column intentionally stays 'pending' — past papers always
        // need a human pass through /moderation/approve-paper for watermarking.

        newResults.push({
          filename: fileName,
          status: 'queued_for_review',
          note: `Matched to ${course.code} — in your moderation queue for final approval.`,
        });
      } else {
        // Uppercased here so titles saved through bulk upload (including
        // auto-approved ones that skip human moderation entirely) match the
        // same ALL CAPS convention enforced on the manual-approval path.
        const title = (classification.title || fileName.replace(/\.[^.]+$/, '')).toUpperCase();
        const weekNumber = classification.weekNumber ?? 1;
        // lecture_slides is the only content type a bulk upload can ever
        // produce now — study_notes is retired and study_guide is admin-only
        // (Revision Kit), so the classifier is never asked for either.
        const contentType = 'lecture_slides';

        const { data: existing } = await admin
          .from('study_materials')
          .select('id')
          .eq('course_id', course.id)
          .eq('week_number', weekNumber)
          .ilike('title', title)
          .in('status', ['pending', 'approved'])
          .limit(1);

        if (existing && existing.length > 0) {
          newResults.push({
            filename: fileName,
            status: 'skipped_duplicate',
            note: `Already exists for ${course.code}, week ${weekNumber}.`,
          });
          continue;
        }

        const ext = fileName.split('.').pop();
        const path = `${job.uploaded_by}/${course.id}/${Date.now()}-${startIndex + i}.${ext}`;
        const { error: uploadErr } = await admin.storage
          .from('study-materials')
          .upload(path, buffer, { contentType: mimeForExt(ext) });
        if (uploadErr) throw new Error(uploadErr.message);

        const { data: publicUrlData } = admin.storage.from('study-materials').getPublicUrl(path);
        const autoApprove = classification.confidence >= AUTO_APPROVE_THRESHOLD;

        await admin.from('study_materials').insert({
          course_id: course.id,
          title,
          content_type: contentType,
          week_number: weekNumber,
          file_url: publicUrlData.publicUrl,
          file_hash: fileHash,
          uploaded_by: job.uploaded_by,
          status: autoApprove ? 'approved' : 'pending',
          reviewed_at: autoApprove ? new Date().toISOString() : null,
          ai_review_status: autoApprove ? 'auto_approved' : 'needs_review',
          ai_confidence: classification.confidence,
          ai_review_notes: classification.notes,
          ai_reviewed_at: new Date().toISOString(),
        });

        newResults.push({
          filename: fileName,
          status: autoApprove ? 'auto_approved' : 'queued_for_review',
          note: autoApprove
            ? `Matched to ${course.code}, week ${weekNumber} — live now.`
            : `Matched to ${course.code}, week ${weekNumber} — in your moderation queue.`,
        });
      }
    } catch (e: any) {
      console.error(`Bulk upload processing failed for ${fileName}:`, e);
      newResults.push({
        filename: fileName,
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

  if (!isDone) {
    if (!process.env.BULK_UPLOAD_INTERNAL_SECRET) {
      // No secret configured — can't authenticate the next hop. Fail loudly
      // instead of leaving the job stuck at "processing" forever.
      console.error('BULK_UPLOAD_INTERNAL_SECRET is not set — cannot continue batch chain.');
      await admin.from('bulk_upload_jobs').update({ status: 'failed' }).eq('id', jobId);
      return NextResponse.json(
        { error: 'Server misconfigured: BULK_UPLOAD_INTERNAL_SECRET missing.' },
        { status: 500 }
      );
    }

    // Fire-and-forget: trigger the next batch without waiting for it,
    // so this invocation can return immediately.
    fetch(`${req.nextUrl.origin}/api/bulk-upload/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [INTERNAL_HEADER]: process.env.BULK_UPLOAD_INTERNAL_SECRET,
      },
      body: JSON.stringify({ jobId }),
    }).catch((e) => console.error('Failed to trigger next batch:', e));
  }

  return NextResponse.json({ cursor: newCursor, totalFiles, done: isDone });
}
