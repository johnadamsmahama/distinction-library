'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ReactivateSheet from '@/components/quiz/ReactivateSheet';

type Props = {
  id: string;
  slug: string;
  title: string;
  questionCount: number;
  submitted: number;
  closed: boolean;
};

// One row in the "Your quizzes" list: open or closed badge, reactivate for closed quizzes, two-step delete.
export default function QuizListItem({ id, slug, title, questionCount, submitted, closed }: Props) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [gone, setGone] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/quizzes/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setGone(true); // disappears straight away
      router.refresh();
    } catch {
      setError('Could not delete the quiz. Try again.');
    } finally {
      setBusy(false);
    }
  }

  if (gone) return null;

  const btn = 'font-condensed font-bold uppercase tracking-[.1em] text-[11px] px-2.5 min-h-[30px] border flex items-center';

  return (
    <div className="bg-white border-l-[3px] border-gold">
      <div className="p-3 pb-2">
        <Link href={`/admin/quizzes/${id}`} className="block min-w-0 hover:underline">
          <p className="font-display font-bold text-[17px] text-navy leading-snug">{title}</p>
          <p className="text-[12px] text-g600 mt-0.5">
            {questionCount} questions · {submitted} submitted · /quiz/{slug}
          </p>
        </Link>
      </div>
      <div className="px-3 pb-3 flex flex-wrap items-center gap-2">
        <span
          className={`font-condensed font-bold text-[10px] uppercase tracking-[.1em] px-2 py-[3px] ${closed ? 'bg-g100 text-g600' : 'bg-mint-light text-mint-deep'}`}
        >
          {closed ? 'Closed' : 'Open'}
        </span>
        <Link href={`/admin/quizzes/${id}`} className={`${btn} border-navy text-navy`}>
          Results
        </Link>
        {closed && (
          <button
            type="button"
            onClick={() => setSheet(true)}
            className={`${btn} bg-gradient-to-br from-gold-light to-gold text-[#2A1F00] border-transparent`}
          >
            ⟲ Reactivate
          </button>
        )}
        {!confirming && (
          <button type="button" onClick={() => setConfirming(true)} aria-label={`Delete ${title}`} className={`${btn} border-red-700 text-red-700 ml-auto`}>
            Delete
          </button>
        )}
      </div>
      {confirming && (
        <div className="px-3 pb-3 flex gap-2 flex-wrap items-center">
          <span className="text-sm text-g800">
            Delete this quiz and {submitted} saved score{submitted === 1 ? '' : 's'}? This cannot be undone.
          </span>
          <button type="button" onClick={remove} disabled={busy} className={`${btn} bg-red-700 text-white border-red-700 disabled:opacity-50`}>
            {busy ? 'Deleting...' : 'Yes, delete'}
          </button>
          <button type="button" onClick={() => setConfirming(false)} disabled={busy} className={`${btn} border-g500 text-g600`}>
            Cancel
          </button>
        </div>
      )}
      {error && <p className="px-3 pb-3 text-sm text-red-700">{error}</p>}
      <ReactivateSheet id={id} open={sheet} onClose={() => setSheet(false)} />
    </div>
  );
}
