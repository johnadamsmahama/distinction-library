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

// One ruled row = one line of writing. Every height inside the booklet is a
// multiple of this (it must match --sb-row in the CSS below), which is what
// keeps each line of writing sitting on its ruled line.
const ROW = 32;

// How tall one "page" of the script may be, measured in screen heights.
// 1 = exactly one screen (one long question per page on a phone).
// 2 = about two screens of content per page (several questions per page).
// Raise it for more questions per page, lower it for fewer.
const PAGE_SCREENS = 2;

// Never build a page shorter than this many ruled rows.
const MIN_PAGE_ROWS = 16;

// Height of the site header above the booklet, used so a short page does not
// force the document to scroll past the end of the paper.
const SITE_HEADER_OFFSET = '4.25rem';

// ---------------------------------------------------------------------------
// Styles for the answer booklet. The paper fills the whole page (no frame),
// has ONE red margin line, and the writing sits on the ruled lines.
// ---------------------------------------------------------------------------
const BOOKLET_CSS = `
.sb-paper {
  --sb-row: 32px;
  --sb-rule-y: 23px;
  --sb-paper: #FBF6E8;
  --sb-rule: #D9CDA8;
  --sb-margin-ink: #C0504D;
  --sb-ink: #2A2418;
  --sb-pen: #24477A;
  --sb-red: #8A2E2E;
  --sb-muted: #8A7A5C;
  --sb-margin-x: 40px;
  --sb-gap: 16px;
  min-height: calc(100vh - ${SITE_HEADER_OFFSET});
  min-height: calc(100dvh - ${SITE_HEADER_OFFSET});
  background-color: var(--sb-paper);
  background-image: linear-gradient(to bottom,
    transparent 0, transparent var(--sb-rule-y),
    var(--sb-rule) var(--sb-rule-y), var(--sb-rule) calc(var(--sb-rule-y) + 1px),
    transparent calc(var(--sb-rule-y) + 1px));
  background-size: 100% var(--sb-row);
  font-family: Georgia, 'Times New Roman', serif;
  color: var(--sb-ink);
}
@media (min-width: 640px) { .sb-paper { --sb-margin-x: 56px; --sb-gap: 20px; } }
.sb-col {
  position: relative; max-width: 720px; margin: 0 auto;
  padding: 0 20px 64px calc(var(--sb-margin-x) + var(--sb-gap));
}
.sb-margin {
  position: absolute; top: 0; bottom: 0; left: var(--sb-margin-x);
  width: 2px; background: var(--sb-margin-ink); opacity: 0.8;
}
.sb-row { height: var(--sb-row); line-height: var(--sb-row); }
.sb-sm {
  font-weight: 600; font-size: 11.5px; letter-spacing: 0.12em; text-transform: uppercase;
  color: var(--sb-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  position: relative; top: 2px;
}
.sb-back { display: block; color: var(--sb-red); text-decoration: none; }
.sb-back:hover { text-decoration: underline; }

.sb-title { position: relative; }
.sb-title h1 {
  margin: 0; font-weight: 800; font-size: 25px; line-height: var(--sb-row);
  color: #1B1710; position: relative; top: -3px; padding-right: 92px;
}
.sb-sub { font-style: italic; font-size: 14px; color: #6B5D3F; }
.sb-divider { position: relative; height: var(--sb-row); }
.sb-divider::before {
  content: ''; position: absolute; left: 0; right: 0; top: calc(var(--sb-rule-y) - 1px);
  border-top: 2px solid var(--sb-red); opacity: 0.85;
}
.sb-stamp {
  position: absolute; right: 0; top: 36px; border: 2px solid var(--sb-red); color: var(--sb-red);
  font-weight: 700; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase;
  padding: 3px 9px; transform: rotate(5deg); background: rgba(251,246,232,0.9);
}

.sb-qhead { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; height: var(--sb-row); line-height: var(--sb-row); }
.sb-qhead b { font-size: 16px; }
.sb-meta { display: flex; gap: 8px; align-items: center; font-size: 12px; font-style: italic; color: var(--sb-muted); }
.sb-badge {
  font-style: normal; font-weight: 700; font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase;
  color: #3A3020; background: rgba(226,190,90,0.2); border: 1px solid #E2BE5A; padding: 0 6px; line-height: 17px;
}
.sb-qtext { margin: 0; font-size: 15.5px; line-height: var(--sb-row); white-space: pre-wrap; overflow-wrap: anywhere; }
.sb-label {
  font-weight: 700; font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--sb-red);
  height: var(--sb-row); line-height: var(--sb-row); position: relative; top: 2px;
}
.sb-ans { margin: 0; font-size: 15px; line-height: var(--sb-row); color: var(--sb-pen); white-space: pre-wrap; overflow-wrap: anywhere; }
.sb-gap { height: var(--sb-row); }

.sb-reviewed { font-style: italic; font-size: 12.5px; color: var(--sb-muted); height: var(--sb-row); line-height: var(--sb-row); }
.sb-nav { display: flex; align-items: center; justify-content: space-between; height: calc(var(--sb-row) * 2); }
.sb-nav button {
  font-weight: 700; font-size: 13px; letter-spacing: 0.08em; height: 40px; padding: 0 18px; border-radius: 0; cursor: pointer;
}
.sb-prev { background: var(--sb-paper); color: var(--sb-red); border: 1px solid var(--sb-red); }
.sb-next { background: var(--sb-red); color: #F6EFDC; border: 1px solid var(--sb-red); }
.sb-nav button:disabled { opacity: 0.3; cursor: default; }
.sb-count { font-style: italic; font-size: 12.5px; color: var(--sb-muted); }

.sb-lead { margin: 0; font-size: 18px; line-height: var(--sb-row); color: #3A3020; }
.sb-note {
  margin: 0; font-weight: 600; font-size: 12.5px; letter-spacing: 0.1em; text-transform: uppercase;
  color: #7A6A4A; line-height: var(--sb-row);
}
.sb-error { margin: 0; font-size: 15px; line-height: var(--sb-row); color: var(--sb-red); }
.sb-strokes .sb-row { position: relative; }
.sb-stroke {
  position: absolute; left: 0; top: 14px; height: 3px; border-radius: 2px;
  background: var(--sb-pen); width: 0; opacity: 0; animation: sb-write 4.2s ease-in-out infinite;
}
@keyframes sb-write {
  0% { width: 0; opacity: 0; }
  8% { opacity: 0.55; }
  45% { width: var(--w); opacity: 0.55; }
  85% { width: var(--w); opacity: 0.55; }
  100% { width: var(--w); opacity: 0; }
}
.sb-dots span { display: inline-block; width: 7px; height: 7px; background: var(--sb-red); margin-right: 6px; animation: sb-pulse 1.2s infinite; }
.sb-dots span:nth-child(2) { animation-delay: 0.2s; }
.sb-dots span:nth-child(3) { animation-delay: 0.4s; }
@keyframes sb-pulse { 0%, 100% { opacity: 0.2; } 50% { opacity: 1; } }
.sb-notify {
  font-weight: 700; font-size: 13px; letter-spacing: 0.12em; text-transform: uppercase;
  background: var(--sb-red); color: #F6EFDC; border: 0; border-radius: 0; height: 44px; padding: 0 22px; cursor: pointer;
}
.sb-notify:disabled { opacity: 0.6; cursor: default; }
@media (prefers-reduced-motion: reduce) {
  .sb-stroke { animation: none; width: var(--w); opacity: 0.5; }
  .sb-dots span { animation: none; opacity: 0.7; }
}
`;

// "SOCIAL PSYCHOLOGY" -> "Social Psychology" (keeps roman numerals and common acronyms).
const SMALL_WORDS = new Set(['and', 'of', 'the', 'to', 'in', 'for', 'a', 'an', 'on', 'at', 'by']);
const ACRONYMS = new Set(['IT', 'ICT', 'PR', 'HR', 'NGO', 'NGOS', 'TQM', 'MIS', 'GPA', 'CSR', 'ERP', 'CRM', 'SME', 'SMES', 'VAT']);
function titleCase(input: string): string {
  return input
    .trim()
    .split(/\s+/)
    .map((word, i) => {
      const bare = word.replace(/[^A-Za-z]/g, '');
      if (/^(I|II|III|IV|V|VI)$/i.test(bare) && bare.length > 0 && word === word.toUpperCase()) return word.toUpperCase();
      if (ACRONYMS.has(bare.toUpperCase()) && word === word.toUpperCase()) return word;
      const lower = word.toLowerCase();
      if (i > 0 && SMALL_WORDS.has(lower)) return lower;
      return lower.replace(/(^|[-(/])([a-z])/g, (_, p, c) => p + c.toUpperCase());
    })
    .join(' ');
}

function examLabelFor(examType: string): string {
  return examType === 'mid_semester' ? 'Mid-Semester Examination' : 'End of Semester Examination';
}

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
  year: number | null;
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

  const heading = {
    courseCode,
    courseName: titleCase(courseName || ''),
    examLabel: examLabelFor(examType),
    year,
  };

  return (
    <div className="sb-paper">
      <style>{BOOKLET_CSS}</style>
      <div className="sb-col">
        <div className="sb-margin" aria-hidden="true" />
        <div className="sb-row sb-sm font-condensed">
          <Link href="/papers" className="sb-back">
            ← Library
          </Link>
        </div>

        {state === 'ready' && questions.length > 0 ? (
          <PaginatedScript questions={questions} heading={heading} />
        ) : (
          <>
            <TitleBlock {...heading} solved={false} />
            {state === 'checking' && <CheckingState />}
            {state === 'solving' && <SolvingState />}
            {state === 'not_ready' && <NotReadyState notifyState={notifyState} onNotifyMe={handleNotifyMe} />}
            {state === 'error' && <p className="sb-error">{errorMsg}</p>}
          </>
        )}
      </div>
    </div>
  );
}

type Heading = { courseCode: string; courseName: string; examLabel: string; year: number | null };

/** The heading shown before the answers (and while the paper loads). */
function TitleBlock({ courseCode, courseName, examLabel, year, solved }: Heading & { solved: boolean }) {
  return (
    <section className="sb-title">
      <div className="sb-row sb-sm font-condensed">
        {[courseCode, examLabel, year ? String(year) : null].filter(Boolean).join(' · ')}
      </div>
      <h1 className="font-display">{courseName || courseCode}</h1>
      <div className="sb-row sb-sub">Model answer script · solved by the Distinction Tutoring Team</div>
      <div className="sb-divider" aria-hidden="true" />
      {/* Only stamp the paper as "Solved" once it genuinely has solved
          questions to show — never during loading or a failure. */}
      {solved && <div className="sb-stamp">Solved</div>}
    </section>
  );
}

function CheckingState() {
  return (
    <div aria-live="polite">
      <p className="sb-lead">Opening the booklet…</p>
      <div className="sb-row sb-dots" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}

function SolvingState() {
  const strokes = [
    { w: '78%', d: '0s' },
    { w: '92%', d: '0.5s' },
    { w: '64%', d: '1s' },
    { w: '86%', d: '1.5s' },
    { w: '50%', d: '2s' },
    { w: '72%', d: '2.5s' },
  ];
  return (
    <div aria-live="polite">
      <p className="sb-lead">Solving this paper for the first time…</p>
      <p className="sb-note font-condensed">This page will update automatically — no need to refresh.</p>
      <div className="sb-strokes" aria-hidden="true">
        {strokes.map((s, i) => (
          <div key={i} className="sb-row">
            <span className="sb-stroke" style={{ '--w': s.w, animationDelay: s.d } as React.CSSProperties} />
          </div>
        ))}
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
    <div>
      <p className="sb-lead">
        The Distinction Library Team, in partnership with Distinction Tutors, is currently solving this paper.
      </p>
      <div className="sb-gap" />
      <p className="sb-note font-condensed">Check back soon.</p>
      <div style={{ height: ROW * 2, display: 'flex', alignItems: 'center' }}>
        <button onClick={onNotifyMe} disabled={notifyState !== 'idle'} className="sb-notify font-condensed">
          {notifyState === 'saved' ? 'We\u2019ll notify you' : notifyState === 'saving' ? 'Saving…' : 'Notify me when ready'}
        </button>
      </div>
    </div>
  );
}

/**
 * Paginates solved questions into "pages" of an answer script — never a
 * question+answer pair split across two pages.
 *
 * Every block is rendered once, off-screen, to measure its real height.
 * Blocks are then packed into pages up to PAGE_SCREENS screen-heights tall,
 * so several questions share a page. The first page also carries the title
 * block; later pages carry a one-row running header. Heights are whole
 * multiples of the ruled row, so the writing always sits on the lines.
 *
 * The measuring layer uses position: fixed (parked off-screen). Unlike an
 * absolutely positioned layer, a fixed one never adds to the document's
 * scrollable height — that was what created the blank scroll space.
 */
function PaginatedScript({ questions, heading }: { questions: SolvedQuestion[]; heading: Heading }) {
  const measureRefs = useRef<(HTMLDivElement | null)[]>([]);
  const titleMeasureRef = useRef<HTMLDivElement | null>(null);
  const measureLayerRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [pages, setPages] = useState<SolvedQuestion[][] | null>(null);
  const [pageIndex, setPageIndex] = useState(0);

  useLayoutEffect(() => {
    let cancelled = false;

    function measureAndPaginate() {
      const container = containerRef.current;
      const layer = measureLayerRef.current;
      if (!container || !layer) return;

      // Give the off-screen layer the same width as the real column so
      // wrapped lines (and therefore heights) match exactly.
      layer.style.width = `${container.offsetWidth}px`;

      const snap = (h: number) => Math.ceil(h / ROW) * ROW;
      const top = container.getBoundingClientRect().top + window.scrollY;

      // Height of one page: PAGE_SCREENS screens, minus whatever sits above
      // the booklet, minus the footer (reviewed line + nav = 3 rows) and one
      // row of breathing space.
      const roomForPage = Math.max(
        window.innerHeight * PAGE_SCREENS - top - ROW * 4,
        ROW * MIN_PAGE_ROWS,
      );
      const titleH = snap(titleMeasureRef.current?.offsetHeight ?? ROW * 5);
      const heights = measureRefs.current.map((el) => snap(el ? el.offsetHeight : ROW * 4));

      const built: SolvedQuestion[][] = [];
      let current: SolvedQuestion[] = [];
      let used = 0;
      let budget = Math.max(roomForPage - titleH, ROW * 4); // first page carries the title block

      questions.forEach((q, i) => {
        const h = heights[i];
        if (current.length > 0 && used + h > budget) {
          built.push(current);
          current = [];
          used = 0;
          budget = Math.max(roomForPage - ROW, ROW * 4); // later pages carry a 1-row running header
        }
        current.push(q);
        used += h;
      });
      if (current.length > 0) built.push(current);

      setPages(built.length > 0 ? built : [questions]);
      setPageIndex((prev) => Math.min(prev, Math.max(built.length - 1, 0)));
    }

    measureAndPaginate();
    window.addEventListener('resize', measureAndPaginate);

    // Web fonts can change line wrapping after first paint — measure again
    // once they have loaded so pages are not mis-sized.
    if (typeof document !== 'undefined' && document.fonts?.ready) {
      document.fonts.ready.then(() => {
        if (!cancelled) measureAndPaginate();
      });
    }

    return () => {
      cancelled = true;
      window.removeEventListener('resize', measureAndPaginate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions]);

  const currentPage = pages?.[pageIndex] ?? [];
  const totalPages = pages?.length ?? 1;
  const isFirstPage = pageIndex === 0;

  function goTo(next: number) {
    setPageIndex(next);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0 });
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Hidden measurement pass — real markup, parked off-screen, so heights
          match exactly. position: fixed keeps it out of the page's scroll
          height, so it cannot create blank space below the paper. */}
      <div
        ref={measureLayerRef}
        className="pointer-events-none"
        style={{ position: 'fixed', top: 0, left: '-10000px', visibility: 'hidden' }}
        aria-hidden
      >
        <div ref={titleMeasureRef}>
          <TitleBlock {...heading} solved />
        </div>
        {questions.map((q, i) => (
          <div
            key={q.id}
            ref={(el) => {
              measureRefs.current[i] = el;
            }}
          >
            <ScriptBlock question={q} />
          </div>
        ))}
      </div>

      {pages === null ? (
        <CheckingState />
      ) : (
        <>
          {isFirstPage ? (
            <TitleBlock {...heading} solved />
          ) : (
            <div className="sb-row sb-sm font-condensed">
              {heading.courseCode} · {heading.courseName} — continued
            </div>
          )}

          {currentPage.map((q) => (
            <ScriptBlock key={q.id} question={q} />
          ))}

          <div className="sb-reviewed">Solved — reviewed by the Distinction Tutoring Team</div>
          <div className="sb-nav">
            <button className="sb-prev font-condensed" onClick={() => goTo(Math.max(pageIndex - 1, 0))} disabled={pageIndex === 0}>
              ← PREV
            </button>
            <span className="sb-count">
              Page {pageIndex + 1} of {totalPages}
            </span>
            <button
              className="sb-next font-condensed"
              onClick={() => goTo(Math.min(pageIndex + 1, totalPages - 1))}
              disabled={pageIndex >= totalPages - 1}
            >
              NEXT →
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function ScriptBlock({ question }: { question: SolvedQuestion }) {
  return (
    <div>
      <div className="sb-qhead">
        <b>Question {question.order_index}.</b>
        <span className="sb-meta">
          {question.is_predicted && <span className="sb-badge font-condensed">Predicted</span>}
          {question.marks != null && <span>[{question.marks} marks]</span>}
        </span>
      </div>
      <p className="sb-qtext">{question.question_text}</p>
      <div className="sb-label font-condensed">Model answer</div>
      <p className="sb-ans">{question.answer_text}</p>
      <div className="sb-gap" />
    </div>
  );
}
