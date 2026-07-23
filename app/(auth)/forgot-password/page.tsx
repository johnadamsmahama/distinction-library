'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { studentIdError, studentIdToEmail } from '@/lib/validation';
import AuthShell from '@/components/auth/AuthShell';
import StudentIdInput from '@/components/auth/StudentIdInput';

export default function ForgotPasswordPage() {
  const [studentId, setStudentId] = useState('');
  const [idErr, setIdErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const idProblem = studentIdError(studentId);
    setIdErr(idProblem);
    if (idProblem) return;

    setLoading(true);
    const supabase = createClient();
    await supabase.auth.resetPasswordForEmail(studentIdToEmail(studentId), {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    setLoading(false);
    // Always show the same success state, whether or not the ID exists —
    // this avoids leaking which student IDs are registered.
    setSent(true);
  };

  if (sent) {
    return (
      <AuthShell eyebrow="Check your email" title="Reset link sent">
        <p className="font-body text-sm text-g600 leading-relaxed">
          If that student ID has an account, we&apos;ve sent a password reset link to its UPSA
          email address.
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
      eyebrow="Trouble logging in?"
      title="Reset your password"
      subtitle="Enter your student ID and we'll email you a reset link."
      footer={
        <Link href="/login" className="text-gold hover:underline">
          Back to login
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <StudentIdInput value={studentId} onChange={setStudentId} error={idErr} />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gold text-navy font-condensed font-bold text-sm py-3 rounded-lg hover:bg-gold-light transition-colors disabled:opacity-60"
        >
          {loading ? 'Sending…' : 'Send reset link'}
        </button>
      </form>
    </AuthShell>
  );
}
