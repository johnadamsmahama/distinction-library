'use client';

import { useState } from 'react';

interface NewSemesterModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (label: string) => Promise<boolean>;
}

const SUGGESTIONS = ['Level 100, Semester 1', 'Level 100, Semester 2', 'Level 200, Semester 1'];

export default function NewSemesterModal({ open, onClose, onCreate }: NewSemesterModalProps) {
  const [label, setLabel] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  function handleClose() {
    setLabel('');
    setError(null);
    setSubmitting(false);
    onClose();
  }

  async function handleCreate() {
    const trimmed = label.trim();
    if (!trimmed) {
      setError("Enter a label so you can tell this semester apart from others.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const success = await onCreate(trimmed);
    setSubmitting(false);
    if (success) {
      handleClose();
    } else {
      setError('Something went wrong creating this semester. Try again.');
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-navy-deep/55"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-md rounded-t-2xl bg-off-white p-5 pb-7"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1 w-9 rounded-full bg-g100" />

        <h3 className="font-display text-xl text-navy">New Semester</h3>
        <p className="mt-1 mb-5 font-body text-sm text-g600">
          Give it a label you&apos;ll recognize later — you can add more semesters after this one.
        </p>

        <label className="mb-2 block font-condensed text-xs uppercase tracking-wide text-g600">
          Semester label
        </label>
        <input
          type="text"
          value={label}
          onChange={(e) => {
            setLabel(e.target.value);
            if (error) setError(null);
          }}
          placeholder='e.g. "Level 100, Semester 1"'
          className={`w-full rounded-md border px-3 py-2.5 font-body text-sm text-g800 outline-none focus:border-gold ${
            error ? 'border-red-500' : 'border-g100'
          }`}
          autoFocus
        />
        {error && <p className="mt-2 font-body text-xs text-red-500">{error}</p>}

        <div className="mt-3 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setLabel(s);
                setError(null);
              }}
              className="rounded-full bg-g100 px-3 py-1 font-condensed text-xs text-g800"
            >
              {s}
            </button>
          ))}
        </div>

        <div className="mt-6 flex gap-2.5">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 rounded-md border border-g100 py-2.5 font-condensed text-sm font-semibold text-g600"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={submitting}
            className="flex-[1.4] rounded-md bg-navy py-2.5 font-condensed text-sm font-semibold text-off-white disabled:opacity-50"
          >
            {submitting ? 'Creating…' : 'Create Semester'}
          </button>
        </div>
      </div>
    </div>
  );
}
