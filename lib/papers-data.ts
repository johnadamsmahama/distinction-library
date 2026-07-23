import type { SupabaseClient } from '@supabase/supabase-js';

export type CourseOption = {
  id: string;
  code: string;
  name: string;
  department: string;
  level: string;
};

export async function getCourseOptions(supabase: SupabaseClient): Promise<CourseOption[]> {
  const { data } = await supabase
    .from('courses')
    .select('id, code, name, department, level')
    .order('code', { ascending: true });
  return data ?? [];
}

export async function getDepartmentOptions(courses: CourseOption[]): Promise<string[]> {
  return Array.from(new Set(courses.map((c) => c.department))).sort();
}
