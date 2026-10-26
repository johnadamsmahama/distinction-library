import type { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/admin';
import QuizTaker from '@/components/quiz/QuizTaker';
import type { StoredQuestion, StoredTheory } from '@/lib/quiz/server';

// Always fresh: a closed quiz must not keep showing from a cache.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Quiz — Distinction Programme', robots: { index: false, follow: false } };

function Notice({ title, text }: { title: string; text: string }) {
  return (
    <div className="min-h-screen bg-off-white font-body flex items-center justify-center px-4">
      <div className="max-w-[380px] w-full bg-white border-t-4 border-gold p-8 shadow-[0_2px_12px_rgba(13,43,94,0.08)]">
        <p className="font-display font-bold text-[22px] text-navy mb-2">{title}</p>
        <p className="text-sm text-g600">{text}</p>
      </div>
    </div>
  );
}

export default async function QuizPage({ params }: { params: { slug: string } }) {
  const { data: quiz } = await createAdminClient()
    .from('quizzes')
    .select('title, questions, theory, shuffle, time_limit_minutes, closes_at, published')
    .eq('slug', params.slug)
    .single();

  if (!quiz || !quiz.published) {
    return <Notice title="Quiz not found" text="This link is not open. Check it with the person who shared it." />;
  }
  if (quiz.closes_at && new Date(quiz.closes_at).getTime() < Date.now()) {
    return <Notice title="This quiz has closed" text="The closing time has passed. Ask your Distinction Programme leader if you need more time." />;
  }

  // Correct answers and explanations are deliberately dropped here: they never reach the browser.
  const questions = (quiz.questions as StoredQuestion[]).map((q) => ({
    id: q.id,
    text: q.text,
    options: q.options.map((text, i) => ({ i, text })),
  }));

  // Model answers stay on the server until the student has submitted.
  const theory = ((quiz.theory ?? []) as StoredTheory[]).map((t) => ({ id: t.id, text: t.text }));

  return (
    <QuizTaker
      slug={params.slug}
      title={quiz.title}
      questions={questions}
      theory={theory}
      shuffle={quiz.shuffle}
      timeLimitMinutes={quiz.time_limit_minutes}
    />
  );
}
