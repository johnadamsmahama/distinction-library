import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import CvBuilder from '@/components/career/CvBuilder';

export default async function CvBuilderPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-display font-bold text-2xl text-navy mb-1">AI CV Builder</h1>
      <p className="font-body text-sm text-g600 mb-6">
        Build a new CV from your details, or paste an existing one for the AI to improve.
      </p>
      <CvBuilder />
    </div>
  );
}
