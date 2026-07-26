'use client';

import { useEffect, useRef, useState } from 'react';

export type SelectOption = { value: string; label: string };

export default function MultiSelect({
  values,
  onChange,
  options,
  placeholder = 'Select…',
  className = '',
}: {
  values: string[];
  onChange: (values: string[]) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggle = (value: string) => {
    onChange(values.includes(value) ? values.filter((v) => v !== value) : [...values, value]);
  };

  const summary =
    values.length === 0
      ? placeholder
      : values.length === 1
        ? options.find((o) => o.value === values[0])?.label ?? placeholder
        : `${values.length} courses selected`;

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg border border-g100 bg-white font-condensed font-medium text-[13px] text-g800 outline-none focus:border-gold transition-colors"
      >
        <span className={values.length ? '' : 'text-g600'}>{summary}</span>
        <svg
          viewBox="0 0 24 24"
          className={`w-4 h-4 stroke-g600 fill-none flex-shrink-0 ml-2 transition-transform ${open ? 'rotate-180' : ''}`}
          strokeWidth={2}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-1.5 w-full max-h-64 overflow-y-auto bg-white border border-g100 rounded-lg shadow-lg">
          {options.length === 0 && (
            <div className="px-3.5 py-2.5 font-body text-[13px] text-g600">No courses yet.</div>
          )}
          {options.map((o) => {
            const checked = values.includes(o.value);
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => toggle(o.value)}
                className={`w-full flex items-center gap-2.5 text-left px-3.5 py-2.5 font-condensed font-medium text-[13px] transition-colors hover:bg-off-white ${
                  checked ? 'bg-gold/10 text-navy font-bold' : 'text-g800'
                }`}
              >
                <span
                  className={`w-4 h-4 flex-shrink-0 rounded border flex items-center justify-center ${
                    checked ? 'bg-gold border-gold' : 'border-g100'
                  }`}
                >
                  {checked && (
                    <svg viewBox="0 0 24 24" className="w-3 h-3 stroke-navy fill-none" strokeWidth={3}>
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
                {o.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
