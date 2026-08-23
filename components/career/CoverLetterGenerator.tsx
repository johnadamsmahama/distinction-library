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
    <div className="space-y-6 mt-6">
      <div className="relative bg-off-white rounded-none border border-g100 shadow-sm px-5 pb-7 pt-2">
        {/* gold dotted thread */}
        <div
          className="absolute left-[34px] top-0 bottom-8 w-[2px] opacity-50"
          style={{
            backgroundImage:
              'repeating-linear-gradient(to bottom, #C9A02C 0, #C9A02C 4px, transparent 4px, transparent 9px)',
          }}
        />

        <Section num={1} label="Full Name">
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} />
        </Section>

        <Section num={2} label="Contact Info" hint="Phone, email">
          <input value={contactInfo} onChange={(e) => setContactInfo(e.target.value)} className={inputClass} />
        </Section>

        <Section num={3} label="Role You're Applying For">
          <input
            value={roleTitle}
            onChange={(e) => setRoleTitle(e.target.value)}
            placeholder="e.g. Marketing Intern"
            className={inputClass}
          />
        </Section>

        <Section num={4} label="Company" hint="Optional">
          <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className={inputClass} />
        </Section>

        <Section num={5} label="Job Description" hint="Optional, but helps tailor the letter">
          <textarea
            rows={5}
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the job posting here if you have it…"
            className={inputClass}
          />
        </Section>

        <Section num={6} label="Your Background" hint="Relevant experience and skills">
          <textarea
            rows={5}
            value={background}
            onChange={(e) => setBackground(e.target.value)}
            placeholder="Write freely — courses, projects, internships, skills, why you want this role. The AI will shape it into a proper letter."
            className={inputClass}
          />
        </Section>

        <Section num={7} label="Tone" isLast>
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
        </Section>
      </div>

      {error && <p className="font-body text-sm text-red-500">{error}</p>}

      <button
        onClick={generate}
        disabled={loading}
        className="w-full sm:w-auto bg-gradient-to-br from-navy-mid to-navy text-white font-condensed font-bold text-sm px-6 py-3.5 rounded-none shadow-lg hover:opacity-95 transition-opacity disabled:opacity-60"
      >
        {loading ? 'Generating…' : 'Generate cover letter'}
      </button>

      {result && (
        <div className="bg-off-white border border-g100 rounded-none p-6">
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
        <div className="w-7 h-7 rounded-none bg-navy text-gold-light font-display font-semibold text-xs flex items-center justify-center flex-shrink-0 shadow-[0_0_0_4px_#F7F8FC]">
          {num}
        </div>
        <div className="font-condensed font-bold text-xs uppercase tracking-wide text-navy">{label}</div>
      </div>
      {hint && <div className="text-xs text-g600 ml-10 -mt-2 mb-3">{hint}</div>}
      <div className="ml-10">{children}</div>
    </div>
  );
}

function ToneBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`font-condensed font-bold text-xs uppercase px-4 py-2.5 rounded-none transition-all ${
        active
          ? 'bg-gold text-navy shadow-md'
          : 'bg-white text-g600 border border-g100'
      }`}
    >
      {children}
    </button>
  );
}

const inputClass =
  'w-full px-3.5 py-2.5 rounded-none border border-g100 bg-white font-body text-sm text-g800 outline-none focus:border-gold transition-colors';
const smallActionClass =
  'font-condensed font-bold text-xs uppercase tracking-wide text-navy border border-g100 rounded-none px-3 py-1.5 hover:border-gold transition-colors';
