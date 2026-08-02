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
      <h1 className="font-display font-bold text-2xl text-navy mb-1">LinkedIn Optimizer</h1>
      <p className="font-body text-sm text-g600 mb-6">
        Get an improved headline, About section, and profile tips tailored to your target role.
      </p>
      <LinkedInOptimizer />
    </div>
  );
}
