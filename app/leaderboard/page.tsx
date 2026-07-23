import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Leaderboard from '@/components/leaderboard/Leaderboard';

export default async function LeaderboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: rows } = await supabase
    .from('profiles')
    .select('id, full_name, student_id, department, level, upload_count, contributor_badge')
    .order('upload_count', { ascending: false })
    .limit(50);

  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-navy mb-1">Leaderboard</h1>
      <p className="font-body text-sm text-g600 mb-6">
        Top contributors by approved past papers. Gold, Silver, and Bronze badges reset each
        semester.
      </p>
      <Leaderboard rows={(rows as any) ?? []} currentUserId={user.id} />
    </div>
  );
}
