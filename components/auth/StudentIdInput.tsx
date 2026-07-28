'use client';

import { UPSA_DOMAIN } from '@/lib/validation';

export default function StudentIdInput({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  error?: string | null;
}) {
  return (
    <div>
      <label htmlFor="studentId" className="block font-condensed font-semibold text-xs uppercase tracking-wide text-g800 mb-1.5">
        UPSA Student ID
      </label>
      <div
        className={`flex items-center rounded-lg border bg-white overflow-hidden transition-colors ${
          error ? 'border-red-400' : 'border-g100 focus-within:border-gold'
        }`}
      >
        <input
          id="studentId"
          type="text"
          inputMode="numeric"
          maxLength={8}
          placeholder="10347621"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, '').slice(0, 8))}
          className="flex-1 px-4 py-2.5 font-body text-[15px] text-g800 outline-none min-w-0"
          autoComplete="username"
        />
        <span className="px-3 py-2.5 font-condensed text-[13px] text-g600 bg-g100 whitespace-nowrap">
          @{UPSA_DOMAIN}
        </span>
      </div>
      {error && <p className="mt-1.5 font-body text-xs text-red-500">{error}</p>}
    </div>
  );
}
