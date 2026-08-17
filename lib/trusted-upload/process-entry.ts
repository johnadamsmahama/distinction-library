// lib/trusted-upload/process-entry.ts

import crypto from 'crypto';
import { SupabaseClient } from '@supabase/supabase-js';
import { extractPastPaperMetadata, ExamType } from './extract-pdf-metadata';
import { extractStudyMaterialMetadata } from './extract-material-metadata';
import { parsePastPaperFilename, parseStudyMaterialFilename } from './parse-filename';
import { verifyCourseCode } from './verify-course-code';
import { watermarkPdf } from '../pdf-watermark';
import { JobResult } from './types';

interface ProcessPastPaperParams {
  admin: SupabaseClient;
  buffer: Buffer;
  fileHash: string;
  fileName: string;
  uploadedBy: string;
  courseId: string;
  courseCode: string;
  pathSalt: string; // unique-ish token for the storage path, e.g. `${Date.now()}-${index}`
  overrideYear?: number | null; // null = admin explicitly marked the year unknown
  overrideExamType?: ExamType;
}

/**
 * Processes one past paper file end to end: extraction → merge with
 * filename fallback → course-code verification → watermark → upload →
 * insert as approved. Returns a JobResult describing the outcome — never
 * throws for expected "needs attention" cases, only for genuine failures
 * (storage/DB errors), which the caller should catch.
 *
 * Course verification always runs against whatever courseId/courseCode is
 * passed in — whether that's the batch's original selection, a reassigned
 * course, or the original selection re-checked after a new alias was just
 * saved. This means the same function correctly handles the first pass AND
 * every resolution path, without needing a "skip verification" flag.
 *
 * Year handling: Trusted Upload files are already manually sorted and
 * confirmed by course, so an unresolved year should never block
 * publishing. If extraction and filename parsing both come up empty, the
 * paper still publishes with year: null ("unknown") rather than stopping
 * for needs_metadata — the admin can still see this in the result note and
 * correct it later if they want. An explicit overrideYear from the manual
 * "Fill in Details" flow always wins, including explicit null.
 *
 * Exam type handling: same philosophy — an unresolved exam type now
 * defaults to 'end_of_semester' instead of blocking the batch. An explicit
 * overrideExamType always wins.
 */
export async function processPastPaperEntry(
  params: ProcessPastPaperParams
): Promise<JobResult> {
  const { admin, buffer, fileHash, fileName, uploadedBy, courseId, courseCode, pathSalt } = params;
  const isPdf = fileName.toLowerCase().endsWith('.pdf');

  const filenameParsed = parsePastPaperFilename(fileName).parsed;
  const extracted = isPdf ? await extractPastPaperMetadata(buffer) : null;

  const yearOverrideProvided = params.overrideYear !== undefined;
  const year: number | null = yearOverrideProvided
    ? (params.overrideYear as number | null)
    : (extracted?.year ?? filenameParsed.year); // null here just means "unknown" — no longer a blocker
  const examType: ExamType =
    params.overrideExamType ?? extracted?.examType ?? filenameParsed.examType ?? 'end_of_semester';

  const verification = await verifyCourseCode(admin, extracted?.courseCode ?? null, {
    id: courseId,
    code: courseCode,
  });

  if (verification.status === 'mismatch') {
    return {
      filename: fileName,
      status: 'needs_course_review',
      note: `Cover page shows course code "${verification.extractedCode}", which doesn't match the selected course (${courseCode}) and isn't a known alias.`,
      extractedCode: verification.extractedCode,
    };
  }

  const isResit = extracted?.isResit ?? false;
  const paperId = crypto.randomUUID();

  // Supabase storage-js defaults to 'text/plain;charset=UTF-8' — or worse,
  // the literal string "undefined" — when contentType is missing/undefined.
  // Both get rejected outright now that past-papers has mime restrictions.
  // Determine the real type from the extension rather than assuming every
  // file here is a PDF — this path is meant for exam papers, but should
  // fail cleanly with a real error rather than a header-format crash if a
  // non-PDF ever ends up routed through it.
  const rawExt = fileName.toLowerCase().split('.').pop() ?? 'pdf';
  const RAW_MIME_BY_EXT: Record<string, string> = {
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  };
  const rawMimeType = RAW_MIME_BY_EXT[rawExt] ?? 'application/octet-stream';

  const rawPath = `${uploadedBy}/${courseId}/${pathSalt}.${rawExt}`;
  const { error: rawUploadErr } = await admin.storage
    .from('past-papers')
    .upload(rawPath, buffer, { contentType: rawMimeType });
  if (rawUploadErr) throw new Error(rawUploadErr.message);

  const watermark = isPdf
    ? await watermarkPdf(new Uint8Array(buffer), courseCode)
    : { bytes: new Uint8Array(buffer), extension: 'pdf', watermarked: false };

  // Storage paths still need a real folder name even when the year is
  // unknown in the database — "unknown" is just a filing label here, not
  // stored in past_papers.year.
  const yearFolder = year ?? 'unknown';
  const finalPath = `${courseId}/${yearFolder}/${paperId}.${watermark.extension}`;
  const { error: finalUploadErr } = await admin.storage
    .from('past-papers-final')
    .upload(finalPath, watermark.bytes, { contentType: 'application/pdf', upsert: true });
  if (finalUploadErr) throw new Error(finalUploadErr.message);

  const { data: publicUrlData } = admin.storage.from('past-papers-final').getPublicUrl(finalPath);

  const { error: insertErr } = await admin.from('past_papers').insert({
    id: paperId,
    course_id: courseId,
    year, // null is allowed now — means "unknown"
    exam_type: examType,
    is_resit: isResit,
    file_url: rawPath,
    watermarked_url: publicUrlData.publicUrl,
    file_hash: fileHash,
    uploaded_by: uploadedBy,
    status: 'approved',
    reviewed_by: uploadedBy,
    reviewed_at: new Date().toISOString(),
  });
  if (insertErr) throw new Error(insertErr.message);

  return {
    filename: fileName,
    status: 'approved',
    note: `Published under ${courseCode}${
      verification.status === 'match_via_alias' ? ` (matched via known alias ${verification.aliasCode})` : ''
    } — ${examType.replace('_', ' ')}, ${year ?? 'year unknown'}${isResit ? ', resit' : ''}.${
      !watermark.watermarked ? ' Note: watermarking failed, published unstamped.' : ''
    }`,
  };
}

interface ProcessStudyMaterialParams {
  admin: SupabaseClient;
  buffer: Buffer;
  fileHash: string;
  fileName: string;
  uploadedBy: string;
  courseId: string;
  courseCode: string;
  pathSalt: string;
  overrideWeekNumber?: number;
}

/**
 * Study materials skip course-code verification entirely — no formal
 * cover page to trust in the same way past papers have, so there's no
 * independent signal to cross-check against the selected course. Be
 * deliberate about the course selected in the upload form — a wrong
 * selection here publishes silently under the wrong course.
 *
 * Week/unit number resolution, in priority order:
 *   1. overrideWeekNumber — explicit value from the manual "Fill in
 *      Details" resolve flow. Always wins.
 *   2. Content extraction — reads the actual first slide (.pptx) or first
 *      page (.pdf) text and looks for a week/unit/lecture/topic number.
 *      This is the primary source, same philosophy as past-paper cover
 *      page extraction: file content is more reliable than filenames.
 *   3. Filename parsing — fallback when content extraction finds nothing
 *      (unsupported file type, no matching text, extraction failure).
 * If none of the three resolve a week number, the file needs manual
 * metadata entry rather than blocking the whole batch.
 */
export async function processStudyMaterialEntry(
  params: ProcessStudyMaterialParams
): Promise<JobResult> {
  const { admin, buffer, fileHash, fileName, uploadedBy, courseId, courseCode, pathSalt } = params;

  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';

  let weekNumber: number | null = params.overrideWeekNumber ?? null;
  let weekSource: 'override' | 'slide_content' | 'pdf_content' | 'filename' | null =
    params.overrideWeekNumber !== undefined ? 'override' : null;

  if (weekNumber === null) {
    const contentResult = await extractStudyMaterialMetadata(buffer, ext);
    if (contentResult.weekNumber !== null) {
      weekNumber = contentResult.weekNumber;
      weekSource = contentResult.weekSource;
    } else {
      const filenameWeek = parseStudyMaterialFilename(fileName).parsed.weekNumber;
      if (filenameWeek !== null) {
        weekNumber = filenameWeek;
        weekSource = 'filename';
      }
    }
  }

  if (weekNumber === null) {
    return {
      filename: fileName,
      status: 'needs_metadata',
      note: 'Could not determine a week number from the file content or filename.',
    };
  }

  const materialContentType = ext === 'pptx' ? 'lecture_slides' : 'study_notes';
  const title = fileName.replace(/\.[^.]+$/, '').replace(/[_\-]+/g, ' ').trim().toUpperCase();

  // Supabase storage-js defaults to 'text/plain;charset=UTF-8' when no
  // contentType is passed to .upload() — this was silently wrong for every
  // file here until the study-materials bucket got mime-type restrictions,
  // at which point it started rejecting every upload outright. Map the
  // extension to its real mime type instead of relying on the default.
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
  const mimeType = MIME_BY_EXT[ext] ?? 'application/octet-stream';

  const path = `${uploadedBy}/${courseId}/${pathSalt}.${ext}`;
  const { error: uploadErr } = await admin.storage
    .from('study-materials')
    .upload(path, buffer, { contentType: mimeType });
  if (uploadErr) throw new Error(uploadErr.message);

  const { data: publicUrlData } = admin.storage.from('study-materials').getPublicUrl(path);

  const { error: insertErr } = await admin.from('study_materials').insert({
    course_id: courseId,
    title,
    content_type: materialContentType,
    week_number: weekNumber,
    file_url: publicUrlData.publicUrl,
    file_hash: fileHash,
    uploaded_by: uploadedBy,
    status: 'approved',
    reviewed_at: new Date().toISOString(),
  });
  if (insertErr) throw new Error(insertErr.message);

  const sourceNote =
    weekSource === 'slide_content'
      ? ' (detected from slide content)'
      : weekSource === 'pdf_content'
      ? ' (detected from document content)'
      : weekSource === 'filename'
      ? ' (detected from filename)'
      : '';

  return {
    filename: fileName,
    status: 'approved',
    note: `Published under ${courseCode}, week ${weekNumber}${sourceNote}.`,
  };
}
