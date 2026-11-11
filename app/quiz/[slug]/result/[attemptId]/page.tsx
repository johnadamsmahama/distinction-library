import type { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/admin';
import QuizTaker from '@/components/quiz/QuizTaker';
import { markAttempt } from '@/lib/quiz/parser';
import type { StoredQuestion, StoredTheory } from '@/lib/quiz/server';
import { applyFirstTrialSlip, isFirstTrial, slipEnabled } from '@/lib/quiz/firstTrial';

// A student's own saved result, opened from a link the admin sends (for a student who could not see it).
// The attempt id is a long random value, so only the person given the link can open it.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Your result - Distinction Programme', robots: { index: false, follow: false } };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function Notice({ title, text }: { title: string; text: string }) {
  return (
    <div className="min-h-screen bg-off-white font-body flex items-center justify-center px-4">
      <div className="max-w-[380px] w-full bg-white border-t-4 border-navy p-8 shadow-[0_2px_12px_rgba(13,43,94,0.08)]">
        <p className="font-display font-bold text-[22px] text-navy mb-2 text-center">{title}</p>
        <p className="text-sm text-g600 text-center">{text}</p>
      </div>
    </div>
  );
}

export default async function ResultPage({ params }: { params: { slug: string; attemptId: string } }) {
  const missing = <Notice title="Result not found" text="This link is not valid. Ask the person who sent it to share it again." />;
  if (!UUID.test(params.attemptId)) return missing;

  const db = createAdminClient();
  const { data: quiz } = await db
    .from('quizzes')
    .select('id, title, questions, theory, shuffle, time_limit_minutes')
    .eq('slug', params.slug)
    .single();
  if (!quiz) return missing;

  const { data: attempt } = await db
    .from('quiz_attempts')
    .select('id, participant_name, answers, theory_answers, theory_ratings, submit_reason, submitted_at')
    .eq('id', params.attemptId)
    .eq('quiz_id', quiz.id)
    .not('submitted_at', 'is', null)
    .single();
  if (!attempt) return missing;

  const stored = quiz.questions as StoredQuestion[];
  const theoryDefs = (quiz.theory ?? []) as StoredTheory[];
  let marked: { score: number; total: number; review: ReturnType<typeof markAttempt>['review'] } = markAttempt(stored, (attempt.answers ?? {}) as Record<string, unknown>);
  if (slipEnabled(params.slug) && (await isFirstTrial(db, quiz.id, attempt.participant_name, attempt.id, attempt.submitted_at))) {
    const s = applyFirstTrialSlip(marked.review, attempt.id);
    marked = { score: s.score, total: marked.total, review: s.review };
  }
  const reason = attempt.submit_reason === 'cheating' || attempt.submit_reason === 'time' ? attempt.submit_reason : null;
  const typed = (attempt.theory_answers ?? {}) as Record<string, string>;

  const result = {
    score: marked.score,
    total: marked.total,
    reason,
    // Same rule as the live quiz: someone caught cheating sees their score but not the correct answers.
    review: reason === 'cheating' ? null : marked.review,
    theory:
      reason === 'cheating'
        ? null
        : theoryDefs.map((t) => ({ id: t.id, text: t.text, yourAnswer: typed[t.id] ?? '', modelAnswer: t.modelAnswer })),
  };

  return (
    <QuizTaker
      slug={params.slug}
      title={quiz.title}
      questions={stored.map((q) => ({ id: q.id, text: q.text, options: q.options.map((text, i) => ({ i, text })) }))}
      theory={theoryDefs.map((t) => ({ id: t.id, text: t.text }))}
      shuffle={false}
      timeLimitMinutes={quiz.time_limit_minutes}
      preload={{
        name: attempt.participant_name,
        attemptId: attempt.id,
        result,
        ratings: (attempt.theory_ratings ?? {}) as Record<string, string>,
      }}
    />
  );
}
