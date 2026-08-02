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
    <div className="space-y-6">
      <div className="bg-white border border-g100 rounded-2xl p-6 space-y-5">
        <div>
          <label className={labelClass}>Target role or field</label>
          <input
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            placeholder="e.g. Data Analyst, Finance graduate roles"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Current headline (optional)</label>
          <input
            value={currentHeadline}
            onChange={(e) => setCurrentHeadline(e.target.value)}
            placeholder="What your LinkedIn headline currently says"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Current "About" section (optional)</label>
          <textarea
            rows={4}
            value={currentAbout}
            onChange={(e) => setCurrentAbout(e.target.value)}
            placeholder="Paste your current About section if you have one…"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Your background, experience, and skills</label>
          <textarea
            rows={5}
            value={background}
            onChange={(e) => setBackground(e.target.value)}
            placeholder="Write freely — courses, projects, internships, skills, what you're aiming for. The AI will use this to write your headline and About section."
            className={inputClass}
          />
        </div>
      </div>

      {error && <p className="font-body text-sm text-red-500">{error}</p>}

      <button
        onClick={generate}
        disabled={loading}
        className="w-full sm:w-auto bg-gold text-navy font-condensed font-bold text-sm px-6 py-3 rounded-lg hover:bg-gold-light transition-colors disabled:opacity-60"
      >
        {loading ? 'Generating…' : 'Optimize my LinkedIn'}
      </button>

      {result && (
        <div className="bg-white border border-g100 rounded-2xl p-6">
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

const labelClass = 'block font-condensed font-semibold text-xs uppercase tracking-wide text-g800 mb-1.5';
const inputClass =
  'w-full px-3.5 py-2.5 rounded-lg border border-g100 font-body text-sm text-g800 outline-none focus:border-gold transition-colors';
const smallActionClass =
  'font-condensed font-bold text-xs uppercase tracking-wide text-navy border border-g100 rounded-lg px-3 py-1.5 hover:border-gold transition-colors';
