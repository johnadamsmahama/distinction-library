import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

export type EventType = 'workshop' | 'revision_session' | 'career_fair' | 'info_session' | 'other';

export interface EventItem {
  id: string;
  title: string;
  description: string;
  event_type: EventType;
  start_time: string;
  end_time: string | null;
  location: string | null;
  status: 'draft' | 'published';
  created_at: string;
}

// Alias so components/success-centre/EventsView.tsx (which imports DLEvent) keeps working unchanged
export type DLEvent = EventItem;

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  workshop: 'Workshop',
  revision_session: 'Revision Session',
  career_fair: 'Career Fair',
  info_session: 'Info Session',
  other: 'Event',
};

export const EVENT_TYPE_COLORS: Record<EventType, string> = {
  workshop: '#C9A02C',
  revision_session: '#0D2B5E',
  career_fair: '#2C7A4B',
  info_session: '#7A3B8C',
  other: '#6B7280',
};

// Server-side — used by /admin/events to list every event regardless of status
export async function getAllEvents(supabase: SupabaseClient): Promise<EventItem[]> {
  const { data, error } = await supabase
    .from('events')
    .select('id, title, description, event_type, start_time, end_time, location, status, created_at')
    .order('start_time', { ascending: true });

  if (error) {
    console.error('Error fetching events:', error);
    return [];
  }
  return data as EventItem[];
}

// Client-side — used by /success-centre/events to list only published events
export async function getPublishedEvents(): Promise<EventItem[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('events')
    .select('id, title, description, event_type, start_time, end_time, location, status, created_at')
    .eq('status', 'published')
    .order('start_time', { ascending: true });

  if (error) {
    console.error('Error fetching events:', error);
    return [];
  }
  return data as EventItem[];
}

export function splitUpcomingPast(events: EventItem[]) {
  const now = new Date();
  const upcoming = events.filter((e) => new Date(e.start_time) >= now);
  const past = events
    .filter((e) => new Date(e.start_time) < now)
    .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());
  return { upcoming, past };
}
