'use client';

import { useState, useRef, useEffect } from 'react';

type Message = { role: 'user' | 'assistant'; content: string; hidden?: boolean };

export default function InterviewCoach() {
  const [targetRole, setTargetRole] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const callCoach = async (nextMessages: Message[]) => {
    setLoading(true);
    setError(null);

    const res = await fetch('/api/career/interview-coach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
        targetRole,
        jobDescription: jobDescription.trim() || undefined,
      }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? 'Something went wrong.');
      return;
    }
    setMessages((m) => [...m, { role: 'assistant', content: data.reply }]);
  };

  const startInterview = async () => {
    if (!targetRole.trim()) {
      setError('Add the role or field you\'re practising for first.');
      return;
    }
    setError(null);
    setStarted(true);
    const kickoff: Message[] = [
      { role: 'user', content: 'Please begin the mock interview.', hidden: true },
    ];
    setMessages(kickoff);
    await callCoach(kickoff);
  };

  const send = async (content: string) => {
    if (!content.trim() || loading) return;
    const next = [...messages, { role: 'user' as const, content: content.trim() }];
    setMessages(next);
    setInput('');
    await callCoach(next);
  };

  const requestSummary = async () => {
    const next = [
      ...messages,
      { role: 'user' as const, content: 'Please give me overall feedback and stop the interview here.' },
    ];
    setMessages(next);
    await callCoach(next);
  };

  if (!started) {
    return (
      <div className="space-y-6 mt-6">
        <div className="relative bg-off-white rounded-2xl border border-g100 shadow-sm px-5 pb-7 pt-2">
          {/* gold dotted thread */}
          <div
            className="absolute left-[34px] top-0 bottom-8 w-[2px] opacity-50"
            style={{
              backgroundImage:
                'repeating-linear-gradient(to bottom, #C9A02C 0, #C9A02C 4px, transparent 4px, transparent 9px)',
            }}
          />

          <Section num={1} label="Role or Field You're Practising For">
            <input
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g. Graduate Accountant, Marketing Intern"
              className={inputClass}
            />
          </Section>

          <Section num={2} label="Job Description" hint="Optional" isLast>
            <textarea
              rows={4}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste a job posting so the questions are more specific…"
              className={inputClass}
            />
          </Section>
        </div>

        {error && <p className="font-body text-sm text-red-500">{error}</p>}

        <button
          onClick={startInterview}
          disabled={loading}
          className="w-full sm:w-auto bg-gradient-to-br from-navy-mid to-navy text-white font-condensed font-bold text-sm px-6 py-3.5 rounded-xl shadow-lg hover:opacity-95 transition-opacity disabled:opacity-60"
        >
          {loading ? 'Starting…' : 'Start mock interview'}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white border border-g100 rounded-2xl flex flex-col h-[70vh] mt-6">
      <div className="p-4 border-b border-g100 flex items-center justify-between">
        <p className="font-condensed font-bold text-xs uppercase tracking-wide text-g600">
          Practising for: {targetRole}
        </p>
        <button
          onClick={requestSummary}
          disabled={loading}
          className="font-condensed font-bold text-xs uppercase tracking-wide text-navy border border-g100 rounded-lg px-3 py-1.5 hover:border-gold transition-colors disabled:opacity-50"
        >
          End & get feedback
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages
          .filter((m) => !m.hidden)
          .map((m, i) => (
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

      {error && <p className="font-body text-sm text-red-500 px-4 pb-2">{error}</p>}

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
          placeholder="Type your answer…"
          className="flex-1 px-4 py-2.5 rounded-lg border border-g100 font-body text-sm outline-none focus:border-gold"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-gold text-navy font-condensed font-bold text-xs uppercase px-5 py-2.5 rounded-lg hover:bg-gold-light transition-colors disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}

function Section({
  num,
  label,
  hint,
  isLast,
  children,
}: {
  num: number;
  label: string;
  hint?: string;
  isLast?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`relative pt-6 pb-1 ${!isLast ? 'border-b border-g100' : ''}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-7 h-7 rounded-full bg-navy text-gold-light font-display font-semibold text-xs flex items-center justify-center flex-shrink-0 shadow-[0_0_0_4px_#F7F8FC]">
          {num}
        </div>
        <div className="font-condensed font-bold text-xs uppercase tracking-wide text-navy">{label}</div>
      </div>
      {hint && <div className="text-xs text-g600 ml-10 -mt-2 mb-3">{hint}</div>}
      <div className="ml-10">{children}</div>
    </div>
  );
}

const inputClass =
  'w-full px-3.5 py-2.5 rounded-lg border border-g100 bg-white font-body text-sm text-g800 outline-none focus:border-gold transition-colors';
