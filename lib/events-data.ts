import type { SupabaseClient } from '@supabase/supabase-js';

export type EventItem = {
  id: string;
  title: string;
  description: string;
  event_type: 'workshop' | 'revision_session' | 'career_fair' | 'info_session' | 'other';
  start_time: string;
  end_time: string | null;
  location: string | null;
  status: 'draft' | 'published';
  created_at: string;
};

export async function getAllEvents(supabase: SupabaseClient): Promise<EventItem[]> {
  const { data, error } = await supabase
    .from('events')
    .select('id, title, description, event_type, start_time, end_time, location, status, created_at')
    .order('start_time', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getPublishedEvents(supabase: SupabaseClient): Promise<EventItem[]> {
  const { data, error } = await supabase
    .from('events')
    .select('id, title, description, event_type, start_time, end_time, location, status, created_at')
    .eq('status', 'published')
    .order('start_time', { ascending: true });

  if (error) throw error;
  return data ?? [];
}
