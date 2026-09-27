import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import PastQuestionsBrowser from '@/components/library/PastQuestionsBrowser';

export default async function PastQuestionsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div className="-mx-5 sm:-mx-7 -mt-8 -mb-8">
      <PastQuestionsBrowser />
    </div>
  );
}
