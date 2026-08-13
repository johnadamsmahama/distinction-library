// lib/trusted-upload/extract-pdf-metadata.ts

import pdfParse from 'pdf-parse';

export type ExamType = 'mid_semester' | 'end_of_semester';

export interface ExtractedPaperMetadata {
  year: number | null;
  yearSource: 'date_line' | 'academic_year' | null;
  examType: ExamType | null;
  examTypeConfident: boolean; // false for the unverified mid-semester pattern
  isResit: boolean;
  courseCode: string | null;
  rawTextSnippet: string; // first ~800 chars — useful for the manual review row
}

const MAX_PAGES_TO_PARSE = 1; // cover page only — keeps this fast at 50k-file scale

/**
 * Verified against real UPSA past papers:
 *   "END OF FIRST SEMESTER EXAMINATIONS 2017/2018 ACADEMIC YEAR"
 *   "END OF SECOND SEMESTER EXAMINATIONS - 2018/2019 ACADEMIC YEAR"
 *   "END OF FIRST SEMESTER IN-PERSON EXAMINATIONS - 2022/2023 ACADEMIC YEAR"
 *
 * The (?:[A-Z-]+\s+){0,3} gap allows for inserted qualifiers like
 * "IN-PERSON" or "VIRTUAL" between SEMESTER and EXAMINATIONS, confirmed
 * present in real post-2022 papers.
 */
const END_OF_SEMESTER_RE =
  /END\s+OF\s+(FIRST|SECOND)\s+SEMESTER\s+(?:[A-Z-]+\s+){0,3}EXAMINATIONS?[\s\S]{0,40}?(\d{4})\s*\/\s*(\d{4})/i;

/**
 * UNVERIFIED — no confirmed mid-semester sample exists despite checking 40+
 * real papers. This is a best-effort guess at likely UPSA phrasing, given
 * the same IN-PERSON/VIRTUAL qualifier pattern seen in end-of-semester papers.
 * examTypeConfident is deliberately false whenever this matches. Per Rb:
 * if a real mid-sem paper slips into the end-of-semester bucket instead
 * because this doesn't match, that's an acceptable outcome, not a blocker.
 */
const MID_SEMESTER_RE =
  /MID[\s-]?SEMESTER\s+(?:[A-Z-]+\s+){0,3}EXAMINATIONS?[\s\S]{0,40}?(\d{4})\s*\/\s*(\d{4})/i;

/** Most reliable single source for the real calendar year — the explicit exam date line. */
const DATE_LINE_RE = /DATE[.:]?[\s\S]{0,40}?(\d{4})/i;

/** Course code on its own line before a colon, e.g. "BGEC 105:" or "PBPS 108   :" */
const COURSE_CODE_RE = /\b([A-Z]{3,6})\s?(\d{2,4})\s*[:\-]/;

const RESIT_RE = /RESIT/i;

function normalizeCourseCode(letters: string, digits: string): string {
  return `${letters.toUpperCase()}${digits}`;
}

export async function extractPastPaperMetadata(
  fileBuffer: Buffer
): Promise<ExtractedPaperMetadata> {
  let text = '';

  try {
    const parsed = await pdfParse(fileBuffer, { max: MAX_PAGES_TO_PARSE });
    text = parsed.text || '';
  } catch {
    // Scanned image / corrupt / unreadable PDF — return all-nulls,
    // this file falls to manual review, never throws, never blocks the batch.
    return {
      year: null,
      yearSource: null,
      examType: null,
      examTypeConfident: false,
      isResit: false,
      courseCode: null,
      rawTextSnippet: '',
    };
  }

  const normalizedText = text.replace(/\s+/g, ' ').trim();

  // If pdf-parse succeeded but returned no meaningful text (e.g. a scanned
  // image PDF with no text layer at all — confirmed real case, Aug 2026),
  // every regex below will simply fail to match and we fall through to the
  // same all-null / manual-review outcome. No special-casing needed.

  // --- exam type + academic year range ---
  let examType: ExamType | null = null;
  let examTypeConfident = false;
  let academicYearStart: number | null = null;
  let academicYearEnd: number | null = null;

  const endMatch = normalizedText.match(END_OF_SEMESTER_RE);
  if (endMatch) {
    examType = 'end_of_semester';
    examTypeConfident = true;
    academicYearStart = parseInt(endMatch[2], 10);
    academicYearEnd = parseInt(endMatch[3], 10);
  } else {
    const midMatch = normalizedText.match(MID_SEMESTER_RE);
    if (midMatch) {
      examType = 'mid_semester';
      examTypeConfident = false;
      academicYearStart = parseInt(midMatch[1], 10);
      academicYearEnd = parseInt(midMatch[2], 10);
    }
  }

  // --- year: prefer the explicit date line over inferring from academic year ---
  let year: number | null = null;
  let yearSource: ExtractedPaperMetadata['yearSource'] = null;

  const dateMatch = normalizedText.match(DATE_LINE_RE);
  if (dateMatch) {
    year = parseInt(dateMatch[1], 10);
    yearSource = 'date_line';
  } else if (academicYearStart && academicYearEnd) {
    // First-semester exams sit in the first calendar year of the academic
    // year range (e.g. Dec 2017 for "2017/2018"); second-semester exams
    // sit in the second (e.g. June 2019 for "2018/2019").
    const isFirstSemester = /FIRST\s+SEMESTER/i.test(normalizedText);
    year = isFirstSemester ? academicYearStart : academicYearEnd;
    yearSource = 'academic_year';
  }

  // --- course code ---
  let courseCode: string | null = null;
  const codeMatch = normalizedText.match(COURSE_CODE_RE);
  if (codeMatch) {
    courseCode = normalizeCourseCode(codeMatch[1], codeMatch[2]);
  }

  // --- resit flag ---
  // UPSA doesn't run separate resit exams — resit students sit alongside
  // regular students, and papers are stamped afterward to help markers sort
  // scripts. So this is an independent marker layered on top of exam_type,
  // not a third exam type. See is_resit column on past_papers.
  const isResit = RESIT_RE.test(normalizedText);

  return {
    year,
    yearSource,
    examType,
    examTypeConfident,
    isResit,
    courseCode,
    rawTextSnippet: normalizedText.slice(0, 800),
  };
}

export function isFullyExtracted(meta: ExtractedPaperMetadata): boolean {
  return meta.year !== null && meta.examType !== null;
}
