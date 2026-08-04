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

  const tabs: { id: Mode; label: string; hasContent: boolean; icon: React.ReactNode }[] = [
    {
      id: 'ask',
      label: 'Ask',
      hasContent: false,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} strokeLinecap="round" className="w-3.5 h-3.5">
          <path d="M12 2a7 7 0 0 0-4 12.7V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.3A7 7 0 0 0 12 2z" />
        </svg>
      ),
    },
    {
      id: 'notes',
      label: 'Paste notes',
      hasContent: notesContext.trim().length > 0,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z" />
          <line x1="8" y1="7" x2="15" y2="7" />
          <line x1="8" y1="11" x2="15" y2="11" />
        </svg>
      ),
    },
    {
      id: 'file',
      label: 'Attach',
      hasContent: !!attachedFile,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
          <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
        </svg>
      ),
    },
  ];

  return (
    <div className="bg-white border border-g100 rounded-2xl shadow-[0_14px_34px_-16px_rgba(10,27,61,0.4)] flex flex-col h-[56vh] overflow-hidden">
      {/* tabs */}
      <div className="flex border-b border-g100 flex-shrink-0">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setMode(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-4 font-condensed font-bold text-[11px] uppercase tracking-wide transition-colors relative ${
              mode === t.id ? 'text-gold' : 'text-g600 hover:text-g800'
            }`}
          >
            {t.icon}
            {t.label}
            {t.hasContent && (
              <span className="w-1.5 h-1.5 rounded-full bg-gold" aria-hidden />
            )}
            {mode === t.id && (
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
      <div className="flex-1 overflow-y-auto p-5 flex flex-col">
        {mode === 'ask' && (
          <>
            {messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
                <div className="w-12 h-12 rounded-xl bg-off-white border border-g100 flex items-center justify-center mb-3.5">
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-gold">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  </svg>
                </div>
                <p className="font-body text-sm text-g600 leading-relaxed max-w-[28ch]">
                  Ask about a concept, request a summary, or switch to Paste notes / Attach to ground your answer.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[80%] rounded-xl px-4 py-2.5 font-body text-sm leading-relaxed whitespace-pre-wrap ${
                        m.role === 'user' ? 'bg-navy text-white' : 'bg-off-white text-g800'
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-off-white rounded-xl px-4 py-2.5 font-body text-sm text-g600">Thinking…</div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            )}
          </>
        )}

        {mode === 'notes' && (
          <div className="flex-1 flex flex-col">
            <div className="font-condensed font-bold text-[10.5px] uppercase tracking-wide text-g600 mb-2">
              Your notes
            </div>
            <textarea
              value={notesContext}
              onChange={(e) => setNotesContext(e.target.value)}
              placeholder="Paste your notes here, then ask a question below…"
              className="flex-1 min-h-[110px] w-full px-3.5 py-3 rounded-xl border border-g100 bg-off-white font-body text-sm leading-relaxed outline-none focus:border-gold resize-none"
            />
          </div>
        )}

        {mode === 'file' && (
          <div className="flex-1 flex flex-col">
            {!attachedFile ? (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 min-h-[110px] flex flex-col items-center justify-center text-center rounded-xl border-[1.5px] border-dashed border-gold bg-gold/[0.06] px-4 py-6 hover:bg-gold/[0.1] transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-gold mb-2">
                  <path d="M12 16V4M6 10l6-6 6 6" />
                  <path d="M4 20h16" />
                </svg>
                <p className="font-body text-xs text-g600 mb-2">
                  <span className="font-semibold text-g800">Tap to attach</span> a file, or drop it here
                </p>
                <div className="flex gap-1.5 flex-wrap justify-center">
                  {['PDF', 'DOCX', 'PPTX', 'PHOTO'].map((t) => (
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
      </div>

      {/* save session */}
      {messages.length > 0 && (
        <div className="px-5 pb-2 flex-shrink-0 flex justify-end">
          <button
            onClick={saveSession}
            disabled={saved}
            className="font-condensed font-bold text-xs uppercase tracking-wide text-navy border border-g100 rounded-lg px-3 py-1.5 hover:border-gold transition-colors disabled:opacity-50"
          >
            {saved ? 'Saved to Vault ✓' : 'Save session'}
          </button>
        </div>
      )}

      {/* composer — always visible, never requires scrolling */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="p-4 border-t border-g100 flex gap-2 flex-shrink-0"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            mode === 'notes'
              ? 'Ask a question about the notes above…'
              : mode === 'file'
              ? 'Ask a question about the attached file…'
              : 'Ask a question…'
          }
          className="flex-1 px-4 py-2.5 rounded-lg border border-g100 bg-off-white font-body text-sm outline-none focus:border-gold"
        />
        <button
          type="submit"
          disabled={loading || (!input.trim() && !attachedFile)}
          className="bg-gold text-navy font-condensed font-bold text-xs uppercase px-5 py-2.5 rounded-lg hover:bg-gold-light transition-colors disabled:opacity-50 flex-shrink-0"
        >
          Send
        </button>
      </form>
    </div>
  );
}
