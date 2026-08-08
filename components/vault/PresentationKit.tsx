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
  { id: 'distinction', label: 'Distinction Navy & Gold' },
  { id: 'academic', label: 'Academic' },
  { id: 'bold', label: 'Bold Minimal' },
  { id: 'custom', label: 'Type your own…' },
];

const POSITION_OPTIONS = [
  { id: 'centered', label: 'Centered' },
  { id: 'split', label: 'Image + Text' },
  { id: 'titlelist', label: 'Title + List' },
  { id: 'custom', label: 'Type your own…' },
];

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
      await renderOutlineToPptx(outline, styleId);
    } finally {
      setDownloading(false);
    }
  };

  const tabs: { id: Source; label: string; icon: React.ReactNode }[] = [
    {
      id: 'topic',
      label: 'Topic',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
          <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
        </svg>
      ),
    },
    {
      id: 'vault',
      label: 'From Vault',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
          <rect x="5" y="11" width="14" height="10" rx="2" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
      ),
    },
    {
      id: 'file',
      label: 'Upload',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
          <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
        </svg>
      ),
    },
  ];

  return (
    <div className="bg-white border border-g100 rounded-2xl shadow-[0_14px_34px_-16px_rgba(10,27,61,0.4)] flex flex-col h-[62vh] overflow-hidden">
      {!outline ? (
        <>
          {/* source tabs */}
          <div className="flex border-b border-g100 flex-shrink-0">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setSource(t.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-4 font-condensed font-bold text-[11px] uppercase tracking-wide transition-colors relative ${
                  source === t.id ? 'text-gold' : 'text-g600 hover:text-g800'
                }`}
              >
                {t.icon}
                {t.label}
                {source === t.id && (
                  <span className="absolute -bottom-px left-3.5 right-3.5 h-0.5 rounded-full bg-gold" />
                )}
              </button>
            ))}
          </div>

          {fileError && (
            <div className="px-5 py-2 bg-red-50 border-b border-g100 flex-shrink-0">
              <p className="font-body text-xs text-red-600">{fileError}</p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES}
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* content pane */}
          <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
            {source === 'topic' && (
              <div>
                <div className="font-condensed font-bold text-[10.5px] uppercase tracking-wide text-g600 mb-2">
                  What's the presentation about?
                </div>
                <textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. The causes and effects of media convergence in Ghana"
                  className="min-h-[90px] w-full px-3.5 py-3 rounded-xl border border-g100 bg-off-white font-body text-sm leading-relaxed outline-none focus:border-gold resize-none"
                />
              </div>
            )}

            {source === 'vault' && (
              <div>
                <div className="font-condensed font-bold text-[10.5px] uppercase tracking-wide text-g600 mb-2">
                  Choose a saved item
                </div>
                {vaultItems === null ? (
                  <p className="font-body text-sm text-g600">Loading your Vault…</p>
                ) : vaultItems.length === 0 ? (
                  <p className="font-body text-sm text-g600">
                    Nothing in your Vault yet — save a quiz or summary first, or start from a topic instead.
                  </p>
                ) : (
                  <select
                    value={vaultItemId}
                    onChange={(e) => setVaultItemId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-g100 bg-off-white font-body text-sm outline-none focus:border-gold"
                  >
                    <option value="">Select a saved item…</option>
                    {vaultItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.title}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {source === 'file' && (
              <div>
                {!attachedFile ? (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full min-h-[100px] flex flex-col items-center justify-center text-center rounded-xl border-[1.5px] border-dashed border-gold bg-gold/[0.06] px-4 py-6 hover:bg-gold/[0.1] transition-colors"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-gold mb-2">
                      <path d="M12 16V4M6 10l6-6 6 6" />
                      <path d="M4 20h16" />
                    </svg>
                    <p className="font-body text-xs text-g600 mb-2">
                      <span className="font-semibold text-g800">Tap to upload</span> a Word or PDF document
                    </p>
                    <div className="flex gap-1.5 flex-wrap justify-center">
                      {['PDF', 'DOCX'].map((t) => (
                        <span key={t} className="font-condensed text-[9.5px] font-bold px-2 py-1 bg-white border border-g100 rounded text-g600">
                          {t}
                        </span>
                      ))}
                    </div>
                  </button>
                ) : (
                  <div className="flex items-center gap-2.5 bg-off-white border border-g100 rounded-xl px-3 py-3">
                    <div className="w-9 h-9 rounded-lg bg-navy text-gold-light flex items-center justify-center font-condensed font-bold text-[9px] flex-shrink-0">
                      {attachedFile.name.split('.').pop()?.toUpperCase().slice(0, 4)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-body font-semibold text-sm text-g800 truncate">{attachedFile.name}</div>
                      <div className="font-condensed text-[10.5px] text-g600">Attached</div>
                    </div>
                    <button onClick={removeFile} className="text-g600 hover:text-navy text-base px-1" aria-label="Remove file">
                      ✕
                    </button>
                  </div>
                )}
              </div>
            )}

            <div>
              <div className="font-condensed font-bold text-[10.5px] uppercase tracking-wide text-g600 mb-2">
                How many slides?
              </div>
              <input
                type="number"
                min={1}
                value={numSlides}
                onChange={(e) => setNumSlides(e.target.value)}
                className="w-28 px-3.5 py-2.5 rounded-lg border border-g100 bg-off-white font-body text-sm outline-none focus:border-gold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="font-condensed font-bold text-[10.5px] uppercase tracking-wide text-g600 mb-2">
                  Style
                </div>
                <select
                  value={styleId}
                  onChange={(e) => setStyleId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-g100 bg-off-white font-body text-sm outline-none focus:border-gold"
                >
                  {STYLE_OPTIONS.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </select>
                {styleId === 'custom' && (
                  <input
                    type="text"
                    value={customStyle}
                    onChange={(e) => setCustomStyle(e.target.value)}
                    placeholder="Describe the style…"
                    className="mt-2 w-full px-3 py-2 rounded-lg border border-g100 bg-off-white font-body text-xs outline-none focus:border-gold"
                  />
                )}
              </div>

              <div>
                <div className="font-condensed font-bold text-[10.5px] uppercase tracking-wide text-g600 mb-2">
                  Position / Layout
                </div>
                <select
                  value={positionId}
                  onChange={(e) => setPositionId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-g100 bg-off-white font-body text-sm outline-none focus:border-gold"
                >
                  {POSITION_OPTIONS.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </select>
                {positionId === 'custom' && (
                  <input
                    type="text"
                    value={customPosition}
                    onChange={(e) => setCustomPosition(e.target.value)}
                    placeholder="Describe the layout…"
                    className="mt-2 w-full px-3 py-2 rounded-lg border border-g100 bg-off-white font-body text-xs outline-none focus:border-gold"
                  />
                )}
              </div>
            </div>

            <div>
              <div className="font-condensed font-bold text-[10.5px] uppercase tracking-wide text-g600 mb-2">
                Anything specific? (optional)
              </div>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder={`e.g. "Make it exam-focused" or "Add a slide summarizing key definitions"`}
                className="min-h-[60px] w-full px-3.5 py-2.5 rounded-xl border border-g100 bg-off-white font-body text-sm leading-relaxed outline-none focus:border-gold resize-none"
              />
            </div>
          </div>

          {genError && (
            <div className="px-5 pb-2 flex-shrink-0">
              <p className="font-body text-xs text-red-600">⚠️ {genError}</p>
            </div>
          )}

          <div className="p-4 border-t border-g100 flex-shrink-0">
            <button
              onClick={generate}
              disabled={!canGenerate}
              className="w-full bg-gold text-navy font-condensed font-bold text-xs uppercase px-5 py-2.5 rounded-lg hover:bg-gold-light transition-colors disabled:opacity-50"
            >
              {loading ? 'Building outline…' : 'Generate Slides'}
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="px-5 py-4 border-b border-g100 flex-shrink-0 bg-off-white">
            <div className="font-condensed font-bold text-[10.5px] uppercase tracking-wide text-g600">
              Slide outline
            </div>
            <div className="font-display font-bold text-lg text-navy">{outline.deckTitle}</div>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            {outline.slides.map((s, i) => (
              <div key={i} className="border border-g100 rounded-xl p-4">
                <div className="flex items-start gap-2 mb-2">
                  <span className="font-condensed font-bold text-xs text-gold flex-shrink-0 mt-0.5">
                    {i + 1}.
                  </span>
                  <p className="font-condensed font-bold text-sm text-g800">{s.title}</p>
                </div>
                <ul className="pl-6 list-disc space-y-1">
                  {s.bullets.map((b, j) => (
                    <li key={j} className="font-body text-sm text-g600">
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-g100 flex gap-2 flex-shrink-0">
            <button
              onClick={startOver}
              className="font-condensed font-bold text-xs uppercase tracking-wide text-navy border border-g100 rounded-lg px-4 py-2.5 hover:border-gold transition-colors"
            >
              Start over
            </button>
            <button
              onClick={downloadPptx}
              disabled={downloading}
              className="flex-1 bg-gold text-navy font-condensed font-bold text-xs uppercase px-5 py-2.5 rounded-lg hover:bg-gold-light transition-colors disabled:opacity-50"
            >
              {downloading ? 'Building PPTX…' : 'Download PowerPoint (.pptx)'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
