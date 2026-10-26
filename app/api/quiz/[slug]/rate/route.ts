import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

const VALID = ['got', 'partly', 'missed'];

// POST /api/quiz/[slug]/rate  { attemptId, ratings: { [theoryId]: 'got' | 'partly' | 'missed' } }
// Public. Saves the student's own verdict on each theory answer, for the admin to see.
export async function POST(request: Request, { params }: { params: { slug: string } }) {
  const { attemptId, ratings } = (await request.json()) as {
    attemptId?: string;
    ratings?: Record<string, unknown>;
  };
  if (!attemptId || typeof ratings !== 'object' || ratings === null) {
    return NextResponse.json({ error: 'Missing ratings.' }, { status: 400 });
  }
  const clean: Record<string, string> = {};
  Object.keys(ratings).forEach((k) => {
    const v = ratings[k];
    if (/^t\d{1,3}$/.test(k) && typeof v === 'string' && VALID.indexOf(v) !== -1) clean[k] = v;
  });

  const db = createAdminClient();
  const { data: quiz } = await db.from('quizzes').select('id').eq('slug', params.slug).single();
  if (!quiz) return NextResponse.json({ error: 'Quiz not found.' }, { status: 404 });

  // Only a submitted, non-cheating attempt can be rated (those students saw the model answers).
  // The .or() keeps rows where submit_reason is empty: a plain "not equal" would drop them in SQL.
  const { data, error } = await db
    .from('quiz_attempts')
    .update({ theory_ratings: clean })
    .eq('id', attemptId)
    .eq('quiz_id', quiz.id)
    .not('submitted_at', 'is', null)
    .or('submit_reason.is.null,submit_reason.neq.cheating')
    .select('id');
  if (error || !data?.length) return NextResponse.json({ error: 'Could not save your rating.' }, { status: 400 });
  return NextResponse.json({ ok: true });
}
