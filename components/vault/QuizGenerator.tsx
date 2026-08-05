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

  const tabs: { id: Mode; label: string; hasContent: boolean; icon: React.ReactNode }[] = [
    {
      id: 'notes',
      label: 'Paste notes',
      hasContent: notesContext.trim().length > 0,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z" />
          <line x1="8" y1="7" x2="15" y2="7" />
          <line x1="8" y1="11" x2="15" y2="11" />
        </svg>
      ),
    },
    {
      id: 'file',
      label: 'Attach',
      hasContent: !!attachedFile,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
          <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
        </svg>
      ),
    },
  ];

  return (
    <div className="bg-white border border-g100 rounded-2xl shadow-[0_14px_34px_-16px_rgba(10,27,61,0.4)] flex flex-col h-[56vh] overflow-hidden">
      {!quiz ? (
        <>
          {/* tabs */}
          <div className="flex border-b border-g100 flex-shrink-0">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setMode(t.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-4 font-condensed font-bold text-[11px] uppercase tracking-wide transition-colors relative ${
                  mode === t.id ? 'text-gold' : 'text-g600 hover:text-g800'
                }`}
              >
                {t.icon}
                {t.label}
                {t.hasContent && <span className="w-1.5 h-1.5 rounded-full bg-gold" aria-hidden />}
                {mode === t.id && (
                  <span className="absolute -bottom-px left-3.5 right-3.5 h-0.5 rounded-full bg-gold" />
                )}
              </button>
            ))}
          </div>

          {fileError && (
            <div className="px-5 py-2 bg-red-50 border-b border-g100 flex-shrink-0">
              <p className="font-body text-xs text-red-600">{fileError}</p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES}
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* content pane — scrolls internally, card height stays fixed */}
          <div className="flex-1 overflow-y-auto p-5 flex flex-col">
            {mode === 'notes' && (
              <div className="flex-1 flex flex-col">
                <div className="font-condensed font-bold text-[10.5px] uppercase tracking-wide text-g600 mb-2">
                  Your notes
                </div>
                <textarea
                  value={notesContext}
                  onChange={(e) => setNotesContext(e.target.value)}
                  placeholder="Paste your notes or past paper text here…"
                  className="flex-1 min-h-[110px] w-full px-3.5 py-3 rounded-xl border border-g100 bg-off-white font-body text-sm leading-relaxed outline-none focus:border-gold resize-none"
                />
              </div>
            )}

            {mode === 'file' && (
              <div className="flex-1 flex flex-col">
                {!attachedFile ? (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 min-h-[110px] flex flex-col items-center justify-center text-center rounded-xl border-[1.5px] border-dashed border-gold bg-gold/[0.06] px-4 py-6 hover:bg-gold/[0.1] transition-colors"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-gold mb-2">
                      <path d="M12 16V4M6 10l6-6 6 6" />
                      <path d="M4 20h16" />
                    </svg>
                    <p className="font-body text-xs text-g600 mb-2">
                      <span className="font-semibold text-g800">Tap to attach</span> a file, or drop it here
                    </p>
                    <div className="flex gap-1.5 flex-wrap justify-center">
                      {['PDF', 'DOCX', 'PPTX', 'PHOTO'].map((t) => (
                        <span key={t} className="font-condensed text-[9.5px] font-bold px-2 py-1 bg-white border border-g100 rounded text-g600">
                          {t}
                        </span>
                      ))}
                    </div>
                  </button>
                ) : (
                  <div className="flex items-center gap-2.5 bg-off-white border border-g100 rounded-xl px-3 py-3">
                    <div className="w-9 h-9 rounded-lg bg-navy text-gold-light flex items-center justify-center font-condensed font-bold text-[9px] flex-shrink-0">
                      {attachedFile.name.split('.').pop()?.toUpperCase().slice(0, 4)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-body font-semibold text-sm text-g800 truncate">{attachedFile.name}</div>
                      <div className="font-condensed text-[10.5px] text-g600">Attached</div>
                    </div>
                    <button onClick={removeFile} className="text-g600 hover:text-navy text-base px-1" aria-label="Remove file">
                      ✕
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* optional focus/topic hint — applies to either tab */}
            <div className="mt-4 flex-shrink-0">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Optional: focus the quiz on a topic, e.g. 'Chapter 3 only'"
                className="w-full px-3.5 py-2.5 rounded-lg border border-g100 bg-off-white font-body text-sm outline-none focus:border-gold"
              />
            </div>
          </div>

          {genError && (
            <div className="px-5 pb-2 flex-shrink-0">
              <p className="font-body text-xs text-red-600">⚠️ {genError}</p>
            </div>
          )}

          {/* footer: question count + generate */}
          <div className="p-4 border-t border-g100 flex items-center gap-3 flex-shrink-0">
            <div className="flex gap-1.5">
              {QUESTION_COUNTS.map((n) => (
                <button
                  key={n}
                  onClick={() => setNumQuestions(n)}
                  className={`font-condensed font-bold text-xs px-3 py-2.5 rounded-lg border transition-colors ${
                    numQuestions === n
                      ? 'bg-navy text-white border-navy'
                      : 'border-g100 text-g600 hover:border-gold'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <button
              onClick={generateQuiz}
              disabled={!canGenerate}
              className="flex-1 bg-gold text-navy font-condensed font-bold text-xs uppercase px-5 py-2.5 rounded-lg hover:bg-gold-light transition-colors disabled:opacity-50"
            >
              {loading ? 'Generating…' : 'Generate Quiz'}
            </button>
          </div>
        </>
      ) : (
        <>
          {/* results header, once submitted */}
          {submitted && (
            <div className="px-5 py-4 border-b border-g100 flex items-center justify-between flex-shrink-0 bg-off-white">
              <div>
                <div className="font-condensed font-bold text-[10.5px] uppercase tracking-wide text-g600">Score</div>
                <div className="font-display font-bold text-lg text-navy">
                  {correctCount} / {gradableIndexes.length} auto-graded correct
                </div>
              </div>
              <button
                onClick={saveSession}
                disabled={saved}
                className="font-condensed font-bold text-xs uppercase tracking-wide text-navy border border-g100 rounded-lg px-3 py-1.5 hover:border-gold transition-colors disabled:opacity-50 bg-white"
              >
                {saved ? 'Saved to Vault ✓' : 'Save session'}
              </button>
            </div>
          )}

          {/* quiz questions — scrolls internally within the fixed-height card */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {quiz.map((q, i) => {
              const userAnswer = answers[i] ?? '';

              return (
                <div key={i} className="border border-g100 rounded-xl p-4">
                  <div className="flex items-start gap-2 mb-3">
                    <span className="font-condensed font-bold text-xs text-gold flex-shrink-0 mt-0.5">
                      {i + 1}.
                    </span>
                    <p className="font-body text-sm text-g800 leading-relaxed">{q.question}</p>
                  </div>

                  {q.type === 'mcq' && (
                    <div className="space-y-2 pl-5">
                      {q.options?.map((opt) => (
                        <label
                          key={opt}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border cursor-pointer font-body text-sm transition-colors ${
                            submitted && opt.trim().toLowerCase() === q.answer.trim().toLowerCase()
                              ? 'border-green-400 bg-green-50'
                              : submitted && userAnswer === opt && opt.trim().toLowerCase() !== q.answer.trim().toLowerCase()
                              ? 'border-red-300 bg-red-50'
                              : userAnswer === opt
                              ? 'border-gold bg-gold/[0.06]'
                              : 'border-g100 hover:border-gold'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`q-${i}`}
                            checked={userAnswer === opt}
                            onChange={() => setAnswer(i, opt)}
                            disabled={submitted}
                            className="accent-[#D4A017]"
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
                          className={`font-condensed font-bold text-xs uppercase px-4 py-2 rounded-lg border transition-colors ${
                            submitted && opt.toLowerCase() === q.answer.trim().toLowerCase()
                              ? 'border-green-400 bg-green-50 text-green-700'
                              : submitted && userAnswer === opt
                              ? 'border-red-300 bg-red-50 text-red-600'
                              : userAnswer === opt
                              ? 'bg-navy text-white border-navy'
                              : 'border-g100 text-g600 hover:border-gold'
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
                        placeholder="Type your answer…"
                        className="w-full px-3.5 py-2 rounded-lg border border-g100 bg-off-white font-body text-sm outline-none focus:border-gold disabled:opacity-70"
                      />
                      {submitted && (
                        <p className="font-body text-xs text-g600 mt-2">
                          <span className="font-semibold text-g800">Model answer:</span> {q.answer}
                        </p>
                      )}
                    </div>
                  )}

                  {submitted && q.explanation && (
                    <p className="font-body text-xs text-g600 mt-3 pl-5 leading-relaxed">
                      {q.explanation}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* footer: check answers / start over */}
          <div className="p-4 border-t border-g100 flex gap-2 flex-shrink-0">
            <button
              onClick={startOver}
              className="font-condensed font-bold text-xs uppercase tracking-wide text-navy border border-g100 rounded-lg px-4 py-2.5 hover:border-gold transition-colors"
            >
              New quiz
            </button>
            {!submitted && (
              <button
                onClick={checkAnswers}
                className="flex-1 bg-gold text-navy font-condensed font-bold text-xs uppercase px-5 py-2.5 rounded-lg hover:bg-gold-light transition-colors"
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
