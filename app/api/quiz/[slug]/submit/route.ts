import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { markAttempt } from '@/lib/quiz/parser';
import type { StoredQuestion, StoredTheory } from '@/lib/quiz/server';
import { applyFirstTrialSlip, isFirstTrial, slipEnabled } from '@/lib/quiz/firstTrial';

export const runtime = 'nodejs';

const GRACE_SECONDS = 90; // covers slow networks when the timer auto-submits
// A phone can pause the page or lose signal exactly when the timer ends, so the auto-submit never arrives.
// Answers up to this many minutes late are still saved, and marked as a timed-out submission.
const LATE_ACCEPT_MINUTES = 120;

// POST /api/quiz/[slug]/submit  { attemptId, answers: { [questionId]: optionIndex } }
// Public. Marks on the server, saves the result, and returns the score with the
// correct answers. This is the only place the answers ever leave the server.
export async function POST(request: Request, { params }: { params: { slug: string } }) {
  const { attemptId, answers, switches, reason, theoryAnswers } = (await request.json()) as {
    attemptId?: string;
    answers?: Record<string, unknown>;
    switches?: number;
    reason?: string | null;
    theoryAnswers?: Record<string, unknown>;
  };
  if (!attemptId || typeof answers !== 'object' || answers === null) {
    return NextResponse.json({ error: 'Missing answers.' }, { status: 400 });
  }

  const db = createAdminClient();
  const { data: quiz } = await db
    .from('quizzes')
    .select('id, questions, theory, time_limit_minutes')
    .eq('slug', params.slug)
    .single();
  if (!quiz) return NextResponse.json({ error: 'Quiz not found.' }, { status: 404 });

  const { data: attempt } = await db
    .from('quiz_attempts')
    .select('id, participant_name, started_at, submitted_at, answers, theory_answers, submit_reason')
    .eq('id', attemptId)
    .eq('quiz_id', quiz.id)
    .single();
  if (!attempt) return NextResponse.json({ error: 'Attempt not found.' }, { status: 404 });
  if (attempt.submitted_at) {
    // Already saved (a double tap, or the first reply was lost on a weak network).
    // Send the saved result back so the student sees it instead of an error.
    const savedAnswers = (attempt.answers ?? {}) as Record<string, unknown>;
    const savedTyped = (attempt.theory_answers ?? {}) as Record<string, string>;
    const savedReason = attempt.submit_reason === 'cheating' || attempt.submit_reason === 'time' ? attempt.submit_reason : null;
    let marked: { score: number; total: number; review: ReturnType<typeof markAttempt>['review'] } = markAttempt(quiz.questions as StoredQuestion[], savedAnswers);
    if (slipEnabled(params.slug) && (await isFirstTrial(db, quiz.id, attempt.participant_name, attempt.id, attempt.submitted_at))) {
      const s = applyFirstTrialSlip(marked.review, attempt.id);
      marked = { score: s.score, total: marked.total, review: s.review };
    }
    const defs = (quiz.theory ?? []) as StoredTheory[];
    return NextResponse.json({
      score: marked.score,
      total: marked.total,
      reason: savedReason,
      review: savedReason === 'cheating' ? null : marked.review,
      theory:
        savedReason === 'cheating'
          ? null
          : defs.map((t) => ({ id: t.id, text: t.text, yourAnswer: savedTyped[t.id] ?? '', modelAnswer: t.modelAnswer })),
    });
  }

  let late = false;
  if (quiz.time_limit_minutes) {
    const elapsed = (Date.now() - new Date(attempt.started_at).getTime()) / 1000;
    if (elapsed > (quiz.time_limit_minutes + LATE_ACCEPT_MINUTES) * 60) {
      return NextResponse.json({ error: 'Time is up. This attempt can no longer be submitted.' }, { status: 403 });
    }
    late = elapsed > quiz.time_limit_minutes * 60 + GRACE_SECONDS;
  }

  const { score, total, review: realReview } = markAttempt(quiz.questions as StoredQuestion[], answers);
  const submitReason = reason === 'cheating' ? 'cheating' : late || reason === 'time' ? 'time' : null;
  const theoryDefs = (quiz.theory ?? []) as StoredTheory[];
  const typed: Record<string, string> = {};
  theoryDefs.forEach((t) => {
    const v = theoryAnswers && typeof theoryAnswers[t.id] === 'string' ? (theoryAnswers[t.id] as string) : '';
    typed[t.id] = v.trim().slice(0, 5000);
  });
  const tabSwitches = typeof switches === 'number' && switches >= 0 ? Math.min(Math.floor(switches), 50) : 0;

  // The "is null" condition means two quick taps cannot submit twice.
  const { data: saved, error } = await db
    .from('quiz_attempts')
    .update({ submitted_at: new Date().toISOString(), score, total, answers, tab_switches: tabSwitches, submit_reason: submitReason, theory_answers: typed })
    .eq('id', attempt.id)
    .is('submitted_at', null)
    .select('id');
  if (error || !saved?.length) {
    return NextResponse.json({ error: 'Could not save your result. Try again.' }, { status: 500 });
  }
  // First-trial slips change only what the student sees. The saved score above stays the real one.
  let shown = { score, review: realReview, slipped: false };
  if (slipEnabled(params.slug) && (await isFirstTrial(db, quiz.id, attempt.participant_name, attempt.id))) {
    shown = applyFirstTrialSlip(realReview, attempt.id);
  }
  const review = shown.review;
  // Someone caught cheating still sees their score but not the correct answers.
  const theoryReview =
    submitReason === 'cheating'
      ? null
      : theoryDefs.map((t) => ({ id: t.id, text: t.text, yourAnswer: typed[t.id], modelAnswer: t.modelAnswer }));
  return NextResponse.json({
    score: shown.score,
    total,
    reason: submitReason,
    review: submitReason === 'cheating' ? null : review,
    theory: theoryReview,
  });
}
