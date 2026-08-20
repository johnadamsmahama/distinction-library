'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

// Edit these five values per session — everything else stays the same.
const SESSION_COURSE = 'BGEC102 — Scholarly Writing';
const SESSION_DATE = '2026-08-25';
const SESSION_DATE_LABEL = '25 Aug';
const SESSION_TIME = '11:00 AM';
const SESSION_LOCATION = 'LBC Block';

export default function RevisionSummitPage() {
  const [fullName, setFullName] = useState('');
  const [courseLevel, setCourseLevel] = useState('');
  const [livesInHostel, setLivesInHostel] = useState('yes');
  const [preferredFormat, setPreferredFormat] = useState<'in_person' | 'online'>('in_person');
  const [needsTransport, setNeedsTransport] = useState('yes');
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
      lives_in_hostel: livesInHostel === 'yes',
      preferred_format: preferredFormat,
      needs_transport: needsTransport === 'yes',
      phone_number: phoneNumber.trim(),
      session_course: SESSION_COURSE,
      session_date: SESSION_DATE,
      session_time: SESSION_TIME,
      session_location: SESSION_LOCATION,
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
            See you at the Revision Summit — {SESSION_DATE_LABEL}, {SESSION_TIME} at {SESSION_LOCATION}.
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
            Date: {SESSION_DATE_LABEL} &middot; Time: {SESSION_TIME} &middot; {SESSION_LOCATION}
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
            <label className="block text-[13px] font-semibold text-g800 mb-1.5">Do you live in the hostel?</label>
            <select
              value={livesInHostel}
              onChange={(e) => setLivesInHostel(e.target.value)}
              className="w-full bg-mint-light border border-mint text-g800 rounded-md px-3 py-2.5 text-sm"
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-g800 mb-2">Preferred format</label>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2.5 bg-mint-light border border-mint text-g800 rounded-md px-3 py-2.5 text-sm">
                <input
                  type="radio"
                  name="format"
                  checked={preferredFormat === 'in_person'}
                  onChange={() => setPreferredFormat('in_person')}
                />
                In-person mock session
              </label>
              <label className="flex items-center gap-2.5 bg-mint-light border border-mint text-g800 rounded-md px-3 py-2.5 text-sm">
                <input
                  type="radio"
                  name="format"
                  checked={preferredFormat === 'online'}
                  onChange={() => setPreferredFormat('online')}
                />
                Online mock session
              </label>
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-g800 mb-1.5">Need transport support?</label>
            <select
              value={needsTransport}
              onChange={(e) => setNeedsTransport(e.target.value)}
              className="w-full bg-mint-light border border-mint text-g800 rounded-md px-3 py-2.5 text-sm"
            >
              <option value="yes">Yes, I&apos;m off-campus</option>
              <option value="no">No, I&apos;m in the hostel</option>
            </select>
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
