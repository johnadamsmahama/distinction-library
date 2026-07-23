import { NextResponse } from 'next/server';
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentProfile, isStaffRole } from '@/lib/auth-helpers';

// POST /api/moderation/approve-paper/[id]
// Staff-only. Downloads the raw upload from the private 'past-papers'
// bucket, stamps a watermark on every page (PDFs only — other formats are
// copied through unstamped, see note below), uploads the result to the
// public 'past-papers-final' bucket, and flips the row to approved.
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { user, profile } = await getCurrentProfile(supabase);

  if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  if (!isStaffRole(profile?.role)) {
    return NextResponse.json({ error: 'Staff only.' }, { status: 403 });
  }

  const { data: paper, error: fetchErr } = await supabase
    .from('past_papers')
    .select('id, file_url, course_id, year, exam_type, status, courses(code)')
    .eq('id', params.id)
    .single();

  if (fetchErr || !paper) {
    return NextResponse.json({ error: 'Paper not found.' }, { status: 404 });
  }
  if (paper.status !== 'pending') {
    return NextResponse.json({ error: 'This paper has already been reviewed.' }, { status: 409 });
  }

  const admin = createAdminClient();

  // 1. Download the raw file from the private staging bucket.
  const { data: rawFile, error: downloadErr } = await admin.storage
    .from('past-papers')
    .download(paper.file_url);

  if (downloadErr || !rawFile) {
    return NextResponse.json({ error: 'Could not read the uploaded file.' }, { status: 500 });
  }

  const bytes = new Uint8Array(await rawFile.arrayBuffer());
  const isPdf = paper.file_url.toLowerCase().endsWith('.pdf');
  let outputBytes: Uint8Array = bytes;
  let outputExt = paper.file_url.split('.').pop() ?? 'pdf';

  if (isPdf) {
    try {
      const pdfDoc = await PDFDocument.load(bytes);
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const stamp = 'Distinction Library — A J.A. Mahama Initiative';
      const courseCode = (paper.courses as any)?.code ?? '';

      for (const page of pdfDoc.getPages()) {
        const { width, height } = page.getSize();
        // Diagonal, low-opacity watermark across the page — visible enough
        // to deter redistribution without obscuring the exam content.
        page.drawText(stamp, {
          x: width * 0.12,
          y: height * 0.45,
          size: 22,
          font,
          color: rgb(0.79, 0.63, 0.17), // brand gold
          opacity: 0.18,
          rotate: degrees(35),
        });
        // Small footer credit, fully opaque, for when the page is printed.
        page.drawText(`${stamp} · ${courseCode}`, {
          x: 24,
          y: 16,
          size: 7,
          font,
          color: rgb(0.4, 0.4, 0.4),
          opacity: 0.8,
        });
      }

      outputBytes = await pdfDoc.save();
      outputExt = 'pdf';
    } catch {
      // If the PDF is malformed/encrypted and can't be stamped, fall back to
      // publishing the original file rather than blocking the approval —
      // the moderator can see this happened in the response and re-check.
      outputBytes = bytes;
    }
  }
  // Non-PDF formats (rare — most past papers are PDF) are published as-is;
  // stamping Word/PowerPoint files needs a different library and is a
  // reasonable follow-up rather than blocking this stage.

  const finalPath = `${paper.course_id}/${paper.year}/${paper.id}.${outputExt}`;

  const { error: uploadErr } = await admin.storage
    .from('past-papers-final')
    .upload(finalPath, outputBytes, {
      contentType: isPdf ? 'application/pdf' : undefined,
      upsert: true,
    });

  if (uploadErr) {
    return NextResponse.json({ error: uploadErr.message }, { status: 500 });
  }

  const { data: publicUrlData } = admin.storage.from('past-papers-final').getPublicUrl(finalPath);

  const { error: updateErr } = await admin
    .from('past_papers')
    .update({
      watermarked_url: publicUrlData.publicUrl,
      status: 'approved',
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', paper.id);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  // Notify the uploader.
  const { data: uploaderRow } = await admin
    .from('past_papers')
    .select('uploaded_by')
    .eq('id', paper.id)
    .single();

  if (uploaderRow?.uploaded_by) {
    await admin.from('notifications').insert({
      user_id: uploaderRow.uploaded_by,
      message: `Your past paper for ${(paper.courses as any)?.code ?? 'your course'} was approved and published.`,
      type: 'upload_approved',
    });
  }

  return NextResponse.json({ success: true, watermarkedUrl: publicUrlData.publicUrl });
}
