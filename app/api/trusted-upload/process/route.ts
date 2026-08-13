// app/api/trusted-upload/process/route.ts
//
// Admin-only fast-path processing for a Trusted Upload batch. Mirrors the
// cursor/batch/self-triggering pattern from app/api/bulk-upload/process,
// re-using the same bulk_upload_jobs table (job_type = 'trusted') so both
// flows share proven, working job-tracking plumbing.
//
// No AI classification, no ai_review_status, no moderation queue — every
// file in this batch was already sorted by an admin under one selected
// course + type. This route only ever pulls metadata (year, exam type,
// week number, course code) out of the file itself to auto-fill and
// cross-check, never to override the admin's course selection.

import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentProfile, isAdminRole } from '@/lib/auth-helpers';
import { createClient } from '@/lib/supabase/server';
import { extractPastPaperMetadata } from '@/lib/trusted-upload/extract-pdf-metadata';
import {
  parsePastPaperFilename,
  parseStudyMaterialFilename,
} from '@/lib/trusted-upload/parse-filename';
import { verifyCourseCode } from '@/lib/trusted-upload/verify-course-code';
import { watermarkPdf } from '@/lib/pdf-watermark';

const BATCH_SIZE = 3; // same reasoning as bulk-upload: stay under Vercel's function timeout

type JobResult = {
  filename: string;
  status:
    | 'approved'
    | 'skipped_duplicate'
    | 'needs_metadata'
    | 'needs_course_review'
    | 'error';
  note: string;
  extractedCode?: string; // present only for needs_course_review, for the resolve UI
};

type TrustedUploadConfig = {
  courseId: string;
  courseCode: string;
  uploadType: 'past_paper' | 'study_material';
};

function hashBuffer(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function deriveTitleFromFilename(filename: string): string {
  return filename
    .replace(/\.[^.]+$/, '')
    .replace(/[_\-]+/g, ' ')
    .trim()
    .toUpperCase();
}

export async function POST(req: NextRequest) {
  // Auth check happens here, not just at job-creation time — this route can
  // be re-triggered by its own fire-and-forget fetch, so it needs to verify
  // independently rather than trusting the caller.
  const supabase = createClient();
  const { user, profile } = await getCurrentProfile(supabase);
  if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  if (!isAdminRole(profile?.role)) {
    return NextResponse.json({ error: 'Admin only.' }, { status: 403 });
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
  if (!config?.courseId || !config?.courseCode || !config?.uploadType) {
    await admin.from('bulk_upload_jobs').update({ status: 'failed' }).eq('id', jobId);
    return NextResponse.json({ error: 'Job is missing trusted_upload_config' }, { status: 500 });
  }

  const { data: zipBlob, error: downloadErr } = await admin.storage
    .from('trusted-uploads')
    .download(job.zip_path);

  if (downloadErr || !zipBlob) {
    await admin.from('bulk_upload_jobs').update({ status: 'failed' }).eq('id', jobId);
    return NextResponse.json({ error: 'Could not download zip file' }, { status: 500 });
  }

  const zip = await JSZip.loadAsync(await zipBlob.arrayBuffer());
  const entries = Object.values(zip.files).filter((f) => !f.dir);

  const totalFiles = job.total_files ?? entries.length;
  if (job.total_files === null) {
    await admin.from('bulk_upload_jobs').update({ total_files: totalFiles }).eq('id', jobId);
  }

  const startIndex = job.cursor;
  const endIndex = Math.min(startIndex + BATCH_SIZE, totalFiles);
  const batch = entries.slice(startIndex, endIndex);
  const newResults: JobResult[] = [];

  for (let i = 0; i < batch.length; i++) {
    const entry = batch[i];
    const fileName = entry.name.split('/').pop() ?? entry.name;
    const lowerName = fileName.toLowerCase();
    const isPdf = lowerName.endsWith('.pdf');

    try {
      const buffer = Buffer.from(await entry.async('arraybuffer'));
      const fileHash = hashBuffer(buffer);

      // Duplicate check first, before any parsing/extraction cost — same
      // principle as bulk-upload. Checks both tables regardless of this
      // batch's type, in case a file was previously uploaded under the
      // other type by mistake.
      const [existingPaper, existingMaterial] = await Promise.all([
        admin.from('past_papers').select('id').eq('file_hash', fileHash).limit(1).maybeSingle(),
        admin.from('study_materials').select('id').eq('file_hash', fileHash).limit(1).maybeSingle(),
      ]);

      if (existingPaper.data || existingMaterial.data) {
        newResults.push({
          filename: fileName,
          status: 'skipped_duplicate',
          note: 'Identical file already exists in the library (matched by content, not filename).',
        });
        continue;
      }

      // ---------------- PAST PAPER ----------------
      if (config.uploadType === 'past_paper') {
        const filenameParsed = parsePastPaperFilename(fileName).parsed;

        let contentYear: number | null = null;
        let contentExamType: 'mid_semester' | 'end_of_semester' | null = null;
        let contentCourseCode: string | null = null;
        let isResit = false;

        if (isPdf) {
          const extracted = await extractPastPaperMetadata(buffer);
          contentYear = extracted.year;
          contentExamType = extracted.examType;
          contentCourseCode = extracted.courseCode;
          isResit = extracted.isResit;
        }

        // Content extraction (cover page) is the primary source; filename
        // parsing is only a fallback, per real-world testing showing
        // filenames rarely carry this info reliably.
        const year = contentYear ?? filenameParsed.year;
        const examType = contentExamType ?? filenameParsed.examType;

        if (year === null || examType === null) {
          newResults.push({
            filename: fileName,
            status: 'needs_metadata',
            note: isPdf
              ? 'Could not confidently determine year and/or exam type from the file or filename.'
              : 'Non-PDF past paper — content extraction unavailable, and filename did not resolve year/exam type.',
          });
          continue;
        }

        const verification = await verifyCourseCode(admin, contentCourseCode, {
          id: config.courseId,
          code: config.courseCode,
        });

        if (verification.status === 'mismatch') {
          newResults.push({
            filename: fileName,
            status: 'needs_course_review',
            note: `Cover page shows course code "${verification.extractedCode}", which doesn't match the selected course (${config.courseCode}) and isn't a known alias.`,
            extractedCode: verification.extractedCode,
          });
          continue;
        }

        // Raw file → private 'past-papers' bucket (mirrors approve-paper's
        // existing file_url semantics: raw/private, separate from the
        // public watermarked copy).
        const paperId = crypto.randomUUID();
        const rawPath = `${job.uploaded_by}/${config.courseId}/${Date.now()}-${startIndex + i}.pdf`;
        const { error: rawUploadErr } = await admin.storage
          .from('past-papers')
          .upload(rawPath, buffer, { contentType: isPdf ? 'application/pdf' : undefined });
        if (rawUploadErr) throw new Error(rawUploadErr.message);

        // Watermark — same stamp as the moderation queue, non-negotiable
        // even on this fast path.
        const watermark = isPdf
          ? await watermarkPdf(new Uint8Array(buffer), config.courseCode)
          : { bytes: new Uint8Array(buffer), extension: 'pdf', watermarked: false };

        const finalPath = `${config.courseId}/${year}/${paperId}.${watermark.extension}`;
        const { error: finalUploadErr } = await admin.storage
          .from('past-papers-final')
          .upload(finalPath, watermark.bytes, { contentType: 'application/pdf', upsert: true });
        if (finalUploadErr) throw new Error(finalUploadErr.message);

        const { data: publicUrlData } = admin.storage.from('past-papers-final').getPublicUrl(finalPath);

        const { error: insertErr } = await admin.from('past_papers').insert({
          id: paperId,
          course_id: config.courseId,
          year,
          exam_type: examType,
          is_resit: isResit,
          file_url: rawPath,
          watermarked_url: publicUrlData.publicUrl,
          file_hash: fileHash,
          uploaded_by: job.uploaded_by,
          status: 'approved',
          reviewed_by: job.uploaded_by,
          reviewed_at: new Date().toISOString(),
        });
        if (insertErr) throw new Error(insertErr.message);

        newResults.push({
          filename: fileName,
          status: 'approved',
          note: `Published under ${config.courseCode}${
            verification.status === 'match_via_alias' ? ` (matched via known alias ${verification.aliasCode})` : ''
          } — ${examType.replace('_', ' ')}, ${year}${isResit ? ', resit' : ''}.${
            !watermark.watermarked ? ' Note: watermarking failed, published unstamped.' : ''
          }`,
        });

      // ---------------- STUDY MATERIAL ----------------
      } else {
        const { weekNumber } = parseStudyMaterialFilename(fileName).parsed;

        if (weekNumber === null) {
          newResults.push({
            filename: fileName,
            status: 'needs_metadata',
            note: 'Could not determine a week number from the filename.',
          });
          continue;
        }

        const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
        const contentType = ext === 'pptx' ? 'lecture_slides' : 'study_notes';
        const title = deriveTitleFromFilename(fileName);

        const path = `${job.uploaded_by}/${config.courseId}/${Date.now()}-${startIndex + i}.${ext}`;
        const { error: uploadErr } = await admin.storage.from('study-materials').upload(path, buffer);
        if (uploadErr) throw new Error(uploadErr.message);

        const { data: publicUrlData } = admin.storage.from('study-materials').getPublicUrl(path);

        const { error: insertErr } = await admin.from('study_materials').insert({
          course_id: config.courseId,
          title,
          content_type: contentType,
          week_number: weekNumber,
          file_url: publicUrlData.publicUrl,
          file_hash: fileHash,
          uploaded_by: job.uploaded_by,
          status: 'approved',
          reviewed_at: new Date().toISOString(),
        });
        if (insertErr) throw new Error(insertErr.message);

        newResults.push({
          filename: fileName,
          status: 'approved',
          note: `Published under ${config.courseCode}, week ${weekNumber}.`,
        });
      }
    } catch (e: any) {
      console.error(`Trusted upload processing failed for ${fileName}:`, e);
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
    fetch(`${req.nextUrl.origin}/api/trusted-upload/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId }),
    }).catch((e) => console.error('Failed to trigger next batch:', e));
  }

  return NextResponse.json({ cursor: newCursor, totalFiles, done: isDone });
}
