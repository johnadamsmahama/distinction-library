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
      <h1 className="font-display font-bold text-2xl text-navy mb-1">Career Centre</h1>
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

        <ComingSoonCard title="Cover Letter Generator" desc="Tailored cover letters for a specific role or application." />
        <ComingSoonCard title="Interview Coach" desc="Practice common interview questions and get AI feedback." />
        <ComingSoonCard title="LinkedIn Optimizer" desc="Improve your LinkedIn headline, summary, and experience sections." />
      </div>
    </div>
  );
}

function ComingSoonCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="bg-off-white border border-g100 rounded-2xl p-6 opacity-70">
      <div className="flex items-center gap-2 mb-1.5">
        <h2 className="font-display font-bold text-lg text-navy">{title}</h2>
        <span className="font-condensed font-bold text-[10px] uppercase tracking-wide bg-g100 text-g600 px-2 py-0.5 rounded">
          Coming soon
        </span>
      </div>
      <p className="font-body text-sm text-g600">{desc}</p>
    </div>
  );
}
