import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile, isAdminRole } from '@/lib/auth-helpers';
import AutoPublishReview from '@/components/moderate/AutoPublishReview';

export default async function AutoPublishReviewPage() {
  const supabase = createClient();
  const { user, profile } = await getCurrentProfile(supabase);

  if (!user) redirect('/login');
  if (!isAdminRole(profile?.role)) redirect('/dashboard');

  // Only study materials that skipped the moderation queue entirely —
  // auto-approved by the bulk upload classifier and already live to
  // students. Ordered lowest confidence first so the riskiest matches
  // surface at the top. Admin-only, unlike the main moderation queue.
  const [{ data: items }, { data: courses }] = await Promise.all([
    supabase
      .from('study_materials')
      .select(
        'id, title, content_type, week_number, file_url, ai_confidence, ai_review_notes, auto_publish_reviewed, course_id, created_at, courses ( id, code, name )'
      )
      .eq('ai_review_status', 'auto_approved')
      .eq('status', 'approved')
      .order('ai_confidence', { ascending: true }),
    supabase
      .from('courses')
      .select('id, code, name')
      .eq('is_active', true)
      .order('code', { ascending: true }),
  ]);

  const reviewedCount = (items ?? []).filter((i) => i.auto_publish_reviewed).length;
  const totalCount = items?.length ?? 0;

  return (
    <div className="max-w-3xl mx-auto px-5 py-8">
      <div className="mb-1">
        <span className="font-condensed font-bold text-[11px] uppercase tracking-wide text-g600">
          Moderate <span className="text-g100">/</span>{' '}
          <span className="text-navy">Auto-Publish Review</span>
        </span>
      </div>
      <h1 className="font-display font-extrabold text-2xl text-navy mb-1.5">Auto-Publish Review</h1>
      <p className="font-body text-[13.5px] text-g600 max-w-xl leading-relaxed mb-5">
        Study materials that went live automatically through bulk upload. Sorted by lowest
        confidence first, so anything worth a second look surfaces at the top.
      </p>

      <AutoPublishReview
        initialItems={items ?? []}
        courses={courses ?? []}
        totalCount={totalCount}
        initialReviewedCount={reviewedCount}
      />
    </div>
  );
}
