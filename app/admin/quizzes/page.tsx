import { createClient } from '@/lib/supabase/server';
import QuizBuilder from '@/components/quiz/QuizBuilder';
import QuizListItem from '@/components/quiz/QuizListItem';

export const dynamic = 'force-dynamic';

export default async function AdminQuizzesPage() {
  const supabase = createClient();
  const { data: quizzes } = await supabase
    .from('quizzes')
    .select('id, slug, title, published, closes_at, created_at, questions')
    .order('created_at', { ascending: false });

  // Count submitted attempts per quiz with an exact count query. Do not load every attempt row here:
  // the database returns at most 1,000 rows per request, which made quiz counts come out too low.
  const counts = new Map<string, number>();
  await Promise.all(
    (quizzes ?? []).map(async (q: { id: string }) => {
      const { count } = await supabase
        .from('quiz_attempts')
        .select('id', { count: 'exact', head: true })
        .eq('quiz_id', q.id)
        .not('submitted_at', 'is', null);
      counts.set(q.id, count ?? 0);
    }),
  );

  return (
    <div>
      <p className="font-condensed font-bold text-[10px] uppercase tracking-[.14em] text-gold mb-1.5">Distinction Programme</p>
      <h2 className="font-display font-bold text-2xl text-navy mb-4">Quizzes</h2>
      <QuizBuilder />

      <h3 className="font-display font-bold text-lg text-navy mb-3">Your quizzes</h3>
      {(quizzes ?? []).length === 0 && <p className="text-sm text-g600">No quizzes yet. Upload your first one above.</p>}
      <div className="flex flex-col gap-2">
        {(quizzes ?? []).map((q: any) => {
          const closed = !q.published || (q.closes_at && new Date(q.closes_at).getTime() < Date.now());
          return (
            <QuizListItem
              key={q.id}
              id={q.id}
              slug={q.slug}
              title={q.title}
              questionCount={q.questions.length}
              submitted={counts.get(q.id) ?? 0}
              closed={!!closed}
            />
          );
        })}
      </div>
    </div>
  );
}
