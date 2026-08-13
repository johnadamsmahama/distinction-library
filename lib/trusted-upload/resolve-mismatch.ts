// lib/trusted-upload/resolve-mismatch.ts

import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Flag resolution, option 1: confirm this code as a permanent alias of the
 * selected course. Every future file with this exact code + course pairing
 * will resolve silently from now on — this only ever needs confirming once.
 */
export async function confirmAsAlias(
  supabase: SupabaseClient,
  aliasCode: string,
  courseId: string,
  adminUserId: string
) {
  const { error } = await supabase
    .from('course_code_aliases')
    .insert({ alias_code: aliasCode, course_id: courseId, added_by: adminUserId });

  // 23505 = unique constraint violation — someone already saved this exact
  // alias. Harmless, not worth failing the batch over.
  if (error && error.code !== '23505') {
    throw error;
  }
}

/**
 * Flag resolution, option 2: search for a genuinely different course to
 * reassign a single file to (e.g. BLAW105/106 vs BLAW203/204 — real,
 * separate courses that share a similar name, not the same course renamed).
 * Deliberately includes inactive courses, so level 200-400 backlog files
 * can be filed correctly even while those levels are hidden on the site.
 */
export async function searchCoursesForReassignment(
  supabase: SupabaseClient,
  query: string
) {
  const q = query.trim();
  if (!q) return [];

  const { data, error } = await supabase
    .from('courses')
    .select('id, code, name, level, is_active')
    .or(`code.ilike.%${q}%,name.ilike.%${q}%`)
    .order('code')
    .limit(20);

  if (error) throw error;
  return data;
}

// Flag resolution, option 3 ("skip this file") needs no DB call — the API
// route simply excludes that file from the insert batch. No function needed
// here for it.
