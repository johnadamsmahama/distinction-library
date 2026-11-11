import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import QuizBuilder from '@/components/quiz/QuizBuilder';
import NewQuizPanel from '@/components/quiz/NewQuizPanel';
import QuizList, { type QuizItem } from '@/components/quiz/QuizList';

export const dynamic = 'force-dynamic';

export default async function AdminQuizzesPage() {
  const supabase = createClient();
  const { data: quizzes } = await supabase
    .from('quizzes')
    .select('id, slug, title, published, closes_at, created_at, questions, theory')
    .order('created_at', { ascending: false });

  // Exact submitted count per quiz. Do not load every attempt row here:
  // the database returns at most 1,000 rows per request, which made counts come out too low.
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

  const items: QuizItem[] = (quizzes ?? []).map((q: any) => ({
    id: q.id,
    slug: q.slug,
    title: q.title,
    objectives: (q.questions ?? []).length,
    theory: (q.theory ?? []).length,
    submitted: counts.get(q.id) ?? 0,
    published: !!q.published,
    closesAt: q.closes_at ?? null,
    closed: !q.published || (!!q.closes_at && new Date(q.closes_at).getTime() < Date.now()),
  }));
  const totalSubmitted = items.reduce((s, q) => s + q.submitted, 0);
  const openNow = items.filter((q) => !q.closed).length;

  return (
    <div className="max-w-[760px] mx-auto bg-[#EFE8D6] p-3 sm:p-6">
      <header className="text-center mb-5">
        <svg className="mx-auto mb-2 drop-shadow-[0_4px_6px_rgba(120,90,10,.35)]" width="54" height="54" viewBox="0 0 66 66" aria-hidden="true">
          <defs>
            <linearGradient id="seal-g" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#E2BE5A" />
              <stop offset="1" stopColor="#B8902A" />
            </linearGradient>
          </defs>
          <circle cx="33" cy="33" r="31" fill="url(#seal-g)" />
          <circle cx="33" cy="33" r="26" fill="none" stroke="rgba(255,255,255,.7)" strokeWidth="1" strokeDasharray="2 3" />
          <text x="33" y="42" textAnchor="middle" fontFamily="Playfair Display, Georgia, serif" fontWeight="900" fontSize="28" fill="#0D2B5E">D</text>
        </svg>
        <p className="font-condensed font-semibold text-[11px] uppercase tracking-[.24em] text-[#9A7716]">Distinction Programme</p>
        <h2 className="font-display font-bold text-[30px] leading-[1.1] text-navy">Quizzes</h2>
        <div className="grid grid-cols-3 mt-4 pt-3.5 border-t border-[#DACFAE]">
          {[
            { v: String(items.length), l: 'Quizzes' },
            { v: totalSubmitted.toLocaleString('en-US'), l: 'Submissions' },
            { v: String(openNow), l: 'Open now' },
          ].map((s, i) => (
            <div key={s.l} className={i > 0 ? 'border-l border-dotted border-gold' : ''}>
              <b className="block font-display font-bold text-[24px] text-navy">{s.v}</b>
              <span className="font-condensed font-semibold text-[10.5px] uppercase tracking-[.14em] text-[#7A6F52]">{s.l}</span>
            </div>
          ))}
        </div>
      </header>

      <NewQuizPanel>
        <QuizBuilder />
      </NewQuizPanel>

      <QuizList items={items} />

      <div className="mt-6 flex justify-center">
        <Link
          href="/admin"
          className="font-condensed font-bold uppercase tracking-[.12em] text-[11.5px] px-3.5 min-h-[34px] border-[1.5px] border-navy text-navy flex items-center"
        >
          ← Admin home
        </Link>
      </div>
    </div>
  );
}
