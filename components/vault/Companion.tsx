'use client';

import { useState, useRef, useEffect } from 'react';

type Message = { role: 'user' | 'assistant'; content: string };

type AttachedFile = {
  name: string;
  type: string; // MIME type
  data: string; // base64
};

type Mode = 'ask' | 'notes' | 'file';

const ACCEPTED_TYPES = '.pdf,.docx,.pptx,.png,.jpg,.jpeg';
const MAX_FILE_SIZE_MB = 15;

export default function Companion() {
  const [mode, setMode] = useState<Mode>('ask');
  const [notesContext, setNotesContext] = useState('');
  const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null);
  const [fileError, setFileError] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  const send = async (content: string) => {
    if ((!content.trim() && !attachedFile) || loading) return;
    const next = [...messages, { role: 'user' as const, content: content.trim() || `(Sent a file: ${attachedFile?.name})` }];
    setMessages(next);
    setInput('');
    setLoading(true);
    setSaved(false);
    setMode('ask');

    const res = await fetch('/api/vault/companion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: next,
        notesContext: notesContext.trim() || undefined,
        attachedFile: attachedFile ?? undefined,
      }),
    });
    const result = await res.json();
    setLoading(false);

    if (!res.ok) {
      setMessages((m) => [...m, { role: 'assistant', content: `⚠️ ${result.error ?? 'Something went wrong.'}` }]);
      return;
    }

    setMessages((m) => [...m, { role: 'assistant', content: result.reply }]);
  };

  const saveSession = async () => {
    const res = await fetch('/api/vault/companion/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, sourceName: notesContext || attachedFile ? 'With attached notes' : undefined }),
    });
    if (res.ok) setSaved(true);
  };

  const tabs: { id: Mode; label: string; hasContent: boolean }[] = [
    { id: 'ask', label: 'ask', hasContent: false },
    { id: 'notes', label: 'notes', hasContent: notesContext.trim().length > 0 },
    { id: 'file', label: 'attach', hasContent: !!attachedFile },
  ];

  return (
    <div className="flex flex-col">
      {/* tabs — terminal-pane style */}
      <div className="flex gap-0 px-0">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setMode(t.id)}
            className={`font-mono text-[11px] px-3.5 py-2 flex items-center gap-1.5 relative ${
              mode === t.id
                ? 'text-gold border border-gold/40 border-b-transparent bg-navy-deep top-px'
                : 'text-white/40 border border-transparent hover:text-white/70'
            }`}
          >
            {t.label}
            {t.hasContent && <span className="w-1 h-1 rounded-full bg-gold inline-block" />}
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

      {/* work canvas — dominates the screen, extra bottom padding so content never hides behind the fixed composer */}
      <div
        className="min-h-[80vh] border border-gold/25 bg-black/15 p-5 pb-32 flex flex-col"
        style={{
          backgroundImage:
            'linear-gradient(rgba(201,160,44,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(201,160,44,0.06) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      >
        {fileError && (
          <p className="font-mono text-xs text-red-400 mb-3">{fileError}</p>
        )}

        {mode === 'ask' && (
          <>
            {messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center gap-3">
                <div className="font-mono text-gold text-base">&gt; _</div>
                <p className="font-mono text-xs text-white/50 leading-relaxed max-w-[32ch]">
                  type a concept, request a summary, or switch modes to ground your answer in your own material.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[80%] px-4 py-2.5 font-mono text-xs leading-relaxed whitespace-pre-wrap border ${
                        m.role === 'user'
                          ? 'bg-gold/10 border-gold/30 text-white'
                          : 'bg-white/5 border-white/10 text-white/80'
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-white/5 border border-white/10 px-4 py-2.5 font-mono text-xs text-white/50">
                      thinking…
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            )}
          </>
        )}

        {mode === 'notes' && (
          <div className="flex-1 flex flex-col">
            <div className="font-mono text-[10.5px] uppercase tracking-wide text-white/40 mb-2">
              your notes
            </div>
            <textarea
              value={notesContext}
              onChange={(e) => setNotesContext(e.target.value)}
              placeholder="paste your notes here, then ask a question below…"
              className="flex-1 min-h-[110px] w-full px-3.5 py-3 bg-black/25 border border-white/10 font-mono text-xs leading-relaxed text-white outline-none focus:border-gold/50 resize-none placeholder:text-white/30"
            />
          </div>
        )}

        {mode === 'file' && (
          <div className="flex-1 flex flex-col">
            {!attachedFile ? (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 min-h-[110px] flex flex-col items-center justify-center text-center border border-dashed border-gold/40 bg-gold/[0.04] px-4 py-6 hover:bg-gold/[0.08] transition-colors"
              >
                <div className="font-mono text-gold text-lg mb-2">↑</div>
                <p className="font-mono text-[11px] text-white/50 mb-2">
                  tap to attach a file, or drop it here
                </p>
                <div className="flex gap-1.5 flex-wrap justify-center">
                  {['PDF', 'DOCX', 'PPTX', 'PHOTO'].map((t) => (
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
      </div>

      {/* composer — fixed near the bottom of the viewport, always visible without scrolling */}
      <div className="fixed left-0 right-0 bottom-[120px] px-4 z-20 flex justify-center pointer-events-none">
        <div className="w-full max-w-2xl pointer-events-auto">
          {messages.length > 0 && (
            <div className="pb-2 flex justify-end">
              <button
                onClick={saveSession}
                disabled={saved}
                className="font-mono text-[10px] text-white/60 border border-white/15 bg-navy-deep px-3 py-1.5 hover:border-gold/50 hover:text-gold transition-colors disabled:opacity-50"
              >
                {saved ? 'saved ✓' : 'save session'}
              </button>
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                mode === 'notes'
                  ? 'ask a question about the notes above…'
                  : mode === 'file'
                  ? 'ask a question about the attached file…'
                  : 'ask a question…'
              }
              className="flex-1 px-4 py-2.5 bg-navy-deep border border-gold/30 font-mono text-xs text-white outline-none focus:border-gold placeholder:text-white/30 shadow-lg"
            />
            <button
              type="submit"
              disabled={loading || (!input.trim() && !attachedFile)}
              className="bg-gold text-navy-deep font-condensed font-bold text-xs uppercase px-5 py-2.5 hover:bg-gold-light transition-colors disabled:opacity-50 flex-shrink-0 shadow-lg"
            >
              Run
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
