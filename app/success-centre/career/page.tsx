import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function CareerCentrePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-navy mb-1">Career Resources</h1>
      <p className="font-body text-sm text-g600 mb-6">
        AI-powered tools to help you land your next role.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/success-centre/career/cv-builder"
          className="bg-white border border-g100 rounded-2xl p-6 hover:border-gold transition-colors"
        >
          <h2 className="font-display font-bold text-lg text-navy mb-1.5">AI CV Builder</h2>
          <p className="font-body text-sm text-g600">
            Build a new CV from your details, or improve one you already have.
          </p>
        </Link>

        <Link
          href="/success-centre/career/cover-letter"
          className="bg-white border border-g100 rounded-2xl p-6 hover:border-gold transition-colors"
        >
          <h2 className="font-display font-bold text-lg text-navy mb-1.5">Cover Letter Generator</h2>
          <p className="font-body text-sm text-g600">
            Tailored cover letters for a specific role or application.
          </p>
        </Link>

        <Link
          href="/success-centre/career/interview-coach"
          className="bg-white border border-g100 rounded-2xl p-6 hover:border-gold transition-colors"
        >
          <h2 className="font-display font-bold text-lg text-navy mb-1.5">Interview Coach</h2>
          <p className="font-body text-sm text-g600">
            Practice common interview questions and get AI feedback.
          </p>
        </Link>

        <Link
          href="/success-centre/career/linkedin-optimizer"
          className="bg-white border border-g100 rounded-2xl p-6 hover:border-gold transition-colors"
        >
          <h2 className="font-display font-bold text-lg text-navy mb-1.5">LinkedIn Optimizer</h2>
          <p className="font-body text-sm text-g600">
            Improve your LinkedIn headline, summary, and experience sections.
          </p>
        </Link>
      </div>
    </div>
  );
}
