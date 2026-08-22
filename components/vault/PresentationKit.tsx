'use client';

import { useState, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

type AttachedFile = {
  name: string;
  type: string;
  data: string; // base64
};

type Source = 'topic' | 'vault' | 'file';

type VaultOption = {
  id: string;
  title: string;
  item_type: string;
};

type SlideOutlineItem = {
  title: string;
  bullets: string[];
};

type Outline = {
  deckTitle: string;
  slides: SlideOutlineItem[];
};

const ACCEPTED_TYPES = '.pdf,.docx';
const MAX_FILE_SIZE_MB = 15;

const STYLE_OPTIONS = [
  { id: 'distinction', label: 'distinction navy & gold' },
  { id: 'academic', label: 'academic' },
  { id: 'bold', label: 'bold minimal' },
  { id: 'custom', label: 'type your own…' },
];

const POSITION_OPTIONS = [
  { id: 'centered', label: 'centered' },
  { id: 'split', label: 'image + text' },
  { id: 'titlelist', label: 'title + list' },
  { id: 'custom', label: 'type your own…' },
];

type DropdownOption = { id: string; label: string };

function BrandDropdown({
  options,
  value,
  onChange,
}: {
  options: DropdownOption[];
  value: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.id === value) ?? options[0];

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 border bg-black/25 font-mono text-xs text-left transition-colors ${
          open ? 'border-gold/50' : 'border-white/10'
        }`}
      >
        <span className="truncate text-white">{selected.label}</span>
