'use client';

import { useState } from 'react';

type Tone = 'professional' | 'enthusiastic' | 'concise';

export default function CoverLetterGenerator() {
  const [fullName, setFullName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [roleTitle, setRoleTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [background, setBackground] = useState('');
  const [tone, setTone] = useState<Tone>('professional');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    setError(null);
    setResult(null);

    if (!fullName.trim()) {
      setError('Add your full name first.');
      return;
    }
    if (!roleTitle.trim()) {
      setError('Add the role you\'re applying for.');
      return;
    }
    if (!background.trim()) {
      setError('Add a few points about your relevant background or experience.');
      return;
    }

    setLoading(true);
    const res = await fetch('/api/career/cover-letter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName,
        contactInfo,
        companyName,
        roleTitle,
        jobDescription: jobDescription.trim() || undefined,
        background,
        tone,
      }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? 'Something went wrong.');
      return;
    }
    setResult(data.letter);
  };

  const copyResult = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadResult = () => {
    if (!result) return;
    const blob = new Blob([result], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(fullName || 'cover_letter').replace(/\s+/g, '_')}_Cover_Letter.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-g100 rounded-2xl p-6 space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Full name</label>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Contact info (phone, email)</label>
            <input value={contactInfo} onChange={(e) => setContactInfo(e.target.value)} className={inputClass} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Role you're applying for</label>
            <input
              value={roleTitle}
              onChange={(e) => setRoleTitle(e.target.value)}
              placeholder="e.g. Marketing Intern"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Company (optional)</label>
            <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className={inputClass} />
          </div>
        </div>

        <div>
          <label className={labelClass}>Job description (optional, but helps tailor the letter)</label>
          <textarea
            rows={5}
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the job posting here if you have it…"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Your relevant background, experience, and skills</label>
          <textarea
            rows={5}
            value={background}
            onChange={(e) => setBackground(e.target.value)}
            placeholder="Write freely — courses, projects, internships, skills, why you want this role. The AI will shape it into a proper letter."
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Tone</label>
          <div className="flex gap-2 flex-wrap">
            <ToneBtn active={tone === 'professional'} onClick={() => setTone('professional')}>
              Professional
            </ToneBtn>
            <ToneBtn active={tone === 'enthusiastic'} onClick={() => setTone('enthusiastic')}>
              Enthusiastic
            </ToneBtn>
            <ToneBtn active={tone === 'concise'} onClick={() => setTone('concise')}>
              Concise
            </ToneBtn>
          </div>
        </div>
      </div>

      {error && <p className="font-body text-sm text-red-500">{error}</p>}

      <button
        onClick={generate}
        disabled={loading}
        className="w-full sm:w-auto bg-gold text-navy font-condensed font-bold text-sm px-6 py-3 rounded-lg hover:bg-gold-light transition-colors disabled:opacity-60"
      >
        {loading ? 'Generating…' : 'Generate cover letter'}
      </button>

      {result && (
        <div className="bg-white border border-g100 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold text-lg text-navy">Your cover letter</h2>
            <div className="flex gap-2">
              <button onClick={copyResult} className={smallActionClass}>
                {copied ? 'Copied ✓' : 'Copy'}
              </button>
              <button onClick={downloadResult} className={smallActionClass}>
                Download .txt
              </button>
            </div>
          </div>
          <pre className="font-body text-sm text-g800 whitespace-pre-wrap leading-relaxed">{result}</pre>
        </div>
      )}
    </div>
  );
}

function ToneBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`font-condensed font-bold text-xs uppercase px-4 py-2.5 rounded-xl transition-all ${
        active
          ? 'bg-gold text-navy shadow-md'
          : 'bg-white text-g600 border border-g100'
      }`}
    >
      {children}
    </button>
  );
}

const labelClass = 'block font-condensed font-semibold text-xs uppercase tracking-wide text-g800 mb-1.5';
const inputClass =
  'w-full px-3.5 py-2.5 rounded-lg border border-g100 font-body text-sm text-g800 outline-none focus:border-gold transition-colors';
const smallActionClass =
  'font-condensed font-bold text-xs uppercase tracking-wide text-navy border border-g100 rounded-lg px-3 py-1.5 hover:border-gold transition-colors';
