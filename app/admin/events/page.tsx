import { createClient } from '@/lib/supabase/server';
import { getAllEvents } from '@/lib/events-data';
import EventManager from '@/components/admin/EventManager';

export default async function AdminEventsPage() {
  const supabase = createClient();
  const events = await getAllEvents(supabase);

  return <EventManager events={events} />;
}
