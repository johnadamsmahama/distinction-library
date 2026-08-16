import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile, isStaffRole } from '@/lib/auth-helpers';
import { classifyUpload } from '@/lib/course-matcher';
import { AUTO_APPROVE_THRESHOLD } from '@/lib/ai-moderation';
// @ts-ignore -- pdf-parse doesn't ship type declarations for this subpath
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import { extractPptxText } from '@/lib/pptx-text';
import mammoth from 'mammoth';

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

function hashBuffer(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
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

      // Exact-duplicate check by content hash, done before anything else —
      // if this exact file already exists (in either table), skip it
      // immediately without spending an AI classification call on it.
      const [existingPaper, existingMaterial] = await Promise.all([
        admin.from('past_papers').select('id, course_id').eq('file_hash', fileHash).limit(1).maybeSingle(),
        admin.from('study_materials').select('id, course_id').eq('file_hash', fileHash).limit(1).maybeSingle(),
      ]);

      if (existingPaper.data || existingMaterial.data) {
        newResults.push({
          filename: fileName,
          status: 'skipped_duplicate',
          note: 'Identical file already exists in the library (matched by content, not filename).',
        });
        continue;
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
        const { error: uploadErr } = await admin.storage.from('past-papers').upload(path, buffer);
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
        const contentType = classification.contentType ?? 'study_notes';

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
        const { error: uploadErr } = await admin.storage.from('study-materials').upload(path, buffer);
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
