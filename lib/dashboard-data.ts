import type { SupabaseClient } from '@supabase/supabase-js';

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;

export async function getDashboardData(supabase: SupabaseClient, userId: string) {
  const [
    profileRes,
    bookmarksRes,
    rankRes,
    recentPapersRes,
    recentMaterialsRes,
    vaultRes,
    notificationsRes,
    unreadCountRes,
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),

    supabase.rpc('get_dashboard_bookmarks', { p_user_id: userId }),

    supabase.rpc('get_leaderboard_rank', { p_user_id: userId }),

    supabase
      .from('past_papers')
      .select('id, year, exam_type, created_at, courses(code, name)')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(5),

    supabase
      .from('study_materials')
      .select('id, title, content_type, created_at, courses(code, name)')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(5),

    supabase.from('study_vault_items').select('item_type').eq('user_id', userId),

    supabase
      .from('notifications')
      .select('id, type, message, read, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5),

    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false),
  ]);

  const vaultItems = vaultRes.data ?? [];
  const vaultSummary = {
    quizzes: vaultItems.filter((i) => i.item_type === 'quiz').length,
    companionSessions: vaultItems.filter((i) => i.item_type === 'companion_session').length,
    summaries: vaultItems.filter((i) => i.item_type === 'summary').length,
    total: vaultItems.length,
  };

  return {
    profile: profileRes.data,
    bookmarks: bookmarksRes.data ?? [],
    leaderboardRank: rankRes.data as number | null,
    recentPapers: recentPapersRes.data ?? [],
    recentMaterials: recentMaterialsRes.data ?? [],
    vaultSummary,
    notifications: notificationsRes.data ?? [],
    unreadCount: unreadCountRes.count ?? 0,
  };
}
