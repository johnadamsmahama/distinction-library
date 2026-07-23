import type { SupabaseClient } from '@supabase/supabase-js';

export async function getCurrentProfile(supabase: SupabaseClient) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, profile: null };

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  return { user, profile };
}

export function isStaffRole(role: string | undefined | null) {
  return role === 'moderator' || role === 'admin';
}

export function isAdminRole(role: string | undefined | null) {
  return role === 'admin';
}
