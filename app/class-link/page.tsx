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

const labelClass = 'block text-[12px] text-[#5B6B80] mb-1';
const inputClass =
  'w-full h-10 bg-white border border-[#D5DEE9] rounded-[10px] px-3 text-[14px] text-[#2F3B4C] outline-none focus:border-[#9CC0E6]';

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
      <div className="min-h-screen bg-[#F3F6FA] flex items-center justify-center px-6">
        <div className="max-w-[340px] w-full bg-white rounded-[12px] border border-[#D5DEE9] p-8 text-center">
          <p className="text-[18px] font-medium text-[#2F3B4C] mb-2">Response received</p>
          <p className="text-[14px] text-[#5B6B80] leading-relaxed">
            Thank you. You can close this page now.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F6FA] flex justify-center px-4 py-8">
      <form
        onSubmit={handleSubmit}
        className="max-w-[380px] w-full bg-[#F3F6FA] flex flex-col gap-3"
      >
        <h1 className="text-[20px] font-medium text-[#2F3B4C] mb-2">
          Class group link issues
        </h1>

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
          <select
            className={inputClass}
            value={session}
            onChange={(e) => setSession(e.target.value)}
          >
            <option value="">Select session</option>
            {SESSIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
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
          <div className="flex flex-col gap-[6px]">
            {ISSUES.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setIssue(opt)}
                className={`text-left text-[14px] rounded-[10px] px-3 py-[10px] border ${
                  issue === opt
                    ? 'bg-[#E3EEF9] border-[#9CC0E6] text-[#2F4A6B]'
                    : 'bg-white border-[#D5DEE9] text-[#2F3B4C]'
                }`}
              >
                {opt}
              </button>
            ))}
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
          <div className="flex gap-2">
            {['Yes', 'No'].map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setGotSms(opt)}
                className={`flex-1 text-center text-[14px] rounded-[10px] py-[10px] border ${
                  gotSms === opt
                    ? 'bg-[#E3EEF9] border-[#9CC0E6] text-[#2F4A6B]'
                    : 'bg-white border-[#D5DEE9] text-[#2F3B4C]'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={labelClass}>Anything else? (optional)</label>
          <textarea
            className="w-full h-16 bg-white border border-[#D5DEE9] rounded-[10px] px-3 py-2 text-[14px] text-[#2F3B4C] outline-none focus:border-[#9CC0E6]"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {error && <p className="text-[13px] text-[#B4443C]">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="bg-[#8FB8DE] text-[#1F3550] rounded-[10px] py-3 text-[15px] font-medium mt-1 disabled:opacity-60"
        >
          {submitting ? 'Submitting…' : 'Submit'}
        </button>
      </form>
    </div>
  );
}
