'use client';

import { useState } from 'react';
import QuizListItem from '@/components/quiz/QuizListItem';

export type QuizItem = {
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

// Filter chips (All / Open / Closed) and the list of quiz cards.
export default function QuizList({ items }: { items: QuizItem[] }) {
  const [filter, setFilter] = useState<'all' | 'open' | 'closed'>('all');
  const nOpen = items.filter((q) => !q.closed).length;
  const shown = items.filter((q) => filter === 'all' || (filter === 'open' ? !q.closed : q.closed));
  const chip = (on: boolean) =>
    `h-8 px-3 border-[1.5px] font-condensed font-bold uppercase tracking-[.1em] text-[11px] ${on ? 'bg-navy text-white border-navy' : 'bg-transparent text-g800 border-[#DACFAE]'}`;

  return (
    <div>
      <div className="flex gap-1.5 mb-3">
        <button type="button" className={chip(filter === 'all')} onClick={() => setFilter('all')}>All {items.length}</button>
        <button type="button" className={chip(filter === 'open')} onClick={() => setFilter('open')}>Open {nOpen}</button>
        <button type="button" className={chip(filter === 'closed')} onClick={() => setFilter('closed')}>Closed {items.length - nOpen}</button>
      </div>
      {items.length === 0 && <p className="py-6 text-center font-display italic text-[#7A6F52]">No quizzes yet. Upload your first one above.</p>}
      {items.length > 0 && shown.length === 0 && <p className="py-6 text-center font-display italic text-[#7A6F52]">No quizzes here.</p>}
      {shown.map((q) => (
        <QuizListItem key={q.id} {...q} />
      ))}
    </div>
  );
}
