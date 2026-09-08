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
    <div className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-4 sm:-mt-6 lg:-mt-8 -mb-4 sm:-mb-6 lg:-mb-8">
      <AudioSlidesBrowser />
    </div>
  );
}
