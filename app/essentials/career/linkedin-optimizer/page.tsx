import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import LinkedInOptimizer from '@/components/career/LinkedInOptimizer';

export default async function LinkedInOptimizerPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div className="max-w-2xl mx-auto">
      <div className="relative overflow-hidden bg-gradient-to-br from-navy-mid via-navy to-navy-deep px-5 pt-5 pb-7 -mx-4 sm:mx-0 sm:rounded-2xl">
        <div className="absolute -right-14 -top-14 w-56 h-56 rounded-full bg-gold-light/10 blur-2xl" />
        <nav className="relative flex items-center gap-1.5 text-[11px] font-condensed font-medium uppercase tracking-wide text-gold-light/75 mb-3">
          <Link href="/essentials/career" className="hover:underline hover:text-gold-light">
            Career Resources
          </Link>
          <span className="text-white/25">/</span>
          <span className="text-gold-light">LinkedIn Optimizer</span>
        </nav>
        <h1 className="relative font-display font-semibold text-3xl text-white mb-2 tracking-tight">
          LinkedIn Optimizer
        </h1>
        <p className="relative font-body text-sm text-white/70 max-w-[34ch] leading-relaxed">
          Get an improved headline, About section, and profile tips tailored to your target role.
        </p>
      </div>
      <LinkedInOptimizer />
    </div>
  );
}
