// lib/trusted-upload/verify-course-code.ts

import { SupabaseClient } from '@supabase/supabase-js';

export type CourseCodeVerification =
  | { status: 'no_code_found' }                        // nothing to check against — proceeds under selected course
  | { status: 'match' }                                 // extracted code agrees with selected course
  | { status: 'match_via_alias'; aliasCode: string }    // resolved via a known legacy code
  | { status: 'mismatch'; extractedCode: string };      // real disagreement — needs manual resolution

function normalizeCode(code: string): string {
  return code.toUpperCase().replace(/\s+/g, '');
}

/**
 * Checks an extracted course code against the course the admin selected for
 * this batch. Critical principle: the admin's selection ALWAYS wins by
 * default — this function only ever flags a possible mismatch for review,
 * it never overrides what was selected.
 */
export async function verifyCourseCode(
  supabase: SupabaseClient,
  extractedCode: string | null,
  selectedCourse: { id: string; code: string }
): Promise<CourseCodeVerification> {
  if (!extractedCode) {
    // Extraction just didn't find a code on the page — not evidence of
    // anything wrong. Proceeds under the selected course, unflagged.
    return { status: 'no_code_found' };
  }

  const normalizedExtracted = normalizeCode(extractedCode);
  const normalizedSelected = normalizeCode(selectedCourse.code);

  if (normalizedExtracted === normalizedSelected) {
    return { status: 'match' };
  }

  const { data, error } = await supabase
    .from('course_code_aliases')
    .select('alias_code')
    .eq('alias_code', normalizedExtracted)
    .eq('course_id', selectedCourse.id)
    .maybeSingle();

  if (error) {
    // Fail safe on a lookup error: flag for manual review rather than
    // silently trusting an alias we couldn't actually confirm.
    return { status: 'mismatch', extractedCode: normalizedExtracted };
  }

  if (data) {
    return { status: 'match_via_alias', aliasCode: data.alias_code };
  }

  return { status: 'mismatch', extractedCode: normalizedExtracted };
}
