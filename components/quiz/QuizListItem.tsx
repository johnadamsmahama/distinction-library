'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Props = {
  id: string;
  slug: string;
  title: string;
  questionCount: number;
  submitted: number;
  closed: boolean;
};

// One row in the "Your quizzes" list, with a two-step delete.
export default function QuizListItem({ id, slug, title, questionCount, submitted, closed }: Props) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [gone, setGone] = useState(false);
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

  const btn = 'font-condensed font-bold uppercase tracking-[.1em] text-[12px] px-3 py-2 border';

  return (
    <div className="bg-white border-l-[3px] border-gold">
      <div className="p-3 flex justify-between gap-3 items-center">
        <Link href={`/admin/quizzes/${id}`} className="min-w-0 flex-1 hover:underline">
          <p className="font-semibold text-navy truncate">{title}</p>
          <p className="text-[12px] text-g600">
            {questionCount} questions · {submitted} submitted · /quiz/{slug}
          </p>
        </Link>
        <span
          className={`font-condensed font-bold text-[11px] uppercase tracking-[.1em] px-2 py-1 flex-none ${closed ? 'bg-g100 text-g600' : 'bg-mint-light text-mint-deep'}`}
        >
          {closed ? 'Closed' : 'Open'}
        </span>
        {!confirming && (
          <button onClick={() => setConfirming(true)} aria-label={`Delete ${title}`} className={`${btn} border-red-700 text-red-700 flex-none`}>
            Delete
          </button>
        )}
      </div>
      {confirming && (
        <div className="px-3 pb-3 flex gap-2 flex-wrap items-center">
          <span className="text-sm text-g800">
            Delete this quiz and {submitted} saved score{submitted === 1 ? '' : 's'}? This cannot be undone.
          </span>
          <button onClick={remove} disabled={busy} className={`${btn} bg-red-700 text-white border-red-700 disabled:opacity-50`}>
            {busy ? 'Deleting...' : 'Yes, delete'}
          </button>
          <button onClick={() => setConfirming(false)} disabled={busy} className={`${btn} border-g500 text-g600`}>
            Cancel
          </button>
        </div>
      )}
      {error && <p className="px-3 pb-3 text-sm text-red-700">{error}</p>}
    </div>
  );
}
