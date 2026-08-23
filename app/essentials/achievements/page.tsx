import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

const TIER_STYLES: Record<string, string> = {
  gold: 'bg-gold/15 text-[#7A5A0E] border-gold/40',
  silver: 'bg-gray-100 text-gray-600 border-gray-300',
  bronze: 'bg-amber-100 text-amber-800 border-amber-300',
};

const TIER_ICON: Record<string, string> = { gold: '🥇', silver: '🥈', bronze: '🥉' };

export default async function AchievementPortfolioPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [{ data: profile }, { data: currentEntry }] = await Promise.all([
    supabase
      .from('profiles')
      .select('upload_count, strikes_count, contributor_badge')
      .eq('id', user.id)
      .single(),

    supabase
      .from('leaderboard_entries')
      .select('tier, rank, upload_count, leaderboard_periods!inner(label, is_current)')
      .eq('user_id', user.id)
      .eq('leaderboard_periods.is_current', true)
      .maybeSingle(),
  ]);

  const badges: { label: string; sublabel: string; tier: string }[] = [];

  if (currentEntry?.tier) {
    badges.push({
      label: `${(currentEntry.leaderboard_periods as any)?.label ?? 'This semester'}`,
      sublabel: `Rank #${currentEntry.rank} · ${currentEntry.upload_count} uploads`,
      tier: currentEntry.tier,
    });
  }

  if (profile?.contributor_badge) {
    badges.push({
      label: 'All-Time',
      sublabel: `${profile.upload_count} uploads lifetime`,
      tier: profile.contributor_badge,
    });
  }

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="font-display font-bold text-2xl text-navy mt-2 mb-1">Achievement Portfolio</h1>
      <p className="font-body text-sm text-g600 mb-6">
        Badges you've earned from contributing approved papers and study materials.
      </p>

      {badges.length === 0 ? (
        <div className="bg-white border border-g100 rounded-none p-8 text-center">
          <p className="font-body text-sm text-g600">
            No badges yet — Gold, Silver, and Bronze go to the top 3 contributors on the Leaderboard
            each semester and all-time. Upload an approved past paper or study material to get on
            the board.
          </p>
          <Link
            href="/leaderboard"
            className="inline-block mt-4 font-condensed font-bold text-xs uppercase text-gold hover:underline"
          >
            View the Leaderboard →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {badges.map((b, i) => (
            <div key={i} className={`border rounded-none p-6 text-center ${TIER_STYLES[b.tier]}`}>
              <div className="text-4xl mb-2">{TIER_ICON[b.tier]}</div>
              <div className="font-display font-bold text-base capitalize">{b.tier}</div>
              <div className="font-condensed font-semibold text-sm mt-1">{b.label}</div>
              <div className="font-body text-xs opacity-80 mt-0.5">{b.sublabel}</div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white border border-g100 rounded-none p-6">
        <h2 className="font-display font-bold text-base text-navy mb-3">Standing</h2>
        <div className="space-y-2 font-body text-sm">
          <div className="flex justify-between">
            <span className="text-g600">Total uploads (lifetime)</span>
            <span className="font-condensed font-semibold text-g800">{profile?.upload_count ?? 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-g600">Strikes on record</span>
            <span className="font-condensed font-semibold text-g800">{profile?.strikes_count ?? 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
