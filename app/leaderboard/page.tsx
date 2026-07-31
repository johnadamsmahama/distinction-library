import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Leaderboard from '@/components/leaderboard/Leaderboard';

export default async function LeaderboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Current semester period (Section 7.3: "resets each semester").
  const { data: period } = await supabase
    .from('leaderboard_periods')
    .select('id, label, starts_at, ends_at')
    .eq('is_current', true)
    .maybeSingle();

  let semesterRows: any[] = [];
  if (period) {
    const { data } = await supabase
      .from('leaderboard_entries')
      .select('upload_count, rank, tier, profiles!user_id (id, full_name, student_id, department, level)')
      .eq('period_id', period.id)
      .order('rank', { ascending: true, nullsFirst: false })
      .order('upload_count', { ascending: false })
      .limit(50);

    semesterRows = (data ?? [])
      .filter((r: any) => r.profiles)
      .map((r: any) => ({
        id: r.profiles.id,
        full_name: r.profiles.full_name,
        student_id: r.profiles.student_id,
        department: r.profiles.department,
        level: r.profiles.level,
        upload_count: r.upload_count,
        tier: r.tier,
      }));
  }

  // All-time archive (Section 7.3: "an all-time archive remains browsable"),
  // sourced from profiles.upload_count, the platform's lifetime tally.
  const { data: allTimeData } = await supabase
    .from('profiles')
    .select('id, full_name, student_id, department, level, upload_count, contributor_badge')
    .order('upload_count', { ascending: false })
    .limit(50);

  const allTimeRows = (allTimeData ?? []).map((r: any) => ({
    id: r.id,
    full_name: r.full_name,
    student_id: r.student_id,
    department: r.department,
    level: r.level,
    upload_count: r.upload_count,
    tier: r.contributor_badge,
  }));

  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-navy mb-1">Leaderboard</h1>
      <p className="font-body text-sm text-g600 mb-6">
        Top contributors by approved past papers and study materials. Gold, Silver, and Bronze badges reset each
        semester.
      </p>
      <Leaderboard
        semesterRows={semesterRows}
        allTimeRows={allTimeRows}
        currentUserId={user.id}
        periodLabel={period?.label ?? null}
      />
    </div>
  );
}
