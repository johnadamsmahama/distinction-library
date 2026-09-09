'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { isDeviceTrusted } from '@/lib/device-trust';

// Feature 01 requirement: "Secure session management with automatic logout
// after prolonged inactivity." Mount this once in the layout that wraps all
// authenticated pages (dashboard, vault, admin, moderate).
//
// The requirement stays intact for every device — what changes is *how
// lenient* the idle window is, and *how much warning* the student gets
// before it fires:
//   - Untrusted device: 30 minutes idle, same as before.
//   - Trusted device (opted in at login, see lib/device-trust.ts): 24
//     hours idle. Supabase's own refresh-token expiry is still the outer
//     bound either way, so this only ever relaxes the custom timer below,
//     never Supabase's actual session validity.
// In both cases, a "Still there?" warning appears 2 minutes before the
// timer would fire, so genuinely-active students are never logged out
// mid-task — only truly idle sessions end.
const IDLE_LIMIT_MS = isTrustedDeviceSafe() ? 24 * 60 * 60 * 1000 : 30 * 60 * 1000;
const WARNING_BEFORE_MS = 2 * 60 * 1000;
const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'touchstart', 'scroll'];

// isDeviceTrusted() reads localStorage, which isn't available during SSR —
// wrapped so the module-level constant above is safe to evaluate anywhere.
function isTrustedDeviceSafe(): boolean {
  try {
    return isDeviceTrusted();
  } catch {
    return false;
  }
}

export default function InactivityLogout() {
  const router = useRouter();
  const warnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(WARNING_BEFORE_MS / 1000);

  useEffect(() => {
    const supabase = createClient();

    const logout = async () => {
      await supabase.auth.signOut();
      router.push('/login?reason=inactivity');
    };

    const clearTimers = () => {
      if (warnTimerRef.current) clearTimeout(warnTimerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };

    const startCountdown = () => {
      setShowWarning(true);
      setSecondsLeft(WARNING_BEFORE_MS / 1000);
      countdownRef.current = setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) {
            if (countdownRef.current) clearInterval(countdownRef.current);
            logout();
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    };

    const resetTimer = () => {
      clearTimers();
      setShowWarning(false);
      warnTimerRef.current = setTimeout(startCountdown, IDLE_LIMIT_MS - WARNING_BEFORE_MS);
    };

    ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, resetTimer));
    resetTimer();

    return () => {
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, resetTimer));
      clearTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!showWarning) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-navy-deep/60 px-4">
      <div className="w-full max-w-sm bg-white rounded-none border border-g100 p-6 text-center">
        <h2 className="font-condensed font-bold text-lg text-navy-deep mb-2">Still there?</h2>
        <p className="font-body text-sm text-g600 mb-1">
          You&apos;ve been idle for a while — you&apos;ll be signed out in
        </p>
        <p className="font-display font-bold text-3xl text-navy mb-4">
          {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}
        </p>
        <button
          onClick={() => window.dispatchEvent(new Event('mousedown'))}
          className="w-full bg-gold text-navy font-condensed font-bold text-sm py-3 rounded-none hover:bg-gold-light transition-colors"
        >
          Stay signed in
        </button>
      </div>
    </div>
  );
}
