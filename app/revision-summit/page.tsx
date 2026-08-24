'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

// Edit these values per session — everything else stays the same.
const SESSION_COURSE = 'BGEC102 — Scholarly Writing';
const SESSION_DATE = '2026-08-25';
const SESSION_DATE_LABEL = '25 Aug';
const SESSION_TIME = '8:30 PM';
const SESSION_MODE = 'Online (Google Classroom) — link shared after you sign up';

export default function RevisionSummitPage() {
  const [fullName, setFullName] = useState('');
  const [courseLevel, setCourseLevel] = useState('');
  const [wantsStipend, setWantsStipend] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!fullName.trim() || !courseLevel.trim() || !phoneNumber.trim()) {
      setError('Please fill in your name, course/level, and phone number.');
      return;
    }

    setSubmitting(true);

    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();

    const { error: insertError } = await supabase.from('revision_summit_signups').insert({
      student_id: userData?.user?.id ?? null,
      full_name: fullName.trim(),
      course_level: courseLevel.trim(),
      wants_stipend: wantsStipend,
      phone_number: phoneNumber.trim(),
      session_course: SESSION_COURSE,
      session_date: SESSION_DATE,
      session_time: SESSION_TIME,
      session_location: SESSION_MODE,
    });

    setSubmitting(false);

    if (insertError) {
      setError('Something went wrong submitting your response. Please try again.');
      return;
    }

    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-off-white flex items-center justify-center px-6">
        <div className="max-w-[340px] w-full bg-white rounded-xl border border-g100 p-8 text-center">
          <p className="font-display font-bold text-xl text-navy mb-2">You&apos;re signed up</p>
          <p className="font-body text-sm text-g600 leading-relaxed">
            See you at the Revision Summit — {SESSION_DATE_LABEL}, {SESSION_TIME}, online.
            {wantsStipend && ' We\u2019ll be in touch about your data stipend before the session.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-off-white flex items-center justify-center px-6 py-10">
      <div className="max-w-[340px] w-full bg-white rounded-xl border border-g100 overflow-hidden">
        <div className="bg-navy px-5 py-5 text-center">
          <p className="font-condensed text-[10px] tracking-wide text-white/90 font-semibold">
            J.A. MAHAMA DISTINCTION PROGRAMME
          </p>
          <p className="font-display font-semibold text-[15px] text-gold-light mt-1">
            Revision Summit — Mock Session
          </p>
          <p className="font-body font-semibold text-[13px] text-white mt-2">{SESSION_COURSE}</p>
          <p className="font-body text-[11px] text-white/65 mt-1">
            Date: {SESSION_DATE_LABEL} &middot; Time: {SESSION_TIME} &middot; {SESSION_MODE}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-5 flex flex-col gap-4">
          <div>
            <label className="block text-[13px] font-semibold text-g800 mb-1.5">Full name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. J.A. Mahama"
              className="w-full bg-mint-light border border-mint text-g800 rounded-md px-3 py-2.5 text-sm placeholder:text-g600/70"
            />
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-g800 mb-1.5">Course / level</label>
            <input
              type="text"
              value={courseLevel}
              onChange={(e) => setCourseLevel(e.target.value)}
              placeholder="e.g. Communication Studies, Level 100"
              className="w-full bg-mint-light border border-mint text-g800 rounded-md px-3 py-2.5 text-sm placeholder:text-g600/70"
            />
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-g800 mb-1.5">Phone number</label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="e.g. 024 000 0000"
              className="w-full bg-mint-light border border-mint text-g800 rounded-md px-3 py-2.5 text-sm placeholder:text-g600/70"
            />
          </div>

          <label className="flex items-start gap-2.5 bg-mint-light border border-mint text-g800 rounded-md px-3 py-2.5 text-sm">
            <input
              type="checkbox"
              checked={wantsStipend}
              onChange={(e) => setWantsStipend(e.target.checked)}
              className="mt-0.5"
            />
            <span>I&apos;d like a mobile data stipend to join the session online</span>
          </label>

          {error && <p className="text-xs text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gold text-navy-deep font-condensed font-bold text-sm py-3 rounded-md hover:bg-gold-light transition-colors disabled:opacity-60"
          >
            {submitting ? 'Submitting…' : 'Submit response'}
          </button>
        </form>
      </div>
    </div>
  );
}
