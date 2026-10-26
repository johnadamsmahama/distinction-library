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

const PAPER_CSS = `
.qp-bg{--paper:#FBF6E8;--rule:#D9CDA8;--red:#8A2E2E;--ink:#2A2418;--pen:#24477A;--mut:#8A7A5C;--green:#2E6B4A;min-height:100vh;background:var(--paper) linear-gradient(transparent 27px,var(--rule) 27px) 0 3px/100% 28px;color:var(--ink);font:15px/28px Georgia,'Times New Roman',serif}
.qp{position:relative;max-width:560px;margin:0 auto;min-height:100vh;padding-bottom:28px}
.qp::before,.qp::after{content:'';position:absolute;top:0;bottom:0;width:2px;background:#C0504D;opacity:.8;pointer-events:none}
.qp::before{left:28px}.qp::after{right:28px}
.qp *{box-sizing:border-box;border-radius:0}
.qp-lock{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}.qp-lock textarea{-webkit-user-select:text;user-select:text}
:where(.qp) button,:where(.qp) input,:where(.qp) textarea{font:inherit;color:inherit}.qp button{cursor:pointer}
.qp-top{height:56px;padding:0 40px;display:flex;justify-content:space-between;align-items:center}
.qp-orgsm{font-size:10.5px;font-weight:700;letter-spacing:.12em;text-align:center;color:var(--mut)}.qp-orgsm .qp-x{font-size:13px;line-height:12px;padding:0 4px}
.qp-timer{font:700 14px/24px Georgia,serif;border:1px solid var(--red);color:var(--red);padding:0 8px;background:var(--paper);font-variant-numeric:tabular-nums}.qp-timer.low{background:var(--red);color:var(--paper)}
.qp-m{padding:0 40px}.qp-intro{padding-top:28px}
.qp-cap,.qp-lbl{font-size:11.5px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--mut)}
.qp-hd{position:relative;text-align:center}.qp-hd::after{content:'';position:absolute;left:0;right:0;top:100%;height:4px;border-top:3px double var(--red)}
.qp-org{position:relative;font-size:15px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#1B1710}
.qp-x{position:absolute;left:50%;top:28px;transform:translate(-50%,-50%);font-size:18px;line-height:16px;font-weight:700;letter-spacing:0;background:var(--paper);padding:0 6px}
.qp-title{font:800 21px/28px Georgia,serif;color:#1B1710;text-transform:uppercase;letter-spacing:.05em}
.qp-meta{text-align:center;font-style:italic;font-size:14px;color:#6B5D3F}
.qp-ins{margin-top:28px;font-size:13px;font-weight:800;letter-spacing:.2em;text-transform:uppercase;color:var(--red);text-align:center}
.qp-rules{margin-bottom:28px;counter-reset:r;list-style:none;padding:0}.qp-rules li{counter-increment:r;display:flex;gap:4px;line-height:28px;color:var(--red);font-weight:600}.qp-rules li::before{content:counter(r) '.';flex:none;width:22px;font-weight:800}
.qp-label{display:block;font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--red)}
.qp-input{display:block;width:100%;height:31px;margin-bottom:-3px;padding:0;border:0;border-bottom:2px solid var(--pen);background:transparent;font-size:19px;color:var(--pen);outline:0}.qp-input::placeholder{color:var(--mut);font-style:italic}
.qp-err{color:var(--red);font-style:italic;line-height:28px}
.qp-btn{height:36px;margin:10px 0;padding:0 18px;border:0;font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase}.qp-btn:disabled{opacity:.4;cursor:default}
.qp-red{background:var(--red);color:#F6EFDC}.qp-out{background:var(--paper);color:var(--red);border:1px solid var(--red)}.qp-wide{width:100%}
.qp-fine{font-size:13px;font-style:italic}
.qp-head{display:flex;justify-content:space-between;flex-wrap:wrap;column-gap:12px;line-height:28px}
.qp-q{font:600 19px/28px Georgia,serif;color:#1B1710;margin-bottom:28px}
.qp-opts{margin-bottom:28px;display:flex;flex-direction:column}
.qp-opt{display:flex;gap:10px;width:100%;padding:0;border:0;background:none;text-align:left;font:16px/28px Georgia,serif;color:var(--ink)}
.qp-opt b{flex:none;align-self:flex-start;width:28px;height:28px;text-align:center;font-weight:400}.qp-opt b::before{content:'('}.qp-opt b::after{content:')'}
.qp-opt.sel{color:var(--pen);font-weight:700}.qp-opt.sel b{color:var(--pen);outline:1.5px solid var(--pen);outline-offset:-3px;border-radius:50%}.qp-opt.sel b::before,.qp-opt.sel b::after{content:''}
.qp-ta{display:block;width:100%;height:224px;resize:none;padding:0;border:0;background:transparent;font:15px/28px Georgia,serif;color:var(--pen);outline:0;margin-bottom:28px}.qp-ta::placeholder{color:var(--mut);font-style:italic}
.qp-stky{position:sticky;top:0;z-index:3;background:var(--paper);border-bottom:2px solid var(--red)}.qp-gap{height:28px}
.qb{position:relative;margin-bottom:28px}.qb .qp-q{display:flex;gap:6px;font-size:17px;margin-bottom:0}.qb .qp-q .n{flex:none;width:22px;color:var(--red)}.qb .qp-opts{margin:0}.qb .qp-ta{margin:28px 0 0}
.qp-flash{animation:qpfl 1.6s ease-out}@keyframes qpfl{0%,60%{box-shadow:inset 3px 0 0 var(--red)}100%{box-shadow:none}}
.qp-nav{display:flex;gap:10px;height:56px;align-items:center}.qp-nav .qp-btn{margin:0}.qp-nav .qp-grow{flex:1}
.qp-ov{position:fixed;inset:0;z-index:50;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(0,0,0,.7)}
.qp-dlg{max-width:360px;width:100%;padding:24px;background:var(--paper);border-top:4px solid var(--red);line-height:24px;color:var(--ink)}.qp-dlg h3{font-size:19px;font-weight:700;color:var(--red)}.qp-dlg p{margin:8px 0 18px}.qp-dlg .qp-btn{margin:0}
.qp-score{position:relative}.qp-big{height:56px}.qp-big b{display:inline-block;background:var(--paper);padding:0 8px;font:800 56px/48px Georgia,serif;color:var(--red);border-bottom:3px double var(--red);transform:rotate(-3deg);margin-right:10px}.qp-big span{font-size:22px}
.qp-big2{font:800 24px/28px Georgia,serif;color:var(--red)}
.qp-pct{font-style:italic}
.qp-stamp{position:absolute;right:0;top:30px;background:var(--paper);border:2px solid var(--red);color:var(--red);font-weight:700;font-size:11px;line-height:18px;letter-spacing:.1em;text-transform:uppercase;padding:3px 9px;transform:rotate(5deg)}
.qp-note{border-left:2px solid var(--red);padding-left:12px;margin-bottom:28px}.qp-note.time{border-color:var(--mut)}.qp-note b{color:var(--red);display:block}
.qp-sec{margin-top:28px;font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--red)}
.qp-rv{position:relative;margin-bottom:28px}.qp-rv::before{position:absolute;left:-38px;top:0;font-size:22px;color:var(--red)}.qp-rv.ok::before{content:'\\2713';color:var(--green)}.qp-rv.no::before{content:'\\2717'}.qp-rv.th::before{content:none}
.qp-rl{font-size:11.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--mut)}
.qp-rq{font-size:15.5px;font-weight:600}
.qp-rv li{font-size:15px}.qp-rv li b{font-weight:400;margin-right:6px}.qp-rv li em{font-style:normal;white-space:nowrap}
.qp-rv li.ans{color:var(--green);font-weight:700}.qp-rv li.ans em{font-size:11px;letter-spacing:.1em;text-transform:uppercase;margin-left:4px}
.qp-rv li.wr em{color:var(--red);font-weight:700;font-size:13px;margin-left:4px}
.qp-ex,.qp-lead,.qp-foot{font-style:italic;font-size:14px;color:#6B5D3F}.qp-lead{margin-bottom:28px}
.qp-yours{color:var(--pen);white-space:pre-wrap;word-break:break-word;margin-bottom:28px}
.qp-model{color:var(--red);border-left:2px solid var(--red);padding-left:12px;white-space:pre-wrap;word-break:break-word;margin-bottom:28px}.qp-lbl.g{color:var(--red)}
.qp-rate{display:flex;gap:8px;margin:10px 0}.qp-rate button{flex:1;height:36px;border:1px solid var(--red);background:var(--paper);color:var(--red);font-weight:700;font-size:13px;letter-spacing:.08em;text-transform:uppercase}.qp-rate button[aria-pressed=true]{background:var(--red);color:var(--paper)}
.qp-foot{margin-top:28px}.qp-lnk{background:none;border:0;padding:0;text-decoration:underline;font-weight:700;font-size:14px;color:var(--red)}
`;

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
  const [checked, setChecked] = useState(false); // the student tapped Submit once with questions still unanswered
  const [flashId, setFlashId] = useState<string | null>(null);
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
    setChecked(false);
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
      setError(reason === 'time' ? `${e.message} Scroll down and tap Submit to try again.` : e.message);
      submittingRef.current = false;
      if (reason === 'time') window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
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
    // Tapping the circled answer again clears it.
    const next = { ...answers };
    if (next[qid] === optionIndex) delete next[qid];
    else next[qid] = optionIndex;
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

  const totalSteps = ordered.length + theory.length;
  const answeredCount =
    Object.keys(answers).length + theory.filter((t) => (theoryAnswers[t.id] || '').trim() !== '').length;
  // Questions still unanswered, in paper order. The first Submit tap goes to the first of these instead of submitting.
  const missing = [
    ...ordered.filter((q) => answers[q.id] === undefined).map((q) => q.id),
    ...theory.filter((t) => (theoryAnswers[t.id] || '').trim() === '').map((t) => t.id),
  ];

  function askSubmit() {
    if (missing.length > 0 && !checked) {
      setChecked(true);
      setFlashId(missing[0]);
      setTimeout(() => setFlashId(null), 1800);
      document.getElementById(`q-${missing[0]}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }
    submit(null);
  }

  const block = (e: React.SyntheticEvent) => e.preventDefault();

  const shell = (children: React.ReactNode, locked = false) => (
    <div className="qp-bg">
      <style>{PAPER_CSS}</style>
      <div
        className={`qp${locked ? ' qp-lock' : ''}`}
        onCopy={locked ? block : undefined}
        onCut={locked ? block : undefined}
        onContextMenu={locked ? block : undefined}
        onDragStart={locked ? block : undefined}
      >
        {children}
      </div>
    </div>
  );

  const topBar = (withTimer: boolean, sticky = false) => (
    <header className={`qp-top${sticky ? ' qp-stky' : ''}`}>
      <p className="qp-org qp-orgsm">
        The Distinction Library<span className="qp-x">×</span>
        <br />
        Distinction Programme
      </p>
      {withTimer && secondsLeft !== null && (
        <span className={`qp-timer${secondsLeft <= 60 ? ' low' : ''}`} aria-live="off">
          {fmt(secondsLeft)}
        </span>
      )}
    </header>
  );

  if (phase === 'intro') {
    const parts: string[] = [];
    if (questions.length) parts.push(`${questions.length} objective question${questions.length > 1 ? 's' : ''}`);
    if (theory.length) parts.push(`${theory.length} theory question${theory.length > 1 ? 's' : ''}`);
    const rules: string[] = [];
    if (questions.length > 0) rules.push('Objectives are marked for you when you submit.');
    if (theory.length > 0) rules.push('For theory, type your answer, then compare it with the model answer and judge yourself.');
    rules.push('After you start, do not switch tabs or apps. Leaving the quiz twice submits it automatically.');
    return shell(
      <main className="qp-m qp-intro">
        <div className="qp-hd">
          <p className="qp-org">
            The Distinction Library<span className="qp-x">×</span>
            <br />
            Distinction Programme
          </p>
          <h1 className="qp-title">{title}</h1>
        </div>
        <p className="qp-meta">
          {parts.join(' and ')}
          <br />
          {timeLimitMinutes ? `Time allowed: ${timeLimitMinutes} minutes` : 'No time limit'}
        </p>
        <h2 className="qp-ins">Instructions</h2>
        <ol className="qp-rules">
          {rules.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ol>
        <label htmlFor="pname" className="qp-label">
          Your full name
        </label>
        <input
          id="pname"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={60}
          autoComplete="name"
          className="qp-input"
          placeholder="John Adams Mahama"
        />
        {error && <p className="qp-err">{error}</p>}
        <button onClick={start} disabled={busy} className="qp-btn qp-red qp-wide">
          {busy ? 'Starting...' : 'Start quiz'}
        </button>
        {timeLimitMinutes ? <p className="qp-fine">The timer begins as soon as you tap Start.</p> : null}
      </main>
    );
  }

  if (phase === 'done' && result) {
    const pct = result.total ? Math.round((result.score / result.total) * 100) : 0;
    const first = name.split(' ')[0];
    return shell(
      <>
        {topBar(false)}
        <main className="qp-m">
          <section className="qp-score">
            {result.total > 0 ? (
              <>
                <p className="qp-cap">{theory.length > 0 ? 'Section A score' : 'Your score'}</p>
                <p className="qp-big">
                  <b>{result.score}</b>
                  <span>/ {result.total}</span>
                </p>
                <p className="qp-pct">
                  {pct}%. Well done for finishing, {first}.
                </p>
              </>
            ) : (
              <>
                <p className="qp-big2">Submitted, {first}</p>
                <p className="qp-pct">Your theory answers have been sent.</p>
              </>
            )}
            <span className="qp-stamp">Submitted</span>
          </section>

          {result.reason === 'cheating' && (
            <div className="qp-note">
              <b>Submitted automatically: attempted cheating</b>
              <p>
                You left the quiz twice, so it was submitted for you. Your lecturer can see this. The correct and model answers are not shown
                for this attempt.
              </p>
            </div>
          )}
          {result.reason === 'time' && (
            <div className="qp-note time">
              <p>Time ran out, so the quiz was submitted for you.</p>
            </div>
          )}

          {(result.review ?? []).length > 0 && <h3 className="qp-sec">{theory.length > 0 ? 'Section A · Review' : 'Review'}</h3>}
          {(result.review ?? []).map((r, n) => (
            <article key={r.id} className={`qp-rv ${r.correct ? 'ok' : 'no'}`}>
              <p className="qp-rl">
                Question {n + 1} · {r.chosen === null ? 'Not answered' : r.correct ? 'Correct' : 'Wrong'}
              </p>
              <p className="qp-rq">{r.text}</p>
              <ul>
                {r.options.map((o, oi) => {
                  const isAnswer = oi === r.answer;
                  const isChosen = oi === r.chosen;
                  return (
                    <li key={oi} className={isAnswer ? 'ans' : isChosen ? 'wr' : ''}>
                      <b>{LETTERS[oi]}</b>
                      {o}
                      {isAnswer && <em>✓ correct</em>}
                      {isChosen && !isAnswer && <em>✗</em>}
                    </li>
                  );
                })}
              </ul>
              {r.explanation && <p className="qp-ex">{r.explanation}</p>}
            </article>
          ))}

          {result.theory && result.theory.length > 0 && (
            <>
              <h3 className="qp-sec">Section B · Theory</h3>
              <p className="qp-lead">
                Compare your answer with the model answer, then tell yourself honestly how you did. These are not marked for you.
              </p>
              {result.theory.map((t, n) => (
                <article key={t.id} className="qp-rv th">
                  <p className="qp-rl">Theory {n + 1}</p>
                  <p className="qp-rq">{t.text}</p>
                  <p className="qp-lbl">Your answer</p>
                  <p className="qp-yours">{t.yourAnswer || 'No answer typed.'}</p>
                  <p className="qp-lbl g">Model answer</p>
                  <p className="qp-model">{t.modelAnswer}</p>
                  <p className="qp-lbl">How did you do?</p>
                  <div className="qp-rate" role="group" aria-label={`Rate your answer to theory question ${n + 1}`}>
                    {RATINGS.map((r) => (
                      <button key={r.value} onClick={() => rate(t.id, r.value)} aria-pressed={ratings[t.id] === r.value}>
                        {r.label}
                      </button>
                    ))}
                  </div>
                </article>
              ))}
            </>
          )}

          <p className="qp-foot">
            Your result is kept on this phone. Open this same link again on this phone to review your score and answers. If you clear your
            browser data, it will be gone, so take a screenshot of anything you want to keep.
          </p>
          <button onClick={retake} className="qp-lnk">
            Start the quiz again
          </button>
        </main>
      </>
    );
  }

  if (totalSteps === 0) return shell(<p className="qp-m">This quiz has no questions yet.</p>);

  return shell(
    <>
      {warning && (
        <div role="alertdialog" aria-modal="true" aria-labelledby="warn-title" className="qp-ov">
          <div className="qp-dlg">
            <h3 id="warn-title">Warning: you left the quiz</h3>
            <p>
              Leaving the quiz is not allowed. If you leave it one more time, your quiz will be submitted automatically and marked as
              attempted cheating.
            </p>
            <button onClick={() => setWarning(false)} className="qp-btn qp-red qp-wide">
              I understand. Continue quiz
            </button>
          </div>
        </div>
      )}
      {topBar(true, true)}
      <main className="qp-m">
        <div className="qp-head">
          <span className="qp-cap">{theory.length > 0 ? 'Section A · Objectives' : 'Objectives'}</span>
          <span className="qp-cap">
            {answeredCount} of {totalSteps} answered
          </span>
        </div>
        <div className="qp-gap" />
        {ordered.map((q, n) => (
          <section key={q.id} id={`q-${q.id}`} className={`qb${flashId === q.id ? ' qp-flash' : ''}`}>
            <h2 className="qp-q">
              <span className="n">{n + 1}.</span>
              <span>{q.text}</span>
            </h2>
            <div className="qp-opts" role="radiogroup" aria-label={`Answer options for question ${n + 1}`}>
              {q.options.map((o, pos) => {
                const selected = answers[q.id] === o.i;
                return (
                  <button
                    key={o.i}
                    role="radio"
                    aria-checked={selected}
                    onClick={() => choose(q.id, o.i)}
                    className={`qp-opt${selected ? ' sel' : ''}`}
                  >
                    <b>{LETTERS[pos]}</b>
                    <span>{o.text}</span>
                  </button>
                );
              })}
            </div>
            {checked && answers[q.id] === undefined && <p className="qp-err">Not answered yet</p>}
          </section>
        ))}
        {theory.length > 0 && (
          <>
            <div className="qp-head">
              <span className="qp-cap">Section B · Theory</span>
            </div>
            {theory.map((t, n) => (
              <section key={t.id} id={`q-${t.id}`} className={`qb${flashId === t.id ? ' qp-flash' : ''}`}>
                <h2 className="qp-q">
                  {theory.length > 1 && <span className="n">{n + 1}.</span>}
                  <span>{t.text}</span>
                </h2>
                <label htmlFor={`th-${t.id}`} className="sr-only">
                  Your answer
                </label>
                <textarea
                  id={`th-${t.id}`}
                  value={theoryAnswers[t.id] || ''}
                  onChange={(e) => typeTheory(t.id, e.target.value)}
                  onPaste={block}
                  rows={8}
                  maxLength={5000}
                  placeholder="Type your answer here. You will compare it with the model answer after you submit."
                  className="qp-ta"
                />
                {checked && !(theoryAnswers[t.id] || '').trim() && <p className="qp-err">Not answered yet</p>}
              </section>
            ))}
          </>
        )}
        {error && <p className="qp-err">{error}</p>}
        <div className="qp-nav">
          <button onClick={askSubmit} disabled={busy} className="qp-btn qp-red qp-grow">
            {busy
              ? 'Submitting...'
              : `${checked && missing.length > 0 ? 'Submit anyway' : 'Submit'} (${answeredCount}/${totalSteps} answered)`}
          </button>
        </div>
      </main>
    </>,
    true
  );
}
