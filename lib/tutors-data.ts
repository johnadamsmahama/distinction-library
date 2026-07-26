import type { SupabaseClient } from '@supabase/supabase-js';

export type TutorCourse = { id: string; code: string; name: string };

// Public shape — used on the landing page. Deliberately excludes contact
// fields (whatsapp_number, email) so they never reach an unauthenticated
// bundle, even though RLS would also block them for a logged-out request.
export type FeaturedTutor = {
  id: string;
  full_name: string;
  photo_url: string | null;
  department: string;
  level: string;
};

// Full shape — used on the authenticated /tutors page and in admin.
export type Tutor = {
  id: string;
  full_name: string;
  photo_url: string | null;
  department: string;
  level: string;
  bio: string;
  whatsapp_number: string | null;
  email: string | null;
  availability: string;
  is_active: boolean;
  peer_tutor_courses: { courses: TutorCourse }[];
};

export async function getFeaturedTutors(
  supabase: SupabaseClient,
  limit = 3
): Promise<FeaturedTutor[]> {
  const { data } = await supabase
    .from('peer_tutors')
    .select('id, full_name, photo_url, department, level')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(limit);

  return (data as FeaturedTutor[]) ?? [];
}

export async function getActiveTutors(supabase: SupabaseClient): Promise<Tutor[]> {
  const { data } = await supabase
    .from('peer_tutors')
    .select(
      'id, full_name, photo_url, department, level, bio, whatsapp_number, email, availability, is_active, peer_tutor_courses(courses(id, code, name))'
    )
    .eq('is_active', true)
    .order('full_name', { ascending: true });

  return (data as unknown as Tutor[]) ?? [];
}

// Admin view — includes inactive tutors too.
export async function getAllTutors(supabase: SupabaseClient): Promise<Tutor[]> {
  const { data } = await supabase
    .from('peer_tutors')
    .select(
      'id, full_name, photo_url, department, level, bio, whatsapp_number, email, availability, is_active, peer_tutor_courses(courses(id, code, name))'
    )
    .order('created_at', { ascending: false });

  return (data as unknown as Tutor[]) ?? [];
}

export async function getTutorDepartmentOptions(supabase: SupabaseClient): Promise<string[]> {
  const { data } = await supabase.from('peer_tutors').select('department').eq('is_active', true);
  const departments = (data ?? []).map((d) => d.department as string);
  return Array.from(new Set(departments)).sort();
}
