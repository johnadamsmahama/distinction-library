'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import ReactivateSheet from '@/components/quiz/ReactivateSheet';

type Props = { id: string; slug: string; published: boolean; closed: boolean };

// Action row for one quiz: copy link, close or reactivate, and a "more" menu (CSV export, delete).
export default function QuizActions({ id, slug, closed }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [menu, setMenu] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menu) return;
    const away = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(false);
    };
    document.addEventListener('mousedown', away);
    return () => document.removeEventListener('mousedown', away);
  }, [menu]);

  const btn = 'font-condensed font-bold uppercase tracking-[.12em] text-[11.5px] px-3.5 min-h-[34px] border-[1.5px] flex items-center justify-center';

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
    const res = await fetch(`/api/admin/quizzes/${id}`, { method: 'DELETE' });
    setBusy(false);
    if (!res.ok) return setError('Could not delete the quiz.');
    router.push('/admin/quizzes');
    router.refresh();
  }

  return (
    <div>
      <div className="flex gap-2 flex-wrap items-center justify-center">
        <button type="button" onClick={copy} className={`${btn} bg-navy text-white border-navy`}>
          {copied ? 'Copied' : 'Copy link'}
        </button>
        {closed ? (
          <button
            type="button"
            onClick={() => setSheet(true)}
            className={`${btn} bg-gradient-to-br from-gold-light to-gold text-[#2A1F00] border-transparent`}
          >
            ⟲ Reactivate
          </button>
        ) : (
          <button type="button" onClick={closeQuiz} disabled={busy} className={`${btn} border-navy text-navy disabled:opacity-50`}>
            {busy ? 'Closing...' : 'Close quiz'}
          </button>
        )}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenu((m) => !m)}
            aria-label="More actions"
            aria-expanded={menu}
            className={`${btn} border-navy text-navy !px-3 text-[16px] leading-none`}
          >
            ⋯
          </button>
          {menu && (
            <div className="absolute right-0 top-[calc(100%+4px)] z-20 min-w-[170px] bg-white text-left shadow-[0_12px_30px_rgba(0,0,0,.25)]">
              <a href={`/api/admin/quizzes/${id}/csv`} className="block px-4 py-3 text-[13px] font-semibold text-g800 hover:bg-g100">
                Export CSV
              </a>
              <button
                type="button"
                onClick={() => {
                  setMenu(false);
                  setConfirmDelete(true);
                }}
                className="block w-full text-left px-4 py-3 text-[13px] font-semibold text-red-700 border-t border-g100 hover:bg-g100"
              >
                Delete quiz
              </button>
            </div>
          )}
        </div>
      </div>

      {confirmDelete && (
        <div className="mt-3 border border-red-700/40 bg-red-700/5 p-3 text-left">
          <p className="text-sm text-g800 mb-2">Delete this quiz and every saved score? This cannot be undone.</p>
          <div className="flex gap-2">
            <button type="button" onClick={remove} disabled={busy} className={`${btn} bg-red-700 text-white border-red-700 disabled:opacity-50`}>
              {busy ? 'Deleting...' : 'Yes, delete'}
            </button>
            <button type="button" onClick={() => setConfirmDelete(false)} disabled={busy} className={`${btn} border-g500 text-g600`}>
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
