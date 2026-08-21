'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

type SolvedQuestion = {
  id: string;
  order_index: number;
  question_text: string;
  marks: number | null;
  answer_text: string;
  is_predicted: boolean;
  status: string;
};

type ViewState = 'checking' | 'not_ready' | 'solving' | 'ready' | 'error';

const PAGE_PADDING = 48;
const BLOCK_GAP = 24;

export default function SolvePaperView({
  paperId,
  courseCode,
  courseName,
  examType,
  year,
}: {
  paperId: string;
  courseCode: string;
  courseName: string;
  examType: string;
  year: number;
}) {
  const [state, setState] = useState<ViewState>('checking');
  const [questions, setQuestions] = useState<SolvedQuestion[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [notifyState, setNotifyState] = useState<'idle' | 'saving' | 'saved'>('idle');

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const supabase = createClient();

      // 1. Check for already-solved questions first — skip the AI call
      // entirely if a previous student already solved this paper.
      const { data: existing } = await supabase
        .from('solved_paper_questions')
        .select('id, order_index, question_text, marks, answer_text, is_predicted, status')
        .eq('paper_id', paperId)
        .order('order_index', { ascending: true });

      if (cancelled) return;

      if (existing && existing.length > 0 && existing.every((q) => q.status === 'solved')) {
        setQuestions(existing as SolvedQuestion[]);
        setState('ready');
        return;
      }

      // 2. Nothing cached — trigger the solve pipeline.
      setState('solving');
      try {
        const res = await fetch(`/api/papers/${paperId}/solve`, { method: 'POST' });
        const data = await res.json().catch(() => ({}));

        if (cancelled) return;

        if (data.status === 'not_ready') {
          setState('not_ready');
          return;
        }
        if (data.status === 'error' || !res.ok) {
          setErrorMsg(data.error || 'Something went wrong while solving this paper.');
          setState('error');
          return;
        }

        // 3. Solve succeeded — fetch the written rows.
        const { data: solved } = await supabase
          .from('solved_paper_questions')
          .select('id, order_index, question_text, marks, answer_text, is_predicted, status')
          .eq('paper_id', paperId)
          .order('order_index', { ascending: true });

        if (cancelled) return;
        setQuestions((solved as SolvedQuestion[]) ?? []);
        setState('ready');
      } catch {
        if (!cancelled) {
          setErrorMsg('Something went wrong while solving this paper. Please try again.');
          setState('error');
        }
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [paperId]);

  async function handleNotifyMe() {
    setNotifyState('saving');
    try {
      const res = await fetch('/api/papers/notify-when-solved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paper_id: paperId }),
      });
      if (!res.ok) throw new Error();
      setNotifyState('saved');
    } catch {
      setNotifyState('idle');
    }
  }

  return (
    <div className="min-h-screen bg-off-white">
      <PaperHeader courseCode={courseCode} courseName={courseName} examType={examType} year={year} />

      <div className="max-w-content mx-auto px-4 sm:px-6 py-10">
        {state === 'checking' && <ChromeSpinner label="Loading paper…" />}
        {state === 'solving' && <SolvingState />}
        {state === 'not_ready' && (
          <NotReadyState notifyState={notifyState} onNotifyMe={handleNotifyMe} />
        )}
        {state === 'error' && (
          <div className="font-body text-[13px] text-red-700 border-l-2 border-red-700 pl-4 py-2">
            {errorMsg}
          </div>
        )}
        {state === 'ready' && questions.length > 0 && <PaginatedScript questions={questions} />}
      </div>
    </div>
  );
}

function PaperHeader({
  courseCode,
  courseName,
  examType,
  year,
}: {
  courseCode: string;
  courseName: string;
  examType: string;
  year: number;
}) {
  return (
    <div className="bg-navy border-b-2 border-gold">
      <div className="max-w-content mx-auto px-4 sm:px-6 py-8">
        <Link
          href="/papers"
          className="font-condensed text-[11px] uppercase tracking-[0.14em] text-gold-light/80 hover:text-gold-light"
        >
          ← Library
        </Link>
        <div className="mt-4 font-condensed font-semibold uppercase tracking-[0.14em] text-gold text-[11px] mb-1.5">
          {courseCode} · Solved Past Paper
        </div>
        <h1 className="font-display font-bold text-off-white text-2xl leading-tight">
          {courseName}
        </h1>
        <div className="font-condensed text-[12px] text-off-white/50 mt-1.5 uppercase tracking-wide">
          {examType === 'mid_semester' ? 'Mid-Semester' : 'End of Semester'} · {year}
        </div>
      </div>
    </div>
  );
}

function ChromeSpinner({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-8 h-8 border-2 border-gold/30 border-t-gold animate-spin" />
      <div className="font-condensed text-[12px] uppercase tracking-wide text-g600 text-center">
        {label}
      </div>
    </div>
  );
}

function SolvingState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
      <div className="w-8 h-8 border-2 border-gold/30 border-t-gold animate-spin" />
      <div className="font-display text-navy text-lg max-w-sm">
        Solving this paper for the first time
      </div>
      <div className="font-condensed text-[12px] uppercase tracking-wide text-g600 max-w-xs">
        This page will update automatically once it&apos;s ready — no need to refresh.
      </div>
    </div>
  );
}

function NotReadyState({
  notifyState,
  onNotifyMe,
}: {
  notifyState: 'idle' | 'saving' | 'saved';
  onNotifyMe: () => void;
}) {
  return (
    <div className="flex flex-col items-center text-center py-20 gap-6 max-w-md mx-auto">
      <div className="font-display text-navy text-lg leading-snug">
        The Distinction Library Team, in partnership with Distinction Tutors, is currently
        solving this paper.
      </div>
      <div className="font-body text-[13px] text-g600">Check back soon.</div>
      <button
        onClick={onNotifyMe}
        disabled={notifyState !== 'idle'}
        className="font-condensed font-semibold uppercase tracking-[0.12em] text-[12px] px-6 py-3 bg-navy text-gold border border-gold hover:bg-navy-mid disabled:opacity-60 transition-colors"
      >
        {notifyState === 'saved' ? 'We\u2019ll notify you' : notifyState === 'saving' ? 'Saving…' : 'Notify me when ready'}
      </button>
    </div>
  );
}

/**
 * Paginates solved questions into physical "pages" that fit the available
 * space, like a real answer script — never one-question-per-screen, and
 * never a question+answer pair split across two pages.
 *
 * Approach: render every question+answer block once, off-screen, to measure
 * its real rendered height. Then greedily pack blocks into pages against an
 * estimated page budget. Re-measures on window resize.
 */
function PaginatedScript({ questions }: { questions: SolvedQuestion[] }) {
  const measureRefs = useRef<(HTMLDivElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [pages, setPages] = useState<SolvedQuestion[][] | null>(null);
  const [pageIndex, setPageIndex] = useState(0);

  useLayoutEffect(() => {
    function measureAndPaginate() {
      const container = containerRef.current;
      if (!container) return;

      const availableHeight = Math.max(window.innerHeight - PAGE_PADDING * 2, 400);
      const heights = measureRefs.current.map((el) => (el ? el.offsetHeight : 0));

      const built: SolvedQuestion[][] = [];
      let current: SolvedQuestion[] = [];
      let currentHeight = 0;

      questions.forEach((q, i) => {
        const h = heights[i] + BLOCK_GAP;
        if (current.length > 0 && currentHeight + h > availableHeight) {
          built.push(current);
          current = [];
          currentHeight = 0;
        }
        current.push(q);
        currentHeight += h;
      });
      if (current.length > 0) built.push(current);

      setPages(built.length > 0 ? built : [questions]);
      setPageIndex((prev) => Math.min(prev, Math.max(built.length - 1, 0)));
    }

    measureAndPaginate();
    window.addEventListener('resize', measureAndPaginate);
    return () => window.removeEventListener('resize', measureAndPaginate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions]);

  const currentPage = pages?.[pageIndex] ?? [];
  const totalPages = pages?.length ?? 1;

  return (
    <div ref={containerRef} className="relative">
      {/* Hidden measurement pass — real markup, off-screen, so heights match exactly */}
      <div
        className="absolute opacity-0 pointer-events-none -z-10"
        style={{ top: 0, left: 0, width: '100%' }}
        aria-hidden
      >
        {questions.map((q, i) => (
          <div key={q.id} ref={(el) => (measureRefs.current[i] = el)} className="mb-6">
            <ScriptBlock question={q} />
          </div>
        ))}
      </div>

      {pages === null ? (
        <ChromeSpinner label="Laying out the script…" />
      ) : (
        <>
          <div className="flex flex-col gap-6">
            {currentPage.map((q) => (
              <ScriptBlock key={q.id} question={q} />
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-g100 flex items-center justify-between font-condensed text-[12px] uppercase tracking-wide">
            <span className="text-g600">Solved · verified by Distinction Tutor</span>
            <span className="text-navy font-semibold">
              Page {pageIndex + 1} of {totalPages}
            </span>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <button
              onClick={() => setPageIndex((p) => Math.max(p - 1, 0))}
              disabled={pageIndex === 0}
              className="font-condensed font-semibold uppercase tracking-[0.1em] text-[12px] px-5 py-2.5 border border-navy text-navy disabled:opacity-30 hover:bg-navy hover:text-off-white transition-colors"
            >
              ← Previous
            </button>
            <button
              onClick={() => setPageIndex((p) => Math.min(p + 1, totalPages - 1))}
              disabled={pageIndex >= totalPages - 1}
              className="font-condensed font-semibold uppercase tracking-[0.1em] text-[12px] px-5 py-2.5 bg-gold text-navy disabled:opacity-30 hover:bg-gold-light transition-colors"
            >
              Next Page →
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function ScriptBlock({ question }: { question: SolvedQuestion }) {
  return (
    <div className="relative border-l-2 border-navy/15 pl-5">
      <div className="flex items-baseline justify-between gap-3 mb-2">
        <div className="font-display font-bold text-navy text-[15px]">
          Question {question.order_index}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {question.is_predicted && (
            <span className="font-condensed font-semibold uppercase tracking-wide text-[10px] px-2 py-0.5 bg-gold/15 text-navy border border-gold">
              Predicted
            </span>
          )}
          {question.marks != null && (
            <span className="font-condensed text-[11px] text-g600">[{question.marks} marks]</span>
          )}
        </div>
      </div>

      <div className="font-body text-[14px] text-g800 mb-3" style={{ lineHeight: 1.55 }}>
        {question.question_text}
      </div>

      <div className="bg-off-white border-l-2 border-gold pl-4 py-3">
        <div className="font-condensed font-semibold uppercase tracking-[0.1em] text-[10px] text-gold mb-1.5">
          Model Answer
        </div>
        <div className="font-body text-[13px] text-navy whitespace-pre-wrap" style={{ lineHeight: 1.6 }}>
          {question.answer_text}
        </div>
      </div>
    </div>
  );
}
