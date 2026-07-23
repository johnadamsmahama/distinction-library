'use client';

import { useState } from 'react';
import Link from 'next/link';

type Question = {
  type: 'mcq' | 'true_false' | 'short_answer';
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
};

type Quiz = { questions: Question[] };

export default function QuizGenerator() {
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [sourceName, setSourceName] = useState('');
  const [questionCount, setQuestionCount] = useState(8);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!text.trim() && !file) {
      setError('Paste some notes or upload a file first.');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    if (file) formData.append('file', file);
    if (text.trim()) formData.append('text', text.trim());
    formData.append('sourceName', sourceName || file?.name || 'Pasted notes');
    formData.append('questionCount', String(questionCount));

    const res = await fetch('/api/vault/generate-quiz', { method: 'POST', body: formData });
    const result = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(result.error ?? 'Something went wrong.');
      return;
    }

    setQuiz(result.vaultItem.content);
    setAnswers({});
    setSubmitted(false);
  };

  if (quiz) {
    const score = submitted
      ? quiz.questions.filter((q, i) => normalize(answers[i]) === normalize(q.correctAnswer)).length
      : 0;

    return (
      <div>
        {submitted && (
          <div className="bg-navy rounded-2xl p-6 text-center mb-6">
            <div className="font-display font-bold text-3xl text-gold mb-1">
              {score} / {quiz.questions.length}
            </div>
            <p className="font-condensed text-xs uppercase tracking-wide text-white/50">
              Saved to your Study Vault
            </p>
          </div>
        )}

        <div className="space-y-4">
          {quiz.questions.map((q, i) => {
            const isCorrect = submitted && normalize(answers[i]) === normalize(q.correctAnswer);
            const isWrong = submitted && answers[i] && !isCorrect;

            return (
              <div key={i} className="bg-white border border-g100 rounded-xl p-5">
                <p className="font-condensed font-semibold text-sm text-g800 mb-3">
                  {i + 1}. {q.question}
                </p>

                {q.type === 'mcq' && q.options && (
                  <div className="space-y-2">
                    {q.options.map((opt) => (
                      <label
                        key={opt}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer font-body text-sm ${
                          submitted && opt === q.correctAnswer
                            ? 'border-green-400 bg-green-50'
                            : submitted && opt === answers[i]
                              ? 'border-red-300 bg-red-50'
                              : 'border-g100'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`q${i}`}
                          disabled={submitted}
                          checked={answers[i] === opt}
                          onChange={() => setAnswers((a) => ({ ...a, [i]: opt }))}
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                )}

                {q.type === 'true_false' && (
                  <div className="flex gap-2">
                    {['True', 'False'].map((opt) => (
                      <label
                        key={opt}
                        className={`flex-1 text-center px-3 py-2 rounded-lg border cursor-pointer font-body text-sm ${
                          submitted && opt === q.correctAnswer
                            ? 'border-green-400 bg-green-50'
                            : submitted && opt === answers[i]
                              ? 'border-red-300 bg-red-50'
                              : 'border-g100'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`q${i}`}
                          className="hidden"
                          disabled={submitted}
                          checked={answers[i] === opt}
                          onChange={() => setAnswers((a) => ({ ...a, [i]: opt }))}
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                )}

                {q.type === 'short_answer' && (
                  <textarea
                    rows={2}
                    disabled={submitted}
                    value={answers[i] ?? ''}
                    onChange={(e) => setAnswers((a) => ({ ...a, [i]: e.target.value }))}
                    placeholder="Your answer…"
                    className="w-full px-3 py-2 rounded-lg border border-g100 font-body text-sm outline-none focus:border-gold"
                  />
                )}

                {submitted && (
                  <div className="mt-3 pt-3 border-t border-g100 font-body text-xs text-g600">
                    <span className="font-semibold text-g800">
                      {q.type === 'short_answer' ? 'Model answer: ' : 'Correct: '}
                    </span>
                    {q.correctAnswer} — {q.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex gap-3 mt-6">
          {!submitted ? (
            <button
              onClick={() => setSubmitted(true)}
              className="bg-gold text-navy font-condensed font-bold text-sm px-6 py-3 rounded-lg hover:bg-gold-light transition-colors"
            >
              Submit answers
            </button>
          ) : (
            <>
              <button
                onClick={() => {
                  setQuiz(null);
                  setText('');
                  setFile(null);
                }}
                className="bg-gold text-navy font-condensed font-bold text-sm px-6 py-3 rounded-lg hover:bg-gold-light transition-colors"
              >
                Generate another quiz
              </button>
              <Link
                href="/vault"
                className="border border-g100 text-g800 font-condensed font-bold text-sm px-6 py-3 rounded-lg hover:border-gold transition-colors"
              >
                View Study Vault
              </Link>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleGenerate} className="bg-white border border-g100 rounded-2xl p-6 space-y-4">
      <div>
        <label className={labelClass}>Paste your notes</label>
        <textarea
          rows={8}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste lecture notes or a summary here…"
          className={inputClass}
        />
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-g100" />
        <span className="font-condensed text-xs text-g600">OR</span>
        <div className="flex-1 h-px bg-g100" />
      </div>

      <div>
        <label className={labelClass}>Upload a PDF</label>
        <input
          type="file"
          accept=".pdf,.txt"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="w-full font-body text-sm text-g600"
        />
      </div>

      <div>
        <label className={labelClass}>Source name (optional)</label>
        <input
          type="text"
          value={sourceName}
          onChange={(e) => setSourceName(e.target.value)}
          placeholder="e.g. COM 201 — Week 6 notes"
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Number of questions: {questionCount}</label>
        <input
          type="range"
          min={3}
          max={15}
          value={questionCount}
          onChange={(e) => setQuestionCount(Number(e.target.value))}
          className="w-full"
        />
      </div>

      {error && <p className="font-body text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gold text-navy font-condensed font-bold text-sm py-3 rounded-lg hover:bg-gold-light transition-colors disabled:opacity-60"
      >
        {loading ? 'Generating…' : 'Generate quiz'}
      </button>
    </form>
  );
}

function normalize(s: string | undefined) {
  return (s ?? '').trim().toLowerCase();
}

const labelClass = 'block font-condensed font-semibold text-xs uppercase tracking-wide text-g800 mb-2';
const inputClass =
  'w-full px-4 py-3 rounded-lg border border-g100 font-body text-[15px] text-g800 outline-none focus:border-gold transition-colors';
