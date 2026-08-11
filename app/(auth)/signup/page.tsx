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
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState<string | null>(null);

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

  const handleResend = async () => {
    setResending(true);
    setResendMsg(null);
    const supabase = createClient();
    const email = studentIdToEmail(studentId);

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setResending(false);
    setResendMsg(error ? error.message : 'Email resent — check your inbox.');
  };

  if (submitted) {
    const email = studentIdToEmail(studentId);

    return (
      <AuthShell
        eyebrow="Almost there"
        title="Check your UPSA email"
        subtitle="One tap on the link we sent activates your account."
      >
        <div className="h-px bg-g100 mb-4" />

        <div className="border border-g100 bg-white flex items-center justify-between px-3.5 py-2.5 mb-4">
          <div>
            <div className="font-condensed font-bold text-[9px] uppercase tracking-wide text-gold/70 mb-0.5">
              Sent to
            </div>
            <div className="font-mono text-[12.5px] font-bold text-navy break-all">
              {email}
            </div>
          </div>
          <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0 opacity-40" fill="none">
            <path
              d="M3 6.5l9 6 9-6M3 6.5v11h18v-11"
              stroke="#0D2B5E"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div className="flex items-center gap-2">
          <span className="relative w-2 h-2">
            <span className="absolute inset-0 rounded-full border-[1.5px] border-mint-deep animate-ping" />
            <span className="absolute inset-[2px] rounded-full bg-mint-deep" />
          </span>
          <span className="font-condensed font-bold text-[11px] uppercase tracking-wide text-mint-deep">
            Awaiting confirmation
          </span>
        </div>

        <div className="mt-4 bg-gold/10 border border-gold/30 rounded-lg px-3.5 py-3">
          <p className="font-body text-xs text-g600 leading-relaxed">
            <span className="font-condensed font-bold uppercase tracking-wide text-navy">
              Nothing after a few minutes?
            </span>{' '}
            Double check your 8-digit student ID above — if it's mistyped,
            the email has nowhere to go. You can{' '}
            <button
              onClick={() => setSubmitted(false)}
              className="underline underline-offset-4 font-semibold"
            >
              go back and re-enter it
            </button>
            .
          </p>
        </div>

        <div className="border-t border-g100 mt-5 pt-4">
          <button
            onClick={handleResend}
            disabled={resending}
            className="w-full bg-navy text-white font-condensed font-semibold text-[12.5px] uppercase tracking-wide py-3 disabled:opacity-60"
          >
            {resending ? 'Resending…' : 'Resend Email'}
          </button>

          {resendMsg && (
            <p className="text-center font-body text-xs text-g600 mt-2">{resendMsg}</p>
          )}

          <button
            onClick={() => setSubmitted(false)}
            className="block w-full text-center mt-3 font-body text-xs text-g500 underline underline-offset-4"
          >
            Wrong ID? Go back and edit
          </button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Get started"
      title="Create your account"
      subtitle="Access is exclusive to verified UPSA students."
    >
      <form onSubmit={handleSubmit} className="space-y-2.5">
        <StudentIdInput value={studentId} onChange={setStudentId} error={idErr} />

        <div>
          <label htmlFor="fullName" className="block font-condensed font-semibold text-xs uppercase tracking-wide text-g800 mb-1">
            Full name
          </label>
          <input
            id="fullName"
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-g100 font-body text-[15px] text-g800 outline-none focus:border-gold transition-colors"
            placeholder="e.g. Ama Serwaa"
          />
        </div>

        <div>
          <label htmlFor="password" className="block font-condensed font-semibold text-xs uppercase tracking-wide text-g800 mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-g100 font-body text-[15px] text-g800 outline-none focus:border-gold transition-colors"
            placeholder="At least 8 characters"
            autoComplete="new-password"
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block font-condensed font-semibold text-xs uppercase tracking-wide text-g800 mb-1">
            Confirm password
          </label>
          <input
            id="confirmPassword"
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-g100 font-body text-[15px] text-g800 outline-none focus:border-gold transition-colors"
            autoComplete="new-password"
          />
        </div>

        {formError && <p className="font-body text-sm text-red-500">{formError}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gold text-navy font-condensed font-bold text-sm py-2 rounded-lg hover:bg-gold-light transition-colors disabled:opacity-60"
        >
          {loading ? 'Creating account…' : 'Create account'}
        </button>

        <div className="text-center bg-gold/10 border border-gold/30 rounded-lg py-2 px-4">
          <span className="font-body text-sm text-g800">
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-condensed font-bold text-navy underline underline-offset-4 decoration-gold"
            >
              Log in
            </Link>
          </span>
        </div>
      </form>
    </AuthShell>
  );
}
