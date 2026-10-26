import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import QuizBuilder from '@/components/quiz/QuizBuilder';

export const dynamic = 'force-dynamic';

export default async function AdminQuizzesPage() {
  const supabase = createClient();
  const { data: quizzes } = await supabase
    .from('quizzes')
    .select('id, slug, title, published, closes_at, created_at, questions')
    .order('created_at', { ascending: false });
  const { data: attempts } = await supabase.from('quiz_attempts').select('quiz_id').not('submitted_at', 'is', null);

  const counts = new Map<string, number>();
  (attempts ?? []).forEach((a: { quiz_id: string }) => counts.set(a.quiz_id, (counts.get(a.quiz_id) ?? 0) + 1));

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
            <Link key={q.id} href={`/admin/quizzes/${q.id}`} className="bg-white p-3 border-l-[3px] border-gold flex justify-between gap-3 items-center hover:brightness-[0.97]">
              <div className="min-w-0">
                <p className="font-semibold text-navy truncate">{q.title}</p>
                <p className="text-[12px] text-g600">
                  {q.questions.length} questions · {counts.get(q.id) ?? 0} submitted · /quiz/{q.slug}
                </p>
              </div>
              <span className={`font-condensed font-bold text-[11px] uppercase tracking-[.1em] px-2 py-1 flex-none ${closed ? 'bg-g100 text-g600' : 'bg-mint-light text-mint-deep'}`}>
                {closed ? 'Closed' : 'Open'}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
