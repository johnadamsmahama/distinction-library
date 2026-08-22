'use client';

import { useState, useRef } from 'react';

type AttachedFile = {
  name: string;
  type: string; // MIME type
  data: string; // base64
};

type Mode = 'notes' | 'file';

type QuestionType = 'mcq' | 'true_false' | 'short';

type QuizQuestion = {
  type: QuestionType;
  question: string;
  options?: string[]; // mcq only
  answer: string;
  explanation?: string;
};

const ACCEPTED_TYPES = '.pdf,.docx,.pptx,.png,.jpg,.jpeg';
const MAX_FILE_SIZE_MB = 15;
const QUESTION_COUNTS = [5, 10, 15] as const;

export default function QuizGenerator() {
  const [mode, setMode] = useState<Mode>('notes');
  const [notesContext, setNotesContext] = useState('');
  const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null);
  const [fileError, setFileError] = useState('');
  const [topic, setTopic] = useState('');
  const [numQuestions, setNumQuestions] = useState<number>(5);

  const [quiz, setQuiz] = useState<QuizQuestion[] | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [genError, setGenError] = useState('');
  const [saved, setSaved] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileError('');

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setFileError(`File too large — max ${MAX_FILE_SIZE_MB}MB.`);
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      setAttachedFile({ name: file.name, type: file.type, data: base64 });
    };
    reader.onerror = () => setFileError('Could not read that file — try again.');
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const removeFile = () => {
    setAttachedFile(null);
    setFileError('');
  };

  const canGenerate = (notesContext.trim().length > 0 || !!attachedFile) && !loading;

  const generateQuiz = async () => {
    if (!canGenerate) return;
    setLoading(true);
    setGenError('');
    setQuiz(null);
    setAnswers({});
    setSubmitted(false);
    setSaved(false);

    const res = await fetch('/api/vault/generate-quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        notesContext: notesContext.trim() || undefined,
        attachedFile: attachedFile ?? undefined,
        topic: topic.trim() || undefined,
        numQuestions,
      }),
    });
    const result = await res.json();
    setLoading(false);

    if (!res.ok) {
      setGenError(result.error ?? 'Something went wrong generating the quiz.');
      return;
    }

    setQuiz(result.quiz);
  };

  const setAnswer = (i: number, value: string) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [i]: value }));
  };

  const checkAnswers = () => setSubmitted(true);

  const startOver = () => {
    setQuiz(null);
    setAnswers({});
    setSubmitted(false);
    setGenError('');
    setSaved(false);
  };

  const gradableIndexes =
    quiz?.reduce<number[]>((acc, q, i) => {
      if (q.type !== 'short') acc.push(i);
      return acc;
    }, []) ?? [];

  const correctCount = gradableIndexes.filter(
    (i) => (answers[i] ?? '').trim().toLowerCase() === (quiz![i].answer ?? '').trim().toLowerCase()
  ).length;

  const saveSession = async () => {
    if (!quiz) return;
    const res = await fetch('/api/vault/generate-quiz/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quiz,
        answers,
        score: { correct: correctCount, outOf: gradableIndexes.length },
        sourceName: attachedFile?.name ?? (notesContext ? 'Pasted notes' : undefined),
      }),
    });
    if (res.ok) setSaved(true);
  };

  const tabs: { id: Mode; label: string; hasContent: boolean }[] = [
    { id: 'notes', label: 'notes', hasContent: notesContext.trim().length > 0 },
    { id: 'file', label: 'attach', hasContent: !!attachedFile },
  ];

  return (
    <div className="flex flex-col">
      {!quiz ? (
        <>
          {/* tabs — terminal-pane style */}
          <div className="flex gap-0 px-0">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setMode(t.id)}
                className={`font-mono text-[11px] px-3.5 py-2 flex items-center gap-1.5 relative ${
                  mode === t.id
                    ? 'text-gold border border-gold/40 border-b-transparent bg-navy-deep top-px'
                    : 'text-white/40 border border-transparent hover:text-white/70'
                }`}
              >
                {t.label}
                {t.hasContent && <span className="w-1 h-1 rounded-full bg-gold inline-block" />}
              </button>
            ))}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES}
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* work canvas — fixed at 30 grid boxes (600px). Content fills rows 1-24, topic input at rows 26-27,
              row 28 left empty as a buffer, count buttons + Run at rows 29-30 */}
          <div
            className="relative border border-gold/25 bg-black/15"
            style={{
              height: '600px',
              backgroundImage:
                'linear-gradient(rgba(201,160,44,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(201,160,44,0.06) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          >
            {fileError && (
              <p className="absolute top-3 left-5 right-5 font-mono text-xs text-red-400">{fileError}</p>
            )}

            {/* content zone — fills rows 1-24 (up to 480px) */}
            <div className="absolute p-5" style={{ top: 0, left: 0, right: 0, height: '480px' }}>
              {mode === 'notes' && (
                <div className="h-full flex flex-col">
                  <div className="font-mono text-[10.5px] uppercase tracking-wide text-white/40 mb-2">
                    your notes
                  </div>
                  <textarea
                    value={notesContext}
                    onChange={(e) => setNotesContext(e.target.value)}
                    placeholder="paste your notes or past paper text here…"
                    className="flex-1 w-full px-3.5 py-3 bg-black/25 border border-white/10 font-mono text-xs leading-relaxed text-white outline-none focus:border-gold/50 resize-none placeholder:text-white/30"
                  />
                </div>
              )}

              {mode === 'file' && (
                <div className="h-full flex flex-col">
                  {!attachedFile ? (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 flex flex-col items-center justify-center text-center border border-dashed border-gold/40 bg-gold/[0.04] px-4 py-6 hover:bg-gold/[0.08] transition-colors"
                    >
                      <div className="font-mono text-gold text-lg mb-2">↑</div>
                      <p className="font-mono text-[11px] text-white/50 mb-2">
                        tap to attach a file, or drop it here
                      </p>
                      <div className="flex gap-1.5 flex-wrap justify-center">
                        {['PDF', 'DOCX', 'PPTX', 'PHOTO'].map((t) => (
                          <span key={t} className="font-mono text-[9px] px-2 py-1 bg-black/30 border border-white/10 text-white/50">
                            {t}
                          </span>
                        ))}
                      </div>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2.5 bg-black/25 border border-white/10 px-3 py-3">
                      <div className="w-9 h-9 bg-gold/15 text-gold flex items-center justify-center font-mono text-[9px] flex-shrink-0">
                        {attachedFile.name.split('.').pop()?.toUpperCase().slice(0, 4)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-mono text-xs text-white truncate">{attachedFile.name}</div>
                        <div className="font-mono text-[10px] text-white/40">attached</div>
                      </div>
                      <button onClick={removeFile} className="text-white/40 hover:text-white text-sm px-1" aria-label="Remove file">
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {genError && (
              <p className="absolute left-5 right-5 font-mono text-xs text-red-400" style={{ top: '480px' }}>
                ⚠ {genError}
              </p>
            )}

            {/* topic input — rows 26-27 (500-540px) */}
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="optional: focus the quiz on a topic, e.g. 'chapter 3 only'"
              className="absolute left-5 right-5 px-3.5 py-2.5 bg-black/25 border border-white/10 font-mono text-xs text-white outline-none focus:border-gold/50 placeholder:text-white/30"
              style={{ top: '500px', height: '40px' }}
            />

            {/* row 28 intentionally left empty as a buffer */}

            {/* count buttons + Run — rows 29-30 (560-600px) */}
            <div className="absolute left-5 right-5 flex items-center gap-2" style={{ top: '560px', height: '40px' }}>
              <div className="flex gap-1.5 h-full">
                {QUESTION_COUNTS.map((n) => (
                  <button
                    key={n}
                    onClick={() => setNumQuestions(n)}
                    className={`font-mono text-sm px-4 h-full border transition-colors ${
                      numQuestions === n
                        ? 'bg-gold/15 text-gold border-gold/40'
                        : 'border-white/15 text-white/50 hover:border-gold/30'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <button
                onClick={generateQuiz}
                disabled={!canGenerate}
                className="flex-1 h-full bg-gold text-navy-deep font-condensed font-bold text-sm uppercase hover:bg-gold-light transition-colors disabled:opacity-50"
              >
                {loading ? 'generating…' : 'Run'}
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* results header, once submitted */}
          {submitted && (
            <div className="px-5 py-4 border border-gold/25 border-b-0 bg-black/25 flex items-center justify-between">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-wide text-white/40">score</div>
                <div className="font-mono text-base text-gold">
                  {correctCount} / {gradableIndexes.length} correct
                </div>
              </div>
              <button
                onClick={saveSession}
                disabled={saved}
                className="font-mono text-[10px] text-white/60 border border-white/15 px-3 py-1.5 hover:border-gold/50 hover:text-gold transition-colors disabled:opacity-50"
              >
                {saved ? 'saved ✓' : 'save session'}
              </button>
            </div>
          )}

          {/* quiz questions */}
          <div
            className="border border-gold/25 bg-black/15 p-5 space-y-4 max-h-[500px] overflow-y-auto"
            style={{
              backgroundImage:
                'linear-gradient(rgba(201,160,44,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(201,160,44,0.06) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          >
            {quiz.map((q, i) => {
              const userAnswer = answers[i] ?? '';

              return (
                <div key={i} className="border border-white/10 bg-black/20 p-4">
                  <div className="flex items-start gap-2 mb-3">
                    <span className="font-mono text-xs text-gold flex-shrink-0 mt-0.5">
                      {i + 1}.
                    </span>
                    <p className="font-mono text-xs text-white/80 leading-relaxed">{q.question}</p>
                  </div>

                  {q.type === 'mcq' && (
                    <div className="space-y-2 pl-5">
                      {q.options?.map((opt) => (
                        <label
                          key={opt}
                          className={`flex items-center gap-2.5 px-3 py-2 border cursor-pointer font-mono text-xs transition-colors ${
                            submitted && opt.trim().toLowerCase() === q.answer.trim().toLowerCase()
                              ? 'border-emerald-400/50 bg-emerald-400/10 text-emerald-300'
                              : submitted && userAnswer === opt && opt.trim().toLowerCase() !== q.answer.trim().toLowerCase()
                              ? 'border-red-400/50 bg-red-400/10 text-red-300'
                              : userAnswer === opt
                              ? 'border-gold/50 bg-gold/10 text-white'
                              : 'border-white/10 text-white/60 hover:border-gold/30'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`q-${i}`}
                            checked={userAnswer === opt}
                            onChange={() => setAnswer(i, opt)}
                            disabled={submitted}
                            className="accent-[#C9A02C]"
                          />
                          {opt}
                        </label>
                      ))}
                    </div>
                  )}

                  {q.type === 'true_false' && (
                    <div className="flex gap-2 pl-5">
                      {['True', 'False'].map((opt) => (
                        <button
                          key={opt}
                          onClick={() => setAnswer(i, opt)}
                          disabled={submitted}
                          className={`font-mono text-xs uppercase px-4 py-2 border transition-colors ${
                            submitted && opt.toLowerCase() === q.answer.trim().toLowerCase()
                              ? 'border-emerald-400/50 bg-emerald-400/10 text-emerald-300'
                              : submitted && userAnswer === opt
                              ? 'border-red-400/50 bg-red-400/10 text-red-300'
                              : userAnswer === opt
                              ? 'bg-gold/15 text-gold border-gold/40'
                              : 'border-white/15 text-white/50 hover:border-gold/30'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}

                  {q.type === 'short' && (
                    <div className="pl-5">
                      <input
                        type="text"
                        value={userAnswer}
                        onChange={(e) => setAnswer(i, e.target.value)}
                        disabled={submitted}
                        placeholder="type your answer…"
                        className="w-full px-3.5 py-2 bg-black/25 border border-white/10 font-mono text-xs text-white outline-none focus:border-gold/50 disabled:opacity-70 placeholder:text-white/30"
                      />
                      {submitted && (
                        <p className="font-mono text-[11px] text-white/50 mt-2">
                          <span className="text-white/70">model answer:</span> {q.answer}
                        </p>
                      )}
                    </div>
                  )}

                  {submitted && q.explanation && (
                    <p className="font-mono text-[11px] text-white/40 mt-3 pl-5 leading-relaxed">
                      {q.explanation}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* footer: check answers / start over */}
          <div className="border border-gold/25 border-t-0 bg-black/25 p-4 flex gap-2">
            <button
              onClick={startOver}
              className="font-mono text-xs text-white/60 border border-white/15 px-4 py-2.5 hover:border-gold/50 hover:text-gold transition-colors"
            >
              new quiz
            </button>
            {!submitted && (
              <button
                onClick={checkAnswers}
                className="flex-1 bg-gold text-navy-deep font-condensed font-bold text-xs uppercase px-5 py-2.5 hover:bg-gold-light transition-colors"
              >
                Check Answers
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
