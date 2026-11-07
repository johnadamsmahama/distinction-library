'use client';

import { useMemo, useState } from 'react';

export type ResultRow = {
  id: string;
  rank: number;
  name: string;
  score: number;
  total: number;
  pct: number;
  mins: string;
  submitted: string;
  reason: 'cheating' | 'time' | null;
  switches: number;
  cells: boolean[]; // true = correct
  miss: { n: number; text: string; chose: string | null; correct: string }[];
  theory: { n: number; text: string; answer: string; rating: string | null }[];
};

const RATE_LABEL: Record<string, string> = { got: 'Got it', partly: 'Partly', missed: 'Missed' };
const RATE_BADGE: Record<string, string> = {
  got: 'bg-navy text-white',
  partly: 'border border-navy text-navy bg-g100',
  missed: 'border border-g500 text-g800 bg-white',
  none: 'bg-g100 text-g600',
};

function minsOf(m: string) {
  return m.startsWith('<') ? 0 : parseInt(m, 10) || 0;
}

function flagOf(r: ResultRow): { text: string; cls: string } | null {
  if (r.reason === 'cheating') return { text: 'Attempted cheating', cls: 'bg-navy text-white font-condensed font-bold text-[11px] uppercase tracking-[.08em] px-2 py-1' };
  if (r.switches > 0) return { text: `Left quiz ${r.switches}x`, cls: 'bg-g100 text-g800 border border-g500 font-condensed font-bold text-[11px] uppercase tracking-[.08em] px-2 py-1' };
  if (r.reason === 'time') return { text: 'Time ran out', cls: 'text-g600 text-[13px]' };
  return null;
}

function Flag({ r }: { r: ResultRow }) {
  const f = flagOf(r);
  if (!f) return <span className="text-g500">-</span>;
  return <span className={`inline-block ${f.cls}`}>{f.text}</span>;
}

function Strip({ r }: { r: ResultRow }) {
  return (
    <span className="inline-flex gap-[2px]" aria-hidden="true">
      {r.theory.map((t) => {
        const k = t.rating || 'none';
        const base = 'block w-[9px] h-[13px]';
        if (k === 'got') return <i key={t.n} className={`${base} bg-navy`} />;
        if (k === 'partly') return <i key={t.n} className={`${base} border border-navy text-navy`} style={{ background: 'linear-gradient(to top, currentColor 50%, transparent 50%)' }} />;
        if (k === 'missed') return <i key={t.n} className={`${base} border border-navy bg-white`} />;
        return <i key={t.n} className={`${base} bg-g100`} />;
      })}
    </span>
  );
}

function ShareBar({ r, slug, title }: { r: ResultRow; slug: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const link = () => `${window.location.origin}/quiz/${slug}/result/${r.id}`;
  const first = r.name.trim().split(/\s+/)[0];
  const message = () =>
    `Hello ${first}, your result for ${title} is ready: ${r.score} / ${r.total}. Open this link to see your answers${r.reason === 'cheating' ? '' : ' and the model answers'}: ${link()}`;
  async function copy() {
    try {
      await navigator.clipboard.writeText(message());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copy this message', message());
    }
  }
  const btn = 'font-condensed font-bold uppercase tracking-[.1em] text-[12px] px-3 min-h-[44px] border border-navy flex items-center justify-center';
  return (
    <div className="bg-g100 p-3 flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
      <p className="text-[14px] text-g800 md:flex-1">Send {first} their result link, in case they could not see it.</p>
      <div className="flex gap-2">
        <a
          className={`${btn} bg-navy text-white flex-1 md:flex-none`}
          href="#"
          onClick={(e) => {
            e.preventDefault();
            window.open(`https://wa.me/?text=${encodeURIComponent(message())}`, '_blank', 'noopener');
          }}
        >
          Share on WhatsApp
        </a>
        <button type="button" onClick={copy} className={`${btn} bg-white text-navy flex-1 md:flex-none`}>
          {copied ? 'Copied' : 'Copy message'}
        </button>
      </div>
    </div>
  );
}

export default function QuizResultsList({ rows, slug, title, hasObjectives, hasTheory }: { rows: ResultRow[]; slug: string; title: string; hasObjectives: boolean; hasTheory: boolean }) {
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<'all' | 'flag' | 'un'>('all');
  const [sort, setSort] = useState<'score' | 'low' | 'name' | 'fast'>('score');
  const [open, setOpen] = useState<string | null>(null);

  const unrated = (r: ResultRow) => r.theory.some((t) => !t.rating);
  const searched = useMemo(() => rows.filter((r) => r.name.toLowerCase().includes(q.trim().toLowerCase())), [rows, q]);
  const nFlag = searched.filter((r) => flagOf(r)).length;
  const nUn = searched.filter(unrated).length;
  const shown = useMemo(() => {
    let list = searched;
    if (filter === 'flag') list = list.filter((r) => flagOf(r));
    if (filter === 'un') list = list.filter(unrated);
    const out = list.slice();
    if (sort === 'low') out.sort((a, b) => a.score - b.score);
    if (sort === 'name') out.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === 'fast') out.sort((a, b) => minsOf(a.mins) - minsOf(b.mins));
    return out;
  }, [searched, filter, sort]);

  const chip = (on: boolean) =>
    `h-11 px-4 border font-condensed font-bold uppercase tracking-[.1em] text-[12px] ${on ? 'bg-navy text-white border-navy' : 'bg-white text-g800 border-[#C7CEDC]'}`;

  return (
    <div className="bg-white p-4">
      <h3 className="font-display font-bold text-lg text-navy mb-3">Results</h3>

      <div className="flex flex-wrap gap-2 mb-2">
        <label className="flex-[1_1_100%] md:flex-[1_1_320px] flex items-center gap-2 h-11 border border-[#C7CEDC] bg-white px-3 focus-within:border-navy focus-within:ring-2 focus-within:ring-navy/30">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className="text-g600 shrink-0">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-4-4" />
          </svg>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search a student by name"
            aria-label="Search a student by name"
            className="flex-1 min-w-0 bg-transparent outline-none text-[16px]"
          />
        </label>
        <button type="button" className={chip(filter === 'all')} onClick={() => setFilter('all')}>All {searched.length}</button>
        <button type="button" className={chip(filter === 'flag')} onClick={() => setFilter('flag')}>Flagged {nFlag}</button>
        {hasTheory && (
          <button type="button" className={chip(filter === 'un')} onClick={() => setFilter('un')}>Theory unrated {nUn}</button>
        )}
        <select
          aria-label="Sort"
          value={sort}
          onChange={(e) => setSort(e.target.value as typeof sort)}
          className="h-11 border border-[#C7CEDC] bg-white px-2 text-[14px] font-medium"
        >
          <option value="score">Highest score</option>
          <option value="low">Lowest score</option>
          <option value="name">Name A to Z</option>
          <option value="fast">Fastest finish</option>
        </select>
      </div>

      <p className="text-[12.5px] text-g600 mb-3 flex flex-wrap gap-x-4 gap-y-1 items-center">
        {hasObjectives && (
          <span>
            Objectives: <b className="inline-block w-[10px] h-[10px] bg-g100 border border-[#C7CEDC] align-[-1px]" /> correct{' '}
            <b className="inline-block w-[10px] h-[10px] bg-navy align-[-1px]" /> wrong
          </span>
        )}
        {hasTheory && (
          <span>
            Theory: <b className="inline-block w-[9px] h-[11px] bg-navy align-[-1px]" /> got it{' '}
            <b className="inline-block w-[9px] h-[11px] border border-navy text-navy align-[-1px]" style={{ background: 'linear-gradient(to top, currentColor 50%, transparent 50%)' }} /> partly{' '}
            <b className="inline-block w-[9px] h-[11px] border border-navy bg-white align-[-1px]" /> missed{' '}
            <b className="inline-block w-[9px] h-[11px] bg-g100 align-[-1px]" /> not rated
          </span>
        )}
        <span>Showing {shown.length} of {rows.length}</span>
      </p>

      {shown.length === 0 && <p className="border border-dashed border-[#C7CEDC] p-6 text-center text-g600 text-sm">No student matches that search.</p>}

      <div className="flex flex-col gap-2">
        {shown.map((r) => {
          const isOpen = open === r.id;
          return (
            <div key={r.id} className={`border bg-white ${isOpen ? 'border-navy shadow-[3px_3px_0_#C7CEDC]' : 'border-g100'}`}>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : r.id)}
                aria-expanded={isOpen}
                className="w-full text-left grid grid-cols-[28px_minmax(0,1fr)_84px] md:grid-cols-[40px_minmax(0,1.3fr)_130px_150px_minmax(0,1fr)_170px_20px] gap-x-3 items-center px-3 py-3 min-h-[64px]"
              >
                <span className="row-span-2 md:row-span-1 font-display font-bold text-lg text-g600">{r.rank}</span>
                <span className="font-medium text-[16px] leading-5 break-words">{r.name}</span>
                <span className="md:hidden col-start-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-g600 mt-1">
                  <span>{r.mins}</span>
                  {hasTheory && <Strip r={r} />}
                  {flagOf(r) && <Flag r={r} />}
                </span>
                <span className="hidden md:block text-[14px] text-g600">{r.mins} · {r.submitted.slice(-5)}</span>
                <span className="col-start-3 row-start-1 row-span-2 md:col-auto md:row-auto md:row-span-1 text-right md:text-left">
                  <b className="font-bold text-[18px] tabular-nums">{r.score} / {r.total}</b>
                  <span className="block h-[6px] bg-g100 mt-1"><i className="block h-full bg-navy" style={{ width: `${r.pct}%` }} /></span>
                </span>
                <span className="hidden md:block">{hasTheory && <Strip r={r} />}</span>
                <span className="hidden md:block"><Flag r={r} /></span>
                <span className="hidden md:block text-g600 text-lg text-right" aria-hidden="true">{isOpen ? '−' : '+'}</span>
              </button>

              {isOpen && (
                <div className="border-t border-g100 p-3 md:p-5 flex flex-col gap-5">
                  <ShareBar r={r} slug={slug} title={title} />
                  <div className={`grid gap-6 ${hasObjectives && hasTheory ? 'md:grid-cols-[5fr_7fr] md:gap-8' : ''}`}>
                    {hasObjectives && (
                      <div>
                        <h4 className="font-condensed font-bold text-[12px] uppercase tracking-[.14em] text-g600 mb-2 flex justify-between">
                          <span>Objectives</span>
                          <span>{r.score} of {r.total} correct</span>
                        </h4>
                        <div className="grid grid-cols-10 gap-[3px]">
                          {r.cells.map((ok, i) => (
                            <span key={i} className={`h-[30px] flex items-center justify-center text-[12px] font-bold ${ok ? 'bg-g100 text-navy' : 'bg-navy text-white'}`}>{i + 1}</span>
                          ))}
                        </div>
                        {r.miss.length > 0 && (
                          <ul className="mt-3 flex flex-col gap-2">
                            {r.miss.map((m) => (
                              <li key={m.n} className="border-l-[3px] border-navy pl-3 text-[14px] leading-[19px]">
                                <b>Q{m.n}</b> {m.text}
                                <br />
                                <span className="text-g600">{m.chose ? `Chose ${m.chose}` : 'No answer'}, correct is {m.correct}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                    {hasTheory && (
                      <div>
                        <h4 className="font-condensed font-bold text-[12px] uppercase tracking-[.14em] text-g600 mb-2">Theory</h4>
                        <div className="flex flex-col gap-4">
                          {r.theory.map((t) => {
                            const k = t.rating || 'none';
                            return (
                              <div key={t.n}>
                                <div className="flex items-center justify-between gap-2 mb-1">
                                  <span className="font-condensed font-bold text-[12px] uppercase tracking-[.12em] text-g600">Theory {t.n}</span>
                                  <span className={`font-condensed font-bold text-[11px] uppercase tracking-[.08em] px-2 py-[2px] ${RATE_BADGE[k]}`}>
                                    {t.rating ? RATE_LABEL[t.rating] : 'Not rated'}
                                  </span>
                                </div>
                                <p className="text-[15px] font-medium leading-5 mb-1">{t.text}</p>
                                <p className={`text-[14.5px] leading-5 bg-g100 px-3 py-2 whitespace-pre-wrap break-words border-l-[3px] border-[#C7CEDC] ${t.answer ? '' : 'italic text-g600'}`}>
                                  {t.answer || 'No answer typed.'}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
