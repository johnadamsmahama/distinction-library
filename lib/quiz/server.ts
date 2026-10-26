// SERVER-ONLY helpers for the quiz feature.
import { randomBytes } from 'crypto';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile, isAdminRole } from '@/lib/auth-helpers';

export type StoredTheory = { id: string; text: string; modelAnswer: string };

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
export function validateQuestions(input: unknown, allowEmpty = false): { questions: StoredQuestion[] } | { error: string } {
  if (!Array.isArray(input) || input.length === 0) return allowEmpty ? { questions: [] } : { error: 'Add at least one question.' };
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

// Validates theory questions from the admin editor.
export function validateTheory(input: unknown): { theory: StoredTheory[] } | { error: string } {
  if (input === undefined || input === null) return { theory: [] };
  if (!Array.isArray(input)) return { error: 'Theory questions are not valid.' };
  if (input.length > 50) return { error: 'A quiz can have at most 50 theory questions.' };
  const out: StoredTheory[] = [];
  for (let i = 0; i < input.length; i++) {
    const t = input[i] as Record<string, unknown>;
    const text = typeof t?.text === 'string' ? t.text.trim() : '';
    const modelAnswer = typeof t?.modelAnswer === 'string' ? t.modelAnswer.trim() : '';
    if (!text || text.length > 1500) return { error: `Theory question ${i + 1} needs text (up to 1500 characters).` };
    if (!modelAnswer || modelAnswer.length > 3000) return { error: `Theory question ${i + 1} needs a model answer (up to 3000 characters).` };
    out.push({ id: `t${i + 1}`, text, modelAnswer });
  }
  return { theory: out };
}
