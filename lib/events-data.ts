import { createClient } from '@/lib/supabase/client'

export type EventType = 'workshop' | 'revision_session' | 'career_fair' | 'info_session' | 'other'

export interface DLEvent {
  id: string
  title: string
  description: string
  event_type: EventType
  start_time: string
  end_time: string | null
  location: string | null
  status: 'draft' | 'published'
  created_at: string
}

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  workshop: 'Workshop',
  revision_session: 'Revision Session',
  career_fair: 'Career Fair',
  info_session: 'Info Session',
  other: 'Event',
}

export const EVENT_TYPE_COLORS: Record<EventType, string> = {
  workshop: '#C9A02C',
  revision_session: '#0D2B5E',
  career_fair: '#2C7A4B',
  info_session: '#7A3B8C',
  other: '#6B7280',
}

export async function getPublishedEvents(): Promise<DLEvent[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('status', 'published')
    .order('start_time', { ascending: true })

  if (error) {
    console.error('Error fetching events:', error)
    return []
  }
  return data as DLEvent[]
}

export function splitUpcomingPast(events: DLEvent[]) {
  const now = new Date()
  const upcoming = events.filter((e) => new Date(e.start_time) >= now)
  const past = events
    .filter((e) => new Date(e.start_time) < now)
    .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())
  return { upcoming, past }
}
