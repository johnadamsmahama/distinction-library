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
      // The Postgres trigger also enforces the email format server-side —
      // this client check just gives faster feedback.
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
      <form onSubmit={handleSubmit} className="space-y-4">
        <StudentIdInput value={studentId} onChange={setStudentId} error={idErr} />

        <div>
          <label htmlFor="fullName" className="block font-condensed font-semibold text-xs uppercase tracking-wide text-g800 mb-2">
            Full name
          </label>
          <input
            id="fullName"
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-g100 font-body text-[15px] text-g800 outline-none focus:border-gold transition-colors"
            placeholder="e.g. Ama Serwaa"
          />
        </div>

        <div>
          <label htmlFor="password" className="block font-condensed font-semibold text-xs uppercase tracking-wide text-g800 mb-2">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-g100 font-body text-[15px] text-g800 outline-none focus:border-gold transition-colors"
            placeholder="At least 8 characters"
            autoComplete="new-password"
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block font-condensed font-semibold text-xs uppercase tracking-wide text-g800 mb-2">
            Confirm password
          </label>
          <input
            id="confirmPassword"
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-g100 font-body text-[15px] text-g800 outline-none focus:border-gold transition-colors"
            autoComplete="new-password"
          />
        </div>

        {formError && <p className="font-body text-sm text-red-500">{formError}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gold text-navy font-condensed font-bold text-sm py-3 rounded-lg hover:bg-gold-light transition-colors disabled:opacity-60"
        >
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </AuthShell>
  );
}
