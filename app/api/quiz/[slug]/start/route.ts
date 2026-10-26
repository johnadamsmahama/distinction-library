import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

// POST /api/quiz/[slug]/start  { name }
// Public. Records who started and when, so the time limit is enforced by the server clock.
export async function POST(request: Request, { params }: { params: { slug: string } }) {
  const { name } = (await request.json()) as { name?: string };
  const participant = name?.trim().replace(/\s+/g, ' ');
  if (!participant || participant.length < 2 || participant.length > 60) {
    return NextResponse.json({ error: 'Enter your name (2 to 60 characters).' }, { status: 400 });
  }

  const db = createAdminClient();
  const { data: quiz } = await db
    .from('quizzes')
    .select('id, published, closes_at, time_limit_minutes')
    .eq('slug', params.slug)
    .single();
  if (!quiz || !quiz.published) return NextResponse.json({ error: 'This quiz is not open.' }, { status: 404 });
  if (quiz.closes_at && new Date(quiz.closes_at).getTime() < Date.now()) {
    return NextResponse.json({ error: 'This quiz has closed.' }, { status: 403 });
  }

  const { data: attempt, error } = await db
    .from('quiz_attempts')
    .insert({ quiz_id: quiz.id, participant_name: participant })
    .select('id')
    .single();
  if (error || !attempt) {
    console.error('quiz start failed', error);
    return NextResponse.json({ error: 'Could not start the quiz. Try again.' }, { status: 500 });
  }
  return NextResponse.json({
    attemptId: attempt.id,
    remainingSeconds: quiz.time_limit_minutes ? quiz.time_limit_minutes * 60 : null,
  });
}
