import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { markAttempt } from '@/lib/quiz/parser';
import type { StoredQuestion } from '@/lib/quiz/server';

export const runtime = 'nodejs';

const GRACE_SECONDS = 90; // covers slow networks when the timer auto-submits

// POST /api/quiz/[slug]/submit  { attemptId, answers: { [questionId]: optionIndex } }
// Public. Marks on the server, saves the result, and returns the score with the
// correct answers. This is the only place the answers ever leave the server.
export async function POST(request: Request, { params }: { params: { slug: string } }) {
  const { attemptId, answers, switches, reason } = (await request.json()) as {
    attemptId?: string;
    answers?: Record<string, unknown>;
    switches?: number;
    reason?: string | null;
  };
  if (!attemptId || typeof answers !== 'object' || answers === null) {
    return NextResponse.json({ error: 'Missing answers.' }, { status: 400 });
  }

  const db = createAdminClient();
  const { data: quiz } = await db
    .from('quizzes')
    .select('id, questions, time_limit_minutes')
    .eq('slug', params.slug)
    .single();
  if (!quiz) return NextResponse.json({ error: 'Quiz not found.' }, { status: 404 });

  const { data: attempt } = await db
    .from('quiz_attempts')
    .select('id, started_at, submitted_at')
    .eq('id', attemptId)
    .eq('quiz_id', quiz.id)
    .single();
  if (!attempt) return NextResponse.json({ error: 'Attempt not found.' }, { status: 404 });
  if (attempt.submitted_at) return NextResponse.json({ error: 'This attempt was already submitted.' }, { status: 409 });

  if (quiz.time_limit_minutes) {
    const elapsed = (Date.now() - new Date(attempt.started_at).getTime()) / 1000;
    if (elapsed > quiz.time_limit_minutes * 60 + GRACE_SECONDS) {
      return NextResponse.json({ error: 'Time is up. This attempt can no longer be submitted.' }, { status: 403 });
    }
  }

  const { score, total, review } = markAttempt(quiz.questions as StoredQuestion[], answers);
  const submitReason = reason === 'cheating' || reason === 'time' ? reason : null;
  const tabSwitches = typeof switches === 'number' && switches >= 0 ? Math.min(Math.floor(switches), 50) : 0;

  // The "is null" condition means two quick taps cannot submit twice.
  const { data: saved, error } = await db
    .from('quiz_attempts')
    .update({ submitted_at: new Date().toISOString(), score, total, answers, tab_switches: tabSwitches, submit_reason: submitReason })
    .eq('id', attempt.id)
    .is('submitted_at', null)
    .select('id');
  if (error || !saved?.length) {
    return NextResponse.json({ error: 'Could not save your result. Try again.' }, { status: 500 });
  }
  // Someone caught cheating still sees their score but not the correct answers.
  return NextResponse.json({ score, total, reason: submitReason, review: submitReason === 'cheating' ? null : review });
}
