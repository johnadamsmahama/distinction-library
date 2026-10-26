'use client';

import { useEffect, useRef, useState } from 'react';

type Option = { i: number; text: string };
type PublicQuestion = { id: string; text: string; options: Option[] };
type PublicTheory = { id: string; text: string };
type ReviewItem = {
  id: string;
  text: string;
  options: string[];
  chosen: number | null;
  answer: number;
  correct: boolean;
  explanation: string | null;
};
type TheoryReview = { id: string; text: string; yourAnswer: string; modelAnswer: string };
type Result = {
  score: number;
  total: number;
  review: ReviewItem[] | null;
  theory: TheoryReview[] | null;
  reason: string | null;
};
type Step = { kind: 'mcq'; q: PublicQuestion } | { kind: 'theory'; t: PublicTheory };

const LETTERS = 'ABCDEFGH';
const RATINGS: { value: string; label: string }[] = [
  { value: 'got', label: 'Got it' },
  { value: 'partly', label: 'Partly' },
  { value: 'missed', label: 'Missed' },
];

function shuffled<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i];
    a[i] = a[j];
    a[j] = tmp;
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
  theory,
  shuffle,
  timeLimitMinutes,
}: {
  slug: string;
  title: string;
  questions: PublicQuestion[];
  theory: PublicTheory[];
  shuffle: boolean;
  timeLimitMinutes: number | null;
}) {
  const storeKey = `dl-quiz-${slug}`;
  const resultKey = `dl-quiz-result-${slug}`; // the finished result, so the student can open the link again and review it
  const [name, setName] = useState('');
  const [phase, setPhase] = useState<'intro' | 'taking' | 'done'>('intro');
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [deadline, setDeadline] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [theoryAnswers, setTheoryAnswers] = useState<Record<string, string>>({});
  const [ratings, setRatings] = useState<Record<string, string>>({});
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [warning, setWarning] = useState(false);
  const submittingRef = useRef(false);
  const switchesRef = useRef(0); // times the student left the quiz
  const theoryRef = useRef<Record<string, string>>({}); // latest typed theory answers, for saving and submitting
  const autoTriedRef = useRef(false); // the timer tries to auto-submit once; after that the student taps Submit

  // Shuffle once per page load. The answers sent back use each option's ORIGINAL index (i),
  // so the order on screen never affects marking. Theory questions keep their order.
  const [ordered, setOrdered] = useState<PublicQuestion[]>(questions);
  useEffect(() => {
    if (!shuffle) return;
    setOrdered(shuffled(questions).map((q) => ({ ...q, options: shuffled(q.options) })));
  }, [questions, shuffle]);

  const steps: Step[] = (ordered.map((q) => ({ kind: 'mcq', q }) as Step)).concat(
    theory.map((t) => ({ kind: 'theory', t }) as Step)
  );

  // Pick up an attempt in progress after a refresh.
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storeKey) || 'null');
      if (saved?.attemptId) {
        setName(saved.name || '');
        setAttemptId(saved.attemptId);
        setAnswers(saved.answers || {});
        theoryRef.current = saved.theory || {};
        setTheoryAnswers(saved.theory || {});
        setDeadline(saved.deadline ?? null);
        switchesRef.current = saved.switches || 0;
        if (switchesRef.current === 1) setWarning(true);
        setPhase('taking');
      } else {
        // No quiz in progress. Show the finished result from this device, if there is one.
        const done = JSON.parse(localStorage.getItem(resultKey) || 'null');
        if (done?.result) {
          setName(done.name || '');
          setAttemptId(done.attemptId || null);
          setRatings(done.ratings || {});
          setResult(done.result);
          setPhase('done');
        }
      }
    } catch {
      /* storage unavailable: start fresh */
    }
  }, [storeKey, resultKey]);

  function saveResult(data: Result, savedRatings: Record<string, string>) {
    try {
      localStorage.setItem(resultKey, JSON.stringify({ result: data, name, attemptId, ratings: savedRatings }));
    } catch {
      /* ignore */
    }
  }

  // Clears everything so the student can start the quiz from the beginning.
  function retake() {
    try {
      localStorage.removeItem(resultKey);
      localStorage.removeItem(storeKey);
    } catch {
      /* ignore */
    }
    submittingRef.current = false;
    autoTriedRef.current = false;
    switchesRef.current = 0;
    theoryRef.current = {};
    setResult(null);
    setAttemptId(null);
    setDeadline(null);
    setSecondsLeft(null);
    setIndex(0);
    setAnswers({});
    setTheoryAnswers({});
    setRatings({});
    setWarning(false);
    setError(null);
    setPhase('intro');
  }

  function persist(next: { attemptId: string; name: string; answers: Record<string, number>; deadline: number | null }) {
    try {
      localStorage.setItem(
        storeKey,
        JSON.stringify({ ...next, theory: theoryRef.current, switches: switchesRef.current })
      );
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

  async function submit(reason: 'time' | 'cheating' | null = null) {
    if (submittingRef.current || !attemptId) return;
    submittingRef.current = true;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/quiz/${slug}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
        body: JSON.stringify({
          attemptId,
          answers,
          theoryAnswers: theoryRef.current,
          switches: switchesRef.current,
          reason,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not submit.');
      try {
        localStorage.removeItem(storeKey);
      } catch {
        /* ignore */
      }
      setResult(data);
      saveResult(data, {});
      setPhase('done');
    } catch (e: any) {
      setError(reason === 'time' ? `${e.message} Go to the last question and tap Submit to try again.` : e.message);
      submittingRef.current = false;
      if (reason === 'time') setIndex(Math.max(0, steps.length - 1));
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
        submit('time');
      }
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, deadline, attemptId, answers]);

  // Leaving the quiz (switching app or tab): 1st time = warning when they return, 2nd time = auto-submit.
  useEffect(() => {
    if (phase !== 'taking' || !attemptId) return;
    const onVisibility = () => {
      if (document.hidden) {
        switchesRef.current += 1;
        persist({ attemptId, name, answers, deadline });
        if (switchesRef.current >= 2) submit('cheating');
      } else if (switchesRef.current === 1) {
        setWarning(true);
      } else if (switchesRef.current >= 2) {
        submit('cheating'); // tries again if the first attempt failed while the page was in the background
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, attemptId, answers, deadline, name]);

  function choose(qid: string, optionIndex: number) {
    const next = { ...answers, [qid]: optionIndex };
    setAnswers(next);
    if (attemptId) persist({ attemptId, name, answers: next, deadline });
  }

  function typeTheory(tid: string, value: string) {
    const next = { ...theoryRef.current, [tid]: value.slice(0, 5000) };
    theoryRef.current = next;
    setTheoryAnswers(next);
    if (attemptId) persist({ attemptId, name, answers, deadline });
  }

  function rate(tid: string, value: string) {
    const next = { ...ratings, [tid]: value };
    setRatings(next);
    if (result) saveResult(result, next);
    if (!attemptId) return;
    fetch(`/api/quiz/${slug}/rate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attemptId, ratings: next }),
    }).catch(() => {
      /* the rating is only for the lecturer's overview; failing quietly is fine */
    });
  }

  const step = steps[index];
  const answeredCount =
    Object.keys(answers).length + theory.filter((t) => (theoryAnswers[t.id] || '').trim() !== '').length;
  const last = index === steps.length - 1;

  const shell = (children: React.ReactNode) => (
    <div className="min-h-screen bg-off-white font-body text-g800">
      <div className="max-w-[560px] mx-auto px-4 py-6">{children}</div>
    </div>
  );

  if (phase === 'intro') {
    const parts: string[] = [];
    if (questions.length) parts.push(`${questions.length} objective question${questions.length > 1 ? 's' : ''}`);
    if (theory.length) parts.push(`${theory.length} theory question${theory.length > 1 ? 's' : ''}`);
    return shell(
      <div className="bg-white border-t-4 border-gold p-6 shadow-[0_2px_12px_rgba(13,43,94,0.08)]">
        <p className="font-condensed font-bold text-[11px] uppercase tracking-[.14em] text-gold mb-2">Distinction Programme</p>
        <h1 className="font-display font-bold text-[26px] leading-tight text-navy mb-3">{title}</h1>
        <p className="text-sm text-g600 mb-3">
          {parts.join(' and ')}
          {timeLimitMinutes ? ` · ${timeLimitMinutes} minutes` : ' · no time limit'}.
        </p>
        <p className="text-sm text-g600 mb-5">
          {questions.length > 0 && 'Objectives are marked for you when you submit. '}
          {theory.length > 0 && 'For theory, you type your answer and then compare it with the model answer and judge yourself. '}
          Do not leave this page during the quiz. Leaving twice submits it automatically as attempted cheating.
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
    const first = name.split(' ')[0];
    return shell(
      <div className="flex flex-col gap-4">
        <div className="bg-white border-t-4 border-gold p-6 text-center shadow-[0_2px_12px_rgba(13,43,94,0.08)]">
          {result.total > 0 ? (
            <>
              <p className="font-condensed font-bold text-[11px] uppercase tracking-[.14em] text-gold mb-1">
                {theory.length > 0 ? 'Section A score' : 'Your score'}
              </p>
              <p className="font-display font-bold text-[56px] leading-none text-navy">
                {result.score} / {result.total}
              </p>
              <p className="text-g600 mt-2">{pct}%. Well done for finishing, {first}.</p>
            </>
          ) : (
            <>
              <p className="font-display font-bold text-[26px] text-navy">Submitted, {first}</p>
              <p className="text-g600 mt-2">Your theory answers have been sent.</p>
            </>
          )}
        </div>
        {result.reason === 'cheating' && (
          <div className="bg-red-50 border-l-[3px] border-red-700 p-4 text-sm text-red-900">
            <p className="font-bold mb-1">Submitted automatically: attempted cheating</p>
            <p>You left the quiz twice, so it was submitted for you. Your lecturer can see this. The correct and model answers are not shown for this attempt.</p>
          </div>
        )}
        {result.reason === 'time' && (
          <div className="bg-[#FBF3E1] border-l-[3px] border-gold p-4 text-sm text-g800">Time ran out, so the quiz was submitted for you.</div>
        )}

        {(result.review ?? []).map((r, n) => (
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

        {result.theory && result.theory.length > 0 && (
          <>
            <div className="mt-2">
              <p className="font-condensed font-bold text-[11px] uppercase tracking-[.14em] text-gold mb-1">Section B · Theory</p>
              <p className="text-sm text-g600">
                Compare your answer with the model answer, then tell yourself honestly how you did. These are not marked for you.
              </p>
            </div>
            {result.theory.map((t, n) => (
              <div key={t.id} className="bg-white p-4 border-l-[3px] border-gold">
                <p className="font-condensed font-bold text-[12px] uppercase tracking-[.1em] text-gold mb-1">Theory {n + 1}</p>
                <p className="font-medium mb-3">{t.text}</p>
                <p className="font-condensed font-semibold text-[11px] uppercase tracking-[.1em] text-g600 mb-1">Your answer</p>
                <p className="text-[15px] bg-g100 px-3 py-2 mb-3 whitespace-pre-wrap break-words">
                  {t.yourAnswer || <span className="text-g500">No answer typed.</span>}
                </p>
                <p className="font-condensed font-semibold text-[11px] uppercase tracking-[.1em] text-mint-deep mb-1">Model answer</p>
                <p className="text-[15px] bg-mint-light/40 border border-mint-deep px-3 py-2 mb-3 whitespace-pre-wrap break-words">{t.modelAnswer}</p>
                <p className="font-condensed font-semibold text-[11px] uppercase tracking-[.1em] text-g600 mb-1.5">How did you do?</p>
                <div className="flex gap-2" role="group" aria-label={`Rate your answer to theory question ${n + 1}`}>
                  {RATINGS.map((r) => (
                    <button
                      key={r.value}
                      onClick={() => rate(t.id, r.value)}
                      aria-pressed={ratings[t.id] === r.value}
                      className={`flex-1 py-2.5 border font-condensed font-bold uppercase tracking-[.08em] text-[13px] ${ratings[t.id] === r.value ? 'bg-navy text-[#F6F1E3] border-navy' : 'bg-white text-navy border-[#D5DBE8]'}`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}

        <div className="bg-white p-4 text-sm text-g600 border-t border-g100">
          <p className="mb-2">
            Your result is kept on this phone. Open this same link again on this phone to review your score and answers.
            If you clear your browser data, it will be gone, so take a screenshot of anything you want to keep.
          </p>
          <button onClick={retake} className="text-navy underline font-semibold">Start the quiz again</button>
        </div>
      </div>
    );
  }

  if (!step) return shell(<p>Loading...</p>);

  const block = (e: React.SyntheticEvent) => e.preventDefault();
  return shell(
    <div
      className="bg-white shadow-[0_2px_12px_rgba(13,43,94,0.08)] select-none"
      style={{ WebkitTouchCallout: 'none' } as React.CSSProperties}
      onCopy={block}
      onCut={block}
      onContextMenu={block}
      onDragStart={block}
    >
      {warning && (
        <div role="alertdialog" aria-modal="true" aria-labelledby="warn-title" className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4">
          <div className="bg-white max-w-[360px] w-full p-6 border-t-4 border-red-700">
            <p id="warn-title" className="font-display font-bold text-[20px] text-navy mb-2">Warning: you left the quiz</p>
            <p className="text-sm text-g800 mb-4">
              Leaving the quiz is not allowed. If you leave it one more time, your quiz will be submitted automatically
              and marked as attempted cheating.
            </p>
            <button onClick={() => setWarning(false)} className="w-full bg-navy text-[#F6F1E3] font-condensed font-bold uppercase tracking-[.1em] py-3">
              I understand. Continue quiz
            </button>
          </div>
        </div>
      )}
      <div className="bg-navy text-[#F6F1E3] px-4 py-3">
        <div className="flex justify-between items-center font-condensed font-semibold text-[13px] uppercase tracking-[.12em] mb-2">
          <span>
            {step.kind === 'theory' ? 'Theory' : 'Question'} {index + 1} of {steps.length}
          </span>
          {secondsLeft !== null && (
            <span className={`px-2 py-0.5 tabular-nums ${secondsLeft <= 60 ? 'bg-red-600 text-white' : 'bg-gold text-navy-deep'}`} aria-live="off">
              {fmt(secondsLeft)}
            </span>
          )}
        </div>
        <div className="h-[5px] bg-white/25">
          <div className="h-full bg-gold transition-all" style={{ width: `${((index + 1) / steps.length) * 100}%` }} />
        </div>
      </div>
      <div className="p-4 flex flex-col gap-4">
        {step.kind === 'mcq' ? (
          <>
            {theory.length > 0 && (
              <p className="font-condensed font-bold text-[11px] uppercase tracking-[.14em] text-gold -mb-2">Section A · Objectives</p>
            )}
            <p className="font-display font-semibold text-[20px] leading-snug text-navy">{step.q.text}</p>
            <div className="flex flex-col gap-2.5" role="radiogroup" aria-label="Answer options">
              {step.q.options.map((o, pos) => {
                const selected = answers[step.q.id] === o.i;
                return (
                  <button
                    key={o.i}
                    role="radio"
                    aria-checked={selected}
                    onClick={() => choose(step.q.id, o.i)}
                    className={`flex gap-3 text-left w-full px-3 py-3.5 border-[1.5px] text-base ${selected ? 'border-navy bg-[#E9EFF6] shadow-[inset_4px_0_0_#0D2B5E]' : 'border-[#D5DBE8] bg-white'}`}
                  >
                    <span className="font-condensed font-bold text-gold w-4 flex-none">{LETTERS[pos]}</span>
                    <span>{o.text}</span>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <p className="font-condensed font-bold text-[11px] uppercase tracking-[.14em] text-gold -mb-2">Section B · Theory</p>
            <p className="font-display font-semibold text-[20px] leading-snug text-navy">{step.t.text}</p>
            <label htmlFor={`th-${step.t.id}`} className="sr-only">Your answer</label>
            <textarea
              id={`th-${step.t.id}`}
              value={theoryAnswers[step.t.id] || ''}
              onChange={(e) => typeTheory(step.t.id, e.target.value)}
              onPaste={block}
              rows={8}
              maxLength={5000}
              placeholder="Type your answer here. You will compare it with the model answer after you submit."
              className="w-full border-[1.5px] border-[#D5DBE8] px-3 py-3 text-base select-text focus:outline-none focus:border-navy"
            />
          </>
        )}
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
              onClick={() => submit(null)}
              disabled={busy}
              className="flex-1 bg-gold text-navy-deep font-condensed font-bold uppercase tracking-[.1em] py-3.5 disabled:opacity-60"
            >
              {busy ? 'Submitting...' : `Submit (${answeredCount}/${steps.length} answered)`}
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
