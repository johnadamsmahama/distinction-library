// app/api/trusted-upload/process/route.ts
//
// Admin-only fast-path processing for a Trusted Upload batch. Mirrors the
// cursor/batch/self-triggering pattern from app/api/bulk-upload/process,
// re-using the same bulk_upload_jobs table (job_type = 'trusted').
//
// Per-file logic lives in lib/trusted-upload/process-entry.ts, shared with
// app/api/trusted-upload/resolve/route.ts — this file only owns the
// batch/cursor loop and duplicate pre-check.

import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentProfile, isAdminRole } from '@/lib/auth-helpers';
import { createClient } from '@/lib/supabase/server';
import { processPastPaperEntry, processStudyMaterialEntry } from '@/lib/trusted-upload/process-entry';
import { JobResult, TrustedUploadConfig } from '@/lib/trusted-upload/types';

const BATCH_SIZE = 3; // same reasoning as bulk-upload: stay under Vercel's function timeout

function hashBuffer(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

export async function POST(req: NextRequest) {
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
    fetch(`${req.nextUrl.origin}/api/trusted-upload/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId }),
    }).catch((e) => console.error('Failed to trigger next batch:', e));
  }

  return NextResponse.json({ cursor: newCursor, totalFiles, done: isDone });
}
