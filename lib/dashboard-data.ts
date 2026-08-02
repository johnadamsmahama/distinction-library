import type { SupabaseClient } from '@supabase/supabase-js';

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
    myViewsRes,
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),

    supabase
      .from('bookmarked_courses')
      .select('course_id, courses(id, code, name, department, level)')
      .eq('user_id', userId),

    supabase.rpc('get_leaderboard_rank', { p_user_id: userId }),

    supabase
      .from('past_papers')
      .select('id, year, exam_type, created_at, courses(code, name)')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(5),

    supabase
      .from('study_materials')
      .select('id, title, content_type, week_number, created_at, courses(code, name)')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(5),

    supabase
      .from('study_vault_items')
      .select('id, item_type')
      .eq('user_id', userId),

    supabase
      .from('notifications')
      .select('id, message, type, read, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5),

    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false),

    supabase
      .from('resource_views')
      .select('resource_type, resource_id, course_id, course_code, title, viewed_at')
      .eq('user_id', userId)
      .order('viewed_at', { ascending: false })
      .limit(200),
  ]);

  // Dedupe by resource so re-opening the same paper twice doesn't create two
  // "recently viewed" entries or double-count progress.
  const allViews = myViewsRes.data ?? [];
  const seenResource = new Set<string>();
  const distinctViews = allViews.filter((v) => {
    const key = `${v.resource_type}:${v.resource_id}`;
    if (seenResource.has(key)) return false;
    seenResource.add(key);
    return true;
  });

  const myRecentViews = distinctViews.slice(0, 6);

  // Study progress: for every course the student has viewed at least one
  // resource in, show how many of that course's approved resources they've
  // opened. Only fetches totals for courses actually touched, not all courses.
  const viewedCourseIds = Array.from(
    new Set(distinctViews.map((v) => v.course_id).filter((id): id is string => !!id))
  );

  let studyProgress: { courseId: string; courseCode: string; viewed: number; total: number }[] = [];
  if (viewedCourseIds.length > 0) {
    const [{ data: totalPapers }, { data: totalMaterials }] = await Promise.all([
      supabase.from('past_papers').select('course_id').eq('status', 'approved').in('course_id', viewedCourseIds),
      supabase.from('study_materials').select('course_id').eq('status', 'approved').in('course_id', viewedCourseIds),
    ]);

    const totalByCourseMap = new Map<string, number>();
    [...(totalPapers ?? []), ...(totalMaterials ?? [])].forEach((r: any) => {
      totalByCourseMap.set(r.course_id, (totalByCourseMap.get(r.course_id) ?? 0) + 1);
    });

    const viewedByCourseMap = new Map<string, number>();
    const codeByCourseMap = new Map<string, string>();
    distinctViews.forEach((v) => {
      if (!v.course_id) return;
      viewedByCourseMap.set(v.course_id, (viewedByCourseMap.get(v.course_id) ?? 0) + 1);
      if (v.course_code) codeByCourseMap.set(v.course_id, v.course_code);
    });

    studyProgress = viewedCourseIds
      .map((courseId) => ({
        courseId,
        courseCode: codeByCourseMap.get(courseId) ?? 'Course',
        viewed: viewedByCourseMap.get(courseId) ?? 0,
        total: totalByCourseMap.get(courseId) ?? 0,
      }))
      .filter((p) => p.total > 0)
      .sort((a, b) => b.viewed / b.total - a.viewed / a.total);
  }

  const vaultItems = vaultRes.data ?? [];

  return {
    profile: profileRes.data,
    bookmarks: (bookmarksRes.data ?? []).map((b: any) => b.courses).filter(Boolean),
    rank: rankRes.data ?? null,
    recentPapers: recentPapersRes.data ?? [],
    recentMaterials: recentMaterialsRes.data ?? [],
    vaultSummary: {
      total: vaultItems.length,
      quizzes: vaultItems.filter((v) => v.item_type === 'quiz').length,
      companionSessions: vaultItems.filter((v) => v.item_type === 'companion_session').length,
      summaries: vaultItems.filter((v) => v.item_type === 'summary').length,
    },
    notifications: notificationsRes.data ?? [],
    unreadCount: unreadCountRes.count ?? 0,
    myRecentViews,
    studyProgress,
  };
}
