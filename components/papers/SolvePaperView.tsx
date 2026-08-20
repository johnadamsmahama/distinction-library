'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

type Question = {
  id: string;
  canonical_text: string;
  question_type: string | null;
  solution: string | null;
};

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.35'/%3E%3C/svg%3E\")";

export default function SolvePaperView({
  paperId,
  courseCode,
  courseName,
  examType,
  year,
  initialQuestions,
}: {
  paperId: string;
  courseCode: string;
  courseName: string;
  examType: string;
  year: number;
  initialQuestions: Question[];
}) {
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allSolved = questions.length > 0 && questions.every((q) => q.solution);

  useEffect(() => {
    // Nothing to solve, or everything's already cached from a previous
    // student's visit — skip straight to display, no AI call needed.
    if (questions.length === 0 || allSolved) return;

    let cancelled = false;
    async function solve() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/papers/${paperId}/solve`, { method: 'POST' });
        if (!res.ok) throw new Error('Failed to solve');

        const supabase = createClient();
        const { data } = await supabase
          .from('predictor_questions')
          .select('id, canonical_text, question_type, solution')
          .eq('source_paper_id', paperId)
          .order('created_at', { ascending: true });

        if (!cancelled && data) setQuestions(data as Question[]);
      } catch {
        if (!cancelled) {
          setError('Something went wrong generating solutions. Please try again.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    solve();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paperId]);

  return (
    <div
      style={{
        backgroundImage:
          'radial-gradient(120% 60% at 50% 0%, #0F2244 0%, #0D2B5E 45%, #060F1E 100%)',
        minHeight: '100vh',
      }}
      className="relative px-4 sm:px-6 lg:px-8 pt-10 pb-16"
    >
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.2]"
        style={{ backgroundImage: GRAIN, mixBlendMode: 'overlay' }}
      />

      <div className="relative">
        <Link
          href="/papers"
          className="font-mono text-[10px] uppercase tracking-wide text-gold/70 hover:text-gold"
        >
          ← Library
        </Link>

        <div className="mt-4 mb-8">
          <div
            className="font-mono font-bold uppercase tracking-[0.14em] text-gold mb-1.5 opacity-80"
            style={{ fontSize: 9 }}
          >
            {courseCode} · Solved Past Paper
          </div>
          <h1 className="font-display font-bold text-white leading-tight" style={{ fontSize: 22 }}>
            {courseName}
          </h1>
          <div className="font-mono text-[11px] text-white/40 mt-1">
            {examType === 'mid_semester' ? 'Mid-Semester' : 'End of Semester'} · {year}
          </div>
        </div>

        {questions.length === 0 ? (
          <div className="text-white/50 font-body text-sm">
            This paper hasn&apos;t been processed into individual questions yet — check back once
            extraction finishes.
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
            <div className="font-mono text-[11px] uppercase tracking-wide text-white/40 text-center max-w-xs">
              Solving questions for the first time — this may take a moment…
            </div>
          </div>
        ) : error ? (
          <div className="text-red-300 font-body text-sm">{error}</div>
        ) : (
          <div className="flex flex-col gap-4">
            {questions.map((q, i) => (
              <div key={q.id} className="rounded-[3px] p-4" style={{ background: '#FBF6E8' }}>
                <div className="font-mono font-bold text-[10px] uppercase tracking-wide text-navy/50 mb-1">
                  Question {i + 1}
                  {q.question_type ? ` · ${q.question_type}` : ''}
                </div>
                <div
                  className="font-display font-bold text-navy mb-3"
                  style={{ fontSize: 14, lineHeight: 1.4 }}
                >
                  {q.canonical_text}
                </div>
                {q.solution ? (
                  <div className="border-t pt-3" style={{ borderColor: 'rgba(15,34,68,0.1)' }}>
                    <div
                      className="font-mono font-bold text-[9px] uppercase tracking-wide mb-1.5"
                      style={{ color: '#9A7B1A' }}
                    >
                      Answer
                    </div>
                    <div
                      className="font-body text-[13px] text-navy/80 whitespace-pre-wrap"
                      style={{ lineHeight: 1.6 }}
                    >
                      {q.solution}
                    </div>
                  </div>
                ) : (
                  <div className="font-body text-[12px] text-navy/40 italic">Solution pending…</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
