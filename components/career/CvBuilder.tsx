'use client';

import { useState, useRef } from 'react';

type EducationEntry = { institution: string; qualification: string; dates: string };
type ExperienceEntry = { role: string; organisation: string; dates: string; bullets: string };
type AttachedFile = { name: string; type: string; data: string };

const emptyEducation: EducationEntry = { institution: '', qualification: '', dates: '' };
const emptyExperience: ExperienceEntry = { role: '', organisation: '', dates: '', bullets: '' };
const ACCEPTED_TYPES = '.pdf,.docx,.png,.jpg,.jpeg';
const MAX_FILE_SIZE_MB = 15;

export default function CvBuilder() {
  const [mode, setMode] = useState<'build' | 'improve'>('build');
  const [fullName, setFullName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [education, setEducation] = useState<EducationEntry[]>([{ ...emptyEducation }]);
  const [experience, setExperience] = useState<ExperienceEntry[]>([{ ...emptyExperience }]);
  const [skills, setSkills] = useState('');
  const [existingCv, setExistingCv] = useState('');
  const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null);
  const [fileError, setFileError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const updateEducation = (i: number, field: keyof EducationEntry, value: string) => {
    setEducation((rows) => rows.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));
  };
  const updateExperience = (i: number, field: keyof ExperienceEntry, value: string) => {
    setExperience((rows) => rows.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));
  };

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

  const generate = async () => {
    setError(null);
    setResult(null);

    if (mode === 'build' && !fullName.trim()) {
      setError('Add your full name first.');
      return;
    }
    if (mode === 'improve' && !existingCv.trim() && !attachedFile) {
      setError('Paste your existing CV text or upload a file first.');
      return;
    }

    setLoading(true);
    const res = await fetch('/api/career/cv-builder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName,
        targetRole,
        contactInfo,
        education,
        experience,
        skills,
        existingCv: mode === 'improve' ? existingCv : undefined,
        attachedFile: mode === 'improve' ? attachedFile ?? undefined : undefined,
      }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? 'Something went wrong.');
      return;
    }
    setResult(data.cv);
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
    a.download = `${(fullName || 'cv').replace(/\s+/g, '_')}_CV.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Mode toggle */}
      <div className="flex gap-2">
        <ModeBtn active={mode === 'build'} onClick={() => setMode('build')}>
          Build from Scratch
        </ModeBtn>
        <ModeBtn active={mode === 'improve'} onClick={() => setMode('improve')}>
          Improve Existing CV
        </ModeBtn>
      </div>

      {/* Form card */}
      <div className="relative bg-off-white border border-g100 rounded-3xl px-5 pt-3 pb-7 shadow-sm overflow-hidden">
        {/* gold thread connector */}
        <div
          className="absolute left-[31px] top-0 bottom-6 w-0.5 opacity-50"
          style={{
            backgroundImage:
              'repeating-linear-gradient(to bottom, #E2BE5A 0, #E2BE5A 4px, transparent 4px, transparent 9px)',
          }}
        />

        {mode === 'improve' ? (
          <>
            <Step n={1} label="Your Current CV" hint="Upload a file or paste the text below">
              <div className="border-[1.5px] border-dashed border-gold rounded-2xl px-4 py-6 text-center bg-gold/5">
                <div className="w-10 h-10 mx-auto mb-2.5 rounded-full bg-navy text-gold flex items-center justify-center">
                  <UploadIcon />
                </div>
                <p className="font-condensed font-bold text-sm text-navy mb-0.5">Upload your CV</p>
                <p className="font-body text-xs text-g600 mb-3">PDF, Word, or image · up to {MAX_FILE_SIZE_MB}MB</p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-block bg-white border border-g100 rounded-lg px-4 py-2 font-condensed font-semibold text-xs text-navy"
                >
                  {attachedFile ? 'Change file' : 'Choose file'}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_TYPES}
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {fileError && <p className="font-body text-xs text-red-500 mt-2">{fileError}</p>}

              {attachedFile && (
                <div className="flex items-center gap-2.5 bg-white border border-g100 rounded-xl px-3.5 py-2.5 mt-3">
                  <div className="w-8 h-8 rounded-lg bg-gold/15 text-gold flex items-center justify-center flex-shrink-0">
                    <FileIcon />
                  </div>
                  <div className="min-w-0">
                    <p className="font-condensed font-semibold text-xs text-g800 truncate">{attachedFile.name}</p>
                    <p className="font-body text-[11px] text-g600">Uploaded</p>
                  </div>
                  <button
                    onClick={removeFile}
                    aria-label="Remove file"
                    className="ml-auto text-g600 hover:text-navy flex-shrink-0"
                  >
                    ✕
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2.5 my-4">
                <div className="flex-1 h-px bg-g100" />
                <span className="font-condensed text-[11px] font-semibold uppercase tracking-wide text-g600">
                  or paste text
                </span>
                <div className="flex-1 h-px bg-g100" />
              </div>

              <textarea
                rows={7}
                value={existingCv}
                onChange={(e) => setExistingCv(e.target.value)}
                placeholder="Paste the full text of your existing CV here…"
                className={inputClass}
              />
            </Step>

            <Step
              n={2}
              label="Target Role or Field"
              hint="Helps the AI tailor improvements to what you're applying for"
              first={false}
            >
              <input
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Marketing internship, Software Engineering"
                className={inputClass}
              />
            </Step>
          </>
        ) : (
          <>
            <Step n={1} label="Full Name">
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Adams Mahama"
                className={inputClass}
              />
            </Step>

            <Step n={2} label="Contact Info" hint="Phone, email, location">
              <input
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                placeholder="e.g. 024 000 0000, you@email.com, Accra"
                className={inputClass}
              />
            </Step>

            <Step n={3} label="Target Role or Field">
              <input
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Marketing internship, Software Engineering"
                className={inputClass}
              />
            </Step>

            <Step n={4} label="Education">
              <div className="space-y-3">
                {education.map((row, i) => (
                  <div key={i} className="bg-white border border-g100 rounded-xl p-4 space-y-2.5">
                    <FieldLabel>Qualification</FieldLabel>
                    <input
                      value={row.qualification}
                      onChange={(e) => updateEducation(i, 'qualification', e.target.value)}
                      placeholder="e.g. BSc Accounting"
                      className={inputClass}
                    />
                    <FieldLabel>Institution</FieldLabel>
                    <input
                      value={row.institution}
                      onChange={(e) => updateEducation(i, 'institution', e.target.value)}
                      placeholder="e.g. UPSA"
                      className={inputClass}
                    />
                    <FieldLabel>Dates</FieldLabel>
                    <input
                      value={row.dates}
                      onChange={(e) => updateEducation(i, 'dates', e.target.value)}
                      placeholder="e.g. 2022–2026"
                      className={inputClass}
                    />
                  </div>
                ))}
              </div>
              <AddLink onClick={() => setEducation((rows) => [...rows, { ...emptyEducation }])}>
                Add education
              </AddLink>
            </Step>

            <Step n={5} label="Experience" hint="Work, internships, projects, leadership">
              <div className="space-y-3">
                {experience.map((row, i) => (
                  <div key={i} className="bg-white border border-g100 rounded-xl p-4 space-y-2.5">
                    <FieldLabel>Role / Title</FieldLabel>
                    <input
                      value={row.role}
                      onChange={(e) => updateExperience(i, 'role', e.target.value)}
                      placeholder="e.g. Marketing Intern"
                      className={inputClass}
                    />
                    <FieldLabel>Organisation</FieldLabel>
                    <input
                      value={row.organisation}
                      onChange={(e) => updateExperience(i, 'organisation', e.target.value)}
                      placeholder="e.g. Distinction Library"
                      className={inputClass}
                    />
                    <FieldLabel>Dates</FieldLabel>
                    <input
                      value={row.dates}
                      onChange={(e) => updateExperience(i, 'dates', e.target.value)}
                      placeholder="e.g. Jun 2025 – Aug 2025"
                      className={inputClass}
                    />
                    <FieldLabel>What did you do / achieve?</FieldLabel>
                    <textarea
                      rows={3}
                      value={row.bullets}
                      onChange={(e) => updateExperience(i, 'bullets', e.target.value)}
                      placeholder="One point per line — the AI will turn these into polished bullet points."
                      className={inputClass}
                    />
                  </div>
                ))}
              </div>
              <AddLink onClick={() => setExperience((rows) => [...rows, { ...emptyExperience }])}>
                Add experience
              </AddLink>
            </Step>

            <Step n={6} label="Skills" hint="Comma-separated">
              <input
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                placeholder="e.g. Excel, financial modelling, public speaking"
                className={inputClass}
              />
            </Step>
          </>
        )}
      </div>

      {error && <p className="font-body text-sm text-red-500">{error}</p>}

      {/* CTA */}
      <div>
        <button
          onClick={generate}
          disabled={loading}
          className="w-full bg-gradient-to-br from-navy-mid to-navy-deep text-white font-condensed font-bold text-sm uppercase tracking-wide px-6 py-4 rounded-2xl shadow-lg shadow-navy-deep/20 flex items-center justify-center gap-2 disabled:opacity-60"
        >
          <SparkleIcon />
          {loading ? 'Generating…' : mode === 'improve' ? 'Improve My CV' : 'Generate My CV'}
        </button>
        <p className="text-center font-body text-xs text-g600 mt-2.5">Takes about 20 seconds</p>
      </div>

      {result && (
        <div className="bg-off-white border border-g100 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold text-lg text-navy">Your CV</h2>
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

function ModeBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 text-center font-condensed font-bold text-xs uppercase tracking-wide px-3 py-3.5 rounded-xl border-[1.5px] transition-colors ${
        active
          ? 'bg-gradient-to-br from-gold-light to-gold text-navy border-transparent shadow-md shadow-gold/30'
          : 'bg-white text-g600 border-g100'
      }`}
    >
      {children}
    </button>
  );
}

function Step({
  n,
  label,
  hint,
  first,
  children,
}: {
  n: number;
  label: string;
  hint?: string;
  first?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`relative z-10 py-6 ${first === false || n > 1 ? 'border-t border-g100' : ''}`}>
      <div className="flex items-center gap-3 mb-1">
        <div className="w-7 h-7 rounded-full bg-navy text-gold font-display font-semibold text-[13px] flex items-center justify-center flex-shrink-0 ring-4 ring-off-white">
          {n}
        </div>
        <span className="font-condensed font-bold text-[12.5px] uppercase tracking-wide text-navy">{label}</span>
      </div>
      {hint && <p className="font-body text-xs text-g600 ml-10 mb-2.5">{hint}</p>}
      <div className="ml-10 mt-3">{children}</div>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block font-condensed font-semibold text-[11px] uppercase tracking-wide text-g600">
      {children}
    </label>
  );
}

function AddLink({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-3 inline-flex items-center gap-1.5 font-condensed font-bold text-xs text-gold hover:underline"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
      {children}
    </button>
  );
}

function UploadIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gold">
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
    </svg>
  );
}

const inputClass =
  'w-full px-3.5 py-3 rounded-xl border border-g100 bg-white font-body text-sm text-g800 outline-none focus:border-gold focus:ring-4 focus:ring-gold/15 transition-colors';
const smallActionClass =
  'font-condensed font-bold text-xs uppercase tracking-wide text-navy border border-g100 rounded-lg px-3 py-1.5 hover:border-gold transition-colors';
