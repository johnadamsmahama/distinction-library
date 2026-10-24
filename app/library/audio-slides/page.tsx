import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AudioSlidesBrowser from '@/components/library/AudioSlidesBrowser';

export default async function AudioSlidesPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <AudioSlidesBrowser />
  );
}
