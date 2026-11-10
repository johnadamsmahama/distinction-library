'use client';

import { useMemo, useState } from 'react';
import { friendlyFirstName, initialsOf } from '@/lib/quiz/names';

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

type Tone = 'red' | 'amber' | 'plain';
const CHIP: Record<Tone, string> = {
  red: 'text-red-700 border-red-700/40 bg-red-700/[.07]',
  amber: 'text-amber-700 border-amber-700/40 bg-amber-700/[.08]',
  plain: 'text-[#7A6F52] border-[#DACFAE] bg-transparent',
};

function minsOf(m: string) {
  return m.startsWith('<') ? 0 : parseInt(m, 10) || 0;
}

function flagsOf(r: ResultRow): { text: string; tone: Tone }[] {
  const out: { text: string; tone: Tone }[] = [];
  if (r.reason === 'cheating') out.push({ text: '⚑ Attempted cheating', tone: 'red' });
  if (r.reason === 'time') out.push({ text: '⏱ Time ran out', tone: 'amber' });
  if (r.switches > 0) out.push({ text: `Left quiz ${r.switches}×`, tone: r.reason === 'cheating' ? 'red' : 'plain' });
  return out;
}

function outcomeOf(r: ResultRow): { title: string; body: string; cls: string; titleCls: string } {
  const times = `${r.switches} time${r.switches === 1 ? '' : 's'}`;
  if (r.reason === 'cheating') {
    return {
      title: 'Auto-submitted · cheating attempt',
      body: r.switches > 0 ? `The student left the quiz ${times}, so the system submitted it automatically.` : 'The system detected a cheating attempt and submitted the quiz automatically.',
      cls: 'border-red-700 bg-red-700/[.07]',
      titleCls: 'text-red-700',
    };
  }
  if (r.reason === 'time') {
    return {
      title: 'Time ran out · auto-submitted',
      body: 'The timer finished and the answers given so far were saved.',
      cls: 'border-amber-700 bg-amber-700/[.08]',
      titleCls: 'text-amber-700',
    };
  }
  return {
    title: 'Submitted by the student',
    body: r.switches > 0 ? `Finished and submitted normally, after leaving the quiz ${times}.` : 'Finished and submitted normally, without leaving the quiz.',
    cls: 'border-[#7A6F52] bg-[#F7F1E1]',
    titleCls: 'text-[#7A6F52]',
  };
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
  const first = friendlyFirstName(r.name);
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
    <div className="bg-[#F7F1E1] p-3 flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
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
  const [filter, setFilter] = useState<'all' | 'flag' | 'time' | 'un'>('all');
  const [sort, setSort] = useState<'score' | 'low' | 'name' | 'fast'>('score');
  const [open, setOpen] = useState<string | null>(null);

  const unrated = (r: ResultRow) => r.theory.some((t) => !t.rating);
  const searched = useMemo(() => rows.filter((r) => r.name.toLowerCase().includes(q.trim().toLowerCase())), [rows, q]);
  const nFlag = searched.filter((r) => flagsOf(r).length > 0).length;
  const nTime = searched.filter((r) => r.reason === 'time').length;
  const nUn = searched.filter(unrated).length;
  const shown = useMemo(() => {
    let list = searched;
    if (filter === 'flag') list = list.filter((r) => flagsOf(r).length > 0);
    if (filter === 'time') list = list.filter((r) => r.reason === 'time');
    if (filter === 'un') list = list.filter(unrated);
    const out = list.slice();
    if (sort === 'low') out.sort((a, b) => a.score - b.score);
    if (sort === 'name') out.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === 'fast') out.sort((a, b) => minsOf(a.mins) - minsOf(b.mins));
    return out;
  }, [searched, filter, sort]);

  const chip = (on: boolean) =>
    `h-11 px-4 border-[1.5px] font-condensed font-bold uppercase tracking-[.12em] text-[12px] ${on ? 'bg-navy text-white border-navy' : 'bg-transparent text-g800 border-[#DACFAE]'}`;

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        <label className="flex-[1_1_100%] flex items-center gap-2 h-12 border-[1.5px] border-[#DACFAE] bg-[#FFFCF4] px-3 focus-within:border-navy focus-within:ring-2 focus-within:ring-navy/30">
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
        <button type="button" className={chip(filter === 'time')} onClick={() => setFilter('time')}>Ran out of time {nTime}</button>
        {hasTheory && (
          <button type="button" className={chip(filter === 'un')} onClick={() => setFilter('un')}>Theory unrated {nUn}</button>
        )}
        <select
          aria-label="Sort"
          value={sort}
          onChange={(e) => setSort(e.target.value as typeof sort)}
          className="h-11 border-[1.5px] border-[#DACFAE] bg-[#FFFCF4] px-2 text-[14px] font-medium"
        >
          <option value="score">Highest score</option>
          <option value="low">Lowest score</option>
          <option value="name">Name A to Z</option>
          <option value="fast">Fastest finish</option>
        </select>
      </div>

      <p className="text-[12.5px] text-[#7A6F52] mb-3">
        Showing {shown.length} of {rows.length} · tap a name to see the full attempt record
      </p>

      {shown.length === 0 && <p className="border border-dashed border-[#DACFAE] p-6 text-center text-g600 text-sm">No student matches that search.</p>}

      <div className="flex flex-col gap-2.5">
        {shown.map((r) => {
          const isOpen = open === r.id;
          const flags = flagsOf(r);
          const out = outcomeOf(r);
          const top = r.rank <= 3;
          const unratedCount = r.theory.filter((t) => !t.rating).length;
          return (
            <div key={r.id} className={`bg-[#FFFCF4] border-l-[3px] shadow-[0_6px_16px_-14px_rgba(60,45,10,.7)] ${isOpen ? 'border-gold' : 'border-transparent'}`}>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : r.id)}
                aria-expanded={isOpen}
                className="w-full text-left grid grid-cols-[48px_minmax(0,1fr)_auto] gap-x-3.5 items-center px-3.5 py-3.5"
              >
                <span
                  className={`w-12 h-12 rounded-full grid place-items-center font-display font-bold text-[16px] text-navy ${
                    top ? 'bg-gradient-to-br from-gold-light to-gold ring-[1px] ring-gold ring-offset-[3px] ring-offset-[#FFFCF4]' : 'bg-[#F7F1E1] ring-1 ring-inset ring-[#DACFAE]'
                  }`}
                  aria-hidden="true"
                >
                  {initialsOf(r.name)}
                </span>
                <span className="min-w-0">
                  <span className="block font-display font-bold text-[16px] leading-[1.25] tracking-[.01em] break-words">{r.name.toUpperCase()}</span>
                  <span className="block text-[12px] text-[#7A6F52] mt-0.5">
                    <b className="font-condensed font-bold text-[11.5px] tracking-[.14em] text-gold">№ {r.rank}</b> · {r.mins}
                  </span>
                  {flags.length > 0 && (
                    <span className="flex flex-wrap gap-1.5 mt-2">
                      {flags.map((f) => (
                        <span key={f.text} className={`font-condensed font-bold text-[10.5px] uppercase tracking-[.1em] px-2 py-[3px] border ${CHIP[f.tone]}`}>
                          {f.text}
                        </span>
                      ))}
                    </span>
                  )}
                </span>
                <span className="text-right">
                  <b className="font-display font-bold text-[26px] leading-none text-navy tabular-nums">
                    {r.score}
                    <span className="font-medium text-[13px] text-[#7A6F52]">/{r.total}</span>
                  </b>
                  <span className="block w-[62px] h-[3px] bg-[#DACFAE] mt-2 ml-auto">
                    <i className="block h-full bg-gold" style={{ width: `${r.pct}%` }} />
                  </span>
                  <span className="block font-condensed font-semibold text-[11px] tracking-[.1em] text-[#7A6F52] mt-1">{r.pct}%</span>
                </span>
              </button>

              {isOpen && (
                <div className="px-4 pb-5 flex flex-col gap-4">
                  <div className={`border-l-[3px] px-3.5 py-3 text-[13px] ${out.cls}`}>
                    <b className={`block font-condensed font-bold text-[12px] uppercase tracking-[.14em] mb-0.5 ${out.titleCls}`}>{out.title}</b>
                    {out.body}
                  </div>

                  <div className="grid grid-cols-2">
                    {[
                      { l: 'Time taken', v: r.mins, warn: false },
                      { l: 'Submitted', v: r.submitted, warn: false },
                      { l: 'Left the quiz', v: r.switches ? `${r.switches} time${r.switches === 1 ? '' : 's'}` : 'Never', warn: r.switches > 1 },
                      { l: `Theory (${r.theory.length})`, v: !hasTheory ? 'No theory' : unratedCount ? `${unratedCount} awaiting rating` : 'All rated', warn: false },
                    ].map((f, i) => (
                      <div key={f.l} className={`py-2.5 border-b border-dotted border-gold ${i % 2 === 0 ? 'pr-3' : ''}`}>
                        <span className="block font-condensed font-semibold text-[10.5px] uppercase tracking-[.16em] text-[#7A6F52]">{f.l}</span>
                        <b className={`font-display font-bold text-[16px] ${f.warn ? 'text-red-700' : ''}`}>{f.v}</b>
                      </div>
                    ))}
                  </div>

                  <div className={`grid gap-6 ${hasObjectives && hasTheory ? 'md:grid-cols-[5fr_7fr] md:gap-8' : ''}`}>
                    {hasObjectives && (
                      <div>
                        <h4 className="font-condensed font-bold text-[12px] uppercase tracking-[.14em] text-[#7A6F52] mb-2 flex justify-between">
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
                        <h4 className="font-condensed font-bold text-[12px] uppercase tracking-[.14em] text-[#7A6F52] mb-2 flex items-center justify-between">
                          <span>Theory</span>
                          <Strip r={r} />
                        </h4>
                        <div className="flex flex-col gap-4">
                          {r.theory.map((t) => {
                            const k = t.rating || 'none';
                            return (
                              <div key={t.n}>
                                <div className="flex items-center justify-between gap-2 mb-1">
                                  <span className="font-condensed font-bold text-[12px] uppercase tracking-[.12em] text-[#7A6F52]">Theory {t.n}</span>
                                  <span className={`font-condensed font-bold text-[11px] uppercase tracking-[.08em] px-2 py-[2px] ${RATE_BADGE[k]}`}>
                                    {t.rating ? RATE_LABEL[t.rating] : 'Not rated'}
                                  </span>
                                </div>
                                <p className="text-[15px] font-medium leading-5 mb-1">{t.text}</p>
                                <p className={`text-[14.5px] leading-5 bg-[#F7F1E1] px-3 py-2 whitespace-pre-wrap break-words border-l-[3px] border-[#DACFAE] ${t.answer ? '' : 'italic text-g600'}`}>
                                  {t.answer || 'No answer typed.'}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <ShareBar r={r} slug={slug} title={title} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
