// lib/trusted-upload/multi-course.ts
//
// Helpers for "many courses in one zip" Trusted Upload batches. The zip holds
// one folder per course, named with the course code (e.g. "BASC102/paper.pdf").

import { SupabaseClient } from '@supabase/supabase-js';

export type CourseRef = { id: string; code: string };

export function normalizeCode(code: string): string {
  return code.toUpperCase().replace(/\s+/g, '');
}

/**
 * Loads every course as a code -> course map. Paged because the database
 * API returns at most 1000 rows per request.
 */
export async function loadCourseMap(admin: SupabaseClient): Promise<Map<string, CourseRef>> {
  const map = new Map<string, CourseRef>();
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await admin
      .from('courses')
      .select('id, code')
      .order('code')
      .range(from, from + pageSize - 1);
    if (error) throw new Error(`Could not load the course list: ${error.message}`);
    for (const c of data ?? []) map.set(normalizeCode(c.code), { id: c.id, code: c.code });
    if (!data || data.length < pageSize) break;
  }
  return map;
}

/**
 * Finds the course for a zip entry by looking at its folder names, from the
 * outermost folder inward, and returning the first one that matches a course
 * code. Returns null when no folder in the path is a known course.
 */
export function findCourseInPath(
  entryName: string,
  courseByCode: Map<string, CourseRef>
): CourseRef | null {
  const parts = entryName.split('/');
  parts.pop(); // drop the file name itself
  for (const folder of parts) {
    const course = courseByCode.get(normalizeCode(folder));
    if (course) return course;
  }
  return null;
}
