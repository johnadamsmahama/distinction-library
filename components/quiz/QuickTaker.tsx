'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type Option = { i: number; text: string };
type PublicQuestion = { id: string; text: string; options: Option[] };
type ReviewItem = {
  id: string;
  text: string;
  options: string[];
  chosen: number | null;
  answer: number;
  correct: boolean;
  explanation: string | null;
};
type Result = { score: number; total: number; review: ReviewItem[] };

const LETTERS = 'ABCDEFGH';

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function fmt(s: number) {
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export default function QuizTaker({
  slug,
  title,
  questions,
  shuffle,
  timeLimitMinutes,
}: {
  slug: string;
  title: string;
  questions: PublicQuestion[];
  shuffle: boolean;
  timeLimitMinutes: number | null;
}) {
  const storeKey = `dl-quiz-${slug}`;
  const [name, setName] = useState('');
  const [phase, setPhase] = useState<'intro' | 'taking' | 'done'>('intro');
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [deadline, setDeadline] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const submittingRef = useRef(false);
  const autoTriedRef = useRef(false); // the timer tries to auto-submit once; after that the student taps Submit

  // Shuffle once per page load. The answers sent back use each option's ORIGINAL index (i),
  // so the order on screen never affects marking.
  const [ordered, setOrdered] = useState<PublicQuestion[]>(questions);
  useEffect(() => {
    if (!shuffle) return;
    setOrdered(shuffled(questions).map((q) => ({ ...q, options: shuffled(q.options) })));
  }, [questions, shuffle]);

  // Pick up an attempt in progress after a refresh.
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storeKey) || 'null');
      if (saved?.attemptId) {
        setName(saved.name || '');
        setAttemptId(saved.attemptId);
        setAnswers(saved.answers || {});
        setDeadline(saved.deadline ?? null);
        setPhase('taking');
      }
    } catch {
      /* storage unavailable: start fresh */
    }
  }, [storeKey]);

  function persist(next: { attemptId: string; name: string; answers: Record<string, number>; deadline: number | null }) {
    try {
      localStorage.setItem(storeKey, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }

  async function start() {
    setError(null);
    if (name.trim().length < 2) {
      setError('Enter your name first.');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/quiz/${slug}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not start.');
      const dl = data.remainingSeconds ? Date.now() + data.remainingSeconds * 1000 : null;
      setAttemptId(data.attemptId);
      setDeadline(dl);
      persist({ attemptId: data.attemptId, name, answers: {}, deadline: dl });
      setPhase('taking');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function submit(auto = false) {
    if (submittingRef.current || !attemptId) return;
    submittingRef.current = true;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/quiz/${slug}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attemptId, answers }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not submit.');
      try {
        localStorage.removeItem(storeKey);
      } catch {
        /* ignore */
      }
      setResult(data);
      setPhase('done');
    } catch (e: any) {
      setError(auto ? `${e.message} Go to the last question and tap Submit to try again.` : e.message);
      submittingRef.current = false;
      if (auto) setIndex(ordered.length - 1);
    } finally {
      setBusy(false);
    }
  }

  // Countdown. Submits by itself at zero.
  useEffect(() => {
    if (phase !== 'taking' || !deadline) return;
    const tick = () => {
      const left = Math.max(0, Math.round((deadline - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left === 0 && !autoTriedRef.current) {
        autoTriedRef.current = true;
        submit(true);
      }
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, deadline, attemptId, answers]);

  function choose(qid: string, optionIndex: number) {
    const next = { ...answers, [qid]: optionIndex };
    setAnswers(next);
    if (attemptId) persist({ attemptId, name, answers: next, deadline });
  }

  const q = ordered[index];
  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);
  const last = index === ordered.length - 1;

  const shell = (children: React.ReactNode) => (
    <div className="min-h-screen bg-off-white font-body text-g800">
      <div className="max-w-[560px] mx-auto px-4 py-6">{children}</div>
    </div>
  );

  if (phase === 'intro') {
    return shell(
      <div className="bg-white border-t-4 border-gold p-6 shadow-[0_2px_12px_rgba(13,43,94,0.08)]">
        <p className="font-condensed font-bold text-[11px] uppercase tracking-[.14em] text-gold mb-2">Distinction Programme</p>
        <h1 className="font-display font-bold text-[26px] leading-tight text-navy mb-3">{title}</h1>
        <p className="text-sm text-g600 mb-5">
          {questions.length} questions
          {timeLimitMinutes ? ` · ${timeLimitMinutes} minutes` : ' · no time limit'}. You will see your score and the
          correct answers when you submit.
        </p>
        <label htmlFor="pname" className="block font-condensed font-semibold text-[12px] uppercase tracking-[.1em] text-g600 mb-1">
          Your full name
        </label>
        <input
          id="pname"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={60}
          autoComplete="name"
          className="w-full border border-[#D5DBE8] px-3 py-3 text-base mb-3 focus:outline-none focus:border-navy"
          placeholder="e.g. Ama Mensah"
        />
        {error && <p className="text-sm text-red-700 mb-3">{error}</p>}
        <button
          onClick={start}
          disabled={busy}
          className="w-full bg-gold text-navy-deep font-condensed font-bold uppercase tracking-[.1em] py-3.5 disabled:opacity-60"
        >
          {busy ? 'Starting...' : timeLimitMinutes ? 'Start quiz. The timer begins now.' : 'Start quiz'}
        </button>
      </div>
    );
  }

  if (phase === 'done' && result) {
    const pct = result.total ? Math.round((result.score / result.total) * 100) : 0;
    return shell(
      <div className="flex flex-col gap-4">
        <div className="bg-white border-t-4 border-gold p-6 text-center shadow-[0_2px_12px_rgba(13,43,94,0.08)]">
          <p className="font-condensed font-bold text-[11px] uppercase tracking-[.14em] text-gold mb-1">Your score</p>
          <p className="font-display font-bold text-[56px] leading-none text-navy">
            {result.score} / {result.total}
          </p>
          <p className="text-g600 mt-2">{pct}%. Your answers are saved, {name.split(' ')[0]}.</p>
        </div>
        {result.review.map((r, n) => (
          <div key={r.id} className="bg-white p-4 border-l-[3px]" style={{ borderLeftColor: r.correct ? '#4F8271' : '#B4402F' }}>
            <p className="font-condensed font-bold text-[12px] uppercase tracking-[.1em] mb-1" style={{ color: r.correct ? '#4F8271' : '#B4402F' }}>
              Question {n + 1} · {r.chosen === null ? 'Not answered' : r.correct ? 'Correct' : 'Wrong'}
            </p>
            <p className="font-medium mb-2">{r.text}</p>
            <ul className="flex flex-col gap-1 text-[15px]">
              {r.options.map((o, oi) => {
                const isAnswer = oi === r.answer;
                const isChosen = oi === r.chosen;
                return (
                  <li
                    key={oi}
                    className={`px-2 py-1.5 border ${isAnswer ? 'border-mint-deep bg-mint-light/40 font-semibold' : isChosen ? 'border-red-300 bg-red-50' : 'border-transparent'}`}
                  >
                    <span className="font-condensed font-bold mr-2">{LETTERS[oi]}</span>
                    {o}
                    {isAnswer && <span className="text-mint-deep"> ✓ correct</span>}
                    {isChosen && !isAnswer && <span className="text-red-700"> your answer</span>}
                  </li>
                );
              })}
            </ul>
            {r.explanation && <p className="text-sm text-g600 mt-2">{r.explanation}</p>}
          </div>
        ))}
      </div>
    );
  }

  if (!q) return shell(<p>Loading...</p>);

  return shell(
    <div className="bg-white shadow-[0_2px_12px_rgba(13,43,94,0.08)]">
      <div className="bg-navy text-[#F6F1E3] px-4 py-3">
        <div className="flex justify-between items-center font-condensed font-semibold text-[13px] uppercase tracking-[.12em] mb-2">
          <span>
            Question {index + 1} of {ordered.length}
          </span>
          {secondsLeft !== null && (
            <span className={`px-2 py-0.5 tabular-nums ${secondsLeft <= 60 ? 'bg-red-600 text-white' : 'bg-gold text-navy-deep'}`} aria-live="off">
              {fmt(secondsLeft)}
            </span>
          )}
        </div>
        <div className="h-[5px] bg-white/25">
          <div className="h-full bg-gold transition-all" style={{ width: `${((index + 1) / ordered.length) * 100}%` }} />
        </div>
      </div>
      <div className="p-4 flex flex-col gap-4">
        <p className="font-display font-semibold text-[20px] leading-snug text-navy">{q.text}</p>
        <div className="flex flex-col gap-2.5" role="radiogroup" aria-label="Answer options">
          {q.options.map((o, pos) => {
            const selected = answers[q.id] === o.i;
            return (
              <button
                key={o.i}
                role="radio"
                aria-checked={selected}
                onClick={() => choose(q.id, o.i)}
                className={`flex gap-3 text-left w-full px-3 py-3.5 border-[1.5px] text-base ${selected ? 'border-navy bg-[#E9EFF6] shadow-[inset_4px_0_0_#0D2B5E]' : 'border-[#D5DBE8] bg-white'}`}
              >
                <span className="font-condensed font-bold text-gold w-4 flex-none">{LETTERS[pos]}</span>
                <span>{o.text}</span>
              </button>
            );
          })}
        </div>
        {error && <p className="text-sm text-red-700">{error}</p>}
        <div className="flex gap-2">
          <button
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={index === 0}
            className="px-4 py-3.5 border border-navy text-navy font-condensed font-bold uppercase tracking-[.1em] disabled:opacity-40"
          >
            Back
          </button>
          {last ? (
            <button
              onClick={() => submit(false)}
              disabled={busy}
              className="flex-1 bg-gold text-navy-deep font-condensed font-bold uppercase tracking-[.1em] py-3.5 disabled:opacity-60"
            >
              {busy ? 'Submitting...' : `Submit (${answeredCount}/${ordered.length} answered)`}
            </button>
          ) : (
            <button
              onClick={() => setIndex((i) => i + 1)}
              className="flex-1 bg-navy text-[#F6F1E3] font-condensed font-bold uppercase tracking-[.1em] py-3.5"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
