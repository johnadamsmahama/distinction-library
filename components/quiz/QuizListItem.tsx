'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ReactivateSheet from '@/components/quiz/ReactivateSheet';

type Props = {
  id: string;
  slug: string;
  title: string;
  objectives: number;
  theory: number;
  submitted: number;
  published: boolean;
  closesAt: string | null;
  closed: boolean;
};

const WEEK = 7 * 24 * 3600 * 1000;

// "BGEC107 INTRODUCTION TO IT" -> code "BGEC107", name "Introduction To It".
function splitTitle(title: string) {
  const clean = title.replace(/\s+/g, ' ').trim();
  const m = clean.match(/^([A-Za-z]{2,6}\s?\d{2,4})\b[\s:–-]*(.*)$/);
  const code = m ? m[1].replace(/\s/g, '').toUpperCase() : '';
  let name = m && m[2].trim() ? m[2].trim() : clean;
  if (name === name.toUpperCase()) {
    name = name.toLowerCase().replace(/(^|[\s[(])([a-z])/g, (_s, a: string, b: string) => a + b.toUpperCase());
  }
  return { code, name };
}

function span(ms: number) {
  const a = Math.abs(ms);
  const h = Math.floor(a / 3600000);
  const m = Math.floor((a % 3600000) / 60000);
  return h >= 24 ? `${Math.floor(h / 24)}d ${h % 24}h` : `${h}h ${m}m`;
}

const dateOf = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Accra' });

// One quiz as a certificate card: status, live countdown, results link, copy link, close or reactivate, delete.
export default function QuizListItem({ id, slug, title, objectives, theory, submitted, published, closesAt, closed: closedInitial }: Props) {
  const router = useRouter();
  const [now, setNow] = useState<number | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [gone, setGone] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  if (gone) return null;

  const end = closesAt ? new Date(closesAt).getTime() : null;
  const closed = now === null ? closedInitial : !published || (end !== null && end < now);
  const { code, name } = splitTitle(title);
  const digits = code.match(/\d+/)?.[0];
  const mono = digits ? digits.slice(-3) : name.slice(0, 2).toUpperCase();

  const remaining = closed ? 'Closed' : end === null ? 'Open' : now === null ? '...' : span(end - now);
  const remainingLabel = closed ? 'Ended' : end === null ? 'No deadline' : 'Remaining';
  const pct = closed ? 0 : end === null || now === null ? 100 : Math.max(3, Math.min(100, ((end - now) / WEEK) * 100));
  const note = !published ? 'Switched off by an admin' : end === null ? 'No deadline' : `${closed ? 'Closed' : 'Closes'} ${dateOf(closesAt as string)}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/quiz/${slug}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Could not copy the link.');
    }
  }

  async function closeQuiz() {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/admin/quizzes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ published: false }),
    });
    setBusy(false);
    if (!res.ok) return setError('Could not close the quiz.');
    router.refresh();
  }

  async function remove() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/quizzes/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setGone(true);
      router.refresh();
    } catch {
      setError('Could not delete the quiz. Try again.');
    } finally {
      setBusy(false);
    }
  }

  const btn = 'font-condensed font-bold uppercase tracking-[.12em] text-[11px] px-3 min-h-[32px] border-[1.5px] flex items-center justify-center';

  return (
    <div className="bg-[#FFFCF4] px-5 pt-6 pb-5 mb-4 shadow-[inset_0_0_0_6px_#FFFCF4,inset_0_0_0_7px_#C9A02C,0_14px_26px_-20px_rgba(60,45,10,.6)]">
      <div className="flex items-center gap-3.5">
        <Link
          href={`/admin/quizzes/${id}`}
          aria-label={`Open results for ${name}`}
          className={`w-[46px] h-[46px] grid place-items-center font-display font-bold text-[14px] flex-none ${closed ? 'bg-[#8A93A8] text-white' : 'bg-navy text-gold-light'}`}
        >
          {mono}
        </Link>
        <div className="min-w-0 flex-1">
          <Link href={`/admin/quizzes/${id}`} className="block font-display font-bold text-[18px] leading-[1.2] text-navy hover:underline">
            {name}
          </Link>
          <p className="font-condensed font-semibold text-[10.5px] uppercase tracking-[.16em] text-[#7A6F52] mt-1 break-all">
            {code ? `${code} · ` : ''}/quiz/{slug}
          </p>
        </div>
        <span
          className={`font-condensed font-bold text-[9.5px] uppercase tracking-[.12em] px-[7px] py-[2px] border flex-none ${
            closed ? 'text-[#6B7385] border-[#C3C8D4] bg-[#EEF0F4]' : 'text-[#2F7D5B] border-[#2F7D5B]/45 bg-[#2F7D5B]/[.08]'
          }`}
        >
          {closed ? 'Closed' : 'Open'}
        </span>
      </div>

      <div className="grid grid-cols-3 text-center mt-4 mb-3 py-3 border-y border-[#DACFAE]">
        {[
          { v: String(submitted), l: 'Submitted' },
          { v: String(objectives + theory), l: 'Questions' },
          { v: remaining, l: remainingLabel },
        ].map((s, i) => (
          <div key={s.l} className={i > 0 ? 'border-l border-dotted border-gold' : ''}>
            <b className="block font-display font-bold text-[22px] text-navy">{s.v}</b>
            <span className="font-condensed font-semibold text-[10px] uppercase tracking-[.14em] text-[#7A6F52]">{s.l}</span>
          </div>
        ))}
      </div>

      <div className="h-1 bg-[#DACFAE] mb-1.5">
        <div className={`h-full ${closed ? 'bg-[#B7BDCA]' : 'bg-gold'}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="font-display italic font-semibold text-[13px] text-[#7A6F52] mb-3.5">{note}</p>

      <div className="flex flex-wrap gap-1.5">
        <Link href={`/admin/quizzes/${id}`} className={`${btn} bg-navy text-white border-navy`}>
          Results
        </Link>
        <button type="button" onClick={copy} className={`${btn} border-navy text-navy`}>
          {copied ? 'Copied' : 'Copy link'}
        </button>
        {closed ? (
          <button type="button" onClick={() => setSheet(true)} className={`${btn} bg-gradient-to-br from-gold-light to-gold text-[#2A1F00] border-transparent`}>
            ⟲ Reactivate
          </button>
        ) : (
          <button type="button" onClick={closeQuiz} disabled={busy} className={`${btn} border-navy text-navy disabled:opacity-50`}>
            Close
          </button>
        )}
        {!confirming && (
          <button type="button" onClick={() => setConfirming(true)} aria-label={`Delete ${name}`} className={`${btn} border-red-700 text-red-700`}>
            Delete
          </button>
        )}
      </div>

      {confirming && (
        <div className="mt-3 border border-red-700/40 bg-red-700/5 p-3">
          <p className="text-sm text-g800 mb-2">
            Delete this quiz and {submitted} saved score{submitted === 1 ? '' : 's'}? This cannot be undone.
          </p>
          <div className="flex gap-1.5">
            <button type="button" onClick={remove} disabled={busy} className={`${btn} bg-red-700 text-white border-red-700 disabled:opacity-50`}>
              {busy ? 'Deleting...' : 'Yes, delete'}
            </button>
            <button type="button" onClick={() => setConfirming(false)} disabled={busy} className={`${btn} border-g500 text-g600`}>
              Cancel
            </button>
          </div>
        </div>
      )}
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
      <ReactivateSheet id={id} open={sheet} onClose={() => setSheet(false)} />
    </div>
  );
}
