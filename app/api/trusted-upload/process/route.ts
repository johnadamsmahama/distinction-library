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
// AUTH NOTE: this route is called two ways —
//   1) From the browser (TrustedUploadPanel), authenticated via the user's
//      Supabase session cookie.
//   2) From itself, server-to-server, to process the next batch. That
//      request has no cookies, so it can't use the cookie-based session
//      check. Instead it sends a shared secret header
//      (x-internal-trigger-secret) that only this server knows, set via
//      the TRUSTED_UPLOAD_INTERNAL_SECRET env var in Vercel. When that
//      header matches, we trust the request without a user session —
//      the original request was already verified as admin when the job
//      was first created.

import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentProfile, isAdminRole } from '@/lib/auth-helpers';
import { createClient } from '@/lib/supabase/server';
import { processPastPaperEntry, processStudyMaterialEntry } from '@/lib/trusted-upload/process-entry';
import { JobResult, TrustedUploadConfig } from '@/lib/trusted-upload/types';

const BATCH_SIZE = 3; // same reasoning as bulk-upload: stay under Vercel's function timeout
const INTERNAL_HEADER = 'x-internal-trigger-secret';

function hashBuffer(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
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
  if (!config?.courseId || !config?.courseCode || !config?.uploadType) {
    await admin.from('bulk_upload_jobs').update({ status: 'failed' }).eq('id', jobId);
    return NextResponse.json({ error: 'Job is missing trusted_upload_config' }, { status: 500 });
  }

  try {
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

      try {
        const buffer = Buffer.from(await entry.async('arraybuffer'));
        const fileHash = hashBuffer(buffer);

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

        const pathSalt = `${Date.now()}-${startIndex + i}`;

        const result =
          config.uploadType === 'past_paper'
            ? await processPastPaperEntry({
                admin,
                buffer,
                fileHash,
                fileName,
                uploadedBy: job.uploaded_by,
                courseId: config.courseId,
                courseCode: config.courseCode,
                pathSalt,
              })
            : await processStudyMaterialEntry({
                admin,
                buffer,
                fileHash,
                fileName,
                uploadedBy: job.uploaded_by,
                courseId: config.courseId,
                courseCode: config.courseCode,
                pathSalt,
              });

        newResults.push(result);
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
      if (!process.env.TRUSTED_UPLOAD_INTERNAL_SECRET) {
        // No secret configured — can't authenticate the next hop. Fail loudly
        // instead of leaving the job stuck at "processing" forever.
        console.error('TRUSTED_UPLOAD_INTERNAL_SECRET is not set — cannot continue batch chain.');
        await admin
          .from('bulk_upload_jobs')
          .update({ status: 'failed' })
          .eq('id', jobId);
        return NextResponse.json(
          { error: 'Server misconfigured: TRUSTED_UPLOAD_INTERNAL_SECRET missing.' },
          { status: 500 }
        );
      }

      const nextBatchRes = await fetch(`${req.nextUrl.origin}/api/trusted-upload/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [INTERNAL_HEADER]: process.env.TRUSTED_UPLOAD_INTERNAL_SECRET,
        },
        body: JSON.stringify({ jobId }),
      }).catch((e) => {
        console.error('Failed to trigger next batch:', e);
        return null;
      });

      if (!nextBatchRes || !nextBatchRes.ok) {
        // The chain broke — mark the job failed rather than leaving it
        // silently stuck at "processing" with a stalled progress bar.
        console.error('Next batch trigger did not succeed, marking job failed.');
        await admin
          .from('bulk_upload_jobs')
          .update({ status: 'failed' })
          .eq('id', jobId);
      }
    }

    return NextResponse.json({ cursor: newCursor, totalFiles, done: isDone });
  } catch (e: any) {
    console.error('Trusted upload batch processing crashed:', e);
    await admin.from('bulk_upload_jobs').update({ status: 'failed' }).eq('id', jobId);
    return NextResponse.json({ error: e?.message ?? 'Batch processing failed.' }, { status: 500 });
  }
}
