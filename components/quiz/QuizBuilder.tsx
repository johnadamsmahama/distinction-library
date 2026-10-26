'use client';

import { useRef, useState } from 'react';

type Q = { id: string; text: string; options: string[]; answer: number | null; explanation: string | null };

const LETTERS = 'ABCDEFGH';

export default function QuizBuilder() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [pasted, setPasted] = useState('');
  const [questions, setQuestions] = useState<Q[] | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [filename, setFilename] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [timeLimit, setTimeLimit] = useState('20');
  const [closesAt, setClosesAt] = useState('');
  const [shuffle, setShuffle] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [published, setPublished] = useState<{ id: string; link: string } | null>(null);
  const [copied, setCopied] = useState(false);

  async function readFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/admin/quizzes/parse', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not read the file.');
      setQuestions(data.questions);
      setWarnings(data.warnings || []);
      setFilename(data.filename);
      if (!title) setTitle((data.filename || '').replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' '));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function readPasted() {
    if (!pasted.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/quizzes/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: pasted }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not read the text.');
      setQuestions(data.questions);
      setWarnings(data.warnings || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  function update(i: number, patch: Partial<Q>) {
    setQuestions((qs) => qs && qs.map((q, n) => (n === i ? { ...q, ...patch } : q)));
  }
  function setOption(i: number, oi: number, value: string) {
    setQuestions((qs) => qs && qs.map((q, n) => (n === i ? { ...q, options: q.options.map((o, k) => (k === oi ? value : o)) } : q)));
  }
  function addOption(i: number) {
    setQuestions((qs) => qs && qs.map((q, n) => (n === i && q.options.length < 8 ? { ...q, options: [...q.options, ''] } : q)));
  }
  function removeOption(i: number, oi: number) {
    setQuestions((qs) =>
      qs &&
      qs.map((q, n) => {
        if (n !== i || q.options.length <= 2) return q;
        const options = q.options.filter((_, k) => k !== oi);
        let answer = q.answer;
        if (answer !== null) answer = answer === oi ? null : answer > oi ? answer - 1 : answer;
        return { ...q, options, answer };
      })
    );
  }
  function removeQuestion(i: number) {
    setQuestions((qs) => qs && qs.filter((_, n) => n !== i));
  }
  function addQuestion() {
    setQuestions((qs) => [...(qs ?? []), { id: '', text: '', options: ['', '', '', ''], answer: null, explanation: null }]);
  }

  const missing = questions ? questions.filter((q) => q.answer === null).length : 0;
  const incomplete = questions ? questions.filter((q) => !q.text.trim() || q.options.some((o) => !o.trim())).length : 0;
  const canPublish = !!questions?.length && !!title.trim() && missing === 0 && incomplete === 0 && !busy;

  async function publish() {
    if (!questions) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          questions,
          timeLimitMinutes: timeLimit === 'none' ? null : parseInt(timeLimit, 10),
          closesAt: closesAt ? new Date(closesAt).toISOString() : null,
          shuffle,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not publish.');
      setPublished({ id: data.id, link: `${window.location.origin}/quiz/${data.slug}` });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Could not copy. Select the link and copy it.');
    }
  }

  function reset() {
    setQuestions(null);
    setWarnings([]);
    setFilename(null);
    setTitle('');
    setPasted('');
    setPublished(null);
    setError(null);
    if (fileRef.current) fileRef.current.value = '';
  }

  const label = 'font-condensed font-semibold text-[11px] uppercase tracking-[.1em] text-g600 block mb-1';
  const input = 'w-full border border-[#D5DBE8] px-3 py-2 text-sm bg-white focus:outline-none focus:border-navy';

  if (published) {
    return (
      <div className="bg-white p-5 border-l-[3px] border-mint-deep mb-8">
        <p className="font-condensed font-bold text-[11px] uppercase tracking-[.14em] text-mint-deep mb-1">Published</p>
        <p className="font-display font-bold text-xl text-navy mb-3">{title}</p>
        <p className="font-mono text-sm break-all bg-g100 px-3 py-2 mb-3">{published.link}</p>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => copy(published.link)} className="bg-navy text-white font-condensed font-bold uppercase tracking-[.1em] text-[13px] px-4 py-2.5">
            {copied ? 'Copied' : 'Copy link'}
          </button>
          <a href={`/admin/quizzes/${published.id}`} className="border border-navy text-navy font-condensed font-bold uppercase tracking-[.1em] text-[13px] px-4 py-2.5">
            View results
          </a>
          <button onClick={reset} className="border border-g500 text-g600 font-condensed font-bold uppercase tracking-[.1em] text-[13px] px-4 py-2.5">
            Make another
          </button>
        </div>
        {error && <p className="text-sm text-red-700 mt-2">{error}</p>}
      </div>
    );
  }

  if (!questions) {
    return (
      <div className="bg-white p-5 border-l-[3px] border-gold mb-8">
        <h2 className="font-display font-bold text-xl text-navy mb-1">New quiz</h2>
        <p className="text-sm text-g600 mb-4">
          Upload a Word (.docx) or PDF with multiple-choice questions. Number each question, put options on lines starting
          A. B. C. D., and add a line like <span className="font-semibold">Answer: B</span>. No answer line? You can tick answers in the next step.
        </p>
        <label htmlFor="quizfile" className={label}>Word or PDF file</label>
        <input
          id="quizfile"
          ref={fileRef}
          type="file"
          accept=".docx,.pdf,.txt"
          disabled={busy}
          onChange={(e) => readFile(e.target.files?.[0])}
          className="block w-full text-sm mb-4"
        />
        <details className="mb-2">
          <summary className="text-sm text-navy cursor-pointer font-semibold">Or paste the questions as text</summary>
          <textarea
            value={pasted}
            onChange={(e) => setPasted(e.target.value)}
            rows={8}
            className={`${input} mt-2 font-mono`}
            placeholder={'1. Question text\nA. Option\nB. Option\nC. Option\nD. Option\nAnswer: B'}
          />
          <button onClick={readPasted} disabled={busy || !pasted.trim()} className="mt-2 bg-navy text-white font-condensed font-bold uppercase tracking-[.1em] text-[13px] px-4 py-2.5 disabled:opacity-50">
            Read text
          </button>
        </details>
        {busy && <p className="text-sm text-g600 mt-2">Reading...</p>}
        {error && <p className="text-sm text-red-700 mt-2">{error}</p>}
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <h2 className="font-display font-bold text-xl text-navy">
          Check the questions{filename ? ` · ${filename}` : ''}
        </h2>
        <button onClick={reset} className="text-sm text-g600 underline">Start over</button>
      </div>
      {warnings.length > 0 && (
        <ul className="bg-[#FBF3E1] border border-[#EBDDB8] p-3 mb-3 text-sm text-g800 list-disc pl-6">
          {warnings.map((w, i) => <li key={i}>{w}</li>)}
        </ul>
      )}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] items-start">
        <div className="flex flex-col gap-3">
          {questions.map((q, i) => (
            <div key={i} className="bg-white p-4 border-l-[3px]" style={{ borderLeftColor: q.answer === null ? '#B4402F' : '#C9A02C' }}>
              <div className="flex justify-between items-center mb-2">
                <span className="font-condensed font-bold text-[12px] uppercase tracking-[.1em] text-gold">Question {i + 1}</span>
                {q.answer === null ? (
                  <span className="text-[12px] font-semibold text-red-700">No answer yet. Tick one.</span>
                ) : (
                  <span className="text-[12px] font-semibold text-mint-deep">Answer: {LETTERS[q.answer]}</span>
                )}
              </div>
              <label htmlFor={`qt${i}`} className="sr-only">Question {i + 1} text</label>
              <textarea id={`qt${i}`} value={q.text} onChange={(e) => update(i, { text: e.target.value })} rows={2} className={`${input} mb-2`} />
              <div className="flex flex-col gap-1.5">
                {q.options.map((o, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`ans${i}`}
                      checked={q.answer === oi}
                      onChange={() => update(i, { answer: oi })}
                      aria-label={`Option ${LETTERS[oi]} is correct`}
                      className="w-[18px] h-[18px] flex-none accent-[#0D2B5E]"
                    />
                    <span className="font-condensed font-bold w-4 text-g600">{LETTERS[oi]}</span>
                    <input value={o} onChange={(e) => setOption(i, oi, e.target.value)} aria-label={`Option ${LETTERS[oi]} text`} className={input} />
                    {q.options.length > 2 && (
                      <button onClick={() => removeOption(i, oi)} aria-label={`Remove option ${LETTERS[oi]}`} className="text-g500 px-2 text-lg leading-none">×</button>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-2 items-center flex-wrap">
                {q.options.length < 8 && <button onClick={() => addOption(i)} className="text-sm text-navy underline">Add option</button>}
                <button onClick={() => removeQuestion(i)} className="text-sm text-red-700 underline">Delete question</button>
              </div>
              <label htmlFor={`qe${i}`} className={`${label} mt-3`}>Explanation (optional, shown after submitting)</label>
              <input id={`qe${i}`} value={q.explanation ?? ''} onChange={(e) => update(i, { explanation: e.target.value || null })} className={input} />
            </div>
          ))}
          <button onClick={addQuestion} className="border border-dashed border-gold text-navy font-condensed font-bold uppercase tracking-[.1em] text-[13px] py-3">
            Add a question
          </button>
        </div>

        <div className="bg-white p-4 border-l-[3px] border-gold lg:sticky lg:top-4">
          <h3 className="font-display font-bold text-lg text-navy mb-3">Quiz settings</h3>
          <label htmlFor="qz-title" className={label}>Title</label>
          <input id="qz-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} className={`${input} mb-3`} />
          <label htmlFor="qz-time" className={label}>Time limit</label>
          <select id="qz-time" value={timeLimit} onChange={(e) => setTimeLimit(e.target.value)} className={`${input} mb-3`}>
            {['10', '15', '20', '30', '45', '60', '90', '120'].map((m) => <option key={m} value={m}>{m} minutes</option>)}
            <option value="none">No time limit</option>
          </select>
          <label htmlFor="qz-close" className={label}>Closes on (optional)</label>
          <input id="qz-close" type="datetime-local" value={closesAt} onChange={(e) => setClosesAt(e.target.value)} className={`${input} mb-3`} />
          <label className="flex items-center gap-2 text-sm mb-1">
            <input type="checkbox" checked={shuffle} onChange={(e) => setShuffle(e.target.checked)} className="w-[18px] h-[18px] accent-[#0D2B5E]" />
            Shuffle questions and options
          </label>
          <p className="text-[12px] text-g600 mb-3">Anyone with the link can take it. They enter their name and see their score and answers after submitting.</p>
          {(missing > 0 || incomplete > 0) && (
            <p className="text-sm text-red-700 mb-2">
              {missing > 0 && `${missing} question${missing > 1 ? 's' : ''} still need an answer ticked. `}
              {incomplete > 0 && `${incomplete} question${incomplete > 1 ? 's have' : ' has'} empty text or options.`}
            </p>
          )}
          {error && <p className="text-sm text-red-700 mb-2">{error}</p>}
          <button onClick={publish} disabled={!canPublish} className="w-full bg-gold text-navy-deep font-condensed font-bold uppercase tracking-[.1em] py-3 disabled:opacity-50">
            {busy ? 'Working...' : `Publish quiz (${questions.length} questions)`}
          </button>
        </div>
      </div>
    </div>
  );
}
