// Small localStorage helpers backing two session-friction features:
// remembering the student ID for prefill, and per-device "trust" that
// relaxes the idle-logout threshold (see InactivityLogout.tsx). Both are
// scoped to this browser/device only — trusting a device on a shared
// computer would need someone to explicitly check the box there too.

const STUDENT_ID_KEY = 'dl_remembered_student_id';
const TRUST_UNTIL_KEY = 'dl_trusted_device_until';

export function getRememberedStudentId(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(STUDENT_ID_KEY) || '';
}

export function setRememberedStudentId(id: string) {
  if (typeof window === 'undefined' || !id) return;
  localStorage.setItem(STUDENT_ID_KEY, id);
}

export function isDeviceTrusted(): boolean {
  if (typeof window === 'undefined') return false;
  const until = localStorage.getItem(TRUST_UNTIL_KEY);
  if (!until) return false;
  return Date.now() < Number(until);
}

// Marking a device trusted only ever extends the idle-logout window — it
// never skips Supabase's own session/refresh-token expiry, so a device
// left untouched long enough still eventually needs a real login.
export function setDeviceTrusted(trusted: boolean, days = 30) {
  if (typeof window === 'undefined') return;
  if (trusted) {
    localStorage.setItem(TRUST_UNTIL_KEY, String(Date.now() + days * 24 * 60 * 60 * 1000));
  } else {
    localStorage.removeItem(TRUST_UNTIL_KEY);
  }
}
