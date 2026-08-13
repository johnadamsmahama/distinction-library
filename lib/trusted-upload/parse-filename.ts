// lib/trusted-upload/parse-filename.ts

export type ExamType = 'mid_semester' | 'end_of_semester';

export interface ParsedPaperMetadata {
  year: number | null;
  examType: ExamType | null;
}

export interface ParsedMaterialMetadata {
  weekNumber: number | null;
}

export interface ParseFilenameResult<T> {
  originalFilename: string;
  extension: string;
  parsed: T;
  /** true if every required field for this upload type was confidently parsed */
  fullyParsed: boolean;
}

/**
 * Pulls the file extension off a filename. Returns '' if there isn't one.
 */
function getExtension(filename: string): string {
  const dot = filename.lastIndexOf('.');
  if (dot <= 0 || dot === filename.length - 1) return '';
  return filename.slice(dot + 1).toLowerCase();
}

/**
 * Looks for a plausible 4-digit academic year (2000-2099) anywhere in the filename.
 * Picks the first match. Deliberately conservative to avoid false positives
 * from things like a 4-digit course number.
 */
function extractYear(filename: string): number | null {
  const match = filename.match(/\b(20\d{2})\b/);
  if (!match) return null;
  const year = parseInt(match[1], 10);
  return year >= 2000 && year <= 2099 ? year : null;
}

/**
 * Looks for exam-type signal words anywhere in the filename (case-insensitive,
 * ignores separators like _ - space). Maps loosely-written variants onto the
 * two real enum values: 'mid_semester' | 'end_of_semester'.
 *
 * Note: real-world testing (Aug 2026, BGEC106 folder) showed filenames
 * almost never carry this info reliably — 0/10 real filenames fully parsed.
 * This function is kept as a cheap first pass / fallback, not the primary
 * metadata source for past papers. See extract-pdf-metadata.ts for that.
 */
function extractExamType(filename: string): ExamType | null {
  const normalized = filename.toLowerCase().replace(/[_\-\s]/g, '');

  const midPatterns = ['midsem', 'midsemester', 'mid'];
  const endPatterns = ['endsem', 'endofsem', 'endsemester', 'end', 'final', 'finals'];

  for (const p of midPatterns) {
    if (normalized.includes(p)) return 'mid_semester';
  }
  for (const p of endPatterns) {
    if (normalized.includes(p)) return 'end_of_semester';
  }
  return null;
}

/**
 * Looks for a week number: "WEEK3", "WK3", "W3", "WEEK_3", "WEEK 3", etc.
 * Returns null if nothing matches or the number is out of a sane range (1-20).
 */
function extractWeekNumber(filename: string): number | null {
  const match = filename.match(/\b(?:week|wk|w)[\s_-]?(\d{1,2})\b/i);
  if (!match) return null;
  const week = parseInt(match[1], 10);
  return week >= 1 && week <= 20 ? week : null;
}

export function parsePastPaperFilename(
  filename: string
): ParseFilenameResult<ParsedPaperMetadata> {
  const year = extractYear(filename);
  const examType = extractExamType(filename);

  return {
    originalFilename: filename,
    extension: getExtension(filename),
    parsed: { year, examType },
    fullyParsed: year !== null && examType !== null,
  };
}

export function parseStudyMaterialFilename(
  filename: string
): ParseFilenameResult<ParsedMaterialMetadata> {
  const weekNumber = extractWeekNumber(filename);

  return {
    originalFilename: filename,
    extension: getExtension(filename),
    parsed: { weekNumber },
    fullyParsed: weekNumber !== null,
  };
}
