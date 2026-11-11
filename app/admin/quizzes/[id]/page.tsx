import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import QuizActions from '@/components/quiz/QuizActions';
import QuizResultsList, { type ResultRow } from '@/components/quiz/QuizResultsList';
import type { StoredQuestion, StoredTheory } from '@/lib/quiz/server';
import { normalizeName } from '@/lib/quiz/names';

const LETTERS = 'ABCDEFGH';
const TZ = 'Africa/Accra';
const ROMAN = ['I', 'II', 'III'];

// Performance bands, by percent. Change the numbers here to change the grading.
const BANDS = [
  { label: 'Distinction', range: '70% and above', min: 70, color: '#C9A02C' },
  { label: 'Credit', range: '50% to 69%', min: 50, color: '#0D2B5E' },
  { label: 'Below 50%', range: 'Under 50%', min: 0, color: '#9AA5BD' },
];
const BIN_LABELS = ['0–19%', '20–39%', '40–59%', '60–79%', '80–100%'];

export const dynamic = 'force-dynamic';

function mins(a: string, b: string) {
  const m = (new Date(b).getTime() - new Date(a).getTime()) / 60000;
  return m < 1 ? '<1 min' : `${Math.round(m)} min`;
}

const fmtLong = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: TZ });

function Heading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="text-center mt-10 mb-4">
      <p className="font-condensed font-semibold text-[11.5px] uppercase tracking-[.22em] text-gold mb-1">{eyebrow}</p>
      <h3 className="font-display font-bold text-[22px] text-navy">{title}</h3>
    </div>
  );
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
  const theoryQs = (quiz.theory ?? []) as StoredTheory[];
  const n = attempts.length;
  const pctOf = (a: any) => (a.total ? (a.score / a.total) * 100 : 0);
  const avgPct = n ? Math.round(attempts.reduce((s: number, a: any) => s + pctOf(a), 0) / n) : 0;
  const top = n ? attempts[0] : null;

  // One plain object per student for the results list: objectives missed and theory answers together.
  const resultRows: ResultRow[] = attempts.map((a: any, i: number) => {
    const ans = (a.answers ?? {}) as Record<string, unknown>;
    return {
      id: a.id,
      rank: i + 1,
      name: normalizeName(a.participant_name ?? ''),
      score: a.score,
      total: a.total,
      pct: a.total ? Math.round((a.score / a.total) * 100) : 0,
      mins: mins(a.started_at, a.submitted_at),
      submitted: new Date(a.submitted_at).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short', timeZone: TZ }),
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

  // Score distribution (five 20% bins) and performance bands.
  const bins = [0, 0, 0, 0, 0];
  const bandCounts = BANDS.map(() => 0);
  attempts.forEach((a: any) => {
    const p = pctOf(a);
    bins[Math.min(4, Math.floor(p / 20))]++;
    bandCounts[BANDS.findIndex((b) => p >= b.min)]++;
  });
  const maxBin = Math.max(...bins, 1);

  const expired = !!quiz.closes_at && new Date(quiz.closes_at).getTime() < Date.now();
  const closed = !quiz.published || expired;
  const statusNote = !quiz.published
    ? 'switched off by an admin'
    : expired
      ? `deadline passed ${fmtLong(quiz.closes_at)}`
      : quiz.closes_at
        ? `closes ${fmtLong(quiz.closes_at)}`
        : 'no deadline';

  const navBtn = 'font-condensed font-bold uppercase tracking-[.12em] text-[11.5px] px-3.5 min-h-[34px] border-[1.5px] flex items-center justify-center';

  return (
    <div className="max-w-[760px] mx-auto bg-[#EFE8D6] p-3 sm:p-6">
      {/* Certificate header */}
      <section className="bg-[#FFFCF4] text-center px-6 py-9 shadow-[inset_0_0_0_8px_#FFFCF4,inset_0_0_0_9px_#C9A02C,0_20px_40px_-22px_rgba(60,45,10,.5)]">
        <svg className="mx-auto mb-2.5 drop-shadow-[0_4px_6px_rgba(120,90,10,.35)]" width="66" height="66" viewBox="0 0 66 66" aria-hidden="true">
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
        <p className="font-condensed font-semibold text-[12px] uppercase tracking-[.28em] text-[#9A7716]">Distinction Programme</p>
        <h2 className="font-display font-bold text-[27px] leading-[1.18] text-navy mt-3 mb-3">{quiz.title}</h2>
        <div className="flex items-center gap-3 text-gold text-[11px] mx-5 mb-3" aria-hidden="true">
          <span className="flex-1 h-px bg-gradient-to-r from-transparent to-gold" />◆<span className="flex-1 h-px bg-gradient-to-l from-transparent to-gold" />
        </div>
        <p className="font-display italic font-semibold text-[15px] text-[#7A6F52]">
          <b className="not-italic text-g800">{closed ? 'Closed' : 'Open'}</b> — {statusNote}
        </p>
        <p className="text-[12.5px] text-[#7A6F52] mt-1 mb-4">/quiz/{quiz.slug}</p>
        <QuizActions id={quiz.id} slug={quiz.slug} published={quiz.published} closed={closed} />

        <div className="grid grid-cols-4 mt-7 pt-5 border-t border-[#DACFAE]">
          {[
            { l: 'Submitted', v: String(n) },
            { l: 'Average', v: `${avgPct}%` },
            { l: 'Top score', v: top ? `${top.score}/${top.total}` : '-' },
            { l: 'Questions', v: String(questions.length + theoryQs.length) },
          ].map((s, i) => (
            <div key={s.l} className={i > 0 ? 'border-l border-dotted border-gold' : ''}>
              <b className="block font-display font-bold text-[24px] text-navy">{s.v}</b>
              <span className="font-condensed font-semibold text-[10.5px] uppercase tracking-[.14em] text-[#7A6F52]">{s.l}</span>
            </div>
          ))}
        </div>
        <p className="text-[12px] text-[#7A6F52] mt-2">{questions.length} objective · {theoryQs.length} theory</p>
      </section>

      {n === 0 ? (
        <section className="bg-[#FFFCF4] mt-8 p-6 text-center">
          <p className="font-display font-bold text-lg text-navy mb-1">No results yet</p>
          <p className="text-sm text-[#7A6F52]">No one has submitted yet. Share the link and results will appear here.</p>
        </section>
      ) : (
        <>
          <Heading eyebrow="Roll of honour" title="The top three" />
          <div className="bg-[#FFFCF4] px-4 py-1.5 shadow-[0_8px_20px_-16px_rgba(60,45,10,.6)]">
            {resultRows.slice(0, 3).map((r, i) => (
              <div key={r.id} className="flex items-baseline gap-2.5 py-3">
                <span className="font-display italic font-bold text-2xl text-gold w-8 flex-none">{ROMAN[i]}</span>
                <span className="font-semibold text-[15px] min-w-0 break-words">{r.name}</span>
                <span className="flex-1 min-w-[14px] border-b-2 border-dotted border-gold/70 -translate-y-1" aria-hidden="true" />
                <b className="font-display font-bold text-[22px] text-navy whitespace-nowrap">
                  {r.score}
                  <span className="font-medium text-xs text-[#7A6F52]">/{r.total}</span>
                </b>
              </div>
            ))}
          </div>

          <Heading eyebrow="Distribution" title="How the class scored" />
          <div className="flex items-end gap-2 h-[130px] border-b border-g800">
            {bins.map((b, i) => (
              <div key={BIN_LABELS[i]} className="flex-1 h-full flex items-end justify-center">
                <div className={`w-full max-w-[34px] relative ${b === maxBin ? 'bg-gold' : 'bg-navy'}`} style={{ height: `${(b / maxBin) * 100}%`, minHeight: 3 }}>
                  <span className="absolute -top-[18px] left-0 right-0 text-center font-condensed font-semibold text-[12px]">{b}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-1.5">
            {BIN_LABELS.map((l) => (
              <span key={l} className="flex-1 text-center font-condensed font-semibold text-[11px] text-[#7A6F52]">{l}</span>
            ))}
          </div>

          <Heading eyebrow="Performance bands" title="Where everyone landed" />
          <div className="bg-[#FFFCF4] px-4 shadow-[0_8px_20px_-16px_rgba(60,45,10,.6)]">
            {BANDS.map((b, i) => {
              const share = (bandCounts[i] / n) * 100;
              return (
                <div key={b.label} className="py-4 border-b border-[#DACFAE] last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 rotate-45 flex-none" style={{ background: b.color }} />
                    <div className="flex-1 min-w-0">
                      <b className="block font-display font-bold text-[17px] text-navy">{b.label}</b>
                      <span className="font-condensed font-semibold text-[11px] uppercase tracking-[.14em] text-[#7A6F52]">{b.range}</span>
                    </div>
                    <div className="text-right">
                      <b className="font-display font-bold text-[28px] leading-none text-navy">{bandCounts[i]}</b>
                      <span className="block font-condensed font-semibold text-[11px] uppercase tracking-[.12em] text-[#7A6F52] mt-0.5">{Math.round(share)}% of class</span>
                    </div>
                  </div>
                  <div className="h-[5px] bg-[#DACFAE] mt-3">
                    <div className="h-full" style={{ width: `${share}%`, background: b.color }} />
                  </div>
                </div>
              );
            })}
          </div>

          {wrong.length > 0 && (
            <>
              <Heading eyebrow="Questions of note" title="Most often missed" />
              <div className="bg-[#FFFCF4] px-4 py-1.5 shadow-[0_8px_20px_-16px_rgba(60,45,10,.6)]">
                {wrong.map((w) => (
                  <div key={w.n} className="flex items-baseline gap-2 py-2.5">
                    <span className="font-display italic font-bold text-[17px] text-gold w-9 flex-none">Q{String(w.n).padStart(2, '0')}</span>
                    <span className="text-[14px] truncate min-w-0">{w.text}</span>
                    <span className="flex-1 min-w-[14px] border-b-2 border-dotted border-gold/70 -translate-y-1" aria-hidden="true" />
                    <b className="font-display font-bold text-[18px] text-navy">{w.pct}%</b>
                  </div>
                ))}
              </div>
              <p className="text-[12px] text-[#7A6F52] mt-2 text-center">Percent of students who got the question wrong.</p>
            </>
          )}

          <Heading eyebrow="The register" title="All results" />
          <QuizResultsList rows={resultRows} slug={quiz.slug} title={quiz.title} hasObjectives={questions.length > 0} hasTheory={theoryQs.length > 0} />
        </>
      )}

      {/* Navigation back */}
      <div className="mt-10 flex flex-wrap gap-2 justify-center">
        <Link href="/admin/quizzes" className={`${navBtn} bg-navy text-white border-navy`}>
          ← All quizzes
        </Link>
        <Link href="/admin" className={`${navBtn} border-navy text-navy`}>
          Admin home
        </Link>
      </div>
    </div>
  );
}
