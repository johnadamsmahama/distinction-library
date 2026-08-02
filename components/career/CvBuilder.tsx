'use client';

import { useState, useRef } from 'react';

type EducationEntry = { institution: string; qualification: string; dates: string };
type ExperienceEntry = { role: string; organisation: string; dates: string; bullets: string };
type AttachedFile = { name: string; type: string; data: string }; // data = base64

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
      <div className="flex gap-2">
        <ModeBtn active={mode === 'build'} onClick={() => setMode('build')}>
          Build from scratch
        </ModeBtn>
        <ModeBtn active={mode === 'improve'} onClick={() => setMode('improve')}>
          Improve existing CV
        </ModeBtn>
      </div>

      {mode === 'improve' ? (
        <div className="bg-white border border-g100 rounded-2xl p-6 space-y-4">
          <div>
            <label className={labelClass}>Target role or field (optional)</label>
            <input
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g. Marketing internship, Software Engineering graduate role"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Paste your existing CV</label>
            <textarea
              rows={10}
              value={existingCv}
              onChange={(e) => setExistingCv(e.target.value)}
              placeholder="Paste the full text of your current CV here…"
              className={inputClass}
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-g100" />
            <span className="font-condensed text-xs text-g600">OR</span>
            <div className="flex-1 h-px bg-g100" />
          </div>

          <div>
            <label className={labelClass}>Upload your CV file</label>
            <div className="flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={smallActionClass}
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
              {attachedFile && (
                <span className="font-condensed text-xs text-g600 flex items-center gap-1.5">
                  📎 {attachedFile.name}
                  <button onClick={removeFile} className="text-g600 hover:text-navy" aria-label="Remove file">
                    ✕
                  </button>
                </span>
              )}
            </div>
            <p className="font-body text-xs text-g600 mt-1.5">
              Accepts PDF, Word (.docx), or a clear photo of your CV.
            </p>
            {fileError && <p className="font-body text-xs text-red-500 mt-1">{fileError}</p>}
          </div>
        </div>
      ) : (
        <div className="bg-white border border-g100 rounded-2xl p-6 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Full name</label>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Contact info (phone, email, location)</label>
              <input value={contactInfo} onChange={(e) => setContactInfo(e.target.value)} className={inputClass} />
            </div>
          </div>

          <div>
            <label className={labelClass}>Target role or field</label>
            <input
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g. Marketing internship, Software Engineering graduate role"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Education</label>
            <div className="space-y-3">
              {education.map((row, i) => (
                <div key={i} className="grid gap-2 sm:grid-cols-3">
                  <input
                    value={row.qualification}
                    onChange={(e) => updateEducation(i, 'qualification', e.target.value)}
                    placeholder="Qualification (e.g. BSc Accounting)"
                    className={inputClass}
                  />
                  <input
                    value={row.institution}
                    onChange={(e) => updateEducation(i, 'institution', e.target.value)}
                    placeholder="Institution"
                    className={inputClass}
                  />
                  <input
                    value={row.dates}
                    onChange={(e) => updateEducation(i, 'dates', e.target.value)}
                    placeholder="Dates (e.g. 2022–2026)"
                    className={inputClass}
                  />
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setEducation((rows) => [...rows, { ...emptyEducation }])}
              className={addRowClass}
            >
              + Add education
            </button>
          </div>

          <div>
            <label className={labelClass}>Experience (work, internships, projects, leadership)</label>
            <div className="space-y-4">
              {experience.map((row, i) => (
                <div key={i} className="border border-g100 rounded-lg p-3 space-y-2">
                  <div className="grid gap-2 sm:grid-cols-3">
                    <input
                      value={row.role}
                      onChange={(e) => updateExperience(i, 'role', e.target.value)}
                      placeholder="Role/title"
                      className={inputClass}
                    />
                    <input
                      value={row.organisation}
                      onChange={(e) => updateExperience(i, 'organisation', e.target.value)}
                      placeholder="Organisation"
                      className={inputClass}
                    />
                    <input
                      value={row.dates}
                      onChange={(e) => updateExperience(i, 'dates', e.target.value)}
                      placeholder="Dates"
                      className={inputClass}
                    />
                  </div>
                  <textarea
                    rows={3}
                    value={row.bullets}
                    onChange={(e) => updateExperience(i, 'bullets', e.target.value)}
                    placeholder="What did you do/achieve? One point per line — the AI will turn these into polished bullet points."
                    className={inputClass}
                  />
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setExperience((rows) => [...rows, { ...emptyExperience }])}
              className={addRowClass}
            >
              + Add experience
            </button>
          </div>

          <div>
            <label className={labelClass}>Skills (comma-separated)</label>
            <input
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="e.g. Excel, financial modelling, public speaking"
              className={inputClass}
            />
          </div>
        </div>
      )}

      {error && <p className="font-body text-sm text-red-500">{error}</p>}

      <button
        onClick={generate}
        disabled={loading}
        className="w-full sm:w-auto bg-gold text-navy font-condensed font-bold text-sm px-6 py-3 rounded-lg hover:bg-gold-light transition-colors disabled:opacity-60"
      >
        {loading ? 'Generating…' : mode === 'improve' ? 'Improve my CV' : 'Generate CV'}
      </button>

      {result && (
        <div className="bg-white border border-g100 rounded-2xl p-6">
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
      className={`font-condensed font-bold text-xs uppercase px-4 py-2.5 rounded-lg border transition-colors ${
        active ? 'border-gold bg-gold/10 text-navy' : 'border-g100 text-g600'
      }`}
    >
      {children}
    </button>
  );
}

const labelClass = 'block font-condensed font-semibold text-xs uppercase tracking-wide text-g800 mb-1.5';
const inputClass =
  'w-full px-3.5 py-2.5 rounded-lg border border-g100 font-body text-sm text-g800 outline-none focus:border-gold transition-colors';
const addRowClass = 'mt-2 font-condensed font-bold text-xs uppercase tracking-wide text-gold hover:underline';
const smallActionClass =
  'font-condensed font-bold text-xs uppercase tracking-wide text-navy border border-g100 rounded-lg px-3 py-1.5 hover:border-gold transition-colors';
