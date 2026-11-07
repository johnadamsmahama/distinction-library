import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import QuizActions from '@/components/quiz/QuizActions';
import QuizResultsList, { type ResultRow } from '@/components/quiz/QuizResultsList';
import type { StoredQuestion, StoredTheory } from '@/lib/quiz/server';

const LETTERS = 'ABCDEFGH';

export const dynamic = 'force-dynamic';

function mins(a: string, b: string) {
  const m = (new Date(b).getTime() - new Date(a).getTime()) / 60000;
  return m < 1 ? '<1 min' : `${Math.round(m)} min`;
}

export default async function QuizResultsPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: quiz } = await supabase.from('quizzes').select('*').eq('id', params.id).single();
  if (!quiz) notFound();

  const { data: rows } = await supabase
    .from('quiz_attempts')
    .select('id, participant_name, score, total, started_at, submitted_at, answers, tab_switches, submit_reason, theory_answers, theory_ratings')
    .eq('quiz_id', params.id)
    .not('submitted_at', 'is', null)
    .order('score', { ascending: false })
    .order('submitted_at', { ascending: true });

  const attempts = rows ?? [];
  const questions = quiz.questions as StoredQuestion[];
  const theoryQs = ((quiz.theory ?? []) as StoredTheory[]);
  const n = attempts.length;
  const avgPct = n ? Math.round(attempts.reduce((s: number, a: any) => s + (a.total ? a.score / a.total : 0), 0) / n * 100) : 0;
  const top = n ? attempts[0] : null;

  // One plain object per student for the results list: objectives missed and theory answers together.
  const resultRows: ResultRow[] = attempts.map((a: any, i: number) => {
    const ans = (a.answers ?? {}) as Record<string, unknown>;
    return {
      id: a.id,
      rank: i + 1,
      name: a.participant_name,
      score: a.score,
      total: a.total,
      pct: a.total ? Math.round((a.score / a.total) * 100) : 0,
      mins: mins(a.started_at, a.submitted_at),
      submitted: new Date(a.submitted_at).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' }),
      reason: a.submit_reason === 'cheating' ? 'cheating' : a.submit_reason === 'time' ? 'time' : null,
      switches: a.tab_switches ?? 0,
      cells: questions.map((q) => ans[q.id] === q.answer),
      miss: questions
        .map((q, qi) => ({ q, qi }))
        .filter(({ q }) => ans[q.id] !== q.answer)
        .map(({ q, qi }) => ({
          n: qi + 1,
          text: q.text,
          chose: typeof ans[q.id] === 'number' ? LETTERS[ans[q.id] as number] ?? null : null,
          correct: LETTERS[q.answer],
        })),
      theory: theoryQs.map((t, ti) => ({
        n: ti + 1,
        text: t.text,
        answer: a.theory_answers?.[t.id] ?? '',
        rating: a.theory_ratings?.[t.id] ?? null,
      })),
    };
  });

  // Share of students who got each question wrong (blank counts as wrong).
  const wrong = questions
    .map((q, i) => {
      const bad = attempts.filter((a: any) => a.answers?.[q.id] !== q.answer).length;
      return { n: i + 1, text: q.text, pct: n ? Math.round((bad / n) * 100) : 0 };
    })
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 5);

  const closed = !quiz.published || (quiz.closes_at && new Date(quiz.closes_at).getTime() < Date.now());

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Link href="/admin/quizzes" className="text-sm text-g600 underline">All quizzes</Link>
        <h2 className="font-display font-bold text-2xl text-navy mt-1">{quiz.title}</h2>
        <p className="text-sm text-g600 mb-3">
          {closed ? 'Closed' : 'Open'} · link: /quiz/{quiz.slug}
          {quiz.closes_at ? ` · closes ${new Date(quiz.closes_at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}` : ''}
        </p>
        <QuizActions id={quiz.id} slug={quiz.slug} published={quiz.published} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { l: 'Submitted', v: String(n) },
          { l: 'Average', v: `${avgPct}%` },
          { l: 'Top score', v: top ? `${top.score} / ${top.total}` : '-' },
          { l: 'Objectives', v: String(questions.length) },
          { l: 'Theory', v: String(theoryQs.length) },
        ].map((s) => (
          <div key={s.l} className="bg-white p-3 border-l-[3px] border-navy">
            <div className="font-display font-bold text-2xl text-navy">{s.v}</div>
            <div className="font-condensed text-[10px] uppercase tracking-wide text-g600">{s.l}</div>
          </div>
        ))}
      </div>

      {n > 0 && (
        <div className="bg-white p-4">
          <h3 className="font-display font-bold text-lg text-navy mb-3">Questions most people missed</h3>
          <div className="flex flex-col gap-3">
            {wrong.map((w) => (
              <div key={w.n} className="grid grid-cols-[40px_minmax(0,1fr)_44px] gap-2 items-center text-sm">
                <span className="font-condensed font-bold text-g600">Q{w.n}</span>
                <div className="min-w-0">
                  <p className="text-g600 text-[13px] truncate mb-1">{w.text}</p>
                  <div className="h-2.5 bg-g100"><div className="h-full bg-navy" style={{ width: `${w.pct}%` }} /></div>
                </div>
                <b className="text-right tabular-nums">{w.pct}%</b>
              </div>
            ))}
          </div>
          <p className="text-[12px] text-g600 mt-2">Percent of students who got the question wrong.</p>
        </div>
      )}

      {n === 0 ? (
        <div className="bg-white p-4">
          <h3 className="font-display font-bold text-lg text-navy mb-3">Results</h3>
          <p className="text-sm text-g600">No one has submitted yet. Share the link and results will appear here.</p>
        </div>
      ) : (
        <QuizResultsList rows={resultRows} slug={quiz.slug} title={quiz.title} hasObjectives={questions.length > 0} hasTheory={theoryQs.length > 0} />
      )}
    </div>
  );
}
