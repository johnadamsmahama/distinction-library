'use client';

import { useEffect, useRef, useState } from 'react';

export type SelectOption = { value: string; label: string };

export default function CustomSelect({
  value,
  onChange,
  options,
  placeholder = 'Select…',
  className = '',
  searchable = false,
}: {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  searchable?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset the search text each time the box opens, and put the cursor
  // straight into the search field so the user can start typing right away.
  useEffect(() => {
    if (open && searchable) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open, searchable]);

  const selected = options.find((o) => o.value === value);

  const filteredOptions =
    searchable && query.trim()
      ? options.filter((o) => o.label.toLowerCase().includes(query.trim().toLowerCase()))
      : options;

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-none border border-g100 bg-white font-condensed font-medium text-[13px] text-g800 outline-none focus:border-gold transition-colors"
      >
        <span className={selected ? '' : 'text-g600'}>{selected ? selected.label : placeholder}</span>
        <svg
          viewBox="0 0 24 24"
          className={`w-4 h-4 stroke-g600 fill-none flex-shrink-0 ml-2 transition-transform ${open ? 'rotate-180' : ''}`}
          strokeWidth={2}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-1.5 w-full max-h-64 overflow-y-auto bg-white border border-g100 rounded-none shadow-lg">
          {searchable && (
            <div className="sticky top-0 bg-white border-b border-g100 p-1.5">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type a course code or name…"
                className="w-full px-2.5 py-2 rounded-none border border-g100 font-condensed font-medium text-[13px] text-g800 outline-none focus:border-gold transition-colors"
              />
            </div>
          )}
          {filteredOptions.length === 0 ? (
            <div className="px-3.5 py-2.5 font-condensed text-[13px] text-g600">No matches found</div>
          ) : (
            filteredOptions.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                className={`w-full text-left px-3.5 py-2.5 font-condensed font-medium text-[13px] transition-colors hover:bg-off-white ${
                  o.value === value ? 'bg-gold/10 text-navy font-bold' : 'text-g800'
                }`}
              >
                {o.label}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
