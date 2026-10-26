'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function QuizActions({ id, slug, published }: { id: string; slug: string; published: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const btn = 'font-condensed font-bold uppercase tracking-[.1em] text-[12px] px-3 py-2 border';

  async function copy() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/quiz/${slug}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Could not copy the link.');
    }
  }
  async function toggle() {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/admin/quizzes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ published: !published }),
    });
    setBusy(false);
    if (!res.ok) return setError('Could not update the quiz.');
    router.refresh();
  }
  async function remove() {
    setBusy(true);
    const res = await fetch(`/api/admin/quizzes/${id}`, { method: 'DELETE' });
    setBusy(false);
    if (!res.ok) return setError('Could not delete the quiz.');
    router.push('/admin/quizzes');
    router.refresh();
  }

  return (
    <div className="flex gap-2 flex-wrap items-center">
      <button onClick={copy} className={`${btn} bg-navy text-white border-navy`}>{copied ? 'Copied' : 'Copy link'}</button>
      <button onClick={toggle} disabled={busy} className={`${btn} border-navy text-navy`}>{published ? 'Close quiz' : 'Reopen quiz'}</button>
      <a href={`/api/admin/quizzes/${id}/csv`} className={`${btn} border-navy text-navy`}>Export CSV</a>
      {confirmDelete ? (
        <>
          <button onClick={remove} disabled={busy} className={`${btn} bg-red-700 text-white border-red-700`}>Yes, delete quiz and scores</button>
          <button onClick={() => setConfirmDelete(false)} className={`${btn} border-g500 text-g600`}>Cancel</button>
        </>
      ) : (
        <button onClick={() => setConfirmDelete(true)} className={`${btn} border-red-700 text-red-700`}>Delete</button>
      )}
      {error && <span className="text-sm text-red-700">{error}</span>}
    </div>
  );
}
