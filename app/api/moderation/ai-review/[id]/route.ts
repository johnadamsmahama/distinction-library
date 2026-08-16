import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile, isStaffRole } from '@/lib/auth-helpers';
import { reviewUpload, AUTO_APPROVE_THRESHOLD } from '@/lib/ai-moderation';
// pdf-parse is already a dependency (used by the vault quiz generator).
// Imported from its internal lib path, NOT the package root — importing
// 'pdf-parse' directly triggers a debug/demo block in its index.js that
// tries to read a sample PDF from disk, which breaks Next.js's build-time
// page analysis on Vercel (ENOENT for a test fixture file).
// @ts-ignore -- pdf-parse doesn't ship type declarations for this subpath
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import { extractPptxText } from '@/lib/pptx-text';
import mammoth from 'mammoth';

// Which table + bucket a given kind lives in.
const TABLE_BY_KIND = {
  past_paper: 'past_papers',
  study_material: 'study_materials',
} as const;

const BUCKET_BY_KIND = {
  past_paper: 'past-papers',
  study_material: 'study-materials',
} as const;

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const body = await req.json().catch(() => ({}));
  const kind: 'past_paper' | 'study_material' = body.kind;

  if (kind !== 'past_paper' && kind !== 'study_material') {
    return NextResponse.json({ error: 'kind must be past_paper or study_material' }, { status: 400 });
  }

  // AUTH: this route is fire-and-forget triggered from the browser right
  // after a student's own upload (see UploadForm.tsx), so it can't be
  // staff-only — but it must not be callable by just anyone for any row.
  // We confirm the caller is logged in here, then check row ownership (or
  // staff) once the row is loaded below.
  const supabase = createClient();
  const { user, profile } = await getCurrentProfile(supabase);
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const admin = createAdminClient();
  const table = TABLE_BY_KIND[kind];
  const bucket = BUCKET_BY_KIND[kind];

  // Load the row + its course label, service-role so this works regardless
  // of who (or what background job) triggered the review.
  //
  // Split into two fully separate queries (rather than one shared query with
  // a ternary select string) — Supabase's generated types statically parse
  // the select() string, and a union of two different literal strings there
  // breaks that parsing at build time.
  type RowShape = {
    id: string;
    file_url: string;
    status: string;
    uploaded_by: string;
    year?: number | null;
    exam_type?: 'mid_semester' | 'end_of_semester' | null;
    title?: string | null;
    week_number?: number | null;
    content_type?: 'lecture_slides' | 'study_notes' | 'study_guide' | null;
    courses: { code: string; name: string } | { code: string; name: string }[] | null;
  };

  let row: RowShape | null = null;
  let rowErr: unknown = null;

  if (kind === 'past_paper') {
    const res = await admin
      .from('past_papers')
      .select('id, file_url, year, exam_type, status, uploaded_by, courses(code, name)')
      .eq('id', id)
      .single();
    row = res.data as RowShape | null;
    rowErr = res.error;
  } else {
    const res = await admin
      .from('study_materials')
      .select('id, file_url, title, week_number, content_type, status, uploaded_by, courses(code, name)')
      .eq('id', id)
      .single();
    row = res.data as RowShape | null;
    rowErr = res.error;
  }

  if (rowErr || !row) {
    return NextResponse.json({ error: 'Upload not found' }, { status: 404 });
  }

  // Only the person who uploaded this item, or staff, can trigger its review.
  if (row.uploaded_by !== user.id && !isStaffRole(profile?.role)) {
    return NextResponse.json({ error: 'Not authorized to review this upload.' }, { status: 403 });
  }

  // Don't re-review something already moderated by a human or a previous run.
  if (row.status !== 'pending') {
    return NextResponse.json({ skipped: true, reason: `status is already ${row.status}` });
  }

  // Pull the raw file from storage and try to extract text/image content.
  const filePath = row.file_url as string;
  const fileName = filePath.split('/').pop() ?? filePath;
  let extractedText: string | null = null;
  let imageBase64: string | undefined;
  let imageMediaType: 'image/jpeg' | 'image/png' | undefined;

  const { data: fileBlob, error: downloadErr } = await admin.storage.from(bucket).download(filePath);
  if (!downloadErr && fileBlob) {
    const lowerName = fileName.toLowerCase();
    const buffer = Buffer.from(await fileBlob.arrayBuffer());

    if (lowerName.endsWith('.pdf')) {
      try {
        const parsed = await pdfParse(buffer);
        extractedText = parsed.text?.trim() || null;
        // Scanned PDFs (image-only, no text layer) come back empty here.
        // We don't rasterize PDF pages to images yet — see handover notes.
      } catch (e) {
        console.error(`PDF text extraction failed for ${table}/${id}:`, e);
      }
    } else if (lowerName.endsWith('.pptx')) {
      extractedText = await extractPptxText(buffer);
    } else if (lowerName.endsWith('.docx')) {
      try {
        const result = await mammoth.extractRawText({ buffer });
        extractedText = result.value?.trim() || null;
      } catch (e) {
        console.error(`DOCX extraction failed for ${table}/${id}:`, e);
      }
    } else if (lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg') || lowerName.endsWith('.png')) {
      imageBase64 = buffer.toString('base64');
      imageMediaType = lowerName.endsWith('.png') ? 'image/png' : 'image/jpeg';
    }
    // Old binary .doc / .ppt: no extractor available yet — extractedText
    // stays null and the AI review will correctly default toward "review".
  }

  const course = Array.isArray(row.courses) ? row.courses[0] : row.courses;

  const result = await reviewUpload({
    kind,
    courseCode: course?.code ?? 'UNKNOWN',
    courseName: course?.name ?? 'Unknown course',
    imageBase64,
    imageMediaType,
    year: kind === 'past_paper' ? row.year : undefined,
    examType: kind === 'past_paper' ? row.exam_type : undefined,
    title: kind === 'study_material' ? row.title : undefined,
    weekNumber: kind === 'study_material' ? row.week_number : undefined,
    contentType: kind === 'study_material' ? row.content_type : undefined,
    fileName,
    extractedText,
  });

  const shouldAutoApprove = result.verdict === 'approve' && result.confidence >= AUTO_APPROVE_THRESHOLD;
  const aiReviewStatus = shouldAutoApprove ? 'auto_approved' : 'needs_review';

  if (kind === 'study_material') {
    // Simple case: no watermarking pipeline involved.
    await admin
      .from('study_materials')
      .update({
        ai_review_status: aiReviewStatus,
        ai_confidence: result.confidence,
        ai_review_notes: result.notes,
        ai_reviewed_at: new Date().toISOString(),
        ...(shouldAutoApprove
          ? { status: 'approved', reviewed_at: new Date().toISOString() }
          : {}),
      })
      .eq('id', id);
    // Approving here still fires the existing upload_approved notification +
    // upload_count/badge triggers from Stage 9, since those are DB-level
    // triggers on the status column, not app-level logic tied to who approved it.
  } else {
    // past_paper: only log the AI's verdict here. Auto-approval for papers is
    // intentionally NOT flipped in this route — it must go through the
    // watermarking pipeline in /api/moderation/approve-paper/[id], so as not
    // to publish an unwatermarked file. See TODO wiring in that route.
    await admin
      .from('past_papers')
      .update({
        ai_review_status: aiReviewStatus,
        ai_confidence: result.confidence,
        ai_review_notes: result.notes,
        ai_reviewed_at: new Date().toISOString(),
      })
      .eq('id', id);
  }

  return NextResponse.json({
    id,
    kind,
    verdict: result.verdict,
    confidence: result.confidence,
    notes: result.notes,
    autoApproved: shouldAutoApprove && kind === 'study_material',
  });
}
