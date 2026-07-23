// Central place for the UPSA email rule so it can never drift between
// the signup form, login form, and any other place that needs it.
// Mirrors the Postgres check in supabase/schema.sql (is_valid_upsa_email).

export const UPSA_DOMAIN = 'upsamail.edu.gh';

export const STUDENT_ID_REGEX = /^[0-9]{8}$/;

export function isValidStudentId(id: string): boolean {
  return STUDENT_ID_REGEX.test(id.trim());
}

export function studentIdToEmail(id: string): string {
  return `${id.trim()}@${UPSA_DOMAIN}`;
}

export function studentIdError(id: string): string | null {
  const trimmed = id.trim();
  if (!trimmed) return 'Enter your 8-digit UPSA student ID.';
  if (!/^[0-9]+$/.test(trimmed)) return 'Student ID must contain digits only.';
  if (trimmed.length !== 8) return 'Student ID must be exactly 8 digits.';
  return null;
}
