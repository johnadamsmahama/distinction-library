// lib/trusted-upload/extract-material-metadata.ts

import JSZip from 'jszip';
// @ts-ignore -- pdf-parse doesn't ship type declarations for this subpath.
// Same import used in extract-pdf-metadata.ts — the top-level 'pdf-parse'
// entry point has a known issue loading a debug test file on import in
// some serverless environments; this subpath avoids it.
import pdfParse from 'pdf-parse/lib/pdf-parse.js';

export interface ExtractedMaterialMetadata {
  weekNumber: number | null;
  weekSource: 'slide_content' | 'pdf_content' | null;
  rawTextSnippet: string;
}

const MAX_PAGES_TO_PARSE = 2; // most week/unit labels sit on slide/page 1, some on 2

/**
 * Matches "Week 5", "Wk5", "W-5", "Unit 5", "Lecture 5", "Lec 5", "Topic 5",
 * case-insensitive, with an optional separator between the label and the
 * number. Kept in sync manually with extractWeekNumber in parse-filename.ts
 * — that one runs on filenames, this one runs on extracted file content.
 */
const WEEK_RE = /\b(?:week|wk|w|unit|lecture|lec|topic)[\s_-]?(\d{1,2})\b/i;

function findWeekNumber(text: string): number | null {
  const match = text.match(WEEK_RE);
  if (!match) return null;
  const week = parseInt(match[1], 10);
  return week >= 1 && week <= 20 ? week : null;
}

/**
 * Reads the plain text out of a single PPTX slide XML part
 * (ppt/slides/slideN.xml) by keeping only the content inside <a:t> runs,
 * which is where PowerPoint stores visible on-slide text.
 */
function extractTextFromSlideXml(xml: string): string {
  const re = /<a:t>([\s\S]*?)<\/a:t>/g;
  const parts: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = re.exec(xml)) !== null) {
    parts.push(match[1]);
  }
  return parts.join(' ');
}

/**
 * Extracts a week/unit number from a .pptx file's first two slides. Most
 * UPSA lecturers put the week/unit label on the title slide (slide 1), but
 * some put it on slide 2 instead (e.g. a separate "agenda" or "topic"
 * slide right after a generic title slide) — so slide 1 is checked first,
 * and only if that finds nothing do we check slide 2. PPTX files are just
 * zip archives internally — no separate parsing library needed, JSZip is
 * already a dependency (used in the trusted-upload process route and
 * bulk-upload route to read the batch zip itself).
 */
async function extractFromPptx(buffer: Buffer): Promise<ExtractedMaterialMetadata> {
  try {
    const zip = await JSZip.loadAsync(buffer);
    let firstSlideSnippet = '';

    for (const slidePath of ['ppt/slides/slide1.xml', 'ppt/slides/slide2.xml']) {
      const slideFile = zip.file(slidePath);
      if (!slideFile) continue;

      const xml = await slideFile.async('string');
      const text = extractTextFromSlideXml(xml).replace(/\s+/g, ' ').trim();
      const weekNumber = findWeekNumber(text);

      if (weekNumber !== null) {
        return { weekNumber, weekSource: 'slide_content', rawTextSnippet: text.slice(0, 800) };
      }

      // Keep slide 1's text as the snippet even if it didn't match, in
      // case slide 2 doesn't exist or also comes up empty — still useful
      // context for a human reviewing a needs_metadata file.
      if (slidePath === 'ppt/slides/slide1.xml' && text) {
        firstSlideSnippet = text.slice(0, 800);
      }
    }

    return { weekNumber: null, weekSource: null, rawTextSnippet: firstSlideSnippet };
  } catch {
    // Corrupt/unreadable pptx — return all-null, caller falls back to
    // filename parsing. Never throws, never blocks the batch.
    return { weekNumber: null, weekSource: null, rawTextSnippet: '' };
  }
}

/**
 * Extracts a week/unit number from a PDF's first page text, mirroring the
 * approach in extract-pdf-metadata.ts for past papers.
 */
async function extractFromPdf(buffer: Buffer): Promise<ExtractedMaterialMetadata> {
  try {
    const parsed = await pdfParse(buffer, { max: MAX_PAGES_TO_PARSE });
    const text = (parsed.text || '').replace(/\s+/g, ' ').trim();
    const weekNumber = findWeekNumber(text);
    return {
      weekNumber,
      weekSource: weekNumber !== null ? 'pdf_content' : null,
      rawTextSnippet: text.slice(0, 800),
    };
  } catch {
    return { weekNumber: null, weekSource: null, rawTextSnippet: '' };
  }
}

/**
 * Extracts study-material metadata (currently just the week/unit number)
 * from the file's actual content, so admins don't have to rename every
 * file before a Trusted Upload batch. Filename parsing remains a fallback
 * when content extraction can't determine a week — see process-entry.ts.
 *
 * Supports both formats UPSA lecturers actually use for slides:
 *   - .pptx — checks slide 1, then slide 2 if slide 1 has no match
 *   - .pdf  — checks the first 2 pages
 * Most week/unit labels sit on the very first slide/page, but some
 * courses put them one slide/page later, so both are checked before
 * falling back to the filename.
 *
 * Other file types (doc, docx, etc.) return all-null here and fall
 * straight to filename parsing in the caller.
 */
export async function extractStudyMaterialMetadata(
  buffer: Buffer,
  extension: string
): Promise<ExtractedMaterialMetadata> {
  const ext = extension.toLowerCase();
  if (ext === 'pptx') return extractFromPptx(buffer);
  if (ext === 'pdf') return extractFromPdf(buffer);
  return { weekNumber: null, weekSource: null, rawTextSnippet: '' };
}
