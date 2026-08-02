'use client';

import { useState, useRef, useEffect } from 'react';

type Message = { role: 'user' | 'assistant'; content: string };

type AttachedFile = {
  name: string;
  type: string; // MIME type
  data: string; // base64
};

const ACCEPTED_TYPES = '.pdf,.docx,.pptx,.png,.jpg,.jpeg';
const MAX_FILE_SIZE_MB = 15;

export default function Companion() {
  const [notesContext, setNotesContext] = useState('');
  const [showNotes, setShowNotes] = useState(false);
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
      // result looks like "data:application/pdf;base64,XXXX" — strip the prefix
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

  return (
    <div className="bg-white border border-g100 rounded-2xl flex flex-col h-[70vh]">
      <div className="p-4 border-b border-g100 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowNotes((s) => !s)}
            className="font-condensed font-bold text-xs uppercase tracking-wide text-gold hover:underline"
          >
            {showNotes ? 'Hide notes panel' : notesContext ? 'Notes attached ✓' : 'Paste notes'}
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="font-condensed font-bold text-xs uppercase tracking-wide text-gold hover:underline"
          >
            {attachedFile ? 'Change file' : 'Attach file'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES}
            onChange={handleFileSelect}
            className="hidden"
          />

          {attachedFile && (
            <span className="font-condensed text-xs text-g600 flex items-center gap-1.5">
              📎 {attachedFile.name}
              <button onClick={removeFile} className="text-g600 hover:text-navy" aria-label="Remove file">
                ✕
              </button>
            </span>
          )}
        </div>

        {messages.length > 0 && (
          <button
            onClick={saveSession}
            disabled={saved}
            className="font-condensed font-bold text-xs uppercase tracking-wide text-navy border border-g100 rounded-lg px-3 py-1.5 hover:border-gold transition-colors disabled:opacity-50"
          >
            {saved ? 'Saved to Vault ✓' : 'Save session'}
          </button>
        )}
      </div>

      {fileError && (
        <div className="px-4 py-2 bg-red-50 border-b border-g100">
          <p className="font-body text-xs text-red-600">{fileError}</p>
        </div>
      )}

      {showNotes && (
        <div className="p-4 border-b border-g100 bg-off-white">
          <textarea
            rows={4}
            value={notesContext}
            onChange={(e) => setNotesContext(e.target.value)}
            placeholder="Paste your notes here so the Companion can ground its answers in them…"
            className="w-full px-3 py-2 rounded-lg border border-g100 font-body text-sm outline-none focus:border-gold"
          />
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="h-full flex items-center justify-center text-center px-8">
            <p className="font-body text-sm text-g600">
              Ask about a concept, request a summary, or attach a PDF, Word doc, PowerPoint, or
              photo of your notes above and ask questions directly about them.
            </p>
          </div>
        )}
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

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="p-4 border-t border-g100 flex gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question…"
          className="flex-1 px-4 py-2.5 rounded-lg border border-g100 font-body text-sm outline-none focus:border-gold"
        />
        <button
          type="submit"
          disabled={loading || (!input.trim() && !attachedFile)}
          className="bg-gold text-navy font-condensed font-bold text-xs uppercase px-5 py-2.5 rounded-lg hover:bg-gold-light transition-colors disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
