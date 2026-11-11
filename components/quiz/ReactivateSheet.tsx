'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const OPTIONS: { label: string; note: string; hours: number | null }[] = [
  { label: '1 hour', note: 'Quick re-sit', hours: 1 },
  { label: '24 hours', note: 'One day', hours: 24 },
  { label: '3 days', note: 'Through the week', hours: 72 },
  { label: '7 days', note: 'A full week', hours: 168 },
  { label: 'No deadline', note: 'Stays open until you close it', hours: null },
];

// Bottom sheet that reopens a closed or expired quiz with a fresh deadline.
export default function ReactivateSheet({ id, open, onClose }: { id: string; open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [pick, setPick] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setPick(1);
    setError(null);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  async function confirm() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/quizzes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: true, hours: OPTIONS[pick].hours }),
      });
      if (!res.ok) throw new Error();
      onClose();
      router.refresh();
    } catch {
      setError('Could not reactivate the quiz. Try again.');
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true" aria-label="Reactivate quiz">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-navy-deep/60" />
      <div className="relative w-full max-w-[620px] bg-white rounded-t-[22px] px-5 pt-6 pb-[calc(24px+env(safe-area-inset-bottom,0px))] shadow-2xl">
        <h2 className="font-display font-bold text-2xl text-navy">Reactivate this quiz</h2>
        <p className="text-[13px] text-g600 mt-1 mb-4">
          Choose how long it stays open. The same link works again and every saved score is kept.
        </p>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {OPTIONS.map((o, i) => (
            <button
              key={o.label}
              type="button"
              onClick={() => setPick(i)}
              aria-pressed={pick === i}
              className={`text-left p-3 border-[1.5px] ${pick === i ? 'border-gold bg-[#FFF7DC]' : 'border-[#DDE2EE] bg-[#F6F8FC]'}`}
            >
              <span className="block font-bold text-[14px] text-navy">{o.label}</span>
              <span className="block text-[11.5px] text-g600 mt-0.5">{o.note}</span>
            </button>
          ))}
        </div>
        {error && <p className="text-sm text-red-700 mb-2">{error}</p>}
        <button
          type="button"
          onClick={confirm}
          disabled={busy}
          className="w-full min-h-[48px] bg-gradient-to-br from-gold-light to-gold text-[#2A1F00] font-condensed font-bold uppercase tracking-[.14em] text-[13px] disabled:opacity-50"
        >
          {busy ? 'Reactivating...' : 'Reactivate quiz'}
        </button>
      </div>
    </div>
  );
}
