import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import InterviewCoach from '@/components/career/InterviewCoach';

export default async function InterviewCoachPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-display font-bold text-2xl text-navy mb-1">Interview Coach</h1>
      <p className="font-body text-sm text-g600 mb-6">
        Practice a mock interview and get feedback after each answer.
      </p>
      <InterviewCoach />
    </div>
  );
}
