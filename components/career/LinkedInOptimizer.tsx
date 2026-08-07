'use client';

import { useState } from 'react';

export default function LinkedInOptimizer() {
  const [targetRole, setTargetRole] = useState('');
  const [currentHeadline, setCurrentHeadline] = useState('');
  const [currentAbout, setCurrentAbout] = useState('');
  const [background, setBackground] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    setError(null);
    setResult(null);

    if (!targetRole.trim()) {
      setError('Add the role or field you\'re targeting.');
      return;
    }
    if (!background.trim()) {
      setError('Add a few points about your background and skills.');
      return;
    }

    setLoading(true);
    const res = await fetch('/api/career/linkedin-optimizer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetRole,
        currentHeadline: currentHeadline.trim() || undefined,
        currentAbout: currentAbout.trim() || undefined,
        background,
      }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? 'Something went wrong.');
      return;
    }
    setResult(data.result);
  };

  const copyResult = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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

        <Section num={1} label="Target Role or Field">
          <input
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            placeholder="e.g. Data Analyst, Finance graduate roles"
            className={inputClass}
          />
        </Section>

        <Section num={2} label="Current Headline" hint="Optional">
          <input
            value={currentHeadline}
            onChange={(e) => setCurrentHeadline(e.target.value)}
            placeholder="What your LinkedIn headline currently says"
            className={inputClass}
          />
        </Section>

        <Section num={3} label="Current About Section" hint="Optional">
          <textarea
            rows={4}
            value={currentAbout}
            onChange={(e) => setCurrentAbout(e.target.value)}
            placeholder="Paste your current About section if you have one…"
            className={inputClass}
          />
        </Section>

        <Section num={4} label="Your Background" hint="Experience, education, skills" isLast>
          <textarea
            rows={5}
            value={background}
            onChange={(e) => setBackground(e.target.value)}
            placeholder="Write freely — courses, projects, internships, skills, what you're aiming for. The AI will use this to write your headline and About section."
            className={inputClass}
          />
        </Section>
      </div>

      {error && <p className="font-body text-sm text-red-500">{error}</p>}

      <button
        onClick={generate}
        disabled={loading}
        className="w-full sm:w-auto bg-gradient-to-br from-navy-mid to-navy text-white font-condensed font-bold text-sm px-6 py-3.5 rounded-xl shadow-lg hover:opacity-95 transition-opacity disabled:opacity-60"
      >
        {loading ? 'Generating…' : 'Optimize my LinkedIn'}
      </button>

      {result && (
        <div className="bg-off-white border border-g100 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold text-lg text-navy">Suggestions</h2>
            <button onClick={copyResult} className={smallActionClass}>
              {copied ? 'Copied ✓' : 'Copy all'}
            </button>
          </div>
          <pre className="font-body text-sm text-g800 whitespace-pre-wrap leading-relaxed">{result}</pre>
        </div>
      )}
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
const smallActionClass =
  'font-condensed font-bold text-xs uppercase tracking-wide text-navy border border-g100 rounded-lg px-3 py-1.5 hover:border-gold transition-colors';
