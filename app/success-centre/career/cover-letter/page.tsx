import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import CoverLetterGenerator from '@/components/career/CoverLetterGenerator';

export default async function CoverLetterPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-display font-bold text-2xl text-navy mb-1">Cover Letter Generator</h1>
      <p className="font-body text-sm text-g600 mb-6">
        Tell it about the role and your background, and get a tailored cover letter.
      </p>
      <CoverLetterGenerator />
    </div>
  );
}
