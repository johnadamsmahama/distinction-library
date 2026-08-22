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
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`w-3.5 h-3.5 flex-shrink-0 text-gold transition-transform ${open ? 'rotate-180' : ''}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-20 mt-1.5 w-full bg-navy-deep border border-gold/25 overflow-hidden">
          {options.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => {
                onChange(o.id);
                setOpen(false);
              }}
              className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 font-mono text-xs text-left transition-colors ${
                o.id === value ? 'bg-gold/10 text-gold' : 'text-white/70 hover:bg-white/5'
              }`}
            >
              <span className="truncate">{o.label}</span>
              {o.id === value && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 flex-shrink-0 text-gold">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PresentationKit() {
  const [source, setSource] = useState<Source>('topic');

  const [topic, setTopic] = useState('');

  const [vaultItems, setVaultItems] = useState<VaultOption[] | null>(null);
  const [vaultItemId, setVaultItemId] = useState('');

  const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null);
  const [fileError, setFileError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [numSlides, setNumSlides] = useState('10');

  const [styleId, setStyleId] = useState('distinction');
  const [customStyle, setCustomStyle] = useState('');

  const [positionId, setPositionId] = useState('centered');
  const [customPosition, setCustomPosition] = useState('');

  const [instructions, setInstructions] = useState('');

  const [loading, setLoading] = useState(false);
  const [genError, setGenError] = useState('');
  const [outline, setOutline] = useState<Outline | null>(null);
  const [downloading, setDownloading] = useState(false);

  // load vault items lazily when that tab is opened
  useEffect(() => {
    if (source !== 'vault' || vaultItems !== null) return;
    const supabase = createClient();
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('study_vault_items')
        .select('id, title, item_type')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setVaultItems((data as VaultOption[]) ?? []);
    })();
  }, [source, vaultItems]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileError('');

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setFileError(`File too large — max ${MAX_FILE_SIZE_MB}MB.`);
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      setAttachedFile({ name: file.name, type: file.type, data: base64 });
    };
    reader.onerror = () => setFileError('Could not read that file — try again.');
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const removeFile = () => {
    setAttachedFile(null);
    setFileError('');
  };

  const canGenerate =
    !loading &&
    ((source === 'topic' && topic.trim().length > 0) ||
      (source === 'vault' && !!vaultItemId) ||
      (source === 'file' && !!attachedFile)) &&
    numSlides.trim().length > 0 &&
    Number(numSlides) > 0;

  const generate = async () => {
    if (!canGenerate) return;
    setLoading(true);
    setGenError('');
    setOutline(null);

    const res = await fetch('/api/vault/generate-presentation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source,
        topic: source === 'topic' ? topic.trim() : undefined,
        vaultItemId: source === 'vault' ? vaultItemId : undefined,
        attachedFile: source === 'file' ? attachedFile : undefined,
        numSlides: Number(numSlides),
        style: styleId === 'custom' ? customStyle.trim() : styleId,
        position: positionId === 'custom' ? customPosition.trim() : positionId,
        instructions: instructions.trim() || undefined,
      }),
    });
    const result = await res.json();
    setLoading(false);

    if (!res.ok) {
      setGenError(result.error ?? 'Something went wrong generating the outline.');
      return;
    }

    setOutline(result.outline);
  };

  const startOver = () => {
    setOutline(null);
    setGenError('');
  };

  const downloadPptx = async () => {
    if (!outline) return;
    setDownloading(true);
    try {
      const { renderOutlineToPptx } = await import('@/lib/export/toPptx');
      await renderOutlineToPptx(outline, styleId, positionId);
    } finally {
      setDownloading(false);
    }
  };

  const tabs: { id: Source; label: string }[] = [
    { id: 'topic', label: 'topic' },
    { id: 'vault', label: 'from vault' },
    { id: 'file', label: 'upload' },
  ];

  return (
    <div className="flex flex-col">
      {!outline ? (
        <>
          {/* source tabs — terminal-pane style */}
          <div className="flex gap-0 px-0">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setSource(t.id)}
                className={`font-mono text-[11px] px-3.5 py-2 relative ${
                  source === t.id
                    ? 'text-gold border border-gold/40 border-b-transparent bg-navy-deep top-px'
                    : 'text-white/40 border border-transparent hover:text-white/70'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES}
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* work canvas */}
          <div
            className="border border-gold/25 bg-black/15 p-5 flex flex-col gap-5"
            style={{
              backgroundImage:
                'linear-gradient(rgba(201,160,44,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(201,160,44,0.06) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          >
            {fileError && (
              <p className="font-mono text-xs text-red-400">{fileError}</p>
            )}

            {source === 'topic' && (
              <div>
                <div className="font-mono text-[10.5px] uppercase tracking-wide text-white/40 mb-2">
                  what's the presentation about?
                </div>
                <textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. the causes and effects of media convergence in ghana"
                  className="min-h-[90px] w-full px-3.5 py-3 bg-black/25 border border-white/10 font-mono text-xs leading-relaxed text-white outline-none focus:border-gold/50 resize-none placeholder:text-white/30"
                />
              </div>
            )}

            {source === 'vault' && (
              <div>
                <div className="font-mono text-[10.5px] uppercase tracking-wide text-white/40 mb-2">
                  choose a saved item
                </div>
                {vaultItems === null ? (
                  <p className="font-mono text-xs text-white/50">loading your vault…</p>
                ) : vaultItems.length === 0 ? (
                  <p className="font-mono text-xs text-white/50">
                    nothing in your vault yet — save a quiz or summary first, or start from a topic instead.
                  </p>
                ) : (
                  <BrandDropdown
                    options={[{ id: '', label: 'select a saved item…' }, ...vaultItems.map((i) => ({ id: i.id, label: i.title }))]}
                    value={vaultItemId}
                    onChange={setVaultItemId}
                  />
                )}
              </div>
            )}

            {source === 'file' && (
              <div>
                {!attachedFile ? (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full min-h-[100px] flex flex-col items-center justify-center text-center border border-dashed border-gold/40 bg-gold/[0.04] px-4 py-6 hover:bg-gold/[0.08] transition-colors"
                  >
                    <div className="font-mono text-gold text-lg mb-2">↑</div>
                    <p className="font-mono text-[11px] text-white/50 mb-2">
                      tap to upload a word or pdf document
                    </p>
                    <div className="flex gap-1.5 flex-wrap justify-center">
                      {['PDF', 'DOCX'].map((t) => (
                        <span key={t} className="font-mono text-[9px] px-2 py-1 bg-black/30 border border-white/10 text-white/50">
                          {t}
                        </span>
                      ))}
                    </div>
                  </button>
                ) : (
                  <div className="flex items-center gap-2.5 bg-black/25 border border-white/10 px-3 py-3">
                    <div className="w-9 h-9 bg-gold/15 text-gold flex items-center justify-center font-mono text-[9px] flex-shrink-0">
                      {attachedFile.name.split('.').pop()?.toUpperCase().slice(0, 4)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-xs text-white truncate">{attachedFile.name}</div>
                      <div className="font-mono text-[10px] text-white/40">attached</div>
                    </div>
                    <button onClick={removeFile} className="text-white/40 hover:text-white text-sm px-1" aria-label="Remove file">
                      ✕
                    </button>
                  </div>
                )}
              </div>
            )}

            <div>
              <div className="font-mono text-[10.5px] uppercase tracking-wide text-white/40 mb-2">
                how many slides?
              </div>
              <input
                type="number"
                min={1}
                value={numSlides}
                onChange={(e) => setNumSlides(e.target.value)}
                className="w-28 px-3.5 py-2.5 bg-black/25 border border-white/10 font-mono text-xs text-white outline-none focus:border-gold/50"
              />
            </div>

            <div>
              <div className="font-mono text-[10.5px] uppercase tracking-wide text-white/40 mb-2">
                style
              </div>
              <BrandDropdown options={STYLE_OPTIONS} value={styleId} onChange={setStyleId} />
              {styleId === 'custom' && (
                <input
                  type="text"
                  value={customStyle}
                  onChange={(e) => setCustomStyle(e.target.value)}
                  placeholder="describe the style…"
                  className="mt-2 w-full px-3 py-2 bg-black/25 border border-white/10 font-mono text-xs text-white outline-none focus:border-gold/50 placeholder:text-white/30"
                />
              )}
            </div>

            <div>
              <div className="font-mono text-[10.5px] uppercase tracking-wide text-white/40 mb-2">
                position / layout
              </div>
              <BrandDropdown options={POSITION_OPTIONS} value={positionId} onChange={setPositionId} />
              {positionId === 'custom' && (
                <input
                  type="text"
                  value={customPosition}
                  onChange={(e) => setCustomPosition(e.target.value)}
                  placeholder="describe the layout…"
                  className="mt-2 w-full px-3 py-2 bg-black/25 border border-white/10 font-mono text-xs text-white outline-none focus:border-gold/50 placeholder:text-white/30"
                />
              )}
            </div>

            <div>
              <div className="font-mono text-[10.5px] uppercase tracking-wide text-white/40 mb-2">
                anything specific? (optional)
              </div>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder={`e.g. "make it exam-focused" or "add a slide summarizing key definitions"`}
                className="min-h-[60px] w-full px-3.5 py-2.5 bg-black/25 border border-white/10 font-mono text-xs leading-relaxed text-white outline-none focus:border-gold/50 resize-none placeholder:text-white/30"
              />
            </div>

            {genError && (
              <p className="font-mono text-xs text-red-400">⚠ {genError}</p>
            )}

            <button
              onClick={generate}
              disabled={!canGenerate}
              className="w-full bg-gold text-navy-deep font-condensed font-bold text-xs uppercase px-5 py-2.5 hover:bg-gold-light transition-colors disabled:opacity-50"
            >
              {loading ? 'building outline…' : 'Run'}
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="px-5 py-4 border border-gold/25 border-b-0 bg-black/25">
            <div className="font-mono text-[10px] uppercase tracking-wide text-white/40">
              slide outline
            </div>
            <div className="font-mono text-base text-gold">{outline.deckTitle}</div>
          </div>

          <div
            className="border border-gold/25 bg-black/15 p-5 space-y-3 max-h-[500px] overflow-y-auto"
            style={{
              backgroundImage:
                'linear-gradient(rgba(201,160,44,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(201,160,44,0.06) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          >
            {outline.slides.map((s, i) => (
              <div key={i} className="border border-white/10 bg-black/20 p-4">
                <div className="flex items-start gap-2 mb-2">
                  <span className="font-mono text-xs text-gold flex-shrink-0 mt-0.5">
                    {i + 1}.
                  </span>
                  <p className="font-mono text-xs font-bold text-white">{s.title}</p>
                </div>
                <ul className="pl-6 list-disc space-y-1">
                  {s.bullets.map((b, j) => (
                    <li key={j} className="font-mono text-[11px] text-white/60">
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border border-gold/25 border-t-0 bg-black/25 p-4 flex gap-2">
            <button
              onClick={startOver}
              className="font-mono text-xs text-white/60 border border-white/15 px-4 py-2.5 hover:border-gold/50 hover:text-gold transition-colors"
            >
              start over
            </button>
            <button
              onClick={downloadPptx}
              disabled={downloading}
              className="flex-1 bg-gold text-navy-deep font-condensed font-bold text-xs uppercase px-5 py-2.5 hover:bg-gold-light transition-colors disabled:opacity-50"
            >
              {downloading ? 'building pptx…' : 'Download PowerPoint (.pptx)'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
