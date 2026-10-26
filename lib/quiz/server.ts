// SERVER-ONLY helpers for the quiz feature.
import { randomBytes } from 'crypto';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile, isAdminRole } from '@/lib/auth-helpers';

export type StoredQuestion = {
  id: string;
  text: string;
  options: string[];
  answer: number;
  explanation: string | null;
};

// Returns the signed-in admin's id, or null if the caller is not an admin.
export async function requireAdminId(): Promise<string | null> {
  const supabase = createClient();
  const { user, profile } = await getCurrentProfile(supabase);
  if (!user || !isAdminRole(profile?.role)) return null;
  return user.id;
}

// Short link code. No 0/O/1/l so it is easy to read out loud on WhatsApp.
export function makeSlug(length = 6) {
  const alphabet = 'abcdefghjkmnpqrstuvwxyz23456789';
  const bytes = randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

// Validates questions sent from the admin editor. Returns clean questions or an error message.
export function validateQuestions(input: unknown): { questions: StoredQuestion[] } | { error: string } {
  if (!Array.isArray(input) || input.length === 0) return { error: 'Add at least one question.' };
  if (input.length > 200) return { error: 'A quiz can have at most 200 questions.' };
  const out: StoredQuestion[] = [];
  for (let i = 0; i < input.length; i++) {
    const q = input[i] as Record<string, unknown>;
    const n = i + 1;
    const text = typeof q?.text === 'string' ? q.text.trim() : '';
    const options = Array.isArray(q?.options) ? (q.options as unknown[]).map((o) => (typeof o === 'string' ? o.trim() : '')) : [];
    const answer = q?.answer;
    if (!text || text.length > 1000) return { error: `Question ${n} needs text (up to 1000 characters).` };
    if (options.length < 2 || options.length > 8 || options.some((o) => !o || o.length > 500)) {
      return { error: `Question ${n} needs 2 to 8 options, none of them empty.` };
    }
    if (typeof answer !== 'number' || !Number.isInteger(answer) || answer < 0 || answer >= options.length) {
      return { error: `Question ${n} has no correct answer ticked.` };
    }
    const explanation = typeof q?.explanation === 'string' && q.explanation.trim() ? q.explanation.trim().slice(0, 1000) : null;
    out.push({ id: `q${i + 1}`, text, options, answer, explanation });
  }
  return { questions: out };
}
