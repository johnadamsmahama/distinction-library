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

const RULED_PAPER =
  'repeating-linear-gradient(#fffdf7 0px, #fffdf7 27px, #e5e0cf 28px)';

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
    <div style={{ minHeight: '100vh', background: '#e2ddc9' }} className="py-3 px-3 sm:py-6 sm:px-4">
      <div
        className="max-w-content mx-auto"
        style={{
          maxWidth: 720,
          boxShadow: '0 4px 14px rgba(0,0,0,0.22)',
          border: '1px solid #d8d2bd',
          overflow: 'hidden',
        }}
      >
        <PaperHeader
          courseCode={courseCode}
          courseName={courseName}
          examType={examType}
          year={year}
          solved={state === 'ready'}
        />

        <div style={{ background: RULED_PAPER, backgroundPosition: '0 4px' }} className="px-5 sm:px-8 pt-6 pb-2">
          {state === 'checking' && <ChromeSpinner label="Loading paper…" />}
          {state === 'solving' && <SolvingState />}
          {state === 'not_ready' && (
            <NotReadyState notifyState={notifyState} onNotifyMe={handleNotifyMe} />
          )}
          {state === 'error' && (
            <div
              style={{ fontFamily: 'Georgia, serif' }}
              className="text-[13px] text-red-800 border-l-[3px] border-red-800 pl-4 py-2 mb-4"
            >
              {errorMsg}
            </div>
          )}
          {state === 'ready' && questions.length > 0 && <PaginatedScript questions={questions} />}
        </div>
      </div>
    </div>
  );
}

function PaperHeader({
  courseCode,
  courseName,
  examType,
  year,
  solved,
}: {
  courseCode: string;
  courseName: string;
  examType: string;
  year: number;
  solved: boolean;
}) {
  return (
    <div style={{ background: '#fdfbf6', borderBottom: '2px solid #0F2244' }} className="px-5 sm:px-8 pt-5 pb-4">
      <Link
        href="/papers"
        style={{ color: '#0F2244' }}
        className="font-condensed text-[13px] font-bold uppercase tracking-[0.08em] hover:opacity-70 transition-opacity inline-block py-1"
      >
        ← Library
      </Link>

      <div className="flex items-start justify-between mt-3.5 gap-3">
        <div>
          <div
            style={{ color: '#8a8570' }}
            className="font-condensed font-semibold text-[10px] uppercase tracking-[0.12em]"
          >
            {courseCode} · {courseName.toUpperCase()}
          </div>
          <div
            style={{ color: '#8a8570' }}
            className="font-condensed text-[9.5px] uppercase tracking-[0.1em] mt-1"
          >
            {examType === 'mid_semester' ? 'Mid-Semester Examination' : 'End of Semester Examination'} · {year}
          </div>
        </div>

        {/* Only stamp the paper as "Solved" once it genuinely has solved
            questions to show — never during loading, a not-ready wait,
            or an extraction failure. A stamp that shows regardless of
            outcome is misleading. */}
        {solved && (
          <div
            style={{
              border: '2px solid #8a2e2e',
              color: '#8a2e2e',
              transform: 'rotate(6deg)',
              fontFamily: 'Georgia, serif',
            }}
            className="text-[9.5px] font-bold uppercase tracking-[0.08em] px-2 py-1 whitespace-nowrap shrink-0"
          >
            Solved
          </div>
        )}
      </div>
    </div>
  );
}

function ChromeSpinner({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div style={{ borderRadius: 0 }} className="w-8 h-8 border-2 border-[#0F2244]/25 border-t-[#0F2244] animate-spin" />
      <div style={{ color: '#6a6a5a' }} className="font-condensed text-[12px] uppercase tracking-wide text-center">
        {label}
      </div>
    </div>
  );
}

function SolvingState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
      <div style={{ borderRadius: 0 }} className="w-8 h-8 border-2 border-[#0F2244]/25 border-t-[#0F2244] animate-spin" />
      <div style={{ fontFamily: 'Georgia, serif', color: '#0F2244' }} className="text-lg max-w-sm">
        Solving this paper for the first time
      </div>
      <div style={{ color: '#6a6a5a' }} className="font-condensed text-[12px] uppercase tracking-wide max-w-xs">
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
    <div className="flex flex-col items-center text-center py-16 gap-6 max-w-md mx-auto">
      <div style={{ fontFamily: 'Georgia, serif', color: '#0F2244' }} className="text-lg leading-snug">
        The Distinction Library Team, in partnership with Distinction Tutors, is currently
        solving this paper.
      </div>
      <div style={{ color: '#6a6a5a' }} className="font-body text-[13px]">
        Check back soon.
      </div>
      <button
        onClick={onNotifyMe}
        disabled={notifyState !== 'idle'}
        style={{ borderRadius: 0, background: '#0F2244', color: '#E2BE5A', border: '1px solid #E2BE5A' }}
        className="font-condensed font-semibold uppercase tracking-[0.12em] text-[12px] px-6 py-3 disabled:opacity-60 transition-colors"
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
      {/* Red margin rule, like the ruled line down real exam script paper */}
      <div style={{ position: 'absolute', left: '1.8rem', top: 0, bottom: 0, width: 1, background: '#e0a5a5' }} />

      {/* Hidden measurement pass — real markup, off-screen, so heights match exactly */}
      <div
        className="absolute opacity-0 pointer-events-none -z-10"
        style={{ top: 0, left: 0, width: '100%' }}
        aria-hidden
      >
        {questions.map((q, i) => (
          <div
            key={q.id}
            ref={(el) => {
              measureRefs.current[i] = el;
            }}
            className="mb-6"
          >
            <ScriptBlock question={q} />
          </div>
        ))}
      </div>

      {pages === null ? (
        <ChromeSpinner label="Laying out the script…" />
      ) : (
        <div className="pl-6 sm:pl-8">
          <div className="flex flex-col gap-6">
            {currentPage.map((q) => (
              <ScriptBlock key={q.id} question={q} />
            ))}
          </div>

          <div
            style={{ borderTop: '1px dashed #b8b09a' }}
            className="mt-4 pt-3.5 flex items-center justify-between"
          >
            <span style={{ fontFamily: 'Georgia, serif', color: '#6a6a5a' }} className="text-[10.5px] italic">
              Solved — reviewed by the Distinction Tutoring Team
            </span>
          </div>

          <div className="mt-3 flex items-center justify-between pb-4">
            <button
              onClick={() => setPageIndex((p) => Math.max(p - 1, 0))}
              disabled={pageIndex === 0}
              style={{ borderRadius: 0, border: '1px solid #0F2244', color: '#0F2244', background: 'transparent' }}
              className="font-condensed font-semibold text-[10.5px] px-4 py-2 disabled:opacity-30 transition-opacity"
            >
              ← PREV
            </button>
            <span style={{ fontFamily: 'Georgia, serif', color: '#6a6a5a' }} className="text-[11px] italic">
              Page {pageIndex + 1} of {totalPages}
            </span>
            <button
              onClick={() => setPageIndex((p) => Math.min(p + 1, totalPages - 1))}
              disabled={pageIndex >= totalPages - 1}
              style={{ borderRadius: 0, background: '#0F2244', color: '#fdfbf6', border: 'none' }}
              className="font-condensed font-semibold text-[10.5px] px-4 py-2 disabled:opacity-30 transition-opacity"
            >
              NEXT →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ScriptBlock({ question }: { question: SolvedQuestion }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span style={{ fontFamily: 'Georgia, serif', color: '#0F2244' }} className="text-[15px] font-bold">
          Question {question.order_index}.
        </span>
        <div className="flex items-center gap-2 shrink-0">
          {question.is_predicted && (
            <span
              style={{ borderRadius: 0, background: 'rgba(226,190,90,0.18)', border: '1px solid #E2BE5A', color: '#0F2244' }}
              className="font-condensed font-semibold uppercase tracking-wide text-[9.5px] px-2 py-0.5"
            >
              Predicted
            </span>
          )}
          {question.marks != null && (
            <span style={{ color: '#8a8570', fontStyle: 'italic' }} className="text-[10.5px]">
              [{question.marks} marks]
            </span>
          )}
        </div>
      </div>

      <div
        style={{ fontFamily: 'Georgia, serif', color: '#2a2a2a', lineHeight: '28px' }}
        className="text-[13.5px] mt-0.5"
      >
        {question.question_text}
      </div>

      <div style={{ borderLeft: '3px solid #8a2e2e' }} className="mt-1.5 pl-3.5">
        <div
          style={{ color: '#8a2e2e' }}
          className="font-condensed font-bold uppercase tracking-[0.08em] text-[9.5px] mb-0.5"
        >
          Model answer
        </div>
        <div
          style={{ fontFamily: 'Georgia, serif', color: '#3a3a3a', lineHeight: '28px' }}
          className="text-[12.5px] whitespace-pre-wrap"
        >
          {question.answer_text}
        </div>
      </div>
    </div>
  );
}
