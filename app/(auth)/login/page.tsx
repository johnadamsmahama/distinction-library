'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { studentIdError, studentIdToEmail } from '@/lib/validation';
import AuthShell from '@/components/auth/AuthShell';
import StudentIdInput from '@/components/auth/StudentIdInput';

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get('next') || '/dashboard';
  const loggedOutForInactivity = searchParams.get('reason') === 'inactivity';

  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [idErr, setIdErr] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const idProblem = studentIdError(studentId);
    setIdErr(idProblem);
    if (idProblem) return;

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: studentIdToEmail(studentId),
      password,
    });
    setLoading(false);

    if (error) {
      setFormError('Incorrect student ID or password.');
      return;
    }

    router.push(nextPath);
    router.refresh();
  };

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Log in"
      subtitle="J.A. Mahama Initiative — UPSA students only."
      footer={
        <>
          New here?{' '}
          <Link href="/signup" className="text-gold hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      {loggedOutForInactivity && (
        <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 font-body text-xs text-amber-700">
          You were logged out after a period of inactivity, for your security.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <StudentIdInput value={studentId} onChange={setStudentId} error={idErr} />

        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="password" className="font-condensed font-semibold text-xs uppercase tracking-wide text-g800">
              Password
            </label>
            <Link href="/forgot-password" className="font-condensed text-xs text-gold hover:underline">
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-g100 font-body text-[15px] text-g800 outline-none focus:border-gold transition-colors"
            autoComplete="current-password"
          />
        </div>

        {formError && <p className="font-body text-sm text-red-500">{formError}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gold text-navy font-condensed font-bold text-sm py-3 rounded-lg hover:bg-gold-light transition-colors disabled:opacity-60"
        >
          {loading ? 'Logging in…' : 'Log in'}
        </button>
      </form>
    </AuthShell>
  );
}
