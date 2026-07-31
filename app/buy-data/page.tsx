import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import BuyDataForm from '@/components/buydata/BuyDataForm';

export default async function BuyDataPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const [{ data: profile }, { data: existingSignup }] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', user.id).single(),
    supabase.from('buy_data_signups').select('id').eq('user_id', user.id).maybeSingle(),
  ]);

  return (
    <div className="max-w-md mx-auto">
      <h1 className="font-display font-bold text-2xl text-navy mb-1">Buy Data</h1>
      <p className="font-body text-sm text-g600 mb-6">
        Affordable mobile data bundles, coming soon. Tell us your network and we&apos;ll let you
        know the moment it&apos;s ready — no payment involved yet.
      </p>
      <BuyDataForm defaultEmail={user.email ?? ''} alreadySignedUp={!!existingSignup} />
      <p className="font-condensed text-xs text-g600 mt-4 text-center">
        {profile?.full_name ? `Signing up as ${profile.full_name}` : ''}
      </p>
    </div>
  );
}
