'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { studentIdError, studentIdToEmail } from '@/lib/validation';
import AuthShell from '@/components/auth/AuthShell';
import StudentIdInput from '@/components/auth/StudentIdInput';

export default function SignupPage() {
  const [studentId, setStudentId] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [idErr, setIdErr] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const idProblem = studentIdError(studentId);
    setIdErr(idProblem);
    if (idProblem) return;

    if (password.length < 8) {
      setFormError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const email = studentIdToEmail(studentId);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);

    if (error) {
      setFormError(error.message);
      return;
    }

    setSubmitted(true);
  };

  if (submitted) {
    return (
      <AuthShell eyebrow="Almost there" title="Check your UPSA email">
        <p className="font-body text-sm text-g600 leading-relaxed">
          We sent a confirmation link to{' '}
          <span className="font-semibold text-g800">{studentIdToEmail(studentId)}</span>. Open it
          on your phone or laptop to activate your account.
        </p>

        <div className="mt-6 bg-navy rounded-xl p-4">
          <div className="font-condensed font-bold text-xs uppercase tracking-wide text-white/70 mb-1.5">
            Optional
          </div>
          <p className="font-body text-sm text-white mb-3">
            While you wait, consider joining the J.A. Mahama Distinction Programme community —
            tutorials, revision sessions, and academic discussions with fellow UPSA students. This
            is entirely optional and separate from your Distinction Library account.
          </p>
          <a
            href="https://chat.whatsapp.com/IbMtGP4aNvY6QGPDUQQDvV?s=cl&p=a&ilr=0&amv=1"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-gold text-navy font-condensed font-bold text-xs uppercase px-4 py-2.5 rounded-lg hover:bg-gold-light transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-navy flex-shrink-0">
              <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.2h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2m0 1.67c2.2 0 4.26.86 5.82 2.42a8.2 8.2 0 0 1 2.41 5.82c0 4.54-3.7 8.24-8.24 8.24a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.17 8.17 0 0 1-1.25-4.38c0-4.54 3.7-8.24 8.24-8.24M8.53 6.7c-.17 0-.45.06-.68.32-.24.25-.9.88-.9 2.15s.92 2.5 1.05 2.67c.13.17 1.8 2.87 4.43 3.9 2.19.87 2.64.7 3.11.65.48-.04 1.54-.63 1.76-1.23s.22-1.13.15-1.24c-.07-.11-.24-.17-.5-.3s-1.55-.76-1.79-.85c-.24-.09-.41-.13-.59.13-.17.26-.67.85-.82 1.02-.15.17-.3.19-.56.06s-1.08-.4-2.06-1.27c-.76-.68-1.28-1.51-1.43-1.77-.15-.26-.02-.4.11-.53.12-.11.26-.3.39-.44.13-.15.17-.26.26-.43.09-.17.04-.32-.02-.45-.06-.13-.59-1.44-.81-1.97-.21-.51-.43-.44-.59-.45l-.5-.01Z" />
            </svg>
            Join the Distinction Programme WhatsApp Community
          </a>
        </div>

        <Link
          href="/login"
          className="block text-center mt-6 font-condensed font-bold text-sm text-navy underline underline-offset-4"
        >
          Back to login
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Get started"
      title="Create your account"
      subtitle="Access is exclusive to verified UPSA students."
      footer={
        <>
          Already have an account?{' '}
          <Link href="/login" className="text-gold hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <StudentIdInput value={studentId} onChange={setStudentId} error={idErr} />

        <div>
          <label htmlFor="fullName" className="block font-condensed font-semibold text-xs uppercase tracking-wide text-g800 mb-1.5">
            Full name
          </label>
          <input
            id="fullName"
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-g100 font-body text-[15px] text-g800 outline-none focus:border-gold transition-colors"
            placeholder="e.g. Ama Serwaa"
          />
        </div>

        <div>
          <label htmlFor="password" className="block font-condensed font-semibold text-xs uppercase tracking-wide text-g800 mb-1.5">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-g100 font-body text-[15px] text-g800 outline-none focus:border-gold transition-colors"
            placeholder="At least 8 characters"
            autoComplete="new-password"
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block font-condensed font-semibold text-xs uppercase tracking-wide text-g800 mb-1.5">
            Confirm password
          </label>
          <input
            id="confirmPassword"
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-g100 font-body text-[15px] text-g800 outline-none focus:border-gold transition-colors"
            autoComplete="new-password"
          />
        </div>

        {formError && <p className="font-body text-sm text-red-500">{formError}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gold text-navy font-condensed font-bold text-sm py-2.5 rounded-lg hover:bg-gold-light transition-colors disabled:opacity-60"
        >
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </AuthShell>
  );
}
