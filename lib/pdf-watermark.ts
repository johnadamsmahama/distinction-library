// lib/pdf-watermark.ts
//
// Extracted from app/api/moderation/approve-paper/[id]/route.ts so the exact
// same stamp (gold diagonal + footer credit) can be reused by Trusted Upload
// without touching the existing, working moderation route. approve-paper.ts
// is NOT modified — it can be migrated to call this later, separately, if
// wanted, but that's not required for this feature to work.

import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';

export interface WatermarkResult {
  bytes: Uint8Array;
  extension: string;
  watermarked: boolean; // false if the PDF was malformed and couldn't be stamped
}

/**
 * Stamps every page of a PDF with the same diagonal gold watermark + footer
 * credit used by the moderation queue. If the PDF is malformed/encrypted and
 * can't be stamped, returns the original bytes unchanged with watermarked:
 * false — matches approve-paper's existing fallback behavior of publishing
 * unstamped rather than blocking the approval.
 */
export async function watermarkPdf(
  bytes: Uint8Array,
  courseCode: string
): Promise<WatermarkResult> {
  try {
    const pdfDoc = await PDFDocument.load(bytes);
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const stamp = 'Distinction Library — J.A. Mahama Initiative';

    for (const page of pdfDoc.getPages()) {
      const { width, height } = page.getSize();
      page.drawText(stamp, {
        x: width * 0.12,
        y: height * 0.45,
        size: 22,
        font,
        color: rgb(0.79, 0.63, 0.17), // brand gold
        opacity: 0.18,
        rotate: degrees(35),
      });
      page.drawText(`${stamp} · ${courseCode}`, {
        x: 24,
        y: 16,
        size: 7,
        font,
        color: rgb(0.4, 0.4, 0.4),
        opacity: 0.8,
      });
    }

    const outputBytes = await pdfDoc.save();
    return { bytes: outputBytes, extension: 'pdf', watermarked: true };
  } catch {
    return { bytes, extension: 'pdf', watermarked: false };
  }
}
