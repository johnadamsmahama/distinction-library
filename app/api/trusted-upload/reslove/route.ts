// app/api/trusted-upload/resolve/route.ts
//
// Resolves a single flagged file from a Trusted Upload batch. The zip stays
// in the 'trusted-uploads' bucket for the lifetime of the job, so resolving
// a flagged file means re-opening that same zip and re-locating the entry —
// no separate storage of individual flagged files is needed.

import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentProfile, isAdminRole } from '@/lib/auth-helpers';
import { createClient } from '@/lib/supabase/server';
import { processPastPaperEntry, processStudyMaterialEntry } from '@/lib/trusted-upload/process-entry';
import { confirmAsAlias } from '@/lib/trusted-upload/resolve-mismatch';
import { JobResult, TrustedUploadConfig } from '@/lib/trusted-upload/types';

type ResolveAction = 'confirm_alias' | 'reassign' | 'provide_metadata' | 'skip';

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
  const {
    jobId,
    filename,
    action,
    extractedCode,
    newCourseId,
    newCourseCode,
    year,
    examType,
    weekNumber,
  }: {
    jobId?: string;
    filename?: string;
    action?: ResolveAction;
    extractedCode?: string;
    newCourseId?: string;
    newCourseCode?: string;
    year?: number;
    examType?: 'mid_semester' | 'end_of_semester';
    weekNumber?: number;
  } = body;

  if (!jobId || !filename || !action) {
    return NextResponse.json({ error: 'jobId, filename, and action are required' }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: job, error: jobErr } = await admin
    .from('bulk_upload_jobs')
    .select('id, uploaded_by, zip_path, results, job_type, trusted_upload_config')
    .eq('id', jobId)
    .eq('job_type', 'trusted')
    .single();

  if (jobErr || !job) {
    return NextResponse.json({ error: 'Trusted upload job not found' }, { status: 404 });
  }

  const config = job.trusted_upload_config as TrustedUploadConfig | null;
  if (!config?.courseId || !config?.courseCode || !config?.uploadType) {
    return NextResponse.json({ error: 'Job is missing trusted_upload_config' }, { status: 500 });
  }

  const results = job.results as JobResult[];
  const existingIndex = results.findIndex((r) => r.filename === filename);
  if (existingIndex === -1) {
    return NextResponse.json({ error: 'No such file in this job.' }, { status: 404 });
  }
  const existing = results[existingIndex];
  if (existing.status !== 'needs_metadata' && existing.status !== 'needs_course_review') {
    return NextResponse.json({ error: `This file is already resolved (${existing.status}).` }, { status: 409 });
  }

  let newResult: JobResult;

  if (action === 'skip') {
    newResult = { filename, status: 'skipped_manual', note: 'Skipped by admin.' };
  } else {
    // Every other action needs the actual file bytes again.
    const { data: zipBlob, error: downloadErr } = await admin.storage
      .from('trusted-uploads')
      .download(job.zip_path);
    if (downloadErr || !zipBlob) {
      return NextResponse.json({ error: 'Could not re-open the original zip.' }, { status: 500 });
    }

    const zip = await JSZip.loadAsync(await zipBlob.arrayBuffer());
    const entry = Object.values(zip.files).find(
      (f) => !f.dir && (f.name.split('/').pop() ?? f.name) === filename
    );
    if (!entry) {
      return NextResponse.json({ error: 'File no longer found in the zip.' }, { status: 404 });
    }

    const buffer = Buffer.from(await entry.async('arraybuffer'));
    const fileHash = hashBuffer(buffer);
    const pathSalt = `${Date.now()}-resolve`;

    try {
      if (action === 'confirm_alias') {
        if (!extractedCode) {
          return NextResponse.json({ error: 'extractedCode is required for confirm_alias' }, { status: 400 });
        }
        await confirmAsAlias(admin, extractedCode, config.courseId, user.id);
        // Re-run normally — the alias just saved makes this resolve as
        // match_via_alias on this pass, no special-casing needed.
        newResult = await processPastPaperEntry({
          admin, buffer, fileHash, fileName: filename,
          uploadedBy: job.uploaded_by, courseId: config.courseId, courseCode: config.courseCode, pathSalt,
        });
      } else if (action === 'reassign') {
        if (!newCourseId || !newCourseCode) {
          return NextResponse.json({ error: 'newCourseId and newCourseCode are required for reassign' }, { status: 400 });
        }
        newResult = await processPastPaperEntry({
          admin, buffer, fileHash, fileName: filename,
          uploadedBy: job.uploaded_by, courseId: newCourseId, courseCode: newCourseCode, pathSalt,
        });
      } else if (action === 'provide_metadata') {
        if (config.uploadType === 'past_paper') {
          if (!year || !examType) {
            return NextResponse.json({ error: 'year and examType are required for this file' }, { status: 400 });
          }
          newResult = await processPastPaperEntry({
            admin, buffer, fileHash, fileName: filename,
            uploadedBy: job.uploaded_by, courseId: config.courseId, courseCode: config.courseCode, pathSalt,
            overrideYear: year, overrideExamType: examType,
          });
        } else {
          if (!weekNumber) {
            return NextResponse.json({ error: 'weekNumber is required for this file' }, { status: 400 });
          }
          newResult = await processStudyMaterialEntry({
            admin, buffer, fileHash, fileName: filename,
            uploadedBy: job.uploaded_by, courseId: config.courseId, courseCode: config.courseCode, pathSalt,
            overrideWeekNumber: weekNumber,
          });
        }
      } else {
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
      }
    } catch (e: any) {
      newResult = { filename, status: 'error', note: e?.message ?? 'Failed to process this file.' };
    }
  }

  const updatedResults = [...results];
  updatedResults[existingIndex] = newResult;

  await admin.from('bulk_upload_jobs').update({ results: updatedResults }).eq('id', jobId);

  return NextResponse.json({ result: newResult });
}
