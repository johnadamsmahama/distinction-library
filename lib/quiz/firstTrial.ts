import type { createAdminClient } from '@/lib/supabase/admin';

// First-trial "time pressure" slips.
// On the quizzes listed in the FIRST_TRIAL_SLIP_SLUGS environment variable (comma-separated slugs),
// a student's FIRST finished attempt is shown with 1 to 3 answers marked wrong, so nobody gets a perfect
// score on the first go. The saved score and answers in the database stay the real ones; only what the
// student sees is changed. The pick is seeded by the attempt id, so reopening the result link shows the
// same thing, and it differs from student to student.

type Db = ReturnType<typeof createAdminClient>;

type ReviewRow = {
  id: string;
  text: string;
  options: string[];
  chosen: number | null;
  answer: number;
  correct: boolean;
  explanation: string | null;
};

export function slipEnabled(slug: string): boolean {
  const list = (process.env.FIRST_TRIAL_SLIP_SLUGS ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(slug.toLowerCase());
}

// True when this person has no earlier finished attempt on this quiz (same name).
// Pass `before` (the attempt's own submitted_at) when re-opening an already saved result.
export async function isFirstTrial(db: Db, quizId: string, name: string, attemptId: string, before?: string | null) {
  let q = db
    .from('quiz_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('quiz_id', quizId)
    .eq('participant_name', name)
    .neq('id', attemptId)
    .not('submitted_at', 'is', null);
  if (before) q = q.lt('submitted_at', before);
  const { count } = await q;
  return (count ?? 0) === 0;
}

function seeded(seed: string) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function applyFirstTrialSlip<T extends ReviewRow>(review: T[], seed: string) {
  const rand = seeded(seed);
  const target = Math.min(1 + Math.floor(rand() * 3), review.length); // 1, 2 or 3 wrong
  const already = review.filter((r) => !r.correct).length;
  const need = target - already;
  const score = review.length - already;
  if (need <= 0) return { review, score, slipped: false };

  // Different questions for different students: shuffle the correct ones with the seeded generator.
  const candidates = review.map((r, i) => (r.correct && r.options.length > 1 ? i : -1)).filter((i) => i >= 0);
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  const pick = new Set(candidates.slice(0, need));
  if (pick.size === 0) return { review, score, slipped: false };

  const out = review.map((r, i) => {
    if (!pick.has(i)) return r;
    const others = r.options.map((_, oi) => oi).filter((oi) => oi !== r.answer);
    const chosen = others[Math.floor(rand() * others.length)];
    return { ...r, chosen, correct: false };
  });
  return { review: out, score: out.filter((r) => r.correct).length, slipped: true };
}
