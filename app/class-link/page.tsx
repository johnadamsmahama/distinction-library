'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const SESSIONS = ['Regular', 'Evening', 'Weekend'];
const ISSUES = [
  'I never received the SMS',
  'The link says it was reset',
  "The link won't open",
  'Other',
];

const labelClass =
  'block text-[13px] font-extrabold text-[#1F3550] mb-[6px] tracking-[0.02em]';
const inputClass =
  'w-full h-11 bg-white border border-[#C9D3E0] rounded-none appearance-none px-3 text-[15px] font-bold text-[#1F3550] outline-none focus:border-[#5B87B8]';

function Segmented({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex">
      {options.map((opt, i) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`flex-1 py-3 text-[14px] font-bold text-center border rounded-none ${
            i > 0 ? 'border-l-0' : ''
          } ${
            value === opt
              ? 'bg-[#5B87B8] border-[#5B87B8] text-white'
              : 'bg-white border-[#C9D3E0] text-[#2F3B4C]'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

export default function ClassLinkPage() {
  const [fullName, setFullName] = useState('');
  const [indexNumber, setIndexNumber] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [session, setSession] = useState('');
  const [department, setDepartment] = useState('');
  const [programme, setProgramme] = useState('');
  const [issue, setIssue] = useState('');
  const [admissionPhone, setAdmissionPhone] = useState('');
  const [gotSms, setGotSms] = useState('');
  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (
      !fullName.trim() ||
      !indexNumber.trim() ||
      !whatsapp.trim() ||
      !session ||
      !department.trim() ||
      !programme.trim() ||
      !issue ||
      !admissionPhone.trim() ||
      !gotSms
    ) {
      setError('Fill in every field except the last one.');
      return;
    }

    setSubmitting(true);

    const supabase = createClient();
    const { error: insertError } = await supabase.from('class_link_issues').insert({
      full_name: fullName.trim(),
      index_number: indexNumber.trim(),
      whatsapp_number: whatsapp.trim(),
      session,
      department: department.trim(),
      programme: programme.trim(),
      issue,
      admission_phone: admissionPhone.trim(),
      received_any_sms: gotSms,
      notes: notes.trim() || null,
    });

    setSubmitting(false);

    if (insertError) {
      setError("That didn't go through. Check your connection and try again.");
      return;
    }

    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#EEF2F7] font-body flex items-center justify-center px-4">
        <div className="max-w-[380px] w-full bg-white border-t-4 border-[#5B87B8] shadow-[0_2px_12px_rgba(31,53,80,0.08)] p-8 text-center">
          <p className="text-[20px] font-bold text-[#1F3550] mb-2">Response received</p>
          <p className="text-[14px] text-[#6B7A8F] leading-relaxed">
            Thank you. You can close this page now.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EEF2F7] font-body flex justify-center px-3 py-5">
      <form
        onSubmit={handleSubmit}
        className="max-w-[420px] w-full self-start bg-white border-t-4 border-[#5B87B8] shadow-[0_2px_12px_rgba(31,53,80,0.08)]"
      >
        <div className="px-5 pt-6 pb-5 border-b border-[#DDE4EE]">
          <h1 className="text-[22px] font-bold text-[#1F3550]">Class group link issues</h1>
          <p className="text-[13px] text-[#6B7A8F] mt-1">Takes about a minute</p>
        </div>

        <div className="px-5 pt-5 pb-6 flex flex-col gap-4">
          <div>
            <label className={labelClass}>Full name</label>
            <input
              className={inputClass}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div>
            <label className={labelClass}>Index number</label>
            <input
              className={inputClass}
              value={indexNumber}
              onChange={(e) => setIndexNumber(e.target.value)}
            />
          </div>

          <div>
            <label className={labelClass}>WhatsApp number</label>
            <input
              className={inputClass}
              type="tel"
              inputMode="tel"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
            />
          </div>

          <div>
            <label className={labelClass}>Session</label>
            <Segmented options={SESSIONS} value={session} onChange={setSession} />
          </div>

          <div>
            <label className={labelClass}>Department</label>
            <input
              className={inputClass}
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            />
          </div>

          <div>
            <label className={labelClass}>Programme</label>
            <input
              className={inputClass}
              value={programme}
              onChange={(e) => setProgramme(e.target.value)}
            />
          </div>

          <div>
            <label className={labelClass}>What is your issue?</label>
            <div className="flex flex-col">
              {ISSUES.map((opt, i) => {
                const selected = issue === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setIssue(opt)}
                    className={`flex items-center gap-3 text-left text-[14px] font-bold px-[14px] py-[13px] border rounded-none ${
                      i > 0 ? 'border-t-0' : ''
                    } ${
                      selected
                        ? 'bg-[#EAF1F9] border-[#8FB0D6] border-l-[3px] border-l-[#5B87B8] text-[#1F3550]'
                        : 'bg-white border-[#C9D3E0] text-[#2F3B4C]'
                    }`}
                  >
                    <span
                      className={`flex-none w-4 h-4 rounded-full bg-white ${
                        selected ? 'border-[5px] border-[#5B87B8]' : 'border border-[#AEBBCC]'
                      }`}
                    />
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className={labelClass}>Phone number you gave at admission</label>
            <input
              className={inputClass}
              type="tel"
              inputMode="tel"
              value={admissionPhone}
              onChange={(e) => setAdmissionPhone(e.target.value)}
            />
          </div>

          <div>
            <label className={labelClass}>Did you get any SMS from UPSA?</label>
            <Segmented options={['Yes', 'No']} value={gotSms} onChange={setGotSms} />
          </div>

          <div>
            <label className={labelClass}>Anything else? (optional)</label>
            <textarea
              className="w-full h-20 bg-white border border-[#C9D3E0] rounded-none appearance-none px-3 py-2 text-[15px] font-bold text-[#1F3550] outline-none focus:border-[#5B87B8]"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {error && <p className="text-[13px] font-bold text-[#B4443C]">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="bg-[#2F5A8A] text-white rounded-none py-[15px] text-[15px] font-bold tracking-[0.02em] mt-1 disabled:opacity-60"
          >
            {submitting ? 'Submitting…' : 'Submit'}
          </button>
        </div>
      </form>
    </div>
  );
}
